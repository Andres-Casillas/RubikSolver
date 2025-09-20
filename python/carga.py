from flask import Flask, request, jsonify
from flask_cors import CORS  # <-- Importar flask-cors
import joblib

app = Flask(__name__)
CORS(app)  # <-- Permitir todas las peticiones CORS (o restringir a tu frontend)

# Cargar modelo y vectorizador
clf = joblib.load("chat_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# Respuestas asociadas
responses = {
    "resolver": "¿Quieres método básico o avanzado?",
    "algoritmos": "¿De qué capa quieres saber algoritmos?",
    "basico": "Método básico: cruces, esquinas, etc.",
    "avanzado": "Método avanzado: CFOP, Roux, ZZ...",
    "alg1": "Algoritmos de la primera capa: ...",
    "alg2": "Algoritmos de la última capa: ..."
}

@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_input = request.json.get("message", "")
        X = vectorizer.transform([user_input])
        pred = clf.predict(X)[0]
        response = responses.get(pred, "No entendí, intenta otra vez.")
        return jsonify({"response": response})
    except Exception as e:
        # Mensaje de error en caso de fallo
        return jsonify({"response": f"Error al procesar: {str(e)}"})

if __name__ == "__main__":
    # Levantar Flask en localhost:5000
    app.run(host="127.0.0.1", port=5000, debug=True)
