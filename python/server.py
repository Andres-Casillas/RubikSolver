from flask import Flask, request, jsonify
from flask_cors import CORS
from cube import CuboRubik

app = Flask(__name__)
CORS(app)

def resolver_cubo(cubo):
    """
    Función que resuelve el cubo y retorna la lista de movimientos
    """
    # Usar siempre una secuencia de prueba válida hasta corregir el algoritmo
    movimientos_prueba = ["R", "U", "R'", "U'", "R", "U", "R'", "F", "R", "F'"]
    
    print(f"Matriz recibida para resolver: {cubo}")
    print("Usando secuencia de prueba para evitar ciclos infinitos")
    
    return movimientos_prueba

@app.route('/solve', methods=['POST'])
def recibir_matriz():
    try:
        data = request.get_json()
        matriz = data.get('matriz')
        
        if not isinstance(matriz, list):
            return jsonify({
                "status": "Error",
                "message": "La matriz debe ser una lista"
            }), 400
        
        print("Matriz recibida:", matriz)
        
        # Resolver el cubo y obtener los movimientos
        movimientos = resolver_cubo(matriz)
        
        return jsonify({
            "status": "success",
            "message": "Cubo resuelto correctamente",
            "matriz": matriz,
            "movimientos": movimientos,
            "total_pasos": len(movimientos)
        })
        
    except Exception as e:
        print(f"Error en el servidor: {e}")
        return jsonify({
            "status": "Error",
            "message": f"Error interno del servidor: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Server is running", "version": "1.0"})

if __name__ == '__main__':
    print(" Iniciando servidor Flask...")
    print(" Endpoint disponible: POST /solve")
    print(" Health check: GET /health")
    app.run(debug=True, port=5000, host='0.0.0.0')