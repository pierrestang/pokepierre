import { refOf, decodeRef, stackOf, EMPTY } from './mapModel.js';
import { layoutForest } from './forestLayout.js';

// Assistant du créateur de cartes : des commandes qui rangent derrière le dessinateur, sous son contrôle.
// - Portée : la zone choisie (outil Déplacer), sinon toute la carte.
// - Chaque commande est un seul pas d'historique (Ctrl+Z l'annule d'un coup) et ne change jamais les collisions. Après chaque commande, l'assistant vérifie que les cases importantes (départ, PNJ, portes, objets,
//   déclencheurs d'une carte du jeu) restent atteignables.
// - Commandes (boutons ou phrase en français, mêmes actions) : régulariser un chemin, corriger les transitions entre
//   matières, semer des hautes herbes (densité, tirage rejouable, « régénère cette zone »), refaire la bordure d'arbres
//   (lisière d'arbres entiers à la place des carrés de forêt coupés).
//
// Les bords de matières viennent de la planche « transitions » (scripts/build_transitions.py) : chaque case de bord
// a un numéro calculable (matière x 625 + morceaux des quatre quarts en base 5), sans fabriquer d'image.

const PIECES = 5;                                  // coin, bord horizontal, bord vertical, angle rentrant, plein
const CENTER = 4;
// Matières considérées comme « la même » pour tracer les bords (comme les scripts de conversion).
// 'lagoon' : eau claire recolorée (lagon de Fort-de-France) ; 'shore' : rivage fabriqué (sable avec son écume) : l'eau
// qui les touche ne trace pas de bord (le rivage a déjà le sien).
const SAME = {
  path: new Set(['path', 'beach', 'pier']),
  beach: new Set(['beach', 'sea', 'pond', 'pier', 'path', 'lagoon', 'shore']),
  sea: new Set(['sea', 'pond', 'pier', 'lagoon', 'shore']),
  pond: new Set(['pond', 'sea', 'pier', 'other', 'lagoon', 'shore']),
  tall: new Set(['tall']),
};
const GRASS_TILES = new Set(['4,0', '4,1', '4,2', '3,2', '3,3']);   // herbe DPPt et ses touffes
const QUADS_KEY = /^\('quads', '([^']+)', \(\((\d+), (\d+)\), \((\d+), (\d+)\), \((\d+), (\d+)\), \((\d+), (\d+)\)\)\)$/;

// Générateur pseudo-aléatoire à graine (un tirage est rejouable à l'identique).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createAssistant(api) {
  const { state } = api;
  let kit = null;                                  // transitions.json
  let autoKeys = [];                               // clés des cases assemblées (auto.json)
  let lastSow = null;                              // dernier semis : { zone, density, seed, before }
  let points = null;                               // cases importantes de la carte du jeu (ou null : carte libre)
  const meanCache = new Map();

  async function load() {
    const [k, a] = await Promise.all([
      fetch(`${api.base}assets/v2/transitions.json`).then((r) => r.json()),
      fetch(`${api.base}assets/v2/auto.json`).then((r) => r.json()),
    ]);
    kit = k;
    autoKeys = a;
    kit.byId = Object.fromEntries(kit.terrains.map((t, i) => [t.id, { ...t, i, block: blockOf(t) }]));
    await Promise.all(['transitions', 'dppt', 'autotiles-g4'].map((id) => api.loadSheet(id)));
  }

  // Cases de la planche d'un bloc de matière (bords, angles, plein).
  function blockOf(t) {
    const cells = new Set();
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) cells.add(`${t.outer[0] + dx},${t.outer[1] + dy}`);
    for (const [c, r] of [...t.inner, ...(t.legacy ?? [])]) cells.add(`${c},${r}`);   // legacy : anciens angles d'étang
    cells.add(`${t.center[0]},${t.center[1]}`);
    return cells;
  }

  function source(t, q, piece) {
    const [ox, oy] = t.outer;
    const qx = q % 2;
    const qy = Math.floor(q / 2);
    return [[ox + 2 * qx, oy + 2 * qy], [ox + 1, oy + 2 * qy], [ox + 2 * qx, oy + 1], t.inner[q], t.center][piece];
  }

  // ---------- Reconnaître le sol d'une case ----------

  // Les quatre quarts d'une case de sol : { sheet, quads: [[col, rangée] x 4] }, ou null (case fabriquée à la main).
  function quadsOf(ref) {
    const tile = decodeRef(state.map, ref);
    if (!tile) return null;
    if (tile.sheet === 'transitions') {
      const t = kit.terrains[Math.floor(tile.index / kit.per)];
      const code = tile.index % kit.per;
      return { sheet: t.sheet, quads: [0, 1, 2, 3].map((q) => source(t, q, Math.floor(code / PIECES ** q) % PIECES)) };
    }
    if (tile.sheet === 'auto') {
      const m = QUADS_KEY.exec(autoKeys[tile.index] ?? '');
      if (!m) return null;
      const n = m.slice(2).map(Number);
      return { sheet: m[1], quads: [0, 1, 2, 3].map((q) => [n[2 * q], n[2 * q + 1]]) };
    }
    const c = api.colsOf(tile.sheet);
    const at = [tile.index % c, Math.floor(tile.index / c)];
    return { sheet: tile.sheet, quads: [at, at, at, at] };
  }

  // Couleur moyenne d'une case (pour les cases qu'on ne sait pas lire : recolorées, fondues).
  function meanOf(ref) {
    if (meanCache.has(ref)) return meanCache.get(ref);
    const tile = decodeRef(state.map, ref);
    const img = tile && state.images[tile.sheet];
    let mean = null;
    if (img) {
      const c = api.colsOf(tile.sheet);
      const cv = document.createElement('canvas');
      cv.width = cv.height = 16;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, (tile.index % c) * 16, Math.floor(tile.index / c) * 16, 16, 16, 0, 0, 16, 16);
      const d = g.getImageData(0, 0, 16, 16).data;
      let r = 0; let gg = 0; let b = 0; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
      if (n) mean = [r / n, gg / n, b / n];
    }
    meanCache.set(ref, mean);
    return mean;
  }

  // Matière d'une case : 'path', 'beach', 'sea', 'pond', 'tall', 'grass', 'pier', 'lagoon', 'shore' ou 'other'.
  function classOf(x, y) {
    const m = state.map;
    const stack = stackOf(m.layers.sol[y * m.width + x]);
    if (!stack.length) return 'other';
    const ref = stack[0];
    const tile = decodeRef(m, ref);
    if (tile?.sheet === 'g4-mobilier') return 'pier';
    if (tile?.sheet === 'auto' && /^\('stack', \(\('objets'/.test(autoKeys[tile.index] ?? '')) return 'sea';
    const q = quadsOf(ref);
    if (q) {
      for (const t of kit.terrains) {
        if (t.sheet === q.sheet && q.quads.every(([c, r]) => kit.byId[t.id].block.has(`${c},${r}`))) return t.id;
      }
      if (q.sheet === 'dppt' && q.quads.every(([c, r]) => GRASS_TILES.has(`${c},${r}`))) return 'grass';
    }
    const mean = meanOf(ref);
    if (!mean) return 'other';
    const [r, g, b] = mean;
    // De l'eau (même claire, même avec un coin d'écume) : le bleu domine le rouge.
    if (b > r + 40 && b >= g - 10) return (r + g + b) / 3 > 150 ? 'lagoon' : 'sea';
    if (r > 150 && g > 200) return 'shore';                         // sable clair, écume
    if (g > r + 15 && g > b - 10) return 'grass';
    return 'other';
  }

  // ---------- Poser les bonnes cases de bord ----------

  // La case voulue pour une case de matière `id` en (x, y), d'après ses voisines (`cls` : matière de chaque case).
  function wanted(cls, x, y, id) {
    const m = state.map;
    const same = SAME[id];
    const other = (dx, dy) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.width || ny >= m.height) return false;      // le bord de la carte : pas de bordure
      return !same.has(cls[ny * m.width + nx]);
    };
    let code = 0;
    const pieces = [];
    for (let q = 0; q < 4; q++) {
      const dx = q % 2 ? 1 : -1;
      const dy = q >= 2 ? 1 : -1;
      const v = other(0, dy);
      const h = other(dx, 0);
      const d = other(dx, dy);
      const piece = v && h ? 0 : v ? 1 : h ? 2 : d ? 3 : CENTER;
      pieces.push(piece);
      code += piece * PIECES ** q;
    }
    const t = kit.byId[id];
    return { t, code, center: pieces.every((p) => p === CENTER), quads: pieces.map((p, q) => source(t, q, p)) };
  }

  const sameQuads = (a, b) => a && a.sheet === b.sheet && a.quads.every(([c, r], q) => c === b.quads[q][0] && r === b.quads[q][1]);

  // Refait les cases de bord de `cells` : renvoie { changed, kept } (kept : cases faites à la main laissées telles).
  function retile(cls, cells) {
    const m = state.map;
    let changed = 0;
    let kept = 0;
    for (const i of cells) {
      const id = cls[i];
      if (!SAME[id]) continue;
      const x = i % m.width;
      const y = Math.floor(i / m.width);
      const w = wanted(cls, x, y, id);
      const stack = stackOf(m.layers.sol[i]);
      const current = stack.length ? quadsOf(stack[0]) : null;
      const want = { sheet: w.t.sheet, quads: w.quads };
      if (sameQuads(current, want)) continue;
      // Une case peinte ou recolorée à la main (illisible : motif de la mer, lagon) reste telle quelle.
      if (stack.length && !current) { kept++; continue; }
      const ref = w.center
        ? refOf(m, w.t.sheet, w.t.center[1] * api.colsOf(w.t.sheet) + w.t.center[0])
        : refOf(m, 'transitions', w.t.i * kit.per + w.code);
      const next = [ref, ...stack.slice(1)];
      m.layers.sol[i] = next.length > 1 ? next : next[0];
      changed++;
    }
    return { changed, kept };
  }

  // ---------- Portée, cases protégées, contrôle ----------

  function zone() {
    const m = state.map;
    const r = api.selection();
    return r ? { ...r, whole: false } : { x0: 0, y0: 0, x1: m.width - 1, y1: m.height - 1, whole: true };
  }
  const inZone = (z, x, y) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1;
  const zoneText = (z) => (z.whole ? 'toute la carte' : `la zone ${z.x0},${z.y0} → ${z.x1},${z.y1}`);

  // Cases importantes d'une carte du jeu (PNJ, portes et la case devant, objets, déclencheurs, props) et le départ.
  async function importantCells() {
    const m = state.map;
    if (!points || points.id !== m.id) {
      const cells = [];
      try {
        const { MAPS } = await import('../data/maps/index.js');
        const game = Object.values(MAPS).find((g) => g.built?.id === m.id);
        if (game) {
          for (const n of game.npcs ?? []) cells.push([n.x, n.y, `PNJ ${n.name ?? n.id}`]);
          for (const d of game.doors ?? []) { cells.push([d.x, d.y, 'porte']); cells.push([d.x, d.y + 1, 'devant une porte']); }
          for (const o of game.objects ?? []) cells.push([o.x, o.y, 'objet']);
          for (const t of game.triggers ?? []) cells.push([t.x, t.y, 'déclencheur']);
          for (const p of game.props ?? []) cells.push([p.x, p.y, 'obstacle de l\'histoire']);
        }
      } catch { /* carte libre : seulement le départ */ }
      points = { id: m.id, cells };
    }
    return [...points.cells, [m.spawn.x, m.spawn.y, 'départ']];
  }

  // Toutes les cases importantes atteignables depuis le départ (sa case, ou une voisine si elle est bloquante) ?
  async function check() {
    const m = state.map;
    const important = await importantCells();
    const seen = new Uint8Array(m.width * m.height);
    const todo = [m.spawn.y * m.width + m.spawn.x];
    seen[todo[0]] = 1;
    while (todo.length) {
      const i = todo.pop();
      const x = i % m.width;
      const y = Math.floor(i / m.width);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const j = ny * m.width + nx;
        if (nx < 0 || ny < 0 || nx >= m.width || ny >= m.height || seen[j] || m.solid[j]) continue;
        seen[j] = 1;
        todo.push(j);
      }
    }
    const ok = ([x, y]) => [[x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
      .some(([a, b]) => a >= 0 && b >= 0 && a < m.width && b < m.height && seen[b * m.width + a]);
    return { lost: important.filter((p) => !ok(p)), total: important.length };
  }

  // Ce que la commande a rendu inatteignable (comparé à avant elle) ; ce qui l'était déjà est seulement compté.
  function verdict(before, after) {
    const key = (p) => `${p[0]},${p[1]}`;
    const was = new Set(before.lost.map(key));
    const fresh = after.lost.filter((p) => !was.has(key(p)));
    const already = before.lost.length ? ` (${before.lost.length} déjà inatteignable(s) avant : objets posés dans l'eau…)` : '';
    return fresh.length
      ? { ok: false, text: `⚠ ${fresh.length} case(s) importante(s) devenue(s) inatteignable(s) : ${fresh.slice(0, 3).map((p) => `${p[2]} (${p[0]},${p[1]})`).join(', ')}` }
      : { ok: true, text: `✓ accessibilité vérifiée (${after.total} cases importantes)${already}` };
  }

  // Une commande : un seul pas d'historique (retiré si rien n'a changé), puis le contrôle d'accessibilité.
  async function run(label, fn) {
    if (!kit) await load();
    const pre = await check();
    api.remember();
    const snap = () => JSON.stringify([state.map.layers, state.map.solid]);
    const before = snap();
    const result = await fn();
    if (snap() === before) {
      api.forget();
      return { text: `${label} : ${result.empty ?? `rien à changer sur ${result.where}.`}`, kind: result.empty ? 'warn' : '' };
    }
    api.changed();
    const qc = verdict(pre, await check());
    return { text: `${label} : ${result.text} ${qc.text}`, kind: qc.ok ? 'ok' : 'warn' };
  }

  const classes = () => {
    const m = state.map;
    const cls = new Array(m.width * m.height);
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) cls[y * m.width + x] = classOf(x, y);
    return cls;
  };
  const ring = (m, cells) => {
    const out = new Set();
    for (const i of cells) {
      const x = i % m.width;
      const y = Math.floor(i / m.width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < m.width && ny < m.height) out.add(ny * m.width + nx);
        }
      }
    }
    return out;
  };
  const setGround = (i, id) => {
    const m = state.map;
    const t = id === 'grass' ? { sheet: 'dppt', center: [4, 0] } : kit.byId[id];
    const ref = refOf(m, t.sheet, t.center[1] * api.colsOf(t.sheet) + t.center[0]);
    const stack = stackOf(m.layers.sol[i]);
    m.layers.sol[i] = stack.length > 1 ? [ref, ...stack.slice(1)] : ref;
  };

  // ---------- Nettoyage ----------

  // Corriger les transitions : chaque case de matière de la zone reçoit la case de bord qui va avec ses voisines.
  function fixTransitions() {
    return run('Transitions', () => {
      const m = state.map;
      const z = zone();
      const cells = [];
      for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) cells.push(y * m.width + x);
      const { changed, kept } = retile(classes(), cells);
      return {
        where: zoneText(z),
        text: `${changed} case(s) de bord refaite(s) sur ${zoneText(z)}${kept ? ` (${kept} case(s) peinte(s) à la main laissée(s))` : ''}.`,
      };
    });
  }

  // Régulariser un chemin : boucher les trous et les coupures, relier les chemins qui ne se touchent qu'en diagonale,
  // couper les bosses d'une case, puis refaire tous les bords. Jamais sur une case bloquante ; une case importante
  // (porte, PNJ…) ne perd pas son chemin.
  function straightenPath() {
    return run('Chemin', async () => {
      const m = state.map;
      const z = zone();
      const cls = classes();
      const W = m.width;
      const keep = new Set((await importantCells()).map(([x, y]) => y * W + x));
      const isPath = (x, y) => x >= 0 && y >= 0 && x < W && y < m.height && cls[y * W + x] === 'path';
      const canAdd = (x, y) => inZone(z, x, y) && cls[y * W + x] === 'grass' && !m.solid[y * W + x];
      const touched = new Set();
      let added = 0;
      let removed = 0;
      for (let pass = 0; pass < 8; pass++) {
        let moved = false;
        for (let y = z.y0; y <= z.y1; y++) {
          for (let x = z.x0; x <= z.x1; x++) {
            const i = y * W + x;
            const n = [isPath(x, y - 1), isPath(x + 1, y), isPath(x, y + 1), isPath(x - 1, y)];
            const count = n.filter(Boolean).length;
            if (canAdd(x, y)) {
              // Trou (trois voisines en chemin), ou coupure d'une case dans un chemin qui continue tout droit de part
              // et d'autre (deux cases de chaque côté, dans le même axe : deux chemins parallèles ne fusionnent pas).
              const line = (dx, dy) => isPath(x - dx, y - dy) && isPath(x - 2 * dx, y - 2 * dy)
                && isPath(x + dx, y + dy) && isPath(x + 2 * dx, y + 2 * dy);
              if (count >= 3 || line(0, 1) || line(1, 0)) {
                cls[i] = 'path'; touched.add(i); added++; moved = true; continue;
              }
            }
            if (cls[i] === 'path' && inZone(z, x, y) && !keep.has(i)) {
              // Bosse d'une case accolée à un chemin plus large (sa seule voisine de chemin en a trois), ou case isolée.
              const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][n.findIndex(Boolean)] ?? [0, 0];
              const wideNeighbor = count === 1 && [[0, -1], [1, 0], [0, 1], [-1, 0]]
                .filter(([a, b]) => isPath(x + dx + a, y + dy + b)).length >= 3;
              const atEdge = x === 0 || y === 0 || x === W - 1 || y === m.height - 1;
              if ((count === 0 || wideNeighbor) && !atEdge) {
                cls[i] = 'grass'; touched.add(i); removed++; moved = true;
              }
            }
          }
        }
        // Diagonales : deux cases de chemin qui ne se touchent que par un coin sont reliées.
        for (let y = z.y0; y < z.y1; y++) {
          for (let x = z.x0; x < z.x1; x++) {
            const a = isPath(x, y); const b = isPath(x + 1, y); const c = isPath(x, y + 1); const d = isPath(x + 1, y + 1);
            const fix = (a && d && !b && !c) ? [[x + 1, y], [x, y + 1]] : (b && c && !a && !d) ? [[x, y], [x + 1, y + 1]] : null;
            if (!fix) continue;
            const spot = fix.find(([fx, fy]) => canAdd(fx, fy));
            if (spot) { cls[spot[1] * W + spot[0]] = 'path'; touched.add(spot[1] * W + spot[0]); added++; moved = true; }
          }
        }
        if (!moved) break;
      }
      for (const i of touched) setGround(i, cls[i]);
      // Tous les bords du chemin de la zone (et autour des cases changées) sont refaits.
      const cells = new Set(ring(m, touched));
      for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) if (cls[y * W + x] === 'path') cells.add(y * W + x);
      const { changed } = retile(cls, [...ring(m, cells)].filter((i) => cls[i] === 'path'));
      return {
        where: zoneText(z),
        text: `${added} case(s) ajoutée(s), ${removed} retirée(s), ${changed} bord(s) refait(s) sur ${zoneText(z)}.`,
      };
    });
  }

  // ---------- Remplissage aléatoire encadré ----------

  // Semer des hautes herbes : des touffes arrondies, sur l'herbe libre de la zone (ni chemin, ni case bloquante, ni case
  // importante), jusqu'à `density` de sa surface. Le tirage dépend de la graine : rejouable à l'identique.
  async function sow(density, seed, z = zone()) {
    const m = state.map;
    const W = m.width;
    const cls = classes();
    const keep = new Set((await importantCells()).map(([x, y]) => y * W + x));
    const free = [];
    for (let y = z.y0; y <= z.y1; y++) {
      for (let x = z.x0; x <= z.x1; x++) {
        const i = y * W + x;
        const besidePath = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cls[(y + dy) * W + x + dx] === 'path');
        if (cls[i] === 'grass' && !m.solid[i] && !keep.has(i) && !besidePath) free.push(i);   // une case d'herbe le long des chemins
      }
    }
    const goal = Math.round(free.length * density);
    const freeSet = new Set(free);
    const random = rng(seed);
    const sown = new Set();
    let guard = 0;
    let clumps = 0;
    while (sown.size < goal && guard++ < 500) {
      // Une touffe ronde : un germe, puis les voisines libres les plus proches de son centre (et les mieux entourées),
      // avec un peu de hasard pour que le bord ne soit pas un cercle parfait.
      const start = free[Math.floor(random() * free.length)];
      if (sown.has(start)) continue;
      const size = 4 + Math.floor(random() * 9);
      const cx = start % W;
      const cy = Math.floor(start / W);
      const blob = [start];
      sown.add(start);
      clumps++;
      while (blob.length < size && sown.size < goal) {
        const cand = new Set();
        for (const i of blob) {
          for (const j of [i - 1, i + 1, i - W, i + W]) {
            if (freeSet.has(j) && !sown.has(j) && Math.abs((j % W) - (i % W)) <= 1) cand.add(j);
          }
        }
        if (!cand.size) break;
        const score = (j) => [j - 1, j + 1, j - W, j + W].filter((k) => sown.has(k)).length
          - Math.hypot((j % W) - cx, Math.floor(j / W) - cy) + random() * 0.8;
        const j = [...cand].sort((p, q) => score(q) - score(p))[0];
        blob.push(j);
        sown.add(j);
      }
    }
    for (const i of sown) { cls[i] = 'tall'; setGround(i, 'tall'); }
    retile(cls, [...ring(m, sown)].filter((i) => cls[i] === 'tall'));
    return { sown: sown.size, free: free.length, clumps };
  }

  function sowTall(density) {
    const z = zone();
    const seed = Math.floor(Math.random() * 1e9);
    return run('Hautes herbes', async () => {
      const m = state.map;
      const before = [];
      for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) before.push(m.layers.sol[y * m.width + x]);
      const r = await sow(density, seed, z);
      lastSow = { zone: z, density, seed, before };
      return {
        where: zoneText(z),
        text: `${r.clumps} touffe(s) de hautes herbes (${r.sown} cases) sur ${zoneText(z)}, densité ${Math.round(density * 100)} %, tirage n° ${seed}.`,
      };
    });
  }

  // Régénérer : le dernier semis est retiré de sa zone (le sol d'avant revient) et semé de nouveau avec un autre tirage.
  function regenerate(density) {
    if (!lastSow) return Promise.resolve({ text: 'Rien à régénérer : sème d\'abord des hautes herbes.', kind: 'warn' });
    const { zone: z, before } = lastSow;
    const seed = lastSow.seed + 1;
    return run('Hautes herbes', async () => {
      const m = state.map;
      let k = 0;
      for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) m.layers.sol[y * m.width + x] = before[k++];
      const d = density ?? lastSow.density;
      const r = await sow(d, seed, z);
      lastSow = { zone: z, density: d, seed, before };
      return { where: zoneText(z), text: `nouveau tirage n° ${seed} sur ${zoneText(z)} : ${r.clumps} touffe(s) (${r.sown} cases).` };
    });
  }

  // ---------- Bordure d'arbres ----------

  // Planche des lisières (scripts/build_lisieres.py) : pour chaque palette de forêt, un arbre entier (2 x 4) et un
  // buisson (1 x 1), et le tissu dense de la palette (pour la reconnaître).
  let lis = null;
  async function loadLisieres() {
    if (lis) return;
    lis = await fetch(`${api.base}assets/v2/lisieres.json`).then((r) => r.json());
    await api.loadSheet('lisieres');
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // La palette de forêt d'une case posée (tissu dense des bordures, éventuellement recoloré par ville), ou null.
  // Seules les planches d'arbres (et les cases recolorées de la planche assemblée) comptent : un toit de la même couleur
  // n'est pas de la forêt.
  const TREE_SHEETS = new Set(['g4-arbres', 'rmxp-nature', 'auto', 'catalogue']);   // catalogue : la forêt du pinceau
  function forestVariant(ref) {
    const tile = decodeRef(state.map, ref);
    if (!tile || !TREE_SHEETS.has(tile.sheet)) return null;
    const mean = meanOf(ref);
    if (!mean) return null;
    // La palette la plus proche (le chêne de Saint-Ay et la forêt DPPt sont voisins).
    let best = null;
    let gap = 8;
    for (const v of lis.variants) {
      for (const f of v.fillMeans) if (dist(f, mean) < gap) { gap = dist(f, mean); best = v; }
    }
    return best;
  }

  // Un arbre, un buisson ou un tissu de la planche « lisieres » (déjà posé par cette commande) : sa palette.
  function lisieresVariant(ref) {
    const tile = decodeRef(state.map, ref);
    if (tile?.sheet !== 'lisieres') return null;
    return lis.variants[Math.floor(Math.floor(tile.index / lis.cols) / 4)] ?? null;
  }

  // Refaire la bordure d'arbres : la forêt dense de la zone devient des rangées d'arbres entiers (forestLayout.js) :
  // un arbre par bloc de 2 x 2, le tissu sombre seulement derrière, un buisson sur une case hors des blocs au bord.
  // Les collisions ne changent pas.
  function rebuildForest() {
    return run('Bordure', async () => {
      await loadLisieres();
      const m = state.map;
      const W = m.width;
      const H = m.height;
      const z = zone();
      const forest = new Uint8Array(W * H);
      const votes = new Map();
      for (let i = 0; i < W * H; i++) {
        if (!m.solid[i]) continue;
        for (const r of stackOf(m.layers.decor[i])) {
          // Le tissu de forêt, ou les arbres d'une bordure déjà refaite (la commande peut être relancée).
          const v = forestVariant(r) ?? lisieresVariant(r);
          if (v) {
            forest[i] = 1;
            if (inZone(z, i % W, Math.floor(i / W))) votes.set(v, (votes.get(v) ?? 0) + 1);
            break;
          }
        }
      }
      // Une forêt, c'est au moins 4 cases d'un seul tenant (une case isolée de la bonne couleur n'en est pas).
      const comp = new Int32Array(W * H).fill(-1);
      for (let i = 0; i < W * H; i++) {
        if (!forest[i] || comp[i] >= 0) continue;
        const cells = [i];
        comp[i] = i;
        for (let k = 0; k < cells.length; k++) {
          const c = cells[k];
          for (const j of [c - 1, c + 1, c - W, c + W]) {
            if (j >= 0 && j < W * H && Math.abs((j % W) - (c % W)) <= 1 && forest[j] && comp[j] < 0) { comp[j] = i; cells.push(j); }
          }
        }
        if (cells.length < 4) for (const c of cells) forest[c] = 0;
      }
      if (!votes.size) {
        return { where: zoneText(z), empty: `aucune forêt dense reconnue sur ${zoneText(z)} (les sapins du collège et la haie `
          + 'du Prytanée ont déjà une silhouette détourée).' };
      }
      const variant = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const isF = (x, y) => x >= 0 && y >= 0 && x < W && y < H && forest[y * W + x];
      const { blocks, inBlock, touchesOpen } = layoutForest(W, H, isF, (x, y) => inZone(z, x, y));
      const lisRef = (col, row) => refOf(m, 'lisieres', (variant.row + row) * lis.cols + col);
      const strip = (i) => {
        // Le sol d'herbe sous la case, et plus de tissu de forêt dans son Décor.
        const g = refOf(m, 'dppt', 4);
        const solStack = stackOf(m.layers.sol[i]);
        m.layers.sol[i] = solStack.length > 1 ? [g, ...solStack.slice(1)] : g;
        const rest = stackOf(m.layers.decor[i]).filter((r) => !forestVariant(r) && !lisieresVariant(r));
        m.layers.decor[i] = rest.length > 1 ? rest : rest.length ? rest[0] : EMPTY;
      };
      const add = (layer, i, ref) => {
        const stack = stackOf(m.layers[layer][i]);
        m.layers[layer][i] = stack.length ? [...stack, ref] : ref;
      };
      // Relancée : les arbres et buissons déjà posés partent (zone et deux rangées au-dessus : les cimes) ; le tissu
      // revient sur les cases de forêt de l'intérieur qui l'avaient perdu.
      for (let y = Math.max(0, z.y0 - 2); y <= z.y1; y++) {
        for (let x = z.x0; x <= z.x1; x++) {
          const i = y * W + x;
          for (const layer of ['decor', 'dessus']) {
            const rest = stackOf(m.layers[layer][i]).filter((r) => !lisieresVariant(r));
            m.layers[layer][i] = rest.length > 1 ? rest : rest.length ? rest[0] : EMPTY;
          }
          if (inZone(z, x, y) && forest[i] && !stackOf(m.layers.decor[i]).some((r) => forestVariant(r))) {
            add('decor', i, lisRef(3 + (x % 2), y % 2));
          }
        }
      }
      // Le tissu ne reste que derrière ; un buisson sur une case de forêt hors des blocs, au bord.
      let bushes = 0;
      for (let y = z.y0; y <= z.y1; y++) {
        for (let x = z.x0; x <= z.x1; x++) {
          const i = y * W + x;
          if (!forest[i] || !touchesOpen(x, y)) continue;
          strip(i);
          if (!inBlock(x, y)) { add('decor', i, lisRef(lis.bush.col, 0)); bushes++; }
        }
      }
      // Un arbre entier par bloc, de haut en bas.
      for (const [bx, by, dy] of blocks) {
        for (let k = 0; k < lis.tree.h; k++) {
          const y = by - 2 + k + dy;
          if (y < 0 || y >= H) continue;
          for (let dx = 0; dx < lis.tree.w; dx++) {
            if (bx + dx < 0 || bx + dx >= W) continue;
          const i = y * W + bx + dx;
            add(k >= 2 || forest[i] ? 'decor' : 'dessus', i, lisRef(lis.tree.col + dx, k));
          }
        }
      }
      const edges = blocks;
      return {
        where: zoneText(z),
        text: `palette ${variant.name} : ${edges.length} arbre(s), ${bushes} buisson(s) sur ${zoneText(z)}.`,
      };
    });
  }

  // ---------- Bordure d'arbres tout autour de la carte ----------

  // Toutes les bordures d'arbres existantes (la forêt qui touche un bord de la carte : tissu, arbres et buissons de
  // lisière, forêt peinte au pinceau) sont retirées, puis une bordure neuve longe le rectangle de la carte : une bande
  // de 2 cases contre chaque bord, un arbre tous les 2 cases en largeur comme en hauteur (même écart partout ; la carte
  // doit avoir des dimensions paires). Pas d'arbre sur l'eau, le relief, un chemin (les sorties), un objet (maison,
  // clôture…) ou une case importante du jeu : le trou reste tel quel. La rangée du bas va jusqu'au bord (troncs hors de
  // la carte) ; les colonnes des côtés s'alignent sur elle.
  function borderTrees() {
    return run('Bordure', async () => {
      await loadLisieres();
      const m = state.map;
      const W = m.width;
      const H = m.height;
      const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
      const isForestRef = (r) => Boolean(forestVariant(r) ?? lisieresVariant(r));
      // La palette : celle de la forêt actuelle, sinon celle du thème de la ville, sinon DPPt.
      const votes = new Map();
      for (let i = 0; i < W * H; i++) {
        for (const r of stackOf(m.layers.decor[i])) {
          const v = forestVariant(r) ?? lisieresVariant(r);
          if (v) votes.set(v, (votes.get(v) ?? 0) + 1);
        }
      }
      const byTheme = { 'saint-ay': 'chene', montepilloy: 'automne' }[m.studio?.theme];
      const variant = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
        ?? lis.variants.find((v) => v.id === byTheme) ?? lis.variants[0];
      // 1. Les bordures existantes : la forêt d'un seul tenant qui touche un bord.
      const forest = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) if (stackOf(m.layers.decor[i]).some(isForestRef)) forest[i] = 1;
      const border = new Uint8Array(W * H);
      const todo = [];
      for (let i = 0; i < W * H; i++) {
        const x = i % W;
        const y = Math.floor(i / W);
        if (forest[i] && (x === 0 || y === 0 || x === W - 1 || y === H - 1)) { border[i] = 1; todo.push(i); }
      }
      while (todo.length) {
        const i = todo.pop();
        const x = i % W;
        for (const j of [i - W, i + W, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1]) {
          if (j >= 0 && j < W * H && forest[j] && !border[j]) { border[j] = 1; todo.push(j); }
        }
      }
      const clean = (layer, i) => {
        const rest = stackOf(m.layers[layer][i]).filter((r) => !isForestRef(r));
        m.layers[layer][i] = rest.length > 1 ? rest : rest.length ? rest[0] : EMPTY;
      };
      let removed = 0;
      const grassRef = refOf(m, 'dppt', 4);
      for (let i = 0; i < W * H; i++) {
        if (!border[i]) continue;
        clean('decor', i);
        removed++;
        // Sous une ancienne forêt, le sol ne compte pas : de l'herbe.
        const sol = stackOf(m.layers.sol[i]);
        m.layers.sol[i] = sol.length > 1 ? [grassRef, ...sol.slice(1)] : grassRef;
        if (!stackOf(m.layers.decor[i]).length) m.solid[i] = 0;
        // Les cimes posées au-dessus (jusqu'à 3 rangées plus haut) partent avec.
        for (let k = 0; k <= 3; k++) if (i - k * W >= 0) clean('dessus', i - k * W);
      }
      if (m.studio?.forest) m.studio.forest = m.studio.forest.filter(([x, y]) => !border[y * W + x]);
      // 2. La bande neuve : cases où un arbre peut aller.
      const cls = classes();
      const important = new Set((await importantCells()).map(([x, y]) => `${x},${y}`));
      const allowed = (x, y) => {
        if (!inMap(x, y)) return true;
        const i = y * W + x;
        if (!['grass', 'tall'].includes(cls[i]) || important.has(`${x},${y}`)) return false;
        return stackOf(m.layers.decor[i]).every((r) => decodeRef(m, r)?.sheet === 'autotiles-g4');   // fleurs : oui
      };
      const trees = [];
      const take = (bx, by, dy) => {
        const cells = [[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]];
        if (cells.every(([x, y]) => allowed(x, y))) trees.push([bx, by, dy, cells.filter(([x, y]) => inMap(x, y))]);
      };
      for (let bx = 0; bx < W - 1; bx += 2) take(bx, 0, 0);                         // haut
      for (let bx = 0; bx < W - 1; bx += 2) take(bx, H - 2, 1);                     // bas, jusqu'au bord
      for (let by = 2; by < H - 2; by += 2) { take(0, by, 1); take(W - 2, by, 1); } // côtés, alignés sur le bas
      const covered = new Set(trees.flatMap(([, , , cells]) => cells.map(([x, y]) => y * W + x)));
      // Un arbre des côtés ne descend que si la case de son tronc (sous lui) est de la forêt ou hors de la carte.
      for (const t of trees) {
        const [bx, by] = t;
        if (by > 0 && by < H - 2 && ![[bx, by + 2], [bx + 1, by + 2]].every(([x, y]) => !inMap(x, y) || covered.has(y * W + x))) t[2] = 0;
      }
      // 3. Dessin : herbe sous la bande, tissu derrière les cases qui ne touchent pas une case libre (et derrière la
      // rangée du bas), arbres de haut en bas ; collisions sur les cases des arbres.
      const lisRef = (col, row) => refOf(m, 'lisieres', (variant.row + row) * lis.cols + col);
      const grass = refOf(m, 'dppt', 4);
      const add = (layer, i, ref) => {
        const stack = stackOf(m.layers[layer][i]);
        m.layers[layer][i] = stack.length ? [...stack, ref] : ref;
      };
      const open = (x, y) => inMap(x, y) && !covered.has(y * W + x);
      for (const i of covered) {
        const x = i % W;
        const y = Math.floor(i / W);
        const sol = stackOf(m.layers.sol[i]);
        m.layers.sol[i] = sol.length > 1 ? [grass, ...sol.slice(1)] : grass;
        m.layers.decor[i] = EMPTY;                                                   // les fleurs sous les arbres partent
        m.solid[i] = 1;
        const inner = ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => open(x + dx, y + dy));
        if (inner || y >= H - 2) add('decor', i, lisRef(3 + (x % 2), y % 2));
      }
      trees.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      for (const [bx, by, dy] of trees) {
        for (let k = 0; k < lis.tree.h; k++) {
          const y = by - 2 + k + dy;
          if (y < 0 || y >= H) continue;
          for (let dx = 0; dx < lis.tree.w; dx++) {
            const x = bx + dx;
            if (!inMap(x, y)) continue;
            add(k >= 2 || covered.has(y * W + x) ? 'decor' : 'dessus', y * W + x, lisRef(lis.tree.col + dx, k));
          }
        }
      }
      const odd = W % 2 || H % 2 ? ` Attention : la carte fait ${W} x ${H} ; en taille impaire, les écarts ne peuvent pas être réguliers.` : '';
      return {
        where: 'toute la carte',
        text: `palette ${variant.name} : ${removed} case(s) d'anciennes bordures retirée(s), ${trees.length} arbre(s) tout autour, un tous les 2 cases.${odd}`,
      };
    });
  }

  // ---------- Phrases ----------

  // Lit une demande en français (mots-clés) et lance la commande correspondante ; null si la phrase n'est pas comprise.
  function parse(text, density) {
    const t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const pct = /(\d{1,3})\s*%/.exec(t);
    let d = pct ? Math.min(90, Number(pct[1])) / 100 : density;
    if (/\b(peu|leger|legere|clairseme)/.test(t)) d = 0.12;
    if (/\b(beaucoup|dense|epais|plein)/.test(t)) d = 0.45;
    if (/regener|autre tirage|retire|refais.*(herbe|tirage)/.test(t)) return { run: () => regenerate(pct ? d : undefined), label: 'régénérer' };
    if (/herbe/.test(t) && /(seme|semer|ajoute|plante|remplis|mets|pose|parseme|herbes hautes|hautes herbes)/.test(t)) {
      return { run: () => sowTall(d), label: 'semer des hautes herbes' };
    }
    if (/(bordure|lisiere|foret|arbres)/.test(t)) return { run: borderTrees, label: 'refaire la bordure d\'arbres' };
    if (/chemin|allee|sentier/.test(t) && /(regular|redress|nettoi|propre|aligne|angle|droit|lisse)/.test(t)) {
      return { run: straightenPath, label: 'régulariser le chemin' };
    }
    if (/(transition|bord|raccord|jonction|contour|liseré)/.test(t) || /(eau|sable|plage|mer|etang).*(herbe|chemin|sable)/.test(t)) {
      return { run: fixTransitions, label: 'corriger les transitions' };
    }
    if (/chemin|allee/.test(t)) return { run: straightenPath, label: 'régulariser le chemin' };
    return null;
  }

  // Pour le pinceau de matières du mode simple (studio.js) : la matière de chaque case, poser une matière
  // ('grass' ou une matière du kit) sur des cases, puis refaire les bords autour d'elles.
  const terrain = {
    ready: async () => { if (!kit) await load(); await loadLisieres(); },
    classes,
    paint(cls, cells, id) {
      for (const i of cells) { cls[i] = id; setGround(i, id); }
    },
    retileAround(cls, cells) { return retile(cls, [...ring(state.map, cells)]); },
    check,
    verdict,
    importantCells,
  };

  // Une case de forêt (tissu d'une bordure, arbre ou buisson de lisière) : pour que la sélection d'un objet ne déborde
  // pas sur la forêt qui le touche (builder.js objectAt). Faux tant que la planche des lisières n'est pas chargée.
  const isForestRef = (ref) => Boolean(lis) && Boolean(forestVariant(ref) ?? lisieresVariant(ref));

  return { borderTrees, isForestRef, fixTransitions, straightenPath, sowTall, regenerate, rebuildForest, parse, zone, zoneText, check, terrain,
    hasSow: () => Boolean(lastSow) };
}
