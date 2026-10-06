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

## Mode simple (src/builder/studio.js), écran par défaut

Le créateur s'ouvre en mode « Simple » ; « Case par case » (bouton en haut du panneau, choix mémorisé) garde l'ancien
éditeur à planches et calques, pour le détail. En mode simple :

- Ville : le thème de la carte (reconnu d'après l'identifiant d'une carte du jeu, « Libre » sinon). Il fixe les matières
  (ses pavés, sa forêt) et les éléments proposés (maisons dans la palette de la ville, son réverbère, ses plantes).
- Matières : Peindre (taille 1, 2, 3, 5), Zone, Remplir (les cases reliées de la même matière). Herbe, chemin, sable,
  hautes herbes, mer, étang : bords refaits autour de chaque coup de pinceau (planche « transitions », comme
  l'assistant). Fleurs : posées sur l'herbe libre. Pavés : motif de la ville. Forêt : par blocs de 2 x 2 calés sur la
  grille ; toute la forêt peinte est redessinée à chaque coup en rangées d'arbres (src/builder/forestLayout.js : un
  arbre entier par bloc de 2 x 2, de haut en bas ; tissu sombre seulement derrière, sur les cases qui ne touchent pas
  une case libre ; buisson sur une case hors des blocs). La gomme repeint de
  l'herbe. Clôture : posée case par case au pinceau, ou en tour de rectangle avec Zone ; chaque case prend
  l'angle, le bout ou le montant qui va avec ses voisines (montant collé à droite de la case sur le côté droit d'un
  enclos) ; une ouverture se fait à la gomme. Clôture blanche au Prytanée, à Hull et à Bordeaux. Mer, étang et forêt bloquent ; le reste libère la case.
- Éléments : un clic pose l'élément (aperçu vert, ou rouge avec la raison : sur un obstacle, sur un élément, sur une
  case importante, pas sur son sol — les bateaux, roseaux et nénuphars vont sur l'eau). Le bas bloque, le haut (toit,
  cime) passe au-dessus de Pierre, la porte d'une maison reste libre. La gomme sur un élément le retire et rend les
  collisions d'avant. Un élément posé protège ses cases du pinceau.
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
  - bordure : « Refaire la bordure d'arbres » (la forêt dense de la zone devient des rangées d'arbres entiers, même
    règle que le pinceau Forêt : forestLayout.js ; Saint-Ay est générée ainsi, identites.py forest_trees). La palette
    de la forêt (DPPt, chêne de Saint-Ay, automne de Montépilloy) est reconnue d'après ses cases ; seules les planches d'arbres comptent (pas un toit de même couleur).
    Arbres et buissons : planche « lisières » (scripts/build_lisieres.py : l'arbre de rmxp-nature, de la même famille
    que la forêt dense, une version par palette) ;
  - remplissage : « Semer des hautes herbes » (touffes rondes sur l'herbe libre, à une case des chemins, densité
    réglable, tirage à graine rejouable) et « Régénérer cette zone » (le dernier semis est retiré, un autre tirage le
    remplace, rien d'autre ne bouge).
- Aucune commande ne change les collisions ; chacune tient en un seul pas d'historique (Ctrl+Z) ; une
  commande qui ne change rien n'en laisse pas. Après chacune, l'assistant vérifie l'accessibilité depuis le départ des
  cases importantes (carte du jeu : PNJ, portes et case devant, objets, déclencheurs, props) et signale seulement ce que
  la commande a rendu inatteignable.
- Les cases peintes ou recolorées à la main (illisibles comme bord : motif de la mer, lagon de Fort-de-France) ne sont
  jamais remplacées par « Corriger les transitions ».
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
