# Poképierre

# Jeu RPG Pokémon-like

## Vision
RPG 2D vue de dessus, inspiré de Pokémon Rouge Feu / Vert Feuille.
On commence par une seule ville jouable, puis on étend à une petite région.

## Stack
- Phaser 3 + Vite, JavaScript.
- Pas de framework UI supplémentaire.

## Graphismes
- Assets Nintendo (sprites, tilesets, musiques) : autorisés, légèrement modifiés, uniquement s'ils sont
  fournis par l'utilisateur (déposés dans le projet), pour un projet de fan non commercial. Le code est sur un
  dépôt GitHub public (github.com/pierrestang/pokepierre), choix de l'utilisateur, pour le partager avec des amis.
  Jeu en ligne : https://pierrestang.github.io/pokepierre/ (`npm run deploy`, branche gh-pages).
  Sans fichier fourni, tout reste dessiné dans le code.
- Le rendu des tuiles reste centralisé (src/systems/tileRenderer.js).
- Objectif visuel : le look de Pokémon Rouge Feu / Vert Feuille, avec l'histoire de Poképierre (pas Kanto).
  Décor : planches fournies dans assets-source/frlg/, préparées par scripts/build_frlg_tiles.py vers
  public/assets/tiles/ ; src/art/frlgArt.js dit quelles tuiles utiliser (sol, bordures automatiques,
  objets, bâtiments, arbres). Ce qui n'a pas d'équivalent Rouge Feu reste dessiné dans le code (src/art/).
- Ressources de fans (assets-source/fan/) : voiture de la famille tirée de « FRLG Tilesets - Cars » de
  pinkscales (DeviantArt), libre pour un projet de fan non commercial, avec crédit à pinkscales.
- Écran : format GBA dézoomé, 360 x 240 px (22,5 x 15 cases), voir src/systems/screen.js.
- Police des dialogues et du menu : police bitmap de Rouge Feu, extraite par scripts/extract_frlg_font.py
  vers public/assets/fonts/ (voir src/systems/frlgFont.js) ; deux lignes par page, pages coupées automatiquement.
- Personnages : planches fournies par l'utilisateur dans public/assets/characters/ (voir
  src/art/spriteSheets.js) : TownsPeople2 (`t{n}`, avec portraits de dialogue) et PNJ de Rouge Feu
  (`f{n}`, extraits de assets-source/frlg-npcs.png par scripts/extract_frlg.py). Pierre = Red (`f0`).
  Attribution par nom dans src/data/characters.js. Le chat reste dessiné dans le code (src/art/characterArt.js).
  Champions d'Émeraude (`h{n}`, assets-source/gba/, extraits par scripts/extract_more_npcs.py), au choix dans
  Start > PNJ. Pas de sprites DS pour les personnages.
- Arbres : uniquement des assets (aucun arbre dessiné dans le code). Grands sapins de Rouge Feu en blocs de
  2 x 2 cases 'T' alignés sur la grille (jamais de sapin isolé) ; le petit arbre 'ƚ' seulement sur les îles et dans
  les pays exotiques, des buissons 'ƀ' ailleurs ; les palmiers 'Y' sont le petit arbre sans son herbe
  (frlg-small-tree.png), posé sur le sol de la case.
- Bateaux : uniquement des assets. Ferry de Rouge Feu ; voiliers (ports) et longs bateaux en bois (péniches) d'Émeraude,
  extraits par scripts/extract_boats.py vers public/assets/tiles/emerald-boats.png (voir tileRenderer.js addBoats).
- Interface (scripts/build_ds_ui.py -> public/assets/ui/, voir src/art/uiIcons.js) : icônes d'objets de
  HeartGold/SoulSilver (sac, objet reçu), cartes postales de la carte du voyage et images d'accueil des villes, tirées
  des illustrations de lieux de Johto. Bulles d'émotion (étape `emote` des scénettes et indice d'interaction) :
  uniquement les petites bulles blanches « ! » et « … » au signe noir, dessinées dans le code
  (src/systems/effects.js) ; pas d'autres bulles. Mont Chimnée (Rubis/Saphir) : la gare du téléphérique sert
  de ferme à M. Bouly ; caisses du marché de Slateport dans la cabane de pêche (scripts/extract_rs_buildings.py).

- Mobile (src/systems/TouchControls.js, src/systems/screen.js) : écran de jeu le plus grand possible (zoom non
  entier) ; en portrait, en haut, toute la largeur, et les
  commandes dessous ; en paysage, les commandes de chaque côté. `?touch` dans l'adresse force l'affichage tactile
  sur ordinateur. Logo (Poké Ball sur fond bleu) et icônes d'écran d'accueil : scripts/build_icons.py.

- Créateur de cartes (builder.html, src/builder/ ; entrée « Créateur de cartes » du menu titre) : nouveau design
  « V2 ». Planches déposées par l'utilisateur dans ASSETTILESPOKEMONV2/ (ressources de fans DeviantArt : ekat99,
  magiscarf, WesleyFG, phyromatical, adalkroofs… à créditer), préparées par scripts/build_v2_tiles.py vers
  public/assets/v2/ (cases de 16 px + catalog.json). Trois calques (sol, décor bloquant, au-dessus de Pierre),
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
  Versions V2 des cartes de Fort-de-France à Hull : générées par scripts/convert_maps_v2.py (lit les cartes du jeu
  via scripts/export_maps.mjs ; bordures des sols assemblées dans public/assets/v2/auto.png), puis retouchées à la main
  dans le créateur. Le script garde les cartes déjà là (--force ou --force=<id> pour les refaire) et la numérotation
  des cases assemblées (public/assets/v2/auto.json) : des cartes retouchées dans le créateur s'en servent.
  Fort-de-France du jeu utilise sa carte du créateur (map.built) : dessin cuit au chargement (systems/builtMaps.js
  applyBuiltLook), collisions du dessin, grille d'origine (sourceGrid) accordée à ces collisions (maps/builtGrid.js)
  pour la logique (portes, eau, hautes herbes) ; ses bâtiments Rouge Feu ne sont plus dessinés.
  Thème DS (Diamant / Perle, scripts/ds_theme.py) : planche DPPt d'akizakura16 (sols, arbres, clôtures, maisons),
  palmiers de la planche Jungle recolorés, ferry = yacht de Kyle-Dove (planche « objets », détourée par
  build_v2_tiles.py). Appliqué à Fort-de-France.
  Thème Gen 4 (scripts/g4_theme.py), les sept autres cartes de Saint-Ay à Hull, branchées dans le jeu comme
  Fort-de-France (map.built, sourceGrid, sourceBuildings) : uniquement des planches Gen 4 (dppt, autotiles-g4, g4-<type>).
  Le dessin suit la grille du jeu : forêt dense DPPt pour les 'T', blé, pavés et bitume en ville, terrain de foot ; un
  bâtiment Gen 4 par type du jeu (BUILDINGS, BUILDING_OF_TYPE, variantes par ville dans THEMES), porte posée sur la
  porte du jeu, collisions sur la hauteur de l'emprise (le haut du toit passe devant Pierre). Avant de changer un
  bâtiment, vérifier qu'il ne bloque ni PNJ ni passage (check_paths.js) : les rues de Hull et Bordeaux sont étroites.
  Refaire : python3 scripts/convert_maps_v2.py --force=<id> (efface les retouches faites dans le créateur).
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
  Calque automatique (builder.js placementOf) : pour la bibliothèque Gen 4, chaque case connaît son élément (objets
  séparés au pixel près, fichiers g4-<type>.elements.json) ; calque et collisions selon le type et la rangée de la case
  dans l'élément (cime d'arbre et toit au-dessus de Pierre, pied bloquant, ponts et fleurs franchissables, eau
  bloquante, bords de sol par-dessus le sol), quelle que soit la sélection. Autres planches : d'après la sélection.

## Structure
- src/scenes/ : les scènes Phaser (ville, intérieurs, combat).
- src/data/ : les données de cartes et de contenu.
- src/systems/ : déplacement, collisions, dialogues.

## Méthode de travail
- Avancer par petits jalons jouables, un seul à la fois.
- Toujours laisser le jeu dans un état testable dans le navigateur.
- Après avoir touché une carte, un PNJ, un obstacle ou un voyage : `node scripts/check_paths.js` (aucun
  blocage à aucune étape de l'histoire).
- Après avoir touché une carte du créateur : `python3 scripts/audit_maps.py` (murs invisibles, objets traversables,
  hautes herbes de la grille sans dessin, poches inaccessibles). Sous un toit ou une cime (calque « au-dessus de
  Pierre »), le jeu montre la silhouette du joueur (MapScene.updateSilhouette) ; ses jambes dans les hautes herbes sont
  cachées par le bas de la case dessinée, seulement si elle a vraiment des herbes (effects.js GrassCovers).
- Demander avant d'ajouter une dépendance.