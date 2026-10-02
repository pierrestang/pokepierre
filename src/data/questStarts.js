import { MAPS } from './maps/index.js';
import { interiors } from './maps/interiors.js';
import { FLAGS, visitedFlag } from './story.js';

// Début de la quête de chaque ville (menu Start > QUÊTES, pour tester sans tout rejouer) : on arrive comme
// si on venait de finir la ville précédente.
//   upTo : dernier drapeau de story.js levé (tous ceux d'avant aussi, dans l'ordre de FLAGS) ;
//   maps : cartes de la ville (avec leurs intérieurs) — les souvenirs et objets des villes précédentes sont
//          donnés, sauf ceux qui dépendent d'un drapeau pas encore levé ; les objets rendus en route sont retirés ;
//   go   : point d'arrivée ({ map, x, y, facing }, ou { interior, fromMap } pour un intérieur).
export const QUEST_STARTS = [
  { label: 'FORT-DE-FRANCE', maps: ['fortDeFrance'], go: { interior: 'ffHouseUp', fromMap: 'fortDeFrance' } },
  { label: 'SAINT-AY', maps: ['saintAy'], upTo: FLAGS.coquillageTrouve, go: { map: 'saintAy', x: 5, y: 10, facing: 'left' } },
  { label: 'MONTÉPILLOY', maps: ['montepilloy'], upTo: FLAGS.arriveeMontepilloy, go: { map: 'montepilloy', x: 19, y: 16, facing: 'down' } },
  { label: 'PRYTANÉE', maps: ['prytanee'], upTo: FLAGS.arriveePrytanee, go: { map: 'prytanee', x: 14, y: 21, facing: 'up' } },
  { label: 'BORDEAUX', maps: ['bordeaux'], upTo: FLAGS.arriveeBordeaux, go: { map: 'bordeaux', x: 1, y: 6, facing: 'right' } },
  { label: 'HULL', maps: ['hull'], upTo: FLAGS.arriveeHull, go: { map: 'hull', x: 1, y: 35, facing: 'right' } },
  { label: 'HANOÏ', maps: ['hanoi'], upTo: FLAGS.arriveeHanoi, go: { map: 'hanoi', x: 1, y: 6, facing: 'right' } },
  { label: 'AMSTERDAM', maps: ['amsterdam'], upTo: FLAGS.arriveeAmsterdam, go: { map: 'amsterdam', x: 1, y: 6, facing: 'right' } },
  { label: 'HULL (RETOUR)', maps: [], upTo: FLAGS.mailLu, go: { map: 'hull', x: 1, y: 35, facing: 'right' } },
  { label: 'NEW DELHI', maps: ['newDelhi', 'rajasthan'], upTo: FLAGS.arriveeNewDelhi, go: { map: 'newDelhi', x: 1, y: 6, facing: 'right' } },
  { label: 'BORDEAUX (DIPLÔME)', maps: [], upTo: FLAGS.semestreTermine, go: { map: 'bordeaux', x: 30, y: 6, facing: 'left' } },
  { label: 'PARIS', maps: ['paris'], upTo: FLAGS.arriveeParis, go: { map: 'paris', x: 1, y: 6, facing: 'right' } },
  { label: 'TOULON', maps: ['toulon', 'camino', 'corse'], upTo: FLAGS.arriveeToulon, go: { map: 'toulon', x: 1, y: 6, facing: 'right' } },
  { label: 'BALI', maps: ['bali'], upTo: FLAGS.parentsCorse, go: { map: 'bali', x: 15, y: 23, facing: 'up' } },
  { label: 'SRI LANKA', maps: ['sriLanka'], upTo: FLAGS.parentsCorse, go: { map: 'sriLanka', x: 1, y: 11, facing: 'right' } },
  { label: 'THAÏLANDE', maps: ['thailand'], upTo: FLAGS.parentsCorse, go: { map: 'thailand', x: 1, y: 6, facing: 'right' } },
  { label: 'NÉPAL', maps: ['nepal'], upTo: FLAGS.parentsCorse, go: { map: 'nepal', x: 1, y: 12, facing: 'right' } },
];

// Choix exclusifs de l'histoire : un seul drapeau de chaque groupe (le premier) est levé. Aucun pour l'instant.
const EXCLUSIVE = [];

// État de la partie au début de la quête `index` : { flags, souvenirs, items }.
export function questState(index) {
  const start = QUEST_STARTS[index];
  const order = Object.values(FLAGS);
  let raised = start.upTo ? order.slice(0, order.indexOf(start.upTo) + 1) : [];
  for (const group of EXCLUSIVE) raised = raised.filter((f) => !group.includes(f) || f === group.find((g) => raised.includes(g)));
  // Ce qui dépend du drapeau de départ lui-même fait partie de la quête : pas encore fait.
  const doneSet = new Set(raised.filter((f) => f !== start.upTo));

  const found = { souvenirs: new Map(), given: new Map(), taken: new Set() };
  const seen = new Set();
  const queue = QUEST_STARTS.slice(0, index).flatMap((q) => q.maps.map((id) => MAPS[id]));
  const walk = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) return node.forEach(walk);
    if ((node.ifFlags ?? []).some((f) => !doneSet.has(f))) return;       // branche pas encore atteinte
    // Nœud qui lève un drapeau encore baissé : pas encore joué.
    if ([node.setFlag, ...(node.setFlags ?? [])].some((f) => f && order.includes(f) && !raised.includes(f))) return;
    for (const s of [node.quality, node.souvenir]) if (s?.id) found.souvenirs.set(s.id, s);
    for (const i of [node.give, node.item]) if (i?.id) found.given.set(i.id, i);
    if (typeof node.take === 'string') found.taken.add(node.take);
    if (node.receive?.item) found.taken.add(node.receive.item.id);     // objet rendu à un PNJ
    if (typeof node.interior === 'string' && interiors[node.interior]) queue.push(interiors[node.interior]);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'grid') continue;
      walk(key === 'receive' ? { ...value, item: undefined } : value);
    }
  };
  while (queue.length) walk(queue.shift());

  const visited = QUEST_STARTS.slice(0, index + 1).flatMap((q) => q.maps).map(visitedFlag);
  return {
    flags: [...raised, ...visited],
    souvenirs: [...found.souvenirs.values()],
    items: [...found.given.values()].filter((i) => !found.taken.has(i.id)),
  };
}
