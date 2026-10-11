import { FLAGS, ITEMS } from './story.js';

// Le sac (systems/ItemBag.js) en deux onglets : « Objets » (ce qui sert dans une quête ou pour avancer) et « Souvenirs »
// (ce qui ne sert plus, ou n'a jamais servi). Un souvenir qui a d'abord servi (un diplôme qui ouvre la route, le
// coquillage du secret de Manon) reste dans « Objets » jusqu'à ce que sa quête soit finie (`after` : le drapeau
// d'histoire qui la termine), puis passe tout seul dans « Souvenirs ». Chaque souvenir a un court texte.

// Les objets, dans l'ordre du jeu.
export const OBJECTS = [
  ITEMS.canneAPeche, ITEMS.planches, ITEMS.corde, ITEMS.pieceTracteur, ITEMS.clesAppartement, ITEMS.enceinte,
  ITEMS.gobelets, ITEMS.cleAntivol, ITEMS.velo, ITEMS.consignesVietnamien, ITEMS.marchandise, ITEMS.billetNewDelhi,
  ITEMS.clesParis, ITEMS.placeConcert, ITEMS.platsMatch, ITEMS.talismanIndien,
].map((item) => item.id);

// Les souvenirs, dans l'ordre du jeu : { id, text, after? }.
export const SOUVENIRS = [
  { item: ITEMS.coquillageNacre, after: FLAGS.secretManon, text: 'Le secret de Manon, sur l\'île. Elle a le même : un pour toi, un pour elle.' },
  { item: ITEMS.galetLac, text: 'Trouvé au fond du lac de Saint-Ay par le vieux pêcheur, quand il avait ton âge. Il porte bonheur.' },
  { item: ITEMS.reglementQG, text: 'Le règlement de la cabane des cousins. Article 5 : « Non. » (écrit par les autres).' },
  { item: ITEMS.brevet, after: FLAGS.arriveePrytanee, text: 'Français, maths, anglais : l\'oral du collège, réussi. La route du Prytanée.' },
  { item: ITEMS.autocollant, text: 'Le même que dans le casier 12, votre QG, à Rémy et toi.' },
  { item: ITEMS.insigne, text: 'Donné par le nouveau du Prytanée, qui avait le mal du pays : « J\'en ai deux. »' },
  { item: ITEMS.baccalaureat, after: FLAGS.arriveeBordeaux, text: 'Ton nom sur la liste de la place d\'armes. Direction Bordeaux.' },
  { item: ITEMS.photoSoiree, text: 'La soirée d\'intégration, retrouvée sous les confettis par Ousmane.' },
  { item: ITEMS.diplomeAnglais, after: FLAGS.arriveeHull, text: 'L\'oral de KEDGE : « I am late. », « Deal! », « I can\'t wait! ».' },
  { item: ITEMS.diplomeHull, after: FLAGS.arriveeHanoi, text: 'Le panneau des résultats, devant l\'université : « Diplôme de Hull, bro ! »' },
  { item: ITEMS.objetChance, text: 'Sur l\'autel du temple de Hanoï, entre deux bâtons d\'encens. Un gardien te l\'a laissée.' },
  { item: ITEMS.pieceEchecs, text: 'Le cheval, glissé dans ta main par un papi du lac de Hanoï, après une partie perdue en riant.' },
  { item: ITEMS.diplomeBordeaux, after: FLAGS.arriveeParis, text: 'Remis au stade de Bordeaux, devant toute la bande et les parents.' },
].map(({ item, ...rest }) => ({ id: item.id, ...rest }));
