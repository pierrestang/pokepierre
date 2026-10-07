import { parseGrid } from './parseGrid.js';
import { interiorGrid } from './builtGrid.js';
import { applyNpcEdits } from './npcEdits.js';
import { BUILT_INTERIORS } from '../builtInteriors/index.js';
import { FLAGS, ITEMS, TRAITS } from '../story.js';
import {
  BIRTH, FANNY_CRADLE, CABANE_PLAN, FELIX_CHANTIER, ANNOUNCEMENT, ANNOUNCEMENT_EVENT, CABANE_FETE, FELIX_AT_CABANE,
} from '../saintAyStory.js';
import { MAMAN_FDF } from '../fortDeFranceStory.js';
import {
  AGENT_KEYS, BLACKOUT, ENGLISH_ORAL, METER, OUSMANE_ASLEEP, PARTY, PARTY_ANAIS, PARTY_END, PARTY_LEO, PAULFIT, REMI_CUPS,
  TIDY_BED, TIDY_CUPS, TIDY_LIVING_ROOM,
} from '../bordeauxStory.js';
import { GEOFFREY_GUIDE, HOMESICK, MAKE_BED, MORNING, PREPARE_DESK, TANGUY_GUIDE, TIDY_WARDROBE } from '../prytaneeStory.js';
import {
  SURVEILLANT, COLLEGE_WELCOME, LOCKER, REMI, REMI_INVITE, REMI_SEAT, CAMILLE, PROF, LOCKER_SIDE, SURVEILLANT_SPOT, CLOSET,
} from '../collegeStory.js';
import { MAMAN, MAMAN_WELCOME, PAPA, JEAN, LAST_DAY, BENOIT_HIDING, DINNER } from '../montepilloyStory.js';
import { FRLG_SHEETS, cabaneFrame, cabaneOverlay } from '../../art/frlgArt.js';
import {
  LEO_CALLED, LEO_PLAN, ORDERS, orderScript, PUB_A_WELCOME, PUB_A_BAR, DARTS, HABITUE_AFTER, ASYLUM_ENTER, ASYLUM_DANCE, SLEEP,
  LIBRARY, PUB_B_ENTER, PUB_B_SEATS, ASYLUM_SPOTS, DANCE_FLOOR,
} from '../hullStory.js';

// Soirée de Hull : la bande, d'une étape à l'autre (premier pub, deuxième pub, Asylum).
const PUB_A_TIME = { ifFlags: [FLAGS.leoPlan], unlessFlags: [FLAGS.tourneeServie] };
const PUB_B_TIME = { ifFlags: [FLAGS.tourneeServie], unlessFlags: [FLAGS.flechettesJouees] };
const ASYLUM_TIME = { ifFlags: [FLAGS.flechettesJouees] };
const INSOUCIANCE = TRAITS.insouciance.id;

// Collège Bonsecours : la principale, derrière l'accueil du hall.
const PRINCIPALE = [
  { speaker: 'Principale', say: ['Bienvenue au collège Bonsecours, Pierre. Le surveillant t\'expliquera tout ce qu\'il faut savoir.'] },
];

// Cannes de la cabane de pêche : [icône, x, y, hauteur gardée] en pixels depuis le coin de la case (voir ffHut).
// Cannes debout (gaule en x = 14 de l'image) : dans les trous du râtelier (x = 3, 11, 19), le manche caché par le socle.
const RACK_RODS = [['mega-canne-petite', -11, -34, 26], ['super-canne-petite', -3, -34, 26], ['vieille-canne-petite', 5, -34, 26]];
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

// Cartons de déménagement de la maison de Fort-de-France, posés çà et là sans gêner le passage (cases 'm' des grilles).
const FF_CARTONS = [[5, 2], [1, 3], [2, 7], [10, 6]];
const FF_UP_CARTONS = [[6, 3], [0, 5], [3, 5], [8, 5]];

// Papa, ses cannes rangées, envoie Pierre au salon une fois la quête de Manon finie aussi (tant que Maman n'a pas
// dansé).
// Papa, ses cannes rangées, renvoie vers Manon tant que son secret n'est pas partagé.
const PAPA_TO_MANON = {
  ifFlags: [FLAGS.papaFait], unlessFlags: [FLAGS.secretManon],
  speaker: 'Papa', say: ['Ta sœur te cherchait dehors, du côté du petit pré.'],
};
const PAPA_TO_SALON = {
  ifFlags: [FLAGS.papaFait, FLAGS.secretManon], unlessSouvenirs: [TRAITS.joie.id],
  speaker: 'Papa', say: ['Maman t\'attend au salon.'],
};

// La vieille canne, restée dans la caisse « À DONNER » de Papa : on peut la prendre pour pêcher (facultatif).
const OLD_ROD_CHOICE = [
  {
    choose: 'Il reste une vieille canne à pêche dans la caisse « À DONNER ». Tu la prends ?',
    choices: [
      { label: 'OUI', steps: [{ give: ITEMS.vieilleCanne, text: 'Tu prends la vieille canne. Elle pourra encore servir.' }] },
      { label: 'NON', steps: [] },
    ],
  },
];

// Collège Bonsecours : des élèves dans les salles et les couloirs, une réplique chacun ([x, y, réplique, direction] ;
// apparence de figurant au hasard). En classe, assis derrière un pupitre, face au bureau (vers le haut, par défaut).
// `conditions` : quand ils sont là (ex. pas après l'ellipse de la fin de troisième).
const collegeStudents = (list, conditions = {}) => list.map(([x, y, line, facing = 'up']) => ({
  id: `eleve-${x}-${y}`, name: 'Élève', x, y, facing, still: true, ...conditions, dialogue: [line],
}));

// Prytanée, la nuit du mur (de « Le soir même… » au retour) ; le reste du temps, en deux variantes (une condition
// chacune : avant le soir, après le retour).
const PRYTANEE_NIGHT = { ifFlags: [FLAGS.soirMur], unlessFlags: [FLAGS.murReussi] };
const PRYTANEE_DAY = [{ unlessFlags: [FLAGS.soirMur] }, { ifFlags: [FLAGS.murReussi] }];

// La soirée d'intégration de Bordeaux, dans l'appartement (voir data/bordeauxStory.js), puis le lendemain matin.
const PARTY_TIME = { ifFlags: [FLAGS.soiree], unlessFlags: [FLAGS.lendemainSoiree] };
const MORNING_AFTER = { ifFlags: [FLAGS.lendemainSoiree], unlessFlags: [FLAGS.soireeFinie] };

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
      'mmmmmmmmmoη',
      'omooooooooo',
      'mooommmmooo',
      'mooommmmooo',
      'oooooooooom',
      'oomoEEoooom',
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
      { kind: 'pottedPlant', x: 10, y: 7 },
      // Cartons de déménagement, prêts pour Saint-Ay.
      ...FF_CARTONS.map(([x, y]) => ({ kind: 'carton', x, y })),
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    triggers: [{ x: 10, y: 2, warp: { interior: 'ffHouseUp', x: 8, y: 3, facing: 'down' } }],
    objects: [
      { x: 3, y: 2, dialogue: ['[Texte provisoire] La télé. Un vieux jeu est encore branché sur la console…'] },
      { x: 4, y: 2, dialogue: ['[Texte provisoire] La console de Manon. Elle a encore battu ton record…'] },
      { x: 8, y: 2, dialogue: ['[Texte provisoire] Le frigo est plein de fruits de la Martinique.'] },
      ...FF_CARTONS.map(([x, y]) => ({ x, y, dialogue: ['Un carton de déménagement, prêt pour Saint-Ay.'] })),
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
            say: [
              "Le ferry part cet après-midi, tous ensemble. D'ici là, va voir ton père et ta sœur :",
              "ton père trie ses affaires à sa cabane de pêche, à droite de la plage, et Manon prépare un coup dehors. Ensuite, reviens me voir !",
            ],
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
        script: MAMAN_FDF,
      },
    ],
  },

  // Fort-de-France — la chambre de Pierre et Manon, à l'étage (invisible de l'extérieur), façon Rouge Feu :
  // deux lits, bureau avec ordinateur, plante, escalier qui descend, et des cartons partout.
  // Nouvelle partie : Pierre s'y réveille, le dernier matin à Fort-de-France.
  ffHouseUp: {
    name: 'Chambre de Pierre',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXX',
      'XXXXXXXXX',
      'mmmmmmmoξ',   // lit de Pierre, bureau, lit de Manon, plante
      'mmoommmoo',   // devant le bureau (sans tabouret) : libre ; carton devant la plante
      'ooooooooo',
      'moomoooom',
    ]),
    decor: [
      { kind: 'painting', x: 0, y: 0 },
      { kind: 'window', x: 5, y: 0 },
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'computerDesk', x: 2, y: 2 },
      { kind: 'smallCarton', x: 2, y: 2, dx: 1, dy: -5 },
      { kind: 'bed', x: 4, y: 2 },
      { kind: 'pottedPlant', x: 6, y: 2 },
      ...FF_UP_CARTONS.map(([x, y]) => ({ kind: 'carton', x, y })),
    ],
    spawn: { x: 1, y: 4, facing: 'up' },
    triggers: [{ x: 8, y: 2, warp: { interior: 'ffHouse', x: 10, y: 3, facing: 'down' } }],
    objects: [
      { x: 2, y: 2, dialogue: ['Un carton marqué « CHAMBRE — FRAGILE ». Il est déjà scotché.'] },
      { x: 3, y: 2, dialogue: ["L'écran affiche : « Fort-de-France → Saint-Ay ». Le voyage commence aujourd'hui."] },
      ...FF_UP_CARTONS.map(([x, y]) => ({ x, y, dialogue: ['Des cartons à moitié faits.'] })),
    ],
    // Image d'accueil de l'île et bruit des vagues, puis la chambre apparaît et Maman appelle d'en bas.
    events: [
      {
        on: 'enter',
        unlessFlags: [FLAGS.reveilFortDeFrance],
        steps: [
          { sea: true },
          { opening: { postcard: 'fortDeFrance', text: "C'est le dernier matin à Fort-de-France." } },
          { sea: false },
          { wait: 300 },
          { speaker: 'Maman', say: ['Pierre ! Le ferry part cet après-midi ! Descends !'] },
          { setFlag: FLAGS.reveilFortDeFrance },
        ],
      },
    ],
  },

  // Fort-de-France — la cabane de pêche de Papa, façon Rouge Feu : cannes, caisses (dessinées dans le code),
  // fenêtre, panneau, plante. Papa trie avant le départ ; caisse « À DONNER » en bas à gauche.
  ffHut: {
    name: 'Cabane de pêche',
    frlg: true,
    grid: parseGrid([
      'XXXXXXX',
      'XXXXXXX',
      'ψψommmo',   // râtelier, caisses, carton
      'oooooom',
      'mooooom',
      'oooEoom',   // carton dans le coin
    ]),
    decor: [
      { kind: 'window', x: 2, y: 0 },
      { kind: 'notice', x: 4, y: 0 },
      { kind: 'plant', x: 6, y: 3 },
      { kind: 'fishCrate', x: 3, y: 2 },
      { kind: 'fishCrate', x: 4, y: 2 },
      { kind: 'giveCrate', x: 0, y: 4 },
      { kind: 'carton', x: 5, y: 2 },
      { kind: 'carton', x: 6, y: 5 },
    ],
    // Cannes debout aux couleurs de HeartGold (voir MapScene, décors `icons`) : les trois du râtelier (Méga, Super,
    // Vieille), puis la Méga Canne que Papa garde ; dans la caisse « À DONNER », la Super Canne (offerte au
    // pêcheur) et la Vieille canne, puis la Vieille seule. Le bas des cannes est coupé (socle, bord de la caisse).
    decals: [
      { x: 0, y: 2, unlessFlags: [FLAGS.papaFait], icons: RACK_RODS },
      { x: 0, y: 2, ifFlags: [FLAGS.papaFait], icons: [['mega-canne-petite', -3, -34, 26]] },
      { x: 0, y: 4, ifFlags: [FLAGS.papaFait], unlessFlags: [FLAGS.canneOfferte], unlessItems: [ITEMS.canneAPeche.id], icons: CRATE_RODS },
      { x: 0, y: 4, ifFlags: [FLAGS.papaFait, FLAGS.canneOfferte], unlessItems: [ITEMS.vieilleCanne.id], icons: OLD_ROD_IN_CRATE },
      { x: 0, y: 4, ifItems: [ITEMS.canneAPeche.id], unlessItems: [ITEMS.vieilleCanne.id], icons: OLD_ROD_IN_CRATE },
    ],
    spawn: { x: 3, y: 4, facing: 'up' },
    npcs: [
      {
        id: 'papa', name: 'Papa', x: 1, y: 4, facing: 'left', color: 0x3f6fd8, still: true,
        ...HOME_FDF,
        script: [
          { ifFlags: [FLAGS.papaFait], speaker: 'Papa', say: ["Hm. Il reste des caisses, si t'as rien à faire."] },
          PAPA_TO_SALON,
          PAPA_TO_MANON,
          { ifFlags: [FLAGS.papaFait], end: true },
          { say: ['Des caisses partout. Papa trie sans lever les yeux.'] },
          { speaker: 'Papa', say: ["T'es venu m'aider ou regarder ?"] },
          {
            choose: 'Trois cannes à pêche sont posées là. Tu en prends combien ?',
            choices: [
              { label: 'Une', steps: [{ speaker: 'Papa', say: ['Voilà. Tu réfléchis. C\'est ça, le pragmatisme.', 'Une seule. Tu tiens ça de moi, pas de ta mère.'] }] },
              { label: 'Les trois', steps: [{ speaker: 'Papa', say: ['Trois ?! On déménage, c\'est pas une expédition de pêche.'] }] },
            ],
          },
          { say: ['Papa en garde une et jette les deux autres dans une caisse marquée « À DONNER ».'] },
          { speaker: 'Papa', say: ['Voilà. Déménagement terminé.'] },
          { setFlag: FLAGS.papaFait },
          PAPA_TO_SALON,
          PAPA_TO_MANON,
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
      ...[[5, 2], [6, 5]].map(([x, y]) => ({ x, y, dialogue: ['Un carton de déménagement, prêt pour Saint-Ay.'] })),
      // Caisse « À DONNER » : une canne pour le capitaine du ferry, dès le tri avec Papa.
      { x: 0, y: 4, unlessFlags: [FLAGS.papaFait], dialogue: ['Une caisse marquée « À DONNER ». Elle est encore vide.'] },
      // Dès le tri avec Papa, on peut prendre une des deux cannes (pour le capitaine du ferry).
      {
        x: 0, y: 4,
        ifFlags: [FLAGS.papaFait],
        unlessFlags: [FLAGS.canneOfferte],
        unlessItems: [ITEMS.canneAPeche.id],
        script: [
          { give: ITEMS.canneAPeche, text: 'Tu prends une canne à pêche dans la caisse.' },
          { speaker: 'Papa', say: ['Tu vois. « À donner », ça veut dire à donner.'] },
        ],
      },
      // La canne qui reste, une fois l'autre prise pour le capitaine : Pierre peut la garder pour pêcher.
      { x: 0, y: 4, ifItems: [ITEMS.vieilleCanne.id], dialogue: ['La caisse « À DONNER » est vide.'] },
      { x: 0, y: 4, ifItems: [ITEMS.canneAPeche.id], script: OLD_ROD_CHOICE },
      { x: 0, y: 4, ifFlags: [FLAGS.canneOfferte], script: OLD_ROD_CHOICE },
      { x: 0, y: 4, dialogue: ['Deux cannes à pêche dans la caisse « À DONNER ».'] },
    ],
  },

  // Saint-Ay — la chaumière de la famille, façon Rouge Feu. Le déménagement est terminé (plus de cartons).
  // La famille y rentre après la naissance de Fanny ; quelques années plus tard, Papa y annonce le départ pour
  // Montépilloy. Une fois la famille partie (en revenant à pied de Montépilloy), la maison est vide.
  // Scénario : voir data/saintAyStory.js.
  playerHouse: {
    name: 'Maison de la famille',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmmooommoη',   // escalier vers la chambre des enfants (étage), contre le mur de droite
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
      { kind: 'pottedPlant', x: 6, y: 2 },
      { kind: 'crtTv', x: 7, y: 2 },
      { kind: 'table', x: 3, y: 4 },
      { kind: 'plant', x: 0, y: 5 },
      { kind: 'plant', x: 9, y: 5 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    triggers: [{ x: 9, y: 2, warp: { interior: 'playerHouseUp', x: 9, y: 3, facing: 'down' } }],
    objects: [
      { x: 7, y: 2, dialogue: ['La télé. Les nouvelles de la région passent en boucle.'] },
    ],
    npcs: [
      {
        id: 'papa-maison', name: 'Papa', x: 2, y: 4, facing: 'right', color: 0x3f6fd8,
        ifFlags: [FLAGS.familleRentree], unlessFlags: [FLAGS.arriveeMontepilloy], still: true,
        script: [
          { unlessFlags: [FLAGS.planCabane], speaker: 'Papa', say: ['Fanny dort enfin. File voir tes cousins, ils viennent d\'emménager !'], end: true },
          { unlessFlags: [FLAGS.cabaneFinie], speaker: 'Papa', say: ['Alors, cette cabane, elle avance ? J\'ai hâte de la voir !'], end: true },
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Papa', say: ['La voiture est chargée, sur la route du nord. Va dire au revoir à tes cousins.'], end: true },
          { speaker: 'Papa', say: ['Tes cousins ont de la chance de t\'avoir.'] },
        ],
      },
      {
        id: 'maman-maison', name: 'Maman', x: 7, y: 4, facing: 'left', color: 0xe86fa0,
        ifFlags: [FLAGS.familleRentree], unlessFlags: [FLAGS.arriveeMontepilloy], still: true,
        script: [
          { unlessFlags: [FLAGS.ellipseSaintAy], speaker: 'Maman', say: ['Chut… Fanny dort à l\'étage. Va plutôt jouer avec tes cousins !'], end: true },
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Maman', say: ['Les valises sont prêtes. On part dès que tu es prêt.'], end: true },
          { speaker: 'Maman', say: ['Fanny a tellement grandi… Elle ne tient plus en place.'] },
        ],
      },
      {
        id: 'manon-maison', name: 'Manon', x: 8, y: 3, facing: 'down', color: 0xf0a030,
        ifFlags: [FLAGS.familleRentree], unlessFlags: [FLAGS.arriveeMontepilloy],
        script: [
          { unlessFlags: [FLAGS.ellipseSaintAy], speaker: 'Manon', say: ['Fanny pleure toute la nuit… Mais elle est trop mignonne.'], end: true },
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Manon', say: ['Encore un déménagement…'], end: true },
          { speaker: 'Manon', say: ['Fanny me suit partout, maintenant. Même dans ma chambre !'] },
        ],
      },
      // Quelques années plus tard, Fanny a grandi : elle joue dans le salon.
      {
        id: 'fanny-maison', name: 'Fanny', x: 6, y: 3, facing: 'down', color: 0xf0c0c0,
        ifFlags: [FLAGS.ellipseSaintAy], unlessFlags: [FLAGS.arriveeMontepilloy],
        script: [
          { ifFlags: [FLAGS.annonceMutation], speaker: 'Fanny', say: ['C\'est loin, Montépilloy ? Il y aura des poules ?'], end: true },
          { speaker: 'Fanny', say: ['Pierre ! Tu joues à cache-cache avec moi ?'] },
        ],
      },
    ],
    // En rentrant, la cabane inaugurée, quelques années plus tard : l'annonce de la mutation.
    events: [{ on: 'enter', ...ANNOUNCEMENT_EVENT, ifFlags: [FLAGS.ellipseSaintAy], steps: ANNOUNCEMENT }],
  },

  // Saint-Ay — l'étage de la chaumière : la chambre des enfants, trois lits (Pierre, Manon, Fanny), escalier
  // pour redescendre à droite.
  playerHouseUp: {
    name: 'Chambre des enfants',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmommommoξ',   // trois lits, escalier vers le salon contre le mur de droite
      'mmommommoo',
      'oooooooooo',
      'moooooooom',   // plantes
    ]),
    decor: [
      ...[0, 3, 6].map((x) => ({ kind: 'bed', x, y: 2 })),
      { kind: 'window', x: 2, y: 0 },
      { kind: 'painting', x: 7, y: 0 },
      { kind: 'pottedPlant', x: 0, y: 5 },
      { kind: 'pottedPlant', x: 9, y: 5 },
    ],
    spawn: { x: 9, y: 3, facing: 'down' },
    triggers: [{ x: 9, y: 2, warp: { interior: 'playerHouse', x: 9, y: 3, facing: 'down' } }],
    objects: [
      ...[0, 9].map((x) => ({ x, y: 5, dialogue: ['Une petite plante verte.'] })),
    ],
    // Fanny bébé, couchée dans son lit, de la sortie de la clinique jusqu'à l'ellipse (ensuite, elle joue au salon).
    npcs: [
      {
        id: 'fanny-lit', name: 'Fanny', x: 6, y: 3, facing: 'down', still: true, inBed: true, child: true,
        ifFlags: [FLAGS.familleRentree], unlessFlags: [FLAGS.ellipseSaintAy],
        dialogue: ['Fanny dort, son petit poing serré. Elle sourit dans son sommeil.'],
      },
    ],
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
      { kind: 'window', x: 6, y: 0 },
      { kind: 'bookshelf', x: 8, y: 0 },
      { kind: 'table', x: 3, y: 4 },
      { kind: 'plant', x: 0, y: 5 },
    ],
    // Le cheval que Val sculpte, posé sur la table juste devant lui (art/tileArt.js DECALS.statue).
    decals: [{ kind: 'statue', x: 5, y: 4, ifFlags: [FLAGS.felixInvite] }],
    spawn: { x: 5, y: 6, facing: 'up' },
    npcs: [
      {
        id: 'felix-maison', name: 'Felix', x: 2, y: 6, facing: 'right', color: 0x9060d0,
        ifFlags: [FLAGS.maisonFelixVisitee], unlessFlags: [FLAGS.cabaneFinie],
        script: FELIX_CHANTIER,
      },
      {
        id: 'val', name: 'Val', x: 5, y: 3, facing: 'down', color: 0x5cb85c, still: true,
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
        id: 'yanis', name: 'Yanis', x: 1, y: 3, facing: 'right', color: 0xc0b040,
        ifFlags: [FLAGS.felixInvite], unlessFlags: [FLAGS.planCabane],
        dialogue: ['Salut, cousin !'],
      },
    ],
    // Felix, arrivé avant toi, t'accueille et expose son plan.
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
      { x: 5, y: 3, script: [{ speaker: 'Joshua', say: ['Personne n\'entre sans le mot de passe. « {motDePasse|QG} ». Chut !'] }] },
      { x: 6, y: 3, script: [{ speaker: 'Yanis', say: ['« {motDePasse|QG} »… Je l\'ai écrit sur ma main, pour pas l\'oublier.'] }] },
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
    events: [{ on: 'enter', ifFlags: [FLAGS.cabaneFinie], unlessSouvenirs: [TRAITS.espritEquipe.id], steps: CABANE_FETE }],
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
      { x: 1, y: 3, ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.familleRentree], dialogue: ['Maman se repose, les yeux mi-clos.'] },
      { x: 4, y: 3, ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.familleRentree], dialogue: ['Fanny dort, son petit poing serré.'] },
      { x: 12, y: 2, dialogue: ['Un ordinateur. Des noms de bébés défilent à l\'écran.'] },
    ],
    // Maman et Fanny sont couchées chacune dans un lit ; Papa et Manon entre les deux.
    npcs: [
      {
        id: 'maman-hopital', name: 'Maman', x: 0, y: 3, facing: 'down', color: 0xe86fa0, still: true, inBed: true,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.familleRentree],
        script: [
          { unlessFlags: [FLAGS.fannyMain], speaker: 'Maman', say: ['Va dire bonjour à Fanny, dans son berceau. Tends-lui la main.'], end: true },
          { speaker: 'Maman', say: ['Fanny dort. Va voir tes cousins, ils viennent d\'emménager au village.'] },
        ],
      },
      // Le berceau : la main de Fanny (voir FANNY_CRADLE).
      {
        id: 'fanny-hopital', name: 'Fanny', x: 3, y: 3, facing: 'down', still: true, inBed: true, child: true,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.familleRentree],
        script: FANNY_CRADLE,
      },
      {
        id: 'papa-hopital', name: 'Papa', x: 2, y: 4, facing: 'up', color: 0x3f6fd8,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.familleRentree],
        dialogue: ['Une petite sœur… Te voilà grand frère, maintenant.'],
      },
      {
        id: 'manon-hopital', name: 'Manon', x: 5, y: 4, facing: 'left', color: 0xf0a030,
        ifFlags: [FLAGS.familleArrivee], unlessFlags: [FLAGS.familleRentree],
        dialogue: ['Je pourrai jouer avec elle, moi aussi ? Plus tard ? Bon…'],
      },
    ],
    // Papa et Manon sont arrivés avant toi : la naissance de Fanny.
    events: [{ on: 'enter', ifFlags: [FLAGS.saArrivee], unlessFlags: [FLAGS.familleArrivee], steps: BIRTH }],
  },

  // Montépilloy — la grange de M. Bouly, façon Rouge Feu : établi (longue table de Rubis/Saphir) sous la
  // fenêtre, caisses de légumes, d'oranges et de tomates et une jarre du marché de Slateport (rs-crates.png),
  // tonneaux. La pièce de tracteur est sous la botte de paille du fond à droite (une fois que M. Bouly t'en a parlé) ;
  // au cache-cache, Benoît se cache dans le tonneau de gauche.
  boulyBarn: {
    name: 'Grange de M. Bouly',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXX',
      'XXXXXXXXX',
      'mmmoommOO',   // établi, caisses, tonneaux ; la botte de paille dessous, au fond à droite
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
      // La botte de paille du fond à droite cache la pièce de tracteur (une fois que M. Bouly t'en a parlé).
      { x: 8, y: 3, unlessFlags: [FLAGS.boulyDemande], dialogue: ['Une botte de paille. Ça gratte.'] },
      {
        x: 8, y: 3,
        ifFlags: [FLAGS.boulyDemande],
        dialogue: ['Tu soulèves la botte de paille… Dessous, une pièce de tracteur !', 'Jean va être content.'],
        after: ['Il ne reste que de la paille.'],
        item: ITEMS.pieceTracteur,
        setFlag: FLAGS.pieceTrouvee,
      },
    ],
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
    // Papa et Maman au salon ; Manon, Fanny et Jean à l'étage, dans la chambre (le jour de septembre, Papa, Maman et
    // Jean sont dehors). Maman rappelle le programme. Scénario : data/montepilloyStory.js.
    npcs: [
      {
        id: 'maman-mont', name: 'Maman', x: 6, y: 3, facing: 'left', color: 0xe86fa0,
        unlessFlags: [FLAGS.septembre], script: MAMAN,
      },
      {
        id: 'papa-mont', name: 'Papa', x: 4, y: 3, facing: 'down', color: 0x3f6fd8,
        unlessFlags: [FLAGS.septembre], script: PAPA,
      },
      // Le soir de la dernière vertu, Jean est rentré pour le dîner (voir DINNER).
      // Dès que Pierre est arrivé au collège : Papa, Maman et Jean sont rentrés (ils disaient au revoir dehors, le matin).
      {
        id: 'maman-college', name: 'Maman', x: 6, y: 3, facing: 'left', color: 0xe86fa0, ifFlags: [FLAGS.collegeOuverture],
        dialogue: ['Alors, ce premier jour de collège ? Raconte-moi tout !'],
      },
      {
        id: 'papa-college', name: 'Papa', x: 4, y: 3, facing: 'down', color: 0x3f6fd8, ifFlags: [FLAGS.collegeOuverture],
        dialogue: ['Le collège, c\'est le début de la grande aventure. Travaille bien.'],
      },
      {
        id: 'jean-college', name: 'Jean', x: 7, y: 5, facing: 'left', color: 0x3c7c5c, ifFlags: [FLAGS.collegeOuverture],
        dialogue: ['Alors, c\'est comment le collège ? Il y a des tracteurs à réparer ?'],
      },
      {
        id: 'jean-diner', name: 'Jean', x: 7, y: 5, facing: 'left', color: 0x3c7c5c,
        ifFlags: [FLAGS.finJournee], unlessFlags: [FLAGS.septembre],
        dialogue: ['On a réparé le tracteur de M. Bouly ! Enfin… surtout moi.'],
      },
    ],
    // Première arrivée à la maison : Maman accueille Pierre. Le soir de la dernière vertu : le dîner, puis septembre.
    events: [
      { on: 'enter', ifFlags: [FLAGS.ellipseMontepilloy], unlessFlags: [FLAGS.mamanAccueil], steps: MAMAN_WELCOME },
      { on: 'enter', ifFlags: [FLAGS.finJournee], unlessFlags: [FLAGS.septembre], steps: DINNER },
    ],
    triggers: [{ x: 9, y: 2, warp: { interior: 'montHouseUp', x: 12, y: 3, facing: 'down' } }],
  },

  // Collège Bonsecours (route de Bonsecours) — le hall : la principale derrière l'accueil, panneaux d'affichage, et un
  // seul escalier, à droite. Le collège se parcourt de bas en haut, un étage par salle : hall, couloir des casiers, salle
  // de maths (ta classe, la 6e B), salle de sciences, salle de français. Chaque escalier qui monte arrive en haut au
  // même endroit (à droite, puis à gauche, en alternance).
  // Scénario du premier jour : voir data/collegeStory.js.
  bonsecours: {
    name: 'Collège Bonsecours',
    frlg: true,
    // Mur du fond : bibliothèque, accueil de la principale, casiers (une case libre de chaque côté des escaliers) ; murs
    // latéraux : les étagères du CDI et des trophées ; le centre du hall reste dégagé.
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'oommoooommmooη', // escalier vers le couloir des casiers (droite) ; bibliothèque, casiers
      'oooommmooooooo', // accueil
      'mmoooooooooomm', // étagères contre les murs latéraux
      'mmoooooooooomm',
      'oooooooooooooo',
      'moooooooooooom',
      'moooooEEooooom',
    ]),
    decor: [
      { kind: 'bookshelf', x: 2, y: 0 },
      { kind: 'notice', x: 4, y: 0 },
      { kind: 'window', x: 6, y: 0 },
      ...[8, 9, 10].map((x) => ({ kind: 'locker', x, y: 2 })),
      { kind: 'notice', x: 11, y: 0 },
      { kind: 'longTable', x: 4, y: 3 },
      { kind: 'shelf', x: 0, y: 4 },
      { kind: 'shelf', x: 12, y: 4 },
      { kind: 'plant', x: 0, y: 7 },
      { kind: 'plant', x: 13, y: 7 },
    ],
    spawn: { x: 6, y: 7, facing: 'up' },
    triggers: [{ x: 13, y: 2, warp: { interior: 'bonsecoursCasiers', x: 13, y: 3, facing: 'down' } }],
    objects: [
      ...[4, 5, 6].map((x) => ({ x, y: 3, script: PRINCIPALE })),
      { x: 4, y: 1, dialogue: ['Emploi du temps de 6e B : maths, français, sciences… et sport le vendredi.'] },
      { x: 11, y: 1, dialogue: ['« Club de théâtre : inscriptions auprès de la principale. »'] },
      ...[2, 3].map((x) => ({ x, y: 2, dialogue: ['Des manuels scolaires… et un manga glissé derrière le dictionnaire.'] })),
      ...[8, 9, 10].map((x) => ({ x, y: 2, dialogue: ['Les casiers des 3e. Un cadenas en forme de Pikachu.'] })),
      ...[[0, 4], [1, 4], [0, 5], [1, 5]].map(([x, y]) => ({ x, y, dialogue: ['Des livres de la bibliothèque du CDI. Rendus en retard, pour la plupart.'] })),
      ...[[12, 4], [13, 4], [12, 5], [13, 5]].map(([x, y]) => ({ x, y, dialogue: ['Des trophées du collège : une coupe de cross… et une médaille de ping-pong.'] })),
    ],
    npcs: [
      ...collegeStudents([
        [3, 5, 'La principale m\'a dit bonjour. Je crois qu\'elle sait ce que j\'ai fait.', 'right'],
        [10, 6, 'À la cantine, il y a des frites aujourd\'hui. Enfin, j\'espère.', 'left'],
        [5, 6, 'Le surveillant voit tout. Même ce qui se passe derrière lui.', 'up'],
      ]),
      // On parle à la principale par-dessus le comptoir d'accueil.
      { id: 'principale', name: 'Principale', x: 5, y: 2, facing: 'down', color: 0x8c5ca8, script: PRINCIPALE },
      // Le surveillant attend Pierre dans le hall le premier jour, puis monte au couloir des casiers.
      {
        id: 'surveillant-hall', name: 'Surveillant', x: 9, y: 5, facing: 'left', color: 0x5c6c8c,
        ifFlags: [FLAGS.departCollege], unlessFlags: [FLAGS.collegeArrivee], script: SURVEILLANT,
      },
    ],
    // Premier jour : l'accueil du surveillant (voir collegeStory.js COLLEGE_WELCOME).
    events: [{ on: 'enter', ifFlags: [FLAGS.departCollege], unlessFlags: [FLAGS.collegeArrivee], steps: COLLEGE_WELCOME }],
  },

  // Collège Bonsecours — le couloir des casiers (1er étage, en haut de l'escalier du hall) : six casiers contre le mur ;
  // le 12 (x = 6) sera celui de Pierre… et de Rémy. À gauche, l'escalier qui monte à la salle de maths.
  // Scénario : voir data/collegeStory.js (l'embrouille du casier, la scène de la fille).
  bonsecoursCasiers: {
    name: 'Couloir des casiers',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ηooommmmmmomoξ', // escalier vers la salle de maths, casiers, placard d'entretien, escalier vers le hall
      'oooooooooooooo',
      'oooooooooooooo',
      'moooooooooooom',
      'oooooooooooooo',
    ]),
    decor: [
      ...Array.from({ length: 6 }, (_, i) => ({ kind: 'locker', x: 4 + i, y: 2 })),
      { kind: 'cabinet', x: 11, y: 1 },                 // le placard d'entretien (poignée cassée)
      { kind: 'pottedPlant', x: 0, y: 5 },
      { kind: 'pottedPlant', x: 13, y: 5 },
    ],
    spawn: { x: 13, y: 3, facing: 'down' },
    triggers: [
      { x: 13, y: 2, warp: { interior: 'bonsecours', x: 13, y: 3, facing: 'down' } },
      { x: 0, y: 2, warp: { interior: 'bonsecoursMaths', x: 0, y: 3, facing: 'down' } },
    ],
    objects: [
      { x: 6, y: 2, script: LOCKER },
      { x: 11, y: 2, script: CLOSET },
      ...[4, 5, 7, 8, 9].map((x) => ({ x, y: 2, dialogue: ['Un casier fermé à clé. Pas le tien.'] })),
    ],
    npcs: [
      ...collegeStudents([
        [2, 4, 'Mon casier sent le goûter de la semaine dernière. Ou d\'avant.', 'right'],
        [10, 4, 'J\'ai échangé ma carte Dracaufeu contre trois gommes. Je regrette.', 'left'],
      ]),
      // Rémy arrive en courant par l'escalier quand Pierre touche le casier 12 (voir collegeStory.js LOCKER_FIGHT),
      // puis, l'embrouille réglée, file en salle de maths.
      {
        id: 'remi', name: 'Rémy', x: 13, y: 3, facing: 'left', color: 0xc05c3c,
        ifFlags: [FLAGS.remiArrive], unlessFlags: [FLAGS.casierPartage],
      },
      {
        id: 'remi-casier', name: 'Rémy', x: LOCKER_SIDE[0], y: LOCKER_SIDE[1], facing: 'left', color: 0xc05c3c,
        ifFlags: [FLAGS.casierPartage], unlessFlags: [FLAGS.remiEnClasse], script: REMI,
      },
      // Le casier devenu QG : Rémy descend de la salle de maths donner son autocollant à Pierre (voir collegeStory.js
      // LOCKER).
      {
        id: 'remy-autocollant', name: 'Rémy', x: 0, y: 3, facing: 'right', color: 0xc05c3c,
        ifFlags: [FLAGS.remyAutocollant], unlessFlags: [FLAGS.remyRepart],
        dialogue: ['On a le même autocollant, maintenant !'],
      },
      {
        id: 'surveillant-couloir', name: 'Surveillant', x: SURVEILLANT_SPOT[0], y: SURVEILLANT_SPOT[1], facing: 'left',
        color: 0x5c6c8c, ifFlags: [FLAGS.collegeArrivee], script: SURVEILLANT,
      },
    ],
  },

  // Collège Bonsecours — salle de maths (2e étage) : à gauche, l'escalier qui redescend aux casiers ; à droite, celui
  // qui monte à la salle de sciences.
  bonsecoursMaths: {
    name: 'Salle de maths',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ξooooommmooooη', // escalier vers les casiers, bureau du professeur, escalier vers la salle de sciences
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
    spawn: { x: 0, y: 3, facing: 'down' },
    triggers: [
      { x: 0, y: 2, warp: { interior: 'bonsecoursCasiers', x: 0, y: 3, facing: 'down' } },
      { x: 13, y: 2, warp: { interior: 'bonsecoursSciences', x: 13, y: 3, facing: 'down' } },
    ],
    objects: [
      { x: 5, y: 1, dialogue: ['Au tableau : « Le carré de l\'hypoténuse est égal à la somme des carrés des deux autres côtés. »'] },
    ],
    npcs: [
      // Le prof de maths : ta classe (6e B) ; il remet le brevet une fois l'Audace reçue (voir collegeStory.js).
      { id: 'prof-maths', name: 'Professeur', x: 9, y: 2, facing: 'down', color: 0x4c6c9c, script: PROF },
      // Après l'ellipse (fin de la troisième), Pierre est seul avec le prof pour le brevet (Rémy est en sciences).
      {
        id: 'margaux-college', name: 'Margaux', x: 2, y: 5, facing: 'up', still: true, color: 0xf08080,
        ifFlags: [FLAGS.margauxTrouvee], unlessFlags: [FLAGS.finTroisieme],
        dialogue: ['On est dans la même classe, comme promis ! Enfin… presque promis.'],
      },
      // Margaux cachée (placard d'entretien, voir collegeStory.js CLOSET) : Étienne vient prévenir, à sa place.
      {
        id: 'etienne-maths', name: 'Étienne', x: 2, y: 5, facing: 'up', still: true, color: 0x6080a0,
        unlessFlags: [FLAGS.margauxTrouvee, FLAGS.finTroisieme],
        dialogue: ['Margaux a trouvé sa cachette imbattable, comme promis. Bonne chance !'],
      },
      // Camille, une fille de ta classe : la scène du dialogue à choix (voir collegeStory.js CAMILLE).
      {
        id: 'camille', name: 'Camille', x: 5, y: 5, facing: 'up', still: true, color: 0xe080a0,
        ifFlags: [FLAGS.collegeArrivee], unlessFlags: [FLAGS.finTroisieme], script: CAMILLE,
      },
      // Rémy, arrivé en classe après l'embrouille du casier.
      {
        id: 'remi-classe', name: 'Rémy', x: REMI_SEAT[0], y: REMI_SEAT[1], facing: 'up', still: true, color: 0xc05c3c,
        ifFlags: [FLAGS.remiEnClasse], unlessFlags: [FLAGS.finTroisieme], script: REMI,
      },
      ...collegeStudents([
        [1, 7, 'J\'ai oublié mon compas. Encore. C\'est le troisième cette année.'],
        [4, 7, 'Tu as fait l\'exercice 4 ? Moi non plus. On est deux, ça compte.'],
        [10, 7, 'Si tu lèves la main, faut répondre. C\'est un piège.'],
        [11, 5, 'Je dessine dans la marge depuis une heure. Personne a rien vu.'],
      ], { unlessFlags: [FLAGS.finTroisieme] }),
    ],
    events: [
      { on: 'enter', ifFlags: [FLAGS.remiEnClasse], unlessFlags: [FLAGS.remiInvite], steps: REMI_INVITE },
    ],
  },

  // Collège Bonsecours — salle de français, tout en haut (4e étage) : l'escalier de gauche redescend en sciences.
  bonsecoursFrancais: {
    name: 'Salle de français',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ξooooommmooooo', // escalier vers la salle de sciences, bureau du professeur
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
    spawn: { x: 0, y: 3, facing: 'down' },
    triggers: [{ x: 0, y: 2, warp: { interior: 'bonsecoursSciences', x: 0, y: 3, facing: 'down' } }],
    objects: [
      { x: 5, y: 1, dialogue: ['Au tableau : « Rédaction : racontez votre plus beau souvenir de vacances. »'] },
    ],
    npcs: [
      { id: 'prof-francais', name: 'Professeure', x: 9, y: 2, facing: 'down', color: 0xc06080, dialogue: ['Ta rédaction sur Saint-Ay était très réussie. Tu as le sens du récit !'] },
      ...collegeStudents([
        [2, 5, 'Ma rédaction fait douze lignes. Dont quatre de titre.'],
        [10, 5, 'J\'ai mis trois couches de blanco. On voit plus rien. Même pas moi.'],
        [1, 7, 'Qui a écrit « vive les vacances » sur la table ? C\'est pas moi. Enfin si.'],
        [10, 7, 'La sonnerie, c\'est le plus beau son du monde.'],
      ]),
      // Étienne revient ici une fois Margaux trouvée (ou à la fin de la troisième) ; avant, il est en salle de maths.
      ...[{ ifFlags: [FLAGS.margauxTrouvee] }, { ifFlags: [FLAGS.finTroisieme], unlessFlags: [FLAGS.margauxTrouvee] }].map((when) => ({
        id: 'etienne-college', name: 'Étienne', x: 7, y: 5, facing: 'up', still: true, color: 0x6080a0, ...when,
        dialogue: ['Les casiers, c\'était vrai ! Par contre, pas la même classe… On se voit à la récré !'],
      })),
    ],
  },

  // Collège Bonsecours — salle de sciences (3e étage) : paillasses et vitrine ; à droite, l'escalier qui redescend en
  // maths ; à gauche, celui qui monte à la salle de français.
  bonsecoursSciences: {
    name: 'Salle de sciences',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'ηooooommmoommξ', // escalier vers la salle de français, bureau du professeur, vitrine, escalier vers les maths
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
      { kind: 'glassCabinet', x: 11, y: 1 },
      { kind: 'longTable', x: 5, y: 2 },
      ...[[2, 4], [8, 4], [2, 6], [8, 6]].map(([x, y]) => ({ kind: 'longTable', x, y })),
      { kind: 'plant', x: 0, y: 7 },
      { kind: 'plant', x: 13, y: 7 },
    ],
    spawn: { x: 13, y: 3, facing: 'down' },
    triggers: [
      { x: 13, y: 2, warp: { interior: 'bonsecoursMaths', x: 13, y: 3, facing: 'down' } },
      { x: 0, y: 2, warp: { interior: 'bonsecoursFrancais', x: 0, y: 3, facing: 'down' } },
    ],
    objects: [
      ...[11, 12].map((x) => ({ x, y: 2, dialogue: ['La vitrine : un squelette en plastique, des bocaux et un vieux microscope.'] })),
    ],
    npcs: [
      ...collegeStudents([
        [3, 5, 'J\'ai cassé un bécher. Le prof a dit « c\'est pas grave ». Il a menti.'],
        [9, 5, 'Le squelette de la vitrine, il s\'appelle Gérard. C\'est moi qui l\'ai baptisé.'],
        [3, 7, 'Au microscope, j\'ai vu une feuille. Une feuille, mais en très gros.'],
        [9, 7, 'Si on mélange tout, ça explose ? … Non ? Dommage.'],
      ]),
      // Fin de la troisième : Rémy attend ici, à l'étage au-dessus, pendant le brevet de Pierre (voir collegeStory.js REMI).
      {
        id: 'remy-sciences', name: 'Rémy', x: 8, y: 7, facing: 'up', still: true, color: 0xc05c3c,
        ifFlags: [FLAGS.finTroisieme], script: REMI,
      },
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
    // Jean, ton petit frère, né entre-temps : il adore réparer des choses. Après l'école, il lance la réparation du
    // tracteur de M. Bouly, descend l'escalier et part devant à la ferme (voir JEAN).
    // Manon et Fanny y sont aussi, par défaut.
    npcs: [
      {
        id: 'manon-mont', name: 'Manon', x: 4, y: 4, facing: 'down', color: 0xf0a030,
        dialogue: ['Le collège ? Tu verras, on s\'y fait vite. Et le matin, tu feras la route à pied avec les copains.'],
      },
      {
        id: 'fanny-chambre', name: 'Fanny', x: 2, y: 6, facing: 'up', color: 0xf0c0c0,
        dialogue: ['Fanny fait rouler un petit tracteur en bois sur le parquet. « Vroum ! Comme celui de M. Bouly ! »'],
      },
      {
        id: 'jean-maison', name: 'Jean', x: 7, y: 5, facing: 'left', color: 0x3c7c5c,
        ifFlags: [FLAGS.ellipseMontepilloy], unlessFlags: [FLAGS.jeanQuetes, FLAGS.septembre],
        script: JEAN,
      },
    ],
    objects: [
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
        dialogue: ['Dernier jour de CM2… Le maître a apporté des gâteaux. J\'en ai déjà mangé trois.'],
      },
      // La partie finie, les copains sont revenus à l'école chercher leurs cartables.
      {
        id: 'margaux-fin', name: 'Margaux', x: 4, y: 3, facing: 'down', color: 0xf08080,
        ifFlags: [FLAGS.copainsPartent], unlessFlags: [FLAGS.septembre],
        dialogue: ['Promis, hein ? L\'été prochain, on refait une partie. Dans tout le village.'],
      },
      {
        id: 'etienne-fin', name: 'Étienne', x: 9, y: 5, facing: 'left', color: 0x6080a0,
        ifFlags: [FLAGS.copainsPartent], unlessFlags: [FLAGS.septembre],
        dialogue: ['Benoît dans un tonneau… Il fallait y penser !'],
      },
      // Benoît, lui, est assis seul devant la grange (voir maps/montepilloy.js).
    ],
    events: [{ on: 'enter', unlessFlags: [FLAGS.ecoleCm2], steps: LAST_DAY }],
  },

  // Prytanée — l'internat des garçons, rez-de-chaussée : le hall (un élève à l'accueil, panneau d'affichage) et
  // l'escalier qui monte aux chambres.
  dortoirHall: {
    name: 'Internat des garçons',
    frlg: true,
    // Comme le hall du collège : mur du fond (bibliothèque, drapeau, casiers des internes, vitrine des trophées), étagères
    // contre les murs latéraux, l'accueil au centre ; le passage vers l'escalier et la sortie reste dégagé.
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      'mmooooommmmη', // bibliothèque ; casiers, vitrine ; escalier vers le 1er étage
      'oooooooooooo',
      'mmoommmooomm', // étagères contre les murs latéraux ; bureau de l'accueil
      'mmoooooooomm',
      'oooooooooooo',
      'mooooEEoooom',
    ]),
    decor: [
      { kind: 'bookshelf', x: 0, y: 0 },
      { kind: 'notice', x: 2, y: 0 },
      { kind: 'window', x: 5, y: 0 },
      ...[7, 8].map((x) => ({ kind: 'locker', x, y: 2 })),
      { kind: 'glassCabinet', x: 9, y: 1 },
      { kind: 'shelf', x: 0, y: 4 },
      { kind: 'shelf', x: 10, y: 4 },
      { kind: 'longTable', x: 4, y: 4 },
      { kind: 'pottedPlant', x: 0, y: 7 },
      { kind: 'pottedPlant', x: 11, y: 7 },
    ],
    decals: [{ kind: 'frFlag', x: 3, y: 0 }],
    spawn: { x: 5, y: 6, facing: 'up' },
    // La nuit du mur : le hall est dans le noir et vide (tout le monde dort).
    night: PRYTANEE_NIGHT,
    triggers: [{ x: 11, y: 2, warp: { interior: 'dortoir', x: 13, y: 3, facing: 'down' } }],
    // Le capitaine, reparti vers son poste pendant que Pierre entrait : il n'est plus devant la porte.
    events: [{ on: 'enter', ifFlags: [FLAGS.capitaineParle], unlessFlags: [FLAGS.capitaineAccueil], steps: [{ setFlag: FLAGS.capitaineAccueil }] }],
    objects: [
      { x: 2, y: 1, dialogue: ['Au tableau : « Extinction des feux à 22 h. Inspection des chambres chaque matin. »'] },
      ...[3, 4].map((x) => ({ x, y: 1, dialogue: ['Le drapeau tricolore. Il est repassé tous les dimanches.'] })),
      ...[0, 1].map((x) => ({ x, y: 2, dialogue: ['Des manuels de maths et des règlements intérieurs.'] })),
      ...[7, 8].map((x) => ({ x, y: 2, dialogue: ['Les casiers des internes. Dans chacun, une photo de famille scotchée à l\'intérieur.'] })),
      ...[9, 10].map((x) => ({ x, y: 2, dialogue: ['La vitrine des trophées : cross, rugby… et la coupe de la chambrée la mieux rangée.'] })),
      ...[[0, 4], [1, 4], [0, 5], [1, 5]].map(([x, y]) => ({ x, y, dialogue: ['Des boîtes de cirage et des brosses. Les rangers brillent, ou c\'est la corvée.'] })),
      ...[[10, 4], [11, 4], [10, 5], [11, 5]].map(([x, y]) => ({ x, y, dialogue: ['Le courrier des internes, trié par chambre. Rien pour toi aujourd\'hui.'] })),
    ],
    npcs: PRYTANEE_DAY.flatMap((when) => [
      {
        id: 'planton', name: 'Élève', sprite: 'g55', x: 5, y: 3, facing: 'down', still: true, ...when,
        dialogue: ['Salut ! Ta chambre est au premier, l\'escalier au fond à droite.'],
      },
      {
        id: 'eleve-hall', name: 'Élève', sprite: 'g56', x: 8, y: 5, facing: 'left', ...when,
        dialogue: ['Le deuxième étage, c\'est les terminales. Ils se croient chez eux.'],
      },
      // Facultatif, jusqu'au bac : le nouveau qui a le mal du pays (voir prytaneeStory.js HOMESICK).
      {
        id: 'nouveau', name: 'Nouveau', sprite: 'g58', x: 2, y: 5, facing: 'right', still: true, ...when,
        unlessFlags: [...(when.unlessFlags ?? []), FLAGS.ellipseBac],
        script: HOMESICK,
      },
    ]),
  },

  // Prytanée — l'internat des garçons, 1er étage : la chambre de Pierre, Tanguy et Geoffrey, façon Rouge Feu : quatre
  // lits contre le mur, armoires, un bureau ; deux escaliers (vers le hall, vers le 2e étage). Le lit de Pierre est celui
  // du milieu, son armoire celle de droite (voir data/prytaneeStory.js).
  dortoir: {
    name: 'Dortoir',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'mmommommommηoξ', // lits ; escalier vers le 2e étage, escalier vers le hall
      'mmommommommooo',
      'oooooooooooooo',
      'mmmmoooooooomm', // armoires, bureau (contre les armoires de gauche)
      'mmoooooooooomm',
      'oooooooooooooo',
    ]),
    triggers: [
      { x: 13, y: 2, warp: { interior: 'dortoirHall', x: 11, y: 3, facing: 'down' } },
      { x: 11, y: 2, warp: { interior: 'dortoirEtage2', x: 13, y: 3, facing: 'down' } },
    ],
    decor: [
      ...[0, 3, 6, 9].map((x) => ({ kind: 'bed', x, y: 2 })),
      { kind: 'window', x: 2, y: 0 },
      { kind: 'notice', x: 5, y: 0 },
      { kind: 'window', x: 7, y: 0 },              // l'escalier qui monte est en x = 11 : pas de fenêtre devant
      ...[0, 1, 12, 13].map((x) => ({ kind: 'wardrobe', x, y: 5 })),
      { kind: 'schoolDesk', x: 2, y: 5 },
    ],
    spawn: { x: 13, y: 3, facing: 'down' },
    // Le soir du mur, jusqu'au retour : la nuit tombe dans la chambre (au petit matin, il fait jour).
    night: { ifFlags: [FLAGS.soirMur], unlessFlags: [FLAGS.murReussi] },
    npcs: [
      // Déjà dans la chambre à l'arrivée, au milieu de la pièce (pas devant un lit ni un meuble) ; ils sortent faire le mur
      // le soir même.
      { id: 'tanguy', name: 'Tanguy', x: 5, y: 6, facing: 'right', color: 0x8c6c3c, unlessFlags: [FLAGS.murPropose], script: TANGUY_GUIDE },
      { id: 'geoffrey', name: 'Geoffrey', x: 9, y: 6, facing: 'left', color: 0x4c7cb0, unlessFlags: [FLAGS.murPropose], script: GEOFFREY_GUIDE },
      // L'inspection.
      {
        id: 'capitaine-inspection', name: 'Capitaine', x: 13, y: 3, facing: 'down', color: 0x3c5c2c,   // en haut de l'escalier
        ifFlags: [FLAGS.chambrePrete], unlessFlags: [FLAGS.inspection],
      },
      // Au petit matin, de retour du mur : le capitaine monte au dortoir (voir prytaneeStory.js MORNING).
      {
        id: 'capitaine-matin', name: 'Capitaine', x: 13, y: 3, facing: 'down', color: 0x3c5c2c,   // en haut de l'escalier
        ifFlags: [FLAGS.murReussi], unlessFlags: [FLAGS.murMatin],
      },
      {
        id: 'tanguy-matin', name: 'Tanguy', x: 5, y: 6, facing: 'right', color: 0x8c6c3c,
        ifFlags: [FLAGS.murReussi], unlessFlags: [FLAGS.ellipseBac], dialogue: ['On remet ça quand tu veux.'],
      },
      {
        id: 'geoffrey-matin', name: 'Geoffrey', x: 9, y: 6, facing: 'left', color: 0x4c7cb0,
        ifFlags: [FLAGS.murReussi], unlessFlags: [FLAGS.ellipseBac], dialogue: ['Personne a rien vu.'],
      },
      // Quelques années plus tard, le jour des résultats du bac : ils réveillent Pierre et descendent voir la liste.
      {
        id: 'tanguy-jourj', name: 'Tanguy', x: 5, y: 6, facing: 'right', color: 0x8c6c3c,
        ifFlags: [FLAGS.ellipseBac], unlessFlags: [FLAGS.bacDescente], dialogue: ['On descend, viens !'],
      },
      {
        id: 'geoffrey-jourj', name: 'Geoffrey', x: 9, y: 6, facing: 'left', color: 0x4c7cb0,
        ifFlags: [FLAGS.ellipseBac], unlessFlags: [FLAGS.bacDescente], dialogue: ['J\'ai pas dormi de la nuit.'],
      },
    ],
    objects: [
      // Les trois tâches de la chambre, dans n'importe quel ordre.
      ...[6, 7].map((x) => ({ x, y: 3, ifFlags: [FLAGS.capitaineParle], unlessFlags: [FLAGS.litFait], script: MAKE_BED })),
      ...[6, 7].map((x) => ({ x, y: 3, dialogue: ['Ton lit, fait au carré.'] })),
      ...[[12, 5], [13, 5], [12, 6]].map(([x, y]) => ({
        x, y, ifFlags: [FLAGS.capitaineParle], unlessFlags: [FLAGS.armoireRangee], script: TIDY_WARDROBE,
      })),
      ...[[12, 5], [13, 5], [12, 6]].map(([x, y]) => ({ x, y, dialogue: ['Ton armoire. Tout est plié, rangé.'] })),
      ...[2, 3].map((x) => ({ x, y: 5, ifFlags: [FLAGS.capitaineParle], unlessFlags: [FLAGS.affairesPretes], script: PREPARE_DESK })),
      ...[2, 3].map((x) => ({ x, y: 5, dialogue: ['Tes affaires pour demain, prêtes sur le bureau.'] })),
      ...[[0, 5], [1, 5], [1, 6]].map(([x, y]) => ({ x, y, dialogue: ['L\'armoire de Tanguy et Geoffrey. Pliée au carré, elle aussi.'] })),
      ...[0, 1, 3, 4, 9, 10].map((x) => ({ x, y: 3, dialogue: ['Un lit au carré. Pas un pli.'] })),
    ],
    events: [
      // Le capitaine, reparti vers son poste pendant que Pierre entrait : il n'est plus devant la porte.
      { on: 'enter', ifFlags: [FLAGS.capitaineParle], unlessFlags: [FLAGS.capitaineAccueil], steps: [{ setFlag: FLAGS.capitaineAccueil }] },
      { on: 'enter', ifFlags: [FLAGS.murReussi], unlessFlags: [FLAGS.murMatin], steps: MORNING },
    ],
  },

  // Prytanée — l'internat des garçons, 2e étage : la chambre des terminales, quatre lits, des élèves.
  dortoirEtage2: {
    name: 'Dortoir des terminales',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      'mmommommommooξ', // lits ; escalier vers le 1er étage
      'mmommommommooo',
      'oooooooooooooo',
      'mmoooooooooomm', // armoires
      'mmoooooooooomm',
      'oooooooooooooo',
    ]),
    decor: [
      ...[0, 3, 6, 9].map((x) => ({ kind: 'bed', x, y: 2 })),
      { kind: 'window', x: 2, y: 0 },
      { kind: 'painting', x: 7, y: 0 },
      { kind: 'window', x: 10, y: 0 },
      ...[0, 1, 12, 13].map((x) => ({ kind: 'wardrobe', x, y: 5 })),
    ],
    spawn: { x: 13, y: 3, facing: 'down' },
    night: PRYTANEE_NIGHT,                          // la nuit du mur : dans le noir, et ils dorment (pas de PNJ debout)
    triggers: [{ x: 13, y: 2, warp: { interior: 'dortoir', x: 11, y: 3, facing: 'down' } }],
    objects: [
      ...[0, 1, 3, 4, 6, 7, 9, 10].map((x) => ({ x, y: 3, dialogue: ['Un lit au carré. Les terminales, ça ne rigole pas.'] })),
      ...[[0, 5], [1, 5], [12, 5], [13, 5]].map(([x, y]) => ({ x, y, dialogue: ['Une armoire. Un poster de rugby scotché à l\'intérieur de la porte.'] })),
    ],
    npcs: PRYTANEE_DAY.flatMap((when) => [
      // Internat des garçons : des garçons (apparences imposées, les figurants au hasard comptent aussi des filles).
      { id: 'terminale-1', name: 'Élève', sprite: 'g88', x: 2, y: 4, facing: 'right', ...when, dialogue: ['Vous êtes la chambre du dessous ? Vous ronflez.'] },
      { id: 'terminale-2', name: 'Élève', sprite: 'g89', x: 7, y: 4, facing: 'down', ...when, dialogue: ['Le bac, c\'est dans un an. Ou dans deux. Je sais plus.'] },
      { id: 'terminale-3', name: 'Élève', sprite: 'g23', x: 10, y: 6, facing: 'left', ...when, dialogue: ['Mon lit n\'est jamais assez au carré pour le capitaine. Jamais.'] },
    ]),
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
        script: AGENT_KEYS,
      },
    ],
  },

  // Bordeaux — ton appartement avec Ousmane : la coupure (dans le noir, compteur dans l'entrée), puis la soirée
  // d'intégration (une quinzaine d'étudiants qui dansent, l'enceinte au milieu du salon). Voir data/bordeauxStory.js.
  appartement: {
    name: 'Appartement',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      'mmooooommomm', // lits, bureau ; le tableau électrique au mur du fond (x = 5)
      'mmooooommomm',
      'oooooooooooo',
      'oooooooooooo', // salon
      'oooooooooooo',
      'oooooooooooo',
      'oooooooooooo',
      'ooooooEEoooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'computerDesk', x: 7, y: 2 },
      { kind: 'bed', x: 10, y: 2 },
      { kind: 'painting', x: 9, y: 0 },
    ],
    decals: [
      { kind: 'meter', x: 5, y: 0, unlessFlags: [FLAGS.coupureReparee] },
      { kind: 'meter', x: 5, y: 0, on: true, ifFlags: [FLAGS.coupureReparee] },
      // Le lendemain de la soirée : confettis partout (avec le salon), la couette en vrac sur ton lit (art/partyMess.js).
      ...[[6, 6], [3, 6], [8, 4], [5, 8], [10, 7], [1, 5]].map(([x, y]) => ({
        image: 'confettis', x, y, floor: true, ...MORNING_AFTER, unlessFlags: [FLAGS.soireeFinie, FLAGS.salonRange],
      })),
      { image: 'couette', x: 10, y: 2, dx: 1, dy: 6, ...MORNING_AFTER, unlessFlags: [FLAGS.soireeFinie, FLAGS.litFaitBordeaux] },
    ],
    // Dans le noir tant que le compteur n'est pas relevé.
    dark: { ifFlags: [FLAGS.ousmaneRencontre], unlessFlags: [FLAGS.coupureReparee], radius: 34 },
    // L'enceinte de Paulfit au milieu du salon, pendant la soirée.
    props: [
      { type: 'partySpeaker', x: 6, y: 5, w: 1, h: 1, ...PARTY_TIME, dialogue: ['L\'enceinte de Paulfit. Elle envoie !'] },
      // Le lendemain matin, facultatif : le désordre à ranger, par catégorie (ramasser un objet range toute sa catégorie).
      ...[[3, 4], [9, 5], [2, 7]].map(([x, y]) => ({
        type: 'image', image: 'gobelets', x, y, w: 1, h: 1,
        ...MORNING_AFTER, unlessFlags: [FLAGS.soireeFinie, FLAGS.gobeletsRanges], script: TIDY_CUPS,
      })),
      ...[['pizza', 5, 6], ['canettes', 8, 7], ['chips', 4, 7], ['bouteilles', 10, 6]].map(([image, x, y]) => ({
        type: 'image', image, x, y, w: 1, h: 1,
        ...MORNING_AFTER, unlessFlags: [FLAGS.soireeFinie, FLAGS.salonRange], script: TIDY_LIVING_ROOM,
      })),
    ],
    spawn: { x: 6, y: 8, facing: 'up' },
    npcs: [
      // Ousmane, pendant la coupure (il sort ensuite attendre devant l'immeuble).
      {
        id: 'ousmane-coupure', name: 'Ousmane', x: 7, y: 7, facing: 'up',
        ifFlags: [FLAGS.ousmaneRencontre], unlessFlags: [FLAGS.preparatifs],
        dialogue: ['On n\'y voit rien… Il est où, ce compteur ? Pas près de la porte, en tout cas.'],
      },
      // Le lendemain matin : Ousmane dort, dans son lit (celui de gauche).
      { id: 'ousmane-lit', name: 'Ousmane', x: 0, y: 3, facing: 'down', still: true, inBed: true, ...MORNING_AFTER, script: OUSMANE_ASLEEP },
      // La soirée : Ousmane et Rémi dans la foule.
      { id: 'ousmane-fete', name: 'Ousmane', x: 7, y: 6, facing: 'left', ...PARTY_TIME, dancing: true, dialogue: ['Regarde-moi ça ! Et dire que tout à l\'heure on était dans le noir.'] },
      { id: 'remi-fete', name: 'Rémi', x: 5, y: 6, facing: 'right', ...PARTY_TIME, dancing: true, dialogue: ['This party is so lit ! Enfin… grâce à toi, littéralement.'] },
      // Léo et Anaïs, de KEDGE, qu'on retrouve à Hull (sprites de Hull, par leur nom : voir characters.js).
      { id: 'leo-fete', name: 'Léo', x: 4, y: 5, facing: 'right', ...PARTY_TIME, dancing: true, script: PARTY_LEO },
      { id: 'anais-fete', name: 'Anaïs', x: 8, y: 5, facing: 'left', ...PARTY_TIME, dancing: true, script: PARTY_ANAIS },
      { id: 'etudiant-1', name: 'Étudiant', x: 1, y: 4, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Première année à KEDGE ! Et toi ?'] },
      { id: 'etudiant-2', name: 'Étudiant', x: 3, y: 4, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['C\'est toi qui as rallumé le courant ? Respect.'] },
      { id: 'etudiant-3', name: 'Étudiant', x: 8, y: 4, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['L\'enceinte, elle envoie !'] },
      { id: 'etudiant-4', name: 'Étudiant', x: 10, y: 4, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Quelqu\'un a vu les gobelets ? Ah, ils sont là.'] },
      { id: 'etudiant-5', name: 'Étudiant', x: 9, y: 5, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Je connais personne, mais j\'adore tout le monde.'] },
      { id: 'etudiant-6', name: 'Étudiant', x: 1, y: 6, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['On est combien dans ce salon ? Vingt ?'] },
      { id: 'etudiant-7', name: 'Étudiant', x: 3, y: 6, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Demain, cours à 8 h. On verra demain.'] },
      { id: 'etudiant-8', name: 'Étudiant', x: 10, y: 6, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Tu fais finance ou marketing ?'] },
      { id: 'etudiant-9', name: 'Étudiant', x: 2, y: 7, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Elle est trop bien, cette chanson !'] },
      { id: 'etudiant-10', name: 'Étudiant', x: 9, y: 7, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Les voisins vont nous adorer.'] },
      { id: 'etudiant-11', name: 'Étudiant', x: 1, y: 8, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Je danse depuis une heure, j\'ai mal aux pieds.'] },
      { id: 'etudiant-12', name: 'Étudiant', x: 4, y: 8, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Ousmane m\'a dit que c\'était ici, la meilleure soirée.'] },
      { id: 'etudiant-13', name: 'Étudiant', x: 10, y: 8, facing: 'down', ...PARTY_TIME, dancing: true, dialogue: ['Tu restes jusqu\'à quelle heure ?'] },
    ],
    // Le tableau électrique : au fond, sans bulle « ! » (on le cherche dans le noir).
    objects: [
      { x: 5, y: 1, hidden: true, script: METER },
      // Le lendemain matin, facultatif : ton lit (celui de droite) ; les gobelets et le salon sont des objets au sol (props).
      ...[10, 11].map((x) => ({ x, y: 3, ...MORNING_AFTER, unlessFlags: [FLAGS.soireeFinie, FLAGS.litFaitBordeaux], script: TIDY_BED })),
    ],
    // En quittant la fête (devant la porte) : le lendemain matin.
    triggers: [[6, 8], [7, 8], [5, 9], [8, 9]].map(([x, y]) => ({ x, y, ...PARTY_TIME, script: PARTY_END })),
    events: [
      { on: 'enter', ifFlags: [FLAGS.ousmaneRencontre], unlessFlags: [FLAGS.coupure], steps: BLACKOUT },
      { on: 'enter', ...PARTY_TIME, steps: PARTY },
    ],
  },

  // Bordeaux — le studio de Paulfit, fan de musculation : haltères au sol.
  studioPaulfit: {
    name: 'Studio de Paulfit',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoooomm',
      'mmoooooo',
      'oooooomo', // haltères
      'omoooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'window', x: 3, y: 0 },
      { kind: 'cabinet', x: 6, y: 1 },
      { kind: 'blueShelf', x: 7, y: 1 },
    ],
    decals: [
      { kind: 'dumbbells', x: 6, y: 4 },
      { kind: 'dumbbells', x: 1, y: 5 },
    ],
    spawn: { x: 3, y: 5, facing: 'up' },
    npcs: [{ id: 'paulfit', name: 'Paulfit', x: 4, y: 3, facing: 'down', script: PAULFIT }],
    objects: [
      ...[[6, 4], [1, 5]].map(([x, y]) => ({ x, y, dialogue: ['Des haltères. Bien trop lourds pour toi.'] })),
    ],
  },

  // Bordeaux — l'appartement de Rémi, revenu d'un échange aux USA : drapeau américain au mur.
  appartRemi: {
    name: 'Appartement de Rémi',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXX',
      'XXXXXXXX',
      'mmoooomm',
      'mmoooomm',
      'oooooooo',
      'oooooooo',
      'oooEEooo',
    ]),
    decor: [
      { kind: 'bed', x: 0, y: 2 },
      { kind: 'computerDesk', x: 6, y: 2 },
    ],
    decals: [{ kind: 'usFlag', x: 3, y: 0 }],
    spawn: { x: 3, y: 5, facing: 'up' },
    npcs: [{ id: 'remi-gobelets', name: 'Rémi', x: 4, y: 3, facing: 'down', script: REMI_CUPS }],
    objects: [
      ...[3, 4].map((x) => ({ x, y: 1, dialogue: ['Un drapeau américain. « Souvenir de mon échange aux USA », d\'après Rémi.'] })),
    ],
  },

  // Bordeaux — l'école KEDGE : l'oral d'anglais (voir data/bordeauxStory.js ENGLISH_ORAL).
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
        script: ENGLISH_ORAL,
      },
    ],
  },

  // Hull — l'université (les résultats de l'examen sont affichés dehors, voir hullStory.js RESULTS).
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
      {
        id: 'prof-hull', name: 'Professor', x: 6, y: 4, facing: 'down', color: 0x5c3c7c,
        unlessFlags: [FLAGS.mailLu],
        dialogue: ['Welcome to Hull! Les résultats de l\'examen seront affichés devant l\'université.'],
      },
      // De retour après le mail d'Amsterdam : ta nouvelle affectation.
      {
        id: 'prof-hull-echange', name: 'Professor', x: 6, y: 4, facing: 'down', color: 0x5c3c7c,
        ifFlags: [FLAGS.mailLu],
        dialogue: [
          '[Professor - texte provisoire] Welcome back! Voici ta nouvelle affectation :',
          'un échange universitaire à New Delhi, en Inde. Voici ton billet d\'avion !',
          "L'aéroport est au bout de la grande rue.",
        ],
        after: ["[Professor - texte provisoire] L'aéroport, c'est au bout de la grande rue. Good luck!"],
        item: ITEMS.billetNewDelhi,
      },
    ],
  },

  // Hull — chez Léo, avec Romain et Prophecy (la petite maison juste après le premier pub, en haut de Newland Avenue).
  // Scénario : data/hullStory.js.
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
        id: 'prophecy', name: 'Prophecy', x: 6, y: 4, facing: 'left', color: 0x3c8cb0,
        unlessFlags: [FLAGS.leoPlan],
        dialogue: ['Il me faut une heure pour choisir mes chaussures. Au moins.'],
      },
      // Après la soirée : de retour chez eux.
      ...[['leo-apres', 'Léo', 6, 6, 'J\'ai lu la même page six fois… hier. Et aujourd\'hui aussi.'],
        ['romain-apres', 'Romain', 1, 4, 'Quelle soirée ! On en reparlera longtemps.'],
        ['prophecy-apres', 'Prophecy', 6, 4, 'Bonne chance pour les exams, Pierre.']].map(([id, name, x, y, line]) => ({
        id, name, x, y, facing: 'down', ifSouvenirs: [INSOUCIANCE], unlessFlags: [FLAGS.jourResultats], dialogue: [line],
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
      'mmoooooo',
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
        ifFlags: [FLAGS.ousmaneRentre], unlessFlags: [FLAGS.leoPlan],
        script: [
          { ifFlags: [FLAGS.leoAppel], speaker: 'Ousmane', say: ['Léo t\'attend chez lui : en haut de Newland Avenue, à droite, la petite maison juste après le pub.'], end: true },
          { speaker: 'Ousmane', say: ['Bienvenue à la coloc !'] },
        ],
      },
      // Au petit matin, Ousmane est rentré avant Pierre ; au réveil, il l'envoie à la bibliothèque (hullStory.js SLEEP).
      {
        id: 'ousmane-nuit', name: 'Ousmane', x: 1, y: 5, facing: 'right',
        ifSouvenirs: [INSOUCIANCE], unlessFlags: [FLAGS.lendemainHull],
        dialogue: ['Au lit. Demain, bibliothèque.'],
      },
      {
        id: 'ousmane-apres', name: 'Ousmane', x: 1, y: 5, facing: 'right',
        ifFlags: [FLAGS.lendemainHull], unlessFlags: [FLAGS.revisions],
        dialogue: ['La bibliothèque, c\'est la longère au toit d\'ardoise, en haut de Newland Avenue, à gauche. J\'arrive !'],
      },
    ],
    events: [
      { on: 'enter', ifFlags: [FLAGS.ousmaneRentre], unlessFlags: [FLAGS.leoAppel], steps: LEO_CALLED },
      // Au petit matin, après l'Asylum : on dort.
      { on: 'enter', ifSouvenirs: [INSOUCIANCE], unlessFlags: [FLAGS.lendemainHull], steps: SLEEP },
    ],
  },

  // Hull — premier pub de Newland Avenue : un vrai pub anglais. Long comptoir en bois et ses pompes à bière, étagères
  // à bouteilles au mur derrière le barman (qui va et vient), tabourets où les habitués sont accoudés, tables rondes,
  // cible de fléchettes (art/frlgArt.js, meubles de bar). On commande sa pinte au barman par-dessus le comptoir.
  // Les tabourets ne bloquent pas : on s'y assoit (les PNJ s'y posent).
  hullPubA: {
    name: 'Pub',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'moooooooom',
      'ommmmmmmoo',
      'oooooooooo',
      'oooooooooo',
      'omoooooomo',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'bottleShelf', x: 2, y: 1 },
      { kind: 'bottleShelf', x: 5, y: 1 },
      { kind: 'dartboard', x: 8, y: 0 },
      { kind: 'pottedPlant', x: 0, y: 2 },
      { kind: 'cabinet', x: 9, y: 1 },
      { kind: 'barCounterL', x: 1, y: 3 },
      ...[2, 3, 4, 5, 6].map((x) => ({ kind: 'barCounter', x, y: 3 })),
      { kind: 'barCounterR', x: 7, y: 3 },
      { kind: 'beerTaps', x: 2, y: 3, dy: -9 },
      { kind: 'beerTaps', x: 6, y: 3, dy: -9 },
      { kind: 'pintPair', x: 1, y: 3, dy: -12 },
      ...[1, 2, 6, 7].map((x) => ({ kind: 'barStool', x, y: 4 })),
      // Tables rondes et leurs tabourets, de chaque côté de l'entrée.
      { kind: 'barStool', x: 0, y: 6 }, { kind: 'pubTable', x: 1, y: 6 }, { kind: 'barStool', x: 2, y: 6 },
      { kind: 'pintPair', x: 1, y: 6, dy: -14 },
      { kind: 'barStool', x: 7, y: 6 }, { kind: 'pubTable', x: 8, y: 6 }, { kind: 'barStool', x: 9, y: 6 },
      { kind: 'pintPair', x: 8, y: 6, dy: -14 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    objects: [
      ...[2, 3, 4, 5, 6].map((x) => ({ x, y: 3, script: PUB_A_BAR })),
      { x: 8, y: 1, dialogue: ['Une cible de fléchettes. Personne ne vise le centre à cette heure-ci.'] },
      ...[[1, 6], [8, 6]].map(([x, y]) => ({ x, y, dialogue: ['Une table ronde, quelques ronds de bière.'] })),
    ],
    npcs: [
      { id: 'barman-a', name: 'Barman', x: 4, y: 2, facing: 'down', pace: [[3, 2], [5, 2]], dialogue: ['What can I get you?'] },
      { id: 'client-a1', name: 'Client', x: 1, y: 4, facing: 'up', fidget: true, dialogue: ['Cheers, mate!'] },
      { id: 'client-a2', name: 'Cliente', x: 7, y: 4, facing: 'up', fidget: true, dialogue: ['La Guinness est bonne, ce soir.'] },
      // La bande, aux deux tables : chacun sa commande (voir hullStory.js ORDERS).
      ...ORDERS.map((order, i) => ({
        id: order.id, name: order.name, ...[[0, 6, 'right'], [2, 6, 'left'], [7, 6, 'right'], [9, 6, 'left']].map(([x, y, facing]) => ({ x, y, facing }))[i],
        ...PUB_A_TIME, still: true, script: orderScript(order),
      })),
    ],
    events: [{ on: 'enter', ...PUB_A_TIME, steps: PUB_A_WELCOME }],
  },

  // Hull — deuxième pub : comptoir et étagère à bouteilles au fond à gauche, trois tables rondes par rangée avec un
  // tabouret de chaque côté (les tabourets ne bloquent pas), des habitués ; la bande à la table du fond à droite, un
  // habitué près de la cible propose une partie de fléchettes.
  hullPubB: {
    name: 'Pub',
    frlg: true,
    grid: parseGrid([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'mmmoooooom',
      'oooooooooo',
      'omoomoomoo',
      'oooooooooo',
      'omoomoomoo',
      'ooooEEoooo',
    ]),
    decor: [
      { kind: 'bottleShelf', x: 0, y: 1 },
      { kind: 'barCounterL', x: 0, y: 2 },
      { kind: 'barCounter', x: 1, y: 2 },
      { kind: 'barCounterR', x: 2, y: 2 },
      { kind: 'beerTaps', x: 1, y: 2, dy: -9 },
      { kind: 'dartboard', x: 5, y: 0 },
      { kind: 'neonPink', x: 7, y: 0, dy: -10 },
      { kind: 'pottedPlant', x: 9, y: 2 },
      // Tables rondes, un tabouret de chaque côté.
      ...[1, 4, 7].flatMap((x) => [4, 6].flatMap((y) => [
        { kind: 'barStool', x: x - 1, y }, { kind: 'pubTable', x, y }, { kind: 'barStool', x: x + 1, y },
      ])),
      { kind: 'pintPair', x: 1, y: 6, dy: -14 },
      { kind: 'pintPair', x: 4, y: 4, dy: -14 },
      // Les verres de la bande, sur la table du fond à droite.
      { kind: 'pintPair', x: 7, y: 4, dx: -3, dy: -14 },
      { kind: 'pintPair', x: 7, y: 4, dx: 4, dy: -13 },
    ],
    spawn: { x: 4, y: 6, facing: 'up' },
    npcs: [
      { id: 'barman-b', name: 'Barmaid', x: 3, y: 2, facing: 'down', fidget: true, dialogue: ['Your friend booked the table at the back!'] },
      { id: 'client-b1', name: 'Client', x: 0, y: 4, facing: 'right', fidget: true, dialogue: ['Another round, please!'] },
      { id: 'client-b2', name: 'Cliente', x: 2, y: 6, facing: 'left', fidget: true, dialogue: ['Quiz night, c\'est jeudi. Tu viens ?'] },
      { id: 'client-b3', name: 'Client', x: 3, y: 4, facing: 'right', fidget: true, dialogue: ['Hull City a gagné, ce soir !'] },
      { id: 'client-b4', name: 'Cliente', x: 5, y: 4, facing: 'left', fidget: true, dialogue: ['Cheers!'] },
      // L'habitué, près de la cible : la partie de fléchettes (voir hullStory.js DARTS).
      { id: 'habitue', name: 'Habitué', x: 5, y: 2, facing: 'down', ...PUB_B_TIME, script: DARTS },
      { id: 'habitue-apres', name: 'Habitué', x: 5, y: 2, facing: 'down', ifFlags: [FLAGS.flechettesJouees], script: HABITUE_AFTER },
      // La bande, à la table du fond à droite : Léo, entré le premier, attend ; les autres suivaient Pierre et
      // s'attablent en arrivant (mêmes id que leurs suiveurs, voir hullStory.js PUB_B_ENTER).
      { id: 'leo-pub', name: 'Léo', x: 6, y: 4, facing: 'right', still: true, ...PUB_B_TIME, dialogue: ['Une partie de fléchettes, et on file à l\'Asylum !'] },
      ...[['ousmane-pub', 'Ousmane', 'left', 'Vas-y, montre-lui !'],
        ['charlotte-pub', 'Charlotte', 'right', 'Vise le milieu. Ou pas, c\'est plus drôle.'],
        ['anais-pub', 'Anaïs', 'left', 'Il joue tous les soirs, celui-là.']].map(([id, name, facing, line]) => ({
        id, name, x: PUB_B_SEATS[id][0], y: PUB_B_SEATS[id][1], facing, still: true,
        ifFlags: [FLAGS.tourneeServie, FLAGS.bandePubB], unlessFlags: [FLAGS.flechettesJouees], dialogue: [line],
      })),
    ],
    events: [
      { on: 'enter', ...PUB_B_TIME, unlessFlags: [FLAGS.flechettesJouees, FLAGS.bandePubB], steps: PUB_B_ENTER },
      { on: 'enter', ifFlags: [FLAGS.tourneeServie, FLAGS.bandePubB], unlessFlags: [FLAGS.flechettesJouees], steps: [{ approach: 'habitue' }, ...DARTS] },
    ],
    objects: [
      ...[[1, 4], [4, 4], [7, 4], [1, 6], [7, 6]].map(([x, y]) => ({ x, y, dialogue: ['Une table ronde, quelques ronds de bière.'] })),
    ],
  },

  // Hull — The Asylum, la boîte de l'université (24 x 18) : le bar à gauche (barmans, bouteilles, habitués sur les
  // tabourets), la cabine du DJ entre deux enceintes au fond, néons au mur, la grande piste de dalles lumineuses et ses
  // boules à facettes au milieu, le coin salon et les mange-debout à droite, le vestiaire et le videur à l'entrée.
  // Plan Gen 4 : scripts/interieurs/hull.py ; lumière tamisée et halos colorés (night).
  hullAsylum: {
    name: 'The Asylum',
    grid: parseGrid([
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      ...Array(15).fill('oooooooooooooooooooooooo'),
      'oooooooooooEEooooooooooo',
    ]),
    night: {
      lights: [[11, 2, 0xff60c0], [9, 7, 0xff60c0], [13, 7, 0x40d8ff], [10, 10, 0xa060ff], [14, 10, 0xff60c0],
        [2, 0, 0xff60c0], [7, 0, 0x40d8ff], [16, 0, 0xa060ff], [21, 0, 0xff60c0], [3, 2, 0xffc060],
        [20, 5, 0xa060ff], [21, 14, 0xffc060], [3, 12, 0xffc060]],
    },
    spawn: { x: 11, y: 16, facing: 'up' },
    npcs: [
      // La bande : Romain et Prophecy déjà là, Léo entré le premier ; les autres arrivent derrière Pierre (ils le
      // suivaient) et s'installent au bord de la piste (voir hullStory.js ASYLUM_ENTER).
      { id: 'romain-asylum', name: 'Romain', x: 7, y: 9, facing: 'right', ...ASYLUM_TIME, dialogue: ['Sur la piste, tout le monde !'] },
      { id: 'prophecy-asylum', name: 'Prophecy', x: 16, y: 8, facing: 'left', ...ASYLUM_TIME, dialogue: ['Enfin au complet ! Et j\'ai les bonnes chaussures.'] },
      { id: 'leo-pub', name: 'Léo', x: 16, y: 10, facing: 'left', ...ASYLUM_TIME, dialogue: ['Allez, sur la piste !'] },
      ...[['ousmane-pub', 'Ousmane', 'Quelle soirée !'], ['charlotte-pub', 'Charlotte', 'On danse !'],
        ['anais-pub', 'Anaïs', 'J\'adore cette chanson !']].map(([id, name, line]) => ({
        id, name, x: ASYLUM_SPOTS[id][0], y: ASYLUM_SPOTS[id][1], facing: 'up',
        ifFlags: [FLAGS.flechettesJouees, FLAGS.bandeAsylum], dialogue: [line],
      })),
      // Le monde de la boîte.
      { id: 'barman-asylum', name: 'Barman', x: 3, y: 2, facing: 'down', pace: [[1, 2], [6, 2]], dialogue: ['Last orders at two!'] },
      { id: 'dj-asylum', name: 'DJ', x: 11, y: 2, facing: 'down', dancing: true, dialogue: ['Make some noise!'] },
      { id: 'videur-asylum', name: 'Videur', x: 13, y: 16, facing: 'left', still: true, dialogue: ['Pas de bagarre, pas de souci. Bonne soirée.'] },
      { id: 'vestiaire-asylum', name: 'Vestiaire', x: 2, y: 11, facing: 'down', still: true, dialogue: ['Ton manteau ? Numéro 42. Ne le perds pas.'] },
      ...[[2, 4, 'Two pints, cheers!'], [4, 4, 'Ce DJ passe que des tubes.'], [5, 4, 'Je danse pas. Enfin… pas encore.']]
        .map(([x, y, line], i) => ({ id: `client-asylum-${i}`, name: 'Client', x, y, facing: 'up', fidget: true, dialogue: [line] })),
      ...[[9, 7, 'Woohoo!'], [12, 6, 'Cette chanson !'], [14, 8, 'On ne s\'arrête plus !'], [11, 9, 'Je danse comme ça depuis 22 h.'],
        [15, 6, 'Best night ever!'], [8, 10, 'Tu viens danser ?'], [13, 10, 'Le DJ est en feu ce soir !']]
        .map(([x, y, line], i) => ({ id: `danseur-asylum-${i}`, name: i % 2 ? 'Danseuse' : 'Danseur', x, y, facing: 'down', dancing: true, dialogue: [line] })),
      ...[[20, 5, 'Exams ? Quels exams ?'], [22, 8, 'On se croirait à Londres.'], [20, 11, 'Il fait chaud ici !'],
        [19, 14, 'Le coin calme, enfin.'], [22, 14, 'Tu fais quoi comme études ?']]
        .map(([x, y, line], i) => ({ id: `etudiant-asylum-${i}`, name: i % 2 ? 'Étudiante' : 'Étudiant', x, y, facing: i < 3 ? 'left' : 'down', fidget: true, dialogue: [line] })),
    ],
    events: [{ on: 'enter', ...ASYLUM_TIME, unlessFlags: [FLAGS.asylumFini, FLAGS.bandeAsylum], steps: ASYLUM_ENTER }],
    // La piste de danse (voir hullStory.js DANCE_FLOOR) : y entrer lance la dernière chanson avec la bande.
    triggers: Array.from({ length: DANCE_FLOOR[2] * DANCE_FLOOR[3] }, (_, i) => ({
      x: DANCE_FLOOR[0] + (i % DANCE_FLOOR[2]), y: DANCE_FLOOR[1] + Math.floor(i / DANCE_FLOOR[2]),
      ...ASYLUM_TIME, unlessFlags: [FLAGS.asylumFini], script: ASYLUM_DANCE,
    })),
  },

  // Hull — la bibliothèque Brynmor Jones : les révisions, la veille de l'examen (tour de table, voir hullStory.js).
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
        ['anais-biblio', 'Anaïs', 8, 5, 'left', 'Les résultats, c\'est demain. On va y arriver !'],
        ['prophecy-biblio', 'Prophecy', 9, 4, 'left', 'Ze exam. Ze exam. Ça passe, non ?']].map(([id, name, x, y, facing, line]) => ({
        id, name, x, y, facing, still: true, ifFlags: [FLAGS.lendemainHull], unlessFlags: [FLAGS.jourResultats], dialogue: [line],
      })),
    ],
    events: [{ on: 'enter', ifFlags: [FLAGS.lendemainHull], unlessFlags: [FLAGS.revisions], steps: LIBRARY }],
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
      'mmoooomm',
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
      'mmoooooo',
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

// Intérieurs redessinés en Gen 4 (scripts/build_interiors.py) : le dessin remplace le rendu Rouge Feu (meubles de
// `decor` compris) ; la grille d'origine (sourceGrid) reste la référence logique, accordée aux collisions du dessin.
for (const [id, built] of Object.entries(BUILT_INTERIORS)) {
  const room = interiors[id];
  if (!room) continue;
  // Un dessin d'une autre taille que la grille (pièce refaite, grille pas encore recalée) : on garde l'ancien rendu.
  if (room.grid.length !== built.height || room.grid[0].length !== built.width) {
    console.warn(`Intérieur ${id} : dessin ${built.width} x ${built.height}, grille ${room.grid[0].length} x ${room.grid.length}`);
    continue;
  }
  room.built = built;
  room.frlg = false;
  delete room.backdrop;                   // l'image d'un seul tenant (cabane) et ses tables redessinées
  delete room.overlays;
  room.sourceGrid = room.grid;
  room.grid = interiorGrid(room.grid, built);
  applyNpcEdits(room, built);                // PNJ placés dans le créateur (npcEdits.js)
}
