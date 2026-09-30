import { fullLook } from '../art/characterArt.js';

// Apparence des personnages : un sprite des planches fournies, `t{n}` (TownsPeople2, avec portrait)
// ou `f{n}` (Rouge Feu / Vert Feuille, sans portrait). Voir art/spriteSheets.js pour la liste.
// Le chat reste dessiné dans le code (voir art/characterArt.js).

// Pierre : Red, le héros de Rouge Feu.
export const PIERRE = { sprite: 'f0' };

// Personnages par nom affiché.
const BY_NAME = {
  Pierre: 'f0',
  // Famille
  Maman: 't8', Papa: 't1', Manon: 't7',
  // Amis
  Jean: 't12', Felix: 'f2', Romain: 't3', Paul: 'f53', Yanis: 'f66', Ousmane: 'f72', Harsh: 'f71',
  Tom: 'f56', 'Théo': 'f57', 'Léo': 'f55', Tanguy: 'f58', Thomas: 'f20', Hugues: 'f17', Geoffrey: 'f42',
  'Benoît': 'f38', 'Étienne': 'f36', Joshua: 'f10', Laurent: 'f52',
  Margot: 'f48', Val: 't10', Anna: 'f59', Fanny: 'f46',
  // Métiers
  'M. Bouly': 'f32', Directeur: 't3', Directrice: 'f54', Manager: 'f8', Responsable: 't13',
  'Agent immobilier': 'f34', Vendeur: 'f16', Cuisinier: 'f50', 'Pêcheur': 't14', 'Vieux sage': 'f26',
  Moine: 'f24', Capitaine: 'f39', Professor: 'f3', Professeur: 'f3', Professeure: 't10',
  "Professeure d'anglais": 't9', 'Hôtesse': 'f12', 'Pèlerine': 'f29', Fan: 't5', Chanteur: 't12',
  Guitariste: 'f35', Batteur: 'f60',
};

// Figurants sans attribution (ex. les diplômés, les touristes) : choisis d'après leur id et leur place.
const EXTRAS = ['f9', 'f18', 'f19', 'f21', 'f23', 'f37', 'f53', 'f55', 'f56', 'f57', 'f59', 't0', 't5', 't12'];

function hash(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// Apparence d'un PNJ ou d'un suiveur : par nom (ou par id), sinon un figurant.
export function lookOf(data) {
  if (data.id === 'chat') return fullLook({ kind: 'cat' });
  const sprite = BY_NAME[data.name] ?? BY_NAME[capitalize(data.id)];
  return { sprite: sprite ?? EXTRAS[hash(`${data.id}:${data.x},${data.y}`) % EXTRAS.length] };
}

// Portrait affiché dans les dialogues (index TownsPeople2), ou null si la personne n'en a pas.
export function portraitOf(speaker) {
  const sprite = BY_NAME[speaker];
  return sprite?.startsWith('t') ? Number(sprite.slice(1)) : null;
}

function capitalize(id = '') {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
