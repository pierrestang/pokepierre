# Références d'intérieurs DS (4e génération)

Étude des vrais intérieurs de Diamant, Perle, Platine, HeartGold et SoulSilver (octobre 2026), pour refaire nos pièces
« à la DS ». Les images sont rangées dans `assets-source/references-ds/<type>/` (ignoré par git : ce sont des captures
et des rips des jeux, pour l'étude seulement, on ne les redistribue pas) ; `assets-source/references-ds/sources.json`
donne la source de chacune. Sources : Poképédia (captures 256 x 192 et plans) et The Spriters Resource (rips de pièces
complètes). Bulbapedia et le wiki Fandom bloquent les téléchargements automatiques ; vgmaps.com n'a que les cartes du
monde pour ces jeux.

## Couverture par type de lieu

| Type (nos pièces) | Références | Jeu |
|---|---|---|
| Maison, salon, cuisine (ffHouse, playerHouse, montHouse, hullHouse, corseParents…) | maison/Maison_du_Joueur_RDC_DPPt, RDC_HGSS, maison-heros_DP (rip complet), Ranch_Meumeu_Maison_HGSS | DPPt, HGSS |
| Chambre (ffHouseUp, playerHouseUp, montHouseUp, hullColoc, appartements) | maison/Maison_du_Joueur_Étage_DPPt, Étage_HGSS, Chambre_HGSS, chambre-motisma_Pt | DPPt, HGSS |
| École, salle de classe (school, bonsecoursMaths/Français/Sciences, hullUniversity, delhiUniversity, kedge) | ecole/École_des_Dresseurs_intérieur_DP, École_HGSS (école d'Écorcia) | DP, HGSS |
| Hall d'entrée, accueil (bonsecours, dortoirHall, agence, travelAgency, entreprise, hospital) | hall/Centre_Pokémon_DPP, Centre_Pokémon_HGSS, centre-pokemon_DP (rip), Club_des_Dresseurs_RDC_HGSS, Plateau_Indigo_intérieur_HGSS, Musée_Minier_DP, Musée_des_Sciences_HGSS, Tour_Radio_HGSS (étages, ascenseur), salle-union_Pt, Tour_de_Combat_DP | DPPt, HGSS |
| Bar, café, restaurant (hullPubA/B, coffeeShop, bistro) | cafe-bar/restaurant-villa-grand-lac_Pt (salle à manger du Villa Grand Lac), Fan_Club_Pokémon_HGSS (salon, canapés, tapis), Poffinerie_DP, Marché_de_Rivamar_DP, Cycles_à_gogo_HGSS | Pt, HGSS, DP |
| Boîte de nuit, casino, scène (hullAsylum, bercy) | boite-casino/Casino_Doublonville_HGSS, Casino_de_Voilaroc_Pt, Salle_de_Danse_Rosalia_HGSS (scène, lanternes), scene/Unionpolis_Look_Show_Concours_Pt | HGSS, Pt |
| Bureau, entreprise, labo (corning, entreprise*, studio) | bureau/labo-sorbier_DP (rip complet), Tour_Radio_HGSS, Forge_Fuego_DPP | DP, HGSS |
| Temple, monastère (temple, sriLankaTemple, watInterieur, monastere) | temple/Tour_Chétiflor_HGSS (bois, piliers, statues), Tour_Cendrée_HGSS, Tour_Perdue_DP | HGSS, DP |
| Appartements, dortoir (dortoir*, appartement, parisAppart, yanisAppart) | appartements/Résidence_Céladon_RDC/1E/2E_HGSS | HGSS |
| Salle de sport (studioPaulfit, stade) | sport/ arènes (Unionpolis, Vestigion, Doublonville, Écorcia), Dôme_Pokéathlon_HGSS, hall-de-combat_Pt | DP, HGSS, Pt |
| Bateau, cabine (bateaux, ferry) | bateau/Aquaria_cabines_HGSS, Aquaria_rdc_HGSS, Aquaria_cabine_capitaine_HGSS | HGSS |
| Grange, ferme (boulyBarn) | ferme/Ranch_Meumeu_intérieur_HGSS | HGSS |
| Boutique (agence de voyage, coffee shop) | boutique/Vestigion_Bicyclette_Pt (magasin de vélos) | Pt |

Manque : intérieur de la Bibliothèque de Joliberges, Café Cabane (route 210), Restaurant 7 Étoiles, Global Terminal,
Société Pokémontre, Grand Magasin de Doublonville, Salle des Concours (seule la scène de Platine), Temple de Frimapic
(seulement l'entrée enneigée). Poképédia n'a que leurs extérieurs ; il faudrait des rips de The Spriters Resource ou
de Bulbapedia (bloqué en téléchargement automatique, à récupérer à la main si besoin).

## Plans types (mesurés sur les captures, cases de 16 px)

- **Maison, rez-de-chaussée (DPPt, maison du héros)** : 11 x 8,5 cases. Mur du fond sur 2 cases (30 px : liseré sombre
  4 px, papier peint rayé 25 px, plinthe 2 px). Le mur a un décrochement : l'alcôve de la télé recule d'une case.
  Cuisine (évier + plaques, 2 x 1) et frigo (1 x 2, qui mord sur le mur) contre le mur à gauche ; escalier encastré
  dans l'angle du mur à droite, tapis rouge devant ; télé 2 x 1,5 sur son meuble au milieu du mur. Au milieu : table
  (2 x 2) + tabouret, grand tapis arrondi (4,5 x 3) avec deux coussins. Une plante en pot dans chaque coin du bas.
  Tapis de sortie rouge 28 x 12 px, centré-gauche, à cheval sur le bord du bas.
- **Maison, rez-de-chaussée (HGSS)** : 11 x 8 cases. Parquet en damier beige de 16 px. Escalier encastré en haut à
  gauche avec tapis rouge, télé, comptoir de cuisine en L vert, plaques, frigo ; table jaune et quatre tabourets sur un
  tapis bleu arrondi (6 x 4) ; plantes dans les deux coins du bas ; tapis de sortie à gauche du milieu.
- **Chambre (étage)** : 11 x 7 cases ; mur sous le toit (pente) en DPPt ; PC sur un bureau, télé et console, lit 1 x 2
  dans un coin du bas, tapis central, plante, escalier encastré.
- **École (Trainers' School DP)** : salle d'environ 13 x 9 cases ; tableau vert au milieu du mur, fenêtres cintrées de
  part et d'autre ; bureau du maître devant le tableau ; deux rangées de pupitres doubles (2 x 1) avec chaises rouges,
  séparées par une allée ; bibliothèque et vitrine sur un côté ; une zone de carrelage bleu clair différente (le coin
  des démonstrations) ; plantes aux coins. HGSS (Écorcia) : parquet clair, bibliothèques basses contre le mur, table
  carrée et deux chaises, un grand tapis bleu dans la pièce voisine.
- **Hall / Centre Pokémon** : 15 x 10 cases environ, plan symétrique. Comptoir en arc ou en L au centre du mur du fond
  (2 cases de profondeur), PC et machines de part et d'autre ; escalators ou escaliers dans les deux angles du bas ;
  emblème au sol (Poké Ball) devant le comptoir ; bancs ou chaises en ligne le long du bas ; plantes aux angles.
  Les grands halls (Plateau Indigo, Musée) ont un sol bordé : une bande de pierre ou de couleur plus foncée de
  1/2 case fait le tour de la pièce.
- **Restaurant (Villa Grand Lac, Pt)** : 11 x 8 cases ; fenêtres cintrées régulières sur le mur (une toutes les
  2 cases), appliques entre elles ; sol à grands losanges ; petites tables rondes jaunes avec deux chaises, alignées
  en quinconce, deux rangées le long du mur et des îlots au milieu ; tout est petit (table 1 x 1, chaises 1 x 1).
- **Salon / club (Fan Club HGSS)** : 13 x 8 cases ; grand tapis à motif orange bordé occupant tout le centre ; deux
  canapés marron face à face, une table verte au milieu ; bibliothèques et vitrine contre le mur ; affiches au mur.
- **Casino (Doublonville HGSS)** : moquette rouge, mur bleu ciel à nuages ; comptoir en L dans le coin haut gauche ;
  deux longues rangées de machines (1 x 4) dos à dos avec des tabourets rouges de chaque côté ; plantes aux angles.
- **Salle de danse (Rosalia HGSS)** : scène surélevée en bois au fond, rangée de lanternes rouges au-dessus, rideau
  doré, deux escaliers d'accès ; public assis devant.
- **Bureau / tour (Tour Radio HGSS)** : étages de 9 x 6 à 11 x 7 cases ; mur crème avec une bande grise en haut,
  tableaux et cadres au mur ; ascenseur à portes rouges encastré dans le mur ; escaliers encastrés dans les angles avec
  un cadre rouge ; moquette rouge à motif ou dalles grises ; bureaux avec PC.
- **Temple (Tour Chétiflor HGSS)** : grande salle de bois sombre, plancher en lames, un pilier central massif,
  balustrades en bois qui dessinent une allée, statues de Chétiflor, échelles entre les étages.
- **Appartements (Résidence Céladon HGSS)** : couloir en L ; mur de briques à bandeau, fenêtres et portes rouges ;
  bande de pierre grise autour du sol ; escalier rouge encastré.

## Règles de composition « à la DS » (chiffrées)

1. **Mur du fond de 2 cases (≈ 28-32 px)**, en trois parties : un liseré du haut plus sombre (3-4 px), la surface du mur
   avec une vraie texture (papier peint rayé, lambris, briques, panneaux), une plinthe nette (2-4 px) qui sépare du
   sol. Pas de murs sur les côtés ni en bas : la pièce s'arrête net sur le noir. Le mur peut avoir des décrochements
   (alcôve d'une case).
2. **Ombre portée du mur sur le sol** : une bande plus sombre (4-8 px, en dégradé) au pied de la plinthe, et souvent
   une bande d'ombre d'environ 1 case le long d'un bord (lumière qui vient d'un côté).
3. **Ombres des meubles** : chaque meuble projette une ombre douce semi-transparente vers le bas et la droite (3-6 px),
   jamais un contour noir autour. Les contours des objets sont sombres mais colorés (brun, bleu nuit), pas noirs.
4. **Taille des pièces** : maisons 11 x 8 cases, chambres 11 x 7, halls publics 13-15 x 9-10. Nos pièces de 8 x 8 sont
   trop petites et trop vides pour des lieux publics.
5. **Les grands meubles vont contre le mur et mordent dessus** : frigo, bibliothèques, armoires, PC font 1 case de sol
   et montent d'1 à 1,5 case sur le mur. Le centre de la pièce reste dégagé, avec un îlot (table + chaises, ou tapis).
6. **Un tapis central** sous l'îlot (arrondi ou bordé, 4-6 x 3-4 cases), presque systématique : il structure la pièce.
7. **Symétrie des lieux publics** : comptoir au milieu du fond, éléments en miroir à gauche et à droite, plantes dans
   les coins du bas. Les maisons sont asymétriques mais « équilibrées » (coin cuisine / coin escalier).
8. **Petites échelles** : chaises et tabourets 1 x 1, tables 1 x 1 à 2 x 2, lit 1 x 2 ; un meuble ne dépasse pas
   3 cases de large sauf comptoir ou rangée de machines.
9. **Tapis de sortie** rouge (28 x 12 px), posé à cheval sur le bord du bas, souvent décentré d'une case ; les
   escaliers sont encastrés dans un angle du mur du fond, avec un tapis rouge ou un cadre devant.
10. **Palette douce** : couleurs pastel peu saturées en DPPt (beiges, bleus clairs, bruns grisés), un peu plus vives
    en HGSS ; les sols ont un motif discret (lames de parquet, damier peu contrasté) ; la lumière vient du haut à
    gauche (reflets clairs en haut des meubles).

**DPPt et HGSS.** DPPt : rendu 3D aplati, murs en légère perspective (le liseré du haut est plus épais), parquets en
lames horizontales, tons grisés, ombres plus marquées. HGSS : plus « dessiné », sols en damier ou à motifs, couleurs
plus vives, bandes de pierre autour des grands sols, plus de cadres et d'affiches au mur.

## Comparaison avec nos intérieurs actuels (aperçus ffHouse, playerHouse, bonsecoursMaths, hullPubA, hospital)

- Le mur n'a pas de liseré du haut ni de vraie texture (aplat) ; aucune ombre du mur sur le sol.
- Les sols sont soit trop contrastés (grands losanges de hullPubA, grandes dalles de bonsecoursMaths), soit trop plats ;
  pas d'ombres de meubles ni de lumière.
- Mélange de sources (DPPt, yacht de terriblejared, dessins faits main) : contours et palettes différents d'un meuble
  à l'autre.
- Pièces trop vides au centre et sans tapis : pas d'îlot qui structure ; les meubles flottent.
- Échelle incohérente : tables très longues (4-5 cases), objets posés en haut des meubles qui débordent.
- Escaliers en bandes verticales collées au bord au lieu d'être encastrés dans un angle du mur avec un tapis.
- Tapis de sortie trop petit et toujours centré ; lieux publics (hôpital, hall) pas symétriques et sans comptoir central.
- Pièces publiques trop petites (8 x 8) : ni hall, ni pub, ni salle de classe n'ont la taille d'un vrai lieu DS.
