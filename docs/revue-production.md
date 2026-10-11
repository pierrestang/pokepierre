# Poképierre — revue complète avant mise en production

Revue du 11 octobre 2026, branche `cartes-gen4` (dernier commit `bce951d`), en lecture seule : aucun fichier du jeu n'a été
modifié, rien n'a été corrigé ni commité. Cinq passes menées en parallèle sur le code et la bible (docs/bible-du-jeu.md),
puis relues ; chaque problème indique le fichier, la ligne ou la scène, une description et sa gravité (bloquant, gênant,
mineur). Le build de production et les scripts (`check_paths.js`, `audit_maps.py`) ont été lancés hors du dépôt (passe 5).

## Corrections apportées à la relecture

- **Passe 1, point 38 (Talisman indien grisé dès sa remise) : réfuté.** `ItemBag.slots` affiche normalement tout objet
  présent dans le sac (`items.has` est testé avant `used`). Le talisman n'apparaît grisé qu'entre le réveil final (où
  `WAKE_UP` le retire du sac) et le moment où Pierre le reprend sur son bureau, ce qui est voulu. Retiré du décompte.
- **Passe 5, « Billet d'avion Delhi » → « Billet d'avion pour Delhi » : non retenu.** Ce nom a été demandé tel quel par
  l'utilisateur (point 38 des corrections du sac). Retiré du décompte.
- **Passe 3, blocage B1 (Fort-de-France sans issue) : confirmé.** `src/data/maps/airport.js` l. 40 propose « Fort-de-France »
  sans condition ; la carte `fortDeFrance.js` n'a ni sortie vers l'aéroport ni départ possible après
  `departFortDeFrance` (le capitaine reste sur `FISHER_AT_FERRY`).
- **Doublons entre passes** : les textes provisoires (passes 1 et 5) et la vertu Adaptation jamais réutilisée (passes 1
  et 3) sont comptés dans chacune des passes où ils apparaissent ; le résumé final les regroupe.

## Passe 1 — Cohérence narrative

## Poképierre : passe 1, cohérence narrative (lecture seule)

Périmètre lu : src/data/*Story.js, story.js, bag.js, characters.js, looks.js, characterLooks.json, spriteTags.js,
questStarts.js, toutes les cartes de src/data/maps/ (interiors.js compris, avec npcEdits appliqués), FerryScene.playDeck, et
les sections « Personnages », « Le sac » et « Incohérences repérées » de docs/bible-du-jeu.md.
Les sprites effectifs de chaque PNJ ont été recalculés comme le fait `lookOf` (npcEdits « seulement ici » >
characterLooks.json > `sprite` imposé > BY_NAME > figurant au hasard), puis croisés avec spriteTags.js.

Gravité : **bloquant** = casse l'histoire ou la progression ; **gênant** = un joueur attentif le remarque ;
**mineur** = détail.

---

### A. Présentation des personnages

1. **hullStory.js PUB_A_WELCOME (l. 92)** : gênant. Charlotte parle à Pierre comme à quelqu'un qu'elle connaît :
   « Pierre ! Ça fait plaisir de te revoir. » On ne l'a jamais vue avant Hull. Elle n'est pas à la soirée de
   Bordeaux (interiors.js `appartement`), et rien ne montre ni ne raconte leur rencontre. La bible le veut (« connaît
   Pierre d'avant Hull »), mais le jeu ne le montre jamais.
2. **maps/hull.js l. 120 et l. 127** : gênant. Les portes fermées nomment des gens que Pierre ne connaît pas encore.
   - « La maison de Léo, Romain et Prophecy. Personne ne répond pour l'instant. » s'affiche avant `leo-appel`, donc avant
     que Léo présente Romain et Prophecy (LEO_PLAN, l. 59).
   - « La coloc de Charlotte et Anaïs. Personne ne répond. » s'affiche sans condition, avant que Charlotte apparaisse et
     annonce elle-même « devine qui est la coloc d'Anaïs ».
3. **Dalil**, dans interiors.js `appartement` (`dalil-fete`) et bordeauxStory.js REUNION_LINES.dalil (l. 358) : mineur.
   Il n'est jamais présenté. On ne connaît que son nom affiché et une réplique sur la météo à la soirée. Au stade, il
   parle pourtant comme un proche : « Peu importe où on ira après… il y aura toujours un océan quelque part pour nous
   ramener ici. »
4. **parisStory.js HUGUES_MESSAGE (l. 176-189) et THOMAS_SERVICE (l. 196)** : mineur. Hugues et Thomas sont des amis
   jamais présentés. Le premier contact est un SMS (« Match ce soir chez moi ! Passe prendre Thomas en chemin »), puis
   Thomas dit « Ah, Pierre ! ». Leur nom s'affiche, donc la règle est formellement respectée, mais rien ne dit d'où
   Pierre les connaît.
5. **newDelhiStory.js PROPHECY_WELCOME (l. 58)** : mineur. « Pierre ! Te voilà enfin ! Ça y est, on y est. » Le code
   parle de « retrouvailles prévues », mais personne ne les annonce à Pierre. Romain remet le billet sans parler de
   Prophecy (amsterdamStory.js l. 156).

### B. Chronologie (une réplique en avance ou contradictoire)

6. **maps/saintAy.js l. 223-229**, déclencheurs de la route nord : gênant. Leur `dialogue` (affiché quand les
   conditions ne sont pas remplies, voir MapScene.runTrigger) est visible dès l'arrivée à Saint-Ay : « La route de
   Montépilloy. On y partira en voiture, avec la famille. » Il révèle le déménagement plusieurs années avant
   l'annonce de Papa (ANNOUNCEMENT).
7. **montepilloyStory.js MAMAN_WELCOME (l. 37), ARRIVAL (l. 25), PAPA (l. 61) et saintAyStory.js CAR (l. 204)** :
   gênant. Les âges sont impossibles.
   - Jean n'est pas dans la voiture (« Tu montes à l'arrière, à côté de Manon et de Fanny »), donc il naît après le
     départ de Saint-Ay.
   - À l'arrivée, l'image d'accueil dit « Quelques années plus tard… », et Maman dit de Jean : « à huit ans, il veut
     déjà tout réparer ».
   - Papa ajoute : « On est arrivés à Montépilloy, tu tenais à peine sur le siège arrière. »

   La famille vit donc à Montépilloy depuis au moins huit ans, et Pierre aurait eu deux ou trois ans en arrivant. Or, à
   Saint-Ay, il construit une cabane, puis vient l'ellipse « Quelques années plus tard… » (CABANE_FETE, l. 132). Pierre
   ne peut pas être en CM2.
8. **amsterdamStory.js CANAL_NIGHT (l. 149)** : gênant. Romain dit : « Y a six mois, t'étais à l'autre bout du monde,
   à Hanoï. Et nous à Bordeaux. » Or Romain était à Hong Kong : il le dit dans FAREWELL (hullStory.js l. 385,
   « Hong Kong ! ») et au téléphone (hanoiStory.js l. 187, « Hong Kong, c'est fini ! »). Il ne connaissait pas
   Bordeaux : à Hull, « Léo nous a parlé de toi » (hullStory.js l. 60).
9. **newDelhiStory.js GOING_HOME (l. 190) et bordeauxStory.js BACK_FROM_DELHI (l. 309)** : gênant. Prophecy parle de
   Bordeaux comme de chez lui :
   - « On rentre à Bordeaux finir nos études. Tu te rends compte, on revient là où tout a commencé ? »
   - « Bordeaux ! Ça fait bizarre, hein ? Comme si on n'était jamais partis. »

   Or Prophecy n'est jamais à Bordeaux avant le retour. À Hull, Léo le présente à Pierre comme un inconnu (« Romain,
   Prophecy : voilà Pierre, de la promo de KEDGE », l. 59), ce qui laisse entendre qu'ils ne sont pas de la même
   promo.
10. **interiors.js l. 932**, la professeure de français : mineur. « Ta rédaction sur Saint-Ay était très réussie. Tu
    as le sens du récit ! » Elle n'a aucune condition : elle le dit dès le premier jour de 6e, avant tout devoir.
11. **Cartes postales lisibles dès le jour d'arrivée** : mineur.
    - maps/saintAy.js l. 128-134 : la carte du capitaine est lisible le jour même où le ferry débarque la famille
      (le ferry est encore à quai) : « Ta mère avait raison, l'île est plus calme sans vous. »
    - hanoiStory.js MAILBOX (l. 40-44, maps/hanoi.js l. 127) : la carte « Alors, Hanoï ? » est lisible dès
      l'atterrissage.
12. **hanoiStory.js MAILBOX (l. 43)** : mineur. La carte est signée « Léo et toute la bande. ». Or, d'après les adieux
    de Hull (hullStory.js FAREWELL), seuls Léo et Ousmane sont restés. Les autres sont partis au Canada, à Bali, aux
    États-Unis et à Hong Kong.
13. **maps/bordeaux.js l. 174**, la carte de Joshua : mineur. « je t'avais promis une vraie lettre, avec un timbre ».
    À Saint-Ay, c'est Joshua qui demandait à Pierre d'écrire, sans rien promettre (saintAyStory.js l. 171 : « Tu nous
    écriras ? Une vraie lettre, avec un timbre et tout. »).
14. **interiors.js l. 1689**, `leo-apres` dans `hullHouse` : mineur. « J'ai lu la même page six fois… hier. Et
    aujourd'hui aussi. »
    - La réplique est visible dès le petit matin (`ifSouvenirs` Insouciance), donc avant la bibliothèque à laquelle
      « hier » renvoie.
    - Le jour des révisions (`lendemainHull`), Léo, Romain et Prophecy sont chez Léo pendant que Léo et Prophecy sont
      aussi à la bibliothèque (`leo-biblio`, `prophecy-biblio`) : ils apparaissent en double.
15. **maps/bordeaux.js l. 106 et l. 16** : mineur. L'oral d'anglais est cité avant qu'on l'annonce (MONTHS_LATER).
    - Dès l'arrivée, la porte de KEDGE dit « L'oral d'anglais, c'est pas aujourd'hui. »
    - L'agent de sécurité dit « Pas de diplôme d'anglais, pas d'avion. L'oral, c'est à KEDGE ».
16. **hanoiStory.js FLIGHT_TO_AMSTERDAM (l. 203)** : mineur. « Il y a quelques mois, tu prenais ce billet à Hull, le
    ventre noué. »
    - Au départ de Hull, le texte disait l'inverse (hullStory.js l. 400) : « Tu prends ton billet, et tu souris ».
    - « quelques mois » est court après l'ellipse « Six mois plus tard… ».
17. **newDelhiStory.js SAGE (l. 164)** : mineur. « c'est le même que le coquillage de Manon, sur la plage de
    Fort-de-France ». Le coquillage n'a pas été trouvé sur la plage, mais dans les hautes herbes du petit pré près des
    statues (fortDeFranceStory.js l. 116 ; maps/fortDeFrance.js l. 157-165).
18. **reveStory.js SPEAKERS, Margaux (l. 16)** : mineur. « Tu te cachais toujours au même endroit… » Au cache-cache,
    Pierre ne se cache jamais : c'est lui qui cherche (HIDE_AND_SEEK, « … huit, neuf, dix ! »).
19. **saintAyStory.js OLD_FISHER (l. 247 et l. 251)** : mineur. Le pêcheur dit « Je ne parle pas aux inconnus, moi. »,
    puis « T'as le sourire de ta mère, toi. » Or il n'a jamais vu Maman.
20. **interiors.js l. 878-881 et l. 942**, Étienne au collège : mineur. Avant que Margaux soit trouvée, il est assis à
    un pupitre de la salle de maths, la classe de Pierre (la 6e B). Ensuite, en français, il dit : « Par contre, pas la
    même classe… »
21. **Paris, interiors.js l. 2331 et parisStory.js HALL_LINES.bonne (l. 72)** : mineur.
    - Camille répète « Alors, ce premier jour ? » après les deux ellipses « Un an plus tard… ».
    - Antoine dit « On se voit en haut. » alors que le badge de Pierre n'ouvre encore aucun étage.
22. **interiors.js l. 377**, Papa à Saint-Ay, après l'annonce : mineur. « La voiture est chargée, sur la route du
    nord. » Felix dit « ta famille t'attend à la voiture, devant ta maison » (saintAyStory.js l. 165 et l. 174), et la
    voiture est bien garée devant la maison (maps/saintAy.js l. 122, case 19, 7).
23. **hullStory.js PUB_A_WELCOME (l. 89-90)** : mineur.
    - Anaïs : « Comme à Bordeaux, mais c'est toi qui régales cette fois ! » Or la soirée de Bordeaux avait lieu chez
      Pierre, c'est donc déjà lui qui recevait.
    - La réplique d'Anaïs reprend celle que Léo vient de dire : « Première tournée, c'est toi qui régales ! »
24. **saintAyStory.js ARRIVAL et BIRTH** : mineur. Maman accouche à Saint-Ay (« le bébé est arrivé ! »). Sa grossesse
    n'est mentionnée nulle part, ni à Fort-de-France (elle danse), ni sur le pont du ferry (FerryScene.playDeck).
25. **interiors.js l. 1227 et l. 1270**, Prytanée : mineur.
    - Un objet dit « Des manuels de prépa ». Pierre est au lycée, il n'est pas en prépa.
    - Un élève de terminale dit : « Le bac, c'est dans un an. Ou dans deux. Je sais plus. »
26. **saintAyStory.js CABANE_FETE (l. 108)** : mineur. « Les quatre cousins s'installent au QG. » Le compte de quatre
    inclut Pierre (Felix, Joshua, Yanis). Or Val est présentée comme une cousine de plus (interiors.js l. 450 ; elle
    sculpte chez Felix). Elle n'est jamais à la cabane, et personne ne parle d'elle.

### C. Genre et sprites

27. **Felix, g25 (characterLooks.json)** : gênant, déjà connu. Le sprite est une fille (spriteTags `['femme',
    'enfant']`), mais Felix parle au masculin : « Cousin ! Ça y est, on a emménagé ! » (maps/saintAy.js l. 162).
    Camille, au collège, a le même sprite (BY_NAME `Camille: 'g25'`), tout comme l'Étudiante de la fête de Delhi.
28. **Surveillant, g116 (BY_NAME)** : gênant. Le sprite est une femme, mais tout est au masculin :
    - « Bienvenue au collège Bonsecours ! C'est moi le surveillant. » (collegeStory.js l. 39) ;
    - un élève : « Le surveillant voit tout. » (interiors.js l. 771).
29. **interiors.js l. 1269-1270**, `dortoirEtage2`, l'internat des garçons : gênant. `terminale-1` et `terminale-2`
    ont des sprites de femme imposés (g88, g89). Le commentaire dit pourtant « des garçons (apparences imposées…) », et
    spriteTags les classe `femme`.
30. **Figurants dont le genre du nom contredit le sprite** : mineur.
    - Delhi :
      - `passante-1` (g42, une fille) et `passante-8` (g100, un homme âgé) disent la réplique de grand-mère « Mange
        bien, mon garçon ! » ;
      - `passant-9` (g111) et `passant-11` (g60) sont des femmes nommées « Passant » ;
      - « Livreur » (g96) et « Étudiant » de l'internat (g106) sont des femmes ;
      - « Le passant te sourit… » est dit par `passante-5` (g50) ;
      - dans `delhiCour` : « Grand-mère » a un sprite d'enfant (g42), `etudiant-riz` (g110) et `etudiant-ensemble`
        (g102) sont des femmes, `etudiante-dal` (g103) est un garçon.
    - Hull :
      - premier pub : `client-a5` « Client » (g24) est une femme ;
      - second pub : `client-b2` « Cliente » (g22) et `client-b4` « Cliente » (g49) sont des hommes, `client-b3`
        « Client » (g96) et `habitue-apres` « Habitué » (g96) sont des femmes ;
      - à l'Asylum : « Client » (g57, g89), « Danseur » (g113) et « Étudiant » (g107) sont des femmes, « Étudiante »
        (g90) est un homme.
    - Bordeaux :
      - à la soirée, « Étudiant » est une femme pour g50 (trois fois), g89, g96, g107 et g88 ;
      - au stade, « Diplômé » est une femme pour g50 et g110.
    - Paris : « Client » du bistro (g51 imposé) est une femme.
31. **Âges** : mineur.
    - Des sprites d'adulte pour des enfants : Manon g96 (enfant à Fort-de-France), Margaux g3, Étienne g108 (CM2),
      Joshua g68 (cousin), Rémy g109 (6e).
    - Des sprites d'enfant pour des adultes : Professeur de sciences g22, Videur de l'Asylum g22, Barmaid g24, Habitué
      g55, les deux touristes de Hanoï (g24, g22).
    - Tanguy (g56) et Geoffrey (g41), lycéens, ont des sprites d'enfant.
32. **Sprites partagés entre personnages nommés, ou avec des figurants** : gênant.
    - Entre personnages nommés :
      - Maman et Charlotte ont le même sprite (g44 : JSON pour Maman, BY_NAME pour Charlotte) ;
      - Felix et Camille du collège (g25) ;
      - Thomas et Anthony, deux personnages de Paris (g95) ;
      - Étienne et le Capitaine du Prytanée (g108) ;
      - Yanis et le Gamin (g59) ;
      - Joshua et le Guitariste de Bercy (g68) ;
      - le Directeur du stade de Bordeaux et celui de Paris (même nom « Directeur », même sprite g120).
    - Figurants au hasard (EXTRAS) qui reprennent le sprite d'un personnage nommé :
      - Anaïs (g107) : `etudiant-7` à la soirée de Bordeaux et `etudiant-asylum-4` à l'Asylum, dans la même pièce
        qu'elle ;
      - Manon (g96) : `etudiant-6` à la soirée, `client-b3` et `habitue-apres` au pub, `danseur-asylum-1`, et le
        Livreur de Delhi ;
      - Jean (g22) : `touriste-2` à Hanoï, `etudiant-10`, `client-b2`, le Videur, `danseur-asylum-6`, `diplome-1` et le
        professeur de sciences ;
      - Fanny (g60) : `passant-11` à Delhi ;
      - Val (g42) : la grand-mère de Delhi.

### D. Homonymes (vérifiés)

33. **Rien à signaler** : non compté.
    - Rémy (collège) et Rémi (Bordeaux) ne sont jamais mélangés dans les textes : aucun « Rémi » dans
      collegeStory.js ni dans les intérieurs du collège, aucun « Rémy » dans bordeauxStory.js ni dans les intérieurs de
      Bordeaux. Seuls les identifiants internes mélangent les deux (`remi-casier`, `remyAutocollant`), et ils sont
      invisibles.
    - Margaux s'écrit partout de la même façon : aucun « Margot » dans src/.
    - Un seul Paul existe (Bordeaux), la bible le confirme (l. 1607).
    - Les deux Camille (collège, et Paris avec `lookName` « Camille (Paris) ») sont bien distinctes.

### E. Vertus

Chaque vertu est reçue une seule fois, dans la bonne ville, sous une condition qui l'empêche de revenir. Chaque
`useTrait` a lieu quand la vertu est déjà acquise, sur le chemin obligatoire comme dans les passages optionnels.

34. **Adaptation (hanoiStory.js l. 119)** : gênant. Elle n'est jamais utilisée après avoir été reçue : aucun
    `useTrait: TRAITS.adaptation` dans src/data. CLAUDE.md demande pourtant que les vertus servent comme des CS.
35. **Liberté (parisStory.js l. 296-297)** : mineur. Son seul emploi est le `useTrait` qui suit immédiatement le
    `trait`, dans la même scène.
36. **interiors.js l. 295**, Papa dans l'atelier : mineur. « Voilà. Tu réfléchis. C'est ça, le pragmatisme. » Le mot
    renvoie à une vertu retirée (Pragmatisme, `TRAIT_MIGRATION.removed`).
37. **Le décompte de la bible n'est plus à jour** (section « Vertus jamais utilisées ») : mineur.
    - Insouciance : la bible dit « une fois », le code l'emploie deux fois (Hanoï l. 144, Amsterdam l. 151).
    - Ingéniosité : la bible dit 3, le code 4 (poulie de Saint-Ay, placard du collège, coupure de Bordeaux, cycliste).
    - Autonomie : la bible dit 2, le code 3 (rangement de Bordeaux, vol de Hull, Corning). Le rangement est
      obligatoire (`exitLock`), alors que la bible le donne pour optionnel.

### F. Objets

Chaque entrée d'ITEMS est obtenable et apparaît dans bag.js, dans l'onglet attendu. Aucun objet n'est cité dans une
réplique avant d'exister.

38. **bag.js l. 451, le Talisman indien** : gênant. Son `used` vaut `{ ifFlags: [FLAGS.sageDelhi] }`, le drapeau levé
    à l'instant même où le sage le donne.
    - L'objet apparaît donc grisé, comme « repris par le jeu », dès qu'on le reçoit.
    - Il reste grisé après que TALISMAN le redonne à la toute fin (reveStory.js l. 88).
39. **Objets jamais repris ni rangés** : mineur. Ils restent actifs pour toujours dans « Objets » :
    - Clés de l'appartement (Bordeaux) ;
    - Billet d'avion Delhi : le vol ne le reprend pas (`take` absent de maps/airport.js) ;
    - Consignes en vietnamien, après la traduction (la bible le signale déjà) ;
    - Clés du studio (Paris).
40. **Textes provisoires visibles en jeu** : gênant.
    - interiors.js l. 165-167, la maison de Fort-de-France : « [Texte provisoire] La télé… », « [Texte provisoire] La
      console de Manon… », « [Texte provisoire] Le frigo… ».
    - parisStory.js CONCERT, l. 160 : le chanteur dit « [PAROLES À COMPLÉTER PAR PIERRE] ». La bible affirme « Plus
      aucun texte provisoire dans l'histoire ».
41. **Bible et code : la colonne « Sprite » du tableau Personnages est périmée** : mineur. Les valeurs ne
    correspondent plus à characterLooks.json ni à BY_NAME :

    | Personnage | Bible | Code |
    |---|---|---|
    | Maman | g126 | g44 |
    | Papa | g119 | g80 |
    | Manon | g57 | g96 |
    | Fanny | g49 | g60 |
    | Jean | g52 | g22 |
    | Felix | g93 | g25 |
    | Joshua | g18 | g68 |
    | Yanis | g96 | g59 |
    | Margaux | g43 | g3 |
    | Benoît | g38 | g12 |
    | Principale | g37 | g194 |
    | Capitaine | g87 | g108 |
    | Ousmane | g105 | g148 |
    | Léo | g55 | g140 |
    | Rémi | g140, et g117 dans « Incohérences » | g0 |
    | Harsh | g89 | g83 |
    | Barman | g101 | g154 |
    | Thomas | g90 | g95 |
    | Collègue | g36 | Guillaume g4 |

### G. Ellipses

Ces ellipses sont cohérentes entre elles :
- « Quelques mois plus tard… Septembre. » (de la fin du CM2 à la rentrée) ;
- « Quatre ans plus tard… La fin de la troisième. » ;
- les « Quelques années plus tard… » du Prytanée ;
- à Bordeaux, « Le lendemain matin. » puis « Quelques mois plus tard… » ;
- à Hull, « Le lendemain… » puis « Le surlendemain… », cohérents avec « les exams, c'est après-demain » et « les
  résultats, c'est après-demain » ;
- « Six mois plus tard… » (Hanoï), puis « Quelques mois plus tard… » (Amsterdam), puis « Quelques mois plus tard… »
  (Delhi) ;
- à Paris, deux « Un an plus tard… ».

Les incohérences d'ellipse sont déjà listées plus haut : n° 7 (Montépilloy et l'âge de Jean), n° 8 (Romain, « six
mois… à Bordeaux ») et n° 16 (« Il y a quelques mois… » à Hanoï).

### H. Répétitions

42. **maps/montepilloy.js l. 152 et maps/bordeaux.js l. 175** : mineur. La carte de Felix et celle de Joshua disent la
    même chose :
    - « Pierre, la cabane tient toujours. Yanis a oublié le mot de passe, pas nous. »
    - « Felix dit que la cabane tient toujours. Yanis a encore oublié le mot de passe. »
43. **Margaux promet trois fois « l'été prochain »** : mineur.
    - montepilloyStory.js l. 92 : « Alors on la refait l'été prochain. Promis ? »
    - interiors.js l. 1088 : « Promis, hein ? L'été prochain, on refait une partie. »
    - collegeStory.js l. 187 : « Bon. L'été prochain, je trouve mieux. Promis. »
44. **parisStory.js OFFICE_FIRST (l. 57) et COLLEAGUE (l. 65)** : mineur. Guillaume dit deux fois la même réplique,
    mot pour mot : « Dix ans que je fais ce trajet. On s'habitue, tu verras. » Si on lui reparle juste après
    l'accueil, il la répète.
45. **newDelhiStory.js PASSERS_BY.grandMere (l. 33) et GUESTS.grandMere (l. 137)** : mineur. « Mange bien, mon
    garçon ! Tu es tout maigre. » et « Mange, mon garçon, mange ! Tu es tout maigre. » La première est en plus
    attribuée à trois passantes de l'avenue (`passante-1`, `passante-7`, `passante-8`).
46. **Anaïs reprend Léo au premier pub** : déjà compté au n° 23.

---

### Décompte

- **Bloquant : 0**
- **Gênant : 13** (n° 1, 2, 6, 7, 8, 9, 27, 28, 29, 32, 34, 38, 40)
- **Mineur : 31** (n° 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 30, 31, 35, 36, 37,
  39, 41, 42, 43, 44, 45)
- Non comptés : n° 33 (vérifié, rien à signaler) et n° 46 (doublon du n° 23).

## Passe 2 — Guidage

## Poképierre : passe 2, le guidage

Revue en lecture seule du code : `src/data/*Story.js`, `src/data/maps/*.js`, `src/data/maps/interiors.js` et `MapScene.runSteps`. Pour chaque quête, on regarde ce que le joueur a sous les yeux au moment où il reprend la main.

Gravités :
- **bloquant** : le joueur ne peut pas avancer.
- **gênant** : le joueur ne sait pas où aller, sauf s'il reparle à quelqu'un ou s'il explore au hasard.
- **mineur** : la suite est évidente ou se trouve vite, mais rien ne la dit.

---

### Fort-de-France

Points de reprise bien guidés :
- Réveil : « Pierre ! Le ferry part cet après-midi ! Descends ! »
- `MAMAN_MORNING` : Papa « à son atelier, à droite de la plage », Manon « prépare un coup dehors ».
- Manon, à la sortie de la maison : « dans le petit pré, à côté des statues ».
- Coquillage trouvé : « Manon attend sûrement de le voir. »
- Papa, après le tri, et Manon, après le secret, se renvoient l'un à l'autre, puis au salon (« Maman t'attend au salon »).
- Capitaine : « Ton père en a toute une collection, dans son atelier. »

| # | Où | Problème | Gravité |
|---|---|---|---|
| 1 | `fortDeFranceStory.js` `MAMAN_FDF` (danse, l. 132-135) | La danse se termine sur le trait Joie de vivre (`end`). Aucune réplique n'envoie vers le capitaine. « Passe le voir » n'arrive que si on reparle à Maman (l. 128-129). Après la danse, Manon dit seulement « Chut… c'est notre secret » et Papa « Il reste des caisses ». | gênant |
| 2 | `interiors.js` `ffHouse`, événement `talismanPris` (`MAMAN_MORNING` rejouée) | À la toute fin, Maman redit « va voir ton père et ta sœur… reviens me voir ». Papa et Manon ne sont plus là (`HOME_FDF`), et c'est la sortie de la maison qui lance la fin. La consigne est donc fausse. La rejouer est voulu, mais elle ne guide pas. | mineur |

### Saint-Ay

Points de reprise bien guidés :
- Arrivée : Papa indique « la grande maison au toit bleu, en bas du village ».
- Berceau : « Tends-lui la main ».
- Felix : « La petite maison au toit bleu, juste à côté de la clinique ».
- Joshua : « mets-toi derrière une poule et appuie sur A ».
- Ellipse annoncée : « Quelques années plus tard… » (`CABANE_FETE`).
- Manon : « Viens vite à la maison ! »
- Papa : « Ils sont à la cabane. »
- Felix : « ta famille t'attend à la voiture ».

| # | Où | Problème | Gravité |
|---|---|---|---|
| 3 | `saintAyStory.js` `FANNY_CRADLE` (fin, l. 58-59) | La scène finit sur « À partir d'aujourd'hui, tu vas veiller sur elle. » Rien ne dit de sortir de la clinique, alors que c'est la sortie qui lance Felix (`CLINIC_EXIT`). Il faut reparler à Maman pour lire « Va voir tes cousins ». | mineur |
| 4 | `saintAyStory.js` `CABANE_PLAN`, `ROPE`, Yanis (`maps/saintAy.js`) | Felix ne dit pas de lui rapporter le matériel chez lui. Il dit même « On la perche dans les sapins, au sud du lac », ce qui envoie vers le mauvais endroit. Si la corde est trouvée en dernier, `ROPE` ne fait que donner l'objet, et Yanis répond « Parfait. Ça tiendra… sûrement. » Le renvoi « On ramène ça chez Felix » n'existe que chez Joshua ou dans `PLANKS`, donc seulement si les planches viennent en dernier. | gênant |

### Montépilloy

Points de reprise bien guidés :
- Arrivée : « La maison est en haut du village ».
- Maman : « le grand bâtiment au toit jaune, à droite de la grand-rue ».
- Jean : « Rejoins-moi à la ferme ! » (panneau « Ferme de M. Bouly »).
- M. Bouly : « sous le gros tas de foin, en bas à droite ».
- Ellipse annoncée : « Quelques mois plus tard… Septembre. »
- Départ : « tu y vas à pied, par la sortie nord ».
- `NORTH_EXIT` rappelle ce qu'il reste à faire.

| # | Où | Problème | Gravité |
|---|---|---|---|
| 5 | `montepilloyStory.js` `LAST_DAY` | Le texte « C'est le dernier jour de CM2. » ne dit pas quoi faire ensuite (sortir de l'école). Seule Margaux le dit, si on lui parle : « À la sortie, on fait une partie de cache-cache. » | mineur |
| 6 | `montepilloyStory.js` `HIDE_AND_SEEK` | Le cache-cache est lancé « dans tout le village », sans aucune piste. Les cachettes ne sont données que par Maman, à la maison. Le joueur n'apprend jamais à ce moment que Jean l'attend dans sa chambre : il l'apprend par Maman, par la sortie nord ou par Benoît à la fin de la partie. | mineur |
| 7 | `montepilloyStory.js` `GAME_OVER` (l. 95) | Si Jean a déjà lancé sa quête, Benoît dit « ton petit frère te cherche ! » sans dire où. Jean est alors au tracteur, pas dans sa chambre. | mineur |

### Collège (route de Bonsecours)

Rien à signaler, tout est guidé :
- Le surveillant indique le casier 12, la salle de maths « l'étage au-dessus », puis l'ordre des étages.
- Rémy : « l'escalier au bout du couloir ».
- Rémy, en classe : « Va lui dire salut ».
- Ellipse annoncée : « Quatre ans plus tard… La fin de la troisième. »
- Le prof : « Viens me voir à mon bureau », puis « au bout de la route du nord ».
- Le militaire de la route s'écarte.

### Prytanée

Points de reprise bien guidés :
- Arrivée : « Le capitaine t'attend devant l'internat des garçons, en haut à gauche ».
- Le capitaine : « Ta chambre est au premier étage ».
- Tanguy et Geoffrey indiquent le lit, l'armoire et le bureau.
- La nuit : « On file par la porte nord, tout en haut ».
- Ellipse annoncée : « Quelques années plus tard… »
- Tanguy : « affichée sur le panneau de la place d'armes ».
- Après le bac : « Le capitaine t'attend à la porte nord ».

| # | Où | Problème | Gravité |
|---|---|---|---|
| 8 | `prytaneeStory.js` `INSPECTION` (l. 74-78 : `black`, `wait`, `setFlag soirMur`, `black: false`) | **Ellipse sans texte.** Le passage au soir est un fondu au noir sans aucune réplique : le commentaire du code dit « sans texte : la nuit tombe sur le dortoir ». Pourtant `story.js` (`soirMur`) et `interiors.js` (l. 100) parlent de « Le soir même… ». Seul l'assombrissement de la pièce marque le changement d'heure. | gênant |

### Bordeaux (les études)

Points de reprise bien guidés :
- Ousmane : « Les clés sont à l'agence, juste à droite ».
- L'agent : « l'immeuble est juste à gauche ».
- Ousmane, après le compteur : Paul et Rémi, « de l'autre côté de la Garonne… maison du milieu / de droite ».
- Le lendemain : « Pas question de sortir avant d'avoir tout rangé » (et `exitLock`).
- Ellipse annoncée : « Quelques mois plus tard… », avec KEDGE « en bas à gauche, au bord de la Garonne ».
- La professeure : « la route vers l'est ».
- Ousmane : « L'aéroport, c'est par la sortie est ».

| # | Où | Problème | Gravité |
|---|---|---|---|
| 9 | `bordeauxStory.js` `BLACKOUT` | La scène finit sur « Non. » puis Ingéniosité, sans rien sur le compteur. Le tableau est `hidden` (pas de bulle). Seul Ousmane donne un indice, si on lui parle : « Pas près de la porte, en tout cas. » | mineur |
| 10 | `bordeauxStory.js` `PAULFIT`, `REMI_CUPS` | Une fois l'enceinte ou les gobelets reçus, personne ne dit de rentrer voir Ousmane. Dans `METER`, Ousmane n'a pas dit qu'il attendrait devant l'immeuble. | mineur |
| 11 | `bordeauxStory.js` `PARTY` ; `interiors.js` `appartement` (déclencheurs `PARTY_END` près de la porte) | Seul texte : « La soirée bat son plein ». Rien n'explique comment finir la soirée (sortir par la porte). | mineur |
| 12 | `bordeauxStory.js` `OUSMANE_WAKES` | La scène finit sur la photo, sans « on peut sortir ». La sortie lance pourtant l'ellipse. | mineur |
| 13 | `bordeauxStory.js` `REMI_AT_KEDGE` | Rémi dit seulement « T'inquiète, c'est easy. » La salle de l'oral (salle 1, deux étages plus haut) n'est indiquée que par l'accueil de KEDGE, si on lui parle (`KEDGE_DESK`). | mineur |

### Hull

Points de reprise bien guidés :
- Ousmane mène à la coloc.
- Ousmane : Léo habite « en haut de Newland Avenue, à droite… juste après le pub ».
- Léo part devant à chaque bar (`LEO_SCOUT_*`).
- Romain : « L'Asylum… tout en haut sur le campus ».
- Léo : « Tout le monde sur la piste ! »
- Annonces de temps : « La nuit tombe sur Hull », « Ciel bleuté… », « Le lendemain… », avec la bibliothèque « en haut de Newland Avenue, à gauche ».
- Ellipse annoncée : « Le surlendemain… »
- Léo : « devant chez moi ».
- Ousmane : « l'aéroport, au bout de la grande rue ».

| # | Où | Problème | Gravité |
|---|---|---|---|
| 14 | `hullStory.js` `PUB_A_WELCOME` | Le barman demande la commande « pour la bande », mais personne ne dit d'aller demander à chacun ce qu'il boit. Le joueur ne le découvre qu'en se trompant : « Retourne lui redemander sa commande. » | mineur |

### Hanoï

Points de reprise bien guidés :
- Arrivée : la maison violette, puis l'agence (« la maison noire, un peu plus loin »).
- La maison, en entrant, renvoie à l'agence.
- M. Lam : les touristes « dans la grande rue, un peu plus loin que l'agence », le temple « de l'autre côté du lac ».
- Les touristes : « Va vite lui raconter ! »
- Ellipse annoncée : « Six mois plus tard… »

| # | Où | Problème | Gravité |
|---|---|---|---|
| 15 | `hanoiStory.js` `PATRON_WELCOME` (première fois) et `passer` | La première fois, le patron dit seulement « Débrouille-toi ». « Demande dehors » n'arrive que si on lui reparle. Les trois passants ne lisent pas le papier et ne renvoient vers personne. Rien ne mène à M. Lam, isolé sur l'îlot du lac. | gênant |
| 16 | `hanoiStory.js` `SIX_MONTHS_LATER` | Romain dit « Ne rate pas ton vol ! » sans dire où est l'aéroport. Il y a des panneaux aux deux bouts de la rue. | mineur |

### Amsterdam

Points de reprise bien guidés :
- Romain, au téléphone : « la deuxième en haut à gauche ».
- Romain, une fois le bouquet donné : Corning, « le grand manoir de la rue ».
- Ellipse annoncée : « Quelques mois plus tard… »
- La nuit du canal finit sur « Le lendemain… » et le départ pour l'aéroport.

| # | Où | Problème | Gravité |
|---|---|---|---|
| 17 | `amsterdamStory.js` `ROMAIN_WELCOME` | Romain demande d'aller chercher son bouquet sans dire où est le marchand. Le lieu (« de l'autre côté du canal… Passe le pont ! ») n'arrive que si on lui reparle (`ROMAIN_HOME`). | gênant |
| 18 | `amsterdamStory.js` `VENDOR` | Le vendeur donne le bouquet sans dire de le rapporter à Romain. | mineur |
| 19 | `amsterdamStory.js` `MONTHS_LATER` ; `maps/amsterdam.js` | Après « Quelques mois plus tard… », la nuit tombe et le joueur reprend la main devant Corning sans aucune indication. Romain n'est plus à la maison (`unlessFlags: moisAmsterdam`) : il attend au bord du canal (`CANAL_SPOT`), mais aucune réplique ne le dit. | gênant |

### Delhi (`newDelhi`)

Points de reprise bien guidés :
- Harsh mène au palais.
- Harsh : « derrière la vieille porte du fort, de l'autre côté de l'avenue ».
- Ellipse annoncée : « Quelques mois plus tard… »
- Prophecy et Harsh : « L'aéroport, c'est au bout de la grande avenue ».

| # | Où | Problème | Gravité |
|---|---|---|---|
| 20 | `maps/newDelhi.js` (aucun événement d'arrivée) ; `newDelhiStory.js` `CROWD` | Seule ville d'arrivée sans scène d'accueil. Le seul texte est « Je n'ai jamais rien vu de pareil. » Rien ne dit que Prophecy attend au bout de l'avenue, et Romain n'en avait pas parlé en donnant le billet. Le joueur doit remonter l'avenue de lui-même : Prophecy se déclenche à 5 cases. | gênant |
| 21 | `newDelhiStory.js` `FORT_SILENCE`, `SAGE` | Après le silence, rien n'invite à monter les marches vers le sage, qu'on voit pourtant à l'écran. Après le talisman, rien n'invite à sortir du fort, alors que la sortie lance l'ellipse. | mineur |

### Bordeaux (retour, le stade)

Points de reprise bien guidés :
- Prophecy : « au stade, la grande rotonde, juste là ».
- Le directeur : « avance-toi jusqu'à l'estrade ».

| # | Où | Problème | Gravité |
|---|---|---|---|
| 22 | `bordeauxStory.js` `CEREMONY` | La scène finit sur « La suite… c'est à toi de l'écrire », dans le stade, sans invitation à sortir. | mineur |
| 23 | `bordeauxStory.js` `LEAVING_BORDEAUX` | Le texte dit seulement « Direction Paris. » sans dire où : la route est au sud-est (x 31, rangées 30-33). Il n'y a aucun panneau vers Paris dans `maps/bordeaux.js`. L'ouvrier qui parlait de la « route de Paris » n'est plus là. | gênant |

### Paris

Points de reprise bien guidés :
- Antoine : « Tam est devant l'Opéra ».
- Tam : « Louis, dans la file du Louvre ».
- Louis : « Bercy, c'est le grand dôme, en haut à gauche ».
- Camille : le manager « au premier étage : l'ascenseur, au fond », puis le directeur « Dernier étage ».
- Hugues : Thomas au « resto au store rayé, de l'autre côté de la Seine », et lui-même dans « l'immeuble crème, juste à côté ».

| # | Où | Problème | Gravité |
|---|---|---|---|
| 24 | `maps/paris.js` (aucun événement d'arrivée) | Le joueur arrive par le bord ouest d'une carte de 52 x 48, sans image d'accueil ni texte. Le propriétaire attend devant l'immeuble (7, 23), et rien ne dit de le chercher. Le code le veut ainsi (« c'est à Pierre de le trouver »), mais aucun élément du décor ne guide. | gênant |
| 25 | `parisStory.js` `KEYS` | Le propriétaire dit « Le bureau n'est pas loin. » La tour, « de l'autre côté de la Seine, tout en bas à droite », n'est indiquée que si on lui reparle (`LANDLORD`). | gênant |
| 26 | `parisStory.js` `CONCERT` (fin) | Après « Un an plus tard… », Pierre est devant Bercy sans aucune indication. Rien ne renvoie au bureau : c'est en entrant dans la tour que Camille annonce le manager (`MANAGER_CALLS`). | gênant |
| 27 | `parisStory.js` `MATCH` (fin) | Après « Un an plus tard… », Pierre est devant chez Hugues, et rien ne renvoie à la tour, où attend l'appel du directeur (`DIRECTOR_CALLS`). | gênant |
| 28 | `parisStory.js` `OFFICE_FIRST`, `PROMOTION`, `DIRECTOR` | Ces trois scènes du bureau finissent sans inviter à ressortir, alors que la suite se lance à la sortie : l'appel d'Antoine, le message de Hugues, les vingt pas avant le rêve. | mineur |

### Rêve et réveil

Le joueur n'a pas la main pendant le rêve. Au réveil, une bulle « ! » apparaît sur le bureau avec « c'est quoi, cet objet ? », et le « Descends ! » de la cinématique invite à descendre. La consigne fausse de Maman est le point 2.

---

### Ellipses : sont-elles toutes annoncées par un texte visible ?

| Ellipse | Texte affiché | Annoncée |
|---|---|---|
| Saint-Ay, arrivée | « Saint-Ay, Loiret. Quelque temps plus tard… » | oui |
| Saint-Ay, après la cabane | « Quelques années plus tard… » | oui |
| Montépilloy, arrivée | « Montépilloy, Oise. Quelques années plus tard… » | oui |
| Montépilloy, septembre | « Quelques mois plus tard… Septembre. » | oui |
| Collège | « Quatre ans plus tard… La fin de la troisième. » | oui |
| Prytanée, le soir du mur | aucun (fondu au noir seul) | **non** (point 8) |
| Prytanée, le bac | « Quelques années plus tard… » | oui |
| Bordeaux, après la soirée | « Le lendemain matin… » | oui |
| Bordeaux, l'oral d'anglais | « Quelques mois plus tard… » | oui |
| Hull, la soirée | « La nuit tombe sur Hull. » | oui |
| Hull, le petit matin | « Ciel bleuté, les réverbères s'éteignent » | oui |
| Hull, veille d'examen | « Le lendemain… » | oui |
| Hull, les résultats | « Le surlendemain… » | oui |
| Hanoï | « Six mois plus tard… » | oui |
| Amsterdam, le stage | « Quelques mois plus tard… » | oui |
| Amsterdam, le départ | « Le lendemain… » | oui |
| Delhi | « Quelques mois plus tard… » | oui |
| Paris, après le concert | « Un an plus tard… » | oui |
| Paris, après le match | « Un an plus tard… » | oui |

---

### Décompte par gravité

| Gravité | Nombre | Points |
|---|---|---|
| Bloquant | 0 | Toujours au moins une piste, même s'il faut reparler à quelqu'un ou explorer. |
| Gênant | 12 | 1, 4, 8, 15, 17, 19, 20, 23, 24, 25, 26, 27 |
| Mineur | 16 | 2, 3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 16, 18, 21, 22, 28 |

**Total : 28 points.**

La fin de partie est la moins guidée : Amsterdam, Delhi, le départ de Bordeaux et Paris réunissent 8 des 12 points gênants. On y trouve deux défauts qui reviennent. Le lieu à rejoindre n'est donné qu'en reparlant au PNJ (points 1, 17, 25). Après une ellipse ou une arrivée, rien ne dit où aller (points 19, 20, 24, 26, 27).

## Passe 3 — Robustesse

## Poképierre : revue de robustesse (passe 3, lecture seule)

Méthode : lecture de MapScene, TitleScene, StartMenu, save, flags, items, souvenirs, memo, bike, Player, interactions, des fichiers `*Story.js` et des cartes. J'ai aussi écrit un script d'analyse jetable (`scratchpad/scan.mjs`, hors du dépôt) qui importe `MAPS` et `interiors` et parcourt toutes les scénettes : useTrait, gains, gardes et scènes qui se ferment avant d'avoir tout posé. Aucun fichier du dépôt n'a été modifié.

Ce qu'il faut savoir d'abord : la sauvegarde n'est pas atomique.
- Chaque `flags.add`, `items.add/remove`, `souvenirs.add` et `memo.set` écrit tout de suite dans localStorage.
- La position est écrite à chaque pas (`MapScene.handleStep`), à l'arrivée sur une carte (`setupMap`) et après `walkPlayer` / `caughtBy`.
- Si la page se ferme au milieu d'une scénette, on garde donc la moitié des effets.
- Beaucoup de scénettes posent leur drapeau de garde au début (`unlessFlags`) et le drapeau qui fait avancer l'histoire à la fin. Une interruption entre les deux bloque la partie (voir le cas 10).

---

### 1. Retour dans une ville précédente en pleine quête

**Verdict : non géré, à cause du piège de Fort-de-France. Le reste est géré.**

- **Flags et PNJ (géré).** Tout est conditionné par des drapeaux globaux (`meetsConditions`) et `refreshActors()` recrée les PNJ à chaque arrivée. Les PNJ déplacés reprennent leur place (`restoreHome` à l'arrêt de la scène). Les quêtes finies sont presque toutes gardées par une première ligne `ifFlags` ou `ifItems … end: true` : OLD_FISHER, PULLEY, BENOIT_SAD, HOMESICK, CHESS_PLAYERS, CYCLIST, VENDOR, PROF, ENGLISH_ORAL, CAMPAIGN, FELIX_AT_CABANE (branche `arriveeMontepilloy`), LOUIS, DIRECTOR. On ne peut pas relancer une quête finie, sauf volontairement par Start > QUÊTES, qui remplace la partie.

- **BLOQUANT : Fort-de-France est un cul-de-sac.**
  - Où : `data/maps/airport.js` (OTHER_FLIGHTS), `data/fortDeFranceStory.js` (FISHER_AT_FERRY), `data/maps/fortDeFrance.js`.
  - « Autre → Fort-de-France » est proposé à l'aéroport sans aucune condition.
  - Fort-de-France n'a ni sortie vers l'aéroport (pas de `toAirport`) ni autre `warp`.
  - Le capitaine (`pecheur`, `ifFlags: papaFait`, sans `unlessFlags: departFortDeFrance`) rejoue « Pas de canne, pas de capitaine », puis « Ton père en a toute une collection… ».
  - La canne est déjà partie et la caisse de Papa est fermée par `unlessFlags: canneOfferte`. Le joueur ne peut plus quitter l'île.
  - Même piège si l'onglet se ferme pendant la traversée (DEPARTURE pose `departFortDeFrance` avant le voyage, voir le cas 8).
  - Seule issue : Start > QUÊTES, qui écrase la partie.

- **GÊNANT : les suiveurs voyagent avec Pierre.**
  - Où : `data/story.js` (FOLLOWERS), `systems/Followers.js`.
  - Les suiveurs ne dépendent que de drapeaux globaux.
  - Pierre peut aller à l'aéroport, ou prendre une route, avec les touristes de Hanoï, Thomas, la bande de Hull ou les copains de Montépilloy. Ils le suivent alors dans les autres villes jusqu'à leur drapeau de fin, et le vélo est refusé pendant ce temps.

- **Ailleurs, les retours sont possibles et cohérents.** Saint-Ay ↔ Montépilloy à pied, puis la route de Bonsecours, le Prytanée et la sortie nord vers Bordeaux (`ifFlags: arriveeBordeaux`). `check_paths.js` ne trouve aucun blocage à l'intérieur des cartes.

### 2. Sauvegarde pendant une cinématique ou un fondu

**Verdict : géré. Le menu est bloqué, mais le bouton « Sauvegarder » ne sert presque à rien.**

- `StartMenu.canOpen()` refuse l'ouverture dans quatre cas : `map.transitioning` (posé par `goTo` avant le fondu), `map.scripting` (posé par `runScript` et `caughtBy`), `player.moving`, `dialog.isOpen`.
- La touche I (`UIScene`) passe par le même `canOpen`. Les commandes tactiles envoient de fausses touches et subissent donc les mêmes gardes.
- Le menu reste ouvrable pendant la fin non bloquante d'une scénette, quand un PNJ s'éloigne (`walk` en fin de scénette, voir `runSteps`/`trailingFlags`). C'est voulu. Les drapeaux `then` sont alors en attente (`pendingWalkFlags`), et « Quitter » appelle `scene.stop()`, qui les pose au `shutdown`. L'état reste cohérent.
- **GÊNANT** (`StartMenu.save` / `StartMenu.quit`) : « SAUVEGARDER » et « QUITTER SANS SAUVEGARDER » laissent croire qu'il existe un état non sauvegardé. Or drapeaux, objets, vertus et memo sont déjà écrits, et la position aussi, à chaque pas. « Sans sauvegarder » ne revient sur rien.
- Au rechargement, `TitleScene.continueGame` relance la scène sauvée à la dernière case. Les événements `on: 'enter'` dont les conditions sont encore remplies se rejouent.

### 3. PNJ dans le désordre, ou deux fois le même PNJ de quête

**Verdict : géré. Pas de double objet ni de double vertu.**

- `items.add` et `souvenirs.add` renvoient `false` si on a déjà l'objet ou la vertu. Ce retour est vérifié partout :
  - `runSteps` : `step.give && items.add(...)` et `step.trait && souvenirs.add(...)` ;
  - `giveSouvenir` ;
  - `interact` : `item && !done && items.add(item)` ;
  - `runTrigger` : `trigger.item && items.add`.
- Un objet rendu (`take`) peut en revanche être redonné. J'ai vérifié chaque donneur concerné, tous ont une garde par drapeau : canne (`canneOfferte`), enceinte et gobelets (`soiree`), clé d'antivol (`unlessItems` clé et vélo), bouquet (`marchandiseAchetee`), place de concert (`placeLouis`, `concertParis`).
- L'ordre est imposé par des conditions par étape. Exemples : Maman de Fort-de-France demande `papaFait` et `secretManon` ; la tournée de Hull se fait commande par commande ; le tonneau de Benoît demande Margaux et Étienne.
- Rejouer donne seulement une réplique `after` ou une réplique de fin.
- Mineur : `souvenirs.use` compte chaque « Pierre utilise X ». Les scènes rejouables le gardent (`unlessFlags: TIDY_FLAGS`, `ifItems`), donc pas d'inflation constatée.

### 4. Vélo

**Verdict : géré** (`systems/bike.js`, `MapScene.setupMap`, `MapScene.runScript`).

- **Intérieur :** `bikeRefusal` refuse dans les intérieurs et sur les cartes `indoor` (l'aéroport). `resumeBike` à l'entrée d'un bâtiment remet `velo=0`.
- **Dialogue, menu, scénette, fondu :** la touche V est ignorée si `dialog.isOpen`, `menuOpen`, `scripting` ou `transitioning` (`setupMap`, écouteur keydown). `toggleBike` refuse aussi si `player.moving`.
- **Cinématique :** `runScript` → `pauseBike` (Pierre descend, sans effacer le souhait), puis `unpauseBike` à la fin. Celui-ci ne fait rien si un voyage est lancé ; c'est la carte suivante qui reprend le vélo. S'il y a maintenant un suiveur, il efface le souhait.
- **Suiveur qui arrive :** `checkBike` dans `refreshActors`.
- **Eau :** sans objet. L'eau n'est jamais praticable (pas de Surf), donc rien à faire.
- Pendant un dialogue simple (PNJ sans `script`, panneau), Pierre reste sur le vélo, comme dans Pokémon.
- **Mineur :** `caughtBy` (rondes du Prytanée) ne descend pas Pierre du vélo. Impossible en pratique : le vélo s'obtient à Bordeaux, après les rondes.

### 5. Menu ouvert pendant un fondu, une téléportation ou un déplacement scripté

**Verdict : géré.**

- **Fondu de sortie :** `goTo` pose `transitioning` avant `fadeOut`.
- **Traversée, vol, trajet en voiture :** `FerryScene` n'a ni `player` ni `savePosition`, donc `StartMenu.mapScene()` ne trouve aucune scène et `canOpen` vaut false.
- **Déplacements scriptés :** `walkPlayer`, `approach`, `walk … block` se déroulent tous dans `runScript`, donc avec `scripting` levé.
- **Scénettes d'entrée :** `runEnterEvents` enchaîne les `runScript` sans laisser passer de touche.
- **Rondes (`caughtBy`) :** `scripting` levé.
- Seul cas ouvert, sans risque : le fondu d'apparition (150 ms) d'une nouvelle carte.
- Entrée / Espace qui ferme un dialogue ou le menu ne relance pas une interaction (`closedAt`, `tryInteract`).

### 6. Verrous de vertus : toutes les utilisations de `useTrait`

Scènes de retour avec réplique d'indice, telles que les décrit CLAUDE.md :

| Lieu | Script | Vertu | Indice sans la vertu | Déblocage avec |
|---|---|---|---|---|
| Saint-Ay, poulie (prop `pulleyStuck` / `pulleyFixed`, `ifFlags: arriveeMontepilloy`) | saintAyStory `PULLEY` | Ingéniosité | oui (`unlessSouvenirs` : « La poulie est grippée. ») | oui, règlement du QG |
| Saint-Ay, vieux pêcheur | saintAyStory `OLD_FISHER` | Joie de vivre | oui (« Le vieil homme te tourne le dos… ») | oui, galet du lac |

Utilisations sans indice, possibles parce que la vertu est obligatoire plus tôt dans l'histoire principale :

| Lieu | Script | Vertu | Facultatif ? |
|---|---|---|---|
| Montépilloy, Benoît triste | `BENOIT_SAD` | Joie | oui |
| Montépilloy, tonneau de Benoît | `FOUND_BENOIT` | Esprit d'équipe | non (l'indice parle des amis, pas de la vertu) |
| Collège, placard de Margaux | `CLOSET` | Ingéniosité | oui |
| Collège, prof (brevet) | `PROF` | Audace | non |
| Prytanée, le nouveau | `HOMESICK` | Joie | oui |
| Prytanée, inspection puis le mur | `INSPECTION` | Esprit d'équipe | non |
| Prytanée, matin | `MORNING` | Audace | non |
| Bordeaux, coupure | `BLACKOUT` | Ingéniosité | non |
| Bordeaux, rangement | `tidy` | Autonomie | non |
| Bordeaux, oral d'anglais | `ENGLISH_ORAL` | Audace | non |
| Bordeaux, cycliste | `CYCLIST` | Ingéniosité | oui |
| Saint-Ay, cabane | `CABANE_FETE` | Joie | non |
| Hull, pari aux fléchettes | `DARTS` / `HABITUE` | Audace | non |
| Hull, Asylum | `ASYLUM_DANCE` | Joie | non |
| Aéroport, vol pour Hanoï | `FLIGHT_TO_HANOI` | Autonomie | non |
| Hanoï, temple | `TEMPLE_PANIC` | Insouciance | non |
| Hanoï, papis | `CHESS_PLAYERS` | Audace | oui |
| Amsterdam, Corning | `CAMPAIGN` | Autonomie | non |
| Amsterdam, canal | `CANAL_NIGHT` | Insouciance | non |
| Delhi, repas | cour | Joie | non |
| Paris, directeur | `DIRECTOR` | Liberté | non (reçue juste avant, `quiet`) |

Vérification de l'ordre : chaque vertu employée sans condition est obligatoire avant le lieu où elle sert. Joie est exigée par le capitaine de Fort-de-France, Esprit d'équipe par la cabane, Ingéniosité par `DAY_DONE` à Montépilloy, Audace par Camille, Autonomie par l'inspection, Insouciance par `SLEEP` à Hull. Aucune utilisation sans la vertu n'est donc possible, ni par l'histoire normale ni par QUÊTES (`questState` donne les vertus des villes précédentes).

Mineur :
- La réplique d'indice du vieux pêcheur est inatteignable : Joie est obligatoire avant Saint-Ay. Le seul vrai verrou avec indice est donc la poulie.
- **Adaptation** (Hanoï) n'est utilisée nulle part comme clé (aucun `useTrait: TRAITS.adaptation`), contrairement à la règle de CLAUDE.md : « chaque ville utilise au moins une vertu ».

### 7. Nouvelle partie par-dessus une sauvegarde

**Verdict : géré, avec un oubli mineur.**

- **Confirmation :** `TitleScene.onNewGame` demande « Effacer la partie en cours ? » (Non / Oui) si `hasSave()`.
- **Remise à zéro :** `save.eraseSave` efface :
  - la position (`pokepierre.position`) ;
  - les souvenirs et vertus, avec leurs compteurs d'utilisation (`souvenirs.reset` vide aussi `traitUses`) ;
  - les drapeaux, villes visitées comprises (`visite-*` sont des drapeaux) ;
  - le sac (`items.reset`) ;
  - le memo (mot de passe du QG, ville de l'aéroport).
- Les positions des PNJ en mémoire sont rétablies au `shutdown` (`restoreHome`).
- « Apparences » : le choix d'apparence des PNJ vit dans le créateur (`characterLooks.json`, fichier source), pas dans la sauvegarde.
- Options audio conservées, et c'est voulu.
- **Mineur :** `pokepierre.velo` n'est pas effacé. Une nouvelle partie hérite du souhait « à vélo » de l'ancienne : dès le vélo reçu à Bordeaux, Pierre peut remonter tout seul à l'arrivée sur une carte (`resumeBike`).
- **Mineur :** `StartMenu.goToQuest` appelle `eraseSave()`, puis `goTo`. Le `shutdown` de l'ancienne scène pose ensuite les `pendingWalkFlags` de l'ancienne partie dans le nouvel état. Cela n'arrive que si un PNJ marchait encore quand on a ouvert le menu.

### 8. Fermeture de l'onglet en plein milieu

**Verdict : non géré.**

Contenu de la dernière sauvegarde :
- la position de la dernière case atteinte (ou de l'arrivée, ou de la fin d'un `walkPlayer`) ;
- tous les drapeaux, objets, vertus et memo posés jusque-là, y compris au milieu d'une scénette.

Ce qui est perdu :
- les drapeaux `then` des PNJ encore en marche : il n'y a aucun `beforeunload` / `pagehide`, et le `shutdown` ne se déclenche pas à la fermeture de l'onglet ;
- tout ce que la scénette aurait posé après le point d'interruption.

Au rechargement, un événement `on: 'enter'` dont les conditions sont encore remplies rejoue sa scénette. Ce cas est bien géré : Bercy, le match chez Hugues, l'arrivée à Montépilloy, le matin au dortoir avant `murMatin`, l'entrée chez Félix… Plusieurs marches ont même un événement de reprise : OUSMANE_WALK et LEO_SCOUT_* à Hull, HARSH_WALK à Delhi, `capitaineAccueil` au Prytanée, CLINIC_EXIT, MANON_NEWS.

Pour les voyages :
- les vols interrompus se rattrapent par « Autre » à l'aéroport ;
- la voiture Saint-Ay → Montépilloy par la route à pied ;
- la voiture Prytanée → Bordeaux par la sortie nord (`ifFlags: arriveeBordeaux`) ;
- le ferry de Fort-de-France **non** : voir le cas 1, BLOQUANT.

Les scénettes non atomiques sont détaillées au cas 10.

### 9. Changement de structure des données : anciennes sauvegardes

**Verdict : incertain. Pas de numéro de version.**

- Les données sont dans sept clés localStorage indépendantes, sans version ni schéma.
- Migrations connues, toutes rejouées à chaque démarrage et sans effet sur une sauvegarde récente :
  - `migrateSave()` (`main.js`) : vertus renommées ou retirées (`TRAIT_MIGRATION`), avec un drapeau de remplacement ;
  - `items.load` : `OLD_IDS` (vieille canne retirée, pierre gravée → talisman), corrigé en mémoire et réécrit à la prochaine écriture ;
  - drapeaux : `placeTam` garde l'ancienne valeur `'place-ines'`. L'ancien `'place-malik'` reste orphelin, et `LOUIS` traite à part le cas « ancienne partie, place déjà rendue » ;
  - lieux retirés : `continueGame` renvoie à Paris (6,23) si la carte ou l'intérieur sauvé n'existe plus, quels que soient les drapeaux.
- Position sauvée devenue un mur : `setupMap` revient au `map.spawn`. Les intérieurs sans `spawn` gardent la case invalide ; on en sort au premier pas si une case voisine est libre.
- **Mineur :** rien ne permet de repérer une sauvegarde faite entre deux refontes. Un drapeau renommé ou supprimé sans entrée de migration ne se voit pas. Impossible de confirmer sans anciennes sauvegardes réelles, d'où le verdict incertain.

### 10. Toutes les situations où le joueur peut rester bloqué

Les vérifications automatiques ne voient aucun de ces cas : le blocage vient d'un état de drapeaux incohérent ou d'un voyage sans retour. Issue commune à tous : Start > QUÊTES, qui écrase la partie à partir du début de la ville.

#### Bloquants

| # | Fichier / fonction | Déclencheur | Pourquoi on reste bloqué |
|---|---|---|---|
| B1 | `airport.js` OTHER_FLIGHTS, `fortDeFranceStory.js` FISHER_AT_FERRY / DEPARTURE | vol « Autre → Fort-de-France », ou onglet fermé pendant la traversée | voir cas 1 : Fort-de-France n'a aucune sortie une fois `departFortDeFrance` posé |
| B2 | `montepilloyStory.js` REPAIR (dans BOULY / JEAN_TRACTOR) | fermeture pendant le quiz des outils | `take: pieceTracteur` est la 1re étape. Le tas de foin (`interiors.js` boulyBarn, `setFlag: pieceTrouvee`) ne redonne plus la pièce (`done`). Jean et M. Bouly exigent la pièce, donc pas d'Ingéniosité et pas de départ |
| B3 | `montepilloyStory.js` GAME_OVER / REPAIR → END_OF_DAY | fermeture après le cache-cache et la vertu, avant `setFlag: septembre` (noir + 600 ms, ou les dialogues qui suivent la vertu dans REPAIR) | GAME_OVER est fermé par `copainsPartent` et REPAIR par l'absence de pièce. Plus rien ne pose `septembre` ; NORTH_EXIT répète « Ta journée n'est pas finie. » sans aucun indice |
| B4 | `saintAyStory.js` CABANE_PLAN (`interiors.js` felixHouse, enter, `unlessFlags: maisonFelixVisitee`) | fermeture pendant les dialogues chez Félix | `maisonFelixVisitee` est posé à l'étape 0 et `planCabane` à la fin. Sans `planCabane`, pas de planches ni de corde ; Félix répète qu'il en manque |
| B5 | `collegeStory.js` LOCKER_FIGHT (objet casier) | fermeture après `casierPartage`, pendant le choix, les répliques ou la marche finale de Rémy | `remiEnClasse` n'est posé que par la marche de Rémy. Le casier est fermé par `casierPartage` et `remi-casier` (script REMI) ne remarche pas. Donc pas de REMI_INVITE, et Camille répond « Une fille de ta classe sort ses cahiers. » |
| B6 | `collegeStory.js` CAMILLE | fermeture après `trait: Audace`, avant `setFlag: finTroisieme` (plusieurs répliques) | Camille s'arrête sur `ifSouvenirs: audace … end`, et PROF répète « Sors ton cahier » (`unlessFlags: finTroisieme`), donc pas de brevet |
| B7 | `collegeStory.js` PROF | fermeture sur la réplique « Tu reçois ton diplôme du brevet » | PROF s'arrête sur `ifItems: brevet`. `bonsecoursFini` n'est jamais posé et le militaire de la route du Prytanée (`routeBonsecours.js` GUARD) bloque |
| B8 | `prytaneeStory.js` task → INSPECTION | fermeture pendant l'inspection, qui est longue | `chambrePrete` est posé à la 1re étape, et ALL_DONE (`unlessFlags: chambrePrete`) ne rejoue plus. Ni Autonomie, ni `inspection`, ni `murPropose`. En plus, `capitaine-inspection` (`ifFlags: chambrePrete`, `unlessFlags: inspection`) réapparaît en (12,3), **sur l'escalier de sortie du dortoir**, sans dialogue : Pierre est enfermé au dortoir et au 2e étage |
| B9 | `prytaneeStory.js` INSPECTION, fin | fermeture pendant que Geoffrey marche vers l'escalier (Pierre a la main) | `murPropose` n'est posé qu'à son arrivée, sans reprise. NIGHT (rondes, porte nord) ne s'ouvre jamais ; Tanguy et Geoffrey restent avec leurs répliques de rangement |
| B10 | `prytaneeStory.js` MORNING (dortoir, enter, `unlessFlags: murMatin`) | fermeture après `murMatin`, sur « Quelques années plus tard… » | `ellipseBac` n'est posé qu'ici. Pas de panneau des résultats, pas de bac, porte nord muette |
| B11 | `hanoiStory.js` SIX_MONTHS_LATER (`hanoi.js` enter, `unlessFlags: sixMoisHanoi`) | fermeture pendant l'appel de Romain | `appelRomain` est posé après les répliques, et c'est la seule condition du vol pour Amsterdam (`airport.js` NEXT_FLIGHTS) |
| B12 | `amsterdamStory.js` ROMAIN_HOME | fermeture sur « Tu donnes le bouquet… » ou la réplique de Romain | le bouquet est rendu (`take`) avant `setFlag: marchandiseDonnee`. VENDOR ne le redonne pas (`marchandiseAchetee`), Romain renvoie chez le marchand, et la porte de Corning (`amsterdam.js` lock `ifFlags: marchandiseDonnee`) reste fermée |

#### Gênants

- **G1** : boutons « Sauvegarder » et « Quitter sans sauvegarder » trompeurs (cas 2).
- **G2** : suiveurs emmenés dans d'autres villes (cas 1).
- **G3** : `saintAyStory.js` CABANE_FETE. Fermeture après Esprit d'équipe, avant `ellipseSaintAy` : la scène ne se rejoue plus (`unlessSouvenirs`). « Quelques années plus tard… » et MANON_NEWS sont perdus. L'histoire continue, car l'annonce à la maison ne dépend que de la vertu, mais il manque une scène.

#### Mineurs

- **M1** : `prytaneeStory.js` MORNING, marche finale. `bacDescente` est perdu. Tanguy et Geoffrey restent au dortoir, mais leurs répliques s'affichent quand même au panneau (`faceActors` ignore les absents). Le bac reste obtenable.
- **M2** : `hullStory.js`, événement de sortie de l'Asylum. Fermeture après Insouciance, avant `bandeRentree` et le voyage : la bande reste dehors et la coloc n'est pas plongée dans le noir. SLEEP se lance quand même.
- **M3** : `bordeauxStory.js` OUSMANE_WAKES. Fermeture entre `ousmaneLeve` et le don de la photo : la photo de la soirée (facultative) est perdue.
- **M4** : après la fin du jeu, « Continuer » ramène Pierre à Fort-de-France, île sans sortie (même cause que B1, mais l'histoire est finie).
- **M5** : `velo` non effacé ; drapeaux en attente injectés par QUÊTES (cas 7).
- **M6** : pas de version de sauvegarde, `'place-malik'` orphelin, repli sur Paris quels que soient les drapeaux (cas 9).
- **M7** : indice du vieux pêcheur inatteignable ; Adaptation jamais utilisée comme clé (cas 6).

#### Incertain

Le PNJ pris pour une pièce n'est pas toujours le bon : une position sauvée peut tomber sur la case de départ d'un PNJ remis en place au rechargement. Par exemple, Pierre assis entre Camille et Rémy si on recharge avant `finTroisieme`. Pierre peut alors être pris entre des PNJ immobiles. Je ne l'ai pas reproduit, car il faudrait vérifier le cas dans le navigateur.

#### Précédents bien gérés

Les cas suivants, interrompus, se rattrapent :
- arrivée à Saint-Ay (`familleSuit` perdu, mais BIRTH ne demande que `saArrivee`) ;
- chantier de la cabane (planches et corde se reprennent) ;
- soirée de Bordeaux (enceinte et gobelets redonnés) ;
- cycliste (la clé se retrouve) ;
- M. Lam (rejoue et pose le drapeau en silence) ;
- Louis (`ifItems`), concert et match (événements d'entrée) ;
- vols (« Autre ») et voitures.

Les marches avec événement de reprise sont aussi correctes : Hull, Delhi, Prytanée, la sortie de la clinique, Manon au lac.

### Sortie de `node scripts/check_paths.js`

```
Aucun blocage trouvé.
Sprites : 207 apparences, toutes présentes.
```

Ce que ce script ne vérifie pas, d'après son en-tête et son code, et qui explique pourquoi il ne voit aucun des cas B :
- il lève les drapeaux un par un dans l'ordre de `FLAGS`, sans jamais tester d'état intermédiaire incohérent ;
- il ignore les conditions d'objets et de vertus ;
- il ne suit pas les PNJ qui marchent pendant une scénette (d'où B8, le capitaine sur l'escalier) ;
- il ne vérifie que la connexité à l'intérieur de chaque carte, pas qu'on puisse en ressortir vers la suite de l'histoire (d'où B1).

### Décompte par gravité

| Gravité | Nombre | Problèmes |
|---|---|---|
| Bloquant | **12** | B1 à B12 |
| Gênant | **3** | G1 à G3 |
| Mineur | **7** | M1 à M7 |
| Incertain | **2** | anciennes sauvegardes sans version (cas 9), position sauvée entre des PNJ remis en place |

Tous les bloquants sauf B1 demandent de fermer l'onglet, de recharger ou d'avoir un plantage pendant une scénette. B1 se déclenche en jouant normalement, par le vol « Autre → Fort-de-France ».

## Passe 4 — Rythme

## Passe 4 : rythme (estimation à partir du code)

Revue faite en lecture seule. Aucun fichier du dépôt n'a été modifié. Les scripts d'analyse sont dans le scratchpad :
`rythme.mjs` (comptages, simulation des scénettes, tableau), `amb.mjs` (dialogues d'ambiance) et `intro.mjs` (intro).

### Méthode (approximative)

- **Rattachement à une ville.** Je commence par les exports de chaque `*Story.js` : chacun est compté dans sa ville, et
  pour `bordeauxStory.js`, BACK_FROM_DELHI, STADIUM*, CEREMONY, REUNION_LINES et LEAVING_BORDEAUX vont dans « Bordeaux
  (stade) ». Viennent ensuite les cartes (`maps/index.js`, avec les PNJ de `npcEdits` déjà appliqués) et les intérieurs,
  rattachés à leur ville à la main. `routeMontepilloy` est compté à Saint-Ay et `routeBonsecours` au collège. Sur la
  carte de Bordeaux, toute entrée sous `ifFlags` retourBordeaux, stadeIndique, diplomeBordeaux ou adieuxBordeaux va au
  stade. L'aéroport est mis à part. Un tableau ou une étape n'est compté qu'une fois, dans la première ville où il
  apparaît (déduplication par identité d'objet). WAKE_UP, TALISMAN et FINALE vont donc au Rêve.
- **Mots.** Je compte les mots (jetons qui contiennent une lettre ou un chiffre) de tous les textes `say`, `dialogue`,
  `lockedDialogue`, `readyDialogue`, `after`, `choose`, des libellés de choix, des `quiz` (question, choix, `wrong`), de
  `text`, `win`/`lose`, des cartes postales `opening` et des cartons `cards`, plus les encarts générés (« Pierre a reçu la
  vertu X ! », « Pierre utilise X ! »). Le monologue du pont du ferry (FerryScene.playDeck, codé en dur, 13 bulles,
  environ 95 mots) est ajouté à Fort-de-France. Je sépare deux catégories :
  - **scènes** : `events`, `script`, étapes ;
  - **ambiance** : `dialogue` simples des PNJ et des objets, portes fermées.

  Toutes les branches sont comptées (rappels, mauvaises réponses, « Non »). Le total est donc un **plafond**.
- **Mots lus (estimation centrale)** = 0,8 × mots de scènes + 0,4 × mots d'ambiance (une partie des branches et des PNJ
  facultatifs n'est jamais lue).
- **Durée** = mots lus / 150 par minute + 30 s par déplacement entre deux lieux de quête. J'ai estimé les déplacements
  à la main, quête par quête, d'après la bible : environ un trajet vers le lieu de chaque étape, plus le retour au
  donneur de quête quand il y en a un. Les mini-jeux, les marches scriptées et l'animation du texte (25 ms par caractère)
  ne sont pas comptés.
- **Bulles.** Coupure gloutonne à 55 caractères par ligne, 2 lignes par bulle (comme `DialogBox.paginate`, en
  approximant la largeur de police). L'erreur est d'environ ±1 bulle par page longue.
- **Bulles d'affilée et enchaînements.** Je rejoue chaque scénette (événements `enter`/`walk`, `script` des PNJ, objets,
  déclencheurs et accessoires) sous plusieurs états de drapeaux : chaque combinaison `ifX` rencontrée, avec ou sans les
  rappels `unlessX + end`. Les `travel` sont suivis jusqu'aux événements `enter` de la destination dont les conditions
  sont remplies, avec les écrans de trajet ferry, voiture ou avion. Une série de bulles est coupée seulement par un choix,
  un quiz, la saisie d'un mot ou les fléchettes (le joueur agit, sans pour autant reprendre le contrôle de Pierre).
  Un « segment » de cinématique commence à chaque fondu au noir, carte postale, écran de trajet, arrivée sur une
  nouvelle carte avec scène, fondu du rêve, fondu des vertus ou série de cartons. J'ai relu à la main chaque chaîne
  détectée et écarté les faux positifs : par exemple, l'OPENING_CINEMATIC détecté en double au réveil, alors que seul
  WAKE_UP joue à ce moment.
- **Cinématiques par ville** = nombre d'`events` + scripts non événementiels « longs » (au moins 12 bulles, ou
  contenant un fondu ou un voyage).
- **Téléportations** : `travel` (étapes scriptées distinctes) et `warp` (liaisons distinctes source → destination des
  déclencheurs : escaliers, couloirs, sorties de ville ; les portes `doors` ne sont pas comptées).
- **Verrous de vertu** : étapes `useTrait` distinctes dans le source. Une même étape réutilisée par trois tâches, comme le
  rangement de Bordeaux, compte une fois.
- **Quêtes** : les points numérotés « Quêtes, dans l'ordre » de la bible. Le stade compte 4 étapes (section 11), le Rêve 3
  (réunion, réveil, fin). Les passages optionnels ne sont pas comptés.

### Tableau par ville

| Ville | Quêtes | Cinématiques (dont events) | Mots scènes | Mots ambiance | Mots total | Bulles total | `travel` | `warp` | Verrous de vertu | Déplac. | Durée centrale | Durée plafond | × médiane |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fort-de-France | 5 | 7 (6) | 723 | 360 | 1 083 | 180 | 1 | 2 | 0 | 7 | 8,3 min | 10,7 min | 0,97 |
| Saint-Ay (+ route) | 7 | 9 (7) | 1 250 | 410 | 1 660 | 293 | 3 | 5 | 3 (Joie ×2, Ingéniosité) | 8 | 11,8 min | 15,1 min | 1,37 |
| Montépilloy | 5 | 7 (5) | 933 | 467 | 1 400 | 244 | 2 | 3 | 2 (Esprit d'équipe, Joie) | 9 | 10,7 min | 13,8 min | 1,24 |
| Collège Bonsecours | 3 | 5 (3) | 1 088 | 648 | 1 736 | 230 | 2 | 9 | 2 (Ingéniosité, Audace) | 7 | 11,0 min | 15,1 min | 1,28 |
| Prytanée | 3 | 8 (4) | 598 | 667 | 1 265 | 227 | 2 | 6 | 3 (Esprit d'équipe, Joie, Audace) | 6 | 8,0 min | 11,4 min | 0,93 |
| Bordeaux (études) | 4 | 7 (5) | 1 001 | 687 | 1 688 | 307 | 3 | 10 | 4 (Ingéniosité ×2 dont 1 optionnel, Autonomie, Audace) | 10 | 12,2 min | 16,3 min | 1,42 |
| Hull | 8 | 17 (17) | 1 798 | 642 | 2 440 | 595 | 5 | 1 | 3 (Joie, Audace, Autonomie) | 10 | **16,3 min** | 21,3 min | **1,90** |
| Hanoï | 6 | 7 (7) | 801 | 110 | 911 | 116 | 1 | 1 | 2 (Audace, Insouciance) | 8 | 8,6 min | 10,1 min | 1,00 |
| Amsterdam | 7 | 5 (4) | 644 | 53 | 697 | 94 | 1 | 1 | 2 (Autonomie, Insouciance) | 8 | 7,6 min | 8,6 min | 0,88 |
| Delhi | 6 | 5 (5) | 786 | 136 | 922 | 121 | 1 | 1 | 1 (Joie) | 6 | 7,6 min | 9,1 min | 0,88 |
| Bordeaux (stade) | 4 | 3 (3) | 366 | 111 | 477 | 104 | 0 | 1 | 0 | 4 | **4,2 min** | 5,2 min | **0,49** |
| Paris | 7 | 10 (10) | 1 135 | 650 | 1 785 | 336 | 3 | 2 | 1 (Liberté) | 9 | 12,3 min | 16,4 min | 1,43 |
| Rêve + réveil | 3 | 1 (1) | 296 | 0 | 296 | 100 | 1 | 0 | 0 | 3 | **3,1 min** | 3,5 min | **0,36** |
| (Aéroport, transit) | – | 0 | 45 | 61 | 106 | 49 | 0 | 1 | 0 | – | – | – | – |

- **Médiane** des durées centrales : **8,6 min** (Hanoï). Seuils : plus de 17,2 min ou moins de 4,3 min.
- **Total** : environ **2 h** (central), environ 2 h 35 (plafond), plus les mini-jeux, les marches et les trajets.
- **Mots par quête** (total / quêtes) : moyenne d'environ 270. Collège : 579 (plus de 2 fois). Prytanée et Bordeaux :
  environ 420. Amsterdam : 100, le plus bas.

### Villes hors de la fourchette (0,5 à 2 fois la médiane)

- **Hull : 1,90 fois la médiane.** C'est juste sous le seuil, mais c'est la ville la plus lourde de loin : 17 événements,
  595 bulles, 8 quêtes. Au plafond, Hull dépasse 21 min, soit environ 1,5 fois la médiane des plafonds. À surveiller.
- **Bordeaux (stade) : 0,49 fois la médiane.** C'est juste sous la moitié, mais ce chapitre est un épilogue court (les
  diplômes) par construction.
- **Rêve + réveil : 0,36 fois la médiane.** Ce n'est pas une ville, mais la fin. Sa brièveté est voulue.

Aucune vraie ville ne dépasse 2 fois la médiane. Hors épilogues, aucune ne descend sous la moitié.

### Enchaînements d'au moins 3 cinématiques ou dialogues sans reprise du contrôle

« Segments » : scènes séparées par un fondu, un écran de trajet, une carte postale ou un changement de carte avec scène
à l'arrivée. J'ai vérifié chaque chaîne à la main dans le source.

1. **Départ de Fort-de-France** (`fortDeFranceStory.js` FISHER_AT_FERRY → GIVE_ROD → DEPARTURE ; `FerryScene.playDeck` ;
   `saintAyStory.js` ARRIVAL). Après le « Oui », il y a 2 bulles, un fondu, la scène du pont (famille, puis monologue du
   capitaine, 13 bulles), l'encart « Tu emportes », la carte postale de Saint-Ay, puis Papa (3 bulles) et Manon. Cela
   fait **4 segments et environ 21 bulles** sans contrôle.
2. **La cabane de Saint-Ay** (`saintAyStory.js` FELIX_CHANTIER → CABANE_FETE → MANON_NEWS). Felix, fondu (la
   construction), la fête au QG (avec la saisie du mot de passe), un fondu « Quelques années plus tard… », puis Manon au
   bord du lac. Cela fait **4 segments et environ 19 bulles**. Après quelques pas, l'annonce de Papa (ANNOUNCEMENT, 11
   bulles) suit aussitôt.
3. **La voiture de Saint-Ay** (`saintAyStory.js` CAR → `montepilloyStory.js` ARRIVAL). La voiture démarre, fondu,
   dialogue dans la voiture (5 bulles), écran de trajet en voiture et encart, carte postale de Montépilloy, scène
   d'arrivée. Cela fait **4 segments et environ 10 bulles**.
4. **La dernière tâche de la chambre au Prytanée** (`prytaneeStory.js` MAKE_BED / TIDY_WARDROBE / PREPARE_DESK, selon
   celle qui finit). Il y a la tâche, l'inspection (environ 9 bulles), la vertu Autonomie, un fondu de nuit, puis Tanguy
   propose de faire le mur. Cela fait **3 segments et environ 15 bulles**.
5. **Le mur réussi au Prytanée** (`prytaneeStory.js` NORTH_GATE_SCRIPT → MORNING). Il y a l'arrivée à la porte nord,
   un fondu, le dortoir et l'inspection du capitaine (7 bulles), un fondu « Quelques années plus tard… », puis Tanguy et
   les résultats du bac. Cela fait **4 segments et environ 14 bulles**.
6. **La nuit de Hull** (`hullStory.js` ASYLUM_DANCE → DAWN → coloc « Le lendemain… »). Il y a la danse (Joie de vivre),
   un fondu, l'aube devant l'Asylum (9 bulles), un fondu, puis la coloc et Ousmane. Cela fait **4 segments et environ 19
   bulles**.
7. **La fin du jeu** (`parisStory.js` INTO_THE_DREAM → `reveStory.js` REUNION → `virtuesFade` → WAKE_UP). Il y a le
   brouillage du rêve (4,5 s), la réunion (8 personnages qui s'avancent et repartent, puis Pierre : environ 16 bulles),
   le fondu des huit vertus (plusieurs secondes, phrase tenue 3,2 s), puis le réveil (carte postale rejouée, Maman,
   Pierre). Cela fait **4 segments et environ 19 bulles**. C'est voulu pour le final.
8. **Les transitions de ville habituelles.** La réplique de départ, l'écran de trajet (voiture, avion ou ferry) avec
   l'encart « Tu emportes », la carte postale et la scène d'arrivée forment **3 segments** à chaque changement de ville.
   Exemples : Prytanée CAPTAIN_AT_GATE → Bordeaux ARRIVAL, Montépilloy NORTH_EXIT → COLLEGE_ARRIVAL, routeBonsecours →
   Prytanée ARRIVAL, vols de l'hôtesse → ARRIVAL de Hanoï, Amsterdam et Delhi. Chacune est courte (4 à 6 bulles).

### Intro (nouvelle partie)

Déroulé : `TitleScene.startNewGame` → `launchGame('Interior', { interior: 'ffHouseUp' })` → fondu caméra d'entrée
(150 ms) → événement `enter` de ffHouseUp : OPENING_CINEMATIC (bruit des vagues, carte postale tenue 800 ms, la bulle
« C'est le dernier matin à Fort-de-France. », fondu de sortie de la carte en 700 ms, pause de 300 ms, puis Maman : « Pierre ! Le
ferry part cet après-midi ! Descends ! »).

- **Avant le premier contrôle de Pierre** (dans sa chambre) : **13 mots, 2 bulles**. Aucun écran noir. Il y a un fondu
  d'entrée de 150 ms et le fondu de la carte postale (700 ms). Cela prend **environ 6 à 8 s**.
- **Descente** (escalier, puis `ffHouse` MAMAN_MORNING) : Maman s'approche, puis 39 mots et 3 bulles. Le joueur
  reprend la main pendant qu'elle retourne à sa place (`walk` bloquant en fin de scène).
- **Sortie de la maison** (événement de `fortDeFrance`) : Manon vient à Pierre, puis 56 mots et 5 bulles. La première
  quête est alors donnée.
- **Jusqu'au premier objectif complet** : environ 108 mots, environ 10 bulles, en trois courtes scènes séparées par
  quelques pas. L'intro est **courte et bien rythmée**.
- **Peut-on la passer ?** **Non.** Ni TitleScene, ni MapScene.runSteps, ni DialogBox n'offrent de moyen de sauter une
  scénette. Entrée ou Espace termine seulement l'écriture de la bulle en cours, puis passe à la suivante. La même
  OPENING_CINEMATIC est rejouée, impossible à passer elle aussi, au réveil de la fin (WAKE_UP), puis MAMAN_MORNING à
  l'identique. Vu la brièveté, la gêne est faible.

### Dialogues de plus de 8 bulles d'affilée

Bulles estimées, sans choix, quiz ni saisie entre elles. Les fondus ne coupent pas la série.

| Bulles | Mots | Fichier | Scène | Remarque |
|---|---|---|---|---|
| **30** | 226 | `parisStory.js` | MATCH (événement `enter` de `huguesAppart`) | La finale France-Argentine, commentée but par but, sans aucune interaction. Suivie d'un fondu « Un an plus tard… ». |
| **≈21** | ≈190 | `fortDeFranceStory.js` + `FerryScene.js` + `saintAyStory.js` | GIVE_ROD → pont du ferry → ARRIVAL | Voir la chaîne 1. Le monologue du capitaine, 4 pages, fait l'essentiel. |
| **≈19** | ≈150 | `hullStory.js` | ASYLUM_DANCE → DAWN → coloc | Voir la chaîne 6. DAWN seul compte 12 bulles. |
| **16** | 200 | `newDelhiStory.js` | DELHI_PARTY (événement `enter` de `delhiCour`) | Le grand repas. Plusieurs pages font 2 bulles. |
| **16** | 165 | `amsterdamStory.js` | CANAL_NIGHT (PNJ `romain-canal`) | Suivi d'un fondu et du départ vers l'aéroport. |
| **16** | 182 | `reveStory.js` | REUNION (via `parisStory.js` INTO_THE_DREAM) | Huit répliques entrecoupées de marches. C'est le final, c'est voulu. |
| **15** | ≈111 | `prytaneeStory.js` | MAKE_BED / TIDY_WARDROBE / PREPARE_DESK (la dernière des trois) | L'inspection, la vertu et la nuit. Voir la chaîne 4. |
| **14** | 137 | `prytaneeStory.js` | NORTH_GATE_SCRIPT → MORNING | MORNING seul compte 12 bulles. Voir la chaîne 5. |
| 11 | 92 | `saintAyStory.js` | ANNOUNCEMENT (événement de `playerHouse`) | |
| 10 | 68 | `saintAyStory.js` | FELIX_CHANTIER → CABANE_FETE (jusqu'au mot de passe) | Voir la chaîne 2. |
| 10 | 80 | `saintAyStory.js` | CAR | Voir la chaîne 3. |
| 10 | 91 | `montepilloyStory.js` | FOUND_BENOIT (objet de `boulyBarn`) | |
| 10 | 94 | `collegeStory.js` | LOCKER (objet de `bonsecoursCasiers`) | Avant le choix haut ou bas. |
| 9 | 95 | `saintAyStory.js` | PULLEY (accessoire de `saintAy`) | |
| 9 | 92 | `bordeauxStory.js` | CYCLIST (passage optionnel) | |
| 9 | 82 | `collegeStory.js` | CAMILLE (après le choix) | |
| 9 | 86 | `hullStory.js` | LEO_PLAN (`hullHouse`) | |
| 9 | 96 | `newDelhiStory.js` | SAGE (`delhiFort`) | |
| 9 | 113 | `parisStory.js` | DIRECTOR (`entrepriseDirecteur`) | |
| 9 | 87 | `parisStory.js` | CONCERT (`bercy`) | |

Aucun `dialogue` simple de PNJ ou d'objet ne dépasse 5 bulles (`amb.mjs`). Les longues séries sont toutes dans des
scénettes.

### Problèmes relevés

Gravité. **Bloquant** : empêche de progresser. **Gênant** : nuit nettement au rythme (au moins 15 bulles d'affilée,
chaîne d'au moins 4 segments, ou ville proche des seuils). **Mineur** : à surveiller. Aucun problème de rythme ne bloque
la progression.

1. `src/data/parisStory.js`, MATCH (`interiors.js` huguesAppart, `enter`) : **30 bulles et environ 226 mots d'affilée**,
   sans aucune interaction. C'est la plus longue scène passive du jeu, presque le double de la suivante. **Gênant.**
2. `src/data/fortDeFranceStory.js` GIVE_ROD/DEPARTURE + `src/scenes/FerryScene.js` playDeck + `src/data/saintAyStory.js`
   ARRIVAL : chaîne de 4 segments et environ 21 bulles entre le don de la canne et la reprise du contrôle à Saint-Ay.
   **Gênant.**
3. `src/data/saintAyStory.js`, FELIX_CHANTIER → CABANE_FETE → MANON_NEWS, puis ANNOUNCEMENT : 4 segments et environ
   19 bulles sans contrôle (seule la saisie du mot de passe interrompt), puis 11 bulles de plus après quelques pas.
   **Gênant.**
4. `src/data/hullStory.js`, ASYLUM_DANCE → DAWN → coloc : 4 segments et environ 19 bulles. **Gênant.**
5. `src/data/prytaneeStory.js`, NORTH_GATE_SCRIPT → MORNING → ellipse du bac : 4 segments et environ 14 bulles.
   **Gênant.**
6. `src/data/prytaneeStory.js`, la dernière tâche de la chambre → inspection → nuit : 3 segments et environ 15 bulles.
   **Gênant.**
7. `src/data/newDelhiStory.js`, DELHI_PARTY : 16 bulles et 200 mots d'affilée. **Gênant.**
8. `src/data/amsterdamStory.js`, CANAL_NIGHT : 16 bulles et 165 mots d'affilée, puis un fondu et le départ. **Gênant.**
9. Hull (`src/data/hullStory.js`, `maps/hull.js`, intérieurs hull*) : 1,90 fois la médiane, 17 cinématiques, 595 bulles,
   2 440 mots. C'est la ville la plus longue de loin, juste sous le seuil de 2. **Gênant.**
10. `src/data/parisStory.js` INTO_THE_DREAM → `src/data/reveStory.js` REUNION → virtuesFade → WAKE_UP : 4 segments et
    environ 19 bulles, plus le flou du rêve (4,5 s) et le fondu des vertus. C'est le final, l'enchaînement est voulu.
    **Mineur.**
11. `src/data/saintAyStory.js`, CAR → trajet en voiture → arrivée à Montépilloy : 4 segments et 10 bulles. **Mineur.**
12. Transitions de ville (`prytaneeStory.js` CAPTAIN_AT_GATE, `montepilloyStory.js` NORTH_EXIT, déclencheurs nord de
    `routeBonsecours`, vols de l'aéroport) : 3 segments systématiques (départ, trajet, carte postale et arrivée), chacun
    court. **Mineur.**
13. Bordeaux (stade) (`bordeauxStory.js` BACK_FROM_DELHI…LEAVING_BORDEAUX, intérieur `stade`) : 0,49 fois la médiane.
    C'est un épilogue court par construction. **Mineur.**
14. Rêve + réveil (`reveStory.js`) : 0,36 fois la médiane. C'est la fin, pas une ville, et c'est voulu. **Mineur.**
15. Collège (`collegeStory.js`, intérieurs bonsecours*) : 3 quêtes pour 1 736 mots, soit environ 580 mots par quête,
    plus de 2 fois la moyenne (environ 270). C'est beaucoup de lecture pour peu d'objectifs. **Mineur.**
16. Hanoï, Amsterdam et Delhi : seulement 53 à 136 mots d'ambiance (PNJ et objets facultatifs), contre 360 à 687 dans
    les villes précédentes. La seconde moitié du jeu paraît plus vide et ne tient que par ses scènes. **Mineur.**
17. Intro (`TitleScene.startNewGame`, `interiors.js` ffHouseUp, `fortDeFranceStory.js` OPENING_CINEMATIC) : aucun moyen
    de la passer, ni elle ni sa reprise au réveil final. Elle est très courte : 2 bulles et environ 7 s avant le premier
    contrôle. **Mineur.**
18. Séries de 9 à 11 bulles hors des chaînes ci-dessus : `saintAyStory.js` ANNOUNCEMENT (11) et PULLEY (9),
    `montepilloyStory.js` FOUND_BENOIT (10), `collegeStory.js` LOCKER (10) et CAMILLE (9), `bordeauxStory.js` CYCLIST
    (9, optionnel), `hullStory.js` LEO_PLAN (9), `newDelhiStory.js` SAGE (9), `parisStory.js` DIRECTOR (9) et CONCERT
    (9). Chacune dépasse à peine le seuil de 8 et reste dans la marge d'erreur de l'estimation. **Mineur** (10 cas
    regroupés).

### Décompte par gravité

- **Bloquant : 0**
- **Gênant : 9** (problèmes 1 à 9)
- **Mineur : 9 lignes** (problèmes 10 à 18), dont la ligne 18 regroupe 10 dialogues de 9 à 11 bulles ; 18 cas au total.

## Passe 5 — Finition

## Poképierre : revue, passe 5 (finition)

Revue en lecture seule, du 11 octobre 2026. Aucun fichier du dépôt n'a été modifié.

Méthode : j'ai extrait toutes les chaînes des sources (analyse syntaxique : 3 767 chaînes, dont 1 494 phrases affichées) et je les ai relues une par une. J'ai mesuré les largeurs avec les `xadvance` de `frlg.xml` et la même logique que `frlgText` et `wrapText`. J'ai analysé `gen4-npcs.png` image par image (PIL) et refait le rendu des personnages assis comme dans `CharacterSprite.sit` et `drawLap`.

Gravités : **bloquant** (empêche de jouer ou casse l'affichage), **gênant** (visible par le joueur, ou manque réel), **mineur** (finition).

---

### 1. Orthographe et typographie

Points vérifiés sans problème :
- aucun « ... » : on trouve partout « … » ;
- toutes les phrases françaises ont une espace avant « ! ? : ; » ;
- les majuscules accentuées (À, É, Ê, Ç) sont présentes ;
- aucun caractère hors police, sauf les crochets signalés ci-dessous.

| # | Fichier : ligne | Problème | Correction proposée | Gravité |
|---|---|---|---|---|
| 1.1 | `src/data/maps/interiors.js:165`, `:166`, `:167` (maison de Fort-de-France : télé, console, frigo) | Texte d'attente visible par le joueur : « [Texte provisoire] … ». De plus, « [ » et « ] » n'existent pas dans la police : l'écran affiche « ?Texte provisoire? ». | retirer « [Texte provisoire] » | gênant |
| 1.2 | `src/data/parisStory.js:160` (concert à Bercy, `CONCERT`) | Le chanteur dit « [PAROLES À COMPLÉTER PAR PIERRE] », affiché « ?PAROLES À COMPLÉTER PAR PIERRE? ». | paroles à écrire | gênant |
| 1.3 | `src/scenes/FerryScene.js:184` | « Les coryphènes, … elles changent de couleur » : « coryphène » est masculin. | « elles » → « ils » | mineur |
| 1.4 | `src/data/story.js:212` (phrase de la vertu Adaptation, visible dans le sac) | « même sans en parler la langue » : le « en » est en trop. | supprimer « en » | mineur |
| 1.5 | `src/data/bordeauxStory.js:83` | « Ok, mais tu la portes… » | « Ok » → « OK » | mineur |
| 1.6 | `src/data/prytaneeStory.js:53` | « GARDE À VOUS ! » ; `routeBonsecours.js:70` écrit bien « Garde-à-vous… » | « GARDE-À-VOUS ! » | mineur |
| 1.7 | `src/data/prytaneeStory.js:192` | « Diplôme obtenu : Baccalauréat ! » prend une majuscule ; les deux autres diplômes sont en minuscule (« diplôme d'anglais », « diplôme de Hull »). | « Baccalauréat » → « baccalauréat » | mineur |
| 1.8 | `src/data/bordeauxStory.js:276` | « Tu reçois le Vélo ! » : majuscule au milieu de la phrase (comparer avec « Tu reçois le bouquet de fleurs ») | « Vélo » → « vélo » | mineur |
| 1.9 | `src/data/hanoiStory.js:204` | « un banh mi » (les accents de la police suffisent : á, ì) | « bánh mì » | mineur |
| 1.10 | `src/data/hanoiStory.js:34`, `src/data/maps/interiors.js:1976` et `:1985` (nom de pièce) | « agence de voyage » | « voyage » → « voyages » | mineur |
| 1.11 | `src/data/maps/montepilloy.js:96` ; `src/data/montepilloyStory.js:154` ; `src/data/parisStory.js:70` ; `src/data/prytaneeStory.js:168` ; `src/data/maps/interiors.js:2464` | Virgule manquante devant l'apostrophe (le mot qui désigne la personne à qui l'on parle) : « Bonjour mon grand ! », « Salut grand frère ! », « Salut Pierre ! », « quand vous voulez les gars ! », « Merci Paris ! » | « Bonjour, mon grand », « Salut, grand frère », « Salut, Pierre », « voulez, les gars », « Merci, Paris » | mineur |
| 1.12 | `src/data/bordeauxStory.js:96`, `:97`, `:104` ; `src/data/maps/interiors.js:1372` | Anglais écrit avec l'espace française (« Have fun ce soir ! », « What a night ! », « You're welcome, bro ! », « This party is so lit ! »). Partout ailleurs, l'anglais est collé (« Cheers, mate! », « Try again! »). | « ! » collé au mot anglais, ou espace partout (choisir une règle) | mineur |
| 1.13 | `src/data/story.js:271` (nom d'objet) | « Billet d'avion Delhi » : il manque la préposition (le nom ferait environ 125 px, ça tient dans la case du sac) | « Billet d'avion pour Delhi » | mineur |

Rien à corriger dans les mots étrangers voulus (néerlandais, vietnamien, hindi, l'anglais « Frenglish » de Léo et Rémi), dans le style familier (« Y a six mois », « Je sais plus ») ni dans les paroles citées à la ligne 159 de `parisStory.js`. Les gabarits « {motDePasse|QG} » sont bien remplacés : ils sont tous dans des étapes `say`, passées par `memo.fill` à la ligne 698 de `MapScene.js`.

### 2. Icônes (`src/art/uiIcons.js` → `public/assets/ui/item-icons.json`)

- Les 29 objets de `ITEMS` ont une icône `ICON_OF_ITEM`, et chacune existe dans l'atlas.
- Les 8 vertus de `TRAITS` ont une icône `ICON_OF_TRAIT` (`v-joie` … `v-liberte`), toutes présentes.
- Le souvenir du carnet `souvenir-canal` (icône `photo`, `bag.js` `CARNET`) est présent.
- Aucune entrée orpheline dans `ICON_OF_ITEM`. Chaque objet a aussi sa phrase dans `ABOUT`.

**Aucun problème.**

### 3. Sprites (`public/assets/characters/gen4-npcs.png`)

Analyse des 117 apparences utilisées (204 lignes au total) :
- **Marche :** aucune image mal cadrée. Debout, toutes les images ont 1 px de marge sous les pieds ; aux pas de face et de dos, les pieds descendent d'1 px. C'est le même schéma partout : il vient des planches d'origine et c'est voulu.
- **Fausse alerte :** pour g5 (Ace Trainer F) et g194 (Jupiter, « Principale »), le chignon touche le haut des images de pas. Le contrôle sur la planche source (60 px à mi-taille, soit 30 px) montre que rien n'est rogné.
- **Assis** (le repas de Delhi : 9 convives, plus Harsh g83, Prophecy g94, Pierre g198 ; le Directeur g120) : le rendu refait est propre. Les jambes repliées restent à la largeur des hanches. Deux remarques :

| # | Où | Problème | Gravité |
|---|---|---|---|
| 3.1 | `interiors.js:2172-2177` : g38 `voisin-fete`, g103 `etudiante-dal`, g104 `etudiante-riz` | La couleur des jambes repliées change selon l'orientation : `legColor` lit la jupe ou le haut de profil (rouge, blanc), le pantalon de face (bleu, brun). C'est invisible tant qu'ils restent tournés vers le bas (`still`), mais ça se verrait s'ils se tournaient vers Pierre. | mineur |
| 3.2 | `CharacterSprite.hipSpan`, Pierre (g198) de face et de dos | Les « hanches » font 15 px sur un corps de 17 : les mains sont comprises dans la mesure. Les jambes repliées sont presque aussi larges que le buste. À vérifier à l'œil. | mineur |
| 3.3 | `src/data/characterLooks.json` | Hors cadrage : Felix (cousin) a le sprite g25 « Lass », réutilisé par une étudiante de Delhi (`interiors.js:2170`). Thomas (g95) est réutilisé par `etudiant-dal`. Le même visage apparaît donc à deux endroits du voyage. | mineur |

### 4. Musiques et sons

Aucune carte sans musique :
- les 14 cartes de `MAPS` sont dans `CITY_MUSIC` ;
- les intérieurs prennent la musique de leur ville (`fromMap`) ;
- seul le vieux fort de Delhi (`interiors.js:2192`, volume 0) est silencieux, et c'est voulu par la scène ;
- tous les sons appelés par `sfx()` existent dans `SFX`.

| # | Où | Problème | Gravité |
|---|---|---|---|
| 4.1 | `src/data/music.js` (`airport: 'bordeaux'`), `MapScene.js:1637` | L'aéroport joue toujours la musique de Bordeaux. Or on y entre aussi depuis Hull, Hanoï, Amsterdam et Delhi : la musique de la ville coupe net pour passer au thème de Bordeaux. | gênant |
| 4.2 | `src/systems/audio.js:490-500` (`playMusic`) | Chaque changement de morceau appelle `stopMusic()`, qui arrête le morceau d'un coup (`clearInterval`), sans fondu. Cas où ça coupe net : l'arrivée dans une nouvelle ville après le ferry ou l'avion (`MapScene.js:125`, la musique de départ tient tout le voyage puis coupe) ; l'écran titre vers le jeu (`TitleScene.js:236`, `launchGame`, sans fondu ni à l'image ni au son) ; Quitter vers l'écran titre (`StartMenu.js:167`). Seuls `fadeMusic` (l'entrée dans le rêve) et un même morceau à un autre volume (`applyVolume`) font un fondu. | gênant |
| 4.3 | `src/systems/bike.js:54-55` | Monter ou descendre du vélo coupe net (comme dans Pokémon). | mineur |

À noter : `endGame` (`MapScene.js:793`) arrête net, mais la seule fin qui l'appelle (`reveStory.js` `FINALE`) a déjà fait descendre la musique à zéro pendant l'étape `dream`. Pas de coupure audible.

### 5. Crédits (`src/data/credits.js`)

Le générique tient sur l'écran : la plus longue ligne fait 289 px sur 360. Ce qui manque :

| # | Asset (où il sert) | Ce qui manque au générique | Gravité |
|---|---|---|---|
| 5.1 | Tous les PNJ et Pierre, à pied et à vélo (`gen4-npcs.png`, `pierre-velo.png`, d'après `ASSETTILESPOKEMONV2/personnages/gen4-officiels`, mis au format par Neo-Spriteman et Vanilla Sunshine : `build_gen4_npcs.py` ; `personnages/gen4-vanilla-sunshine/CREDITS.txt`) | **Vanilla Sunshine, Neo-Spriteman** | gênant |
| 5.2 | Gen 4 Pack (`g4-pack`, `autotiles-g4`, et une partie de `g4-sols`, `g4-arbres`, `g4-batiments`, etc., utilisés par les cartes) | Le générique ne cite que 4 noms sur les 19 de `credits/gen4-pack.txt`. Manquent : Shawn Frost, NSora-96, Claisprojects.com, Minorthreat0987, The-Red-Ex, UltimoSpriter, TyranitarDark, DarkDragonn, rafa-cac, Phyromatical, Alucus, Newtiteuf, ChaoticCherryCake, moca (PeekyChew n'apparaît que pour la vaisselle). | gênant |
| 5.3 | Planches de la bibliothèque du créateur, utilisées par les cartes : `g4-batiments` (7 cartes), `g4-mobilier` (7), `g4-arbres` (7), `g4-vehicules` (6), `objets`, `jared-bateaux`, `g4-int-*` ; auteurs relevés dans `public/assets/v2/catalog.json` | JesusCarrasco, Kaliser, LotusKing, Aigue--marine, WilsonScarloxy, justin8964 (Dewitty), Speedialga, terriblejared, ultimatetraveler | gênant |
| 5.4 | `rmxp-batiments`, `rmxp-nature`, `rmxp-urbain` (« RMXP Buildings / Nature / Urban », fusionnées dans `g4-sols`, `g4-batiments`, etc. et dans `lisieres`) | Aucun auteur : `catalog.json` porte `author: ''`, et ni `credits/` ni `docs/technique/assets-gen4.md` ne donnent de provenance. Impossible à créditer en l'état. | gênant |
| 5.5 | Bâtiments de la Zone de Combat d'Émeraude (`emerald-frontier.png`, `extract_frontier.py`) | Le script retire « la bande verte du crédit » de la planche, et le nom du ripper n'est repris nulle part. | gênant |
| 5.6 | Bateaux, arbres et Zone de Combat d'Émeraude (`emerald-*.png`) ; Rubis/Saphir (`rs-*.png` : Mont Chimnée, caisses de Slateport, baies, gros arbre) | La ligne « Univers et personnages » ne cite que Rouge Feu, Diamant, Perle, Platine, HeartGold et SoulSilver. Il manque **Émeraude, Rubis, Saphir**. | mineur |
| 5.7 | Police Pixelify Sans (Google Fonts, licence OFL) : titre « Poképierre », « Génération 1 », aide de l'écran titre (`screen.js:47` `FONT`, `index.html:21`) | Pas de ligne pour cette police. La police de Rouge Feu n'est couverte que par la ligne Nintendo générale. | mineur |
| 5.8 | Guirlande de fanions (`ASSETTILESPOKEMONV2/animations/drapeaux/guirlande-fanions.png` → `decor/fanions.png`) ; cartes postales (`assets-source/ds/hgss-location-art.png`) | Source et ripper non documentés, rien au générique | mineur |
| 5.9 | Le rêve (Gaia Project) | Le texte du générique (« Le rêve : Pokémon Gaia Project, PixelMister (d'après zetavares852) ») ne reprend pas le crédit demandé dans `credits/gaia-pixelmister.txt` : « Tilesets Monde Distorsion et Colonne Lance : Pokémon Gaia Project (zetavares852 et ses contributeurs), compilés par PixelMister ». | mineur |

Bien crédités : SirMaIo, Akizakura16, Magiscarf, WesleyFG, SailorVicious, Kyle-Dove, PixelMister/zetavares852, spaceemotion/JulieHaru, TobalCR, The Spriters Resource, Nx-Kun (icônes), pinkscales, ghostpixxells, PeekyChew. Les musiques et les sons sont composés et synthétisés dans `audio.js` ; leur ligne est juste.

### 6. Textes trop longs pour leur boîte

Rien ne dépasse :
- **Noms dans le sac** (138 px utiles après x+32) : le plus long, « Consignes en vietnamien », fait 114 px ; toutes les vertus font moins de 100 px.
- **Phrases du sac** (3 lignes de 336 px au plus, au-delà elles seraient tronquées par `slice(0, 3)`) : toutes tiennent, phrases des vertus comprises (« « phrase » Ville, utilisée N fois. ») : 1 ou 2 lignes.
- **Menu Start et quêtes :** la plus longue entrée est « BORDEAUX (DIPLÔME) », 134 px avec la flèche. Les choix les plus larges, « QUITTER SANS SAUVEGARDER » (150 px), ne recouvrent pas l'étiquette du nom.
- **Bandeaux :** carte du voyage (aide du bas 284 px sur 348 ; le nom de ville finit avant « Étape n / N » en x 280) ; aide du sac (239 px).
- **Dialogues :** coupés automatiquement par `wrapText`, aucun mot plus large qu'une ligne.

**Aucun problème.**

### 7. `node scripts/check_paths.js`

```
Aucun blocage trouvé.
Sprites : 207 apparences, toutes présentes.
(code de sortie 0)
```

### 8. `python3 scripts/audit_maps.py` (code de sortie 0) : compteurs par carte

| carte | taille_impaire | mur_invisible | objet_traversable | cache_dessus | herbe_sans_dessin | herbes_hors_grille | fleurs_et_bords | poche |
|---|---|---|---|---|---|---|---|---|
| fortDeFrance | 1 (34 x 33) | 1 |  | 40 |  |  | 42 | 2 |
| saintAy |  |  | 15 | 42 |  |  | 24 |  |
| routeMontepilloy |  |  | 9 | 16 |  |  | 12 |  |
| montepilloy |  | 1 | 15 | 45 |  |  | 42 |  |
| routeBonsecours |  | 4 |  | 38 |  |  | 8 |  |
| prytanee |  | 5 | 8 | 49 | 1 (14, 19) |  | 2 |  |
| bordeaux |  |  | 31 | 78 |  |  | 1 |  |
| hull |  |  | 33 | 179 |  |  |  |  |
| hanoi |  | 53 | 16 | 82 |  | 1 (2, 17) | 5 | 6 |
| amsterdam |  | 4 | 19 | 98 |  |  |  | 3 |
| newDelhi |  | 19 |  | 153 |  |  |  | 2 |
| airport |  | 98 | 2 |  |  |  |  |  |
| paris |  | 11 | 24 | 321 |  |  |  | 1 (19 cases) |
| reve |  | 266 |  | 8 |  |  | 32 | 7 |
| delhiCour |  | 6 | 11 | 41 |  |  |  | 2 |

Un seul point relève de la finition :

| # | Où | Problème | Gravité |
|---|---|---|---|
| 8.1 | `fortDeFrance` (34 x 33) | Hauteur impaire, contraire à la règle de `CLAUDE.md` (« largeur et hauteur toujours paires ») | mineur |

Les gros compteurs de `reve` (266) et `airport` (98) correspondent au vide du rêve et aux murs du terminal. Ce sont les mêmes catégories que dans les passes précédentes ; je ne les ai pas réexaminées ici.

### 9. Build de production (`npx vite build --outDir …/scratchpad/dist-revue`)

Réussi (`✓ 184 modules transformed`, construit en 570 ms, code 0), sans erreur. Messages :
- note attendue : `outDir … is not inside project root and will not be emptied` (elle vient du dossier de sortie hors du dépôt) ;
- un avertissement :

| # | Où | Problème | Gravité |
|---|---|---|---|
| 9.1 | sortie de `vite build` | `(!) Some chunks are larger than 500 kB after minification` : `characters-*.js` fait 1 405,58 kB (359 kB gzip) et `maps-*.js` 491,82 kB, juste sous le seuil | mineur |

---

### Décompte par gravité

| Gravité | Nombre | Points |
|---|---|---|
| **bloquant** | **0** | (aucun) |
| **gênant** | **9** | 1.1, 1.2, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5 |
| **mineur** | **21** | 1.3 à 1.13 (11), 3.1, 3.2, 3.3, 4.3, 5.6, 5.7, 5.8, 5.9, 8.1, 9.1 |
| **Total** | **30** | |

## Résumé final

### Nombre de problèmes par gravité et par passe

| Passe | Bloquant | Gênant | Mineur | Incertain |
|---|---|---|---|---|
| 1 — Cohérence narrative | 0 | 12 | 31 | — |
| 2 — Guidage | 0 | 12 | 16 | — |
| 3 — Robustesse | 12 | 3 | 7 | 2 |
| 4 — Rythme | 0 | 9 | 9 | — |
| 5 — Finition | 0 | 9 | 20 | — |
| **Total** | **12** | **45** | **83** | **2** |

(Passe 1 : 13 gênants annoncés, moins le point 38 réfuté. Passe 5 : 21 mineurs annoncés, moins le renommage du billet.)

### Les 10 à corriger en priorité

1. **Fort-de-France sans issue** (passe 3, B1) : le vol « Autre → Fort-de-France » de l'aéroport (`airport.js` l. 40), et
   « Continuer » après la fin, laissent Pierre sur une île qu'il ne peut plus quitter. Bloquant en jeu normal.
2. **Sauvegarde non atomique** (passe 3, B2 à B12) : onze scènes posent leur drapeau de garde avant celui qui fait
   avancer l'histoire (tracteur de Montépilloy, `septembre`, chez Felix, casier et brevet du collège, inspection et mur du
   Prytanée, bac, appel de Romain à Hanoï, bouquet d'Amsterdam) ; fermer l'onglet au mauvais moment bloque la partie.
3. **Textes provisoires visibles** (passes 1 et 5) : « [Texte provisoire] » à Fort-de-France (`interiors.js` l. 165-167) et
   « [PAROLES À COMPLÉTER PAR PIERRE] » à Bercy (`parisStory.js` l. 160) ; les crochets s'affichent « ? » dans la police.
4. **Chronologie des amis** (passe 1) : Charlotte « Ça fait plaisir de te revoir » à Hull sans rencontre préalable ; les
   portes de Hull qui nomment Romain, Prophecy, Charlotte et Anaïs avant leur rencontre ; Romain « Et nous à Bordeaux » ;
   Prophecy « on revient là où tout a commencé ».
5. **Guidage à Paris** (passe 2) : arrivée sans aucun texte, la tour non située par le propriétaire, et rien qui renvoie
   au bureau après les deux « Un an plus tard… » (concert et match).
6. **Guidage à Amsterdam, Delhi et au départ de Bordeaux** (passe 2) : le marchand de fleurs et Romain au canal non
   indiqués, Prophecy pas annoncé à l'arrivée à Delhi, « Direction Paris. » sans direction.
7. **Sprites de genre incohérent** (passe 1) : Felix (`g25`, fille, dans `characterLooks.json`), le surveillant (`g116`), les
   deux élèves de terminale de l'internat des garçons (`g88`, `g89`) ; plus des sprites partagés entre personnages nommés
   (Maman et Charlotte, Thomas et Anthony, Étienne et le Capitaine).
8. **Musique** (passe 5) : `playMusic` coupe toujours net, sans fondu (chaque arrivée de ville, titre, Quitter, vélo) ;
   l'aéroport joue la musique de Bordeaux quelle que soit la ville de départ.
9. **Crédits incomplets** (passe 5) : Vanilla Sunshine et Neo-Spriteman (sprites des PNJ et du vélo), les auteurs des
   planches utilisées par les cartes (JesusCarrasco, Kaliser, LotusKing, Aigue--marine…), le Gen 4 Pack complet, les
   planches RMXP, Émeraude / Rubis / Saphir, la police Pixelify Sans.
10. **Rythme et cohérence des âges** (passes 4 et 1) : le match France-Argentine fait 30 bulles sans interaction ; quatre
    enchaînements de 3 ou 4 scènes sans reprise du contrôle (départ de Fort-de-France, cabane de Saint-Ay, nuit de Hull,
    Prytanée) ; et les âges de Pierre et Jean à Montépilloy contredisent l'ellipse de Saint-Ay.

