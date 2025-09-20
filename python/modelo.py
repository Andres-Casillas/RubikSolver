from sklearn.tree import DecisionTreeClassifier
from sklearn.feature_extraction.text import CountVectorizer
import joblib

# Datos de ejemplo
X_text = [
    "quiero resolver cubo",
    "muéstrame algoritmos",
    "enséñame método básico",
    "quiero avanzado",
    "dame algoritmos de primera capa",
    "última capa"
]
y = [
    "resolver",
    "algoritmos",
    "basico",
    "avanzado",
    "alg1",
    "alg2"
]

# Convertir texto a vectores
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(X_text)

# Entrenar árbol
clf = DecisionTreeClassifier()
clf.fit(X, y)

# Guardar modelo y vectorizador
joblib.dump(clf, "chat_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
