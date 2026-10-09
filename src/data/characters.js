import { fullLook } from '../art/characterArt.js';
import { SHEETS } from '../art/spriteSheets.js';
// Apparences choisies dans le créateur de cartes (éditeur de personnages, « partout »), par nom : { Rémy: 'g110', … }.
// Elles passent avant les attributions de BY_NAME ; le créateur les écrit via /__builder/looks (vite.config.js).
import PROJECT_LOOKS from './characterLooks.json' with { type: 'json' };

// Apparence des personnages : uniquement des personnages de la quatrième génération, `g{n}` (voir
// art/spriteSheets.js et public/assets/characters/gen4-npcs.json pour la liste et les noms).
// Le chat reste dessiné dans le code (voir art/characterArt.js).

// Apparences choisies par le joueur (menu Start > PNJ), par nom affiché : { Maman: 'g126', … }. Gardées dans
// la sauvegarde (localStorage), elles passent avant les attributions ci-dessous. Un choix fait dans une planche
// retirée depuis (Rouge Feu, Émeraude, TownsPeople) est ignoré.
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

// Pierre : Lucas, le héros de Diamant / Perle / Platine (sauf choix du joueur).
export const pierreLook = () => ({ sprite: lookChoices.get('Pierre') ?? 'g198' });

// Personnages par nom affiché (gen4-npcs.json : g126 maman, g138 Prof. Sorbier, g32 marin…).
export const BY_NAME = {
  Pierre: 'g198',
  // Famille
  Maman: 'g126', Papa: 'g119', Manon: 'g57',
  // Amis (garçons : jeunes gens des villes de Sinnoh et Johto ; filles : idem)
  Jean: 'g52', Felix: 'g93', Romain: 'g92', Prophecy: 'g94', Yanis: 'g96', Ousmane: 'g105', Harsh: 'g89',
  Tom: 'g22', 'Léo': 'g55', Tanguy: 'g56', Geoffrey: 'g41', Thomas: 'g90', Hugues: 'g121', Dalil: 'g2',
  'Inès': 'g5', Malik: 'g4', Clara: 'g15',
  'Benoît': 'g38', 'Étienne': 'g108', Joshua: 'g18',
  Margaux: 'g43', 'Rémy': 'g109', 'Rémi': 'g140', Paul: 'g86', Camille: 'g25', Val: 'g42', Anna: 'g24', Fanny: 'g49',
  Charlotte: 'g44', 'Anaïs': 'g107', Anais: 'g107',
  // Métiers
  'M. Bouly': 'g33', Militaire: 'g87', Directeur: 'g120', Directrice: 'g37', Principale: 'g37', Sentinelle: 'g87',
  Manager: 'g122', Responsable: 'g36', 'Agent immobilier': 'g35', Vendeur: 'g112', Chanteur: 'g69', Serveur: 'g63',
  'Capitaine du ferry': 'g118', 'Vieux pêcheur': 'g67', 'Vieux sage': 'g71',
  Capitaine: 'g87', Surveillant: 'g116', Professor: 'g138', Professeur: 'g138', Professeure: 'g54',
  "Professeure d'anglais": 'g106', 'Hôtesse': 'g64', Promeneuse: 'g82', Gamin: 'g59', Barman: 'g101', Leo: 'g55',
};

// Figurants sans attribution (ex. les diplômés, les touristes) : choisis d'après leur id et leur place.
const EXTRAS = ['g22', 'g24', 'g49', 'g50', 'g55', 'g57', 'g58', 'g88', 'g89', 'g90', 'g93', 'g95', 'g96', 'g98',
  'g106', 'g107', 'g108', 'g110', 'g112', 'g113'];

function hash(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// Apparence d'un PNJ ou d'un suiveur : `sprite` imposé (ex. des figurants garçons), sinon choix du joueur, sinon par nom
// (ou par id), sinon un figurant.
export function lookOf(data) {
  if (data.id === 'chat') return fullLook({ kind: 'cat' });
  if (data.id?.startsWith('poule')) return fullLook({ kind: 'hen' });
  if (data.sprite) return { sprite: data.sprite };
  const name = data.name ?? capitalize(data.id);
  const sprite = lookChoices.get(name) ?? projectLook(name) ?? BY_NAME[name] ?? BY_NAME[capitalize(data.id)];
  return { sprite: sprite ?? EXTRAS[hash(`${data.id}:${data.x},${data.y}`) % EXTRAS.length] };
}

// Sprite affiché pour un nom dans le menu PNJ : choix du joueur, attribution, sinon un figurant type.
export function spriteForName(name) {
  return lookChoices.get(name) ?? projectLook(name) ?? BY_NAME[name] ?? EXTRAS[hash(name) % EXTRAS.length];
}

// Sprite attribué par défaut (null pour un figurant).
export const defaultSpriteOf = (name) => projectLook(name) ?? BY_NAME[name] ?? null;

// Apparences du projet (characterLooks.json) ; le créateur peut en changer une sans recharger la page (setProjectLook).
const projectLooks = { ...PROJECT_LOOKS };
function projectLook(name) {
  const sprite = projectLooks[name];
  return sprite && SHEETS[sprite[0]] ? sprite : null;
}
export const projectLookOf = (name) => projectLooks[name] ?? null;
export function setProjectLook(name, sprite) {
  if (sprite) projectLooks[name] = sprite;
  else delete projectLooks[name];
}

function capitalize(id = '') {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
