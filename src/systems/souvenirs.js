import Phaser from 'phaser';

// État global des souvenirs collectés : survit aux changements de scène et,
// via localStorage, aux rechargements de la page.
// Un souvenir : { id, name }. Écouter souvenirEvents.on('change', count => …) pour l'affichage.

const STORAGE_KEY = 'pokepierre.souvenirs';

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
  // Recommencer à zéro (depuis la console : game.souvenirs.reset()).
  reset() {
    collected.clear();
    save();
    souvenirEvents.emit('change', 0);
  },
};
