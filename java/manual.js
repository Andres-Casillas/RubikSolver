import { rotarMatriz } from './utils.js';
import { conexionPython } from './utils.js';

let colorSeleccionado = null;
let caraActual = 0;
let matriz = Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill('N'))
);

function contarColores() {
    const colores = ['W', 'R', 'G', 'B', 'O', 'Y'];
    const conteo = { W: 0, R: 0, G: 0, B: 0, O: 0, Y: 0 };

    for (let cara of matriz) {
        for (let fila of cara) {
            for (let color of fila) {
                if (colores.includes(color)) {
                    conteo[color]++;
                }
            }
        }
    }

    const casillas = document.querySelectorAll('.casilla');
    casillas.forEach(casilla => {
        const color = casilla.dataset.color;
        if (colores.includes(color)) {
            conteo[color]++;
        }
    });

    for (const color of colores) {
        if (conteo[color] >= 9) {
            console.warn(`¡El color ${color} ha alcanzado ${conteo[color]} casillas!`);
        }
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
        c.classList.remove('W', 'R', 'G', 'B', 'O', 'Y')
        c.dataset.color = 'N';
    });
}

document.querySelectorAll('.casilla').forEach(casilla => {
    casilla.addEventListener('click', () => {
        if (!colorSeleccionado) {
            console.warn('No se ha seleccionado ningún color aún');
            return;
        }
        casilla.classList.remove('W', 'R', 'G', 'B', 'O', 'Y', 'N');
        casilla.classList.add(colorSeleccionado);
        casilla.dataset.color = colorSeleccionado;

        contarColores();
    });
});

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

    const existe = matriz.some(bloque =>
        bloque.some(fila =>
            fila.includes('N')
        )
    );
    if (!existe) {
        document.getElementById('guardar').classList.remove('deshabilitado');
        document.getElementById('guardar').addEventListener('click', () => {
            const cubo = [];
            cubo[0] = matriz[4];
            cubo[1] = matriz[0];
            cubo[2] = matriz[5];
            cubo[3] = matriz[2];
            cubo[4] = matriz[3];
            cubo[5] = matriz[1];

            cubo[0] = rotarMatriz(cubo[0], "horario");
            cubo[2] = rotarMatriz(cubo[2], "antihorario");
            cubo[3] = rotarMatriz(cubo[3], "espejo");

            conexionPython(cubo);
        });
    }
}

function cargarCara(index) {
    actualizarCara();
    reiniciarCubo();
    const casillas = document.querySelectorAll('.casilla');
    const cara = matriz[index];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const idx = i * 3 + j;
            const color = cara[i][j];
            casillas[idx].classList.add(color);
            casillas[idx].dataset.color = color;
        }
    }
}

document.getElementById('reiniciar').addEventListener('click', () => {
    reiniciarCubo();
    colorSeleccionado = null;
    caraActual = 0;
});

document.getElementById('siguiente').addEventListener('click', () => {
    guardarCara();
    if (caraActual < 5) {
        caraActual++;
    } else { caraActual = 0; }
    cargarCara(caraActual);
});

document.getElementById('anterior').addEventListener('click', () => {
    guardarCara();
    if (caraActual > 0) caraActual--;
    else caraActual = 5;
    cargarCara(caraActual);
});

function actualizarCara() {
    switch (caraActual) {
        case 0:
            document.getElementById('cara').innerText = 'Cara Frontal';
            break;
        case 1:
            document.getElementById('cara').innerText = 'Cara Derecha';
            break;
        case 2:
            document.getElementById('cara').innerText = 'Cara Posterior';
            break;
        case 3:
            document.getElementById('cara').innerText = 'Cara Izquierda';
            break;
        case 4:
            document.getElementById('cara').innerText = 'Cara Superior';
            break;
        case 5:
            document.getElementById('cara').innerText = 'Cara Inferior';
            break;
    }
}
actualizarCara();