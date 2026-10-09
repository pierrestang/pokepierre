# Bible du jeu Poképierre

Ce document décrit ce qui est **réellement codé** au 9 octobre 2026 (branche `cartes-gen4`), ville par ville, dans
l'ordre du jeu. Il ne propose rien : il décrit l'existant. Sources : `src/data/story.js`, `src/data/*Story.js`,
`src/data/characters.js`, `src/data/hanoiStory.js`, `src/data/questStarts.js`, `src/data/fishing.js`, `src/data/maps/*.js`,
`src/data/maps/interiors.js`, `src/scenes/FerryScene.js`, `scripts/build_ds_ui.py` (cartes postales).

## Conventions

- **Sprites** : uniquement des personnages de la quatrième génération, `g{n}` (sprites officiels de Diamant / Perle /
  Platine et HeartGold / SoulSilver, `public/assets/characters/gen4-npcs.png`, liste et noms dans `gen4-npcs.json`) ;
  Pierre est Lucas (`g198`) ; pas de portrait dans les dialogues, comme dans les jeux DS. Attributions dans `src/data/characters.js` (`BY_NAME`). Un nom absent de cette liste
  reçoit un **figurant** tiré au hasard d'après son identifiant et sa position (`EXTRAS`) ; le joueur peut changer
  toute apparence dans Start > PNJ.
- **Décor** : bâtiments, mobilier et objets sans ombre portée, et bâtiments et objets cernés d'un même trait gris
  très foncé d'un pixel (pour que les planches DPPt et Gen 4 aillent ensemble) ;
  la végétation et les éléments naturels (arbres, buissons, fleurs, rochers) gardent la leur. Cartes aux dimensions
  paires, bordées d'arbres ronds de DPPt dont le jeu cache le bord extérieur.
- **Vertus** : 8 au plus dans tout le jeu, une par ville au plus ; 6 jusqu'à Hull, Adaptation à Hanoï, la 8e
  réservée à Paris (pas encore définie). Encart « Pierre a reçu la vertu X ! » (étape `trait`) et « Pierre utilise X ! » (étape `useTrait`,
  comptée). Carnet dans Start > VERTUS : le total (« Vertus : X sur 8. »), puis une page par vertu reçue avec sa ville,
  sa phrase et son nombre d'utilisations (« Utilisée N fois. » ou « Pas encore utilisée. »), puis les « souvenirs des
  PNJ ». À l'écran, le compteur « Vertus : X sur 8 », seulement dans les villes qui donnent une vertu.
- **Objectifs** : le jeu n'a ni journal de quêtes ni ligne « Objectif : » (supprimées le 8 octobre 2026). Le joueur est
  guidé seulement par les PNJ, qui disent où aller et rappellent ce qu'il reste à faire (relevés ci-dessous).
- **Téléphone** : une réplique au téléphone s'affiche dans la boîte de dialogue normale, avec une petite icône de
  téléphone dessinée devant le nom (étape `{ speaker, phone: true, say }`). Utilisé pour Romain (Hull, Hanoï).
- **Trajet** : scène de voyage (`FerryScene`) en ferry, en voiture ou en avion, qui se termine par l'encart
  « Tu emportes : … » (la vertu reçue dans la ville quittée ; pas d'encart en quittant une ville sans vertu). Sans scène
  de trajet, on passe directement à la carte suivante.
- **Pêche** (valable partout) : avec la **Vieille canne** dans le sac, on peut lancer sa ligne face à n'importe quelle
  eau. « Tu lances ta ligne… » ; 40 % de chances de « Rien ne mord… Tu remballes ta ligne. » ; sinon une prise selon
  l'eau, relâchée : mer (maquereau, sardine, petit bar, dorade), étang (gardon, perche, carpe, poisson-chat), rivière
  (truite, gardon, goujon), ou une vieille botte, « Tu la poses sur la rive. ».
- **Vélo** (offert à Bordeaux par le cycliste du quai, passage optionnel ; `?velo` dans l'adresse donne l'objet **Vélo**
  pour l'essayer) : Pierre monte ou descend avec la touche V (ou B), l'entrée « VÉLO : MONTER / DESCENDRE » du menu Start
  ou le bouton VÉLO des commandes tactiles ; sonnette en montant, musique du vélo tant qu'il roule ; il va environ
  trois fois plus vite qu'à pied (Lucas à vélo de Diamant / Perle). Seulement dehors : « Pas de vélo à l'intérieur ! »,
  et il descend en entrant dans un bâtiment (à pied en ressortant) ; pas quand quelqu'un le suit (« Ce n'est pas le
  moment de monter sur ton vélo : on t'accompagne. »), il descend si quelqu'un se met à le suivre ; pendant une
  scénette, il descend et remonte à la fin. Une partie reprise dehors repart à vélo.
- **Textes provisoires** : plus aucun dans l'histoire (le stade de Bordeaux est écrit depuis octobre 2026) ; il en
  reste trois à Fort-de-France (télé, console, frigo).

## Ordre du jeu

Fort-de-France → Saint-Ay → (route de Montépilloy) → Montépilloy → route et collège de Bonsecours → Prytanée →
Bordeaux → Hull → Hanoï → Amsterdam → New Delhi → Bordeaux (stade) → Paris → le rêve → le réveil à Fort-de-France
(fin du jeu, retour au titre).

Après Bordeaux, tous les vols passent par l'**aéroport** (une seule carte, redessinée en Gen 4, tout entier à l'écran : tarmac
et avions garés derrière la baie vitrée, tableau des départs, guichet, file à cordons, salle d'attente ; pas de vélo). L'hôtesse (`g64`), derrière son comptoir
(on lui parle par-dessus), propose deux choix : la destination de la suite de l'histoire et « Autre » (les lieux déjà
visités, et « Rester ici ») ; sans vol de l'histoire en attente, la liste « Autre » s'ouvre directement. Chaque vol joue
le **trajet en avion** : l'avion de ligne file au-dessus de l'océan et de ses îles, entre deux couches de nuages, deux
traînées derrière lui, au bruit des réacteurs. C'est l'aéroport de la ville d'où l'on vient : le jeu la retient (memo
`aeroport`), ses portes y ramènent (« Tu sors de l'aéroport. ») sur la case exacte et du côté par lequel Pierre est
entré (memo `aeroportRetour`). Quand une scénette y emmène Pierre (ex. le lendemain de la nuit au canal, à
Amsterdam), c'est la route de l'aéroport la plus proche de l'endroit où il était ; sans souvenir, la sortie habituelle
de la ville. et la liste des vols ne la propose pas ;
« Autre » propose Bordeaux quand on n'y est pas. Les vols atterrissent à côté des sorties vers l'aéroport de chaque ville.

---

## 1. Fort-de-France (Martinique)

### Arrivée et image d'accueil
- Nouvelle partie : Pierre se réveille dans sa chambre, à l'étage de la maison familiale (`ffHouseUp`). Bruit des
  vagues, puis carte postale `fortDeFrance` (illustration de Johto « bois aux Chênes, le matin ») avec le texte :
  **« C'est le dernier matin à Fort-de-France. »**
- Maman, d'en bas : **« Pierre ! Le ferry part cet après-midi ! Descends ! »**
- En descendant au salon, Maman s'approche et pose le cadre de la journée : « Le ferry part cet après-midi, tous
  ensemble. D'ici là, va voir ton père et ta sœur : » / « ton père trie ses affaires à son atelier, à droite de la
  plage, et Manon prépare un coup dehors. Ensuite, reviens me voir ! »

### Décor (refonte DS d'octobre 2026, scripts/fdf_ds_v2.py)
- Île ronde, plage arrondie, en assets Diamant / Perle / HeartGold. Une allée de sable relie la maison au ponton (sans
  bande d'herbe entre les deux) ; deux branches mènent à la
  atelier de Papa (à droite) et au mémorial (à gauche), au milieu d'une clairière de sable clair.
- Mémorial de l'Anse Caffard : les six statues de pierre blanche d'origine, en trois rangées tournées vers la mer (trois
  derrière, deux au milieu, une devant), sur la clairière de sable, en (6-9, 13-15) : un élément du dessin de la carte
  (scripts/build_memorial.py), visible aussi dans le créateur.
- À droite de la maison, le drapeau de la Martinique (rouge, vert, noir) entre deux pots de buis. Jardin fleuri autour
  de la maison, bordures de fleurs le long de l'allée. Les grandes fleurs tropicales à droite de l'allée se traversent.
  Devant la maison et la cabane, le sable du chemin va jusqu'aux murs (sous la jardinière et la boîte aux lettres).
- Plage semée de coquillages et d'étoiles de mer. En mer : la barque du pêcheur contre le ponton et deux voiliers au
  large.
- Mobilier (deuxième passe) : lampadaires aux deux carrefours de l'allée, un banc le long du chemin du mémorial et un
  face à la mer, un parasol sur la plage à droite du ponton, une clôture blanche devant le jardin, un tas de bois contre
  la cabane. Il ajoute des cases bloquantes, jamais sur un chemin, une porte, un PNJ, un objet ou un événement
  (vérifié par scripts/fdf_ds_v2.py).
- Quand Pierre reçoit la Joie de vivre (la danse avec Maman), une guirlande de fanions apparaît : du faîte du toit au
  haut du mât, et le long de l'avant-toit (décor `fanions`, src/art/bunting.js).
- Portes, places des PNJ et événements n'ont pas changé.

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Maman | Au salon : programme de la journée, puis la danse (Joie de vivre) | `g126` |
| Papa | Trie ses cannes dans son atelier | `g119` |
| Manon | Sœur, devant la maison : le coquillage caché | `g57` |
| Capitaine du ferry | « L'ancien pêcheur » : sa canne est cassée, il garde le départ | `g118` |
| Promeneuse | Devant le mémorial de l'Anse Caffard : « Je viens souvent ici, devant les statues. » / « Elles regardent vers le large… On ne doit pas oublier ceux qui ne sont jamais arrivés. » | `g82` |
| Gamin | Sur la plage : « J'ai vu des poissons sauter près des rochers ! » / « Un jour, moi aussi je prendrai le ferry. Toi, tu pars quand ? » | `g59` |

### Quêtes, dans l'ordre (les trois premières dans n'importe quel ordre)
1. **Manon : le coquillage.** En sortant de la maison, Manon vient se placer à droite de Pierre (sans lui barrer l'allée) : « Psst. Viens. » / « J'ai caché un
   truc sur l'île avant qu'on parte. Personne ne le sait. Même pas Papa. » / « Surtout pas Papa, il le mettrait dans la
   caisse « À DONNER ». » / « C'est dans les hautes herbes, dans le petit pré, à côté des statues. Trouve-le. » / « Passe dans les touffes une par une. Et ne dis rien à personne ! »
   - Indice si on revient la voir : « C'est dans les hautes herbes. Un indice : le petit pré, à côté des statues. »
   - En marchant sur la bonne touffe : « Quelque chose brille entre les herbes… » → **Coquillage nacré**
     (« Tu trouves un coquillage nacré ! » / « Manon attend sûrement de le voir. »).
   - Avec le coquillage, Manon : « Tu l'as trouvé ! » ; elle sort un deuxième coquillage identique : **« Un pour toi, un
     pour moi. Comme ça, où qu'on aille, on garde un bout de l'île. Et c'est notre secret. »** (sans vertu).
     Ensuite : « Chut… c'est notre secret. » Si le tri des cannes n'est pas fait, Manon ajoute (tout de suite, puis à chaque
     fois) : « Papa trie ses cannes à son atelier. Va l'aider ! »
2. **Papa : le tri des cannes** (atelier). « Des caisses partout. Papa trie sans lever les yeux. » / Papa :
   « T'es venu m'aider ou regarder ? » / choix « Trois cannes à pêche sont posées là. Tu en prends combien ? »
   - « Une » : **« Voilà. Tu réfléchis. C'est ça, le pragmatisme. »** / « Une seule. Tu tiens ça de moi, pas de ta
     mère. »
   - « Les trois » : « Trois ?! On déménage, c'est pas une expédition de pêche. »
   - Dans les deux cas : « Papa en garde une et jette les deux autres dans une caisse marquée « À DONNER ». » / « Voilà.
     Déménagement terminé. » (sans vertu). Le capitaine se déplace alors devant le ferry. Si le coquillage n'est pas encore
     partagé, Papa ajoute (tout de suite, puis à chaque fois) : « Ta sœur te cherchait dehors, du côté du petit pré. »
3. **Le capitaine : la canne cassée** (une fois la journée de la famille finie : le tri, le coquillage et la danse ;
   avant, au bout du ponton puis devant le ferry, il dit seulement : « Ah, le petit ! Ta mère te cherche. File la voir à
   la maison. »). Devant le ferry : « Ah, te voilà… Regarde-moi ça.
   Trente ans qu'elle tenait. Elle a choisi aujourd'hui pour me lâcher. » / **« Pas de canne, pas de capitaine. Le
   ferry ne part pas sans moi. »** / « Ton père en a toute une collection, dans son atelier. Il en aurait pas une
   en trop, des fois ? »
   - Dans la caisse « À DONNER » : **Canne à pêche** (« Tu prends une canne à pêche dans la caisse. » ; Papa : « Tu vois.
     « À donner », ça veut dire à donner. »).
4. **Maman : la danse** (une fois le tri des cannes et le coquillage faits ; Papa et Manon disent alors « Maman t'attend au
   salon. »). « Te voilà ! Tu as l'air tout content… Tu as donné un coup de main à tout le monde, toi. » / « Tu entends cette chanson ? Viens danser avec
   moi ! » → danse → **« On part cet après-midi, et alors ? Là où on va, on rira aussi. Garde toujours ça avec toi. »**
   → vertu **Joie de vivre**. Ensuite : « Le capitaine du ferry avait l'air embêté, au ponton. Passe le voir. »
5. **La canne au capitaine** (le tri, le coquillage et la danse faits, la canne en poche) : « Hm ? Tu as quelque chose pour moi ? » /
   choix « Tu lui donnes la canne à pêche ? » ; « Oui » : **« Pour moi ? Elle est encore mieux que l'ancienne ! »** /
   « Merci, petit. Tu peux dire à ton père qu'il a bien fait de faire le tri. », puis fondu au noir et départ immédiat
   (voir « Départ et trajet ») ; « Non » : « Ah… Bon. Le ferry attendra, alors. »

### Objectifs affichés (rappels des PNJ)
- Maman, avant la danse : « Ton père trie ses affaires à son atelier, à droite de la plage. Va lui
  donner un coup de main. » / « Ta sœur mijote quelque chose dehors… Va voir ce qu'elle prépare. » / « Après, reviens
  me voir. »
- Le capitaine (au bout du ponton, puis devant le ferry), tant que la famille n'a pas fini : « Ah, le petit ! Ta mère te
  cherche. File la voir à la maison. »
- Le ferry, tant que tout n'est pas réuni : « Le ferry n'embarque pas encore. Le capitaine, sur le ponton, sait ce
  qu'il te reste à faire. »

### Vertus
- **Gagnée** : Joie de vivre (Maman, la danse).
- **Utilisées** : aucune.

### Objet optionnel
- **Vieille canne** : la canne restée dans la caisse « À DONNER », une fois l'autre prise. Choix : « Il reste une vieille
  canne à pêche dans la caisse « À DONNER ». Tu la prends ? » → « Tu prends la vieille canne. Elle pourra encore
  servir. » Elle permet de pêcher partout.

### Boîte aux lettres
« La boîte aux lettres de la famille. » / « Rien aujourd'hui… Peut-être une carte postale de Saint-Ay, un jour ? »

### Mini-jeux
Fouille des hautes herbes (coquillage), danse avec Maman, pêche (avec la vieille canne).

### Départ et trajet
- **Condition** : le tri, le coquillage et la danse, puis la canne offerte au capitaine. Le départ suit aussitôt le don de la canne :
  fondu au noir, sans autre réplique.
- **Trajet en ferry**, scène sur le pont avec Maman, Papa, Pierre et Manon : Maman « Regarde-la bien. » ; Papa « Elle ne
  va pas bouger. On reviendra. » ; « Manon te montre son coquillage, à voix basse. » ; Manon « Tu as le tien ? ». Puis
  le capitaine et son monologue sur les poissons : « Alors, petit, tu sais ce qui nage sous nos pieds ? » / « Des thons,
  des daurades, des balarous… et même des poissons volants ! » … « Et mon plus gros ? Un marlin bleu, long comme ce
  ferry ! Bon… presque. Mais il tirait comme un bœuf ! » / « Le capitaine continue… et continue encore. La traversée va
  être longue. » Encart : « Tu emportes : Joie de vivre. »

---

## 2. Saint-Ay (Loiret)

### Arrivée et image d'accueil
- Carte postale `saintAy` (la même illustration que Fort-de-France : « bois aux Chênes, le matin ») : **« Saint-Ay,
  Loiret. Quelque temps plus tard… »**
- Au bord du lac, Papa : « Te voilà enfin ! On te cherche partout. » / **« Maman est à la clinique : le bébé est
  arrivé ! Rejoins-nous là-bas, c'est la grande maison au toit bleu, en bas du village. »** ; Manon : « Vite,
  dépêche-toi ! ». Manon revient se placer à côté de Papa, et ils partent devant ensemble, l'un derrière l'autre, à la
  clinique (la grande maison au toit bleu ; les cousins habitent la petite maison bleue, à sa droite).

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Papa, Maman, Manon | Famille : clinique, puis maison | `g119`, `g126`, `g57` |
| Fanny | La petite sœur, qui vient de naître (berceau, lit), puis enfant après l'ellipse | `g49` |
| Felix | Cousin : lance et dirige le chantier de la cabane | `g93` |
| Joshua | Cousin : les planches de l'enclos à poules | `g18` |
| Yanis | Cousin : la corde des hautes herbes | `g96` |
| Val | Cousin·e, sculpte un cheval en bois dans la maison de Felix : « Regarde, il commence à ressembler à quelque chose. La crinière, c'est le plus dur. » / « Il me faudra encore quelques semaines. Il doit être parfait. » | `g42` |
| Vieux pêcheur | Méfiant, au bord du lac (objet optionnel) | `g67` |
| Poules | Gardent le tas de planches | dessinées dans le code, au style des sprites DS |

### Quêtes, dans l'ordre
1. **La naissance de Fanny** (clinique). Papa : « Te voilà ! Maman est là-bas. » ; « Maman est allongée dans son lit. Dans
   le lit d'à côté, une petite tête brune dépasse de la couverture. » ; Maman : « Te voilà ! Viens voir… Je te présente
   Fanny. » ; Manon : « Elle est toute petite… Elle me ressemble, non ? » ; Papa : « Elle ne pleure même pas. Elle a déjà
   tout compris. » ; Maman : « Approche-toi. Tends-lui la main, doucement. »
   - Au berceau : « Tu tends un doigt vers Fanny… » / « Elle l'attrape ! Et elle serre fort. Tu attends… elle ne le
     lâche pas tout de suite. » / Maman : **« Elle a de la poigne, celle-là. »** / **« À partir d'aujourd'hui, tu vas
     veiller sur elle. »** (sans vertu).
2. **Felix et le plan de la cabane.** En sortant de la clinique, Felix vient chercher Pierre : « Cousin ! Ça y est, on a
   emménagé ! La petite maison au toit bleu, juste à côté de la clinique. » / « Rejoins-nous là-bas, les
   autres t'attendent ! » Chez lui : **« Bienvenue chez nous ! J'ai un plan : on construit une cabane. Rien que pour
   nous. »** ; Joshua : « Il faut des planches. Il y en a plein dans l'enclos à poules… mais il y a les poules. » ;
   Yanis : « Et une corde pour les tenir. J'en ai vu une dans les hautes herbes, tout au sud-ouest. » (au bord du lac,
   ensuite : « J'ai vu une vieille corde dans les hautes herbes, juste sous les grands sapins du bord du lac. Tout en bas à
   gauche du village. ») ; Felix : « Moi,
   je dirige le chantier. On la perche dans les sapins, au sud du lac. »
3. **Les planches** (enclos à poules). Joshua : « Les planches sont au fond de l'enclos à poules… derrière les poules. » /
   « Pousse-les pour dégager le tas : mets-toi derrière une poule et appuie sur A. Elles détestent ça ! » Une poule
   poussée jusqu'à la porte s'échappe : « La poule file hors de l'enclos en caquetant ! » → **Planches** (« Tu récupères
   des planches. » ; Joshua : « Tu as survécu aux poules ? Respect. »). Si la corde est déjà là, Joshua ajoute : « On a
   tout ! On ramène ça chez Felix. » (il le redit si on lui reparle).
4. **La corde** (hautes herbes du sud-ouest, en marchant dessus) → **Vieille corde** (« Tu trouves une vieille corde,
   cachée dans les hautes herbes. » ; Yanis : « Parfait. Ça tiendra… sûrement. »). L'ordre entre 3 et 4 est libre.
5. **La cabane.** Felix : « Tout est prêt ? Alors au travail ! » ; écran noir ; dans la cabane : « La cabane est finie.
   Les quatre cousins s'installent au QG. » ; Joshua « Bon… et maintenant, on fait quoi ? » ; Yanis « On s'ennuie
   déjà. » → **« Pierre utilise Joie de vivre ! »** → « Tu lances une chanson, et tout le monde se met à sauter dans la
   cabane ! » (toute la bande saute de joie) ; Felix « Voilà. Notre QG. » ; Joshua « Personne n'entre sans le mot de
   passe. » ; Yanis « On a un mot de passe ? » ; Felix « Pas encore. Pierre, à toi de le choisir ! » → le joueur écrit
   le mot de passe (8 lettres au plus, « QG » par défaut) ; Felix « « {mot} »… Parfait. Personne ne le saura. » ; Joshua
   « {mot}. Retenu. » ; Felix : **« Où que tu ailles après, cette cabane restera la nôtre. On est une équipe. »** → vertu
   **Esprit d'équipe**. Pour remonter dans la cabane, il faut redonner le mot de passe. (Le QG : lambris, tatamis,
   établi, une table basse avec deux peluches ; Felix, Joshua et Yanis sont chacun sur leur coussin, on leur parle en
   face.)
6. **Ellipse et annonce.** « Quelques années plus tard… » : Pierre au bord du lac ; Manon : « Ah, te voilà ! Papa a une
   nouvelle à nous annoncer. Viens vite à la maison ! » À la maison : « Papa est assis à la table, une lettre à la main.
   Fanny a bien grandi : elle court partout dans le salon. » ; Papa « J'ai reçu ma nouvelle affectation. On part à
   Monté… » ; Fanny saute ; « Fanny, repose ça ! » / « Fanny repose le vase… à peu près droit. » / « Bon. Je disais : on
   part pour Montépilloy. » ; Manon « Encore ? » ; Papa **« L'armée ne demande pas notre avis. »** ; Fanny « Je pourrai
   emmener mes poupées ? » ; Maman « On y arrivera, comme à chaque fois. Tous ensemble. » ; Papa « Et cette fois, pas de
   ferry. On prend la voiture. » / « Pierre, va annoncer la nouvelle à tes cousins. Ils sont à la cabane. »
7. **L'adieu aux cousins** (cabane). Felix « Alors c'est vrai, tu pars ? » ; Joshua « Montépilloy, c'est pas le bout du
   monde. » ; Yanis « C'est où, Montépilloy ? » ; Felix « La cabane t'attendra. Et le mot de passe ne change pas :
   « {mot} ». » ; Joshua « Tu nous écriras ? Une vraie lettre, avec un timbre et tout. » ; Yanis « Et s'il y a des poules
   là-bas, tu nous préviens. Maintenant, on sait faire. » ; Felix **« Allez, file, ta famille t'attend à la voiture,
   devant ta maison. »** (dit tout de suite, et quand on lui reparle).

### Objectifs affichés (rappels des PNJ)
- Felix pendant le chantier : « Il nous faut encore les planches : Joshua t'attend devant l'enclos à poules. Écarte les
  poules du tas ! » / « Et la corde : Yanis dit qu'elle traîne dans les hautes herbes, au sud-ouest. »
- Papa à la maison : « Fanny dort enfin. File voir tes cousins, ils viennent d'emménager ! » ; « Alors, cette cabane,
  elle avance ? J'ai hâte de la voir ! » ; « La voiture est chargée, sur la route du nord. Va dire au revoir à tes
  cousins. »
- La voiture, avant l'adieu : « La voiture est chargée. Va d'abord dire au revoir à tes cousins, à la cabane. »

### Vertus
- **Gagnée** : Esprit d'équipe (les cousins, dans la cabane).
- **Utilisées** : **Joie de vivre**, à l'inauguration de la cabane (route principale) et pour le vieux pêcheur (objet
  optionnel).

### Objet optionnel
- **Galet du lac**, donné par le vieux pêcheur, seulement avec Joie de vivre. Sans elle : « Le vieil homme te tourne le
  dos. Il a l'air de mauvaise humeur. » Avec : « Hm ? Je ne parle pas aux inconnus, moi. » → « Pierre utilise Joie de
  vivre ! » → « Tu t'assois à côté de lui et tu fredonnes la chanson de Maman. » / le pêcheur : « … Elle est pas mal, ta
  chanson. » / « T'as le sourire de ta mère, toi. » / **« Ce galet, je l'ai trouvé au fond du lac quand j'avais ton âge. Il porte bonheur.
  Garde-le. »** Ensuite : « Prends soin de ce galet. Et de ta petite sœur. »

### Retour à Saint-Ay (après le départ)
On peut revenir à pied depuis Montépilloy (par la route de Montépilloy). La maison de la famille est vide ; dans la
cabane (toujours avec le mot de passe), Felix dit « Notre QG ! Reviens quand tu veux. ».

**Verrou d'Ingéniosité : le panier de la cabane** (scène de retour, une seule fois). Au pied de la cabane, une poulie
rouillée retient un panier coincé tout en haut. Sans Ingéniosité : « Le panier des cousins est coincé là-haut. La poulie
est grippée. » Avec : **« Pierre utilise Ingéniosité ! »** → « Tu grattes la rouille, tu remets la corde dans la gorge
de la poulie… Le panier redescend ! » → « Dans le panier, un mot de Felix : » / **« Si tu lis ça, c'est que t'as réparé
la poulie. On savait que tu reviendrais. La cabane est toujours à toi. »** → « Et le règlement du QG : » / « RÈGLEMENT DU
QG : 1. Pas d'entrée sans le mot de passe. 2. Sauf si t'as des bonbons. 3. Yanis a toujours tort. 4. C'est Felix le
chef (écrit par Felix). 5. Non. (écrit par les autres). » → **Règlement du QG** (« Tu prends le règlement du QG. »).
Ensuite, la poulie reste réparée : « Le panier des cousins est redescendu. Il est vide. »

### Boîte aux lettres (carte postale)
Du capitaine du ferry : « Une carte postale ! Elle vient du capitaine du ferry. » / « « Petit Pierre, la canne tient
bon, le poisson moins. Ta mère avait raison, l'île est plus calme sans vous. » / « Reviens quand tu veux, le ferry
connaît le chemin. Le capitaine. » »

### Mini-jeux
Pousser les poules (petit casse-tête), fouille des hautes herbes (corde), saisie du mot de passe, pêche au lac.

### Départ et trajet
- **Condition** : la naissance de Fanny, la cabane (Esprit d'équipe), l'annonce de Papa, l'adieu aux cousins. On monte dans la voiture devant la maison :
  « La voiture est chargée. » ; Felix descend de la cabane et accourt devant le capot : **« Le mot de passe, tu le gardes, hein ? »** ; « Tu
  montes à l'arrière, à côté de Manon et de Fanny. »
- **Trajet en voiture** (écran noir) : « La voiture s'éloigne de Saint-Ay. À l'arrière, tu es serré entre Manon et le siège
  de Fanny. » ; Manon « Regarde, Fanny dort déjà. Elle rate tout. » ; Fanny (endormie) « … les poules… » ; Manon « Elle
  rêve des poules de l'enclos. » ; Papa **« Allez. Montépilloy nous attend. »** Encart : « Tu emportes : Esprit d'équipe. »
- Ensuite, la **route de Montépilloy** se parcourt à pied entre les deux villages. Une promeneuse (`g82`) : « Le blé est
  haut cette année. » / « Quand le vent souffle, on dirait la mer, en jaune. » ; un gamin (`g59`) : « J'ai perdu mon
  cerf-volant dans les champs… » / « Si tu le vois, il est rouge. Ou bleu. Je sais plus. » (aucun cerf-volant n'est
  codé).

---

## 3. Montépilloy (Oise)

### La carte
- 35 x 29 cases (agrandie de 3 x 3 en octobre 2026, script ponctuel retiré depuis) : la grand-rue nord-sud sur trois
  cases, la ferme de M. Bouly et la prairie élargies, le champ et la mare allongés ; ceinture d'arbres entiers.
- 36 x 30 cases depuis les retouches d'octobre 2026 dans le créateur. La grange de M. Bouly est le grand bâtiment
  orange (porte grise en (10, 16)) ; le tracteur est garé devant elle, à la place de l'ancienne camionnette (x 4-5, y 17-18),
  Jean devant lui (4, 19), M. Bouly
  au début du chemin de la ferme (13, 16). L'école est la maison jaune de droite : sa porte bleue en (27, 14), Margaux
  devant elle (25, 15) à la sortie. La porte de la voisine (maison jaune du haut) se frappe depuis la rue (20, 7).

### Arrivée et image d'accueil
- Carte postale `montepilloy` (« bois aux Chênes, l'après-midi ») : **« Montépilloy, Oise. Quelques années plus
  tard… »** ; « Te voilà au bord de la mare. La maison est en haut du village : toute la famille y est. »
- À la maison, Maman : « Te voilà ! Dernier jour d'école primaire ! Après, le collège. » / **« Et ton petit frère Jean
  ne te lâchera pas : à huit ans, il veut déjà tout réparer dans la maison. »** / « Dépêche-toi, tu vas être en retard !
  L'école, c'est le grand bâtiment au toit jaune, à droite de la grand-rue. »

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Maman | Rappelle le programme | `g126` |
| Papa | « Le dernier jour, déjà. On est arrivés à Montépilloy, tu tenais à peine sur le siège arrière. » | `g119` |
| Manon | « Le collège ? Tu verras, on s'y fait vite. Et le matin, tu feras la route à pied avec les copains. » | `g57` |
| Fanny | « Fanny fait rouler un petit tracteur en bois sur le parquet. « Vroum ! Comme celui de M. Bouly ! » » | `g49` |
| Jean | Petit frère, né à Montépilloy, 8 ans (présenté par Maman à l'accueil) : la réparation du tracteur | `g52` |
| M. Bouly | Le fermier, et son tracteur en panne | `g33` |
| Margaux | Copine de classe : lance le cache-cache | `g43` |
| Étienne | Copain de classe | `g108` |
| Benoît | Copain de classe, qui n'ira pas au collège avec eux ; après le cache-cache, assis seul au bord de la mare | `g38` |

### Quêtes, dans l'ordre (les quêtes 2 et 3 dans n'importe quel ordre après l'école)
1. **Le dernier jour de CM2** : en entrant à l'école, « C'est le dernier jour de CM2. » Margaux : « Dernier jour de CM2 !
   À la sortie, on fait une partie de cache-cache. La dernière. »
2. **Le cache-cache.** À la sortie, Margaux : **« Dernière partie de cache-cache avant les vacances ! Mais cette fois,
   dans tout le village ! »** ; écran noir : « … huit, neuf, dix ! »
   - Margaux, derrière les bottes de foin de la ferme : « Zut, trouvée ! Les bottes de foin, c'était trop facile… » /
     « L'an prochain, au collège, je me trouverai une cachette imbattable. Je viens avec toi chercher les autres ! »
   - Étienne, dans l'arbre de la prairie : « Des feuilles tombent… Étienne est perché dans l'arbre ! » / « Perdu ! Le
     collège, c'est en septembre. Paraît qu'il y a des casiers, j'espère qu'on sera dans la même classe. » / « Je t'aide
     à chercher les autres ! »
   - Benoît, dans le tonneau de gauche de la grange. Le tonneau ne s'ouvre qu'une fois Margaux et Étienne trouvés (ils
     suivent Pierre) ; avant : « Le couvercle ne bouge pas. On dirait qu'on le retient de l'intérieur… Il faudrait être
     plusieurs pour le soulever. Trouve d'abord les autres. » Après : **« Pierre utilise Esprit d'équipe ! »** → « Margaux et Étienne t'aident à
     tirer sur le couvercle… Il cède ! » / Benoît : **« Tu m'as trouvé…
     c'était ma dernière partie avec vous. L'an prochain, je ne serai pas au collège avec vous. »**
   - Chaque copain trouvé suit Pierre ; Benoît est donc toujours le dernier. Margaux : **« Alors on la refait l'été prochain. Promis ? »** ;
     Étienne « C'était trop cool, cette partie ! » ; Margaux « Allez, on file à l'école récupérer nos cartables ! » ;
     Benoît (si le tracteur n'est pas réparé) « Au fait, ton petit frère te cherche ! » et, si Jean n'a pas encore lancé la
     réparation, « Jean t'attend dans sa chambre. » (sans vertu).
3. **Le tracteur → Ingéniosité.** Jean, dans la chambre : « Le tracteur de M. Bouly est en panne. Je peux le réparer,
   mais il me faut un assistant. » / « Rejoins-moi à la ferme ! » M. Bouly : « Ah, Jean et son assistant ! Mon tracteur
   est en panne : il lui manque une pièce. » / « Elle doit traîner quelque part dans la grange… peut-être sous le gros
   tas de foin, en bas à droite ? » Sous le tas de foin (pas dans un tonneau : Benoît se cache dans celui de gauche),
   une fois que M. Bouly en a parlé, ou dès que le cache-cache est fini et que Jean a lancé la réparation (même sans
   parler à M. Bouly) :
   « Tu fouilles le tas de foin… Dessous, une pièce de tracteur ! » / « Jean va être content. » →
   **Pièce de tracteur**, rapportée à M. Bouly ou à Jean. Le tracteur est un dessin Gen 4 (scripts/build_props.py).
   - « Jean ouvre sa caisse à outils et se glisse sous le tracteur. » ; Jean : **« Passe-moi la clé ! »** → trois
     questions (« La clé de 12 ! », « Le tournevis plat ! », « Le marteau… non, le petit ! ») parmi cinq outils ;
     mauvaises réponses : « Ça, c'est une cuillère. Qui a mis une cuillère dans ma caisse ? », « Le gros ? Tu veux
     casser le tracteur ? », « Non, pas ça ! Regarde bien dans la caisse. »
   - « Le moteur tousse… puis repart ! » ; Jean : **« À nous deux, on répare tout. »** / « Il sent le gasoil, c'est trop
     bien. » → vertu **Ingéniosité** ; si le cache-cache n'est pas fini, Jean : « Tes copains jouent encore à cache-cache
     dans le village. Va les trouver ! » ; M. Bouly : « Bravo, les garçons ! Allez, Jean, grimpe : on va faire un tour de
     tracteur ! »
4. **La fin de la journée** (le cache-cache fini et Ingéniosité reçue, dans n'importe quel ordre) : pas de soir ni de
   dîner, l'écran passe au noir et l'on enchaîne directement sur l'ellipse de septembre, devant la maison. Pas de caisse
   à outils laissée devant le tracteur.
5. **Septembre** : carte postale `montepilloySeptembre` (« bois aux Chênes, le matin ») : **« Quelques mois plus tard…
   Septembre. »** ; « Devant la maison, au matin. Tu as ton cartable sur le dos. » ; Maman « Premier jour de collège. Tu
   as tout ? » ; Papa « Il a tout. Il a même vérifié deux fois. » ; Jean « Tu me raconteras comment c'est ? » ; « Le
   collège est au village d'à côté : tu y vas à pied, par la sortie nord. »

### Objectifs affichés (rappels)
- Maman : « Tes copains jouent à cache-cache dans tout le village. File les trouver ! » / « Ils se cachent toujours aux
  mêmes endroits : les bottes de foin, le grand arbre de la prairie, la grange… » / « Et Jean cherche un
  assistant, là-haut dans sa chambre. Il a encore une réparation en tête… »
- La sortie nord : « Ta journée n'est pas finie. » ; « C'est le dernier jour de CM2 : file à l'école, en bas de la
  grand-rue ! » ; « Tes copains t'attendent pour leur partie de cache-cache. » ; « Et Jean a un tracteur à réparer avec
  toi. » / « Jean t'attend dans sa chambre. » (tant que Jean n'a pas lancé la réparation)

### Passage optionnel : Benoît triste (Joie de vivre)
Après le cache-cache et jusqu'au matin de septembre, Benoît est assis seul au bord de la mare, en bas à droite (il n'est plus dans la
classe avec Margaux et Étienne). Bonus sans objet.
- Benoît : « Si tu cherches un coin pour bouder, la mare est déjà prise. » / « Margaux et Étienne iront au collège
  ensemble. Moi, je pars ailleurs. Je connaîtrai personne. » →
  **« Pierre utilise Joie de vivre ! »** → « Tu lui racontes la fois où Fanny a failli casser le vase de Maman… Benoît
  éclate de rire. » / Benoît : **« T'es bête… Merci. Je t'écrirai. »**
- Ensuite : « Le vase… j'y pense encore. »

### Vertus
- **Gagnée** : Ingéniosité (le tracteur, avec Jean).
- **Utilisées** : **Esprit d'équipe**, pour ouvrir le tonneau de Benoît avec Margaux et Étienne ; **Joie de vivre**, pour
  consoler Benoît (optionnel).

### Boîte aux lettres (carte postale)
De Felix : « Une carte postale ! Elle vient de Felix. » / « « Pierre, la cabane tient toujours. Yanis a oublié le mot
de passe, pas nous. » / « Joshua veut changer les planches, on a dit non, c'est les tiennes. Reviens vite. Felix. » »

### Mini-jeux
Cache-cache dans tout le village, « Passe-moi la clé ! » (question reposée jusqu'à la bonne réponse), pêche à la mare.

### Départ et trajet
- **Condition** : le cache-cache fini et Ingéniosité, puis directement le matin de septembre. Sortie nord : « Tu prends la route du collège,
  ton cartable sur le dos. »
- **Pas de scène de trajet** : à la sortie nord, l'encart « Tu emportes : Ingéniosité. » (au premier départ
  seulement), puis la route de Bonsecours.

---

## 4. Collège Bonsecours (route de Bonsecours)

### Arrivée et image d'accueil
- Carte postale `routeBonsecours` (« parc National, le matin ») : **« Premier jour de collège. »** ; « Le collège
  Bonsecours, au bout de l'allée. Ton premier jour commence ! »
- Dans le hall, le surveillant : « Bienvenue au collège Bonsecours ! C'est moi le surveillant. » / « Avant le premier
  cours, va ranger tes affaires dans ton casier : le casier 12, au couloir des casiers, en haut de l'escalier. » / « Ta
  classe, c'est la 6e B, en salle de maths : l'étage au-dessus des casiers. » / « Ici, on monte un étage par salle : les
  casiers, les maths, les sciences, et le français tout en haut. »
- Le collège se parcourt de bas en haut, un escalier par étage : hall (un seul escalier) → couloir des casiers → salle
  de maths → salle de sciences → salle de français, tout en haut. Les escaliers sont dans les coins du haut (une rampe
  rouge qui monte, une trémie qui descend) ; on les prend par leur dernière marche. Le couloir des casiers est un couloir
  fin : six casiers d'école bleus (le 12, celui de Pierre et de Rémy, au milieu), le placard d'entretien.
- KEDGE (Bordeaux) est la même école, pièce pour pièce : hall (l'accueil indique la salle), couloir des casiers, salles
  1 à 3 ; l'oral d'anglais a lieu en salle 1.

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Surveillant | Accueil, tranche l'embrouille du casier, rappelle l'objectif | `g116` |
| Principale | Derrière l'accueil : « Bienvenue au collège Bonsecours, Pierre. Le surveillant t'expliquera tout ce qu'il faut savoir. » | `g37` |
| Rémy | Le « colocataire » du casier 12, apporte l'Audace | `g109` |
| Camille | Nouvelle de 6e B, la scène du dialogue à choix | `g25` |
| Professeur | Prof de maths : rappel à l'ordre, puis l'oral du brevet | `g138` |
| Professeure | Prof de français : « Ta rédaction sur Saint-Ay était très réussie. Tu as le sens du récit ! » | `g54` |
| Professeur de sciences | « Aujourd'hui, on observe des feuilles au microscope. Les feuilles des arbres de Bonsecours ! » | figurant |
| Margaux | Cachée dans le placard d'entretien au début (passage optionnel) ; une fois trouvée, en salle de maths : « On est dans la même classe, comme promis ! Enfin… presque promis. » | `g43` |
| Étienne | Tant que Margaux est cachée, en salle de maths, à sa place : « Margaux a trouvé sa cachette imbattable, comme promis. Bonne chance ! » ; ensuite (ou après l'ellipse), en salle de français, pas dans la classe de Pierre : « Les casiers, c'était vrai ! Par contre, pas la même classe… On se voit à la récré ! » | `g108` |
| Élèves | Une réplique chacun, dans le hall, le couloir et les trois salles | figurants |
| Militaires (2) | Barrent la route du Prytanée, en haut de la carte : « Halte ! La route du Prytanée est réservée aux candidats. Reviens avec ton diplôme du brevet. » Le brevet obtenu, l'un d'eux s'écarte sur le bas-côté : « Ton brevet ? Garde-à-vous… C'est en règle. » / « Les portes du Prytanée te sont ouvertes. Droit devant, et tiens-toi bien ! » | `g87` |

### Quêtes, dans l'ordre
1. **L'embrouille du casier.** « Le casier 12. Le tien, d'après ton papier. Tu poses la main sur la porte… » / « … et un
   garçon, arrivé en courant, pose la main dessus en même temps que toi. » ; Rémy : **« Hé ! C'est mon casier, ça. Le
   12. »** / « Le mien aussi dit 12 ! Regarde ! » / « J'étais là avant, de toute façon. » ; « Le ton monte. Chacun jure
   que c'est le sien. » ; le surveillant : **« Ça suffit, vous deux ! »** / « Puisque vous le voulez tous les deux, vous
   le partagez. Point. » ; Rémy : « Bon, colocataire, tu mets tes affaires en haut ou en bas ? » (choix « En haut. » /
   « Comme tu veux. » ; dans les deux cas Rémy prend le bas, « c'est plus près de mes chaussures ») ; « Allez, en maths !
   C'est l'escalier au bout du couloir, ça va sonner ! »
2. **Camille → Audace** (salle de maths). « La salle de maths. Le cours n'a pas encore commencé : le prof range ses
   copies, ça discute de table en table. » ; Rémy : « Le cours commence dans cinq minutes. Tu vois la fille, au milieu de
   la classe ? Elle est en 6e B avec nous. » / « Elle connaît personne non plus. Va lui dire salut, je viens avec toi. »
     Rémy attend au bout de la rangée de Camille. Quand Pierre parle à Camille, il s'assoit à sa droite, puis Rémy à
     droite de Pierre (« Tu t'assois à côté d'elle. Rémy s'installe à ta droite, l'air de rien. ») ; Rémy n'en bouge plus.
   - Trois répliques à choisir, chaque fois une seule bonne : « Salut ! T'es en 6e B ? », « Oui, le village d'à
     côté ! », « On se met ensemble en français ? ». Une mauvaise réplique fait réagir Camille, puis Rémy : « Rémy, derrière
     toi, chuchote : « Joker. On la refait, tranquille. » ».
   - Camille : « Oui ! Moi, c'est Camille. Tu viens de Montépilloy, toi ? » … « C'est pas loin ! Moi, j'habite juste
     derrière le collège. » … « Ça marche ! En rédaction, je suis forte : je t'aiderai. Et toi, tu m'aides en maths ? » ; « Camille sourit. » ; Rémy :
     **« Trop facile. Je savais que t'allais gérer. »** → vertu **Audace** ; Rémy : « Bon. Notre casier, c'est notre
     QG, maintenant. Et toi, t'es mon pote. »
   - Le prof : **« Pierre ! Rémy ! Vous faites trop de bruit. »** / « Si vous continuez comme ça, vous n'aurez jamais
     votre brevet ! »
3. **Ellipse et brevet.** **« Quatre ans plus tard… La fin de la troisième. »** ; le prof : « Pierre ! Viens me voir à mon
   bureau : c'est l'heure de ton oral du brevet. » ; Rémy, en salle de sciences : « Le prof veut te voir pour le
   brevet. Français, maths, anglais : t'es prêt, vas-y ! »
   - L'oral : « Prêt ? » → **« Pierre utilise Audace ! »** → « Trois questions, trois matières. On commence par le
     français. » : « Français : quel est le participe passé du verbe « prendre » ? » (Prendu / Pris / Prit) ; « Maths :
     combien font 7 fois 8 ? » (54 / 56 / 64) ; « Anglais : comment dit-on « bonjour, je m'appelle Pierre » ? »
     (Goodbye, I am Pierre / Hello, my name is Pierre / Hello, I have Pierre). Une erreur ne bloque pas (« Hmm… »,
     on réessaie) → « Parfait ! Comme quoi, malgré le bruit… Tu as mérité ton diplôme du brevet. »
     → **Diplôme du brevet** (« Tu reçois ton diplôme du brevet ! ») ; « Avec ça, tu peux candidater au Prytanée, au bout
     de la route du nord. Bonne chance ! »

### Objectifs affichés (rappels du surveillant)
« Avant le premier cours, va ranger tes affaires dans ton casier : le casier 12, au couloir des casiers. » → « Le cours de
maths va commencer : file en classe, avec ton colocataire de casier. Et pas de bruit, hein ! » → « Ton prof de maths
t'attend à son bureau : il a ton brevet. » → « Ton brevet en poche ! Avec ça, tu peux candidater au Prytanée, au bout de
la route du nord. »

### Passage optionnel : la cachette de Margaux (Ingéniosité)
Du premier jour jusqu'à la fin de la troisième. Bonus sans objet. Dans le couloir des casiers, un placard d'entretien à la
poignée cassée : « La poignée tourne dans le vide. » → **« Pierre utilise Ingéniosité ! »** → « Tu glisses ta règle
dans la fente et tu fais jouer le loquet… Clac ! » / Margaux, à l'intérieur : **« Quoi ?! Personne m'avait jamais
trouvée ! »** / « Bon. L'été prochain, je trouve mieux. Promis. » Elle retourne ensuite en salle de maths (et Étienne en
salle de français). Après l'ellipse, ou une fois Margaux trouvée, le placard répond seulement « La poignée tourne dans
le vide. » ; Margaux ne participe à aucune scène obligatoire.

### Vertus
- **Gagnée** : Audace (Rémy, la scène de Camille). Phrase du carnet : « Oser aller vers les autres, même quand on est
  timide. »
- **Utilisées** : **Audace**, à l'oral du brevet ; **Ingéniosité**, pour ouvrir le placard de Margaux (optionnel).

### Objet optionnel
- **Autocollant de Rémy**, au casier une fois l'Audace reçue : « Le casier 12 : votre QG, à Rémy et toi. Rémy a
  collé un autocollant de Pokémon à l'intérieur de la porte. » ; Rémy arrive : « Ah, tu l'as vu ? Il m'en restait un.
  Tiens, pour toi : comme ça, on a le même. » → « Rémy te donne un autocollant. Un souvenir de votre QG. »

### Boîte aux lettres
Aucune.

### Mini-jeux
Dialogue à choix (Camille), l'oral du brevet (trois questions : français, maths, anglais), le placard de Margaux
(optionnel).

### Départ et trajet
- **Condition** : le diplôme du brevet. Rémy : « Le Prytanée ? T'es un ouf. Tu m'enverras une photo en uniforme ! » Un
  militaire s'écarte et annonce que les portes du Prytanée sont ouvertes ; route du nord : « Ton brevet en poche, tu prends la route du Prytanée pour y candidater. »
- **Pas de scène de trajet** : l'encart « Tu emportes : Audace. » (au premier départ seulement), puis le Prytanée.

---

## 5. Prytanée (lycée militaire, La Flèche)

### Arrivée et image d'accueil
- Carte postale `prytanee` (« tour Chétiflor, le matin ») : **« Le Prytanée, La Flèche. La rentrée. »** ; « Le capitaine
  t'attend devant l'internat des garçons, en haut à gauche. »
- Le capitaine : **« Nouveau. Ici, personne ne fait les choses à ta place. »** / « Ta chambre est au premier étage. Lit,
  armoire, affaires. Exécution. » / « Inspection dans dix minutes. »

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Capitaine | Accueil, inspection, garde la porte nord | `g87` |
| Tanguy | Camarade de chambre | `g56` |
| Geoffrey | Camarade de chambre | `g41` |
| Militaires | Porte sud, drapeau, cour ; la nuit, trois rondes avec lampe | `g87` ; `g8` imposé pour une ronde |
| Élèves | Hall et dortoir des terminales | `g55`, `g56`, `g88`, `g89`, `g23` (imposés) |
| Nouveau | Dans le hall de l'internat, le jour, jusqu'au bac : le mal du pays (passage optionnel) | `g58` (imposé) |

### Quêtes, dans l'ordre
1. **La chambre → Autonomie.** Trois tâches dans n'importe quel ordre : « Pierre fait son lit. », « Pierre range ses
   affaires. », « Pierre prépare ses affaires pour demain. » Tanguy : « Le capitaine regarde toujours l'armoire en
   premier. » / « La tienne, c'est celle de droite. » ; Geoffrey : « Ton lit, c'est le troisième en partant de la gauche. Au carré, hein. » /
   « Et prépare tes affaires pour demain, sur le bureau. » / « Il reste l'armoire. Demande à Tanguy, c'est un
   maniaque. »
   - L'inspection : **« GARDE À VOUS ! »** ; « L'armoire d'abord. Toujours l'armoire. » / « … Pliée au carré. Je suis
     presque déçu. » ; « Le lit. Une pièce de monnaie rebondirait dessus. » / « Je n'ai pas de pièce. Mais je le sens. » ;
     « Les affaires pour demain. Même les chaussettes sont alignées. » / « Qui t'a appris ça ? … Ne réponds pas. » ;
     **« Correct. Repos. »** → vertu **Autonomie**.
2. **Le mur, la nuit.** Fondu au noir sans texte, la nuit tombe sur le dortoir ; Tanguy : **« Ce soir on fait le mur.
   T'es avec nous ? »** ; Geoffrey : « Les rondes passent toutes les deux minutes, faut juste bien attendre. » →
   **« Pierre utilise Esprit d'équipe ! »** ; Tanguy : « On file par la porte nord, tout en haut. On t'attend derrière
   le mur. Et planque-toi des rondes ! »
   - Traverser la cour sans être vu des rondes. Pris : « Hé, toi ! Retour au dortoir ! » (retour devant l'internat).
   - Derrière la porte nord, Tanguy : « T'en as mis du temps ! » ; l'écran s'éclaircit (l'aube se lève sur la cour) ;
     Tanguy : **« Le ciel se lève déjà… Vite, au dortoir avant la relève ! »** ; fondu, et l'on enchaîne directement au
     dortoir, sans ellipse ; le capitaine entre : « Trois lits vides cette nuit, d'après la ronde. Qui est sorti ? » → **« Pierre utilise Audace ! »** →
     « Tu te lèves, au garde-à-vous, et tu regardes le capitaine droit dans les yeux. » ; Pierre : **« Personne n'est
     sorti, mon capitaine. On n'a rien vu, rien entendu. »** ; le capitaine : « Rien vu, rien entendu… Bien. » /
     **« Alors la prochaine fois que « personne » sort, dites-lui d'essuyer ses rangers : il a laissé de la boue jusqu'à
     son lit. »** ;
     Geoffrey : **« Personne a rien vu. On remet ça quand vous voulez les gars ! »**
3. **Le bac.** **« Quelques années plus tard… »** (la seule ellipse du Prytanée) ; Tanguy : « Debout, Pierre ! C'est
   aujourd'hui, les résultats du bac ! » ; Geoffrey : « On descend voir. Si j'y suis pas, je refais le mur… mais pour de
   bon. » ; Tanguy : « La liste du bac est affichée sur le panneau de la place d'armes. Viens, on va voir ! » Au
   panneau : « La liste des résultats du baccalauréat est affichée. Tu cherches ton nom… » ; Tanguy « T'es dessus ! » ;
   Geoffrey « On y est tous les trois. Même moi. » → **Baccalauréat** (« Diplôme obtenu : Baccalauréat ! »).

### Rappels des PNJ
Le capitaine (« Ta chambre est au premier étage… »), Tanguy (la porte nord, puis le panneau du bac), puis, après le bac :
« Le capitaine t'attend à la porte nord, la route de Bordeaux. »

### Passage optionnel : le nouveau qui a le mal du pays (Joie de vivre)
Dans le hall de l'internat, de l'arrivée jusqu'au bac (pas la nuit du mur, où le hall est vide) : « Un nouvel élève, une
lettre à la main. » ; le nouveau : « Ma mère me manque. Ici, personne ne rigole jamais. » → **« Pierre utilise Joie de
vivre ! »** → « Tu lui apprends le pas de danse de Maman, au milieu du hall. » / « Il rit… puis il danse aussi. » / le
nouveau : **« T'es fou. Mais ça fait du bien. Tiens, garde ça : j'en ai deux. »** → **Insigne du Prytanée** (« Tu reçois
un insigne du Prytanée ! »). Ensuite : « T'es fou. Mais ça fait du bien. »

### Vertus
- **Gagnée** : Autonomie (l'inspection du capitaine).
- **Utilisées** : **Esprit d'équipe**, pour faire le mur avec Tanguy et Geoffrey ; **Audace**, face au capitaine au petit
  matin ; **Joie de vivre**, pour le nouveau (optionnel).

### Objet optionnel
- **Insigne du Prytanée**, donné par le nouveau (voir le passage optionnel).

### Boîte aux lettres
Aucune. Dans le hall : « Le courrier des internes, trié par chambre. Rien pour toi aujourd'hui. »

### Mini-jeux
Les tâches de la chambre ; l'infiltration de nuit entre les rondes.

### Départ et trajet
- **Condition** : le baccalauréat. Le capitaine, à la porte nord : **« Bordeaux, hein. Tu feras ton lit là-bas
  aussi. »** (sans le bac : « Les résultats sont affichés sur le panneau de la place d'armes. Va voir. »)
- **Trajet en voiture** ; encart : « Tu emportes : Autonomie. »

---

## 6. Bordeaux (Gironde) : les études

### Arrivée et image d'accueil
- Carte postale `bordeaux` (« parc National, l'après-midi ») : **« Bordeaux, Gironde. Les études commencent. »**

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Agent immobilier | Remet les clés : « Vos parents ont tout réglé. Voici les clés, l'immeuble est juste à gauche. » | `g35` |
| Ousmane | Le coloc ; garde aussi le départ à l'aéroport | `g105` |
| Paul | Fan de musculation : prête l'enceinte | `g86` |
| Rémi | Revient d'un échange aux USA, parle franglais : prête les gobelets | `g140` |
| Dalil | Discret, à la soirée d'intégration (puis au stade, au retour) | `g2` |
| Léo | Étudiant de KEDGE, invité à la soirée ; on le retrouve à Hull | `g55` |
| Anaïs | Étudiante de KEDGE (« de ta promo »), invitée à la soirée ; on la retrouve à Hull | `g107` |
| Étudiants (13) | À la soirée d'intégration | figurants |
| Professeure d'anglais | L'oral à KEDGE | `g106` |
| Hôtesse | Guichet de l'aéroport | `g64` |
| Agent de sécurité | Garde le chemin de l'aéroport (sortie est) tant que Pierre n'a pas son diplôme d'anglais | `g87` |
| Ouvrier | Travaux sur la route de Paris (sortie sud-est), jusqu'au diplôme de Bordeaux | `g79` |

### Quêtes, dans l'ordre
1. **Les clés.** Dès l'arrivée, Ousmane, devant l'immeuble, vient se présenter : **« Salut, moi c'est Ousmane, ton
   coloc ! Les clés sont à l'agence, juste à droite. Je t'attends ici. »**, puis retourne attendre à la porte (s'il revoit
   Pierre sans les clés : « Les clés sont à l'agence, juste à droite. Je t'attends ici. »). À l'agence → **Clés de
   l'appartement**. Devant l'immeuble, Ousmane : « T'as les clés ? Alors, on va voir ça ! »
2. **La coupure.** « Il fait tout noir. L'interrupteur ne répond pas. » ; Ousmane : « C'est quoi ce délire ?
   On appelle quelqu'un ? » ; Pierre : **« Non. »** → **« Pierre utilise Ingéniosité ! »** Le compteur se cherche à tâtons
   au fond de la pièce : « Le compteur électrique. Le disjoncteur est tombé… Tu le relèves. » ; Ousmane : **« T'es
   sérieux, tu savais faire ça ? »** (sans vertu).
3. **La soirée d'intégration.** Ousmane : « Bon. Les nouveaux élèves de KEDGE arrivent, on fait la soirée ici. Il nous
   manque tout. » / « Paul a une enceinte, Rémi a des gobelets. » / « Ils habitent tous les deux de l'autre côté de
   la Garonne : passe un pont, c'est en bas. » / « Paul, c'est la maison du milieu ; Rémi, celle de droite, juste à
   côté. »
   - Paul : « L'enceinte ? Ok, mais tu la portes comme un vrai, dos droit. » ; choix « Dos droit, genoux pliés. » /
     « À une main, tranquille. » / « Tu me la portes ? » ; dans tous les cas → **Enceinte**.
   - Rémi : « C'est so random, les gobelets sont dans le closet. » ; choix « Le closet ? » / « Thanks, bro. » / « Parle
     français ! » ; dans tous les cas → **Gobelets**.
   - Ousmane : « On est bons. Rentre, ça commence. » ; « La soirée d'intégration bat son plein. L'enceinte de Paul
     trône au milieu du salon. » L'appartement est de nuit, comme à l'Asylum, avec des lumières de fête autour de
     l'enceinte (répliques des étudiants, par exemple « C'est toi qui as rallumé le courant ? Respect. »)
   - Parmi les invités, Léo : **« Moi c'est Léo, aussi à KEDGE. Paraît qu'on part tous à Hull l'an prochain pour
     l'échange… Ça va être quelque chose. »** (ensuite : « La prochaine soirée, c'est à Hull ! ») ; Anaïs : **« Anaïs, de ta
     promo ! Léo dit qu'à Hull il pleut tout le temps. J'espère qu'il exagère. »** (ensuite : « À Hull, alors ! »).
   - Dans un coin, près des lits, sans danser : **Dalil**, discret (on ne le voit qu'à de rares moments : ici, puis au
     stade, au retour) : « Il paraît qu'il va faire beau ce week-end. Parfait pour aller voir les vagues. »
   - En allant vers la porte pendant la fête : fondu, **« Le lendemain matin. L'appartement est sens dessus dessous :
     gobelets, canettes, pizza froide, confettis… »** / « Ousmane dort encore, tout habillé. » (couché dans le lit de
     gauche). Voir le passage optionnel.
4. **Le diplôme d'anglais.** En sortant de l'appartement : « Quelques mois plus tard… ». Rémi, devant KEDGE : **« T'inquiète, c'est
   easy. »** La professeure : « Welcome to your English oral! Three questions. Ready? » → **« Pierre utilise
   Audace ! »** → trois traductions (« Je suis en
   retard », « Ça marche ! », « J'ai hâte ! » ; bonnes réponses « I am late. », « Deal! », « I can't wait! » ; une erreur :
   par exemple « Very French. Try again! ») → « Excellent! Well done, Pierre. » → **Diplôme d'anglais** (« Diplôme
   obtenu : Anglais KEDGE ! ») ; « Avec ça, la route vers l'est t'est ouverte. »
   En sortant de KEDGE, Ousmane attend devant la porte : **« Ça y est, tu l'as, ton diplôme ! L'aéroport est par la
   sortie est. Prends ton billet pour Hull, je pars avant toi. »**, puis il part devant.

### Rappels des PNJ
Ousmane (les clés à l'agence, puis l'aéroport par la sortie est), l'agent immobilier (« L'immeuble est juste à
gauche. »), Ousmane dans le noir (« Pas près de la porte, en tout cas. »), Rémi devant KEDGE le jour de l'oral. Pendant
les préparatifs, Ousmane rappelle : « Il manque l'enceinte :
Paul, la maison du milieu, de l'autre côté de la Garonne. » / « Et les gobelets : Rémi, la maison de droite, juste à
côté de chez Paul. »

### Les gardiens des sorties est
- Chemin de l'aéroport (en haut à droite), tant que Pierre n'a pas son diplôme d'anglais : l'agent de sécurité. Passer à
  côté de lui : il se tourne vers Pierre (« ! »), **« Halte ! Par ici, c'est l'aéroport. »** / « Pas de diplôme
  d'anglais, pas d'avion. L'oral, c'est à KEDGE, de l'autre côté de la Garonne. », et Pierre recule d'un pas.
- Route de Paris (en bas à droite), jusqu'au diplôme de Bordeaux : l'ouvrier, de la même façon : **« Holà ! Travaux sur la
  route de Paris, personne ne passe. »** / « Reviens plus tard. On aura peut-être fini… peut-être. »

### Le rangement après la soirée (Autonomie, obligatoire)
Le lendemain matin, dans l'appartement, le désordre est au sol (dessiné au style DS) : trois gobelets rouges renversés, une
boîte de pizza entamée, un paquet de chips, des canettes écrasées, des bouteilles, des confettis partout, et la couette en
vrac sur le lit de Pierre. Trois tâches, dans n'importe quel ordre ; ramasser un objet range toute sa catégorie : les
gobelets (« Pierre ramasse tous les gobelets qui traînent et les empile dans un sac. »), le salon (« Pierre jette la
pizza, les canettes, les chips et les bouteilles, et balaie les confettis. »), le lit de droite (« Pierre secoue la
couette et fait son lit. ») ; à la première : **« Pierre utilise Autonomie ! »**. Avant, Ousmane : « Ousmane dort à
poings fermés. Il ronfle. » Une fois les trois faites, Ousmane se réveille, sort du lit et vient voir Pierre : **« Attends… t'as tout rangé ? Tout
seul ? »** / « Tiens, j'ai retrouvé ça sous les confettis. » → **Photo de la soirée** (« Tu reçois la photo de la soirée ! »). Ensuite : « Tout rangé… Je te dois une pizza. Une vraie, pas celle d'hier soir. »
On ne sort pas avant d'avoir tout rangé : à la porte, **« L'appartement ressemble à un champ de bataille… Tu ne vas pas
laisser ce chantier à Ousmane : range tout avant de sortir. »** et Pierre recule d'un pas. Une fois tout rangé, la sortie
mène à « Quelques mois plus tard… ».

### Passage optionnel : le vélo du cycliste (Ingéniosité)
Sur le quai nord, près du banc, un cycliste assis sur son vélo (sprite Cycliste de Diamant / Perle) : **« Oh non, oh non…
J'ai perdu la clé de mon antivol en coupant par l'herbe. »** / « C'était au bord de la Garonne, de l'autre côté, vers
KEDGE. Tu pourrais jeter un œil ? » (ensuite : « Ma clé doit être dans les hautes herbes, au bord de l'eau, du côté de
KEDGE. »). Dans les hautes herbes du recoin sud-ouest (entre la Garonne et KEDGE) : « Tu fouilles les hautes herbes…
Quelque chose brille ! » → **Clé d'antivol**. Rapportée : « Ma clé ! Tu l'as retrouvée ! » ; il offre son vieux vélo,
chaîne sautée → **« Pierre utilise Ingéniosité ! »** → « Tu remets la chaîne sur le pignon, tu resserres la selle et tu
regonfles les pneus. Il roule comme neuf ! » → **Vélo** ; « Eh ben ! T'as des doigts de fée, toi. » ; « Appuie sur V (ou
sur le bouton VÉLO) pour monter dessus. » Ensuite : « Il te va bien, ce vélo ! Bordeaux, ça se découvre à deux roues. »

### Vertus
- **Gagnée** : aucune. Le compteur de vertus n'est pas affiché à Bordeaux.
- **Utilisées** : **Ingéniosité**, pendant la coupure et pour réparer le vélo du cycliste (optionnel) ; **Audace**, avant
  l'oral d'anglais ; **Autonomie**, pour le rangement (obligatoire avant de sortir de l'appartement).

### Objet optionnel
- **Photo de la soirée**, donnée par Ousmane au réveil (voir le passage optionnel).
- **Vélo**, offert par le cycliste du quai (voir le passage optionnel) ; la **Clé d'antivol** lui est rendue. L'enceinte et les gobelets, eux, sont
  obligatoires et repris au début de la soirée.

### Boîte aux lettres (carte postale)
Une boîte aux lettres rouge, à gauche de l'immeuble. De Joshua (la « vraie lettre, avec un timbre » promise à Saint-Ay) :
« Une carte postale ! Elle vient de Joshua. » / « « Pierre, je t'avais promis une vraie lettre, avec un timbre. Voilà le
timbre. La lettre, c'est cette carte. » / « Felix dit que la cabane tient toujours. Yanis a encore oublié le mot de passe.
Joshua. » »

### Mini-jeux
Recherche à tâtons dans le noir ; trois choix sans mauvaise réponse (Paul, Rémi) ; oral d'anglais (trois questions).

### Départ et trajet
- **Condition** : le diplôme d'anglais (l'agent de sécurité laisse alors passer). La sortie est mène à l'aéroport ;
  Ousmane devant le guichet : « Le guichet, c'est juste là. Prends ton billet pour Hull. » ; l'hôtesse propose « Hull
  (Angleterre) » et « Autre » ; Ousmane : **« Hull, hein. Je pars une semaine avant toi, je te garde une place à la
  coloc. »**
- **Trajet en avion**, sans encart « Tu emportes ».

---

## 7. Hull (Angleterre)

### Arrivée et image d'accueil
- Carte postale `hull` (« îles Tourbillon, la nuit » : une mer grise et agitée) : **« Hull, Angleterre. »**, puis
  Ousmane, déjà là, vient directement voir Pierre : **« T'es enfin là ! Bienvenue en Angleterre. Oui, il pleut. Il pleut tout le temps. »** / « Léo et Anaïs sont
  déjà là. Toute la promo de KEDGE a atterri ici. » / « Viens, je te montre la coloc. » Il pleut à Hull tant qu'il fait jour.

### La carte (redessinée en octobre 2026, 40 x 50)
En haut, le campus : les bureaux de l'université (immeuble à jardinières, à gauche, fermés : « Les bureaux de
l'université. Fermés, sauf pour les inscriptions. »), l'université (manoir de pierre, au centre ; le jour des résultats,
le panneau « EXAM » est dressé à sa droite, comme celui du bac au Prytanée), The Asylum (boutique au store rayé, à
droite). Newland Avenue descend au milieu : la bibliothèque Brynmor Jones (longère au toit d'ardoise, à gauche) ; en face,
un café, le premier pub (immeuble à jardinières) et chez Léo, Romain et Prophecy (la petite maison juste après le pub).
Plus bas : la coloc de Pierre et Ousmane, celle de Charlotte et Anaïs, le second pub (immeuble à jardinières) et une
maison fermée (« Ce n'est pas chez toi. »). Les pubs sont les immeubles à deux étages. La grande rue, est-ouest, mène à
l'aéroport par ses deux bouts ; le square et sa fontaine, le quai, l'estuaire. Plus de bus rouge, de cabines, de Hull
Minster ni de The Deep.

The Asylum (24 x 18) : le bar à gauche (barman, habitués sur les tabourets), le DJ derrière ses platines entre deux
enceintes, la grande piste lumineuse et ses boules à facettes, les mange-debout et le coin salon à droite, le vestiaire
et le videur à l'entrée ; une vingtaine de figurants (danseurs, étudiants, clients).

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Ousmane | Coloc de Pierre, toujours avec la bande | `g105` |
| Léo | Meneur de la bande, parle franglais ; rencontré à la soirée de Bordeaux | `g55` |
| Romain | Colocataire de Léo ; rencontre Pierre chez Léo | `g92` |
| Prophecy | Colocataire de Léo ; rencontre Pierre chez Léo | `g94` |
| Charlotte | De la bande, sérieuse, colocataire d'Anaïs ; connaît Pierre d'avant Hull, le retrouve au premier pub | `g44` |
| Anaïs | De la bande ; de la promo de KEDGE, rencontrée à la soirée de Bordeaux | `g107` |
| Barman, Barmaid, clients | Les deux pubs, l'Asylum | Barman `g101` ; les autres en figurants |
| DJ, videur, vestiaire, danseurs, étudiants | The Asylum | figurants |
| Habitué | Adversaire aux fléchettes, et le pari (passage optionnel) | figurant |
| Professor | À l'université : « Welcome to Hull! Les résultats de l'examen seront affichés devant l'université. » | `g138` |

### Quêtes, dans l'ordre
1. **La coloc, Léo.** Ousmane : « Au fait, Léo a appelé. Il veut te voir, il a un plan. » / « Il habite en haut de
   Newland Avenue, à droite : la petite maison juste après le pub. » Chez Léo : **« Pierre ! Comme à la soirée de Bordeaux, mais en pire côté météo. Ce soir, on sort, tout le monde ! »** ; Léo : « Romain,
   Prophecy : voilà Pierre, de la promo de KEDGE. » ; Romain : **« Ah, c'est toi, Pierre ! Léo nous a parlé de toi. »** /
   « Nous, on vous rejoint à l'Asylum. » ; Prophecy : « Salut, Pierre. » / « Il me faut au moins une heure pour choisir
   mes chaussures. Romain m'attend. » ; Léo : « Les autres sont déjà au pub, juste à côté. Je passe devant, suis-moi ! » ;
   « La nuit tombe sur Hull. » ; Léo : « Premier pub, juste à côté. Suivez-moi, tout le monde ! »
   **La tournée des bars** : à chaque étape (de chez Léo au premier pub, puis au second, puis à l'Asylum), Léo sort le
   premier, part devant en éclaireur (il attend Pierre s'il traîne) et entre le premier ; Pierre le suit ; à partir du
   premier pub, Ousmane, Charlotte et Anaïs suivent Pierre à la queue leu leu, puis s'attablent en arrivant.
2. **Premier pub : la tournée.** Léo : **« Première tournée, c'est toi qui régales ! »** ; Anaïs : « Comme à Bordeaux, mais
   c'est toi qui régales cette fois ! » ; Charlotte, qui connaît déjà Pierre (d'avant Hull) : **« Pierre ! Ça fait
   plaisir de te revoir. Et devine qui est la coloc d'Anaïs… Le monde est petit ! »** ; le barman : « Alors, qu'est-ce
   que je te sers pour la bande ? » Chacun dit sa commande en
   français : Léo « Une Guinness, évidemment. », Ousmane « Un cidre, s'il te plaît. », Charlotte « Un gin tonic ! »,
   Anaïs « Un verre de vin rouge. ». Le barman les demande en anglais (« And for Léo? »…), parmi six boissons ; une
   erreur : « Euh, c'est pas ça ? » / « Retourne lui redemander sa commande. » Tout servi : « Le barman pose les verres
   sur un plateau. Tu rapportes la tournée à la table. » ; Ousmane « Santé ! » ; Léo « Cheers ! Allez, on finit ça et on
   file au pub d'en bas. Je passe devant ! » (il sort ; les autres se lèvent et suivent Pierre).
3. **Deuxième pub : les fléchettes.** L'habitué : « Hey, the new guy! Tu joues ? » ; choix « Allez ! » / « Pas
   maintenant. » ; le pari (voir le passage optionnel), puis une partie de trois lancers (écran façon jeu Pokémon : la
   cible où se plantent les fléchettes, la liste des lancers et le total, la jauge de visée), gagnée ou perdue ; puis
   « Ton téléphone vibre. C'est Romain. » ; Romain, au téléphone (déjà à l'Asylum) : « L'Asylum nous attend, tout en haut
   sur le campus ! Léo, montre le chemin. » ; Léo : « On file à l'Asylum ! Je passe devant, suivez Pierre ! »
   (l'histoire continue dans les deux cas).
4. **L'Asylum, l'aube → Insouciance.** Romain : « Vous en avez mis du temps ! » ; Léo : « Tout le monde sur la piste ! » /
   « C'est notre chanson ! Venez tous ! » → **« Pierre utilise Joie de vivre ! »** → « Tu entraînes toute la bande sur la
   piste, comme Maman au salon. » ; « Toute la bande danse sur la piste. » ; « La musique ralentit… Dernière
   chanson. » Au petit matin : « Ciel bleuté, les réverbères s'éteignent. Toute la bande est devant l'Asylum. » ; Léo :
   **« Ok guys, zis night was very, very beautiful. Now we go 'ome. Follow me, I know ze way! »** (il part du mauvais
   côté) ; Ousmane « Léo… c'est de l'autre côté. » ; Charlotte « Au fait… les exams, c'est après-demain. » ; Anaïs « Ne
   dis pas ça maintenant. » ; Léo « Demain, bibliothèque. Tout le monde. » → vertu **Insouciance** (phrase du
   carnet : « Profiter du moment, sans penser à demain. ») ; Ousmane : « Allez, on rentre dormir à la coloc. Demain…
   enfin, tout à l'heure, révisions. » ; « Tout le monde rentre se coucher. » : la bande disparaît
   (chacun chez soi : Léo, Romain et Prophecy chez eux, Ousmane à la coloc).
5. **Dormir** : Ousmane, déjà rentré : « Enfin ! Allez, au lit. » ; « Tu t'écroules sur ton lit. » ; « Le lendemain,
   veille d'examen… » ; Ousmane réveille Pierre : « Debout ! Les exams, c'est demain. Toute la bande révise à la
   bibliothèque Brynmor Jones. » / « C'est la longère au toit d'ardoise, en haut de Newland Avenue, à gauche. On se
   retrouve là-bas ! »
6. **Les révisions** (bibliothèque Brynmor Jones) : « La bande révise autour d'une table. Tour de table ! » Trois questions
   sans mauvaise réponse bloquante : Léo (« J'ai checké le planning, on a un meeting ASAP. »), Charlotte (le present
   perfect), Prophecy (« si je dis « ze » au lieu de « the », ça passe ? »). Charlotte : **« T'es prêt. »** (Anaïs, à la
   table : « Les résultats, c'est après-demain. On va y arriver ! »)
7. **Les résultats**, sur le panneau « EXAM » dressé devant l'université : en sortant de la bibliothèque, « Le
   surlendemain… » (l'examen a eu lieu la veille, hors écran) ; Ousmane, le matin : « Les résultats sont affichés devant
   l'université. Viens, on va voir ça ! » ; « Les résultats de
   l'examen d'anglais sont affichés. Tu cherches ton nom… » ;
   Léo : **« Diplôme de Hull, bro ! »** → **Diplôme d'anglais de Hull** (« Diplôme obtenu : Anglais de Hull ! ») ;
   Léo : « On se retrouve tous devant chez moi pour se dire au revoir. Ramène-toi ! »
8. **Les adieux**, devant chez Léo : « Toute la bande est là, devant chez Léo. Chacun part en échange. » ; Charlotte « Moi,
   c'est le Canada ! » ; Anaïs « Bali ! » ; Prophecy « Les États-Unis. Je vais enfin parler anglais pour de vrai. » ;
   Romain « Hong Kong ! » ; « Et toi, c'est Hanoï, au Vietnam. » ; Léo **« Hanoï, hein. Nous on garde la maison. »** ;
   Ousmane **« Ton avion pour Hanoï part de l'aéroport, au bout de la grande rue. Allez, file. Reviens avec des
   histoires. »**

### Rappels des PNJ
Plus aucune ligne « Objectif : ». Léo (le premier pub), le barman (la tournée), Romain au téléphone (l'Asylum), Ousmane
à l'aube (rentrer dormir), au réveil (la bibliothèque), le surlendemain (les résultats) et aux adieux (l'aéroport), Léo
aux résultats (les adieux devant chez lui).

### Passage optionnel : le pari des fléchettes (Audace)
Avant la partie, l'habitué : « Un pari ? Si tu gagnes, je paie une tournée à toute ta bande. » → **« Pierre utilise
Audace ! »** → « Tu tends la main. Pari tenu. »
- Gagné : **« Well played, mate! Un pari, c'est un pari. »** ; **« A round for everyone! Une tournée générale, c'est moi
  qui offre ! »** : toute la bande saute de joie (notes et cœurs) ; Ousmane : « Pierre, t'es une légende. » Pas d'objet.
- Perdu : « Not bad! La prochaine fois, peut-être. », puis l'habitué : « Revanche ? » (Oui / Pas maintenant). On peut
  rejouer le pari autant qu'on veut tant que le pub est ouvert : en enchaînant les revanches, ou en reparlant à
  l'habitué (« Revanche ? »). Audace n'est utilisée qu'au premier pari.
- Une fois le pari gagné : « Good game, mate! Cheers! ». Une nouvelle partie se joue alors sans pari (« Well played,
  mate! Tu reviens quand tu veux. » ou « Not bad! La prochaine fois, peut-être. »).

### Vertus
- **Gagnée** : Insouciance (l'aube devant l'Asylum).
- **Utilisées** : **Joie de vivre**, sur la piste de l'Asylum ; **Autonomie**, au guichet de l'aéroport avant Hanoï ;
  **Audace**, pour le pari des fléchettes (optionnel).

### Objet optionnel
Aucun (le pari gagné offre une tournée générale).

### Boîte aux lettres (carte postale)
Une boîte aux lettres rouge, à droite de la coloc. De Maman : « Une carte postale ! Elle vient de Maman. » / « « Alors,
l'Angleterre ? Ici, tout le monde va bien. Fanny demande si les Anglais ont des poules. » / « Papa dit de bien manger.
Jean a réparé le grille-pain, pour de vrai cette fois. Gros bisous, Maman. » »

### Mini-jeux
La tournée (retenir quatre commandes, les donner en anglais), fléchettes (trois lancers), danse à l'Asylum, révisions à
choix.

### Départ et trajet
- **Condition** : le diplôme de Hull et les adieux. Les deux bouts de la grande rue mènent à l'aéroport : « Tu te rends
  à l'aéroport. » ; vol « Hanoï (Vietnam) », personne ne l'accompagne :
  **« Pierre utilise Autonomie ! »** → « Pour la première fois, personne ne t'accompagne. Tu prends ton billet pour
  Hanoï. »
- **Trajet en avion** ; encart : « Tu emportes : Insouciance. »

---

## 8. Hanoï (Vietnam)

Pour la première fois, Pierre arrive seul dans une ville dont il ne parle pas la langue (`src/data/hanoiStory.js`).

### La carte (36 x 30, redessinée en Gen 4)
Au nord, le long de la grande rue (est-ouest, vers l'aéroport par ses deux bouts) : une maison violette (porte (4, 6),
fermée), la maison noire = l'agence de voyage (11, 6), ta maison = la seconde maison violette (20, 5, porte en retrait), avec sa boîte aux
lettres rouge à droite (24, 7), et la maison bleue aux lanternes (29, 7, fermée). Au milieu : le lac Hoàn Kiếm, son îlot
à la cloche et son pont de bois ; M. Lam sur le petit îlot à gauche du pont, près de la cloche (8, 15) ; les papis aux échecs à l'est du pont (18, 12)
et (20, 12) ; le temple au toit rouge (porte (26, 16)). Au sud : le portique rouge, les étals, la maison sur pilotis, la
grande maison bleue (26, 24, fermée). Les portes suivent la carte retouchée dans le créateur (octobre 2026). Portes fermées : « Tu frappes. Personne ne répond… ou alors, en vietnamien. »

### Arrivée et image d'accueil
- Carte postale `hanoi` (« antre du Dragon ») : **« Hanoï, Vietnam. »** ; « Personne ne t'attend à la sortie de
  l'aéroport. Pas d'Ousmane, pas de Léo. » / « Ta maison est la petite maison violette de la grande rue. Ton nouveau
  travail commence aujourd'hui, à l'agence de voyage : la maison noire, un peu plus loin. »
- Dans ta maison (avant le premier jour) : « Ta maison à Hanoï. Petite, silencieuse… et rien qu'à toi. » / « L'agence de
  voyage t'attend : la maison noire, sur la grande rue. »

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Patron | Le patron (français) de l'agence de voyage | `g141` (imposé) |
| M. Lam | Vieux monsieur de l'îlot, près de la cloche ; a appris le français à l'école | `g129` (imposé) |
| Passante, Vendeuse, Passant | Ne parlent pas français | `g19`, `g70`, `g14` (imposés) |
| Touriste (x 2) | Les deux touristes à guider ; tous deux nommés « Touriste » à l'écran | `g24`, `g22` (imposés, aussi quand ils suivent) |
| Papi (x 2) | Jouent aux échecs chinois au bord du lac (passage optionnel) | `g39`, `g48` (imposés) |
| Romain | Au téléphone, six mois plus tard | — |

### Quêtes, dans l'ordre
1. **L'agence.** Le patron : « Ah, Pierre ! Bienvenue à l'agence. Un Français dans l'équipe, enfin quelqu'un à qui
   parler ! » / « Ton premier jour commence maintenant. Les consignes de la journée sont là-dessus : c'est l'équipe du
   matin qui les a écrites. » → « Le patron te tend un papier. » → **Consignes en vietnamien** ; **« Tout est écrit en
   vietnamien. Tu n'y comprends pas un mot. »** ; le patron : « Moi, j'ai des clients au téléphone. Débrouille-toi : tu
   verras, c'est formateur ! » (ensuite : « Toujours pas lu tes consignes ? Demande dehors, quelqu'un saura bien te les
   lire. »)
2. **La traduction → Adaptation.** Les passants, quand on leur montre le papier (« Tu montres ton papier. », bulle « … ») :
   la passante « Elle lit, te regarde, relit… puis joint les mains devant elle, désolée. Elle ne parle pas français. » ;
   la vendeuse « La vendeuse hausse les épaules en riant, et te tend une mangue à la place. » ; le passant « Il fronce
   les sourcils, retourne le papier dans tous les sens, puis te le rend avec un petit salut d'excuse. ». M. Lam, sur
   l'îlot près de la cloche : « Oh ! Tu parles français ? Je l'ai appris à l'école, il y a… très longtemps. » / « Voyons voir. Mes yeux ne
   sont plus tout jeunes… » / **« « Aller chercher les deux touristes qui attendent dans la grande rue, un peu plus loin
   que l'agence. Leur faire visiter le temple. Ne pas les perdre. » »** / « Le temple, c'est le grand bâtiment au toit rouge, de l'autre côté du lac. » ; **« Tu ne
   parles pas un mot de vietnamien… et pourtant, tu as trouvé ton chemin. »** → vertu **Adaptation**.
3. **Les touristes.** Ils attendent dès l'arrivée de Pierre dans la grande rue, un peu plus loin que l'agence (après ta
   maison, (25, 8) et (26, 8)). Avant la traduction : « Bonjour ! On attend notre guide. L'agence nous a dit de patienter
   ici, dans la grande rue. » ; après : « Bonjour ! C'est vous, notre guide ? On vous attendait ! » / « On
   aimerait tellement voir le temple ! » ; « Tu leur fais signe de te suivre. » Ils suivent Pierre (le temple est fermé
   sans eux : « Le temple. Un lieu de recueillement : on ne le visite qu'accompagné d'un guide. »).
4. **Le temple.** Pierre avance de trois pas et se retourne vers les touristes (on les voit tous les trois). Une touriste : « Oh non… Mon téléphone est à plat ! Pas une seule photo du temple… » / « Tout ce
   voyage, et je ne pourrai rien montrer. Je veux rentrer à l'hôtel. » → **« Pierre utilise Insouciance ! »** → Pierre :
   **« Laisse tomber les photos. Regarde autour de toi : tu y es, là, maintenant. Profite. »** ; « Elle range son
   téléphone, lève les yeux vers les statues… et sourit. » ; « Vous avez raison. Je m'en souviendrai mieux comme ça. »
   Sur l'autel : « Sur l'autel, entre deux bâtons d'encens, une petite amulette porte-bonheur. Un gardien te fait
   signe : elle est pour toi. » → **Objet de chance** (facultatif). En sortant, avec ou sans l'amulette (la visite est
   finie dès que la touriste a rangé son téléphone), Pierre fait un pas devant la porte et les deux touristes vont se
   placer de chaque côté de la porte, chacun sur sa case, avant de parler : « Merci pour la visite ! Sans téléphone, j'ai tout regardé.
   Vraiment regardé. » / « Un super guide. Et même pas besoin de parler vietnamien ! » / **« On va dire à ton patron, à
   l'agence, que tu es le meilleur. Va vite lui raconter ! »**
5. **Le retour à l'agence.** Le patron : « Les touristes sont passés me voir. Ils ne parlent que de toi ! » / « Premier
   jour, pas un mot de vietnamien, et tu t'en sors comme un chef. Merci, Pierre. » (il ne parle pas d'Amsterdam).
6. **Six mois plus tard.** En sortant du bureau du patron : **« Six mois plus tard… »** ; « Ton téléphone sonne. C'est
   Romain ! » ; Romain, au téléphone : « Pierre ! Ça y est, je viens de prendre mon avion. Hong Kong, c'est fini ! » /
   « J'ai trop hâte que tu arrives à Amsterdam pour le stage. On va bien se marrer. » / **« Je t'attends là-bas, hein. Ne
   rate pas ton vol ! »** Les touristes ne sont plus devant le temple.

### Passage optionnel : les papis du lac (Audace)
« Deux papis jouent aux échecs chinois au bord du lac. Ils parlent vite, en vietnamien, sans lever les yeux du plateau. »
→ **« Pierre utilise Audace ! »** → « Tu t'assois sur un petit tabouret, à côté d'eux. Tu montres une pièce, puis une
case, l'air de demander. » / « Le premier papi éclate de rire et te montre comment avance le cheval. L'autre tape sur la
table pour te faire jouer. » / « Une partie plus tard, tu as perdu… mais tout le monde rit. » → « Le papi te glisse une
pièce de son jeu dans la main : le cheval. » → **Pièce d'échecs chinois**. Ensuite : « Les papis te saluent d'un signe
de tête, et reprennent leur partie. »

### Boîte aux lettres (carte postale)
De Léo et de la bande de Hull : « Une carte postale ! Elle vient de Hull. » / « « Pierre ! Alors, Hanoï ? Ici il pleut
toujours, rien n'a changé. » / « La maison t'attend quand tu veux. Léo et toute la bande. » »

### Vertus
- **Gagnée** : Adaptation (M. Lam traduit les consignes). Phrase du carnet : « Trouver son chemin partout, même sans en
  parler la langue. »
- **Utilisées** : **Insouciance**, au temple (route principale) ; **Audace**, avec les papis (optionnel).

### Objets
**Consignes en vietnamien** (le patron, gardées), **Objet de chance** (l'autel), **Pièce d'échecs chinois** (optionnel).

### Départ et trajet
- **Condition** : l'appel de Romain. Au guichet de l'aéroport, vol « Amsterdam (Pays-Bas) » : « Il y a quelques mois, à
  Hull, tu prenais ce même billet, le ventre noué, parce que personne ne t'accompagnait. » / « Aujourd'hui, tu as
  traversé une ville entière sans en parler la langue. Tu n'as plus peur de l'inconnu. Tu t'adaptes. »
- **Trajet en avion** ; encart : « Tu emportes : Adaptation. »

## 9. Amsterdam (Pays-Bas)

Le stage chez Corning, avec Romain en colocataire (`src/data/amsterdamStory.js`). Pas de vertu nouvelle (la 8e est
réservée à Paris) : Autonomie sert au stage, Insouciance à la nuit au bord du canal. Une seule ellipse.

### La carte (36 x 30, Gen 4)
Première version par scripts/build_amsterdam.py, puis retouchée à la main dans le créateur. Au nord, le long de la grande
rue (vers l'aéroport par ses deux bouts) : une maison de canal, le manoir à pignons = Corning (porte (13, 7)), la maison
de canal à la porte en cœur = la maison commune, « la deuxième en haut à gauche » (22, 9), la maison à pignon rouge (28,
9, fermée). Le premier canal, une péniche, deux ponts de planches. Au sud : le marchand de fleurs (porte et fleurs, (4, 23)), une
maison de canal aux fleurs, la place à la fontaine fleurie, une maison de canal (22, 23, fermée) et une maison à pignon
(29, 22, fermée) ; le quai sud et ses jardinières, le second canal ; une bordure d'arbres d'automne dorés. Arrivée en
(1, 10). Portes fermées : « Tu frappes. Personne ne répond… « Niemand thuis », peut-être. »

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Romain | Le colocataire : le bouquet de fleurs, puis la nuit au canal et le billet pour New Delhi | `g202` |
| Vendeur | Le marchand de fleurs, en français mêlé de néerlandais | `g112` |
| Patron | Le patron de Corning : la campagne du nouveau produit | `g53` |

### Quêtes, dans l'ordre
1. **L'arrivée.** « Ton téléphone sonne. C'est Romain ! » ; Romain, au téléphone : **« Pierre, t'es arrivé ! Rejoins-moi à
   la maison, la deuxième en haut à gauche. »** (Corning est fermé d'ici là : « Les bureaux de Corning. Ton stage commence
   bientôt : va d'abord t'installer chez Romain. »)
2. **La maison commune.** Romain : **« Installe-toi ! Tiens, d'ailleurs, tu peux me rendre un service ? Va chercher mon
   bouquet de fleurs chez le marchand de fleurs, j'ai la flemme d'y retourner. »** (ensuite : « Le marchand de fleurs, c'est de l'autre côté du
   canal, la maison à gauche avec les fleurs. Passe le pont ! »)
3. **Le marchand de fleurs.** Le vendeur : « Hallo ! Tu viens pour le bouquet de Romain, ja ? Attends, je regarde dans le
   kast… » / « Voilà, c'est goed ! Dis-moi, tu es bien le coloc de Romain, ja of nee ? » ; choix « Ja » : « Ha, parfait !
   Alors tu lui dis : de volgende fois, il vient lui-même, hè ! » ; « Nee » : « Nee ? Dan is deze niet voor jou ! Allez, je
   rigole. Tiens, prends-le quand même. » → **Bouquet de fleurs** (dans les deux cas ; icône : la Gracidée de HGSS).
4. **Retour chez Romain.** « Tu donnes le bouquet de fleurs à Romain. » ; Romain : « Merci, t'es un chef ! Je te revaudrai ça. » /
   « Bon, maintenant, au boulot : ton stage chez Corning commence aujourd'hui. C'est le grand manoir de la rue. Le patron
   t'attend ! »
5. **Corning : la campagne.** Le patron : **« Bienvenue chez Corning ! Pour ton premier jour, je te confie une vraie mission :
   prépare-moi une campagne pour notre nouveau produit. »** / « Un verre pour écrans de téléphone. Presque incassable. À
   toi de le faire connaître. » Trois choix, chacun commenté par le patron, sans échec :
   - la cible : « Aux fabricants de téléphones » (« Exactement. Ce sont eux qui achètent le verre. Bon instinct. »),
     « Aux grands-mères », « À tout le monde » (« Tout le monde, c'est personne. On vise les fabricants de téléphones,
     d'accord ? ») ;
   - le slogan : « Lâchez-le. Il tiendra. » (« Court, et ça donne envie d'essayer. J'adore. »), « Le verre qui ne casse
     pas. », « Du verre, mais en mieux. » ;
   - la diffusion : « Une vidéo de chute en ligne », « Un salon professionnel », « Des affiches dans le métro ».
   « Tu rassembles tout sur trois pages, sans demander d'aide à personne. » → **« Pierre utilise Autonomie ! »** →
   « Devant toute l'équipe, tu présentes ta campagne… et tu lâches ton propre téléphone par terre. L'écran tient. » ;
   Le patron : **« Pas mal du tout pour un premier jour ! Tu as l'instinct du marketing,
   toi. »**
6. **Quelques mois plus tard.** En sortant de Corning : **« Quelques mois plus tard… »** (la seule ellipse de la ville). La
   nuit tombe sur Amsterdam (nuit forcée, quelle que soit l'heure, jusqu'à la fin de la scène du canal) : réverbères
   allumés, appliques des portes, fenêtres de la péniche.
7. **La nuit au bord du canal.** Romain est assis sur le quai devant la péniche (17, 12) : « Romain est assis au bord du
   quai, les jambes au-dessus de l'eau. Les lumières des péniches tremblent sur le canal. » ; Pierre s'assoit à côté de
   lui (16, 12), et pendant toute la discussion tous les deux regardent le canal ; **« Viens t'asseoir deux
   minutes. Regarde-moi ça. »** / « Y a six mois, t'étais à l'autre bout du monde, à Hanoï. Et nous à Bordeaux. Et là, on
   est posés ensemble à Amsterdam. » / « Profite, va. Demain c'est encore le stage, mais là, maintenant, on est bien. » →
   **« Pierre utilise Insouciance ! »** → « Tu oublies le stage de demain. Il y a juste l'eau, les lumières, et Romain qui
   rigole. » ; Romain prend une photo → souvenir **Photo du canal** (carnet) ; **« Au fait, j'ai une nouvelle pour toi. Ton
   prochain échange, c'est à New Delhi, en Inde ! Tiens, voilà ton billet d'avion. »** → **Billet d'avion pour New
   Delhi** ; Pierre, en lui-même : **« Une ville de plus. Et à chaque fois, des gens que je quitte. Je me demande ce qu'ils
   deviennent, tous. »** ; « Le lendemain, ton billet en poche, tu prends la route de l'aéroport. » (Pierre arrive au
   guichet de l'aéroport d'Amsterdam ; en ressortant, il est encore à Amsterdam.)

### Vertus
- **Gagnée** : aucune.
- **Utilisées** : **Autonomie** (la campagne de Corning), **Insouciance** (la nuit au canal).

### Objets et souvenir
**Bouquet de fleurs** (le marchand de fleurs, donné à Romain), **Billet d'avion pour New Delhi** (remis par Romain), souvenir **Photo
du canal** (carnet).

### Départ et trajet
Vol « New Delhi (Inde) », directement (il n'y a plus de retour à Hull) ; trajet en avion, sans encart.

## 10. New Delhi (Inde)

Un semestre d'échange étudiant (`src/data/newDelhiStory.js`) : Pierre loge à l'internat, parmi les étudiants indiens.
C'est le plus grand choc culturel du parcours : une ville dense et grouillante, une grande joie de vivre, et quelque chose
de très ancien, rendu sans jamais nommer de religion. Pas de vertu nouvelle (la 8e se gagne à Paris) : Joie de vivre
sert à la fête, dans le sens renversé. Aucune ligne « Objectif : », une seule ellipse. Le Rajasthan, sa tente et la
« potion magique » n'existent plus (carte, intérieur et objet retirés du jeu).

### La carte (40 x 34, Gen 4)
Premier jet de scripts/build_new_delhi.py, retouché à la main dans le créateur ; les portes du jeu sont sur les portes
dessinées (audit sans `porte_hors_dessin`). Au nord, le long de la grande avenue : l'université (bâtiment à coupole et
lanternes dorées, porte (6, 12), fermée : « L'université, où tu passes le semestre. Les cours reprennent demain. »), le
palais de grès (porte (16, 11) : sa cour, où se tient la fête ; fermée avant la rencontre avec Harsh : « Le palais est
fermé aux visiteurs. »), la vieille porte
du fort (27, 9 : le vieux fort, fermé avant la fête : « Une vieille porte de pierre, plus ancienne que tout le reste de la
ville. Elle est fermée. ») et le minaret. La grande avenue (rangées 14 à 17) mène à l'aéroport par ses deux bouts. Au
centre, les jardins : la grande arche (India Gate) et le bassin aux lotus avec son île au banian. À l'est, la tente du
bazar (33, 22, « La tente du bazar est fermée pour aujourd'hui. »). Au sud : l'internat, la maison à toit plat (5, 27,
« L'internat de l'université, où tu loges pour le semestre. ») et une maison à coupole (16, 28, « Tu frappes. Personne
ne répond. »). Une bordure de palmiers. Arrivée en (1, 16).

**Le quartier sud**, plus calme que l'avenue : neuf habitants. Ceux qui vont et viennent : un ancien (« Ici, tout le
monde se connaît. Bientôt, on te connaîtra aussi. »), une voisine (« Tu es l'étudiant français de l'internat ? Bienvenue
dans le quartier ! »), un livreur (« Pardon ! Je livre tout le quartier, et je suis en retard… comme tous les jours ! »),
un étudiant de l'internat (« L'internat, c'est la maison à toit plat. Le soir, on fait un peu de bruit. Désolé
d'avance ! »), deux enfants (« On joue au ballon ! Tu veux être dans notre équipe ? »). Ceux qui restent sur place : le
vendeur devant la tente du bazar (« Le bazar ouvre demain matin. Il y aura du monde, crois-moi ! »), une habitante et
un habitant.

**La foule** : vingt-trois passants sur l'avenue, dix-huit qui vont et viennent entre deux cases et cinq qui restent sur
place en regardant autour d'eux (pas de tuk-tuks, de vaches ni d'étals : le dépaysement, c'est la densité). Chacun a un
mot : « Oh, un étranger ! Tu viens d'où ? … La France ! Bienvenue, bienvenue ! » ; « Pardon, pardon ! Ici, tout le monde
est pressé, mais personne n'est en retard. » ; « Une photo avec moi ? Mes cousins ne vont jamais me croire ! » ;
« Première fois ici ? Ça se voit, tu regardes partout ! Garde les yeux ouverts, tu ne verras jamais tout. » ; « Tu es
nouveau à l'université ? Tu vas voir, ici, on n'est jamais seul. » ; « Mange bien, mon garçon ! Tu es tout maigre. » ;
« Le soir, l'avenue est encore plus pleine. Si, si, c'est possible ! » ; « Ha ha ! Tu as l'air perdu. Ne t'en fais pas :
tout le monde se perd ici, au début. » ; « Le passant te sourit et te fait signe de passer devant. »

### Les intérieurs
- **La cour du palais** (`delhiCour`, 24 x 18, scripts/build_delhi_cour.py) : une cour à ciel ouvert faite des éléments
  de la carte de New Delhi : dallage de grès, couronne de palmiers, au fond trois pavillons à coupole (dont le mausolée
  au dôme blanc), deux mâts à fanions, deux lanternes de bronze, le stand de chai, un étal rayé rose, des soucis.
  En plein jour ; sobre, sans cliché. L'entrée en bas, au milieu (la sortie vers la carte, devant
  la porte du palais). Au milieu, **le grand repas** : un tapis tissé rouge et ocre posé par terre (4 x 2 cases), avec
  une assiette blanche devant chaque coin, le grand bol de riz parfumé, les boulettes en sauce, les beignets, le bol de
  lentilles et une carafe d'eau (`scripts/build_meal.py` → `public/assets/props/repas.png`). Les plats viennent de « Free
  Pixel foods » de ghostpixxells (itch.io, CC0), réduits de 32 à 16 px, sans leur ombre portée ; l'assiette et la carafe,
  de la vaisselle Gen 4 de PeekyChew (DeviantArt, crédit demandé) ; crédits dans `assets-source/fan/food/CREDITS.txt`.
  L'assiette tendue à Pierre est la galette (`plat.png`). Neuf convives assis par terre en cercle autour
  (les personnages assis : le buste entier, abaissé de 3 pixels, et des jambes repliées en tailleur dessinées dessous,
  de la couleur du pantalon de chacun ; de face en travers, de dos dépassant de chaque côté, de profil les genoux en
  avant ; option `seated` des PNJ, étape `sit`), qui restent à chaque
  visite : « Tu reviens ? Il y a toujours une place pour toi, et toujours de quoi manger ! », « Reprends du riz, va ! Il
  en reste plein la marmite. », « Le dal, c'est la recette de ma grand-mère. Elle ne la donne à personne ! », « Ici, on
  ne mange jamais seul. C'est ça, le meilleur ingrédient. », la grand-mère « Mange, mon garçon, mange ! Tu es tout
  maigre. », le voisin « Encore une galette ? Si, si, j'insiste ! ».
- **Le vieux fort** (`delhiFort`, 21 x 16) : le bas de l'arène de Mauville (HGSS), sans l'arène : dalles de pierre,
  grands piliers, balustrades, marches, deux statues. La musique se tait (musique de la ville à volume nul). Le vieux
  sage attend sur la terrasse, en haut des marches ; ensuite : « Rien ne se perd, jeune voyageur. Rien. »

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Prophecy | De la bande de Hull ; il enchaîne son échange aux États-Unis par ce semestre (prévu de longue date) et accueille Pierre ; il rentre lui aussi finir ses études à Bordeaux | `g94` |
| Harsh | Étudiant indien, rencontré sur place (nouveau pour Pierre et pour Prophecy) : la porte d'entrée dans la culture locale | `g89` |
| Vieux sage | Le vieux fort : il transmet, et donne la pierre gravée | `g71` |
| Étudiante, étudiants, grand-mère, voisin | Les convives du repas, assis en cercle (la grand-mère : `g42`, le voisin : `g38`) | `g25`, `g97`, `g95`, `g110`, `g104`, `g102`, `g103`, `g42`, `g38` |
| Passants, passantes | La foule de l'avenue | sprites imposés (`g14`, `g42`, `g86`…) |

### Quêtes, dans l'ordre
1. **L'arrivée.** Quelques pas après l'aéroport (colonne 4 de la carte, sur toute sa hauteur) : bulle « ! », puis Pierre,
   en lui-même : **« Tant de monde, de bruit, de couleurs… Je n'ai jamais rien vu de pareil. »**
2. **Prophecy et Harsh.** Au bout de l'avenue, Prophecy (29, 15) ne repère Pierre que quand il arrive à 5 cases ou
   moins de lui (ou quand on lui parle) : bulle « ! » ; Prophecy
   s'avance : **« Pierre ! Te voilà enfin ! Ça y est, on y est. L'Inde, pour de vrai. »** Harsh arrive de la foule, à
   l'est, et vient vers eux deux : **« Vous êtes les étudiants en échange, c'est ça ? Moi c'est Harsh ! Venez, je vais
   vous montrer. »** / « Aujourd'hui, il y a une fête dans la cour du palais de grès. Suivez-moi ! » Pas d'écran noir : Harsh
   part devant, à pied, jusqu'à la porte du palais (16, 12) (il attend Pierre s'il traîne : « C'est par ici : la porte du
   palais de grès. Entrez, la fête a commencé ! »), puis il entre ; Prophecy suit Pierre. Pierre entre à son tour.
3. **Le grand repas partagé (Joie de vivre, dans le sens renversé).** Il remplace l'ancienne danse. Dans la cour : « La
   cour du palais est baignée de soleil. Au milieu, tout le monde est assis en cercle par terre, autour d'un grand repas
   étalé sur un tapis. » ; Harsh : **« Viens, assieds-toi avec nous ! Ici, un invité ne reste jamais le ventre
   vide. »** Prophecy va s'asseoir (« Ça sent incroyablement bon… »), Harsh aussi, et Pierre s'assoit entre eux deux,
   sur le côté gauche du tapis. Les plats arrivent vers lui (on voit une galette glisser jusqu'à lui depuis chaque convive, étape `pass`) : « À
   peine assis, une assiette arrive devant toi : du riz, du dal, une galette encore chaude. » ; Harsh : « Goûte
   celui-là ! C'est ma mère qui l'a préparé ce matin. » ; puis de tout le cercle : « Et ça continue. De gauche, de
   droite, d'en face : un bol, une galette, encore un peu de riz. On te ressert sans que tu demandes. » ; bulle « … » sur
   Pierre ; la grand-mère : « Non, non, on ne refuse pas ! Chez nous, l'invité, on le ressert toujours. » ; Pierre, en
   lui-même : **« Je ne sais même pas quoi faire de toute cette générosité. Juste… l'accepter, peut-être. »** ; Harsh :
   **« Atithi Devo Bhava. Chez nous, ça veut dire que l'invité est sacré. »** → **« Pierre utilise Joie de
   vivre ! »** → « Tu prends ce qu'on te tend. Tu goûtes à tout, tu ris, et tu tends à ton tour le plat
   à ton voisin. » ; Harsh : « Tu vois ? Tu es des nôtres, maintenant ! » Tous se relèvent ; Harsh : **« Maintenant que
   vous avez vu la fête, il faut que je vous montre autre chose. Un endroit très ancien. »** / **« C'est derrière la
   vieille porte du fort, de l'autre côté de l'avenue. Suivez-moi ! »** Harsh part seul, le premier, et quitte la cour.
   Puis, d'eux-mêmes (le joueur n'a pas la main), Pierre et Prophecy quittent la cour, traversent l'avenue et
   rejoignent Harsh, qui les attend devant la porte du fort (28, 10) : « Vous voilà. C'est ici : la vieille porte du
   fort. Entrons. » Ils entrent tous les trois ; Harsh et Prophecy suivent Pierre dans le fort.
4. **Le vieux sage (ni vertu, ni mini-jeu).** En entrant dans le fort : « Derrière toi, le bruit de la ville s'est éteint
   d'un coup. Il n'y a plus que le vent entre les vieilles pierres. » ; Harsh : « Ces murs sont là depuis plus de mille
   ans. Ici, on parle doucement. » En haut des marches, le vieux sage vient à Pierre : **« Tu viens de loin, et tu iras
   plus loin encore. Mais souviens-toi : ce n'est pas la destination qui compte, c'est ce que le chemin dépose en
   toi. »** / **« Chaque lieu que tu traverses, chaque visage que tu quittes, rien ne se perd. Tout cela voyage avec toi,
   ici. »** ; « En disant « ici », il pose la main sur son cœur. » → **Pierre gravée** (« Le vieux sage glisse dans ta
   main une petite pierre, polie par les années, où l'on a gravé un chemin qui tourne sur lui-même. ») ; avec le galet
   de Saint-Ay dans le sac : « Elle est lisse et tiède, comme le galet du lac de Saint-Ay. Comme le coquillage de
   Manon. » ; sans : « Elle est lisse et tiède, comme le coquillage de Manon, à Fort-de-France. »
5. **Quelques mois plus tard.** Écran noir : **« Quelques mois plus tard… »** (la seule ellipse de la ville) ; Pierre
   ressort devant la porte du fort (27, 10).
6. **Le retour.** Prophecy (26, 11) : **« Bon, la parenthèse indienne se termine. On rentre à Bordeaux finir nos études.
   Tu te rends compte, on revient là où tout a commencé ? »** ; Harsh (28, 11) : « Vous allez me manquer, tous les deux.
   Revenez quand vous voulez : ici, vous serez toujours chez vous. » ; Prophecy : « Allez, les valises sont prêtes.
   L'aéroport, c'est au bout de la grande avenue. On y va ! » Pas d'écran noir : Prophecy suit Pierre à pied jusqu'à
   l'aéroport (Harsh reste devant le fort : « Vous allez me manquer, tous les deux. L'aéroport, c'est au bout de la
   grande avenue. Bon voyage ! »).

### Vertus
- **Gagnée** : aucune.
- **Utilisée** : **Joie de vivre**, dans le sens renversé : à Fort-de-France, à la cabane, à Hull, c'est Pierre qui
  entraîne les autres ; ici, au grand repas, ce sont les autres qui donnent : on le sert de tous les côtés, on le
  ressert sans qu'il demande. Un Pierre plus mûr, qui apprend à recevoir.

### Objet
**Pierre gravée** (le vieux sage) : un objet-souvenir sans usage, qui remplace la potion magique et fait écho au galet du
lac de Saint-Ay et au coquillage de Manon.

### Départ et trajet
À l'aéroport de Delhi (Prophecy est là, avec Pierre), l'hôtesse propose le vol « Bordeaux (France) » (la suite de
l'histoire) ; trajet en avion, sans encart (pas de vertu reçue) ; Pierre et Prophecy arrivent à Bordeaux, à côté de la
sortie vers l'aéroport ; le stade s'ouvre (drapeau `semestre-termine`).

## 11. Bordeaux, le retour : la remise des diplômes

Court, mais chargé d'émotion (`src/data/bordeauxStory.js`, fin du fichier). **Pas de vertu**, **aucune ligne
« Objectif : »** : ce sont Prophecy et le directeur qui disent où aller.

1. **L'arrivée.** Pierre arrive de l'aéroport à Bordeaux (devant la sortie vers l'aéroport, (30, 10)) avec **Prophecy**,
   rentré de New Delhi avec lui, qui marche à ses côtés (il le suit). Aussitôt, Prophecy : « Bordeaux ! Ça fait
   bizarre, hein ? Comme si on n'était jamais partis. » / **« Allez, viens ! Tout le monde nous attend au stade, la
   grande rotonde, juste là. C'est le grand jour ! »** Le stade est ouvert (porte (21, 10)).
2. **Dans le stade.** En entrant : « Les gradins sont pleins. Toute la promotion est là, en toge… et, au bord de la piste,
   des visages que tu connais. » Prophecy ne suit plus Pierre : « Je file rejoindre les autres. Vas-y, toi : c'est ton
   moment ! » et va se placer parmi les diplômés (15, 9). Le directeur, sur l'estrade : « Bienvenue à tous pour la
   remise des diplômes de la promotion ! » / **« Pierre ! Quand tu es prêt, avance-toi jusqu'à l'estrade. »** Pierre
   a la main et se déplace seul. Au bord de la piste, devant la tribune, **toute la bande, revenue de ses échanges, et
   les parents**, à qui l'on peut parler :
   - Maman : « Mon Pierre ! Regarde-toi, diplômé ! Viens là que je te serre fort ! Je suis tellement fière, mon
     grand ! »
   - Papa : « Un diplôme. Du concret, enfin. » / « … Bon. Je suis fier de toi, fiston. Mais ne le répète pas trop. »
   - Ousmane : « Pierre ! Hull, Hanoï, Amsterdam, New Delhi… T'as fait le tour du monde, toi. Aujourd'hui, on finit ce
     qu'on a commencé ensemble. »
   - Léo : « Bro ! Je rentre de Hull pour l'occasion. La maison est bien gardée, t'inquiète. »
   - Paul : « Tu te souviens de mon enceinte ? Je ne l'ai jamais revue… Allez, c'est oublié. Aujourd'hui, c'est la
     fête ! »
   - Rémi : « Moi, les States, c'était avant. Cette fois, je suis resté à Bordeaux… mais j'ai suivi tous vos trips en
     photo, man ! »
   - Anaïs : « Bali, c'était magique. Mais rien ne vaut ça : tous ensemble, ici. »
   - Charlotte : « Le Canada, la neige, le sirop d'érable… et me revoilà ! Je n'aurais raté ça pour rien au monde. »
   - Romain : « Hong Kong, puis Amsterdam avec toi… Maintenant, je me sens chez moi n'importe où. Mais ici, avec vous,
     c'est autre chose. »
   - Prophecy : « Les États-Unis, puis New Delhi avec toi… Quel voyage. Et maintenant, le diplôme ! »
   - Dalil, discret, dans les gradins : « Peu importe où on ira après… il y aura toujours un océan quelque part pour
     nous ramener ici. »
   - Huit diplômés en toge sur le terrain, tournés vers l'estrade (« On l'a fait ! », « Félicitations à nous tous ! »,
     « Je n'en reviens pas : diplômés ! », « Quelle belle journée ! ») ; l'allée du milieu reste libre.
3. **La cérémonie** (le seul geste : avancer devant l'estrade, rangée 6, x 11 à 14) : « Tu t'avances jusqu'à l'estrade.
   Tout le stade applaudit. » (toute la bande, les parents et les diplômés sautent de joie) ; le directeur :
   « Félicitations, Pierre. » → **Diplôme de Bordeaux** (« Le directeur te remet ton diplôme. ») ; nouveaux
   applaudissements ; « La suite, maintenant, c'est à toi de l'écrire. »
4. **La sortie.** En sortant du stade, Pierre : **« Bon… toutes les bonnes choses ont une fin. Il paraît qu'il faut
   grandir un jour. Direction Paris. »** L'ouvrier qui gardait la route de Paris (sortie sud-est) est parti ; « Ton
   diplôme de Bordeaux en poche, tu prends la route de Paris ! » Pierre arrive à Paris par l'ouest de l'avenue, en
   (1, 11).

## 12. Paris : la dernière ville

Pierre a bougé toute sa vie ; à Paris, pour la première fois, il doit vraiment s'installer, et il n'est pas prêt. Il
grimpe les étages d'une entreprise, comprend que ce n'est pas sa vie, et choisit la **Liberté**, la 8e et dernière vertu
(`src/data/parisStory.js`). **Le travail reste hors champ** : on ne joue jamais de scène de bureau ; on ne joue que des
mini-quêtes à lui, dans Paris, sans lien avec l'entreprise. Aucune ligne « Objectif : », **aucune ellipse**.

**La boucle (l'ascenseur, fil rouge).** Pierre passe au bureau, ressort, vit une mini-quête en ville, revient au bureau,
et l'étage suivant s'allume : le bouton « manager » après le concert, le bouton « directeur » après le match.

### La carte (52 x 48, Gen 4)
Premier jet de scripts/build_paris.py, retouché à la main dans le créateur ; les portes du jeu sont sur les portes
dessinées (audit sans `porte_hors_dessin`). Au nord, **Bercy**, le grand dôme (9, 11 : le concert, avec une place ;
sinon « Bercy. Ce soir, il y a un concert… mais sans place, on ne rentre pas. »), le Louvre (« La file d'attente du
Louvre fait le tour de la cour. Une autre fois. », sa file devant la porte de gauche) et le musée-gare (« Le musée est
fermé le lundi. ») ; l'avenue (rangées 10 à 13) mène à l'ouest à la route de Bordeaux, à l'est à l'aéroport. Puis **ton
studio**, l'immeuble aux balcons fleuris (6, 22, avec les clés du propriétaire), le café à terrasse (13, 22, « Le café
à terrasse. Tu n'as jamais le temps de t'y asseoir. »), le jardin au bassin, l'opéra (41, 22). La Seine, deux yachts,
deux ponts. Au sud : **l'immeuble crème, chez Hugues** (8, 40, le soir du match ; sinon « Tu frappes. Personne ne
répond. »), **le restaurant au store rayé**, où Thomas travaille (14, 40, le soir du match ; sinon « Le restaurant au
store rayé est complet. »), Notre-Dame (25, 41, en travaux ; une grande porte de bois à deux battants sous l'arche, dessinée par scripts/build_props.py, le dessin n'ayant qu'une ouverture noire) et **la tour de bureaux** vitrée (42, 41, fermée avant les
clés). La rue sud ne mène nulle part. Le trajet du studio à la tour : à pied (ou à vélo), par le pont de gauche. Toujours
de jour.

### Les intérieurs
- **Ton studio** (modèle « maison type 2 ») : la télé (« Tu ne l'allumes presque jamais. »).
- **La tour de bureaux**, trois niveaux reliés par l'ascenseur (Rez-de-chaussée, « 1er étage (manager) », « Dernier étage
  (directeur) » ; les portes rouges de l'ascenseur restent sous Pierre quand il attend devant ; un bouton éteint : « Le bouton « manager » est éteint : ton badge n'y donne pas accès. »).
  - Le rez-de-chaussée (hall de la Tour Radio de HGSS) : vivant, des collègues debout qui parlent à Pierre comme à l'un
    des leurs : « Salut Pierre ! Encore là de bonne heure, toi. », « Tiens, Pierre, tu passes au point d'équipe tout à
    l'heure ? », « Bonne journée, hein ! On se voit en haut. » ; l'accueil (« La machine à café est encore en panne.
    Comme tous les lundis. ») ; le collègue blasé près de la machine à café.
  - Le 1er étage (un plateau de bureaux) : le manager, deux collègues debout (« Bienvenue à l'étage, Pierre ! Ici, on a
    même du vrai café. », « Réunion à onze heures. Et à quatorze heures. Et à seize heures. »).
  - Le dernier étage : le bureau du directeur, son assistante (« Le directeur vous attend, Pierre. Entrez, entrez. »).
- **Bercy** (le théâtre de danse de Doublonville, transformé en salle de concert) : une estrade au fond, le chanteur
  (`g69`), le guitariste et le batteur ; dix-huit fans tournés vers la scène, l'allée du milieu libre ; lumières de
  scène. On parle aux musiciens depuis le bord de la scène.
- **Le restaurant** (une maison de Doublonville et le comptoir du café d'Oliville) : le serveur derrière le comptoir,
  deux clients, Thomas.
- **Chez Hugues** (modèle « maison type 2 », comme les maisons des amis) : la télé allumée, Hugues et trois amis devant.

### PNJ présents
| Nom | Rôle | Sprite |
|---|---|---|
| Propriétaire | Devant l'immeuble : les clés du studio, puis où est le bureau | `g35` |
| Collègue | Le blasé du rez-de-chaussée, près de la machine à café ; d'autres collègues debout dans la tour | `g36` (et `g74`, `g3`, `g75`, `g76`, `g0`) |
| Manager | Le 1er étage : la promotion | `g122` |
| Directeur | Le dernier étage : la belle place | `g120` |
| Hugues | L'ami parisien de Pierre, fan de foot : la place de concert promise, puis le match chez lui | `g121` |
| Inès, Malik, Clara | La place de concert, de main en main (l'Opéra, la file du Louvre, le café à terrasse) | `g5`, `g4`, `g15` |
| Chanteur | Bercy | `g69` |
| Thomas | L'ami parisien de Pierre, travaille au restaurant au store rayé ; le match | `g90` |

### Quêtes, dans l'ordre
1. **L'arrivée.** Pas de métro : par la route de Bordeaux, Pierre arrive au bord ouest de l'avenue (1, 11). Personne
   ne vient le chercher : le propriétaire attend juste devant l'immeuble aux balcons fleuris (7, 23), et c'est à Pierre
   de le trouver et de lui parler. Le propriétaire : **« Bienvenue ! C'est petit, mais vous verrez, on
   s'y fait. Le bureau n'est pas loin. »** → **Clés du studio** (« Le propriétaire te tend les clés du studio. ») ;
   Pierre, en lui-même : **« Bon. Un appartement, un bureau. C'est ça, maintenant. »** Ensuite le propriétaire : « Votre
   bureau ? La grande tour de verre, de l'autre côté de la Seine, tout en bas à droite. »
2. **Premier passage au bureau.** « Le hall de la tour. Cette fois, ton badge passe. » ; une collègue vient accueillir
   Pierre : **« Salut ! Tu dois être Pierre ? Bienvenue dans l'équipe ! »** / « Ici, c'est le hall : l'accueil, le
   salon, la machine à café. Les étages, ça viendra. Tu vas voir, on est une bonne équipe. » (ensuite : « Alors, ce
   premier jour ? Si tu cherches quoi que ce soit, demande-moi ! ») ; puis le collègue blasé vient à Pierre :
   **« Dix ans que je fais ce trajet. On s'habitue, tu verras. »** Les boutons « manager » et « directeur » de
   l'ascenseur sont éteints. Pierre ressort.
3. **Le concert (la place qui a voyagé).** En sortant de la tour, le téléphone sonne. Hugues : **« Pierre ! Ce soir,
   concert à Bercy. Je t'avais promis une place… mais je l'ai passée à Inès pour qu'elle te la donne, et… bref, elle a un
   peu voyagé. »** / « Inès est devant l'Opéra. Elle saura où elle est passée ! » Inès : « La place de Hugues ? Ah… Je
   l'ai donnée à Malik, il en rêvait. Il fait la queue au Louvre, comme d'habitude. » ; Malik, dans la file du Louvre :
   « Ta place ? Mince… Je l'ai laissée à Clara, au café à terrasse, à côté de ton immeuble. Elle adore ce chanteur. » ;
   Clara : « Oh, c'était la tienne ? Je suis désolée ! Tiens, reprends-la. » → **Place de concert** / « Bercy, c'est le
   grand dôme, en haut à gauche. Ça commence bientôt ! » (Avant l'appel, ce sont des Parisiens comme les autres.) À
   Bercy : « Tu montres ta place à l'entrée. La salle est pleine. » ; Pierre avance de quelques pas dans l'allée ;
   **« Le concert commence ! »** ; le chanteur : « J'garde le meilleur et j'ai tourné les pages, j'ai pas de rancœur et
   j'oublie jamais rien. » / « J'ai passé l'été sous la neige et l'hiver à la plage, tu ferais quoi à ma place ? » /
   « Donc, y'a plus rien qui m'attache, c'est un jour la baie ou le Taj, moi j'voulais répondre à ces messages… »
   (paroles fournies par l'utilisateur) ; la foule saute de joie ; **« Le concert se termine. »** ; Pierre, en lui-même :
   **« Allez, faut que je rentre. Demain, grosse journée. »**
4. **La promotion.** Au bureau, la collègue de l'accueil, près de l'entrée, vient à Pierre : « Pierre ! Le manager te cherchait. Il t'attend au 1er étage : l'ascenseur,
   au fond. » Le bouton « manager » s'est allumé. Au 1er étage, le manager traverse le plateau et vient à Pierre : **« Pierre ! Tu t'en sors très bien. À
   partir d'aujourd'hui, tu travailles ici, avec moi. »** ; « Une promotion. Un bureau plus grand, plus haut. »
5. **Le match.** En sortant de la tour, un message de Hugues : **« Match ce soir chez moi ! Passe prendre Thomas en
   chemin, et ramenez de quoi manger. »** / « Thomas finit son service au resto au store rayé, de l'autre côté de la
   Seine. Moi, c'est l'immeuble crème, juste à côté ! » ; Pierre, en lui-même : **« Enfin un truc normal. »** Au
   restaurant, Thomas finit son service : **« Ah, Pierre ! Deux secondes, je récupère de quoi manger et j'arrive. Hugues
   va encore hurler devant sa télé, tu vas voir ! »** → **De quoi manger** ; Thomas suit Pierre. Chez Hugues : **« Les
   voilà ! Allez, posez tout, ça va commencer, j'attends ce match depuis des semaines ! »** ; Thomas rejoint les autres
   devant la télé ; **« Le match commence ! C'est France-Argentine. »** ; « Allez les Bleus ! », « Non mais tu as vu
   cette passe ?! », « Contre l'Argentine, ça se gagne, allez ! » ; **« Buuut ! »** (tout le monde saute de joie),
   Hugues : « Allez la France ! » ; « Mais l'Argentine revient. Une fois… puis une deuxième. » ; Hugues : « Non… c'est
   pas possible… » ; **« Le match se termine. »** ; Thomas : « Bon. On les aura la prochaine fois. Allez, il reste à
   manger ! » ; Pierre, en lui-même : **« On a perdu, mais c'était une belle soirée pour le GOAT… »**
6. **Le directeur (Liberté).** Au bureau, la collègue de l'accueil : « Pierre ! Le directeur veut te voir. Dernier étage, rien que
   ça ! » Le bouton « directeur » s'est allumé. Le directeur : **« Entre, Pierre, assieds-toi. Ça fait un moment que je
   te regarde, et je dois dire que tu te débrouilles vraiment bien. Il y a une belle place pour toi ici, tu sais. »** ;
   Pierre : **« C'est gentil, vraiment… Mais je crois que ce n'est pas ma place. Il faut que je parte. »** → **« Pierre
   utilise LIBERTÉ ! »** (la vertu entre au carnet sans l'encart « a reçu ») → **« Tu emportes : Liberté. »**
7. **Le pont vers le rêve.** En sortant de la tour, Pierre fait un pas et s'arrête ; le joueur n'a plus la main. L'écran
   se brouille doucement (flou), la musique s'éteint, un voile clair monte : le rêve (section suivante).

Rappels : le collègue (« Alors, monsieur du premier étage ? On ne te voit plus, en bas. », après la Liberté « Tu pars ?
Vraiment ? … Tu sais quoi, je t'envie un peu. »), le manager, Hugues après le match (« Perdu contre l'Argentine… Mais
quelle soirée, hein ? Reviens quand tu veux. »), le directeur ensuite (« La porte est ouverte, Pierre. Dans les deux
sens. »).

### Vertus
- **Gagnée** : **Liberté** (« Écouter qui l'on est vraiment, et refuser une vie qui n'est pas la sienne. »), la 8e et
  dernière.
- **Utilisée** : Liberté (le bureau du directeur).

### Objets
**Clés du studio** (le propriétaire), **Place de concert** (Clara ; rendue à l'entrée de Bercy), **De quoi manger**
(Thomas ; posé chez Hugues).

## 13. Le rêve et la fin du jeu

`src/data/reveStory.js`, `src/data/maps/reve.js`.

### La carte du rêve (28 x 22)
Dessinée par scripts/build_reve.py avec deux planches du Pokémon Gaia Project (PixelMister, d'après zetavares852 ; voir
ASSETTILESPOKEMONV2/credits/gaia-pixelmister.txt) : une grande plate-forme de brique flotte dans le bleu du Monde
Distorsion, quatre colonnes brisées de la Colonne Lance à ses coins ; autour, des îlots, des arbres qui poussent de
travers, un tourbillon, deux tablettes gravées. Un voile pâle, des nappes de brume blanche qui dérivent et de petites
étincelles (effects.js startDreamMist). La musique du titre, très douce. Pas de nom de ville affiché.

### La grande réunion
Pierre est immobile au centre ; le joueur n'a plus la main. Le voile clair se dissipe et le décor se forme autour de lui.
Les personnages nommés du jeu sont là, en cercle (27, répartis régulièrement autour de lui) : Maman, Papa, Manon, Fanny,
Jean ; Felix, Joshua, Yanis, Val ; Margaux, Benoît, Étienne ; Rémy ; Tanguy, Geoffrey ; Ousmane, Paul, Rémi, Léo, Anaïs ;
Charlotte, Romain, Prophecy ; Harsh ; **Dalil, Hugues et Thomas**, silencieux. Huit prennent la parole, un par ville :
chacun s'avance vers Pierre, dit son mot, puis se range près de lui. **Absents** (personnages nommés, signalés sans être
ajoutés) : M. Lam, le patron de Corning, Camille et M. Bouly (à la demande de l'utilisateur), Inès, Malik et Clara (Paris).
- Felix (Saint-Ay) : « Depuis Saint-Ay qu'on te suit ! On savait que tu finirais par tous nous réunir. »
- Margaux (Montépilloy) : « Tu te cachais toujours au même endroit… Mais là, tu es allé tellement loin qu'on a failli ne
  jamais te trouver ! »
- Rémy (collège) : « Tu te rappelles le collège ? On n'imaginait pas tout ça, à l'époque. »
- Ousmane (Bordeaux) : « Bordeaux, les études, nos débuts… On en a fait du chemin depuis, hein ? »
- Léo (Hull) : « De Hull à aujourd'hui, mec… On en a vécu, hein ? »
- Romain (Amsterdam) : « Amsterdam, les canaux, nos galères de coloc… Franchement, je recommencerais demain. »
- Harsh (New Delhi) : « Tu es venu de si loin, et tu es reparti avec un peu de nous. Reviens quand tu veux, mon ami. »
- Fanny (la famille) : « Tu es parti partout, mais tu es toujours revenu nous voir. C'est ça que je retiens. »

Puis Pierre, au milieu de tous : **« J'ai l'impression d'avoir déjà tout vécu. Et pourtant, tout commence. »**

### Le fondu au noir
Le décor s'efface dans un fondu au noir lent (pas de flash). Pendant ce temps, le carnet des huit vertus s'affiche une à
une, de la Joie de vivre à la Liberté ; la Liberté s'illumine en dernier (en or), sa phrase dessous ; puis noir complet
(systems/VirtuesFade.js).

### Le réveil (le twist)
On rouvre sur Fort-de-France, dans la chambre de l'ouverture du jeu, et **la cinématique d'ouverture est exactement la
même** (`fortDeFranceStory.js OPENING_CINEMATIC`, partagée avec le début de partie) : Pierre debout au milieu de sa
chambre, à côté du lit (pas couché), l'image de l'île et le bruit des vagues, « C'est le dernier matin à
Fort-de-France. », puis Maman, d'en bas : « Pierre ! Le ferry part cet après-midi ! Descends ! » Le joueur reprend la
main. Par terre, au milieu de la pièce (6, 6), un petit objet (la même image que la pierre gravée du vieux sage). **Au
premier pas** de Pierre, où qu'il aille : bulle « ! » ; Pierre : « Ouais… c'est quoi, cet objet ? » ; il va jusqu'à
l'objet et le ramasse → **Talisman indien** (encart d'objet reçu, comme partout dans le jeu : « Tu as reçu : Talisman
indien. ») ; Pierre : **« Je ne suis jamais parti de Fort-de-France. Alors ça, d'où ça vient ? »** Écran noir final, puis
retour à l'écran titre. « Continuer » reprend Pierre dans sa chambre de Fort-de-France, libre (la scène ne se rejoue
pas).

### Après Paris
L'histoire se termine ici : Toulon, le Chemin de Saint-Jacques, la Corse, Bali, le Sri Lanka, la Thaïlande, le Népal et le
vol « Nouveau pays » ont été retirés du jeu (octobre 2026). Une ancienne sauvegarde placée dans un de ces lieux reprend à
Paris.

## Tableau des vertus

8 vertus dans tout le jeu, une par ville au plus : 6 jusqu'à Hull, Adaptation à Hanoï, Liberté à Paris.

| Vertu | Ville | Où et auprès de qui elle se gagne | Phrase du carnet | Où elle resert |
|---|---|---|---|---|
| Joie de vivre | Fort-de-France | Maman, la danse au salon | « Rire et danser partout où l'on va, même le jour du départ. » | Saint-Ay : l'inauguration de la cabane, le vieux pêcheur (galet, optionnel) ; Montépilloy : Benoît triste (optionnel) ; Prytanée : le nouveau (insigne, optionnel) ; Hull : la piste de l'Asylum ; New Delhi : le grand repas partagé (dans le sens renversé : Pierre apprend à recevoir) |
| Esprit d'équipe | Saint-Ay | Les cousins, dans la cabane | « Construire à plusieurs ce qu'on ne ferait jamais seul. » | Montépilloy : le tonneau de Benoît ; Prytanée : faire le mur |
| Ingéniosité | Montépilloy | Jean, le tracteur de M. Bouly | « Trouver comment réparer ce qui ne marche plus. » | Saint-Ay (retour) : le panier de la cabane (verrou) ; collège : la cachette de Margaux (optionnel) ; Bordeaux : la coupure |
| Audace | Collège Bonsecours | Rémy, la scène de Camille | « Oser aller vers les autres, même quand on est timide. » | Collège : l'oral du brevet ; Prytanée : le capitaine au petit matin ; Bordeaux : l'oral de KEDGE ; Hull : le pari des fléchettes (le pari est obligatoire, seule la victoire est facultative) ; Hanoï : les papis aux échecs (optionnel) |
| Autonomie | Prytanée | Le capitaine, l'inspection | « Faire les choses soi-même, sans attendre qu'on les fasse à sa place. » | Bordeaux : le rangement après la soirée (obligatoire avant de sortir ; photo) ; Hull : le guichet de l'aéroport, avant Hanoï ; Amsterdam : la campagne de Corning |
| Insouciance | Hull | La bande, à l'aube devant l'Asylum | « Profiter du moment, sans penser à demain. » | Hanoï : la touriste au téléphone à plat, au temple ; Amsterdam : la nuit au canal avec Romain |
| Adaptation | Hanoï | M. Lam, qui traduit les consignes en vietnamien | « Trouver son chemin partout, même sans en parler la langue. » | Nulle part pour l'instant |
| Liberté | Paris | Le directeur, au dernier étage de la tour (la place refusée ; pas d'encart « a reçu », directement « Pierre utilise ») | « Écouter qui l'on est vraiment, et refuser une vie qui n'est pas la sienne. » | Paris : le bureau du directeur ; elle s'illumine en dernier dans le fondu de la fin |

Vertus supprimées (leurs scènes restent, sans encart) : Pragmatisme (le tri des cannes), Confiance (le coquillage de
Manon), Patience (la main de Fanny), Loyauté (le cache-cache), Indépendance (le compteur de Bordeaux). Les anciennes
sauvegardes sont converties au chargement : l'ancienne Insouciance du collège devient Audace, l'ancien Lâcher-prise de
Hull devient la nouvelle Insouciance, les vertus supprimées sont retirées.

Entre Hanoï et Paris, aucune vertu n'est gagnée. Le carnet range aussi un « souvenir de PNJ » : la Photo du canal
(Amsterdam, avec Romain).

---

## Personnages

| Personnage | Sprite | Où il apparaît |
|---|---|---|
| Pierre | `g198` (Red) | Partout |
| Maman | `g126` | Fort-de-France (et le pont du ferry), Saint-Ay, Montépilloy, le rêve, Bordeaux (le stade) |
| Papa | `g119` | Fort-de-France (et le pont du ferry), Saint-Ay, Montépilloy, le rêve, Bordeaux (le stade) |
| Manon | `g57` | Fort-de-France (et le pont du ferry), Saint-Ay, Montépilloy |
| Fanny | `g49` | Saint-Ay, Montépilloy |
| Jean | `g52` | Montépilloy |
| Capitaine du ferry | `g118` | Fort-de-France, le pont du ferry ; sa carte postale à Saint-Ay |
| Promeneuse | `g82` | Fort-de-France, route de Montépilloy (deux personnes différentes) |
| Gamin | `g59` | Fort-de-France, route de Montépilloy (deux personnes différentes) |
| Felix | `g93` | Saint-Ay ; sa carte postale à Montépilloy |
| Joshua | `g18` | Saint-Ay |
| Yanis | `g96` | Saint-Ay |
| Val | `g42` | Saint-Ay |
| Vieux pêcheur | `g67` | Saint-Ay |
| M. Bouly | `g33` | Montépilloy |
| Margaux | `g43` | Montépilloy, collège |
| Étienne | `g108` | Montépilloy, collège |
| Benoît | `g38` | Montépilloy (la classe, puis seul au bord de la mare) |
| Surveillant | `g116` | Collège |
| Principale | `g37` | Collège |
| Rémy | `g109` | Collège |
| Camille | `g25` | Collège |
| Professeur (maths) | `g138` | Collège |
| Professeure (français) | `g54` | Collège |
| Professeur de sciences | figurant | Collège |
| Sentinelles | `g87` | Route de Bonsecours |
| Capitaine | `g87` | Prytanée |
| Tanguy | `g56` | Prytanée |
| Geoffrey | `g41` | Prytanée |
| Militaires | `g87` / `g8` | Prytanée |
| Agent immobilier | `g35` | Bordeaux |
| Ousmane | `g105` | Bordeaux, aéroport, Hull, Bordeaux (le stade) |
| Paul | `g86` | Bordeaux (et le stade, au retour) |
| Rémi | `g140` | Bordeaux (et le stade, au retour) |
| Professeure d'anglais | `g106` | Bordeaux (KEDGE) |
| Hôtesse | `g64` | Aéroport |
| Léo (de Hull) | `g55` | Bordeaux (la soirée), Hull, Bordeaux (le stade) |
| Romain | `g202` (characterLooks) | Hull, Hanoï (téléphone), Amsterdam, Bordeaux (le stade) |
| Prophecy | `g94` | Hull, New Delhi, Bordeaux (le retour, le stade) |
| Charlotte | `g44` | Hull, Bordeaux (le stade) |
| Anaïs | `g107` | Bordeaux (la soirée), Hull, Bordeaux (le stade) |
| Barman | `g101` | Hull |
| Habitué | figurant | Hull |
| Nouveau | `g58` | Prytanée (hall de l'internat) |
| Professor | `g138` | Hull |
| Patron | `g141` | Hanoï (l'agence) |
| M. Lam | `g129` | Hanoï (le banc du lac) |
| Passante, Vendeuse, Passant | `g19`, `g70`, `g14` | Hanoï |
| Touriste (x 2) | `g24`, `g22` | Hanoï |
| Papi (x 2) | `g39`, `g48` | Hanoï (échecs chinois, optionnel) |
| Patron (Corning) | `g53` | Amsterdam |
| Vendeur | `g112` | Amsterdam |
| Harsh | `g89` | New Delhi |
| Vieux sage | `g71` | New Delhi (le vieux fort) |
| Directeur | `g120` | Bordeaux (le stade : la remise des diplômes), Paris (le dernier étage de la tour) |
| Propriétaire | `g35` | Paris (devant l'immeuble) |
| Collègue | `g36` | Paris (rez-de-chaussée de la tour) |
| Manager | `g122` | Paris (1er étage de la tour) |
| Hugues | `g121` | Paris (au téléphone, puis chez lui : le match), le rêve |
| Dalil | `g2` | Bordeaux (la soirée d'intégration, le stade), le rêve |
| Thomas | `g90` | Paris (le restaurant au store rayé, le match), le rêve |
| Inès, Malik, Clara | `g5`, `g4`, `g15` | Paris (la place de concert) |
| Chanteur | `g69` | Paris (Bercy) |

Le rêve de la fin réunit tous les personnages nommés du tableau, sauf M. Lam, le patron de Corning, Camille et M. Bouly (voir la
section 13 ; Dalil, Hugues et Thomas y sont, silencieux ; Inès, Malik, Clara et le chanteur n'y sont pas) ; huit y parlent : Felix, Margaux, Rémy, Ousmane, Léo, Romain, Harsh, Fanny.
---

## Incohérences repérées

### Noms incertains ou en double
- **Rémy / Rémi** : deux personnages distincts. Rémy (`g109`) est le copain du collège ; Rémi (`g117`) est l'étudiant de
  Bordeaux revenu des USA, qui se présente comme un inconnu (« Hey ! Moi c'est Rémi. »). Dans le code du collège,
  l'orthographe hésite aussi : le personnage affiché est « Rémy », mais ses identifiants et drapeaux s'écrivent « remi »
  (`remi`, `remi-casier`, `remi-classe`, `remiArrive`, `remiEnClasse`, `remiInvite`) ou « remy » (`remy-autocollant`,
  `remy-sciences`, `remyAutocollant`, `remyRepart`).
- **Les deux Paul** : le code ne contient qu'un seul Paul, **Paul** (Bordeaux). Je n'ai trouvé aucun autre
  personnage nommé Paul.
- **Léo** : un seul Léo depuis le retrait de la Corse (le meneur de la bande de Hull). `characters.js` attribue aussi
  « Leo » (sans accent) au même sprite.
- **Romain** : de la bande de Hull, il annonce partir à Hong Kong ; six mois après l'arrivée de Pierre à Hanoï, il
  l'appelle (« Hong Kong, c'est fini ! ») et l'attend à Amsterdam, où ils partagent une « maison commune » ; c'est lui
  qui remet à Pierre son billet pour New Delhi.
- **Sprites partagés** par des personnages différents : `g87` (les militaires, les sentinelles, le capitaine du
  Prytanée), `g138` (le prof de maths, le Professor de Hull), `g55` (Léo
  et « Leo »). La liste des figurants au hasard (`EXTRAS`) contient aussi les sprites de Tom, Fanny,
  Léo, Manon, Thomas, Felix, Yanis, Harsh, Étienne, Anaïs et de la professeure d'anglais : un figurant peut ressembler
  à un personnage.

### Répliques contradictoires ou répétées
- **L'examen de Hull** n'est pas joué : « veille d'examen », révisions, puis « Le surlendemain… » directement aux
  résultats (l'examen a lieu hors écran, la veille des résultats).
- **Deux diplômes d'anglais** se suivent : « Diplôme d'anglais » (KEDGE, Bordeaux), puis « Diplôme d'anglais de Hull ».

### Images d'accueil
- Fort-de-France, Saint-Ay et le matin de septembre à Montépilloy utilisent la **même illustration** (bois aux Chênes, le
  matin).
- Amsterdam (arrivée par un appel de Romain), New Delhi et Paris n'ont pas d'ouverture. Une carte postale existe pourtant
  pour Paris.

### Quêtes inachevées ou textes provisoires
- Plus aucun texte provisoire dans l'histoire (le stade de Bordeaux est écrit).
- Plusieurs répliques provisoires restent avant Hull, à Fort-de-France : la télé, la console de Manon et le frigo
  (« [Texte provisoire] … »).
- **Objets sans usage** : l'objet de chance et les consignes en vietnamien (Hanoï) restent dans le sac. Les objets
  optionnels (vieille canne exceptée : elle sert à pêcher) ne servent plus après leur ville : galet du lac, autocollant,
  insigne du Prytanée, photo de la soirée, règlement du QG, pièce d'échecs chinois.
- **Le gamin de la route de Montépilloy** parle d'un cerf-volant perdu, mais aucun cerf-volant n'est codé.
- **La maison de la voisine** à Montépilloy est fermée (« Personne ne répond. »), et sa boîte aux lettres ne contient
  rien.

### Vertus jamais utilisées
Adaptation (Hanoï) ne sert nulle part ; Liberté (Paris) sert une fois, au moment où elle est gagnée ; Insouciance sert une fois (Hanoï, le temple). Joie de vivre sert six
fois (dont trois en passage optionnel ; la dernière à New Delhi, dans le sens renversé), Audace cinq fois (dont une optionnelle, à Hanoï), Ingéniosité trois fois (dont une optionnelle et le verrou du panier de Saint-Ay),
Esprit d'équipe et Autonomie deux fois chacune (Autonomie une fois en passage optionnel). Chaque ville de Saint-Ay à
Hull a désormais un passage optionnel qui utilise une vertu ; Fort-de-France n'en a pas (aucune vertu n'est acquise
avant). En revenant dans une ancienne ville, un seul verrou existe pour l'instant : le panier de la cabane de Saint-Ay
(Ingéniosité).

### Objectifs manquants
- À Saint-Ay, si la corde est trouvée **après** les planches, personne ne dit « On a tout ! » (Joshua est resté devant
  l'enclos) : rien n'indique de retourner chez Felix, sauf en reparlant à Joshua, Yanis ou Felix.
- Il n'y a plus aucune réplique « Objectif : » : partout, le joueur suit les rappels des PNJ. À New Delhi, Prophecy et
  Harsh disent où aller ; à Paris, le propriétaire, le collègue et le manager. À Bordeaux, après « Quelques mois plus
  tard… », seul Rémi, devant KEDGE, indique l'oral.
- À Fort-de-France, la boîte aux lettres annonce « Peut-être une carte postale de Saint-Ay, un jour ? ». Cette carte
  n'existe pas : celle de Saint-Ay vient du capitaine, et la boîte de Fort-de-France ne change jamais.
- Courrier : Fort-de-France (vide), Saint-Ay (le capitaine), Montépilloy (Felix), Bordeaux (Joshua), Hull (Maman), Hanoï
  (Léo et la bande). Ni au collège ni au Prytanée (voulu). Après Hanoï, aucune boîte aux lettres.
