import { gameView } from './screen.js';
import { FRLG_FONT, frlgText } from './frlgFont.js';

// Mini-jeu de fléchettes (pub de Hull) : un curseur va et vient sur une barre ; Entrée (ou A) au bon moment pour
// lancer. Plus on est près du centre, mieux c'est. Trois lancers ; renvoie [{ label, points }] (voir THROWS).
// Dessiné dans la scène d'interface (UIScene), par-dessus le jeu, en pixels de l'écran de jeu (360 x 240) mis à l'échelle.
const BAR_W = 180;
const BAR_H = 14;
const PERIOD = 1300;        // un aller-retour du curseur, en ms
// Zones, du centre vers les bords (demi-largeur relative, de 0 à 1).
const ZONES = [
  { max: 0.1, label: 'Triple vingt !', points: 60, color: 0xf0c030 },
  { max: 0.28, label: 'Vingt !', points: 20, color: 0xd04040 },
  { max: 0.5, label: 'Cinq.', points: 5, color: 0x40a050 },
  { max: 0.78, label: 'Un…', points: 1, color: 0xe8e0c8 },
  { max: 1.01, label: 'Dans le mur !', points: 0, color: 0x606870 },
];
const zoneOf = (d) => ZONES.find((z) => d <= z.max);

export function playDarts(scene, throws = 3) {
  const g = scene.add.graphics().setDepth(92);
  const text = scene.add.bitmapText(0, 0, FRLG_FONT, '').setDepth(93);
  const hint = scene.add.bitmapText(0, 0, FRLG_FONT, '').setDepth(93);
  const results = [];
  let start = scene.time.now;
  let shown = null;                 // { label, until } : résultat affiché après un lancer, le curseur figé
  let frozenAt = 0;
  let done = false;                 // fin de partie : plus rien à dessiner (l'horloge peut finir pendant l'événement update)

  const position = () => Math.sin(((scene.time.now - start) / PERIOD) * Math.PI * 2);    // de -1 à 1

  const draw = () => {
    if (done) return;
    const v = gameView(scene.scale);
    const u = v.zoom;
    const cx = v.x + (v.w / 2);
    const top = v.y + 70 * u;
    const left = cx - (BAR_W / 2) * u;
    g.clear();
    g.fillStyle(0x203048, 0.92).fillRoundedRect(left - 10 * u, top - 22 * u, (BAR_W + 20) * u, 64 * u, 4 * u);
    // Zones symétriques, du bord vers le centre.
    for (const z of [...ZONES].reverse()) {
      const half = Math.min(1, z.max) * (BAR_W / 2) * u;
      g.fillStyle(z.color, 1).fillRect(cx - half, top, half * 2, BAR_H * u);
    }
    const p = shown ? frozenAt : position();
    const x = cx + p * (BAR_W / 2) * u;
    g.fillStyle(0xffffff, 1).fillRect(x - 1 * u, top - 4 * u, 2 * u, (BAR_H + 8) * u);
    g.fillStyle(0x101010, 1).fillTriangle(x - 4 * u, top - 6 * u, x + 4 * u, top - 6 * u, x, top - 1 * u);
    text.setScale(u).setText(frlgText(scene, `Lancer ${Math.min(results.length + (shown ? 0 : 1), throws)} / ${throws}`));
    text.setPosition(left, top - 18 * u);
    hint.setScale(u).setText(frlgText(scene, shown ? shown.label : 'Entrée : lancer !'));
    hint.setPosition(left, top + (BAR_H + 6) * u);
  };

  return new Promise((resolve) => {
    const finish = () => {
      done = true;
      scene.events.off('update', draw);
      scene.input.keyboard.off('keydown', onKey);
      g.destroy();
      text.destroy();
      hint.destroy();
      resolve(results);
    };
    const onKey = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (shown) return;
      frozenAt = position();
      const zone = zoneOf(Math.abs(frozenAt));
      results.push({ label: zone.label, points: zone.points });
      shown = { label: zone.label };
      scene.time.delayedCall(900, () => {
        shown = null;
        if (results.length >= throws) finish();
        else start = scene.time.now - Math.random() * PERIOD;             // chaque lancer repart d'ailleurs
      });
    };
    scene.events.on('update', draw);
    scene.input.keyboard.on('keydown', onKey);
    draw();
  });
}
