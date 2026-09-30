import Phaser from 'phaser';
import { TILE_SIZE, getTile } from '../data/tiles.js';
import { FOLLOWERS } from '../data/story.js';
import { renderMap, createSurroundings } from '../systems/tileRenderer.js';
import { drawBuilding } from '../art/buildingArt.js';
import { createWalkableCheck } from '../systems/collision.js';
import { Player } from '../systems/Player.js';
import { CharacterSprite, OPPOSITE } from '../systems/CharacterSprite.js';
import { Followers } from '../systems/Followers.js';
import { lookOf } from '../data/characters.js';
import { interact } from '../systems/interactions.js';
import { souvenirs } from '../systems/souvenirs.js';
import { flags, meetsConditions } from '../systems/flags.js';
import { visitedFlag } from '../systems/RegionMap.js';
import { items } from '../systems/items.js';
import { savePosition } from '../systems/save.js';
import { gameView, SCREEN_W, SCREEN_H } from '../systems/screen.js';
import { canopyTiles } from '../data/treeBlocks.js';
import {
  GrassCovers, InteractHint, stepEffect, footprint, startFallingLeaves, startSeaShimmer,
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
    renderMap(this, map);
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
    this.followers = new Followers(this);
    const tileWalkable = createWalkableCheck(grid);

    // Position sauvegardée devenue invalide (carte modifiée) : retour au point de départ de la carte.
    const spawnWalkable = tileWalkable(spawn.x, spawn.y);
    if (!spawnWalkable && map.spawn) spawn = map.spawn;

    this.player = new Player(this, spawn, {
      isWalkable: (x, y) => tileWalkable(x, y) && !this.npcAt(x, y) && !this.propAt(x, y),
      onStep: (x, y) => this.handleStep(x, y),
      onMoveStart: (x, y, nx, ny, duration) => {
        this.followers.advance(x, y, duration);
        const code = this.grid[ny]?.[nx];
        if (this.grid[y]?.[x] === 's') footprint(this, x, y, this.player.facing);
        if (code === 'ĥ') this.grassCovers.rustle(nx, ny);
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

  npcAt(x, y) {
    return this.npcs.find((n) => n.data.x === x && n.data.y === y);
  }

  // (Re)crée les PNJ et suiveurs selon les drapeaux d'histoire.
  // Un suiveur qui remplace un PNJ (même id) part de la position de celui-ci.
  refreshActors() {
    const wanted = (this.map.npcs ?? []).filter(meetsConditions);
    const leftAt = {};
    this.npcs = this.npcs.filter((n) => {
      if (wanted.includes(n.data)) return true;
      leftAt[n.data.id] = { x: n.data.x, y: n.data.y, facing: n.sprite.facing };
      n.sprite.destroy();
      return false;
    });
    for (const data of wanted) {
      if (this.npcs.some((n) => n.data === data)) continue;
      const sprite = new CharacterSprite(this, data.x, data.y, lookOf(data), data.facing);
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
      const graphics = this.add.graphics().setDepth(5);
      drawBuilding(graphics, data);
      this.props.push({ data, graphics });
    }

    const { tileX, tileY, facing } = this.player;
    this.followers.sync(
      FOLLOWERS.filter(meetsConditions),
      (id) => leftAt[id] ?? { x: tileX, y: tileY, facing },
    );
  }

  async runEnterEvents() {
    const events = (this.map.events ?? []).filter((e) => e.on === 'enter' && meetsConditions(e));
    for (const event of events) await this.runSteps(event.steps);
  }

  async runSteps(steps) {
    for (const step of steps) {
      if (step.say) await this.dialog.open(step.say, { speaker: step.speaker });
      if (step.talk) {
        const npc = this.npcs.find((n) => n.data.id === step.talk);
        if (npc) {
          npc.sprite.setFacing(this.directionTo(npc.data, this.player));
          await this.talkTo(npc.data);
        }
      }
      if (step.setFlag) {
        flags.add(step.setFlag);
        this.refreshActors();
      }
    }
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
    if (this.transitioning || this.player.moving) return;

    const { x, y } = this.player.facingTile();
    const prop = this.propAt(x, y);
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
  }

  // Parler à un PNJ / examiner un objet, puis poser sa question éventuelle (`ask`).
  async talkTo(target) {
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
  travel({ map, interior, ferry, ...spawn }) {
    if (interior) this.goTo('Interior', { interior, fromMap: this.fromMap ?? this.map.id, spawn });
    else if (ferry) this.goTo('Ferry', { next: { sceneKey: 'Overworld', data: { mapId: map, spawn } } });
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
