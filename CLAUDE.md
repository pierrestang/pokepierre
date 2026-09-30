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
  fournis par l'utilisateur (déposés dans le projet), et pour un usage personnel. Le jeu ne doit alors
  pas être publié (GitHub Pages, itch.io…). Sans fichier fourni, tout reste dessiné dans le code.
- Le rendu des tuiles reste centralisé (src/systems/tileRenderer.js).
- Objectif visuel : le look de Pokémon Rouge Feu / Vert Feuille, avec l'histoire de Poképierre (pas Kanto).
  Décor : planches fournies dans assets-source/frlg/, préparées par scripts/build_frlg_tiles.py vers
  public/assets/tiles/ ; src/art/frlgArt.js dit quelles tuiles utiliser (sol, bordures automatiques,
  objets, bâtiments, arbres). Ce qui n'a pas d'équivalent Rouge Feu reste dessiné dans le code (src/art/).
- Écran : format GBA dézoomé, 360 x 240 px (22,5 x 15 cases), voir src/systems/screen.js.
- Police des dialogues et du menu : police bitmap de Rouge Feu, extraite par scripts/extract_frlg_font.py
  vers public/assets/fonts/ (voir src/systems/frlgFont.js) ; deux lignes par page, pages coupées automatiquement.
- Personnages : planches fournies par l'utilisateur dans public/assets/characters/ (voir
  src/art/spriteSheets.js) : TownsPeople2 (`t{n}`, avec portraits de dialogue) et PNJ de Rouge Feu
  (`f{n}`, extraits de assets-source/frlg-npcs.png par scripts/extract_frlg.py). Pierre = Red (`f0`).
  Attribution par nom dans src/data/characters.js. Le chat reste dessiné dans le code (src/art/characterArt.js).

## Structure
- src/scenes/ : les scènes Phaser (ville, intérieurs, combat).
- src/data/ : les données de cartes et de contenu.
- src/systems/ : déplacement, collisions, dialogues.

## Méthode de travail
- Avancer par petits jalons jouables, un seul à la fois.
- Toujours laisser le jeu dans un état testable dans le navigateur.
- Demander avant d'ajouter une dépendance.