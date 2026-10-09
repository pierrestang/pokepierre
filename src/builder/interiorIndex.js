// Les intérieurs du jeu rangés par ville, pour le créateur de cartes (« Ouvrir ») : la ville d'un intérieur est la carte
// dont une porte y mène (puis, de proche en proche, les étages et pièces voisines : escaliers, passages) ; à défaut, la
// carte dont une scénette y emmène (voyage). Les pièces partagées (même dessin) sont les modèles :
// src/data/builtInteriors/modeles et scripts/interior_models.py.
import { MAPS } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';

// Les identifiants d'intérieurs cités sous `interior` (portes, passages, voyages) dans un objet, en profondeur.
function interiorRefs(root, { deep }) {
  const out = [];
  const seen = new Set();
  (function walk(node, depth) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (typeof node.interior === 'string') out.push(node.interior);
    if (!deep && depth > 2) return;
    for (const v of Object.values(node)) walk(v, depth + 1);
  }(root, 0));
  return out;
}

// Type de chaque pièce (« Ouvrir » : classer par type, pour voir toutes les chambres, toutes les cabanes…), dans l'ordre.
export const TYPES = [
  ['salon', 'Rez-de-chaussée et salons', ['ffHouse', 'playerHouse', 'montHouse', 'felixHouse', 'hullHouse', 'hanoiHome',
    'maisonCommune', 'appartement', 'studioPaulfit', 'appartRemi', 'hullColoc', 'parisAppart']],
  ['chambre', 'Chambres et dortoirs', ['ffHouseUp', 'playerHouseUp', 'montHouseUp', 'dortoir', 'dortoirEtage2']],
  ['cabane', 'Cabanes et tentes', ['cabane']],
  ['atelier', 'Ateliers et granges', ['ffHut', 'boulyBarn']],
  ['ecole', 'Écoles et universités', ['school', 'bonsecours', 'bonsecoursCasiers', 'bonsecoursMaths', 'bonsecoursFrancais',
    'bonsecoursSciences', 'dortoirHall', 'kedge', 'kedgeCasiers', 'kedgeSalle1', 'kedgeSalle2', 'kedgeSalle3', 'hullUniversity',
    'hullLibrary']],
  ['bureau', 'Bureaux et agences', ['agence', 'travelAgency', 'corning', 'entreprise', 'entrepriseManager', 'entrepriseDirecteur']],
  ['sortie', 'Bars, cafés et salles', ['hullPubA', 'hullPubB', 'hullAsylum', 'coffeeShop', 'stade', 'delhiCour']],
  ['temple', 'Temples', ['temple']],
  ['sante', 'Santé', ['hospital']],
];
const TYPE_OF = Object.fromEntries(TYPES.flatMap(([, label, ids]) => ids.map((id) => [id, label])));
export const typeOf = (id) => TYPE_OF[id] ?? 'Autres';

let cache = null;
export function interiorIndex() {
  if (cache) return cache;
  const city = {};          // id d'intérieur -> nom de la carte
  const order = [];         // les villes, dans l'ordre du jeu
  const maps = Object.values(MAPS);
  const assign = (id, name) => {
    if (!interiors[id] || city[id]) return false;
    city[id] = name;
    if (!order.includes(name)) order.push(name);
    return true;
  };
  // 1. Portes et passages des cartes, puis de proche en proche dans les intérieurs.
  const queue = [];
  for (const m of maps) {
    for (const d of m.doors ?? []) if (d.interior && assign(d.interior, m.name)) queue.push(d.interior);
    for (const t of m.triggers ?? []) if (t.warp?.interior && assign(t.warp.interior, m.name)) queue.push(t.warp.interior);
  }
  while (queue.length) {
    const id = queue.shift();
    const room = interiors[id];
    const links = [...(room.doors ?? []).map((d) => d.interior), ...(room.triggers ?? []).map((t) => t.warp?.interior)];
    for (const to of links) if (to && assign(to, city[id])) queue.push(to);
  }
  // 2. Voyages des scénettes : la carte qui y emmène, puis l'intérieur qui y emmène.
  for (const m of maps) for (const id of interiorRefs(m, { deep: true })) assign(id, m.name);
  for (const [from, room] of Object.entries(interiors)) {
    for (const id of interiorRefs(room, { deep: true })) if (city[from]) assign(id, city[from]);
  }
  for (const id of Object.keys(interiors)) assign(id, 'Autres');
  cache = { city, order };
  return cache;
}
