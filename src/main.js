import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { OverworldScene } from './scenes/OverworldScene.js';
import { InteriorScene } from './scenes/InteriorScene.js';
import { UIScene } from './scenes/UIScene.js';
import { souvenirs } from './systems/souvenirs.js';
import { flags } from './systems/flags.js';
import { items } from './systems/items.js';
import { eraseSave } from './systems/save.js';

// La police des dialogues doit être chargée avant de dessiner le premier texte (1,5 s au plus).
await Promise.race([
  document.fonts.load('24px "Pixelify Sans"').catch(() => {}),
  new Promise((resolve) => setTimeout(resolve, 1500)),
]);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // Le canvas remplit toute la fenêtre ; chaque scène adapte son zoom à la carte.
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  backgroundColor: '#000000',
  pixelArt: true,
  // UIScene en dernier : elle s'affiche par-dessus les scènes de jeu.
  scene: [BootScene, TitleScene, OverworldScene, InteriorScene, UIScene],
});

// Accès console en dev (tests manuels) : window.game, game.souvenirs, game.flags, game.items,
// game.resetSave() pour effacer la sauvegarde (retour à l'écran titre).
if (import.meta.env.DEV) {
  window.game = game;
  game.souvenirs = souvenirs;
  game.flags = flags;
  game.items = items;
  game.resetSave = () => {
    eraseSave();
    location.reload();
  };
}
