import Phaser from 'phaser';
import { DialogBox } from '../systems/DialogBox.js';
import { souvenirs, souvenirEvents } from '../systems/souvenirs.js';
import { traitsOfCity } from '../data/story.js';
import { items, itemEvents } from '../systems/items.js';
import { gameView } from '../systems/screen.js';
import { FRLG_FONT, frlgText } from '../systems/frlgFont.js';
import { StartMenu } from '../systems/StartMenu.js';
import { TouchControls, isTouchDevice } from '../systems/TouchControls.js';
import { showPostcard, WordEntry } from '../systems/StoryScreens.js';

// Étiquette en haut à gauche de l'écran de jeu, façon panneau de lieu de Rouge Feu (cadre bleu-gris,
// fond blanc, police de Rouge Feu). Comme dans le jeu, elle descend quand sa valeur change puis remonte au bout de 2,5 s.
// `row` : rang de l'étiquette. Renvoie set(value, show = true).
function createLabel(scene, row) {
  const bg = scene.add.graphics();
  const text = scene.add.bitmapText(0, 0, FRLG_FONT, '');
  const label = scene.add.container(0, 0, [bg, text]).setDepth(90).setVisible(false);
  let hideTimer = null;
  const draw = () => {
    const v = gameView(scene.scale);
    const u = v.zoom;
    const x = v.x + 2 * u;
    const y = v.y + 2 * u + row * 17 * u;
    text.setScale(u).setPosition(x + 5 * u, y + u);
    bg.clear();
    bg.fillStyle(0x6888a8, 1).fillRoundedRect(x, y, text.width + 10 * u, 16 * u, 2 * u);
    bg.fillStyle(0xf8f8f8, 1).fillRoundedRect(x + u, y + u, text.width + 8 * u, 14 * u, 1.5 * u);
    return { v, y };
  };
  scene.scale.on('resize', draw);
  scene.events.once('shutdown', () => scene.scale.off('resize', draw));
  return (value, show = true) => {
    text.setText(frlgText(scene, value ?? ''));
    const { v, y } = draw();
    if (!show || !value) return;
    const hidden = -(y - v.y + 18 * v.zoom);                          // hors de l'écran de jeu, au-dessus
    scene.tweens.killTweensOf(label);
    hideTimer?.remove();
    label.setVisible(true).setY(hidden);
    scene.tweens.add({ targets: label, y: 0, duration: 250, ease: 'Quad.easeOut' });
    hideTimer = scene.time.delayedCall(2500, () => {
      scene.tweens.add({ targets: label, y: hidden, duration: 250, ease: 'Quad.easeIn', onComplete: () => label.setVisible(false) });
    });
  };
}

// Interface affichée par-dessus les scènes de jeu (sans zoom) :
// nom de la ville, compteur des vertus de la ville, objets (touche I pour le sac), dialogues,
// menu Start (Échap) et commandes tactiles sur téléphone.
// La ville vient du registre du jeu (`city`), mis à jour par les scènes de carte.
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  // Écrans des scénettes (voir systems/StoryScreens.js) : carte postale d'ouverture, saisie d'un mot.
  showPostcard(id) {
    return showPostcard(this, id);
  }

  askWord(options) {
    return this.wordEntry.open(options);
  }

  create() {
    this.dialog = new DialogBox(this);
    // Rideau noir des scénettes (écran noir du réveil…), sous la boîte de dialogue.
    this.curtain = this.add.rectangle(0, 0, 8000, 8000, 0x000000).setOrigin(0).setDepth(95).setAlpha(0);
    this.menu = new StartMenu(this, this.dialog);          // Échap
    this.wordEntry = new WordEntry(this);                  // saisie d'un mot (mot de passe de la cabane)
    if (isTouchDevice()) this.touch = new TouchControls(this);

    const setCity = createLabel(this, 0);
    // Vertus de la ville en cours (« Vertus : 1 / 3 »), sous son nom ; rien dans une ville sans traits.
    const setTraits = createLabel(this, 1);
    const renderTraits = (show = true) => {
      const all = traitsOfCity(this.registry.get('cityId'));
      const got = all.filter((t) => souvenirs.has(t.id)).length;
      setTraits(all.length ? `Vertus : ${got} / ${all.length}` : '', show);
    };
    const showCity = (value) => {
      setCity(value);
      renderTraits(Boolean(value));
    };
    setCity(this.registry.get('city') ?? '');
    renderTraits(false);
    const onCity = (_parent, value) => showCity(value);
    // Première valeur : événement général `setdata` ; changements suivants : `changedata-city`. L'id de la ville
    // (`cityId`) est posé juste après son nom : le compteur est redessiné à ce moment-là.
    const onFirstSet = (_parent, key, value) => {
      if (key === 'city') setCity(value);
      if (key === 'cityId') renderTraits();
    };
    const onCityId = () => renderTraits();
    this.registry.events.on('setdata', onFirstSet);
    this.registry.events.on('changedata-city', onCity);
    this.registry.events.on('changedata-cityId', onCityId);
    const render = () => renderTraits();
    souvenirEvents.on('change', render);

    const setItems = createLabel(this, 2);
    const renderItems = (count, show = true) => setItems(`Objets : ${count}`, show);
    renderItems(items.count(), false);
    itemEvents.on('change', renderItems);

    // Touche I : le sac (objets avec leurs icônes), comme Start > OBJETS.
    this.input.keyboard.on('keydown', (e) => {
      if (e.key !== 'i' && e.key !== 'I') return;
      if (this.dialog.isOpen || this.menu.isOpen) return;
      this.menu.openItemBag();
    });

    this.events.once('shutdown', () => {
      itemEvents.off('change', renderItems);
      souvenirEvents.off('change', render);
      this.registry.events.off('setdata', onFirstSet);
      this.registry.events.off('changedata-city', onCity);
      this.registry.events.off('changedata-cityId', onCityId);
    });
  }
}
