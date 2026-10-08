// Ville visitée (pour la carte du voyage, voir systems/RegionMap.js) : drapeau levé en y entrant.
export const visitedFlag = (mapId) => `visite-${mapId}`;

// Drapeaux d'histoire utilisés dans les données (évite les fautes de frappe).
export const FLAGS = {
  reveilFortDeFrance: 'reveil-fort-de-france', // Fort-de-France : réveil dans la chambre joué
  journeeLancee: 'journee-lancee',              // Maman a lancé la journée au salon
  papaFait: 'papa-fait',                        // tri des cannes avec Papa terminé (le pêcheur se déplace)
  manonDemande: 'manon-demande',                // Manon t'a lancé à la recherche du coquillage
  secretManon: 'secret-manon',                  // Manon t'a donné son coquillage jumeau (« notre secret »)
  canneMontree: 'canne-montree',                // le pêcheur t'a montré sa canne cassée
  canneOfferte: 'canne-offerte',                // canne de la caisse « À DONNER » offerte au pêcheur
  departFortDeFrance: 'depart-fort-de-france', // parti en ferry
  coquillageTrouve: 'coquillage-trouve',        // Fort-de-France : coquillage caché dans les hautes herbes
  saArrivee: 'sa-arrivee',                      // Saint-Ay : Papa et Manon t'ont retrouvé au bord du lac
  familleSuit: 'famille-suit',                  // Papa et Manon sont partis devant, à la clinique
  familleArrivee: 'famille-arrivee',            // arrivés à la clinique de Saint-Ay
  fannyMain: 'fanny-main',                      //   Fanny a attrapé le doigt de Pierre, au berceau
  familleRentree: 'famille-rentree',            //   en sortant de la clinique : la famille est rentrée à la maison
  felixInvite: 'felix-invite',                  // Felix (ton cousin) t'a invité chez lui
  maisonFelixVisitee: 'maison-felix-visitee',   // entré chez Felix
  planCabane: 'plan-cabane',                    // Saint-Ay : Felix a lancé le chantier de la cabane
  pouleEnfuie1: 'poule-enfuie-1',               // les poules de l'enclos ont fui (tas de planches)
  pouleEnfuie2: 'poule-enfuie-2',
  cabaneFinie: 'cabane-finie',                  // la cabane des cousins est construite
  ellipseSaintAy: 'ellipse-saint-ay',           //   « Quelques années plus tard… » : Pierre au bord du lac
  manonNouvelle: 'manon-nouvelle',              //   Manon : « Papa a une nouvelle à nous annoncer » ; elle rentre
  annonceMutation: 'annonce-mutation',          // Papa a annoncé le départ pour Montépilloy
  adieuCousins: 'adieu-cousins',                // au revoir aux cousins à la cabane
  felixVoiture: 'felix-voiture',                // au départ, Felix accourt devant la voiture (« Le mot de passe… »)
  arriveeMontepilloy: 'arrivee-montepilloy',    // arrivé à Montépilloy (la famille y vit désormais)
  ellipseMontepilloy: 'ellipse-montepilloy',    // Montépilloy : « Quelques années plus tard… » joué
  mamanAccueil: 'maman-accueil',                //   Maman a accueilli Pierre à la maison
  ecoleCm2: 'ecole-cm2',                        //   dernier jour de CM2 : entré à l'école
  cacheCache: 'cache-cache',                    //   Margaux a lancé la dernière partie de cache-cache
  trouveMargaux: 'trouve-margaux',              //   cache-cache : Margaux trouvée (bottes de foin de la ferme)
  trouveEtienne: 'trouve-etienne',              //   cache-cache : Étienne trouvé (arbre de la prairie)
  trouveBenoit: 'trouve-benoit',                //   cache-cache : Benoît trouvé (tonneau de la grange)
  copainsPartent: 'copains-partent',            //   partie finie : les copains (qui suivaient Pierre) filent à l'école
  benoitConsole: 'benoit-console',              //   facultatif : Benoît, triste devant la grange, a ri (Joie de vivre)
  jeanQuetes: 'jean-quetes',                    //   Jean t'a demandé d'être son assistant (il te suit)
  boulyDemande: 'bouly-demande',                //   M. Bouly t'a parlé de la pièce qui manque à son tracteur
  pieceTrouvee: 'piece-trouvee',                //   pièce de tracteur trouvée dans le tonneau de la grange
  tracteurRepare: 'tracteur-repare',            //   « Passe-moi la clé ! » réussi : le tracteur est réparé
  septembre: 'septembre',                       //   ellipse jusqu'en septembre : la famille devant la maison
  departCollege: 'depart-college',              //   septembre : au revoir de la famille, départ à pied
  collegeOuverture: 'college-ouverture',        // Bonsecours : image d'accueil du premier jour de collège vue
  collegeArrivee: 'college-arrivee',            //   le surveillant t'a accueilli dans le hall (il est monté au couloir)
  margauxTrouvee: 'margaux-trouvee',            //   facultatif : Margaux trouvée dans le placard d'entretien (Ingéniosité)
  remiArrive: 'remi-arrive',                    //   au casier, Rémy arrive en courant par l'escalier
  casierPartage: 'casier-partage',              //   l'embrouille du casier : Rémy et toi le partagez
  remiEnClasse: 'remi-en-classe',              //   Rémy file en salle de maths (« ça va sonner »)
  remiInvite: 'remi-invite',                    //   en classe, Rémy t'invite à aller parler à Camille
  remyAutocollant: 'remy-autocollant',          //   le casier devenu QG : Rémy arrive par l'escalier (l'autocollant)
  remyRepart: 'remy-repart',                    //     … et repart en classe
  finTroisieme: 'fin-troisieme',                //   ellipse : quatre ans plus tard, la fin de la troisième (le brevet)
  bonsecoursFini: 'bonsecours-fini',            // brevet reçu du prof : la route du Prytanée s'ouvre
  arriveePrytanee: 'arrivee-prytanee',          // arrivé au Prytanée
  prytaneeOuverture: 'prytanee-ouverture',      //   image d'accueil du Prytanée vue
  capitaineParle: 'capitaine-parle',            //   le capitaine a parlé : préparer la chambre (le dortoir s'ouvre)
  capitaineAccueil: 'capitaine-accueil',        //   le capitaine est reparti (arrivé à son poste, ou Pierre entré au dortoir)
  litFait: 'lit-fait',                          //   dortoir : lit fait
  armoireRangee: 'armoire-rangee',              //   dortoir : affaires rangées dans l'armoire
  affairesPretes: 'affaires-pretes',            //   dortoir : affaires prêtes pour demain (bureau)
  chambrePrete: 'chambre-prete',                //   les trois faits : le capitaine entre pour l'inspection
  inspection: 'inspection',                     //   « Correct. » : Autonomie reçue, le capitaine repart
  soirMur: 'soir-mur',                          //   « Le soir même… » : la nuit tombe sur le dortoir
  murPropose: 'mur-propose',                    //   le soir : Tanguy et Geoffrey sortent faire le mur (la nuit tombe)
  murAube: 'mur-aube',                          //   derrière le mur : le ciel se lève déjà (l'écran s'éclaircit)
  murReussi: 'mur-reussi',                      //   Pierre les a rejoints derrière le mur, sans se faire prendre
  murMatin: 'mur-matin',                        //   au petit matin, au dortoir : « Personne a rien vu. »
  ellipseBac: 'ellipse-bac',                    //   quelques années plus tard : les résultats du bac dans la cour
  bacDescente: 'bac-descente',                  //   Tanguy et Geoffrey sont descendus de la chambre voir les résultats
  arriveeBordeaux: 'arrivee-bordeaux',          // arrivé à Bordeaux
  bordeauxOuverture: 'bordeaux-ouverture',      //   image d'accueil de Bordeaux vue
  ousmaneRencontre: 'ousmane-rencontre',        //   Ousmane rencontré devant l'immeuble : ils entrent (la coupure)
  coupure: 'coupure',                          //   dans le noir : « On appelle quelqu'un ? » « Non. » (Pragmatisme)
  coupureReparee: 'coupure-reparee',            //   compteur électrique relevé : la lumière revient (Indépendance)
  preparatifs: 'preparatifs',                   //   Ousmane lance la soirée : enceinte chez Paul, gobelets chez Rémi
  soiree: 'soiree',                             //   la soirée d'intégration, dans l'appartement
  leoSoiree: 'leo-soiree',                      //     Léo (KEDGE) rencontré à la soirée
  anaisSoiree: 'anais-soiree',                  //     Anaïs (KEDGE) rencontrée à la soirée
  lendemainSoiree: 'lendemain-soiree',          //   en quittant la fête : le lendemain matin, l'appartement en désordre
  ousmaneLeve: 'ousmane-leve',                  //     tout rangé : Ousmane sort du lit (la photo de la soirée)
  gobeletsRanges: 'gobelets-ranges',            //     à faire avant de sortir (Autonomie) : les gobelets ramassés
  salonRange: 'salon-range',                    //       … le salon rangé
  litFaitBordeaux: 'lit-fait-bordeaux',         //       … le lit fait
  soireeFinie: 'soiree-finie',                  //   en sortant : « Quelques mois plus tard » (l'oral d'anglais)
  remiKedge: 'remi-kedge',                      //   Rémi, devant KEDGE : « T'inquiète, c'est easy. »
  ousmaneDiplome: 'ousmane-diplome',            //   le diplôme d'anglais en poche : Ousmane, devant KEDGE, montre l'aéroport
  veloCherche: 'velo-cherche',                  //   facultatif : le cycliste du quai a perdu la clé de son antivol
  arriveeHull: 'arrivee-hull',                  // arrivé à Hull (Angleterre)
  hullAccueil: 'hull-accueil',                  // Hull : Ousmane t'a accueilli à l'arrivée
  ousmaneRentre: 'ousmane-rentre',              //        Ousmane est rentré à la coloc (devant toi)
  leoAppel: 'leo-appel',                        //        Ousmane : « Léo a appelé, il a un plan »
  leoPlan: 'leo-plan',                          //        chez Léo : la soirée commence (la nuit tombe)
  leoEntrePubA: 'leo-entre-pub-a',              //        Léo, en éclaireur, est entré le premier au pub
  servieLeo: 'servie-leo',                      //        premier pub, la tournée : la commande de Léo servie
  servieOusmane: 'servie-ousmane',              //          … d'Ousmane
  servieCharlotte: 'servie-charlotte',          //          … de Charlotte
  servieAnais: 'servie-anais',                  //          … d'Anaïs
  tourneeServie: 'tournee-servie',              //        toute la tournée rapportée : on trinque, la bande file au pub suivant
  leoEntrePubB: 'leo-entre-pub-b',              //        Léo, en éclaireur, est entré le premier au second pub
  bandePubB: 'bande-pub-b',                     //        la bande (derrière Pierre) est entrée au second pub et s'attable
  tourneeOfferte: 'tournee-offerte',            //        fléchettes : pari gagné, l'habitué offre une tournée générale
  flechettesJouees: 'flechettes-jouees',        //        deuxième pub : partie de fléchettes jouée, direction l'Asylum
  leoEntreAsylum: 'leo-entre-asylum',           //        Léo, en éclaireur, est entré le premier à l'Asylum
  bandeAsylum: 'bande-asylum',                  //        la bande (derrière Pierre) est entrée à l'Asylum
  asylumFini: 'asylum-fini',                    //        dernière chanson à l'Asylum : sortie au petit matin
  bandeRentree: 'bande-rentree',                //        au petit matin, chacun est rentré chez soi
  lendemainHull: 'lendemain-hull',              //        rentré dormir : le lendemain, veille d'examen
  revisions: 'revisions',                       //        révisions à la bibliothèque : « T'es prêt. »
  jourResultats: 'jour-resultats',              //        le lendemain : les résultats affichés devant l'université
  adieuxHull: 'adieux-hull',                    //        devant chez Léo, chacun part en échange (Pierre : Hanoï)
  arriveeHanoi: 'arrivee-hanoi',                // arrivé à Hanoï (Vietnam)
  hanoiOuverture: 'hanoi-ouverture',            //   image d'accueil de Hanoï vue : Pierre arrive seul
  travailEtape1: 'travail-etape-1',             //   premier jour à l'agence : le patron t'a tendu les consignes en vietnamien
  consignesTraduites: 'consignes-traduites',    //   M. Lam a lu les consignes : guider les touristes au temple (Adaptation)
  touristesSuivent: 'touristes-suivent',        //   tu guides les deux touristes vers le temple
  templeCalme: 'temple-calme',                  //   au temple, la touriste au téléphone à plat se calme (Insouciance)
  visiteTerminee: 'visite-terminee',            //   les touristes t'ont remercié
  travailTermine: 'travail-termine',            //   le patron te remercie
  sixMoisHanoi: 'six-mois-hanoi',               //   en sortant de l'agence : « Six mois plus tard… »
  appelRomain: 'appel-romain',                  //   Romain t'appelle : il t'attend à Amsterdam (le vol s'ouvre)
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
  diplomeBordeaux: 'diplome-bordeaux',          // diplôme reçu devant l'estrade du stade (la route de Paris s'ouvre)
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

// Vertus (traits de caractère) : une seule collection, qui grandit de ville en ville ; 8 au plus dans tout le jeu, une
// par ville au plus (6 jusqu'à Hull, Adaptation à Hanoï, 1 place réservée après). Encart « Pierre a reçu la vertu X ! » (étape `trait`),
// « Pierre utilise X ! » quand une vertu débloque une situation (étape `useTrait`, comptée dans le carnet), carnet
// (Start > VERTUS) et compteur « Vertus : X sur 8 » (UIScene). `city` : la ville où on la reçoit (id de carte) ;
// `phrase` : sa phrase dans le carnet. Les `id` gardent ceux des anciennes sauvegardes quand c'est la même vertu ;
// les anciennes sont converties au chargement (voir TRAIT_MIGRATION, systems/save.js migrateSave).
export const TRAITS = {
  joie: {
    id: 'souvenir-maman', name: 'Joie de vivre', city: 'fortDeFrance',
    phrase: 'Rire et danser partout où l\'on va, même le jour du départ.',
  },
  espritEquipe: {
    id: 'role-cousins', name: "Esprit d'équipe", city: 'saintAy',
    phrase: 'Construire à plusieurs ce qu\'on ne ferait jamais seul.',
  },
  ingeniosite: {
    id: 'role-bricoleur', name: 'Ingéniosité', city: 'montepilloy',
    phrase: 'Trouver comment réparer ce qui ne marche plus.',
  },
  audace: {
    id: 'vertu-audace', name: 'Audace', city: 'routeBonsecours',
    phrase: 'Oser aller vers les autres, même quand on est timide.',
  },
  autonomie: {
    id: 'vertu-autonomie', name: 'Autonomie', city: 'prytanee',
    phrase: 'Faire les choses soi-même, sans attendre qu\'on les fasse à sa place.',
  },
  insouciance: {
    id: 'vertu-insouciance-hull', name: 'Insouciance', city: 'hull',
    phrase: 'Profiter du moment, sans penser à demain.',
  },
  adaptation: {
    id: 'vertu-adaptation', name: 'Adaptation', city: 'hanoi',
    phrase: 'Trouver son chemin partout, même sans en parler la langue.',
  },
};
export const MAX_TRAITS = 8;
const TRAIT_LIST = Object.values(TRAITS);
export const traitById = (id) => TRAIT_LIST.find((t) => t.id === id) ?? null;
export const traitsOfCity = (city) => TRAIT_LIST.filter((t) => t.city === city);
// Encart du trajet vers la ville suivante : seulement la vertu reçue dans la ville qu'on quitte.
export const carryText = (city) => `Tu emportes : ${traitsOfCity(city).map((t) => t.name).join(', ')}.`;

// Anciennes sauvegardes (avant le passage à 8 vertus) : vertus renommées (ancien id -> vertu), vertus retirées (ancien
// id -> drapeau qui marque la scène comme faite, ou null). Attention : l'ancien « vertu-insouciance » est la vertu du
// collège, devenue Audace.
export const TRAIT_MIGRATION = {
  renamed: {
    'vertu-insouciance': TRAITS.audace,
    'vertu-lacher-prise': TRAITS.insouciance,
  },
  removed: {
    'souvenir-papa': null,                                  // Pragmatisme : le tri des cannes lève déjà papa-fait
    'souvenir-manon': FLAGS.secretManon,                    // Confiance : le coquillage de Manon
    'role-grand-frere': FLAGS.fannyMain,                    // Patience : la main de Fanny
    'role-copains-montepilloy': FLAGS.copainsPartent,       // Loyauté : la fin du cache-cache
    'vertu-independance': null,                             // Indépendance : le compteur relève déjà coupure-reparee
  },
};

// Objets remis au joueur (voir systems/items.js).
export const ITEMS = {
  coquillageNacre: { id: 'coquillage-nacre', name: 'Coquillage nacré' },
  // Objets-souvenirs facultatifs, un par ville.
  galetLac: { id: 'galet-lac', name: 'Galet du lac' },                            // Saint-Ay : le vieux pêcheur méfiant
  canneAPeche: { id: 'canne-a-peche', name: 'Canne à pêche' },
  vieilleCanne: { id: 'vieille-canne', name: 'Vieille canne' },     // pour pêcher face à l'eau (facultatif)
  planches: { id: 'planches', name: 'Planches' },
  // Bordeaux, facultatif : la clé d'antivol du cycliste, perdue dans les hautes herbes ; en remerciement, son vieux vélo,
  // réparé sur place (Ingéniosité). Voir bordeauxStory.js CYCLIST, systems/bike.js.
  cleAntivol: { id: 'cle-antivol', name: "Clé d'antivol" },
  velo: { id: 'velo', name: 'Vélo' },
  corde: { id: 'corde', name: 'Vieille corde' },
  brevet: { id: 'brevet', name: 'Diplôme du brevet' },                         // collège : remis par le prof
  autocollant: { id: 'autocollant', name: 'Autocollant de Rémy' },             // collège : objet-souvenir (le casier)
  reglementQG: { id: 'reglement-qg', name: 'Règlement du QG' },               // Saint-Ay : le panier de la cabane (verrou)
  baccalaureat: { id: 'baccalaureat', name: 'Baccalauréat' },
  clesAppartement: { id: 'cles-appartement', name: "Clés de l'appartement" },
  enceinte: { id: 'enceinte', name: 'Enceinte' },                              // Bordeaux : prêtée par Paul
  gobelets: { id: 'gobelets', name: 'Gobelets' },                              // Bordeaux : prêtés par Rémi
  diplomeAnglais: { id: 'diplome-anglais', name: "Diplôme d'anglais" },
  diplomeHull: { id: 'diplome-hull', name: 'Diplôme d\'anglais de Hull' },
  insigne: { id: 'insigne-prytanee', name: 'Insigne du Prytanée' },          // Prytanée : objet-souvenir (le nouveau)
  photoSoiree: { id: 'photo-soiree', name: 'Photo de la soirée' },           // Bordeaux : objet-souvenir (le rangement)
  objetChance: { id: 'objet-chance', name: 'Objet de chance' },
  // Hanoï : les consignes du premier jour, écrites en vietnamien (le patron) ; facultatif, la pièce des papis du lac.
  consignesVietnamien: { id: 'consignes-vietnamien', name: 'Consignes en vietnamien' },
  pieceEchecs: { id: 'piece-echecs', name: "Pièce d'échecs chinois" },
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
// `id` identique à celui du PNJ qu'ils remplacent : ils partent de sa position. `name` : leur nom affiché, qui donne
// leur apparence (voir characters.js) ; sans lui, l'id sert de nom (attention aux accents).
// Fin du cache-cache de Montépilloy : les copains filent à l'école.
const COPAINS_DONE = { unlessFlags: [FLAGS.copainsPartent] };

// Pas de suiveur à Fort-de-France ni à Saint-Ay : les PNJ y partent devant et attendent sur place.
export const FOLLOWERS = [
  // Montépilloy : les copains trouvés au cache-cache suivent Pierre jusqu'à la fin de la partie (ils filent alors à
  // l'école, voir montepilloyStory.js GAME_OVER).
  { id: 'margaux', name: 'Margaux', color: 0xf08080, ifFlags: [FLAGS.trouveMargaux], ...COPAINS_DONE },
  { id: 'etienne', name: 'Étienne', color: 0x6080a0, ifFlags: [FLAGS.trouveEtienne], ...COPAINS_DONE },
  { id: 'benoit', name: 'Benoît', color: 0xa07040, ifFlags: [FLAGS.trouveBenoit], ...COPAINS_DONE },
  // Hanoï : les deux touristes te suivent de l'agence jusqu'au temple, et en ressortent avec toi.
  { id: 'touriste-1', name: 'Touriste', sprite: 'g24', color: 0xe0a0d0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  { id: 'touriste-2', name: 'Touriste', sprite: 'g22', color: 0x80c0e0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  // Chemin de Saint-Jacques : Yanis marche avec toi jusqu'à Saint-Jacques.
  { id: 'yanis', color: 0xc0b040, ifFlags: [FLAGS.caminoEnCours], unlessFlags: [FLAGS.caminoFini] },
  // Hull, la tournée des bars : Léo part devant en éclaireur ; Ousmane, Charlotte et Anaïs suivent Pierre à la queue
  // leu leu, du premier pub au second, puis du second à l'Asylum (mêmes id que leurs PNJ dans les bars : ils partent de
  // leur place à table, et s'y rassoient en arrivant, voir hullStory.js et interiors.js).
  ...[[FLAGS.tourneeServie, FLAGS.bandePubB], [FLAGS.flechettesJouees, FLAGS.bandeAsylum]].flatMap(([from, until]) => [
    { id: 'ousmane-pub', name: 'Ousmane', ifFlags: [from], unlessFlags: [until] },
    { id: 'charlotte-pub', name: 'Charlotte', ifFlags: [from], unlessFlags: [until] },
    { id: 'anais-pub', name: 'Anaïs', ifFlags: [from], unlessFlags: [until] },
  ]),
];
