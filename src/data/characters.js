import { fullLook } from '../art/characterArt.js';
import { SHEETS } from '../art/spriteSheets.js';
import { BY_NAME, EXTRAS } from './looks.js';
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

// Les attributions par nom (BY_NAME) et les figurants (EXTRAS) sont dans data/looks.js (sans Phaser : check_paths.js et le
// créateur les lisent aussi).
export { BY_NAME };

function hash(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// Apparence d'un PNJ ou d'un suiveur : le choix du joueur (Start > PNJ), sinon l'apparence choisie dans le créateur pour
// son nom (characterLooks.json, panneau PNJ), sinon `sprite` imposé (ex. des figurants garçons), sinon par nom (ou par
// id), sinon un figurant. `lookName` : le nom sous lequel chercher son apparence quand deux personnages portent le même prénom
// (« Camille (Paris) »).
export function lookOf(data) {
  if (data.id === 'chat') return fullLook({ kind: 'cat' });
  if (data.id?.startsWith('poule')) return fullLook({ kind: 'hen' });
  const name = data.lookName ?? data.name ?? capitalize(data.id);
  const chosen = lookChoices.get(name) ?? projectLook(name);
  if (chosen) return { sprite: chosen };
  if (data.sprite) return { sprite: data.sprite };
  const sprite = BY_NAME[name] ?? BY_NAME[capitalize(data.id)];
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
