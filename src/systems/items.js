import Phaser from 'phaser';

// Objets du joueur (baccalauréat, clés…) : distincts des souvenirs, ils servent à ouvrir
// des portes et des passages (conditions `ifItems`). Sauvegardés dans localStorage.
// Un objet : { id, name }. Écouter itemEvents.on('change', count => …) pour l'affichage.

const STORAGE_KEY = 'pokepierre.items';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Map(saved.map((i) => [i.id, i]));
  } catch {
    return new Map();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...owned.values()]));
  } catch {
    // Stockage indisponible : l'état reste en mémoire.
  }
}

const owned = load();

export const itemEvents = new Phaser.Events.EventEmitter();

export const items = {
  // Renvoie true si l'objet est nouveau.
  add({ id, name }) {
    if (owned.has(id)) return false;
    owned.set(id, { id, name });
    save();
    itemEvents.emit('change', owned.size);
    return true;
  },
  // Retire un objet (donné à quelqu'un). Renvoie true s'il était possédé.
  remove(id) {
    if (!owned.delete(id)) return false;
    save();
    itemEvents.emit('change', owned.size);
    return true;
  },
  has: (id) => owned.has(id),
  count: () => owned.size,
  list: () => [...owned.values()],
  reset() {
    owned.clear();
    save();
    itemEvents.emit('change', 0);
  },
};
