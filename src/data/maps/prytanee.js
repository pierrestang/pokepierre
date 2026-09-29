import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

const CAPTAIN = { name: 'Capitaine', color: 0x3c5c2c };

// Prytanée — caserne militaire après Montépilloy, 24 x 20 cases (comme Saint-Ay).
// Légende : voir src/data/tiles.js (Z = mur d'enceinte, A = asphalte, J = mât, Q = sacs de sable, V = caisse)
export const prytaneeMap = {
  id: 'prytanee',
  name: 'Prytanée',
  grid: parseGrid([
    'ZZZZZZZZZZZAAZZZZZZZZZZZ', // 0  mur d'enceinte, portail nord vers Bordeaux
    'Z..........AA..........Z', // 1
    'Z.RRRRRRR..AA..RRRRRRR.Z', // 2  toits des dortoirs
    'Z.RRRRRRR..AA..RRRRRRR.Z', // 3
    'Z.WWWWWWW..AA..WWWWWWW.Z', // 4
    'Z.WWWDWWW..AA..WWWDWWW.Z', // 5  portes des dortoirs
    'Z....A.....AA.....A....Z', // 6
    'Z...AAAAAAAAAAAAAAAA...Z', // 7  place d'armes
    'Z.Q.AAAAAAAAAAAAAAAA.Q.Z', // 8
    'Z.Q.AAAAAAAAAAAAAAAA.Q.Z', // 9
    'Z...AAAAAAAJAAAAAAAA...Z', // 10 mât du drapeau
    'Z...AAAAAAAAAAAAAAAA...Z', // 11
    'Z.V.AAAAAAAAAAAAAAAA.V.Z', // 12
    'Z.VVAAAAAAAAAAAAAAAAVV.Z', // 13 caisses
    'Z..RRRRR...AA..........Z', // 14 poste de commandement
    'Z..RRRRR...AA...QQQ....Z', // 15 abri en sacs de sable
    'Z..WWWWW...AA...Q.Q....Z', // 16
    'Z..WDWWW...AA..........Z', // 17 porte du poste de commandement
    'Z...AAAAAAAAA..........Z', // 18
    'ZZZZZZZZZZZAAZZZZZZZZZZZ', // 19 portail sud vers Montépilloy
  ]),
  doors: [
    // Bâtiment 1 : ton dortoir, ouvert une fois que le capitaine t'y a envoyé.
    {
      x: 5, y: 5, interior: 'dortoir',
      lock: { ifFlags: [FLAGS.capitaineAccueil] },
      lockedDialogue: ["[Texte provisoire] Va d'abord voir le capitaine, au milieu de la cour."],
    },
    // Bâtiment 2 : la salle de cours, ouverte quand le capitaine t'envoie en cours.
    {
      x: 18, y: 5, interior: 'salleCours',
      lock: { ifFlags: [FLAGS.capitaineCours] },
      lockedDialogue: ["[Texte provisoire] Ce n'est pas encore l'heure des cours."],
    },
    { x: 4, y: 17, lockedDialogue: ['[Texte provisoire] Accès réservé au commandement.'] },
  ],
  npcs: [
    // Le capitaine t'attend au milieu de la cour, sous le drapeau.
    {
      id: 'capitaine', ...CAPTAIN, x: 11, y: 11, facing: 'down',
      unlessFlags: [FLAGS.dortoirVisite],
      dialogue: [
        '[Capitaine - texte provisoire] Bienvenue au Prytanée ! Je suis le capitaine de la base.',
        'Va déposer tes affaires dans ton dortoir : le bâtiment 1, en haut à gauche.',
      ],
      after: ['[Capitaine - texte provisoire] Ton dortoir, c\'est le bâtiment 1. Exécution !'],
      setFlag: FLAGS.capitaineAccueil,
    },
    // À ta sortie du dortoir, il t'attend devant la porte et t'envoie en cours.
    {
      id: 'capitaine-dortoir', ...CAPTAIN, x: 6, y: 6, facing: 'left',
      ifFlags: [FLAGS.dortoirVisite],
      dialogue: [
        '[Capitaine - texte provisoire] Affaires rangées ? Parfait.',
        'Maintenant, en cours ! Rends-toi au bâtiment 2.',
      ],
      after: ['[Capitaine - texte provisoire] Le bâtiment 2, en haut à droite. Pas de retard !'],
      setFlag: FLAGS.capitaineCours,
    },
  ],
  events: [
    {
      on: 'enter',
      ifFlags: [FLAGS.dortoirVisite],
      unlessFlags: [FLAGS.capitaineCours],
      steps: [{ talk: 'capitaine-dortoir' }],
    },
  ],
  buildings: [
    { type: 'barracks',     x: 2,  y: 2 },
    { type: 'barracks',     x: 15, y: 2 },
    { type: 'headquarters', x: 3,  y: 14 },
  ],
  // Portail sud : retour vers Montépilloy ; portail nord : Bordeaux.
  triggers: [
    ...[11, 12].map((x) => ({
      x,
      y: 19,
      readyDialogue: ['Tu prends la route de Montépilloy.'],
      warp: { map: 'montepilloy', x: 11, y: 1, facing: 'down' },
    })),
    // Portail nord : Bordeaux, une fois le baccalauréat obtenu.
    ...[11, 12].map((x) => ({
      x,
      y: 0,
      ifItems: [ITEMS.baccalaureat.id],
      dialogue: ['[Texte provisoire] Tu ne peux pas quitter le Prytanée sans ton baccalauréat.'],
      readyDialogue: ['Ton baccalauréat en poche, direction Bordeaux !'],
      setFlags: [FLAGS.arriveeBordeaux],
      warp: { map: 'bordeaux', x: 1, y: 6, facing: 'right' },
    })),
  ],
  spawn: { x: 11, y: 18, facing: 'up' },
};
