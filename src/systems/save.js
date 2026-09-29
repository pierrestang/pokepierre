import { souvenirs } from './souvenirs.js';
import { flags } from './flags.js';
import { items } from './items.js';

// Position du joueur sauvegardée à chaque pas : { scene, data, spawn: { x, y, facing } }.
// `scene` + `data` suffisent à relancer la bonne scène ; les souvenirs et drapeaux
// ont leur propre sauvegarde (souvenirs.js, flags.js).

const STORAGE_KEY = 'pokepierre.position';

export function savePosition(location) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Stockage indisponible : pas de « Continuer » possible.
  }
}

export function loadPosition() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

// Une partie existe s'il y a une position, ou de la progression (ancienne sauvegarde sans position).
export const hasSave = () =>
  loadPosition() !== null || souvenirs.count() > 0 || flags.list().length > 0 || items.count() > 0;

// Efface toute la progression (position, souvenirs, drapeaux, objets).
export function eraseSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // rien à effacer
  }
  souvenirs.reset();
  flags.reset();
  items.reset();
}
