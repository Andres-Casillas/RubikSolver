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
    btnGuardar.disabled = true;
}

function mostrarNuevoCaso() {
    placeholderModelo.textContent = generarCasoAleatorio();
    reiniciarCronometro();
}

function mostrarCasoProbar(str) {
    placeholderModelo.textContent = str;
    reiniciarCronometro();
}

window.onload = () => {
    // Crear modal correctamente para sobreponer
    const modal = document.createElement('div');
    modal.id = 'modalTiempo';
    modal.className = 'modal-tiempo';
    const modalContenido = document.createElement('div');
    modalContenido.id = 'modalContenido';
    modalContenido.className = 'modal-contenido';
    modal.appendChild(modalContenido);
    document.body.appendChild(modal);

    // Cerrar modal al hacer click fuera del contenido
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
    });
    placeholderModelo = document.querySelector('.placeholder-modelo');
    cronometroDisplay = document.getElementById('cronometro');
    btnSiguiente = document.getElementById('btnSiguiente');
    btnReiniciar = document.getElementById('btnReiniciar');
    const btnGuardar = document.getElementById('btnGuardar');

    placeholderModelo.textContent = 'Presiona "Siguiente ▶" para generar un caso';
    actualizarCronometro();
    mostrarNuevoCaso();


    btnSiguiente.onclick = () => {
        mostrarNuevoCaso();
        btnReiniciar.disabled = true;
        btnGuardar.disabled = true;
    };


    btnReiniciar.onclick = () => {
        reiniciarCronometro();
        btnGuardar.disabled = true;
    };

    document.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!corriendo && !detenido) {
                iniciarCronometro();
                btnReiniciar.disabled = false;
            } else if (corriendo) {
                pausarCronometro();
                btnGuardar.disabled = false;
            }
        }
    });

    // Guardar tiempo en la tabla top
    btnGuardar.addEventListener('click', function() {
        if (localStorage.getItem('usuarioLogueado') === 'Invitado') {
            mostrarModalNoDisponible();
            return;
        }
        const segundos = Math.floor(tiempo / 100);
        const decimas = tiempo % 100;
        const tiempoStr = `${segundos}.${decimas.toString().padStart(2, '0')}`;
        const usuario = localStorage.getItem('usuarioLogueado');
        $.ajax({
            url: 'php/api_rubik.php',
            type: 'POST',
            data: {
                insert_top: "1",
                username: usuario,
                tiempo: tiempoStr,
                algoritmo: placeholderModelo.textContent
            },
            dataType: 'json',
            success: function(data) {
                if (data.success) {
                    mostrarTiempos(topLimit);
                } else {
                    alert(data.message);
                }
            },
            error: function() {
                alert('Error de conexión con el servidor');
            }
        });
        btnGuardar.disabled = true;
    });



        // --- Mostrar los mejores tiempos con botón "Ver más" ---
        let topLimit = 10;
        let todosTiempos = [];
        const lista = document.getElementById('tiempos');

        function mostrarTiempos(limit) {
            lista.innerHTML = '';
            if (todosTiempos.length === 0) {
                lista.innerHTML = '<li>No hay tiempos registrados</li>';
                return;
            }
            todosTiempos.slice(0, limit).forEach((tiempo, idx) => {
                const li = document.createElement('li');
                li.textContent = `${tiempo.usuario} - ${tiempo.tiempo}s`;
                li.style.cursor = 'pointer';
                li.onclick = function() {
                    let html = `<h3>Detalle del tiempo</h3>`;
                    html += `<p><strong>Usuario:</strong> ${tiempo.usuario}</p>`;
                    html += `<p><strong>Tiempo:</strong> ${tiempo.tiempo}s</p>`;
                    html += `<p><strong>Algoritmo:</strong> ${tiempo.algoritmo}</p>`;
                    html += `<button id='btnProbarAlgoritmo' class='modal-btn'>Probar Algoritmo</button>`;
                    html += `<button id='cerrarModalTiempo' class='modal-cerrar'>Cerrar</button>`;
                    modalContenido.innerHTML = html;
                    modal.style.display = 'flex';
                    document.getElementById('cerrarModalTiempo').onclick = () => { modal.style.display = 'none'; };
                    document.getElementById('btnProbarAlgoritmo').onclick = () => {
                        mostrarCasoProbar(tiempo.algoritmo);
                        modal.style.display = 'none';
                    };
                };
                lista.appendChild(li);
            });
        }

        fetch('php/api_rubik.php?top=1')
        $.ajax({
            url: 'php/api_rubik.php',
            type: 'GET',
            data: { top: 1 },
            dataType: 'json',
            success: function(data) {
                if (data.success && Array.isArray(data.tiempos)) {
                    todosTiempos = data.tiempos;
                    mostrarTiempos(topLimit);
                } else {
                    lista.innerHTML = '<li>No hay tiempos registrados</li>';
                }
            },
            error: function() {
                lista.innerHTML = '<li>Error al cargar los tiempos</li>';
            }
        });
};

function mostrarModalNoDisponible() {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(20, 40, 60, 0.45)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';

    const box = document.createElement('div');
    box.style.background = 'linear-gradient(135deg, #ff9800 0%, #ff5e62 100%)';
    box.style.color = '#fff';
    box.style.padding = '2.2rem 2.5rem';
    box.style.borderRadius = '18px';
    box.style.fontSize = '1.2rem';
    box.style.boxShadow = '0 8px 32px rgba(16, 32, 64, 0.25)';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.alignItems = 'center';
    box.style.gap = '1rem';

    const text = document.createElement('div');
    text.textContent = 'Esta opción no está disponible para invitados.';
    text.style.fontWeight = 'bold';
    text.style.textAlign = 'center';

    const link = document.createElement('a');
    link.href = 'login.html';
    link.textContent = 'Iniciar sesión';
    link.style.background = '#fff';
    link.style.color = '#ff9800';
    link.style.padding = '0.7rem 1.5rem';
    link.style.borderRadius = '8px';
    link.style.fontWeight = 'bold';
    link.style.textDecoration = 'none';
    link.style.transition = 'background 0.2s';
    link.onmouseover = function () { link.style.background = '#ffe0b2'; };
    link.onmouseout = function () { link.style.background = '#fff'; };

    const cerrar = document.createElement('a');
    cerrar.textContent = 'Cerrar';
    cerrar.style.background = '#fff';
    cerrar.style.color = '#ff7575ff';
    cerrar.style.padding = '0.7rem 1.5rem';
    cerrar.style.borderRadius = '8px';
    cerrar.style.fontWeight = 'bold';
    cerrar.style.textDecoration = 'none';
    cerrar.style.transition = 'background 0.2s';
    cerrar.style.cursor = 'pointer';
    cerrar.onmouseover = function () { cerrar.style.background = '#ffc5c7ff'; };
    cerrar.onmouseout = function () { cerrar.style.background = '#fff'; };
    cerrar.onclick = function () { modal.style.display = 'none'; };

    box.appendChild(text);
    box.appendChild(link);
    box.appendChild(cerrar);
    modal.appendChild(box);
    document.body.appendChild(modal);
}