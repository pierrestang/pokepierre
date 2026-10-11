import { BY_NAME } from '../data/looks.js';
import { SPRITE_TAGS } from '../data/spriteTags.js';
import { projectLookOf, setProjectLook } from '../data/characters.js';
import { loadPixelFont } from './pixelFont.js';

// Panneau « PNJ » du créateur (bouton PNJ du bandeau) : l'apparence de chaque personnage nommé du jeu, dans la mise en
// page du menu Start > PNJ du jeu (systems/NpcLooks.js) : bandeaux bleus, fond crème, la liste sur deux colonnes (sprite
// de face et nom), puis la grille des sprites Gen 4, le sprite actuel cerclé de rouge. Filtres homme / femme / enfant /
// âgé (data/spriteTags.js). Les choix restent en attente (« * ») jusqu'à « Enregistrer » : le serveur de développement
// les écrit dans src/data/characterLooks.json (POST /__builder/looks, vite.config.js), que data/characters.js importe :
// le jeu les prend au prochain lancement. « Par défaut » efface le choix (retour à data/looks.js BY_NAME).

const SPRITE_W = 32;
const SPRITE_H = 30;
const SCALE = 2;
const RED = '#e03828';
const NOT_LISTED = ['Anais', 'Leo'];               // doublons d'orthographe (Anaïs, Léo)
const FILTERS = [
  ['tous', 'Tous', () => true],
  ['homme', 'Hommes', ([sex, age]) => sex === 'homme' && age !== 'enfant'],
  ['femme', 'Femmes', ([sex, age]) => sex === 'femme' && age !== 'enfant'],
  ['enfant', 'Enfants', ([, age]) => age === 'enfant'],
  ['age', 'Âgés', ([, age]) => age === 'âgé'],
];

export function createLooksPanel({ base, setStatus }) {
  const $ = (id) => document.getElementById(id);
  const sheet = new Image();
  sheet.src = `${base}assets/characters/gen4-npcs.png`;
  let font = null;
  let sprites = [];                                // [{ id, name }] de gen4-npcs.json
  const ready = Promise.all([
    loadPixelFont(base).then((f) => { font = f; }),
    fetch(`${base}assets/characters/gen4-npcs.json`).then((r) => r.json()).then((d) => { sprites = d.characters; }),
    new Promise((resolve) => { sheet.onload = resolve; sheet.onerror = resolve; }),
  ]);
  const ui = { names: [], pending: {}, picking: null, filter: 'tous', saved: {} };

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  // Un texte dans la police du jeu, sur un canvas à sa taille (bandeaux et boutons : variante claire).
  const label = (text, { light = false, pad = 0 } = {}) => {
    const c = el('canvas');
    c.width = (font.width(text, { light }) + 2 * pad) * SCALE;
    c.height = 15 * SCALE;
    font.draw(c.getContext('2d'), text, pad, 0, { scale: SCALE, light });
    return c;
  };
  const drawSprite = (ctx, id, x, y) => {
    if (!id || !sheet.complete) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, 0, Number(id.slice(1)) * SPRITE_H, SPRITE_W, SPRITE_H, x * SCALE, y * SCALE, SPRITE_W * SCALE, SPRITE_H * SCALE);
  };

  // Le sprite d'un nom : le choix en attente, sinon celui du créateur (characterLooks.json), sinon celui du code.
  const spriteOf = (name) => (name in ui.pending ? ui.pending[name] ?? BY_NAME[name] : projectLookOf(name) ?? BY_NAME[name]) ?? null;
  const fromBuilder = (name) => (name in ui.pending ? ui.pending[name] !== null : Boolean(projectLookOf(name)));

  async function open() {
    await ready;
    let saved = {};
    try {
      saved = await fetch(`${base}__builder/looks`).then((r) => (r.ok ? r.json() : {}));
    } catch {
      // Sans serveur de développement : la liste vient du code seul.
    }
    ui.saved = saved;
    ui.names = [...new Set([...Object.keys(BY_NAME), ...Object.keys(saved)])].filter((n) => !NOT_LISTED.includes(n));
    ui.picking = null;
    $('looks-panel').hidden = false;
    render();
  }

  function close() {
    if (Object.keys(ui.pending).length && !window.confirm('Des apparences ne sont pas enregistrées. Fermer quand même ?')) return;
    ui.pending = {};
    $('looks-panel').hidden = true;
  }

  function render() {
    const title = $('looks-title');
    title.replaceChildren(label(ui.picking ? `APPARENCE : ${ui.picking.toUpperCase()}` : 'PNJ — APPARENCES', { light: true }));
    const count = Object.keys(ui.pending).length;
    title.append(el('span', 'grow'), label(ui.picking ? `${current().length} sprites` : `${ui.names.length} personnages`, { light: true }));
    if (ui.picking) renderGrid();
    else renderList();
    for (const [id, text] of [['looks-default', 'Par défaut'], ['looks-back', 'Retour'], ['looks-cancel', 'Annuler'], ['looks-close', 'Fermer']]) {
      $(id).replaceChildren(label(text, { light: true, pad: 2 }));
    }
    $('looks-save').disabled = !count;
    $('looks-save').replaceChildren(label(count ? `Enregistrer (${count})` : 'Enregistrer', { light: true, pad: 2 }));
    $('looks-cancel').hidden = !count || Boolean(ui.picking);
  }

  // La liste : deux colonnes, sprite et nom ; « * » = choix en attente, point doré = choisi dans le créateur.
  function renderList() {
    const body = $('looks-body');
    body.className = 'looks-body looks-list';
    body.replaceChildren(...ui.names.map((name) => {
      const row = el('button', 'looks-row');
      const c = el('canvas');
      c.width = 170 * SCALE;
      c.height = 26 * SCALE;
      const ctx = c.getContext('2d');
      drawSprite(ctx, spriteOf(name), -6, -4);
      const pendingMark = name in ui.pending ? ' *' : '';
      const x = font.draw(ctx, `${name}${pendingMark}`, 30, 6, { scale: SCALE });
      if (fromBuilder(name) && !pendingMark) {
        ctx.fillStyle = '#d8a020';
        ctx.fillRect((x + 4) * SCALE, 12 * SCALE, 3 * SCALE, 3 * SCALE);
      }
      row.append(c);
      row.title = `${name} : ${spriteOf(name) ?? 'figurant'}${fromBuilder(name) ? ' (choisi dans le créateur)' : ' (attribution du code)'}`;
      row.onclick = () => {
        ui.picking = name;
        render();
        body.querySelector('.on')?.scrollIntoView({ block: 'center' });
      };
      return row;
    }));
    $('looks-filters').hidden = true;
    $('looks-default').hidden = true;
    $('looks-back').hidden = true;
  }

  const current = () => {
    const test = FILTERS.find(([key]) => key === ui.filter)[2];
    return sprites.filter((s) => test(SPRITE_TAGS[s.id] ?? [null, null]));
  };

  // La grille des sprites (filtrée), le sprite actuel cerclé de rouge ; un clic le choisit (en attente).
  function renderGrid() {
    const body = $('looks-body');
    body.className = 'looks-body looks-grid';
    const now = spriteOf(ui.picking);
    body.replaceChildren(...current().map((s) => {
      const cell = el('button', `looks-cell${s.id === now ? ' on' : ''}`);
      const c = el('canvas');
      c.width = 28 * SCALE;
      c.height = 32 * SCALE;
      const ctx = c.getContext('2d');
      if (s.id === now) {
        ctx.strokeStyle = RED;
        ctx.lineWidth = SCALE;
        ctx.strokeRect(SCALE / 2, SCALE / 2, c.width - SCALE, c.height - SCALE);
      }
      drawSprite(ctx, s.id, -2, 1);
      const [sex, age] = SPRITE_TAGS[s.id] ?? [];
      cell.title = `${s.id} — ${s.name}${sex ? ` · ${sex}` : ''}${age ? ` · ${age}` : ''}`;
      cell.append(c);
      cell.onclick = () => choose(s.id);
      return cell;
    }));
    const filters = $('looks-filters');
    filters.hidden = false;
    filters.replaceChildren(...FILTERS.map(([key, text]) => {
      const b = el('button', `looks-btn${ui.filter === key ? ' on' : ''}`);
      b.append(label(text, { light: true, pad: 2 }));
      b.onclick = () => { ui.filter = key; render(); };
      return b;
    }));
    $('looks-default').hidden = false;
    $('looks-back').hidden = false;
  }

  // Un choix en attente : `sprite` null = l'attribution du code (data/looks.js). Sans changement, rien n'attend.
  function choose(sprite) {
    const name = ui.picking;
    const savedValue = ui.saved[name] ?? null;
    const value = sprite === BY_NAME[name] ? null : sprite;
    if (value === savedValue) delete ui.pending[name];
    else ui.pending[name] = value;
    ui.picking = null;
    render();
  }

  // « Enregistrer » : tous les choix en attente, d'un coup, dans src/data/characterLooks.json.
  async function save() {
    const looks = { ...ui.pending };
    if (!Object.keys(looks).length) return;
    try {
      const res = await fetch(`${base}__builder/looks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ looks }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? String(res.status));
      for (const [name, sprite] of Object.entries(looks)) {
        setProjectLook(name, sprite);
        if (sprite) ui.saved[name] = sprite;
        else delete ui.saved[name];
      }
      ui.pending = {};
      setStatus(`Apparences enregistrées dans ${out.file ?? 'src/data/characterLooks.json'} (le jeu les prend au prochain lancement)`, 'ok');
    } catch (error) {
      setStatus(`Apparences non enregistrées : ${error.message} (il faut le serveur de développement, npm run dev)`, 'err');
    }
    render();
  }

  // Branchements (une fois) ; Échap : retour à la liste, puis fermeture. Le panneau ouvert, les raccourcis du créateur
  // ne passent pas.
  document.body.append($('looks-panel'));
  $('looks-open').onclick = open;
  $('looks-close').onclick = close;
  $('looks-save').onclick = save;
  $('looks-cancel').onclick = () => { ui.pending = {}; render(); };
  $('looks-default').onclick = () => choose(null);
  $('looks-back').onclick = () => { ui.picking = null; render(); };
  window.addEventListener('keydown', (e) => {
    if ($('looks-panel').hidden) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') {
      if (ui.picking) {
        ui.picking = null;
        render();
      } else close();
    }
  }, true);
  return { open };
}
