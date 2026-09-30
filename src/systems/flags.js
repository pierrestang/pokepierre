import { items } from './items.js';
import { souvenirs } from './souvenirs.js';

// Drapeaux d'histoire (« la famille te suit », « parti de Fort-de-France »…).
// État global sauvegardé dans localStorage, comme les souvenirs.

const STORAGE_KEY = 'pokepierre.flags';

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...raised]));
  } catch {
    // Stockage indisponible : l'état reste en mémoire.
  }
}

const raised = load();

export const flags = {
  has: (name) => raised.has(name),
  add(name) {
    raised.add(name);
    save();
  },
  list: () => [...raised],
  reset() {
    raised.clear();
    save();
  },
};

// Conditions d'apparition communes (PNJ, suiveurs, événements, portes, passages) :
//   ifFlags : tous doivent être levés ; unlessFlags : aucun ne doit l'être ;
//   ifItems : le joueur doit posséder tous ces objets ;
//   ifSouvenirs : le joueur doit avoir tous ces souvenirs ;
//   unlessItems / unlessSouvenirs : il ne doit en avoir aucun.
export function meetsConditions({
  ifFlags = [], unlessFlags = [], ifItems = [], unlessItems = [], ifSouvenirs = [], unlessSouvenirs = [],
} = {}) {
  return (
    ifFlags.every(flags.has) &&
    !unlessFlags.some(flags.has) &&
    ifItems.every(items.has) &&
    !unlessItems.some(items.has) &&
    ifSouvenirs.every(souvenirs.has) &&
    !unlessSouvenirs.some(souvenirs.has)
  );
}
