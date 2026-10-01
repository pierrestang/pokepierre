import { gameView, SCREEN_W, SCREEN_H } from './screen.js';
import { FRLG_FONT, frlgText } from './frlgFont.js';
import { FRLG_SHEETS } from '../art/frlgArt.js';
import { MAPS } from '../data/maps/index.js';
import { flags } from './flags.js';
import { visitedFlag } from '../data/story.js';
import { sfx } from './audio.js';

// Carte du voyage (menu Start > CARTE), dans le style de la carte de Rouge Feu : mer rayée, bandeaux bleus,
// étapes reliées par des routes orange, point rouge pour chaque ville visitée (« ??? » sinon), tête de Red
// sur la ville où l'on se trouve. Flèches gauche/droite (ou haut/bas) : choisir une étape ; Échap/Entrée : fermer.
// Une ville est « visitée » dès qu'on y est entré (drapeau `visite-<id>`, voir MapScene).

// Étapes du voyage, dans l'ordre de l'histoire.
const STOPS = [
  'fortDeFrance', 'saintAy', 'montepilloy', 'prytanee', 'bordeaux', 'hull',
  'hanoi', 'amsterdam', 'newDelhi', 'rajasthan', 'paris', 'toulon',
  'camino', 'corse', 'bali', 'sriLanka', 'thailand', 'nepal',
];
const PER_ROW = 6;
const BAR = 16;              // hauteur des bandeaux (en pixels de l'écran de jeu)
const ROUTE = 0xe7a500;       // orange des routes de Rouge Feu
const ROUTE_LIGHT = 0xf8d870;
const ROUTE_UNKNOWN = 0xc8d0e8;

export { visitedFlag };

// Position (pixels de l'écran de jeu) de l'étape i : trois rangées en serpentin.
function stopPosition(i) {
  const row = Math.floor(i / PER_ROW);
  const col = row % 2 === 0 ? i % PER_ROW : PER_ROW - 1 - (i % PER_ROW);
  const left = 40;
  const step = (SCREEN_W - 2 * left) / (PER_ROW - 1);
  return { x: left + col * step, y: 2 * BAR + 30 + row * 58 };
}

export class RegionMap {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.objects = [];
    // Images de la planche de la carte (voir scripts/build_frlg_tiles.py, town_map).
    const tex = scene.textures.get(FRLG_SHEETS.townMap);
    if (!tex.has('sea')) {
      tex.add('sea', 0, 0, 0, 16, 16);
      tex.add('dot', 0, 16, 0, 8, 8);
      tex.add('head', 0, 24, 0, 16, 16);
    }
    const onResize = () => this.isOpen && this.render();
    scene.scale.on('resize', onResize);
    scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
  }

  // Ouvre la carte, curseur sur la ville `current` (id de carte).
  open(current) {
    this.current = current;
    this.index = Math.max(0, STOPS.indexOf(current));
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.clear();
  }

  clear() {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
  }

  visited(id) {
    return id === this.current || flags.has(visitedFlag(id));
  }

  render() {
    this.clear();
    const s = this.scene;
    const v = gameView(s.scale);
    const u = v.zoom;
    const X = (x) => v.x + x * u;
    const Y = (y) => v.y + y * u;
    const add = (o) => { this.objects.push(o.setDepth(120)); return o; };
    const white = (text) => add(s.add.bitmapText(0, 0, FRLG_FONT, frlgText(s, text)).setScale(u).setTintFill(0xffffff));

    // Mer rayée de la carte de Rouge Feu
    add(s.add.tileSprite(v.x, v.y, SCREEN_W * u, SCREEN_H * u, FRLG_SHEETS.townMap, 'sea').setOrigin(0).setTileScale(u));
    const g = add(s.add.graphics());

    // Routes entre les étapes (pâles vers les villes pas encore visitées)
    for (let i = 1; i < STOPS.length; i++) {
      const a = stopPosition(i - 1);
      const b = stopPosition(i);
      const known = this.visited(STOPS[i]);
      g.fillStyle(known ? ROUTE : ROUTE_UNKNOWN, 1);
      const x0 = Math.min(a.x, b.x) - 2;
      const y0 = Math.min(a.y, b.y) - 2;
      g.fillRect(X(x0), Y(y0), (Math.abs(b.x - a.x) + 4) * u, (Math.abs(b.y - a.y) + 4) * u);
      if (known) {
        g.fillStyle(ROUTE_LIGHT, 1);
        g.fillRect(X(x0 + 1), Y(y0 + 1), (Math.abs(b.x - a.x) + 2) * u, u);
      }
    }

    // Villes : point rouge si visitée, gris sinon ; tête de Red sur la ville actuelle
    STOPS.forEach((id, i) => {
      const p = stopPosition(i);
      const dot = add(s.add.image(X(p.x), Y(p.y), FRLG_SHEETS.townMap, 'dot').setScale(u));
      if (!this.visited(id)) dot.setTint(0x9098a8);
      if (id === this.current) add(s.add.image(X(p.x), Y(p.y - 4), FRLG_SHEETS.townMap, 'head').setOrigin(0.5, 1).setScale(u));
    });

    // Curseur : coins blancs autour de l'étape choisie
    const c = stopPosition(this.index);
    const cg = add(s.add.graphics());
    cg.fillStyle(0xffffff, 1);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cx = c.x + dx * 7;
      const cy = c.y + dy * 7;
      cg.fillRect(X(cx - (dx > 0 ? 2 : 0)), Y(cy), 3 * u, u);
      cg.fillRect(X(cx), Y(cy - (dy > 0 ? 2 : 0)), u, 3 * u);
    }

    // Bandeaux : titre en haut, nom de l'étape choisie, aide en bas
    g.fillStyle(0x2070e8, 1).fillRect(X(0), Y(0), SCREEN_W * u, BAR * u);
    g.fillStyle(0x2070e8, 1).fillRect(X(0), Y(SCREEN_H - BAR), SCREEN_W * u, BAR * u);
    g.fillStyle(0x305828, 0.85).fillRect(X(0), Y(BAR), SCREEN_W * u, BAR * u);
    white('CARTE DU VOYAGE').setPosition(X(6), Y(1));
    const id = STOPS[this.index];
    white(this.visited(id) ? (MAPS[id]?.name ?? id).toUpperCase() : '???').setPosition(X(6), Y(BAR + 1));
    white(`Étape ${this.index + 1} / ${STOPS.length}`).setPosition(X(SCREEN_W - 80), Y(BAR + 1));
    white('← → : choisir    Échap : fermer').setPosition(X(6), Y(SCREEN_H - BAR + 1));
  }

  // Touche pendant que la carte est ouverte. Renvoie vrai si la carte se ferme.
  onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      sfx('select');
      this.close();
      return true;
    }
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return false;
    this.index = (this.index + delta + STOPS.length) % STOPS.length;
    sfx('select');
    this.render();
    return false;
  }
}
