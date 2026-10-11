// Sauvegarde par scène : pendant une scénette, les drapeaux, objets, vertus et valeurs du memo changent tout de suite en
// mémoire (les PNJ apparaissent et partent au bon moment), mais ne sont écrits dans localStorage qu'à la fin de la
// scène, tous ensemble (MapScene.runScript : beginScene / endScene). Si l'onglet se ferme au milieu, rien de la scène
// n'est enregistré : elle se rejoue entièrement au rechargement, au lieu de laisser un drapeau « déjà vue » sans le
// drapeau qui fait avancer l'histoire. Hors scène, chaque écriture part tout de suite, comme avant.

let depth = 0;
const pending = new Map();               // magasin -> fonction d'écriture (la dernière demandée suffit)

// Une écriture : tout de suite hors scène, à la fin de la scène sinon.
export function persist(store, write) {
  if (depth > 0) pending.set(store, write);
  else write();
}

export function beginScene() {
  depth += 1;
}

// Fin de scène : toutes les écritures en attente partent ensemble.
export function endScene() {
  depth = Math.max(0, depth - 1);
  if (depth > 0) return;
  const writes = [...pending.values()];
  pending.clear();
  writes.forEach((write) => write());
}
