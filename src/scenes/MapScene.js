import Phaser from 'phaser';
import { TILE_SIZE, getTile } from '../data/tiles.js';
import { FOLLOWERS } from '../data/story.js';
import { CATCHES, FISHING_ROD } from '../data/fishing.js';
import { renderMap, createSurroundings } from '../systems/tileRenderer.js';
import { drawBuilding } from '../art/buildingArt.js';
import { drawDecal, drawPlanksPile } from '../art/tileArt.js';
import { createWalkableCheck } from '../systems/collision.js';
import { Player, WALK_DURATION } from '../systems/Player.js';
import { CharacterSprite, OPPOSITE, DIRECTIONS, tileCenter } from '../systems/CharacterSprite.js';
import { Followers } from '../systems/Followers.js';
import { lookOf } from '../data/characters.js';
import { bedAt, familyCarImage, cabaneFrame, CABANE_LADDER_X, FRLG_SHEETS } from '../art/frlgArt.js';
import { interact } from '../systems/interactions.js';
import { souvenirs } from '../systems/souvenirs.js';
import { flags, meetsConditions } from '../systems/flags.js';
import { visitedFlag } from '../systems/RegionMap.js';
import { items } from '../systems/items.js';
import { EMOTES, EMOTE_FRAMES, ITEM_ICONS } from '../art/uiIcons.js';
import { savePosition } from '../systems/save.js';
import { gameView, SCREEN_W, SCREEN_H } from '../systems/screen.js';
import { canopyTiles } from '../data/treeBlocks.js';
import {
  GrassCovers, TALL_PLANTS, InteractHint, stepEffect, footprint, startFallingLeaves, startSeaShimmer,
  startSeagulls, startJumpingFish, lightWindows, applyTimeOfDay,
} from '../systems/effects.js';
import { playMusic, setSeaAmbience, sfx } from '../systems/audio.js';

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
// Les sous-classes implémentent onTileEntered(tile, x, y), location() (pour la sauvegarde),
// cityName() (affiché en haut à gauche)
// et peuvent définir
// `surroundingTile` (tuile de remplissage par défaut).
export class MapScene extends Phaser.Scene {
  setupMap(map, spawn) {
    const { grid } = map;
    this.map = map;
    this.grid = grid;
    this.transitioning = false;
    this.leaving = false;
    this.events.once('shutdown', () => { this.leaving = true; });
    this.scene.get('UI')?.curtain?.setAlpha(0);             // rideau noir d'une scénette précédente
    renderMap(this, map);
    // Morceaux du décor redessinés par-dessus les personnages qui sont derrière (ex. tables de la cabane) :
    // { sheet, frame(scene), x, y, h } en pixels, triés en profondeur par leur bas.
    for (const o of map.overlays ?? []) {
      this.add.image(o.x, o.y, o.sheet, o.frame(this)).setOrigin(0).setDepth(10 + (o.y + o.h) / 10000);
    }
    if (this.scene.key === 'Overworld') flags.add(visitedFlag(map.id));    // pour la carte du voyage
    this.canopy = canopyTiles(grid);
    this.startWaterSparkles();
    this.grassCovers = new GrassCovers(this, map);
    const seaAround = (map.surroundings ?? this.surroundingTile) === 'w';
    startSeaShimmer(this, map, false);      // reflets des étangs et rivières (la mer est animée, voir addSeaLayer)
    // Musique du lieu et ressac près de la mer.
    playMusic(this.scene.key === 'Interior' ? 'home' : 'island');
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
    this.followers = new Followers(this);
    const tileWalkable = createWalkableCheck(grid);
    this.tileWalkable = tileWalkable;
    // Les PNJ qui se sont avancés vers le joueur (voir approach) reprennent leur place à la prochaine visite.
    this.events.once('shutdown', () => (map.npcs ?? []).forEach((d) => {
      if (d.home) Object.assign(d, d.home);
      delete d.home;
    }));

    // Position sauvegardée devenue invalide (carte modifiée) : retour au point de départ de la carte.
    const spawnWalkable = tileWalkable(spawn.x, spawn.y);
    if (!spawnWalkable && map.spawn) spawn = map.spawn;

    this.player = new Player(this, spawn, {
      isWalkable: (x, y) => (tileWalkable(x, y) || this.openDoorAt(x, y)) && !this.npcAt(x, y) && !this.propAt(x, y),
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
      if (this.scene.key === 'Overworld') applyTimeOfDay(cam, this.game);   // lumière selon l'heure
    }
    cam.fadeIn(FADE_MS);
    this.applyAmbience(map);

    this.runEnterEvents();
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
    const mapH = this.grid.length * TILE_SIZE;
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
      // Tas de planches de la ferme (Saint-Ay) : disparaît une fois les planches ramassées.
      if (data.type === 'planks') {
        const graphics = this.add.graphics().setDepth(10 + ((data.y + 1) * TILE_SIZE) / 10000);
        drawPlanksPile(graphics, data.x * TILE_SIZE, data.y * TILE_SIZE);
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
      const graphics = this.add.graphics().setDepth(depth);
      drawDecal(graphics, data.kind, data.x * TILE_SIZE, data.y * TILE_SIZE, data);
      this.decals.push({ data, graphics });
    }

    const { tileX, tileY, facing } = this.player;
    this.followers.sync(
      FOLLOWERS.filter(meetsConditions),
      (id) => leftAt[id] ?? { x: tileX, y: tileY, facing },
    );
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
      await this.runSteps(steps);
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
  //   { setFlag } / { setFlags: [] }     drapeaux d'histoire (les personnages sont mis à jour)
  //   { quality: { id, name } }          qualité reçue (compte comme un souvenir) : « Tu as reçu : X. »
  //   { give: item, text? }              objet reçu (message `text`, sinon « Tu as reçu : X. »)
  //   { take: itemId }                   objet donné (quitte l'inventaire)
  //   { black: true | false }            écran noir immédiat / retour de l'image en fondu
  //   { sea: true | false }              bruit des vagues
  //   { face: { npcId | 'player': direction } }
  //   { emote: npcId | 'player' | [x, y], kind }  bulle d'émotion au-dessus d'une tête ou d'une case (voir
  //                                      art/uiIcons.js EMOTE_FRAMES : surprise, question, heart, note, dots…)
  //   { sound: nom }                     bruitage (voir systems/audio.js, sfx)
  //   { steps: [étapes] }                sous-scénette, jouée si les conditions de l'étape sont remplies
  //   { quiz: { question, choices, answer, wrong?, speaker? } }  question reposée jusqu'à la bonne réponse ;
  //                                      `wrong` : réplique par mauvaise réponse ({ réponse: [pages], default })
  //   { dance: npcId }                   le PNJ et Pierre dansent un instant, notes de musique
  //   { walk: npcId, to: [x, y], lead?, block?, then? }  le PNJ marche jusqu'à la case (voir walkNpc)
  //   { choose: question, speaker?, choices: [{ label, steps }] }
  //   { wait: ms }  { travel: warp }  { end: true } (arrête la scénette)
  //   { drive: type } : le joueur monte dans la voiture (prop), qui s'en va
  //   { hop: id | [ids], times? } : petits sauts sur place ('player' : Pierre)
  //   { cheer: [ids] } : tous sautent ensemble, des notes et des cœurs s'envolent
  // Renvoie true si la scénette s'est arrêtée sur `end` (ou un voyage).
  async runSteps(steps) {
    for (const step of steps) {
      if (!meetsConditions(step)) continue;
      if (step.black !== undefined) await this.setCurtain(step.black);
      if (step.sea !== undefined) setSeaAmbience(step.sea);
      if (step.face) this.faceActors(step.face);
      if (step.emote) await this.emote(step.emote, step.kind);
      if (step.sound) sfx(step.sound);
      if (step.dance) await this.dance(step.dance);
      if (step.wait) await this.wait(step.wait);
      if (step.say) await this.dialog.open(step.say, { speaker: step.speaker });
      if (step.approach) await this.approach(step.approach);
      if (step.drive) await this.driveAway(step.drive);
      if (step.hop) await this.hop(step.hop, step.times);
      if (step.cheer) await this.cheer(step.cheer);
      if (step.walk) {
        const walking = this.walkNpc(step.walk, step.to, { lead: step.lead, then: step.then });
        if (step.block) await walking;
      }
      if (step.talk) {
        const npc = this.npcs.find((n) => n.data.id === step.talk);
        if (npc) {
          await this.approach(step.talk);
          await this.talkTo(npc.data);
        }
      }
      if (step.quiz) await this.quiz(step.quiz);
      if (step.steps && await this.runSteps(step.steps)) return true;
      if (step.choose) {
        const index = await this.dialog.choose(step.choose, step.choices.map((c) => c.label), { speaker: step.speaker });
        if (await this.runSteps(step.choices[index]?.steps ?? [])) return true;
      }
      if (step.give && items.add(step.give)) {
        this.refreshActors();
        sfx('item');
        await this.dialog.open([step.text ?? `Tu as reçu : ${step.give.name}.`], { item: step.give });
      }
      if (step.take && items.remove(step.take)) this.refreshActors();
      if (step.quality && souvenirs.add(step.quality)) {
        sfx('item');
        await this.dialog.open([`Tu as reçu : ${step.quality.name}.`]);
        this.refreshActors();                       // PNJ et suiveurs qui dépendent du titre
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
  // regarde en accélérant, avec des bouffées de fumée.
  async driveAway(type) {
    const prop = this.props.find((p) => p.data.type === type);
    const car = prop?.graphics;
    if (!car) return;
    const dir = prop.data.facing === 'left' ? -1 : 1;                 // elle part du côté où elle regarde
    this.player.sprite.setVisible(false);
    sfx('door');
    await this.wait(300);
    sfx('engine');
    this.tweens.add({ targets: car, y: car.y - 1, duration: 100, yoyo: true, repeat: -1, ease: 'Stepped' });
    await this.wait(500);
    const smoke = this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const puff = this.add.rectangle(car.x - dir * 22, car.y - 5, 3, 3, 0xd8d8d0).setDepth(car.depth);
        this.tweens.add({ targets: puff, x: puff.x - dir * 14, y: puff.y - 6, scale: 2, alpha: 0, duration: 600, onComplete: () => puff.destroy() });
      },
    });
    await new Promise((resolve) => this.tweens.add({
      targets: car, x: car.x + dir * 12 * TILE_SIZE, duration: 2200, ease: 'Quad.easeIn', onComplete: resolve,
    }));
    smoke.remove();
  }

  // Le PNJ s'avance vers le joueur (plus court chemin jusqu'à une case voisine), puis ils se font face.
  async approach(id) {
    const npc = this.npcs.find((n) => n.data.id === id);
    if (!npc) return;
    const path = this.pathNextToPlayer(npc.data) ?? [];
    for (const [x, y] of path) {
      const d = npc.data;
      d.home ??= { x: d.x, y: d.y, facing: d.facing };
      npc.sprite.setFacing(this.directionTo(d, { x, y }));
      npc.sprite.walkStep(WALK_DURATION);
      d.x = x;
      d.y = y;
      const [px, py] = tileCenter(x, y);
      await new Promise((resolve) => this.tweens.add({
        targets: npc.sprite, x: px, y: py, duration: WALK_DURATION,
        onUpdate: () => npc.sprite.updateDepth(), onComplete: resolve,
      }));
    }
    const toPlayer = this.directionTo(npc.data, this.player);
    npc.sprite.setFacing(toPlayer);
    npc.data.facing = toPlayer;
    this.player.facing = OPPOSITE[toPlayer];
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
    const npc = this.npcs.find((n) => n.data.id === id);
    if (!npc) return;
    const d = npc.data;
    const alive = () => !this.leaving && this.npcs.includes(npc);
    let stuck = 0;                                  // au bout d'une dizaine de secondes bloqué, on abandonne
    const besidePlayer = () => this.player.tileX === tx && this.player.tileY === ty
      && Math.abs(d.x - tx) + Math.abs(d.y - ty) === 1;            // le joueur occupe la case visée : on s'arrête à côté
    while (alive() && (d.x !== tx || d.y !== ty) && !besidePlayer() && stuck < 40) {
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
      d.home ??= { x: d.x, y: d.y, facing: d.facing };
      npc.sprite.setFacing(this.directionTo(d, { x, y }));
      npc.sprite.walkStep(WALK_DURATION);
      d.x = x;
      d.y = y;
      const [px, py] = tileCenter(x, y);
      await new Promise((resolve) => this.tweens.add({
        targets: npc.sprite, x: px, y: py, duration: WALK_DURATION,
        onUpdate: () => npc.sprite.updateDepth(), onComplete: resolve,
      }));
    }
    if (!alive()) return;
    d.facing = npc.sprite.facing;
    if (then.length) {
      then.forEach(flags.add);
      this.refreshActors();
    }
  }

  // Plus court chemin (cases, sans la case de départ) jusqu'à (tx, ty), sans passer par les autres PNJ.
  pathTo(from, tx, ty, avoid = null) {
    const free = (x, y) => this.tileWalkable(x, y) && !this.propAt(x, y)
      && !(avoid && avoid[0] === x && avoid[1] === y)
      && !this.npcs.some((n) => n.data !== from && n.data.x === x && n.data.y === y);
    const prev = new Map([[`${from.x},${from.y}`, null]]);
    const queue = [[from.x, from.y]];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (x === tx && y === ty) {
        const path = [];
        for (let c = [x, y]; c && !(c[0] === from.x && c[1] === from.y); c = prev.get(`${c[0]},${c[1]}`)) path.unshift(c);
        return path;
      }
      for (const { dx, dy } of Object.values(DIRECTIONS)) {
        const k = `${x + dx},${y + dy}`;
        if (prev.has(k) || !free(x + dx, y + dy)) continue;
        prev.set(k, [x, y]);
        queue.push([x + dx, y + dy]);
      }
    }
    return null;
  }

  // Ambiance de la carte, selon l'histoire : nuit (filtre sombre, halos des réverbères et des enseignes),
  // petit matin bleuté, ou pluie. map.night / map.dawn / map.rain : conditions (ifFlags…) ; map.night.lights :
  // halos en plus des réverbères ('l'), [x, y, couleur].
  applyAmbience(map) {
    const on = (spec) => spec && meetsConditions(spec);
    const night = on(map.night);
    const dawn = !night && on(map.dawn);
    const W = this.grid[0].length * TILE_SIZE;
    const H = this.grid.length * TILE_SIZE;
    const M = 40 * TILE_SIZE;
    if (night || dawn) {
      this.add.rectangle(-M, -M, W + 2 * M, H + 2 * M, night ? 0x0c1030 : 0x5070b0, night ? 0.58 : 0.28)
        .setOrigin(0).setDepth(40);
    }
    if (night) {
      const lamps = [];
      this.grid.forEach((row, y) => row.forEach((c, x) => { if (c === 'l') lamps.push([x, y, 0xffd070]); }));
      // Halo chaud et doux : trois disques superposés, de plus en plus petits, qui respirent doucement.
      for (const [x, y, color] of [...lamps, ...(map.night.lights ?? [])]) {
        const cx = x * TILE_SIZE + 8;
        const cy = y * TILE_SIZE + 4;
        const glow = this.add.container(0, 0).setDepth(41);
        for (const [w, a] of [[46, 0.1], [30, 0.14], [16, 0.22]]) glow.add(this.add.ellipse(cx, cy, w, w * 0.8, color, a));
        this.tweens.add({ targets: glow, alpha: 0.7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    if (!night && !dawn && on(map.rain)) this.startRain();
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
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (interior ? this.grid[cy]?.[cx] === 'E' : seen.size >= 40) return true;
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

  actorSprite(id) {
    if (id === 'player') return this.player.sprite;
    return this.npcs.find((n) => n.data.id === id)?.sprite;
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

  // Bulle d'émotion au-dessus de la tête d'un personnage ('player' : Pierre) ou d'une case [x, y], façon HeartGold : elle apparaît
  // d'un petit bond, ses deux images alternent, puis elle disparaît.
  async emote(id, kind = 'surprise') {
    const frames = EMOTE_FRAMES[kind];
    let x;
    let top;
    if (Array.isArray(id)) {
      [x, top] = [(id[0] + 0.5) * TILE_SIZE, id[1] * TILE_SIZE];       // au-dessus d'une case (ex. un tonneau)
    } else {
      const sprite = this.actorSprite(id);
      if (!sprite) return;
      [x, top] = [sprite.x, sprite.y + TILE_SIZE / 2 - sprite.image.displayHeight];
    }
    if (!frames) return;
    const bubble = this.add.image(x, top - 1, EMOTES, frames[0]).setOrigin(0.5, 1).setDepth(50).setScale(0.6);
    sfx(kind === 'surprise' ? 'confirm' : 'select');
    this.tweens.add({ targets: bubble, scale: 1, duration: 120, ease: 'Back.easeOut' });
    for (let i = 1; i <= 4; i++) {
      await this.wait(170);
      bubble.setFrame(frames[i % 2]);
    }
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
    const dancers = [this.actorSprite(id), this.player.sprite].filter(Boolean);
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
    this.faceActors({ [id]: this.directionTo(this.npcs.find((n) => n.data.id === id)?.data ?? this.player, this.player) });
    this.player.sprite.setFacing(this.player.facing);
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

  // ask : { question, ifFlags?, unlessFlags?, choices: [{ label, reply?, dialogue?, setFlags?, warp?, ifFlags?, ifItems?, ifSouvenirs? }] }
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
  }

  // Sauvegarde où se trouve le joueur (appelé à l'arrivée et à chaque pas).
  savePosition() {
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
      if (code === 'η' || code === 'ξ') sfx('stairs');
      this.travel(trigger.warp);
    }
  }

  // Voyage : { map, x, y, facing } vers une carte extérieure, ou { interior, x, y, facing }
  // vers un autre intérieur de la même ville (ex. étages d'un immeuble par l'ascenseur).
  // `ferry: true` : on passe d'abord par la traversée en ferry (voir FerryScene).
  // `deck: true` : la traversée commence par la scène sur le pont du ferry (départ de Fort-de-France).
  // `car: true` : on passe d'abord par le trajet en voiture (même écran de voyage, voir FerryScene).
  travel({ map, interior, ferry, deck, car, ...spawn }) {
    if (interior) this.goTo('Interior', { interior, fromMap: this.fromMap ?? this.map.id, spawn });
    else if (ferry || car) this.goTo('Ferry', { deck, road: car, next: { sceneKey: 'Overworld', data: { mapId: map, spawn } } });
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
    this.updateCovers();
    this.updateHint();
    // Pendant un dialogue le joueur ne bouge pas, et on oublie les flèches appuyées.
    if (this.dialog?.isOpen || this.menuOpen) {
      this.player.queued = null;
      return;
    }
    this.player.update();
  }

  // Bulle « ! » au-dessus du personnage ou de l'objet que le joueur regarde (s'il peut lui parler).
  updateHint() {
    if (!this.hint) return;
    if (this.dialog?.isOpen || this.menuOpen || this.player.moving || this.transitioning) return this.hint.show(null);
    const { x, y } = this.player.facingTile();
    if (this.npcAt(x, y)) return this.hint.show({ x, y }, true);
    const object = (this.map.objects ?? []).find((o) => o.x === x && o.y === y && (o.warp || meetsConditions(o)));
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
  }
}
