# Intérieurs Gen 4

Depuis octobre 2026, toutes les pièces du jeu sont redessinées avec les planches de la 4e génération (Diamant, Perle,
Platine, HeartGold, SoulSilver), comme les cartes extérieures du créateur.

## Principe

- `scripts/build_interiors.py` dessine chaque pièce décrite dans `scripts/interieurs_plans.py` (vocabulaire commun :
  murs, sols, meubles, outils de découpe) et dans `scripts/interieurs/<groupe>.py` (une ville ou un groupe de villes :
  ses meubles en plus et le plan de chaque pièce).
- Sortie : `src/data/builtInteriors/<id>.json`, au format des cartes du créateur (calques sol / décor / au-dessus de
  Pierre, collisions), et `src/data/builtInteriors/index.js` (imports statiques, lus par Vite et par Node).
- Toutes les cases utilisées sont copiées dans `public/assets/v2/interieurs.png` (planche masquée du créateur) : refaire
  la bibliothèque Gen 4 ne déplace rien. Les cases déjà dans la planche gardent leur numéro.
- Le jeu (fin de `src/data/maps/interiors.js`) branche chaque dessin sur son intérieur : `built`, le rendu Rouge Feu et
  les meubles de `decor` ne sont plus dessinés ; la grille d'origine reste la référence logique (`sourceGrid` : tapis de
  sortie, escaliers), accordée aux collisions du dessin (`builtGrid.js interiorGrid` : 'm' là où un meuble bloque, 'o'
  là où le dessin libère une case). `BootScene` charge la planche (`preloadBuiltLooks(interiors)`).

## Écrire une pièce

```python
'hullPubA': {
    'wall': 'cabine', 'floor': 'bois-roux',
    'items': [['bar-7', 1, 4], ['pompes', 2, 3, {'dy': -6}], …],
},
```

- `wall` / `floor` : noms de `WALLS` / `FLOORS` (planche dppt-int : un mur = face + plinthe, deux rangées, sur les
  rangées 'X' du haut de la grille ; un sol = une case répétée). Les cases 'X' qui ne touchent pas le sol sont noires.
- `items` : `[meuble, x, y, options]`, (x, y) = la case du pied du meuble (en bas à gauche). Un meuble au mur a son pied
  sur la plinthe (y = 1). Le haut d'un meuble debout au milieu de la pièce passe au-dessus de Pierre.
- Meubles (`ITEMS`) : `img` (image en cases entières : `meuble(i)` de g4-int-meubles, `crop`, `rect` au pixel près,
  `stretch` pour allonger un comptoir, ou un dessin PIL dans le style Gen 4), `solid` (rangées du bas qui bloquent),
  `solid_top` (rangées du haut, un comptoir vu de face), `flat` (rien au-dessus de Pierre), `top` (suspendu, toujours
  au-dessus), `dx` / `dy` (décalage en pixels : un objet posé sur un meuble), `bed` (lit où dort un PNJ `inBed` : le
  bas du lit passe au-dessus des personnages, `built.beds` dit où le coucher ; voir `frlgArt.bedAt`).
- Pièce : `free` / `block` (cases forcées), `void` (cases noires en plus), `mat` (tapis de sortie).
- Escaliers (communs à toutes les pièces, `interieurs_plans.stairs_up` / `stairs_down`, style HeartGold/SoulSilver,
  une case de large) : `escalier-monte` (les marches s'enfoncent dans le mur, posé sur la case η) et `escalier-descend`
  (trémie dans le sol contre le mur, sur la case ξ), en bois (`-clair` : bois clair) ou en béton (`-gris` : collège,
  Prytanée). La case reste libre (déclencheur de l'escalier). Au collège, chaque escalier qui monte arrive en haut au
  même endroit (droite, puis gauche, en alternance).

## Hull : vraies pièces HGSS (octobre 2026)

Les pièces de Hull (sauf l'université, retouchée dans le créateur) partent de vraies pièces de HeartGold / SoulSilver
(scripts/interieurs/hull.py) : premier pub = salon de la tour Radio de Doublonville (comptoir en U : le barman dedans, on
lui commande par-dessus le comptoir, cases '#' de la grille) ; second pub = maison de Fargas à Écorcia ; The Asylum =
salon du casino de Doublonville agrandi à 25 x 18 (`stretched` : colonnes et rangées de motif pur insérées, case par case,
`blocked` rebloque les meubles collés après les cases libérées), avec le bar et le studio de la tour Radio ; bibliothèque
= labo des Ruines Alpha ; chez Léo = grand salon de Bourg Geon (sortie sur le côté) ; coloc = appartement de Doublonville
et le lit de la chambre de Bourg Geon. Grilles, PNJ, sorties et piste de danse recalés dans interiors.js et hullStory.js
(PUB_A_EXIT, PUB_B_EXIT, PUB_B_SEATS, ASYLUM_SPOTS, DANCE_FLOOR).

## Retoucher une pièce dans le créateur

« Ouvrir » liste aussi les intérieurs du jeu (« intérieur »). Une pièce s'ouvre en mode case par case, sur le rayon
« Intérieurs » de la palette (planche « interieurs », g4-int-sols, g4-int-meubles, et les planches d'origine dppt-int,
hgss-int, jesus-3, jared-bateaux). « Enregistrer » l'écrit dans src/data/builtInteriors/<id>.json (serveur de dev,
`/__builder/interieurs`, même protection contre l'écrasement que les cartes) et la marque `retouche: true` :
`build_interiors.py` ne la redessine plus (il l'annonce), sauf avec `--force`. On ne crée pas d'intérieur dans le
créateur : la pièce doit exister dans src/data/maps/interiors.js. « Tester » ouvre la pièce dans le jeu, dans son contexte
(PNJ, scénettes ; on en sort dans sa ville).

Les PNJ placés dans le créateur (outil PNJ, voir createur-de-cartes.md) sont enregistrés dans `npcEdits` du JSON ;
`build_interiors.py` les garde toujours, même avec `--force`.

## Contrôles

`python3 scripts/build_interiors.py [id…] [--essai] [--apercu <dossier>]` signale, pour chaque pièce : PNJ sur une case
bloquée, sortie ou escalier bloqué ou inatteignable depuis l'arrivée, PNJ ou objet inabordable, et les cases dont le
blocage change par rapport à la grille d'origine. `--essai` ne touche à rien dans le projet (aperçus seulement), pour
travailler à plusieurs. Ensuite : `node scripts/check_paths.js`.

## Sources

Planches de ASSETTILESPOKEMONV2 (voir son README et `credits/`) : DPPt d'akizakura16 (murs, sols, meubles), cabine de
yacht de terriblejared (pubs : bois sombre, fenêtres, fauteuils verts, laiton), JesusCarrasco, ultimatetraveler.
Ce qui manque est dessiné dans les fichiers de groupe, dans le style Gen 4 (cible de fléchettes, pompes à bière,
néons, cabine de DJ, piste lumineuse, boule à facettes…).

## Sans ombres (octobre 2026)

Même direction artistique qu'à l'extérieur (scripts/remove_shadows.py) : aucune ombre portée. build_interiors.py
(`no_shadow`) retire les pixels noirs semi-transparents de chaque case (calques Shadow des pièces HGSS, ombres sous les
meubles et les objets dessinés) ; le Packer nettoie aussi les cases déjà dans la planche `interieurs`, si bien que les
pièces retouchées dans le créateur en profitent sans être redessinées. Les planches d'intérieurs de la palette du
créateur (dppt-int, hgss-int, jesus-3) sont nettoyées de la même façon par build_v2_tiles.py (NO_SHADOW).

## Catalogue des intérieurs du créateur (octobre 2026)

Le mode simple du créateur a son propre catalogue pour les pièces, sur le modèle de celui des extérieurs
(catalogue.json) : public/assets/v2/catalogue-int.json et sa planche catalogue-int.png (entrée « catalogue-int » de
catalog.json), écrits par `python3 scripts/build_interior_catalogue.py [--apercu <dossier>]` à partir des données curées
de scripts/interieurs/catalogue_int.py. Vérification : `python3 scripts/check_interior_catalogue.py`.

- Thèmes par type de pièce : libre (« Tout »), maison, ecole, bureau, cafe, boutique, atelier, temple, sante.
- Matières : 17 sols (`kind: 'pattern'`, motif 2 x 2) et 9 murs (`kind: 'wall'`, bande de 2 colonnes x 2-3 rangées, du
  haut du mur à la plinthe, posée d'un coup à partir de la rangée cliquée), pris dans les calques Floor et Wall_A des
  pièces HGSS.
- Éléments (175) : lits, assises, rangements, cuisine, electro, plantes, tapis, deco (murale), acces (escaliers, tapis de
  sortie), metier (pupitres, comptoirs, bar, autels…), divers. Sources : les meubles des calques Props des cartes Tiled
  du pack HGSS de SirMaIo, isolés au pixel près (`('hg', carte, x, y, w, h)` : le morceau d'un seul tenant dont les
  cases font ce rectangle ; `'hgmur'` pour la déco des calques Wall_B…), et une sélection des objets dessinés pour le
  projet (`('item', nom)`, interieurs_plans.ITEMS). Collisions des meubles HGSS : le calque passages sur les cases
  occupées ; rangées du haut qui ne bloquent pas = au-dessus de Pierre (`over`).
- Règles : aucune ombre portée (no_shadow), rien d'identifiable Pokémon (machines du labo, PC, Poké Balls, statues).
- Planche qui ne fait que grandir (les numéros déjà utilisés par des pièces retouchées ne bougent pas) ; relancer le
  script ne change rien si les données n'ont pas changé.

## Intérieurs partagés : les modèles (octobre 2026)

Une pièce reprise par plusieurs cartes (la maison familiale de Fort-de-France à la Corse, la chambre de Pierre, la
maison de Léo à Hull et ses reprises) n'est dessinée qu'une fois : un modèle, src/data/builtInteriors/modeles/<id>.json
(dessin complet, nom de type « Maison type 1 »). Le JSON de chaque pièce qui le reprend est une fiche :

    { "id", "name", "modele": "<id>", "ajouts"?: { "sheets": [...], "cells": { "<i>": { "sol"?, "decor"?, "dessus"? } },
      "solid": { "<i>": 0 | 1 } }, "spawn"?, "beds"?, "npcEdits"? }

`ajouts` : ses différences propres, case par case (une case citée remplace celle du modèle dans ce calque ; numéros de
planche rapportés à `ajouts.sheets`) — cartons de déménagement à Fort-de-France, oreiller passé sous Fanny à Saint-Ay,
escalier bloqué chez Felix et en Corse, haltères chez Paul. src/data/builtInteriors/compose.js recompose la pièce
(composeInterior) ; index.js (généré) exporte MODELES et BUILT_INTERIORS déjà recomposés : le jeu, check_paths.js et les
scripts d'export voient des pièces complètes. scripts/interior_models.py en est le double Python (compose, fiche) et :
- `python3 scripts/interior_models.py share <id> "<Nom du type>" <pièce de base> <pièces…>` : fait du dessin de la pièce
  de base un modèle et des pièces des fiches, chacune avec ses différences calculées ;
- `python3 scripts/interior_models.py list` : les modèles et leurs pièces.

Modèles actuels : maison-type-1 (Maison type 1 : ffHouse, playerHouse, montHouse, felixHouse, corseParents,
corseVoisins), chambre-type-1 (Chambre type 1 : ffHouseUp, playerHouseUp, montHouseUp), maison-type-2 (Maison type 2 :
hullHouse, maisonCommune, hanoiHome, appartRemi, yanisAppart, hullColoc, studioPaulfit, parisAppart).

Générateur (build_interiors.py) : une fiche n'est jamais redessinée (on modifie le modèle dans le créateur) ; un plan
peut déclarer `'modele': ('<id>', '<Nom du type>')` : le dessin va dans le modèle (une fois par passage, gardé s'il a été
retouché, sauf --force) et la pièce devient une fiche (pour des pièces de même plan : dortoirs, salles de KEDGE…).
`python3 scripts/build_interiors.py --index` réécrit seulement l'index des pièces (index.js).

## Collège et KEDGE (octobre 2026)

scripts/interieurs/montepilloy_college.py. Salles : la classe de l'école de Mauville (HGSS), fenêtres en arc remplacées
par de petites fenêtres carrées (`mc-fenetre`, aux couleurs de la classe), coin carrelé de droite remis en parquet
(`CLASS_FLOOR`). Escaliers : ceux des étages de la Tour Radio de Doublonville (calque Props), dans les coins du haut,
retournés en miroir à droite ; posés en deux morceaux (`stairs()` : le haut au-dessus du mur, `top`, le bas à plat sur
le sol) ; on passe par la dernière marche (rangée 3 : `η` monte, `ξ` descend dans la grille du jeu), on arrive juste
en dessous (rangée 4). Couloir des casiers : le haut de la classe (15 x 6), casiers d'école dessinés ici (`mc-casier`),
placard de l'entrepôt, feuille punaisée du labo d'Orme. KEDGE : les mêmes plans (`PLANS.update` : kedge, kedgeCasiers,
kedgeSalle1-3).
