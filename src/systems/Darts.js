import { gameView } from './screen.js';
import { FRLG_FONT, frlgText } from './frlgFont.js';
import { drawFrame } from './frame.js';
import { sfx } from './audio.js';

// Mini-jeu de fléchettes (pub de Hull), présenté comme un écran de jeu Pokémon : un cadre du jeu avec la cible à
// gauche (les fléchettes s'y plantent), la liste des lancers et le total à droite, la jauge de visée en bas (un curseur
// ▼ va et vient ; Entrée ou A au bon moment pour lancer : plus il est près du centre, mieux c'est), et une boîte de
// texte sous le cadre. Trois lancers ; renvoie [{ label, points }] (voir ZONES).
// Dessiné dans la scène d'interface (UIScene), par-dessus le jeu, en pixels de l'écran de jeu (360 x 240) mis à l'échelle.
const PERIOD = 1300;        // un aller-retour du curseur, en ms
// Zones de la jauge, du centre vers les bords (demi-largeur relative, de 0 à 1), et où la fléchette se plante sur la
// cible : rayon (en part du rayon de la cible) et angle (en degrés, 0 = à droite ; le 20 est en haut, le 5 à sa gauche,
// le 1 à sa droite).
const ZONES = [
  { max: 0.1, label: 'Triple vingt !', short: 'TRIPLE 20', points: 60, color: 0xf0c030, at: [0.52, 0.55], angle: [-93, -87] },
  { max: 0.28, label: 'Vingt !', short: 'VINGT', points: 20, color: 0xd04040, at: [0.62, 0.78], angle: [-97, -83] },
  { max: 0.5, label: 'Cinq.', short: 'CINQ', points: 5, color: 0x40a050, at: [0.3, 0.75], angle: [-115, -101] },
  { max: 0.78, label: 'Un…', short: 'UN', points: 1, color: 0xe8e0c8, at: [0.3, 0.75], angle: [-79, -65] },
  { max: 1.01, label: 'Dans le mur !', short: 'RATÉ', points: 0, color: 0x606870, at: [1.12, 1.2], angle: [0, 360] },
];
const zoneOf = (d) => ZONES.find((z) => d <= z.max);
const between = ([a, b]) => a + Math.random() * (b - a);

// Panneau (en pixels de jeu) : cadre principal et boîte de texte.
const PANEL = { x: 58, y: 14, w: 244, h: 134 };
const BOARD = { cx: 58 + 62, cy: 14 + 58, r: 40 };
const GAUGE = { x: 58 + 14, y: 14 + 116, w: 216, h: 10 };
const TEXTBOX = { x: 40, y: 190, w: 280, h: 40 };

// La cible : fond noir, vingt secteurs crème et noirs, anneaux double et triple rouges et verts, bull vert et rouge.
function drawBoard(g, cx, cy, r) {
  const seg = (Math.PI * 2) / 20;
  const ring = (r0, r1, colorOf) => {
    for (let i = 0; i < 20; i++) {
      const a0 = -Math.PI / 2 - seg / 2 + i * seg;
      g.fillStyle(colorOf(i), 1);
      g.beginPath();
      g.arc(cx, cy, r1, a0, a0 + seg, false);
      g.arc(cx, cy, r0, a0 + seg, a0, true);
      g.closePath();
      g.fillPath();
    }
  };
  g.fillStyle(0x2a2420, 1).fillCircle(cx, cy, r * 1.08);             // le bois du support
  g.fillStyle(0x101010, 1).fillCircle(cx, cy, r);
  ring(0, r * 0.82, (i) => (i % 2 ? 0x1c1c1c : 0xf0e6c8));
  ring(r * 0.78, r * 0.84, (i) => (i % 2 ? 0x30904c : 0xd03030));    // double
  ring(r * 0.48, r * 0.54, (i) => (i % 2 ? 0x30904c : 0xd03030));    // triple
  g.fillStyle(0x30904c, 1).fillCircle(cx, cy, r * 0.12);
  g.fillStyle(0xd03030, 1).fillCircle(cx, cy, r * 0.06);
  g.lineStyle(1, 0x000000, 0.35).strokeCircle(cx, cy, r * 0.84);
}

// Une fléchette plantée : le fût et l'empennage, la pointe en (x, y).
function drawDart(g, x, y, u) {
  g.fillStyle(0x303030, 1).fillRect(x - 0.5 * u, y - 7 * u, 1 * u, 7 * u);
  g.fillStyle(0xe03050, 1).fillTriangle(x, y - 7 * u, x - 3 * u, y - 11 * u, x + 3 * u, y - 11 * u);
  g.fillStyle(0xf8f8f8, 1).fillRect(x - 0.5 * u, y - 1 * u, 1 * u, 1 * u);
}

export function playDarts(scene, throws = 3) {
  const g = scene.add.graphics().setDepth(92);
  const darts = scene.add.graphics().setDepth(93);
  const say = (s = '') => scene.add.bitmapText(0, 0, FRLG_FONT, s).setDepth(94);
  const title = say();
  const round = say();
  const lines = Array.from({ length: throws }, () => say());
  const totalText = say();
  const message = say();
  const texts = [title, round, ...lines, totalText, message];
  const results = [];
  const planted = [];                // fléchettes plantées : { rx, ry } en part du rayon, depuis le centre
  let flying = null;                 // fléchette en vol : { rx, ry, t0 }
  let start = scene.time.now;
  let shown = null;                  // { label } : résultat affiché après un lancer, le curseur figé
  let frozenAt = 0;
  let done = false;                  // fin de partie : plus rien à dessiner (l'horloge peut finir pendant l'événement update)

  const position = () => Math.sin(((scene.time.now - start) / PERIOD) * Math.PI * 2);    // de -1 à 1

  const draw = () => {
    if (done) return;
    const v = gameView(scene.scale);
    const u = v.zoom;
    const X = (x) => v.x + x * u;
    const Y = (y) => v.y + y * u;
    g.clear();
    darts.clear();
    // Cadres du jeu : le panneau et la boîte de texte.
    drawFrame(g, X(PANEL.x), Y(PANEL.y), PANEL.w * u, PANEL.h * u, u);
    drawFrame(g, X(TEXTBOX.x), Y(TEXTBOX.y), TEXTBOX.w * u, TEXTBOX.h * u, u);
    // Bandeau du titre.
    g.fillStyle(0x6888a8, 1).fillRect(X(PANEL.x + 4), Y(PANEL.y + 4), (PANEL.w - 8) * u, 14 * u);
    // La cible et ses fléchettes.
    const cx = X(BOARD.cx);
    const cy = Y(BOARD.cy + 4);
    const r = BOARD.r * u;
    drawBoard(g, cx, cy, r);
    for (const d of planted) drawDart(darts, cx + d.rx * r, cy + d.ry * r, u);
    if (flying) {
      const t = Math.min(1, (scene.time.now - flying.t0) / 260);
      const fx = cx + flying.rx * r;
      const fy = cy + flying.ry * r;
      drawDart(darts, fx, fy + (1 - t) * 70 * u, u * (1 + (1 - t) * 0.8));
    }
    // La jauge : zones symétriques, du bord vers le centre ; le curseur ▼ au-dessus.
    const gx = X(GAUGE.x);
    const gy = Y(GAUGE.y);
    const gw = GAUGE.w * u;
    const gh = GAUGE.h * u;
    g.fillStyle(0x303848, 1).fillRoundedRect(gx - 2 * u, gy - 2 * u, gw + 4 * u, gh + 4 * u, 3 * u);
    for (const z of [...ZONES].reverse()) {
      const half = Math.min(1, z.max) * (gw / 2);
      g.fillStyle(z.color, 1).fillRect(gx + gw / 2 - half, gy, half * 2, gh);
    }
    g.fillStyle(0xffffff, 0.35).fillRect(gx, gy, gw, 2 * u);
    const p = shown ? frozenAt : position();
    const px = gx + gw / 2 + p * (gw / 2);
    g.fillStyle(0x202020, 1).fillTriangle(px - 5 * u, gy - 9 * u, px + 5 * u, gy - 9 * u, px, gy - 2 * u);
    g.fillStyle(0xf8f8f8, 1).fillTriangle(px - 3 * u, gy - 8 * u, px + 3 * u, gy - 8 * u, px, gy - 4 * u);
    g.fillStyle(0x202020, 1).fillRect(px - 0.5 * u, gy, 1 * u, gh);
    // Textes : titre, manche, lancers, total, message.
    const n = Math.min(results.length + (shown ? 0 : 1), throws);
    title.setScale(u).setText(frlgText(scene, 'FLÉCHETTES')).setTint(0xffffff).setPosition(X(PANEL.x + 8), Y(PANEL.y + 3));
    round.setScale(u).setText(frlgText(scene, `LANCER ${n}/${throws}`)).setTint(0xffffff);
    round.setPosition(X(PANEL.x + PANEL.w - 8) - round.width, Y(PANEL.y + 3));
    lines.forEach((t, i) => {
      const res = results[i];
      t.setScale(u).setText(frlgText(scene, `${i + 1}. ${res ? `${res.short}` : '- - -'}`));
      t.setPosition(X(PANEL.x + 126), Y(PANEL.y + 24 + i * 18));
    });
    const total = results.reduce((s, t) => s + t.points, 0);
    totalText.setScale(u).setText(frlgText(scene, `TOTAL : ${total}`)).setPosition(X(PANEL.x + 126), Y(PANEL.y + 82));
    message.setScale(u).setText(frlgText(scene, shown ? shown.label : 'Appuie sur A au bon moment !'));
    message.setPosition(X(TEXTBOX.x + 9), Y(TEXTBOX.y + 12));
  };

  return new Promise((resolve) => {
    const finish = () => {
      done = true;
      scene.events.off('update', draw);
      scene.input.keyboard.off('keydown', onKey);
      g.destroy();
      darts.destroy();
      texts.forEach((t) => t.destroy());
      resolve(results);
    };
    const onKey = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (shown) return;
      frozenAt = position();
      const zone = zoneOf(Math.abs(frozenAt));
      results.push({ label: zone.label, short: zone.short, points: zone.points });
      shown = { label: zone.label };
      const a = (between(zone.angle) * Math.PI) / 180;
      const d = between(zone.at);
      flying = { rx: Math.cos(a) * d, ry: Math.sin(a) * d, t0: scene.time.now };
      sfx('select');
      scene.time.delayedCall(260, () => {
        planted.push({ rx: flying.rx, ry: flying.ry });
        flying = null;
        sfx(zone.points >= 20 ? 'confirm' : 'blip');
      });
      scene.time.delayedCall(1100, () => {
        shown = null;
        if (results.length >= throws) scene.time.delayedCall(500, finish);
        else start = scene.time.now - Math.random() * PERIOD;             // chaque lancer repart d'ailleurs
      });
    };
    scene.events.on('update', draw);
    scene.input.keyboard.on('keydown', onKey);
    draw();
  });
}
