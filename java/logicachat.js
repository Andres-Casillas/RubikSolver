const CHAT_STORAGE_KEY = "rubik-chatbot-state";
const MESSAGE_VERSION = 2;
const DEFAULT_STATE = { open: false, messages: [], version: MESSAGE_VERSION };
const MAX_MESSAGES = 50;
const WELCOME_MESSAGE = "Hola! En que puedo ayudarte hoy?";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeStoredMessages(messages, version) {
  if (!Array.isArray(messages)) return [];
  if (version === MESSAGE_VERSION) return messages;

  return messages.map((item) => {
    if (typeof item === "string") {
      return {
        id: createId(),
        role: "bot",
        intent: null,
        payload: { text: item },
        timestamp: Date.now(),
      };
    }
    if (item && typeof item === "object") {
      const payload = item.payload && typeof item.payload === "object" ? item.payload : { text: item.text || "" };
      return {
        id: item.id || createId(),
        role: item.role === "user" ? "user" : "bot",
        intent: item.intent || null,
        payload,
        timestamp: item.timestamp || Date.now(),
      };
    }
    return null;
  }).filter(Boolean);
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const version = Number.isInteger(parsed.version) ? parsed.version : 1;
    const messages = normalizeStoredMessages(parsed.messages, version);
    return {
      open: Boolean(parsed.open),
      messages,
      version: MESSAGE_VERSION,
    };
  } catch (error) {
    console.warn("No se pudo leer el estado del chat", error);
    return { ...DEFAULT_STATE };
  }
}

function normalizeBotPayload(raw) {
  if (!raw) {
    return { intent: null, payload: { text: "" } };
  }
  if (typeof raw === "string") {
    return { intent: null, payload: { text: raw } };
  }

  const payload = {};
  let intent = null;

  if (typeof raw.intent === "string" && raw.intent.trim()) {
    intent = raw.intent.trim();
  }
  if (typeof raw.text === "string" && raw.text.trim()) {
    payload.text = raw.text.trim();
  }
  if (typeof raw.html === "string" && raw.html.trim()) {
    payload.html = raw.html;
  }
  if (Array.isArray(raw.steps) && raw.steps.length > 0) {
    payload.steps = raw.steps.map((step) => `${step}`.trim()).filter(Boolean);
  }
  if (Array.isArray(raw.choices) && raw.choices.length > 0) {
    payload.choices = raw.choices
      .map((choice) => {
        if (!choice || typeof choice !== "object") return null;
        const label = typeof choice.label === "string" ? choice.label.trim() : "";
        if (!label) return null;
        const value =
          typeof choice.value === "string" && choice.value.trim() ? choice.value.trim() : label;
        const entry = { label, value };
        if (typeof choice.query === "string" && choice.query.trim()) {
          entry.query = choice.query.trim();
        }
        if (typeof choice.intent === "string" && choice.intent.trim()) {
          entry.intent = choice.intent.trim();
        }
        return entry;
      })
      .filter(Boolean);
  }
  if (Array.isArray(raw.media) && raw.media.length > 0) {
    payload.media = raw.media
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const type = typeof item.type === "string" ? item.type.toLowerCase() : null;
        const url = typeof item.url === "string" ? item.url : null;
        if (!type || !url) return null;
        const media = { type, url };
        if (typeof item.alt === "string" && item.alt.trim()) {
          media.alt = item.alt.trim();
        }
        if (typeof item.caption === "string" && item.caption.trim()) {
          media.caption = item.caption.trim();
        }
        return media;
      })
      .filter(Boolean);
  }
  if (Array.isArray(raw.suggestions) && raw.suggestions.length > 0) {
    payload.suggestions = raw.suggestions
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (raw.link && typeof raw.link === "object") {
    const label = typeof raw.link.label === "string" ? raw.link.label.trim() : "";
    const url = typeof raw.link.url === "string" ? raw.link.url.trim() : "";
    if (label && url) {
      payload.link = { label, url };
    }
  }

  return { intent, payload };
}

function normalizeUserPayload(raw) {
  if (raw && typeof raw === "object") {
    const text = typeof raw.text === "string" ? raw.text.trim() : "";
    const intent =
      typeof raw.intent === "string" && raw.intent.trim() ? raw.intent.trim() : null;
    const payload = { text };
    return { intent, payload };
  }
  const messageText = typeof raw === "string" ? raw.trim() : "";
  return {
    intent: null,
    payload: { text: messageText },
  };
}

(function () {
  const toggle = document.getElementById("chatToggle");
  const panel = document.getElementById("chatPanel");
  const close = document.getElementById("chatClose");
  const reset = document.getElementById("chatReset");
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  const messagesContainer = document.querySelector(".chat-messages");
  let endpoint = "http://127.0.0.1:5000/chat";

  if (!toggle || !panel || !close || !reset || !input || !send || !messagesContainer) {
    console.warn("Elementos del chat no encontrados en el DOM");
    return;
  }

  if (window.RUBIK_CHAT_ENDPOINT) {
    endpoint = window.RUBIK_CHAT_ENDPOINT;
  } else if (panel.dataset.endpoint) {
    endpoint = panel.dataset.endpoint;
  }

  let state = loadState();

  function saveState() {
    try {
      const payload = {
        open: state.open,
        version: MESSAGE_VERSION,
        messages: state.messages,
      };
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("No se pudo guardar el estado del chat", error);
    }
  }

  function setPanelOpen(open, { persist = true } = {}) {
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.classList.toggle("chat-toggle--hidden", open);
    state.open = open;
    if (open) {
      setTimeout(() => input.focus({ preventScroll: true }), 120);
    }
    if (persist) {
      saveState();
    }
  }

  function createTextNode(text) {
    const element = document.createElement("p");
    element.className = "chat-bubble__text";
    element.textContent = text;
    return element;
  }

  function createHtmlNode(html) {
    const element = document.createElement("div");
    element.className = "chat-bubble__html";
    element.innerHTML = html;
    return element;
  }

  function createStepsNode(steps) {
    const list = document.createElement("ol");
    list.className = "chat-bubble__steps";
    steps.forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      list.appendChild(item);
    });
    return list;
  }

  function createLinkNode(link) {
    const anchor = document.createElement("a");
    anchor.className = "chat-bubble__link";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.label;
    return anchor;
  }

  function createMediaNode(mediaItems) {
    const fragment = document.createElement("div");
    fragment.className = "chat-bubble__media";
    mediaItems.forEach((item) => {
      const wrapper = document.createElement("figure");
      wrapper.className = "chat-media";
      if (item.type === "video") {
        const video = document.createElement("video");
        video.src = item.url;
        video.controls = true;
        video.className = "chat-media__video";
        wrapper.appendChild(video);
      } else {
        const image = document.createElement("img");
        image.src = item.url;
        image.alt = item.alt || "Contenido multimedia";
        image.loading = "lazy";
        image.className = "chat-media__image";
        wrapper.appendChild(image);
      }
      if (item.caption) {
        const caption = document.createElement("figcaption");
        caption.textContent = item.caption;
        wrapper.appendChild(caption);
      }
      fragment.appendChild(wrapper);
    });
    return fragment;
  }

  function createChoicesNode(items, variant = "choice") {
    if (!items || items.length === 0) return null;
    const container = document.createElement("div");
    container.className = `chat-bubble__${variant}s`;

    items.forEach((item) => {
      const isObject = item && typeof item === "object";
      const label = isObject ? (item.label || item.value || "").trim() : `${item}`.trim();
      if (!label) return;
      const value = isObject && item.value && item.value.trim() ? item.value.trim() : label;
      const query = isObject && item.query && item.query.trim() ? item.query.trim() : value;
      const intent = isObject && item.intent && item.intent.trim() ? item.intent.trim() : null;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-choice";
      button.textContent = label;
      button.addEventListener("click", () => {
        container.querySelectorAll("button").forEach((btn) => {
          btn.disabled = true;
        });
        addMessage("user", { text: value, intent });
        processInput(query, { intent });
      });
      container.appendChild(button);
    });

    return container;
  }

  function renderMessage(message) {
    const wrapper = document.createElement("div");
    wrapper.className = `chat-message chat-message--${message.role}`;
    if (message.intent) {
      wrapper.dataset.intent = message.intent;
    }

    const bubble = document.createElement("div");
    bubble.className = "chat-message__bubble";

    const payload = message.payload || {};
    const hasRichContent = Boolean(
      payload.html || payload.steps || payload.media || payload.choices || payload.suggestions || payload.link
    );
    if (hasRichContent) {
      bubble.classList.add("chat-message__bubble--rich");
    }

    if (payload.text) {
      bubble.appendChild(createTextNode(payload.text));
    }
    if (payload.html) {
      bubble.appendChild(createHtmlNode(payload.html));
    }
    if (payload.steps && payload.steps.length > 0) {
      bubble.appendChild(createStepsNode(payload.steps));
    }
    if (payload.media && payload.media.length > 0) {
      bubble.appendChild(createMediaNode(payload.media));
    }
    if (payload.link) {
      bubble.appendChild(createLinkNode(payload.link));
    }
    if (payload.choices && payload.choices.length > 0) {
      const choicesNode = createChoicesNode(payload.choices, "choice");
      if (choicesNode) {
        bubble.appendChild(choicesNode);
      }
    }
    if (payload.suggestions && payload.suggestions.length > 0) {
      const suggestionsNode = createChoicesNode(
        payload.suggestions.map((text) => ({ label: text, value: text })),
        "suggestion"
      );
      if (suggestionsNode) {
        bubble.appendChild(suggestionsNode);
      }
    }

    if (!bubble.childNodes.length) {
      bubble.appendChild(createTextNode("Mensaje vacío"));
    }

    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);
  }

  function renderMessages() {
    messagesContainer.innerHTML = "";
    state.messages.forEach((message) => renderMessage(message));
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addMessage(role, rawPayload, { persist = true } = {}) {
    const normalizer = role === "bot" ? normalizeBotPayload : normalizeUserPayload;
    const { intent, payload } = normalizer(rawPayload);
    if (!payload || !payload.text) {
      if (role === "user") {
        return;
      }
    }
    const message = {
      id: createId(),
      role,
      intent: intent || null,
      payload,
      timestamp: Date.now(),
    };

    state.messages.push(message);
    if (state.messages.length > MAX_MESSAGES) {
      state.messages = state.messages.slice(-MAX_MESSAGES);
      renderMessages();
    } else {
      renderMessage(message);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    if (persist) {
      saveState();
    }
    return message;
  }

  function resetConversation() {
    state.messages = [];
    renderMessages();
    saveState();
    if (panel.classList.contains("open")) {
      addMessage("bot", WELCOME_MESSAGE);
    }
  }

  async function processInput(value, options = {}) {
    try {
      const requestUrl = new URL(endpoint, window.location.origin);
      const body = { message: value };
      if (options && typeof options.intent === "string" && options.intent.trim()) {
        body.intent = options.intent.trim();
      }
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        const errorMessage =
          (data.error && (data.error.message || data.error.detail)) ||
          "Lo siento, no pude procesar tu mensaje.";
        addMessage("bot", errorMessage);
        return;
      }
      const botPayload = data.message || "No entendi, intenta otra vez.";
      const message = addMessage("bot", botPayload);
      if (message && data.classification && typeof data.classification === "object") {
        message.classification = data.classification;
        saveState();
      }
    } catch (error) {
      console.error(error);
      addMessage(
        "bot",
        "Oops... No fue posible conectar con el asistente. Intenta de nuevo en unos segundos."
      );
    }
  }


  function handleSend() {
    const value = input.value.trim();
    if (!value) return;
    addMessage("user", value);
    input.value = "";
    processInput(value);
  }

  toggle.addEventListener("click", () => {
    const willOpen = !panel.classList.contains("open");
    setPanelOpen(willOpen);
    if (willOpen && state.messages.length === 0) {
      addMessage("bot", WELCOME_MESSAGE);
    }
  });

  close.addEventListener("click", () => setPanelOpen(false));

  reset.addEventListener("click", () => {
    resetConversation();
    input.focus({ preventScroll: true });
  });

  send.addEventListener("click", handleSend);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === CHAT_STORAGE_KEY && event.newValue) {
      try {
        const nextState = JSON.parse(event.newValue);
        state = {
          open: Boolean(nextState.open),
          version: MESSAGE_VERSION,
          messages: normalizeStoredMessages(nextState.messages, nextState.version),
        };
        renderMessages();
        setPanelOpen(state.open, { persist: false });
      } catch (error) {
        console.warn("No se pudo sincronizar el estado del chat", error);
      }
    }
  });

  renderMessages();
  setPanelOpen(state.open, { persist: false });
  if (state.messages.length === 0 && state.open) {
    addMessage("bot", WELCOME_MESSAGE, { persist: false });
  }
})();
