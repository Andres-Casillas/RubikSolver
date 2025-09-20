// Función para enviar mensaje al backend Flask
async function processInput(input) {
  try {
    const response = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    const data = await response.json();
    botMessage(data.response);
  } catch (err) {
    botMessage("⚠️ Error al conectar con el servidor");
    console.error(err);
  }
}

// Mostrar mensaje del usuario en el chat
function userMessage(text) {
  const container = document.querySelector(".chat-messages");
  const div = document.createElement("div");
  div.classList.add("chat-message", "user");
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Mostrar mensaje del bot en el chat
function botMessage(text) {
  const container = document.querySelector(".chat-messages");
  const div = document.createElement("div");
  div.classList.add("chat-message", "bot");
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Lógica principal del chat
(function() {
  const toggle = document.getElementById("chatToggle");
  const panel = document.getElementById("chatPanel");
  const close = document.getElementById("chatClose");
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");

  // Abrir y cerrar chat
  if (toggle && panel && close) {
    toggle.addEventListener("click", () => {
      panel.classList.toggle("open");
      panel.setAttribute("aria-hidden", panel.classList.contains("open") ? "false" : "true");
    });

    close.addEventListener("click", () => {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    });
  }

  // Enviar mensaje con botón
  if (send && input) {
    send.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) return;
      userMessage(text);
      input.value = "";
      processInput(text);
    });

    // Enviar con Enter
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        send.click();
      }
    });
  }
})();
