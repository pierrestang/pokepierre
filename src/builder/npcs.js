import { MAPS } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';
import { applyNpcEdits, isStoryNpc } from '../data/maps/npcEdits.js';
import { lookOf } from '../data/characters.js';

// PNJ dans le créateur de cartes (outil « PNJ », touche N) : tous les PNJ de la carte ou de l'intérieur du jeu qui
// porte ce dessin (même identifiant), à leur place, avec leur apparence.
// - Anneau doré et étoile : un PNJ de l'histoire (scénette, conditions, objet…) ; on peut le déplacer, pas le créer ni
//   le supprimer (il vit dans le code, src/data/maps/*.js et interiors.js). Anneau gris : un figurant du code.
//   Anneau turquoise et « + » : un figurant ajouté ici (nom, apparence, réplique, direction).
// - Glisser un PNJ le déplace ; un trait en pointillés le relie à sa place d'origine (« Remettre à sa place »).
// Tout est enregistré dans le dessin (`npcEdits`, voir src/data/maps/npcEdits.js), que le jeu et check_paths.js
// appliquent. Plusieurs PNJ sur une même case (les étapes de l'histoire d'un même personnage) : un chiffre l'indique ;
// un clic sur la case les fait défiler.

const SPRITE_W = 32;
const SPRITE_H = 30;
const DIRS = ['down', 'up', 'left', 'right'];

export function createNpcLayer({ state, base, remember, changed, requestDraw, setStatus }) {
  const $ = (id) => document.getElementById(id);
  const sheet = new Image();
  sheet.src = `${base}assets/characters/gen4-npcs.png`;
  sheet.onload = () => requestDraw();
  let names = [];
  fetch(`${base}assets/characters/gen4-npcs.json`).then((r) => r.json()).then((d) => { names = d.characters; fillSprites(); })
    .catch(() => {});
  const ui = { selected: null, adding: false, drag: null };   // selected : l'id du PNJ choisi

  // L'intérieur ou la carte du jeu qui porte ce dessin, ou null (une carte libre : seulement des figurants ajoutés).
  function entity() {
    const m = state.map;
    if (!m) return null;
    if (state.base?.kind === 'interieur' && interiors[m.id]) return interiors[m.id];
    return interiors[m.id]?.built ? interiors[m.id] : Object.values(MAPS).find((g) => g.built?.id === m.id) ?? null;
  }

  // Les PNJ affichés : ceux du jeu, recalés sur les retouches en cours, et les figurants ajoutés.
  function list() {
    const m = state.map;
    const game = entity();
    if (game) {
      applyNpcEdits(game, m);
      return game.npcs.map((n) => ({ npc: n, kind: n.editorExtra ? 'extra' : isStoryNpc(n) ? 'story' : 'figurant' }));
    }
    return (m.npcEdits?.extras ?? []).map((e) => ({ npc: { ...e, editorExtra: true }, kind: 'extra' }));
  }

  const edits = () => {
    state.map.npcEdits ??= { moved: {}, extras: [] };
    state.map.npcEdits.moved ??= {};
    state.map.npcEdits.extras ??= [];
    return state.map.npcEdits;
  };

  // Place d'origine d'un PNJ du code (avant retouche).
  function originOf(n) {
    const moved = state.map.npcEdits?.moved?.[n.id];
    if (!moved) return null;
    const saved = { ...state.map.npcEdits.moved };
    delete state.map.npcEdits.moved[n.id];
    const game = entity();
    applyNpcEdits(game, state.map);
    const twin = game.npcs.find((o) => o.id === n.id);
    const origin = twin ? { x: twin.x, y: twin.y } : null;
    state.map.npcEdits.moved = saved;
    applyNpcEdits(game, state.map);
    return origin;
  }

  function spriteOf(n) {
    if (n.id === 'chat' || n.id?.startsWith('poule')) return null;
    try {
      return lookOf(n).sprite ?? null;
    } catch {
      return null;
    }
  }

  // ---------- Dessin ----------
  function draw(ctx, cs) {
    if (state.tool !== 'npc' && !state.showNpcs) return;
    const items = list();
    const byCell = new Map();
    for (const it of items) {
      const k = `${it.npc.x},${it.npc.y}`;
      if (!byCell.has(k)) byCell.set(k, []);
      byCell.get(k).push(it);
    }
    ctx.save();
    // Places d'origine des PNJ déplacés.
    for (const it of items) {
      if (it.kind === 'extra') continue;
      const o = originOf(it.npc);
      if (!o || (o.x === it.npc.x && o.y === it.npc.y)) continue;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 216, 96, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo((o.x + 0.5) * cs, (o.y + 0.5) * cs);
      ctx.lineTo((it.npc.x + 0.5) * cs, (it.npc.y + 0.5) * cs);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeRect(o.x * cs + 3, o.y * cs + 3, cs - 6, cs - 6);
    }
    for (const [k, group] of byCell) {
      const [x, y] = k.split(',').map(Number);
      const shown = group.find((g) => g.npc.id === ui.selected) ?? group[0];
      const n = shown.npc;
      const ring = { story: '#f2c14e', figurant: '#9aa3b5', extra: '#4fd1c5' }[shown.kind];
      const cx = (x + 0.5) * cs;
      const cy = (y + 0.5) * cs;
      ctx.fillStyle = 'rgba(14, 16, 24, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.48, 0, Math.PI * 2);
      ctx.fill();
      const sprite = spriteOf(n);
      const row = sprite ? Number(sprite.slice(1)) : -1;
      if (row >= 0 && sheet.complete && sheet.naturalWidth) {
        const col = DIRS.indexOf(n.facing ?? 'down') * 3;
        const scale = cs / 16;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sheet, Math.max(0, col) * SPRITE_W, row * SPRITE_H, SPRITE_W, SPRITE_H,
          cx - (SPRITE_W * scale) / 2, (y + 1) * cs - SPRITE_H * scale + 2 * scale, SPRITE_W * scale, SPRITE_H * scale);
      } else {
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(cx, cy, cs * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = n.id === ui.selected ? 3 : 2;
      ctx.strokeStyle = n.id === ui.selected ? '#ffffff' : ring;
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      // Badge : étoile (histoire), « + » (ajouté ici), nombre de PNJ sur la case.
      const badge = shown.kind === 'story' ? '★' : shown.kind === 'extra' ? '+' : '';
      const fs = Math.max(9, cs * 0.34);
      ctx.font = `700 ${fs}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (badge) {
        ctx.fillStyle = ring;
        ctx.fillText(badge, x * cs + fs * 0.45, y * cs + fs * 0.5);
      }
      if (group.length > 1) {
        ctx.fillStyle = '#fff';
        ctx.fillText(String(group.length), (x + 1) * cs - fs * 0.45, y * cs + fs * 0.5);
      }
    }
    if (ui.drag?.moved) {
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(ui.drag.to.x * cs + 1, ui.drag.to.y * cs + 1, cs - 2, cs - 2);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // ---------- Souris ----------
  const at = (x, y) => list().filter((it) => it.npc.x === x && it.npc.y === y);
  const inside = (c) => c.x >= 0 && c.y >= 0 && c.x < state.map.width && c.y < state.map.height;

  function pointerDown(c) {
    if (!inside(c)) return;
    if (ui.adding) {
      remember();
      const e = edits();
      const id = `figurant-${Date.now().toString(36)}`;
      const extra = { id, name: 'Passant', x: c.x, y: c.y, facing: 'down', sprite: '', line: 'Bonjour !' };
      e.extras.push(extra);
      ui.adding = false;
      changed();
      select(id);
      setStatus('Figurant ajouté : donne-lui un nom, une apparence et une réplique (panneau PNJ)', 'ok');
      return;
    }
    const here = at(c.x, c.y);
    if (!here.length) {
      select(null);
      return;
    }
    // Un clic sur une case à plusieurs PNJ les fait défiler ; le PNJ choisi se glisse.
    const current = here.findIndex((it) => it.npc.id === ui.selected);
    const pick = here[(current + 1) % here.length].npc;
    select(pick.id);
    ui.drag = { npc: pick, from: c, to: c, moved: false };
  }

  function pointerMove(c) {
    if (!ui.drag) return false;
    if (c.x !== ui.drag.to.x || c.y !== ui.drag.to.y) {
      ui.drag.to = c;
      ui.drag.moved = ui.drag.moved || c.x !== ui.drag.from.x || c.y !== ui.drag.from.y;
      requestDraw();
    }
    return true;
  }

  function pointerUp() {
    const drag = ui.drag;
    ui.drag = null;
    if (!drag?.moved || !inside(drag.to)) {
      requestDraw();
      return;
    }
    remember();
    moveTo(drag.npc, drag.to.x, drag.to.y);
    if (state.map.solid[drag.to.y * state.map.width + drag.to.x]) {
      setStatus('Attention : ce PNJ est sur une case bloquée', 'err');
    } else if (drag.npc && isStoryNpc(drag.npc)) {
      setStatus('PNJ de l\'histoire déplacé : vérifie ses scénettes (Tester, node scripts/check_paths.js)', 'ok');
    } else setStatus('PNJ déplacé', 'ok');
  }

  function moveTo(npc, x, y, facing) {
    const e = edits();
    if (npc.editorExtra) {
      const extra = e.extras.find((o) => o.id === npc.id);
      if (extra) Object.assign(extra, { x, y }, facing ? { facing } : {});
    } else {
      e.moved[npc.id] = { ...(e.moved[npc.id] ?? {}), x, y, ...(facing ? { facing } : {}) };
      const o = originOf(npc);
      const m = e.moved[npc.id];
      if (o && o.x === m.x && o.y === m.y && !m.facing) delete e.moved[npc.id];
    }
    changed();
    renderPanel();
  }

  // ---------- Panneau ----------
  function select(id) {
    ui.selected = id;
    renderPanel();
    requestDraw();
  }

  function fillSprites() {
    const sel = $('npc-sprite');
    if (!sel || sel.options.length > 1) return;
    for (const c of names) sel.append(new Option(`${c.id} — ${c.name}`, c.id));
  }

  function renderPanel() {
    const panel = $('npcbar');
    panel.hidden = state.tool !== 'npc';
    if (panel.hidden) return;
    const items = list();
    const game = entity();
    $('npc-where').textContent = game ? `${items.length} PNJ` : 'carte libre : figurants seulement';
    const n = ui.selected && items.find((it) => it.npc.id === ui.selected);
    $('npc-detail').hidden = !n;
    $('npc-add').classList.toggle('on', ui.adding);
    if (!n) return;
    const kindLabel = { story: '★ Histoire (déplaçable)', figurant: 'Figurant du jeu (déplaçable)', extra: '+ Figurant ajouté ici' }[n.kind];
    $('npc-kind').textContent = kindLabel;
    $('npc-title').textContent = `${n.npc.name ?? n.npc.id} · x ${n.npc.x}, y ${n.npc.y}`;
    const extra = n.kind === 'extra';
    $('npc-extra').hidden = !extra;
    const moved = !extra && state.map.npcEdits?.moved?.[n.npc.id];
    $('npc-reset').hidden = !moved;
    $('npc-facing').value = n.npc.facing ?? 'down';
    if (extra) {
      const e = edits().extras.find((o) => o.id === n.npc.id);
      $('npc-name').value = e?.name ?? '';
      $('npc-line').value = e?.line ?? '';
      fillSprites();
      $('npc-sprite').value = e?.sprite ?? '';
    }
    const conds = ['ifFlags', 'unlessFlags', 'ifItems', 'unlessItems', 'ifSouvenirs', 'unlessSouvenirs']
      .filter((k) => n.npc[k]?.length).map((k) => `${k} : ${n.npc[k].join(', ')}`);
    $('npc-conds').textContent = conds.join(' · ');
  }

  function bind() {
    $('npc-add').onclick = () => {
      ui.adding = !ui.adding;
      renderPanel();
      if (ui.adding) setStatus('Clique sur la carte pour poser le figurant', 'ok');
    };
    const editExtra = (fn) => {
      const e = edits().extras.find((o) => o.id === ui.selected);
      if (!e) return;
      remember();
      fn(e);
      changed();
      renderPanel();
    };
    $('npc-name').onchange = () => editExtra((e) => { e.name = $('npc-name').value.trim() || 'Passant'; });
    $('npc-line').onchange = () => editExtra((e) => { e.line = $('npc-line').value.trim(); });
    $('npc-sprite').onchange = () => editExtra((e) => { e.sprite = $('npc-sprite').value; });
    $('npc-facing').onchange = () => {
      const npc = list().find((it) => it.npc.id === ui.selected)?.npc;
      if (!npc) return;
      remember();
      moveTo(npc, npc.x, npc.y, $('npc-facing').value);
    };
    $('npc-delete').onclick = () => editExtra((e) => {
      const all = edits().extras;
      all.splice(all.indexOf(e), 1);
      ui.selected = null;
    });
    $('npc-reset').onclick = () => {
      if (!ui.selected) return;
      remember();
      delete edits().moved[ui.selected];
      changed();
      renderPanel();
      setStatus('PNJ remis à sa place d\'origine', 'ok');
    };
    $('show-npcs').onclick = () => {
      state.showNpcs = !state.showNpcs;
      $('show-npcs').classList.toggle('on', state.showNpcs);
      requestDraw();
    };
  }

  // Une autre carte s'ouvre : on oublie la sélection.
  function reset() {
    ui.selected = null;
    ui.adding = false;
    ui.drag = null;
    renderPanel();
  }

  return { draw, pointerDown, pointerMove, pointerUp, renderPanel, bind, reset, dragging: () => Boolean(ui.drag) };
}
