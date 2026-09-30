// Cadrage de l'écran de jeu, au format Game Boy Advance (3:2) mais dézoomé : une image de 360 x 240 px
// (22,5 x 15 cases, contre 15 x 10 sur GBA), agrandie d'un facteur entier (pixels nets) et centrée,
// avec des bandes noires autour.
export const SCREEN_W = 360;
export const SCREEN_H = 240;

// Zone de l'écran de jeu dans la fenêtre : { x, y, w, h, zoom }.
export function gameView({ width, height }) {
  const zoom = Math.max(1, Math.floor(Math.min(width / SCREEN_W, height / SCREEN_H)));
  const w = SCREEN_W * zoom;
  const h = SCREEN_H * zoom;
  return { zoom, w, h, x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2) };
}

// Police des textes de l'interface (chargée dans index.html), avec repli sur une police à chasse fixe.
export const FONT = '"Pixelify Sans", monospace';
