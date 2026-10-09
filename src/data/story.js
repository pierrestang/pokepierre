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
  appelAmsterdam: 'appel-amsterdam',            //   à l'arrivée, Romain appelle : rendez-vous à la maison commune
  romainDemande: 'romain-demande',              //   Romain t'a demandé d'aller chercher son bouquet chez le marchand de fleurs
  marchandiseAchetee: 'marchandise-achetee',    //   le bouquet, pris chez le marchand de fleurs
  marchandiseDonnee: 'marchandise-donnee',      //   donné à Romain : il t'envoie à ton stage chez Corning
  stageCorning: 'stage-corning',                //   la campagne présentée au patron de Corning (Autonomie, Audace)
  moisAmsterdam: 'mois-amsterdam',              //   en sortant de Corning : « Quelques mois plus tard… » (la nuit tombe)
  canalNuit: 'canal-nuit',                      //   la nuit au bord du canal avec Romain (Insouciance), le billet pour New Delhi
  arriveeNewDelhi: 'arrivee-new-delhi',         // arrivé à New Delhi (Inde)
  delhiFoule: 'delhi-foule',                    //   la traversée de la foule : Pierre n'a jamais rien vu de pareil
  prophecyDelhi: 'prophecy-delhi',              //   Prophecy accueille Pierre au bout de l'avenue ; Harsh se présente
  harshCour: 'harsh-cour',                      //   Harsh, parti devant, est entré dans la cour du palais (la fête)
  courArrivee: 'cour-arrivee',                  //   Pierre et Prophecy arrivent dans la cour : Prophecy ne le suit plus
  feteDelhi: 'fete-delhi',                      //   la fête dans la cour du palais (Joie de vivre) ; Harsh et Prophecy suivent Pierre
  sageDelhi: 'sage-delhi',                      //   le vieux sage, derrière la porte du fort : la pierre gravée
  moisDelhi: 'mois-delhi',                      //   « Quelques mois plus tard… » (la seule ellipse de la ville)
  departDelhi: 'depart-delhi',                  //   Prophecy et Harsh devant le fort : on rentre ; Prophecy suit Pierre jusqu'à Bordeaux
  semestreTermine: 'semestre-termine',          //   Prophecy : on rentre à Bordeaux (le stade s'ouvre)
  retourBordeaux: 'retour-bordeaux',            // de retour à Bordeaux, par le vol depuis l'aéroport de Delhi
  stadeIndique: 'stade-indique',                //   Prophecy, à l'arrivée : la remise des diplômes, au stade
  stadeEntree: 'stade-entree',                  //   dans le stade : Prophecy rejoint la foule, Pierre avance seul
  diplomeBordeaux: 'diplome-bordeaux',          // diplôme reçu devant l'estrade du stade (la route de Paris s'ouvre)
  adieuxBordeaux: 'adieux-bordeaux',            //   en sortant du stade : « Direction Paris. »
  arriveeParis: 'arrivee-paris',                // arrivé à Paris, devant l'immeuble du propriétaire
  parisCles: 'paris-cles',                      //   le propriétaire a donné les clés
  jour1Bureau: 'jour1-bureau',                  //   premier passage au rez-de-chaussée de la tour (le collègue)
  concertAppel: 'concert-appel',                //   en sortant : Hugues appelle, la place de concert a voyagé (Inès)
  placeInes: 'place-ines',                      //     Inès, devant l'Opéra : elle l'a donnée à Malik
  placeMalik: 'place-malik',                    //     Malik, dans la file du Louvre : il l'a laissée à Clara
  placeClara: 'place-clara',                    //     Clara, au café à terrasse : elle rend la place
  concertParis: 'concert-paris',                //   le concert à Bercy (le bouton du 1er étage s'allume)
  promotionParis: 'promotion-paris',            //   au 1er étage, le manager prend Pierre avec lui
  messageHugues: 'message-hugues',              //   en sortant : « Match ce soir chez moi ! »
  thomasSuit: 'thomas-suit',                    //     Thomas, à la fin de son service, suit Pierre avec de quoi manger
  matchArrivee: 'match-arrivee',                //     chez Hugues : Thomas pose tout et rejoint les autres
  matchParis: 'match-paris',                    //   France-Argentine chez Hugues (perdu)
  directeurInvite: 'directeur-invite',          //   au bureau : le dernier étage s'ouvre (le directeur veut voir Pierre)
  liberteParis: 'liberte-paris',                //   Pierre refuse la place du directeur (Liberté)
  reveParis: 'reve-paris',                      //   en sortant de la tour : le rêve (la grande réunion)
  finDuJeu: 'fin-du-jeu',                       //   la réunion, le fondu, le réveil à Fort-de-France : la fin
  reveilFin: 'reveil-fin',                      //   la fin : Pierre se lève de son lit, à Fort-de-France
  talismanPris: 'talisman-pris',                //   il prend la pierre sur la table de chevet : écran noir, retour au titre
};

// Vertus (traits de caractère) : une seule collection, qui grandit de ville en ville ; 8 au plus dans tout le jeu, une
// par ville au plus (6 jusqu'à Hull, Adaptation à Hanoï, la Liberté à Paris). Encart « Pierre a reçu la vertu X ! » (étape `trait`),
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
  liberte: {
    id: 'vertu-liberte', name: 'Liberté', city: 'paris',
    phrase: 'Écouter qui l\'on est vraiment, et refuser une vie qui n\'est pas la sienne.',
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
  marchandise: { id: 'marchandise', name: 'Bouquet de fleurs' },   // id d'origine gardé (sauvegardes)
  billetNewDelhi: { id: 'billet-new-delhi', name: "Billet d'avion pour New Delhi" },  // remis par Romain, à Amsterdam
  pierreGravee: { id: 'pierre-gravee', name: 'Pierre gravée' },                // New Delhi : le vieux sage du fort
  diplomeBordeaux: { id: 'diplome-bordeaux', name: 'Diplôme de Bordeaux' },
  clesParis: { id: 'cles-paris', name: 'Clés du studio' },                          // Paris : le propriétaire
  placeConcert: { id: 'place-concert', name: 'Place de concert' },                  // Paris : rendue par Clara
  platsMatch: { id: 'plats-match', name: 'De quoi manger' },                         // Paris : Thomas, pour le match
  pieceTracteur: { id: 'piece-tracteur', name: 'Pièce de tracteur' },
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
  // Hanoï : les deux touristes te suivent de la grande rue jusqu'au temple, et en ressortent avec toi.
  { id: 'touriste-1', name: 'Touriste', sprite: 'g24', color: 0xe0a0d0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  { id: 'touriste-2', name: 'Touriste', sprite: 'g22', color: 0x80c0e0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  // New Delhi : Prophecy suit Pierre de la rencontre jusqu'à la cour du palais (il y redevient le PNJ prophecy-fete) ;
  // après la fête, Harsh et Prophecy le suivent jusqu'au vieux sage, derrière la porte du fort ; à la fin du semestre,
  // Prophecy le suit jusqu'à l'aéroport, dans l'avion, puis à Bordeaux jusqu'au stade (il y redevient le PNJ
  // prophecy-depart et rejoint la foule).
  { id: 'prophecy-fete', name: 'Prophecy', ifFlags: [FLAGS.prophecyDelhi], unlessFlags: [FLAGS.courArrivee] },
  { id: 'prophecy-depart', name: 'Prophecy', ifFlags: [FLAGS.departDelhi], unlessFlags: [FLAGS.stadeEntree] },
  // Paris : Thomas, son service fini, suit Pierre du restaurant jusque chez Hugues (il y redevient le PNJ thomas).
  { id: 'thomas', name: 'Thomas', ifFlags: [FLAGS.thomasSuit], unlessFlags: [FLAGS.matchArrivee] },
  { id: 'harsh-fete', name: 'Harsh', ifFlags: [FLAGS.feteDelhi], unlessFlags: [FLAGS.sageDelhi] },
  { id: 'prophecy-fete', name: 'Prophecy', ifFlags: [FLAGS.feteDelhi], unlessFlags: [FLAGS.sageDelhi] },
  // Hull, la tournée des bars : Léo part devant en éclaireur ; Ousmane, Charlotte et Anaïs suivent Pierre à la queue
  // leu leu, du premier pub au second, puis du second à l'Asylum (mêmes id que leurs PNJ dans les bars : ils partent de
  // leur place à table, et s'y rassoient en arrivant, voir hullStory.js et interiors.js).
  ...[[FLAGS.tourneeServie, FLAGS.bandePubB], [FLAGS.flechettesJouees, FLAGS.bandeAsylum]].flatMap(([from, until]) => [
    { id: 'ousmane-pub', name: 'Ousmane', ifFlags: [from], unlessFlags: [until] },
    { id: 'charlotte-pub', name: 'Charlotte', ifFlags: [from], unlessFlags: [until] },
    { id: 'anais-pub', name: 'Anaïs', ifFlags: [from], unlessFlags: [until] },
  ]),
];
