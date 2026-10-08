import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Cartes du créateur de cartes (builder.html), enregistrées dans le projet : src/data/builtMaps/<id>.json ; intérieurs
// dessinés en Gen 4 (scripts/build_interiors.py) : src/data/builtInteriors/<id>.json.
const MAPS_DIR = resolve(import.meta.dirname, 'src/data/builtMaps');
const INTERIORS_DIR = resolve(import.meta.dirname, 'src/data/builtInteriors');
const ID = /^[a-z0-9-]{1,60}$/;
const INTERIOR_ID = /^[A-Za-z0-9-]{1,60}$/;
const MODELES_DIR = resolve(INTERIORS_DIR, 'modeles');

// Pendant le développement (npm run dev, sur l'ordinateur), le créateur de cartes lit et écrit ses cartes ici :
//   GET  /__builder/maps         la liste { id, name, width, height }
//   GET  /__builder/maps/<id>    une carte
//   POST /__builder/maps/<id>    enregistre la carte (corps : la carte en JSON)
// et les intérieurs du jeu sous /__builder/interieurs (mêmes adresses ; une pièce qui reprend un modèle partagé y est une
// fiche, voir src/data/builtInteriors/compose.js), leurs modèles sous /__builder/modeles. Un intérieur ne se crée pas ici (il lui faut sa
// pièce dans src/data/maps/interiors.js) : on ne fait que retoucher ceux que scripts/build_interiors.py a dessinés ; une
// pièce enregistrée ici est marquée `retouche` et le script ne l'écrase plus (sauf --force).
// Chaque carte a une version (`etag`, empreinte du fichier) : le créateur envoie celle qu'il a ouverte (en-tête
// If-Match ; « none » pour une carte nouvelle) et le serveur refuse (409) si le fichier a changé entre-temps (carte
// régénérée par un script, autre onglet) ou si une nouvelle carte prendrait le nom d'une carte qui existe ; X-Force: 1
// écrase quand même (après confirmation dans le créateur).
// Le site publié n'a pas ces adresses : le créateur garde alors les cartes dans le navigateur.
function collection(dir, idPattern, { interiors = false, rel: relDir = null } = {}) {
  const rel = relDir ?? (interiors ? 'src/data/builtInteriors' : 'src/data/builtMaps');
  return (req, res) => {
    const send = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
    mkdirSync(dir, { recursive: true });
    const etagOf = (text) => createHash('sha1').update(text).digest('hex').slice(0, 16);
    const id = decodeURIComponent((req.url ?? '/').replace(/^\/+|\/+$/g, ''));
    if (!id) {
      // Une pièce qui reprend un modèle partagé (fiche, voir src/data/builtInteriors/compose.js) : `modele` dit lequel.
      const list = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
        const text = readFileSync(resolve(dir, f), 'utf8');
        const { name, width, height, retouche, modele } = JSON.parse(text);
        return { id: f.slice(0, -5), name, width, height, retouche: Boolean(retouche), modele, etag: etagOf(text) };
      });
      return send(200, list);
    }
    if (!idPattern.test(id)) return send(400, { error: 'identifiant invalide' });
    const file = resolve(dir, `${id}.json`);
    if (req.method === 'GET') {
      try {
        const text = readFileSync(file, 'utf8');
        res.setHeader('ETag', etagOf(text));
        return send(200, JSON.parse(text));
      } catch {
        return send(404, { error: 'carte introuvable' });
      }
    }
    if (req.method !== 'POST') return send(405, { error: 'méthode non prise en charge' });
    // Seulement le créateur de ce serveur : du JSON (pas un formulaire envoyé par une autre page) et pas d'origine
    // étrangère (une page ouverte dans le navigateur ne doit pas pouvoir écraser une carte).
    if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return send(415, { error: 'JSON attendu' });
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return send(403, { error: 'origine refusée' });
    if (interiors && !existsSync(file)) return send(404, { error: 'intérieur inconnu' });
    let body = '';
    let tooBig = false;
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 32 * 1024 * 1024) { tooBig = true; req.destroy(); }
    });
    req.on('end', () => {
      if (tooBig) return send(413, { error: 'trop gros' });
      try {
        const map = JSON.parse(body);
        const current = existsSync(file) ? etagOf(readFileSync(file, 'utf8')) : 'none';
        const expected = req.headers['if-match'];
        if (expected && expected !== current && req.headers['x-force'] !== '1') {
          return send(409, { error: current === 'none' ? 'carte supprimée' : expected === 'none' ? 'existe' : 'changée', etag: current });
        }
        if (interiors) {
          map.id = id;
          map.retouche = true;          // retouché à la main : scripts/build_interiors.py ne l'écrase plus (sauf --force)
        }
        const text = interiors ? JSON.stringify(map) : `${JSON.stringify(map)}\n`;
        writeFileSync(file, text);
        send(200, { ok: true, file: `${rel}/${id}.json`, etag: etagOf(text) });
      } catch (error) {
        send(400, { error: String(error) });
      }
    });
  };
}

function builderMaps() {
  return {
    name: 'pokepierre-builder-maps',
    configureServer(server) {
      server.middlewares.use('/__builder/maps', collection(MAPS_DIR, ID));
      server.middlewares.use('/__builder/interieurs', collection(INTERIORS_DIR, INTERIOR_ID, { interiors: true }));
      // Modèles d'intérieurs partagés (src/data/builtInteriors/modeles) : le dessin commun à plusieurs pièces.
      server.middlewares.use('/__builder/modeles', collection(MODELES_DIR, ID, { interiors: true, rel: 'src/data/builtInteriors/modeles' }));
    },
  };
}

export default defineConfig({
  plugins: [builderMaps()],
  build: {
    rollupOptions: {
      // Deux pages : le jeu et le créateur de cartes.
      input: { main: resolve(import.meta.dirname, 'index.html'), builder: resolve(import.meta.dirname, 'builder.html') },
    },
  },
});
