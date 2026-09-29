// Petits outils de dessin pixel art sur un Phaser.Graphics.

export function rect(g, color, x, y, w, h) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, w, h);
}

// Dessine un sprite décrit par des lignes de caractères ; chaque caractère est
// une clé de `palette`, les caractères absents de la palette sont transparents.
// Les pixels consécutifs de même couleur sont fusionnés en un seul rectangle.
export function sprite(g, rows, palette, ox, oy) {
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (palette[c] !== undefined) rect(g, palette[c], ox + x, oy + y, end - x, 1);
      x = end;
    }
  });
}

// Pseudo-aléatoire déterministe par case (texture du sol stable d'une partie à l'autre).
export function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
