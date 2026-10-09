// Le grand repas partagé de New Delhi (la cour du palais) : un tapis tissé posé par terre, couvert de plats, et la petite
// assiette qu'on tend à Pierre. Version provisoire dessinée dans le code (contour sombre, reflets clairs, comme les objets
// Gen 4), en attendant des sprites de nourriture choisis par l'utilisateur.

const OUTLINE = 0x403028;

function circle(g, color, x, y, r) {
  g.fillStyle(color).fillCircle(x, y, r);
}

// Une assiette de métal (thali) : riz, deux petits bols (dal, légumes), une galette.
function thali(g, x, y) {
  circle(g, OUTLINE, x, y, 7);
  circle(g, 0x9098a8, x, y, 6);
  circle(g, 0xd0d4e0, x, y, 5);
  circle(g, 0xf4f0e4, x - 1, y + 1, 2);           // riz
  circle(g, OUTLINE, x + 2, y - 2, 2);
  circle(g, 0xe0a828, x + 2, y - 2, 1.4);         // dal
  circle(g, OUTLINE, x - 2, y - 2, 2);
  circle(g, 0x78a030, x - 2, y - 2, 1.4);         // légumes
  g.fillStyle(0xd8b070).fillRect(x + 1, y + 1, 3, 2);   // un morceau de galette
}

// Un bol (curry, dal…) posé sur le tapis.
function bowl(g, x, y, food) {
  circle(g, OUTLINE, x, y, 4);
  circle(g, 0xa8603c, x, y, 3.2);
  circle(g, food, x, y - 0.5, 2.2);
  g.fillStyle(0xffffff, 0.5).fillRect(x - 2, y - 2, 1, 1);
  g.fillStyle(0xffffff, 1);
}

// Une pile de galettes (chapatis).
function chapatis(g, x, y) {
  g.fillStyle(OUTLINE).fillEllipse(x, y, 13, 9);
  g.fillStyle(0xc89858).fillEllipse(x, y + 1, 11, 6);
  g.fillStyle(0xe4c084).fillEllipse(x, y - 0.5, 11, 6);
  g.fillStyle(0xb88440).fillRect(x - 2, y - 1, 1, 1).fillRect(x + 2, y, 1, 1).fillRect(x, y - 2, 1, 1);
}

// La grande marmite de cuivre, au milieu : le riz.
function handi(g, x, y) {
  g.fillStyle(OUTLINE).fillEllipse(x, y, 17, 13);
  g.fillStyle(0xb0602c).fillEllipse(x, y + 1, 15, 10);
  g.fillStyle(0xd88848).fillEllipse(x - 2, y, 6, 4);
  g.fillStyle(0x803c1c).fillEllipse(x, y - 2, 11, 5);
  g.fillStyle(0xf4f0e0).fillEllipse(x, y - 2, 9, 4);
}

// Le tapis et le repas : `w` x `h` cases (4 x 2 dans la cour), en (ox, oy).
export function drawMeal(g, ox, oy, { w = 4, h = 2 } = {}) {
  const W = w * 16, H = h * 16;
  g.fillStyle(OUTLINE).fillRect(ox, oy + 1, W, H - 2);
  g.fillStyle(0xd8a040).fillRect(ox + 1, oy + 2, W - 2, H - 4);           // bordure ocre
  g.fillStyle(0xa83828).fillRect(ox + 3, oy + 4, W - 6, H - 8);           // le champ rouge
  g.fillStyle(0xc85c38);
  for (let x = ox + 6; x < ox + W - 4; x += 6) {                         // petits losanges tissés
    for (let y = oy + 7; y < oy + H - 5; y += 6) g.fillRect(x, y, 2, 1);
  }
  // Les plats : quatre assiettes près des convives, la marmite au milieu, galettes et bols entre deux.
  thali(g, ox + 9, oy + 9);
  thali(g, ox + W - 9, oy + 9);
  thali(g, ox + 9, oy + H - 9);
  thali(g, ox + W - 9, oy + H - 9);
  handi(g, ox + W / 2, oy + H / 2);
  chapatis(g, ox + W / 2 - 14, oy + H / 2 + 1);
  bowl(g, ox + W / 2 + 14, oy + H / 2 - 4, 0xc85820);                      // curry
  bowl(g, ox + W / 2 + 13, oy + H / 2 + 6, 0xe0a828);                      // dal
}

// La petite assiette tendue à Pierre, centrée sur (0, 0).
export function drawDish(g) {
  thali(g, 0, 0);
}
