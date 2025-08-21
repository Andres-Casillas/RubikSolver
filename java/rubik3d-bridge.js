// Claves de almacenamiento para sincronizar (manual/cámara)
const STORAGE_KEYS = {
  manual: 'rubik.manualMatrix3D',
  camera: 'rubik.cameraMatrix3D'
};

const iframe = document.getElementById('iframe3d');

// Aplica matriz [U,F,D,B,L,R] en el 3D (si no está listo, reintenta por unos segundos)
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
// Exponer para uso opcional desde otros módulos
window.applyMatrixTo3D = applyMatrixTo3D;

function greyMatrix() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill('N'))
  );
}
function clearSavedMatrix() {
  localStorage.removeItem(STORAGE_KEYS.manual);
  localStorage.removeItem(STORAGE_KEYS.camera);
  sessionStorage.removeItem(STORAGE_KEYS.manual);
  sessionStorage.removeItem(STORAGE_KEYS.camera);
  applyMatrixTo3D(greyMatrix());
}

function onIframeReady() {
  // Inicializa el 3D en gris
  applyMatrixTo3D(greyMatrix());

  // Mapea controles externos a la API pública del 3D
  const prev = document.getElementById('btn3dPrev');
  const next = document.getElementById('btn3dNext');
  const reset = document.getElementById('btn3dReset');
  const pause = document.getElementById('btn3dPause');
  const load  = document.getElementById('btn3dLoad');
  const speedInput = document.getElementById('speed3d');
  const speedValue = document.getElementById('speed3dValue');

  const api = () => iframe.contentWindow?.RubikCube;

  const setSpeed = (v) => { api()?.setAnimationSpeed?.(v); if (speedValue) speedValue.textContent = `${v}ms`; };
  if (speedInput) {
    setSpeed(parseInt(speedInput.value || '300', 10));
    speedInput.addEventListener('input', (e) => setSpeed(parseInt(e.target.value, 10)));
  }

  next?.addEventListener('click', () => api()?.nextMove?.());
  prev?.addEventListener('click', () => api()?.previousMove?.());
  reset?.addEventListener('click', () => api()?.resetCube?.());
  pause?.addEventListener('click', () => api()?.togglePause?.());
  load?.addEventListener('click', () => {
    const sequences = [
      ["R", "U'", "F", "L2", "D"],
      ["R", "U", "R'", "F", "R", "F'"],
      ["F", "R", "U'", "R'", "U'", "R", "U", "R'", "F'"],
      ["R", "U", "R'", "U", "R", "U2", "R'"]
    ];
    api()?.loadSequence?.(sequences[Math.floor(Math.random() * sequences.length)]);
  });

  // Deshabilita/rehabilita mientras anima
  setInterval(() => {
    const a = api();
    if (!a) return;
    const anim = a.isAnimating?.() || false;
    const canPrev = !anim && (a.getCurrentStep?.() > 0);
    const canNext = !anim && (a.getCurrentStep?.() < (a.getTotalSteps?.() || 0));
    if (prev) prev.disabled = !canPrev;
    if (next) next.disabled = !canNext;
    if (pause) pause.disabled = !anim;
  }, 100);
}

// Eventos de UI “manual”
document.getElementById('cargarManual3D')?.addEventListener('click', () => {
  const raw = localStorage.getItem(STORAGE_KEYS.manual);
  if (!raw) return alert('No hay datos manuales guardados. Ve a "Agregar manualmente".');
  try { applyMatrixTo3D(JSON.parse(raw)); }
  catch { alert('Error al cargar la matriz manual guardada.'); }
});
document.getElementById('limpiarColores')?.addEventListener('click', () => clearSavedMatrix());

// Sincronización por storage (Manual.html o script opcional de cámara)
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.manual || e.key === STORAGE_KEYS.camera) {
    if (e.newValue) {
      try { applyMatrixTo3D(JSON.parse(e.newValue)); } catch {}
    }
  }
});

// Sin tocar script.js: si más adelante se agregan CustomEvents desde script.js, también los escuchamos
window.addEventListener('rubik:matrix3d', (e) => {
  if (e?.detail) applyMatrixTo3D(e.detail);
});

// Cuando el iframe esté cargado, configura todo
iframe?.addEventListener('load', onIframeReady);