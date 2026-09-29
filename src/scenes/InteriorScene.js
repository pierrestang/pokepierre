import { MapScene } from './MapScene.js';
import { interiors } from '../data/maps/interiors.js';
import { MAPS } from '../data/maps/index.js';

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

  onTileEntered(tile) {
    if (tile.exit) this.goTo('Overworld', { mapId: this.fromMap, fromInterior: this.interiorId });
  }
}
