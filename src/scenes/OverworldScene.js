import { MapScene } from './MapScene.js';
import { MAPS, START_MAP } from '../data/maps/index.js';
import { meetsConditions } from '../systems/flags.js';
import { sfx } from '../systems/audio.js';
import { TILE_SIZE } from '../data/tiles.js';

// Scène générique pour toutes les cartes extérieures (villes, routes).
export class OverworldScene extends MapScene {
  constructor() {
    super('Overworld');
    // Le vide autour d'une carte plus petite que l'écran est rempli d'arbres.
    this.surroundingTile = 'T';
  }

  // data.mapId : carte à afficher ; data.fromInterior : on réapparaît sous sa porte ;
  // data.spawn : position d'arrivée imposée (voyage depuis une autre carte).
  create({ mapId = START_MAP, fromInterior, spawn: arrival } = {}) {
    const map = MAPS[mapId];
    let spawn = arrival ?? map.spawn;
    const door = fromInterior && (map.doors ?? []).find((d) => d.interior === fromInterior && (!d.when || meetsConditions(d.when)));
    if (door) spawn = { x: door.x, y: door.y + 1, facing: 'down' };

    this.setupMap(map, spawn);
  }

  cityName() {
    return this.map.name;
  }

  location() {
    return { scene: 'Overworld', data: { mapId: this.map.id } };
  }

  // Une porte `when` (ex. l'échelle de la cabane) n'est pas une case 'D' : on y monte dès que ses conditions
  // sont remplies.
  onTileEntered(tile, x, y) {
    const door = (this.map.doors ?? []).find((d) => d.x === x && d.y === y && (d.when ? meetsConditions(d.when) : tile.door));
    if (!door) return;
    if (door.when) {
      this.climbLadder(door.interior);
      return;
    }
    // Porte verrouillée : { lock: { ifFlags?, unlessFlags? }, lockedDialogue } — ouverte si les conditions
    // sont remplies. Une porte sans `interior` reste toujours fermée.
    if (!door.interior || (door.lock && !meetsConditions(door.lock))) {
      sfx('bump');
      this.dialog.open(door.lockedDialogue);
      return;
    }
    this.enterDoor(x, y, door.interior);
  }

  // Pierre grimpe à l'échelle et disparaît sur la plateforme, puis fondu vers l'intérieur.
  climbLadder(interior) {
    if (this.transitioning) return;
    this.player.frozen = true;
    sfx('stairs');
    const sprite = this.player.sprite;
    sprite.setFacing('up');
    this.tweens.add({
      targets: sprite, y: sprite.y - 14, alpha: 0, duration: 380,
      onComplete: () => this.goTo('Interior', { interior, fromMap: this.map.id }),
    });
  }

  // Entrée par une porte : la porte s'ouvre (l'embrasure s'assombrit), Pierre avance dedans et
  // disparaît, puis fondu vers l'intérieur.
  enterDoor(x, y, interior) {
    if (this.transitioning) return;
    this.player.frozen = true;
    sfx('door');
    const S = TILE_SIZE;
    const opening = this.add.rectangle(x * S + 3, y * S - 1, 10, 16, 0x181820).setOrigin(0).setDepth(9).setScale(1, 0);
    this.tweens.add({ targets: opening, scaleY: 1, duration: 120, ease: 'Quad.easeOut' });
    const sprite = this.player.sprite;
    this.tweens.add({
      targets: sprite, y: sprite.y - 5, alpha: 0, delay: 110, duration: 170,
      onComplete: () => this.goTo('Interior', { interior, fromMap: this.map.id }),
    });
  }
}
