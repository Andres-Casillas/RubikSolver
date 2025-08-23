// Incluye este archivo ANTES del script de Manual.html
import { KEYS, getEmptyMatrix, writeJSON } from './rubik-storage.js';

// Si existe una señal de reset, forza arranque en blanco (gris)
const resetTs = Number(localStorage.getItem(KEYS.resetEpoch) || '0');
if (resetTs) {
    localStorage.removeItem(KEYS.manualProgress);
    writeJSON(KEYS.manualMatrix, getEmptyMatrix());
}