const movimientos = [
  "U", "D", "R", "L", "F",
  "U'", "D'", "R'", "L'", "F'",
  "U2", "D2", "R2", "L2", "F2"
];

const pasosPorCaso = 20;

let placeholderModelo, cronometroDisplay, btnSiguiente, btnReiniciar;

let tiempo = 0;
let intervalo = null;
let corriendo = false;
let detenido = false;

function generarCasoAleatorio(pasos = pasosPorCaso) {
    let secuencia = [];
    let ultimo = "";
    for (let i = 0; i < pasos; i++) {
    let mov;
    do {
        mov = movimientos[Math.floor(Math.random() * movimientos.length)];
    } while (mov[0] === ultimo[0]);
    ultimo = mov;
    secuencia.push(mov);
    }
    return secuencia.join(" ");
}

function actualizarCronometro() {
    const segundos = Math.floor(tiempo / 100);
    const decimas = tiempo % 100;
    cronometroDisplay.textContent = `${segundos}.${decimas.toString().padStart(2, '0')}s`;
}

function iniciarCronometro() {
    if (!corriendo && !detenido) {
    corriendo = true;
    intervalo = setInterval(() => {
        tiempo++;
        actualizarCronometro();
    }, 10);
    }
}

function pausarCronometro() {
    if (corriendo) {
    corriendo = false;
    detenido = true;
    clearInterval(intervalo);
    }
}

function reiniciarCronometro() {
    clearInterval(intervalo);
    tiempo = 0;
    corriendo = false;
    detenido = false;
    actualizarCronometro();
    btnReiniciar.disabled = true;
}

function mostrarNuevoCaso() {
    placeholderModelo.textContent = generarCasoAleatorio();
    reiniciarCronometro();
}

window.onload = () => {
    placeholderModelo = document.querySelector('.placeholder-modelo');
    cronometroDisplay = document.getElementById('cronometro');
    btnSiguiente = document.getElementById('btnSiguiente');
    btnReiniciar = document.getElementById('btnReiniciar');

    placeholderModelo.textContent = 'Presiona "Siguiente ▶" para generar un caso';
    actualizarCronometro();

    btnSiguiente.onclick = () => {
    mostrarNuevoCaso();
    btnReiniciar.disabled = true;
    };

    btnReiniciar.onclick = () => {
    reiniciarCronometro();
    };

    document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!corriendo && !detenido) {
        iniciarCronometro();
        btnReiniciar.disabled = false;
        } else if (corriendo) {
        pausarCronometro();
        }
    }
    });
};