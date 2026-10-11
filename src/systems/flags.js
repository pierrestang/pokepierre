import { items } from './items.js';
import { souvenirs } from './souvenirs.js';
import { memo } from './memo.js';
import { persist } from './persist.js';

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

// Drapeaux déjà écrits dans la sauvegarde mais pas encore levés en mémoire : ceux qu'un PNJ lèvera en arrivant au bout
// de sa marche (MapScene.walkNpc `then`). Si l'onglet se ferme pendant la marche, la partie reprend comme s'il était
// arrivé.
const ahead = new Set();

function write() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...raised, ...ahead])]));
  } catch {
    // Stockage indisponible : l'état reste en mémoire.
  }
}
// Écrit tout de suite hors scène, à la fin de la scène pendant une scénette (systems/persist.js).
const save = () => persist('flags', write);

const raised = load();

export const flags = {
  has: (name) => raised.has(name),
  add(name) {
    raised.add(name);
    save();
  },
  list: () => [...raised],
  // Retire un drapeau (migration d'une ancienne sauvegarde, systems/save.js).
  remove(name) {
    if (!raised.delete(name)) return;
    save();
  },
  // Drapeaux que l'histoire lèvera à coup sûr un peu plus tard (fin d'une marche) : écrits dès maintenant.
  saveAhead(names) {
    names.forEach((n) => ahead.add(n));
    save();
  },
  reset() {
    raised.clear();
    ahead.clear();
    write();
  },
};

// Conditions d'apparition communes (PNJ, suiveurs, événements, portes, passages) :
//   ifFlags : tous doivent être levés ; unlessFlags : aucun ne doit l'être ;
//   ifItems : le joueur doit posséder tous ces objets ;
//   ifSouvenirs : le joueur doit avoir tous ces souvenirs ;
//   unlessItems / unlessSouvenirs : il ne doit en avoir aucun ;
//   anyOf : liste de conditions, il suffit que l'une soit remplie (ex. la nuit de deux soirs différents) ;
//   unlessMemo : { clé: valeur } — aucune de ces valeurs libres (systems/memo.js) ne doit être celle-là (ex. ne pas
//   proposer le vol pour la ville dont on est parti : { aeroport: 'paris' }).
export function meetsConditions({
  ifFlags = [], unlessFlags = [], ifItems = [], unlessItems = [], ifSouvenirs = [], unlessSouvenirs = [], anyOf = null,
  unlessMemo = null,
} = {}) {
  return (
    (!unlessMemo || !Object.entries(unlessMemo).some(([k, v]) => memo.get(k) === v)) &&
    (!anyOf || anyOf.some((c) => meetsConditions(c))) &&
    ifFlags.every(flags.has) &&
    !unlessFlags.some(flags.has) &&
    ifItems.every(items.has) &&
    !unlessItems.some(items.has) &&
    ifSouvenirs.every(souvenirs.has) &&
    !unlessSouvenirs.some(souvenirs.has)
  );
}
