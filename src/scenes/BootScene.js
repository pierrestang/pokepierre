import Phaser from 'phaser';
import { preloadSpriteSheets, registerSpriteSheets } from '../art/spriteSheets.js';
import { preloadFrlg } from '../art/frlgArt.js';
import { preloadFrlgFont } from '../systems/frlgFont.js';
import { preloadUiIcons } from '../art/uiIcons.js';
import { preloadBunting } from '../art/bunting.js';
import { preloadPartyMess } from '../art/partyMess.js';
import { MAPS } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';
import {
  requestedBuiltMap, loadBuiltMap, preloadBuiltMap, bakeBuiltMap, preloadBuiltLooks, gameMapOf, useBuiltLook, protectSave,
} from '../systems/builtMaps.js';

// Point d'entrée : charge les images, puis affiche l'écran titre (qui lance ensuite l'interface et la partie).
// Avec ?carte=<id> dans l'adresse : ouvre directement une carte du créateur de cartes (voir systems/builtMaps.js). Une
// carte du jeu (Saint-Ay, Hull…) s'ouvre dans son contexte : ses PNJ, ses portes, l'histoire de la partie, sans
// rien enregistrer ; une autre carte s'ouvre seule.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    preloadSpriteSheets(this);
    preloadFrlg(this);
    preloadFrlgFont(this);
    preloadUiIcons(this);
    preloadBunting(this);
    preloadPartyMess(this);
    preloadBuiltLooks(this, MAPS);                 // cartes du jeu dessinées avec le créateur (ex. Fort-de-France)
    preloadBuiltLooks(this, interiors);            // intérieurs redessinés en Gen 4 (scripts/build_interiors.py)
    this.builtMap = requestedBuiltMap() && loadBuiltMap(requestedBuiltMap());
    if (this.builtMap) {
      protectSave();
      preloadBuiltMap(this, this.builtMap);
    }
  }

  create() {
    registerSpriteSheets(this);
    const gameMap = this.builtMap && gameMapOf(MAPS, this.builtMap);
    if (gameMap) {
      useBuiltLook(gameMap, this.builtMap);
      this.scene.launch('UI');
      this.scene.start('Overworld', { mapId: gameMap.id, spawn: this.builtMap.spawn });
      return;
    }
    if (this.builtMap) {
      const map = bakeBuiltMap(this, this.builtMap);
      MAPS[map.id] = map;
      this.scene.launch('UI');
      this.scene.start('Overworld', { mapId: map.id });
      return;
    }
    this.scene.start('Title');
  }
}
