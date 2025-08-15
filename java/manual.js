manual.js

import { rotarMatriz } from './utils.js';
import { conexionPython } from './utils.js';

// Claves de sessionStorage
const STORAGE_KEYS = {
  working: 'rubik.manualWorking',
  matrix3D: 'rubik.manualMatrix3D',
};

let colorSeleccionado = null;
let caraActual = 0;

// Matriz interna del flujo manual (6 caras x 3x3), inicializada en 'N'
let matriz = Array.from({ length: 6 }, () =>
  Array.from({ length: 3 }, () => Array(3).fill('N'))
);

/**
 * Convierte la matriz interna (orden flujo manual) al orden 3D [U,F,D,B,L,R]
 */
function buildMatrixFor3D(m) {
  // m[0]=Frontal, 1=Derecha, 2=Posterior, 3=Izquierda, 4=Superior, 5=Inferior
  const cubo = [];
  // U, F, D, B, L, R
  cubo[0] = rotarMatriz(m[4], 'horario');      // U (Superior) rotada horario
  cubo[1] = m[0];                               // F (Frontal)
  cubo[2] = rotarMatriz(m[5], 'antihorario');   // D (Inferior) rotada antihorario
  cubo[3] = rotarMatriz(m[2], 'espejo');        // B (Posterior) espejo
  cubo[4] = m[3];                               // L (Izquierda)
  cubo[5] = m[1];                               // R (Derecha)
  return cubo;
}

function persistWorkingState() {
  const payload = {
    matriz,
    caraActual,
    lastUpdatedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(STORAGE_KEYS.working, JSON.stringify(payload));
}

function persistMatrix3D() {
  const matrix3D = buildMatrixFor3D(matriz);
  sessionStorage.setItem(STORAGE_KEYS.matrix3D, JSON.stringify(matrix3D));
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
    document.querySelectorAll('.color').forEach(d => {
      if (d !== div) d.classList.remove('seleccion');
    });
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
  sessionStorage.removeItem(STORAGE_KEYS.matrix3D);

  actualizarCara();
}

document.querySelectorAll('.casilla').forEach(casilla => {
  casilla.addEventListener('click', () => {
    if (!colorSeleccionado) return;
    casilla.classList.remove('W', 'R', 'G', 'B', 'O', 'Y', 'N');
    casilla.classList.add(colorSeleccionado);
    casilla.dataset.color = colorSeleccionado;
  });
});

/**
 * Guarda la cara visible en matriz[caraActual] y persiste en sessionStorage
 */
function guardarCara() {
  const casillas = document.querySelectorAll('.casilla');
  let cara = [];
  for (let i = 0; i < 3; i++) {
    let fila = [];
    for (let j = 0; j < 3; j++) {
      const index = i * 3 + j;
      const letra = casillas[index].dataset.color || 'N';
      fila.push(letra);
    }
    cara.push(fila);
  }
  matriz[caraActual] = cara;

  // Persistir avance y matriz 3D en cada guardado
  persistWorkingState();
  persistMatrix3D();

  // Habilitar envío al servidor si ya no hay 'N'
  const incompletas = matriz.some(bloque => bloque.some(fila => fila.includes('N')));
  if (!incompletas) {
    const btnGuardar = document.getElementById('guardar');
    btnGuardar.classList.remove('deshabilitado');
    btnGuardar.addEventListener('click', () => {
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
    }, { once: true });
  }
}

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
  if (caraActual < 5) caraActual++;
  else caraActual = 0;
  persistWorkingState();
  cargarCara(caraActual);
});

document.getElementById('anterior').addEventListener('click', () => {
  guardarCara();
  if (caraActual > 0) caraActual--;
  else caraActual = 5;
  persistWorkingState();
  cargarCara(caraActual);
});

function actualizarCara() {
  const etiqueta = document.getElementById('cara');
  switch (caraActual) {
    case 0: etiqueta.innerText = 'Cara Frontal'; break;
    case 1: etiqueta.innerText = 'Cara Derecha'; break;
    case 2: etiqueta.innerText = 'Cara Posterior'; break;
    case 3: etiqueta.innerText = 'Cara Izquierda'; break;
    case 4: etiqueta.innerText = 'Cara Superior'; break;
    case 5: etiqueta.innerText = 'Cara Inferior'; break;
  }
}

// Inicializar
actualizarCara();
restoreWorkingState();