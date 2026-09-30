// Police des dialogues de Rouge Feu (police bitmap, voir scripts/extract_frlg_font.py) : texte gris foncé
// ombré, 16 px par ligne, glyphes proportionnels. Toutes les mesures sont en pixels Game Boy (avant zoom).

export const FRLG_FONT = 'frlg-font';   // ('frlg' est déjà la planche des PNJ)
export const LINE_HEIGHT = 16;

export function preloadFrlgFont(scene) {
  const base = `${import.meta.env.BASE_URL}assets/fonts/`;
  scene.load.bitmapFont(FRLG_FONT, `${base}frlg.png`, `${base}frlg.xml`);
}

// Caractères sans glyphe dans la police, remplacés par un équivalent.
const REPLACE = { '→': '▶', "'": '’', '"': '“', '«': '“', '»': '”', '—': '-', '–': '-', ' ': ' ', ' ': ' ' };

function glyphs(scene) {
  return scene.cache.bitmapFont.get(FRLG_FONT).data.chars;
}

// Texte affichable avec la police : remplacements, puis accents retirés si la lettre accentuée manque.
export function frlgText(scene, text) {
  const chars = glyphs(scene);
  // Guillemets français « X » rendus “X” : sans les espaces intérieures.
  const tight = text.replace(/«[\s\u00a0\u202f]+/g, '«').replace(/[\s\u00a0\u202f]+»/g, '»');
  return [...tight].map((c) => {
    if (c === '\n' || chars[c.charCodeAt(0)]) return c;
    const r = REPLACE[c] ?? c.normalize('NFD')[0];
    return chars[r.charCodeAt(0)] || r === ' ' ? r : '?';
  }).join('');
}

// Largeur d'un texte déjà adapté (en pixels Game Boy).
export function textWidth(scene, text) {
  const chars = glyphs(scene);
  return [...text].reduce((w, c) => w + (chars[c.charCodeAt(0)]?.xAdvance ?? 0), 0);
}

// Coupe un texte en lignes d'au plus `maxWidth` px (coupure aux espaces).
export function wrapText(scene, text, maxWidth) {
  const lines = [];
  for (const paragraph of frlgText(scene, text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(scene, candidate) > maxWidth) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    lines.push(line);
  }
  return lines;
}
