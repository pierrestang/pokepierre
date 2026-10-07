// Intérieurs partagés : un modèle (src/data/builtInteriors/modeles/<id>.json, dessin complet, nom « Maison type 1 »…)
// et des pièces du jeu qui le reprennent. Le JSON d'une telle pièce est une fiche :
//   { id, name, modele: '<id du modèle>', ajouts?: { sheets: [...], cells: { '<i>': { sol?, decor?, dessus? } },
//     solid: { '<i>': 0 | 1 } }, spawn?, beds?, npcEdits? }
// `ajouts` : ses différences propres (cartons de Fort-de-France, oreiller sous Fanny, escalier bloqué…) ; une case citée
// remplace celle du modèle dans ce calque (valeur au format des cartes : -1, une case ou une pile), ses numéros de
// planche se rapportent à `ajouts.sheets`. composeInterior rend la pièce complète, au format des cartes du créateur ;
// modifier le modèle modifie toutes les pièces qui le reprennent.

export function composeInterior(room, modeles) {
  if (!room?.modele) return room;
  const m = modeles[room.modele];
  if (!m) throw new Error(`Intérieur ${room.id} : modèle « ${room.modele} » introuvable`);
  const sheets = [...m.sheets];
  const slot = (name) => {
    let k = sheets.indexOf(name);
    if (k < 0) k = sheets.push(name) - 1;
    return k;
  };
  const a = room.ajouts ?? {};
  const remap = (v) => {
    const one = (r) => (r < 0 ? r : slot(a.sheets[Math.floor(r / 100000)]) * 100000 + (r % 100000));
    return Array.isArray(v) ? v.map(one) : one(v);
  };
  const layers = { sol: [...m.layers.sol], decor: [...m.layers.decor], dessus: [...m.layers.dessus] };
  for (const [i, cell] of Object.entries(a.cells ?? {})) {
    for (const [layer, v] of Object.entries(cell)) layers[layer][Number(i)] = remap(v);
  }
  const solid = [...m.solid];
  for (const [i, v] of Object.entries(a.solid ?? {})) solid[Number(i)] = v;
  const out = { ...m, id: room.id, name: room.name ?? m.name, modele: room.modele, sheets, layers, solid };
  delete out.npcEdits;
  delete out.beds;
  for (const k of ['spawn', 'beds', 'npcEdits']) if (room[k]) out[k] = room[k];
  return out;
}
