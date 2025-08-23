// Módulo de utilidades y claves centralizadas
export const KEYS = {
  manualMatrix: 'rubik.manualMatrix3D',
  cameraMatrix: 'rubik.cameraMatrix3D',
  manualProgress: 'rubik.manual.progress',   // si tu Manual guarda progreso, lo unificamos
  resetEpoch: 'rubik.resetEpoch'             // bandera global de reset
};

export function getEmptyMatrix() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill('N'))
  );
}

export function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function clearAll(opts = {}) {
  localStorage.removeItem(KEYS.manualMatrix);
  localStorage.removeItem(KEYS.cameraMatrix);
  localStorage.removeItem(KEYS.manualProgress);
  sessionStorage.removeItem(KEYS.manualMatrix);
  sessionStorage.removeItem(KEYS.cameraMatrix);
  const ts = Date.now();
  localStorage.setItem(KEYS.resetEpoch, String(ts));

  if (opts.apply3D) {
    const empty = getEmptyMatrix();
    // Notifica al 3D y a cualquier listener
    window.dispatchEvent(new CustomEvent('rubik:matrix3d', { detail: empty }));
  }
  return ts;
}

export function onReset(callback) {
  window.addEventListener('storage', (e) => {
    if (e.key === KEYS.resetEpoch) callback?.(Number(e.newValue || '0'));
  });
}

export function getOrInitManualMatrix() {
  const m = readJSON(KEYS.manualMatrix, null);
  if (m && Array.isArray(m) && m.length === 6) return m;
  const empty = getEmptyMatrix();
  writeJSON(KEYS.manualMatrix, empty);
  return empty;
}