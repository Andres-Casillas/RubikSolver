// Cárgalo DESPUÉS de script.js. No toca variables internas de script.js.
// Actúa solo por DOM y storage para no romper nada.

const KEYS = {
  manualMatrix: 'rubik.manualMatrix3D',
  cameraMatrix: 'rubik.cameraMatrix3D',
  resetEpoch:   'rubik.resetEpoch'
};

// Construye una matriz [6][3][3] en 'N'
function emptyMatrix() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill('N'))
  );
}

// Intenta forzar el cubo 3D a gris
function set3DGray() {
  try {
    if (window.CubeDebug && typeof window.CubeDebug.setAllGray === 'function') {
      window.CubeDebug.setAllGray();
      return;
    }
    if (typeof window.applyMatrixTo3D === 'function') {
      window.applyMatrixTo3D(emptyMatrix());
      return;
    }
  } catch (e) {}
  // Fallback: publica por storage y CustomEvent
  localStorage.setItem(KEYS.manualMatrix, JSON.stringify(emptyMatrix()));
  window.dispatchEvent(new CustomEvent('rubik:matrix3d', { detail: emptyMatrix() }));
}

// Mapa de texto de la UI -> índice de cara que usa script.js
const LABEL_TO_INDEX = {
  'Cara Frontal':   0,
  'Cara Derecha':   1,
  'Cara Posterior': 2,
  'Cara Izquierda': 3,
  'Cara Superior':  4,
  'Cara Inferior':  5,
};

function currentFaceIndexFromLabel() {
  const el = document.getElementById('cara');
  const txt = (el?.innerText || '').trim();
  return LABEL_TO_INDEX[txt] ?? 0;
}

// Bandera por cara: ¿ya fue guardada explícitamente?
const savedFlags = Array(6).fill(false);

// UI helpers
function ensureResetButton() {
  let btn = document.getElementById('reiniciarCaptura');
  if (btn) return btn;

  btn = document.createElement('button');
  btn.id = 'reiniciarCaptura';
  btn.type = 'button';
  btn.textContent = 'Reiniciar captura';
  btn.style.marginLeft = '8px';

  const cont =
    document.querySelector('.botones') ||
    document.getElementById('guardarCara')?.parentElement ||
    document.body;

  cont.appendChild(btn);
  return btn;
}

function hardReset({ reload = true } = {}) {
  try {
    localStorage.removeItem(KEYS.manualMatrix);
    localStorage.removeItem(KEYS.cameraMatrix);
    localStorage.setItem(KEYS.resetEpoch, String(Date.now()));
    sessionStorage.removeItem(KEYS.manualMatrix);
    sessionStorage.removeItem(KEYS.cameraMatrix);
  } catch (e) {}

  for (let i = 0; i < savedFlags.length; i++) savedFlags[i] = false;

  set3DGray();

  if (reload) location.reload();
}

function showHint() {
  const btnSig = document.getElementById('siguiente');
  if (btnSig) {
    btnSig.style.animation = 'rubikFlash 0.6s';
    setTimeout(() => (btnSig.style.animation = ''), 700);
  }
  const toast = document.getElementById('toastGuard');
  if (toast) {
    toast.textContent = 'Primero pulsa "Guardar cara" antes de continuar.';
    toast.style.opacity = '1';
    setTimeout(() => (toast.style.opacity = '0'), 1500);
  } else {
    console.warn('Bloqueado: presiona "Guardar cara" antes de "Siguiente".');
  }
}

// Enforce: “Siguiente” solo si se pulsó “Guardar cara” en la cara actual.
// IMPORTANTE: escuchamos en el DOCUMENTO en fase CAPTURA para bloquear ANTES de llegar al target.
function wireGuards() {
  const btnGuardar = document.getElementById('guardarCara');
  const btnSig = document.getElementById('siguiente');
  if (!btnGuardar || !btnSig) return;

  // Marca guardada la cara actual cuando el usuario pulsa "Guardar cara"
  btnGuardar.addEventListener('click', () => {
    const idx = currentFaceIndexFromLabel();
    savedFlags[idx] = true;

    const allSaved = savedFlags.every(Boolean);
    const btnGuardarFinal = document.getElementById('guardar');
    if (btnGuardarFinal && allSaved) {
      btnGuardarFinal.classList.remove('deshabilitado');
    }
  });

  // Captura a nivel documento
  document.addEventListener('click', (ev) => {
    const btnSigNow = document.getElementById('siguiente');
    if (!btnSigNow) return;

    // ¿El clic fue en el botón 'siguiente' (o un hijo dentro)?
    const target = ev.target;
    const isNext =
      target === btnSigNow ||
      (target instanceof Element && btnSigNow.contains(target));

    if (!isNext) return;

    const idx = currentFaceIndexFromLabel();
    if (!savedFlags[idx]) {
      ev.stopPropagation();   // bloquea que el evento llegue al target
      ev.preventDefault();    // por si hay default
      showHint();
      return;
    }

    // Permitido: resetea el flag de la siguiente cara
    const next = (idx + 1) % 6;
    savedFlags[next] = false;
  }, true); // capture: true en el documento (clave)
}

// Estilos sutiles (flash en botón)
(function injectStyle() {
  const css = `
@keyframes rubikFlash { 0%{filter:brightness(1)} 50%{filter:brightness(1.8)} 100%{filter:brightness(1)} }
#toastGuard {
  position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,.75); color: #fff; padding: 8px 12px; border-radius: 6px;
  pointer-events: none; opacity: 0; transition: opacity .2s;
  font-size: 13px; z-index: 9999;
}`;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);

  const toast = document.createElement('div');
  toast.id = 'toastGuard';
  document.body.appendChild(toast);
})();

// Botón “Reiniciar captura”
(function init() {
  // Si quieres que SIEMPRE inicie limpio al abrir resolver, descomenta:
  // hardReset({ reload: false }); set3DGray();

  const btn = ensureResetButton();
  btn.addEventListener('click', () => hardReset({ reload: true }));

  const btnLimpiar = document.getElementById('limpiarColores');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      hardReset({ reload: false });
      set3DGray();
    });
  }

  wireGuards();
})();