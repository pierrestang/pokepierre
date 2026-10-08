# Audit et nettoyage des assets Gen 4 (6 octobre 2026)

Dossier : ASSETTILESPOKEMONV2/ (1 041 fichiers, 39 Mo avant ; 759 fichiers, 15 Mo après). Sauvegarde avant nettoyage :
commit ac0b419, tag git `avant-refonte-fdf` (les deux .psd, ignorés par git, sont rangés dans _archive/psd/).

## Méthode

Chaque image a été ouverte et mesurée (dimensions, facteur d'agrandissement, nombre de couleurs à l'échelle
d'origine, transparence, empreinte exacte et perceptive pour les doublons), puis vue planche par planche.
Critères : style 4e génération (palette DS, contours, ombres portées), grille de 16 px (ou 32 px agrandie x2),
PNG sans perte. Un JPEG ou un aperçu DeviantArt rééchantillonné (« -pre », « -375w-2x », des dizaines de milliers
de couleurs) n'a plus de grille de pixels exploitable. Rien d'utilisé par une carte ou par la bibliothèque n'a été
supprimé : les 23 planches gardées, régénérées depuis leur nouvel emplacement, sont identiques au pixel près.

## Verdict par famille

| Famille | Type | Génération / style | Grille | Verdict |
|---|---|---|---|---|
| DPPt d'akizakura16 (ext., int.) | tilesets | Gen 4, fidèle DS | 16 px (x2) | gardé, base de toutes les cartes |
| justin8964 DPPt + HGSS | tileset mixte | Gen 4 | 16 px, posé au pixel | gardé (bibliothèque) |
| Kyle-Dove Sinnoh et ext., Kaliser, LotusKing x2, JesusCarrasco x3, WilsonScarloxy x2, LotusKing/Aigue--marine | tilesets | Gen 4 | 16 px (x2) | gardés (bibliothèque) |
| RMXP Buildings / Nature / Urban | tilesets | Gen 4 | 16 px | gardés (bibliothèque) |
| Gen 4 Pack (tileset + autotiles) | tileset, autotiles | Gen 4 | 32 px -> 16 | gardé |
| terriblejared bateaux / camping | tilesets | Gen 4 | 16 px | gardés (utilisés : ferry) ; aperçus « -pre » rééchantillonnés, à remplacer par l'original si on le retrouve |
| Chambre HGSS d'ultimatetraveler | tileset intérieur | Gen 4 | 16 px | gardé |
| Ultimate Gen 4 Overworlds, Vanilla Sunshine | sprites de personnages | Gen 4 | 32 px | gardés dans personnages/ (16 doublons exacts retirés) |
| Animations & Others, portes animées, fanions FX_Flag | animations | Gen 4 | 16/32 px | gardés dans animations/ |
| Pièces DP de Gamedude (maison, labo, éoliennes), biomes Kyle-Dove (PNG) | fonds, cartes | Gen 4 | non quadrillé | gardés dans references/ |
| akizakura16-hgss d'eeveeexpo x2 | tilesets | Gen 4 | 16 px | supprimés : doublons des planches DPPt (+ bandeau) |
| lightbulb15 DPPt/HGSS | tileset | Gen 4 | 16 px | supprimé : doublon de justin8964 sur fond opaque |
| ekat99 (Gen 3, Halcyon), 6 planches dexxxx, Magiscarf d'eeveeexpo x2 | tilesets | Gen 3 (GBA) | 16 px | supprimés : style incompatible, plus utilisés |
| SailorVicious x2, UltimoSpriter Gen 5, bw_personnages, WesleyFG BW | tilesets, sprites | Gen 5 (N/B) | 16 px | supprimés : style incompatible |
| Cartes FRLG, sprites Delta Émeraude | cartes, sprites | Gen 3 | — | supprimés |
| JPEG (Magiscarf, WesleyFG, phyromatical, adalkroofs, englishkiwi, ekat99, ChaoticCherryCake…) | tilesets et cartes d'exemple | Gen 3/4/5 mêlées | rééchantillonnés | supprimés : JPEG avec pertes, grille cassée |
| Capture d'écran, GIF de cascade | captures | — | — | supprimés : pas des assets |

## Supprimés (83 entrées)

| Fichier | Taille | Raison |
|---|---|---|
| pokemon_halcyon_outdoors_by_ekat99_dfbfwa0-fullview.png | 256 x 7424 | doublon exact de pokemon_halcyon_outdoors (et Gen 3) |
| pokemon_halcyon_outdoors_by_ekat99_dfbfwa0.png | 256 x 7424 | Gen 3 (GBA, Halcyon) ; plus utilisé par aucune carte |
| biome_tiles_public_by_kyle_dove_d4jdto6-fullview.jpg | 896 x 640 | doublon JPEG (avec pertes) de biomes_kyle-dove.png |
| eeveeexpo/akizakura16-hgss_xy1zPiF.png | 256 x 18976 | doublon de dppt-exterieurs_akizakura16 (même planche + bandeau de 64 px) |
| eeveeexpo/akizakura16-hgss_zEcLp2S.png | 256 x 17184 | doublon de dppt-interieurs_akizakura16 (même planche + bandeau de 64 px) |
| pokemon_dppthgss_tileset_by_lightbulb15_d4eb7yc.png | 4095 x 2048 | doublon de la planche justin8964 (même contenu, fond beige opaque au lieu de transparent) |
| pokemon_tileset_from_public_tiles_by_chaoticcherrycake_d5xdb0y-pre.png | 864 x 925 | aperçu rééchantillonné (158 000 couleurs, grille cassée), mélange de styles |
| Pokemon Tileset From Public Tiles by ChaoticCherryCake on DeviantArt.jpeg | 736 x 788 | doublon JPEG réduit du précédent |
| ekat_s_mega_gen_3_set_by_ekat99_deh8jtt-fullview.png | 256 x 5172 | Gen 3 (GBA, ekat99) |
| deh8j8h-cb7f8f93-bb7c-4889-9a2b-968aba9bf39e.png | 128 x 640 | Gen 3 (GBA) : ferme et champs |
| deocy1g-9ee0ef53-81f0-41fd-927a-fea58544820f.png | 128 x 752 | Gen 3 (GBA) : fleurs et cerisiers |
| deof85u-43b2871f-9219-4937-bfa4-e3b01864aed7.png | 128 x 512 | Gen 3 (GBA) : forêt et falaises |
| dequnwm-9dc2822f-86e6-489c-a99d-b7a27903b197.png | 128 x 1200 | Gen 3 (GBA) : jungle et hautes herbes |
| deslp3a-64947b41-540e-457b-bef3-ff1c1712e4bd.png | 128 x 800 | Gen 3 (GBA) : ville et jardins |
| dkee61c-0e6cfc58-5626-47af-b245-61bfbae6e21e.png | 128 x 1088 | Gen 3 (GBA) : forêt sombre et montagne |
| eeveeexpo/magiscarf_nYiXTiQ.png | 256 x 17408 | Gen 3 (style GBA, Magiscarf) : ville et grottes |
| eeveeexpo/magiscarf_kIBvowP.png | 256 x 8128 | Gen 3 (style GBA, Magiscarf) : intérieurs |
| Game Boy Advance - Pokemon FireRed _ LeafGreen - Maps (Caves, Forests, Oceans, Etc.) - Pokemon Mansion.png | 1240 x 1224 | Gen 3 : carte entière de Rouge Feu (pas un tileset) |
| Game Boy Advance - Pokemon FireRed _ LeafGreen - Maps (Towns, Buildings, Etc.) - Pokemon Center _ Mart.png | 523 x 760 | Gen 3 : cartes entières de Rouge Feu (pas un tileset) |
| delta_emerald_overworld_sprites_recreated_by_justin8964_dg6yi84.png | 825 x 635 | Gen 3 : sprites de personnages GBA |
| eeveeexpo/sailorvicious_fl0Fawh.png | 256 x 9536 | Gen 5 (Noir / Blanc) |
| eeveeexpo/sailorvicious_M1sYicX.png | 256 x 9536 | Gen 5 (Noir / Blanc) |
| eeveeexpo/ultimospriter-gen5-exterieur_Cmm6Jjn.png | 256 x 41504 | Gen 5 (Noir / Blanc) |
| eeveeexpo/gen5-interieur-akizakura16-shiney570-ultimospriter_RriSFxo.png | 256 x 20704 | Gen 5 (Noir / Blanc) |
| dc5z1a6-86de2138-cb40-4c2b-a096-89a1faa15b74.gif | 496 x 240 | GIF animé d'une carte d'exemple (cascade), pas un tileset |
| Screenshot 2026-06-07 091836.png | 1521 x 972 | capture d'écran d'une carte enneigée (pas un asset) |
| _free_new_tiles_mastersheet_by_magiscarf_daq6lcu-pre.jpg | 882 x 906 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| _free_rustic_tiles_w_updates_by_magiscarf_daojd43-pre.jpg | 1309 x 611 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| bring_your_walking_shoes_by_magiscarf_d5s9ouv-414w-2x.jpg | 768 x 416 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| buildings_tiles_w_snow_by_magiscarf_ddd7j66-pre.jpg | 1150 x 695 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| bunch_o_free_tiles_by_magiscarf_d6ih36g-414w-2x.jpg | 828 x 1055 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| bw_buildings_tileset_by_wesleyfg_d45ygf8-375w-2x.jpg | 468 x 1799 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), style Gen 5 |
| bw_nature_tileset_by_wesleyfg_d45x0de-414w-2x.jpg | 827 x 1624 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), style Gen 5 |
| bw_velhices_by_wesleyfg_d45wzol-414w-2x.jpg | 785 x 263 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), style Gen 5 |
| comissio_deeep_sea_tileset_by_wesleyfg_d4hefub-fullview.jpg | 441 x 272 | JPEG avec pertes |
| complete_hero_sheet_for_edens_elite_by_wesleyfg_d51l9j0-250t-2x.jpg | 445 x 418 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), style Gen 5 |
| crystal_caves_tiles_by_magiscarf_dcpohna-375w-2x.jpg | 480 x 640 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| demake_kiloude_city_by_phyromatical_d8mevfw-pre.jpg | 934 x 855 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| further_additional_more_tiles_by_magiscarf_dc80s5g-fullview.jpg | 864 x 896 | JPEG avec pertes |
| harmony_town_by_wesleyfg_dimk8zk-375w-2x.jpg | 544 x 480 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| hgss_tileset_by_englishkiwi_d2d0xhk-414w-2x.jpg | 766 x 576 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| hgss_tiliset_my_work_complete_by_wesleyfg_d3k3d0o-414w-2x.jpg | 751 x 1714 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| hieroglyph_city_by_wesleyfg_dimkc3g-350t-2x.jpg | 1088 x 640 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| hoenn_people_ow_in_bw_style_by_wesleyfg_d4jeyg0-pre.jpg | 374 x 2134 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), style Gen 5 |
| misc_tiles_by_magiscarf_dbmon14-375w-2x.jpg | 448 x 496 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| more_freebies_by_magiscarf_d7i1wp4-375w-2x.jpg | 480 x 464 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| more_trees_by_magiscarf_dc0qij0-375w-2x.jpg | 432 x 368 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| mosaic_map_by_phyromatical_dijgv4s-375w-2x.jpg | 480 x 480 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| mountains_trees_and_public_decorations_fan_game_by_adalkroofs_dcj0f4q-fullview.jpg | 128 x 11840 | JPEG avec pertes |
| mountains_trees_and_public_decorations_fan_game_by_adalkroofs_dcj0i6m-fullview.jpg | 256 x 10880 | JPEG avec pertes |
| nobody_home_by_magiscarf_d5p2fla-fullview.jpg | 256 x 192 | JPEG avec pertes, carte d'exemple (pas un tileset) |
| old_river_bridge_by_magiscarf_dbo5iio-fullview.jpg | 864 x 848 | JPEG avec pertes, carte d'exemple (pas un tileset) |
| revamped_tiles_by_magiscarf_ddpuooa-pre.jpg | 983 x 813 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| route_a7_by_wesleyfg_dimkbap-400t-2x.jpg | 1152 x 384 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| route_a9_by_wesleyfg_dimkcgy-fullview.jpg | 1280 x 285 | JPEG avec pertes, carte d'exemple (pas un tileset) |
| sakura_city_by_wesleyfg_dimkcls-375w-2x.jpg | 750 x 450 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| sample_of_kitchen_tileset_by_ekat99_dd76rdn-fullview.jpg | 1216 x 576 | JPEG avec pertes, carte d'exemple (pas un tileset) |
| simple_town_by_magiscarf_d5rx04q-375w-2x.jpg | 640 x 640 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| snow_and_stone_by_magiscarf_dcjgz10-375w-2x.jpg | 592 x 304 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| starter_town_bridgeton_by_phyromatical_d9ogebz-414w-2x.jpg | 800 x 752 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| terraces_by_magiscarf_d6md8f9-375w-2x.jpg | 448 x 320 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| tileset_ver_3_free__by_magiscarf_dbf3bkq-414w-2x.jpg | 828 x 1449 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| tilesets_dppt_by_wesleyfg_d4b4uzh-pre.jpg | 379 x 2109 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| torii_by_magiscarf_db7prw6-375w-2x.jpg | 528 x 176 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée) |
| victorian_variations_by_magiscarf_dbjvf6f-fullview.jpg | 944 x 544 | JPEG avec pertes |
| yangtze_city_by_wesleyfg_dimkcpm-300w-2x.jpg | 600 x 625 | JPEG avec pertes, aperçu DeviantArt rééchantillonné (grille de pixels cassée), carte d'exemple (pas un tileset) |
| bw_personnages | 196 fichiers | Gen 5 : 196 sprites de personnages Noir / Blanc (dans _archive, hors dépôt ; 5 doublons exacts) |
| Gen 4 OWs - Vanilla Sunshine/trchar052.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar164.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar165.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar173_2.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar173.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar056.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar172_2.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar172.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar168.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar168_2.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar169.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar170_2.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar169_2.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar170.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar174_2.png | 256 x 256 | doublon exact (sprite identique au pixel près) |
| Gen 4 OWs - Vanilla Sunshine/trchar175_2.png | 256 x 256 | doublon exact (sprite identique au pixel près) |

## Déplacés et renommés (46)

| Avant | Après |
|---|---|
| 4th_gen_outdoor_tileset_by_akizakura16_da5h3mn.png | tilesets/exterieurs/dppt-exterieurs_akizakura16.png |
| eeveeexpo/kyle-dove_BmmW5Ox.png | tilesets/exterieurs/nature-ville_kyle-dove.png |
| eeveeexpo/kaliser_4MkW96K.png | tilesets/exterieurs/ville-nature_kaliser.png |
| eeveeexpo/lotusking_iLyLdM2.png | tilesets/exterieurs/arbres-clotures-centres_lotusking.png |
| eeveeexpo/lotusking_oSBky9g.png | tilesets/exterieurs/arbres-clotures-centres_lotusking-variante.png |
| eeveeexpo/jesuscarrasco_90Ti2fE.png | tilesets/exterieurs/nature-verte_jesuscarrasco.png |
| eeveeexpo/jesuscarrasco_JMCgaSr.png | tilesets/exterieurs/nature-automne_jesuscarrasco.png |
| eeveeexpo/wilsonscarloxy_pFSm87G.png | tilesets/exterieurs/nature-maisons_wilsonscarloxy.png |
| NatureRMXP.png | tilesets/exterieurs/nature-rmxp.png |
| UrbanRMXP.png | tilesets/exterieurs/urbain-rmxp.png |
| Gen 4 Pack/Tilesets/Custom Outside tileset.png | tilesets/exterieurs/gen4-pack-exterieurs.png |
| BuildingsRMXP.png | tilesets/batiments/batiments-rmxp.png |
| dp_tiles_for_public_by_kyle_dove_d1mjsuq.png | tilesets/batiments/sinnoh-batiments-objets_kyle-dove.png |
| eeveeexpo/lotusking-aigue-marine_YCfbsjd.png | tilesets/batiments/maisons_lotusking-aigue-marine.png |
| eeveeexpo/wilsonscarloxy_x9PBgKi.png | tilesets/batiments/ville_wilsonscarloxy.png |
| 4th_gen_indoor_tileset_by_akizakura16_dac0c2w.png | tilesets/interieurs/dppt-interieurs_akizakura16.png |
| pokemon_hgss_interior_tiles_by_ultimatetraveler_d2tjym2.png | tilesets/interieurs/chambre-hgss_ultimatetraveler.png |
| eeveeexpo/jesuscarrasco_dVHll7F.png | tilesets/interieurs/interieurs_jesuscarrasco.png |
| dppt_and_hgss_tileset_by_justin8964_dg9nal7.png | tilesets/mixtes/dppt-hgss-complet_justin8964.png |
| big_boats_small_boats_ferry_yacht_and_more_by_terriblejared_dmhfmtk-pre.png | tilesets/vehicules/bateaux-ferries_terriblejared.png |
| large_campground_tileset_w_nature_tiles__by_terriblejared_dmex0km-pre.png | tilesets/vehicules/camping-caravanes_terriblejared.png |
| Gen 4 Pack/Autotiles | autotiles/gen4-pack |
| Ultimate Gen 4 Overworlds Pack/Autotiles | autotiles/ultimate-gen4 |
| FX_Flag01.png | animations/drapeaux/guirlande-fanions.png |
| FX_Flag02.png | animations/drapeaux/fanions-petits.png |
| eeveeexpo/akizakura16-hgss_7lHY1fT.png | animations/portes/porte-hgss-1_akizakura16.png |
| eeveeexpo/akizakura16-hgss_TrVeT6y.png | animations/portes/porte-hgss-2_akizakura16.png |
| eeveeexpo/akizakura16-hgss_dPAIUGp.png | animations/portes/porte-hgss-3_akizakura16.png |
| eeveeexpo/kyle-dove_E7xckjI.png | animations/portes/porte-1_kyle-dove.png |
| eeveeexpo/kyle-dove_ISqLGq3.png | animations/portes/porte-2_kyle-dove.png |
| eeveeexpo/kyle-dove_VQVjDJn.png | animations/portes/porte-3_kyle-dove.png |
| eeveeexpo/kyle-dove_iZedmeS.png | animations/portes/porte-4_kyle-dove.png |
| eeveeexpo/kyle-dove_ks11Dml.png | animations/portes/porte-5_kyle-dove.png |
| eeveeexpo/kyle-dove_nH18I3x.png | animations/portes/porte-6_kyle-dove.png |
| Ultimate Gen 4 Overworlds Pack/Animations & Others | animations/effets-gen4 |
| Ultimate Gen 4 Overworlds Pack/All Official Overworlds | personnages/gen4-officiels |
| Ultimate Gen 4 Overworlds Pack/DP Beta Overworlds | personnages/gen4-beta-dp |
| Ultimate Gen 4 Overworlds Pack/Zaffre's Overworlds | personnages/gen4-zaffre |
| Gen 4 OWs - Vanilla Sunshine | personnages/gen4-vanilla-sunshine |
| DS _ DSi - Pokemon Diamond _ Pearl - Backgrounds - Player's House.png | references/dp-maison-du-heros.png |
| DS _ DSi - Pokemon Diamond _ Pearl - Backgrounds - Prof. Rowan's Lab.png | references/dp-labo-du-professeur.png |
| DS _ DSi - Pokemon Diamond _ Pearl - Backgrounds - Valley Windworks.png | references/dp-les-eoliennes.png |
| biome_tiles_public_by_kyle_dove_d4jdto6.png | references/biomes_kyle-dove.png |
| eeveeexpo/CREDITS.txt | credits/eeveeexpo.txt |
| Gen 4 Pack/CREDITS.txt | credits/gen4-pack.txt |
| Ultimate Gen 4 Overworlds Pack/CREDIT IS NEEDED (PurpleZaffre).txt | credits/ultimate-gen4-overworlds_purplezaffre.txt |
| Buildings.psd | _archive/psd/Buildings.psd (hors git) |
| Nature.psd | _archive/psd/Nature.psd (hors git) |

## Catalogue de l'éditeur

Retirés de public/assets/v2 et du catalogue (aucune carte ne s'en servait) : hgss-ext, hgss-int2, ds-lightbulb,
biomes-kyle, sailor-1, sailor-2, ultimo-ext, gen5-int, magi-1, magi-2, gen3, halcyon, ferme, cerisiers, foret,
jungle, ville, montagne ; avec eux, l'ancien thème Gen 3 de scripts/convert_maps_v2.py. La palette range
désormais les planches par rayon (`group` dans catalog.json, voir build_g4_library.py CATEGORIES et
builder.js PALETTE_GROUPS) : Sols et chemins, Eau, Végétation, Relief, Bâtiments, Mobilier urbain, Décor,
Intérieurs, Cases assemblées.
