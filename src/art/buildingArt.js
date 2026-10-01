import { TILE_SIZE as S } from '../data/tiles.js';
import { rect, sprite } from './pixel.js';

// Bâtiments dessinés d'un bloc par-dessus leurs cases (R/W/D gardent la collision).
// Taille en cases : maison 5x4, labo 7x4. La porte est en (1, 3) pour la maison, (3, 3) pour le labo.

function window_(g, x, y, w, h) {
  rect(g, 0x405080, x, y, w, h);
  rect(g, 0x6090e0, x + 1, y + 1, w - 2, h - 2);
  rect(g, 0x405080, x + Math.floor(w / 2), y + 1, 1, h - 2);
  rect(g, 0xb0d0f8, x + 1, y + 1, 3, 1);
  rect(g, 0xf0f0f8, x - 1, y + h, w + 2, 1);
}

function roundWindow(g, cx, cy) {
  const k = 0x405080;
  rect(g, k, cx - 4, cy - 3, 9, 7);
  rect(g, k, cx - 3, cy - 4, 7, 9);
  rect(g, 0x70a0e8, cx - 3, cy - 2, 7, 5);
  rect(g, 0x70a0e8, cx - 2, cy - 3, 5, 7);
  rect(g, 0xf8f8f8, cx - 2, cy - 2, 2, 1);
}

// Maison façon Rouge Feu (5 x 4 cases) : grand toit rouge en rangées de tuiles avec faîtage clair et
// pans latéraux en relief, murs blancs en bardage, deux fenêtres à croisillons, porte en retrait sur
// une marche. Porte en case locale (1, 3).
function drawHouse(g, ox, oy) {
  const K = 0x383850;
  const R = (c, x, y, w, h) => rect(g, c, ox + x, oy + y, w, h);
  g.fillStyle(0x000000, 0.22);                                        // ombre portée
  g.fillRect(ox + 4, oy + 63, 76, 2);
  g.fillRect(ox + 78, oy + 38, 2, 26);

  // ---- Toit (y 1..37) ----
  R(K, 1, 1, 78, 37);
  R(K, 0, 3, 80, 34);
  // Pan avant : rangées de tuiles, plus claires vers le haut
  const rows = [0xf07860, 0xe86850, 0xe06048, 0xd85840, 0xd05038];
  for (let i = 0; i < 6; i++) {
    const y = 6 + i * 5;
    R(rows[Math.min(i, 4)], 7, y, 66, 5);
    R(0xf8a088, 7, y, 66, 1);                                         // arête claire de la rangée
    R(0xa83828, 7, y + 4, 66, 1);                                     // ombre sous la rangée
    for (let x = 9 + (i % 2) * 4; x < 72; x += 8) R(0xb84030, x, y + 1, 1, 3);   // joints des tuiles
  }
  // Faîtage
  R(0xf8c0a8, 7, 3, 66, 2);
  R(0xfff0e0, 9, 3, 20, 1);
  R(0xa83828, 7, 5, 66, 1);
  // Rives du toit : fines bordures dans les rouges du toit (légèrement éclairée à gauche, ombrée à droite)
  R(0xe87058, 2, 4, 4, 32);
  R(0xf09078, 2, 4, 1, 32);
  for (let y = 9; y < 36; y += 5) R(0xc04030, 2, y, 4, 1);
  R(0xb04028, 74, 4, 4, 32);
  R(0x882818, 77, 4, 1, 32);
  for (let y = 9; y < 36; y += 5) R(0x882818, 74, y, 3, 1);
  R(K, 6, 3, 1, 34);
  R(K, 73, 3, 1, 34);
  // Bord du toit (avancée) et son ombre sur le mur
  R(0xa03020, 1, 35, 78, 2);
  R(0x702018, 1, 37, 78, 1);

  // ---- Murs (y 38..63) ----
  R(K, 3, 38, 74, 26);
  R(0xf0f2f8, 4, 38, 72, 25);
  for (let y = 42; y < 58; y += 4) R(0xd8dce8, 4, y, 72, 1);          // bardage
  R(0xb0b8cc, 4, 38, 72, 2);                                          // ombre sous l'avancée
  R(0xffffff, 4, 40, 2, 18);                                          // angle gauche éclairé
  R(0xc0c6d6, 74, 40, 2, 18);                                         // angle droit dans l'ombre
  // Soubassement en pierre
  R(0x9098ac, 4, 58, 72, 5);
  R(0xb8c0d0, 4, 58, 72, 1);
  for (let x = 6; x < 76; x += 7) R(0x707890, x, 59, 1, 4);
  R(0x707890, 4, 61, 72, 1);

  // Fenêtres à croisillons (cadre blanc, vitres bleues avec reflet)
  for (const wx of [40, 58]) {
    R(K, wx - 1, 42, 16, 13);
    R(0xffffff, wx, 43, 14, 11);
    R(0x4878d0, wx + 2, 45, 10, 7);
    R(0x78a8f0, wx + 2, 45, 10, 3);
    R(0xc8e0ff, wx + 3, 45, 2, 1);                                    // reflet
    R(0xc8e0ff, wx + 2, 46, 1, 1);
    R(0xffffff, wx + 6, 45, 2, 7);                                    // croisillon
    R(0xffffff, wx + 2, 48, 10, 1);
    R(K, wx - 1, 54, 16, 1);
    R(0xd8dce8, wx - 2, 55, 18, 1);                                   // appui
  }

  // Porte en retrait sur une marche (case locale 1, 3)
  R(K, 17, 42, 15, 20);
  R(0xd8dce8, 18, 43, 13, 18);                                        // chambranle
  R(K, 20, 45, 9, 16);
  R(0x5870a8, 21, 46, 7, 15);                                         // battant
  R(0x7890c8, 21, 46, 7, 1);
  R(0xa8c8f0, 22, 48, 5, 4);                                          // petite vitre
  R(0xd8e8ff, 22, 48, 2, 1);
  R(0x405890, 22, 54, 5, 5);                                          // panneau
  R(0xf8d048, 27, 54, 1, 2);                                          // poignée
  R(0xb0b4c0, 16, 61, 17, 3);                                         // marche
  R(0xd8dce4, 16, 61, 17, 1);
}

function drawLab(g, ox, oy) {
  // Toit gris quadrillé
  rect(g, 0x404850, ox, oy + 2, 112, 32);
  rect(g, 0xa8b0b8, ox + 1, oy + 3, 110, 29);
  for (let x = 8; x < 112; x += 8) rect(g, 0x808890, ox + x, oy + 3, 1, 29);
  for (let y = 10; y < 32; y += 7) rect(g, 0x808890, ox + 1, oy + y, 110, 1);
  rect(g, 0xd0d8e0, ox + 1, oy + 3, 110, 1);
  rect(g, 0x505860, ox, oy + 32, 112, 2);
  // Cheminée / aération rouge
  rect(g, 0x601818, ox + 83, oy, 16, 20);
  rect(g, 0xd84848, ox + 84, oy + 1, 14, 18);
  rect(g, 0xf07070, ox + 84, oy + 1, 14, 2);
  rect(g, 0x802828, ox + 87, oy + 5, 8, 9);

  // Murs crème
  rect(g, 0x806030, ox + 2, oy + 34, 108, 30);
  rect(g, 0xf8e8a8, ox + 3, oy + 34, 106, 27);
  rect(g, 0xd8c080, ox + 3, oy + 34, 106, 2);
  rect(g, 0xc8a868, ox + 3, oy + 58, 106, 3);
  for (const cx of [18, 34, 78, 94]) roundWindow(g, ox + cx, oy + 45);

  // Porte verte (case locale 3,3)
  rect(g, 0x3c8850, ox + 46, oy + 41, 20, 3);
  rect(g, 0x286838, ox + 49, oy + 44, 14, 20);
  rect(g, 0x58b870, ox + 50, oy + 45, 12, 19);
  rect(g, 0x3c8850, ox + 56, oy + 45, 1, 19);
  rect(g, 0x90d8a0, ox + 50, oy + 45, 12, 1);
}

// Hôpital (même emprise que le labo : 7x4, porte en (3,3)) : toit bleu-gris, murs blancs, croix rouge.
function redCross(g, cx, cy, size) {
  const arm = Math.round(size / 3);
  rect(g, 0xd83838, cx - arm / 2, cy - size / 2, arm, size);
  rect(g, 0xd83838, cx - size / 2, cy - arm / 2, size, arm);
}

function drawHospital(g, ox, oy) {
  // Toit
  rect(g, 0x3c5068, ox, oy + 2, 112, 32);
  rect(g, 0x7898b8, ox + 1, oy + 3, 110, 29);
  for (let y = 9; y < 32; y += 6) rect(g, 0x6080a0, ox + 1, oy + y, 110, 1);
  rect(g, 0xa8c0d8, ox + 1, oy + 3, 110, 1);
  rect(g, 0x3c5068, ox, oy + 32, 112, 2);
  // Grande croix sur le toit, dans un disque blanc
  rect(g, 0xf8f8f8, ox + 46, oy + 6, 20, 22);
  rect(g, 0xf8f8f8, ox + 44, oy + 8, 24, 18);
  redCross(g, ox + 56, oy + 17, 14);

  // Murs blancs
  rect(g, 0x606878, ox + 2, oy + 34, 108, 30);
  rect(g, 0xf4f4f8, ox + 3, oy + 34, 106, 27);
  rect(g, 0xd0d4e0, ox + 3, oy + 34, 106, 2);
  rect(g, 0xd83838, ox + 3, oy + 57, 106, 2);          // bandeau rouge
  rect(g, 0xa8acb8, ox + 3, oy + 59, 106, 2);
  for (const x of [10, 26, 74, 90]) window_(g, ox + x, oy + 39, 12, 9);

  // Enseigne au-dessus de la porte
  rect(g, 0xd83838, ox + 50, oy + 36, 12, 7);
  redCross(g, ox + 56, oy + 39.5, 5);
  rect(g, 0xf8f8f8, ox + 54, oy + 37, 4, 5);
  redCross(g, ox + 56, oy + 39.5, 4);

  // Porte vitrée (case locale 3,3)
  rect(g, 0x506070, ox + 49, oy + 44, 14, 20);
  rect(g, 0x9cd0f0, ox + 50, oy + 45, 12, 19);
  rect(g, 0x506070, ox + 56, oy + 45, 1, 19);
  rect(g, 0xd8f0ff, ox + 51, oy + 46, 2, 6);
  rect(g, 0xd8f0ff, ox + 58, oy + 46, 2, 6);
}

// Maison médiévale à colombages (5x4, porte en (1,3)) : toit de tuiles brunes, murs crème à poutres.
function drawMedievalHouse(g, ox, oy) {
  // Toit
  rect(g, 0x3c2014, ox, oy + 1, 80, 32);
  rect(g, 0x8c4c2c, ox + 1, oy + 2, 78, 29);
  for (let y = 5; y < 30; y += 4) {
    rect(g, 0x6c3420, ox + 1, oy + y, 78, 1);
    for (let x = (y % 8 ? 0 : 4); x < 78; x += 8) rect(g, 0x6c3420, ox + 1 + x, oy + y - 3, 1, 3);
  }
  rect(g, 0xac6c44, ox + 1, oy + 2, 78, 1);
  rect(g, 0x4c2818, ox, oy + 31, 80, 2);
  // Cheminée en pierre
  rect(g, 0x4c4c54, ox + 60, oy, 9, 12);
  rect(g, 0x9c9ca4, ox + 61, oy + 1, 7, 10);

  // Murs crème + colombages
  const beam = 0x4a3020;
  rect(g, beam, ox + 2, oy + 33, 76, 31);
  rect(g, 0xf0e6cc, ox + 3, oy + 34, 74, 27);
  for (const x of [3, 34, 52, 75]) rect(g, beam, ox + x, oy + 34, 2, 27);
  rect(g, beam, ox + 3, oy + 46, 74, 2);
  for (let i = 0; i < 12; i++) {            // croix de Saint-André entre deux poteaux
    rect(g, beam, ox + 37 + i, oy + 35 + i, 2, 1);
    rect(g, beam, ox + 49 - i, oy + 35 + i, 2, 1);
  }
  rect(g, 0x5c5c64, ox + 3, oy + 59, 74, 2);  // soubassement en pierre

  // Fenêtres à volets
  for (const x of [56, 64]) {
    rect(g, beam, x + ox, oy + 50, 8, 8);
    rect(g, 0xd8b050, x + ox + 1, oy + 51, 6, 6);
    rect(g, beam, x + ox + 4, oy + 51, 1, 6);
  }
  rect(g, 0x2c6c3c, ox + 54, oy + 50, 2, 8);
  rect(g, 0x2c6c3c, ox + 72, oy + 50, 2, 8);

  // Porte en bois cintrée (case locale 1,3)
  rect(g, beam, ox + 18, oy + 47, 12, 17);
  rect(g, beam, ox + 19, oy + 46, 10, 1);
  rect(g, 0x8c5c2c, ox + 19, oy + 48, 10, 16);
  rect(g, 0x6c4420, ox + 22, oy + 48, 1, 16);
  rect(g, 0x6c4420, ox + 26, oy + 48, 1, 16);
  rect(g, 0xd8b050, ox + 27, oy + 56, 1, 2);
}

// École médiévale (7x4, porte en (3,3)) : murs de pierre, toit d'ardoise, clocher au-dessus de la porte.
function drawSchool(g, ox, oy) {
  // Toit d'ardoise
  rect(g, 0x283038, ox, oy + 6, 112, 28);
  rect(g, 0x506070, ox + 1, oy + 7, 110, 25);
  for (let y = 10; y < 32; y += 4) rect(g, 0x3c4858, ox + 1, oy + y, 110, 1);
  rect(g, 0x7888a0, ox + 1, oy + 7, 110, 1);
  rect(g, 0x283038, ox, oy + 32, 112, 2);

  // Clocher
  rect(g, 0x3c3830, ox + 46, oy, 20, 26);
  rect(g, 0xa8a090, ox + 47, oy + 6, 18, 19);
  rect(g, 0x506070, ox + 46, oy, 20, 6);
  rect(g, 0x7888a0, ox + 47, oy + 1, 18, 1);
  rect(g, 0x2c2820, ox + 51, oy + 9, 10, 12);
  rect(g, 0xd8b040, ox + 53, oy + 11, 6, 7);           // cloche
  rect(g, 0xf0d070, ox + 53, oy + 11, 2, 1);
  rect(g, 0xb08820, ox + 55, oy + 18, 2, 2);

  // Murs de pierre
  rect(g, 0x4c4840, ox + 2, oy + 34, 108, 30);
  rect(g, 0xb8b0a0, ox + 3, oy + 34, 106, 27);
  for (let r = 0; r < 5; r++) {
    const y = oy + 36 + r * 5;
    rect(g, 0x9c9484, ox + 3, y + 4, 106, 1);
    for (let x = (r % 2 ? 6 : 0); x < 106; x += 12) rect(g, 0x9c9484, ox + 3 + x, y, 1, 4);
  }
  rect(g, 0x6c6454, ox + 3, oy + 59, 106, 2);

  // Fenêtres en arc
  for (const x of [10, 26, 74, 90]) {
    rect(g, 0x3c3830, ox + x, oy + 40, 12, 12);
    rect(g, 0x3c3830, ox + x + 2, oy + 38, 8, 2);
    rect(g, 0x6090c8, ox + x + 1, oy + 41, 10, 10);
    rect(g, 0x6090c8, ox + x + 3, oy + 39, 6, 2);
    rect(g, 0x3c3830, ox + x + 5, oy + 39, 1, 12);
    rect(g, 0xb0d0f0, ox + x + 2, oy + 42, 2, 1);
  }

  // Grande porte à double battant (case locale 3,3)
  rect(g, 0x3c3830, ox + 48, oy + 42, 16, 22);
  rect(g, 0x3c3830, ox + 51, oy + 40, 10, 2);
  rect(g, 0x7c4c24, ox + 49, oy + 43, 14, 21);
  rect(g, 0x3c2410, ox + 56, oy + 43, 1, 21);
  rect(g, 0x5c3418, ox + 49, oy + 50, 14, 1);
  rect(g, 0xd8b050, ox + 54, oy + 54, 1, 2);
  rect(g, 0xd8b050, ox + 58, oy + 54, 1, 2);
}

// Dortoir de caserne (7x4, porte en (3,3)) : toit en tôle ondulée kaki, murs de béton, rangée de fenêtres.
function drawBarracks(g, ox, oy) {
  // Toit en tôle
  rect(g, 0x2c3420, ox, oy + 2, 112, 32);
  rect(g, 0x6c7c4c, ox + 1, oy + 3, 110, 29);
  for (let x = 3; x < 110; x += 4) rect(g, 0x5a6a3c, ox + x, oy + 3, 2, 29);
  rect(g, 0x8c9c68, ox + 1, oy + 3, 110, 1);
  rect(g, 0x2c3420, ox, oy + 32, 112, 2);
  // Aérations sur le toit
  for (const x of [20, 86]) {
    rect(g, 0x3c3c40, ox + x, oy + 12, 8, 8);
    rect(g, 0x9c9ca4, ox + x + 1, oy + 13, 6, 6);
  }

  // Murs en béton
  rect(g, 0x5c5848, ox + 2, oy + 34, 108, 30);
  rect(g, 0xd8ceb0, ox + 3, oy + 34, 106, 27);
  rect(g, 0xb8ae90, ox + 3, oy + 34, 106, 2);
  rect(g, 0x7c7460, ox + 3, oy + 57, 106, 4);
  for (const x of [8, 20, 32, 68, 80, 92]) {
    rect(g, 0x3c3c40, ox + x, oy + 40, 10, 8);
    rect(g, 0x7898b8, ox + x + 1, oy + 41, 8, 6);
    rect(g, 0x3c3c40, ox + x + 1, oy + 44, 8, 1);
    rect(g, 0xb8d0e8, ox + x + 1, oy + 41, 2, 1);
  }

  // Porte métallique verte + plaque (case locale 3,3)
  rect(g, 0x2c3420, ox + 49, oy + 44, 14, 20);
  rect(g, 0x4c6c3c, ox + 50, oy + 45, 12, 19);
  rect(g, 0x3c5830, ox + 56, oy + 45, 1, 19);
  rect(g, 0xd8d0a0, ox + 58, oy + 54, 2, 1);
  rect(g, 0xe8e0c0, ox + 51, oy + 37, 10, 5);
  rect(g, 0x3c3c40, ox + 53, oy + 39, 6, 1);
}

// Poste de commandement (5x4, porte en (1,3)) : toit plat avec antenne, drapeau à la façade.
function drawHeadquarters(g, ox, oy) {
  rect(g, 0x3c3c40, ox, oy + 6, 80, 28);
  rect(g, 0x8c9094, ox + 1, oy + 7, 78, 25);
  rect(g, 0xa8acb0, ox + 1, oy + 7, 78, 1);
  rect(g, 0x7c8084, ox + 4, oy + 10, 72, 19);
  rect(g, 0x8c9094, ox + 5, oy + 11, 70, 17);
  // Antenne radio
  rect(g, 0x3c3c40, ox + 62, oy, 2, 20);
  rect(g, 0x3c3c40, ox + 58, oy + 4, 10, 1);
  rect(g, 0x3c3c40, ox + 59, oy + 9, 8, 1);
  rect(g, 0xd83030, ox + 62, oy, 2, 2);
  rect(g, 0x3c3c40, ox, oy + 32, 80, 2);

  // Murs
  rect(g, 0x5c5848, ox + 2, oy + 34, 76, 30);
  rect(g, 0xe0d6b8, ox + 3, oy + 34, 74, 27);
  rect(g, 0xc0b698, ox + 3, oy + 34, 74, 2);
  rect(g, 0x7c7460, ox + 3, oy + 57, 74, 4);
  for (const x of [40, 58]) {
    rect(g, 0x3c3c40, x + ox, oy + 40, 12, 9);
    rect(g, 0x7898b8, x + ox + 1, oy + 41, 10, 7);
    rect(g, 0xb8d0e8, x + ox + 1, oy + 41, 3, 1);
  }
  // Drapeau en façade
  rect(g, 0x505058, ox + 35, oy + 36, 1, 12);
  rect(g, 0x2848a8, ox + 36, oy + 37, 2, 5);
  rect(g, 0xf8f8f8, ox + 38, oy + 37, 2, 5);
  rect(g, 0xd83030, ox + 40, oy + 37, 2, 5);

  // Porte (case locale 1,3)
  rect(g, 0x2c3420, ox + 18, oy + 45, 12, 19);
  rect(g, 0x4c6c3c, ox + 19, oy + 46, 10, 18);
  rect(g, 0x9cb8d0, ox + 21, oy + 48, 6, 5);
  rect(g, 0xd8d0a0, ox + 27, oy + 56, 1, 2);
}

// Petite police pixel (5 de haut) pour les enseignes (lettres utilisées seulement).
const FONT = {
  K: ['1..1', '1.1.', '11..', '1.1.', '1..1'],
  E: ['111', '1..', '11.', '1..', '111'],
  D: ['11.', '1.1', '1.1', '1.1', '11.'],
  G: ['111', '1..', '1.1', '1.1', '111'],
  H: ['1.1', '1.1', '111', '1.1', '1.1'],
  U: ['1.1', '1.1', '1.1', '1.1', '111'],
  L: ['1..', '1..', '1..', '1..', '111'],
  P: ['11.', '1.1', '11.', '1..', '1..'],
  B: ['11.', '1.1', '11.', '1.1', '11.'],
  C: ['111', '1..', '1..', '1..', '111'],
  O: ['111', '1.1', '1.1', '1.1', '111'],
  R: ['11.', '1.1', '11.', '1.1', '1.1'],
  N: ['1..1', '11.1', '1.11', '1..1', '1..1'],
  I: ['1', '1', '1', '1', '1'],
  F: ['111', '1..', '11.', '1..', '1..'],
  S: ['111', '1..', '111', '..1', '111'],
  T: ['111', '.1.', '.1.', '.1.', '.1.'],
  A: ['.1.', '1.1', '111', '1.1', '1.1'],
  Y: ['1.1', '1.1', '.1.', '.1.', '.1.'],
  M: ['1...1', '11.11', '1.1.1', '1...1', '1...1'],
  W: ['1...1', '1...1', '1.1.1', '11.11', '1...1'],
  V: ['1.1', '1.1', '1.1', '1.1', '.1.'],
};

export function pixelText(g, text, x, y, scale, color) {
  let cx = x;
  for (const ch of text) {
    const glyph = FONT[ch] ?? ['...'];
    glyph.forEach((row, ry) => {
      [...row].forEach((c, rx) => {
        if (c === '1') rect(g, color, cx + rx * scale, y + ry * scale, scale, scale);
      });
    });
    cx += (glyph[0].length + 1) * scale;
  }
}

// Immeuble bordelais en pierre blonde (5x4, porte en (2,3)) : toit mansardé en ardoise,
// lucarnes, hautes fenêtres à balcons de fer forgé. `variant` fait varier la teinte de la façade.
const STONE = [0xece0c4, 0xe4d4b0, 0xf0e8d4];
function drawImmeuble(g, ox, oy, { variant = 0 } = {}) {
  const stone = STONE[variant % STONE.length];
  // Toit mansardé
  rect(g, 0x283040, ox, oy + 1, 80, 30);
  rect(g, 0x4c5868, ox + 1, oy + 2, 78, 27);
  for (let y = 6; y < 28; y += 5) rect(g, 0x3c4858, ox + 1, oy + y, 78, 1);
  rect(g, 0x6c7888, ox + 1, oy + 2, 78, 1);
  for (const x of [10, 34, 58]) {                 // lucarnes
    rect(g, 0x283040, ox + x, oy + 12, 12, 13);
    rect(g, stone, ox + x + 1, oy + 13, 10, 11);
    rect(g, 0x7898b8, ox + x + 3, oy + 15, 6, 8);
  }
  rect(g, 0x8c8474, ox, oy + 29, 80, 3);            // corniche

  // Façade en pierre
  rect(g, 0x9c9078, ox + 1, oy + 32, 78, 32);
  rect(g, stone, ox + 2, oy + 32, 76, 30);
  rect(g, 0xd0c4a4, ox + 2, oy + 46, 76, 1);
  for (const x of [8, 56, 68]) {
    rect(g, 0x3c4858, ox + x, oy + 34, 7, 10);
    rect(g, 0x7898b8, ox + x + 1, oy + 35, 5, 8);
    rect(g, 0x283040, ox + x - 1, oy + 43, 9, 2);   // balcon
    for (let i = 0; i < 9; i += 2) rect(g, 0x283040, ox + x - 1 + i, oy + 41, 1, 2);
    rect(g, 0x3c4858, ox + x, oy + 49, 7, 10);
    rect(g, 0x7898b8, ox + x + 1, oy + 50, 5, 8);
  }
  rect(g, 0x3c4858, ox + 20, oy + 34, 7, 10);
  rect(g, 0x7898b8, ox + 21, oy + 35, 5, 8);
  rect(g, 0x9c9078, ox + 2, oy + 61, 76, 3);

  // Porte cochère (case locale 2,3)
  rect(g, 0x5c3c24, ox + 33, oy + 47, 14, 17);
  rect(g, 0x5c3c24, ox + 35, oy + 45, 10, 2);
  rect(g, 0x2c5c4c, ox + 34, oy + 48, 12, 16);
  rect(g, 0x1c4034, ox + 40, oy + 48, 1, 16);
  rect(g, 0x9cc0d0, ox + 35, oy + 49, 4, 4);
  rect(g, 0x9cc0d0, ox + 42, oy + 49, 3, 4);
  rect(g, 0xd8b050, ox + 39, oy + 56, 1, 2);
}

// Agence immobilière (5x4, porte en (1,3)) : vitrine, store rayé, enseigne avec une clé.
function drawAgence(g, ox, oy) {
  rect(g, 0x3c3c40, ox, oy + 4, 80, 28);
  rect(g, 0x9c9ca4, ox + 1, oy + 5, 78, 25);
  rect(g, 0xb8b8c0, ox + 1, oy + 5, 78, 1);
  rect(g, 0x3c3c40, ox, oy + 30, 80, 2);
  // Façade blanche
  rect(g, 0x707078, ox + 1, oy + 32, 78, 32);
  rect(g, 0xf4f4f0, ox + 2, oy + 32, 76, 30);
  // Enseigne : fond bleu, clé dorée
  rect(g, 0x284c8c, ox + 30, oy + 33, 44, 8);
  rect(g, 0xe8c040, ox + 34, oy + 35, 4, 4);
  rect(g, 0x284c8c, ox + 35, oy + 36, 2, 2);
  rect(g, 0xe8c040, ox + 38, oy + 36, 10, 2);
  rect(g, 0xe8c040, ox + 44, oy + 38, 2, 2);
  rect(g, 0xf4f4f0, ox + 52, oy + 36, 18, 1);
  rect(g, 0xf4f4f0, ox + 52, oy + 38, 14, 1);
  // Store rayé
  for (let x = 0; x < 48; x += 6) rect(g, x % 12 ? 0xf4f4f0 : 0x2c8c7c, ox + 30 + x, oy + 42, 6, 4);
  // Vitrine
  rect(g, 0x3c3c40, ox + 32, oy + 47, 42, 13);
  rect(g, 0x88b8d8, ox + 33, oy + 48, 40, 11);
  rect(g, 0xc8e0f0, ox + 34, oy + 49, 8, 1);
  for (const x of [38, 50, 62]) rect(g, 0xf4f4f0, ox + x, oy + 51, 8, 6);   // annonces
  // Porte vitrée (case locale 1,3)
  rect(g, 0x3c3c40, ox + 18, oy + 45, 12, 19);
  rect(g, 0x88b8d8, ox + 19, oy + 46, 10, 18);
  rect(g, 0x3c3c40, ox + 24, oy + 46, 1, 18);
}

// École KEDGE (9x4, porte en (4,3)) : bâtiment moderne, mur-rideau vitré, grande enseigne.
function drawKedge(g, ox, oy) {
  const w = 144;
  rect(g, 0x3c4048, ox, oy + 2, w, 30);
  rect(g, 0xc8ccd4, ox + 1, oy + 3, w - 2, 27);
  rect(g, 0xe0e4ec, ox + 1, oy + 3, w - 2, 1);
  for (const x of [12, 40, 96, 124]) {             // verrières
    rect(g, 0x5878a8, ox + x, oy + 9, 12, 16);
    rect(g, 0x98b8e0, ox + x + 1, oy + 10, 4, 1);
  }
  rect(g, 0x3c4048, ox, oy + 30, w, 2);
  // Façade vitrée
  rect(g, 0x2c3440, ox + 1, oy + 32, w - 2, 32);
  rect(g, 0x5c88b8, ox + 2, oy + 33, w - 4, 29);
  for (let x = 2; x < w - 2; x += 10) rect(g, 0xe8ecf0, ox + x, oy + 33, 1, 29);
  rect(g, 0xe8ecf0, ox + 2, oy + 47, w - 4, 1);
  for (let x = 6; x < w - 8; x += 20) rect(g, 0xa8c8e8, ox + x, oy + 36, 3, 1);
  // Enseigne KEDGE
  rect(g, 0xf4f4f4, ox + 44, oy + 35, 56, 12);
  rect(g, 0xc02838, ox + 44, oy + 35, 56, 1);
  pixelText(g, 'KEDGE', ox + 51, oy + 36, 2, 0xc02838);
  // Double porte vitrée (case locale 4,3)
  rect(g, 0x2c3440, ox + 64, oy + 49, 16, 15);
  rect(g, 0xb8d8f0, ox + 65, oy + 50, 14, 14);
  rect(g, 0x2c3440, ox + 72, oy + 50, 1, 14);
  rect(g, 0x9c9ca4, ox + 60, oy + 61, 24, 3);
}

// Briques rouges : fond + joints décalés.
function bricks(g, x, y, w, h, base = 0xa84830, joint = 0x7c3020) {
  rect(g, base, x, y, w, h);
  for (let r = 0; r * 3 < h; r++) {
    rect(g, joint, x, y + r * 3, w, 1);
    for (let c = (r % 2) * 3; c < w; c += 6) rect(g, joint, x + c, y + r * 3, 1, 3);
  }
}

// Fenêtre à guillotine anglaise, cadre blanc.
function sashWindow(g, x, y) {
  rect(g, 0xf4f4f0, x, y, 9, 11);
  rect(g, 0x5878a8, x + 1, y + 1, 7, 9);
  rect(g, 0xf4f4f0, x + 1, y + 5, 7, 1);
  rect(g, 0xf4f4f0, x + 4, y + 1, 1, 9);
  rect(g, 0x9cb8d8, x + 1, y + 1, 2, 1);
}

// Maison mitoyenne anglaise en briques (5x4, porte en (2,3)) ; `variant` change la couleur de la porte.
const DOOR_COLORS = [0x1c1c24, 0xa82020, 0x1c3c8c, 0x1c5c3c];
function drawTerrace(g, ox, oy, { variant = 0 } = {}) {
  // Toit d'ardoise + cheminées
  rect(g, 0x2c3038, ox, oy + 2, 80, 30);
  rect(g, 0x505868, ox + 1, oy + 3, 78, 27);
  for (let y = 7; y < 30; y += 4) rect(g, 0x3c4450, ox + 1, oy + y, 78, 1);
  for (const x of [8, 64]) {
    bricks(g, ox + x, oy, 10, 12);
    rect(g, 0xc87850, ox + x + 2, oy - 1, 2, 2);
    rect(g, 0xc87850, ox + x + 6, oy - 1, 2, 2);
  }
  rect(g, 0xe8e4dc, ox, oy + 30, 80, 2);
  // Façade en briques
  bricks(g, ox + 1, oy + 32, 78, 32);
  rect(g, 0xe8e4dc, ox + 1, oy + 46, 78, 1);
  for (const x of [8, 20, 52, 64]) sashWindow(g, ox + x, oy + 34);
  for (const x of [10, 60]) sashWindow(g, ox + x, oy + 49);
  // Porte colorée avec imposte (case locale 2,3)
  rect(g, 0xe8e4dc, ox + 33, oy + 47, 14, 17);
  rect(g, DOOR_COLORS[variant % DOOR_COLORS.length], ox + 35, oy + 50, 10, 14);
  rect(g, 0xf8e088, ox + 36, oy + 48, 8, 2);
  rect(g, 0xd8b050, ox + 43, oy + 57, 1, 1);
  rect(g, 0xd8b050, ox + 39, oy + 53, 2, 1);
}

// Pub anglais (5x4, porte en (1,3)) : façade vert sombre, enseigne dorée « PUB », jardinières.
function drawPub(g, ox, oy) {
  rect(g, 0x2c3038, ox, oy + 2, 80, 30);
  rect(g, 0x505868, ox + 1, oy + 3, 78, 27);
  for (let y = 7; y < 30; y += 4) rect(g, 0x3c4450, ox + 1, oy + y, 78, 1);
  bricks(g, ox + 60, oy, 10, 12);
  rect(g, 0x1c1c20, ox, oy + 30, 80, 2);
  // Façade
  rect(g, 0x0c2c1c, ox + 1, oy + 32, 78, 32);
  rect(g, 0x1c4c30, ox + 2, oy + 33, 76, 29);
  rect(g, 0x0c2c1c, ox + 2, oy + 33, 76, 9);
  pixelText(g, 'PUB', ox + 48, oy + 35, 1, 0xe8c040);
  pixelText(g, 'PUB', ox + 49, oy + 35, 1, 0xe8c040);   // effet gras
  rect(g, 0xe8c040, ox + 2, oy + 42, 76, 1);
  // Vitres éclairées
  for (const x of [36, 58]) {
    rect(g, 0x0c2c1c, ox + x, oy + 45, 18, 12);
    rect(g, 0xf0c060, ox + x + 1, oy + 46, 16, 10);
    rect(g, 0x0c2c1c, ox + x + 1, oy + 50, 16, 1);
    rect(g, 0x0c2c1c, ox + x + 9, oy + 46, 1, 10);
    rect(g, 0xa82020, ox + x, oy + 57, 18, 2);        // jardinière
    for (let i = 1; i < 18; i += 3) rect(g, 0xf06080, ox + x + i, oy + 56, 2, 1);
  }
  // Enseigne suspendue
  rect(g, 0x202020, ox + 4, oy + 36, 12, 1);
  rect(g, 0xe8c040, ox + 6, oy + 37, 8, 8);
  rect(g, 0x8c2020, ox + 7, oy + 38, 6, 6);
  // Porte (case locale 1,3)
  rect(g, 0x0c2c1c, ox + 18, oy + 45, 12, 19);
  rect(g, 0x5c3418, ox + 19, oy + 46, 10, 18);
  rect(g, 0xf0c060, ox + 21, oy + 48, 6, 5);
  rect(g, 0xe8c040, ox + 27, oy + 56, 1, 2);
}

// Université de Hull (9x4, porte en (4,3)) : briques victoriennes, pignon central, enseigne « HULL ».
function drawUniversity(g, ox, oy) {
  const w = 144;
  rect(g, 0x2c3038, ox, oy + 2, w, 30);
  rect(g, 0x505868, ox + 1, oy + 3, w - 2, 27);
  for (let y = 7; y < 30; y += 4) rect(g, 0x3c4450, ox + 1, oy + y, w - 2, 1);
  // Pignon central avec horloge
  rect(g, 0x7c3020, ox + 56, oy, 32, 32);
  bricks(g, ox + 57, oy + 1, 30, 31);
  rect(g, 0xe8e0c8, ox + 64, oy + 6, 16, 16);
  rect(g, 0xf8f4e8, ox + 66, oy + 8, 12, 12);
  rect(g, 0x202020, ox + 71, oy + 9, 2, 6);
  rect(g, 0x202020, ox + 72, oy + 13, 4, 2);
  rect(g, 0xe8e0c8, ox, oy + 30, w, 2);
  // Façade
  bricks(g, ox + 1, oy + 32, w - 2, 32);
  rect(g, 0xe8e0c8, ox + 1, oy + 45, w - 2, 1);
  for (const x of [8, 24, 40, 96, 112, 128]) {        // fenêtres en arc
    rect(g, 0xe8e0c8, ox + x, oy + 35, 10, 18);
    rect(g, 0x3c5070, ox + x + 1, oy + 37, 8, 15);
    rect(g, 0x3c5070, ox + x + 2, oy + 36, 6, 1);
    rect(g, 0xe8e0c8, ox + x + 1, oy + 44, 8, 1);
    rect(g, 0x7c98c0, ox + x + 2, oy + 38, 2, 1);
  }
  // Enseigne HULL
  rect(g, 0x1c2c5c, ox + 54, oy + 34, 36, 10);
  pixelText(g, 'HULL', ox + 57, oy + 35, 2, 0xe8c040);
  // Porte en arc (case locale 4,3)
  rect(g, 0xe8e0c8, ox + 62, oy + 46, 20, 18);
  rect(g, 0x5c3418, ox + 65, oy + 49, 14, 15);
  rect(g, 0x5c3418, ox + 67, oy + 47, 10, 2);
  rect(g, 0x3c2410, ox + 72, oy + 49, 1, 15);
}

// Château (7x5, porte en (3,4)) : pierre grise, deux tours crénelées, Union Jack au sommet.
function drawCastle(g, ox, oy) {
  const stone = 0x9c9ca0;
  const dark = 0x4c4c54;
  const blocks = (x, y, w, h) => {
    rect(g, dark, x, y, w, h);
    rect(g, stone, x + 1, y + 1, w - 2, h - 2);
    for (let r = 4; r < h - 1; r += 5) rect(g, 0x84848c, x + 1, y + r, w - 2, 1);
    for (let r = 0; r < h - 1; r += 5) for (let c = ((r / 5) % 2) * 4 + 2; c < w - 1; c += 8) rect(g, 0x84848c, x + c, y + r, 1, 5);
  };
  // Donjon central
  blocks(ox + 24, oy + 8, 64, 72);
  for (let x = 24; x < 88; x += 8) rect(g, dark, ox + x, oy + 4, 5, 5);   // créneaux
  // Tours
  for (const tx of [0, 88]) {
    blocks(ox + tx, oy, 24, 80);
    for (let x = 0; x < 24; x += 6) rect(g, dark, ox + tx + x, oy - 3, 4, 4);
    rect(g, dark, ox + tx + 9, oy + 20, 6, 10);        // meurtrières
    rect(g, dark, ox + tx + 9, oy + 46, 6, 10);
  }
  // Drapeau britannique en haut
  rect(g, 0x303038, ox + 55, oy - 8, 2, 16);
  rect(g, 0x283c8c, ox + 57, oy - 8, 12, 8);
  rect(g, 0xf8f8f8, ox + 57, oy - 5, 12, 2);
  rect(g, 0xf8f8f8, ox + 62, oy - 8, 2, 8);
  rect(g, 0xd02030, ox + 57, oy - 5, 12, 1);
  rect(g, 0xd02030, ox + 62, oy - 8, 1, 8);
  // Fenêtres
  for (const x of [34, 70]) {
    rect(g, dark, ox + x, oy + 26, 8, 12);
    rect(g, 0x4c5c7c, ox + x + 1, oy + 27, 6, 10);
  }
  // Porte en arc avec herse (case locale 3,4)
  rect(g, dark, ox + 46, oy + 58, 20, 22);
  rect(g, dark, ox + 49, oy + 55, 14, 3);
  rect(g, 0x5c3418, ox + 48, oy + 60, 16, 20);
  for (let x = 50; x < 64; x += 4) rect(g, 0x303030, ox + x, oy + 60, 1, 20);
  for (let y = 64; y < 80; y += 5) rect(g, 0x303030, ox + 48, oy + y, 16, 1);
}

// Tour de l'horloge façon Big Ben (3x6, sans porte) : tour de pierre dorée, cadran, flèche.
function drawBigBen(g, ox, oy) {
  const stone = 0xd8c088;
  const shade = 0xa89060;
  // Flèche
  for (let i = 0; i < 12; i++) rect(g, 0x3c4450, ox + 24 - i, oy - 8 + i, i * 2 || 1, 1);
  rect(g, 0xd8b050, ox + 23, oy - 12, 2, 4);
  // Tour
  rect(g, 0x6c5838, ox + 10, oy + 4, 28, 92);
  rect(g, stone, ox + 11, oy + 5, 26, 90);
  for (let y = 10; y < 95; y += 6) rect(g, shade, ox + 11, oy + y, 26, 1);
  for (const x of [15, 23, 31]) rect(g, shade, ox + x, oy + 36, 1, 58);
  // Cadran
  rect(g, 0x6c5838, ox + 12, oy + 10, 24, 24);
  rect(g, 0xd8b050, ox + 13, oy + 11, 22, 22);
  rect(g, 0xf8f4e8, ox + 15, oy + 13, 18, 18);
  rect(g, 0x202020, ox + 23, oy + 15, 2, 8);
  rect(g, 0x202020, ox + 24, oy + 22, 6, 2);
  for (const [x, y] of [[23, 13], [23, 29], [15, 21], [31, 21]]) rect(g, 0x202020, ox + x, oy + y, 2, 2);
  // Base
  rect(g, 0x6c5838, ox + 6, oy + 88, 36, 8);
  rect(g, shade, ox + 7, oy + 89, 34, 6);
}

// Bus rouge à impériale, vu de dessus (3x2).
function drawBus(g, ox, oy, { variant } = {}) {
  // Bus rouge à impériale ; à Hull, bus local rouge d'un seul niveau, au toit crème.
  const hull = variant === 'hull';
  const dark = 0x701414;
  const body = 0xc82828;
  const light = 0xe84848;
  rect(g, 0x000000, ox + 3, oy + 8, 44, 20);
  rect(g, dark, ox + 2, oy + 6, 44, 20);
  rect(g, body, ox + 3, oy + 7, 42, 18);
  rect(g, light, ox + 3, oy + 7, 42, 1);
  for (let x = 6; x < 42; x += 7) {                    // fenêtres
    rect(g, 0x9cc0e0, ox + x, oy + 8, 5, 2);
    rect(g, 0x9cc0e0, ox + x, oy + 22, 5, 2);
  }
  rect(g, hull ? 0xece4c8 : 0xa82020, ox + 10, oy + 12, 28, 8);   // toit (crème à Hull)
  rect(g, 0x303030, ox + 44, oy + 10, 2, 12);          // pare-brise
  rect(g, 0xf8e088, ox + 45, oy + 8, 1, 2);
  rect(g, 0xf8e088, ox + 45, oy + 22, 1, 2);
}

// The Deep, l'aquarium de Hull (6x4, porte en (1,3)) : bâtiment anguleux d'aluminium et de verre qui s'élève
// vers l'estuaire comme un aileron, bandes vitrées en biais, enseigne au pied.
function drawTheDeep(g, ox, oy) {
  const W = 96;
  const H = 64;
  const K = 0x384048;
  const top = (x) => Math.round(H - 20 - x * 0.46);                    // toit qui monte vers la droite
  rect(g, 0x000000, ox + 2, oy + H - 2, W - 2, 2);
  for (let x = 0; x < W; x++) {
    const t = x === W - 1 ? top(x) + 6 : top(x);
    rect(g, K, ox + x, oy + t, 1, H - t);                               // contour
    if (x === 0 || x >= W - 2) continue;
    rect(g, (x + Math.floor(x / 2)) % 12 < 2 ? 0x6890b0 : 0xb8c4cc, ox + x, oy + t + 1, 1, H - t - 3);   // alu et verre en biais
    rect(g, 0xe0e8ec, ox + x, oy + t + 1, 1, 1);                        // arête du toit
  }
  rect(g, 0x284060, ox + 2, oy + H - 14, W - 4, 11);                    // rez-de-chaussée vitré
  rect(g, 0x5888b0, ox + 3, oy + H - 13, W - 6, 1);
  rect(g, K, ox + 18, oy + H - 16, 12, 16);                             // porte (case locale 1,3)
  rect(g, 0x9cc0e0, ox + 19, oy + H - 15, 10, 15);
  rect(g, K, ox + 24, oy + H - 15, 1, 15);
  pixelText(g, 'THE DEEP', ox + 40, oy + H - 11, 1, 0xf0f0f0);
}

// Hull Minster (7x5, porte en (3,4)) : grande église gothique de brique et de pierre, tour carrée à
// pinacles au centre, toits d'ardoise, grande verrière, portail en arc.
function drawMinster(g, ox, oy) {
  const K = 0x3c3028;
  const BRICK = 0xb06048;
  const BRICK_D = 0x8c4834;
  const STONE = 0xe0d4b8;
  rect(g, 0x000000, ox + 2, oy + 78, 110, 2);
  // Nef et bas-côtés : toits d'ardoise
  rect(g, K, ox + 1, oy + 30, 110, 22);
  rect(g, 0x505868, ox + 2, oy + 31, 108, 20);
  for (let x = 4; x < 108; x += 6) rect(g, 0x404858, ox + x, oy + 31, 1, 20);
  // Façade de brique, contreforts de pierre
  rect(g, K, ox + 1, oy + 51, 110, 29);
  rect(g, BRICK, ox + 2, oy + 52, 108, 27);
  for (let y = 55; y < 79; y += 4) rect(g, BRICK_D, ox + 2, oy + y, 108, 1);
  for (const x of [2, 26, 82, 106]) rect(g, STONE, ox + x, oy + 52, 4, 27);
  for (const x of [10, 90]) {                                                    // fenêtres en ogive des bas-côtés
    rect(g, K, ox + x, oy + 56, 10, 16); rect(g, 0x5878a8, ox + x + 1, oy + 58, 8, 14);
    rect(g, 0x5878a8, ox + x + 3, oy + 57, 4, 1);
  }
  // Tour centrale
  rect(g, K, ox + 36, oy - 18, 40, 72);
  rect(g, STONE, ox + 37, oy - 17, 38, 70);
  for (let y = -12; y < 50; y += 5) rect(g, 0xc8bca0, ox + 37, oy + y, 38, 1);
  for (const x of [34, 48, 62, 74]) { rect(g, K, ox + x, oy - 28, 4, 12); rect(g, STONE, ox + x + 1, oy - 27, 2, 10); }   // pinacles
  rect(g, K, ox + 36, oy - 20, 40, 3);
  for (let x = 38; x < 74; x += 6) rect(g, STONE, ox + x, oy - 23, 3, 3);       // créneaux
  rect(g, K, ox + 46, oy - 8, 20, 22); rect(g, 0x303848, ox + 47, oy - 6, 18, 20);   // abat-son
  for (let x = 49; x < 64; x += 4) rect(g, 0x5c6478, ox + x, oy - 6, 1, 20);
  // Grande verrière et portail
  rect(g, K, ox + 44, oy + 20, 24, 28); rect(g, 0x6888b8, ox + 45, oy + 22, 22, 26);
  rect(g, 0x6888b8, ox + 49, oy + 21, 14, 1);
  for (const x of [51, 56, 61]) rect(g, 0x384868, ox + x, oy + 22, 1, 26);
  rect(g, 0x384868, ox + 45, oy + 34, 22, 1);
  rect(g, K, ox + 48, oy + 60, 16, 20); rect(g, 0x5c3c24, ox + 49, oy + 62, 14, 18);   // portail (case locale 3,4)
  rect(g, 0x5c3c24, ox + 51, oy + 61, 10, 1);
  rect(g, 0x3c2818, ox + 56, oy + 62, 1, 18);
}

// Terrain de football (emprise w x h cases, vu de dessus) : pelouse rayée, lignes blanches, rond central,
// surfaces de réparation et buts aux deux bouts (à gauche et à droite).
function drawFootballPitch(g, ox, oy, { w = 8, h = 6 } = {}) {
  const W = w * 16;
  const H = h * 16;
  rect(g, 0x2c6c2c, ox, oy, W, H);
  for (let x = 0; x < W; x += 16) rect(g, (x / 16) % 2 ? 0x48a040 : 0x58b048, ox + x, oy + 1, 16, H - 2);
  const L = 0xf0f0f0;
  const m = 5;
  rect(g, L, ox + m, oy + m, W - 2 * m, 1); rect(g, L, ox + m, oy + H - m - 1, W - 2 * m, 1);   // lignes de touche
  rect(g, L, ox + m, oy + m, 1, H - 2 * m); rect(g, L, ox + W - m - 1, oy + m, 1, H - 2 * m);   // lignes de but
  rect(g, L, ox + W / 2, oy + m, 1, H - 2 * m);                                                // ligne médiane
  for (let a = 0; a < 24; a++) {                                                               // rond central
    const t = (a / 24) * Math.PI * 2;
    rect(g, L, ox + W / 2 + Math.round(Math.cos(t) * 10), oy + H / 2 + Math.round(Math.sin(t) * 10), 1, 1);
  }
  for (const side of [0, 1]) {                                                                 // surfaces et buts
    const x0 = side ? ox + W - m - 1 - 16 : ox + m;
    rect(g, L, x0, oy + H / 2 - 16, 17, 1); rect(g, L, x0, oy + H / 2 + 15, 17, 1);
    rect(g, L, side ? x0 : x0 + 16, oy + H / 2 - 16, 1, 32);
    const gx = side ? ox + W - m : ox + m - 3;
    rect(g, 0x303038, gx, oy + H / 2 - 7, 3, 14);
    rect(g, 0xf8f8f8, gx + (side ? 0 : 2), oy + H / 2 - 6, 1, 12);
  }
}

// The Asylum, la boîte du syndicat étudiant de l'université de Hull (5x4, porte en (1,3)) : bâtiment sombre,
// enseigne violette lumineuse, affiches de concerts.
function drawAsylum(g, ox, oy) {
  const K = 0x201828;
  rect(g, 0x000000, ox + 2, oy + 62, 78, 2);
  rect(g, K, ox, oy + 6, 80, 58);                                      // toit plat
  rect(g, 0x4c4458, ox + 1, oy + 7, 78, 22);
  for (let x = 4; x < 78; x += 8) rect(g, 0x5c546c, ox + x, oy + 9, 4, 18);
  rect(g, K, ox, oy + 29, 80, 2);
  rect(g, 0x302838, ox + 1, oy + 31, 78, 32);                          // façade
  rect(g, 0x9030c0, ox + 30, oy + 34, 46, 11);                         // enseigne
  rect(g, 0xd070f0, ox + 31, oy + 35, 44, 1);
  pixelText(g, 'ASYLUM', ox + 36, oy + 37, 1, 0xf8e8ff);
  for (const [px, c] of [[34, 0xe8c040], [50, 0x40c0e0], [64, 0xe05060]]) {   // affiches
    rect(g, c, ox + px, oy + 49, 9, 12);
    rect(g, 0xf8f8f8, ox + px + 2, oy + 51, 5, 2);
  }
  rect(g, K, ox + 17, oy + 46, 14, 18);                                // porte (case locale 1,3)
  rect(g, 0x5c3c7c, ox + 18, oy + 47, 12, 17);
  rect(g, 0xc090e0, ox + 28, oy + 55, 1, 2);
}

// Monument à William Wilberforce (2x2) : colonne dorique sur un socle, statue au sommet.
function drawWilberforce(g, ox, oy) {
  const K = 0x4c4840;
  rect(g, 0x000000, ox + 6, oy + 30, 22, 2);
  rect(g, K, ox + 5, oy + 18, 22, 13);                                  // socle
  rect(g, 0xd8d0b8, ox + 6, oy + 19, 20, 11);
  rect(g, 0xb8b098, ox + 6, oy + 26, 20, 4);
  rect(g, K, ox + 11, oy - 30, 10, 49);                                 // colonne
  rect(g, 0xe0d8c0, ox + 12, oy - 29, 8, 47);
  rect(g, 0xc0b8a0, ox + 17, oy - 29, 2, 47);
  rect(g, K, ox + 9, oy - 33, 14, 4);                                   // chapiteau
  rect(g, 0xd8d0b8, ox + 10, oy - 32, 12, 2);
  rect(g, K, ox + 13, oy - 44, 6, 11);                                  // statue
  rect(g, 0x9ca098, ox + 14, oy - 43, 4, 9);
  rect(g, 0x9ca098, ox + 14, oy - 47, 4, 4);
  rect(g, K, ox + 13, oy - 48, 6, 1);
}

// Maison-tube vietnamienne (3x4, porte en (1,3)) : étroite et haute, façade colorée,
// balcons fleuris, volets verts, toit de tuiles. `variant` choisit la couleur de la façade.
const TUBE_COLORS = [0xf0c850, 0xf0a0b0, 0x98d8c0, 0x98b8e8, 0xf0a060];
function drawTubeHouse(g, ox, oy, { variant = 0 } = {}) {
  const wall = TUBE_COLORS[variant % TUBE_COLORS.length];
  // Toit-terrasse en tuiles avec pots de plantes
  rect(g, 0x6c2c18, ox, oy + 2, 48, 28);
  rect(g, 0xc05030, ox + 1, oy + 3, 46, 25);
  for (let y = 6; y < 28; y += 4) rect(g, 0x9c3c24, ox + 1, oy + y, 46, 1);
  rect(g, 0xd87050, ox + 1, oy + 3, 46, 1);
  rect(g, 0x3c8c3c, ox + 6, oy + 8, 6, 5);
  rect(g, 0x3c8c3c, ox + 36, oy + 16, 6, 5);
  rect(g, 0x6c2c18, ox, oy + 28, 48, 2);
  // Façade (étages)
  rect(g, 0x4c3c2c, ox + 1, oy + 30, 46, 34);
  rect(g, wall, ox + 2, oy + 30, 44, 32);
  for (const y of [33, 43]) {
    rect(g, 0x2c6c4c, ox + 8, oy + y, 4, 7);          // volets
    rect(g, 0x2c6c4c, ox + 36, oy + y, 4, 7);
    rect(g, 0x3c4858, ox + 12, oy + y, 24, 7);        // fenêtre
    rect(g, 0x88b0c8, ox + 13, oy + y + 1, 22, 5);
    rect(g, 0x4c3c2c, ox + 6, oy + y + 7, 36, 2);     // balcon
    for (let i = 8; i < 40; i += 5) rect(g, 0xe84868, ox + i, oy + y + 6, 2, 1);
    rect(g, 0x3c8c3c, ox + 8, oy + y + 6, 32, 1);
  }
  // Rez-de-chaussée : porte (case locale 1,3) et enseigne
  rect(g, 0xd83028, ox + 4, oy + 52, 40, 3);
  rect(g, 0x4c3c2c, ox + 17, oy + 55, 14, 9);
  rect(g, 0x8c5c2c, ox + 18, oy + 56, 12, 8);
  rect(g, 0x6c4420, ox + 24, oy + 56, 1, 8);
}

// Agence de voyage (5x4, porte en (1,3)) : façade blanche et turquoise, enseigne avec un avion,
// vitrine d'affiches de plages.
function drawTravelAgency(g, ox, oy) {
  rect(g, 0x3c3c40, ox, oy + 4, 80, 28);
  rect(g, 0xb0b0b8, ox + 1, oy + 5, 78, 25);
  rect(g, 0xc8c8d0, ox + 1, oy + 5, 78, 1);
  rect(g, 0x3c3c40, ox, oy + 30, 80, 2);
  rect(g, 0x707078, ox + 1, oy + 32, 78, 32);
  rect(g, 0xf4f4f0, ox + 2, oy + 32, 76, 30);
  // Enseigne turquoise avec un avion
  rect(g, 0x1c8c9c, ox + 30, oy + 34, 44, 9);
  rect(g, 0xf4f4f0, ox + 36, oy + 38, 12, 2);         // fuselage
  rect(g, 0xf4f4f0, ox + 40, oy + 35, 3, 8);          // ailes
  rect(g, 0xf4f4f0, ox + 36, oy + 36, 2, 4);          // dérive
  rect(g, 0xf8e088, ox + 54, oy + 37, 16, 1);
  rect(g, 0xf8e088, ox + 54, oy + 39, 12, 1);
  // Vitrine avec affiches
  rect(g, 0x3c3c40, ox + 32, oy + 46, 42, 14);
  rect(g, 0x9cd0e8, ox + 33, oy + 47, 40, 12);
  for (const [x, sky, sea] of [[36, 0x78c0f0, 0x2c8cc8], [49, 0xf8b060, 0x2c8cc8], [62, 0x78c0f0, 0x3cb0a0]]) {
    rect(g, sky, ox + x, oy + 48, 9, 5);
    rect(g, sea, ox + x, oy + 53, 9, 3);
    rect(g, 0xf0e0a0, ox + x, oy + 56, 9, 2);
  }
  // Porte vitrée (case locale 1,3)
  rect(g, 0x3c3c40, ox + 18, oy + 45, 12, 19);
  rect(g, 0x9cd0e8, ox + 19, oy + 46, 10, 18);
  rect(g, 0x3c3c40, ox + 24, oy + 46, 1, 18);
}

// Pagode (5x5, porte en (2,4)) : deux toits recourbés rouges à coins dorés, murs jaunes, piliers rouges.
function drawPagoda(g, ox, oy) {
  const roof = (y, x0, w) => {
    rect(g, 0x5c1810, ox + x0, oy + y, w, 12);
    rect(g, 0xa83020, ox + x0 + 1, oy + y + 1, w - 2, 10);
    for (let i = 3; i < 11; i += 3) rect(g, 0x8c2418, ox + x0 + 1, oy + y + i, w - 2, 1);
    rect(g, 0xc84830, ox + x0 + 1, oy + y + 1, w - 2, 1);
    // coins relevés dorés
    rect(g, 0xe8b830, ox + x0 - 3, oy + y - 2, 5, 3);
    rect(g, 0xe8b830, ox + x0 + w - 2, oy + y - 2, 5, 3);
    rect(g, 0xe8b830, ox + x0 + w / 2 - 3, oy + y - 1, 6, 2);   // faîte
  };
  // Étage supérieur
  rect(g, 0xf0c850, ox + 24, oy + 12, 32, 14);
  rect(g, 0xa82018, ox + 26, oy + 14, 3, 12);
  rect(g, 0xa82018, ox + 51, oy + 14, 3, 12);
  roof(3, 18, 44);
  // Étage principal
  rect(g, 0x6c4c18, ox + 4, oy + 36, 72, 44);
  rect(g, 0xf0c850, ox + 5, oy + 37, 70, 42);
  for (const x of [8, 22, 54, 68]) rect(g, 0xa82018, ox + x, oy + 40, 4, 38);
  for (const x of [13, 59]) {                           // fenêtres rondes
    rect(g, 0x5c1810, ox + x, oy + 48, 8, 8);
    rect(g, 0xe8b830, ox + x + 1, oy + 49, 6, 6);
    rect(g, 0x5c1810, ox + x + 3, oy + 49, 1, 6);
    rect(g, 0x5c1810, ox + x + 1, oy + 51, 6, 1);
  }
  roof(26, 0, 80);
  // Porte (case locale 2,4) + plaque dorée
  rect(g, 0xe8b830, ox + 30, oy + 54, 20, 5);
  rect(g, 0x5c1810, ox + 32, oy + 60, 16, 20);
  rect(g, 0xc83028, ox + 33, oy + 61, 14, 19);
  rect(g, 0x8c2418, ox + 40, oy + 61, 1, 19);
  rect(g, 0xe8b830, ox + 38, oy + 69, 1, 2);
  rect(g, 0xe8b830, ox + 42, oy + 69, 1, 2);
}

// Tour de la Tortue (2x2, sur le lac) : petite tour à trois niveaux, toit recourbé.
function drawTurtleTower(g, ox, oy) {
  rect(g, 0x5c5c4c, ox + 2, oy + 26, 28, 5);            // socle sur l'eau
  rect(g, 0x8c8c78, ox + 3, oy + 26, 26, 3);
  rect(g, 0x6c5c3c, ox + 6, oy + 10, 20, 17);
  rect(g, 0xe0d0a8, ox + 7, oy + 11, 18, 15);
  rect(g, 0xb8a880, ox + 7, oy + 18, 18, 1);
  rect(g, 0x5c4c2c, ox + 14, oy + 20, 4, 6);            // porte en arc
  rect(g, 0x5c4c2c, ox + 10, oy + 13, 3, 3);
  rect(g, 0x5c4c2c, ox + 19, oy + 13, 3, 3);
  rect(g, 0x6c5c3c, ox + 10, oy + 3, 12, 8);
  rect(g, 0xe0d0a8, ox + 11, oy + 4, 10, 7);
  rect(g, 0x5c1810, ox + 8, oy + 1, 16, 3);             // toit
  rect(g, 0xa83020, ox + 9, oy + 1, 14, 2);
  rect(g, 0xe8b830, ox + 6, oy, 3, 2);
  rect(g, 0xe8b830, ox + 23, oy, 3, 2);
  rect(g, 0x4c7c3c, ox + 4, oy + 22, 3, 4);             // mousse, végétation
  rect(g, 0x4c7c3c, ox + 25, oy + 20, 3, 6);
}

// Maison de canal d'Amsterdam (3x4, porte en (1,3)) : étroite, pignon à gradins,
// grandes fenêtres à cadre blanc, poulie sous le pignon. `variant` change la brique.
const CANAL_COLORS = [
  [0x7c3c24, 0x5c2814], [0x3c2c24, 0x241810], [0xa84c30, 0x7c3420], [0x2c3c34, 0x1c2820], [0xe8e0d0, 0xb8b0a0],
];
function drawCanalHouse(g, ox, oy, { variant = 0 } = {}) {
  const [wall, dark] = CANAL_COLORS[variant % CANAL_COLORS.length];
  const trim = 0xf4f4f0;
  // Pignon à gradins (vu de face, occupe le haut)
  rect(g, dark, ox + 4, oy + 4, 40, 60);
  rect(g, wall, ox + 5, oy + 5, 38, 58);
  for (const [x, y, w] of [[4, 4, 8], [36, 4, 8], [10, 0, 8], [30, 0, 8], [16, -4, 16]]) {
    rect(g, dark, ox + x, oy + y, w, 6);
    rect(g, trim, ox + x, oy + y, w, 1);
  }
  rect(g, wall, ox + 11, oy + 1, 6, 4);
  rect(g, wall, ox + 31, oy + 1, 6, 4);
  rect(g, wall, ox + 17, oy - 3, 14, 4);
  rect(g, 0x303030, ox + 22, oy + 2, 4, 3);            // poutre à poulie
  rect(g, trim, ox + 20, oy + 6, 8, 5);                // fenêtre du pignon
  rect(g, 0x5878a8, ox + 21, oy + 7, 6, 3);
  // Étages : fenêtres à guillotine blanches
  for (const y of [14, 28, 42]) {
    for (const x of [9, 21, 33]) {
      if (y === 42 && x === 21) continue;              // place de la porte
      rect(g, trim, ox + x, oy + y, 8, 11);
      rect(g, 0x5878a8, ox + x + 1, oy + y + 1, 6, 9);
      rect(g, trim, ox + x + 1, oy + y + 5, 6, 1);
      rect(g, 0x9cb8d8, ox + x + 1, oy + y + 1, 2, 1);
    }
  }
  // Porte d'entrée en haut d'un petit perron (case locale 1,3)
  rect(g, trim, ox + 19, oy + 46, 10, 17);
  rect(g, 0x1c3c2c, ox + 20, oy + 48, 8, 15);
  rect(g, 0xf8e088, ox + 20, oy + 47, 8, 1);
  rect(g, 0xd8b050, ox + 26, oy + 55, 1, 2);
  rect(g, 0x7c7c84, ox + 17, oy + 62, 14, 2);
}

// Bureau CORNING (9x4, porte en (4,3)) : grand immeuble de bureaux vitré, enseigne CORNING.
function drawCorning(g, ox, oy) {
  const w = 144;
  rect(g, 0x283038, ox, oy + 2, w, 30);
  rect(g, 0x9ca4ac, ox + 1, oy + 3, w - 2, 27);
  for (let x = 8; x < w - 8; x += 16) rect(g, 0x7c848c, ox + x, oy + 6, 10, 20);   // équipements
  rect(g, 0xb8c0c8, ox + 1, oy + 3, w - 2, 1);
  rect(g, 0x283038, ox, oy + 30, w, 2);
  // Façade de verre sombre, bandeaux horizontaux
  rect(g, 0x1c2430, ox + 1, oy + 32, w - 2, 32);
  rect(g, 0x3c5c80, ox + 2, oy + 33, w - 4, 29);
  for (let y = 38; y < 62; y += 6) rect(g, 0x1c2430, ox + 2, oy + y, w - 4, 1);
  for (let x = 2; x < w - 2; x += 12) rect(g, 0x1c2430, ox + x, oy + 33, 1, 29);
  for (let x = 6; x < w - 8; x += 24) rect(g, 0x7ca0c8, ox + x, oy + 34, 4, 1);
  // Enseigne CORNING (lettres blanches sur bandeau bleu)
  rect(g, 0x0c4c9c, ox + 38, oy + 34, 68, 11);
  pixelText(g, 'CORNING', ox + 43, oy + 35, 2, 0xf8f8f8);
  // Entrée vitrée (case locale 4,3)
  rect(g, 0x1c2430, ox + 62, oy + 48, 20, 16);
  rect(g, 0xb8d8f0, ox + 63, oy + 49, 18, 15);
  rect(g, 0x1c2430, ox + 72, oy + 49, 1, 15);
  rect(g, 0x9ca4ac, ox + 58, oy + 61, 28, 3);
}

// Coffee shop (5x4, porte en (1,3)) : façade vert sombre, enseigne « COFFEESHOP », vitrine.
function drawCoffeeShop(g, ox, oy) {
  // Toit
  rect(g, 0x2c3038, ox, oy + 2, 80, 30);
  rect(g, 0x505868, ox + 1, oy + 3, 78, 27);
  for (let y = 7; y < 30; y += 4) rect(g, 0x3c4450, ox + 1, oy + y, 78, 1);
  rect(g, 0x1c1c20, ox, oy + 30, 80, 2);
  // Façade
  rect(g, 0x0c2418, ox + 1, oy + 32, 78, 32);
  rect(g, 0x1c5c34, ox + 2, oy + 33, 76, 29);
  rect(g, 0x0c2418, ox + 2, oy + 33, 76, 9);
  pixelText(g, 'COFFEESHOP', ox + 34, oy + 35, 1, 0xf8d830);
  rect(g, 0xd83028, ox + 2, oy + 42, 76, 1);
  rect(g, 0xf8d830, ox + 2, oy + 43, 76, 1);
  rect(g, 0x2c9c4c, ox + 2, oy + 44, 76, 1);
  // Vitrine aux lumières chaudes
  rect(g, 0x0c2418, ox + 34, oy + 47, 40, 12);
  rect(g, 0xe8a850, ox + 35, oy + 48, 38, 10);
  rect(g, 0x0c2418, ox + 54, oy + 48, 1, 10);
  for (const x of [38, 46, 60, 66]) rect(g, 0x2c9c4c, ox + x, oy + 54, 3, 4);   // plantes
  // Porte (case locale 1,3)
  rect(g, 0x0c2418, ox + 18, oy + 45, 12, 19);
  rect(g, 0x5c3418, ox + 19, oy + 46, 10, 18);
  rect(g, 0xe8a850, ox + 21, oy + 48, 6, 5);
  rect(g, 0xd8b050, ox + 27, oy + 56, 1, 2);
}

// Moulin à vent hollandais (3x4, sans porte) : tour en bois, ailes en croix.
function drawWindmill(g, ox, oy) {
  // Tour
  rect(g, 0x3c2c1c, ox + 12, oy + 20, 24, 44);
  rect(g, 0x6c5c4c, ox + 13, oy + 21, 22, 42);
  for (let y = 24; y < 62; y += 4) rect(g, 0x5c4c3c, ox + 13, oy + y, 22, 1);
  rect(g, 0x2c7c3c, ox + 20, oy + 50, 8, 13);            // porte verte
  rect(g, 0xf4f4f0, ox + 21, oy + 36, 6, 6);             // fenêtre
  rect(g, 0x5878a8, ox + 22, oy + 37, 4, 4);
  // Chapeau
  rect(g, 0x2c2c30, ox + 10, oy + 14, 28, 8);
  rect(g, 0x4c4c54, ox + 12, oy + 12, 24, 4);
  // Ailes en croix (diagonales) autour du moyeu
  const cx = ox + 24;
  const cy = oy + 16;
  for (let i = 4; i < 22; i++) {
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      rect(g, 0x3c2c1c, cx + dx * i, cy + dy * i, 2, 2);
      if (i > 7) rect(g, 0xf4f0e0, cx + dx * i + (dx > 0 ? 2 : -3), cy + dy * i, 3, 2);
    }
  }
  rect(g, 0x202020, cx - 2, cy - 2, 5, 5);
}

// Péniche (3x1, sur le canal) : coque sombre, cabine, pots de fleurs.
function drawHouseboat(g, ox, oy) {
  rect(g, 0x1c2830, ox + 1, oy + 2, 46, 13);
  rect(g, 0x2c4c3c, ox + 2, oy + 3, 44, 11);
  rect(g, 0x8c5c2c, ox + 8, oy + 4, 30, 8);
  rect(g, 0xa87040, ox + 8, oy + 4, 30, 2);
  for (const x of [11, 19, 27]) rect(g, 0x9cc0d8, ox + x, oy + 7, 5, 3);
  rect(g, 0xe83848, ox + 40, oy + 5, 3, 3);
  rect(g, 0xf8c830, ox + 4, oy + 6, 3, 3);
}

// Haveli (3x4, porte en (1,3)) : maison indienne colorée, fenêtres en arc,
// balcon à jharokha, toit-terrasse avec parapet. `variant` choisit la couleur.
const HAVELI_COLORS = [0xe888a8, 0xe8b048, 0x6ca8d8, 0x48b8a8, 0xd86848];
function drawHaveli(g, ox, oy, { variant = 0 } = {}) {
  const wall = HAVELI_COLORS[variant % HAVELI_COLORS.length];
  const trim = 0xf8f0d8;
  // Toit-terrasse
  rect(g, 0x8c6c4c, ox, oy + 2, 48, 28);
  rect(g, 0xd8b890, ox + 1, oy + 3, 46, 25);
  for (let x = 2; x < 46; x += 6) rect(g, trim, ox + x, oy + 3, 4, 3);   // parapet crénelé
  rect(g, 0xc8a880, ox + 1, oy + 10, 46, 1);
  rect(g, 0x8c6c4c, ox, oy + 28, 48, 2);
  // Façade
  rect(g, 0x5c3c2c, ox + 1, oy + 30, 46, 34);
  rect(g, wall, ox + 2, oy + 30, 44, 32);
  rect(g, trim, ox + 2, oy + 30, 44, 2);
  // Jharokha (balcon en encorbellement) au centre de l'étage
  rect(g, trim, ox + 16, oy + 33, 16, 12);
  rect(g, 0x5c3c2c, ox + 18, oy + 35, 12, 8);
  rect(g, 0x5c3c2c, ox + 20, oy + 33, 8, 2);
  rect(g, trim, ox + 23, oy + 35, 2, 8);
  // Fenêtres en arc
  for (const x of [5, 36]) {
    rect(g, trim, ox + x, oy + 34, 7, 10);
    rect(g, 0x3c4c6c, ox + x + 1, oy + 36, 5, 7);
    rect(g, 0x3c4c6c, ox + x + 2, oy + 35, 3, 1);
  }
  // Porte en arc (case locale 1,3)
  rect(g, trim, ox + 17, oy + 48, 14, 16);
  rect(g, 0x7c3c1c, ox + 19, oy + 51, 10, 13);
  rect(g, 0x7c3c1c, ox + 21, oy + 49, 6, 2);
  rect(g, 0xe8b830, ox + 23, oy + 57, 2, 1);
}

// Palais moghol (7x4, porte en (3,3)) : marbre blanc, grand dôme en bulbe, minarets, arcades.
function drawMughalPalace(g, ox, oy) {
  const marble = 0xf4f0e8;
  const shade = 0xd8d0c0;
  // Minarets
  for (const x of [0, 100]) {
    rect(g, 0x9c9484, ox + x, oy + 6, 12, 58);
    rect(g, marble, ox + x + 1, oy + 7, 10, 56);
    for (let y = 18; y < 60; y += 14) rect(g, shade, ox + x + 1, oy + y, 10, 2);
    rect(g, marble, ox + x + 2, oy + 1, 8, 6);
    rect(g, 0xe8b830, ox + x + 5, oy - 2, 2, 3);
  }
  // Corps principal
  rect(g, 0x9c9484, ox + 12, oy + 28, 88, 36);
  rect(g, marble, ox + 13, oy + 29, 86, 34);
  rect(g, shade, ox + 13, oy + 29, 86, 2);
  // Grand dôme en bulbe
  for (let i = 0; i < 20; i++) {
    const w = Math.round(38 * Math.sin((Math.PI * (i + 2)) / 24));
    rect(g, marble, ox + 56 - Math.floor(w / 2), oy + 6 + i, w, 1);
  }
  rect(g, shade, ox + 38, oy + 24, 36, 4);
  rect(g, 0xe8b830, ox + 55, oy, 2, 7);                  // flèche dorée
  // Petits dômes (chhatris)
  for (const x of [24, 80]) {
    rect(g, marble, ox + x, oy + 18, 10, 10);
    rect(g, marble, ox + x + 2, oy + 15, 6, 3);
    rect(g, 0xe8b830, ox + x + 4, oy + 12, 2, 3);
  }
  // Arcades
  for (const x of [18, 32, 72, 86]) {
    rect(g, 0x5c5c6c, ox + x, oy + 40, 8, 16);
    rect(g, 0x5c5c6c, ox + x + 2, oy + 38, 4, 2);
    rect(g, 0x5ca8a0, ox + x + 1, oy + 42, 6, 1);       // incrustations
  }
  // Grande porte en arc (case locale 3,3)
  rect(g, 0x9c9484, ox + 46, oy + 40, 20, 24);
  rect(g, 0x5c5c6c, ox + 49, oy + 45, 14, 19);
  rect(g, 0x5c5c6c, ox + 52, oy + 42, 8, 3);
  rect(g, 0x5ca8a0, ox + 48, oy + 41, 16, 1);
}

// India Gate (5x5, sans porte) : grand arc de grès beige.
function drawIndiaGate(g, ox, oy) {
  const stone = 0xd8b890;
  const shade = 0xb09068;
  rect(g, 0x7c6448, ox + 6, oy + 4, 68, 76);
  rect(g, stone, ox + 7, oy + 5, 66, 74);
  for (let y = 12; y < 78; y += 7) rect(g, shade, ox + 7, oy + y, 66, 1);
  // Couronnement
  rect(g, 0x7c6448, ox + 2, oy + 4, 76, 8);
  rect(g, stone, ox + 3, oy + 5, 74, 6);
  rect(g, 0x7c6448, ox + 26, oy, 28, 5);
  rect(g, stone, ox + 27, oy + 1, 26, 3);
  rect(g, 0x9c8058, ox + 32, oy + 14, 16, 4);            // inscription
  // Grand arc
  rect(g, 0x3c3428, ox + 26, oy + 34, 28, 46);
  for (let i = 0; i < 10; i++) {
    const w = Math.round(28 * Math.sin((Math.PI * (i + 1)) / 22));
    rect(g, 0x3c3428, ox + 40 - Math.floor(w / 2), oy + 24 + i, w, 1);
  }
  rect(g, 0x6c8c5c, ox + 28, oy + 74, 24, 6);            // pelouse vue à travers l'arc
  rect(g, 0xe86818, ox + 38, oy + 70, 4, 4);             // flamme éternelle
  rect(g, 0xf8d860, ox + 39, oy + 71, 2, 2);
}

// Grande statue de Bouddha assis (3x4, sans porte) : bronze doré sur un socle en lotus.
function drawBuddha(g, ox, oy) {
  const gold = 0xd8a830;
  const dark = 0x8c6418;
  // Socle en lotus
  rect(g, 0x9c9484, ox + 2, oy + 54, 44, 10);
  rect(g, 0xc8c0b0, ox + 3, oy + 55, 42, 8);
  for (let x = 4; x < 44; x += 6) rect(g, 0xe898b0, ox + x, oy + 50, 5, 5);
  // Corps assis (jambes croisées)
  rect(g, dark, ox + 6, oy + 40, 36, 12);
  rect(g, gold, ox + 7, oy + 41, 34, 10);
  rect(g, dark, ox + 12, oy + 20, 24, 22);               // torse
  rect(g, gold, ox + 13, oy + 21, 22, 20);
  rect(g, 0xe8c050, ox + 15, oy + 22, 6, 16);
  rect(g, dark, ox + 20, oy + 40, 8, 3);                 // mains jointes
  rect(g, 0xe8c050, ox + 21, oy + 40, 6, 2);
  // Tête et chignon
  rect(g, dark, ox + 16, oy + 6, 16, 15);
  rect(g, gold, ox + 17, oy + 7, 14, 13);
  rect(g, dark, ox + 20, oy + 2, 8, 5);
  rect(g, 0x5c4010, ox + 19, oy + 12, 3, 1);             // yeux fermés
  rect(g, 0x5c4010, ox + 26, oy + 12, 3, 1);
  rect(g, 0xc83028, ox + 23, oy + 9, 2, 2);              // point sur le front
  rect(g, dark, ox + 15, oy + 10, 2, 7);                 // oreilles allongées
  rect(g, dark, ox + 31, oy + 10, 2, 7);
}

// Université de Delhi (9x4, porte en (4,3)) : grès rouge, arcades, petits dômes blancs.
function drawDelhiUniversity(g, ox, oy) {
  const w = 144;
  const red = 0xb85c3c;
  const dark = 0x7c3420;
  rect(g, dark, ox, oy + 8, w, 24);
  rect(g, 0xd07050, ox + 1, oy + 9, w - 2, 21);
  for (let x = 4; x < w; x += 10) rect(g, 0xf0e0c8, ox + x, oy + 9, 5, 3);   // parapet
  for (const x of [16, 64, 112]) {                       // chhatris blancs
    rect(g, 0xf4f0e8, ox + x, oy + 6, 16, 10);
    rect(g, 0xf4f0e8, ox + x + 3, oy + 2, 10, 4);
    rect(g, 0xe8b830, ox + x + 7, oy - 1, 2, 3);
    rect(g, dark, ox + x + 2, oy + 12, 3, 6);
    rect(g, dark, ox + x + 11, oy + 12, 3, 6);
  }
  rect(g, dark, ox, oy + 30, w, 2);
  // Façade en grès rouge avec arcades
  rect(g, dark, ox + 1, oy + 32, w - 2, 32);
  rect(g, red, ox + 2, oy + 33, w - 4, 29);
  rect(g, 0xf0e0c8, ox + 2, oy + 33, w - 4, 2);
  for (let x = 8; x < w - 8; x += 16) {
    if (x > 56 && x < 84) continue;
    rect(g, 0xf0e0c8, ox + x, oy + 38, 10, 16);
    rect(g, 0x5c2c18, ox + x + 1, oy + 41, 8, 13);
    rect(g, 0x5c2c18, ox + x + 3, oy + 39, 4, 2);
  }
  rect(g, 0xf0e0c8, ox + 2, oy + 58, w - 4, 2);
  // Grande porte en arc (case locale 4,3)
  rect(g, 0xf0e0c8, ox + 60, oy + 40, 24, 24);
  rect(g, 0x5c2c18, ox + 64, oy + 46, 16, 18);
  rect(g, 0x5c2c18, ox + 67, oy + 43, 10, 3);
  rect(g, 0xe8b830, ox + 71, oy + 55, 2, 2);
}

// Petite hutte du désert (3x3, porte en (1,2)) : murs de terre, toit de chaume rond.
function drawHut(g, ox, oy) {
  // Toit de chaume
  rect(g, 0x6c5020, ox + 2, oy + 4, 44, 20);
  rect(g, 0xc8a050, ox + 4, oy + 2, 40, 20);
  rect(g, 0xc8a050, ox + 8, oy, 32, 4);
  for (let x = 6; x < 42; x += 4) rect(g, 0xa07c34, ox + x, oy + 4, 1, 16);
  rect(g, 0xe0c070, ox + 10, oy + 1, 20, 2);
  // Murs de terre
  rect(g, 0x7c5030, ox + 4, oy + 22, 40, 26);
  rect(g, 0xc88858, ox + 5, oy + 22, 38, 25);
  rect(g, 0xe8e0d0, ox + 5, oy + 30, 38, 2);              // frise blanche
  for (let x = 8; x < 40; x += 6) rect(g, 0xd83028, ox + x, oy + 30, 2, 2);
  // Porte (case locale 1,2)
  rect(g, 0x3c2414, ox + 18, oy + 34, 12, 14);
  rect(g, 0x3c2414, ox + 20, oy + 32, 8, 2);
}

// Tente rajasthanie (4x3, porte en (1,2)) : toile rayée rouge et jaune, pompons.
function drawTent(g, ox, oy) {
  // Toit en pente
  for (let i = 0; i < 16; i++) {
    const w = 20 + i * 3;
    const x0 = ox + 32 - Math.floor(w / 2);
    rect(g, 0x7c1c10, x0, oy + 2 + i, w, 1);
    for (let x = 0; x < w - 2; x += 6) rect(g, 0xd83028, x0 + 1 + x, oy + 2 + i, 3, 1);
    for (let x = 3; x < w - 2; x += 6) rect(g, 0xf0c830, x0 + 1 + x, oy + 2 + i, 3, 1);
  }
  rect(g, 0xf0c830, ox + 30, oy, 4, 3);                   // mât
  // Paroi
  rect(g, 0x7c1c10, ox + 4, oy + 18, 56, 30);
  for (let x = 0; x < 54; x += 6) {
    rect(g, 0xd83028, ox + 5 + x, oy + 18, 3, 29);
    rect(g, 0xf0c830, ox + 8 + x, oy + 18, 3, 29);
  }
  for (let x = 6; x < 60; x += 8) rect(g, 0xf08020, ox + x, oy + 18, 3, 3);   // pompons
  // Entrée (case locale 1,2) : pan relevé
  rect(g, 0x3c1008, ox + 18, oy + 30, 12, 18);
  rect(g, 0xf0c830, ox + 17, oy + 28, 14, 2);
}

// Avion de ligne sur le tarmac (6x3), vu de dessus, nez vers la droite.
function drawPlane(g, ox, oy) {
  const white = 0xf4f6f8;
  const grey = 0x9ca4ac;
  rect(g, 0x000000, ox + 10, oy + 26, 80, 3);             // ombre
  rect(g, grey, ox + 6, oy + 18, 84, 12);                  // fuselage
  rect(g, white, ox + 8, oy + 19, 80, 10);
  rect(g, grey, ox + 88, oy + 20, 6, 8);                   // nez
  rect(g, 0x283c6c, ox + 86, oy + 21, 3, 3);              // cockpit
  for (let x = 20; x < 84; x += 5) rect(g, 0x5c7ca8, ox + x, oy + 21, 2, 2);   // hublots
  rect(g, 0x2c5cb0, ox + 8, oy + 26, 80, 2);              // bande bleue
  // Ailes
  for (let i = 0; i < 18; i++) {
    rect(g, grey, ox + 44 - i, oy + 18 - i, 16, 1);
    rect(g, grey, ox + 44 - i, oy + 29 + i, 16, 1);
  }
  // Empennage
  for (let i = 0; i < 10; i++) {
    rect(g, grey, ox + 6 - Math.floor(i / 2), oy + 18 - i, 8, 1);
    rect(g, grey, ox + 6 - Math.floor(i / 2), oy + 29 + i, 8, 1);
  }
  rect(g, 0x2c5cb0, ox + 2, oy + 8, 6, 5);
}

// Stade de Bordeaux (12x4, porte en (6,3)) : anneau de tribunes vu de haut, pelouse, projecteurs.
function drawStadium(g, ox, oy) {
  const w = 192;
  const h = 64;
  // Enceinte en béton
  rect(g, 0x5c6068, ox, oy, w, h);
  rect(g, 0xb8bcc4, ox + 2, oy + 2, w - 4, h - 4);
  // Tribunes (bleu marine et blanc, couleurs de Bordeaux)
  rect(g, 0x1c2c5c, ox + 8, oy + 6, w - 16, h - 16);
  for (let x = 12; x < w - 12; x += 8) {
    rect(g, 0x2c4c8c, ox + x, oy + 8, 4, 3);
    rect(g, 0x2c4c8c, ox + x, oy + h - 17, 4, 3);
  }
  rect(g, 0xf4f4f4, ox + 8, oy + 12, w - 16, 1);
  rect(g, 0xf4f4f4, ox + 8, oy + h - 14, w - 16, 1);
  // Pelouse et lignes
  rect(g, 0x3c9c4c, ox + 22, oy + 15, w - 44, h - 32);
  for (let x = 22; x < w - 22; x += 16) rect(g, 0x48ac58, ox + x, oy + 15, 8, h - 32);
  rect(g, 0xf4f4f4, ox + w / 2, oy + 15, 1, h - 32);
  rect(g, 0xf4f4f4, ox + w / 2 - 6, oy + 26, 13, 1);
  rect(g, 0xf4f4f4, ox + w / 2 - 6, oy + 36, 13, 1);
  rect(g, 0xf4f4f4, ox + w / 2 - 6, oy + 26, 1, 11);
  rect(g, 0xf4f4f4, ox + w / 2 + 6, oy + 26, 1, 11);
  // Projecteurs aux quatre coins
  for (const [x, y] of [[2, 2], [w - 10, 2], [2, h - 12], [w - 10, h - 12]]) {
    rect(g, 0x303034, ox + x, oy + y, 8, 8);
    rect(g, 0xf8f0b0, ox + x + 1, oy + y + 1, 6, 3);
  }
  // Grande entrée (case locale 6,3) avec banderole
  rect(g, 0x3c4048, ox + 90, oy + 46, 28, 18);
  rect(g, 0x9cc0e0, ox + 98, oy + 50, 12, 14);
  rect(g, 0x3c4048, ox + 104, oy + 50, 1, 14);
  rect(g, 0xc82838, ox + 70, oy + 42, 52, 4);
  rect(g, 0xf4f4f4, ox + 70, oy + 42, 52, 1);
}

// Voiture en panne en travers de la rue (obstacle 2x2) : capot ouvert, warnings, fumée.
function drawBrokenCar(g, ox, oy) {
  rect(g, 0x000000, ox + 3, oy + 26, 28, 3);              // ombre
  rect(g, 0x5c1818, ox + 4, oy + 4, 24, 24);              // carrosserie vue de dessus
  rect(g, 0xa83030, ox + 5, oy + 5, 22, 22);
  rect(g, 0x9cc0d8, ox + 7, oy + 9, 18, 5);                // pare-brise
  rect(g, 0x303038, ox + 8, oy + 15, 16, 7);               // toit
  rect(g, 0xc8c8d0, ox + 6, oy + 1, 20, 4);                // capot ouvert
  rect(g, 0x202020, ox + 2, oy + 6, 3, 6);                 // roues
  rect(g, 0x202020, ox + 27, oy + 6, 3, 6);
  rect(g, 0x202020, ox + 2, oy + 20, 3, 6);
  rect(g, 0x202020, ox + 27, oy + 20, 3, 6);
  rect(g, 0xf8a020, ox + 5, oy + 25, 3, 2);                // warnings
  rect(g, 0xf8a020, ox + 24, oy + 25, 3, 2);
  rect(g, 0x9c9ca4, ox + 12, oy - 4, 6, 4);                // fumée
  rect(g, 0xc8c8d0, ox + 16, oy - 8, 5, 4);
  rect(g, 0xe0e0e8, ox + 13, oy - 11, 4, 3);
}

// Voiture familiale chargée pour le départ (obstacle 2x2, vue de dessus, capot vers le nord) : break bleu,
// valises et cartons sanglés sur la galerie du toit.
function drawFamilyCar(g, ox, oy) {
  const K = 0x283048;
  rect(g, 0x000000, ox + 5, oy + 29, 24, 2);               // ombre
  rect(g, K, ox + 6, oy + 1, 20, 29);                      // contour
  rect(g, 0x3868c0, ox + 7, oy + 2, 18, 27);               // carrosserie
  rect(g, 0x5888e0, ox + 8, oy + 3, 16, 5);                // capot (reflet)
  rect(g, 0xf8e8a0, ox + 8, oy + 2, 3, 1);                 // phares
  rect(g, 0xf8e8a0, ox + 21, oy + 2, 3, 1);
  rect(g, K, ox + 8, oy + 8, 16, 4);                       // pare-brise
  rect(g, 0x9cc8e8, ox + 9, oy + 9, 14, 2);
  rect(g, 0x2c4c98, ox + 8, oy + 12, 16, 14);              // toit
  rect(g, 0x303038, ox + 9, oy + 13, 1, 12);               // galerie
  rect(g, 0x303038, ox + 22, oy + 13, 1, 12);
  rect(g, K, ox + 10, oy + 13, 7, 6); rect(g, 0xc87838, ox + 11, oy + 14, 5, 4);   // valise
  rect(g, K, ox + 16, oy + 15, 6, 7); rect(g, 0xd8b070, ox + 17, oy + 16, 4, 5);   // carton
  rect(g, K, ox + 10, oy + 19, 6, 6); rect(g, 0x60a060, ox + 11, oy + 20, 4, 4);   // sac
  rect(g, 0xe8e0d0, ox + 9, oy + 18, 14, 1);               // sangle
  rect(g, K, ox + 8, oy + 26, 16, 3);                      // lunette arrière
  rect(g, 0x9cc8e8, ox + 9, oy + 27, 14, 1);
  rect(g, 0xd83030, ox + 7, oy + 28, 3, 1);                // feux
  rect(g, 0xd83030, ox + 22, oy + 28, 3, 1);
  for (const [wx, wy] of [[4, 4], [26, 4], [4, 21], [26, 21]]) rect(g, 0x202020, ox + wx, oy + wy, 2, 6);   // roues
}

// Café parisien (5x4, porte en (1,3)) : façade bois bordeaux, store rayé rouge, enseigne « CAFE ».
function drawCafe(g, ox, oy) {
  drawImmeuble(g, ox, oy, { variant: 2 });
  rect(g, 0x5c1418, ox + 1, oy + 46, 78, 18);              // devanture en bois
  rect(g, 0x8c2028, ox + 2, oy + 47, 76, 16);
  for (let x = 0; x < 76; x += 6) rect(g, x % 12 ? 0xf4f4f4 : 0xc82838, ox + 2 + x, oy + 44, 6, 4);   // store
  rect(g, 0xe8c888, ox + 36, oy + 51, 36, 10);             // vitrine éclairée
  rect(g, 0x5c1418, ox + 54, oy + 51, 1, 10);
  pixelText(g, 'CAFE', ox + 42, oy + 38, 1, 0x5c1418);
  rect(g, 0x5c1418, ox + 18, oy + 49, 12, 15);             // porte (case locale 1,3)
  rect(g, 0xe8c888, ox + 20, oy + 51, 8, 6);
}

// Bistrot (5x4, porte en (1,3)) : devanture vert sombre, enseigne dorée « BISTRO ».
function drawBistro(g, ox, oy) {
  drawImmeuble(g, ox, oy, { variant: 0 });
  rect(g, 0x0c2c1c, ox + 1, oy + 44, 78, 20);
  rect(g, 0x1c4c30, ox + 2, oy + 45, 76, 18);
  rect(g, 0x0c2c1c, ox + 30, oy + 45, 46, 8);
  pixelText(g, 'BISTRO', ox + 40, oy + 46, 1, 0xe8c040);
  rect(g, 0xf0c060, ox + 34, oy + 54, 40, 8);              // vitrine chaleureuse
  for (const x of [38, 50, 62]) rect(g, 0xc83030, ox + x, oy + 58, 8, 2);   // nappes à carreaux
  rect(g, 0x0c2c1c, ox + 18, oy + 47, 12, 17);             // porte (case locale 1,3)
  rect(g, 0xf0c060, ox + 20, oy + 49, 8, 6);
  rect(g, 0xe8c040, ox + 27, oy + 57, 1, 2);
}

// Tour Eiffel (5x6, sans porte) : treillis de fer brun, trois étages, pointe dépassant vers le haut.
function drawEiffelTower(g, ox, oy) {
  const iron = 0x6c5440;
  const light = 0x9c7c5c;
  const cx = ox + 40;
  const top = oy - 40;
  const base = oy + 96;
  // Deux montants courbes qui se rejoignent au sommet
  for (let y = top + 8; y < base; y++) {
    const t = (y - top) / (base - top);
    const half = Math.round(4 + 34 * t * t);
    rect(g, iron, cx - half, y, 3, 1);
    rect(g, iron, cx + half - 3, y, 3, 1);
    if (y % 6 === 0 && half > 6) {
      for (let x = cx - half + 3; x < cx + half - 3; x += 4) rect(g, light, x, y, 2, 1);   // treillis
    }
  }
  // Arche du rez-de-chaussée
  for (let i = 0; i < 14; i++) {
    const w = Math.round(44 * Math.sqrt(1 - (i / 14) ** 2));
    rect(g, iron, cx - Math.floor(w / 2), base - 14 + i, 2, 1);
    rect(g, iron, cx + Math.floor(w / 2) - 2, base - 14 + i, 2, 1);
  }
  // Plateformes (1er, 2e étage)
  rect(g, iron, cx - 26, oy + 58, 52, 4);
  rect(g, light, cx - 26, oy + 58, 52, 1);
  rect(g, iron, cx - 14, oy + 26, 28, 3);
  rect(g, light, cx - 14, oy + 26, 28, 1);
  // Sommet et antenne
  rect(g, iron, cx - 3, top + 4, 6, 6);
  rect(g, iron, cx - 1, top - 6, 2, 10);
  rect(g, 0xf8f0b0, cx - 1, top - 8, 2, 2);
}

// Arc de Triomphe (5x5, sans porte) : arc de pierre blonde, frise, drapeau tricolore sous la voûte.
function drawArcTriomphe(g, ox, oy) {
  const stone = 0xe8dcc0;
  const shade = 0xc0b090;
  rect(g, 0x8c7c5c, ox + 4, oy + 6, 72, 74);
  rect(g, stone, ox + 5, oy + 7, 70, 72);
  rect(g, 0x8c7c5c, ox + 2, oy + 4, 76, 12);               // attique
  rect(g, stone, ox + 3, oy + 5, 74, 10);
  for (let x = 6; x < 76; x += 6) rect(g, shade, ox + x, oy + 8, 3, 4);   // frise
  rect(g, shade, ox + 5, oy + 22, 70, 2);
  // Grande voûte
  rect(g, 0x3c3428, ox + 26, oy + 40, 28, 40);
  for (let i = 0; i < 12; i++) {
    const w = Math.round(28 * Math.sin((Math.PI * (i + 1)) / 26));
    rect(g, 0x3c3428, ox + 40 - Math.floor(w / 2), oy + 28 + i, w, 1);
  }
  // Drapeau tricolore suspendu sous la voûte
  rect(g, 0x2848a8, ox + 34, oy + 34, 4, 14);
  rect(g, 0xf8f8f8, ox + 38, oy + 34, 4, 14);
  rect(g, 0xd83030, ox + 42, oy + 34, 4, 14);
  // Bas-reliefs sur les piliers
  for (const x of [10, 58]) {
    rect(g, shade, ox + x, oy + 46, 12, 20);
    rect(g, stone, ox + x + 2, oy + 48, 8, 16);
    rect(g, shade, ox + x + 4, oy + 52, 4, 8);
  }
}

// Pyramide du Louvre (4x3, sans porte) : pyramide de verre sur un bassin.
function drawLouvrePyramid(g, ox, oy) {
  rect(g, 0x5c7ca0, ox + 2, oy + 38, 60, 8);               // bassin
  rect(g, 0x88b0d8, ox + 3, oy + 39, 58, 6);
  for (let i = 0; i < 34; i++) {
    const w = Math.round(2 + i * 1.5);
    const x0 = ox + 32 - Math.floor(w / 2);
    rect(g, 0x6c8cb0, x0, oy + 4 + i, w, 1);
    for (let x = (i % 6 < 3 ? 0 : 3); x < w; x += 6) rect(g, 0xb8d8f0, x0 + x, oy + 4 + i, 2, 1);   // losanges
    rect(g, 0x3c4c68, x0, oy + 4 + i, 1, 1);
    rect(g, 0x3c4c68, x0 + w - 1, oy + 4 + i, 1, 1);
  }
  rect(g, 0x3c4c68, ox + 31, oy + 2, 2, 3);
}

// Notre-Dame (7x4, porte en (3,3)) : façade gothique, deux tours carrées, rosace.
function drawNotreDame(g, ox, oy) {
  const stone = 0xd8ccb0;
  const shade = 0xa89c80;
  // Tours
  for (const x of [0, 76]) {
    rect(g, 0x6c604c, ox + x, oy, 36, 64);
    rect(g, stone, ox + x + 1, oy + 1, 34, 62);
    for (const wx of [8, 20]) {
      rect(g, 0x3c3428, ox + x + wx, oy + 6, 6, 18);
      rect(g, 0x3c3428, ox + x + wx + 1, oy + 4, 4, 2);
    }
    for (let bx = 1; bx < 35; bx += 4) rect(g, shade, ox + x + bx, oy, 2, 3);
  }
  // Nef centrale et rosace
  rect(g, 0x6c604c, ox + 34, oy + 8, 44, 56);
  rect(g, stone, ox + 35, oy + 9, 42, 54);
  rect(g, 0x3c3428, ox + 45, oy + 14, 22, 22);
  rect(g, 0x5c3c8c, ox + 47, oy + 16, 18, 18);
  rect(g, 0xc83040, ox + 53, oy + 22, 6, 6);
  rect(g, 0xe8c040, ox + 55, oy + 16, 2, 18);
  rect(g, 0xe8c040, ox + 47, oy + 24, 18, 2);
  // Galerie des rois
  for (let x = 2; x < 110; x += 5) rect(g, shade, ox + x, oy + 38, 3, 4);
  // Portails
  for (const x of [8, 84]) {
    rect(g, 0x3c3428, ox + x, oy + 46, 20, 18);
    rect(g, 0x3c3428, ox + x + 4, oy + 42, 12, 4);
  }
  rect(g, 0x3c3428, ox + 46, oy + 44, 20, 20);             // portail central (case locale 3,3)
  rect(g, 0x3c3428, ox + 50, oy + 40, 12, 4);
  rect(g, 0x5c3418, ox + 48, oy + 48, 16, 16);
  rect(g, 0x3c2410, ox + 56, oy + 48, 1, 16);
}

// Tour de bureaux moderne (4x5, porte en (1,4)) : verre bleuté, sommet dépassant vers le haut, logo.
function drawOfficeTower(g, ox, oy) {
  const top = oy - 24;
  rect(g, 0x1c2430, ox + 4, top, 56, 104);
  rect(g, 0x4c7cac, ox + 5, top + 1, 54, 102);
  for (let y = top + 6; y < oy + 64; y += 6) rect(g, 0x2c4c74, ox + 5, y, 54, 1);   // étages
  for (let x = 12; x < 58; x += 10) rect(g, 0x2c4c74, ox + x, top + 1, 1, 86);
  for (let y = top + 8; y < oy + 60; y += 12) rect(g, 0x9cc4e8, ox + 7, y, 3, 1);   // reflets
  rect(g, 0x6ca0d0, ox + 5, top + 1, 6, 102);
  // Couronnement et antenne
  rect(g, 0x1c2430, ox + 14, top - 6, 36, 7);
  rect(g, 0x9ca4ac, ox + 15, top - 5, 34, 5);
  rect(g, 0x303038, ox + 31, top - 16, 2, 11);
  rect(g, 0xd83030, ox + 31, top - 17, 2, 2);
  // Logo de l'entreprise
  rect(g, 0xf4f4f4, ox + 20, top + 10, 24, 12);
  rect(g, 0xc83030, ox + 24, top + 13, 6, 6);
  rect(g, 0x2c4c8c, ox + 32, top + 13, 8, 2);
  rect(g, 0x2c4c8c, ox + 32, top + 17, 6, 2);
  // Hall d'entrée (case locale 1,4)
  rect(g, 0x9ca4ac, ox, oy + 76, 64, 4);
  rect(g, 0x1c2430, ox + 16, oy + 64, 16, 16);
  rect(g, 0xb8d8f0, ox + 17, oy + 65, 14, 15);
  rect(g, 0x1c2430, ox + 24, oy + 65, 1, 15);
}

// Accor Arena de Bercy (10x4, porte en (4,3)) : pyramide aux pentes gazonnées, charpente
// métallique verte, verrière au sommet, enseigne « BERCY ».
function drawBercy(g, ox, oy) {
  const w = 160;
  // Pentes gazonnées (trapèze)
  for (let i = 0; i < 44; i++) {
    const inset = Math.round(28 - i * 0.6);
    rect(g, 0x2c6c2c, ox + inset, oy + 4 + i, w - inset * 2, 1);
    for (let x = inset + 2; x < w - inset - 2; x += 7) rect(g, 0x4c9c4c, ox + x, oy + 4 + i, 3, 1);
  }
  // Arêtes en charpente verte
  for (let i = 0; i < 44; i++) {
    const inset = Math.round(28 - i * 0.6);
    rect(g, 0x1c4c34, ox + inset, oy + 4 + i, 2, 1);
    rect(g, 0x1c4c34, ox + w - inset - 2, oy + 4 + i, 2, 1);
  }
  // Verrière au sommet
  rect(g, 0x3c4c5c, ox + 44, oy, 72, 14);
  rect(g, 0x8cb8d8, ox + 45, oy + 1, 70, 12);
  for (let x = 45; x < 115; x += 7) rect(g, 0x3c4c5c, ox + x, oy + 1, 1, 12);
  // Façade vitrée et entrée
  rect(g, 0x303840, ox + 4, oy + 48, w - 8, 16);
  rect(g, 0x5c8cb8, ox + 5, oy + 49, w - 10, 14);
  for (let x = 12; x < w - 8; x += 10) rect(g, 0x303840, ox + x, oy + 49, 1, 14);
  rect(g, 0xf4f4f4, ox + 58, oy + 40, 44, 9);             // enseigne
  pixelText(g, 'BERCY', ox + 67, oy + 42, 1, 0xc82838);
  pixelText(g, 'BERCY', ox + 68, oy + 42, 1, 0xc82838);
  rect(g, 0x303840, ox + 64, oy + 51, 32, 13);            // portes (case locale 4,3)
  rect(g, 0xb8d8f0, ox + 66, oy + 52, 28, 12);
  rect(g, 0x303840, ox + 79, oy + 52, 2, 12);
}

// Maison provençale de Toulon (5x4, porte en (2,3)) : murs ocre ou pastel, volets bleus,
// toit de tuiles rondes. `variant` choisit la couleur des murs.
const PROVENCE_COLORS = [0xe8b870, 0xf0d0a0, 0xe89878, 0xf4e4c8, 0xd8a868];
function drawProvencalHouse(g, ox, oy, { variant = 0 } = {}) {
  const wall = PROVENCE_COLORS[variant % PROVENCE_COLORS.length];
  const shutter = [0x3c7cb8, 0x4c9c8c, 0x2c5c9c][variant % 3];
  // Toit de tuiles rondes (canal)
  rect(g, 0x7c3818, ox, oy + 2, 80, 30);
  rect(g, 0xc8643c, ox + 1, oy + 3, 78, 27);
  for (let y = 5; y < 30; y += 4) {
    rect(g, 0xa84c2c, ox + 1, oy + y, 78, 1);
    for (let x = (y % 8 === 5 ? 1 : 4); x < 79; x += 6) rect(g, 0xe08858, ox + x, oy + y - 2, 3, 1);
  }
  rect(g, 0x7c3818, ox, oy + 30, 80, 2);
  // Murs
  rect(g, 0x8c6c48, ox + 1, oy + 32, 78, 32);
  rect(g, wall, ox + 2, oy + 32, 76, 30);
  // Fenêtres à volets bleus
  for (const [x, y] of [[8, 36], [58, 36], [8, 50], [58, 50]]) {
    rect(g, shutter, x + ox, oy + y, 3, 9);
    rect(g, 0x3c4858, x + ox + 3, oy + y, 8, 9);
    rect(g, 0x88b0d0, x + ox + 4, oy + y + 1, 6, 7);
    rect(g, shutter, x + ox + 11, oy + y, 3, 9);
  }
  rect(g, 0x3c7c3c, ox + 26, oy + 36, 28, 3);             // jardinière de géraniums
  for (let x = 27; x < 54; x += 4) rect(g, 0xe83848, ox + x, oy + 35, 2, 1);
  // Porte (case locale 2,3)
  rect(g, 0x5c3c24, ox + 33, oy + 46, 14, 18);
  rect(g, shutter, ox + 34, oy + 47, 12, 17);
  rect(g, 0x5c3c24, ox + 40, oy + 47, 1, 17);
  rect(g, 0xd8b050, ox + 43, oy + 56, 1, 2);
}

// Phare (2x3, sans porte) : tour blanche à bandes rouges, lanterne jaune.
function drawLighthouse(g, ox, oy) {
  rect(g, 0x5c5c64, ox + 6, oy + 42, 20, 6);              // socle
  rect(g, 0x9c9ca4, ox + 7, oy + 43, 18, 4);
  rect(g, 0x5c5c64, ox + 9, oy + 12, 14, 31);
  for (let y = 13; y < 42; y += 1) rect(g, Math.floor((y - 13) / 6) % 2 ? 0xd83030 : 0xf4f4f4, ox + 10, oy + y, 12, 1);
  rect(g, 0x303038, ox + 8, oy + 8, 16, 5);               // lanterne
  rect(g, 0xf8e070, ox + 10, oy + 9, 12, 3);
  rect(g, 0xd83030, ox + 10, oy + 3, 12, 5);              // toit
  rect(g, 0xd83030, ox + 13, oy, 6, 3);
  rect(g, 0xf8f0b0, ox + 24, oy + 9, 6, 2);               // faisceau
}

// Cathédrale de Saint-Jacques-de-Compostelle (7x5, sans porte) : granit doré, deux tours baroques.
function drawSantiagoCathedral(g, ox, oy) {
  const stone = 0xd8c498;
  const shade = 0xa8946c;
  const dark = 0x5c4c34;
  for (const x of [0, 80]) {                              // tours
    rect(g, dark, ox + x, oy - 16, 32, 96);
    rect(g, stone, ox + x + 1, oy - 15, 30, 94);
    for (let y = -8; y < 76; y += 12) rect(g, shade, ox + x + 1, oy + y, 30, 2);
    rect(g, dark, ox + x + 11, oy - 2, 10, 14);           // clochers
    rect(g, 0x3c4c5c, ox + x + 12, oy - 1, 8, 12);
    rect(g, stone, ox + x + 8, oy - 26, 16, 11);
    rect(g, dark, ox + x + 15, oy - 34, 2, 9);             // croix
    rect(g, dark, ox + x + 12, oy - 31, 8, 2);
  }
  rect(g, dark, ox + 30, oy + 10, 52, 70);                // façade centrale
  rect(g, stone, ox + 31, oy + 11, 50, 68);
  rect(g, dark, ox + 46, oy + 20, 20, 20);                // grande verrière
  rect(g, 0x6c8cb0, ox + 47, oy + 21, 18, 18);
  rect(g, shade, ox + 55, oy + 21, 2, 18);
  rect(g, dark, ox + 44, oy + 50, 24, 30);                // portail
  rect(g, 0x5c3418, ox + 46, oy + 54, 20, 26);
  rect(g, 0xf0c830, ox + 54, oy + 44, 4, 4);              // coquille dorée
}

// Hórreo galicien (2x2, décor) : grenier de pierre sur pilotis, toit de tuiles, croix.
function drawHorreo(g, ox, oy) {
  for (const x of [4, 14, 24]) rect(g, 0x8c8474, ox + x, oy + 20, 4, 12);   // pilotis
  rect(g, 0x5c5448, ox + 1, oy + 10, 30, 12);
  rect(g, 0xb8b0a0, ox + 2, oy + 11, 28, 10);
  for (let x = 4; x < 30; x += 4) rect(g, 0x8c8474, ox + x, oy + 12, 1, 8);
  rect(g, 0x9c4c2c, ox, oy + 4, 32, 7);                   // toit
  rect(g, 0xc8643c, ox + 1, oy + 5, 30, 4);
  rect(g, 0x5c5448, ox + 15, oy, 2, 5);
  rect(g, 0x5c5448, ox + 13, oy + 1, 6, 1);
}

// Maison de pierre (5x4, porte en (2,3)) : granit gris, toit de tuiles, volets verts.
// Sert en Galice et dans le village corse. `variant` change légèrement la pierre.
const STONES = [0xa8a49c, 0x9c9488, 0xb4ac9c];
function drawStoneHouse(g, ox, oy, { variant = 0 } = {}) {
  const stone = STONES[variant % STONES.length];
  rect(g, 0x6c3018, ox, oy + 2, 80, 30);
  rect(g, 0xb8583c, ox + 1, oy + 3, 78, 27);
  for (let y = 6; y < 30; y += 4) rect(g, 0x9c4428, ox + 1, oy + y, 78, 1);
  rect(g, 0x5c5850, ox + 60, oy, 10, 10);                 // cheminée
  rect(g, 0x6c3018, ox, oy + 30, 80, 2);
  rect(g, 0x5c5850, ox + 1, oy + 32, 78, 32);
  rect(g, stone, ox + 2, oy + 32, 76, 30);
  for (let r = 0; r < 6; r++) {                           // appareil de pierres
    for (let c = (r % 2) * 5; c < 76; c += 10) rect(g, 0x8c887c, ox + 2 + c, oy + 33 + r * 5, 8, 1);
  }
  for (const x of [8, 58]) {
    rect(g, 0x2c6c3c, ox + x, oy + 38, 3, 10);
    rect(g, 0x3c4858, ox + x + 3, oy + 38, 8, 10);
    rect(g, 0x88a8c0, ox + x + 4, oy + 39, 6, 8);
    rect(g, 0x2c6c3c, ox + x + 11, oy + 38, 3, 10);
  }
  rect(g, 0x5c3c24, ox + 33, oy + 46, 14, 18);            // porte (case locale 2,3)
  rect(g, 0x8c5c2c, ox + 34, oy + 47, 12, 17);
  rect(g, 0x6c4420, ox + 40, oy + 47, 1, 17);
  rect(g, 0xd8b050, ox + 43, oy + 56, 1, 2);
}

// Cabane de plage balinaise (3x3, porte en (1,2)) : bambou sur pilotis, toit de chaume pointu.
// Cabane de pêche (3 x 3 cases) façon Rouge Feu : toit de chaume en trois couches à bord festonné,
// murs en planches, porte sombre en case locale (1, 2), petite fenêtre et bouée.
function drawBeachHut(g, ox, oy) {
  const K = 0x4a3020;
  g.fillStyle(0x000000, 0.2);
  g.fillRect(ox + 4, oy + 47, 42, 2);

  // Murs en planches
  rect(g, K, ox + 4, oy + 22, 40, 26);
  rect(g, 0xd8a868, ox + 5, oy + 23, 38, 24);
  for (let x = 5; x < 43; x += 5) {
    rect(g, 0xb88448, ox + x + 4, oy + 23, 1, 24);                  // joints
    rect(g, 0xe8c088, ox + x, oy + 23, 1, 24);                      // arête claire
  }
  rect(g, 0xa87438, ox + 5, oy + 44, 38, 3);                        // bas des planches
  // Fenêtre
  rect(g, K, ox + 33, oy + 28, 8, 8);
  rect(g, 0x70a8e8, ox + 34, oy + 29, 6, 6);
  rect(g, 0xc0e0f8, ox + 34, oy + 29, 6, 2);
  // Porte
  rect(g, K, ox + 18, oy + 30, 13, 18);
  rect(g, 0x5c3820, ox + 19, oy + 31, 11, 17);
  rect(g, 0x70482c, ox + 20, oy + 32, 4, 15);
  rect(g, 0xf0c848, ox + 27, oy + 39, 1, 2);
  // Bouée accrochée
  rect(g, K, ox + 7, oy + 29, 8, 8);
  rect(g, 0xf04838, ox + 8, oy + 30, 6, 6);
  rect(g, 0xf8f8f8, ox + 8, oy + 32, 6, 2);
  rect(g, 0xf8f8f8, ox + 10, oy + 30, 2, 6);
  rect(g, 0xd8a868, ox + 10, oy + 32, 2, 2);

  // Toit de chaume : trois couches, chacune avec un bord festonné et un reflet
  rect(g, K, ox + 1, oy + 1, 46, 24);
  const layers = [[2, 0xd8b058, 0xf0d080, 0xa88030], [9, 0xd0a850, 0xe8c878, 0xa07828], [16, 0xc8a048, 0xe0c070, 0x987020]];
  for (const [ly, base, hi, lo] of layers) {
    rect(g, base, ox + 2, oy + ly, 44, 7);
    rect(g, hi, ox + 2, oy + ly, 44, 1);
    for (let x = 2; x < 46; x += 3) rect(g, lo, ox + x + 1, oy + ly + 2, 1, 3);   // brins de paille
    for (let x = 2; x < 46; x += 4) rect(g, lo, ox + x, oy + ly + 6, 3, 1);        // feston
  }
  rect(g, K, ox + 2, oy + 23, 44, 1);
  for (let x = 3; x < 46; x += 4) rect(g, K, ox + x, oy + 24, 2, 1);              // bord effiloché
  rect(g, 0xf8e0a0, ox + 4, oy + 2, 40, 1);                                        // faîtage
}

// Porte balinaise fendue (candi bentar, 3x3, décor) : deux moitiés de tour sculptée.
function drawBaliGate(g, ox, oy) {
  const brick = 0x9c5c3c;
  const stone = 0x7c7c74;
  for (const [x, dir] of [[2, 1], [28, -1]]) {
    for (let i = 0; i < 6; i++) {
      const w = 18 - i * 2;
      const x0 = dir > 0 ? ox + x + i : ox + x + 18 - w - i;
      rect(g, i % 2 ? stone : brick, x0, oy + 40 - i * 7, w, 7);
      rect(g, 0x5c3424, x0, oy + 40 - i * 7, w, 1);
    }
    rect(g, stone, ox + x, oy + 44, 18, 4);
  }
  rect(g, 0xe8c040, ox + 14, oy + 8, 4, 3);               // offrande (canang sari)
  rect(g, 0xe84868, ox + 30, oy + 8, 3, 3);
}

// Stupa (dagoba) cinghalais (5x5, porte en (2,4)) : dôme blanc, flèche dorée, terrasse.
function drawStupa(g, ox, oy) {
  const white = 0xf4f0e8;
  const shade = 0xd0c8b8;
  rect(g, 0x8c8474, ox + 2, oy + 64, 76, 16);             // terrasse
  rect(g, 0xc8c0b0, ox + 3, oy + 65, 74, 14);
  for (let x = 6; x < 76; x += 8) rect(g, 0xa8a090, ox + x, oy + 66, 4, 12);
  for (let i = 0; i < 34; i++) {                          // dôme
    const w = Math.round(64 * Math.sqrt(1 - ((33 - i) / 34) ** 2));
    rect(g, i > 26 ? shade : white, ox + 40 - Math.floor(w / 2), oy + 30 + i, w, 1);
  }
  rect(g, shade, ox + 30, oy + 22, 20, 8);                // harmika
  rect(g, white, ox + 31, oy + 23, 18, 6);
  for (let i = 0; i < 16; i++) {                          // flèche dorée
    const w = Math.max(2, 10 - Math.floor(i / 2));
    rect(g, 0xd8a830, ox + 40 - Math.floor(w / 2), oy + 22 - i, w, 1);
  }
  rect(g, 0xf8e070, ox + 39, oy + 4, 2, 2);
  rect(g, 0x5c4c34, ox + 32, oy + 64, 16, 16);            // entrée (case locale 2,4)
  rect(g, 0x3c2c1c, ox + 34, oy + 66, 12, 14);
  rect(g, 0xe8c040, ox + 32, oy + 62, 16, 2);
}

// Wat thaïlandais (5x5, porte en (2,4)) : toits rouges superposés bordés d'or, murs blancs, chedi doré.
function drawWat(g, ox, oy) {
  const gold = 0xe8b830;
  // Chedi doré derrière
  for (let i = 0; i < 26; i++) {
    const w = Math.max(2, Math.round(i * 0.9));
    rect(g, i < 4 ? 0xf8d860 : gold, ox + 64 - Math.floor(w / 2), oy + i, w, 1);
  }
  // Toits superposés
  const roof = (y, x0, w) => {
    rect(g, 0x7c1818, ox + x0, oy + y, w, 10);
    rect(g, 0xc83030, ox + x0 + 1, oy + y + 1, w - 2, 7);
    rect(g, 0x2c5c3c, ox + x0 + 1, oy + y + 5, w - 2, 2);
    rect(g, gold, ox + x0, oy + y + 9, w, 1);
    rect(g, gold, ox + x0 - 3, oy + y - 3, 4, 4);            // chofa (ornement)
    rect(g, gold, ox + x0 + w - 1, oy + y - 3, 4, 4);
  };
  roof(14, 22, 36);
  roof(26, 12, 56);
  roof(38, 4, 72);
  // Murs blancs et colonnes dorées
  rect(g, 0x9c9484, ox + 8, oy + 48, 64, 32);
  rect(g, 0xf8f4ec, ox + 9, oy + 49, 62, 30);
  for (const x of [12, 24, 52, 64]) rect(g, gold, ox + x, oy + 49, 4, 30);
  rect(g, gold, ox + 9, oy + 49, 62, 2);
  // Porte ornée (case locale 2,4)
  rect(g, 0x7c1818, ox + 32, oy + 58, 16, 22);
  rect(g, gold, ox + 33, oy + 59, 14, 21);
  rect(g, 0x9c2020, ox + 35, oy + 62, 10, 18);
  rect(g, gold, ox + 39, oy + 62, 2, 18);
}

// Grand stupa népalais façon Boudhanath (5x5, porte en (2,4)) : dôme blanc,
// tour dorée aux yeux de Bouddha, guirlandes de drapeaux de prière.
function drawBoudhanath(g, ox, oy) {
  const white = 0xf8f6f0;
  const gold = 0xe8b830;
  rect(g, 0x9c9484, ox + 2, oy + 66, 76, 14);             // terrasses
  rect(g, 0xd8d0c0, ox + 4, oy + 67, 72, 12);
  rect(g, 0x9c9484, ox + 4, oy + 72, 72, 1);
  for (let i = 0; i < 26; i++) {                          // dôme
    const w = Math.round(72 * Math.sqrt(1 - ((25 - i) / 26) ** 2));
    rect(g, i > 20 ? 0xe0d8c8 : white, ox + 40 - Math.floor(w / 2), oy + 40 + i, w, 1);
  }
  rect(g, gold, ox + 28, oy + 26, 24, 14);                // harmika dorée
  rect(g, 0x202028, ox + 31, oy + 30, 6, 2);              // yeux de Bouddha
  rect(g, 0x202028, ox + 43, oy + 30, 6, 2);
  rect(g, 0x3c5cc8, ox + 33, oy + 30, 2, 2);
  rect(g, 0x3c5cc8, ox + 45, oy + 30, 2, 2);
  rect(g, 0x202028, ox + 38, oy + 33, 4, 3);              // nez (point d'interrogation stylisé)
  for (let i = 0; i < 18; i++) {                          // flèche à treize degrés
    const w = Math.max(2, 18 - i);
    rect(g, i % 3 ? gold : 0xc89820, ox + 40 - Math.floor(w / 2), oy + 26 - i, w, 1);
  }
  const cols = [0x2c5cc8, 0xf8f8f8, 0xd83030, 0x3c9c4c, 0xf0c830];
  for (let i = 0; i < 12; i++) {                          // guirlandes de drapeaux
    rect(g, cols[i % 5], ox + 4 + i * 3, oy + 20 + Math.floor(i * 1.6), 2, 3);
    rect(g, cols[(i + 2) % 5], ox + 76 - i * 3, oy + 20 + Math.floor(i * 1.6), 2, 3);
  }
  rect(g, 0x5c4c34, ox + 32, oy + 66, 16, 14);            // entrée (case locale 2,4)
  rect(g, 0x9c2020, ox + 34, oy + 68, 12, 12);
  rect(g, gold, ox + 32, oy + 64, 16, 2);
}

// Grange de ferme (5x4, porte en (2,3)) : bois rouge, croisillons blancs, lucarne à foin.
function drawBarn(g, ox, oy) {
  rect(g, 0x3c3c40, ox, oy + 2, 80, 30);                  // toit de tôle
  rect(g, 0x707478, ox + 1, oy + 3, 78, 27);
  for (let x = 4; x < 78; x += 6) rect(g, 0x5c6064, ox + x, oy + 3, 2, 27);
  rect(g, 0x3c3c40, ox, oy + 30, 80, 2);
  rect(g, 0x5c1818, ox + 1, oy + 32, 78, 32);              // murs rouges
  rect(g, 0xa83028, ox + 2, oy + 32, 76, 30);
  for (let x = 6; x < 76; x += 6) rect(g, 0x8c2420, ox + x, oy + 32, 1, 30);
  rect(g, 0xf4f0e8, ox + 32, oy + 34, 16, 8);              // lucarne à foin
  rect(g, 0xe8c850, ox + 34, oy + 36, 12, 5);
  rect(g, 0xf4f0e8, ox + 28, oy + 44, 24, 20);             // grande porte (case locale 2,3)
  rect(g, 0x8c2420, ox + 30, oy + 46, 20, 18);
  for (let i = 0; i < 18; i++) {                           // croisillons en X
    rect(g, 0xf4f0e8, ox + 30 + Math.round(i * 20 / 18), oy + 46 + i, 1, 1);
    rect(g, 0xf4f0e8, ox + 49 - Math.round(i * 20 / 18), oy + 46 + i, 1, 1);
  }
  rect(g, 0xe8c850, ox + 4, oy + 56, 12, 8);               // botte de foin
  rect(g, 0xc8a038, ox + 4, oy + 59, 12, 1);
}

// Tracteur (obstacle 2x2) : vert, grandes roues arrière. `broken` : capot ouvert et fumée.
// Tracteur vert vu de côté (34 x 30 px), façon Rouge Feu : contour sombre, cabine vitrée sur la grande roue
// arrière crantée, garde-boue, capot à bande jaune et calandre, phare, pot d'échappement, petite roue avant.
// En panne : fumée noire et grise qui sort du pot.
const TRACTOR = [
  '...kkkkkkkkkkkkkk.................',
  '...kGGGGGGGGGGGGk.................',
  '...kggggggggggggk.....kkk.........',
  '...kggBBBBBBBBggk.....kkk.........',
  '...kggBBBBBBBBggk.....kmk.........',
  '...kggbbbbbbbbggk.....kmk.........',
  '...kggbbbbbbbbggk.....kmk.........',
  '...kggbbsssbbbggk.....kmk.........',
  '...kggbbsssbbbggk.....kmk.........',
  '...kggbbsssbbbggk.....kmk.........',
  '..kkkkkkkkkkkkkkkkkkkkkkkkkkkkYk..',
  'kGGGGGGGGGGGGGGGGGkGGGGGGGGGGkkk..',
  'kgggggggggggggggggkGGGGGGGGGGyyk..',
  'kkkkkkkkkkkkkkkkkkkggggggggggYYk..',
  '..kktttttttttttkkyyyyyyyyyyygyyk..',
  '..kTtttttttttttTkggggggggggggYYk..',
  '.kttttttkkkttttttkgggggggggggyyk..',
  '.kttttkkyyykkttttkdddddddkkkkkYk..',
  'ktttttkyyyyyktttttkdddddktttttkk..',
  'ktTttkyyyYyyykttTtkkkkkktttttttk..',
  'kttttkyyYYYyykttttk...kTtttttttTk.',
  'kttttkyyyYyyykttttk..kttttkkkttttk',
  'ktttttkyyyyyktttttk..ktttkkykktttk',
  '.kttttkkyyykkttttk...ktttkyYyktttk',
  '.ktTttttkkkttttTtk...ktttkkykktttk',
  '..ktttttttttttttk....kttttkkkttttk',
  '..kktttttttttttkk.....kTtttttttTk.',
  '...kkttTttttTtkk.......ktttttttk..',
  '.....kktttttkk..........kttTttk...',
  '.......kkkkk.............kkkkk....',
];
const TRACTOR_COLORS = {
  k: 0x282c28, G: 0x78c860, g: 0x409838, d: 0x206028, y: 0xe8c040, Y: 0xf8e890,
  b: 0x78a8d8, B: 0xc0e0f8, s: 0x304060, m: 0x606068, t: 0x38383c, T: 0x686870,
};
function drawTractor(g, ox, oy, { broken = false } = {}) {
  g.fillStyle(0x000000, 0.2);
  g.fillRect(ox + 1, oy + 30, 31, 2);                       // ombre
  sprite(g, TRACTOR, TRACTOR_COLORS, ox - 1, oy + 2);
  if (broken) {
    rect(g, 0x505058, ox + 21, oy - 1, 5, 4);                // fumée
    rect(g, 0x9c9ca4, ox + 23, oy - 5, 6, 5);
    rect(g, 0xc8c8d0, ox + 26, oy - 10, 5, 5);
    rect(g, 0xe0e0e8, ox + 24, oy - 14, 4, 4);
  }
}

// Voilier vu de dessus, 3x2 cases, proue vers l'est, amarré contre le ponton (à l'ouest).
// Bateau à moteur (3 x 2 cases) façon ferry de Rouge Feu, vu de trois quarts : pont vu de dessus,
// flanc blanc à bande bleue, cabine vitrée, proue pointue à droite.
function drawBoat(g, ox, oy) {
  const K = 0x283048;
  const mid = 15;
  const bow = (y) => 38 + Math.round(8 * (1 - Math.abs(y - mid) / 11));   // x de la proue à la rangée y
  // Ombre et remous dans l'eau
  g.fillStyle(0x1c3c8c, 0.45);
  for (let y = 8; y <= 30; y++) g.fillRect(ox + 4, oy + y, bow(Math.min(y, 26)) - 4, 1);
  for (let x = 0; x < 6; x += 2) rect(g, 0xd8ecfc, ox - 2 + x, oy + 28 + (x % 4 ? 1 : 0), 2, 1);
  // Flanc (visible sous le pont)
  for (let y = 18; y <= 28; y++) {
    const r = bow(Math.min(y, 26)) - (y > 24 ? (y - 24) * 2 : 0);
    rect(g, K, ox + 2, oy + y, r - 1, 1);
    if (y < 28) rect(g, y === 22 || y === 23 ? 0x3058b8 : y > 25 ? 0xc8d0e0 : 0xf8f8f8, ox + 3, oy + y, r - 3, 1);
  }
  // Pont vu de dessus
  for (let y = 4; y <= 19; y++) {
    const r = bow(y);
    rect(g, K, ox + 2, oy + y, r - 1, 1);
    if (y > 4 && y < 19) rect(g, 0xe8dcc0, ox + 3, oy + y, r - 4, 1);
  }
  rect(g, 0xf8f0d8, ox + 3, oy + 5, 34, 1);
  for (let x = 6; x < 40; x += 4) rect(g, 0xd0c4a0, ox + x, oy + 6, 1, 12);   // lattes
  // Cabine
  rect(g, K, ox + 8, oy + 3, 20, 15);
  rect(g, 0xf8f8f8, ox + 9, oy + 4, 18, 13);
  rect(g, 0xd0d8e8, ox + 9, oy + 4, 18, 3);                                  // toit
  rect(g, 0xa8b4c8, ox + 9, oy + 7, 18, 1);
  for (const wx of [11, 17, 23]) {                                           // hublots
    rect(g, K, ox + wx - 1, oy + 9, 5, 5);
    rect(g, 0x5890e8, ox + wx, oy + 10, 3, 3);
    rect(g, 0xb8d8f8, ox + wx, oy + 10, 2, 1);
  }
  rect(g, 0x3058b8, ox + 9, oy + 15, 18, 2);                                 // bande bleue
  // Bouée et bitte d'amarrage
  rect(g, K, ox + 31, oy + 8, 7, 7);
  rect(g, 0xf04838, ox + 32, oy + 9, 5, 5);
  rect(g, 0xf8f8f8, ox + 32, oy + 11, 5, 1);
  rect(g, 0xf8f8f8, ox + 34, oy + 9, 1, 5);
  rect(g, 0xe8dcc0, ox + 34, oy + 11, 1, 1);
  rect(g, K, ox + 4, oy + 14, 3, 3);
  // Amarre vers le ponton
  rect(g, 0xe8d8a8, ox, oy + 15, 5, 1);
}

const BUILDINGS = {
  house: drawHouse,
  lab: drawLab,
  hospital: drawHospital,
  medievalHouse: drawMedievalHouse,
  school: drawSchool,
  barracks: drawBarracks,
  headquarters: drawHeadquarters,
  immeuble: drawImmeuble,
  agence: drawAgence,
  kedge: drawKedge,
  terrace: drawTerrace,
  pub: drawPub,
  university: drawUniversity,
  castle: drawCastle,
  bigBen: drawBigBen,
  bus: drawBus,
  theDeep: drawTheDeep,
  footballPitch: drawFootballPitch,
  minster: drawMinster,
  asylum: drawAsylum,
  wilberforce: drawWilberforce,
  tubeHouse: drawTubeHouse,
  travelAgency: drawTravelAgency,
  pagoda: drawPagoda,
  turtleTower: drawTurtleTower,
  canalHouse: drawCanalHouse,
  corning: drawCorning,
  coffeeShop: drawCoffeeShop,
  windmill: drawWindmill,
  houseboat: drawHouseboat,
  haveli: drawHaveli,
  mughalPalace: drawMughalPalace,
  indiaGate: drawIndiaGate,
  buddha: drawBuddha,
  delhiUniversity: drawDelhiUniversity,
  hut: drawHut,
  tent: drawTent,
  plane: drawPlane,
  stadium: drawStadium,
  brokenCar: drawBrokenCar,
  familyCar: drawFamilyCar,
  cafe: drawCafe,
  bistro: drawBistro,
  eiffelTower: drawEiffelTower,
  arcTriomphe: drawArcTriomphe,
  louvrePyramid: drawLouvrePyramid,
  notreDame: drawNotreDame,
  officeTower: drawOfficeTower,
  bercy: drawBercy,
  provencalHouse: drawProvencalHouse,
  lighthouse: drawLighthouse,
  santiagoCathedral: drawSantiagoCathedral,
  horreo: drawHorreo,
  stoneHouse: drawStoneHouse,
  beachHut: drawBeachHut,
  baliGate: drawBaliGate,
  stupa: drawStupa,
  wat: drawWat,
  boudhanath: drawBoudhanath,
  barn: drawBarn,
  tractor: drawTractor,
  boat: drawBoat,
};

export function drawBuilding(g, building) {
  const { type, x, y } = building;
  const draw = BUILDINGS[type];
  if (!draw) throw new Error(`Bâtiment inconnu : "${type}"`);
  draw(g, x * S, y * S, building);
}
