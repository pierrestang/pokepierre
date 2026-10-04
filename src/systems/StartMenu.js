import { gameView } from './screen.js';
import { FRLG_FONT, LINE_HEIGHT, frlgText } from './frlgFont.js';
import { souvenirs } from './souvenirs.js';
import { items } from './items.js';
import { sfx, options, setMusicEnabled, setSfxEnabled } from './audio.js';
import { drawFrame } from './frame.js';
import { RegionMap } from './RegionMap.js';
import { NpcLooks } from './NpcLooks.js';
import { ItemBag } from './ItemBag.js';
import { flags } from './flags.js';
import { eraseSave } from './save.js';
import { QUEST_STARTS, questState } from '../data/questStarts.js';
import { TRAIT_CITIES, traitById, traitsOfCity } from '../data/story.js';
import { MAPS } from '../data/maps/index.js';

// Menu Start façon Pokémon (touche Échap) : panneau en haut à droite de l'écran de jeu. Carte (du voyage),
// Vertus (le carnet, avec les souvenirs des PNJ), Objets (le sac, avec les icônes), Quêtes (aller au début de la
// quête d'une ville, pour tester), PNJ (choisir l'apparence de chaque personnage), Sauvegarder, Options (musique,
// sons), Quitter la partie (retour à l'écran titre), Fermer.
// Flèches haut/bas pour choisir, Entrée / Espace pour valider, Échap pour fermer.
// Vit dans la UIScene ; les scènes de carte bloquent le joueur tant qu'il est ouvert (`isOpen`).
const MAIN = { quests: 3, options: 6 };               // place de ces entrées dans le menu principal
const VISIBLE = 9;                           // lignes affichées à la fois (la liste des quêtes défile)

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
    this.npcLooks = new NpcLooks(scene);
    this.itemBag = new ItemBag(scene);
    scene.input.keyboard.on('keydown', (e) => this.onKey(e));
    const onResize = () => this.isOpen && !this.panel && this.render();   // un panneau se redessine lui-même
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
        { label: 'RETOUR', action: () => this.showPage('main', MAIN.options) },
      ];
    }
    if (this.page === 'quests') {
      return [
        ...QUEST_STARTS.map((q, i) => ({ label: q.label, action: () => this.goToQuest(i) })),
        { label: 'RETOUR', action: () => this.showPage('main', MAIN.quests) },
      ];
    }
    return [
      { label: 'CARTE', action: () => this.showPanel(this.regionMap, () => this.close(), this.currentMapId()) },
      { label: 'VERTUS', action: () => this.showInDialog(this.traitPages()) },
      { label: 'OBJETS', action: () => this.showPanel(this.itemBag, () => this.close()) },
      { label: 'QUÊTES', action: () => this.showPage('quests', 0) },
      { label: 'PNJ', action: () => this.showPanel(this.npcLooks, () => this.afterNpcLooks()) },
      { label: 'SAUVEGARDER', action: () => this.save() },
      { label: 'OPTIONS', action: () => this.showPage('options', 0) },
      { label: 'QUITTER LA PARTIE', action: () => this.quit() },
      { label: 'FERMER', action: () => this.close() },
    ];
  }

  // Carnet des vertus : une page par ville (vertus reçues / vertus de la ville), puis les souvenirs des PNJ.
  traitPages() {
    const pages = TRAIT_CITIES.map((city) => {
      const all = traitsOfCity(city);
      const got = all.filter((t) => souvenirs.has(t.id)).map((t) => t.name);
      return got.length ? `${MAPS[city]?.name ?? city} - ${got.length} / ${all.length} : ${got.join(', ')}.` : null;
    }).filter(Boolean);
    const others = souvenirs.list().filter((s) => !traitById(s.id)).map((s) => s.name);
    if (others.length) pages.push(`Souvenirs (${others.length}) : ${others.join(', ')}.`);
    return pages.length ? pages : ['Ton carnet des vertus est encore vide.'];
  }

  // Le menu ne s'ouvre qu'en jeu, le joueur à l'arrêt, hors scénette et sans dialogue en cours.
  canOpen() {
    const map = this.mapScene();
    return Boolean(map && !map.transitioning && !map.scripting && !map.player.moving && !this.dialog.isOpen);
  }

  open() {
    if (!this.canOpen()) return;
    sfx('menu');
    this.isOpen = true;
    this.showPage('main', this.index);
  }

  // Sac ouvert directement en jeu (touche I), sans passer par le menu.
  openItemBag() {
    if (!this.canOpen()) return;
    sfx('menu');
    this.isOpen = true;
    this.showPanel(this.itemBag, () => this.close());
  }

  close() {
    this.isOpen = false;
    this.panel = null;
    this.closedAt = performance.now();
    this.container.setVisible(false);
  }

  showPage(page, index) {
    this.page = page;
    this.index = index;
    this.render();
  }

  // Panneau plein écran par-dessus le jeu (carte du voyage, sac, apparences des PNJ) : le menu reste « ouvert »
  // (le joueur ne bouge pas) ; les touches vont au panneau, et `onClose` est appelé quand il se ferme.
  showPanel(panel, onClose, ...args) {
    this.container.setVisible(false);
    this.panel = { panel, onClose };
    panel.open(...args);
  }

  // Ville affichée sur la carte du voyage : celle d'où l'on vient pour un intérieur, sinon la carte actuelle.
  currentMapId() {
    const map = this.mapScene();
    return map?.fromMap ?? map?.map.id;
  }

  // Panneau PNJ fermé : si une apparence a changé, la scène est relancée sur place pour l'appliquer.
  afterNpcLooks() {
    this.close();
    const map = this.mapScene();
    if (!this.npcLooks.changed || !map) return;
    const { tileX: x, tileY: y, facing } = map.player;
    map.scene.restart({ ...map.location().data, spawn: { x, y, facing } });
  }

  async showInDialog(pages) {
    this.close();
    await this.dialog.open(pages);
  }

  // Début de la quête d'une ville : la partie est remplacée par l'état de l'histoire à ce moment-là (voir
  // data/questStarts.js), puis on y est transporté.
  async goToQuest(i) {
    this.close();
    const quest = QUEST_STARTS[i];
    const choice = await this.dialog.choose(`Aller au début de la quête : ${quest.label} ? Ta partie sera remplacée.`, ['ALLER', 'ANNULER']);
    if (choice !== 0) return;
    const state = questState(i);
    eraseSave();
    state.flags.forEach((f) => flags.add(f));
    state.souvenirs.forEach((s) => souvenirs.add(s));
    state.items.forEach((item) => items.add(item));
    const { map: mapId, interior, fromMap, ...spawn } = quest.go;
    const scene = this.mapScene();
    if (interior) scene?.goTo('Interior', { interior, fromMap });
    else scene?.goTo('Overworld', { mapId, spawn });
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
    const all = this.entries();
    // Liste longue : fenêtre de VISIBLE lignes qui suit la sélection, flèches ↑ ↓ s'il y en a d'autres.
    const first = Math.max(0, Math.min(this.index - Math.floor(VISIBLE / 2), all.length - VISIBLE));
    const list = all.slice(first, first + VISIBLE);
    this.texts.forEach((t) => t.destroy());
    this.texts = list.map((e, j) => {
      const i = first + j;
      const more = (j === 0 && first > 0) ? ' ↑' : (j === list.length - 1 && first + VISIBLE < all.length) ? ' ↓' : '';
      return this.scene.add.bitmapText(0, 0, FRLG_FONT, frlgText(this.scene, `${i === this.index ? '▶ ' : '   '}${e.label}${more}`)).setScale(u);
    });
    const lineH = LINE_HEIGHT * u;
    const w = Math.max(...this.texts.map((t) => t.width)) + 12 * u;
    const h = list.length * lineH + 6 * u;
    const x = v.x + v.w - w - 2 * u;
    const y = v.y + 2 * u;
    this.bg.clear();
    drawFrame(this.bg, x, y, w, h, u);
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
    if (this.panel) {
      if (this.panel.panel.onKey(e)) this.panel.onClose();
      return;
    }
    const n = this.entries().length;
    if (e.key === 'Escape') {
      sfx('select');
      if (this.page === 'options') return this.showPage('main', MAIN.options);
      if (this.page === 'quests') return this.showPage('main', MAIN.quests);
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
