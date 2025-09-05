document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('nav-notacion').addEventListener('click', function () {
        document.getElementById('wiki-cfop').style.display = 'none';
        document.getElementById('wiki-algoritmos-oll').style.display = 'none';
        document.getElementById('wiki-algoritmos-pll').style.display = 'none';
        document.getElementById('wiki-notacion').style.display = 'block';
    });
    document.getElementById('nav-cfop').addEventListener('click', function () {
        document.getElementById('wiki-notacion').style.display = 'none';
        document.getElementById('wiki-algoritmos-oll').style.display = 'none';
        document.getElementById('wiki-algoritmos-pll').style.display = 'none';
        document.getElementById('wiki-cfop').style.display = 'block';
    });
    document.getElementById('nav-algoritmos-oll').addEventListener('click', function () {
        document.getElementById('wiki-notacion').style.display = 'none';
        document.getElementById('wiki-cfop').style.display = 'none';
        document.getElementById('wiki-algoritmos-pll').style.display = 'none';
        document.getElementById('wiki-algoritmos-oll').style.display = 'block';
    });
    document.getElementById('nav-algoritmos-pll').addEventListener('click', function () {
        document.getElementById('wiki-notacion').style.display = 'none';
        document.getElementById('wiki-cfop').style.display = 'none';
        document.getElementById('wiki-algoritmos-oll').style.display = 'none';
        document.getElementById('wiki-algoritmos-pll').style.display = 'block';
    });

    document.querySelectorAll('.wiki-cube').forEach(function (cube) {
        cube.addEventListener('click', function () {
            const rotacion = cube.getAttribute('data-rotacion') || '';
            mostrarModalRotacion(rotacion);
        });
    });

    document.querySelectorAll('.wiki-cubez').forEach(function (cube) {
        cube.addEventListener('click', function () {
            const algoritmo = cube.getAttribute('data-alg') || '';
            const img = cube.getAttribute('data-img') || '';
            mostrarModalZoom(algoritmo, img);
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

    const iframe = document.createElement('iframe');
    iframe.src = `./Cubo3D.html?auto=true&secuencia=["${encodeURIComponent(titulo)}"]`;
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

function mostrarModalZoom(algoritmo, imagen) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const box = document.createElement('div');
    box.className = 'modal-box';

    const alg = document.createElement('div');
    alg.textContent = algoritmo;
    alg.style.fontWeight = 'bold';
    alg.style.letterSpacing = '1px';
    alg.style.textAlign = 'center';

    const img = document.createElement('img');
    img.className = 'modelo-placeholder';
    img.alt = 'Cubo Rubik';
    img.src = 'imagenes/wiki/' + imagen + '.png';

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

    box.appendChild(img);
    box.appendChild(alg);
    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    setTimeout(function () {
        box.style.transform = 'scale(1)';
        box.style.opacity = '1';
    }, 3);
}
