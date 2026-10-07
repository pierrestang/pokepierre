# Assets d'intérieur au style DS (inventaire, octobre 2026)

Recherche du 7 octobre 2026 : des intérieurs au plus près des vrais jeux DS (Diamant / Perle / Platine, HeartGold /
SoulSilver), pour refaire les pièces du jeu sur de vraies références plutôt qu'en générant des agencements. Crédits
détaillés dans ASSETTILESPOKEMONV2/credits/ (sirmaio.txt, julieharu.txt, spriters-resource.txt).

## Ce qui a été retenu

### 1. Pack HGSS de SirMaIo (le cœur du fonds)

« Pokemon for Tiled - HGSS Pack » (SirMaIo, 2024) : tous les intérieurs de HeartGold / SoulSilver ripés depuis le jeu,
nettoyés et rangés en planches, plus les cartes Tiled des intérieurs (les agencements exacts du jeu).

- **Planches** : ASSETTILESPOKEMONV2/tilesets/interieurs/hgss-sirmaio/ (59 PNG, dont borders.png pour les bords noirs des pièces ; noms d'origine gardés : les .tsx y
  renvoient).
  - **Échelle ×2** : cases de 32 px (format RPG Maker XP) ; à réduire de moitié (au plus proche) pour nos cases de 16 px.
  - **Fond** : rose (240, 91, 161) à rendre transparent ; jaune (255, 245, 104) = case vide ; rouge-orangé = emplacements
    de personnages / portes animées (RMXP), à ignorer.
  - Deux familles de fichiers :
    - les planches propres utilisées par les cartes Tiled : `i_Basic_Houses`, `i_Goldenrod`, `i_Goldenrod Radio`,
      `i_Pokemon School`, `i_Daycare`, `i_Elevator`, `i_Mr Pokemon`, `i_Park Gate`, `i_Sprout Tower`, `i_Ruins of Alph
      Lab`, `i_Olivine_Lighthouse`, `i_Battle-Frontier`, les arènes (`i_Azalea Gym`, `i_Goldenrod Gym`, `i_Violet Gym`),
      `HGSS_Newbark-int`, `HGSS_Azalea-int`, `HGSS_PC_Mart_Gate` (Centre Pokémon, Boutique, portiques) ;
    - les versions publiées sur DeviantArt, une par lieu, avec un bandeau titre en haut (`i_Olivine-Café`,
      `i_Game-Corner`, `i_Dance-Theatre`, `i_Department-Store`, `i_Radio-Station`, `i_Train-Station`, `i_Tent`,
      `i_Team-Rocket-HQ`, `i_Warehouse`, `i_Burned-Tower`, `i_Bell-Tower`, `i_Pharmacy`, `i_Photo-Booth`, `i_Flower-Shop`,
      `i_Souvenir-Shop`, `i_Bike-Shop`, `i_Kurt-House`, `i_Charcoal-Kiln`, `i_Moomoo-Farm`, `i_Player-House`,
      `i_Rival-House`, `i_Elm-Lab`, `i_School`, `i_Basic-House-01..03`, `i_Mart`, `i_Pokemon-Center`, `i_Gate`,
      `i_National-Park-Gate`, `i_Barrier-Station`, `i_Olivine-Port`, `i_Underground-Tunnel`, `i_Dragon's-Den`,
      `i_Bell-Tower-Roof`). Le bandeau (première rangée de 32 px) n'est pas une case.
  - Contenu : murs (faces, plinthes, angles, haut de mur en biais des maisons), sols, fenêtres à rideaux, escaliers et
    escalators, comptoirs, tables, chaises, canapés, lits, télés, PC, frigos, éviers, bibliothèques, plantes, tapis de
    sortie, tableaux verts, bureaux, machines à sous, scène de théâtre, guichets de gare, autels de tour, etc.
  - **Qualité DS** : excellente (ce sont les cases du jeu, palette et contours d'origine).
- **Cartes Tiled** : references/hgss-interieurs/tiled/Maps/ (65 .tmx, dont les Centres Pokémon et Boutiques de chaque
  ville, les maisons de Bourg Geon / Ville Griotte / Mauville / Écorcia, l'école de Mauville, les intérieurs de Doublonville
  (grand magasin, Game Corner, tour Radio, gare, entrepôt, boutiques, théâtre), le phare, la Tour Chétiflor, la pension,
  le labo des Ruines Alpha, le Château de combat) et leurs .tsx.
- **Rendus** : references/hgss-interieurs/*.png, une image par carte, à l'échelle du jeu (cases de 16 px), produite par
  `references/hgss-interieurs/tiled/render_tmx.py` (fonds rose et jaune retirés ; les croix jaunes de certaines cartes
  sont des repères de l'éditeur). Ce sont les références d'agencement à reproduire : proportions des pièces, place des
  meubles, palette.

### 2. Autres planches

| Fichier | Source, auteur | Licence | Contenu, qualité |
|---|---|---|---|
| tilesets/interieurs/centre-pokemon-hgss_sirmaio.png | DeviantArt, SirMaIo (« HGSS Pokemon-Center ») | crédit demandé | Centre Pokémon de Johto / Kanto, salle Wi-Fi, salle d'union : murs, guichet, escalator, logo au sol. ×2, fond rose. Excellente. |
| tilesets/interieurs/game-corner-celadon-hgss_julieharu.png | Eevee Expo, ripé par spaceemotion, assemblé par JulieHaru | ressource publique, créditer les deux | Game Corner de Céladopole : sol orange, mur, machines à sous, comptoir. 16 px (×1), transparent. Excellente. |

### 3. Rips de pièces (références)

references/ds-pieces/ (The Spriters Resource, voir credits/spriters-resource.txt) : Centre Pokémon de Diamant / Perle
(trois variantes, Gamedude), restaurant de l'hôtel Grand Lac (Platine : tables, rideaux, colonnes — modèle de
brasserie / bistrot), Palais de combat (Platine : scène, public en gradins — modèle de salle de concert / stade), pièce de
Motisma (Platine : garage / atelier). S'ajoutent les références déjà présentes : maison du héros et labo du professeur
(Diamant / Perle).

## Type de lieu → planches et références utiles

| Lieu du jeu | Planches | Références d'agencement |
|---|---|---|
| Maison, chambre, cuisine (Fort-de-France, Saint-Ay, Montépilloy, appartements) | hgss-sirmaio/i_Basic_Houses, HGSS_Newbark-int, HGSS_Azalea-int, i_Player-House, i_Rival-House, i_Basic-House-01..03, i_Kurt-House | 001i_Newbark houses, 003i_Cherrygrove Houses, 006i_Violet houses, 010i_Azalea Houses, 012i_Goldenrod interiors ; dp-maison-du-heros |
| École, collège, salle de classe, amphi | i_Pokemon School, i_School | 006i_Violet School |
| Bar, pub, café, bistrot | i_Olivine-Café (comptoir, tables, chaises, bouteilles), i_Pharmacy (comptoir bois), i_Basic_Houses | pt-grandlakehouse-restaurant ; café d'Oliville (pas de carte Tiled : planche seule) |
| Boîte de nuit, casino | game-corner-celadon-hgss_julieharu, i_Game-Corner, i_Goldenrod (Game Corner), i_Dance-Theatre (scène, lanternes) | 012i_Goldenrod game corner, 012i_Goldenrod interiors (théâtre) |
| Hall d'entrée, réception, accueil | HGSS_PC_Mart_Gate, centre-pokemon-hgss_sirmaio, i_Pokemon-Center, i_Gate, i_National-Park-Gate, i_Park Gate | Centres Pokémon de toutes les villes, 013i_Park-Pokéathlon Gate ; dp-centre-pokemon |
| Bibliothèque | bibliothèques des maisons, de l'école et de la tour Radio (i_Goldenrod Radio), i_Kurt-House | 012i_Goldenrod radio tower, 006i_Violet School |
| Bureau, entreprise, open space | i_Goldenrod Radio, i_Radio-Station, i_Team-Rocket-HQ, i_Elevator (ascenseur) | 012i_Goldenrod radio tower |
| Hôpital, labo | HGSS_PC_Mart_Gate, i_Elm-Lab, i_Ruins of Alph Lab, i_Pharmacy | 001i_Newbark-Lab, 074i_Ruins of Alph Lab ; dp-labo-du-professeur |
| Temple, monastère | i_Sprout Tower, i_Sprout-Tower, i_Burned-Tower, i_Bell-Tower | 006i_Sprout Tower |
| Salle de concert, scène, stade | i_Dance-Theatre, i_Battle-Frontier, i_Goldenrod Gym | 999i_Battle Castle ; pt-battle-hall |
| Dortoir | lits et armoires des maisons (i_Basic_Houses, HGSS_Newbark-int), i_Daycare | 011i_Daycare, maisons |
| Aéroport, gare, agence de voyage | i_Train-Station (quais, guichets, portiques), i_Gate, HGSS_PC_Mart_Gate | 012i_Goldenrod station |
| Salle de sport | i_Warehouse, arènes (i_Goldenrod Gym, i_Azalea Gym) | 012i_Goldenrod Gym |
| Boutique, grand magasin | i_Department-Store, i_Mart, i_Souvenir-Shop, i_Flower-Shop, i_Bike-Shop | 012i_Goldenrod department store, boutiques des villes |
| Grange, ferme | i_Moomoo-Farm, i_Charcoal-Kiln | — |
| Tente | i_Tent | — |
| Garage, atelier | i_Bike-Shop, i_Warehouse | pt-rotom-room |

## Ce qui manque encore

- **Intérieurs Diamant / Perle / Platine redistribuables** : le pack Platine de SirMaIo
  (https://www.deviantart.com/sirmaio/art/Pokemon-for-Tiled-Platinum-Pack-1049749139) ne contient que des extérieurs
  (bâtiments, accessoires, nature). Les intérieurs DPPt du projet viennent d'Akizakura16 (voir « Licences »).
- **Boîte de nuit à proprement parler** (piste de danse, cabine de DJ, néons) : rien d'existant en Gen 4 ; s'appuyer sur le
  Game Corner (sols et murs vifs, machines) et le théâtre de Doublonville (scène, éclairages), et compléter.
- **Pub anglais** (pompes à bière, cible de fléchettes) : le café d'Oliville et le restaurant du Grand Lac donnent le
  mobilier ; les accessoires restent à dessiner.
- **Casiers d'école, matériel de sport, lits superposés, salle d'examen moderne, autels bouddhistes** : à composer
  à partir des cases existantes ou à dessiner dans la même palette.

## Licences à surveiller

- **Akizakura16** (ASSETTILESPOKEMONV2/tilesets/interieurs/dppt-interieurs_akizakura16.png, déjà dans le projet) : les
  conditions de son « 4th gen Indoor Tileset » interdisent la redistribution de tout ou partie des planches
  (« I do not give permission to reupload/redistribute all or parts of these sets ») et tout projet qui rapporte de
  l'argent (dons, publicité). Le dépôt étant public, ce fichier et les cases qui en sont tirées sont en contradiction
  avec ces conditions : à remplacer en priorité par les planches HGSS de SirMaIo.
- **SirMaIo** : « modifier tout et partager le lien du Google Drive, sans s'approprier le travail ». Il n'interdit pas la
  redistribution mais ne la mentionne pas : le crédit est indispensable (credits/sirmaio.txt).
- **DonLawride** (HGSS Center and Mart Tiles) : CC BY-NC-ND 3.0, pas de modifications permises : écarté.
- **chimcharsfireworkd** (Interior Tileset, CC BY 3.0, compilation de cases publiques) : licence correcte, mais seul un
  aperçu JPEG réduit est accessible sans compte DeviantArt ; non retenu.
- **TobalCR** (aeroport_tobalcr.png, déjà dans le projet) : style Noir & Blanc (Gen 5), à remplacer par la gare de
  Doublonville (i_Train-Station) si on veut rester strictement Gen 4.
- Graphismes ripés (SirMaIo, spaceemotion, Gamedude) : Nintendo / Game Freak ; utilisés pour ce projet de fan non
  commercial (choix de l'utilisateur, CLAUDE.md), toujours crédités au ripper.
