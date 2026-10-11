// La police de Rouge Feu du jeu (public/assets/fonts/frlg*.png + .xml, BMFont) dessinée sur un canvas du créateur, pour
// que le panneau PNJ garde l'allure de l'ancien menu PNJ du jeu. `light` : la variante claire (sur les bandeaux bleus).
// Mêmes remplacements que le jeu (systems/frlgFont.js) : guillemets, tirets, accents retirés si la lettre manque.

const REPLACE = { '→': '▶', "'": '’', '"': '“', '«': '“', '»': '”', '—': '-', '–': '-' };

export function loadPixelFont(base) {
  const load = (file) => Promise.all([
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `${base}assets/fonts/${file}.png`;
    }),
    fetch(`${base}assets/fonts/${file}.xml`).then((r) => r.text()),
  ]).then(([img, xml]) => {
    const chars = {};
    for (const m of xml.matchAll(/<char id="(\d+)" x="(\d+)" y="\d+" width="(\d+)" height="\d+" xoffset="0" yoffset="0" xadvance="(\d+)"/g)) {
      chars[Number(m[1])] = { x: Number(m[2]), w: Number(m[3]), advance: Number(m[4]) };
    }
    return { img, chars };
  });
  return Promise.all([load('frlg'), load('frlg-clair')]).then(([dark, light]) => {
    const glyph = (font, c) => {
      if (font.chars[c.charCodeAt(0)]) return c;
      const r = REPLACE[c] ?? c.normalize('NFD')[0];
      return font.chars[r.charCodeAt(0)] || r === ' ' ? r : '?';
    };
    const width = (text, { light: isLight = false } = {}) => {
      const font = isLight ? light : dark;
      return [...text].reduce((w, c) => w + (font.chars[glyph(font, c).charCodeAt(0)]?.advance ?? 0), 0);
    };
    // Écrit `text` en (x, y) (pixels de la police), agrandi `scale` fois.
    const draw = (ctx, text, x, y, { scale = 2, light: isLight = false } = {}) => {
      const font = isLight ? light : dark;
      ctx.imageSmoothingEnabled = false;
      let cx = x;
      for (const c of text) {
        const g = font.chars[glyph(font, c).charCodeAt(0)];
        if (!g) continue;
        if (g.w) ctx.drawImage(font.img, g.x, 0, g.w, 15, cx * scale, y * scale, g.w * scale, 15 * scale);
        cx += g.advance;
      }
      return cx;
    };
    return { draw, width };
  });
}
