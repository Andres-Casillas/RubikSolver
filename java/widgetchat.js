(function() {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "css/chat.css";
  document.head.appendChild(css);

  const container = document.createElement("div");
  container.id = "chatContainer";
  document.body.appendChild(container);

  fetch("chat.html")
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;

      const script = document.createElement("script");
      script.src = "java/logicachat.js";
      document.body.appendChild(script);
    })
    .catch(err => console.error("Error cargando el chat:", err));
})();
