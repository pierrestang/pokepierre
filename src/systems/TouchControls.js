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

// Commandes sans couleur, façon console : socles presque noirs, boutons gris en relief (liseré sombre, reflet
// en haut), plus foncés et enfoncés quand on appuie.
const COLORS = {
  base: 0x15171d, baseEdge: 0x262a33,
  key: 0x3a3f4b, keyTop: 0x4a505e, keyEdge: 0x0b0c10, keyDown: 0x2b2f38,
  mark: 0xb4bac8, markDown: 0xe2e6ee,
};

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
      const ax = width - side - r * 1.4;                         // la capsule de A et B déborde du bouton
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
      this.pad = { x: safe.left + Math.max(margin + R * 1.2, band / 2), y: cy, R };   // socle compris
      const right = width - safe.right;
      const cx = right - Math.max(margin + r * 2.5, band / 2);    // capsule de A et B comprise
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

    // Socles : un disque sous la croix, une capsule inclinée sous A et B.
    g.fillStyle(COLORS.baseEdge, 1).fillCircle(pad.x, pad.y, pad.R * 1.2 + 2);
    g.fillStyle(COLORS.base, 1).fillCircle(pad.x, pad.y, pad.R * 1.2);
    const capsule = (r, color) => {
      g.fillStyle(color, 1);
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        g.fillCircle(b.x + (a.x - b.x) * t, b.y + (a.y - b.y) * t, r);
      }
    };
    capsule(a.r * 1.38 + 2, COLORS.baseEdge);
    capsule(a.r * 1.38, COLORS.base);

    // Croix : contour sombre, dessus gris, reflet sur le haut de chaque branche, creux au centre.
    const half = pad.R * 0.34;                                      // demi-largeur d'une branche
    const tip = pad.R;
    const corner = half * 0.3;
    const cross = (grow, dy, color) => {
      g.fillStyle(color, 1);
      g.fillRoundedRect(pad.x - half - grow, pad.y - tip - grow + dy, (half + grow) * 2, (tip + grow) * 2, corner + grow);
      g.fillRoundedRect(pad.x - tip - grow, pad.y - half - grow + dy, (tip + grow) * 2, (half + grow) * 2, corner + grow);
    };
    cross(2, 3, COLORS.keyEdge);
    cross(0, 0, COLORS.key);
    g.fillStyle(COLORS.keyTop, 1);
    g.fillRoundedRect(pad.x - half + 2, pad.y - tip + 2, half * 2 - 4, half * 0.5, corner * 0.6);
    g.fillRoundedRect(pad.x - tip + 2, pad.y - half + 2, tip - half - 2, half * 0.5, corner * 0.6);
    g.fillRoundedRect(pad.x + half, pad.y - half + 2, tip - half - 2, half * 0.5, corner * 0.6);
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    for (const [name, [dx, dy]] of Object.entries(dirs)) {
      const down = pressed(name);
      if (down) {
        g.fillStyle(COLORS.keyDown, 1);
        if (dx) g.fillRoundedRect(dx > 0 ? pad.x + half * 0.6 : pad.x - tip, pad.y - half, tip - half * 0.6, half * 2, corner);
        else g.fillRoundedRect(pad.x - half, dy > 0 ? pad.y + half * 0.6 : pad.y - tip, half * 2, tip - half * 0.6, corner);
      }
      const mx = pad.x + dx * tip * 0.66;
      const my = pad.y + dy * tip * 0.66;
      const s = half * 0.36;
      g.fillStyle(down ? COLORS.markDown : COLORS.mark, down ? 1 : 0.7);
      g.fillTriangle(
        mx + dx * s, my + dy * s,
        mx - dx * s * 0.7 + dy * s, my - dy * s * 0.7 + dx * s,
        mx - dx * s * 0.7 - dy * s, my - dy * s * 0.7 - dx * s,
      );
    }
    g.fillStyle(COLORS.keyEdge, 0.5).fillCircle(pad.x, pad.y + 1, half * 0.5);
    g.fillStyle(COLORS.keyDown, 1).fillCircle(pad.x, pad.y, half * 0.45);

    // A et B : boutons ronds en relief, enfoncés quand on les tient.
    const button = (c, down) => {
      const sink = down ? 2 : 0;
      g.fillStyle(COLORS.keyEdge, 1).fillCircle(c.x, c.y + 3, c.r + 1.5);
      g.fillStyle(down ? COLORS.keyDown : COLORS.key, 1).fillCircle(c.x, c.y + sink, c.r);
      if (!down) {
        g.fillStyle(COLORS.keyTop, 1).fillCircle(c.x, c.y - c.r * 0.12, c.r * 0.86);
        g.fillStyle(COLORS.key, 1).fillCircle(c.x, c.y + c.r * 0.1, c.r * 0.8);
      }
    };
    button(a, pressed('a'));
    button(b, pressed('b'));

    // START : petit bouton ovale incliné, l'inscription en dessous, comme sur la console.
    const sDown = pressed('start');
    const sw = start.w * 0.55;
    const sh = start.h * 0.55;
    g.fillStyle(COLORS.keyEdge, 1).fillRoundedRect(start.x - sw / 2 - 1.5, start.y - sh / 2 + 1, sw + 3, sh + 3, sh / 2 + 1.5);
    g.fillStyle(sDown ? COLORS.keyDown : COLORS.key, 1)
      .fillRoundedRect(start.x - sw / 2, start.y - sh / 2 + (sDown ? 1 : 0), sw, sh, sh / 2);

    const [la, lb, ls] = this.labels;
    const letter = (t, c, down) => t.setPosition(c.x, c.y + (down ? 2 : 0)).setFontSize(Math.round(c.r * 0.8))
      .setColor(`#${(down ? COLORS.markDown : COLORS.mark).toString(16)}`).setAlpha(this.alpha * (down ? 1 : 0.85));
    letter(la, a, pressed('a'));
    letter(lb, b, pressed('b'));
    ls.setPosition(start.x, start.y + sh / 2 + 10).setFontSize(11).setColor(`#${COLORS.mark.toString(16)}`)
      .setAlpha(this.alpha * 0.75);
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
      // Pas pendant une question à choix : on choisit avec la croix et on valide avec A.
      if (onGame && this.scene.dialog?.isOpen && !this.scene.dialog.choices && !this.scene.menu?.isOpen) {
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
