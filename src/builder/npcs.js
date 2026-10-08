import { MAPS } from '../data/maps/index.js';
import { interiors } from '../data/maps/interiors.js';
import { applyNpcEdits, isStoryNpc } from '../data/maps/npcEdits.js';
import { lookOf } from '../data/characters.js';
import {
  stepsOf, rankOf, raisedAt, flagsOk, flagLabel, settersOf, describeNpc, unlockedBy, walksOf, flagsSetBy,
} from './questModel.js';

// Éditeur de personnages du créateur de cartes (outil « Personnages », touche N) : tous les PNJ de la carte ou de
// l'intérieur du jeu qui porte ce dessin (même identifiant), à leur place, avec leur apparence et leur nom.
// - La frise de la quête (panneau) : les étapes de l'histoire qui concernent ce lieu (drapeaux de story.js, dans l'ordre
//   du jeu) et qui les fait avancer ; choisir une étape ne montre que les personnages présents à ce moment-là
//   (« Toutes les étapes » : tous, une pastille compte ceux d'une même case).
// - La fiche d'un personnage : son rôle (★ histoire, ● figurant du jeu, + figurant ajouté ici), quand il est là, ce
//   qu'il fait (répliques, choix, objets donnés, marches, étapes qu'il fait avancer) et ce qu'il débloque. Sur la
//   carte : ses marches (flèches bleues numérotées) et ce qu'il débloque (traits dorés).
// - Déplacer : glisser, ou les flèches du clavier (une case) ; Maj + flèche : sa direction ; Tab : le suivant.
//   Un PNJ de l'histoire se déplace mais ne se crée pas ici (il vit dans le code, src/data/maps/*.js) ; un trait en
//   pointillés le relie à sa place d'origine (« Remettre à sa place »). Les figurants ajoutés ici ont un nom, une
//   apparence et une réplique.
// Tout est enregistré dans le dessin (`npcEdits`, voir src/data/maps/npcEdits.js), que le jeu et check_paths.js appliquent.

const SPRITE_W = 32;
const SPRITE_H = 30;
const DIRS = ['down', 'up', 'left', 'right'];
const RING = { story: '#f2c14e', figurant: '#9aa3b5', extra: '#4fd1c5' };

export function createNpcLayer({ state, base, remember, changed, requestDraw, setStatus }) {
  const $ = (id) => document.getElementById(id);
  const sheet = new Image();
  sheet.src = `${base}assets/characters/gen4-npcs.png`;
  sheet.onload = () => { requestDraw(); renderPanel(); };
  let names = [];
  fetch(`${base}assets/characters/gen4-npcs.json`).then((r) => r.json()).then((d) => { names = d.characters; fillSprites(); })
    .catch(() => {});
  // selected : l'id du PNJ choisi ; step : l'étape de la frise (null : toutes les étapes).
  const ui = { selected: null, adding: false, drag: null, step: null, stepByPlace: {} };

  // L'intérieur ou la carte du jeu qui porte ce dessin, ou null (une carte libre : seulement des figurants ajoutés).
  function entity() {
    const m = state.map;
    if (!m) return null;
    // Un modèle partagé : la pièce choisie dans le sélecteur « Pièce » (builder.js, modèles d'intérieurs).
    if (state.base?.kind === 'modele') return interiors[state.base.room] ?? null;
    if (state.base?.kind === 'interieur' && interiors[m.id]) return interiors[m.id];
    return interiors[m.id]?.built ? interiors[m.id] : Object.values(MAPS).find((g) => g.built?.id === m.id) ?? null;
  }

  // ---------- Frise de la quête ----------
  // Étape i : 0 = avant la première étape du lieu ; i = juste après la i-ème.
  const steps = () => (entity() ? stepsOf(entity()) : []);
  function raisedFor(i) {
    const s = steps();
    if (!s.length) return raisedAt(0);
    return i === 0 ? raisedAt(rankOf(s[0])) : raisedAt(rankOf(s[i - 1]) + 1);
  }
  const stepTitle = (i) => (i === 0 ? 'Avant tout' : flagLabel(steps()[i - 1]));

  // Les PNJ affichés : ceux du jeu, recalés sur les retouches en cours, et les figurants ajoutés ; à l'étape choisie,
  // seulement ceux qui sont là (conditions de drapeaux ; objets et souvenirs ignorés).
  function all() {
    const m = state.map;
    const game = entity();
    if (game) {
      applyNpcEdits(game, m);
      return game.npcs.map((n) => ({ npc: n, kind: n.editorExtra ? 'extra' : isStoryNpc(n) ? 'story' : 'figurant' }));
    }
    return (m.npcEdits?.extras ?? []).map((e) => ({ npc: { ...e, editorExtra: true }, kind: 'extra' }));
  }
  function list() {
    const items = all();
    if (ui.step === null || !entity()) return items;
    const raised = raisedFor(ui.step);
    return items.filter((it) => it.kind === 'extra' || flagsOk(it.npc, raised));
  }
  // Un même id peut avoir plusieurs variantes (une par étape) : la variante choisie est la première visible.
  const selectedItem = () => list().find((it) => it.npc.id === ui.selected) ?? all().find((it) => it.npc.id === ui.selected);

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
    if (n.editorExtra && n.sprite) return n.sprite;
    try {
      return lookOf(n).sprite ?? null;
    } catch {
      return null;
    }
  }

  function drawSprite(ctx, n, x, y, w, h) {
    const sprite = spriteOf(n);
    const row = sprite ? Number(sprite.slice(1)) : -1;
    if (row < 0 || !sheet.complete || !sheet.naturalWidth) return false;
    const col = Math.max(0, DIRS.indexOf(n.facing ?? 'down')) * 3;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, col * SPRITE_W, row * SPRITE_H, SPRITE_W, SPRITE_H, x, y, w, h);
    return true;
  }

  // ---------- Dessin ----------
  function arrow(ctx, x0, y0, x1, y1, color, cs) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    const head = Math.max(5, cs * 0.28);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 - Math.cos(a) * head * 0.6, y1 - Math.sin(a) * head * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
    ctx.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
    ctx.closePath();
    ctx.fill();
  }

  function label(ctx, text, cx, top, color, fs) {
    ctx.font = `600 ${fs}px system-ui`;
    const w = ctx.measureText(text).width + 6;
    ctx.fillStyle = 'rgba(14, 16, 24, 0.78)';
    ctx.fillRect(cx - w / 2, top, w, fs + 4);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text, cx, top + 2);
  }

  function draw(ctx, cs) {
    if (state.tool !== 'npc' && !state.showNpcs) return;
    const items = list();
    const game = entity();
    const byCell = new Map();
    for (const it of items) {
      const k = `${it.npc.x},${it.npc.y}`;
      if (!byCell.has(k)) byCell.set(k, []);
      byCell.get(k).push(it);
    }
    ctx.save();
    const sel = ui.selected && selectedItem();
    // Le choisi : ses marches (flèches bleues numérotées) et ce qu'il débloque (traits dorés).
    if (sel && game && state.tool === 'npc') {
      const c = (x, y) => [(x + 0.5) * cs, (y + 0.5) * cs];
      ctx.lineWidth = Math.max(2, cs * 0.1);
      ctx.setLineDash([]);
      let from = c(sel.npc.x, sel.npc.y);
      walksOf(sel.npc.id, game).forEach((w, i) => {
        const to = c(w.to[0], w.to[1]);
        arrow(ctx, from[0], from[1], to[0], to[1], 'rgba(96, 170, 255, 0.95)', cs);
        ctx.fillStyle = '#60aaff';
        ctx.beginPath();
        ctx.arc(to[0], to[1] - cs * 0.55, Math.max(7, cs * 0.24), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0e1018';
        ctx.font = `700 ${Math.max(9, cs * 0.3)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), to[0], to[1] - cs * 0.55);
        from = to;
      });
      for (const u of unlockedBy(sel.npc, game)) {
        const to = c(u.x + ((u.w ?? 1) - 1) / 2, u.y + ((u.h ?? 1) - 1) / 2);
        ctx.setLineDash([6, 4]);
        arrow(ctx, (sel.npc.x + 0.5) * cs, (sel.npc.y + 0.5) * cs, to[0], to[1], 'rgba(242, 193, 78, 0.9)', cs);
        ctx.setLineDash([]);
        label(ctx, `${u.how === 'apparaît' ? '+' : '−'} ${u.what}`, to[0], to[1] + cs * 0.5, '#f2c14e', Math.max(9, cs * 0.28));
      }
    }
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
    const fs = Math.max(9, cs * 0.34);
    for (const [k, group] of byCell) {
      const [x, y] = k.split(',').map(Number);
      const shown = group.find((g) => g.npc.id === ui.selected) ?? group[0];
      const n = shown.npc;
      const ring = RING[shown.kind];
      const cx = (x + 0.5) * cs;
      const cy = (y + 0.5) * cs;
      const isSel = n.id === ui.selected;
      ctx.fillStyle = isSel ? 'rgba(255, 255, 255, 0.25)' : 'rgba(14, 16, 24, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.48, 0, Math.PI * 2);
      ctx.fill();
      const scale = cs / 16;
      if (!drawSprite(ctx, n, cx - (SPRITE_W * scale) / 2, (y + 1) * cs - SPRITE_H * scale + 2 * scale, SPRITE_W * scale, SPRITE_H * scale)) {
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(cx, cy, cs * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.strokeStyle = isSel ? '#ffffff' : ring;
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      const badge = shown.kind === 'story' ? '★' : shown.kind === 'extra' ? '+' : '';
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
      // Le nom sous le personnage (outil Personnages, à partir d'un zoom lisible).
      if (state.tool === 'npc' && cs >= 20) label(ctx, n.name ?? n.id, cx, (y + 1) * cs + 1, isSel ? '#fff' : ring, Math.max(9, cs * 0.26));
    }
    if (ui.drag?.moved) {
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(ui.drag.to.x * cs + 1, ui.drag.to.y * cs + 1, cs - 2, cs - 2);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // ---------- Souris et clavier ----------
  const at = (x, y) => list().filter((it) => it.npc.x === x && it.npc.y === y);
  const inside = (c) => c.x >= 0 && c.y >= 0 && c.x < state.map.width && c.y < state.map.height;

  function pointerDown(c) {
    if (!inside(c)) return;
    if (ui.adding) {
      remember();
      const e = edits();
      const id = `figurant-${Date.now().toString(36)}`;
      e.extras.push({ id, name: 'Passant', x: c.x, y: c.y, facing: 'down', sprite: '', line: 'Bonjour !' });
      ui.adding = false;
      changed();
      select(id);
      setStatus('Figurant ajouté : donne-lui un nom, une apparence et une réplique (fiche du personnage)', 'ok');
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
    warnAfterMove(drag.npc, drag.to.x, drag.to.y);
  }

  function warnAfterMove(npc, x, y) {
    if (state.map.solid[y * state.map.width + x]) setStatus('Attention : ce personnage est sur une case bloquée', 'err');
    else if (list().some((it) => it.npc !== npc && it.npc.x === x && it.npc.y === y)) {
      setStatus('Attention : un autre personnage est déjà sur cette case', 'err');
    } else if (isStoryNpc(npc)) setStatus('Personnage de l\'histoire déplacé : rejoue ses scènes (Tester, node scripts/check_paths.js)', 'ok');
    else setStatus('Personnage déplacé', 'ok');
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

  // Clavier (outil Personnages) : flèches = une case, Maj + flèche = direction, Tab = suivant, Échap = aucun.
  function keyDown(e) {
    if (state.tool !== 'npc') return false;
    const items = list();
    if (e.key === 'Tab') {
      if (!items.length) return false;
      e.preventDefault();
      const i = items.findIndex((it) => it.npc.id === ui.selected);
      select(items[(i + (e.shiftKey ? items.length - 1 : 1)) % items.length].npc.id);
      return true;
    }
    if (e.key === 'Escape' && ui.selected) {
      select(null);
      return true;
    }
    const d = { ArrowLeft: [-1, 0, 'left'], ArrowRight: [1, 0, 'right'], ArrowUp: [0, -1, 'up'], ArrowDown: [0, 1, 'down'] }[e.key];
    const sel = ui.selected && selectedItem();
    if (!d || !sel) return false;
    e.preventDefault();
    remember();
    if (e.shiftKey) {
      moveTo(sel.npc, sel.npc.x, sel.npc.y, d[2]);
      return true;
    }
    const x = sel.npc.x + d[0];
    const y = sel.npc.y + d[1];
    if (!inside({ x, y })) return true;
    moveTo(sel.npc, x, y);
    warnAfterMove(sel.npc, x, y);
    return true;
  }

  // ---------- Panneau ----------
  function select(id) {
    ui.selected = id;
    renderPanel();
    requestDraw();
  }

  function setStep(i) {
    const n = steps().length;
    ui.step = i === null ? null : Math.max(0, Math.min(n, i));
    if (state.map) ui.stepByPlace[state.map.id] = ui.step;
    // Le choisi n'est plus là à cette étape : on le garde choisi (sa fiche le dit), sans le montrer.
    renderPanel();
    requestDraw();
  }

  function fillSprites() {
    const sel = $('npc-sprite');
    if (!sel || sel.options.length > 1) return;
    for (const c of names) sel.append(new Option(`${c.id} — ${c.name}`, c.id));
  }

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  function renderTimeline() {
    const box = $('npc-steps');
    box.innerHTML = '';
    const s = steps();
    const game = entity();
    $('npc-time').hidden = !game || !s.length;
    if (!game || !s.length) return;
    $('npc-all').classList.toggle('on', ui.step === null);
    $('npc-step-now').textContent = ui.step === null ? 'Toutes les étapes' : `Étape ${ui.step} / ${s.length}`;
    for (let i = 0; i <= s.length; i++) {
      const li = el('li', ui.step === i ? 'on' : '');
      li.append(el('b', '', i === 0 ? '○' : String(i)), el('span', '', stepTitle(i)));
      if (i > 0) {
        const who = settersOf(s[i - 1]).filter((w) => w.where === (game.name ?? '')).map((w) => w.who);
        const elsewhere = settersOf(s[i - 1]).filter((w) => w.where !== (game.name ?? ''));
        const by = who.length ? `par ${[...new Set(who)].join(', ')}` : elsewhere.length ? `ailleurs : ${elsewhere[0].where}` : '';
        if (by) li.append(el('small', '', by));
      }
      li.onclick = () => setStep(i);
      box.append(li);
    }
    box.querySelector('li.on')?.scrollIntoView({ block: 'nearest' });
  }

  function renderRoster() {
    const box = $('npc-roster');
    box.innerHTML = '';
    const items = list();
    if (!items.length) {
      box.append(el('small', '', ui.step === null ? 'Aucun personnage ici.' : 'Personne ici à cette étape.'));
      return;
    }
    const seen = new Set();
    for (const it of items) {
      if (seen.has(it.npc.id)) continue;
      seen.add(it.npc.id);
      const b = el('button', `npc-chip ${it.kind}${it.npc.id === ui.selected ? ' on' : ''}`);
      b.append(el('i', '', it.kind === 'story' ? '★' : it.kind === 'extra' ? '+' : '●'), el('span', '', it.npc.name ?? it.npc.id));
      b.title = `${it.npc.name ?? it.npc.id} · x ${it.npc.x}, y ${it.npc.y}`;
      b.onclick = () => select(it.npc.id);
      box.append(b);
    }
  }

  function renderDetail() {
    const it = ui.selected && selectedItem();
    $('npc-detail').hidden = !it;
    if (!it) return;
    const n = it.npc;
    const game = entity();
    $('npc-kind').textContent = { story: '★ Personnage de l\'histoire', figurant: '● Figurant du jeu', extra: '+ Figurant ajouté ici' }[it.kind];
    $('npc-kind').className = `npc-kind ${it.kind}`;
    $('npc-title').textContent = n.name ?? n.id;
    $('npc-pos').textContent = `x ${n.x}, y ${n.y}`;
    const face = $('npc-face');
    const fctx = face.getContext('2d');
    fctx.clearRect(0, 0, face.width, face.height);
    drawSprite(fctx, n, 0, 0, face.width, face.height);
    document.querySelectorAll('#npc-dirs [data-dir]').forEach((b) => b.classList.toggle('on', (n.facing ?? 'down') === b.dataset.dir));
    const extra = it.kind === 'extra';
    $('npc-extra').hidden = !extra;
    $('npc-reset').hidden = extra || !state.map.npcEdits?.moved?.[n.id];
    if (extra) {
      const e = edits().extras.find((o) => o.id === n.id);
      $('npc-name').value = e?.name ?? '';
      $('npc-line').value = e?.line ?? '';
      fillSprites();
      $('npc-sprite').value = e?.sprite ?? '';
    }
    // Quand il est là.
    const info = describeNpc(n);
    const pres = $('npc-presence');
    pres.innerHTML = '';
    const visibleNow = ui.step === null || list().some((o) => o.npc === n);
    if (!visibleNow) pres.append(el('div', 'npc-warn', 'Pas là à cette étape de l\'histoire.'));
    if (!info.appears.length && !info.leaves.length) pres.append(el('div', '', 'Toujours là.'));
    for (const a of info.appears) pres.append(el('div', '', `Arrive après : ${a}`));
    for (const l of info.leaves) pres.append(el('div', '', `Part après : ${l}`));
    if (info.traits.length) pres.append(el('div', 'npc-muted', `Animation : ${info.traits.join(', ')}`));
    // Ce qu'il fait.
    const acts = $('npc-actions');
    acts.innerHTML = '';
    for (const a of info.actions.slice(0, 40)) {
      const row = el('div', `act ${a.kind}`);
      row.style.paddingLeft = `${a.depth * 12}px`;
      row.append(el('i', '', a.icon), el('span', '', a.text));
      acts.append(row);
    }
    if (info.actions.length > 40) acts.append(el('small', '', `… et ${info.actions.length - 40} autres`));
    if (!info.actions.length) acts.append(el('small', '', 'Aucune réplique.'));
    // Ce qu'il débloque, et qui le fait venir.
    const links = $('npc-links');
    links.innerHTML = '';
    if (game) {
      const sets = flagsSetBy(n);
      const unl = unlockedBy(n, game);
      for (const f of sets) {
        const row = el('div', 'link');
        row.append(el('i', '', '🏁'), el('span', '', flagLabel(f)));
        const here = unl.filter((u) => u.flag === f);
        if (here.length) row.append(el('small', '', here.map((u) => `${u.how === 'apparaît' ? '+' : '−'} ${u.what}`).join(' · ')));
        const k = steps().indexOf(f);
        if (k >= 0) {
          row.classList.add('click');
          row.title = 'Voir cette étape';
          row.onclick = () => setStep(k + 1);
        }
        links.append(row);
      }
      for (const f of n.ifFlags ?? []) {
        const who = settersOf(f);
        if (!who.length) continue;
        const row = el('div', 'link from');
        row.append(el('i', '', '←'), el('span', '', `Vient grâce à ${who.map((w) => `${w.who} (${w.where})`).slice(0, 3).join(', ')}`));
        links.append(row);
      }
      $('npc-links-head').hidden = !links.childElementCount;
    }
  }

  function renderPanel() {
    const panel = $('npcbar');
    panel.hidden = state.tool !== 'npc';
    if (panel.hidden || !state.map) return;
    const game = entity();
    $('npc-where').textContent = game ? (game.name ?? '') : 'carte libre : figurants seulement';
    $('npc-add').classList.toggle('on', ui.adding);
    renderTimeline();
    renderRoster();
    renderDetail();
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
    document.querySelectorAll('#npc-dirs [data-dir]').forEach((b) => {
      b.onclick = () => {
        const it = selectedItem();
        if (!it) return;
        remember();
        moveTo(it.npc, it.npc.x, it.npc.y, b.dataset.dir);
      };
    });
    $('npc-delete').onclick = () => editExtra((e) => {
      const list = edits().extras;
      list.splice(list.indexOf(e), 1);
      ui.selected = null;
    });
    $('npc-reset').onclick = () => {
      if (!ui.selected) return;
      remember();
      delete edits().moved[ui.selected];
      changed();
      renderPanel();
      setStatus('Personnage remis à sa place d\'origine', 'ok');
    };
    $('npc-all').onclick = () => setStep(ui.step === null ? 0 : null);
    $('npc-prev').onclick = () => setStep(ui.step === null ? 0 : ui.step - 1);
    $('npc-next').onclick = () => setStep(ui.step === null ? 0 : ui.step + 1);
    $('show-npcs').onclick = () => {
      state.showNpcs = !state.showNpcs;
      $('show-npcs').classList.toggle('on', state.showNpcs);
      requestDraw();
    };
  }

  // Une autre carte s'ouvre : on oublie la sélection ; l'étape choisie pour ce lieu revient.
  function reset() {
    ui.selected = null;
    ui.adding = false;
    ui.drag = null;
    ui.step = state.map && state.map.id in ui.stepByPlace ? ui.stepByPlace[state.map.id] : null;
    renderPanel();
  }

  return { draw, pointerDown, pointerMove, pointerUp, keyDown, renderPanel, bind, reset, dragging: () => Boolean(ui.drag) };
}
