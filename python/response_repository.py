"""Utilidades para cargar y sanear las respuestas del asistente."""
from __future__ import annotations

import html
import json
import threading
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

_ALLOWED_HTML_TAGS = {
    "a",
    "b",
    "br",
    "code",
    "em",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "span",
    "strong",
    "u",
    "ul",
}
_ALLOWED_HTML_ATTRS = {
    "a": {"href", "rel", "target", "title"},
}
_SAFE_URL_PREFIXES = ("http://", "https://", "mailto:", "/", "wiki.html")
_SAFE_MEDIA_PREFIXES = ("http://", "https://", "imagenes/", "/imagenes/")
_ALLOWED_MEDIA_TYPES = {"image", "gif", "video"}


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    value = " ".join(value.split())
    return value.lower()


class _SafeHTMLParser(HTMLParser):
    """Parser que reconstruye HTML limitando etiquetas y atributos."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._parts: List[str] = []

    def _format_attrs(self, tag: str, attrs: Iterable[tuple[str, Optional[str]]]) -> str:
        allowed = _ALLOWED_HTML_ATTRS.get(tag, set())
        cleaned: List[str] = []
        for name, value in attrs:
            if value is None:
                continue
            name = name.lower()
            if name.startswith("on"):
                continue
            if name not in allowed:
                continue

            value = value.strip()
            if name == "href" and not value.startswith(_SAFE_URL_PREFIXES):
                continue
            if name == "target" and value not in {"_blank", "_self"}:
                continue
            if name == "rel":
                tokens = {token.lower() for token in value.split()}
                tokens &= {"noopener", "noreferrer", "nofollow"}
                if not tokens:
                    continue
                value = " ".join(sorted(tokens))

            cleaned.append(f'{name}="{html.escape(value, quote=True)}"')

        if not cleaned:
            return ""
        return " " + " ".join(cleaned)

    def handle_starttag(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> None:  # type: ignore[override]
        tag = tag.lower()
        if tag not in _ALLOWED_HTML_TAGS:
            return
        self._parts.append(f"<{tag}{self._format_attrs(tag, attrs)}>")

    def handle_endtag(self, tag: str) -> None:  # type: ignore[override]
        tag = tag.lower()
        if tag in _ALLOWED_HTML_TAGS:
            self._parts.append(f"</{tag}>")

    def handle_startendtag(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> None:  # type: ignore[override]
        tag = tag.lower()
        if tag not in _ALLOWED_HTML_TAGS:
            return
        self._parts.append(f"<{tag}{self._format_attrs(tag, attrs)}/>")

    def handle_data(self, data: str) -> None:  # type: ignore[override]
        self._parts.append(html.escape(data))

    def handle_entityref(self, name: str) -> None:  # type: ignore[override]
        self._parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:  # type: ignore[override]
        self._parts.append(f"&#{name};")

    def handle_comment(self, data: str) -> None:  # type: ignore[override]
        # No renderizamos comentarios para evitar fugas accidentales de HTML
        return

    def get_html(self) -> str:
        return "".join(self._parts)


def sanitize_html(value: str) -> str:
    parser = _SafeHTMLParser()
    parser.feed(value)
    parser.close()
    return parser.get_html()


def _sanitize_media_item(raw: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return None
    media_type = str(raw.get("type", "")).lower()
    url = raw.get("url")
    if media_type not in _ALLOWED_MEDIA_TYPES:
        return None
    if not isinstance(url, str) or not url:
        return None
    if not url.startswith(_SAFE_MEDIA_PREFIXES):
        return None

    item: Dict[str, Any] = {"type": media_type, "url": url}
    alt = raw.get("alt")
    if isinstance(alt, str) and alt.strip():
        item["alt"] = alt.strip()
    caption = raw.get("caption")
    if isinstance(caption, str) and caption.strip():
        item["caption"] = caption.strip()
    return item


def _sanitize_choices(raw: Any) -> List[Dict[str, str]]:
    if not isinstance(raw, list):
        return []
    sanitized: List[Dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        label = item.get("label")
        if not isinstance(label, str) or not label.strip():
            continue
        value = item.get("value")
        query = item.get("query")
        intent = item.get("intent")

        choice: Dict[str, str] = {"label": label.strip()}
        if isinstance(value, str) and value.strip():
            choice["value"] = value.strip()
        else:
            choice["value"] = choice["label"]
        if isinstance(query, str) and query.strip():
            choice["query"] = query.strip()
        if isinstance(intent, str) and intent.strip():
            choice["intent"] = intent.strip()
        sanitized.append(choice)
    return sanitized


def _sanitize_steps(raw: Any) -> List[str]:
    if not isinstance(raw, list):
        return []
    return [str(step).strip() for step in raw if str(step).strip()]


def _sanitize_suggestions(raw: Any) -> List[str]:
    if not isinstance(raw, list):
        return []
    return [str(item).strip() for item in raw if str(item).strip()]


def _sanitize_link(raw: Any) -> Optional[Dict[str, str]]:
    if not isinstance(raw, dict):
        return None
    label = raw.get("label")
    url = raw.get("url")
    if not isinstance(label, str) or not isinstance(url, str):
        return None
    url = url.strip()
    if not url.startswith(_SAFE_URL_PREFIXES):
        return None
    return {"label": label.strip(), "url": url}


def _sanitize_aliases(raw: Any) -> List[str]:
    if not isinstance(raw, list):
        return []
    aliases: List[str] = []
    for item in raw:
        if isinstance(item, str):
            cleaned = item.strip()
            if cleaned:
                aliases.append(cleaned)
    return aliases


class ResponseRepository:
    """Repositorio recargable de respuestas enriquecidas."""

    def __init__(self, config_path: Path) -> None:
        self._config_path = config_path
        self._lock = threading.Lock()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._alias_index: Dict[str, str] = {}
        self._mtime: Optional[float] = None
        self._load()

    def _load(self) -> None:
        with self._lock:
            if not self._config_path.exists():
                raise FileNotFoundError(f"No se encontró el archivo de respuestas: {self._config_path}")
            with self._config_path.open("r", encoding="utf-8-sig") as file:
                data = json.load(file)
            if not isinstance(data, dict):
                raise ValueError("El archivo de respuestas debe contener un objeto JSON")
            self._cache = {key: self._sanitize_payload(key, value) for key, value in data.items()}
            self._rebuild_indexes_unlocked()
            self._mtime = self._config_path.stat().st_mtime

    def _rebuild_indexes_unlocked(self) -> None:
        self._alias_index = {}
        for intent, payload in self._cache.items():
            self._register_alias(intent, intent)
            for alias in payload.get("aliases", []):
                self._register_alias(alias, intent)

    def _register_alias(self, alias: str, intent: str) -> None:
        normalized = _normalize_text(alias)
        if not normalized:
            return
        self._alias_index.setdefault(normalized, intent)

    def _ensure_latest(self) -> None:
        try:
            current_mtime = self._config_path.stat().st_mtime
        except FileNotFoundError:
            return
        if self._mtime is None or current_mtime > self._mtime:
            self._load()

    def _sanitize_payload(self, intent: str, payload: Any) -> Dict[str, Any]:
        if isinstance(payload, dict):
            sanitized: Dict[str, Any] = {"intent": intent}
            text = payload.get("text")
            if isinstance(text, str) and text.strip():
                sanitized["text"] = text.strip()

            html_content = payload.get("html")
            if isinstance(html_content, str) and html_content.strip():
                sanitized["html"] = sanitize_html(html_content)

            choices = _sanitize_choices(payload.get("choices"))
            if choices:
                sanitized["choices"] = choices

            steps = _sanitize_steps(payload.get("steps"))
            if steps:
                sanitized["steps"] = steps

            suggestions = _sanitize_suggestions(payload.get("suggestions"))
            if suggestions:
                sanitized["suggestions"] = suggestions

            link = _sanitize_link(payload.get("link"))
            if link:
                sanitized["link"] = link

            media_items: List[Dict[str, Any]] = []
            raw_media = payload.get("media")
            if isinstance(raw_media, list):
                for item in raw_media:
                    sanitized_item = _sanitize_media_item(item)
                    if sanitized_item:
                        media_items.append(sanitized_item)
            if media_items:
                sanitized["media"] = media_items

            meta = payload.get("meta")
            if isinstance(meta, dict):
                sanitized["meta"] = meta

            aliases = _sanitize_aliases(payload.get("aliases"))
            if aliases:
                sanitized["aliases"] = aliases

            return sanitized

        return {"intent": intent, "text": str(payload)}

    def get(self, intent: str) -> Optional[Dict[str, Any]]:
        self._ensure_latest()
        return self._cache.get(intent)

    def match(self, text: str) -> Optional[Dict[str, Any]]:
        if not isinstance(text, str):
            return None
        normalized = _normalize_text(text)
        if not normalized:
            return None
        self._ensure_latest()
        intent = self._alias_index.get(normalized)
        if not intent:
            return None
        return self._cache.get(intent)

    def has_intent(self, intent: str) -> bool:
        self._ensure_latest()
        return intent in self._cache

    def fallback(self) -> Dict[str, Any]:
        self._ensure_latest()
        return self._cache.get("fallback", {"intent": "fallback", "text": "No entendí, intenta otra vez."})

    def all(self) -> Dict[str, Dict[str, Any]]:
        self._ensure_latest()
        return dict(self._cache)
