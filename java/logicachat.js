(function() {
  const toggle = document.getElementById("chatToggle");
  const panel = document.getElementById("chatPanel");
  const close = document.getElementById("chatClose");

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
})();
