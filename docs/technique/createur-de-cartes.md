# Créateur de cartes

Détail technique du créateur de cartes (sorti de CLAUDE.md, qui n'en garde qu'un résumé).

## Éditeur

Créateur de cartes (builder.html, src/builder/ ; entrée « Créateur de cartes » du menu titre) : nouveau design
« V2 ». Planches Gen 4 déposées par l'utilisateur dans ASSETTILESPOKEMONV2/ (ressources de fans DeviantArt et eeveeexpo, à
créditer ; rangées par usage, voir ASSETTILESPOKEMONV2/README.md ; audit et nettoyage du 6 octobre 2026 :
docs/technique/assets-gen4.md), préparées par scripts/build_v2_tiles.py vers public/assets/v2/ (cases de 16 px +
catalog.json). Plus de planches Gen 3 ni Gen 5 : la palette ne propose que la bibliothèque Gen 4, rangée par rayon. Trois calques (sol, décor bloquant, au-dessus de Pierre),
collisions et point de départ. En dev, les cartes sont enregistrées dans src/data/builtMaps/<id>.json (vite.config.js) ;
le jeu les ouvre avec ?carte=<id> (?carte=test : la carte en cours d'essai), voir src/systems/builtMaps.js.
Une carte du jeu (Saint-Ay, Hull…) testée ainsi s'ouvre dans son contexte (PNJ, portes, histoire de la partie) sans
rien enregistrer (systems/builtMaps.js protectSave). Enregistrer : une carte garde son fichier même renommée ; le
serveur de dev refuse (409, vite.config.js) d'écraser une carte qui a changé depuis son ouverture ou une autre carte
du même nom, et le créateur demande ; un brouillon non enregistré reste marqué tel au rechargement. Palette :
double-clic = l'élément entier ; outil Déplacer avec Alt = copier, Suppr / ⌫ ou lâcher hors de la carte = supprimer ;
gomme de 1, 2, 3 ou 5 cases de côté ([ et ]) ; Ctrl+D (ou Ctrl+C puis Ctrl+V) : la copie de la sélection suit la
souris, chaque clic en pose une (une zone : ses trois calques et ses collisions ; un élément : seul, sans le sol).
Les cartes actuelles restent en place tant qu'elles ne sont pas refaites dans le créateur.

## Éléments ajoutés de la bibliothèque Gen 4 (octobre 2026)

build_catalogue.py `LIB_BUILDINGS` : quinze bâtiments de g4-batiments choisis par l'utilisateur, chacun dans le thème de
sa ville et dans « Libre » (Fort-de-France : case au toit orange, maison au toit vert d'eau, petite maison rose,
boutique à auvent ; Saint-Ay : maison d'ardoise, maison de bois au toit bleu, maison de pierre, grande maison à
lucarne ; Montépilloy : chaumière dorée, cabane, maison à colombages, remise ; collège : grand bâtiment de pierre,
bâtiment à colonnes, immeuble vitré). Pris par rectangle en pixels (le dessin d'un seul tenant), sans ombre, le bas
calé sur la grille, la porte sur la dernière rangée. Mobilier (g4-mobilier) : fontaine, petite fontaine, étals,
transat, grande caisse, massif, table de pique-nique, banc de bois, abri de bois, distributeur, panneau d'affichage ;
souche (végétation, garde son ombre). Les villes suivantes (Prytanée, Bordeaux, Hull) viendront plus tard.

## Éléments relevés sur les cartes (octobre 2026)

scripts/harvest_map_elements.py découpe l'image des objets de chaque carte en dessins d'un seul tenant (bâtiments,
objets) et écrit dans assets-source/elements-cartes/candidats/ (ignoré par git) ceux qui ne sont pas déjà des éléments
du catalogue. Les éléments retenus sont copiés et nommés dans assets-source/elements-cartes/ (<id>.png et
elements.json : carte, rayon, collisions et porte relevées sur la carte) ; build_catalogue.py les ajoute au thème de
leur carte et à « Libre » (MAP_ELEMENTS). Retenus : grande maison de brique (Hull), bâtiment jaune et hangar
(Prytanée), grand bâtiment orange (Montépilloy), longue-vue, panneau du village, deux camionnettes, yacht. La rotonde et
le manoir viennent de leur définition propre (g4_theme.BUILDINGS, via BUILDING_NAMES). Les morceaux (têtes de
lampadaires, bouts de péniche), les doublons du catalogue et les pontons (on marche dessus) ne sont pas repris.
Aussi ajoutés de la bibliothèque : poubelles, feu de camp, puits de pierre, cloche, banc blanc, tableau d'annonces,
lanterne de jardin, poteau indicateur, bûches, table de jardin, tente, panneau en bois, oriflamme, réverbère rouge
(rangée « bloquante » comptée depuis le bas : -1).

## Matières, arbres et plantes ajoutés (octobre 2026)

- Matières en motif (2 x 2 cases qui se raccordent, toutes les villes ; build_catalogue.py PATTERNS) : pavés en
  chevrons, dallage doré, dalles de pierre, planches (g4-sols), terre, chemin de pierres (g4-herbes), bitume
  (g4_theme.ASPHALT). Pas de bords automatiques : on les peint comme les pavés.
- Arbres (LIS_TREES) : les arbres de la planche des lisières, au format de l'arbre de forêt (4 x 4, bloc de 2 x 2 qui
  bloque) : cerisier, arbre olive, arbre pointu, arbre pointu brun, arbre roux, grand feuillu orange, pin bleu, sapin
  sombre, second palmier. Au moins cinq arbres par ville (MORE_TREES).
- Plantes (gardent leur ombre, comme toute la végétation) : fougère, champignon, buisson à baies, hortensias, arbuste
  taillé, tronc moussu, petit oranger, iris bleus, buisson à fleurs orange. Ils gardent leurs couleurs dans les villes
  à feuillage recoloré (KEEP_COLOURS).

## Contour des bâtiments et des objets

Tous les bâtiments ont le même contour : un trait d'un pixel gris très foncé (32, 32, 32) autour du dessin, comme la
maison de bois au toit bleu (scripts/outline_buildings.py, octobre 2026). Le trait remplace le pixel du bord (l'emprise
ne change pas) ; un bord déjà sombre garde sa couleur. Catalogue : build_catalogue.py passe ses maisons par outlined().
Cartes : le script trouve les bâtiments sur l'image des objets de la carte (dessin plein d'au moins 3 x 3 cases après
une ouverture de 10 px, qui efface clôtures et poteaux ; pas sur l'eau), les sépare des traits fins qui les touchent
(ouverture de 5 px), et ne touche qu'aux cases surtout faites de bâtiment ; les maisons posées en mode simple
reprennent les cases du catalogue. Exceptions dans SKIP (Prytanée : deux cases où le haut du toit et la clôture
partagent une case assemblée). Puis les objets (mobilier, clôtures, panneaux, lampadaires, statues…) reçoivent le même
trait autour de chaque dessin d'un seul tenant, sauf les bateaux et véhicules (planches g4-vehicules, objets,
jared-bateaux), ce qui est posé sur l'eau, et un objet collé sous une plante qui le contient (pied d'un palmier, plante
de 16 cases au plus). Le catalogue passe aussi son mobilier par outlined(). La végétation ne change pas.
Précautions (octobre 2026, après des traits parasites sur des cartes retouchées à la main) : un trou entièrement
entouré par le dessin et les cases assemblées vertes (toit-jardin) comptent comme pleins pour trouver le bord ; une
maison du mode simple n'est recalée sur le catalogue que si au moins la moitié de ses cases sont déjà celles du
catalogue (sinon sa fiche ne correspond plus au dessin) et si la case est presque identique ; les cases assemblées
créées par remove_shadows.py et outline_buildings.py à partir d'un objet sont notées dans assets-source/auto-kinds.json
(le test « surtout vert » ne les prend plus pour de la végétation d'un passage à l'autre). Les deux scripts se
relancent sans risque : ils ne changent que ce qui manque.

## Ombres : seulement la végétation

Les bâtiments, le mobilier et les objets n'ont pas d'ombre portée (les planches DPPt en avaient, la bibliothèque Gen 4
non : ils juraient entre eux). scripts/remove_shadows.py retire l'ombre DPPt (pixels noirs semi-transparents) et l'ombre
grise opaque de certains bâtiments Gen 4 (le gris relié à l'extérieur du contour) ; arbres, buissons, plantes, fleurs,
rochers et roseaux gardent la leur. Le catalogue du créateur passe ses maisons et son mobilier par shadowless() ;
toutes les cartes du créateur ont été traitées (octobre 2026). À relancer sur une carte qui recevrait des cases
anciennes : python3 scripts/remove_shadows.py <id>.

## Taille des cartes : toujours paire

Les arbres des bordures font 2 x 2 cases. Sur une carte de largeur ou de hauteur impaire, les bordures de deux côtés
opposés ne tombent pas sur la même grille : les arbres se serrent ou se décalent d'un côté. Le créateur arrondit donc
toute taille (nouvelle carte, redimensionner) au nombre pair supérieur ; audit_maps.py signale `taille_impaire`
(Fort-de-France, île sans bordure d'arbres, peut l'ignorer). Même règle pour les bandes de forêt de part et d'autre d'un
chemin qui traverse une bordure : un chemin de 3 cases laisse une forêt impaire d'un côté ; on met une bande d'herbe
d'une case le long du chemin (Montépilloy, 36 x 30 : x 14 aux deux sorties).

## Outil Déplacer : objet ou zone

- Glisser en partant d'un objet le prend (builder.js objectAt : pixels qui se touchent, plus les cases posées avec lui
  d'après leur place dans leur planche) ; ailleurs, ou avec Maj, on trace une zone : seulement le rectangle tracé.
- Pour ne pas emporter des objets sans rapport : les planches rangées sans ordre (auto, catalogue, transitions) ne
  regroupent pas par place dans la planche ; un objet ne déborde pas sur la forêt qui le touche (sauf si on prend la
  forêt) ; au-delà de 80 cases, ce n'est plus un objet : on trace une zone. Un élément du catalogue (mode simple) est
  pris par sa forme exacte, sans limite de taille (la rotonde fait 97 cases), et reconnu à son dessin (au moins 70 % de
  ses cases dans leur calque) même si sa fiche est périmée ou absente ; la fiche est alors réparée (studio.js
  recognize). Une fiche périmée n'occupe plus de cases (occupancy : seulement là où le dessin est encore).

## Mode simple (src/builder/studio.js), écran par défaut

Le créateur s'ouvre en mode « Simple » ; « Case par case » (bouton en haut du panneau, choix mémorisé) garde l'ancien
éditeur à planches et calques, pour le détail. En mode simple :

- Ville : le thème de la carte (reconnu d'après l'identifiant d'une carte du jeu, « Libre » sinon). Il fixe les matières
  (ses pavés, sa forêt) et les éléments proposés (maisons dans la palette de la ville, son réverbère, ses plantes).
- Matières : Peindre (taille 1, 2, 3, 5), Zone, Remplir (les cases reliées de la même matière). Herbe, chemin, sable,
  hautes herbes, mer, étang : bords refaits autour de chaque coup de pinceau (planche « transitions », comme
  l'assistant). Fleurs : posées sur l'herbe libre. Pavés : motif de la ville. Forêt : par blocs de 2 x 2 calés sur la
  grille ; toute la forêt peinte est redessinée à chaque coup en rangées d'arbres (src/builder/forestLayout.js : d'abord
  les arbres collés à chaque bord, alignés sur leur bord (un arbre peut dépasser de la carte : une bordure d'épaisseur
  impaire garde des arbres entiers), puis le reste sur la meilleure grille, puis chaque case encore libre couverte par
  l'arbre qui chevauche le moins ; dessinés de haut en bas ; tissu sombre seulement derrière, sur les cases qui ne touchent pas
  une case libre ; buisson sur une case hors des blocs). La gomme repeint de
  l'herbe. Clôture : posée case par case au pinceau, ou en tour de rectangle avec Zone ; chaque case prend
  l'angle, le bout ou le montant qui va avec ses voisines (montant collé à droite de la case sur le côté droit d'un
  enclos) ; une ouverture se fait à la gomme. Clôture blanche au Prytanée, à Hull et à Bordeaux. Mer, étang et forêt bloquent ; le reste libère la case.
- Éléments : un clic pose l'élément (aperçu vert, ou rouge avec la raison : sur un obstacle, sur un élément, sur une
  case importante, pas sur son sol — les bateaux, roseaux et nénuphars vont sur l'eau). Le bas bloque, le haut (toit,
  cime) passe au-dessus de Pierre, la porte d'une maison reste libre. La gomme sur un élément le retire et rend les
  collisions d'avant. Sous un élément posé, le pinceau peint seulement un sol qu'on traverse (herbe, chemin, sable,
  pavés), sans toucher à ses collisions (un bout de chemin sous le bord d'une maison s'efface) ; l'eau, la forêt, la
  clôture n'y vont pas. Un sol qu'on traverse ne libère jamais une case qui porte un objet (maison de la carte, rocher).
- Remplacer une maison : une maison choisie, survolée au-dessus d'une maison (posée, ou de la carte : reconnue autour
  d'une porte du jeu, murs puis toit, sans passer la rangée sous la porte d'une autre maison), l'aperçu se cale porte
  sur porte (contour bleu) : un clic remplace (les portes du jeu restent justes). Seules les cases de bâtiment partent
  (un banc, un tas de bois collés restent). Collisions : les cases de la maison remplacée ne comptent pas ; un petit
  objet sur le chemin (au plus 8 cases : boîte aux lettres, buisson, banc, petit arbre) est dégagé ; la forêt, l'eau,
  une porte, un PNJ, le départ ne le sont jamais. La raison d'un refus s'affiche au survol ; l'accessibilité est
  vérifiée après la pose.
- Ce que le mode simple a posé est noté dans la carte (`studio` : thème, cases de forêt, éléments posés) ; le jeu
  l'ignore. L'annulation le suit.
- Eau de Fort-de-France : le lagon (eau claire) et le rivage (sable avec son écume) sont des cases fabriquées ; le
  créateur les reconnaît à leur couleur ('lagoon', 'shore' : l'eau qui les touche ne trace pas de bord). Thème
  Fort-de-France : « Mer » pose l'océan de la carte, « Lagon » l'eau claire ; Remplir sur le lagon le change en océan
  d'un coup, et les cases du rivage qui ont un coin d'eau claire passent à leur version avec l'océan (catalogue :
  ocean_swaps).
- Angles rentrants de l'étang : la planche DPPt n'en a pas ; la planche « transitions » les compose avec la pointe d'un
  coin d'îlot (rangées 11-13) aux couleurs de la berge (build_transitions.pond_inner). Les cartes du jeu sont reprises
  par scripts/identites.py (repair : anciens angles d'étang, montants du côté droit des enclos), à chaque génération.
- Catalogue stable : build_catalogue.py repart de la planche existante (les cases déjà posées sur les cartes gardent leur
  numéro), les nouvelles cases s'ajoutent à la fin.
- Catalogue : scripts/build_catalogue.py -> public/assets/v2/catalogue.png et catalogue.json (thèmes, matières,
  éléments avec leurs cases, collisions, rangées au-dessus de Pierre, porte, sol). Palettes des maisons : celles de
  scripts/identites.py (BUILDING_PALETTES). Arbres de lisière : planche « lisieres » (scripts/build_lisieres.py).
  Après scripts/build_v2_tiles.py (qui réécrit le catalogue des planches), relancer build_transitions.py,
  build_lisieres.py et build_catalogue.py.

## Assistant (src/builder/assistant.js), première version

Panneau en haut à droite de la carte. Le principe : on dessine vite et grossièrement, l'assistant range derrière, sous
contrôle.
- Portée : la zone choisie avec l'outil Déplacer (M), encadrée sur la carte quel que soit l'outil, ou toute la carte
  (× ou Échap pour l'oublier).
- Commandes, par bouton ou par phrase en français (mots-clés, mêmes actions ; une phrase non comprise reçoit des
  exemples) :
  - nettoyage : « Régulariser le chemin » (boucher les trous et les coupures d'une case, relier les chemins qui ne se
    touchent qu'en diagonale, couper les bosses d'une case, refaire les bords) et « Corriger les transitions » (chaque
    case de chemin, sable, mer, étang ou hautes herbes reçoit le bord qui va avec ses voisines) ;
  - bordure : « Refaire la bordure d'arbres » (toute la carte, assistant.js borderTrees ; aussi un bouton du panneau du
    mode simple, sous les matières ; le résultat s'affiche en bas). Arbre au choix par carte : le menu « Arbres » du
    mode simple (studio.trees dans la carte) sert à la bordure et au pinceau Forêt ; « selon la ville » : l'arbre de la
    forêt déjà posée, sinon celui de la ville. Choix : les trois palettes de l'arbre rond, les arbres ronds de la même
    famille de la planche DPPt (olive, doré, roux, orange, cerisier, pointus, pin bleu, grands feuillus) et deux
    palmiers et un sapin sombre de la bibliothèque Gen 4 (build_lisieres.py EXTRA_TREES, à la suite de la planche, sans
    buisson à eux). Comme ancienne bordure à retirer comptent aussi les cases de végétation dense et opaque collées au
    bord (la haie du Prytanée, assistant.js denseGreen) : retire toutes les bordures
    d'arbres existantes (la forêt qui touche un bord : tissu, arbres et buissons de lisière, forêt du pinceau ; le sol
    dessous redevient de l'herbe), puis pose une bordure neuve qui longe le rectangle de la carte : une bande de 2 cases
    contre chaque bord, un arbre tous les 2 cases en largeur comme en hauteur (carte de dimensions paires). Pas d'arbre
    sur l'eau, le relief, un chemin (les sorties), un objet ou une case importante du jeu : le trou reste. Tous les
    arbres (bordure, pinceau Forêt, élément « Arbre de forêt ») sont l'arbre rond de DPPt (planche « lisieres », une
    version par palette), disposés comme dans HeartGold : un tous les 2 cases ; l'arbre du dessous passe devant celui
    du dessus, l'arbre de gauche devant celui de droite (forestLayout.js treeOrder : de haut en bas, et de droite à
    gauche dans une rangée) ; sans tissu sombre ; la couronne qui déborde sur une case libre passe au-dessus de Pierre.
    Tous les arbres restent sur la même grille (angles alignés). Le jeu ne montre pas les bords qui portent ces arbres
    (mapModel.js hiddenEdges, MapScene.fitCamera) : la dernière rangée (le bas des derniers arbres : tronc, ombre) et
    la première et la dernière colonne (les côtés extérieurs des arbres). Vaut aussi pour une carte essayée depuis le
    créateur (« Tester »). Le créateur assombrit ces bords (« bord caché dans le jeu » au survol). Palette : celle de la forêt actuelle, sinon celle de la ville. Saint-Ay, Montépilloy et
    la route de Montépilloy ont été refaites ainsi (octobre 2026) ; identites.py forest_trees (ancienne règle) ne sert
    plus qu'à regénérer la base de Saint-Ay. Les arbres et buissons viennent de la planche « lisières »
    (scripts/build_lisieres.py) ;
  - remplissage : « Semer des hautes herbes » (touffes rondes sur l'herbe libre, à une case des chemins, densité
    réglable, tirage à graine rejouable) et « Régénérer cette zone » (le dernier semis est retiré, un autre tirage le
    remplace, rien d'autre ne bouge).
- Aucune commande ne change les collisions ; chacune tient en un seul pas d'historique (Ctrl+Z) ; une
  commande qui ne change rien n'en laisse pas. Après chacune, l'assistant vérifie l'accessibilité depuis le départ des
  cases importantes (carte du jeu : PNJ, portes et case devant, objets, déclencheurs, props) et signale seulement ce que
  la commande a rendu inatteignable.
- Les cases peintes ou recolorées à la main (illisibles comme bord : motif de la mer, lagon de Fort-de-France) ne sont
  jamais remplacées par « Corriger les transitions », ni les cases qui en touchent une (8 voisines : leur bord a été fait
  à la main pour aller avec, comme le chemin sous les clôtures des champs de blé de la route) ; sur les cartes finies, la
  commande ne change rien (vérifié sur les 8 cartes, octobre 2026).
- Nettoyage d'octobre 2026 : l'élément « Arbre rond » (doublon de « Arbre de forêt ») et l'ancienne commande
  rebuildForest (remplacée par borderTrees) sont retirés.
- Les bords viennent de la planche « transitions » (scripts/build_transitions.py, masquée dans la palette) : pour chaque
  matière, les 625 cases de bord possibles, numérotées (matière x 625 + morceaux des quatre quarts en base 5). Le sol
  d'une case est reconnu d'après sa case d'origine (planche, clé de auto.json, case de transitions), sinon sa couleur.
  À relancer après build_v2_tiles.py (qui réécrit le catalogue).
- Limite : sur une carte du jeu, les hautes herbes semées sont un dessin ; le jeu ne cache les jambes de Pierre que sur
  les cases 'ĥ' de sa grille (data/maps/<ville>.js), et audit_maps.py les signale (herbes_hors_grille).

## Cartes du jeu refaites en V2 (convert_maps_v2.py)

Versions V2 des cartes de Fort-de-France à Hull : générées par scripts/convert_maps_v2.py (lit les cartes du jeu
via scripts/export_maps.mjs ; bordures des sols assemblées dans public/assets/v2/auto.png), puis retouchées à la main
dans le créateur. Le script garde les cartes déjà là (--force ou --force=<id> pour les refaire) et la numérotation
des cases assemblées (public/assets/v2/auto.json) : des cartes retouchées dans le créateur s'en servent.
Fort-de-France du jeu utilise sa carte du créateur (map.built) : dessin cuit au chargement (systems/builtMaps.js
applyBuiltLook), collisions du dessin, grille d'origine (sourceGrid) accordée à ces collisions (maps/builtGrid.js)
pour la logique (portes, eau, hautes herbes) ; ses bâtiments Rouge Feu ne sont plus dessinés.

## Thème DS (Fort-de-France)

Thème DS (Diamant / Perle, scripts/ds_theme.py) : planche DPPt d'akizakura16 (sols, arbres, clôtures, maisons),
palmiers de la planche Jungle recolorés, ferry = yacht de Kyle-Dove (planche « objets », détourée par
build_v2_tiles.py). Appliqué à Fort-de-France, puis refait en octobre 2026 par scripts/fdf_ds_v2.py. Ce script part
de la carte retouchée et garde ses collisions, son départ, sa côte et ses grands objets. Il refait les sols : chemins
vers la maison, la cabane et le mémorial, hautes herbes exactement sur les 'ĥ', fleurs et coquillages dans le calque
Sol (ils se traversent). Il ajoute des objets sur des cases déjà bloquantes : le mémorial en pierre blanche, le drapeau
martiniquais recoloré, des arbustes, une barque et des voiliers. Deuxième passe (FURNITURE) : du mobilier qui ajoute
des collisions (lampadaires, bancs, parasol, clôture, tas de bois). check_access refuse toute case bloquante sur un
chemin, une porte (et la case devant), un PNJ, un objet, un déclencheur, la clairière ou des hautes herbes. Il refuse
aussi qu'une case ou un point d'intérêt qu'on atteignait depuis le départ ne s'atteigne plus. Guirlande de fanions
(décor `fanions`, après la Joie de vivre) : fanions découpés par scripts/build_fanions.py, fil et pose dans
src/art/bunting.js.

## Thème Gen 4 (de Saint-Ay à Hull)

Thème Gen 4 (scripts/g4_theme.py), les sept autres cartes de Saint-Ay à Hull, branchées dans le jeu comme
Fort-de-France (map.built, sourceGrid, sourceBuildings) : uniquement des planches Gen 4 (dppt, autotiles-g4, g4-<type>).
Le dessin suit la grille du jeu : forêt dense DPPt pour les 'T', blé, pavés et bitume en ville, terrain de foot ; un
bâtiment Gen 4 par type du jeu (BUILDINGS, BUILDING_OF_TYPE, variantes par ville dans THEMES), porte posée sur la
porte du jeu, collisions sur la hauteur de l'emprise (le haut du toit passe devant Pierre). Avant de changer un
bâtiment, vérifier qu'il ne bloque ni PNJ ni passage (check_paths.js) : les rues de Hull et Bordeaux sont étroites.
Refaire : python3 scripts/convert_maps_v2.py --force=<id> (efface les retouches faites dans le créateur).

## Deuxième passe des cartes Gen 4 (g4_enrich.py)

scripts/g4_enrich.py enrichit les sept cartes de Saint-Ay à Hull (octobre 2026), à partir du tag git
avant-refonte-g4. Il travaille carte par carte (PLANS) : parvis de sable sous les boîtes aux lettres, massifs de fleurs
dans le calque Sol (ils se traversent), touffes d'herbe rase sur les pelouses unies, nénuphars et rochers sur l'eau,
péniches sur la Garonne. Le sol de chaque case est reconnu d'après sa case d'origine (planche DPPt ou clé de
auto.json). Départ, portes, PNJ, événements et props ne changent pas. Le mobilier (FURNITURE : réverbères, bancs,
jardinières, tas de bois, rochers) ajoute des cases bloquantes. Il n'en pose jamais sur un chemin, des hautes herbes ou
une case de l'histoire (scripts/export_story_points.mjs : PNJ, objets, portes, scénettes, circuits des rondes qui
vont tout droit, arrivées). check_access refuse en plus qu'une case ou un point qu'on atteignait ne s'atteigne plus. Les
PNJ des scénettes cherchent leur chemin (MapScene.walkNpc) : il leur suffit que tout reste relié. `--plan <id>` affiche la grille d'une carte (sols, cases bloquantes, points importants, décors posés sur des
cases libres).

## Bibliothèque Gen 4 (build_g4_library.py)

Palette Gen 4 rangée par type d'élément (arbres, fleurs, herbes, sols, eau, rochers, clôtures, ponts, bâtiments,
bateaux, mobilier, intérieurs) : scripts/build_g4_library.py découpe les planches Gen 4 (sections par planche,
herbe ramenée au vert DPPt, recalage sur la grille, doublons écartés) en planches g4-<type>.png ; les planches
d'origine restent (masquées) pour les cartes déjà faites. Tri : zones des planches délimitées à l'œil (REGIONS),
corrections élément par élément (OVERRIDES), règles de couleur seulement hors zone ; G4_DEBUG=<dossier> écrit des
planches de contrôle. Rangement dans chaque planche par ressemblance (build_g4_library.py order_by_similarity :
couleurs, taille, forme ; familles d'une huitaine d'éléments, une famille par ligne ; G4_ORDER=taille : l'ancien
rangement). g4-index.json donne l'emplacement de chaque élément d'après son origine (« planche@col,rangée ») :
scripts/g4_theme.py désigne ainsi ce qu'il pose (lib()), quel que soit le rangement. Refaire la bibliothèque recale
les cartes qui s'en servent (cases introuvables : g4-archive). Ordre : build_v2_tiles.py, puis convert_maps_v2.py et
build_g4_library.py (build_v2_tiles.py réécrit le catalogue). L'éditeur charge les planches à la demande.

## Calque automatique

Calque automatique (builder.js placementOf) : pour la bibliothèque Gen 4, chaque case connaît son élément (objets
séparés au pixel près, fichiers g4-<type>.elements.json) ; calque et collisions selon le type et la rangée de la case
dans l'élément (cime d'arbre et toit au-dessus de Pierre, pied bloquant, ponts et fleurs franchissables, eau
bloquante, bords de sol par-dessus le sol), quelle que soit la sélection. Autres planches : d'après la sélection.
