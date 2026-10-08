// Guirlande de fanions (décor `fanions` des cartes, ex. Fort-de-France après la Joie de vivre) : un fil tendu entre
// deux points, qui pend un peu, et des fanions accrochés le long, qui ondulent. Les fanions viennent de la guirlande
// animée FX_Flag01 (scripts/build_fanions.py -> public/assets/decor/fanions.png) ; le fil est dessiné ici.
//
// Décor : { kind: 'fanions', x, y, cords: [[x0, y0, x1, y1, creux, écart?], …] } — extrémités des fils en pixels de la
// carte, `creux` : de combien de pixels le milieu du fil descend, `écart` : pixels de fil par fanion (13 par défaut) ;
// x, y : la case qui règle la profondeur (les personnages en dessous passent devant).

export const BUNTING_SHEET = 'fanions';
const PENNANT_W = 20;          // une case de la planche : 20 x 16, 7 motifs, rangée 1 = soulevés par le vent
const KINDS = 7;
const SPACING = 13;            // pixels de fil entre deux fanions (par défaut)
const CORD = 0xe8e4dc;
const CORD_SHADE = 0x6c6870;

export function preloadBunting(scene) {
  scene.load.spritesheet(BUNTING_SHEET, `${import.meta.env.BASE_URL}assets/decor/fanions.png`,
    { frameWidth: PENNANT_W, frameHeight: 16 });
}

const pointOn = ([x0, y0, x1, y1, sag], t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)];

// Conteneur Phaser de la guirlande, à la profondeur `depth` ; ses fanions ondulent tant qu'il existe.
export function addBunting(scene, data, depth) {
  const container = scene.add.container(0, 0).setDepth(depth);
  const cords = scene.add.graphics();
  container.add(cords);
  const flags = [];
  let k = 0;
  for (const cord of data.cords) {
    const [x0, y0, x1, y1] = cord;
    const length = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.ceil(length / 2));
    for (const [color, dy] of [[CORD_SHADE, 1], [CORD, 0]]) {
      cords.lineStyle(1, color, 1).beginPath();
      for (let i = 0; i <= steps; i++) {
        const [x, y] = pointOn(cord, i / steps);
        if (i === 0) cords.moveTo(x, y + dy); else cords.lineTo(x, y + dy);
      }
      cords.strokePath();
    }
    const count = Math.max(1, Math.floor(length / (cord[5] ?? SPACING)));
    for (let i = 0; i < count; i++) {
      const [x, y] = pointOn(cord, (i + 0.5) / count);
      const kind = k++ % KINDS;
      const flag = scene.add.image(Math.round(x - PENNANT_W / 2), Math.round(y) - 1, BUNTING_SHEET, kind).setOrigin(0);
      flags.push({ flag, kind });
      container.add(flag);
    }
  }
  // Le vent : à chaque battement, un fanion sur trois se soulève ou retombe, à tour de rôle.
  let beat = 0;
  const wind = scene.time.addEvent({
    delay: 260,
    loop: true,
    callback: () => {
      beat++;
      flags.forEach(({ flag, kind }, i) => {
        if ((i + beat) % 3 === 0) flag.setFrame(flag.frame.name === kind ? kind + KINDS : kind);
      });
    },
  });
  container.once('destroy', () => wind.remove());
  return container;
}
