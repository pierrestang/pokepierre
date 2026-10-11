import { souvenirs } from './souvenirs.js';
import { flags } from './flags.js';
import { items } from './items.js';
import { memo } from './memo.js';
import { TRAIT_MIGRATION } from '../data/story.js';
import { BIKE_KEY } from './bike.js';

// Position du joueur sauvegardée à chaque pas : { scene, data, spawn: { x, y, facing } }.
// `scene` + `data` suffisent à relancer la bonne scène ; les souvenirs et drapeaux
// ont leur propre sauvegarde (souvenirs.js, flags.js).

const STORAGE_KEY = 'pokepierre.position';
// Version de la sauvegarde : à augmenter, avec une étape dans MIGRATIONS, quand la structure des données change.
//   1 (ou absente) : avant le 11 octobre 2026 ; 2 : sauvegarde par scène (systems/persist.js), drapeaux nettoyés.
export const SAVE_VERSION = 2;
const VERSION_KEY = 'pokepierre.version';

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
    localStorage.removeItem(BIKE_KEY);                  // une nouvelle partie ne reprend pas « à vélo »
    localStorage.setItem(VERSION_KEY, String(SAVE_VERSION));
  } catch {
    // rien à effacer
  }
  souvenirs.reset();
  flags.reset();
  items.reset();
  memo.reset();
}

function savedVersion() {
  try {
    return Number(localStorage.getItem(VERSION_KEY) ?? 1) || 1;
  } catch {
    return SAVE_VERSION;
  }
}

// Les étapes de migration, de la version n à n + 1.
const MIGRATIONS = {
  // 1 -> 2 : drapeaux d'étapes retirées du jeu (Felix devant la voiture, Clara à Paris) ; la vieille canne et la pierre
  // gravée sont déjà converties au chargement du sac (systems/items.js).
  1: () => ['felix-voiture', 'place-clara'].forEach((f) => flags.remove(f)),
};

// Anciennes sauvegardes (avant le passage à 8 vertus, voir data/story.js TRAIT_MIGRATION) : vertus renommées
// converties, vertus retirées supprimées (leur scène reste marquée faite par un drapeau). Sans effet sur une
// sauvegarde récente : on peut l'appeler à chaque démarrage.
export function migrateSave() {
  for (let v = savedVersion(); v < SAVE_VERSION; v++) MIGRATIONS[v]?.();
  try {
    localStorage.setItem(VERSION_KEY, String(SAVE_VERSION));
  } catch {
    // Stockage indisponible : la migration se refera au prochain démarrage (sans effet).
  }
  for (const [id, trait] of Object.entries(TRAIT_MIGRATION.renamed)) souvenirs.replace(id, trait);
  for (const [id, flag] of Object.entries(TRAIT_MIGRATION.removed)) {
    if (souvenirs.has(id) && flag) flags.add(flag);
    souvenirs.replace(id, null);
  }
}
