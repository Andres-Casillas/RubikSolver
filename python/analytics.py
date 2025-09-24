# -*- coding: utf-8 -*-
"""Servidor Flask para el asistente del cubo de Rubik."""
from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS

from cube import CuboRubik, movimientos, simplificar
from response_repository import ResponseRepository


class AnalyticsTracker:
    """Tracker para registrar eventos de analíticas en formato JSONL."""
    
    def __init__(self, log_file: Path):
        self.log_file = Path(log_file)
        self.log_file.parent.mkdir(exist_ok=True)
    
    def _write_event(self, event_data: Dict[str, Any]) -> None:
        """Escribe un evento al archivo JSONL."""
        event_data["timestamp"] = time.time()
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(event_data, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"Error escribiendo analíticas: {e}")
    
    def track_invalid(self, reason: str) -> None:
        """Registra una petición inválida."""
        self._write_event({
            "event": "invalid",
            "reason": reason
        })
    
    def track_interaction(self, user_input: str, predicted_intent: Optional[str], 
                         response_intent: str, fallback_used: bool, metadata: Dict[str, Any]) -> None:
        """Registra una interacción exitosa del chat."""
        self._write_event({
            "event": "interaction",
            "user_input": user_input,
            "predicted_intent": predicted_intent,
            "response_intent": response_intent,
            "fallback": fallback_used,
            "meta": metadata
        })
    
    def track_error(self, user_input: str, error: str) -> None:
        """Registra un error durante el procesamiento."""
        self._write_event({
            "event": "error",
            "user_input": user_input,
            "error": error
        })

try:
    import joblib
except ImportError as exc:  # pragma: no cover - joblib es obligatorio en produccion
    raise RuntimeError("Se requiere joblib para cargar el modelo del chatbot") from exc

app = Flask(__name__)
CORS(app)

# Rutas a los artefactos del modelo del chatbot
_BASE_DIR = Path(__file__).resolve().parent
_MODEL_PATH = _BASE_DIR / "chat_model.pkl"
_VECTORIZER_PATH = _BASE_DIR / "vectorizer.pkl"
_RESPONSES_PATH = _BASE_DIR / "responses.json"

# Configuracion de logging
_LOG_DIR = _BASE_DIR / "logs"
_LOG_DIR.mkdir(exist_ok=True)
_LOGGER = logging.getLogger("chatbot")
if not _LOGGER.handlers:
    _LOGGER.setLevel(logging.INFO)
    handler = logging.FileHandler(_LOG_DIR / "chatbot.log", encoding="utf-8")
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    _LOGGER.addHandler(handler)

# Analitica
_analytics = AnalyticsTracker(_LOG_DIR / "analytics.jsonl")

# Cargar modelo y vectorizador si estan disponibles
_clf = None
_vectorizer = None
if _MODEL_PATH.exists() and _VECTORIZER_PATH.exists():
    _clf = joblib.load(_MODEL_PATH)
    _vectorizer = joblib.load(_VECTORIZER_PATH)

# Cargar respuestas enriquecidas
_response_repository = ResponseRepository(_RESPONSES_PATH)


def _modelo_disponible() -> bool:
    return _clf is not None and _vectorizer is not None


def _resolve_response(user_input: str, hint_intent: Optional[str]) -> Dict[str, Any]:
    """Busca la respuesta aplicando hint, alias y, en ultima instancia, el modelo."""
    matched_by = ""
    predicted_intent: Optional[str] = None

    if hint_intent and isinstance(hint_intent, str):
        hint_intent = hint_intent.strip()
        if hint_intent and _response_repository.has_intent(hint_intent):
            payload = _response_repository.get(hint_intent)
            if payload:
                return {
                    "payload": payload,
                    "matched_by": "intent_hint",
                    "predicted": hint_intent,
                }

    alias_payload = _response_repository.match(user_input)
    if alias_payload:
        return {
            "payload": alias_payload,
            "matched_by": "alias",
            "predicted": alias_payload.get("intent"),
        }

    vector = _vectorizer.transform([user_input])  # type: ignore[union-attr]
    predicted_intent = _clf.predict(vector)[0]  # type: ignore[union-attr]
    payload = _response_repository.get(predicted_intent)
    if payload is None:
        _LOGGER.info("Intento %s sin respuesta configurada, se usa fallback", predicted_intent)
        payload = _response_repository.fallback()
        matched_by = "model:fallback"
    else:
        matched_by = "model"

    return {
        "payload": payload,
        "matched_by": matched_by,
        "predicted": predicted_intent,
    }


@app.route("/chat", methods=["POST"])
def chat() -> Any:
    if not _modelo_disponible():
        _LOGGER.error("Modelo no disponible para la solicitud")
        _analytics.track_invalid(reason="model_unavailable")
        return (
            jsonify({"error": {"message": "El modelo del chatbot no esta disponible en el servidor."}}),
            503,
        )

    payload = request.get_json(silent=True) or {}
    user_input = str(payload.get("message", "")).strip()

    if not user_input:
        _analytics.track_invalid(reason="empty_message")
        return jsonify({"error": {"message": "Por favor ingresa un mensaje."}}), 400

    hint_intent = payload.get("intent")

    try:
        resolution = _resolve_response(user_input, hint_intent)
        response_payload = resolution["payload"]
        matched_by = resolution["matched_by"]
        predicted_intent = resolution.get("predicted")

        fallback_used = response_payload.get("intent") == "fallback"
        response_intent = response_payload.get("intent")

        reply: Dict[str, Any] = {
            "message": response_payload,
            "classification": {
                "intent": response_intent,
                "source": matched_by,
            },
        }
        if predicted_intent and predicted_intent != response_intent:
            reply["classification"]["model_intent"] = predicted_intent

        metadata = {
            "has_choices": bool(response_payload.get("choices")),
            "has_media": bool(response_payload.get("media")),
            "has_steps": bool(response_payload.get("steps")),
            "matched_by": matched_by,
        }
        _analytics.track_interaction(
            user_input=user_input,
            predicted_intent=predicted_intent if isinstance(predicted_intent, str) else None,
            response_intent=response_intent,
            fallback_used=fallback_used,
            metadata=metadata,
        )
        return jsonify(reply)
    except Exception as exc:  # pragma: no cover - manejo defensivo
        _LOGGER.exception("Error procesando la peticion del chat")
        _analytics.track_error(user_input=user_input, error=str(exc))
        return (
            jsonify({"error": {"message": f"Error al procesar la peticion: {exc}"}}),
            500,
        )


@app.route("/solve", methods=["POST"])
def recibir_matriz() -> Any:
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
