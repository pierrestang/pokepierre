import Phaser from 'phaser';
import { DialogBox } from '../systems/DialogBox.js';
import { souvenirs, souvenirEvents } from '../systems/souvenirs.js';
import { items, itemEvents } from '../systems/items.js';

// Étiquette arrondie en haut à gauche (fond sombre + cadre clair).
function createLabel(scene, y) {
  const bg = scene.add.graphics();
  const text = scene.add.text(22, y + 6, '', {
    fontFamily: 'monospace', fontSize: '18px', color: '#303030', fontStyle: 'bold',
  });
  return (value) => {
    text.setText(value);
    bg.clear();
    bg.fillStyle(0x283048, 0.9).fillRoundedRect(10, y, text.width + 24, 32, 8);
    bg.fillStyle(0xf8f8f8, 1).fillRoundedRect(13, y + 3, text.width + 18, 26, 6);
  };
}

// Interface affichée par-dessus les scènes de jeu (sans zoom) :
// nom de la ville, compteur de souvenirs, objets (touche I pour la liste), dialogues.
// La ville vient du registre du jeu (`city`), mis à jour par les scènes de carte.
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.dialog = new DialogBox(this);

    const setCity = createLabel(this, 8);
    setCity(this.registry.get('city') ?? '');
    const onCity = (_parent, value) => setCity(value);
    // Première valeur : événement général `setdata` ; changements suivants : `changedata-city`.
    const onFirstSet = (_parent, key, value) => key === 'city' && setCity(value);
    this.registry.events.on('setdata', onFirstSet);
    this.registry.events.on('changedata-city', onCity);

    const setSouvenirs = createLabel(this, 46);
    const render = (count) => setSouvenirs(`Souvenirs : ${count}`);
    render(souvenirs.count());
    souvenirEvents.on('change', render);

    const setItems = createLabel(this, 84);
    const renderItems = (count) => setItems(`Objets : ${count}  (I)`);
    renderItems(items.count());
    itemEvents.on('change', renderItems);

    // Touche I : liste des objets dans la boîte de dialogue.
    this.input.keyboard.on('keydown', (e) => {
      if (e.key !== 'i' && e.key !== 'I') return;
      if (this.dialog.isOpen) return;
      const names = items.list().map((i) => i.name);
      this.dialog.open(names.length ? [`Tes objets : ${names.join(', ')}.`] : ["Tu n'as encore aucun objet."]);
    });

    this.events.once('shutdown', () => {
      itemEvents.off('change', renderItems);
      souvenirEvents.off('change', render);
      this.registry.events.off('setdata', onFirstSet);
      this.registry.events.off('changedata-city', onCity);
    });
  }
}
