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
    return code;
  }));
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
