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
- Interface (scripts/build_ds_ui.py -> public/assets/ui/, voir src/art/uiIcons.js) : icônes d'objets et bulles
  d'émotion de HeartGold/SoulSilver (sac, objet reçu, étape `emote` des scénettes), cartes postales de la carte
  du voyage tirées des illustrations de lieux de Johto. Mont Chimnée (Rubis/Saphir) : la gare du téléphérique sert
  de ferme à M. Bouly ; caisses du marché de Slateport dans la cabane de pêche (scripts/extract_rs_buildings.py).

- Mobile (src/systems/TouchControls.js, src/systems/screen.js) : écran de jeu le plus grand possible (zoom non
  entier) ; en portrait, en haut, toute la largeur, et les
  commandes dessous ; en paysage, les commandes de chaque côté. `?touch` dans l'adresse force l'affichage tactile
  sur ordinateur. Logo (Poké Ball sur fond bleu) et icônes d'écran d'accueil : scripts/build_icons.py.

## Structure
- src/scenes/ : les scènes Phaser (ville, intérieurs, combat).
- src/data/ : les données de cartes et de contenu.
- src/systems/ : déplacement, collisions, dialogues.

## Méthode de travail
- Avancer par petits jalons jouables, un seul à la fois.
- Toujours laisser le jeu dans un état testable dans le navigateur.
- Après avoir touché une carte, un PNJ, un obstacle ou un voyage : `node scripts/check_paths.js` (aucun
  blocage à aucune étape de l'histoire).
- Demander avant d'ajouter une dépendance.