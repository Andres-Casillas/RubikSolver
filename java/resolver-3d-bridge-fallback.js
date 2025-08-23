// Fallback no intrusivo para enlazar controles 3D si el puente principal no lo hizo.
// Seguro para incluir junto a rubik3d-bridge.js: se auto-desactiva si ya hay bridge.

(() => {
  if (window.__RubikBridgeReady) return; // ya enlazado por otro script

  const iframe = document.getElementById('iframe3d');
  if (!iframe) return;

  const STORAGE_KEYS = { matrix3D: 'rubik.manualMatrix3D' };

  const greyMatrix = () =>
    Array.from({ length: 6 }, () => Array.from({ length: 3 }, () => Array(3).fill('N')));

  function applyMatrixTo3D(matrix) {
    if (!iframe || !iframe.contentWindow) return;
    const win = iframe.contentWindow;
    const tryApply = () => {
      try {
        if (win.CubeDebug) {
          if (!matrix && typeof win.CubeDebug.setAllGray === 'function') {
            win.CubeDebug.setAllGray();
            return true;
          }
          if (matrix && typeof win.CubeDebug.aplicarColoresDeMatriz === 'function') {
            win.CubeDebug.aplicarColoresDeMatriz(matrix);
            return true;
          }
        }
      } catch {}
      return false;
    };
    if (!tryApply()) {
      const interval = setInterval(() => { if (tryApply()) clearInterval(interval); }, 200);
      setTimeout(() => clearInterval(interval), 10000);
    }
  }
  // expón para script.js (cámara) y para otros flujos
  if (typeof window.applyMatrixTo3D !== 'function') {
    window.applyMatrixTo3D = applyMatrixTo3D;
  }

  function bindOnce() {
    if (window.__RubikBridgeReady) return true;

    const prev  = document.getElementById('btn3dPrev');
    const next  = document.getElementById('btn3dNext');
    const reset = document.getElementById('btn3dReset');
    const pause = document.getElementById('btn3dPause');
    const load  = document.getElementById('btn3dLoad');
    const speedInput = document.getElementById('speed3d');
    const speedValue = document.getElementById('speed3dValue');

    if (!prev || !next || !reset || !pause || !load || !speedInput || !speedValue) return false;
    if (!iframe.contentWindow) return false;

    const api = () => iframe.contentWindow?.RubikCube;
    const setSpeed = (v) => { try { api()?.setAnimationSpeed?.(v); } catch {} speedValue.textContent = `${v}ms`; };

    // Inicializa cubo en gris al cargar o al primer bind
    applyMatrixTo3D(greyMatrix());

    // Enlaces de botones
    next.addEventListener('click', () => api()?.nextMove?.());
    prev.addEventListener('click', () => api()?.previousMove?.());
    reset.addEventListener('click', () => api()?.resetCube?.());
    pause.addEventListener('click', () => api()?.togglePause?.());
    load.addEventListener('click', () => {
      const sequences = [
        ["R", "U'", "F", "L2", "D"],
        ["R", "U", "R'", "F", "R", "F'"],
        ["F", "R", "U'", "R'", "U'", "R", "U", "R'", "F'"],
        ["R", "U", "R'", "U", "R", "U2", "R'"]
      ];
      api()?.loadSequence?.(sequences[Math.floor(Math.random() | 0 % sequences.length)]);
    });

    // Velocidad
    setSpeed(parseInt(speedInput.value, 10) || 300);
    speedInput.addEventListener('input', (e) => setSpeed(parseInt(e.target.value, 10)));

    // Estado de botones
    const uiInterval = setInterval(() => {
      const a = api();
      if (!a) return;
      const anim = a.isAnimating?.() || false;
      const total = a.getTotalSteps?.() || 0;
      const curr = a.getCurrentStep?.() || 0;
      prev.disabled = anim || curr <= 1;
      next.disabled = anim || curr >= total;
      pause.disabled = !anim;
    }, 100);

    // Cargar desde Manual
    document.getElementById('cargarManual3D')?.addEventListener('click', () => {
      const raw = localStorage.getItem(STORAGE_KEYS.matrix3D);
      if (!raw) return alert('No hay datos manuales guardados. Ve a "Agregar manualmente".');
      try { applyMatrixTo3D(JSON.parse(raw)); } catch { alert('Error al cargar la matriz manual guardada.'); }
    });

    // Limpiar colores -> gris
    document.getElementById('limpiarColores')?.addEventListener('click', () => {
      try {
        localStorage.removeItem(STORAGE_KEYS.matrix3D);
        sessionStorage.removeItem(STORAGE_KEYS.matrix3D);
      } catch {}
      applyMatrixTo3D(greyMatrix());
    });

    // Escucha storage (Manual)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.matrix3D && e.newValue) {
        try { applyMatrixTo3D(JSON.parse(e.newValue)); } catch {}
      }
    });

    window.__RubikBridgeReady = true;
    return true;
  }

  // Intento en onload del iframe + reintentos
  function tryBindWithRetries() {
    let tries = 0;
    const maxTries = 50;
    const i = setInterval(() => {
      if (bindOnce()) { clearInterval(i); return; }
      if (++tries >= maxTries) clearInterval(i);
    }, 200);
  }

  // Si el iframe ya cargó, intenta de una vez; si no, espera su load
  if (iframe.complete) {
    tryBindWithRetries();
  } else {
    iframe.addEventListener('load', tryBindWithRetries, { once: true });
  }
})();