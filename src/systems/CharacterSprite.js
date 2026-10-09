import Phaser from 'phaser';
import { TILE_SIZE } from '../data/tiles.js';
import { characterTexture, lookFromColor } from '../art/characterArt.js';
import { sheetOf, BIKE_SHEET, BIKE_PREFIX } from '../art/spriteSheets.js';
import { BED_LOWER } from '../art/frlgArt.js';

export const DIRECTIONS = {
  up:    { dx: 0,  dy: -1 },
  down:  { dx: 0,  dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1,  dy: 0 },
};

// Assis par terre : les jambes (les 4 dernières rangées de l'image, pieds compris) sont cachées, le buste descend de 3
// pixels, et des jambes repliées en tailleur sont dessinées sous lui (voir drawLap).
const SEAT_CUT = 4;
const SEAT_DROP = 3;
const LAP_EDGE = 0x303038;

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export function tileCenter(x, y) {
  return [x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2];
}

// Personnage animé (joueur ou PNJ) posé sur sa case, la tête dépasse au-dessus.
// `appearance` : `{ sprite: 'g198' … }` (planches fournies, voir art/spriteSheets.js), une apparence
// dessinée (voir art/characterArt.js, ex. le chat) ou une simple couleur de haut.
// `bed` : { px, py, child? } : couché dans le lit dont l'image commence en (px, py) (voir frlgArt.bedAt).
export class CharacterSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, appearance, facing = 'down', { hat = false, bed = null } = {}) {
    super(scene, ...tileCenter(x, y));
    if (appearance?.sprite) {
      // Pieds sur la dernière ligne de l'image.
      const sheet = sheetOf(appearance.sprite);
      this.prefix = `${appearance.sprite}-`;
      this.image = scene.add.image(0, TILE_SIZE / 2, sheet.key, `${this.prefix}${facing}-0`).setOrigin(0.5, 1);
    } else {
      const look = typeof appearance === 'number' ? lookFromColor(appearance, { hat }) : appearance;
      this.prefix = '';
      this.image = scene.add.image(0, TILE_SIZE / 2, characterTexture(scene, look), `${facing}-0`).setOrigin(0.5, 1);
    }
    this.add(this.image);
    this.foot = 0;
    scene.add.existing(this);
    this.setFacing(facing);
    if (bed) this.lieInBed(bed);
    this.updateDepth();
  }

  // Couché sur le dos, la tête sur l'oreiller : le bas du lit est redessiné par-dessus le corps, avec la
  // bosse du corps sous la couverture (plus courte pour un enfant).
  lieInBed({ px, py, child = false, gen4 = false }) {
    this.setFacing('down');
    this.inBed = true;
    this.setPosition(px + 12, py);
    this.image.setOrigin(0.5, 0).setPosition(0, -4);
    // Lit Gen 4 : la couverture est dans le dessin ; on ne garde que la tête et les épaules, sur l'oreiller.
    if (gen4) {
      this.image.setCrop(0, 0, this.image.width, child ? 18 : 21);   // jusqu'au menton (le visage, pas que les cheveux)
      return;
    }
    const textures = this.scene.textures;
    const frame = 'bed-lower';
    if (!textures.get(BED_LOWER.sheet).has(frame)) {
      textures.get(BED_LOWER.sheet).add(frame, 0, BED_LOWER.sx, BED_LOWER.sy, BED_LOWER.w, BED_LOWER.h);
    }
    this.add(this.scene.add.image(-12, 13, BED_LOWER.sheet, frame).setOrigin(0));
    const bottom = child ? 21 : 25;
    const g = this.scene.add.graphics();
    g.fillStyle(0xa8a8f8).fillRect(-5, 16, 9, bottom - 16).fillRect(-4, bottom, 7, 1);
    g.fillStyle(0x7078d8).fillRect(4, 17, 1, bottom - 17).fillRect(-4, bottom + 1, 7, 1).fillRect(3, bottom, 1, 1);
    this.add(g);
  }

  setFacing(dir) {
    if (this.inBed) return;
    this.facing = dir;
    this.image.setFrame(`${this.prefix}${dir}-0`);
    if (this.seated) {
      this.image.setCrop(0, 0, this.image.width, this.image.height - SEAT_CUT);
      this.drawLap();
    }
  }

  // Assis par terre (le repas de New Delhi) : les jambes sont coupées et le buste descend sur la case.
  sit(on = true) {
    if (on === Boolean(this.seated)) return;
    this.seated = on;
    this.walkTimer?.remove();
    this.image.setFrame(`${this.prefix}${this.facing}-0`);
    if (on) {
      this.image.setCrop(0, 0, this.image.width, this.image.height - SEAT_CUT).setY(this.image.y + SEAT_DROP);
      this.drawLap();
    } else {
      this.image.setCrop().setY(this.image.y - SEAT_DROP);
      this.lap?.destroy();
      this.lap = null;
    }
  }

  // La couleur du pantalon : la plus fréquente (hors contour sombre) dans les jambes de l'image, au milieu.
  legColor() {
    const { key } = this.image.texture;
    const frame = this.image.frame.name;
    const h = this.image.frame.height;
    const counts = new Map();
    for (let y = h - 4; y <= h - 3; y++) {
      for (let x = 10; x < 22; x++) {
        const c = this.scene.textures.getPixel(x, y, key, frame);
        if (!c || c.alpha < 128 || c.r + c.g + c.b < 150) continue;
        const v = c.color;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0x506080;
  }

  // Les jambes repliées, sous le buste : de face, en travers (les deux pieds aux bouts) ; de dos, elles dépassent de
  // chaque côté, derrière le corps ; de profil, les genoux vers l'avant.
  drawLap() {
    this.lap?.destroy();
    const g = this.scene.add.graphics();
    const fill = this.legColor();
    const shade = Phaser.Display.Color.IntegerToColor(fill).darken(25).color;
    const box = (x, y, w, h) => {
      g.fillStyle(LAP_EDGE).fillRect(x, y, w, h);
      g.fillStyle(fill).fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle(shade).fillRect(x + 1, y + h - 2, w - 2, 1);
    };
    const f = this.facing;
    if (f === 'down') {
      box(-7, 6, 15, 5);
      g.fillStyle(LAP_EDGE).fillRect(0, 8, 1, 2);                // le croisement des jambes
      g.fillRect(-6, 9, 2, 1).fillRect(5, 9, 2, 1);              // les pieds
    } else if (f === 'up') {
      box(-8, 4, 17, 5);
    } else {
      const dir = f === 'right' ? 1 : -1;
      box(dir > 0 ? -3 : -7, 6, 11, 5);
      g.fillStyle(LAP_EDGE).fillRect(dir > 0 ? 6 : -6, 9, 1, 1);   // le pied, devant
    }
    if (f === 'up') this.addAt(g, 0);
    else this.add(g);
    this.lap = g;
  }

  // À vélo (le joueur, voir systems/bike.js) : l'image passe à la planche du vélo, et revient à la marche.
  setBike(on) {
    if (on === Boolean(this.onBike)) return;
    if (on) {
      this.walkLook = { key: this.image.texture.key, prefix: this.prefix };
      this.prefix = BIKE_PREFIX;
      this.image.setTexture(BIKE_SHEET);
      this.pedal = 0;
    } else {
      this.prefix = this.walkLook.prefix;
      this.image.setTexture(this.walkLook.key);
    }
    this.onBike = on;
    this.walkTimer?.remove();
    this.image.setFrame(`${this.prefix}${this.facing}-0`);
  }

  // Un pas animé de `duration` ms : pied gauche puis pied droit en alternance, retour debout à la fin. À vélo : les
  // trois temps de pédalage à la suite, la roue qui tourne tant qu'on roule.
  walkStep(duration) {
    if (this.onBike) {
      this.pedal = (this.pedal % 3) + 1;
      this.image.setFrame(`${this.prefix}${this.facing}-${this.pedal}`);
      this.walkTimer?.remove();
      this.walkTimer = this.scene.time.delayedCall(duration * 1.6, () => this.image.setFrame(`${this.prefix}${this.facing}-0`));
      return;
    }
    this.foot = 1 - this.foot;
    this.image.setFrame(`${this.prefix}${this.facing}-${1 + this.foot}`);
    this.walkTimer?.remove();
    this.walkTimer = this.scene.time.delayedCall(duration * 0.6, () => this.image.setFrame(`${this.prefix}${this.facing}-0`));
  }

  // Les personnages plus bas à l'écran passent devant ceux du dessus (`bias` : le joueur devant ses suiveurs).
  updateDepth(bias = 0) {
    this.setDepth(10 + this.y / 10000 + bias);
  }

  // Case sous les pieds du personnage (pendant un pas, celle dont il est le plus proche).
  tile() {
    return { x: Math.floor(this.x / TILE_SIZE), y: Math.floor(this.y / TILE_SIZE) };
  }

  // Cases touchées par le personnage : une seule à l'arrêt, les deux pendant un pas.
  tiles() {
    const xs = [Math.floor((this.x - 7) / TILE_SIZE), Math.floor((this.x + 7) / TILE_SIZE)];
    const ys = [Math.floor((this.y - 7) / TILE_SIZE), Math.floor((this.y + 7) / TILE_SIZE)];
    const out = [];
    for (const tx of new Set(xs)) for (const ty of new Set(ys)) out.push({ x: tx, y: ty });
    return out;
  }
}
