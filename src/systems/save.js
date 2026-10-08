import { souvenirs } from './souvenirs.js';
import { flags } from './flags.js';
import { items } from './items.js';
import { memo } from './memo.js';
import { TRAIT_MIGRATION } from '../data/story.js';

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

// Efface toute la progression (position, souvenirs, drapeaux, objets, valeurs libres).
export function eraseSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // rien à effacer
  }
  souvenirs.reset();
  flags.reset();
  items.reset();
  memo.reset();
}

// Anciennes sauvegardes (avant le passage à 8 vertus, voir data/story.js TRAIT_MIGRATION) : vertus renommées
// converties, vertus retirées supprimées (leur scène reste marquée faite par un drapeau). Sans effet sur une
// sauvegarde récente : on peut l'appeler à chaque démarrage.
export function migrateSave() {
  for (const [id, trait] of Object.entries(TRAIT_MIGRATION.renamed)) souvenirs.replace(id, trait);
  for (const [id, flag] of Object.entries(TRAIT_MIGRATION.removed)) {
    if (souvenirs.has(id) && flag) flags.add(flag);
    souvenirs.replace(id, null);
  }
}
