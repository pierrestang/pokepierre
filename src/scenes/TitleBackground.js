import Phaser from 'phaser';
import { MAPS, START_MAP } from '../data/maps/index.js';
import { FLAGS, visitedFlag } from '../data/story.js';
import { EXTRAS } from '../data/looks.js';
import { flags, meetsConditions } from '../systems/flags.js';
import { renderMap, createSurroundings } from '../systems/tileRenderer.js';
import { applyBuiltLook, TOP_DEPTH } from '../systems/builtMaps.js';
import { cabaneFrame, CABANE_LADDER_X, FRLG_SHEETS } from '../art/frlgArt.js';
import { propKey } from '../art/propImages.js';
import { startSeaShimmer, startFallingLeaves } from '../systems/effects.js';
import { createWalkableCheck } from '../systems/collision.js';
import { CharacterSprite, tileCenter } from '../systems/CharacterSprite.js';
import { TILE_SIZE } from '../data/tiles.js';

// Le fond de l'écran titre (lancé sous TitleScene, qui garde le titre et le menu fixes au centre) : une traversée des
// villes déjà atteintes dans la partie (Fort-de-France seule pour une nouvelle partie), chacune sur un cadrage lisible,
// en travelling lent (PAN_MS), avec un ou deux passants qui marchent ; fondu au noir d'une seconde entre deux villes,
// puis on recommence. L'écran titre évolue donc avec la progression. La musique reste celle du titre (TitleScene).

const PAN_MS = 9000;
const FADE_MS = 1000;
const PAN_TILES = 3;              // le travelling glisse de PAN_TILES cases de part et d'autre du cadrage
// Le titre occupe le haut de l'écran et le menu le milieu : le cadrage est montré dans la bande du bas, sous le menu
// (à FOCUS_Y de la hauteur de l'écran).
const FOCUS_Y = 0.78;

// Les villes dans l'ordre du jeu : la case du cadrage, et ce qui dit qu'on y est allé (le drapeau de visite de la
// carte, posé à chaque passage, ou son drapeau d'arrivée, pour une ancienne partie).
const CITIES = [
  { id: 'fortDeFrance', focus: [19, 27] },                                   // la plage et le ferry
  { id: 'saintAy', focus: [4, 18], arrived: FLAGS.departFortDeFrance },      // la cabane des cousins
  { id: 'montepilloy', focus: [5, 18], arrived: FLAGS.arriveeMontepilloy },  // la ferme et le tracteur
  { id: 'routeBonsecours', focus: [10, 12], arrived: FLAGS.collegeArrivee }, // la cour du collège
  { id: 'prytanee', focus: [17, 18], arrived: FLAGS.arriveePrytanee },       // la place d'armes
  { id: 'bordeaux', focus: [17, 18], arrived: FLAGS.arriveeBordeaux },       // les quais de la Garonne
  { id: 'hull', focus: [29, 10], arrived: FLAGS.arriveeHull },               // l'Asylum
  { id: 'hanoi', focus: [8, 14], arrived: FLAGS.arriveeHanoi },              // le lac et l'îlot de M. Lam
  { id: 'amsterdam', focus: [17, 12], arrived: FLAGS.arriveeAmsterdam },     // un canal
  { id: 'newDelhi', focus: [27, 10], arrived: FLAGS.arriveeNewDelhi },       // la vieille porte du fort
  { id: 'paris', focus: [42, 40], arrived: FLAGS.arriveeParis },             // la tour de bureaux
];

// Les villes atteintes dans la partie enregistrée.
export function reachedCities() {
  const list = CITIES.filter((c) => MAPS[c.id] && (c.id === START_MAP || flags.has(visitedFlag(c.id))
    || (c.arrived && flags.has(c.arrived))));
  return list.length ? list : CITIES.slice(0, 1);
}

export class TitleBackground extends Phaser.Scene {
  constructor() {
    super('TitleBackground');
  }

  create() {
    this.cities = reachedCities();
    this.index = 0;
    this.showCity();
  }

  // Une ville : son dessin, son cadrage, ses passants ; travelling, puis fondu vers la suivante.
  showCity() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
    const city = this.cities[this.index];
    const map = MAPS[city.id];
    const cam = this.cameras.main;
    const fill = map.surroundings ?? 'T';
    cam.setBackgroundColor(fill === 'w' ? 0x4078e0 : 0x000000);
    if (map.built) applyBuiltLook(this, map);
    renderMap(this, map);
    for (const o of map.overlays ?? []) {
      this.add.image(o.x, o.y, o.sheet, o.frame(this)).setOrigin(0).setDepth(o.depth ?? 10 + (o.y + o.h) / 10000);
    }
    const w = map.grid[0].length * TILE_SIZE;
    const h = map.grid.length * TILE_SIZE;
    if (fill && fill !== 'w') createSurroundings(this, map, fill).resize(w + 2 * this.scale.width, h + 2 * this.scale.height);
    this.addProps(map);
    startSeaShimmer(this, map);
    startFallingLeaves(this, map);
    this.addWalkers(map, city.focus);

    // Le cadrage : un cran plus serré qu'il ne faut pour remplir l'écran (le sujet se lit sous le menu), la caméra reste
    // dans la carte ; travelling lent de gauche à droite.
    const zoom = Math.max(2, Math.ceil(this.scale.height / h), Math.ceil(this.scale.width / w)) + 1;
    cam.setZoom(zoom).setBounds(0, 0, w, h);
    const [fx, fy] = tileCenter(...city.focus);
    cam.centerOn(fx - PAN_TILES * TILE_SIZE, fy - (FOCUS_Y - 0.5) * (cam.height / zoom));
    this.tweens.add({ targets: cam, scrollX: cam.scrollX + 2 * PAN_TILES * TILE_SIZE, duration: PAN_MS, ease: 'Sine.easeInOut' });
    cam.fadeIn(FADE_MS);
    this.time.delayedCall(PAN_MS - FADE_MS, () => {
      cam.fadeOut(FADE_MS);
      cam.once('camerafadeoutcomplete', () => {
        this.index = (this.index + 1) % this.cities.length;
        this.showCity();
      });
    });
  }

  // Les objets du décor posés par le jeu (comme MapScene.refreshActors), dans l'état de la partie : la cabane des cousins,
  // et les objets en image (le tracteur de M. Bouly…).
  // Un objet à plusieurs versions (le tracteur en panne, puis réparé) dont aucune ne vaut à ce moment de l'histoire (le
  // tracteur parti aux champs) : sa dernière version.
  addProps(map) {
    const groups = new Map();
    for (const p of map.props ?? []) {
      const key = `${p.type}:${p.x},${p.y}`;
      groups.set(key, [...(groups.get(key) ?? []), p]);
    }
    const shown = [...groups.values()].flatMap((g) => {
      const now = g.filter(meetsConditions);
      return now.length || g.length < 2 ? now : [g.at(-1)];
    });
    for (const data of shown) {
      const bottom = (data.y + data.h) * TILE_SIZE;
      if (data.type === 'cabane') {
        this.add.image((data.x + 1) * TILE_SIZE - CABANE_LADDER_X, bottom + TILE_SIZE, FRLG_SHEETS.cabane, cabaneFrame(this, 'hut'))
          .setOrigin(0, 1).setDepth(TOP_DEPTH + 0.2);
      } else if (data.image && data.type !== 'image') {
        this.add.image((data.x + data.w / 2) * TILE_SIZE, bottom + (data.dy ?? 0), propKey(data.image))
          .setOrigin(0.5, 1).setDepth(data.flat ? 9.5 : 10 + (bottom - 1) / 10000);
      }
    }
  }

  // Un ou deux passants qui vont et viennent sur une rangée libre près du cadrage (cases praticables, sans PNJ ni décor
  // bloquant), d'un pas tranquille.
  addWalkers(map, [fx, fy]) {
    const free = createWalkableCheck(map.grid);
    const blocked = new Set();
    for (const p of map.props ?? []) {
      for (let y = p.y; y < p.y + (p.h ?? 1); y++) for (let x = p.x; x < p.x + (p.w ?? 1); x++) blocked.add(`${x},${y}`);
    }
    const ok = (x, y) => free(x, y) && !blocked.has(`${x},${y}`);
    const runs = [];
    for (const dy of [2, -2, 3, -3, 1, -1, 4, -4]) {
      const y = fy + dy;
      let x0 = fx;
      while (ok(x0 - 1, y) && fx - x0 < 8) x0--;
      let x1 = fx;
      while (ok(x1 + 1, y) && x1 - fx < 8) x1++;
      if (ok(fx, y) && x1 - x0 >= 4) runs.push({ y, x0, x1 });
      if (runs.length === 2) break;
    }
    runs.forEach((run, k) => {
      const sprite = EXTRAS[(this.index * 3 + k * 7) % EXTRAS.length];
      const start = k ? run.x1 : run.x0;
      const walker = new CharacterSprite(this, start, run.y, { sprite }, k ? 'left' : 'right');
      this.walk(walker, run, start, k ? -1 : 1);
    });
  }

  walk(walker, run, x, dir) {
    if (!walker.scene) return;
    const next = x + dir;
    if (next < run.x0 || next > run.x1) {
      walker.setFacing(dir > 0 ? 'left' : 'right');
      this.time.delayedCall(900, () => this.walk(walker, run, x, -dir));
      return;
    }
    walker.setFacing(dir > 0 ? 'right' : 'left');
    walker.walkStep(380);
    const [px] = tileCenter(next, run.y);
    this.tweens.add({
      targets: walker, x: px, duration: 380, onUpdate: () => walker.updateDepth(),
      onComplete: () => this.walk(walker, run, next, dir),
    });
  }
}
