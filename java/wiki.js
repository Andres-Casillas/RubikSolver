document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('nav-notacion').addEventListener('click', function () {
        document.getElementById('wiki-cfop').style.display = 'none';
        document.getElementById('wiki-algoritmos').style.display = 'none';
        document.getElementById('wiki-notacion').style.display = 'block';
    });
    document.getElementById('nav-cfop').addEventListener('click', function () {
        document.getElementById('wiki-notacion').style.display = 'none';
        document.getElementById('wiki-algoritmos').style.display = 'none';
        document.getElementById('wiki-cfop').style.display = 'block';
    });
    document.getElementById('nav-algoritmos').addEventListener('click', function () {
        document.getElementById('wiki-notacion').style.display = 'none';
        document.getElementById('wiki-cfop').style.display = 'none';
        document.getElementById('wiki-algoritmos').style.display = 'block';
    });

    document.querySelectorAll('.wiki-cube').forEach(function (cube) {
        cube.addEventListener('click', function () {
            const rotacion = cube.getAttribute('data-rotacion') || '';
            mostrarModalRotacion(rotacion);
        });
    });
});

function mostrarModalRotacion(titulo) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const box = document.createElement('div');
    box.className = 'modal-box';

    const title = document.createElement('div');
    title.textContent = titulo;
    title.style.fontWeight = 'bold';
    title.style.letterSpacing = '1px';
    title.style.textAlign = 'center';

    const modelo3d = document.createElement('div');
    modelo3d.className = 'modelo3d-placeholder';
    modelo3d.textContent = 'Modelo 3D';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.className = 'modal-btn';
    closeBtn.onclick = function () {
        modal.remove();
    };

    box.appendChild(title);
    box.appendChild(modelo3d);
    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);
}
