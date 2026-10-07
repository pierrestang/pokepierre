// PNJ placés dans le créateur de cartes (src/builder/npcs.js), enregistrés dans le dessin de la carte ou de l'intérieur
// (built.npcEdits) :
//   moved  : { [id]: { x, y, facing? } } — un PNJ du code (figurant ou PNJ de l'histoire) déplacé ; tous les PNJ de ce
//            id (une variante par étape de l'histoire) le sont ;
//   extras : [{ id, name, x, y, facing, sprite, line }] — des figurants ajoutés (une réplique, une apparence `g{n}`).
// Les PNJ de l'histoire ne se créent pas dans le créateur (ils ont des scénettes) ; on ne fait que les déplacer.
// Appliqué au chargement des données (maps/index.js, interiors.js) et à l'essai depuis le créateur (systems/builtMaps.js) :
// le jeu et scripts/check_paths.js voient les mêmes places. Relancer avec d'autres retouches remet d'abord les places du
// code (idempotent).

const ORIGIN = new WeakMap();

export function applyNpcEdits(map, built) {
  const edits = built?.npcEdits ?? {};
  map.npcs = (map.npcs ?? []).filter((n) => !n.editorExtra);
  for (const npc of map.npcs) {
    if (!ORIGIN.has(npc)) ORIGIN.set(npc, { x: npc.x, y: npc.y, facing: npc.facing });
    const origin = ORIGIN.get(npc);
    const moved = edits.moved?.[npc.id];
    npc.x = moved?.x ?? origin.x;
    npc.y = moved?.y ?? origin.y;
    npc.facing = moved?.facing ?? origin.facing;
  }
  for (const extra of edits.extras ?? []) {
    map.npcs.push({
      id: extra.id,
      name: extra.name || 'Passant',
      x: extra.x,
      y: extra.y,
      facing: extra.facing ?? 'down',
      ...(extra.sprite ? { sprite: extra.sprite } : {}),
      dialogue: [extra.line || '…'],
      editorExtra: true,
    });
  }
}

// Un PNJ joue-t-il un rôle dans l'histoire ? Une scénette, des conditions d'apparition, un objet ou un souvenir à donner,
// un drapeau à poser, une marche… Sinon c'est un figurant (une réplique, au plus une petite animation).
const STORY_KEYS = ['script', 'ifFlags', 'unlessFlags', 'ifItems', 'unlessItems', 'ifSouvenirs', 'unlessSouvenirs',
  'item', 'souvenir', 'setFlag', 'give', 'receive', 'trait', 'follow', 'walk', 'inBed', 'emerge', 'hidden'];
export function isStoryNpc(npc) {
  if (npc.editorExtra) return false;
  return STORY_KEYS.some((k) => npc[k] !== undefined);
}
