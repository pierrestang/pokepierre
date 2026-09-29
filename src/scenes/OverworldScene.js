import { MapScene } from './MapScene.js';
import { MAPS, START_MAP } from '../data/maps/index.js';
import { meetsConditions } from '../systems/flags.js';

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
    const door = fromInterior && map.doors.find((d) => d.interior === fromInterior);
    if (door) spawn = { x: door.x, y: door.y + 1, facing: 'down' };

    this.setupMap(map, spawn);
  }

  cityName() {
    return this.map.name;
  }

  location() {
    return { scene: 'Overworld', data: { mapId: this.map.id } };
  }

  onTileEntered(tile, x, y) {
    if (!tile.door) return;
    const door = this.map.doors.find((d) => d.x === x && d.y === y);
    if (!door) return;
    // Porte verrouillée : { lock: { ifFlags?, unlessFlags? }, lockedDialogue } — ouverte si les conditions
    // sont remplies. Une porte sans `interior` reste toujours fermée.
    if (!door.interior || (door.lock && !meetsConditions(door.lock))) {
      this.dialog.open(door.lockedDialogue);
      return;
    }
    this.goTo('Interior', { interior: door.interior, fromMap: this.map.id });
  }
}
