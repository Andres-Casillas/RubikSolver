document.addEventListener('DOMContentLoaded', function () {
  // Mostrar modal si la cuenta fue creada
  if (localStorage.getItem('cuentaCreada')) {
    mostrarModalExito();
    localStorage.removeItem('cuentaCreada');
  }

  if (localStorage.getItem('usuarioLogueado')) {
    window.location.href = 'menu.html';
    return;
  } 

  // Modo invitado
  const invitadoBtn = document.getElementById('invitado');
  if (invitadoBtn) {
    invitadoBtn.addEventListener('click', function(e) {
      localStorage.setItem('usuarioLogueado', 'Invitado');
    });
  }

  $(document).ready(function () {
    $('form').on('submit', function (e) {
      e.preventDefault();
      var username = $('[name="username"]').val();
      var password = $('[name="password"]').val();

      var formData = new FormData();
      formData.append('login', '1');
      formData.append('username', username);
      formData.append('password', password);

      $.ajax({
        url: 'php/api_rubik.php',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function (data) {
          if (data.success) {
            localStorage.setItem('usuarioLogueado', username);
            window.location.href = 'menu.html';
          } else {
            alert(data.message);
          }
        },
        error: function () {
          alert('Error de conexión con el servidor');
        }
      });
    });
  });
});

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
  text.textContent = '¡Cuenta creada con exito!';
  text.style.fontWeight = 'bold';
  text.style.letterSpacing = '1px';
  text.style.textAlign = 'center';

  box.appendChild(text);
  modal.appendChild(box);
  document.body.appendChild(modal);

  setTimeout(() => {
    modal.remove();
  }, 2500);
}
