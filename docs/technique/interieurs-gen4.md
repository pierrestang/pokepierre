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
