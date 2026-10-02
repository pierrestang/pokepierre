import { fullLook } from '../art/characterArt.js';
import { PORTRAITS, EMERALD_PORTRAITS, SHEETS } from '../art/spriteSheets.js';

// Apparence des personnages : un sprite des planches fournies, `t{n}` (TownsPeople2, avec portrait)
// ou `f{n}` (Rouge Feu / Vert Feuille, sans portrait). Voir art/spriteSheets.js pour la liste.
// Le chat reste dessiné dans le code (voir art/characterArt.js).

// Apparences choisies par le joueur (menu Start > PNJ), par nom affiché : { Maman: 't3', … }. Gardées dans
// la sauvegarde (localStorage), elles passent avant les attributions ci-dessous. Un choix fait dans une planche
// retirée depuis (ex. les sprites DS) est ignoré.
const LOOKS_KEY = 'pokepierre.looks';
function loadLooks() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOOKS_KEY) ?? '{}');
    return Object.fromEntries(Object.entries(saved).filter(([, sprite]) => SHEETS[sprite[0]]));
  } catch {
    return {};
  }
}
const chosen = loadLooks();
export const lookChoices = {
  get: (name) => chosen[name] ?? null,
  // `sprite` null : retour à l'apparence par défaut.
  set(name, sprite) {
    if (sprite) chosen[name] = sprite;
    else delete chosen[name];
    try {
      localStorage.setItem(LOOKS_KEY, JSON.stringify(chosen));
    } catch {
      // Stockage indisponible : le choix vaut pour cette session.
    }
  },
};

// Pierre : Red, le héros de Rouge Feu (sauf choix du joueur).
export const pierreLook = () => ({ sprite: lookChoices.get('Pierre') ?? 'f0' });

// Personnages par nom affiché.
export const BY_NAME = {
  Pierre: 'f0',
  // Famille
  Maman: 't8', Papa: 't1', Manon: 't7',
  // Amis
  Jean: 't12', Felix: 'f2', Romain: 't3', Paul: 'f53', Yanis: 'f66', Ousmane: 'f72', Harsh: 'f71',
  Tom: 'f56', 'Théo': 'f57', 'Léo': 'f55', Tanguy: 'f58', Thomas: 'f20', Hugues: 'f17', Geoffrey: 'f42',
  'Benoît': 'f38', 'Étienne': 'f36', Joshua: 'f10', Laurent: 'f52',
  Margaux: 'f48', Val: 't10', Anna: 'f59', Fanny: 'f18', Charlotte: 'f45', 'Anaïs': 'f47', Anais: 'f47',
  // Métiers
  'M. Bouly': 'f32', Directeur: 't3', Directrice: 'f54', Manager: 'f8', Responsable: 't13',
  'Agent immobilier': 'f34', Vendeur: 'f16', Cuisinier: 'f50', 'Pêcheur': 'f43', 'Vieux sage': 'f26',
  Moine: 'f24', Capitaine: 'f39', Professor: 'f3', Professeur: 'f3', Professeure: 't10',
  "Professeure d'anglais": 't9', 'Hôtesse': 'f12', 'Pèlerine': 'f29', Fan: 't5', Chanteur: 't12',
  Guitariste: 'f35', Batteur: 'f60', Promeneuse: 'f29', Gamin: 'f9', Barman: 'f38', Leo: 'f55',
};

// Figurants sans attribution (ex. les diplômés, les touristes) : choisis d'après leur id et leur place.
const EXTRAS = ['f9', 'f46', 'f19', 'f21', 'f23', 'f37', 'f53', 'f55', 'f56', 'f57', 'f59', 't0', 't5', 't12'];

function hash(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// Apparence d'un PNJ ou d'un suiveur : choix du joueur, sinon par nom (ou par id), sinon un figurant.
export function lookOf(data) {
  if (data.id === 'chat') return fullLook({ kind: 'cat' });
  if (data.id?.startsWith('poule')) return fullLook({ kind: 'hen' });
  const name = data.name ?? capitalize(data.id);
  const sprite = lookChoices.get(name) ?? BY_NAME[name] ?? BY_NAME[capitalize(data.id)];
  return { sprite: sprite ?? EXTRAS[hash(`${data.id}:${data.x},${data.y}`) % EXTRAS.length] };
}

// Sprite affiché pour un nom dans le menu PNJ : choix du joueur, attribution, sinon un figurant type.
export function spriteForName(name) {
  return lookChoices.get(name) ?? BY_NAME[name] ?? EXTRAS[hash(name) % EXTRAS.length];
}

// Sprite attribué par défaut (null pour un figurant).
export const defaultSpriteOf = (name) => BY_NAME[name] ?? null;

// Portraits venant d'ailleurs que TownsPeople2 : dresseurs d'Émeraude (`colonne,rangée`).
const EMERALD_PORTRAIT_BY_NAME = {
  'Pêcheur': '6,0',
};

// Portrait affiché dans les dialogues : { key, frame } (texture et image), ou null si la personne n'en a pas.
export function portraitOf(speaker) {
  const choice = lookChoices.get(speaker);
  if (!choice && EMERALD_PORTRAIT_BY_NAME[speaker]) return { key: EMERALD_PORTRAITS, frame: `e${EMERALD_PORTRAIT_BY_NAME[speaker]}` };
  const sprite = choice ?? BY_NAME[speaker];
  return sprite?.startsWith('t') ? { key: PORTRAITS, frame: `p${sprite.slice(1)}` } : null;
}

function capitalize(id = '') {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
