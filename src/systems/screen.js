// Cadrage de l'écran de jeu, au format Game Boy Advance (3:2) mais dézoomé : une image de 360 x 240 px
// (22,5 x 15 cases, contre 15 x 10 sur GBA), agrandie d'un facteur entier (pixels nets) et centrée,
// avec des bandes noires autour.
export const SCREEN_W = 360;
export const SCREEN_H = 240;

// Téléphone ou tablette (écran tactile sans souris) : on garde de la place pour les commandes tactiles.
// `?touch` dans l'adresse les force (essais sur ordinateur).
export const touchScreen = window.matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
// En paysage, largeur minimale de chaque bande de commandes, à gauche et à droite de l'écran de jeu.
export const CONTROL_BAND = 150;
// En portrait, part minimale de la hauteur laissée aux commandes, sous l'écran de jeu.
const CONTROL_SHARE = 0.42;

// Marges de sécurité de l'écran (encoche, barre d'accueil), lues dans les variables CSS --safe-* (index.html).
export function safeInsets() {
  if (!touchScreen) return { top: 0, right: 0, bottom: 0, left: 0 };
  const css = getComputedStyle(document.documentElement);
  const read = (name) => parseFloat(css.getPropertyValue(name)) || 0;
  return { top: read('--safe-top'), right: read('--safe-right'), bottom: read('--safe-bottom'), left: read('--safe-left') };
}

// Zone de l'écran de jeu dans la fenêtre : { x, y, w, h, zoom }. Sur un écran tactile : en portrait, en haut
// (les commandes en dessous) ; en paysage, au centre, entre deux bandes pour les commandes.
export function gameView({ width, height }) {
  let availW = width;
  let availH = height;
  const portrait = height > width;
  const safe = safeInsets();
  if (touchScreen && portrait) availH = (height - safe.top) * (1 - CONTROL_SHARE);
  if (touchScreen && !portrait) availW = width - 2 * (CONTROL_BAND + Math.max(safe.left, safe.right));
  const zoom = Math.max(1, Math.floor(Math.min(availW / SCREEN_W, availH / SCREEN_H)));
  const w = SCREEN_W * zoom;
  const h = SCREEN_H * zoom;
  const x = Math.floor((width - w) / 2);
  const y = touchScreen && portrait ? Math.round(safe.top + 8) : Math.floor((height - h) / 2);
  return { zoom, w, h, x, y };
}

// Police des textes de l'interface (chargée dans index.html), avec repli sur une police à chasse fixe.
export const FONT = '"Pixelify Sans", monospace';
