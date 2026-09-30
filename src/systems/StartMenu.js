import { gameView } from './screen.js';
import { FRLG_FONT, LINE_HEIGHT, frlgText } from './frlgFont.js';
import { souvenirs } from './souvenirs.js';
import { items } from './items.js';
import { sfx, options, setMusicEnabled, setSfxEnabled } from './audio.js';
import { RegionMap } from './RegionMap.js';

// Menu Start façon Pokémon (touche Échap) : panneau en haut à droite de l'écran de jeu.
// Carte (du voyage), Souvenirs, Objets, Sauvegarder, Options (musique, sons), Quitter la partie (retour à
// l'écran titre), Fermer.
// Flèches haut/bas pour choisir, Entrée / Espace pour valider, Échap pour fermer.
// Vit dans la UIScene ; les scènes de carte bloquent le joueur tant qu'il est ouvert (`isOpen`).
const FRAME = 0x6888a8;
const FRAME_LIGHT = 0xb8d0e8;

export class StartMenu {
  constructor(scene, dialog) {
    this.scene = scene;
    this.dialog = dialog;
    this.isOpen = false;
    this.closedAt = 0;
    this.index = 0;
    this.bg = scene.add.graphics().setDepth(110);
    this.texts = [];
    this.container = scene.add.container(0, 0, [this.bg]).setDepth(110).setVisible(false);
    this.regionMap = new RegionMap(scene);
    scene.input.keyboard.on('keydown', (e) => this.onKey(e));
    const onResize = () => this.isOpen && this.render();
    scene.scale.on('resize', onResize);
    scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
  }

  // Scène de carte active (le menu ne s'ouvre qu'en jeu).
  mapScene() {
    return this.scene.game.scene.getScenes(true).find((s) => s.player && s.savePosition);
  }

  entries() {
    if (this.page === 'options') {
      return [
        { label: `MUSIQUE : ${options.music ? 'OUI' : 'NON'}`, action: () => { setMusicEnabled(!options.music); this.render(); } },
        { label: `SONS : ${options.sfx ? 'OUI' : 'NON'}`, action: () => { setSfxEnabled(!options.sfx); this.render(); } },
        { label: 'RETOUR', action: () => this.showPage('main', 4) },
      ];
    }
    return [
      { label: 'CARTE', action: () => this.showMap() },
      { label: 'SOUVENIRS', action: () => this.showInDialog(this.souvenirPages()) },
      { label: 'OBJETS', action: () => this.showInDialog(this.itemPages()) },
      { label: 'SAUVEGARDER', action: () => this.save() },
      { label: 'OPTIONS', action: () => this.showPage('options', 0) },
      { label: 'QUITTER LA PARTIE', action: () => this.quit() },
      { label: 'FERMER', action: () => this.close() },
    ];
  }

  souvenirPages() {
    const list = souvenirs.list().map((s) => s.name);
    return list.length ? [`Souvenirs (${list.length}) : ${list.join(', ')}.`] : ["Tu n'as encore aucun souvenir."];
  }

  itemPages() {
    const list = items.list().map((i) => i.name);
    return list.length ? [`Tes objets : ${list.join(', ')}.`] : ["Tu n'as encore aucun objet."];
  }

  open() {
    const map = this.mapScene();
    if (!map || map.transitioning || map.player.moving || this.dialog.isOpen) return;
    sfx('menu');
    this.isOpen = true;
    this.showPage('main', this.index);
  }

  close() {
    this.isOpen = false;
    this.closedAt = performance.now();
    this.container.setVisible(false);
  }

  showPage(page, index) {
    this.page = page;
    this.index = index;
    this.render();
  }

  // Carte du voyage, par-dessus le jeu ; le menu reste « ouvert » (le joueur ne bouge pas) jusqu'à sa fermeture.
  showMap() {
    const map = this.mapScene();
    this.container.setVisible(false);
    this.regionMap.open(map?.fromMap ?? map?.map.id);
  }

  async showInDialog(pages) {
    this.close();
    await this.dialog.open(pages);
  }

  async save() {
    this.close();
    this.mapScene()?.savePosition();
    sfx('save');
    await this.dialog.open(['Partie sauvegardée !']);
  }

  // Retour à l'écran titre, après avoir proposé de sauvegarder.
  async quit() {
    this.close();
    const choice = await this.dialog.choose("Quitter la partie et revenir à l'écran titre ?", [
      'SAUVEGARDER ET QUITTER', 'QUITTER SANS SAUVEGARDER', 'ANNULER',
    ]);
    if (choice !== 0 && choice !== 1) return;
    const map = this.mapScene();
    if (choice === 0) {
      map?.savePosition();
      sfx('save');
    }
    map?.scene.stop();
    this.scene.scene.start('Title');          // arrête aussi l'interface (relancée à la prochaine partie)
  }

  render() {
    const v = gameView(this.scene.scale);
    const u = v.zoom;
    const list = this.entries();
    this.texts.forEach((t) => t.destroy());
    this.texts = list.map((e, i) =>
      this.scene.add.bitmapText(0, 0, FRLG_FONT, frlgText(this.scene, `${i === this.index ? '▶ ' : '   '}${e.label}`)).setScale(u),
    );
    const lineH = LINE_HEIGHT * u;
    const w = Math.max(...this.texts.map((t) => t.width)) + 12 * u;
    const h = list.length * lineH + 6 * u;
    const x = v.x + v.w - w - 2 * u;
    const y = v.y + 2 * u;
    this.bg.clear();
    this.bg.fillStyle(FRAME, 1).fillRoundedRect(x, y, w, h, 3 * u);
    this.bg.fillStyle(FRAME_LIGHT, 1).fillRoundedRect(x + u, y + u, w - 2 * u, h - 2 * u, 2.5 * u);
    this.bg.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, 2 * u);
    this.texts.forEach((t, i) => {
      t.setPosition(x + 5 * u, y + 3 * u + i * lineH);
      this.container.add(t);
    });
    this.container.setVisible(true);
  }

  onKey(e) {
    if (!this.isOpen) {
      if (e.key === 'Escape') this.open();
      return;
    }
    if (this.regionMap.isOpen) {
      if (this.regionMap.onKey(e)) this.close();
      return;
    }
    const n = this.entries().length;
    if (e.key === 'Escape') {
      sfx('select');
      if (this.page === 'options') return this.showPage('main', 4);
      return this.close();
    }
    if (e.key === 'ArrowUp') this.index = (this.index - 1 + n) % n;
    else if (e.key === 'ArrowDown') this.index = (this.index + 1) % n;
    else if (e.key === 'Enter' || e.key === ' ') {
      sfx('confirm');
      return this.entries()[this.index].action();
    } else return;
    sfx('select');
    this.render();
  }
}
