server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from cube import CuboRubik, movimientos, simplificar

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def recibir_matriz():
    data = request.get_json()
    matriz = data.get('matriz')
    if type(matriz) is list:
        print("Matriz recibida:", matriz)
        cubo = CuboRubik(matriz)
        cubo.mostrar_cubo()

        cubo.cruz()
        cubo.f2l()
        cubo.oll()
        cubo.pll()
        cubo.mostrar_cubo()

        solucion = simplificar(movimientos)
        print("movimientos")
        print(movimientos)
        print(len(movimientos))
        print()
        print("solucion")
        print(solucion)
        print(len(solucion))

        return jsonify({"status": "Matriz recibida correctamente", "matriz": matriz, "solucion": solucion, "movimientos": len(solucion)})
    else:
        return jsonify({"status": "Error", "message": "La matriz debe ser una lista"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)