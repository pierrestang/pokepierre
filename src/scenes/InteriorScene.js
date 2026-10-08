import { MapScene } from './MapScene.js';
import { interiors } from '../data/maps/interiors.js';
import { MAPS } from '../data/maps/index.js';
import { sfx } from '../systems/audio.js';
import { meetsConditions } from '../systems/flags.js';

// Scène générique pour tous les intérieurs ; le contenu vient de data/maps/interiors.js.
export class InteriorScene extends MapScene {
  constructor() {
    super('Interior');
  }

  // fromMap : carte extérieure où l'on retourne en sortant ;
  // spawn : position imposée (reprise d'une partie sauvegardée).
  create({ interior, fromMap, spawn }) {
    this.interiorId = interior;
    this.fromMap = fromMap;
    const room = interiors[interior];
    this.setupMap({ id: interior, ...room }, spawn ?? room.spawn);
  }

  // Dans un bâtiment, on affiche la ville où il se trouve.
  cityName() {
    return MAPS[this.fromMap]?.name ?? '';
  }

  location() {
    return { scene: 'Interior', data: { interior: this.interiorId, fromMap: this.fromMap } };
  }

  // `exitLock` : { conditions, dialogue } — tant que ses conditions sont remplies, la sortie est fermée : sa réplique,
  // puis Pierre revient sur la case d'où il venait (ex. l'appartement de Bordeaux à ranger après la soirée).
  onTileEntered(tile, x, y) {
    if (tile.exit) {
      const lock = this.map.exitLock;
      if (lock && meetsConditions(lock)) {
        const { facing } = this.player;
        const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[facing];
        const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[facing];
        this.runScript([{ say: lock.dialogue }, { goTo: [x - dx, y - dy], facing: back }]);
        return;
      }
      sfx('door');
      this.goTo('Overworld', { mapId: this.fromMap, fromInterior: this.interiorId });
    }
  }
}
