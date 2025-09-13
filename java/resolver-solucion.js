import { KEYS } from './rubik-storage.js';

function normalizeSequence(moves, expandNumeric = true) {
  if (!expandNumeric) return [...moves];
  return moves.flatMap(m => {
    const face = m[0];
    const hasPrime = m.includes("'");
    const num = m.match(/\d+/);
    const count = num ? Math.max(1, parseInt(num[0], 10)) : 1;
    if (num) return Array(count).fill(face);
    return [hasPrime ? `${face}'` : face];
  });
}

export function mostrarSolucion(secuencia) {
  if (!Array.isArray(secuencia)) return;

  // Oculta la camara y controles de captura
  document.querySelector('.camara-placeholder')?.classList.add('deshabilitado');
  document.querySelector('.camara-placeholder')?.setAttribute('style', 'display:none');
  document.querySelector('.controles-3d')?.setAttribute('style', 'display:none');
  document.querySelector('.botones')?.setAttribute('style', 'display:none');

  // Muestra panel de movimientos
  const panel = document.getElementById('movimientosPanel');
  if (!panel) return;
  panel.style.display = 'block';

  // Asegura que el cubo 3D tenga los colores almacenados
  const raw = localStorage.getItem(KEYS.manualMatrix) || localStorage.getItem(KEYS.cameraMatrix);
  if (raw && typeof window.applyMatrixTo3D === 'function') {
    try { window.applyMatrixTo3D(JSON.parse(raw)); } catch {}
  }

  const movimientoElem = document.getElementById('movimiento');
  const contadorElem = document.getElementById('movimientoContador');
  const preantElem = document.getElementById('preant');
  const presigElem = document.getElementById('presig');
  const btnPrev = document.getElementById('movAnterior');
  const btnNext = document.getElementById('movSiguiente');
  const iframe = document.getElementById('iframe3d');
  const api = () => iframe.contentWindow?.RubikCube;

  function cargarSecuencia() {
    if (api()?.loadSequence) {
      api().loadSequence(secuencia);
    } else {
      setTimeout(cargarSecuencia, 200);
    }
  }
  cargarSecuencia();

  const secuenciaVista = normalizeSequence(secuencia);
  let indice = -1;

  function actualizarVista() {
    if (secuenciaVista.length === 0) {
      contadorElem.textContent = '0/0';
      movimientoElem.textContent = 'X';
      btnPrev.disabled = true;
      btnNext.disabled = true;
      preantElem.textContent = '. . .';
      presigElem.textContent = '. . .';
      return;
    }
    if (indice === -1) {
      contadorElem.textContent = `0/${secuenciaVista.length}`;
      movimientoElem.textContent = '→';
      btnPrev.disabled = true;
      btnNext.disabled = false;
      preantElem.textContent = '. . .';
      presigElem.textContent = '. . .';
    } else {
      contadorElem.textContent = `${indice + 1}/${secuenciaVista.length}`;
      movimientoElem.textContent = secuenciaVista[indice];
      btnPrev.disabled = indice === 0;
      btnNext.disabled = indice === secuenciaVista.length - 1;
      const pre = [];
      for (let i = indice - 3; i < indice; i++) {
        pre.push(i >= 0 ? secuenciaVista[i] : '.');
      }
      preantElem.textContent = '. . ' + pre.join(' ');
      const post = [];
      for (let i = indice + 1; i <= indice + 3; i++) {
        post.push(i < secuenciaVista.length ? secuenciaVista[i] : '.');
      }
      presigElem.textContent = post.join(' ') + ' . .';
    }
  }

  btnPrev.addEventListener('click', () => {
    api()?.previousMove?.();
    if (indice > 0) {
      indice--;
      actualizarVista();
    }
  });

  btnNext.addEventListener('click', () => {
    api()?.nextMove?.();
    if (indice === -1) {
      indice = 0;
    } else if (indice < secuenciaVista.length - 1) {
      indice++;
    }
    actualizarVista();
  });

  actualizarVista();
  // limpia solucion del almacenamiento para evitar recargas involuntarias
  try { localStorage.removeItem('solucion'); } catch {}
}

// Si existe una solucion guardada en localStorage y estamos en la página de
// solución (es decir, existe el panel de movimientos), se muestra automáticamente
try {
  const panel = document.getElementById('movimientosPanel');
  if (panel) {
    const almacenada = localStorage.getItem('solucion');
    if (almacenada) {
      const seq = JSON.parse(almacenada);
      mostrarSolucion(seq);
    }
  }
} catch {}
