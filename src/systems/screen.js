// Cadrage de l'écran de jeu, comme sur Game Boy Advance : une image de 240 x 160 px (15 x 10 cases),
// agrandie d'un facteur entier (pixels nets) et centrée, avec des bandes noires autour.
export const SCREEN_W = 240;
export const SCREEN_H = 160;

// Zone de l'écran de jeu dans la fenêtre : { x, y, w, h, zoom }.
export function gameView({ width, height }) {
  const zoom = Math.max(1, Math.floor(Math.min(width / SCREEN_W, height / SCREEN_H)));
  const w = SCREEN_W * zoom;
  const h = SCREEN_H * zoom;
  return { zoom, w, h, x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2) };
}

// Police des textes de l'interface (chargée dans index.html), avec repli sur une police à chasse fixe.
export const FONT = '"Pixelify Sans", monospace';
