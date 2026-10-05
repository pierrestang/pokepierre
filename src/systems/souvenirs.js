import Phaser from 'phaser';

// État global des souvenirs collectés : survit aux changements de scène et,
// via localStorage, aux rechargements de la page.
// Un souvenir : { id, name }. Écouter souvenirEvents.on('change', count => …) pour l'affichage.

const STORAGE_KEY = 'pokepierre.souvenirs';
// Nombre d'utilisations de chaque vertu (« Pierre utilise X ! »), par id : { id: n }.
const USES_KEY = 'pokepierre.traitUses';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Map(saved.map((s) => [s.id, s]));
  } catch {
    return new Map();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...collected.values()]));
  } catch {
    // Stockage indisponible (navigation privée…) : on garde au moins l'état en mémoire.
  }
}

const collected = load();

function loadUses() {
  try {
    return JSON.parse(localStorage.getItem(USES_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

let uses = loadUses();

function saveUses() {
  try {
    localStorage.setItem(USES_KEY, JSON.stringify(uses));
  } catch {
    // Stockage indisponible : le compte vaut pour cette session.
  }
}

export const souvenirEvents = new Phaser.Events.EventEmitter();

export const souvenirs = {
  // Renvoie true si le souvenir est nouveau.
  add({ id, name }) {
    if (collected.has(id)) return false;
    collected.set(id, { id, name });
    save();
    souvenirEvents.emit('change', collected.size);
    return true;
  },
  has: (id) => collected.has(id),
  count: () => collected.size,
  list: () => [...collected.values()],
  // Anciennes sauvegardes : remplace un souvenir par un autre (à la même place), ou le retire (`next` null).
  replace(id, next) {
    if (!collected.has(id)) return false;
    const entries = [...collected.values()].flatMap((s) => {
      if (s.id !== id) return [s];
      return next && !collected.has(next.id) ? [{ id: next.id, name: next.name }] : [];
    });
    collected.clear();
    entries.forEach((s) => collected.set(s.id, s));
    if (uses[id]) {
      if (next) uses[next.id] = (uses[next.id] ?? 0) + uses[id];
      delete uses[id];
      saveUses();
    }
    save();
    souvenirEvents.emit('change', collected.size);
    return true;
  },
  // Utilisations d'une vertu (« Pierre utilise X ! »).
  use(id) {
    uses[id] = (uses[id] ?? 0) + 1;
    saveUses();
  },
  uses: (id) => uses[id] ?? 0,
  // Recommencer à zéro (depuis la console : game.souvenirs.reset()).
  reset() {
    collected.clear();
    save();
    uses = {};
    saveUses();
    souvenirEvents.emit('change', 0);
  },
};
