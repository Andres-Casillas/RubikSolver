export function rotarMatriz(matriz, direccion) {
    if (direccion === "horario") {
        const transpuesta = matriz[0].map((_, i) => matriz.map(fila => fila[i]));
        const rotada = transpuesta.map(fila => fila.reverse());
        return rotada;
    }

    if (direccion === "antihorario") {
        const transpuesta = matriz[0].map((_, i) => matriz.map(fila => fila[i]));
        const rotada = transpuesta.reverse();
        return rotada;
    }

    if (direccion === "espejo") {
        const rotada = matriz.map(fila => fila.slice().reverse());
        return rotada;
    }

    if (direccion === "invertida") {
        const rotada = matriz.slice().reverse();
        return rotada;
    }

    return matriz;
}

export function conexionPython(cubo) {
    fetch('http://localhost:5000/solve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matriz: cubo })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta del servidor:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}