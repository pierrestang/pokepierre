import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS, QUALITIES, ROLES } from '../story.js';
import {
  BIRTH, CABANE_PLAN, FELIX_CHANTIER, ANNOUNCEMENT, ANNOUNCEMENT_EVENT, CABANE_FETE, FELIX_AT_CABANE,
} from '../saintAyStory.js';
import { MAMAN, MAMAN_WELCOME, PAPA, JEAN, LAST_DAY, BENOIT_HIDING, BARREL_MOVES } from '../montepilloyStory.js';
import { FRLG_SHEETS, cabaneFrame, cabaneOverlay } from '../../art/frlgArt.js';
import {
  LEO_CALLED, OUSMANE_JOINS, LEO_PLAN, GIRLS_JOIN, PUB_A_BAR, PUB_B_TABLE, PUB_B_OTHER, ASYLUM_ENTER, ASYLUM_DANCE,
  LIBRARY, EXAM,
} from '../hullStory.js';

// Collège Bonsecours : la principale (provisoire, en attendant le scénario de la quête Bonsecours).
const PRINCIPALE = [
  { ifFlags: [FLAGS.bonsecoursFini], speaker: 'Principale', say: ['Bonne route jusqu\'au Prytanée, Pierre. Bonsecours sera toujours un peu chez toi.'], end: true },
  {
    speaker: 'Principale',
    say: [
      '[Quête Bonsecours — texte provisoire] Bienvenue au collège Bonsecours, Pierre.',
      'Les années passent vite… Ton temps ici est terminé : le Prytanée t\'attend, au bout de la route.',
    ],
  },
  { setFlag: FLAGS.bonsecoursFini },
];

// Cannes de la cabane de pêche : [icône, x, y, hauteur gardée] en pixels depuis le coin de la case (voir ffHut).
// Cannes debout (gaule en x = 14 de l'image) : dans les trous du râtelier (x = 3, 11, 19), le manche caché par le socle.
const RACK_RODS = [['mega-canne-petite', -11, -18, 26], ['super-canne-petite', -3, -18, 26], ['vieille-canne-petite', 5, -18, 26]];
const CRATE_RODS = [['super-canne-petite', -10, -17, 19], ['vieille-canne-petite', -4, -17, 19]];
const OLD_ROD_IN_CRATE = [['vieille-canne-petite', -7, -17, 19]];

// Ascenseur de l'entreprise parisienne (mêmes cases, en haut à droite, à chaque étage).
const floor = (interior) => ({ interior, x: 10, y: 2, facing: 'down' });
const ELEVATOR = [10, 11].map((x) => ({
  x,
  y: 1,
  ask: {
    question: 'Ascenseur : quel étage ?',
    choices: [
      { label: 'Rez-de-chaussée', warp: floor('entreprise') },
      { label: '1er étage (manager)', warp: floor('entrepriseManager') },
      { label: 'Dernier étage (directeur)', ifFlags: [FLAGS.verreBistro], warp: floor('entrepriseDirecteur') },
      {
        label: 'Dernier étage (directeur)',
        unlessFlags: [FLAGS.verreBistro],
        dialogue: ["[Texte provisoire] Le bouton du dernier étage ne répond pas : l'accès est bloqué pour l'instant."],
      },
      { label: 'Rester ici' },
    ],
  },
}));

// La famille quitte la maison de Fort-de-France une fois partie en bateau.
const HOME_FDF = { unlessFlags: [FLAGS.departFortDeFrance] };

// Intérieurs des bâtiments. `spawn` = position d'arrivée (juste au-dessus du tapis).
export const interiors = {
  // Fort-de-France — la maison familiale, façon Rouge Feu (`frlg`, voir art/frlgArt.js) : mur de deux
  // rangées en haut, meubles des planches (`decor`, cases 'm' bloquantes), télé au mur, escalier encastré.
  // Salon : Maman (Joie de vivre) ; Manon attend dehors, Papa trie à sa cabane de pêche.
  // Scénario : voir data/fortDeFranceStory.js.
  ffHouse: {
    name: 'Maison familiale',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      'mmmmmommmoη',
      'ooooooooooo',
      'mooommmmooo',
      'mooommmmooo',
      'oooooooooom',
      'ooooEEoooom',
    ]),
    decor: [
      { kind: 'blueShelf', x: 0, y: 1 },
      { kind: 'glassCabinet', x: 1, y: 1 },
      { kind: 'crtTv', x: 3, y: 2 },
      { kind: 'console', x: 4, y: 2 },
      { kind: 'window', x: 4, y: 0 },
      { kind: 'kitchen', x: 6, y: 1 },
      { kind: 'fridge', x: 8, y: 1 },
      { kind: 'plant', x: 0, y: 4 },
      { kind: 'table', x: 4, y: 4 },
      { kind: 'plant', x: 10, y: 6 },
      { kind: 'carton', x: 10, y: 7 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    triggers: [{ x: 10, y: 2, warp: { interior: 'ffHouseUp', x: 8, y: 3, facing: 'down' } }],
    objects: [
      { x: 3, y: 2, dialogue: ['[Texte provisoire] La télé. Un vieux jeu est encore branché sur la console…'] },
      { x: 4, y: 2, dialogue: ['[Texte provisoire] La console de Manon. Elle a encore battu ton record…'] },
      { x: 8, y: 2, dialogue: ['[Texte provisoire] Le frigo est plein de fruits de la Martinique.'] },
      { x: 10, y: 7, dialogue: ['Un carton de déménagement, prêt pour Saint-Ay.'] },
    ],
    // En descendant pour la première fois, Maman pose le cadre de la journée.
    events: [
      {
        on: 'enter',
        ifFlags: [FLAGS.reveilFortDeFrance],
        unlessFlags: [FLAGS.journeeLancee],
        steps: [
          { approach: 'maman' },
          {
            speaker: 'Maman',
            say: ["On part tous ensemble cet après-midi. Avant ça, profite de l'île une dernière fois. Ton père est à sa cabane, et ta sœur… mystère."],
          },
          { setFlag: FLAGS.journeeLancee },
        ],
      },
    ],
    npcs: [
      // Maman — Joie de vivre : la musique est allumée, elle t'entraîne dans une petite danse.
      {
        id: 'maman', name: 'Maman', x: 7, y: 3, facing: 'down', color: 0xe86fa0,
        ...HOME_FDF,
        script: [
          { ifSouvenirs: [QUALITIES.joie.id], speaker: 'Maman', say: ['Allez, file profiter de l\'île ! La musique reste allumée jusqu\'au départ.'], end: true },
          { speaker: 'Maman', say: ['Tu entends cette chanson ? Viens danser avec moi !'] },
          { dance: 'maman' },
          { speaker: 'Maman', say: ['On part cet après-midi, et alors ? Là où on va, on rira aussi. Garde toujours ça avec toi.'] },
          { quality: QUALITIES.joie },
        ],
      },
    ],
  },

  // Fort-de-France — la chambre de Pierre, à l'étage (invisible de l'extérieur), façon Rouge Feu :
  // lit, bureau avec ordinateur, plantes, escalier qui descend, et des cartons partout.
  // Nouvelle partie : Pierre s'y réveille, le dernier matin à Fort-de-France.
  ffHouseUp: {
    name: 'Chambre de Pierre',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXX',
      'XXXXXXXXX',
      'mmmmmmmoξ',
      'mmmmooooo',
      'moooommoo',
      'ooooooooo',
    ]),
    decor: [
      { kind: 'painting', x: 0, y: 0 },
      { kind: 'window', x: 5, y: 0 },
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'computerDesk', x: 2, y: 2 },
      { kind: 'smallCarton', x: 2, y: 2, dx: 1, dy: 3 },
      { kind: 'carton', x: 4, y: 2 },
      { kind: 'pottedPlant', x: 5, y: 2 },
      { kind: 'pottedPlant', x: 6, y: 2 },
      { kind: 'carton', x: 0, y: 4 },
      { kind: 'carton', x: 5, y: 4 },
      { kind: 'carton', x: 6, y: 4 },
    ],
    spawn: { x: 1, y: 4, facing: 'up' },
    triggers: [{ x: 8, y: 2, warp: { interior: 'ffHouse', x: 10, y: 3, facing: 'down' } }],
    objects: [
      { x: 0, y: 3, dialogue: ['Ton lit. Ce soir, tu dormiras à Saint-Ay.'] },
      { x: 1, y: 3, dialogue: ['Ton lit. Ce soir, tu dormiras à Saint-Ay.'] },
      { x: 2, y: 3, dialogue: ['Un carton marqué « CHAMBRE — FRAGILE ». Il est déjà scotché.'] },
      { x: 3, y: 3, dialogue: ["L'écran affiche : « Fort-de-France → Saint-Ay ». Le voyage commence aujourd'hui."] },
      ...[[4, 2], [0, 4], [5, 4], [6, 4]].map(([x, y]) => ({ x, y, dialogue: ['Des cartons à moitié faits.'] })),
    ],
    // Écran noir, bruit des vagues, puis la chambre apparaît et Maman appelle d'en bas.
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.reveilFortDeFrance],
        steps: [
          { black: true },
          { sea: true },
          { wait: 1400 },
          { say: ["C'est le dernier matin à Fort-de-France."] },
          { sea: false },
          { black: false },
          { wait: 300 },
          { speaker: 'Maman', say: ['Pierre ! Le ferry part cet après-midi ! Descends !'] },
          { setFlag: FLAGS.reveilFortDeFrance },
        ],
      },
    ],
  },

  // Fort-de-France — la cabane de pêche de Papa, façon Rouge Feu : cannes, caisses (dessinées dans le code),
  // fenêtre, panneau, plante. Papa trie avant le départ (Pragmatisme) ; caisse « À DONNER » en bas à gauche.
  ffHut: {
    name: 'Cabane de pêche',
    frlg: true,
    grid: parseGrid([
      'XXXXXXX',
      'XXXXXXX',
      'ψψommoo',
      'oooooom',
      'mooooom',
      'oooEooo',
    ]),
    decor: [
      { kind: 'window', x: 2, y: 0 },
      { kind: 'notice', x: 4, y: 0 },
      { kind: 'plant', x: 6, y: 3 },
      { kind: 'fishCrate', x: 3, y: 2 },
      { kind: 'fishCrate', x: 4, y: 2 },
      { kind: 'giveCrate', x: 0, y: 4 },
    ],
    // Cannes debout aux couleurs de HeartGold (voir MapScene, décors `icons`) : les trois du râtelier (Méga, Super,
    // Vieille), puis la Méga Canne que Papa garde ; dans la caisse « À DONNER », la Super Canne (offerte au
    // pêcheur) et la Vieille canne, puis la Vieille seule. Le bas des cannes est coupé (socle, bord de la caisse).
    decals: [
      { x: 0, y: 2, unlessFlags: [FLAGS.papaFait], icons: RACK_RODS },
      { x: 0, y: 2, ifFlags: [FLAGS.papaFait], icons: [['mega-canne-petite', -3, -18, 26]] },
      { x: 0, y: 4, ifFlags: [FLAGS.papaFait], unlessFlags: [FLAGS.canneOfferte], unlessItems: [ITEMS.canneAPeche.id], icons: CRATE_RODS },
      { x: 0, y: 4, ifFlags: [FLAGS.papaFait, FLAGS.canneOfferte], unlessItems: [ITEMS.vieilleCanne.id], icons: OLD_ROD_IN_CRATE },
      { x: 0, y: 4, ifItems: [ITEMS.canneAPeche.id], icons: OLD_ROD_IN_CRATE },
    ],
    spawn: { x: 3, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'papa', name: 'Papa', x: 1, y: 4, facing: 'left', color: 0x3f6fd8, still: true,
        ...HOME_FDF,
        script: [
          { ifSouvenirs: [QUALITIES.pragmatisme.id], speaker: 'Papa', say: ["Hm. Il reste des caisses, si t'as rien à faire."], end: true },
          { say: ['Des caisses partout. Papa trie sans lever les yeux.'] },
          { speaker: 'Papa', say: ["T'es venu m'aider ou regarder ?"] },
          {
            choose: 'Trois cannes à pêche sont posées là. Tu en prends combien ?',
            choices: [
              { label: 'Une', steps: [{ speaker: 'Papa', say: ["Une. T'as compris : on n'a que deux bras."] }] },
              { label: 'Les trois', steps: [{ speaker: 'Papa', say: ['Trois cannes. On a combien de bras ?'] }] },
            ],
          },
          { say: ['Papa en garde une et jette les deux autres dans une caisse marquée « À DONNER ».'] },
          { speaker: 'Papa', say: ['Voilà. Déménagement terminé.'] },
          { quality: QUALITIES.pragmatisme },
          { setFlag: FLAGS.papaFait },
        ],
      },
    ],
    objects: [
      { x: 0, y: 2, unlessFlags: [FLAGS.papaFait], dialogue: ['Trois cannes à pêche, rangées contre le mur.'] },
      { x: 1, y: 2, unlessFlags: [FLAGS.papaFait], dialogue: ['Trois cannes à pêche, rangées contre le mur.'] },
      { x: 0, y: 2, dialogue: ['La canne que Papa a gardée.'] },
      { x: 1, y: 2, dialogue: ['La canne que Papa a gardée.'] },
      { x: 3, y: 2, dialogue: ['Des caisses prêtes pour le déménagement.'] },
      { x: 4, y: 2, dialogue: ['Des caisses prêtes pour le déménagement.'] },
      // Caisse « À DONNER » : une canne pour le pêcheur, une fois qu'il t'a montré la sienne, cassée.
      { x: 0, y: 4, unlessFlags: [FLAGS.papaFait], dialogue: ['Une caisse marquée « À DONNER ». Elle est encore vide.'] },
      // Avant que le pêcheur t'ait montré sa canne cassée : les cannes restent dans la caisse.
      {
        x: 0, y: 4, ifFlags: [FLAGS.papaFait], unlessFlags: [FLAGS.canneMontree],
        dialogue: ['Deux cannes à pêche dépassent de la caisse « À DONNER ».'],
      },
      {
        x: 0, y: 4,
        ifFlags: [FLAGS.papaFait, FLAGS.canneMontree],
        unlessFlags: [FLAGS.canneOfferte],
        unlessItems: [ITEMS.canneAPeche.id],
        script: [
          { give: ITEMS.canneAPeche, text: 'Tu prends une canne à pêche dans la caisse.' },
          { speaker: 'Papa', say: ['Tu vois. « À donner », ça veut dire à donner.'] },
        ],
      },
      // La canne qui reste, une fois l'autre offerte au pêcheur : Pierre peut la garder pour pêcher.
      { x: 0, y: 4, ifItems: [ITEMS.vieilleCanne.id], dialogue: ['La caisse « À DONNER » est vide.'] },
      {
        x: 0, y: 4, ifFlags: [FLAGS.canneOfferte],
        script: [
          {
            choose: 'Il reste une vieille canne à pêche dans la caisse « À DONNER ». Tu la prends ?',
            choices: [
              {
                label: 'OUI',
                steps: [
                  { give: ITEMS.vieilleCanne, text: 'Tu prends la vieille canne. Elle pourra encore servir.' },
                  { say: ["Face à l'eau, appuie sur Entrée pour lancer ta ligne."] },
                ],
              },
              { label: 'NON', steps: [] },
            ],
          },
        ],
      },
      { x: 0, y: 4, ifItems: [ITEMS.canneAPeche.id], dialogue: ['Il reste une canne à pêche dans la caisse « À DONNER ».'] },
      { x: 0, y: 4, dialogue: ['Deux cannes à pêche dans la caisse « À DONNER ».'] },
    ],
  },

  // Saint-Ay — la chaumière de la famille, façon Rouge Feu. Le déménagement est terminé (plus de cartons).
  // La famille y rentre après la naissance de Fanny et la cabane ; Papa y annonce le départ pour Montépilloy.
  // Scénario : voir data/saintAyStory.js.
  playerHouse: {
    name: 'Maison de la famille',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmmoooommm',
      'oooooooooo',
      'ooommmmooo',
      'moommmmoom',
      'oooooooooo',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'kitchen', x: 0, y: 1 },
      { kind: 'fridge', x: 2, y: 1 },
      { kind: 'window', x: 4, y: 0 },
      { kind: 'crtTv', x: 7, y: 2 },
      { kind: 'blueShelf', x: 8, y: 1 },
      { kind: 'pottedPlant', x: 9, y: 2 },
      { kind: 'table', x: 3, y: 4 },
      { kind: 'plant', x: 0, y: 5 },
      { kind: 'plant', x: 9, y: 5 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    objects: [
      { x: 7, y: 2, dialogue: ['La télé. Les nouvelles de la région passent en boucle.'] },
    ],
    npcs: [
      {
        id: 'papa-maison', name: 'Papa', x: 2, y: 4, facing: 'right', color: 0x3f6fd8,
        ifFlags: [FLAGS.cabaneFinie], still: true,
        script: [
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Papa', say: ['La voiture est chargée, sur la route du nord. Va dire au revoir à tes cousins.'], end: true },
          { speaker: 'Papa', say: ['Tes cousins ont de la chance de t\'avoir.'] },
        ],
      },
      {
        id: 'maman-maison', name: 'Maman', x: 7, y: 4, facing: 'left', color: 0xe86fa0,
        ifFlags: [FLAGS.cabaneFinie], still: true,
        script: [
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Maman', say: ['Les valises sont prêtes. On part dès que tu es prêt.'], end: true },
          { speaker: 'Maman', say: ['Fanny a tellement grandi… Elle ne tient plus en place.'] },
        ],
      },
      {
        id: 'manon-maison', name: 'Manon', x: 8, y: 3, facing: 'down', color: 0xf0a030,
        ifFlags: [FLAGS.cabaneFinie],
        script: [
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Manon', say: ['Encore un déménagement…'], end: true },
          { speaker: 'Manon', say: ['Fanny me suit partout, maintenant. Même dans ma chambre !'] },
        ],
      },
      // Fanny a grandi depuis sa naissance à la clinique : elle joue dans le salon.
      {
        id: 'fanny-maison', name: 'Fanny', x: 6, y: 3, facing: 'down', color: 0xf0c0c0,
        ifFlags: [FLAGS.cabaneFinie],
        script: [
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Fanny', say: ['C\'est loin, Montépilloy ? Il y aura des poules ?'], end: true },
          { speaker: 'Fanny', say: ['Pierre ! Tu joues à cache-cache avec moi ?'] },
        ],
      },
    ],
    // En rentrant avec « Grand frère » et « Cousins pour la vie » : l'annonce de la mutation.
    events: [{ on: 'enter', ...ANNOUNCEMENT_EVENT, ifFlags: [FLAGS.cabaneFinie], steps: ANNOUNCEMENT }],
  },

  // Saint-Ay — la chaumière de la rue du milieu (même extérieur que celle de Pierre) : Felix, Joshua, Yanis et Val, les cousins, qui viennent
  // d'emménager. Felix y lance (puis dirige) le chantier de la cabane ; Val sculpte dans son atelier.
  felixHouse: {
    name: 'Maison de Felix',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmoommoomm',
      'oooooooooo',
      'ooommmmooo',
      'moommmmooo',
      'mooooooooo',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'blueShelf', x: 0, y: 1 },
      { kind: 'glassCabinet', x: 1, y: 1 },
      { kind: 'crtTv', x: 4, y: 2 },
      { kind: 'console', x: 5, y: 2 },
      { kind: 'window', x: 4, y: 0 },
      { kind: 'bookshelf', x: 8, y: 0 },
      { kind: 'table', x: 3, y: 4 },
      { kind: 'plant', x: 0, y: 5 },
    ],
    // Le cheval que Val sculpte, posé sur la table devant lui (art/tileArt.js DECALS.statue).
    decals: [{ kind: 'statue', x: 5, y: 4, ifFlags: [FLAGS.felixInvite] }],
    spawn: { x: 5, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'felix-maison', name: 'Felix', x: 2, y: 6, facing: 'right', color: 0x9060d0,
        ifFlags: [FLAGS.maisonFelixVisitee], unlessFlags: [FLAGS.cabaneFinie],
        script: FELIX_CHANTIER,
      },
      {
        id: 'val', name: 'Val', x: 7, y: 4, facing: 'left', color: 0x5cb85c, still: true,
        ifFlags: [FLAGS.felixInvite],
        script: [
          { say: ['Sur la table, Val sculpte une statue : un cheval en bois. Des copeaux partout.'] },
          { speaker: 'Val', say: ['Regarde, il commence à ressembler à quelque chose. La crinière, c\'est le plus dur.'] },
          { speaker: 'Val', say: ['Il me faudra encore quelques semaines. Il doit être parfait.'] },
        ],
      },
      {
        id: 'joshua', name: 'Joshua', x: 6, y: 3, facing: 'down', color: 0x20a0c0,
        ifFlags: [FLAGS.felixInvite], unlessFlags: [FLAGS.planCabane],
        dialogue: ['Felix a un plan. Il a toujours un plan.'],
      },
      {
        id: 'yanis', name: 'Yanis', x: 2, y: 3, facing: 'right', color: 0xc0b040,
        ifFlags: [FLAGS.felixInvite], unlessFlags: [FLAGS.planCabane],
        dialogue: ['Salut, cousin !'],
      },
    ],
    // Felix, qui te suivait, arrive avec toi et expose son plan.
    events: [{ on: 'enter', unlessFlags: [FLAGS.maisonFelixVisitee], steps: CABANE_PLAN }],
  },

  // Saint-Ay — la cabane des cousins : la pièce de Fortree City sans son tronc, meublée d'objets de Rubis/Saphir
  // (image d'un seul tenant, voir frlgArt.js CABANE_FRAMES) : commode et plante contre le mur, tableau, deux longues
  // tables en bois avec des peluches entre elles, tapis, coussins. Felix, Joshua et Yanis sont assis derrière les
  // tables (redessinées par-dessus eux) ; on leur parle par-dessus la table.
  cabane: {
    name: 'Cabane',
    backdrop: { sheet: FRLG_SHEETS.cabane, frame: (scene) => cabaneFrame(scene, 'room') },
    overlays: [cabaneOverlay('tableLeft'), cabaneOverlay('tableRight')],
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',   // mur du fond (tableau)
      'XoommooX',   // places derrière les tables ; commode et plante au milieu
      'mmmmmmmm',   // tables et peluches
      'oooooooo',
      'moooooom',   // coussins
      'oooooooo',
      'oooEEooo',   // tapis de sortie (l'échelle)
    ]),
    spawn: { x: 3, y: 6, facing: 'up' },
    objects: [
      { x: 1, y: 3, script: FELIX_AT_CABANE },
      { x: 5, y: 3, script: [{ speaker: 'Joshua', say: ['Personne n\'entre sans le mot de passe.'] }] },
      { x: 6, y: 3, script: [{ speaker: 'Yanis', say: ['On a vraiment un mot de passe ?'] }] },
      { x: 0, y: 3, dialogue: ['La table du QG des cousins.'] },
      { x: 2, y: 3, dialogue: ['La table du QG des cousins.'] },
      { x: 7, y: 3, dialogue: ['La table du QG des cousins.'] },
      { x: 3, y: 3, dialogue: ['Des peluches de Pokémon, alignées entre les deux tables.'] },
      { x: 4, y: 3, dialogue: ['Des peluches de Pokémon, alignées entre les deux tables.'] },
      { x: 0, y: 5, dialogue: ['Un coussin moelleux.'] },
      { x: 7, y: 5, dialogue: ['Un coussin moelleux.'] },
    ],
    npcs: [
      { id: 'felix-cabane', name: 'Felix', x: 1, y: 2, facing: 'down', color: 0x9060d0, still: true, ifFlags: [FLAGS.cabaneFinie] },
      { id: 'joshua-cabane', name: 'Joshua', x: 5, y: 2, facing: 'down', color: 0x20a0c0, still: true, ifFlags: [FLAGS.cabaneFinie] },
      { id: 'yanis-cabane', name: 'Yanis', x: 6, y: 2, facing: 'down', color: 0xc0b040, still: true, ifFlags: [FLAGS.cabaneFinie] },
    ],
    // La cabane toute neuve : les quatre cousins s'y installent (une seule fois).
    events: [{ on: 'enter', ifFlags: [FLAGS.cabaneFinie], unlessSouvenirs: [ROLES.cousins.id], steps: CABANE_FETE }],
  },

  // Saint-Ay — la clinique (toit d'ardoise, porte rouge), façon Rouge Feu : Maman vient d'accoucher de Fanny.
  hospital: {
    name: 'Clinique',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'mmommommoooomm', // lits, ordinateur
      'mmommommoooooo',
      'oooooooooooooo',
      'ooooommmmooooo', // accueil
      'mooommmmooooom',
      'moooooooooooom',
      'ooooooEEoooooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'bed', x: 3, y: 2 },
      { kind: 'bed', x: 6, y: 2 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'notice', x: 10, y: 0 },
      { kind: 'computer', x: 12, y: 1 },
      { kind: 'pottedPlant', x: 13, y: 2 },
      { kind: 'table', x: 5, y: 5 },
      { kind: 'plant', x: 0, y: 6 },
      { kind: 'plant', x: 13, y: 6 },
    ],
    spawn: { x: 7, y: 7, facing: 'up' },
    objects: [
      { x: 1, y: 3, ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.cabaneFinie], dialogue: ['Maman se repose, les yeux mi-clos.'] },
      { x: 4, y: 3, ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.cabaneFinie], dialogue: ['Fanny dort, son petit poing serré.'] },
      { x: 12, y: 2, dialogue: ['Un ordinateur. Des noms de bébés défilent à l\'écran.'] },
    ],
    // Maman et Fanny sont couchées chacune dans un lit ; Papa et Manon entre les deux.
    npcs: [
      {
        id: 'maman-hopital', name: 'Maman', x: 0, y: 3, facing: 'down', color: 0xe86fa0, still: true, inBed: true,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.cabaneFinie],
        dialogue: ['Fanny dort. Va voir tes cousins, ils viennent d\'emménager au village.'],
      },
      {
        id: 'fanny-hopital', name: 'Fanny', x: 3, y: 3, facing: 'down', still: true, inBed: true, child: true,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.cabaneFinie],
        dialogue: ['Fanny ouvre un œil et attrape ton doigt.'],
      },
      {
        id: 'papa-hopital', name: 'Papa', x: 2, y: 4, facing: 'up', color: 0x3f6fd8,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.cabaneFinie],
        dialogue: ['Une petite sœur… Te voilà grand frère, maintenant.'],
      },
      {
        id: 'manon-hopital', name: 'Manon', x: 5, y: 4, facing: 'left', color: 0xf0a030,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.cabaneFinie],
        dialogue: ['Je pourrai jouer avec elle, moi aussi ? Plus tard ? Bon…'],
      },
    ],
    // Papa et Manon arrivent avec toi : la naissance de Fanny.
    events: [{ on: 'enter', ifFlags: [FLAGS.familleSuit], unlessFlags: [FLAGS.familleArrivee], steps: BIRTH }],
  },

  // Montépilloy — la grange de M. Bouly, façon Rouge Feu : établi (longue table de Rubis/Saphir) sous la
  // fenêtre, caisses de légumes, d'oranges et de tomates et une jarre du marché de Slateport (rs-crates.png),
  // tonneaux (dessinés dans le code). La pièce de tracteur est au fond du tonneau du fond à droite (une fois que
  // M. Bouly t'en a parlé) ; au cache-cache, Benoît se cache dans celui de gauche.
  boulyBarn: {
    name: 'Grange de M. Bouly',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXX',
      'XXXXXXXXX',
      'mmmoommOO',   // établi, caisses, tonneaux
      'ooooooooO',
      'Ooooooooo',
      'Oooooommo',   // caisse de tomates, jarre
      'ooooooooo',
      'ooooEoooo',
    ]),
    decor: [
      { kind: 'window', x: 3, y: 0 },
      { kind: 'notice', x: 6, y: 0 },
      { kind: 'longTable', x: 0, y: 2 },
      { kind: 'greenCrate', x: 5, y: 2 },
      { kind: 'orangeCrate', x: 6, y: 2 },
      { kind: 'tomatoCrate', x: 6, y: 5 },
      { kind: 'jar', x: 7, y: 5 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    objects: [
      ...[0, 1, 2].map((x) => ({ x, y: 2, dialogue: ["L'établi de M. Bouly : des outils, des boulons… pas la pièce qu'il lui faut."] })),
      { x: 5, y: 2, dialogue: ['Une caisse de salades du potager.'] },
      { x: 6, y: 2, dialogue: ["Une caisse d'oranges."] },
      { x: 6, y: 5, dialogue: ['Une caisse de tomates bien mûres.'] },
      { x: 7, y: 5, dialogue: ['Une jarre de miel, bien fermée.'] },
      { x: 7, y: 2, dialogue: ['Un tonneau plein de grain.'] },
      { x: 8, y: 2, dialogue: ['Un tonneau plein de grain.'] },
      BENOIT_HIDING,
      { x: 0, y: 4, dialogue: ['Un tonneau de cidre. Ça sent la pomme.'] },
      { x: 0, y: 5, dialogue: ['Un tonneau de cidre. Ça sent la pomme.'] },
      // Le tonneau du fond à droite cache la pièce de tracteur (une fois que M. Bouly t'en a parlé).
      { x: 8, y: 3, unlessFlags: [FLAGS.boulyDemande], dialogue: ['Un vieux tonneau, plein de bric-à-brac.'] },
      {
        x: 8, y: 3,
        ifFlags: [FLAGS.boulyDemande],
        dialogue: ['Tu fouilles le bric-à-brac… Au fond du tonneau, une pièce de tracteur !'],
        after: ['Il ne reste que du bric-à-brac.'],
        item: ITEMS.pieceTracteur,
        setFlag: FLAGS.pieceTrouvee,
      },
    ],
    // Cache-cache : le tonneau de Benoît bouge tout seul, une fois Margaux et Étienne trouvés.
    events: [BARREL_MOVES],
  },

  // Montépilloy — la maison de la famille, façon Rouge Feu : cuisine, télé, table, plantes.
  montHouse: {
    name: 'Maison de Montépilloy',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmmooommoη',   // escalier vers la chambre (étage), contre le mur de droite
      'oooooooooo',
      'ooommmmooo',
      'moommmmoom',
      'moooooooom',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'kitchen', x: 0, y: 1 },
      { kind: 'fridge', x: 2, y: 1 },
      { kind: 'window', x: 4, y: 0 },
      { kind: 'blueShelf', x: 6, y: 1 },
      { kind: 'crtTv', x: 7, y: 2 },
      { kind: 'table', x: 3, y: 4 },
      { kind: 'plant', x: 0, y: 5 },
      { kind: 'plant', x: 9, y: 5 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    // Papa, Maman et Manon au salon ; Jean et Fanny sont à l'étage (le jour de septembre, Papa, Maman et Jean
    // sont dehors, devant la maison). Scénario : voir data/montepilloyStory.js.
    npcs: [
      {
        id: 'maman-mont', name: 'Maman', x: 6, y: 3, facing: 'left', color: 0xe86fa0,
        unlessFlags: [FLAGS.septembre], script: MAMAN,
      },
      {
        id: 'papa-mont', name: 'Papa', x: 4, y: 3, facing: 'down', color: 0x3f6fd8,
        unlessFlags: [FLAGS.septembre], script: PAPA,
      },
      {
        id: 'manon-mont', name: 'Manon', x: 7, y: 4, facing: 'left', color: 0xf0a030,
        dialogue: ['Le collège ? Tu verras, on s\'y fait vite. Et le matin, tu feras la route avec les copains.'],
      },
    ],
    // Pierre arrive, ramené par Manon : Maman l'accueille.
    events: [{ on: 'enter', ifFlags: [FLAGS.manonMaison], unlessFlags: [FLAGS.mamanAccueil], steps: MAMAN_WELCOME }],
    triggers: [{ x: 9, y: 2, warp: { interior: 'montHouseUp', x: 12, y: 3, facing: 'down' } }],
  },

  // Collège Bonsecours (route de Bonsecours) — le hall : la principale derrière l'accueil, panneaux d'affichage,
  // et deux escaliers encastrés vers les salles de classe (maths à gauche, français à droite) ; la salle de
  // sciences est un étage plus haut, au-dessus de la salle de maths.
  bonsecours: {
    name: 'Collège Bonsecours',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ηooooooooooooη', // escaliers : salle de maths (gauche), salle de français (droite)
      'oooommmooooooo', // accueil
      'oooooooooooooo',
      'moooooooooooom',
      'oooooooooooooo',
      'moooooooooooom',
      'moooooEEooooom',
    ]),
    decor: [
      { kind: 'notice', x: 3, y: 0 },
      { kind: 'window', x: 6, y: 0 },
      { kind: 'notice', x: 10, y: 0 },
      { kind: 'longTable', x: 4, y: 3 },
      { kind: 'pottedPlant', x: 0, y: 5 },
      { kind: 'pottedPlant', x: 13, y: 5 },
      { kind: 'plant', x: 0, y: 7 },
      { kind: 'plant', x: 13, y: 7 },
    ],
    spawn: { x: 6, y: 7, facing: 'up' },
    triggers: [
      { x: 0, y: 2, warp: { interior: 'bonsecoursMaths', x: 13, y: 3, facing: 'down' } },
      { x: 13, y: 2, warp: { interior: 'bonsecoursFrancais', x: 13, y: 3, facing: 'down' } },
    ],
    objects: [
      ...[4, 5, 6].map((x) => ({ x, y: 3, script: PRINCIPALE })),
      { x: 3, y: 1, dialogue: ['Emploi du temps de 6e B : maths, français, sciences… et sport le vendredi.'] },
      { x: 10, y: 1, dialogue: ['« Club de théâtre : inscriptions auprès de la principale. »'] },
    ],
    npcs: [
      // La quête Bonsecours n'est pas encore écrite : la principale la clôt d'un mot, ce qui ouvre la route du
      // Prytanée (voir maps/routeBonsecours.js). On lui parle par-dessus le comptoir d'accueil.
      { id: 'principale', name: 'Principale', x: 5, y: 2, facing: 'down', color: 0x8c5ca8, script: PRINCIPALE },
      {
        id: 'surveillant', name: 'Surveillant', x: 9, y: 5, facing: 'left', color: 0x5c6c8c,
        dialogue: ['On ne court pas dans les couloirs ! Les salles de classe sont en haut des escaliers.'],
      },
    ],
  },

  // Collège Bonsecours — salle de maths (escalier du hall à droite ; à gauche, l'escalier de la salle de sciences).
  bonsecoursMaths: {
    name: 'Salle de maths',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ηooooommmooooξ', // bureau du professeur, escaliers
      'oooooooooooooo',
      'ommommommommoo', // pupitres
      'oooooooooooooo',
      'ommommommommoo',
      'moooooooooooom',
      'moooooooooooom',
    ]),
    decor: [
      { kind: 'window', x: 3, y: 0 },
      { kind: 'chalkboard', x: 5, y: 1 },
      { kind: 'window', x: 10, y: 0 },
      { kind: 'longTable', x: 5, y: 2 },
      ...[1, 4, 7, 10].map((x, i) => ({ kind: i % 2 ? 'paperDesk' : 'schoolDesk', x, y: 4 })),
      ...[1, 4, 7, 10].map((x, i) => ({ kind: i % 2 ? 'schoolDesk' : 'paperDesk', x, y: 6 })),
      { kind: 'plant', x: 0, y: 7 },
      { kind: 'plant', x: 13, y: 7 },
    ],
    spawn: { x: 13, y: 3, facing: 'down' },
    triggers: [
      { x: 13, y: 2, warp: { interior: 'bonsecours', x: 0, y: 3, facing: 'down' } },
      { x: 0, y: 2, warp: { interior: 'bonsecoursSciences', x: 0, y: 3, facing: 'down' } },
    ],
    objects: [
      { x: 5, y: 1, dialogue: ['Au tableau : « Le carré de l\'hypoténuse est égal à la somme des carrés des deux autres côtés. »'] },
    ],
    npcs: [
      { id: 'prof-maths', name: 'Professeur', x: 9, y: 2, facing: 'down', color: 0x4c6c9c, dialogue: ['Sors ton compas, Pierre : aujourd\'hui, géométrie !'] },
      { id: 'margaux-college', name: 'Margaux', x: 3, y: 5, facing: 'up', color: 0xf08080, dialogue: ['On est dans la même classe, comme promis ! Enfin… presque promis.'] },
    ],
  },

  // Collège Bonsecours — salle de français (escalier du hall à droite).
  bonsecoursFrancais: {
    name: 'Salle de français',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'oooooommmooooξ', // bureau du professeur, escaliers
      'oooooooooooooo',
      'ommommommommoo', // pupitres
      'oooooooooooooo',
      'ommommommommoo',
      'moooooooooooom',
      'moooooooooooom',
    ]),
    decor: [
      { kind: 'window', x: 1, y: 0 },
      { kind: 'chalkboard', x: 5, y: 1 },
      { kind: 'window', x: 10, y: 0 },
      { kind: 'longTable', x: 5, y: 2 },
      ...[1, 4, 7, 10].map((x, i) => ({ kind: i % 2 ? 'paperDesk' : 'schoolDesk', x, y: 4 })),
      ...[1, 4, 7, 10].map((x, i) => ({ kind: i % 2 ? 'schoolDesk' : 'paperDesk', x, y: 6 })),
      { kind: 'plant', x: 0, y: 7 },
      { kind: 'plant', x: 13, y: 7 },
    ],
    spawn: { x: 13, y: 3, facing: 'down' },
    triggers: [{ x: 13, y: 2, warp: { interior: 'bonsecours', x: 13, y: 3, facing: 'down' } }],
    objects: [
      { x: 5, y: 1, dialogue: ['Au tableau : « Rédaction : racontez votre plus beau souvenir de vacances. »'] },
    ],
    npcs: [
      { id: 'prof-francais', name: 'Professeure', x: 9, y: 2, facing: 'down', color: 0xc06080, dialogue: ['Ta rédaction sur Saint-Ay était très réussie. Tu as le sens du récit !'] },
      { id: 'etienne-college', name: 'Étienne', x: 6, y: 5, facing: 'up', color: 0x6080a0, dialogue: ['Le car le matin, le self le midi… Le collège, c\'est la belle vie !'] },
    ],
  },

  // Collège Bonsecours — salle de sciences, au-dessus de la salle de maths : paillasses et vitrine.
  bonsecoursSciences: {
    name: 'Salle de sciences',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ξooooommmoooom', // bureau du professeur, vitrine
      'oooooooooooooo',
      'oommmooommmooo', // paillasses
      'oooooooooooooo',
      'oommmooommmooo',
      'moooooooooooom',
      'moooooooooooom',
    ]),
    decor: [
      { kind: 'window', x: 3, y: 0 },
      { kind: 'chalkboard', x: 5, y: 1 },
      { kind: 'glassCabinet', x: 13, y: 1 },
      { kind: 'longTable', x: 5, y: 2 },
      ...[[2, 4], [8, 4], [2, 6], [8, 6]].map(([x, y]) => ({ kind: 'longTable', x, y })),
      { kind: 'plant', x: 0, y: 7 },
      { kind: 'plant', x: 13, y: 7 },
    ],
    spawn: { x: 0, y: 3, facing: 'down' },
    triggers: [{ x: 0, y: 2, warp: { interior: 'bonsecoursMaths', x: 0, y: 3, facing: 'down' } }],
    objects: [
      { x: 13, y: 2, dialogue: ['La vitrine : un squelette en plastique, des bocaux et un vieux microscope.'] },
    ],
    npcs: [
      { id: 'prof-sciences', name: 'Professeur de sciences', x: 9, y: 2, facing: 'down', color: 0x4c8c5c, dialogue: ['Aujourd\'hui, on observe des feuilles au microscope. Les feuilles des arbres de Bonsecours !'] },
    ],
  },

  // Montépilloy — l'étage de la maison : la chambre des enfants, quatre lits côte à côte (Pierre, Manon, Jean,
  // Fanny), escalier pour redescendre à droite. Jean et Fanny y jouent.
  montHouseUp: {
    name: 'Chambre des enfants',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXX',
      'XXXXXXXXXXXXX',
      'mmommommommoξ',   // quatre lits, escalier vers le salon contre le mur de droite
      'mmommommommoo',
      'ooooooooooooo',
      'mooooooooommo',   // plante, étagère
      'oooooooooommo',
    ]),
    decor: [
      ...[0, 3, 6, 9].map((x) => ({ kind: 'bed', x, y: 2 })),
      { kind: 'window', x: 2, y: 0 },
      { kind: 'painting', x: 8, y: 0 },
      { kind: 'pottedPlant', x: 0, y: 5 },
      { kind: 'shelf', x: 10, y: 5 },
    ],
    spawn: { x: 12, y: 3, facing: 'down' },
    triggers: [{ x: 12, y: 2, warp: { interior: 'montHouse', x: 9, y: 3, facing: 'down' } }],
    npcs: [
      {
        id: 'fanny-mont', name: 'Fanny', x: 5, y: 5, facing: 'up', color: 0xf0c0c0,
        dialogue: ['Fanny fait rouler un petit tracteur en bois sur le parquet.'],
      },
      // Jean, ton petit frère : après le cache-cache, il t'emmène comme assistant pour réparer le tracteur de
      // M. Bouly (il te suit).
      {
        id: 'jean', name: 'Jean', x: 7, y: 5, facing: 'left', color: 0x3c7c5c,
        unlessFlags: [FLAGS.jeanQuetes], script: JEAN,
      },
    ],
    objects: [
      ...[0, 1].map((x) => ({ x, y: 3, dialogue: ['Ton lit, contre la fenêtre.'] })),
      ...[3, 4].map((x) => ({ x, y: 3, dialogue: ['Le lit de Manon, fait au carré.'] })),
      ...[6, 7].map((x) => ({ x, y: 3, dialogue: ['Le lit de Jean. Un tournevis dépasse de sous l\'oreiller.'] })),
      ...[9, 10].map((x) => ({ x, y: 3, dialogue: ['Le lit de Fanny, plein de peluches.'] })),
      { x: 0, y: 5, dialogue: ['Une petite plante verte.'] },
      { x: 10, y: 5, dialogue: ['Des livres de classe, des BD et les jouets de Fanny.'] },
      { x: 11, y: 5, dialogue: ['Des livres de classe, des BD et les jouets de Fanny.'] },
    ],
  },

  // Montépilloy — l'école, façon Rouge Feu : tableau vert, bureau du maître, deux rangées de pupitres ; Margaux,
  // Étienne et Benoît le dernier jour de CM2.
  school: {
    name: 'École',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ooooommmoooooo', // bureau du maître
      'oooooooooooooo',
      'ommommommommoo', // pupitres
      'oooooooooooooo',
      'ommommommommoo',
      'moooooooooooom',
      'moooooEEooooom',
    ]),
    decor: [
      { kind: 'window', x: 1, y: 0 },
      { kind: 'chalkboard', x: 5, y: 1 },
      { kind: 'window', x: 11, y: 0 },
      { kind: 'longTable', x: 5, y: 2 },
      ...[1, 4, 7, 10].map((x, i) => ({ kind: i % 2 ? 'paperDesk' : 'schoolDesk', x, y: 4 })),
      ...[1, 4, 7, 10].map((x, i) => ({ kind: i % 2 ? 'schoolDesk' : 'paperDesk', x, y: 6 })),
      { kind: 'plant', x: 0, y: 7 },
      { kind: 'plant', x: 13, y: 7 },
    ],
    spawn: { x: 6, y: 7, facing: 'up' },
    // Dernier jour de CM2 : les copains de classe, avant la dernière partie de cache-cache (voir
    // data/montepilloyStory.js) ; ils sont partis se cacher une fois la partie lancée.
    npcs: [
      {
        id: 'margaux', name: 'Margaux', x: 4, y: 3, facing: 'down', color: 0xf08080,
        unlessFlags: [FLAGS.cacheCache],
        dialogue: ['Dernier jour de CM2 ! À la sortie, on fait une partie de cache-cache. La dernière.'],
      },
      {
        id: 'etienne', name: 'Étienne', x: 9, y: 5, facing: 'left', color: 0x6080a0,
        unlessFlags: [FLAGS.cacheCache],
        dialogue: ['L\'an prochain, c\'est le collège. Il paraît qu\'il y a un self, avec des frites tous les jours.'],
      },
      {
        id: 'benoit', name: 'Benoît', x: 3, y: 5, facing: 'up', color: 0xa07040,
        unlessFlags: [FLAGS.cacheCache],
        dialogue: ['Je connais une cachette que personne ne trouvera. Jamais.'],
      },
      // La partie finie, les copains sont revenus à l'école chercher leurs cartables.
      {
        id: 'margaux-fin', name: 'Margaux', x: 4, y: 3, facing: 'down', color: 0xf08080,
        ifSouvenirs: [ROLES.copainsMontepilloy.id], unlessFlags: [FLAGS.septembre],
        dialogue: ['Promis, hein ? L\'été prochain, on refait une partie. Dans tout le village.'],
      },
      {
        id: 'etienne-fin', name: 'Étienne', x: 9, y: 5, facing: 'left', color: 0x6080a0,
        ifSouvenirs: [ROLES.copainsMontepilloy.id], unlessFlags: [FLAGS.septembre],
        dialogue: ['Benoît dans un tonneau… Il fallait y penser !'],
      },
      {
        id: 'benoit-fin', name: 'Benoît', x: 3, y: 5, facing: 'up', color: 0xa07040,
        ifSouvenirs: [ROLES.copainsMontepilloy.id], unlessFlags: [FLAGS.septembre],
        dialogue: ['Je sens encore le cidre… Ma mère va me tuer.'],
      },
    ],
    events: [{ on: 'enter', unlessFlags: [FLAGS.ecoleCm2], steps: LAST_DAY }],
  },

  // Prytanée — bâtiment 1 : ton dortoir. Tanguy et Geoffrey y sont.
  // Prytanée — le dortoir, façon Rouge Feu : cinq lits alignés contre le mur, casiers, fenêtres.
  dortoir: {
    name: 'Dortoir',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'mmommommommomm', // lits
      'mmommommommomm',
      'oooooooooooooo',
      'mmoooooooooomm', // casiers
      'mmoooooooooomm',
      'ooooooEEoooooo',
    ]),
    decor: [
      ...[0, 3, 6, 9, 12].map((x) => ({ kind: 'bed', x, y: 2 })),
      { kind: 'window', x: 2, y: 0 },
      { kind: 'notice', x: 7, y: 0 },
      { kind: 'window', x: 10, y: 0 },
      ...[0, 1, 12, 13].map((x) => ({ kind: 'cabinet', x, y: 5 })),
    ],
    spawn: { x: 7, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'tanguy', name: 'Tanguy', x: 3, y: 4, facing: 'down', color: 0x8c6c3c,
        dialogue: ['[Tanguy - texte provisoire] Salut ! Ceci est le premier dialogue de Tanguy.'],
        after: ['[Tanguy - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-tanguy', name: 'Souvenir de Tanguy' },
      },
      {
        id: 'geoffrey', name: 'Geoffrey', x: 10, y: 4, facing: 'left', color: 0x4c7cb0,
        dialogue: ['[Geoffrey - texte provisoire] Bonjour ! Ceci est le premier dialogue de Geoffrey.'],
        after: ['[Geoffrey - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-geoffrey', name: 'Souvenir de Geoffrey' },
      },
    ],
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.dortoirVisite],
        steps: [{ say: ["Tu déposes tes affaires au pied de ton lit."] }, { setFlag: FLAGS.dortoirVisite }],
      },
    ],
  },

  // Prytanée — bâtiment 2 : la salle de cours. Le professeur te remet ton baccalauréat.
  // Prytanée — la salle de cours, façon Rouge Feu : tableau vert, bureau de l'instructeur, pupitres, étagères.
  salleCours: {
    name: 'Salle de cours',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'mmoooooooooomm',
      'mmoooommmooomm', // bureau de l'instructeur
      'oooooooooooooo',
      'ommommommommoo', // pupitres
      'oooooooooooooo',
      'ommommommommoo',
      'moooooooooooom',
      'moooooEEooooom',
    ]),
    decor: [
      { kind: 'shelf', x: 0, y: 2 },
      { kind: 'chalkboard', x: 5, y: 1 },
      { kind: 'notice', x: 10, y: 0 },
      { kind: 'shelf', x: 12, y: 2 },
      { kind: 'longTable', x: 5, y: 3 },
      ...[1, 4, 7, 10].map((x) => ({ kind: 'paperDesk', x, y: 5 })),
      ...[1, 4, 7, 10].map((x) => ({ kind: 'schoolDesk', x, y: 7 })),
      { kind: 'plant', x: 0, y: 8 },
      { kind: 'plant', x: 13, y: 8 },
    ],
    spawn: { x: 6, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'professeur', name: 'Professeur', x: 6, y: 2, facing: 'down', color: 0x6c4c8c,
        dialogue: [
          '[Professeur - texte provisoire] Te voilà ! Félicitations, tu as réussi tes examens.',
          'Voici ton baccalauréat. Il t\'ouvre les portes de la suite : Bordeaux !',
        ],
        after: ['[Professeur - texte provisoire] Le portail nord du Prytanée mène à Bordeaux. Bonne route !'],
        item: ITEMS.baccalaureat,
      },
    ],
  },

  // Bordeaux — l'agence immobilière : l'agent te remet les clés de l'appartement.
  agence: {
    name: 'Agence immobilière',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoooomm',
      'oommmooo', // bureau
      'oooooooo',
      'oooooooo',
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'blueShelf', x: 0, y: 1 },
      { kind: 'cabinet', x: 1, y: 1 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'bookshelf', x: 6, y: 0 },
      { kind: 'longTable', x: 2, y: 3 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'agent', name: 'Agent immobilier', x: 3, y: 4, facing: 'down', color: 0x3c4c6c,
        dialogue: [
          "[Agent - texte provisoire] Bonjour ! Vous venez pour l'appartement ?",
          "Voici vos clés. C'est l'immeuble juste à gauche de l'agence.",
        ],
        after: ["[Agent - texte provisoire] Votre immeuble est juste à gauche de l'agence."],
        item: ITEMS.clesAppartement,
      },
    ],
  },

  // Bordeaux — ton appartement : tu poses tes affaires et rencontres Ousmane, ton colocataire.
  appartement: {
    name: 'Appartement',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoommoo', // deux lits, table
      'mmoommoo',
      'oooooooo',
      'moooooom',
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'computerDesk', x: 4, y: 2 },
      { kind: 'window', x: 2, y: 0 },
      { kind: 'painting', x: 6, y: 0 },
      { kind: 'pottedPlant', x: 0, y: 5 },
      { kind: 'pottedPlant', x: 7, y: 5 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'ousmane', name: 'Ousmane', x: 5, y: 4, facing: 'left', color: 0x2c8c5c,
        dialogue: [
          "[Ousmane - texte provisoire] Salut ! Moi c'est Ousmane, ton colocataire.",
          'Bienvenue à Bordeaux !',
        ],
        after: ['[Ousmane - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-ousmane', name: "Souvenir d'Ousmane" },
      },
    ],
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.appartementVisite],
        steps: [
          { say: ['Tu poses tes affaires dans ta chambre.'] },
          { setFlag: FLAGS.appartementVisite },
          { talk: 'ousmane' },
        ],
      },
    ],
  },

  // Bordeaux — l'école KEDGE : on t'y remet ton diplôme d'anglais.
  kedge: {
    name: 'KEDGE',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      'mmoooooooomm',
      'ooooommmoooo', // accueil
      'oooooooooooo',
      'oooooooooooo',
      'moooooooooom',
      'oooooooooooo',
      'moooooooooom',
      'oooooooooooo',
      'ooooooEEoooo',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'chalkboard', x: 4, y: 1 },
      { kind: 'bookshelf', x: 10, y: 0 },
      { kind: 'longTable', x: 5, y: 3 },
      { kind: 'pottedPlant', x: 0, y: 6 },
      { kind: 'pottedPlant', x: 11, y: 6 },
      { kind: 'pottedPlant', x: 0, y: 8 },
      { kind: 'pottedPlant', x: 11, y: 8 },
    ],
    spawn: { x: 6, y: 9, facing: 'up' },
    npcs: [
      {
        id: 'prof-anglais', name: "Professeure d'anglais", x: 6, y: 4, facing: 'down', color: 0xb04c6c,
        dialogue: [
          "[Professeure - texte provisoire] Bienvenue à KEDGE !",
          "Voici ton diplôme d'anglais. Il te permettra d'aller plus loin.",
        ],
        after: ["[Professeure - texte provisoire] Avec ce diplôme, la route vers l'est t'est ouverte."],
        item: ITEMS.diplomeAnglais,
      },
    ],
  },

  // Hull — l'université : un professeur te remet ton diplôme.
  hullUniversity: {
    name: 'Université de Hull',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX', // tableau
      'XXXXXXXXXXXX',
      'mmoooooooomm',
      'ooooommmoooo', // bureau du professeur
      'oooooooooooo',
      'ommommommomm', // tables
      'oooooooooooo',
      'ommommommomm',
      'oooooooooooo',
      'oooooooooooo',
      'ooooooEEoooo',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'chalkboard', x: 4, y: 1 },
      { kind: 'bookshelf', x: 10, y: 0 },
      { kind: 'longTable', x: 5, y: 3 },
      { kind: 'paperDesk', x: 1, y: 5 },
      { kind: 'schoolDesk', x: 4, y: 5 },
      { kind: 'paperDesk', x: 7, y: 5 },
      { kind: 'schoolDesk', x: 10, y: 5 },
      { kind: 'schoolDesk', x: 1, y: 7 },
      { kind: 'paperDesk', x: 4, y: 7 },
      { kind: 'schoolDesk', x: 7, y: 7 },
      { kind: 'paperDesk', x: 10, y: 7 },
    ],
    spawn: { x: 6, y: 9, facing: 'up' },
    npcs: [
      // Avant la soirée, puis après les révisions : l'examen et le Diplôme de Hull.
      {
        id: 'prof-hull', name: 'Professor', x: 6, y: 4, facing: 'down', color: 0x5c3c7c,
        unlessFlags: [FLAGS.revisions, FLAGS.mailLu],
        dialogue: ['Welcome to Hull!'],
      },
      {
        id: 'prof-hull-examen', name: 'Professor', x: 6, y: 4, facing: 'down', color: 0x5c3c7c,
        ifFlags: [FLAGS.revisions], unlessFlags: [FLAGS.mailLu],
        script: [
          { ifItems: [ITEMS.diplomeHull.id], speaker: 'Professor', say: ["Well done! Le bus rouge t'emmènera à l'aéroport."], end: true },
          ...EXAM,
        ],
      },
      // De retour après le mail d'Amsterdam : ta nouvelle affectation.
      {
        id: 'prof-hull-echange', name: 'Professor', x: 6, y: 4, facing: 'down', color: 0x5c3c7c,
        ifFlags: [FLAGS.mailLu],
        dialogue: [
          '[Professor - texte provisoire] Welcome back! Voici ta nouvelle affectation :',
          'un échange universitaire à New Delhi, en Inde. Voici ton billet d\'avion !',
          "Le bus rouge devant l'université t'emmènera à l'aéroport.",
        ],
        after: ["[Professor - texte provisoire] Prends le bus rouge pour l'aéroport. Good luck!"],
        item: ITEMS.billetNewDelhi,
      },
    ],
  },

  // Hull — maison à la porte rouge (en haut) : Romain et Paul.
  // Hull — chez Léo, avec Romain et Paul (toit d'ardoise, en haut de Newland Avenue). Scénario : data/hullStory.js.
  hullHouse: {
    name: 'Chez Léo',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoooomm',
      'oooooooo',
      'oommmmoo',
      'oommmmoo',
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'kitchen', x: 0, y: 1 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'blueShelf', x: 6, y: 1 },
      { kind: 'fridge', x: 7, y: 1 },
      { kind: 'table', x: 2, y: 4 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'leo-maison', name: 'Léo', x: 6, y: 6, facing: 'left',
        unlessFlags: [FLAGS.leoPlan],
        dialogue: ['Ce soir, on sort. Tout le monde.'],
      },
      {
        id: 'romain', name: 'Romain', x: 1, y: 4, facing: 'right', color: 0xc0602c,
        unlessFlags: [FLAGS.leoPlan],
        dialogue: ['Vous sortez ce soir ? On vous rejoint à l\'Asylum.'],
      },
      {
        id: 'paul', name: 'Paul', x: 6, y: 4, facing: 'left', color: 0x3c8cb0,
        unlessFlags: [FLAGS.leoPlan],
        dialogue: ['On a nos propres plans avant.'],
      },
      // Après la soirée : de retour chez eux.
      ...[['leo-apres', 'Léo', 6, 6, 'J\'ai lu la même page six fois… hier. Et aujourd\'hui aussi.'],
        ['romain-apres', 'Romain', 1, 4, 'Quelle soirée ! On en reparlera longtemps.'],
        ['paul-apres', 'Paul', 6, 4, 'Bonne chance pour les exams, Pierre.']].map(([id, name, x, y, line]) => ({
        id, name, x, y, facing: 'down', ifSouvenirs: [ROLES.bandeHull.id], dialogue: [line],
      })),
    ],
    events: [{ on: 'enter', ifFlags: [FLAGS.leoAppel], unlessFlags: [FLAGS.leoPlan], steps: LEO_PLAN }],
  },

  // Hull — la coloc de Pierre et Ousmane, sur Newland Avenue.
  hullColoc: {
    name: 'La coloc',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoommom',
      'mmoommoo',
      'oooommmm',
      'oooommmm',
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'window', x: 2, y: 0 },
      { kind: 'computerDesk', x: 4, y: 2 },
      { kind: 'pottedPlant', x: 7, y: 2 },
      { kind: 'table', x: 4, y: 4 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'ousmane-coloc', name: 'Ousmane', x: 1, y: 5, facing: 'right',
        ifFlags: [FLAGS.ousmaneRentre], unlessFlags: [FLAGS.ousmaneSuit],
        script: [
          { ifFlags: [FLAGS.leoAppel], speaker: 'Ousmane', say: ['Léo t\'attend chez lui, la maison au toit d\'ardoise en haut de Newland Avenue.'], end: true },
          { speaker: 'Ousmane', say: ['Bienvenue à la coloc !'] },
        ],
      },
      {
        id: 'ousmane-apres', name: 'Ousmane', x: 1, y: 5, facing: 'right',
        ifSouvenirs: [ROLES.bandeHull.id],
        dialogue: ['Les exams… Allez, on va y arriver.'],
      },
    ],
    events: [
      { on: 'enter', ifFlags: [FLAGS.ousmaneRentre], unlessFlags: [FLAGS.leoAppel], steps: LEO_CALLED },
      { on: 'enter', ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.ousmaneSuit], steps: OUSMANE_JOINS },
    ],
  },

  // Hull — la coloc de Charlotte et Anaïs, à côté de celle de Pierre.
  hullColoc2: {
    name: 'Coloc de Charlotte et Anaïs',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'momoommm',
      'oooooomm',
      'mmmmoooo',
      'mmmmoooo',
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'pottedPlant', x: 0, y: 2 },
      { kind: 'crtTv', x: 2, y: 2 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'bed', x: 6, y: 2 },
      { kind: 'table', x: 0, y: 4 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'charlotte-coloc', name: 'Charlotte', x: 5, y: 4, facing: 'down',
        unlessFlags: [FLAGS.amiesSuivent],
        dialogue: ['On se prépare, on arrive !'],
      },
      {
        id: 'anais-coloc', name: 'Anaïs', x: 6, y: 5, facing: 'left',
        unlessFlags: [FLAGS.amiesSuivent],
        dialogue: ['Deux minutes !'],
      },
    ],
    events: [{ on: 'enter', ifFlags: [FLAGS.ousmaneSuit], unlessFlags: [FLAGS.amiesSuivent], steps: GIRLS_JOIN }],
  },

  // Hull — premier pub de Newland Avenue : commander une pinte au bar (on parle au barman par-dessus le comptoir).
  hullPubA: {
    name: 'Pub',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmoooooomm',
      'ooommmoooo',
      'oooooooooo',
      'mmommommoo',
      'oooooooooo',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'blueShelf', x: 0, y: 1 },
      { kind: 'glassCabinet', x: 1, y: 1 },
      { kind: 'painting', x: 4, y: 0 },
      { kind: 'glassCabinet', x: 8, y: 1 },
      { kind: 'cabinet', x: 9, y: 1 },
      { kind: 'longTable', x: 3, y: 3 },
      ...[0, 3, 6].map((x) => ({ kind: 'paperDesk', x, y: 5 })),
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    objects: [3, 4, 5].map((x) => ({ x, y: 3, script: PUB_A_BAR })),
    npcs: [{ id: 'barman-a', name: 'Barman', x: 4, y: 2, facing: 'down', still: true, dialogue: ['What can I get you?'] }],
  },

  // Hull — deuxième pub : retrouver la table de la bande, avec les verres.
  hullPubB: {
    name: 'Pub',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmmoooommm',
      'oooooooooo',
      'mmommommoo',
      'oooooooooo',
      'mmommommoo',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'kitchen', x: 0, y: 1 },
      { kind: 'fridge', x: 2, y: 1 },
      { kind: 'window', x: 4, y: 0 },
      { kind: 'glassCabinet', x: 7, y: 1 },
      { kind: 'blueShelf', x: 8, y: 1 },
      { kind: 'cabinet', x: 9, y: 1 },
      ...[0, 3, 6].flatMap((x) => [4, 6].map((y) => ({ kind: 'paperDesk', x, y }))),
    ],
    // Les verres de la bande, sur la table du fond à droite.
    decals: [{ kind: 'pints', x: 6, y: 4 }],
    spawn: { x: 4, y: 6, facing: 'up' },
    objects: [
      ...[6, 7].map((x) => ({ x, y: 4, script: PUB_B_TABLE })),
      ...[[0, 4], [1, 4], [3, 4], [4, 4], [0, 6], [1, 6], [3, 6], [4, 6], [6, 6], [7, 6]].map(([x, y]) => ({ x, y, script: PUB_B_OTHER })),
    ],
  },

  // Hull — The Asylum, la boîte de l'université : Romain et Paul, la piste de danse, la dernière chanson.
  hullAsylum: {
    name: 'The Asylum',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      'ooommmmmoooo',
      'oooooooooooo',
      'oooooooooooo',
      'oooooooooooo',
      'oooooooooooo',
      'oooooooooooo',
      'oooooEEooooo',
    ]),
    decor: [
      { kind: 'crtTv', x: 3, y: 2 },
      { kind: 'longTable', x: 4, y: 2 },
      { kind: 'crtTv', x: 7, y: 2 },
      { kind: 'notice', x: 1, y: 0 },
      { kind: 'notice', x: 10, y: 0 },
    ],
    // La piste de danse (dalles lumineuses), où il faut rejoindre tout le monde.
    decals: [{ kind: 'danceFloor', x: 4, y: 4, w: 4, h: 3, floor: true }],
    spawn: { x: 5, y: 7, facing: 'up' },
    npcs: [
      { id: 'romain-asylum', name: 'Romain', x: 2, y: 4, facing: 'right', ifFlags: [FLAGS.tableTrouvee], dialogue: ['Sur la piste, tout le monde !'] },
      { id: 'paul-asylum', name: 'Paul', x: 9, y: 4, facing: 'left', ifFlags: [FLAGS.tableTrouvee], dialogue: ['Enfin au complet !'] },
      { id: 'leo-asylum', name: 'Léo', x: 9, y: 6, facing: 'left', ifFlags: [FLAGS.tableTrouvee], dialogue: ['Allez, sur la piste !'] },
    ],
    events: [{ on: 'enter', ifFlags: [FLAGS.tableTrouvee], unlessFlags: [FLAGS.asylumFini], steps: ASYLUM_ENTER }],
    triggers: [4, 5, 6, 7].flatMap((x) => [4, 5, 6].map((y) => ({
      x, y, ifFlags: [FLAGS.tableTrouvee], unlessFlags: [FLAGS.asylumFini], script: ASYLUM_DANCE,
    }))),
  },

  // Hull — la bibliothèque Brynmor Jones : les révisions, le lendemain de la soirée.
  hullLibrary: {
    name: 'Bibliothèque Brynmor Jones',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      'mmmmoooommmm',
      'oooooooooooo',
      'oooommmmoooo',
      'oooommmmoooo',
      'oooooooooooo',
      'moooooooooom',
      'oooooEEooooo',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'bookshelf', x: 2, y: 0 },
      { kind: 'window', x: 5, y: 0 },
      { kind: 'bookshelf', x: 8, y: 0 },
      { kind: 'bookshelf', x: 10, y: 0 },
      { kind: 'table', x: 4, y: 4 },
      { kind: 'pottedPlant', x: 0, y: 7 },
      { kind: 'pottedPlant', x: 11, y: 7 },
    ],
    spawn: { x: 5, y: 7, facing: 'up' },
    npcs: [
      ...[['leo-biblio', 'Léo', 3, 4, 'right', "J'ai lu la même page six fois."],
        ['ousmane-biblio', 'Ousmane', 8, 4, 'left', 'Encore un chapitre, et on mange.'],
        ['charlotte-biblio', 'Charlotte', 3, 5, 'right', 'Chut ! On révise.'],
        ['anais-biblio', 'Anaïs', 8, 5, 'left', "L'examen, c'est à l'université. On va y arriver !"]].map(([id, name, x, y, facing, line]) => ({
        id, name, x, y, facing, still: true, ifSouvenirs: [ROLES.bandeHull.id], dialogue: [line],
      })),
    ],
    events: [{ on: 'enter', ifSouvenirs: [ROLES.bandeHull.id], unlessFlags: [FLAGS.revisions], steps: LIBRARY }],
  },


  // Hanoï — ta maison (maison-tube rose, 2e en haut à gauche).
  hanoiHome: {
    name: 'Ta maison à Hanoï',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoommoo', // lit, table basse
      'mmoooooo',
      'moooooom',
      'oooooooo',
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'window', x: 2, y: 0 },
      { kind: 'kitchen', x: 4, y: 1 },
      { kind: 'pottedPlant', x: 0, y: 4 },
      { kind: 'pottedPlant', x: 7, y: 4 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.travailEtape1],
        steps: [{ say: ["[Texte provisoire] Ta nouvelle maison à Hanoï. Demain, tu commences ton nouveau travail à l'agence de voyage !"] }],
      },
    ],
  },

  // Hanoï — l'agence de voyage : ton nouveau travail commence (étape 1).
  travelAgency: {
    name: 'Agence de voyage',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmoooooomm',
      'ooommmmooo', // comptoir
      'oooooooooo',
      'moooooooom',
      'oooooooooo',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'window', x: 4, y: 0 },
      { kind: 'notice', x: 7, y: 0 },
      { kind: 'bookshelf', x: 8, y: 0 },
      { kind: 'longTable', x: 3, y: 3 },
      { kind: 'crtTv', x: 6, y: 3 },
      { kind: 'pottedPlant', x: 0, y: 5 },
      { kind: 'pottedPlant', x: 9, y: 5 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'patron-agence', name: 'Directrice', x: 4, y: 4, facing: 'down', color: 0xc83c5c,
        unlessFlags: [FLAGS.visiteTerminee],
        dialogue: [
          "[Directrice - texte provisoire] Bienvenue dans l'équipe de l'agence !",
          "C'est ton premier jour : voici l'étape 1 de ton nouveau travail.",
        ],
        after: ['[Directrice - texte provisoire] Bon courage pour ton premier jour !'],
        setFlag: FLAGS.travailEtape1,
      },
      // Après la visite du temple : elle te remercie et te laisse partir.
      {
        id: 'patron-agence-fin', name: 'Directrice', x: 4, y: 4, facing: 'down', color: 0xc83c5c,
        ifFlags: [FLAGS.visiteTerminee],
        dialogue: [
          '[Directrice - texte provisoire] Merci pour ton travail, les touristes sont ravis !',
          "C'est bon, c'est terminé : tu peux partir.",
        ],
        after: ['[Directrice - texte provisoire] Bon voyage !'],
        setFlag: FLAGS.travailTermine,
      },
    ],
  },

  // Hanoï — l'intérieur de la pagode : l'objet de chance est sur l'autel.
  temple: {
    name: 'Temple',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'moommmmoom', // autel au centre
      'oooooooooo',
      'oooooooooo',
      'moooooooom', // piliers
      'oooooooooo',
      'moooooooom',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'pottedPlant', x: 0, y: 2 },
      { kind: 'painting', x: 4, y: 0 },
      { kind: 'longTable', x: 3, y: 2 },
      { kind: 'pottedPlant', x: 6, y: 2 },
      { kind: 'pottedPlant', x: 9, y: 2 },
      { kind: 'plant', x: 0, y: 4 },
      { kind: 'plant', x: 9, y: 4 },
      { kind: 'pottedPlant', x: 0, y: 7 },
      { kind: 'pottedPlant', x: 9, y: 7 },
    ],
    spawn: { x: 4, y: 7, facing: 'up' },
    // Les quatre cases de l'autel réagissent quand on leur fait face.
    objects: [3, 4, 5, 6].map((x) => ({
      x,
      y: 2,
      dialogue: ["[Texte provisoire] Sur l'autel, tu trouves un objet de chance."],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetChance,
    })),
  },

  // Amsterdam — le bureau CORNING : Laurent, le patron, te lance dans ton nouveau stage.
  corning: {
    name: 'Corning',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      'mmoooooooomm',
      'oooommmmoooo', // bureau du patron
      'oooooooooooo',
      'mmoommoommoo', // postes de travail
      'oooooooooooo',
      'mmoommoommoo',
      'oooooooooooo',
      'oooooooooooo',
      'ooooooEEoooo',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'notice', x: 6, y: 0 },
      { kind: 'bookshelf', x: 10, y: 0 },
      { kind: 'longTable', x: 4, y: 3 },
      { kind: 'crtTv', x: 7, y: 3 },
      { kind: 'paperDesk', x: 0, y: 5 },
      { kind: 'paperDesk', x: 4, y: 5 },
      { kind: 'paperDesk', x: 8, y: 5 },
      { kind: 'paperDesk', x: 0, y: 7 },
      { kind: 'paperDesk', x: 4, y: 7 },
      { kind: 'paperDesk', x: 8, y: 7 },
    ],
    spawn: { x: 6, y: 9, facing: 'up' },
    npcs: [
      {
        id: 'laurent', name: 'Laurent', x: 6, y: 4, facing: 'down', color: 0x2c4c8c,
        dialogue: [
          '[Laurent - texte provisoire] Bienvenue chez Corning ! Je suis Laurent, le patron.',
          'Ton stage commence aujourd\'hui. Bienvenue dans l\'équipe !',
        ],
        after: ['[Laurent - texte provisoire] Bon courage pour ton stage !'],
        setFlag: FLAGS.stageCorning,
      },
    ],
  },

  // Amsterdam — le coffee shop : on t'y vend la marchandise pour Romain.
  coffeeShop: {
    name: 'Coffee shop',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmmmmmmm', // comptoir
      'oooooooo',
      'mooooomm',
      'oooooooo',
      'moooooom',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'kitchen', x: 0, y: 1 },
      { kind: 'kitchen', x: 2, y: 1 },
      { kind: 'fridge', x: 4, y: 1 },
      { kind: 'blueShelf', x: 5, y: 1 },
      { kind: 'glassCabinet', x: 6, y: 1 },
      { kind: 'cabinet', x: 7, y: 1 },
      { kind: 'pottedPlant', x: 0, y: 4 },
      { kind: 'paperDesk', x: 6, y: 4 },
      { kind: 'pottedPlant', x: 0, y: 6 },
      { kind: 'pottedPlant', x: 7, y: 6 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'vendeur', name: 'Vendeur', x: 3, y: 3, facing: 'down', color: 0x3c9c4c,
        dialogue: [
          '[Vendeur - texte provisoire] Salut ! Tu viens pour la commande de Romain ?',
          'Voilà, tu as acheté la marchandise.',
        ],
        after: ['[Vendeur - texte provisoire] Passe une bonne journée !'],
        item: ITEMS.marchandise,
        setFlag: FLAGS.marchandiseAchetee,
      },
    ],
  },

  // Amsterdam — la maison commune : Romain t'attend pour récupérer la marchandise.
  maisonCommune: {
    name: 'Maison commune',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmommomm', // deux lits, table
      'mmommomm',
      'oooooooo',
      'moooooou', // ordinateur à droite
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'computerDesk', x: 3, y: 2 },
      { kind: 'bed', x: 6, y: 2 },
      { kind: 'window', x: 2, y: 0 },
      { kind: 'pottedPlant', x: 0, y: 5 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'romain-maison', name: 'Romain', x: 5, y: 5, facing: 'left', color: 0xc0602c,
        dialogue: ["[Romain - texte provisoire] Alors, tu es passé au coffee shop ?"],
        after: ['[Romain - texte provisoire] Merci encore !'],
        receive: {
          item: ITEMS.marchandise,
          dialogue: [
            '[Romain - texte provisoire] Super, tu as la marchandise ! Merci beaucoup.',
            "Au fait, tu as dû recevoir un mail. Va voir sur l'ordinateur !",
          ],
          setFlag: FLAGS.marchandiseDonnee,
        },
      },
    ],
    // L'ordinateur (bureau à droite) : le mail n'arrive qu'après toutes les étapes d'Amsterdam.
    objects: [
      {
        x: 7, y: 5,
        unlessFlags: [FLAGS.marchandiseDonnee],
        dialogue: ["[Texte provisoire] C'est ton ordinateur. Aucun nouveau mail pour l'instant."],
      },
      {
        x: 7, y: 5,
        ifFlags: [FLAGS.marchandiseDonnee],
        dialogue: [
          '[Texte provisoire] Nouveau mail ! « Merci de retourner à l\'université de Hull',
          'pour récupérer ta nouvelle affectation. »',
        ],
        after: ["[Texte provisoire] Le mail dit : retourne à l'université de Hull."],
        setFlag: FLAGS.mailLu,
      },
    ],
  },

  // New Delhi — l'université : ton échange universitaire commence.
  delhiUniversity: {
    name: 'Université de Delhi',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX', // tableau
      'XXXXXXXXXXXX',
      'mmoooooooomm',
      'ooooommmoooo', // bureau du professeur
      'oooooooooooo',
      'ommommommomm',
      'oooooooooooo',
      'ommommommomm',
      'oooooooooooo',
      'oooooooooooo',
      'ooooooEEoooo',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'chalkboard', x: 4, y: 1 },
      { kind: 'bookshelf', x: 10, y: 0 },
      { kind: 'longTable', x: 5, y: 3 },
      { kind: 'paperDesk', x: 1, y: 5 },
      { kind: 'schoolDesk', x: 4, y: 5 },
      { kind: 'paperDesk', x: 7, y: 5 },
      { kind: 'schoolDesk', x: 10, y: 5 },
      { kind: 'schoolDesk', x: 1, y: 7 },
      { kind: 'paperDesk', x: 4, y: 7 },
      { kind: 'schoolDesk', x: 7, y: 7 },
      { kind: 'paperDesk', x: 10, y: 7 },
    ],
    spawn: { x: 6, y: 9, facing: 'up' },
    npcs: [
      {
        id: 'prof-delhi', name: 'Professeure', x: 6, y: 4, facing: 'down', color: 0xd06020,
        unlessFlags: [FLAGS.potionDonnee],
        dialogue: [
          '[Professeure - texte provisoire] Namaste ! Bienvenue à l\'université.',
          'Tu es le bienvenu dans ce pays : ton échange commence aujourd\'hui !',
        ],
        after: ['[Professeure - texte provisoire] Profite bien de ton échange en Inde !'],
        setFlag: FLAGS.echangeCommence,
      },
      // Au retour du désert : fin du semestre.
      {
        id: 'prof-delhi-fin', name: 'Professeure', x: 6, y: 4, facing: 'down', color: 0xd06020,
        ifFlags: [FLAGS.potionDonnee],
        dialogue: [
          '[Professeure - texte provisoire] Félicitations pour ton semestre !',
          'Bonne chance pour la suite de ton voyage.',
        ],
        after: ["[Professeure - texte provisoire] Bon voyage ! L'aéroport t'attend."],
        setFlag: FLAGS.semestreTermine,
      },
    ],
  },

  // Rajasthan — la tente rayée : la potion magique est posée sur le coffre du fond.
  tente: {
    name: 'Tente',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'moommoom', // coffre au centre
      'oooooooo',
      'oooooooo',
      'moooooom',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'pottedPlant', x: 0, y: 2 },
      { kind: 'schoolDesk', x: 3, y: 2 },
      { kind: 'pottedPlant', x: 7, y: 2 },
      { kind: 'pottedPlant', x: 0, y: 5 },
      { kind: 'pottedPlant', x: 7, y: 5 },
    ],
    spawn: { x: 3, y: 5, facing: 'up' },
    objects: [3, 4].map((x) => ({
      x,
      y: 2,
      dialogue: ['[Texte provisoire] Sur le coffre, une fiole scintille : la potion magique !'],
      after: ['[Texte provisoire] Le coffre est vide.'],
      item: ITEMS.potionMagique,
    })),
  },

  // Bordeaux — le stade : cérémonie de remise des diplômes, foule de diplômés et podium.
  stade: {
    name: 'Stade',
    grid: parseGrid([
      'XXXXXXXXXXXXXXXXXXXX',
      'X%%%%%%%%%%%%%%%%%%X', // tribunes
      'X%%%%%%%%%%%%%%%%%%X',
      'X..................X',
      'X........++........X', // podium
      'X........++........X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X..................X',
      'X........EE........X',
      'XXXXXXXXXXXXXXXXXXXX',
    ]),
    spawn: { x: 9, y: 11, facing: 'up' },
    npcs: [
      {
        id: 'directeur', name: 'Directeur', x: 11, y: 4, facing: 'left', color: 0x6c1c2c, hat: true,
        unlessFlags: [FLAGS.diplomeBordeaux],
        dialogue: ['[Directeur - texte provisoire] Bienvenue à la cérémonie ! Monte sur le podium pour recevoir ton diplôme.'],
      },
      {
        id: 'directeur-fin', name: 'Directeur', x: 11, y: 4, facing: 'left', color: 0x6c1c2c, hat: true,
        ifFlags: [FLAGS.diplomeBordeaux],
        dialogue: ['[Directeur - texte provisoire] Félicitations, jeune diplômé ! La route de Paris est ouverte.'],
      },
      { id: 'diplome-0', name: 'Diplômé', x: 3, y: 7, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Félicitations à nous tous !"] },
      { id: 'diplome-1', name: 'Diplômé', x: 5, y: 8, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Quelle belle journée !"] },
      { id: 'diplome-2', name: 'Diplômé', x: 7, y: 7, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] On l'a fait !"] },
      { id: 'diplome-3', name: 'Diplômé', x: 12, y: 7, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Je n'en reviens pas, diplômés !"] },
      { id: 'diplome-4', name: 'Diplômé', x: 14, y: 8, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Félicitations à nous tous !"] },
      { id: 'diplome-5', name: 'Diplômé', x: 16, y: 7, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Quelle belle journée !"] },
      { id: 'diplome-6', name: 'Diplômé', x: 4, y: 10, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] On l'a fait !"] },
      { id: 'diplome-7', name: 'Diplômé', x: 6, y: 9, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Je n'en reviens pas, diplômés !"] },
      { id: 'diplome-8', name: 'Diplômé', x: 13, y: 10, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Félicitations à nous tous !"] },
      { id: 'diplome-9', name: 'Diplômé', x: 15, y: 9, facing: 'up', color: 0x202028, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Quelle belle journée !"] },
      { id: 'diplome-10', name: 'Diplômé', x: 8, y: 10, facing: 'up', color: 0x2c2c3c, hat: true,
        dialogue: ["[Diplômé - texte provisoire] On l'a fait !"] },
      { id: 'diplome-11', name: 'Diplômé', x: 11, y: 9, facing: 'up', color: 0x1c1c24, hat: true,
        dialogue: ["[Diplômé - texte provisoire] Je n'en reviens pas, diplômés !"] },
    ],
    // Monter sur le podium : remise du diplôme de Bordeaux (une seule fois).
    triggers: [[9, 4], [10, 4], [9, 5], [10, 5]].map(([x, y]) => ({
      x,
      y,
      unlessFlags: [FLAGS.diplomeBordeaux],
      dialogue: ['[Texte provisoire] Tu repenses avec émotion à ta remise de diplôme.'],
      readyDialogue: [
        '[Texte provisoire] Tu montes sur le podium sous les applaudissements !',
        'Le directeur te remet ton diplôme.',
      ],
      item: ITEMS.diplomeBordeaux,
      setFlags: [FLAGS.diplomeBordeaux],
    })),
  },

  // Paris — le bistrot : tu y manges et rencontres le cuisinier, gentil et drôle.
  bistro: {
    name: 'Bistrot',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmmmoommmm', // cuisine
      'oooooooooo',
      'mmommommom', // tables
      'oooooooooo',
      'mmommommom',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'kitchen', x: 0, y: 1 },
      { kind: 'kitchen', x: 2, y: 1 },
      { kind: 'window', x: 4, y: 0 },
      { kind: 'glassCabinet', x: 6, y: 1 },
      { kind: 'fridge', x: 7, y: 1 },
      { kind: 'blueShelf', x: 8, y: 1 },
      { kind: 'cabinet', x: 9, y: 1 },
      { kind: 'paperDesk', x: 0, y: 4 },
      { kind: 'paperDesk', x: 3, y: 4 },
      { kind: 'paperDesk', x: 6, y: 4 },
      { kind: 'paperDesk', x: 0, y: 6 },
      { kind: 'paperDesk', x: 3, y: 6 },
      { kind: 'paperDesk', x: 6, y: 6 },
      { kind: 'pottedPlant', x: 9, y: 4 },
      { kind: 'pottedPlant', x: 9, y: 6 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    // Après la promotion : Hugues et Thomas t'attendent pour trinquer.
    events: [
      {
        on: 'enter',
        ifFlags: [FLAGS.promotion],
        unlessFlags: [FLAGS.verreBistro],
        steps: [
          { speaker: 'Hugues', say: ['[Hugues - texte provisoire] Le voilà ! On fête ta promotion !'] },
          { speaker: 'Thomas', say: ['[Thomas - texte provisoire] Viens trinquer avec nous, et raconte-nous tout !'] },
          { setFlag: FLAGS.verreBistro },
        ],
      },
    ],
    npcs: [
      {
        id: 'hugues', name: 'Hugues', x: 7, y: 3, facing: 'left', color: 0x7c4c2c,
        ifFlags: [FLAGS.promotion],
        dialogue: ['[Hugues - texte provisoire] Santé ! Bravo pour ta promotion !'],
        after: ['[Hugues - texte provisoire] Encore un petit verre ?'],
        souvenir: { id: 'souvenir-hugues', name: "Souvenir d'Hugues" },
      },
      {
        id: 'thomas', name: 'Thomas', x: 7, y: 5, facing: 'left', color: 0x2c7c9c,
        ifFlags: [FLAGS.promotion],
        dialogue: ['[Thomas - texte provisoire] On est fiers de toi ! À la tienne !'],
        after: ['[Thomas - texte provisoire] Ce soir il y a un concert à Bercy, tu devrais y aller !'],
        souvenir: { id: 'souvenir-thomas', name: 'Souvenir de Thomas' },
      },
      {
        id: 'cuisinier', name: 'Cuisinier', x: 4, y: 2, facing: 'down', color: 0xf4f4f4,
        dialogue: [
          '[Cuisinier - texte provisoire] Bonjour bonjour ! Bienvenue dans mon bistrot !',
          "Aujourd'hui, c'est boeuf bourguignon... et le boeuf, c'est moi qui l'ai motivé ce matin !",
          'Installe-toi, je t\'apporte ça tout de suite. Bon appétit !',
        ],
        after: ['[Cuisinier - texte provisoire] Alors, c\'était bon ? Reviens quand tu veux, la maison ne mord pas !'],
        souvenir: { id: 'souvenir-cuisinier', name: 'Souvenir du cuisinier' },
        setFlag: FLAGS.repasParis,
        ask: {
          question: 'Dis-moi, tu as emménagé dans le coin ?',
          unlessFlags: [FLAGS.emmenagementParis],
          choices: [
            {
              label: 'Oui, je suis nouveau à Paris !',
              reply: ["Oui ! Je suis nouveau à Paris, j'emménage juste après manger."],
              dialogue: ['[Cuisinier - texte provisoire] Bienvenue dans le quartier, voisin ! Passe me voir quand tu veux.'],
              setFlags: [FLAGS.emmenagementParis],
            },
          ],
        },
      },
    ],
  },

  // Paris — ton appartement (immeuble en haut à droite) : l'ordinateur pour chercher un travail.
  parisAppart: {
    name: 'Ton appartement',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoommoo', // lit, table
      'mmoommoo',
      'oooooooo',
      'moooooou', // ordinateur à droite
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'computerDesk', x: 4, y: 2 },
      { kind: 'window', x: 2, y: 0 },
      { kind: 'painting', x: 7, y: 0 },
      { kind: 'pottedPlant', x: 0, y: 5 },
    ],
    spawn: { x: 3, y: 6, facing: 'up' },
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.rechercheTravail],
        steps: [{ say: ["[Texte provisoire] Ton nouvel appartement parisien ! Il y a un ordinateur sur le bureau."] }],
      },
    ],
    objects: [
      {
        x: 7, y: 5,
        unlessFlags: [FLAGS.rechercheTravail],
        ask: {
          question: 'Chercher un travail ?',
          choices: [
            {
              label: 'Oui',
              dialogue: [
                '[Texte provisoire] Une offre correspond à ton profil !',
                "Rends-toi à l'entreprise, le grand bâtiment à droite de la tour Eiffel.",
              ],
              setFlags: [FLAGS.rechercheTravail],
            },
            { label: 'Non', dialogue: ['[Texte provisoire] Tu éteins l\'ordinateur. Plus tard, peut-être.'] },
          ],
        },
      },
      {
        x: 7, y: 5,
        ifFlags: [FLAGS.rechercheTravail],
        dialogue: ["[Texte provisoire] Ton rendez-vous : l'entreprise, à droite de la tour Eiffel."],
      },
    ],
  },

  // Paris — l'entreprise (tour de bureaux à droite de la tour Eiffel) : ton nouveau travail commence.
  entreprise: {
    name: 'Entreprise',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX', // ascenseur en haut à droite
      'XXXXXXXXXX¤¤',
      'mmoooooooooo',
      'oooommmmoooo', // accueil
      'oooooooooooo',
      'mmoommoommoo', // bureaux
      'oooooooooooo',
      'mmoommoommoo',
      'oooooooooooo',
      'ooooooEEoooo',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'notice', x: 7, y: 0 },
      { kind: 'longTable', x: 4, y: 3 },
      { kind: 'crtTv', x: 7, y: 3 },
      { kind: 'paperDesk', x: 0, y: 5 },
      { kind: 'paperDesk', x: 4, y: 5 },
      { kind: 'paperDesk', x: 8, y: 5 },
      { kind: 'paperDesk', x: 0, y: 7 },
      { kind: 'paperDesk', x: 4, y: 7 },
      { kind: 'paperDesk', x: 8, y: 7 },
    ],
    spawn: { x: 6, y: 8, facing: 'up' },
    npcs: [
      {
        id: 'responsable-paris', name: 'Responsable', x: 6, y: 4, facing: 'down', color: 0x2c3c6c,
        dialogue: [
          "[Responsable - texte provisoire] Bonjour ! On t'attendait.",
          "Bienvenue dans l'entreprise : ton nouveau travail commence aujourd'hui !",
        ],
        after: ["[Responsable - texte provisoire] Au travail ! L'ascenseur mène aux étages."],
        setFlag: FLAGS.travailParis,
      },
    ],
    objects: ELEVATOR,
  },

  // Paris — l'entreprise, 1er étage : le manager (promotion).
  entrepriseManager: {
    name: 'Entreprise - 1er étage',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX', // ascenseur
      'XXXXXXXXXX¤¤',
      'oooooooooooo',
      'oooommmmoooo', // bureau
      'oooooooooooo',
      'mmoooooooomm',
      'oooooooooooo',
      'mmoooooooomm',
      'oooooooooooo',
      'oooooooooooo',
    ]),
    decor: [
      { kind: 'window', x: 1, y: 0 },
      { kind: 'painting', x: 6, y: 0 },
      { kind: 'longTable', x: 4, y: 3 },
      { kind: 'crtTv', x: 7, y: 3 },
      { kind: 'paperDesk', x: 0, y: 5 },
      { kind: 'paperDesk', x: 10, y: 5 },
      { kind: 'paperDesk', x: 0, y: 7 },
      { kind: 'paperDesk', x: 10, y: 7 },
    ],
    spawn: { x: 10, y: 2, facing: 'down' },
    npcs: [
      {
        id: 'manager', name: 'Manager', x: 6, y: 4, facing: 'down', color: 0x3c6c9c,
        unlessFlags: [FLAGS.promotion],
        dialogue: ['[Manager - texte provisoire] Bonjour ! Je suis ton manager.'],
        ask: {
          question: 'Demander une promotion ?',
          ifFlags: [FLAGS.travailParis],
          choices: [
            {
              label: 'Oui',
              reply: ["J'aimerais demander une promotion."],
              dialogue: ['[Manager - texte provisoire] Tu la mérites ! Promotion accordée, félicitations !'],
              setFlags: [FLAGS.promotion],
            },
            { label: 'Non', dialogue: ['[Manager - texte provisoire] Reviens me voir quand tu veux.'] },
          ],
        },
      },
      {
        id: 'manager-fin', name: 'Manager', x: 6, y: 4, facing: 'down', color: 0x3c6c9c,
        ifFlags: [FLAGS.promotion],
        dialogue: ['[Manager - texte provisoire] Encore bravo ! Va fêter ta promotion au bistrot, tes amis t\'y attendent.'],
      },
    ],
    objects: ELEVATOR,
  },

  // Paris — l'entreprise, dernier étage : le directeur (rupture conventionnelle, après le concert).
  entrepriseDirecteur: {
    name: 'Entreprise - dernier étage',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX', // ascenseur
      'XXXXXXXXXX¤¤',
      'oooooooooooo',
      'oooommmmoooo', // bureau
      'oooooooooooo',
      'mmoooooooomm',
      'oooooooooooo',
      'mmoooooooomm',
      'oooooooooooo',
      'oooooooooooo',
    ]),
    decor: [
      { kind: 'window', x: 1, y: 0 },
      { kind: 'painting', x: 6, y: 0 },
      { kind: 'longTable', x: 4, y: 3 },
      { kind: 'crtTv', x: 7, y: 3 },
      { kind: 'paperDesk', x: 0, y: 5 },
      { kind: 'paperDesk', x: 10, y: 5 },
      { kind: 'paperDesk', x: 0, y: 7 },
      { kind: 'paperDesk', x: 10, y: 7 },
    ],
    spawn: { x: 10, y: 2, facing: 'down' },
    npcs: [
      {
        id: 'directeur-paris', name: 'Directeur', x: 6, y: 4, facing: 'down', color: 0x3c2c4c,
        unlessFlags: [FLAGS.concertBercy],
        dialogue: ['[Directeur - texte provisoire] Ah, notre nouvelle recrue promue ! Profite bien de Paris.'],
      },
      {
        id: 'directeur-paris-concert', name: 'Directeur', x: 6, y: 4, facing: 'down', color: 0x3c2c4c,
        ifFlags: [FLAGS.concertBercy],
        unlessFlags: [FLAGS.ruptureConventionnelle],
        dialogue: ['[Directeur - texte provisoire] Tu voulais me voir ?'],
        ask: {
          question: 'Demander une rupture conventionnelle ?',
          choices: [
            {
              label: 'Oui',
              reply: ["J'aimerais demander une rupture conventionnelle."],
              dialogue: [
                "[Directeur - texte provisoire] C'est d'accord. Merci pour tout ton travail !",
                'Bonne chance pour la suite : la route du sud mène à Toulon.',
              ],
              setFlags: [FLAGS.ruptureConventionnelle],
            },
            { label: 'Non', dialogue: ['[Directeur - texte provisoire] Très bien. Ma porte reste ouverte.'] },
          ],
        },
      },
      {
        id: 'directeur-paris-fin', name: 'Directeur', x: 6, y: 4, facing: 'down', color: 0x3c2c4c,
        ifFlags: [FLAGS.ruptureConventionnelle],
        dialogue: ['[Directeur - texte provisoire] Bonne route vers Toulon !'],
      },
    ],
    objects: ELEVATOR,
  },

  // Paris — Bercy (Accor Arena) : le concert.
  bercy: {
    name: 'Bercy',
    grid: parseGrid([
      'XXXXXXXXXXXXXXXXXX',
      'XmmmmmmmmmmmmmmmmX', // écrans et enceintes
      'Xmm++++++++++++mmX', // scène
      'Xoo++++++++++++ooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooooooooooX',
      'XooooooooEEooooooX',
      'XXXXXXXXXXXXXXXXXX',
    ]),
    spawn: { x: 9, y: 9, facing: 'up' },
    events: [
      {
        on: 'enter',
        ifFlags: [FLAGS.verreBistro],
        unlessFlags: [FLAGS.concertBercy],
        steps: [
          { say: ["[Texte provisoire] Les lumières s'éteignent... la foule hurle !"] },
          { speaker: 'Chanteur', say: ['[Chanteur - texte provisoire] Bonsoir Paris ! Vous êtes prêts ?!'] },
          { say: ['[Texte provisoire] Quel concert incroyable ! Une soirée inoubliable.'] },
          { setFlag: FLAGS.concertBercy },
        ],
      },
    ],
    npcs: [
      { id: 'chanteur', name: 'Chanteur', x: 9, y: 2, facing: 'down', color: 0xd83060, dialogue: ['[Chanteur - texte provisoire] Merci Paris !'] },
      { id: 'guitariste', name: 'Guitariste', x: 6, y: 2, facing: 'down', color: 0x3c3c3c, dialogue: ['[Guitariste - texte provisoire] Yeah !'] },
      { id: 'batteur', name: 'Batteur', x: 12, y: 2, facing: 'down', color: 0x5c2c8c, dialogue: ['[Batteur - texte provisoire] Boum boum !'] },
      ...[[3, 5], [5, 6], [7, 5], [11, 5], [13, 6], [15, 5], [4, 7], [8, 7], [12, 7], [14, 8]].map(([x, y], i) => ({
        id: `fan-${i}`, name: 'Fan', x, y, facing: 'up', color: [0xe86040, 0x40a0e8, 0xe8c040, 0x60c060][i % 4],
        dialogue: [['[Fan - texte provisoire] Quel son !', '[Fan - texte provisoire] Encore ! Encore !'][i % 2]],
      })),
    ],
  },

  // Toulon — l'appartement de Yanis.
  yanisAppart: {
    name: 'Appartement de Yanis',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XLooommoLX',
      'XooooooooX',
      'XooooooooX',
      'XmoooooomX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'yanis-toulon', name: 'Yanis', x: 6, y: 3, facing: 'left', color: 0xc0b040,
        dialogue: [
          '[Yanis - texte provisoire] Pierre ! Te voilà enfin à Toulon !',
          'Installe-toi, fais comme chez toi. Bienvenue au bord de la mer !',
        ],
        after: ['[Yanis - texte provisoire] Alors, tu as vu la plage ?'],
        souvenir: { id: 'souvenir-yanis-toulon', name: 'Souvenir de Yanis à Toulon' },
        setFlag: FLAGS.chezYanis,
        // Première quête de Toulon : le Chemin de Saint-Jacques avec Yanis.
        ask: {
          question: 'Partir faire le Chemin de Saint-Jacques-de-Compostelle avec Yanis ?',
          unlessFlags: [FLAGS.caminoEnCours],
          choices: [
            {
              label: 'Oui',
              reply: ["Allez, on part faire le Chemin de Saint-Jacques !"],
              dialogue: ["[Yanis - texte provisoire] ¡Vamos ! Direction la côte nord de l'Espagne !"],
              setFlags: [FLAGS.caminoEnCours],
              warp: { map: 'camino', x: 1, y: 10, facing: 'right' },
            },
            { label: 'Non', dialogue: ['[Yanis - texte provisoire] Quand tu veux, je suis prêt !'] },
          ],
        },
      },
    ],
  },

  // Corse — la maison de tes parents.
  corseParents: {
    name: 'Maison de tes parents',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XooooooooX',
      'XooommoooX',
      'XooommoooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.parentsCorse],
        steps: [
          { speaker: 'Maman', say: ['[Maman - texte provisoire] Mon grand ! Quelle joie de te voir en Corse !'] },
          { speaker: 'Papa', say: ['[Papa - texte provisoire] Bienvenue dans le maquis ! Va aussi dire bonjour à Léo et Théo, à côté.'] },
          { setFlag: FLAGS.parentsCorse },
        ],
      },
    ],
    npcs: [
      {
        id: 'maman-corse', name: 'Maman', x: 2, y: 3, facing: 'right', color: 0xe86fa0,
        dialogue: ['[Maman - texte provisoire] Reste manger, j\'ai préparé du fiadone !'],
      },
      {
        id: 'papa-corse', name: 'Papa', x: 7, y: 3, facing: 'left', color: 0x3f6fd8,
        dialogue: ['[Papa - texte provisoire] Le maquis sent bon aujourd\'hui, hein ?'],
      },
    ],
  },

  // Corse — la maison voisine : Léo et Théo.
  corseVoisins: {
    name: 'Maison de Léo et Théo',
    grid: parseGrid([
      'XXXXXXXXXX',
      'XmmoooommX',
      'XooooooooX',
      'XooommoooX',
      'XooommoooX',
      'XooooooooX',
      'XoooEEoooX',
      'XXXXXXXXXX',
    ]),
    spawn: { x: 4, y: 5, facing: 'up' },
    npcs: [
      {
        id: 'leo', name: 'Léo', x: 2, y: 3, facing: 'right', color: 0x4c9c5c,
        dialogue: ['[Léo - texte provisoire] Salut ! Ceci est le premier dialogue de Léo.'],
        after: ['[Léo - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-leo', name: 'Souvenir de Léo' },
      },
      {
        id: 'theo', name: 'Théo', x: 7, y: 3, facing: 'left', color: 0xc07c3c,
        dialogue: ['[Théo - texte provisoire] Hé ! Ceci est le premier dialogue de Théo.'],
        after: ['[Théo - texte provisoire] Dialogue une fois le souvenir obtenu.'],
        souvenir: { id: 'souvenir-theo', name: 'Souvenir de Théo' },
      },
    ],
  },

  // Bali — la cabane près de la mer : l'objet magique.
  baliCabane: {
    name: 'Cabane',
    grid: parseGrid([
      'XXXXXXXX',
      'XmoommoX', // coffre au centre
      'XooooooX',
      'XooooooX',
      'XoooEEoX',
      'XXXXXXXX',
    ]),
    spawn: { x: 4, y: 3, facing: 'up' },
    objects: [4, 5].map((x) => ({
      x,
      y: 1,
      dialogue: ['[Texte provisoire] Dans le coffre de bois, un objet scintille : un objet magique !'],
      after: ['[Texte provisoire] Le coffre est vide.'],
      item: ITEMS.objetMagiqueBali,
    })),
  },

  // Sri Lanka — l'intérieur du temple (stupa) : l'objet magique sur l'autel.
  sriLankaTemple: {
    name: 'Temple',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmoommmmoomX', // autel
      'XooooooooooX',
      'XmoooooooomX',
      'XooooooooooX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'moine', name: 'Moine', x: 3, y: 2, facing: 'right', color: 0xe88820,
        dialogue: ["[Moine - texte provisoire] Ayubowan. L'objet sacré t'attend sur l'autel."],
      },
    ],
    objects: [4, 5, 6, 7].map((x) => ({
      x,
      y: 1,
      dialogue: ["[Texte provisoire] Sur l'autel, entre les fleurs de lotus, un objet magique rayonne !"],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetMagiqueSriLanka,
    })),
  },

  // Thaïlande — l'intérieur du wat : l'objet magique au pied du Bouddha doré.
  watInterieur: {
    name: 'Wat',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmoommmmoomX', // autel
      'XooooooooooX',
      'XmoooooooomX',
      'XooooooooooX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'moine-thai', name: 'Moine', x: 3, y: 2, facing: 'right', color: 0xe88820,
        dialogue: ["[Moine - texte provisoire] Sawasdee. L'objet magique repose au pied du Bouddha."],
      },
    ],
    objects: [4, 5, 6, 7].map((x) => ({
      x,
      y: 1,
      dialogue: ["[Texte provisoire] Au pied du grand Bouddha doré, un objet magique brille !"],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetMagiqueThailande,
    })),
  },

  // Népal — le monastère du grand stupa : l'objet magique parmi les lampes à beurre.
  monastere: {
    name: 'Monastère',
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XmoommmmoomX', // autel
      'XooooooooooX',
      'XmoooooooomX',
      'XooooooooooX',
      'XooooEEooooX',
      'XXXXXXXXXXXX',
    ]),
    spawn: { x: 5, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'moine-nepal', name: 'Moine', x: 3, y: 2, facing: 'right', color: 0x9c2830,
        dialogue: ["[Moine - texte provisoire] Namaste. L'objet sacré t'attend sur l'autel, parmi les lampes."],
      },
    ],
    objects: [4, 5, 6, 7].map((x) => ({
      x,
      y: 1,
      dialogue: ["[Texte provisoire] Parmi les lampes à beurre, un objet magique rayonne !"],
      after: ["[Texte provisoire] L'autel est paisible."],
      item: ITEMS.objetMagiqueNepal,
    })),
  },
};
