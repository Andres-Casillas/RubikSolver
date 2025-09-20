const CHAT_STORAGE_KEY = "rubik-chatbot-state";
const DEFAULT_STATE = { open: false, messages: [] };
const MAX_MESSAGES = 50;
const WELCOME_MESSAGE = "\u00a1Hola! \u00bfEn qu\u00e9 puedo ayudarte hoy?";

function loadState() {
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    return {
      open: Boolean(parsed.open),
      messages,
    };
  } catch (error) {
    console.warn("No se pudo leer el estado del chat", error);
    return { ...DEFAULT_STATE };
  }
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
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
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

  function renderMessage(message) {
    const wrapper = document.createElement("div");
    wrapper.className = `chat-message chat-message--${message.role}`;

    const bubble = document.createElement("div");
    bubble.className = "chat-message__bubble";
    bubble.textContent = message.text;

    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);
  }

  function renderMessages() {
    messagesContainer.innerHTML = "";
    state.messages.forEach((message) => renderMessage(message));
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function resetConversation() {
    state.messages = [];
    renderMessages();
    saveState();
    if (panel.classList.contains("open")) {
      addMessage("bot", WELCOME_MESSAGE);
    }
  }

  function addMessage(role, text, { persist = true } = {}) {
    const message = { role, text, timestamp: Date.now() };
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
  }

  async function processInput(value) {
    try {
      const requestUrl = new URL(endpoint, window.location.origin);
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      addMessage("bot", data.response || "No entendí, intenta otra vez.");
    } catch (error) {
      console.error(error);
      addMessage(
        "bot",
        "⚠️ No fue posible conectar con el asistente. Intenta de nuevo en unos segundos."
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
          messages: Array.isArray(nextState.messages) ? nextState.messages : [],
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
})();
