# Poképierre

# Jeu RPG Pokémon-like

## Vision
RPG 2D vue de dessus, inspiré de Pokémon Rouge Feu / Vert Feuille.
On commence par une seule ville jouable, puis on étend à une petite région.

## Stack
- Phaser 3 + Vite, JavaScript.
- Pas de framework UI supplémentaire.

## Graphismes
- Phase actuelle : graphismes provisoires uniquement (rectangles colorés 16x16, zoom x3).
- Assets Nintendo (sprites, tilesets, musiques) : autorisés, légèrement modifiés, uniquement s'ils sont
  fournis par l'utilisateur (déposés dans le projet), et pour un usage personnel. Le jeu ne doit alors
  pas être publié (GitHub Pages, itch.io…). Sans fichier fourni, tout reste dessiné dans le code.
- Le rendu des tuiles doit rester centralisé pour pouvoir brancher un vrai tileset plus tard.

## Structure
- src/scenes/ : les scènes Phaser (ville, intérieurs, combat).
- src/data/ : les données de cartes et de contenu.
- src/systems/ : déplacement, collisions, dialogues.

## Méthode de travail
- Avancer par petits jalons jouables, un seul à la fois.
- Toujours laisser le jeu dans un état testable dans le navigateur.
- Demander avant d'ajouter une dépendance.