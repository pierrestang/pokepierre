// Ville visitée (pour la carte du voyage, voir systems/RegionMap.js) : drapeau levé en y entrant.
export const visitedFlag = (mapId) => `visite-${mapId}`;

// Drapeaux d'histoire utilisés dans les données (évite les fautes de frappe).
export const FLAGS = {
  reveilFortDeFrance: 'reveil-fort-de-france', // Fort-de-France : réveil dans la chambre joué
  journeeLancee: 'journee-lancee',              // Maman a lancé la journée au salon
  papaFait: 'papa-fait',                        // tri des cannes avec Papa terminé (le pêcheur se déplace)
  manonDemande: 'manon-demande',                // Manon t'a lancé à la recherche du coquillage
  canneMontree: 'canne-montree',                // le pêcheur t'a montré sa canne cassée
  canneOfferte: 'canne-offerte',                // canne de la caisse « À DONNER » offerte au pêcheur
  departFortDeFrance: 'depart-fort-de-france', // parti en ferry
  coquillageTrouve: 'coquillage-trouve',        // Fort-de-France : coquillage caché dans les hautes herbes
  saArrivee: 'sa-arrivee',                      // Saint-Ay : Papa et Manon t'ont retrouvé au bord du lac
  familleSuit: 'famille-suit',                  // Papa et Manon suivent le joueur
  familleArrivee: 'famille-arrivee',            // arrivés à la clinique de Saint-Ay
  felixInvite: 'felix-invite',                  // Felix (ton cousin) t'a invité chez lui
  maisonFelixVisitee: 'maison-felix-visitee',   // entré chez Felix
  planCabane: 'plan-cabane',                    // Saint-Ay : Felix a lancé le chantier de la cabane
  pouleEnfuie1: 'poule-enfuie-1',               // les poules de l'enclos ont fui (tas de planches)
  pouleEnfuie2: 'poule-enfuie-2',
  cabaneFinie: 'cabane-finie',                  // la cabane des cousins est construite
  annonceMutation: 'annonce-mutation',          // Papa a annoncé le départ pour Montépilloy
  adieuCousins: 'adieu-cousins',                // au revoir aux cousins à la cabane
  arriveeMontepilloy: 'arrivee-montepilloy',    // arrivé à Montépilloy (la famille y vit désormais)
  ellipseMontepilloy: 'ellipse-montepilloy',    // Montépilloy : « Quelques années plus tard… » joué
  manonGuide: 'manon-guide',                    //   Manon : « Maman te cherche » ; elle mène Pierre à la maison
  manonMaison: 'manon-maison',                  //   Manon est rentrée à la maison
  mamanAccueil: 'maman-accueil',                //   Maman a accueilli Pierre à la maison
  ecoleCm2: 'ecole-cm2',                        //   dernier jour de CM2 : entré à l'école
  cacheCache: 'cache-cache',                    //   Margaux a lancé la dernière partie de cache-cache
  trouveMargaux: 'trouve-margaux',              //   cache-cache : Margaux trouvée (bottes de foin de la ferme)
  trouveEtienne: 'trouve-etienne',              //   cache-cache : Étienne trouvé (arbre de la prairie)
  trouveBenoit: 'trouve-benoit',                //   cache-cache : Benoît trouvé (tonneau de la grange)
  jeanQuetes: 'jean-quetes',                    //   Jean t'a demandé d'être son assistant (il te suit)
  boulyDemande: 'bouly-demande',                //   M. Bouly t'a parlé de la pièce qui manque à son tracteur
  pieceTrouvee: 'piece-trouvee',                //   pièce de tracteur trouvée dans le tonneau de la grange
  jeanTracteur: 'jean-tracteur',                //   Jean s'installe devant le tracteur pour le réparer
  tracteurRepare: 'tracteur-repare',            //   « Passe-moi la clé ! » réussi : le tracteur est réparé
  septembre: 'septembre',                       //   ellipse jusqu'en septembre : la famille devant la maison
  departCollege: 'depart-college',              //   le car scolaire attend à la sortie nord
  arriveePrytanee: 'arrivee-prytanee',          // arrivé au Prytanée
  capitaineAccueil: 'capitaine-accueil',        // le capitaine t'envoie au dortoir (bâtiment 1)
  dortoirVisite: 'dortoir-visite',              // affaires déposées au dortoir
  capitaineCours: 'capitaine-cours',            // le capitaine t'envoie en cours (bâtiment 2)
  arriveeBordeaux: 'arrivee-bordeaux',          // arrivé à Bordeaux
  appartementVisite: 'appartement-visite',      // affaires posées dans l'appartement (Ousmane rencontré)
  arriveeHull: 'arrivee-hull',                  // arrivé à Hull (Angleterre)
  hullAccueil: 'hull-accueil',                  // Hull : Ousmane t'a accueilli à l'arrêt de bus
  ousmaneRentre: 'ousmane-rentre',              //        Ousmane est rentré à la coloc (devant toi)
  leoAppel: 'leo-appel',                        //        Ousmane : « Léo a appelé, il a un plan »
  leoPlan: 'leo-plan',                          //        chez Léo : la soirée commence (la nuit tombe)
  ousmaneSuit: 'ousmane-suit',                  //        Ousmane rejoint la file
  amiesSuivent: 'amies-suivent',                //        Charlotte et Anaïs rejoignent la file
  pinteCommandee: 'pinte-commandee',            //        premier pub : pinte commandée au bar
  tableTrouvee: 'table-trouvee',                //        deuxième pub : table de la bande retrouvée
  asylumFini: 'asylum-fini',                    //        dernière chanson à l'Asylum : sortie au petit matin
  revisions: 'revisions',                       //        révisions à la bibliothèque (le lendemain)
  arriveeHanoi: 'arrivee-hanoi',                // arrivé à Hanoï (Vietnam)
  travailEtape1: 'travail-etape-1',             // nouveau travail à l'agence de voyage : étape 1
  touristesSuivent: 'touristes-suivent',        // tu guides les deux touristes vers le temple
  visiteTerminee: 'visite-terminee',            // les touristes t'ont remercié
  travailTermine: 'travail-termine',            // la directrice te libère : tu peux partir
  arriveeAmsterdam: 'arrivee-amsterdam',        // arrivé à Amsterdam
  stageCorning: 'stage-corning',                // Laurent t'a lancé dans ton stage chez Corning
  romainDemande: 'romain-demande',              // Romain t'a demandé la marchandise
  marchandiseAchetee: 'marchandise-achetee',    // achetée au coffee shop
  marchandiseDonnee: 'marchandise-donnee',      // donnée à Romain dans la maison commune
  mailLu: 'mail-lu',                            // mail lu : retourner à l'université de Hull
  arriveeNewDelhi: 'arrivee-new-delhi',         // arrivé à New Delhi (Inde)
  echangeCommence: 'echange-commence',          // échange universitaire commencé à Delhi
  harshRencontre: 'harsh-rencontre',            // Harsh t'a proposé d'aller dans le désert
  arriveeRajasthan: 'arrivee-rajasthan',        // parti dans le désert du Rajasthan
  potionDonnee: 'potion-donnee',                // potion magique apportée au vieux sage
  semestreTermine: 'semestre-termine',          // félicitations de la professeure : semestre terminé
  diplomeBordeaux: 'diplome-bordeaux',          // diplôme reçu sur le podium du stade (la route de Paris s'ouvre)
  arriveeParis: 'arrivee-paris',                // arrivé à Paris
  repasParis: 'repas-paris',                    // mangé au restaurant, rencontré le cuisinier
  parisAccueil: 'paris-accueil',                // message d'arrivée à Paris déjà montré
  emmenagementParis: 'emmenagement-paris',      // tu as dit au chef que tu emménages : l'appartement s'ouvre
  rechercheTravail: 'recherche-travail',        // offre trouvée sur l'ordinateur : l'entreprise s'ouvre
  travailParis: 'travail-paris',                // premier jour dans l'entreprise parisienne
  promotion: 'promotion',                       // promotion accordée par le manager (1er étage)
  verreBistro: 'verre-bistro',                  // verre avec Hugues et Thomas au bistrot
  concertBercy: 'concert-bercy',                // concert vu à Bercy
  ruptureConventionnelle: 'rupture-conventionnelle', // acceptée par le directeur : la route de Toulon s'ouvre
  arriveeToulon: 'arrivee-toulon',              // arrivé à Toulon
  toulonAccueil: 'toulon-accueil',              // message d'arrivée à Toulon déjà montré
  chezYanis: 'chez-yanis',                      // arrivé dans l'appartement de Yanis
  caminoEnCours: 'camino-en-cours',             // parti sur le Chemin de Saint-Jacques avec Yanis
  caminoFini: 'camino-fini',                    // arrivé à Saint-Jacques, bus du retour pris
  parentsCorse: 'parents-corse',                // tu as dit bonjour à tes parents en Corse
};

// Quêtes de Toulon terminées (Chemin de Saint-Jacques + Corse) : Bali s'ouvre à l'aéroport.
export const TOULON_QUESTS = {
  ifFlags: [FLAGS.caminoFini, FLAGS.parentsCorse],
  ifSouvenirs: ['souvenir-leo', 'souvenir-theo'],
};

// Qualités reçues de la famille à Fort-de-France (comptées comme des souvenirs).
export const QUALITIES = {
  joie: { id: 'souvenir-maman', name: 'Joie de vivre de Maman' },
  pragmatisme: { id: 'souvenir-papa', name: 'Pragmatisme de Papa' },
  complicite: { id: 'souvenir-manon', name: 'Complicité de Manon' },
};

// Rôles et titres reçus (Saint-Ay, Hull, Montépilloy), comptés comme des souvenirs.
export const ROLES = {
  grandFrere: { id: 'role-grand-frere', name: 'Grand frère' },
  cousins: { id: 'role-cousins', name: 'Cousins pour la vie' },
  bandeHull: { id: 'role-bande-hull', name: 'La bande de Hull' },
  copainsMontepilloy: { id: 'role-copains-montepilloy', name: 'Les copains de Montépilloy' },
  bricoleur: { id: 'role-bricoleur', name: 'Bricoleur' },
};

// Objets remis au joueur (voir systems/items.js).
export const ITEMS = {
  coquillageNacre: { id: 'coquillage-nacre', name: 'Coquillage nacré' },
  canneAPeche: { id: 'canne-a-peche', name: 'Canne à pêche' },
  vieilleCanne: { id: 'vieille-canne', name: 'Vieille canne' },     // pour pêcher face à l'eau (facultatif)
  planches: { id: 'planches', name: 'Planches' },
  corde: { id: 'corde', name: 'Vieille corde' },
  baccalaureat: { id: 'baccalaureat', name: 'Baccalauréat' },
  clesAppartement: { id: 'cles-appartement', name: "Clés de l'appartement" },
  diplomeAnglais: { id: 'diplome-anglais', name: "Diplôme d'anglais" },
  diplomeHull: { id: 'diplome-hull', name: 'Diplôme de Hull' },
  objetChance: { id: 'objet-chance', name: 'Objet de chance' },
  marchandise: { id: 'marchandise', name: 'Marchandise' },
  billetNewDelhi: { id: 'billet-new-delhi', name: "Billet d'avion pour New Delhi" },
  potionMagique: { id: 'potion-magique', name: 'Potion magique' },
  diplomeBordeaux: { id: 'diplome-bordeaux', name: 'Diplôme de Bordeaux' },
  pieceTracteur: { id: 'piece-tracteur', name: 'Pièce de tracteur' },
  objetMagiqueBali: { id: 'objet-magique-bali', name: 'Objet magique de Bali' },
  objetMagiqueSriLanka: { id: 'objet-magique-sri-lanka', name: 'Objet magique du Sri Lanka' },
  objetMagiqueThailande: { id: 'objet-magique-thailande', name: 'Objet magique de Thaïlande' },
  objetMagiqueNepal: { id: 'objet-magique-nepal', name: 'Objet magique du Népal' },
};

// Personnages qui marchent derrière le joueur, dans cet ordre, quand leurs conditions sont remplies.
// `id` identique à celui du PNJ qu'ils remplacent : ils partent de sa position.
export const FOLLOWERS = [
  { id: 'papa',  color: 0x3f6fd8, ifFlags: [FLAGS.familleSuit], unlessFlags: [FLAGS.familleArrivee] },
  { id: 'manon', color: 0xf0a030, ifFlags: [FLAGS.familleSuit], unlessFlags: [FLAGS.familleArrivee] },
  // Felix t'accompagne de la sortie de la clinique jusqu'à chez lui (maison 2).
  { id: 'felix', color: 0x9060d0, ifFlags: [FLAGS.felixInvite], unlessFlags: [FLAGS.maisonFelixVisitee] },
  // Montépilloy : Jean, ton assistant… ou plutôt toi le sien, jusqu'à la réparation du tracteur ; Margaux et
  // Étienne, une fois trouvés au cache-cache, jusqu'à la fin de la partie.
  { id: 'jean', color: 0x3c7c5c, ifFlags: [FLAGS.jeanQuetes], unlessFlags: [FLAGS.jeanTracteur] },
  { id: 'margaux', color: 0xf08080, ifFlags: [FLAGS.trouveMargaux], unlessSouvenirs: ['role-copains-montepilloy'] },
  { id: 'etienne', color: 0x6080a0, ifFlags: [FLAGS.trouveEtienne], unlessSouvenirs: ['role-copains-montepilloy'] },
  { id: 'benoit', color: 0xa07040, ifFlags: [FLAGS.trouveBenoit], unlessSouvenirs: ['role-copains-montepilloy'] },
  // Hanoï : les deux touristes te suivent de l'agence jusqu'au temple, et en ressortent avec toi.
  { id: 'touriste-1', color: 0xe0a0d0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  { id: 'touriste-2', color: 0x80c0e0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  // Hull : la file de la soirée, qui s'allonge (Ousmane, puis Charlotte et Anaïs), jusqu'à la sortie de l'Asylum.
  { id: 'ousmane', color: 0x3c6c9c, ifFlags: [FLAGS.ousmaneSuit], unlessSouvenirs: ['role-bande-hull'] },
  { id: 'charlotte', color: 0xd05050, ifFlags: [FLAGS.amiesSuivent], unlessSouvenirs: ['role-bande-hull'] },
  { id: 'anais', color: 0xe0c050, ifFlags: [FLAGS.amiesSuivent], unlessSouvenirs: ['role-bande-hull'] },
  // Chemin de Saint-Jacques : Yanis marche avec toi jusqu'à Saint-Jacques.
  { id: 'yanis', color: 0xc0b040, ifFlags: [FLAGS.caminoEnCours], unlessFlags: [FLAGS.caminoFini] },
];
