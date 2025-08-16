
const mount = document.getElementById('navbar');

if (!mount) {
  console.warn('[Nav] No se encontró <div id="navbar"></div> en esta página.');
} else {
  // navbar.html está un nivel arriba de este script
  const navbarURL = new URL('../navbar.html', import.meta.url);
  fetch(navbarURL, { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(html => {
      mount.innerHTML = html;
    })
    .catch(err => {
      console.error('[Nav] Error cargando navbar.html:', navbarURL.href, err);
    });
}