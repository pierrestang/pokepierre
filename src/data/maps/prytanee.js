import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

const CAPTAIN = { name: 'Capitaine', color: 0x3c5c2c };

// Prytanée (lycée militaire) — façon Rouge Feu, 30 x 24 cases, dans une enceinte de barrière blanche :
// au nord, le dortoir (grand immeuble, bâtiment 1) et le bâtiment des cours (à colonnes, bâtiment 2) ; au
// centre, la place d'armes dallée avec le mât du drapeau et des sacs de sable ; au sud, le poste de
// commandement, une tranchée de sacs de sable et des caisses. Portail sud vers Montépilloy, nord vers Bordeaux.
// Légende : voir src/data/tiles.js (ɐ = dalles, J = mât, Q = sacs de sable, V = caisse, F = barrière,
// T = arbre, ƚ = petit arbre, ƀ = buisson, f = fleurs, S = panneau, R / W / D = toit, mur, porte)
export const prytaneeMap = {
  id: 'prytanee',
  name: 'Prytanée',
  grid: parseGrid([
    'TTTTTTTTTTTTTTTTTTTTTTTTɐɐTTTT', // 0
    'TTTTTTTTTTTTTTTTTTTTTTTTɐɐTTTT', // 1
    'TTFFFFFFFFFFFFFFFFFFFFFFɐɐFFTT', // 2
    'TTFRRRRRRR.RRRRRRRRRRRƀƀɐɐ.FTT', // 3
    'TTFRRRRRRR.RRRRRRRRRRR..ɐɐ.FTT', // 4
    'TTFRRRRRRR.RRRRRRRRRRR..ɐɐ.FTT', // 5
    'TTFWWWWWWW.WWWWWWWWWWW..ɐɐ.FTT', // 6
    'TTFWWWWWWW.WWWWWWWWWWW..ɐɐ.FTT', // 7
    'TTFWWWWWWW.WWWWWWWWWWW..ɐɐ.FTT', // 8
    'TTFWWWWWWW.ffffWWWffff..ɐɐ.FTT', // 9
    'TTFWWWDWWWSffffWDWffffS.ɐɐ.FTT', // 10
    'TTF.QQɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐQQ.FTT', // 11
    'TTF.QɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐQ.FTT', // 12
    'TTF.ɐɐɐɐɐɐɐɐɐɐɐJɐɐɐɐɐɐɐɐɐɐ.FTT', // 13
    'TTF.ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ.FTT', // 14
    'TTF.ɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐɐ.FTT', // 15
    'TTFƀ..........ɐɐ...RRRRRRR.FTT', // 16
    'TTF..QQ.QQ.VV.ɐɐ...RRRRRRR.FTT', // 17
    'TTF..Q...Q.V..ɐɐ...WWWWWWW.FTT', // 18
    'TTF..QQQQQ....ɐɐ...WWWDWWW.FTT', // 19
    'TTFƀ......V..ƀɐɐ.V........ƀFTT', // 20
    'TTFFFFFFFFFFFFɐɐFFFFFFFFFFFFTT', // 21
    'TTTTTTTTTTTTTTɐɐTTTTTTTTTTTTTT', // 22
    'TTTTTTTTTTTTTTɐɐTTTTTTTTTTTTTT', // 23
  ]),
  doors: [
    // Bâtiment 1 : ton dortoir, ouvert une fois que le capitaine t'y a envoyé.
    {
      x: 6, y: 10, interior: 'dortoir',
      lock: { ifFlags: [FLAGS.capitaineAccueil] },
      lockedDialogue: ["[Texte provisoire] Va d'abord voir le capitaine, au milieu de la cour."],
    },
    // Bâtiment 2 : la salle de cours, ouverte quand le capitaine t'envoie en cours.
    {
      x: 16, y: 10, interior: 'salleCours',
      lock: { ifFlags: [FLAGS.capitaineCours] },
      lockedDialogue: ["[Texte provisoire] Ce n'est pas encore l'heure des cours."],
    },
    { x: 22, y: 19, lockedDialogue: ['Poste de commandement. Accès réservé.'] },
  ],
  npcs: [
    // Le capitaine t'attend au milieu de la cour, sous le drapeau.
    {
      id: 'capitaine', ...CAPTAIN, x: 15, y: 14, facing: 'down',
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
      id: 'capitaine-dortoir', ...CAPTAIN, x: 8, y: 11, facing: 'left',
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
    { type: 'mansion', x: 3, y: 3 },
    { type: 'museum', x: 11, y: 3 },
    { type: 'lab', x: 19, y: 16 },
  ],
  objects: [
    { x: 10, y: 10, dialogue: ['Bâtiment 1 : dortoir.'] },
    { x: 22, y: 10, dialogue: ['Bâtiment 2 : salles de cours.'] },
    { x: 15, y: 13, dialogue: ['Le drapeau tricolore flotte en haut du mât.'] },
  ],
  // Portail sud : retour vers Montépilloy ; portail nord : Bordeaux.
  triggers: [
    ...[14, 15].map((x) => ({
      x,
      y: 23,
      ifFlags: [FLAGS.arriveePrytanee],           // on n'y vient qu'en ayant quitté Montépilloy (car scolaire parti)
      readyDialogue: ['Tu prends la route de Montépilloy.'],
      warp: { map: 'montepilloy', x: 14, y: 1, facing: 'down' },
    })),
    // Portail nord : Bordeaux, une fois le baccalauréat obtenu.
    ...[24, 25].map((x) => ({
      x,
      y: 0,
      ifItems: [ITEMS.baccalaureat.id],
      dialogue: ['[Texte provisoire] Tu ne peux pas quitter le Prytanée sans ton baccalauréat.'],
      readyDialogue: ['Ton baccalauréat en poche, direction Bordeaux !'],
      setFlags: [FLAGS.arriveeBordeaux],
      warp: { map: 'bordeaux', x: 1, y: 6, facing: 'right' },
    })),
  ],
  spawn: { x: 14, y: 21, facing: 'up' },
};
