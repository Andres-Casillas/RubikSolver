// Guarda/controla la captura por cámara para evitar errores de flujo
import { KEYS, getEmptyMatrix, writeJSON, readJSON, clearAll } from './rubik-storage.js';

// Configurable: orden de caras que recorre tu UI (ajústalo si tu UI usa otro orden)
const FACE_ORDER = ['U','F','R','B','L','D']; // ejemplo común

let currentFaceIndex = 0;
let lastFrameGrid = null; // último 3x3 detectado para la cara actual (sin consolidar)
let cameraMatrix = readJSON(KEYS.cameraMatrix, getEmptyMatrix());

// Escucha el frame “válido” que emite tu script de cámara (ver patch abajo)
window.addEventListener('rubik:detected-face', (e) => {
  const { faceIndex, grid } = e.detail || {};
  if (faceIndex === currentFaceIndex && Array.isArray(grid)) {
    lastFrameGrid = grid;
  }
});

// Helper para consolidar una cara en la matriz persistida
function commitCurrentFace() {
  if (!lastFrameGrid) {
    alert('No hay captura válida para esta cara aún.');
    return false;
  }
  // Mapear cara actual al índice U,F,D,B,L,R
  const faceName = FACE_ORDER[currentFaceIndex] || 'U';
  const faceIdx = { U:0, F:1, D:2, B:3, L:4, R:5 }[faceName];
  if (typeof faceIdx !== 'number') return false;

  cameraMatrix[faceIdx] = lastFrameGrid.map(row => row.slice());
  writeJSON(KEYS.cameraMatrix, cameraMatrix);
  // Opcional: notificar al 3D en caliente
  window.dispatchEvent(new CustomEvent('rubik:matrix3d', { detail: cameraMatrix }));
  return true;
}

// Botones
const btnGuardar = document.getElementById('guardarCara');
const btnSiguiente = document.getElementById('siguiente');

// Botón de “Reiniciar captura” (lo crea si no existe)
let btnReset = document.getElementById('reiniciarCaptura');
if (!btnReset) {
  btnReset = document.createElement('button');
  btnReset.id = 'reiniciarCaptura';
  btnReset.className = 'boton secundario';
  btnReset.textContent = 'Reiniciar captura';
  const cont = document.querySelector('.botones') || document.body;
  cont.appendChild(btnReset);
}

btnReset.addEventListener('click', () => {
  cameraMatrix = getEmptyMatrix();
  currentFaceIndex = 0;
  lastFrameGrid = null;
  writeJSON(KEYS.cameraMatrix, cameraMatrix);
  window.dispatchEvent(new CustomEvent('rubik:matrix3d', { detail: cameraMatrix }));
  alert('Captura reiniciada. Comienza desde la primera cara.');
});

// Guardar cara: consolidar SOLO cuando el usuario confirma
btnGuardar?.addEventListener('click', (ev) => {
  // Si tu script ya maneja este click, puedes prevenir su handler default:
  // ev.stopImmediatePropagation();
  if (commitCurrentFace()) {
    alert('Cara guardada.');
  }
});

// Siguiente: pasar a la siguiente cara e invalidar cualquier frame previo
btnSiguiente?.addEventListener('click', (ev) => {
  // ev.stopImmediatePropagation(); // descomenta si necesitas evitar handlers previos
  currentFaceIndex = (currentFaceIndex + 1) % FACE_ORDER.length;
  lastFrameGrid = null; // importantísimo: evita que un frame residual se guarde por error
});