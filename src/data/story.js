// Drapeaux d'histoire utilisés dans les données (évite les fautes de frappe).
export const FLAGS = {
  departFortDeFrance: 'depart-fort-de-france', // parti en bateau
  familleSuit: 'famille-suit',                  // Papa et Manon suivent le joueur
  familleArrivee: 'famille-arrivee',            // arrivés à l'hôpital de Saint-Ay
  felixInvite: 'felix-invite',                  // Felix t'a invité dans la maison 2
  maisonFelixVisitee: 'maison-felix-visitee',   // entré chez Felix
  arriveeMontepilloy: 'arrivee-montepilloy',    // arrivé à Montépilloy (la famille y vit désormais)
  manonEcole: 'manon-ecole',                    // Maman t'envoie à l'école, Manon t'accompagne
  arriveeEcole: 'arrivee-ecole',                // arrivés à l'école
  jeanQuetes: 'jean-quetes',                    // Montépilloy : Jean t'a demandé de l'aide (chat, tracteur)
  chatTrouve: 'chat-trouve',                    // Montépilloy : le chat est tombé de l'arbre
  boulyDemande: 'bouly-demande',                // M. Bouly t'a parlé de son tracteur en panne
  pieceTrouvee: 'piece-trouvee',                // pièce de tracteur trouvée dans le tonneau
  tracteurRepare: 'tracteur-repare',            // pièce rapportée : le tracteur est réparé
  arriveePrytanee: 'arrivee-prytanee',          // arrivé au Prytanée
  capitaineAccueil: 'capitaine-accueil',        // le capitaine t'envoie au dortoir (bâtiment 1)
  dortoirVisite: 'dortoir-visite',              // affaires déposées au dortoir
  capitaineCours: 'capitaine-cours',            // le capitaine t'envoie en cours (bâtiment 2)
  arriveeBordeaux: 'arrivee-bordeaux',          // arrivé à Bordeaux
  appartementVisite: 'appartement-visite',      // affaires posées dans l'appartement (Ousmane rencontré)
  arriveeHull: 'arrivee-hull',                  // arrivé à Hull (Angleterre)
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

// Objets remis au joueur (voir systems/items.js).
export const ITEMS = {
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
  // Felix t'accompagne de la sortie de l'hôpital jusqu'à chez lui (maison 2).
  { id: 'felix', color: 0x9060d0, ifFlags: [FLAGS.felixInvite], unlessFlags: [FLAGS.maisonFelixVisitee] },
  // Montépilloy : Manon t'accompagne de la maison jusqu'à l'école.
  { id: 'manon', color: 0xf0a030, ifFlags: [FLAGS.manonEcole], unlessFlags: [FLAGS.arriveeEcole] },
  // Hanoï : les deux touristes te suivent de l'agence jusqu'au temple, et en ressortent avec toi.
  { id: 'touriste-1', color: 0xe0a0d0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  { id: 'touriste-2', color: 0x80c0e0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  // Chemin de Saint-Jacques : Yanis marche avec toi jusqu'à Saint-Jacques.
  { id: 'yanis', color: 0xc0b040, ifFlags: [FLAGS.caminoEnCours], unlessFlags: [FLAGS.caminoFini] },
];
