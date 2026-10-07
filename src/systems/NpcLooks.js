import { SCREEN_W, SCREEN_H } from './screen.js';
import { sfx } from './audio.js';
import { FullScreenPanel, BAR } from './FullScreenPanel.js';
import { SHEETS, sheetOf } from '../art/spriteSheets.js';
import { BY_NAME, lookChoices, spriteForName, defaultSpriteOf } from '../data/characters.js';
import { MAPS } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';

// Menu Start > PNJ : tous les personnages avec leur sprite ; on peut donner à chacun n'importe quel sprite des
// personnages de la quatrième génération (`g{n}`, voir art/spriteSheets.js). Le
// choix est gardé par nom (voir data/characters.js, lookChoices) et vaut pour tous les personnages de ce nom.
// Deux écrans, dans le style de la carte du voyage : la liste (deux colonnes), puis la grille des sprites.
const LIST_ROWS = 8;                              // personnages par colonne
const LIST_ROW_H = 26;
const GRID_COLS = 12;
const GRID_ROWS = 6;
const CELL_W = 28;
const CELL_H = 32;
const NOT_LISTED = ['Poule', 'Chat', 'Anais', 'Leo'];   // animaux, et doublons d'orthographe

// Personnages : ceux qui ont une apparence attribuée (Pierre et la famille d'abord), puis tous les autres
// noms de PNJ des cartes et des intérieurs (figurants compris).
function characterNames() {
  const names = new Set(Object.keys(BY_NAME));
  for (const place of [...Object.values(MAPS), ...Object.values(interiors)]) {
    for (const npc of place.npcs ?? []) if (npc.name) names.add(npc.name);
  }
  return [...names].filter((n) => !NOT_LISTED.includes(n));
}

// Tous les sprites des planches de personnages.
const ALL_SPRITES = Object.entries(SHEETS).flatMap(([letter, sheet]) => Array.from({ length: sheet.count }, (_, i) => `${letter}${i}`));

export class NpcLooks extends FullScreenPanel {
  open() {
    this.names = characterNames();
    this.index = 0;
    this.picking = null;              // nom dont on choisit le sprite (grille ouverte)
    this.changed = false;
    this.isOpen = true;
    this.render();
  }

  render() {
    this.begin();
    const g = this.add(this.scene.add.graphics());
    this.drawBars(g, 0x2070e8, 0xf8f8f0);
    if (this.picking) this.renderGrid(g);
    else this.renderList(g);
  }

  sprite(id, x, bottom) {
    return this.add(this.scene.add.image(this.X(x), this.Y(bottom), sheetOf(id).key, `${id}-down-0`).setOrigin(0.5, 1).setScale(this.u));
  }

  // Liste : deux colonnes de LIST_ROWS personnages, la page suit la sélection.
  renderList(g) {
    const perPage = 2 * LIST_ROWS;
    const page = Math.floor(this.index / perPage);
    const pages = Math.ceil(this.names.length / perPage);
    this.text('PNJ — APPARENCES', 6, 1, 0xffffff);
    this.text(`Page ${page + 1} / ${pages}`, SCREEN_W - 70, 1, 0xffffff);
    this.names.slice(page * perPage, (page + 1) * perPage).forEach((name, j) => {
      const i = page * perPage + j;
      const x = j < LIST_ROWS ? 6 : SCREEN_W / 2 + 2;
      const y = BAR + 2 + (j % LIST_ROWS) * LIST_ROW_H;
      if (i === this.index) {
        g.fillStyle(0x90c0f8, 1).fillRoundedRect(this.X(x - 2), this.Y(y), (SCREEN_W / 2 - 8) * this.u, (LIST_ROW_H - 2) * this.u, 2 * this.u);
      }
      const id = spriteForName(name);
      this.sprite(id, x + 10, y + LIST_ROW_H - 3);
      const mark = lookChoices.get(name) ? ' *' : defaultSpriteOf(name) ? '' : ' (figurant)';
      this.text(`${name}${mark}`, x + 24, y + 4);
    });
    this.text('Flèches : choisir   Entrée : changer   Échap : fermer', 6, SCREEN_H - BAR + 1, 0xffffff);
  }

  // Grille de tous les sprites, page par page ; cadre autour de la sélection.
  renderGrid(g) {
    const perPage = GRID_COLS * GRID_ROWS;
    const page = Math.floor(this.cursor / perPage);
    const pages = Math.ceil(ALL_SPRITES.length / perPage);
    const current = spriteForName(this.picking);
    this.text(`APPARENCE : ${this.picking.toUpperCase()}`, 6, 1, 0xffffff);
    const id = ALL_SPRITES[this.cursor];
    this.text(`${sheetOf(id).label} ${id.slice(1)}   ${page + 1}/${pages}`, SCREEN_W - 122, 1, 0xffffff);
    ALL_SPRITES.slice(page * perPage, (page + 1) * perPage).forEach((id, j) => {
      const i = page * perPage + j;
      const x = 12 + (j % GRID_COLS) * CELL_W;
      const y = BAR + 4 + Math.floor(j / GRID_COLS) * CELL_H;
      if (i === this.cursor) g.fillStyle(0x90c0f8, 1).fillRoundedRect(this.X(x), this.Y(y), (CELL_W - 2) * this.u, (CELL_H - 2) * this.u, 2 * this.u);
      if (id === current) g.lineStyle(this.u, 0xe03828, 1).strokeRoundedRect(this.X(x), this.Y(y), (CELL_W - 2) * this.u, (CELL_H - 2) * this.u, 2 * this.u);
      this.sprite(id, x + (CELL_W - 2) / 2, y + CELL_H - 4);
    });
    this.text('Entrée : choisir   Suppr : par défaut   Échap : retour', 6, SCREEN_H - BAR + 1, 0xffffff);
  }

  // Touche pendant que le panneau est ouvert. Renvoie vrai quand il se ferme.
  onKey(e) {
    if (this.picking) return this.onGridKey(e);
    const n = this.names.length;
    if (e.key === 'Escape') {
      sfx('select');
      this.close();
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      sfx('confirm');
      this.picking = this.names[this.index];
      this.cursor = Math.max(0, ALL_SPRITES.indexOf(spriteForName(this.picking)));
      this.render();
      return false;
    }
    const delta = { ArrowDown: 1, ArrowUp: -1, ArrowRight: LIST_ROWS, ArrowLeft: -LIST_ROWS }[e.key];
    if (!delta) return false;
    this.index = Math.min(n - 1, Math.max(0, this.index + delta));
    sfx('select');
    this.render();
    return false;
  }

  onGridKey(e) {
    const n = ALL_SPRITES.length;
    if (e.key === 'Escape') {
      sfx('select');
      this.picking = null;
    } else if (e.key === 'Enter' || e.key === ' ') {
      sfx('confirm');
      const id = ALL_SPRITES[this.cursor];
      lookChoices.set(this.picking, id === defaultSpriteOf(this.picking) ? null : id);
      this.changed = true;
      this.picking = null;
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      sfx('confirm');
      lookChoices.set(this.picking, null);
      this.changed = true;
      this.picking = null;
    } else {
      const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: GRID_COLS, ArrowUp: -GRID_COLS }[e.key];
      if (!delta) return false;
      this.cursor = Math.min(n - 1, Math.max(0, this.cursor + delta));
      sfx('select');
    }
    this.render();
    return false;
  }
}
