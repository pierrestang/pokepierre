import { getTile } from '../tiles.js';

// Grille de jeu d'une carte dessinée avec le créateur de cartes : les codes de la grille d'origine (portes, eau, hautes
// herbes… pour la logique du jeu), accordés aux collisions du dessin (built.solid) : 'X' là où le dessin bloque une case
// qui était libre, de l'herbe ('.') là où il libère une case qui bloquait (ex. la côte redessinée, l'emprise d'origine
// d'une maison). Calculée au chargement : une carte réenregistrée depuis le créateur reste toujours cohérente.
export function builtGrid(sourceGrid, built) {
  return sourceGrid.map((row, y) => row.map((code, x) => {
    const blocked = Boolean(built.solid[y * built.width + x]);
    const solid = Boolean(getTile(code).solid);
    if (blocked && !solid) return 'X';
    if (!blocked && solid) return '.';
    // Hautes herbes dessinées dans le créateur hors des cases 'ĥ' d'origine : elles frémissent aussi au passage (et
    // cachent les jambes, si le dessin de la case a vraiment des touffes, voir effects.js GrassCovers).
    if (!blocked && code === '.' && hasTallGrass(built, y * built.width + x)) return 'ĥ';
    return code;
  }));
}

// Cases des hautes herbes dans les planches du créateur : la matière « hautes herbes » de la planche des transitions
// (n° 4, 625 cases de bord ; scripts/build_transitions.py TERRAINS) et les touffes de autotiles-g4 (bloc 3 x 3 en
// (0, 1) et angle rentrant en (1, 0), 8 colonnes).
const TALL_AUTOTILES = new Set([1, 8, 9, 10, 16, 17, 18, 24, 25, 26]);
function hasTallGrass(built, i) {
  return ['sol', 'decor'].some((layer) => {
    const cell = built.layers[layer]?.[i];
    return (Array.isArray(cell) ? cell : [cell]).some((ref) => {
      if (ref == null || ref < 0) return false;
      const sheet = built.sheets[Math.floor(ref / 100000)];
      const k = ref % 100000;
      return (sheet === 'transitions' && Math.floor(k / 625) === 4) || (sheet === 'autotiles-g4' && TALL_AUTOTILES.has(k));
    });
  });
}

// Grille de jeu d'un intérieur dessiné en Gen 4 (scripts/build_interiors.py) : les codes d'origine (tapis de sortie,
// escaliers…) accordés aux collisions du dessin : un meuble ('m') là où le dessin bloque une case libre, du sol ('o')
// là où il libère une case qui bloquait.
export function interiorGrid(sourceGrid, built) {
  return sourceGrid.map((row, y) => row.map((code, x) => {
    const blocked = Boolean(built.solid[y * built.width + x]);
    const solid = Boolean(getTile(code).solid);
    if (blocked && !solid) return 'm';
    if (!blocked && solid) return 'o';
    return code;
  }));
}
