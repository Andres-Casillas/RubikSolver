import { KEYS, getEmptyMatrix, clearAll } from './rubik-storage.js';

document.addEventListener('DOMContentLoaded', function () {
    let anteriorBloqueado = false;
    let siguienteBloqueado = false;
    const raw = localStorage.getItem(KEYS.manualMatrix);
    if (!raw) return alert('No hay datos manuales guardados. Ve a "Agregar manualmente".');
    try { applyMatrixTo3D(JSON.parse(raw)); } catch { alert('Error al cargar la matriz manual guardada.'); }

    const secuenciaParams = localStorage.getItem('solucion');
    let secuencia = [];
    let secuenciaVista = [];
    let indice = 0;
    const movimientoContador = document.getElementById('movimientoContador');
    const movimientoElem = document.getElementById('movimiento');
    const btnAnterior = document.getElementById('anterior');
    const btnSiguiente = document.getElementById('siguiente');
    const preantElem = document.getElementById('preant');
    const presigElem = document.getElementById('presig');
    const ayudaBtn = document.getElementById('ayudaBtn');

    const iframe = document.getElementById('iframe3d');
    const api = () => iframe.contentWindow?.RubikCube;

    if (secuenciaParams) {
        secuencia = JSON.parse(decodeURIComponent(secuenciaParams));
        secuenciaVista = normalizeSequence(secuencia);
        console.log(secuenciaVista);
        indice = -1;
        actualizarVista();
    }
    function cargarSecuenciaEnIframe() {
        if (api()?.loadSequence) {
            api().loadSequence(secuencia);
        } else {
            setTimeout(cargarSecuenciaEnIframe, 200);
        }
    }
    iframe.addEventListener('load', cargarSecuenciaEnIframe);
    if (iframe.contentWindow && iframe.contentWindow.RubikCube) {
        cargarSecuenciaEnIframe();
    }

    function actualizarVista() {
        if (secuenciaVista.length > 0) {
            if (indice === -1) {
                movimientoContador.textContent = `0/${secuenciaVista.length}`;
                movimientoElem.textContent = '→';
                btnAnterior.disabled = true;
                btnSiguiente.disabled = false;
                preantElem.textContent = '. . .';
                presigElem.textContent = '. . .';
            } else {
                movimientoContador.textContent = `${indice + 1}/${secuenciaVista.length}`;
                movimientoElem.textContent = secuenciaVista[indice];
                btnAnterior.disabled = indice === 0;
                btnSiguiente.disabled = indice === secuenciaVista.length - 1;
                let pre = [];
                for (let i = indice - 3; i < indice; i++) {
                    pre.push(i >= 0 ? secuenciaVista[i] : '.');
                }
                preantElem.textContent = '. . ' + pre.join(' ');
                let post = [];
                for (let i = indice + 1; i <= indice + 3; i++) {
                    post.push(i < secuenciaVista.length ? secuenciaVista[i] : '.');
                }
                presigElem.textContent = post.join(' ') + ' . .';
            }
        } else {
            movimientoContador.textContent = '0/0';
            movimientoElem.textContent = 'X';
            btnAnterior.disabled = true;
            btnSiguiente.disabled = true;
            preantElem.textContent = '. . . ';
            presigElem.textContent = ' . . .';
        }
    }

    btnAnterior.addEventListener('click', () => {
        if (anteriorBloqueado) return;
        anteriorBloqueado = true;
        setTimeout(() => { anteriorBloqueado = false; }, 500);
        api()?.previousMove?.();
        if (indice > 0) {
            indice--;
            actualizarVista();
        }
    });

    btnSiguiente.addEventListener('click', () => {
        if (siguienteBloqueado) return;
        siguienteBloqueado = true;
        setTimeout(() => { siguienteBloqueado = false; }, 500);
        api()?.nextMove?.();
        if (indice === -1) {
            indice = 0;
            actualizarVista();
        } else if (indice < secuenciaVista.length - 1) {
            indice++;
            actualizarVista();
        }
    });

    ayudaBtn.addEventListener('click', () => {
        mostrarModalAyuda(movimientoElem.textContent);
    });


});

function mostrarModalAyuda(rotacion) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const box = document.createElement('div');
    box.className = 'modal-box';

    const title = document.createElement('div');
    title.textContent = rotacion;
    title.style.fontWeight = 'bold';
    title.style.letterSpacing = '1px';
    title.style.textAlign = 'center';

    const iframe = document.createElement('iframe');
    iframe.src = `./Cubo3D.html?auto=true&secuencia=["${encodeURIComponent(rotacion)}"]`;
    iframe.className = 'modelo-placeholder';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.className = 'modal-btn';
    closeBtn.onclick = function () {
        modal.remove();
    };

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    box.appendChild(title);
    box.appendChild(iframe);
    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    setTimeout(function () {
        box.style.transform = 'scale(1)';
        box.style.opacity = '1';
    }, 3);
}

function normalizeSequence(moves, expandNumeric = true) {
    if (!expandNumeric) return [...moves];
    return moves.flatMap(m => {
        const face = m[0]; // U,D,F,B,L,R
        const hasPrime = m.includes("'");
        const num = m.match(/\d+/);
        const count = num ? Math.max(1, parseInt(num[0], 10)) : 1;

        // Si hay número, ignoramos prime por consistencia (R2 == R2')
        if (num) return Array(count).fill(face);

        // Sin número, respetamos el prime
        return [hasPrime ? `${face}'` : face];
    });
}