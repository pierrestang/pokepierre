import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Cartes du créateur de cartes (builder.html), enregistrées dans le projet : src/data/builtMaps/<id>.json.
const MAPS_DIR = resolve(import.meta.dirname, 'src/data/builtMaps');
const ID = /^[a-z0-9-]{1,60}$/;

// Pendant le développement (npm run dev, sur l'ordinateur), le créateur de cartes lit et écrit ses cartes ici :
//   GET  /__builder/maps         la liste { id, name, width, height }
//   GET  /__builder/maps/<id>    une carte
//   POST /__builder/maps/<id>    enregistre la carte (corps : la carte en JSON)
// Chaque carte a une version (`etag`, empreinte du fichier) : le créateur envoie celle qu'il a ouverte (en-tête
// If-Match ; « none » pour une carte nouvelle) et le serveur refuse (409) si le fichier a changé entre-temps (carte
// régénérée par scripts/convert_maps_v2.py, autre onglet) ou si une nouvelle carte prendrait le nom d'une carte qui
// existe ; X-Force: 1 écrase quand même (après confirmation dans le créateur).
// Le site publié n'a pas ces adresses : le créateur garde alors les cartes dans le navigateur.
function builderMaps() {
  return {
    name: 'pokepierre-builder-maps',
    configureServer(server) {
      server.middlewares.use('/__builder/maps', (req, res) => {
        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        mkdirSync(MAPS_DIR, { recursive: true });
        const etagOf = (text) => createHash('sha1').update(text).digest('hex').slice(0, 16);
        const id = decodeURIComponent((req.url ?? '/').replace(/^\/+|\/+$/g, ''));
        if (!id) {
          const list = readdirSync(MAPS_DIR).filter((f) => f.endsWith('.json')).map((f) => {
            const text = readFileSync(resolve(MAPS_DIR, f), 'utf8');
            const { name, width, height } = JSON.parse(text);
            return { id: f.slice(0, -5), name, width, height, etag: etagOf(text) };
          });
          return send(200, list);
        }
        if (!ID.test(id)) return send(400, { error: 'identifiant invalide' });
        const file = resolve(MAPS_DIR, `${id}.json`);
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
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const map = JSON.parse(body);
            const current = existsSync(file) ? etagOf(readFileSync(file, 'utf8')) : 'none';
            const expected = req.headers['if-match'];
            if (expected && expected !== current && req.headers['x-force'] !== '1') {
              return send(409, { error: current === 'none' ? 'carte supprimée' : expected === 'none' ? 'existe' : 'changée', etag: current });
            }
            const text = `${JSON.stringify(map)}\n`;
            writeFileSync(file, text);
            send(200, { ok: true, file: `src/data/builtMaps/${id}.json`, etag: etagOf(text) });
          } catch (error) {
            send(400, { error: String(error) });
          }
        });
      });
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
