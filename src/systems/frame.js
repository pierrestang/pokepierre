// Cadres façon Rouge Feu (dialogues, menu Start, réponses, icône d'objet) : bord bleu-gris, liseré bleu clair,
// fond blanc, coins arrondis.
export const FRAME = 0x6888a8;
export const FRAME_LIGHT = 0xb8d0e8;
export const FRAME_FILL = 0xf8f8f8;

// Cadre (x, y, w, h) en pixels d'écran, à l'échelle u ; `r` : rayon du coin extérieur, en pixels de jeu.
export function drawFrame(g, x, y, w, h, u, r = 3) {
  g.fillStyle(FRAME, 1).fillRoundedRect(x, y, w, h, r * u);
  g.fillStyle(FRAME_LIGHT, 1).fillRoundedRect(x + u, y + u, w - 2 * u, h - 2 * u, (r - 0.5) * u);
  g.fillStyle(FRAME_FILL, 1).fillRoundedRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, (r - 1) * u);
}
