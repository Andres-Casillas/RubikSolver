$(document).ready(function() {
  if (localStorage.getItem('usuarioLogueado')) {
    window.location.href = 'menu.html';
    return;
  } 

  $('form').on('submit', function(e) {
    e.preventDefault();
    var username = $('[name="username"]').val();
    var password = $('[name="password"]').val();
    var email = $('[name="email"]').val();

    var formData = new FormData();
    formData.append('registro', '1');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('email', email);

    $.ajax({
      url: 'php/api_rubik.php',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      dataType: 'json',
      success: function(data) {
        if (data.success) {
          localStorage.setItem('cuentaCreada', '1');
          window.location.href = 'login.html';
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
