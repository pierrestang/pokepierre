import { FLAGS, ITEMS } from './story.js';

// Le sac (systems/ItemBag.js) en deux onglets : « Objets » (ce qui sert dans une quête ou pour avancer) et « Souvenirs »
// (ce qui ne sert plus, ou n'a jamais servi). Un souvenir qui a d'abord servi (un diplôme qui ouvre la route, le
// coquillage du secret de Manon) reste dans « Objets » jusqu'à ce que sa quête soit finie (`after` : le drapeau
// d'histoire qui la termine), puis passe tout seul dans « Souvenirs ». Chaque objet et chaque souvenir a sa phrase (ABOUT).

// Les objets, dans l'ordre du jeu, chacun avec sa phrase (affichée sous la grille du sac, comme dans Pokémon).
export const OBJECTS = [
  { item: ITEMS.canneAPeche, text: 'Une canne de la caisse « À DONNER » de Papa, pour le capitaine du ferry.' },
  { item: ITEMS.planches, text: 'Des planches tirées de l\'enclos à poules, pour la cabane des cousins.' },
  { item: ITEMS.corde, text: 'Une vieille corde trouvée dans les hautes herbes, pour la cabane des cousins.' },
  { item: ITEMS.pieceTracteur, text: 'La pièce qui manque au tracteur de M. Bouly, trouvée sous le foin de la grange.' },
  { item: ITEMS.clesAppartement, text: 'Les clés de ton appartement de Bordeaux, remises par l\'agence.' },
  { item: ITEMS.enceinte, text: 'L\'enceinte de Paul, pour la soirée d\'intégration.' },
  { item: ITEMS.gobelets, text: 'Les gobelets de Rémi, pour la soirée d\'intégration.' },
  { item: ITEMS.cleAntivol, text: 'La clé d\'antivol perdue par le cycliste du quai, au bord de la Garonne.' },
  { item: ITEMS.velo, text: 'Le vieux vélo du cycliste, réparé de tes mains : appuie sur V pour monter dessus.' },
  { item: ITEMS.consignesVietnamien, text: 'Les consignes de ton premier jour à l\'agence, écrites en vietnamien.' },
  { item: ITEMS.marchandise, text: 'Le bouquet que Romain t\'a demandé de rapporter du marchand de fleurs.' },
  { item: ITEMS.billetNewDelhi, text: 'Ton billet pour le prochain échange, remis par Romain au bord du canal.' },
  { item: ITEMS.clesParis, text: 'Les clés de ton studio parisien, remises par le propriétaire.' },
  { item: ITEMS.placeConcert, text: 'La place pour Bercy, passée d\'Antoine à Tam, puis à Louis.' },
  { item: ITEMS.platsMatch, text: 'Le repas que Thomas a rapporté du restaurant pour le match.' },
  { item: ITEMS.talismanIndien, text: 'Une petite pierre où l\'on a gravé un chemin qui tourne sur lui-même, remise par le vieux sage.' },
].map(({ item, ...rest }) => ({ id: item.id, ...rest }));

// Les souvenirs, dans l'ordre du jeu : { id, text, after? }.
export const SOUVENIRS = [
  { item: ITEMS.coquillageNacre, after: FLAGS.secretManon, text: 'Le coquillage du secret de Manon, qui a gardé le même.' },
  { item: ITEMS.galetLac, text: 'Le galet porte-bonheur du vieux pêcheur, trouvé au fond du lac quand il avait ton âge.' },
  { item: ITEMS.reglementQG, text: 'Le règlement de la cabane des cousins, dont l\'article 5 dit seulement « Non. »' },
  { item: ITEMS.brevet, after: FLAGS.arriveePrytanee, text: 'Ton brevet, obtenu à l\'oral : français, maths et anglais.' },
  { item: ITEMS.autocollant, text: 'L\'autocollant Pokémon de Rémy, le même que dans votre casier 12.' },
  { item: ITEMS.insigne, text: 'L\'insigne que le nouveau du Prytanée t\'a donné, parce qu\'il en avait deux.' },
  { item: ITEMS.baccalaureat, after: FLAGS.arriveeBordeaux, text: 'Ton baccalauréat, lu sur la liste de la place d\'armes.' },
  { item: ITEMS.photoSoiree, text: 'La photo de la soirée d\'intégration, retrouvée sous les confettis par Ousmane.' },
  { item: ITEMS.diplomeAnglais, after: FLAGS.arriveeHull, text: 'Ton diplôme d\'anglais, obtenu à l\'oral de KEDGE.' },
  { item: ITEMS.diplomeHull, after: FLAGS.arriveeHanoi, text: 'Ton diplôme de Hull, lu sur le panneau des résultats devant l\'université.' },
  { item: ITEMS.objetChance, text: 'L\'amulette porte-bonheur laissée pour toi sur l\'autel du temple de Hanoï.' },
  { item: ITEMS.pieceEchecs, text: 'Le cheval qu\'un papi du lac de Hanoï t\'a glissé dans la main après la partie.' },
  { item: ITEMS.diplomeBordeaux, after: FLAGS.arriveeParis, text: 'Ton diplôme de Bordeaux, remis au stade devant toute la bande.' },
].map(({ item, ...rest }) => ({ id: item.id, ...rest }));

// La phrase de chaque objet ou souvenir, par id.
export const ABOUT = Object.fromEntries([...OBJECTS, ...SOUVENIRS].map((o) => [o.id, o.text]));
