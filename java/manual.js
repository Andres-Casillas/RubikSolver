import { rotarMatriz } from './utils.js';
import { conexionPython } from './utils.js';

// Claves
const STORAGE_KEYS = {
  working: 'rubik.manualWorking',       // progreso por pestaña
  matrix3D: 'rubik.manualMatrix3D',     // matriz compartida entre pestañas
};

let colorSeleccionado = null;
let caraActual = 0;

// Matriz interna (6 caras x 3x3) inicializada en 'N'
let matriz = Array.from({ length: 6 }, () =>
  Array.from({ length: 3 }, () => Array(3).fill('N'))
);

// Construye matriz para 3D en orden [U,F,D,B,L,R]
function buildMatrixFor3D(m) {
  // m[0]=F, 1=R, 2=B, 3=L, 4=U, 5=D
  const cubo = [];
  cubo[0] = rotarMatriz(m[4], 'horario');      // U
  cubo[1] = m[0];                               // F
  cubo[2] = rotarMatriz(m[5], 'antihorario');   // D
  cubo[3] = rotarMatriz(m[2], 'espejo');        // B
  cubo[4] = m[3];                               // L
  cubo[5] = m[1];                               // R
  return cubo;
}

// Persistir progreso (por pestaña)
function persistWorkingState() {
  const payload = { matriz, caraActual, lastUpdatedAt: new Date().toISOString() };
  sessionStorage.setItem(STORAGE_KEYS.working, JSON.stringify(payload));
}

// Persistir matriz para 3D (compartida entre pestañas)
function persistMatrix3D() {
  const matrix3D = buildMatrixFor3D(matriz);
  localStorage.setItem(STORAGE_KEYS.matrix3D, JSON.stringify(matrix3D));
  window.dispatchEvent(new CustomEvent('rubik:matrix3d', { detail: matrix3D }));
}

function restoreWorkingState() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.working);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data.matriz) && typeof data.caraActual === 'number') {
      matriz = data.matriz;
      caraActual = data.caraActual;
      cargarCara(caraActual);
    }
  } catch (e) {
    console.warn('No se pudo restaurar el progreso manual:', e);
  }
}

document.querySelectorAll('.color').forEach(div => {
  div.addEventListener('click', () => {
    colorSeleccionado = div.dataset.color;
    div.classList.add('seleccion');
    document.querySelectorAll('.color').forEach(d => { if (d !== div) d.classList.remove('seleccion'); });
  });
});

function reiniciarCubo() {
  const casillas = document.querySelectorAll('.casilla');
  casillas.forEach(c => {
    c.classList.remove('W', 'R', 'G', 'B', 'O', 'Y');
    c.dataset.color = 'N';
  });

  matriz = Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill('N'))
  );
  caraActual = 0;

  sessionStorage.removeItem(STORAGE_KEYS.working);
  // Importante: la matriz compartida vive en localStorage
  localStorage.removeItem(STORAGE_KEYS.matrix3D);

  actualizarCara();
  persistMatrix3D(); // Forzar actualización del 3D
}

document.querySelectorAll('.casilla').forEach(casilla => {
  casilla.addEventListener('click', () => {
    if (!colorSeleccionado) return;
    casilla.classList.remove('W', 'R', 'G', 'B', 'O', 'Y', 'N');
    casilla.classList.add(colorSeleccionado);
    casilla.dataset.color = colorSeleccionado;
  });
});

// Guarda la cara visible en matriz[caraActual] y persiste
function guardarCara() {
  const casillas = document.querySelectorAll('.casilla');
  const cara = [];
  for (let i = 0; i < 3; i++) {
    const fila = [];
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      fila.push(casillas[idx].dataset.color || 'N');
    }
    cara.push(fila);
  }
  matriz[caraActual] = cara;

  // Persistir progreso (pestaña) y matriz compartida (todas las pestañas)
  persistWorkingState();
  persistMatrix3D();

  // Si ya no hay 'N', habilitar Guardar (flujo existente)
  const incompletas = matriz.some(bloque => bloque.some(fila => fila.includes('N')));
  const btnGuardar = document.getElementById('guardar');
  if (!incompletas) {
    btnGuardar.classList.remove('deshabilitado');
    btnGuardar.disabled = false;
  } else {
    btnGuardar.classList.add('deshabilitado');
    btnGuardar.disabled = true;
  }
}

const btnGuardar = document.getElementById('guardar');
btnGuardar.addEventListener('click', () => {
  if (btnGuardar.classList.contains('deshabilitado')) return;
  const cubo = [];
  cubo[0] = matriz[4];
  cubo[1] = matriz[0];
  cubo[2] = matriz[5];
  cubo[3] = matriz[2];
  cubo[4] = matriz[3];
  cubo[5] = matriz[1];

  cubo[0] = rotarMatriz(cubo[0], 'horario');
  cubo[2] = rotarMatriz(cubo[2], 'antihorario');
  cubo[3] = rotarMatriz(cubo[3], 'espejo');

  conexionPython(cubo);
});

function cargarCara(index) {
  actualizarCara();

  const casillas = document.querySelectorAll('.casilla');
  const cara = matriz[index];

  for (let k = 0; k < casillas.length; k++) {
    casillas[k].classList.remove('W', 'R', 'G', 'B', 'O', 'Y', 'N');
    casillas[k].dataset.color = 'N';
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const color = cara[i][j];
      if (color && color !== 'N') casillas[idx].classList.add(color);
      casillas[idx].dataset.color = color || 'N';
    }
  }
}

document.getElementById('reiniciar').addEventListener('click', () => {
  reiniciarCubo();
  colorSeleccionado = null;
});

document.getElementById('siguiente').addEventListener('click', () => {
  guardarCara();
  caraActual = (caraActual + 1) % 6;
  persistWorkingState();
  cargarCara(caraActual);
});

document.getElementById('anterior').addEventListener('click', () => {
  guardarCara();
  caraActual = (caraActual + 5) % 6;
  persistWorkingState();
  cargarCara(caraActual);
});

function actualizarCara() {
  const etiqueta = document.getElementById('cara');
  etiqueta.innerText = ['Cara Frontal','Cara Derecha','Cara Posterior','Cara Izquierda','Cara Superior','Cara Inferior'][caraActual];
}

document.getElementById('regresar').addEventListener('click', () => {
  window.location.href = 'menu.html';
});

// Inicializar
actualizarCara();
restoreWorkingState();