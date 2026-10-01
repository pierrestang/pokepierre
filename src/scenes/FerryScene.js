import Phaser from 'phaser';
import { gameView, SCREEN_W, SCREEN_H } from '../systems/screen.js';
import { FRLG_SHEETS, familyCarImage, roadStripTexture, ROAD_TOP } from '../art/frlgArt.js';
import { sheetOf } from '../art/spriteSheets.js';

// Traversée en ferry, comme l'écran de voyage des îles Sevii dans Rouge Feu : entre deux bandes noires,
// la mer défile vers la gauche et le ferry file vers la droite dans son sillage, en tanguant.
// Au bout de quelques secondes, fondu au noir puis arrivée (`next` : { sceneKey, data }).
// `deck: true` : la traversée commence sur le pont du ferry (départ de Fort-de-France) : la famille,
// accoudée au bastingage, regarde la mer vers l'île qu'elle quitte.
// `road: true` : même écran de voyage, mais en voiture : la campagne défile vers la gauche, la voiture de la
// famille roule vers la droite sur la route de terre, en vibrant, avec des bouffées de fumée.
const DURATION = 3600;
const FADE_MS = 400;
const BAND = 36;            // hauteur des bandes noires (en pixels de l'écran de jeu)
const SPEED = 3;            // défilement de la mer, en pixels par image

// Pont du ferry
const SKY_H = 26;           // ciel au-dessus de l'horizon
const RAIL_Y = 124;         // main courante du bastingage
const DECK_Y = 134;         // début du plancher du pont
// La famille, de dos, de gauche à droite (sprites : voir data/characters.js).
const FAMILY = [
  { id: 'maman', sprite: 't8', x: 138 },
  { id: 'papa', sprite: 't1', x: 162 },
  { id: 'pierre', sprite: 'f0', x: 194 },
  { id: 'manon', sprite: 't7', x: 218 },
];

export class FerryScene extends Phaser.Scene {
  constructor() {
    super('Ferry');
  }

  create({ next, deck, road }) {
    this.next = next;
    this.scene.get('UI')?.curtain?.setAlpha(0);             // rideau noir de la scénette de départ
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x000000);
    const fit = () => {
      const v = gameView(this.scale);
      cam.setViewport(v.x, v.y, v.w, v.h);
      cam.setZoom(v.zoom);
      cam.centerOn(SCREEN_W / 2, SCREEN_H / 2);
    };
    fit();
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));

    if (deck) return this.playDeck();

    if (road) this.playRoad();
    else {
      this.sea = this.add.tileSprite(0, BAND, SCREEN_W, SCREEN_H - 2 * BAND, FRLG_SHEETS.travelSea).setOrigin(0);
      this.seaSpeed = { x: SPEED, y: 0 };
      const ferry = this.add.image(SCREEN_W / 2 + 30, SCREEN_H / 2, FRLG_SHEETS.ferryWake);
      this.tweens.add({ targets: ferry, y: ferry.y + 2, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    cam.fadeIn(FADE_MS);
    this.time.delayedCall(DURATION, () => {
      cam.fadeOut(FADE_MS);
      cam.once('camerafadeoutcomplete', () => this.scene.start(next.sceneKey, next.data));
    });
  }

  // Trajet en voiture : la campagne défile, la voiture roule au milieu de la route.
  playRoad() {
    const h = SCREEN_H - 2 * BAND;
    this.sea = this.add.tileSprite(0, BAND, SCREEN_W, h, roadStripTexture(this, h)).setOrigin(0);
    this.seaSpeed = { x: SPEED + 1, y: 0 };
    const x = SCREEN_W / 2 + 20;
    const bottom = BAND + ROAD_TOP + 42;
    const car = familyCarImage(this, x, bottom, 'right').setOrigin(0.5, 1).setDepth(2);
    this.tweens.add({ targets: car, y: bottom - 1, duration: 120, yoyo: true, repeat: -1, ease: 'Stepped' });
    // Bouffées de fumée au pot d'échappement, qui s'envolent vers l'arrière.
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const puff = this.add.rectangle(x - 22, bottom - 6, 3, 3, 0xd8d8d0).setDepth(1);
        this.tweens.add({ targets: puff, x: puff.x - 26, y: puff.y - 6, scale: 2, alpha: 0, duration: 700, onComplete: () => puff.destroy() });
      },
    });
  }

  // Scène sur le pont, puis la traversée habituelle.
  async playDeck() {
    const cam = this.cameras.main;
    const dialog = this.scene.get('UI').dialog;
    const say = (pages, speaker) => dialog.open(pages, { speaker });
    const wait = (ms) => new Promise((resolve) => this.time.delayedCall(ms, resolve));

    // Ciel et mer qui s'éloigne vers le haut.
    this.add.rectangle(0, 0, SCREEN_W, SKY_H, 0xa8d8f8).setOrigin(0);
    this.add.rectangle(0, SKY_H - 3, SCREEN_W, 3, 0xd0ecf8).setOrigin(0);
    this.sea = this.add.tileSprite(0, SKY_H, SCREEN_W, SCREEN_H - SKY_H, FRLG_SHEETS.travelSea).setOrigin(0);
    this.seaSpeed = { x: 0, y: -0.6 };
    this.drawDeck();
    const family = Object.fromEntries(FAMILY.map((f) => {
      const image = this.add.image(f.x, DECK_Y + 16, sheetOf(f.sprite).key, `${f.sprite}-up-0`).setOrigin(0.5, 1).setDepth(2);
      return [f.id, { ...f, image }];
    }));
    const face = (id, dir) => family[id].image.setFrame(`${family[id].sprite}-${dir}-0`);


    cam.fadeIn(600);
    await wait(1200);
    await say(['Regarde-la bien.'], 'Maman');
    await say(['Elle ne va pas bouger. On reviendra.'], 'Papa');
    face('manon', 'left');
    await wait(300);
    await say(['Manon te montre son coquillage, à voix basse.']);
    await say(['Tu as le tien ?'], 'Manon');
    face('pierre', 'right');
    await wait(500);
    face('manon', 'up');
    face('pierre', 'up');
    await say(['Tu emportes la joie de vivre de Maman, le pragmatisme de Papa et la complicité de Manon.']);

    await wait(1500);
    cam.fadeOut(800);
    cam.once('camerafadeoutcomplete', () => this.scene.restart({ next: this.next }));
  }

  // Pont du ferry : bastingage blanc et plancher, au premier plan.
  drawDeck() {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0xe8e8e0, 1).fillRect(0, DECK_Y, SCREEN_W, SCREEN_H - DECK_Y);
    g.fillStyle(0xc8c8c0, 1);
    for (let y = DECK_Y + 7; y < SCREEN_H; y += 8) g.fillRect(0, y, SCREEN_W, 1);
    g.fillStyle(0xa0a098, 1).fillRect(0, DECK_Y, SCREEN_W, 2);
    // Bastingage : poteaux, lisse du milieu, main courante.
    g.fillStyle(0x505860, 1);
    for (let x = 4; x < SCREEN_W; x += 16) g.fillRect(x, RAIL_Y, 3, DECK_Y - RAIL_Y);
    g.fillRect(0, RAIL_Y + 5, SCREEN_W, 2);
    g.fillStyle(0xf8f8f8, 1);
    for (let x = 5; x < SCREEN_W; x += 16) g.fillRect(x, RAIL_Y, 1, DECK_Y - RAIL_Y);
    g.fillStyle(0x505860, 1).fillRect(0, RAIL_Y - 1, SCREEN_W, 4);
    g.fillStyle(0xf8f8f8, 1).fillRect(0, RAIL_Y, SCREEN_W, 2);
  }

  update() {
    if (!this.sea) return;
    this.sea.tilePositionX += this.seaSpeed.x;
    this.sea.tilePositionY += this.seaSpeed.y;
  }
}
