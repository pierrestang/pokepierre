import { gameView, SCREEN_W, SCREEN_H } from './screen.js';
import { FRLG_FONT, frlgText } from './frlgFont.js';

// Base des panneaux plein écran ouverts depuis le menu Start par-dessus le jeu (carte du voyage, sac, apparences
// des PNJ), dans le style de la carte de Rouge Feu : bandeaux de couleur en haut et en bas de l'écran de jeu.
// Une sous-classe écrit render() en commençant par begin() ; ses objets (profondeur 120, ajoutés par add) sont
// effacés à chaque rendu et à la fermeture, et le panneau est redessiné quand la fenêtre change de taille.
// Coordonnées en pixels de l'écran de jeu (360 x 240), converties par X / Y ; u : facteur d'agrandissement.
export const BAR = 16;                             // hauteur des bandeaux du haut et du bas

export class FullScreenPanel {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.objects = [];
    const onResize = () => this.isOpen && this.render();
    scene.scale.on('resize', onResize);
    scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
  }

  close() {
    this.isOpen = false;
    this.clear();
  }

  clear() {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
  }

  add(o) {
    this.objects.push(o.setDepth(120));
    return o;
  }

  // Début d'un rendu : efface le précédent et calcule l'échelle de l'écran de jeu.
  begin() {
    this.clear();
    const v = gameView(this.scene.scale);
    this.u = v.zoom;
    this.X = (x) => v.x + x * this.u;
    this.Y = (y) => v.y + y * this.u;
  }

  // Bandeaux du haut et du bas (couleur `color`) ; `background` : fond uni de tout l'écran, ou null.
  drawBars(g, color, background = null) {
    const { u, X, Y } = this;
    if (background !== null) g.fillStyle(background, 1).fillRect(X(0), Y(0), SCREEN_W * u, SCREEN_H * u);
    g.fillStyle(color, 1).fillRect(X(0), Y(0), SCREEN_W * u, BAR * u);
    g.fillStyle(color, 1).fillRect(X(0), Y(SCREEN_H - BAR), SCREEN_W * u, BAR * u);
  }

  text(text, x, y, color = 0x303038) {
    return this.add(this.scene.add.bitmapText(this.X(x), this.Y(y), FRLG_FONT, frlgText(this.scene, text)).setScale(this.u).setTintFill(color));
  }
}
