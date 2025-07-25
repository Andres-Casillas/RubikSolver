from flask import Flask, request, jsonify
from flask_cors import CORS
from cube import CuboRubik

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

        return jsonify({"status": "Matriz recibida correctamente", "matriz": matriz})
    else:
        return jsonify({"status": "Error", "message": "La matriz debe ser una lista"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)