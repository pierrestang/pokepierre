// Petites valeurs libres de la partie (ex. le mot de passe de la cabane, choisi par le joueur), sauvegardées dans
// localStorage comme les drapeaux. Dans les répliques des scénettes, `{nom}` est remplacé par la valeur, et
// `{nom|défaut}` par la valeur ou, faute de valeur, par `défaut` (voir MapScene.runSteps, `say`).

const STORAGE_KEY = 'pokepierre.memo';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

let values = load();

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
  // Remplace `{nom}` / `{nom|défaut}` par la valeur gardée, sinon le défaut (laissé tel quel s'il n'y en a pas).
  fill: (text) => text.replace(/\{(\w+)(?:\|([^}]*))?\}/g, (all, key, fallback) => values[key] ?? fallback ?? all),
};
