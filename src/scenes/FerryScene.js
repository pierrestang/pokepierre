import Phaser from 'phaser';
import { gameView, SCREEN_W, SCREEN_H } from '../systems/screen.js';
import { FRLG_SHEETS, familyCarImage, roadStripTexture, ROAD_TOP } from '../art/frlgArt.js';
import { sheetOf } from '../art/spriteSheets.js';
import { lookOf } from '../data/characters.js';
import { carryText } from '../data/story.js';
import { sfx } from '../systems/audio.js';

// Traversée en ferry, comme l'écran de voyage des îles Sevii dans Rouge Feu : entre deux bandes noires,
// la mer défile vers la gauche et le ferry file vers la droite dans son sillage, en tanguant.
// Au bout de quelques secondes, fondu au noir puis arrivée (`next` : { sceneKey, data }).
// `deck: true` : la traversée commence sur le pont du ferry (départ de Fort-de-France) : la famille,
// accoudée au bastingage, regarde la mer vers l'île qu'elle quitte ; le capitaine (l'ancien pêcheur) vient
// raconter ses poissons, sans fin. À la fin de la traversée, juste avant le fondu vers Saint-Ay, l'encart des vertus
// emportées de l'île (`carry`).
// `plane: true` : en avion, vu de haut au-dessus des nuages qui défilent (vers Hull).
// `road: true` : même écran de voyage, mais en voiture : la campagne défile vers la gauche, la voiture de la
// famille roule vers la droite sur la route de terre, en vibrant, avec des bouffées de fumée.
const DURATION = 3600;
const FADE_MS = 400;
const BAND = 36;            // hauteur des bandes noires (en pixels de l'écran de jeu)
const SPEED = 3;            // défilement de la mer, en pixels par image
// Les trois nuages de public/assets/travel/nuages.png (x, y, largeur, hauteur ; voir scripts/build_travel_art.py).
const CLOUD_FRAMES = [[0, 0, 72, 30], [72, 6, 52, 24], [124, 12, 36, 18]];

// Pont du ferry
const SKY_H = 26;           // ciel au-dessus de l'horizon
const RAIL_Y = 124;         // main courante du bastingage
const DECK_Y = 134;         // début du plancher du pont
// La famille, de dos, de gauche à droite (sprites : voir data/characters.js).
const FAMILY = [
  { id: 'maman', x: 138 },
  { id: 'papa', x: 162 },
  { id: 'pierre', x: 194 },
  { id: 'manon', x: 218 },
];

export class FerryScene extends Phaser.Scene {
  constructor() {
    super('Ferry');
  }

  // Images du trajet en avion (scripts/build_travel_art.py).
  preload() {
    const base = `${import.meta.env.BASE_URL}assets/travel/`;
    if (!this.textures.exists('travel-avion')) this.load.image('travel-avion', `${base}avion.png`);
    if (!this.textures.exists('travel-nuages')) this.load.image('travel-nuages', `${base}nuages.png`);
    if (!this.textures.exists('travel-ocean')) this.load.image('travel-ocean', `${base}ocean.png`);
  }

  create({ next, deck, road, plane, carry }) {
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
    else if (plane) this.playPlane();
    else {
      this.sea = this.add.tileSprite(0, BAND, SCREEN_W, SCREEN_H - 2 * BAND, FRLG_SHEETS.travelSea).setOrigin(0);
      this.seaSpeed = { x: SPEED, y: 0 };
      const ferry = this.add.image(SCREEN_W / 2 + 30, SCREEN_H / 2, FRLG_SHEETS.ferryWake);
      this.tweens.add({ targets: ferry, y: ferry.y + 2, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    cam.fadeIn(FADE_MS);
    this.time.delayedCall(DURATION, async () => {
      if (carry) await this.scene.get('UI').dialog.open([carry]);
      cam.fadeOut(FADE_MS);
      cam.once('camerafadeoutcomplete', () => this.scene.start(next.sceneKey, next.data));
    });
  }

  // Trajet en avion, comme celui du ferry : entre les deux bandes noires, l'océan et ses îles défilent loin dessous, des
  // nuages passent sous l'avion puis par-dessus (plus vite, plus près), l'avion de ligne (vu de trois quarts, comme le
  // ferry) file vers la droite en tanguant, deux traînées de condensation derrière lui. Images :
  // scripts/build_travel_art.py (public/assets/travel/).
  playPlane() {
    const h = SCREEN_H - 2 * BAND;
    this.sea = this.add.tileSprite(0, BAND, SCREEN_W, h, 'travel-ocean').setOrigin(0);
    this.seaSpeed = { x: 1.2, y: 0 };
    const clouds = this.textures.get('travel-nuages');
    if (!clouds.has('c0')) CLOUD_FRAMES.forEach(([x, y, w, ch], i) => clouds.add(`c${i}`, 0, x, y, w, ch));
    // Deux couches de nuages : sous l'avion (lents, un peu transparents), au-dessus (rapides, plus gros).
    this.cloudLayers = [
      { depth: 1, speed: 2.2, alpha: 0.9, scale: 1, count: 4 },
      { depth: 4, speed: 4.5, alpha: 0.96, scale: 1.4, count: 2 },
    ].map((layer) => ({
      ...layer,
      sprites: Array.from({ length: layer.count }, (_, i) => this.add.image(
        (i + 0.5) * (SCREEN_W / layer.count) + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(BAND + 10, SCREEN_H - BAND - 10),
        'travel-nuages', `c${Phaser.Math.Between(0, CLOUD_FRAMES.length - 1)}`,
      ).setDepth(layer.depth).setAlpha(layer.alpha).setScale(layer.scale)),
    }));
    const plane = this.add.image(SCREEN_W / 2 + 24, SCREEN_H / 2, 'travel-avion').setDepth(3);
    this.tweens.add({ targets: plane, y: plane.y + 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: plane, angle: { from: -1.5, to: 1.5 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Traînées : des bouffées blanches qui partent du réacteur et de la queue, filent vers l'arrière et s'effacent.
    const trail = (dx, dy) => {
      const puff = this.add.rectangle(plane.x + dx, plane.y + dy, 4, 3, 0xf8fbff).setDepth(2).setAlpha(0.9);
      this.tweens.add({
        targets: puff, x: puff.x - 90, scaleX: 3, scaleY: 1.6, alpha: 0, duration: 900, onComplete: () => puff.destroy(),
      });
    };
    this.time.addEvent({ delay: 40, loop: true, callback: () => { trail(-8, 16); trail(-52, -2); } });
    sfx('jet');
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
    const family = Object.fromEntries(FAMILY.map((member) => {
      const f = { ...member, sprite: lookOf({ id: member.id }).sprite };
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

    // Le capitaine arrive par la droite et se poste à côté de Pierre : monologue sur les poissons.
    const captainSprite = lookOf({ id: 'capitaine', name: 'Capitaine du ferry' }).sprite;
    const captain = this.add.image(SCREEN_W + 12, DECK_Y + 30, sheetOf(captainSprite).key, `${captainSprite}-left-0`)
      .setOrigin(0.5, 1).setDepth(3);
    await new Promise((resolve) => this.tweens.add({ targets: captain, x: 250, duration: 1400, onComplete: resolve }));
    face('pierre', 'right');
    const CAPTAIN = 'Capitaine du ferry';
    await say(['Alors, petit, tu sais ce qui nage sous nos pieds ?', 'Des thons, des daurades, des balarous… et même des poissons volants !'], CAPTAIN);
    await say(["Le meilleur moment pour pêcher, c'est à l'aube, quand la mer est d'huile. Après, ils se méfient."], CAPTAIN);
    await say(['Les coryphènes, quand on les sort de l\'eau, elles changent de couleur : bleu, vert, or…'], CAPTAIN);
    await say(['Et mon plus gros ? Un marlin bleu, long comme ce ferry ! Bon… presque. Mais il tirait comme un bœuf !'], CAPTAIN);
    await say(['Le capitaine continue… et continue encore. La traversée va être longue.']);
    face('pierre', 'up');

    await wait(1500);
    cam.fadeOut(800);
    const carry = carryText('fortDeFrance');
    cam.once('camerafadeoutcomplete', () => this.scene.restart({ next: this.next, carry }));
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
    // Nuages du trajet en avion : ils filent vers la gauche et reviennent par la droite, à une autre hauteur.
    for (const layer of this.cloudLayers ?? []) {
      for (const c of layer.sprites) {
        c.x -= layer.speed;
        if (c.x < -c.displayWidth / 2) {
          c.x = SCREEN_W + c.displayWidth / 2 + Phaser.Math.Between(0, 60);
          c.y = Phaser.Math.Between(BAND + 10, SCREEN_H - BAND - 10);
          c.setFrame(`c${Phaser.Math.Between(0, CLOUD_FRAMES.length - 1)}`);
        }
      }
    }
  }
}
