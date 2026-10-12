// Police des dialogues de Rouge Feu (police bitmap, voir scripts/extract_frlg_font.py) : texte gris foncé
// ombré, 16 px par ligne, glyphes proportionnels. Toutes les mesures sont en pixels Game Boy (avant zoom).

export const FRLG_FONT = 'frlg-font';   // ('frlg' est déjà la planche des PNJ)
// Variante claire (encre blanche, ombre gris foncé ; scripts/extract_frlg_font.py) pour les textes sur fond sombre. On
// la teinte avec setTint (multiplication : l'ombre reste sombre), jamais avec setTintFill (qui empâte les lettres).
export const FRLG_FONT_LIGHT = 'frlg-font-clair';
export const LINE_HEIGHT = 16;

export function preloadFrlgFont(scene) {
  const base = `${import.meta.env.BASE_URL}assets/fonts/`;
  scene.load.bitmapFont(FRLG_FONT, `${base}frlg.png`, `${base}frlg.xml`);
  scene.load.bitmapFont(FRLG_FONT_LIGHT, `${base}frlg-clair.png`, `${base}frlg-clair.xml`);
}

// Une couleur claire (texte sur fond sombre) : à écrire avec la variante claire.
export const isLightColor = (color) => ((color >> 16) & 255) * 0.3 + ((color >> 8) & 255) * 0.59 + (color & 255) * 0.11 > 150;

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

// Coupe un texte en lignes d'au plus `maxWidth` px (coupure aux espaces). La ponctuation haute précédée d'une espace
// (« ? », « ! », « : », « ; ») reste collée au mot d'avant : jamais seule en début de ligne.
export function wrapText(scene, text, maxWidth) {
  const lines = [];
  for (const paragraph of frlgText(scene, text).split('\n')) {
    let line = '';
    const words = paragraph.split(' ').reduce((out, w) => {
      if (out.length && /^[?!:;»”]+$/.test(w)) out[out.length - 1] += ` ${w}`;
      else out.push(w);
      return out;
    }, []);
    for (const word of words) {
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
