import { gameView, safeInsets, touchScreen, FONT } from './screen.js';

// Commandes tactiles (téléphone, tablette), façon Game Boy Advance : croix directionnelle, boutons A et B,
// bouton START. Chaque commande simule une touche du clavier : le reste du jeu n'y voit aucune différence.
//   - Portrait : l'écran de jeu en haut, les commandes en dessous (croix à gauche, A et B à droite, START au
//     milieu en bas).
//   - Paysage : la croix dans la bande de gauche, A, B et START dans celle de droite.
// La croix suit le pouce : on glisse d'une direction à l'autre sans lever le doigt ; plusieurs doigts à la fois
// (marcher en courant avec B). B fait aussi « retour » quand le menu Start est ouvert ; toucher l'écran de jeu
// pendant un dialogue fait comme A.
const KEYS = {
  up: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  down: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  left: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  a: { key: 'Enter', code: 'Enter', keyCode: 13 },
  run: { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
  start: { key: 'Escape', code: 'Escape', keyCode: 27 },
};

// Commandes sans couleur : gris foncé, liseré plus clair, plus clair encore quand on appuie.
const COLORS = { pad: 0x2a2d38, padEdge: 0x50566a, padPressed: 0x4a5062, arrow: 0xc8ccd8 };

function send(name, type) {
  window.dispatchEvent(new KeyboardEvent(type, { ...KEYS[name], bubbles: true }));
}

export function isTouchDevice() {
  return touchScreen;
}

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    scene.input.addPointer(2);                    // jusqu'à trois doigts
    this.pointers = new Map();                    // doigt -> commande tenue ('up'…, 'a', 'b', 'start')
    this.held = new Set();                        // touches enfoncées (noms de KEYS)
    this.gfx = scene.add.graphics().setDepth(120);
    this.labels = ['A', 'B', 'START'].map((t) => scene.add.text(0, 0, t, { fontFamily: FONT, color: '#c8ccd8', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(121));

    scene.input.on('pointerdown', (p) => this.onPointer(p, true));
    scene.input.on('pointermove', (p) => p.isDown && this.pointers.has(p.id) && this.onPointer(p, false));
    const release = (p) => {
      if (this.pointers.delete(p.id)) this.update();
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
    // Application mise en arrière-plan : on relâche tout (sinon le joueur continuerait de marcher).
    const releaseAll = () => {
      this.pointers.clear();
      this.update();
    };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', releaseAll);

    this.layout();
    scene.scale.on('resize', this.layout, this);
    scene.events.once('shutdown', () => {
      scene.scale.off('resize', this.layout, this);
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', releaseAll);
    });
  }

  // Place les commandes selon l'orientation (voir en tête de fichier).
  layout() {
    const { width, height } = this.scene.scale;
    const v = gameView(this.scene.scale);
    const safe = safeInsets();
    if (height > width) {
      // Portrait : zone sous l'écran de jeu, jusqu'à la barre d'accueil.
      const top = v.y + v.h;
      const bottom = height - safe.bottom;
      const zone = bottom - top;
      const R = Math.min(width * 0.2, zone * 0.24, 92);          // rayon de la croix
      const r = R * 0.46;                                          // rayon de A et B
      const cy = top + zone * 0.4;
      const side = Math.max(16, width * 0.06);
      this.pad = { x: side + R, y: cy, R };
      const ax = width - side - r;
      this.a = { x: ax, y: cy - r * 0.75, r };
      this.b = { x: ax - r * 2.3, y: cy + r * 0.75, r };
      this.start = { x: width / 2, y: Math.min(bottom - 22, cy + R + 44), w: Math.max(72, R * 0.95), h: 26 };
    } else {
      // Paysage : l'écran de jeu prend toute la hauteur ; les commandes, dans les bandes de chaque côté (sans
      // l'encoche), mordent sur ses bords si elles manquent de place.
      const band = Math.min(v.x - safe.left, width - safe.right - v.x - v.w);
      const R = Math.min(Math.max(band * 0.42, height * 0.15), height * 0.2, 92);
      const r = R * 0.5;
      const cy = height * 0.62;
      const margin = 12;
      this.pad = { x: safe.left + Math.max(margin + R, band / 2), y: cy, R };
      const right = width - safe.right;
      const cx = right - Math.max(margin + r * 2.2, band / 2);
      this.a = { x: cx + r * 1.1, y: cy - r * 0.75, r };
      this.b = { x: cx - r * 1.1, y: cy + r * 0.75, r };
      this.start = { x: cx, y: Math.max(safe.top + 20, cy - R - 30), w: Math.max(64, R * 0.9), h: 24 };
    }
    // Pas assez de place autour de l'écran de jeu (fenêtre étroite) : les commandes passent dessus, en transparence.
    const over = ({ x, y }, size) => x - size < v.x + v.w && x + size > v.x && y + size > v.y && y - size < v.y + v.h;
    const overlaps = over(this.pad, this.pad.R) || over(this.a, this.a.r) || over(this.b, this.b.r);
    this.alpha = overlaps ? 0.6 : 1;
    this.draw();
  }

  // Dessine les commandes ; celles que tient un doigt sont enfoncées (B s'enfonce, qu'il fasse courir ou revenir).
  draw() {
    const g = this.gfx.clear().setAlpha(this.alpha);
    const { pad, a, b, start } = this;
    const touched = new Set(this.pointers.values());
    const pressed = (name) => touched.has(name);

    // Croix : deux barres qui se croisent (ombre portée, liseré), flèches ; la branche enfoncée s'éclaircit.
    const half = pad.R * 0.36;                                      // demi-largeur d'une branche
    const tip = pad.R;
    const cross = (grow, dy, color, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillRoundedRect(pad.x - half - grow, pad.y - tip - grow + dy, (half + grow) * 2, (tip + grow) * 2, half * 0.35);
      g.fillRoundedRect(pad.x - tip - grow, pad.y - half - grow + dy, (tip + grow) * 2, (half + grow) * 2, half * 0.35);
    };
    cross(0, 5, 0x000000, 0.4);
    cross(2, 0, COLORS.padEdge);
    cross(0, 0, COLORS.pad);
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    for (const [name, [dx, dy]] of Object.entries(dirs)) {
      if (pressed(name)) {
        g.fillStyle(COLORS.padPressed, 1);
        if (dx) g.fillRoundedRect(dx > 0 ? pad.x + half : pad.x - tip, pad.y - half, tip - half, half * 2, half * 0.3);
        else g.fillRoundedRect(pad.x - half, dy > 0 ? pad.y + half : pad.y - tip, half * 2, tip - half, half * 0.3);
      }
      const mx = pad.x + dx * tip * 0.64;
      const my = pad.y + dy * tip * 0.64;
      const s = half * 0.42;
      g.fillStyle(COLORS.arrow, pressed(name) ? 1 : 0.75);
      g.fillTriangle(
        mx + dx * s, my + dy * s,
        mx - dx * s * 0.7 + dy * s, my - dy * s * 0.7 + dx * s,
        mx - dx * s * 0.7 - dy * s, my - dy * s * 0.7 - dx * s,
      );
    }
    g.fillStyle(0x000000, 0.22).fillCircle(pad.x, pad.y, half * 0.55);

    // A et B : boutons ronds en relief (ombre, reflet), enfoncés quand on les tient.
    const button = (c, color, down) => {
      const sink = down ? 3 : 0;
      g.fillStyle(0x000000, 0.4).fillCircle(c.x, c.y + 4, c.r);
      g.fillStyle(COLORS.padEdge, 1).fillCircle(c.x, c.y + sink, c.r + 2);
      g.fillStyle(color, 1).fillCircle(c.x, c.y + sink, c.r);
      if (!down) g.fillStyle(0xffffff, 0.06).fillCircle(c.x - c.r * 0.25, c.y - c.r * 0.3, c.r * 0.45);
    };
    button(a, pressed('a') ? COLORS.padPressed : COLORS.pad, pressed('a'));
    button(b, pressed('b') ? COLORS.padPressed : COLORS.pad, pressed('b'));

    // START : pilule, comme sur la console.
    const sDown = pressed('start');
    g.fillStyle(0x000000, 0.4).fillRoundedRect(start.x - start.w / 2, start.y - start.h / 2 + 3, start.w, start.h, start.h / 2);
    g.fillStyle(COLORS.padEdge, 1)
      .fillRoundedRect(start.x - start.w / 2 - 2, start.y - start.h / 2 - 2 + (sDown ? 2 : 0), start.w + 4, start.h + 4, start.h / 2 + 2);
    g.fillStyle(sDown ? COLORS.padPressed : COLORS.pad, 1)
      .fillRoundedRect(start.x - start.w / 2, start.y - start.h / 2 + (sDown ? 2 : 0), start.w, start.h, start.h / 2);

    const [la, lb, ls] = this.labels;
    la.setPosition(a.x, a.y + (pressed('a') ? 3 : 0)).setFontSize(Math.round(a.r * 0.9)).setAlpha(this.alpha);
    lb.setPosition(b.x, b.y + (pressed('b') ? 3 : 0)).setFontSize(Math.round(b.r * 0.9)).setAlpha(this.alpha);
    ls.setPosition(start.x, start.y + (sDown ? 2 : 0)).setFontSize(13).setAlpha(this.alpha * 0.9);
  }

  // Quelle commande se trouve sous le doigt ? `held` : la commande que ce doigt tient déjà (la croix garde le
  // doigt même s'il déborde un peu, pour glisser d'une direction à l'autre).
  hit(x, y, held) {
    const { pad, a, b, start } = this;
    const dx = x - pad.x;
    const dy = y - pad.y;
    const dist = Math.hypot(dx, dy);
    const onPad = ['up', 'down', 'left', 'right'].includes(held);
    if (dist <= pad.R * (onPad ? 2 : 1.3)) {
      if (dist < pad.R * 0.18) return onPad ? held : null;       // centre : on garde la direction
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
    if (onPad) return null;
    // A et B : zones plus larges que les boutons ; le plus proche l'emporte (glisser de B vers A).
    const da = Math.hypot(x - a.x, y - a.y) / a.r;
    const db = Math.hypot(x - b.x, y - b.y) / b.r;
    if (Math.min(da, db) <= 1.45) return da <= db ? 'a' : 'b';
    if (Math.abs(x - start.x) <= start.w / 2 + 12 && Math.abs(y - start.y) <= start.h / 2 + 14) return 'start';
    return null;
  }

  onPointer(p, isDown) {
    const held = this.pointers.get(p.id);
    const control = this.hit(p.x, p.y, held);
    if (isDown && !control) {
      // Toucher l'écran de jeu pendant un dialogue : comme A (page suivante).
      const v = gameView(this.scene.scale);
      const onGame = p.x >= v.x && p.x < v.x + v.w && p.y >= v.y && p.y < v.y + v.h;
      if (onGame && this.scene.dialog?.isOpen && !this.scene.menu?.isOpen) {
        send('a', 'keydown');
        this.scene.time.delayedCall(60, () => send('a', 'keyup'));
      }
      return;
    }
    if (control === held) return;
    if (control) this.pointers.set(p.id, control);
    else this.pointers.delete(p.id);
    if (control && navigator.vibrate) navigator.vibrate(8);
    this.update();
  }

  // Aligne les touches simulées sur les commandes tenues par les doigts.
  update() {
    const menuOpen = this.scene.menu?.isOpen;
    const wanted = new Set();
    for (const control of this.pointers.values()) {
      if (control === 'b') wanted.add(menuOpen ? 'start' : 'run');   // B : retour dans le menu, sinon courir
      else wanted.add(control);
    }
    for (const name of this.held) if (!wanted.has(name)) send(name, 'keyup');
    for (const name of wanted) if (!this.held.has(name)) send(name, 'keydown');
    this.held = wanted;
    this.draw();
  }
}
