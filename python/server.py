from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

from cube import CuboRubik, movimientos, simplificar

try:
    import joblib
except ImportError as exc:  # pragma: no cover - joblib es obligatorio en producción
    raise RuntimeError("Se requiere joblib para cargar el modelo del chatbot") from exc

app = Flask(__name__)
CORS(app)

# Rutas a los artefactos del modelo del chatbot
_BASE_DIR = Path(__file__).resolve().parent
_MODEL_PATH = _BASE_DIR / "chat_model.pkl"
_VECTORIZER_PATH = _BASE_DIR / "vectorizer.pkl"

# Cargar modelo y vectorizador si están disponibles
_clf = None
_vectorizer = None
if _MODEL_PATH.exists() and _VECTORIZER_PATH.exists():
    _clf = joblib.load(_MODEL_PATH)
    _vectorizer = joblib.load(_VECTORIZER_PATH)

# Respuestas por etiqueta
_RESPONSES = {
    "resolver": "¿Quieres método básico o avanzado?",
    "algoritmos": "¿De qué capa quieres saber algoritmos?",
    "basico": "Método básico: cruces, esquinas, etc.",
    "avanzado": "Método avanzado: CFOP, Roux, ZZ...",
    "alg1": "Algoritmos de la primera capa: ...",
    "alg2": "Algoritmos de la última capa: ...",
}


def _modelo_disponible() -> bool:
    return _clf is not None and _vectorizer is not None


@app.route("/chat", methods=["POST"])
def chat():
    if not _modelo_disponible():
        return (
            jsonify({"response": "El modelo del chatbot no está disponible en el servidor."}),
            503,
        )

    payload = request.get_json(silent=True) or {}
    user_input = payload.get("message", "").strip()

    if not user_input:
        return jsonify({"response": "Por favor ingresa un mensaje."}), 400

    try:
        vector = _vectorizer.transform([user_input])
        prediction = _clf.predict(vector)[0]
        response = _RESPONSES.get(prediction, "No entendí, intenta otra vez.")
        return jsonify({"response": response})
    except Exception as exc:  # pragma: no cover - manejo defensivo
        return (
            jsonify({"response": f"Error al procesar la petición: {exc}"}),
            500,
        )


@app.route("/solve", methods=["POST"])
def recibir_matriz():
    data = request.get_json(silent=True) or {}
    matriz = data.get("matriz")

    if not isinstance(matriz, list):
        return jsonify({"status": "Error", "message": "La matriz debe ser una lista"}), 400

    cubo = CuboRubik(matriz)
    cubo.mostrar_cubo()

    cubo.cruz()
    cubo.f2l()
    cubo.oll()
    cubo.pll()
    cubo.mostrar_cubo()

    solucion = simplificar(movimientos)

    return jsonify(
        {
            "status": "Matriz recibida correctamente",
            "matriz": matriz,
            "solucion": solucion,
            "movimientos": len(solucion),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
