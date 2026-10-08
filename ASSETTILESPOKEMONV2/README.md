# Assets Gen 4 (DS) du créateur de cartes

Uniquement des ressources au style de la 4e génération (Diamant, Perle, Platine, HeartGold, SoulSilver). Les planches
Gen 3 (GBA), Gen 5 (Noir / Blanc), les doublons et les aperçus JPEG rééchantillonnés ont été retirés le 6 octobre 2026
(voir docs/technique/assets-gen4.md pour le détail et les raisons).

Ressources de fans (DeviantArt, eeveeexpo) : à créditer à leur auteur, voir `credits/` et le nom de chaque fichier
(`<contenu>_<auteur>.png`).

```
tilesets/                planches de cases, préparées par scripts/build_v2_tiles.py -> public/assets/v2/
  exterieurs/            sols, eau, végétation, rochers, clôtures (DPPt d'akizakura16, Kyle-Dove, Kaliser, LotusKing,
                         JesusCarrasco, WilsonScarloxy, RMXP Nature / Urbain, Gen 4 Pack)
  batiments/             maisons, centres, arènes (RMXP Buildings, Sinnoh de Kyle-Dove, LotusKing / Aigue--marine)
  interieurs/            sols, murs et meubles (DPPt d'akizakura16, HGSS d'ultimatetraveler, JesusCarrasco)
  mixtes/                grande planche DPPt + HGSS de justin8964 (extérieurs, objets, bâtiments)
  vehicules/             bateaux, ferries, caravanes, tentes (terriblejared)
autotiles/               cases animées et bordures automatiques (hautes herbes, chemin, fleurs, mer, reflets)
animations/              portes animées, drapeaux et fanions, effets Gen 4 (éclaboussures, poussière, fonds titre)
personnages/             sprites de déplacement Gen 4 (non branchés au jeu : les personnages restent ceux de Rouge Feu)
references/              pièces de Diamant / Perle et cartes d'exemple (modèles, pas des planches à découper)
credits/                 crédits des compilations
```

Dans l'éditeur, les éléments de ces planches sont rangés par type (scripts/build_g4_library.py) : Sols et chemins,
Eau, Végétation (arbres, herbes et buissons, fleurs et plantes), Relief, Bâtiments, Mobilier urbain (mobilier,
clôtures, ponts et pontons), Décor (bateaux et véhicules), Intérieurs.

Ordre de reconstruction : `python3 scripts/build_v2_tiles.py`, puis `scripts/convert_maps_v2.py` et
`scripts/build_g4_library.py`.
