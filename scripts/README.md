# Scripts de Poképierre

Rangés par rôle (les fichiers restent à plat dans `scripts/` : ils s'importent entre eux et la doc les cite par leur
chemin). Chaque script a sa notice en tête de fichier.

## À lancer souvent

| Script | Rôle |
| --- | --- |
| `check_paths.js` | Vérifie que l'histoire n'est bloquée nulle part (après toute retouche de carte, PNJ, porte…). |
| `audit_maps.py` | Audit des cartes du créateur : murs invisibles, objets traversables, poches, taille impaire. |
| `remove_shadows.py` | Retire les ombres des bâtiments et objets sur les cartes du créateur (sans risque à relancer). |
| `outline_buildings.py` | Pose le liseré gris très foncé autour des bâtiments et objets (sans risque à relancer). |
| `deploy.sh` | Publication du jeu en ligne (`npm run deploy`). |

## Planches et catalogue du créateur

Ordre de reconstruction : `build_v2_tiles.py`, puis `convert_maps_v2.py` et `build_g4_library.py`, puis
`build_transitions.py`, `build_lisieres.py`, `build_catalogue.py`.

| Script | Rôle |
| --- | --- |
| `build_v2_tiles.py` | Planches V2 (DPPt, packs Gen 4) et `catalog.json`. |
| `build_g4_library.py` | Bibliothèque Gen 4 rangée par type d'élément (`g4-*.png`). |
| `build_transitions.py` | Planche des bords automatiques entre matières (assistant). |
| `build_lisieres.py` | Arbres des bordures (arbre rond par palette, arbres au choix). |
| `build_catalogue.py` | Catalogue du mode simple : matières, maisons, mobilier, arbres, plantes. |
| `harvest_map_elements.py` | Relève sur les cartes les dessins absents du catalogue (candidats à nommer). |
| `g4_theme.py`, `ds_theme.py`, `identites.py`, `fdf_ds_v2.py`, `g4_enrich.py` | Bibliothèques de dessin des cartes générées (palettes, bâtiments, thèmes). Leurs fonctions de génération repartent des cartes d'origine et **effaceraient les retouches faites dans le créateur** : ne les relancer qu'en connaissance de cause. |
| `convert_maps_v2.py`, `export_maps.mjs` | Conversion des cartes du jeu en cartes du créateur (`--force` efface les retouches). |
| `export_audit.mjs`, `export_story_points.mjs` | Exports des données du jeu pour les scripts Python. |

## Assets du jeu (hors créateur)

| Script | Rôle |
| --- | --- |
| `build_gen4_npcs.py` | Planche des personnages Gen 4 (`gen4-npcs.png`). |
| `build_frlg_tiles.py`, `extract_rs_buildings.py`, `extract_frontier.py`, `extract_boats.py` | Tuiles Rouge Feu / Rubis-Saphir / Émeraude des cartes non redessinées et des intérieurs. |
| `extract_frlg_font.py` | Police des dialogues. |
| `build_ds_ui.py` | Icônes d'objets et cartes postales. |
| `build_fanions.py` | Guirlandes de fanions. |
| `build_icons.py` | Logo et icônes d'écran d'accueil. |
| `build_amsterdam.py` | Amsterdam en Gen 4 : `src/data/builtMaps/amsterdam.json` (canaux, maisons de canal, manoir, fontaine ; thème « Amsterdam » du catalogue). `--force` : refait la carte même si elle a été retouchée. |
| `build_paris.py` | Paris en Gen 4 : `src/data/builtMaps/paris.json` (opéra, Grand Palais, Seine, Notre-Dame, Bercy ; thème « Paris » du catalogue). `--force` : refait la carte même si elle a été retouchée. |
| `build_new_delhi.py` | New Delhi en Gen 4 : `src/data/builtMaps/new-delhi.json` (palais, université à coupole, India Gate, bazar ; thème « New Delhi » du catalogue). `--force` : refait la carte même si elle a été retouchée. |
| `paint_forest.mjs` | Dessine la forêt d'une carte du créateur (`studio.forest`) comme le pinceau Forêt : `node scripts/paint_forest.mjs <id>`. |
| `build_airport.py` | L'aéroport en Gen 4 : `src/data/builtMaps/airport.json` et sa planche `aeroport.png` (avions, guichet, salle d'attente ; meubles de TobalCR). À relancer après `build_travel_art.py` (l'avion du tarmac). |
| `build_travel_art.py` | Trajet en avion : l'avion de ligne, les nuages, l'océan vu d'altitude (`public/assets/travel/`). |
| `build_party_mess.py` | Le désordre du lendemain de soirée à Bordeaux (`public/assets/props/desordre.png`). |
| `pixels.py` | Petits outils de détourage partagés. |
