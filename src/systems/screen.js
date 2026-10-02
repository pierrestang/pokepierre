// Cadrage de l'écran de jeu, au format Game Boy Advance (3:2) mais dézoomé : une image de 360 x 240 px
// (22,5 x 15 cases, contre 15 x 10 sur GBA), agrandie d'un facteur entier (pixels nets) et centrée,
// avec des bandes noires autour.
export const SCREEN_W = 360;
export const SCREEN_H = 240;

// Téléphone ou tablette (écran tactile sans souris) : on garde de la place pour les commandes tactiles.
// `?touch` dans l'adresse les force (essais sur ordinateur).
export const touchScreen = window.matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
// En paysage, place minimale gardée de chaque côté pour les commandes (elles peuvent mordre sur l'écran de jeu).
export const CONTROL_BAND = 70;
// En portrait, part minimale de la hauteur laissée aux commandes, sous l'écran de jeu.
const CONTROL_SHARE = 0.4;

// Marges de sécurité de l'écran (encoche, barre d'accueil), lues dans les variables CSS --safe-* (index.html).
export function safeInsets() {
  if (!touchScreen) return { top: 0, right: 0, bottom: 0, left: 0 };
  const css = getComputedStyle(document.documentElement);
  const read = (name) => parseFloat(css.getPropertyValue(name)) || 0;
  return { top: read('--safe-top'), right: read('--safe-right'), bottom: read('--safe-bottom'), left: read('--safe-left') };
}

// Zone de l'écran de jeu dans la fenêtre : { x, y, w, h, zoom }. Sur ordinateur, agrandie d'un facteur entier
// (pixels nets) et centrée. Sur un écran tactile, le plus grande possible (facteur non entier) : en portrait,
// toute la largeur, en haut (les commandes en dessous) ; en paysage, toute la hauteur, au centre (les commandes
// de chaque côté).
export function gameView({ width, height }) {
  let zoom;
  let y;
  if (!touchScreen) {
    zoom = Math.max(1, Math.floor(Math.min(width / SCREEN_W, height / SCREEN_H)));
  } else {
    const safe = safeInsets();
    const portrait = height > width;
    const availW = width - safe.left - safe.right - (portrait ? 0 : 2 * CONTROL_BAND);
    const availH = portrait ? (height - safe.top) * (1 - CONTROL_SHARE) : height - safe.top - safe.bottom;
    zoom = Math.floor(Math.min(availW / SCREEN_W, availH / SCREEN_H) * 100) / 100;
    if (portrait) y = Math.round(safe.top);
  }
  const w = Math.round(SCREEN_W * zoom);
  const h = Math.round(SCREEN_H * zoom);
  const x = Math.floor((width - w) / 2);
  return { zoom, w, h, x, y: y ?? Math.floor((height - h) / 2) };
}

// Police des textes de l'interface (chargée dans index.html), avec repli sur une police à chasse fixe.
export const FONT = '"Pixelify Sans", monospace';
