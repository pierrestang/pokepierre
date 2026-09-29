import Phaser from 'phaser';
import { TILE_SIZE, getTile } from '../data/tiles.js';
import { FOLLOWERS } from '../data/story.js';
import { renderMap, createSurroundings } from '../systems/tileRenderer.js';
import { drawBuilding } from '../art/buildingArt.js';
import { createWalkableCheck } from '../systems/collision.js';
import { Player } from '../systems/Player.js';
import { CharacterSprite, OPPOSITE } from '../systems/CharacterSprite.js';
import { Followers } from '../systems/Followers.js';
import { interact } from '../systems/interactions.js';
import { souvenirs } from '../systems/souvenirs.js';
import { flags, meetsConditions } from '../systems/flags.js';
import { items } from '../systems/items.js';
import { savePosition } from '../systems/save.js';

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
//   scroll:   true pour une carte plus longue que l'écran (la caméra suit le joueur)
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
    const fillTile = map.surroundings ?? this.surroundingTile;
    this.surroundings = fillTile ? createSurroundings(this, map, fillTile) : null;

    this.npcs = [];
    this.props = [];
    this.followers = new Followers(this);
    const tileWalkable = createWalkableCheck(grid);

    this.player = new Player(this, spawn, {
      isWalkable: (x, y) => tileWalkable(x, y) && !this.npcAt(x, y) && !this.propAt(x, y),
      onStep: (x, y) => this.handleStep(x, y),
      onMoveStart: (x, y) => this.followers.advance(x, y),
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
    cam.setBackgroundColor(getTile(grid[0][0]).color);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
    cam.fadeIn(FADE_MS);

    this.runEnterEvents();
  }

  // La carte entière est visible, aussi grande que possible dans la fenêtre.
  // Carte normale : entièrement visible, centrée. Carte `scroll` (plus longue que l'écran) :
  // la hauteur remplit l'écran et la caméra suit le joueur de gauche à droite.
  fitCamera() {
    const cam = this.cameras.main;
    const width = this.grid[0].length * TILE_SIZE;
    const height = this.grid.length * TILE_SIZE;
    if (this.map.scroll) {
      cam.setZoom(this.scale.height / height);
      cam.setBounds(0, 0, width, height);
      cam.startFollow(this.player.sprite, true);
      return;
    }
    const zoom = Math.min(this.scale.width / width, this.scale.height / height);
    cam.setZoom(zoom);
    cam.centerOn(width / 2, height / 2);
    this.surroundings?.resize(this.scale.width / zoom, this.scale.height / zoom);
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
      const sprite = new CharacterSprite(this, data.x, data.y, data.color, data.facing, { hat: data.hat });
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
    if (dialog.isOpen || e.timeStamp <= dialog.closedAt) return;
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
      await this.dialog.open(trigger.dialogue);
      return;
    }
    // Conditions remplies : `readyDialogue` (ou `dialogue` pour un simple message), puis voyage éventuel.
    const pages = trigger.readyDialogue ?? (trigger.warp ? null : trigger.dialogue);
    if (pages) await this.dialog.open(pages);
    if (trigger.item && items.add(trigger.item)) await this.dialog.open([`Tu as obtenu : ${trigger.item.name} !`]);
    (trigger.setFlags ?? []).forEach(flags.add);
    if (trigger.setFlags?.length) this.refreshActors();
    if (trigger.warp) this.travel(trigger.warp);
  }

  // Voyage : { map, x, y, facing } vers une carte extérieure, ou { interior, x, y, facing }
  // vers un autre intérieur de la même ville (ex. étages d'un immeuble par l'ascenseur).
  travel({ map, interior, ...spawn }) {
    if (interior) this.goTo('Interior', { interior, fromMap: this.fromMap ?? this.map.id, spawn });
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
    // Pendant un dialogue le joueur ne bouge pas, et on oublie les flèches appuyées.
    if (this.dialog?.isOpen) {
      this.player.queued = null;
      return;
    }
    this.player.update();
  }
}
