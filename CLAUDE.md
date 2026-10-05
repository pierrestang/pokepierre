# Poképierre

# Jeu RPG Pokémon-like

## Vision
RPG 2D vue de dessus, inspiré de Pokémon Rouge Feu / Vert Feuille.
Le jeu retrace le parcours de vie de Pierre : une ville par lieu vécu (une dizaine), de Fort-de-France à Hull,
puis Hanoï. Pas de combats.

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

- Créateur de cartes (builder.html, src/builder/ ; entrée « Créateur de cartes » du menu titre) : éditeur « V2 » à
  trois calques avec collisions. En dev, les cartes sont enregistrées dans src/data/builtMaps/<id>.json et s'ouvrent dans
  le jeu avec ?carte=<id>. Les cartes de Fort-de-France à Hull sont générées par scripts/convert_maps_v2.py puis
  retouchées à la main ; --force efface ces retouches. Ordre de reconstruction : build_v2_tiles.py, puis
  convert_maps_v2.py et build_g4_library.py. Avant de changer un bâtiment : check_paths.js (les rues de Hull et
  Bordeaux sont étroites). Détails : docs/technique/createur-de-cartes.md, à lire avant de toucher au créateur, aux
  planches V2/Gen 4 ou aux cartes générées.

## Structure
- src/scenes/ : les scènes Phaser (titre, villes et routes, intérieurs, ferry, interface).
- src/data/ : les données de cartes et de contenu.
- src/systems/ : déplacement, collisions, dialogues.

## Vertus
- 8 vertus au maximum dans tout le jeu, une par ville au maximum : 6 jusqu'à Hull, 2 places réservées après Hull
  (src/data/story.js TRAITS).
- Les 6 vertus, leur ville et leur situation type : Joie de vivre (Fort-de-France : une ambiance éteinte à
  rallumer) ; Esprit d'équipe (Saint-Ay : un obstacle qu'on ne franchit qu'à plusieurs) ; Ingéniosité (Montépilloy :
  un mécanisme à réparer ou bricoler) ; Audace (collège : une situation intimidante) ; Autonomie (Prytanée : faire
  seul, sans qu'on le demande) ; Insouciance (Hull : un souci qui gâche le moment, à mettre de côté).
- Les vertus servent comme des CS : chaque ville utilise au moins une vertu déjà acquise sur la route principale, et
  une dans un passage optionnel, y compris en revenant dans les anciennes villes. Sans la bonne vertu, une réplique
  d'indice décrit la situation.

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