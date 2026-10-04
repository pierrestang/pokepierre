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
  familleSuit: 'famille-suit',                  // Papa et Manon sont partis devant, à la clinique
  familleArrivee: 'famille-arrivee',            // arrivés à la clinique de Saint-Ay
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
  jeanQuetes: 'jean-quetes',                    //   Jean t'a demandé d'être son assistant (il te suit)
  boulyDemande: 'bouly-demande',                //   M. Bouly t'a parlé de la pièce qui manque à son tracteur
  pieceTrouvee: 'piece-trouvee',                //   pièce de tracteur trouvée dans le tonneau de la grange
  tracteurRepare: 'tracteur-repare',            //   « Passe-moi la clé ! » réussi : le tracteur est réparé
  finJournee: 'fin-journee',                    //   les deux vertus reçues : le soleil se couche, on rentre dîner
  septembre: 'septembre',                       //   ellipse jusqu'en septembre : la famille devant la maison
  departCollege: 'depart-college',              //   septembre : au revoir de la famille, départ à pied
  collegeOuverture: 'college-ouverture',        // Bonsecours : image d'accueil du premier jour de collège vue
  collegeArrivee: 'college-arrivee',            //   le surveillant t'a accueilli dans le hall (il est monté au couloir)
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
  murReussi: 'mur-reussi',                      //   Pierre les a rejoints derrière le mur, sans se faire prendre
  murMatin: 'mur-matin',                        //   au petit matin, au dortoir : « Personne a rien vu. »
  ellipseBac: 'ellipse-bac',                    //   quelques années plus tard : les résultats du bac dans la cour
  bacDescente: 'bac-descente',                  //   Tanguy et Geoffrey sont descendus de la chambre voir les résultats
  arriveeBordeaux: 'arrivee-bordeaux',          // arrivé à Bordeaux
  bordeauxOuverture: 'bordeaux-ouverture',      //   image d'accueil de Bordeaux vue
  ousmaneRencontre: 'ousmane-rencontre',        //   Ousmane rencontré devant l'immeuble : ils entrent (la coupure)
  coupure: 'coupure',                          //   dans le noir : « On appelle quelqu'un ? » « Non. » (Pragmatisme)
  coupureReparee: 'coupure-reparee',            //   compteur électrique relevé : la lumière revient (Indépendance)
  preparatifs: 'preparatifs',                   //   Ousmane lance la soirée : enceinte chez Paulfit, gobelets chez Rémi
  soiree: 'soiree',                             //   la soirée d'intégration, dans l'appartement
  soireeFinie: 'soiree-finie',                  //   en sortant : « Quelques mois plus tard » (l'oral d'anglais)
  remiKedge: 'remi-kedge',                      //   Rémi, devant KEDGE : « T'inquiète, c'est easy. »
  arriveeHull: 'arrivee-hull',                  // arrivé à Hull (Angleterre)
  hullAccueil: 'hull-accueil',                  // Hull : Ousmane t'a accueilli à l'arrêt de bus
  ousmaneRentre: 'ousmane-rentre',              //        Ousmane est rentré à la coloc (devant toi)
  leoAppel: 'leo-appel',                        //        Ousmane : « Léo a appelé, il a un plan »
  leoPlan: 'leo-plan',                          //        chez Léo : la soirée commence (la nuit tombe)
  servieLeo: 'servie-leo',                      //        premier pub, la tournée : la commande de Léo servie
  servieOusmane: 'servie-ousmane',              //          … d'Ousmane
  servieCharlotte: 'servie-charlotte',          //          … de Charlotte
  servieAnais: 'servie-anais',                  //          … d'Anaïs
  tourneeServie: 'tournee-servie',              //        toute la tournée rapportée : on trinque, la bande file au pub d'en face
  flechettesJouees: 'flechettes-jouees',        //        deuxième pub : partie de fléchettes jouée, direction l'Asylum
  asylumFini: 'asylum-fini',                    //        dernière chanson à l'Asylum : sortie au petit matin
  lendemainHull: 'lendemain-hull',              //        rentré dormir : le lendemain, veille d'examen
  revisions: 'revisions',                       //        révisions à la bibliothèque : « T'es prêt. »
  jourResultats: 'jour-resultats',              //        le lendemain : les résultats affichés devant l'université
  adieuxHull: 'adieux-hull',                    //        devant chez Léo, chacun part en échange (Pierre : Hanoï)
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

// Vertus (traits de caractère) : une seule collection, qui grandit de ville en ville. Encart « Pierre a reçu la vertu
// X ! » (étape `trait`), « Pierre utilise X ! » quand une vertu débloque une situation (étape `useTrait`), carnet
// (Start > VERTUS) et compteur de la ville en cours (UIScene). `city` : la ville où on le reçoit (id de carte).
// Les `id` restent ceux des anciennes qualités et anciens rôles, pour les sauvegardes et les conditions (`ifSouvenirs`).
export const TRAITS = {
  joie: { id: 'souvenir-maman', name: 'Joie de vivre', city: 'fortDeFrance' },
  pragmatisme: { id: 'souvenir-papa', name: 'Pragmatisme', city: 'fortDeFrance' },
  confiance: { id: 'souvenir-manon', name: 'Confiance', city: 'fortDeFrance' },
  patience: { id: 'role-grand-frere', name: 'Patience', city: 'saintAy' },
  espritEquipe: { id: 'role-cousins', name: "Esprit d'équipe", city: 'saintAy' },
  loyaute: { id: 'role-copains-montepilloy', name: 'Loyauté', city: 'montepilloy' },
  ingeniosite: { id: 'role-bricoleur', name: 'Ingéniosité', city: 'montepilloy' },
  insouciance: { id: 'vertu-insouciance', name: 'Insouciance', city: 'routeBonsecours' },
  autonomie: { id: 'vertu-autonomie', name: 'Autonomie', city: 'prytanee' },
  independance: { id: 'vertu-independance', name: 'Indépendance', city: 'bordeaux' },
  lacherPrise: { id: 'vertu-lacher-prise', name: 'Lâcher-prise', city: 'hull' },
};
const TRAIT_LIST = Object.values(TRAITS);
export const traitById = (id) => TRAIT_LIST.find((t) => t.id === id) ?? null;
export const traitsOfCity = (city) => TRAIT_LIST.filter((t) => t.city === city);
export const TRAIT_CITIES = [...new Set(TRAIT_LIST.map((t) => t.city))];      // dans l'ordre de l'histoire
// Encart du trajet vers la ville suivante : seulement les vertus reçues dans la ville qu'on quitte.
export const carryText = (city) => `Tu emportes : ${traitsOfCity(city).map((t) => t.name).join(', ')}.`;

// Objets remis au joueur (voir systems/items.js).
export const ITEMS = {
  coquillageNacre: { id: 'coquillage-nacre', name: 'Coquillage nacré' },
  // Objets-souvenirs facultatifs, un par ville.
  galetLac: { id: 'galet-lac', name: 'Galet du lac' },                            // Saint-Ay : le vieux pêcheur méfiant
  canneAPeche: { id: 'canne-a-peche', name: 'Canne à pêche' },
  vieilleCanne: { id: 'vieille-canne', name: 'Vieille canne' },     // pour pêcher face à l'eau (facultatif)
  planches: { id: 'planches', name: 'Planches' },
  corde: { id: 'corde', name: 'Vieille corde' },
  cuillere: { id: 'cuillere', name: 'Cuillère de Jean' },                     // Montépilloy : objet-souvenir (caisse à outils)
  brevet: { id: 'brevet', name: 'Diplôme du brevet' },                         // collège : remis par le prof
  autocollant: { id: 'autocollant', name: 'Autocollant de Rémy' },             // collège : objet-souvenir (le casier)
  baccalaureat: { id: 'baccalaureat', name: 'Baccalauréat' },
  clesAppartement: { id: 'cles-appartement', name: "Clés de l'appartement" },
  enceinte: { id: 'enceinte', name: 'Enceinte' },                              // Bordeaux : prêtée par Paulfit
  gobelets: { id: 'gobelets', name: 'Gobelets' },                              // Bordeaux : prêtés par Rémi
  diplomeAnglais: { id: 'diplome-anglais', name: "Diplôme d'anglais" },
  diplomeHull: { id: 'diplome-hull', name: 'Diplôme d\'anglais de Hull' },
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
// `id` identique à celui du PNJ qu'ils remplacent : ils partent de sa position. `name` : leur nom affiché, qui donne
// leur apparence (voir characters.js) ; sans lui, l'id sert de nom (attention aux accents).
// Fin du cache-cache de Montépilloy : les copains filent à l'école (ou, dans une ancienne partie, Loyauté déjà reçue).
const COPAINS_DONE = { unlessFlags: [FLAGS.copainsPartent], unlessSouvenirs: ['role-copains-montepilloy'] };

// Pas de suiveur à Fort-de-France ni à Saint-Ay : les PNJ y partent devant et attendent sur place.
export const FOLLOWERS = [
  // Montépilloy : les copains trouvés au cache-cache suivent Pierre jusqu'à la fin de la partie (ils filent alors à
  // l'école, voir montepilloyStory.js GAME_OVER).
  { id: 'margaux', name: 'Margaux', color: 0xf08080, ifFlags: [FLAGS.trouveMargaux], ...COPAINS_DONE },
  { id: 'etienne', name: 'Étienne', color: 0x6080a0, ifFlags: [FLAGS.trouveEtienne], ...COPAINS_DONE },
  { id: 'benoit', name: 'Benoît', color: 0xa07040, ifFlags: [FLAGS.trouveBenoit], ...COPAINS_DONE },
  // Hanoï : les deux touristes te suivent de l'agence jusqu'au temple, et en ressortent avec toi.
  { id: 'touriste-1', color: 0xe0a0d0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  { id: 'touriste-2', color: 0x80c0e0, ifFlags: [FLAGS.touristesSuivent], unlessFlags: [FLAGS.visiteTerminee] },
  // Chemin de Saint-Jacques : Yanis marche avec toi jusqu'à Saint-Jacques.
  { id: 'yanis', color: 0xc0b040, ifFlags: [FLAGS.caminoEnCours], unlessFlags: [FLAGS.caminoFini] },
];
