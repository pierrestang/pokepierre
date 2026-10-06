import Phaser from 'phaser';
import { TILE_SIZE, getTile } from '../data/tiles.js';
import { FOLLOWERS } from '../data/story.js';
import { CATCHES, FISHING_ROD } from '../data/fishing.js';
import { renderMap, createSurroundings } from '../systems/tileRenderer.js';
import { drawBuilding } from '../art/buildingArt.js';
import { drawDecal, drawPlanksPile, drawPulleyFixed, drawPulleyStuck, drawToolbox } from '../art/tileArt.js';
import { createWalkableCheck } from '../systems/collision.js';
import { Player, WALK_DURATION } from '../systems/Player.js';
import { CharacterSprite, OPPOSITE, DIRECTIONS, tileCenter } from '../systems/CharacterSprite.js';
import { Followers } from '../systems/Followers.js';
import { Patrols } from '../systems/Patrols.js';
import { playDarts } from '../systems/Darts.js';
import { lookOf } from '../data/characters.js';
import { bedAt, familyCarImage, cabaneFrame, CABANE_LADDER_X, FRLG_SHEETS } from '../art/frlgArt.js';
import { interact } from '../systems/interactions.js';
import { souvenirs } from '../systems/souvenirs.js';
import { flags, meetsConditions } from '../systems/flags.js';
import { visitedFlag } from '../systems/RegionMap.js';
import { items } from '../systems/items.js';
import { ITEM_ICONS } from '../art/uiIcons.js';
import { addBunting } from '../art/bunting.js';
import { savePosition } from '../systems/save.js';
import { memo } from '../systems/memo.js';
import { gameView, SCREEN_W, SCREEN_H } from '../systems/screen.js';
import { canopyTiles } from '../data/treeBlocks.js';
import {
  GrassCovers, TALL_PLANTS, InteractHint, ensureSmallBubbles, stepEffect, footprint, startFallingLeaves, startSeaShimmer,
  startSeagulls, startJumpingFish, lightWindows, applyTimeOfDay,
} from '../systems/effects.js';
import { playMusic, setSeaAmbience, sfx } from '../systems/audio.js';
import { CITY_MUSIC } from '../data/music.js';
import { applyBuiltLook, hiddenUnderTop } from '../systems/builtMaps.js';

const FADE_MS = 150;
const PLAYER_NAME = 'Pierre'; // nom affiché sur les répliques du joueur (`reply`)

// Base commune aux scènes jouables : rendu de la carte, joueur, PNJ, suiveurs, caméra,
// interactions (Entrée / Espace), déclencheurs, événements et transitions.
// Données optionnelles de la carte :
//   npcs:     [{ id, name, x, y, facing, color, dialogue, after?, souvenir?, setFlag?, ifFlags?, unlessFlags? }]
//             `setFlag` : drapeau levé après leur avoir parlé (voir systems/interactions.js)
//             `ask` : question posée après le dialogue, avec réponses au choix (voir runAsk)
//   objects:  [{ x, y, name?, dialogue, after?, souvenir?, item?, setFlag?, ifFlags?, unlessFlags?, ifItems? }]
//             (à examiner, sans sprite ; le premier dont les conditions sont remplies répond)
//             un objet avec `warp` (ex. bateau) se comporte comme un déclencheur ci-dessous
//   triggers: [{ x, y, dialogue, requiresSouvenirs?, ifFlags?, unlessFlags?, ifItems?, readyDialogue?, item?, warp?, setFlags? }]
//             déclenchés en marchant dessus ; si `requiresSouvenirs` et les drapeaux sont remplis,
//             affiche `readyDialogue`, lève `setFlags` puis téléporte vers `warp` { map, x, y, facing }.
//   props:    [{ type, x, y, w, h, dialogue?, ifFlags?, unlessFlags? }] — obstacles dessinés comme un
//             bâtiment (voir art/buildingArt.js), bloquants tant que leurs conditions sont remplies
//   events:   [{ on: 'enter', ifFlags?, unlessFlags?, steps: [{ say, speaker? } | { setFlag } | { talk: npcId }] }]
//             `talk` : le PNJ se tourne vers le joueur et dit son dialogue (+ souvenir éventuel).
//             scénettes jouées automatiquement à l'arrivée sur la carte.
//   surroundings: code de tuile qui remplit l'écran autour de la carte (sinon celui de la scène).
//   music:    { song, volume?, ifFlags?, unlessFlags? } — musique du lieu à la place de celle par défaut
//   dark:     { radius?, ifFlags?, unlessFlags? } — pièce dans le noir, halo autour de Pierre (updateDarkness)
//   patrols:  { guards, caught, ifFlags?, unlessFlags? } — rondes de nuit avec cônes de lumière (systems/Patrols.js)
// Les sous-classes implémentent onTileEntered(tile, x, y), location() (pour la sauvegarde),
// cityName() (affiché en haut à gauche)
// et peuvent définir
// `surroundingTile` (tuile de remplissage par défaut).
// Objets posés au sol, dessinés dans le code : le tas de planches de la ferme (Saint-Ay), la caisse à outils de Jean
// (Montépilloy).
const FLOOR_PROPS = { planks: drawPlanksPile, toolbox: drawToolbox, pulleyStuck: drawPulleyStuck, pulleyFixed: drawPulleyFixed };

// Clés de conditions d'une étape (voir systems/flags.js meetsConditions).
const CONDITION_KEYS = ['ifFlags', 'unlessFlags', 'ifSouvenirs', 'unlessSouvenirs', 'ifItems', 'unlessItems',
  'requiresSouvenirs'];

// Un PNJ déplacé pendant la visite (voir stepTo) reprend sa place de départ.
function restoreHome(d) {
  if (d.home) Object.assign(d, d.home);
  delete d.home;
}

// La dernière rangée d'une carte du créateur porte la bordure d'arbres (planche « lisieres ») : le jeu la cache.
function hidesLastRow(built) {
  if (!built) return false;
  const W = built.width;
  const row = built.layers.decor.slice((built.height - 1) * W, built.height * W);
  return row.some((cell) => (Array.isArray(cell) ? cell : [cell])
    .some((r) => r >= 0 && built.sheets[Math.floor(r / 100000)] === 'lisieres'));
}

export class MapScene extends Phaser.Scene {
  setupMap(map, spawn) {
    const { grid } = map;
    this.map = map;
    this.grid = grid;
    this.transitioning = false;
    this.leaving = false;
    this.actorsReady = false;                       // voir refreshActors (place des nouveaux suiveurs)
    this.emerged = {};                              // personnages sortis de leur cachette (voir emerge)
    this.ambienceKey = undefined;                   // ambiance jour / nuit / petit matin (voir applyAmbience)
    this.ambience = null;
    this.events.once('shutdown', () => { this.leaving = true; });
    // Drapeaux `then` des PNJ encore en train de marcher (voir walkNpc) : posés si on quitte la carte avant leur arrivée
    // (sinon ils réapparaîtraient à leur place de départ à la visite suivante).
    this.pendingWalkFlags = new Set();
    this.events.once('shutdown', () => this.pendingWalkFlags.forEach(flags.add));
    this.scene.get('UI')?.curtain?.setAlpha(0);             // rideau noir d'une scénette précédente
    // Carte dessinée avec le créateur de cartes (map.built) : son dessin remplace le rendu Rouge Feu.
    if (map.built) applyBuiltLook(this, map);
    renderMap(this, map);
    // Morceaux du décor redessinés par-dessus les personnages qui sont derrière (ex. tables de la cabane) :
    // { sheet, frame(scene), x, y, h } en pixels, triés en profondeur par leur bas.
    for (const o of map.overlays ?? []) {
      this.add.image(o.x, o.y, o.sheet, o.frame(this)).setOrigin(0).setDepth(10 + (o.y + o.h) / 10000);
    }
    if (this.scene.key === 'Overworld' && !map.builder) flags.add(visitedFlag(map.id));    // pour la carte du voyage
    this.canopy = map.built || map.backdrop ? new Set() : canopyTiles(grid);   // un dessin du créateur a ses cimes à lui
    this.startWaterSparkles();
    this.grassCovers = new GrassCovers(this, map);
    const seaAround = (map.surroundings ?? this.surroundingTile) === 'w';
    startSeaShimmer(this, map, false);      // reflets des étangs et rivières (la mer est animée, voir addSeaLayer)
    // Musique du lieu et ressac près de la mer.
    // Une musique par ville, la même dans ses intérieurs (voir data/music.js) ; `music` la remplace pour un lieu.
    const music = map.music && meetsConditions(map.music) ? map.music : null;
    playMusic(music?.song ?? CITY_MUSIC[this.fromMap ?? map.id] ?? 'island', music?.volume);
    const hasSea = seaAround || grid.some((row) => row.includes('w'));
    setSeaAmbience(hasSea);
    // Vie de l'île : mouettes, poissons, fenêtres éclairées le soir.
    if (hasSea) {
      startSeagulls(this, map);
      startJumpingFish(this, map);
    }
    if (this.scene.key === 'Overworld') lightWindows(this, map, this.game);
    this.hint = new InteractHint(this);
    this.startIdleNpcs();
    startFallingLeaves(this, map);
    // Autour de la carte : la mer animée (voir renderMap) ou un décor répété.
    const fillTile = map.surroundings ?? this.surroundingTile;
    this.surroundings = fillTile && fillTile !== 'w' ? createSurroundings(this, map, fillTile) : null;

    this.npcs = [];
    this.props = [];
    this.decals = [];
    this.silhouette = null;                   // silhouette du joueur sous les toits (voir updateSilhouette)
    this.followers = new Followers(this);
    // Carte du créateur : les collisions sont celles du dessin, case par case.
    const tileWalkable = map.built
      ? (x, y) => x >= 0 && y >= 0 && x < map.built.width && y < map.built.height && !map.built.solid[y * map.built.width + x]
      : createWalkableCheck(grid);
    this.tileWalkable = tileWalkable;
    // Les PNJ qui se sont avancés vers le joueur (voir approach) reprennent leur place à la prochaine visite.
    this.events.once('shutdown', () => (map.npcs ?? []).forEach(restoreHome));

    // Position sauvegardée devenue invalide (carte modifiée) : retour au point de départ de la carte.
    const spawnWalkable = tileWalkable(spawn.x, spawn.y);
    if (!spawnWalkable && map.spawn) spawn = map.spawn;

    this.player = new Player(this, spawn, {
      isWalkable: (x, y) => (tileWalkable(x, y) || this.openDoorAt(x, y)) && !this.npcAt(x, y) && !this.propAt(x, y)
        && !this.patrols?.occupies(x, y),
      onStep: (x, y) => this.handleStep(x, y),
      onMoveStart: (x, y, nx, ny, duration) => {
        this.followers.advance(x, y, duration);
        const code = this.grid[ny]?.[nx];
        if (this.grid[y]?.[x] === 's') footprint(this, x, y, this.player.facing);
        if (TALL_PLANTS.includes(code)) this.grassCovers.rustle(nx, ny);
        else stepEffect(this, code, nx, ny);
      },
    });
    this.refreshActors();
    this.savePosition();
    this.registry.set('city', this.cityName());
    this.registry.set('cityId', this.fromMap ?? this.map.id);   // compteur de traits de la ville (UIScene)

    this.input.keyboard.on('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') this.tryInteract(e);
    });

    const cam = this.cameras.main;
    cam.roundPixels = true;
    // Bandes autour de la carte (si rien ne les remplit) : couleur de sa tuile de coin.
    // Intérieurs : noir autour de la pièce, comme dans Rouge Feu ; dehors, la couleur du bord de la carte.
    cam.setBackgroundColor(grid[0][0] === 'X' ? 0x000000 : getTile(grid[0][0]).color);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
    // Touche moderne : bords de l'écran légèrement assombris (WebGL uniquement).
    if (!cam.vignetteFX && cam.postFX) {
      cam.vignetteFX = cam.postFX.addVignette(0.5, 0.5, 0.95, 0.18);
      // Lumière selon l'heure ; pas sur une carte du créateur en essai (on la juge toujours en plein jour).
      if (this.scene.key === 'Overworld' && !map.builder) applyTimeOfDay(cam, this.game);
    }
    cam.fadeIn(FADE_MS);
    this.applyAmbience(map);
    // Pièce dans le noir (voir updateDarkness).
    this.darkness = map.dark ? this.createDarkness(map.dark) : null;
    // Rondes de nuit (voir systems/Patrols.js).
    this.patrols = map.patrols && meetsConditions(map.patrols) ? new Patrols(this, map.patrols) : null;
    this.startIdleAnimations();

    this.runEnterEvents();
  }

  // Vie des lieux (ex. les clients d'un pub), quand rien d'autre ne se passe :
  //   PNJ `fidget: true` : il se tourne de temps en temps (vers ses voisins), et trinque parfois d'un petit saut ;
  //   PNJ `pace: [[x, y], [x, y]]` : il va et vient entre ces deux cases (ex. le barman derrière son comptoir).
  //   PNJ `route: [[x, y], …]` : il fait le tour de ces points, en boucle (ex. un militaire en ronde dans la cour), et
  //   regarde un peu autour de lui à chaque point.
  startIdleAnimations() {
    const quiet = () => !this.scripting && !this.dialog?.isOpen && !this.menuOpen && !this.transitioning;
    const turns = ['down', 'left', 'right', 'up'];
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        if (!quiet()) return;
        for (const npc of this.npcs) {
          const d = npc.data;
          if (d.fidget && Math.random() < 0.18) {
            if (Math.random() < 0.3) this.hop(d.id);
            else npc.sprite.setFacing(turns[Phaser.Math.Between(0, 3)]);
          }
          if (d.pace && !npc.pacing && Math.random() < 0.12) {
            npc.pacing = true;
            const [a, b] = d.pace;
            const to = d.x === a[0] && d.y === a[1] ? b : a;
            this.walkNpc(d.id, to).then(() => {
              npc.pacing = false;
              npc.sprite.setFacing('down');
            });
          }
          if (d.route && !npc.pacing && Math.random() < 0.35) {
            npc.pacing = true;
            npc.routeAt = ((npc.routeAt ?? 0) + 1) % d.route.length;
            this.walkNpc(d.id, d.route[npc.routeAt]).then(() => {
              npc.pacing = false;
              npc.sprite.setFacing(turns[Phaser.Math.Between(0, 3)]);
            });
          }
        }
      },
    });
  }

  // Un objet glisse (ex. une pinte sur le comptoir) : il apparaît sur la case `from` d'un petit bond, puis file
  // jusqu'à la case `to` ; il y reste jusqu'à la fin de la visite. `item` : image de la planche des meubles de bar.
  async slideItem(item, [fx, fy], [tx, ty]) {
    const frames = { pint: [112, 18, 5, 6] };
    const tex = this.textures.get('frlg-bar');
    if (!tex.has(item)) tex.add(item, 0, ...frames[item]);
    const image = this.add.image((fx + 0.5) * TILE_SIZE, fy * TILE_SIZE + 6, 'frlg-bar', item).setDepth(9).setScale(0.2);
    sfx('blip');
    await new Promise((resolve) => this.tweens.add({ targets: image, scale: 1, duration: 260, ease: 'Back.easeOut', onComplete: resolve }));
    await this.wait(250);
    await new Promise((resolve) => this.tweens.add({
      targets: image, x: (tx + 0.5) * TILE_SIZE, y: ty * TILE_SIZE + 6, duration: 160 * (Math.abs(tx - fx) + 1), ease: 'Quad.easeOut', onComplete: resolve,
    }));
  }

  // La carte entière est visible, aussi grande que possible dans la fenêtre.
  // Reflets animés sur l'eau (mer, étangs, rivières) : petits éclats qui apparaissent et s'effacent.
  startWaterSparkles() {
    const water = [];
    this.grid.forEach((row, y) => row.forEach((c, x) => {
      if (['~', 'G'].includes(c)) water.push([x, y]);
    }));
    if (!water.length) return;
    const pool = Array.from({ length: 16 }, () => this.add.rectangle(0, 0, 3, 1, 0xffffff).setAlpha(0).setDepth(1));
    let next = 0;
    this.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        const spark = pool[next++ % pool.length];
        const [x, y] = Phaser.Utils.Array.GetRandom(water);
        spark.setPosition(x * TILE_SIZE + 3 + Math.floor(Math.random() * 10), y * TILE_SIZE + 3 + Math.floor(Math.random() * 10));
        this.tweens.add({ targets: spark, alpha: { from: 0, to: 0.85 }, duration: 500, yoyo: true });
      },
    });
  }

  // Vue « Pokémon » : l'écran de Rouge Feu (15 x 10 cases) agrandi d'un facteur entier, centré avec
  // des bandes noires ; la caméra suit le joueur et s'arrête aux bords de la carte. Si la carte est plus
  // petite que l'écran dans un sens, elle reste centrée dans ce sens (le décor autour comble le vide).
  fitCamera() {
    const cam = this.cameras.main;
    const mapW = this.grid[0].length * TILE_SIZE;
    // Carte du créateur bordée d'arbres en bas : la dernière rangée n'est jamais montrée (le bas des arbres de la
    // bordure, troncs et ombres, reste caché ; voir docs/technique/createur-de-cartes.md).
    const mapH = (this.grid.length - (hidesLastRow(this.map.built) ? 1 : 0)) * TILE_SIZE;
    const view = gameView(this.scale);
    const viewW = SCREEN_W;
    const viewH = SCREEN_H;
    cam.setViewport(view.x, view.y, view.w, view.h);
    cam.setZoom(view.zoom);
    cam.setBounds(
      Math.min(0, (mapW - viewW) / 2),
      Math.min(0, (mapH - viewH) / 2),
      Math.max(mapW, viewW),
      Math.max(mapH, viewH),
    );
    cam.startFollow(this.player.sprite, true, 0.18, 0.18);   // suivi adouci
    this.surroundings?.resize(viewW, viewH);
  }

  get dialog() {
    return this.scene.get('UI').dialog;
  }

  propAt(x, y) {
    return this.props.find(({ data: p }) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
  }

  // Porte `when` ouverte (ex. l'échelle de la cabane, posée sur le blé) : praticable même sur une case pleine.
  openDoorAt(x, y) {
    return (this.map.doors ?? []).some((d) => d.when && d.x === x && d.y === y && meetsConditions(d.when));
  }

  npcAt(x, y) {
    return this.npcs.find((n) => n.data.x === x && n.data.y === y);
  }

  // (Re)crée les PNJ et suiveurs selon les drapeaux d'histoire.
  // Un suiveur qui remplace un PNJ (même id) part de la position de celui-ci ; à l'inverse, un PNJ qui remplace
  // un suiveur (même id) apparaît là où était le suiveur (une scénette le fait ensuite marcher, voir walkNpc).
  refreshActors() {
    this.applyAmbience(this.map);
    const wanted = (this.map.npcs ?? []).filter(meetsConditions);
    const stillFollowing = new Set(FOLLOWERS.filter(meetsConditions).map((f) => f.id));
    const followerAt = Object.fromEntries(this.followers.members.filter((m) => !stillFollowing.has(m.id))
      .map((m) => [m.id, { x: m.x, y: m.y, facing: m.sprite.facing }]));
    const leftAt = {};
    this.npcs = this.npcs.filter((n) => {
      if (wanted.includes(n.data)) return true;
      leftAt[n.data.id] = { x: n.data.x, y: n.data.y, facing: n.sprite.facing };
      n.sprite.destroy();
      return false;
    });
    for (const data of wanted) {
      if (this.npcs.some((n) => n.data === data)) continue;
      const from = followerAt[data.id];
      if (from) {
        data.home ??= { x: data.x, y: data.y, facing: data.facing };   // reprend sa place à la prochaine visite
        Object.assign(data, from);
      }
      // `inBed` : couché dans le lit de la case (intérieurs Rouge Feu), `child` pour un enfant.
      const bed = data.inBed && bedAt(this.map, data.x, data.y);
      const sprite = new CharacterSprite(this, data.x, data.y, lookOf(data), data.facing, { bed: bed && { ...bed, child: data.child } });
      if (data.dancing) this.startDancing(sprite, data);
      this.npcs.push({ data, sprite });
    }

    // Obstacles conditionnels (ex. voiture en panne) : dessinés comme un bâtiment, bloquants.
    const wantedProps = (this.map.props ?? []).filter(meetsConditions);
    this.props = this.props.filter((p) => {
      if (wantedProps.includes(p.data)) return true;
      p.graphics.destroy();
      return false;
    });
    for (const data of wantedProps) {
      if (this.props.some((p) => p.data === data)) continue;
      // La voiture de la famille est une image (voir frlgArt.familyCarImage), posée au milieu du bas de son emprise.
      // La cabane des cousins (voir frlgArt, rs-cabane.png) : l'emprise bloquante couvre la plateforme, l'échelle
      // descend sur la case sous son 2e rang, où l'on monte (porte `when` de la carte).
      if (data.type === 'cabane') {
        const bottom = (data.y + data.h + 1) * TILE_SIZE;
        const graphics = this.add.image((data.x + 1) * TILE_SIZE - CABANE_LADDER_X, bottom, FRLG_SHEETS.cabane, cabaneFrame(this, 'hut'))
          .setOrigin(0, 1).setDepth(10 + bottom / 10000);
        this.props.push({ data, graphics });
        continue;
      }
      // Gros arbre feuillu (rs-bigtree.png, 3 cases de large) : l'emprise est son tronc, le feuillage dépasse
      // au-dessus et de chaque côté (on passe derrière).
      if (data.type === 'bigTree') {
        const bottom = (data.y + 1) * TILE_SIZE;
        const graphics = this.add.image((data.x - 1) * TILE_SIZE, bottom, FRLG_SHEETS.bigTree).setOrigin(0, 1).setDepth(10 + (bottom - 1) / 10000);
        this.props.push({ data, graphics });
        continue;
      }
      // Objets posés au sol, dessinés dans le code (voir FLOOR_PROPS) : triés en profondeur avec les personnages.
      if (FLOOR_PROPS[data.type]) {
        const graphics = this.add.graphics().setDepth(10 + ((data.y + 1) * TILE_SIZE) / 10000);
        FLOOR_PROPS[data.type](graphics, data.x * TILE_SIZE, data.y * TILE_SIZE);
        this.props.push({ data, graphics });
        continue;
      }
      if (data.type === 'familyCar') {
        const bottom = (data.y + data.h) * TILE_SIZE - 1;
        const graphics = familyCarImage(this, (data.x + data.w / 2) * TILE_SIZE, bottom, data.facing)
          .setOrigin(0.5, 1).setDepth(10 + bottom / 10000);
        this.props.push({ data, graphics });
        continue;
      }
      const graphics = this.add.graphics().setDepth(5);
      drawBuilding(graphics, data);
      this.props.push({ data, graphics });
    }

    // Décors qui changent avec l'histoire : dessinés ({ kind, x, y, ...options }, voir art/tileArt.js drawDecal) ou
    // en icônes d'objets ({ icons, x, y }, ex. cannes à pêche dans la caisse « À DONNER »).
    const wantedDecals = (this.map.decals ?? []).filter(meetsConditions);
    this.decals = this.decals.filter((d) => {
      if (wantedDecals.includes(d.data)) return true;
      d.graphics.destroy();
      return false;
    });
    for (const data of wantedDecals) {
      if (this.decals.some((d) => d.data === data)) continue;
      // `above` : au-dessus des personnages (ex. tablier d'un pont sous lequel on passe).
      // `floor` : au sol, sous tout le monde (ex. piste de danse).
      const depth = data.above ? 45 : data.floor ? 1.5 : 10 + ((data.y + 1) * TILE_SIZE) / 10000;
      if (data.icons) {
        // Décor en icônes d'objets (ex. cannes à pêche) : [image, x, y, hauteur gardée], dans un conteneur.
        const graphics = this.add.container(data.x * TILE_SIZE, data.y * TILE_SIZE).setDepth(depth);
        for (const [frame, dx, dy, keep] of data.icons) {
          graphics.add(this.add.image(dx, dy, ITEM_ICONS, frame).setOrigin(0).setCrop(0, 0, 32, keep));
        }
        this.decals.push({ data, graphics });
        continue;
      }
      // Guirlande de fanions (art/bunting.js) : fil tendu entre deux points, fanions qui ondulent.
      if (data.kind === 'fanions') {
        this.decals.push({ data, graphics: addBunting(this, data, depth) });
        continue;
      }
      const graphics = this.add.graphics().setDepth(depth);
      drawDecal(graphics, data.kind, data.x * TILE_SIZE, data.y * TILE_SIZE, data);
      this.decals.push({ data, graphics });
    }

    const { tileX, tileY, facing } = this.player;
    // À l'arrivée sur la carte, la file part de la case du joueur ; en cours de partie, un nouveau suiveur sans
    // place à lui (ex. Étienne qui descend de son arbre) apparaît sur une case libre à côté du joueur.
    const arriving = !this.actorsReady;
    this.actorsReady = true;
    this.followers.sync(
      FOLLOWERS.filter(meetsConditions),
      (id) => leftAt[id] ?? this.takeEmerged(id) ?? (arriving ? { x: tileX, y: tileY, facing } : this.besidePlayer()),
    );
  }

  // Un personnage caché (ex. au cache-cache) sort de sa cachette : il apparaît sur la première case de `from` qui
  // n'est pas celle du joueur (bottes de foin, arbre, tonneau…), marche jusqu'à une case libre à côté du joueur et
  // se tourne vers lui. Il attend là ; en devenant suiveur, il part de cette case (voir takeEmerged).
  async emerge({ id, name, from }) {
    const [fx, fy] = from.find(([x, y]) => x !== this.player.tileX || y !== this.player.tileY) ?? from[0];
    const target = this.besidePlayer();
    const sprite = new CharacterSprite(this, fx, fy, lookOf({ id, name }), this.directionTo({ x: fx, y: fy }, target));
    const at = { x: fx, y: fy };
    const path = this.pathTo(at, target.x, target.y, [this.player.tileX, this.player.tileY]) ?? [[target.x, target.y]];
    for (const xy of path) await this.stepTo(sprite, at, xy, { remember: false });
    this.faceEachOther(sprite, at);
    this.emerged[id] = { sprite, ...at, facing: sprite.facing };
  }

  // Place d'un personnage sorti de sa cachette (voir emerge), qui devient suiveur : son image provisoire est retirée.
  takeEmerged(id) {
    const e = this.emerged[id];
    if (!e) return null;
    e.sprite.destroy();
    delete this.emerged[id];
    return { x: e.x, y: e.y, facing: e.facing };
  }

  // Case libre à côté du joueur (de préférence derrière lui, puis sur les côtés, puis devant), tournée vers lui ;
  // sa propre case s'il est cerné.
  besidePlayer() {
    const { tileX, tileY, facing } = this.player;
    const sides = facing === 'up' || facing === 'down' ? ['left', 'right'] : ['up', 'down'];
    for (const dir of [OPPOSITE[facing], ...sides, facing]) {
      const x = tileX + DIRECTIONS[dir].dx;
      const y = tileY + DIRECTIONS[dir].dy;
      if (this.cellFree(x, y)) return { x, y, facing: OPPOSITE[dir] };
    }
    return { x: tileX, y: tileY, facing };
  }

  // Case où un personnage peut se poser : praticable, sans PNJ, objet ni suiveur.
  cellFree(x, y) {
    return this.tileWalkable(x, y) && !this.npcAt(x, y) && !this.propAt(x, y)
      && !this.followers.members.some((m) => m.x === x && m.y === y);
  }

  npcById(id) {
    return this.npcs.find((n) => n.data.id === id);
  }

  // Un pas d'une case : l'image `sprite` se tourne et marche jusqu'à la case [x, y] ; sa position `d` ({ x, y }) est
  // mise à jour tout de suite. `remember` : garde la place de départ d'un PNJ (d.home, reprise à la visite suivante).
  stepTo(sprite, d, [x, y], { remember = true, facing } = {}) {
    if (remember) d.home ??= { x: d.x, y: d.y, facing: d.facing };
    sprite.setFacing(facing ?? this.directionTo(d, { x, y }));
    sprite.walkStep(WALK_DURATION);
    d.x = x;
    d.y = y;
    const [px, py] = tileCenter(x, y);
    return new Promise((resolve) => this.tweens.add({
      targets: sprite, x: px, y: py, duration: WALK_DURATION,
      onUpdate: () => sprite.updateDepth(), onComplete: resolve,
    }));
  }

  async runEnterEvents() {
    const events = (this.map.events ?? []).filter((e) => e.on === 'enter' && meetsConditions(e));
    for (const event of events) await this.runScript(event.steps);
  }

  // Scénette pendant laquelle le joueur ne bouge pas et ne peut rien lancer d'autre.
  // Même si une étape échoue, le joueur retrouve toujours la main.
  async runScript(steps) {
    this.scripting = true;
    this.player.frozen = true;
    try {
      await this.runSteps(steps, true);
    } catch (error) {
      console.error('Scénette interrompue', error);
    } finally {
      this.scripting = false;
      if (!this.transitioning) this.player.frozen = false;
    }
  }

  // Scénette : liste d'étapes jouées dans l'ordre. Chaque étape peut avoir des conditions (ifFlags,
  // unlessFlags, ifItems, unlessItems, ifSouvenirs, unlessSouvenirs), vérifiées au moment où elle est jouée.
  //   { say: [pages], speaker? }         texte (avec le nom de la personne qui parle)
  //   { talk: npcId }                    le PNJ s'avance jusqu'au joueur, se tourne vers lui et dit son dialogue
  //   { approach: npcId }                le PNJ s'avance jusqu'au joueur et ils se font face
  //   { comeBeside: npcId }              le PNJ vient sur une case libre à côté du joueur (même s'il l'enferme le temps
  //                                      de la scène : la scénette doit le faire repartir), tourné vers lui
  //   { faceTo: npcId }                  le joueur et le PNJ se tournent l'un vers l'autre
  //   { allFace: npcId }                 tout le monde dans la pièce (Pierre, PNJ, suiveurs) se tourne vers ce PNJ
  //   { goTo: [x, y], facing? }          Pierre marche jusqu'à la case (plus court chemin), puis se tourne
  //   { setFlag } / { setFlags: [] }     drapeaux d'histoire (les personnages sont mis à jour)
  //   { trait: TRAITS.x }                vertu reçue (voir data/story.js) : « Pierre a reçu la vertu X ! »
  //   { useTrait: TRAITS.x }             une vertu débloque la situation : « Pierre utilise X ! » (à mettre sous
  //                                      condition `ifSouvenirs: [TRAITS.x.id]`)
  //   { give: item, text? }              objet reçu (message `text`, sinon « Tu as reçu : X. »)
  //   { take: itemId }                   objet donné (quitte l'inventaire)
  //   { black: true | false }            écran noir immédiat / retour de l'image en fondu
  //   { sea: true | false }              bruit des vagues
  //   { face: { npcId | 'player': direction } }
  //   { emote: npcId | 'player' | [x, y], kind }  bulle d'émotion au-dessus d'une tête ou d'une case (voir
  //                                      kind : 'dots' « … » ou 'surprise' « ! », voir emote)
  //   { sound: nom }                     bruitage (voir systems/audio.js, sfx)
  //   { emerge: { id, name, from: [[x, y], …] } }  un personnage sort de sa cachette et vient à côté du joueur
  //   { push: npcId }                    le joueur pousse le PNJ d'une case, dans le sens où il regarde (pushNpc)
  //   { resetNpcs: [ids] }               les PNJ poussés reprennent leur place de départ
  //   { opening: { postcard, text } }    ouverture d'une ville : carte postale (id de ville) puis le texte de temps
  //   { askWord: { title, key, max? } }  le joueur écrit un mot (gardé dans memo sous `key`, voir systems/memo.js) ;
  //                                      dans les répliques `say`, `{key}` est remplacé par ce mot
  //   { steps: [étapes] }                sous-scénette, jouée si les conditions de l'étape sont remplies
  //   { quiz: { question, choices, answer, wrong?, speaker? } }  question reposée jusqu'à la bonne réponse ;
  //                                      `wrong` : réplique par mauvaise réponse ({ réponse: [pages], default })
  //   { dance: npcId | [ids] }           le PNJ (ou plusieurs) et Pierre dansent un instant, notes de musique
  //   { gather: [ids], area: [x, y, w, h] }  PNJ et suiveurs marchent jusqu'aux cases libres de la zone
  //   { slide: 'pint', from: [x, y], to: [x, y] | 'player' }  un objet apparaît et glisse (ex. pinte sur le
  //                                      comptoir), jusqu'à la case devant Pierre avec 'player'
  //   { walk: npcId, to: [x, y], lead?, block?, then? }  le PNJ marche jusqu'à la case (voir walkNpc)
  //   { walkAll: [[id, [x, y]], …] }    plusieurs PNJ marchent en même temps, chacun vers sa case ; on attend qu'ils
  //                                      soient tous arrivés
  //   { walkLine: [ids], to: [x, y], block?, then? }  les PNJ marchent en file, l'un derrière l'autre (walkLine)
  //   { choose: question, speaker?, choices: [{ label, steps }] }
  //   { wait: ms }  { travel: warp }  { end: true } (arrête la scénette)
  //   { drive: type } : le joueur monte dans la voiture (prop), qui s'en va
  //   { hop: id | [ids], times? } : petits sauts sur place ('player' : Pierre)
  //   { cheer: [ids] } : tous sautent ensemble, des notes et des cœurs s'envolent
  //   { darts: { opponent, win, lose, onWin?, onLose? } } : partie de fléchettes, trois lancers (systems/Darts.js), contre
  //                                      un adversaire au score tiré au hasard ; gagnée ou perdue, la scénette continue
  //                                      (après les étapes `onWin` ou `onLose`, s'il y en a)
  // Renvoie true si la scénette s'est arrêtée sur `end` (ou un voyage).
  //   Fin de scène : une marche bloquante (`block`) suivie seulement de drapeaux (setFlag) ne fait plus attendre le
  //   joueur ; il reprend la main pendant que le PNJ s'en va, et ces drapeaux sont posés à son arrivée (voir walkNpc).
  async runSteps(steps, tail = false) {
    // Les étapes après `i` ne sont-elles que des drapeaux (ou rien) ? Renvoie alors ces drapeaux, sinon null.
    const trailingFlags = (i) => {
      const out = [];
      for (const rest of steps.slice(i + 1)) {
        const keys = Object.keys(rest).filter((k) => !CONDITION_KEYS.includes(k) && k !== 'end');
        if (keys.some((k) => k !== 'setFlag' && k !== 'setFlags')) return null;
        if (meetsConditions(rest)) out.push(...[rest.setFlag, ...(rest.setFlags ?? [])].filter(Boolean));
      }
      return out;
    };
    for (const [i, step] of steps.entries()) {
      if (!meetsConditions(step)) continue;
      const atTail = tail ? trailingFlags(i) : null;
      if (atTail && step.block && (step.walk || step.walkLine)) {
        const then = [...(step.then ?? []), ...atTail];
        if (step.walk) this.walkNpc(step.walk, step.to, { lead: step.lead, then });
        else this.walkLine(step.walkLine, step.to, { then });
        return steps.slice(i + 1).some((rest) => rest.end && meetsConditions(rest));
      }
      if (step.black !== undefined) await this.setCurtain(step.black);
      if (step.sea !== undefined) setSeaAmbience(step.sea);
      if (step.face) this.faceActors(step.face);
      if (step.emote) await this.emote(step.emote, step.kind);
      if (step.sound) sfx(step.sound);
      if (step.gather) await this.gather(step.gather, step.area);
      if (step.slide) {
        const { x, y } = this.player.facingTile();
        await this.slideItem(step.slide, step.from, step.to === 'player' ? [x, y] : step.to);
      }
      if (step.dance) await this.dance(step.dance);
      if (step.darts) {
        const won = await this.dartsGame(step.darts);
        const then = won ? step.darts.onWin : step.darts.onLose;
        if (then && await this.runSteps(then)) return true;
      }
      if (step.wait) await this.wait(step.wait);
      if (step.opening) await this.playOpening(step.opening);
      if (step.emerge) await this.emerge(step.emerge);
      if (step.push) await this.pushNpc(this.npcById(step.push), this.player.facing);
      if (step.resetNpcs) this.resetNpcs(step.resetNpcs);
      if (step.askWord) memo.set(step.askWord.key, await this.scene.get('UI').askWord(step.askWord));
      if (step.say) await this.dialog.open(step.say.map(memo.fill), { speaker: step.speaker });
      if (step.approach) await this.approach(step.approach);
      if (step.comeBeside) await this.comeBeside(step.comeBeside);
      if (step.faceTo) {
        const npc = this.npcById(step.faceTo);
        if (npc) this.faceEachOther(npc.sprite, npc.data);
      }
      if (step.allFace) this.allFace(step.allFace);
      if (step.goTo) await this.walkPlayer(step.goTo, step.facing);
      if (step.drive) await this.driveAway(step.drive);
      if (step.hop) await this.hop(step.hop, step.times);
      if (step.cheer) await this.cheer(step.cheer);
      if (step.walk) {
        const walking = this.walkNpc(step.walk, step.to, { lead: step.lead, then: step.then });
        if (step.block) await walking;
      }
      if (step.walkAll) await Promise.all(step.walkAll.map(([id, to]) => this.walkNpc(id, to)));
      if (step.walkLine) {
        const walking = this.walkLine(step.walkLine, step.to, { then: step.then });
        if (step.block) await walking;
      }
      if (step.talk) {
        const npc = this.npcById(step.talk);
        if (npc) {
          await this.approach(step.talk);
          await this.talkTo(npc.data);
        }
      }
      if (step.quiz) await this.quiz(step.quiz);
      if (step.steps && await this.runSteps(step.steps, Boolean(tail && (step.end || trailingFlags(i))))) return true;
      if (step.choose) {
        const index = await this.dialog.choose(step.choose, step.choices.map((c) => c.label), { speaker: step.speaker });
        if (await this.runSteps(step.choices[index]?.steps ?? [], Boolean(tail && trailingFlags(i)))) return true;
      }
      if (step.give && items.add(step.give)) {
        this.refreshActors();
        sfx('item');
        await this.dialog.open([step.text ?? `Tu as reçu : ${step.give.name}.`], { item: step.give });
      }
      if (step.take && items.remove(step.take)) this.refreshActors();
      if (step.trait && souvenirs.add(step.trait)) {
        sfx('trait');
        await this.dialog.open([`Pierre a reçu la vertu ${step.trait.name.toUpperCase()} !`]);
        this.refreshActors();                       // PNJ et suiveurs qui dépendent du trait
      }
      if (step.useTrait) {
        souvenirs.use(step.useTrait.id);
        sfx('trait');
        await this.dialog.open([`Pierre utilise ${step.useTrait.name.toUpperCase()} !`]);
      }
      const raised = [step.setFlag, ...(step.setFlags ?? [])].filter(Boolean);
      if (raised.length) {
        raised.forEach(flags.add);
        this.refreshActors();
      }
      if (step.travel) {
        this.travel(step.travel);
        return true;
      }
      if (step.end) return true;
    }
    return false;
  }

  // Le joueur monte dans la voiture (prop de type `type`), qui démarre en tremblant puis file du côté où elle
  // regarde en accélérant, avec des bouffées de fumée. `turnUp` (case x) : arrivée à cette colonne, elle tourne et
  // part vers le haut de la carte, vue de dos.
  async driveAway(type) {
    const prop = this.props.find((p) => p.data.type === type);
    const car = prop?.graphics;
    if (!car) return;
    const dir = prop.data.facing === 'left' ? -1 : 1;                 // elle part du côté où elle regarde
    const { turnUp } = prop.data;
    this.player.sprite.setVisible(false);
    sfx('door');
    await this.wait(300);
    sfx('engine');
    const shake = this.tweens.add({ targets: car, y: car.y - 1, duration: 100, yoyo: true, repeat: -1, ease: 'Stepped' });
    await this.wait(500);
    let up = false;
    const smoke = this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const [sx, sy, mx, my] = up ? [car.x + 6, car.y + 2, 4, 10] : [car.x - dir * 22, car.y - 5, -dir * 14, -6];
        const puff = this.add.rectangle(sx, sy, 3, 3, 0xd8d8d0).setDepth(car.depth);
        this.tweens.add({ targets: puff, x: puff.x + mx, y: puff.y + my, scale: 2, alpha: 0, duration: 600, onComplete: () => puff.destroy() });
      },
    });
    const drive = (props, duration, ease) => new Promise((resolve) => this.tweens.add({
      targets: car, ...props, duration, ease, onComplete: resolve,
    }));
    if (turnUp === undefined) {
      await drive({ x: car.x + dir * 12 * TILE_SIZE }, 2200, 'Quad.easeIn');
    } else {
      await drive({ x: turnUp * TILE_SIZE }, 900, 'Quad.easeIn');
      shake.stop();
      car.setFrame('back');
      up = true;
      await drive({ y: car.y - 12 * TILE_SIZE }, 1800, 'Quad.easeIn');
    }
    smoke.remove();
  }

  // Pierre marche jusqu'à la case [tx, ty] (plus court chemin, sans traverser les PNJ), puis regarde `facing`.
  async walkPlayer([tx, ty], facing) {
    const p = this.player;
    const path = this.pathTo({ x: p.tileX, y: p.tileY }, tx, ty) ?? [];
    for (const [x, y] of path) {
      p.facing = this.directionTo({ x: p.tileX, y: p.tileY }, { x, y });
      p.sprite.setFacing(p.facing);
      this.followers.advance(p.tileX, p.tileY, WALK_DURATION);
      p.sprite.walkStep(WALK_DURATION);
      const [px, py] = tileCenter(x, y);
      await new Promise((resolve) => this.tweens.add({
        targets: p.sprite, x: px, y: py, duration: WALK_DURATION,
        onUpdate: () => p.sprite.updateDepth(0.001), onComplete: resolve,
      }));
      p.tileX = x;
      p.tileY = y;
    }
    if (facing) {
      p.facing = facing;
      p.sprite.setFacing(facing);
    }
    this.savePosition();
  }

  // Le PNJ s'avance vers le joueur (plus court chemin jusqu'à une case voisine), puis ils se font face.
  async approach(id) {
    const npc = this.npcById(id);
    if (!npc) return;
    for (const xy of this.pathNextToPlayer(npc.data) ?? []) await this.stepTo(npc.sprite, npc.data, xy);
    this.faceEachOther(npc.sprite, npc.data);
  }

  // Le PNJ `id` vient sur une case libre à côté du joueur (voir besidePlayer), puis se tourne vers lui.
  async comeBeside(id) {
    const npc = this.npcById(id);
    if (!npc) return;
    const me = { x: this.player.tileX, y: this.player.tileY };
    if (Math.abs(npc.data.x - me.x) + Math.abs(npc.data.y - me.y) !== 1) {
      const { x, y } = this.besidePlayer();
      if (x !== me.x || y !== me.y) await this.walkNpc(id, [x, y]);
    }
    npc.data.facing = this.directionTo(npc.data, me);
    npc.sprite.setFacing(npc.data.facing);
  }

  // Le joueur et un personnage (image `sprite`, position `d`) se tournent l'un vers l'autre.
  faceEachOther(sprite, d) {
    const me = { x: this.player.tileX, y: this.player.tileY };
    d.facing = this.directionTo(d, me);
    sprite.setFacing(d.facing);
    this.player.facing = OPPOSITE[d.facing];
    this.player.sprite.setFacing(this.player.facing);
  }

  // Cases à parcourir pour arriver à côté du joueur (sans la case de départ), [] s'il y est déjà,
  // null si le chemin est bloqué ou trop long. Le PNJ ne s'arrête jamais sur une case qui enfermerait
  // le joueur (voir leavesWayOut).
  pathNextToPlayer(from) {
    const { tileX: px, tileY: py } = this.player;
    const free = (x, y) => this.tileWalkable(x, y) && !(x === px && y === py) && !this.npcAt(x, y) && !this.propAt(x, y);
    const beside = (x, y) => Math.abs(x - px) + Math.abs(y - py) === 1 && this.leavesWayOut(x, y, from);
    if (beside(from.x, from.y)) return [];
    const prev = new Map([[`${from.x},${from.y}`, null]]);
    let frontier = [[from.x, from.y]];
    for (let depth = 0; depth < 20 && frontier.length; depth++) {
      const next = [];
      for (const [x, y] of frontier) {
        for (const { dx, dy } of Object.values(DIRECTIONS)) {
          const nx = x + dx;
          const ny = y + dy;
          const key = `${nx},${ny}`;
          if (prev.has(key) || !free(nx, ny)) continue;
          prev.set(key, [x, y]);
          if (beside(nx, ny)) {
            const path = [];
            for (let c = [nx, ny]; c && !(c[0] === from.x && c[1] === from.y); c = prev.get(`${c[0]},${c[1]}`)) path.unshift(c);
            return path;
          }
          next.push([nx, ny]);
        }
      }
      frontier = next;
    }
    return null;
  }

  // Le PNJ `id` marche jusqu'à la case `to` [x, y] (plus court chemin), sans bloquer le joueur. Il attend si le
  // joueur lui barre la route ; avec `lead`, il s'arrête aussi quand le joueur traîne (à plus de 6 cases).
  // `then` : drapeaux levés à l'arrivée (ex. le PNJ entre dans une maison et disparaît).
  async walkNpc(id, [tx, ty], { lead = false, then = [] } = {}) {
    const npc = this.npcById(id);
    if (!npc) return;
    then.forEach((f) => this.pendingWalkFlags.add(f));
    const d = npc.data;
    const alive = () => !this.leaving && this.npcs.includes(npc);
    let stuck = 0;                                  // au bout d'une dizaine de secondes bloqué, on abandonne
    const playerOnTarget = () => this.player.tileX === tx && this.player.tileY === ty
      && Math.abs(d.x - tx) + Math.abs(d.y - ty) === 1;            // le joueur occupe la case visée : on s'arrête à côté
    while (alive() && (d.x !== tx || d.y !== ty) && !playerOnTarget() && stuck < 40) {
      // On contourne le joueur si possible ; sinon on attend qu'il se pousse.
      const path = this.pathTo(d, tx, ty, [this.player.tileX, this.player.tileY]) ?? this.pathTo(d, tx, ty);
      const far = () => Math.abs(this.player.tileX - d.x) + Math.abs(this.player.tileY - d.y) > 6;
      if (!path?.length || (lead && far())) {
        if (!path?.length) stuck++;
        await this.wait(250);
        continue;
      }
      const [x, y] = path[0];
      if (this.player.tileX === x && this.player.tileY === y) {
        stuck++;
        await this.wait(250);
        continue;
      }
      stuck = 0;
      await this.stepTo(npc.sprite, d, [x, y]);
    }
    if (!alive()) return;
    then.forEach((f) => this.pendingWalkFlags.delete(f));
    d.facing = npc.sprite.facing;
    if (then.length) {
      then.forEach(flags.add);
      this.refreshActors();
    }
  }

  // Les PNJ `ids` marchent en file jusqu'à `to` : le premier ouvre la route (plus court chemin, par les chemins), chaque
  // suivant prend la case que celui de devant vient de quitter (s'il n'est pas juste derrière, on l'attend).
  // `then` : drapeaux levés quand le premier arrive. Le joueur qui barre la route les fait attendre.
  async walkLine(ids, [tx, ty], { then = [] } = {}) {
    const line = ids.map((id) => this.npcById(id)).filter(Boolean);
    if (!line.length) return;
    then.forEach((f) => this.pendingWalkFlags.add(f));
    const alive = () => !this.leaving && line.every((n) => this.npcs.includes(n));
    const step = (npc, xy) => this.stepTo(npc.sprite, npc.data, xy);
    const near = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
    let stuck = 0;
    const [leader] = line;
    while (alive() && (leader.data.x !== tx || leader.data.y !== ty) && stuck < 40) {
      const before = line.map((n) => ({ x: n.data.x, y: n.data.y }));
      // Un suiveur décroché rejoint d'abord celui de devant, qui l'attend.
      const late = line.findIndex((n, i) => i > 0 && !near(n.data, before[i - 1]));
      if (late > 0) {
        const me = line[late].data;
        const p = this.pathTo(me, before[late - 1].x, before[late - 1].y, [this.player.tileX, this.player.tileY], [line[late - 1].data]);
        if (p?.length > 1) await step(line[late], p[0]);
        else {
          stuck++;
          await this.wait(250);
        }
        continue;
      }
      // Le premier passe à travers ceux de sa file (s'il croise un suiveur, ils échangent leurs places).
      const path = this.pathTo(leader.data, tx, ty, [this.player.tileX, this.player.tileY], line.map((n) => n.data));
      const next = path?.[0];
      if (!next || (next[0] === this.player.tileX && next[1] === this.player.tileY)) {
        stuck++;
        await this.wait(250);
        continue;
      }
      stuck = 0;
      // Chacun prend la case que celui de devant occupait avant ce pas.
      await Promise.all(line.map((n, i) => step(n, i === 0 ? next : [before[i - 1].x, before[i - 1].y])));
    }
    if (!alive()) return;
    then.forEach((f) => this.pendingWalkFlags.delete(f));
    line.forEach((n) => { n.data.facing = n.sprite.facing; });
    if (then.length) {
      then.forEach(flags.add);
      this.refreshActors();
    }
  }

  // Plus court chemin (cases, sans la case de départ) jusqu'à (tx, ty), sans passer par les autres PNJ. Les PNJ
  // passent par les chemins (cases `road`, voir data/tiles.js) : une case hors chemin compte comme OFF_ROAD pas.
  // `ignore` : PNJ qu'on traverse quand même (ex. ceux d'une même file, voir walkLine).
  pathTo(from, tx, ty, avoid = null, ignore = []) {
    const OFF_ROAD = 5;
    const W = this.grid[0].length;
    const key = (x, y) => y * W + x;
    // Cases occupées, calculées une fois : PNJ (sauf `from` et `ignore`) et case évitée.
    const taken = new Set(this.npcs.filter((n) => n.data !== from && !ignore.includes(n.data)).map((n) => key(n.data.x, n.data.y)));
    if (avoid) taken.add(key(avoid[0], avoid[1]));
    const free = (x, y) => x >= 0 && x < W && this.tileWalkable(x, y) && !taken.has(key(x, y)) && !this.propAt(x, y);
    const cost = (x, y) => (getTile(this.grid[y][x]).road ? 1 : OFF_ROAD);
    // Dijkstra par seaux (coûts entiers et petits).
    const start = key(from.x, from.y);
    const best = new Map([[start, 0]]);
    const prev = new Map([[start, null]]);
    const buckets = [[[from.x, from.y]]];
    for (let d = 0; d < buckets.length; d++) {
      for (const [x, y] of buckets[d] ?? []) {
        if (best.get(key(x, y)) !== d) continue;                 // déjà atteint par un chemin plus court
        if (x === tx && y === ty) {
          const path = [];
          for (let c = [x, y]; c && key(c[0], c[1]) !== start; c = prev.get(key(c[0], c[1]))) path.unshift(c);
          return path;
        }
        for (const { dx, dy } of Object.values(DIRECTIONS)) {
          const nx = x + dx;
          const ny = y + dy;
          const k = key(nx, ny);
          if (best.get(k) <= d || !free(nx, ny)) continue;        // déjà mieux atteint, ou bloqué
          const nd = d + cost(nx, ny);
          if (best.get(k) <= nd) continue;
          best.set(k, nd);
          prev.set(k, [x, y]);
          (buckets[nd] ??= []).push([nx, ny]);
        }
      }
    }
    return null;
  }

  // Ambiance de la carte, selon l'histoire : nuit (filtre sombre, halos des réverbères et des enseignes),
  // petit matin bleuté, ou pluie. map.night / map.dawn / map.rain : conditions (ifFlags…) ; map.night.lights :
  // halos en plus des réverbères ('l'), [x, y, couleur].
  // Recalculée quand l'histoire avance (voir refreshActors) : une scénette qui fait tomber la nuit ou se lever le jour
  // change l'ambiance tout de suite, sans ressortir de la pièce.
  applyAmbience(map) {
    const on = (spec) => spec && meetsConditions(spec);
    const night = on(map.night);
    const dawn = !night && on(map.dawn);
    const key = night ? 'night' : dawn ? 'dawn' : 'day';
    if (key === this.ambienceKey) return;
    const first = this.ambienceKey === undefined;
    this.ambienceKey = key;
    this.ambience?.destroy();
    this.ambience = this.add.container(0, 0).setDepth(40);
    const W = this.grid[0].length * TILE_SIZE;
    const H = this.grid.length * TILE_SIZE;
    const M = 40 * TILE_SIZE;
    if (night || dawn) {
      this.ambience.add(this.add.rectangle(-M, -M, W + 2 * M, H + 2 * M, night ? 0x0c1030 : 0x5070b0, night ? 0.58 : 0.28)
        .setOrigin(0));
    }
    if (night) {
      const lamps = [];
      this.grid.forEach((row, y) => row.forEach((c, x) => { if (c === 'l') lamps.push([x, y, 0xffd070]); }));
      // Halo chaud et doux : trois disques superposés, de plus en plus petits, qui respirent doucement.
      for (const [x, y, color] of [...lamps, ...(map.night.lights ?? [])]) {
        const cx = x * TILE_SIZE + 8;
        const cy = y * TILE_SIZE + 4;
        const glow = this.add.container(0, 0);
        for (const [w, a] of [[46, 0.1], [30, 0.14], [16, 0.22]]) glow.add(this.add.ellipse(cx, cy, w, w * 0.8, color, a));
        this.ambience.add(glow);
        this.tweens.add({ targets: glow, alpha: 0.7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // map.night.doorLamps : une petite applique au-dessus de chaque porte ('D'), qui éclaire le seuil.
      if (map.night.doorLamps) {
        this.grid.forEach((row, y) => row.forEach((c, x) => { if (c === 'D') this.addDoorLamp(x, y); }));
      }
    }
    if (first && !night && !dawn && on(map.rain)) this.startRain();
  }

  // Applique au-dessus d'une porte, la nuit : le boîtier (sur le mur, au-dessus de la porte), un petit halo chaud
  // autour, et une flaque de lumière sur le seuil. Lumière additive : elle éclaire le voile de la nuit au lieu de le
  // teinter.
  addDoorLamp(x, y) {
    const cx = x * TILE_SIZE + 8;
    const top = y * TILE_SIZE - 5;                     // sur le mur, juste au-dessus du chambranle
    const lamp = this.add.container(0, 0);
    const add = (o) => lamp.add(o.setBlendMode(Phaser.BlendModes.ADD));
    add(this.add.ellipse(cx, (y + 1) * TILE_SIZE + 3, 22, 9, 0xffc860, 0.16));         // le seuil éclairé
    add(this.add.ellipse(cx, (y + 1) * TILE_SIZE + 2, 12, 5, 0xffd890, 0.16));
    for (const [w, a] of [[18, 0.12], [10, 0.2]]) add(this.add.ellipse(cx, top + 1, w, w * 0.75, 0xffd070, a));
    lamp.add(this.add.rectangle(cx, top - 1, 4, 1, 0x403020));                              // le boîtier
    lamp.add(this.add.rectangle(cx, top + 1, 4, 3, 0xfff0b0));
    this.ambience.add(lamp);
    this.tweens.add({ targets: lamp, alpha: 0.82, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Pluie fine : traits clairs qui tombent en biais sur tout l'écran.
  startRain() {
    const g = this.add.graphics().setDepth(42).setScrollFactor(0);
    const drops = Array.from({ length: 70 }, () => ({ x: Math.random() * 400, y: Math.random() * 260, v: 3 + Math.random() * 2 }));
    this.events.on('update', () => {
      // Fixé à l'écran : avec le zoom, la zone visible est centrée sur le milieu de la caméra.
      const cam = this.cameras.main;
      const vw = cam.width / cam.zoom;
      const vh = cam.height / cam.zoom;
      const ox = (cam.width - vw) / 2;
      const oy = (cam.height - vh) / 2;
      g.clear();
      g.lineStyle(1, 0xc8d8f0, 0.55);
      for (const d of drops) {
        d.y += d.v;
        d.x -= d.v * 0.3;
        if (d.y > vh) { d.y = -6; d.x = Math.random() * (vw + 40); }
        g.lineBetween(ox + d.x, oy + d.y, ox + d.x - 2, oy + d.y + 6);
      }
    });
  }

  // Vrai si, un PNJ venu de `from` se tenant en (x, y), le joueur peut encore aller loin : jusqu'à une sortie
  // ('E') dans un intérieur, ou sur au moins 40 cases dehors.
  leavesWayOut(x, y, from) {
    const blocked = (cx, cy) => (cx === x && cy === y)
      || (!(cx === from.x && cy === from.y) && (this.npcAt(cx, cy) || this.propAt(cx, cy)))
      || !this.tileWalkable(cx, cy);
    const start = `${this.player.tileX},${this.player.tileY}`;
    const seen = new Set([start]);
    const queue = [[this.player.tileX, this.player.tileY]];
    const interior = this.scene.key === 'Interior';
    // Sorties d'un intérieur : tapis de sortie et escaliers (ex. le couloir des casiers n'a que des escaliers).
    const exit = (cx, cy) => {
      const code = this.grid[cy]?.[cx];
      return code !== undefined && (getTile(code).exit || getTile(code).stairs);
    };
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (interior ? exit(cx, cy) : seen.size >= 40) return true;
      for (const { dx, dy } of Object.values(DIRECTIONS)) {
        const key = `${cx + dx},${cy + dy}`;
        if (seen.has(key) || blocked(cx + dx, cy + dy)) continue;
        seen.add(key);
        queue.push([cx + dx, cy + dy]);
      }
    }
    return false;
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // Rideau noir de l'interface (sous les dialogues) : posé d'un coup, levé en fondu.
  setCurtain(on) {
    const curtain = this.scene.get('UI').curtain;
    if (on) {
      curtain.setAlpha(1);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.tweens.add({ targets: curtain, alpha: 0, duration: 900, onComplete: resolve });
    });
  }

  // Ouverture d'une ville : carte postale (image d'accueil) en fondu, texte de temps, puis le jeu.
  async playOpening({ postcard, text }) {
    const ui = this.scene.get('UI');
    ui.curtain.setAlpha(0);
    const hide = ui.showPostcard(postcard);
    this.events.once('shutdown', hide);             // la carte quitte l'écran même si la scène s'arrête avant
    await this.wait(800);
    await this.dialog.open([text].flat());
    this.events.off('shutdown', hide);
    await hide();
  }

  // Pousser un PNJ (`push`, ex. les poules de l'enclos) : A face à lui, il avance d'une case dans le sens où regarde
  // le joueur, si la case est libre (sinon, sa réplique `dialogue`). Arrivé sur une case `push.exit`, il s'échappe :
  // réplique `push.escaped` et drapeau `push.flag` (le PNJ disparaît). Voir aussi l'étape `resetNpcs`.
  async pushNpc(npc, dir) {
    const d = npc.data;
    const tx = d.x + DIRECTIONS[dir].dx;
    const ty = d.y + DIRECTIONS[dir].dy;
    if (!this.cellFree(tx, ty)) {
      sfx('bump');
      await this.dialog.open(d.dialogue ?? []);
      return;
    }
    sfx('rustle');
    await this.stepTo(npc.sprite, d, [tx, ty], { facing: dir });
    if ((d.push.exit ?? []).some(([ex, ey]) => ex === tx && ey === ty)) {
      if (d.push.escaped) await this.dialog.open(d.push.escaped);
      flags.add(d.push.flag);
      this.refreshActors();
    }
  }

  // Les PNJ `ids` poussés (voir pushNpc) reprennent leur place de départ.
  resetNpcs(ids) {
    for (const npc of this.npcs.filter((n) => ids.includes(n.data.id) && n.data.home)) {
      restoreHome(npc.data);
      const [px, py] = tileCenter(npc.data.x, npc.data.y);
      npc.sprite.setPosition(px, py).setFacing(npc.data.facing);
      npc.sprite.updateDepth();
    }
  }

  actorSprite(id) {
    if (id === 'player') return this.player.sprite;
    return this.npcById(id)?.sprite ?? this.followers.members.find((m) => m.id === id)?.sprite;
  }

  faceActors(facing) {
    for (const [id, dir] of Object.entries(facing)) this.actorSprite(id)?.setFacing(dir);
  }

  // Petits sauts sur place (un personnage qui parle avec entrain, ou la joie de toute la bande).
  async hop(ids, times = 1) {
    const sprites = [ids].flat().map((id) => this.actorSprite(id)).filter(Boolean);
    for (let i = 0; i < times; i++) {
      await Promise.all(sprites.map((sprite) => new Promise((resolve) => this.tweens.add({
        targets: sprite.image, y: sprite.image.y - 4, duration: 110, yoyo: true, ease: 'Quad.easeOut', onComplete: resolve,
      }))));
    }
  }

  // Toute la bande saute de joie trois fois, des notes et des cœurs s'envolent au-dessus des têtes.
  async cheer(ids) {
    this.ensureMusicNote();
    if (!this.textures.exists('heart')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x302030, 1).fillRect(1, 0, 2, 1).fillRect(4, 0, 2, 1).fillRect(0, 1, 7, 3).fillRect(1, 4, 5, 1).fillRect(2, 5, 3, 1).fillRect(3, 6, 1, 1);
      g.fillStyle(0xf04868, 1).fillRect(1, 1, 2, 2).fillRect(4, 1, 2, 2).fillRect(1, 3, 5, 1).fillRect(2, 4, 3, 1).fillRect(3, 5, 1, 1);
      g.fillStyle(0xf8b8c8, 1).fillRect(1, 1, 1, 1);
      g.generateTexture('heart', 7, 7);
      g.destroy();
    }
    const sprites = ids.map((id) => this.actorSprite(id)).filter(Boolean);
    for (let beat = 0; beat < 3; beat++) {
      sfx(beat === 2 ? 'confirm' : 'select');
      sprites.forEach((sprite, i) => {
        const icon = this.add.image(sprite.x + Phaser.Math.Between(-5, 5), sprite.y - 20, (i + beat) % 2 ? 'heart' : 'music-note').setDepth(50);
        this.tweens.add({ targets: icon, y: icon.y - 16, alpha: 0, duration: 1000, onComplete: () => icon.destroy() });
      });
      await this.hop(ids);
      await this.wait(120);
    }
  }

  // Bulle d'émotion au-dessus de la tête d'un personnage ('player' : Pierre) ou d'une case [x, y] : la petite bulle
  // blanche « ! » (kind 'surprise') ou « … » ('dots') de l'indice d'interaction (systems/effects.js). Elle apparaît
  // d'un petit bond, reste un instant, puis disparaît.
  async emote(id, kind = 'surprise') {
    const texture = { surprise: 'hint-bubble', dots: 'hint-dots' }[kind];
    if (!texture) return;
    let x;
    let top;
    if (Array.isArray(id)) {
      [x, top] = [(id[0] + 0.5) * TILE_SIZE, id[1] * TILE_SIZE];       // au-dessus d'une case (ex. un tonneau)
    } else {
      const sprite = this.actorSprite(id);
      if (!sprite) return;
      [x, top] = [sprite.x, sprite.y + TILE_SIZE / 2 - sprite.image.displayHeight];
    }
    ensureSmallBubbles(this);
    const bubble = this.add.image(x, top - 1, texture).setOrigin(0.5, 1).setDepth(50).setScale(0.6);
    sfx(kind === 'surprise' ? 'confirm' : 'select');
    this.tweens.add({ targets: bubble, scale: 1, duration: 120, ease: 'Back.easeOut' });
    await this.wait(680);
    bubble.destroy();
  }

  // Question posée jusqu'à la bonne réponse (ex. l'outil que Jean réclame) ; chaque erreur a sa réplique.
  async quiz({ question, choices, answer, wrong = {}, speaker }) {
    for (;;) {
      const choice = choices[await this.dialog.choose(question, choices, { speaker })];
      if (choice === answer) return;
      sfx('select');
      await this.dialog.open(wrong[choice] ?? wrong.default ?? ['Non, pas ça !'], { speaker });
    }
  }

  // Moment léger : le PNJ et Pierre tournent sur eux-mêmes en rythme, des notes s'envolent au-dessus.
  async dance(id) {
    const ids = [id].flat();
    const dancers = [...ids.map((i) => this.actorSprite(i)), this.player.sprite].filter(Boolean);
    this.ensureMusicNote();
    const turns = ['down', 'left', 'up', 'right'];
    for (let beat = 0; beat < 12; beat++) {
      dancers.forEach((d, i) => d.setFacing(turns[(beat + i * 2) % 4]));
      if (beat % 2 === 0) {
        sfx(beat % 4 === 0 ? 'select' : 'blip');
        const d = dancers[(beat / 2) % dancers.length];
        const note = this.add.image(d.x + Phaser.Math.Between(-6, 6), d.y - 20, 'music-note').setDepth(50);
        this.tweens.add({ targets: note, y: note.y - 14, alpha: 0, duration: 900, onComplete: () => note.destroy() });
      }
      await this.wait(220);
    }
    dancers.forEach((d) => d.setFacing('down'));
    if (ids.length === 1) this.faceActors({ [id]: this.directionTo(this.npcById(id)?.data ?? this.player, this.player) });
    this.player.sprite.setFacing(this.player.facing);
  }

  // Les personnages `ids` (PNJ ou suiveurs) marchent ensemble jusqu'aux cases libres de la zone `area`
  // [x, y, w, h] les plus proches (ex. toute la bande sur la piste de danse), puis regardent vers le bas.
  async gather(ids, [ax, ay, aw, ah]) {
    const taken = new Set([`${this.player.tileX},${this.player.tileY}`]);
    const cells = [];
    for (let y = ay; y < ay + ah; y++) {
      for (let x = ax; x < ax + aw; x++) {
        const other = this.npcs.find((n) => n.data.x === x && n.data.y === y && !ids.includes(n.data.id));
        if (this.tileWalkable(x, y) && !this.propAt(x, y) && !other) cells.push([x, y]);
      }
    }
    const walks = ids.map((id) => {
      const npc = this.npcById(id);
      const follower = this.followers.members.find((m) => m.id === id);
      const from = npc?.data ?? follower;
      if (!from) return null;
      const free = cells.filter(([x, y]) => !taken.has(`${x},${y}`));
      if (!free.length) return null;
      const [tx, ty] = free.reduce((a, b) => (Math.abs(b[0] - from.x) + Math.abs(b[1] - from.y) < Math.abs(a[0] - from.x) + Math.abs(a[1] - from.y) ? b : a));
      taken.add(`${tx},${ty}`);
      return npc ? this.walkNpc(id, [tx, ty]) : this.walkFollower(follower, [tx, ty]);
    });
    await Promise.all(walks.filter(Boolean));
    ids.forEach((id) => this.actorSprite(id)?.setFacing('down'));
  }

  // Un suiveur quitte la file un instant et marche jusqu'à la case [tx, ty] (il ne bloque personne).
  async walkFollower(m, [tx, ty]) {
    for (const xy of this.pathTo({ x: m.x, y: m.y }, tx, ty) ?? []) await this.stepTo(m.sprite, m, xy, { remember: false });
  }

  ensureMusicNote() {
    if (this.textures.exists('music-note')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x303048, 1);
    g.fillRect(4, 0, 1, 6);
    g.fillRect(5, 0, 2, 1);
    g.fillRect(6, 1, 1, 1);
    g.fillRect(2, 5, 3, 2);
    g.fillRect(1, 6, 1, 1);
    g.generateTexture('music-note', 7, 8);
    g.destroy();
  }

  // Direction principale de `from` vers `to` (positions en cases).
  directionTo(from, to) {
    const dx = (to.tileX ?? to.x) - from.x;
    const dy = (to.tileY ?? to.y) - from.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  tryInteract(e) {
    const dialog = this.dialog;
    // Ignore la touche qui vient de fermer un dialogue.
    const menu = this.scene.get('UI')?.menu;
    if (dialog.isOpen || this.menuOpen || e.timeStamp <= dialog.closedAt || e.timeStamp <= (menu?.closedAt ?? 0)) return;
    if (this.transitioning || this.scripting || this.player.moving) return;

    const { x, y } = this.player.facingTile();
    const prop = this.propAt(x, y);
    if (prop?.data.script) {
      this.runScript(prop.data.script);
      return;
    }
    if (prop?.data.dialogue) {
      dialog.open(prop.data.dialogue);
      return;
    }
    const npc = this.npcAt(x, y);
    if (npc?.data.push) {
      this.runScript([{ push: npc.data.id }]);
      return;
    }
    if (npc) {
      npc.sprite.setFacing(OPPOSITE[this.player.facing]);
      this.talkTo(npc.data);
      return;
    }
    // Un objet qui fait voyager (warp) est toujours présent : ses conditions décident du départ.
    const object = this.map.objects?.find((o) => o.x === x && o.y === y && (o.warp || meetsConditions(o)));
    if (object?.warp) this.runTrigger(object);
    else if (object) this.talkTo(object);
    else if (this.grid[y]?.[x] && getTile(this.grid[y][x]).water && items.has(FISHING_ROD)) {
      this.runScript(this.fishingSteps(getTile(this.grid[y][x]).water));
    }
  }

  // Pêche avec la canne (voir data/fishing.js), face à l'eau : Pierre attend (« … »), puis ça mord ou non. Les prises sont
  // relâchées (rien ne s'ajoute au sac).
  fishingSteps(water) {
    const catches = CATCHES[water];
    const steps = [
      { say: ['Tu lances ta ligne…'] },
      { emote: 'player', kind: 'dots' },
    ];
    if (Math.random() < 0.4) return [...steps, { say: ['Rien ne mord… Tu remballes ta ligne.'] }];
    const fish = Math.random() < 0.1 ? 'une vieille botte' : Phaser.Utils.Array.GetRandom(catches);
    return [
      ...steps,
      { emote: 'player', kind: 'surprise' },
      { say: [`Ça mord ! Tu remontes ${fish} !`, fish === 'une vieille botte' ? 'Tu la poses sur la rive.' : `Tu ${fish.startsWith('une') ? 'la' : 'le'} relâches doucement.`] },
    ];
  }

  // Parler à un PNJ / examiner un objet, puis poser sa question éventuelle (`ask`).
  // Un PNJ ou un objet avec `script` joue sa scénette (voir runSteps) au lieu du dialogue simple.
  async talkTo(target) {
    if (target.script) return this.runScript(target.script);
    if (await interact(this.dialog, target)) this.refreshActors();
    if (target.ask) await this.runAsk(target.ask, target.name);
  }

  // ask : { question, ifFlags?, unlessFlags?, choices: [{ label, reply?, dialogue?, setFlags?, warp?, steps?, ifFlags?, ifItems?, ifSouvenirs? }] }
  //   `steps` : une scénette (ex. le départ en avion, avec le gardien du départ).
  //   `reply` : réplique du joueur (affichée avec son nom), puis `dialogue` : réponse du personnage.
  // Seules les réponses dont les conditions sont remplies sont proposées.
  async runAsk(ask, speaker) {
    // La question elle-même peut avoir des conditions (ex. unlessFlags : n'être posée qu'une fois).
    if (!meetsConditions(ask)) return;
    const choices = ask.choices.filter(meetsConditions);
    const index = await this.dialog.choose(ask.question, choices.map((c) => c.label), { speaker });
    const choice = choices[index];
    if (!choice) return;
    if (choice.reply) await this.dialog.open(choice.reply, { speaker: PLAYER_NAME });
    if (choice.dialogue) await this.dialog.open(choice.dialogue, { speaker });
    if (choice.setFlags?.length) {
      choice.setFlags.forEach(flags.add);
      this.refreshActors();
    }
    if (choice.warp) this.travel(choice.warp);
    if (choice.steps) await this.runScript(choice.steps);
  }

  // Sauvegarde où se trouve le joueur (appelé à l'arrivée et à chaque pas).
  savePosition() {
    if (this.map.builder) return;                   // carte du créateur en essai : la vraie partie reste intacte
    const { tileX: x, tileY: y, facing } = this.player;
    savePosition({ ...this.location(), spawn: { x, y, facing } });
  }

  handleStep(x, y) {
    this.savePosition();
    const trigger = this.map.triggers?.find((t) => t.x === x && t.y === y);
    if (trigger) this.runTrigger(trigger);
    this.onTileEntered(getTile(this.grid[y][x]), x, y);
  }

  async runTrigger(trigger) {
    // Déclencheur à scénette (`script`) : joué quand ses conditions sont remplies, rien sinon.
    if (trigger.script) {
      if (meetsConditions(trigger)) await this.runScript(trigger.script);
      return;
    }
    const ready =
      (trigger.requiresSouvenirs ?? []).every((id) => souvenirs.has(id)) && meetsConditions(trigger);
    if (!ready) {
      if (trigger.dialogue) await this.dialog.open(trigger.dialogue);
      return;
    }
    // Conditions remplies : `readyDialogue` (ou `dialogue` pour un simple message), puis voyage éventuel.
    const pages = trigger.readyDialogue ?? (trigger.warp ? null : trigger.dialogue);
    if (pages) await this.dialog.open(pages);
    if (trigger.item && items.add(trigger.item)) {
      sfx('item');
      await this.dialog.open([`Tu as obtenu : ${trigger.item.name} !`]);
    }
    (trigger.setFlags ?? []).forEach(flags.add);
    if (trigger.setFlags?.length) this.refreshActors();
    if (trigger.warp) {
      const code = this.grid[trigger.y]?.[trigger.x];
      if (code && getTile(code).stairs) sfx('stairs');
      this.travel(trigger.warp);
    }
  }

  // Voyage : { map, x, y, facing } vers une carte extérieure, ou { interior, x, y, facing }
  // vers un autre intérieur de la même ville (ex. étages d'un immeuble par l'ascenseur).
  // `ferry: true` : on passe d'abord par la traversée en ferry (voir FerryScene).
  // `deck: true` : la traversée commence par la scène sur le pont du ferry (départ de Fort-de-France).
  // `car: true` : on passe d'abord par le trajet en voiture (même écran de voyage, voir FerryScene).
  // `carry` : encart affiché à la fin du trajet (ex. « Tu emportes : … », voir FerryScene).
  // `plane: true` : en avion (même écran de voyage).
  travel({ map, interior, ferry, deck, car, plane, carry, ...spawn }) {
    if (interior) this.goTo('Interior', { interior, fromMap: this.fromMap ?? this.map.id, spawn });
    else if (ferry || car || plane) {
      this.goTo('Ferry', { deck, road: car, plane, carry, next: { sceneKey: 'Overworld', data: { mapId: map, spawn } } });
    }
    else this.goTo('Overworld', { mapId: map, spawn });
  }

  goTo(sceneKey, data) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.frozen = true;
    this.cameras.main.fadeOut(FADE_MS);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey, data));
  }

  onTileEntered() {}

  update() {
    this.updateDarkness();
    this.updateCovers();
    this.updateHint();
    if (this.patrols) {
      const busy = this.scripting || this.transitioning || this.dialog?.isOpen || this.menuOpen;
      const guard = this.patrols.update(busy);
      if (guard) this.caughtBy(guard);
    }
    // Pendant un dialogue le joueur ne bouge pas, et on oublie les flèches appuyées.
    if (this.dialog?.isOpen || this.menuOpen) {
      this.player.queued = null;
      return;
    }
    this.player.update();
  }

  // Partie de fléchettes : trois lancers de Pierre, puis le score de l'adversaire (au hasard) et sa réaction.
  async dartsGame({ opponent, win, lose }) {
    const throws = await playDarts(this.scene.get('UI'));
    const total = throws.reduce((n, t) => n + t.points, 0);
    const theirs = 10 + Math.floor(Math.random() * 90);
    await this.dialog.open([`Tes lancers : ${throws.map((t) => t.label.replace(/[.!…]+$/, '')).join(', ')}. Total : ${total} points.`]);
    await this.dialog.open([`${theirs} points pour moi.`, ...(total > theirs ? win : lose)], { speaker: opponent });
    return total > theirs;
  }

  // Pièce dans le noir, façon grotte sans Flash : tout est noir sauf un halo autour de Pierre. map.dark : { radius?,
  // ifFlags?, unlessFlags? } ; dès que ses conditions ne sont plus remplies (ex. le courant revient), le noir se dissipe.
  createDarkness(spec) {
    const W = SCREEN_W * 3;
    const H = SCREEN_H * 3;
    const key = `darkness-${spec.radius ?? 36}`;
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, W, H);
      const ctx = tex.getContext();
      ctx.fillStyle = 'rgba(4, 4, 10, 0.94)';
      ctx.fillRect(0, 0, W, H);
      const r = spec.radius ?? 36;
      const hole = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
      hole.addColorStop(0, 'rgba(0, 0, 0, 1)');
      hole.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = hole;
      ctx.fillRect(0, 0, W, H);
      tex.refresh();
    }
    const image = this.add.image(0, 0, key).setDepth(40);
    image.setVisible(meetsConditions(spec));
    return { spec, image, on: image.visible };
  }

  updateDarkness() {
    const dark = this.darkness;
    if (!dark) return;
    dark.image.setPosition(this.player.sprite.x, this.player.sprite.y);
    const on = meetsConditions(dark.spec);
    if (on === dark.on) return;
    dark.on = on;
    if (on) dark.image.setVisible(true).setAlpha(1);
    else this.tweens.add({ targets: dark.image, alpha: 0, duration: 600, onComplete: () => dark.image.setVisible(false) });
  }

  // PNJ qui dansent en continu (`dancing: true`, ex. la soirée de Bordeaux) : petits sauts, et ils changent de côté
  // de temps en temps ; chacun à son rythme.
  startDancing(sprite, data) {
    const seed = [...data.id].reduce((n, c) => n + c.charCodeAt(0), 0);
    this.tweens.add({
      targets: sprite.image, y: sprite.image.y - 2, duration: 160 + (seed % 5) * 20, yoyo: true, repeat: -1,
      delay: (seed * 37) % 400, ease: 'Sine.easeOut',
    });
    const dirs = ['down', 'left', 'down', 'right'];
    this.time.addEvent({
      delay: 700 + (seed % 7) * 90, loop: true,
      callback: () => { if (!this.scripting) sprite.setFacing(dirs[Math.floor(Math.random() * dirs.length)]); },
    });
  }

  // Tout le monde se tourne vers le PNJ `id` (ex. le prof qui interpelle la classe) : vers le haut ou le bas s'il est
  // devant ou derrière (comme une classe face au tableau), sur le côté seulement s'il est sur la même rangée.
  allFace(id) {
    const target = this.npcById(id);
    if (!target) return;
    const to = target.data;
    const turn = (sprite, from) => {
      if (from.y !== to.y) sprite.setFacing(to.y < from.y ? 'up' : 'down');
      else if (from.x !== to.x) sprite.setFacing(to.x < from.x ? 'left' : 'right');
    };
    for (const npc of this.npcs) {
      if (npc === target) continue;
      turn(npc.sprite, npc.data);
      npc.data.facing = npc.sprite.facing;
    }
    for (const m of this.followers.members) turn(m.sprite, m);
    const p = this.player;
    turn(p.sprite, { x: p.tileX, y: p.tileY });
    p.facing = p.sprite.facing;
  }

  // Pris dans le cône d'une ronde : le militaire l'interpelle, fondu, et Pierre se retrouve au point de départ
  // (`caught.back`), sans autre pénalité.
  async caughtBy(guard) {
    if (this.scripting || this.transitioning) return;
    const { speaker, say, back } = this.patrols.spec.caught;
    this.scripting = true;
    this.player.frozen = true;
    this.player.queued = null;
    try {
      await this.emote([guard.x, guard.y], 'surprise');
      await this.dialog.open(say, { speaker });
      await this.setCurtain(true);
      const sprite = this.player.sprite;
      this.player.tileX = back.x;
      this.player.tileY = back.y;
      this.player.facing = back.facing;
      sprite.setPosition(...tileCenter(back.x, back.y));
      sprite.setFacing(back.facing);
      sprite.updateDepth(0.001);
      this.savePosition();
      await this.setCurtain(false);
    } finally {
      this.scripting = false;
      if (!this.transitioning) this.player.frozen = false;
    }
  }

  // Bulle « ! » au-dessus du personnage ou de l'objet que le joueur regarde (s'il peut lui parler).
  updateHint() {
    if (!this.hint) return;
    if (this.scripting || this.dialog?.isOpen || this.menuOpen || this.player.moving || this.transitioning) return this.hint.show(null);
    const { x, y } = this.player.facingTile();
    if (this.npcAt(x, y)) return this.hint.show({ x, y }, true);
    // `hidden` : objet à trouver en fouillant (pas de bulle, ex. le coquillage de la plage).
    const object = (this.map.objects ?? []).find((o) => o.x === x && o.y === y && !o.hidden && (o.warp || meetsConditions(o)));
    this.hint.show(object ? { x, y } : null, false);
  }

  // Les PNJ tournent la tête de temps en temps (sauf pendant une conversation, près du joueur
  // ou couchés dans un lit), pour que les lieux aient l'air vivants.
  startIdleNpcs() {
    this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => {
        if (this.dialog?.isOpen || !this.npcs.length) return;
        const npc = Phaser.Utils.Array.GetRandom(this.npcs);
        const { x, y } = npc.data;
        const near = Math.abs(x - this.player.tileX) + Math.abs(y - this.player.tileY) <= 2;
        if (near || npc.data.still || this.grid[y]?.[x] === 'L') return;
        npc.sprite.setFacing(Phaser.Utils.Array.GetRandom(['up', 'down', 'left', 'right']));
      },
    });
  }

  // Menu Start ouvert (dans la scène d'interface) : le joueur ne bouge pas.
  get menuOpen() {
    return this.scene.get('UI')?.menu?.isOpen ?? false;
  }

  // Hautes herbes devant les pieds des personnages, et ombre sur le joueur quand il passe derrière un arbre.
  updateCovers() {
    const player = this.player.sprite;
    this.grassCovers.update([player, ...this.followers.members.map((m) => m.sprite), ...this.npcs.map((n) => n.sprite)]);

    // Derrière un arbre : le feuillage (dessiné devant lui) le cache ; ce qui dépasse est à l'ombre.
    const { x, y } = player.tile();
    if (this.canopy.has(`${x},${y}`)) player.image.setTint(0x8890a8);
    else player.image.clearTint();
    this.updateSilhouette(player, x, y);
  }

  // Carte du créateur : quand un toit ou une cime (calque « au-dessus de Pierre ») cache le joueur, sa silhouette
  // reste visible en transparence par-dessus, pour ne jamais le perdre de vue dans une rue étroite.
  updateSilhouette(player, x, y) {
    const key = this.map.topLayer;
    if (!key) return;
    const hidden = !player.inBed && player.visible && player.image.alpha > 0.5 && hiddenUnderTop(this, key, x, y);
    if (!hidden) {
      this.silhouette?.setVisible(false);
      return;
    }
    const img = player.image;
    this.silhouette ??= this.add.image(0, 0, img.texture.key).setAlpha(0.5).setDepth(110.5);   // juste au-dessus des toits
    this.silhouette.setTexture(img.texture.key, img.frame.name).setOrigin(img.originX, img.originY)
      .setFlipX(img.flipX).setPosition(player.x + img.x, player.y + img.y).setVisible(true);
  }
}
