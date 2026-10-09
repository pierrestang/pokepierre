import { FLAGS } from './story.js';
import { OPENING_CINEMATIC } from './fortDeFranceStory.js';

// Le rêve, la fin du jeu : en sortant de la tour de Paris (voir parisStory.js INTO_THE_DREAM), Pierre se retrouve au
// centre d'une grande plate-forme qui flotte dans le bleu (maps/reve.js). Tous les personnages nommés du jeu sont là,
// autour de lui ; huit prennent la parole, un par ville : chacun s'avance, dit son mot, puis se range près de lui. Pierre
// parle ; le décor s'efface dans un fondu au noir lent, le carnet des huit vertus s'affiche une à une ; puis le réveil à
// Fort-de-France, la cinématique d'ouverture rejouée, et le pendentif (interiors.js ffHouseUp, WAKE_UP, PENDANT).

// Pierre, au centre de la plate-forme.
export const CENTER = [14, 10];

// Les huit qui parlent, dans l'ordre, et la place où chacun se range ensuite (près de Pierre).
export const SPEAKERS = [
  ['felix', 'Felix', [12, 8], ['Depuis Saint-Ay qu\'on te suit ! On savait que tu finirais par tous nous réunir.']],
  ['margaux', 'Margaux', [14, 8], ['Tu te cachais toujours au même endroit… Mais là, tu es allé tellement loin qu\'on a failli ne jamais te trouver !']],
  ['remy', 'Rémy', [16, 8], ['Tu te rappelles le collège ? On n\'imaginait pas tout ça, à l\'époque.']],
  ['ousmane', 'Ousmane', [16, 10], ['Bordeaux, les études, nos débuts… On en a fait du chemin depuis, hein ?']],
  ['leo', 'Léo', [16, 12], ['De Hull à aujourd\'hui, mec… On en a vécu, hein ?']],
  ['romain', 'Romain', [14, 12], ['Amsterdam, les canaux, nos galères de coloc… Franchement, je recommencerais demain.']],
  ['harsh', 'Harsh', [12, 12], ['Tu es venu de si loin, et tu es reparti avec un peu de nous. Reviens quand tu veux, mon ami.']],
  ['fanny', 'Fanny', [12, 10], ['Tu es parti partout, mais tu es toujours revenu nous voir. C\'est ça que je retiens.']],
];

// Tous les présents (les huit compris), dans l'ordre où ils se tiennent autour de la plate-forme.
export const PRESENT = [
  ['maman', 'Maman'], ['papa', 'Papa'], ['manon', 'Manon'], ['fanny', 'Fanny'], ['jean', 'Jean'],
  ['felix', 'Felix'], ['joshua', 'Joshua'], ['yanis', 'Yanis'], ['val', 'Val'],
  ['margaux', 'Margaux'], ['benoit', 'Benoît'], ['etienne', 'Étienne'],
  ['remy', 'Rémy'], ['tanguy', 'Tanguy'], ['geoffrey', 'Geoffrey'],
  ['ousmane', 'Ousmane'], ['paul', 'Paul'], ['remi', 'Rémi'], ['leo', 'Léo'], ['anais', 'Anaïs'],
  ['charlotte', 'Charlotte'], ['romain', 'Romain'], ['prophecy', 'Prophecy'], ['harsh', 'Harsh'],
  ['dalil', 'Dalil'], ['hugues', 'Hugues'], ['thomas', 'Thomas'],
];

// Côté vers lequel regarder pour voir Pierre, depuis la case [x, y].
const towardCenter = ([x, y]) => {
  const dx = CENTER[0] - x;
  const dy = CENTER[1] - y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
};
export { towardCenter };

// La réunion : le décor se forme (le voile clair se dissipe), les huit parlent, Pierre parle ; le fondu et les vertus ;
// le réveil.
export const REUNION = [
  { veil: 3500 },
  { wait: 900 },
  ...SPEAKERS.flatMap(([id, name, slot, say]) => [
    { approach: id },
    { speaker: name, say },
    { walk: id, to: slot, block: true },
    { face: { [id]: towardCenter(slot), player: 'down' } },
    { wait: 300 },
  ]),
  { wait: 800 },
  { speaker: 'Pierre', say: ['J\'ai l\'impression d\'avoir déjà tout vécu. Et pourtant, tout commence.'] },
  { wait: 1200 },
  { virtuesFade: true },
  { setFlag: FLAGS.finDuJeu },
  { travel: { interior: 'ffHouseUp', fromMap: 'fortDeFrance', x: 2, y: 5, facing: 'left' } },
];

// Le réveil, à Fort-de-France : la chambre de l'ouverture du jeu. Pierre est couché (un PNJ « Pierre » dans le lit, le
// joueur caché) ; on rejoue telle quelle la cinématique d'ouverture (l'image de l'île, les vagues, Maman qui appelle :
// le ferry). Pierre se lève ; le joueur reprend la main et va vers l'escalier. Juste avant, il passe devant la table de
// chevet : le pendentif (PENDANT). Rien ne tranche entre le rêve et la réalité.
export const WAKE_UP = [
  { hidePlayer: true },
  ...OPENING_CINEMATIC,
  { wait: 500 },
  { setFlag: FLAGS.reveilFin },
  { hidePlayer: false },
];

// Devant le pendentif, sur la table de chevet (le même que le talisman de New Delhi) : « ! », la phrase, le noir, la fin.
export const PENDANT = [
  { face: { player: 'down' } },
  { emote: 'player', kind: 'surprise' },
  { speaker: 'Pierre', say: ['Je ne suis jamais parti de Fort-de-France. Alors ça, d\'où ça vient ?'] },
  { setFlag: FLAGS.talismanPris },
  { wait: 900 },
  { black: true },
  { wait: 2500 },
  { endGame: true },
];
