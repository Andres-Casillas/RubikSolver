import { KEYS, getEmptyMatrix, clearAll } from './rubik-storage.js';

const iframe = document.getElementById('iframe3d');

function applyMatrixTo3D(matrix) {
  if (!iframe || !iframe.contentWindow) return;
  const win = iframe.contentWindow;
  const tryApply = () => {
    try {
      if (win.CubeDebug) {
        if (!matrix && typeof win.CubeDebug.setAllGray === 'function') {
          win.CubeDebug.setAllGray(); return true;
        }
        if (matrix && typeof win.CubeDebug.aplicarColoresDeMatriz === 'function') {
          win.CubeDebug.aplicarColoresDeMatriz(matrix); return true;
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
window.applyMatrixTo3D = applyMatrixTo3D;

function onIframeReady() {
  applyMatrixTo3D(getEmptyMatrix());

  // controles (idénticos a tu versión actual)...
  // ... omitido por brevedad ...
}

// Botones externos
document.getElementById('cargarManual3D')?.addEventListener('click', () => {
  const raw = localStorage.getItem(KEYS.manualMatrix);
  if (!raw) return alert('No hay datos manuales guardados. Ve a "Agregar manualmente".');
  try { applyMatrixTo3D(JSON.parse(raw)); } catch { alert('Error al cargar la matriz manual guardada.'); }
});

document.getElementById('limpiarColores')?.addEventListener('click', () => {
  clearAll({ apply3D: true });
  // Si quieres avisar visualmente:
  // alert('Colores limpiados. Todo quedó en gris.');
});

// Sincronización por storage (Manual o Cámara)
window.addEventListener('storage', (e) => {
  if (e.key === KEYS.manualMatrix || e.key === KEYS.cameraMatrix) {
    if (e.newValue) {
      try { applyMatrixTo3D(JSON.parse(e.newValue)); } catch {}
    }
  }
});

// CustomEvent directo
window.addEventListener('rubik:matrix3d', (e) => {
  if (e?.detail) applyMatrixTo3D(e.detail);
});

iframe?.addEventListener('load', onIframeReady);