import ECARTS from './ecarts.json' with { type: 'json' };
import { interiors } from '../data/maps/interiors.js';
import { stackOf, TILE } from './mapModel.js';

// Panneau « Écarts » du créateur (check-up visuel) : les assets de la carte ou de l'intérieur ouvert qui s'écartent
// nettement de leur famille (contour, ombre, style, échelle, couleurs), repérés par scripts/audit_assets.py
// (src/builder/ecarts.json, clé : l'identifiant de la carte, de l'intérieur ou du modèle partagé).
// Pour chacun : une vignette, la famille, les raisons ; « voir » centre la carte dessus et l'encadre ; « supprimer » le
// retire d'un clic (élément du mode simple : comme la gomme ; objet de cases : ses cases des calques Décor et
// au-dessus, collisions libérées s'il ne reste rien), annulable, sans toucher au sol ni aux cases importantes (un écart
// qui en couvre une n'a pas de bouton « supprimer ») ; « ignorer » le masque (mémorisé dans le navigateur).
// Un écart dont les cases n'ont plus son dessin (déjà supprimé, carte retouchée) disparaît de la liste.

const IGNORE_KEY = 'pokepierre.builder.ecartsIgnores';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(IGNORE_KEY)) ?? {}; } catch { return {}; } },
  set(v) { try { localStorage.setItem(IGNORE_KEY, JSON.stringify(v)); } catch { /* navigateur sans stockage */ } },
};

export function createEcarts({ state, remember, changed, requestDraw, setStatus, liftObject, studio, importantCells, focus, colsOf }) {
  const $ = (id) => document.getElementById(id);
  const ui = { open: false, focus: null, important: new Map() };
  const keyOf = (e) => `${e.x},${e.y},${e.w},${e.h}`;

  // Les écarts de ce qui est ouvert, encore présents sur la carte, non ignorés.
  function current() {
    const m = state.map;
    if (!m) return [];
    const ignored = new Set(store.get()[m.id] ?? []);
    return (ECARTS[placeKey()] ?? []).filter((e) => !ignored.has(keyOf(e)) && present(e));
  }
  // Au moins une de ses cases a encore son dessin.
  function present(e) {
    const m = state.map;
    return Object.entries(e.refs).some(([c, list]) => list.some(([l, r]) => stackOf(m.layers[l]?.[Number(c)]).includes(r)));
  }

  // Clé du lieu ouvert dans ecarts.json (scripts/audit_assets.py) : une carte et un intérieur peuvent avoir le même id.
  const inside = () => ['interieur', 'modele'].includes(state.base?.kind);
  const placeKey = () => `${inside() ? 'int' : 'carte'}:${state.map.id}`;

  // Cases importantes : celles de la carte du jeu (PNJ, portes, objets, déclencheurs : assistant.importantCells) ;
  // dans un intérieur (ou un modèle : toutes ses pièces), ses PNJ (y compris placés pendant la séance), objets,
  // décors de scène (props), lits, déclencheurs, sorties et départ. `fresh` : recalculées (avant une suppression).
  async function important(fresh = false) {
    const m = state.map;
    const key = `${placeKey()}:${m.width}x${m.height}`;
    if (!fresh && ui.important.has(key)) return ui.important.get(key);
    const set = new Map();
    const add = (x, y, why) => set.set(y * m.width + x, why);
    if (inside()) {
      const rooms = Object.entries(interiors).filter(([id, r]) => id === m.id || r.built?.modele === m.id);
      for (const [, r] of rooms) {
        for (const n of r.npcs ?? []) add(n.x, n.y, `PNJ ${n.name ?? n.id}`);
        for (const o of r.objects ?? []) add(o.x, o.y, 'objet du jeu (réplique)');
        for (const t of r.triggers ?? []) add(t.x, t.y, 'passage');
        for (const p of r.props ?? []) {
          for (let y = p.y; y < p.y + (p.h ?? 1); y++) for (let x = p.x; x < p.x + (p.w ?? 1); x++) add(x, y, `décor de scène (${p.type ?? p.kind ?? 'objet'})`);
        }
        for (const b of r.built?.beds ?? []) {
          for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) add(x, y, 'lit');
        }
        (r.sourceGrid ?? r.grid ?? []).forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'E') add(x, y, 'sortie'); }));
        if (r.spawn) add(r.spawn.x, r.spawn.y, 'départ');
      }
      for (const e of m.npcEdits?.extras ?? []) add(e.x, e.y, `PNJ ${e.name ?? e.id}`);
      for (const [id, p] of Object.entries(m.npcEdits?.moved ?? {})) add(p.x, p.y, `PNJ ${id}`);
    } else {
      for (const [x, y, why] of await importantCells()) add(x, y, why);
    }
    add(m.spawn.x, m.spawn.y, 'départ');
    ui.important.set(key, set);
    return set;
  }

  // Vignette : le dessin de l'écart tel qu'il est sur la carte (ses seules cases).
  function thumb(e) {
    const m = state.map;
    const cv = document.createElement('canvas');
    const k = Math.min(56 / (e.w * TILE), 56 / (e.h * TILE), 2);
    cv.width = Math.max(1, Math.ceil(e.w * TILE * k));
    cv.height = Math.max(1, Math.ceil(e.h * TILE * k));
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (const L of ['decor', 'dessus']) {
      for (const [c, list] of Object.entries(e.refs)) {
        const x = Number(c) % m.width - e.x;
        const y = Math.floor(Number(c) / m.width) - e.y;
        for (const [l, r] of list) {
          if (l !== L) continue;
          const sid = m.sheets[Math.floor(r / 100000)];
          const img = state.images[sid];
          if (!img) continue;
          const t = r % 100000;
          const cols = colsOf(sid);
          g.drawImage(img, (t % cols) * TILE, Math.floor(t / cols) * TILE, TILE, TILE, x * TILE * k, y * TILE * k, TILE * k, TILE * k);
        }
      }
    }
    return cv;
  }

  async function remove(e) {
    const m = state.map;
    const imp = await important(true);
    const hit = e.cells.find((c) => imp.has(c));
    if (hit !== undefined) { setStatus(`Pas supprimé : il couvre une case importante (${imp.get(hit)})`, 'err'); return; }
    remember();
    // L'élément du mode simple, retiré lui-même (jamais la gomme, qui repeindrait le sol autour).
    if (e.ref?.element) studio.removePlaced(e.ref.element, e);
    // Ce qui reste de son dessin (objet de cases, ou élément sans fiche) : retiré case par case, sans le sol.
    const cells = Object.entries(e.refs).map(([c, list]) => ({
      x: Number(c) % m.width,
      y: Math.floor(Number(c) / m.width),
      refs: { sol: [], decor: list.filter(([l]) => l === 'decor').map(([, r]) => r), dessus: list.filter(([l]) => l === 'dessus').map(([, r]) => r) },
    }));
    const left = cells.filter((c) => [...c.refs.decor.map((r) => ['decor', r]), ...c.refs.dessus.map((r) => ['dessus', r])]
      .some(([l, r]) => stackOf(m.layers[l][c.y * m.width + c.x]).includes(r)));
    if (left.length) liftObject(left);
    ui.focus = null;
    changed();
    render();
    setStatus(`Retiré : ${e.famille}, ${e.raisons[0]}`, 'ok');
  }

  function ignore(e) {
    const all = store.get();
    all[state.map.id] = [...new Set([...(all[state.map.id] ?? []), keyOf(e)])];
    store.set(all);
    if (ui.focus === e) ui.focus = null;
    render();
    requestDraw();
  }

  function count() {
    const n = current().length;
    const badge = $('ecarts-count');
    if (badge) {
      badge.textContent = n ? String(n) : '';
      badge.hidden = !n;
    }
    return n;
  }

  async function render() {
    count();
    const panel = $('ecartsbar');
    panel.hidden = !ui.open;
    $('show-ecarts').classList.toggle('on', ui.open);
    if (!ui.open || !state.map) return;
    const list = current();
    const imp = await important();
    const box = $('ecarts-list');
    box.innerHTML = '';
    $('ecarts-where').textContent = list.length ? `${list.length} sur cette carte` : 'aucun sur cette carte';
    for (const e of list) {
      const row = document.createElement('div');
      row.className = `ecart${ui.focus === e ? ' on' : ''}`;
      const th = document.createElement('button');
      th.className = 'ecart-thumb';
      th.title = 'Voir sur la carte';
      th.append(thumb(e));
      th.onclick = () => { ui.focus = e; focus(e); render(); requestDraw(); };
      const txt = document.createElement('div');
      txt.className = 'ecart-text';
      const fam = document.createElement('small');
      fam.textContent = `${e.famille} · ${e.x},${e.y}`;
      txt.append(fam);
      for (const r of e.raisons) {
        const p = document.createElement('div');
        p.textContent = r;
        txt.append(p);
      }
      const acts = document.createElement('div');
      acts.className = 'ecart-acts';
      const del = document.createElement('button');
      del.className = 'btn danger';
      del.textContent = 'Supprimer';
      const hit = e.cells.find((c) => imp.has(c));
      if (hit !== undefined) {
        del.disabled = true;
        del.title = `Couvre une case importante (${imp.get(hit)}) : à corriger à la main`;
      } else del.title = 'Retirer cet élément de la carte (Ctrl+Z pour annuler)';
      del.onclick = () => remove(e);
      const ign = document.createElement('button');
      ign.className = 'btn';
      ign.textContent = 'Ignorer';
      ign.title = 'Ne plus le signaler (dans ce navigateur)';
      ign.onclick = () => ignore(e);
      acts.append(del, ign);
      row.append(th, txt, acts);
      box.append(row);
    }
  }

  // Sur la carte, panneau ouvert : chaque écart en pointillés orange, celui qu'on regarde en blanc.
  function draw(ctx, cs) {
    if (!ui.open || !state.map) return;
    ctx.save();
    for (const e of current()) {
      const on = e === ui.focus;
      ctx.setLineDash(on ? [] : [5, 4]);
      ctx.lineWidth = on ? 3 : 2;
      ctx.strokeStyle = on ? '#ffffff' : 'rgba(255, 160, 60, 0.95)';
      ctx.strokeRect(e.x * cs + 1, e.y * cs + 1, e.w * cs - 2, e.h * cs - 2);
    }
    ctx.restore();
  }

  function bind() {
    $('show-ecarts').onclick = () => { ui.open = !ui.open; render(); requestDraw(); };
    $('ecarts-close').onclick = () => { ui.open = false; render(); requestDraw(); };
    $('ecarts-reset').onclick = () => {
      const all = store.get();
      delete all[state.map.id];
      store.set(all);
      render();
      requestDraw();
    };
  }

  // Une autre carte s'ouvre (ou la carte change) : liste et compteur à jour.
  function refresh() {
    ui.focus = null;
    render();
  }

  return { draw, bind, refresh, render };
}
