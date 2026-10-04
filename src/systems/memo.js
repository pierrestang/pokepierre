// Petites valeurs libres de la partie (ex. le mot de passe de la cabane, choisi par le joueur), sauvegardées dans
// localStorage comme les drapeaux. Dans les répliques des scénettes, `{nom}` est remplacé par la valeur (voir
// MapScene.runSteps, `say`).

const STORAGE_KEY = 'pokepierre.memo';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

let values = load();
// Valeurs par défaut (ex. une partie où la fête de la cabane a eu lieu avant qu'on choisisse le mot de passe).
const DEFAULTS = { motDePasse: 'QG' };

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Stockage indisponible : la valeur reste en mémoire.
  }
}

export const memo = {
  get: (key) => values[key] ?? null,
  set(key, value) {
    values[key] = value;
    save();
  },
  reset() {
    values = {};
    save();
  },
  // Remplace `{nom}` par la valeur gardée, sinon sa valeur par défaut (laissé tel quel si aucune n'existe).
  fill: (text) => text.replace(/\{(\w+)\}/g, (all, key) => values[key] ?? DEFAULTS[key] ?? all),
};
