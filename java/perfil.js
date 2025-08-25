document.addEventListener('DOMContentLoaded', function () {
    const usuario = localStorage.getItem('usuarioLogueado');

    if (usuario === 'invitado') {
        mostrarModalNoDisponible();
    }

    $.ajax({
        url: 'php/api_rubik.php',
        type: 'POST',
        data: {
            get_user: '1',
            username: usuario
        },
        dataType: 'json',
        success: function (data) {
            if (data.success) {
                const user = data.data;
                document.getElementById("avatar").src = '/imagenes/perfil/' + user.photo + '.png';
                document.getElementById('perfil-nombre').textContent = user.username || '-';
                document.getElementById('perfil-usuario').textContent = user.username || '-';
                document.getElementById('perfil-email').textContent = user.email || '-';
            } else {
                alert(data.message);
            }
        },
        error: function () {
            alert('Error de conexión con el servidor');
        }
    });

    const navFoto = document.getElementById('nav-foto');
    const navPassword = document.getElementById('nav-password');
    const navEmail = document.getElementById('nav-email');
    const navEliminar = document.getElementById('nav-eliminar');
    const perfilConfigContent = document.getElementById('perfil-config-content');

    

    // Cambiar foto
    if (navFoto && perfilConfigContent) {
        navFoto.addEventListener('click', function (e) {
            e.preventDefault();
            const fotos = ['1', '2', '3', '4', '5','6', '7', '8', '9'];
            let html = '<div class="perfil-fotos">';
            fotos.forEach(function(foto) {
                html += `<label class="foto-option">
                    <input type="radio" name="foto" value="${foto}">
                    <img src="/imagenes/perfil/${foto}.png" alt="${foto}" class="perfil-avatar" style="width:70px;height:70px;object-fit:cover;">
                </label>`;
            });
            html += '</div>';
            html += '<button id="guardar-foto" class="perfil-btn" style="margin-top:1.2rem;">Guardar cambios</button>';
            perfilConfigContent.innerHTML = html;

            document.getElementById('guardar-foto').addEventListener('click', function() {
                const seleccion = document.querySelector('input[name="foto"]:checked');
                if (!seleccion) {
                    alert('Selecciona una foto de perfil');
                    return;
                }
                $.ajax({
                    url: 'php/api_rubik.php',
                    type: 'POST',
                    data: {
                        actualizar: 'foto',
                        username: usuario,
                        photo: seleccion.value
                    },
                    dataType: 'json',
                    success: function(data) {
                        if (data.success) {
                            document.getElementById("avatar").src = '/imagenes/perfil/' + seleccion.value + '.png';
                            perfilConfigContent.innerHTML = `<button id="sesion" class="perfil-btn">Cerrar Sesion</button>`;
                            mostrarModalExito();
                        } else {
                            alert(data.message);
                        }
                    },
                    error: function() {
                        alert('Error de conexión con el servidor');
                    }
                });
            });
        });
    }

    // Cambiar contraseña
    if (navPassword && perfilConfigContent) {
        navPassword.addEventListener('click', function (e) {
            e.preventDefault();
            perfilConfigContent.innerHTML = `
            <form id="form-password" class="form">
            <label for="actual">Contraseña actual: </label>
            <input type="password" id="actual" name="actual" required>
            <label for="nueva">Contraseña nueva: </label>
            <input type="password" id="nueva" name="nueva" required><br>
            <label for="repetir">Confirmar contraseña: </label>
            <input type="password" id="repetir" name="repetir" required>
            <button type="submit" class="perfil-btn">Guardar cambios</button>
            </form>`;
            document.getElementById('form-password').addEventListener('submit', function (ev) {
                ev.preventDefault();
                const actual = document.getElementById('actual').value;
                const nueva = document.getElementById('nueva').value;
                const repetir = document.getElementById('repetir').value;
                if (nueva !== repetir) {
                    alert('Las contraseñas nuevas no coinciden');
                    return;
                }
                $.ajax({
                    url: 'php/api_rubik.php',
                    type: 'POST',
                    data: {
                        actualizar: 'password',
                        username: usuario,
                        password: nueva
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.success) {
                            perfilConfigContent.innerHTML = `
                            <button id="sesion" class="perfil-btn">Cerrar Sesion</button>`;
                            mostrarModalExito();
                        }
                    },
                    error: function () {
                        alert('Error de conexión con el servidor');
                    }
                });
            });
        });
    }

    // Cambiar email
    if (navEmail && perfilConfigContent) {
        navEmail.addEventListener('click', function (e) {
            e.preventDefault();
            perfilConfigContent.innerHTML = `
            <form id="form-email" class="form">
            <label for="email">Correo actual: </label>
            <input type="email" id="email" name="email" placeholder="${document.getElementById('perfil-email').textContent}" disabled><br>
            <label for="nuevo-email">Nuevo correo: </label>
            <input type="email" id="nuevo-email" name="nuevo-email" required>
            <button type="submit" class="perfil-btn">Guardar cambios</button>
            </form>`;
            document.getElementById('form-email').addEventListener('submit', function (ev) {
                ev.preventDefault();
                const nuevoEmail = document.getElementById('nuevo-email').value;
                $.ajax({
                    url: 'php/api_rubik.php',
                    type: 'POST',
                    data: {
                        actualizar: 'email',
                        username: usuario,
                        email: nuevoEmail
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.success) {
                            perfilConfigContent.innerHTML = `
                            <button id="sesion" class="perfil-btn">Cerrar Sesion</button>`;
                            mostrarModalExito();
                        }
                    },
                    error: function () {
                        alert('Error de conexión con el servidor');
                    }
                });
            });
        });
    }

    // Eliminar cuenta
    if (navEliminar && perfilConfigContent) {
        navEliminar.addEventListener('click', function (e) {
            e.preventDefault();
            perfilConfigContent.innerHTML = `
            <form id="form-eliminar" class="form">
            <label for="usuario">Usuario: </label>
            <input type="text" id="usuario" name="usuario" required><br>
            <label for="password">Contraseña: </label>
            <input type="password" id="password" name="password" required>
            <button type="submit" class="perfil-btn" style="background: #ff5e62;">Eliminar cuenta</button>
            </form>`;
        });
    }

    document.getElementById('perfil-config-content').addEventListener('click', function (e) {
        if (e.target.id === 'sesion') {
            localStorage.removeItem('usuarioLogueado');
            window.location.href = 'login.html';
        }
    });
});

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

    box.appendChild(text);
    box.appendChild(link);
    modal.appendChild(box);
    document.body.appendChild(modal);
}

function mostrarModalExito() {
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
    box.style.background = 'linear-gradient(135deg, #38d39f 0%, #43e97b 100%)';
    box.style.color = '#fff';
    box.style.padding = '2.2rem 3rem';
    box.style.borderRadius = '18px';
    box.style.fontSize = '1.35rem';
    box.style.boxShadow = '0 8px 32px rgba(16, 32, 64, 0.25)';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.alignItems = 'center';
    box.style.gap = '0.7rem';

    const text = document.createElement('div');
    text.textContent = '!Cambios realizados con exito!';
    text.style.fontWeight = 'bold';
    text.style.letterSpacing = '1px';
    text.style.textAlign = 'center';


    const text2 = document.createElement('div');
    text2.textContent = 'Cerrar sesión para efectura los cambios';
    text2.style.color = '#f0f0f0';
    text2.style.fontSize = '1rem';
    text2.style.letterSpacing = '1px';
    text2.style.textAlign = 'center';

    box.appendChild(text);
    box.appendChild(text2);
    modal.appendChild(box);
    document.body.appendChild(modal);

    setTimeout(() => {
        modal.remove();
    }, 3500);
}