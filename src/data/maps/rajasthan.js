import { parseGrid } from './parseGrid.js';
import { FLAGS, ITEMS } from '../story.js';

const HARSH = { name: 'Harsh', color: 0x8c3cb0 };
const CLOSED = ["[Texte provisoire] C'est une hutte en terre. Personne ne répond."];

// Rajasthan — désert : sable, dunes, oasis, chameaux, serpents, cactus, huttes et une tente.
// Légende : voir src/data/tiles.js (^ = dune, H = chameau, z = serpent, * = cactus, & = feu de camp)
export const rajasthanMap = {
  id: 'rajasthan',
  name: 'Rajasthan',
  grid: parseGrid([
    '^^^^^^^^^^^^^^^^^^^^^^^^^^^^', // 0  dunes : bord du désert
    '^sssssssssssssssssssssss^^s^', // 1
    '^sssssssssssssssssssssssss^^', // 2
    '^sssRRRsssss*ssssssRRRRssss^', // 3  hutte, tente de la potion
    '^sssWWWssHsssssssssWWWWssss^', // 4
    '^sssWDWsssHssssssssWDWWsszs^', // 5  portes
    '^ssssssssssssssssssssssssss^', // 6
    '^s*ssssssssssssYYssssssssss^', // 7
    '^ssssssssssY~~~~sssssssssss^', // 8  oasis
    '^ssHsss*ssss~~~~YsssssssHss^', // 9
    '^ssssssssssY~~~~sssssssssss^', // 10
    '^sssssssssssYsssssssssssss^^', // 11
    '^sssssssszsssssss&ssssssss^^', // 12 feu de camp du vieux sage
    '^sssRRRssssssssssssssRRRsss^', // 13 huttes
    '^sssWWWssssssssssssssWWWsss^', // 14
    '^sssWDWsssssssszsssssWDWsss^', // 15 portes
    '^^ssssssHsss^^sssssssssss*s^', // 16
    '^^^sssssssssss*ssszssssssss^', // 17
    '^ssssssssssssssssssssssssss^', // 18
    '^^^^^^^^^^^^^^^^^^^^^^^^^^^^', // 19
  ]),
  doors: [
    { x: 5,  y: 5,  lockedDialogue: CLOSED },
    { x: 20, y: 5,  interior: 'tente' },        // la potion magique est ici
    { x: 5,  y: 15, lockedDialogue: CLOSED },
    { x: 22, y: 15, lockedDialogue: CLOSED },
  ],
  buildings: [
    { type: 'hut',  x: 4,  y: 3 },
    { type: 'tent', x: 19, y: 3 },
    { type: 'hut',  x: 4,  y: 13 },
    { type: 'hut',  x: 21, y: 13 },
  ],
  npcs: [
    // Harsh t'accompagne : il explique la mission, puis te ramène à New Delhi.
    {
      id: 'harsh-desert', ...HARSH, x: 3, y: 10, facing: 'left',
      unlessFlags: [FLAGS.potionDonnee],
      dialogue: [
        '[Harsh - texte provisoire] Bienvenue dans le désert du Rajasthan !',
        'Notre mission : récupérer la potion magique dans la tente rayée,',
        "puis l'apporter au vieux sage, près du feu de camp.",
      ],
    },
    {
      id: 'harsh-desert-fin', ...HARSH, x: 3, y: 10, facing: 'left',
      ifFlags: [FLAGS.potionDonnee],
      dialogue: ['[Harsh - texte provisoire] Mission accomplie, bravo !'],
      ask: {
        question: 'On rentre à New Delhi ?',
        choices: [
          {
            label: 'Oui',
            dialogue: ['[Harsh - texte provisoire] En route !'],
            warp: { map: 'newDelhi', x: 7, y: 12, facing: 'up' },
          },
          { label: 'Pas encore', dialogue: ['[Harsh - texte provisoire] Prends ton temps, je t\'attends ici.'] },
        ],
      },
    },
    // Le vieux sage, près du feu : il attend la potion magique.
    {
      id: 'vieux-sage', name: 'Vieux sage', x: 18, y: 12, facing: 'left', color: 0xe8e0d0,
      dialogue: ['[Vieux sage - texte provisoire] Jeune voyageur... Apporte-moi la potion magique de la tente.'],
      after: ['[Vieux sage - texte provisoire] Que la chance t\'accompagne dans ton voyage.'],
      receive: {
        item: ITEMS.potionMagique,
        dialogue: ['[Vieux sage - texte provisoire] La potion magique ! Merci, jeune voyageur.'],
        setFlag: FLAGS.potionDonnee,
      },
    },
  ],
  surroundings: { outside: () => 's', border: '^' },
  spawn: { x: 2, y: 10, facing: 'right' },
};
