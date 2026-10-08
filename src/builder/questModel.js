// Lecture de l'histoire pour l'éditeur de personnages du créateur de cartes (src/builder/npcs.js) : les étapes de la quête
// (les drapeaux de story.js, dans l'ordre du jeu, avec leur commentaire comme libellé), qui est là à quelle étape, ce que
// fait chaque personnage (répliques, choix, objets, marches, étapes qu'il fait avancer) et ce qu'il débloque.
// Lecture seule : les scénettes vivent dans le code (src/data/*Story.js, src/data/maps/*.js).
import { MAPS } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';
import { FLAGS, ITEMS } from '../data/story.js';
import storySource from '../data/story.js?raw';

export const ORDER = Object.values(FLAGS);
const RANK = new Map(ORDER.map((f, i) => [f, i]));

// Libellés des étapes : le commentaire de chaque drapeau dans story.js (« Papa a lancé… »), sinon son nom.
const LABELS = (() => {
  const out = {};
  const block = storySource.slice(storySource.indexOf('export const FLAGS'), storySource.indexOf('};', storySource.indexOf('export const FLAGS')));
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*\w+:\s*'([^']+)',\s*(?:\/\/\s*(.*))?$/);
    if (m) out[m[1]] = (m[2] ?? '').trim();
  }
  return out;
})();
export const flagLabel = (f) => LABELS[f] || f.replace(/-/g, ' ');

const ITEM_NAMES = Object.fromEntries(Object.values(ITEMS).filter((i) => i?.id).map((i) => [i.id, i.name ?? i.id]));
const itemName = (i) => (typeof i === 'string' ? ITEM_NAMES[i] ?? i : i?.name ?? i?.id ?? '?');

export const flagsOk = (c, raised) => (c.ifFlags ?? []).every((f) => raised.has(f)) && !(c.unlessFlags ?? []).some((f) => raised.has(f));
// Les drapeaux levés à l'étape k (0 : le tout début du jeu).
export const raisedAt = (k) => new Set(ORDER.slice(0, k));

// Les drapeaux cités par un objet (conditions, drapeaux posés), en profondeur.
function flagsIn(root) {
  const out = new Set();
  const seen = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    for (const k of ['ifFlags', 'unlessFlags', 'then']) for (const f of node[k] ?? []) if (RANK.has(f)) out.add(f);
    if (RANK.has(node.setFlag)) out.add(node.setFlag);
    for (const v of Object.values(node)) walk(v);
  }(root));
  return out;
}

// Les étapes utiles à un lieu : les drapeaux qu'il cite, dans l'ordre du jeu. Chaque étape k = « juste après ce drapeau ».
export function stepsOf(place) {
  return [...flagsIn({ npcs: place.npcs, doors: place.doors, props: place.props, triggers: place.triggers,
    objects: place.objects, events: place.events, enter: place.enter })].sort((a, b) => RANK.get(a) - RANK.get(b));
}
export const rankOf = (f) => RANK.get(f) ?? -1;

// Les lieux du jeu : cartes et intérieurs, avec leur nom.
const PLACES = [
  ...Object.values(MAPS).map((m) => ({ id: m.id, name: m.name, place: m })),
  ...Object.entries(interiors).map(([id, m]) => ({ id, name: m.name ?? id, place: m })),
];

// Qui fait avancer chaque étape (setFlag, `then` d'une marche), partout dans le jeu : { drapeau: [{ who, where }] }.
let SETTERS = null;
function setters() {
  if (SETTERS) return SETTERS;
  SETTERS = {};
  const add = (f, who, where) => {
    if (!RANK.has(f)) return;
    const list = (SETTERS[f] ??= []);
    if (!list.some((s) => s.who === who && s.where === where)) list.push({ who, where });
  };
  for (const { name, place } of PLACES) {
    const seen = new Set();
    const walk = (node, who) => {
      if (!node || typeof node !== 'object' || seen.has(node)) return;
      seen.add(node);
      if (node.setFlag) add(node.setFlag, who, name);
      for (const f of node.then ?? []) add(f, who, name);
      for (const v of Object.values(node)) walk(v, who);
    };
    for (const n of place.npcs ?? []) walk(n, n.name ?? n.id);
    for (const o of place.objects ?? []) walk(o, 'un objet');
    for (const d of place.doors ?? []) walk(d, 'une porte');
    for (const t of place.triggers ?? []) walk(t, 'une scène au passage');
    walk(place.events, 'une scène');
    walk(place.enter, 'l\'arrivée');
  }
  return SETTERS;
}
export const settersOf = (f) => setters()[f] ?? [];

// ---------- Ce que fait un personnage ----------

const clip = (s, n = 70) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const condText = (s) => {
  const parts = [];
  if (s.ifFlags?.length) parts.push(`après « ${s.ifFlags.map(flagLabel).join(' » et « ')} »`);
  if (s.unlessFlags?.length) parts.push(`avant « ${s.unlessFlags.map(flagLabel).join(' » et « ')} »`);
  if (s.ifItems?.length) parts.push(`si Pierre a ${s.ifItems.map(itemName).join(', ')}`);
  if (s.unlessItems?.length) parts.push(`si Pierre n'a pas ${s.unlessItems.map(itemName).join(', ')}`);
  if (s.ifSouvenirs?.length) parts.push('avec un souvenir');
  return parts.join(', ');
};

// Les actions d'une scénette, lisibles : [{ icon, text, depth, kind }]. kind : 'say', 'flag', 'item', 'walk', 'choice'…
export function describeSteps(steps, depth = 0, out = []) {
  for (const s of steps ?? []) {
    if (!s || typeof s !== 'object') continue;
    const cond = condText(s);
    if (cond) out.push({ icon: '⑂', text: `Seulement ${cond} :`, depth, kind: 'cond' });
    const d = cond ? depth + 1 : depth;
    if (s.say) {
      const line = Array.isArray(s.say) ? s.say[0] : s.say;
      out.push({ icon: '💬', text: `${s.speaker ? `${s.speaker} : ` : ''}« ${clip(line)} »${Array.isArray(s.say) && s.say.length > 1 ? ` (+${s.say.length - 1})` : ''}`, depth: d, kind: 'say' });
    }
    if (s.text && !s.say && !s.give) out.push({ icon: '📝', text: clip(s.text), depth: d, kind: 'say' });
    if (s.choose) {
      out.push({ icon: '❓', text: `Choix : ${clip(s.choose, 60)}`, depth: d, kind: 'choice' });
      for (const c of s.choices ?? []) {
        out.push({ icon: '→', text: c.label, depth: d + 1, kind: 'choice' });
        describeSteps(c.steps, d + 2, out);
      }
    }
    if (s.quiz) out.push({ icon: '❓', text: 'Quiz', depth: d, kind: 'choice' });
    if (s.darts) out.push({ icon: '🎯', text: 'Partie de fléchettes', depth: d, kind: 'choice' });
    if (s.give) out.push({ icon: '🎁', text: `Donne : ${itemName(s.give)}`, depth: d, kind: 'item' });
    if (s.take) out.push({ icon: '📦', text: `Reprend : ${itemName(s.take)}`, depth: d, kind: 'item' });
    if (s.trait) out.push({ icon: '⭐', text: `Vertu : ${s.trait.name ?? s.trait}`, depth: d, kind: 'item' });
    if (s.useTrait) out.push({ icon: '⭐', text: `Demande la vertu ${s.useTrait.name ?? s.useTrait}`, depth: d, kind: 'item' });
    if (s.walk) out.push({ icon: '👣', text: `${s.walk} marche vers (${s.to?.join(', ')})`, depth: d, kind: 'walk' });
    if (s.travel) out.push({ icon: '🚪', text: `Emmène vers ${s.travel.interior ?? s.travel.map ?? 'ailleurs'}`, depth: d, kind: 'walk' });
    if (s.setFlag) out.push({ icon: '🏁', text: `Fait avancer : ${flagLabel(s.setFlag)}`, depth: d, kind: 'flag' });
    for (const f of s.then ?? []) out.push({ icon: '🏁', text: `Fait avancer : ${flagLabel(f)}`, depth: d, kind: 'flag' });
    if (s.end) out.push({ icon: '■', text: 'Fin de la scène', depth: d, kind: 'end' });
    if (Array.isArray(s.steps)) describeSteps(s.steps, d, out);
  }
  return out;
}

// La fiche d'un personnage : rôle, présence, actions.
export function describeNpc(npc) {
  const appears = (npc.ifFlags ?? []).map(flagLabel);
  const leaves = (npc.unlessFlags ?? []).map(flagLabel);
  let actions;
  if (npc.script) actions = describeSteps(npc.script);
  else if (npc.dialogue) actions = describeSteps([{ say: npc.dialogue, speaker: npc.name }]);
  else actions = [];
  if (npc.give || npc.item) actions.push({ icon: '🎁', text: `Donne : ${itemName(npc.give ?? npc.item)}`, depth: 0, kind: 'item' });
  if (npc.setFlag) actions.push({ icon: '🏁', text: `Fait avancer : ${flagLabel(npc.setFlag)}`, depth: 0, kind: 'flag' });
  const traits = [];
  if (npc.dancing) traits.push('danse');
  if (npc.fidget) traits.push('s\'agite');
  if (npc.pace || npc.route) traits.push('fait les cent pas');
  if (npc.inBed) traits.push('au lit');
  if (npc.still) traits.push('immobile');
  return { appears, leaves, actions, traits };
}

// Les drapeaux qu'un personnage fait avancer (ses scénettes).
export function flagsSetBy(npc) {
  const out = new Set();
  const seen = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (RANK.has(node.setFlag)) out.add(node.setFlag);
    for (const f of node.then ?? []) if (RANK.has(f)) out.add(f);
    for (const v of Object.values(node)) walk(v);
  }(npc));
  return [...out];
}

// Ce qu'un personnage débloque dans ce lieu : les PNJ, portes, objets et décors dont les conditions citent un drapeau
// qu'il fait avancer. [{ x, y, what, flag, how: 'apparaît' | 'disparaît' | 'change' }]
export function unlockedBy(npc, place) {
  const set = new Set(flagsSetBy(npc));
  if (!set.size) return [];
  const out = [];
  const check = (o, what) => {
    if (o === npc || !Number.isInteger(o.x)) return;
    const when = o.when ?? o;
    for (const f of when.ifFlags ?? []) if (set.has(f)) out.push({ x: o.x, y: o.y, w: o.w, h: o.h, what, flag: f, how: 'apparaît' });
    for (const f of when.unlessFlags ?? []) if (set.has(f)) out.push({ x: o.x, y: o.y, w: o.w, h: o.h, what, flag: f, how: 'disparaît' });
  };
  for (const n of place.npcs ?? []) if (n.id !== npc.id) check(n, n.name ?? n.id);
  for (const d of place.doors ?? []) check(d, d.interior ? `porte (${d.interior})` : 'porte');
  for (const p of place.props ?? []) check(p, p.type ?? 'décor');
  for (const o of place.objects ?? []) check(o, 'objet');
  for (const t of place.triggers ?? []) check(t, 'scène au passage');
  return out;
}

// Les marches d'un personnage dans les scènes de ce lieu (et ses propres scénettes) : [[x, y], …] dans l'ordre trouvé.
export function walksOf(npcId, place) {
  const out = [];
  const seen = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (node.walk === npcId && Array.isArray(node.to)) out.push({ to: node.to, flag: (node.then ?? [])[0] });
    for (const v of Object.values(node)) walk(v);
  }({ npcs: place.npcs, triggers: place.triggers, doors: place.doors, objects: place.objects, events: place.events, enter: place.enter }));
  return out;
}
