# Bible du jeu Poképierre

Ce document décrit ce qui est **réellement codé** au 5 octobre 2026 (branche `cartes-gen4`), ville par ville, dans
l'ordre du jeu. Il ne propose rien : il décrit l'existant. Sources : `src/data/story.js`, `src/data/*Story.js`,
`src/data/characters.js`, `src/data/questStarts.js`, `src/data/fishing.js`, `src/data/maps/*.js`,
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
- **Vertus** : 8 au plus dans tout le jeu, une par ville au plus ; 6 jusqu'à Hull, 2 places réservées après Hull (pas
  encore définies). Encart « Pierre a reçu la vertu X ! » (étape `trait`) et « Pierre utilise X ! » (étape `useTrait`,
  comptée). Carnet dans Start > VERTUS : le total (« Vertus : X sur 8. »), puis une page par vertu reçue avec sa ville,
  sa phrase et son nombre d'utilisations (« Utilisée N fois. » ou « Pas encore utilisée. »), puis les « souvenirs des
  PNJ ». À l'écran, le compteur « Vertus : X sur 8 », seulement dans les villes qui donnent une vertu.
- **Objectifs** : le jeu n'a pas de journal de quêtes. Le joueur est guidé de deux façons : des répliques qui
  commencent par « Objectif : » (seulement au Prytanée, à Bordeaux et à Hull), et des PNJ qui rappellent ce qu'il reste
  à faire. Les deux sont relevés ci-dessous.
- **Trajet** : scène de voyage (`FerryScene`) en ferry, en voiture ou en avion, qui se termine par l'encart
  « Tu emportes : … » (la vertu reçue dans la ville quittée ; pas d'encart en quittant une ville sans vertu). Sans scène
  de trajet, on passe directement à la carte suivante.
- **Pêche** (valable partout) : avec la **Vieille canne** dans le sac, on peut lancer sa ligne face à n'importe quelle
  eau. « Tu lances ta ligne… » ; 40 % de chances de « Rien ne mord… Tu remballes ta ligne. » ; sinon une prise selon
  l'eau, relâchée : mer (maquereau, sardine, petit bar, dorade), étang (gardon, perche, carpe, poisson-chat), rivière
  (truite, gardon, goujon), ou une vieille botte, « Tu la poses sur la rive. ».
- **Vélo** (mécanique prête, pas encore donné dans l'histoire ; `?velo` dans l'adresse donne l'objet **Vélo** pour
  l'essayer) : Pierre monte ou descend avec la touche V (ou B), l'entrée « VÉLO : MONTER / DESCENDRE » du menu Start
  ou le bouton VÉLO des commandes tactiles ; sonnette en montant, musique du vélo tant qu'il roule ; il va environ
  trois fois plus vite qu'à pied (Lucas à vélo de Diamant / Perle). Seulement dehors : « Pas de vélo à l'intérieur ! »,
  et il descend en entrant dans un bâtiment (à pied en ressortant) ; pas quand quelqu'un le suit (« Ce n'est pas le
  moment de monter sur ton vélo : on t'accompagne. »), il descend si quelqu'un se met à le suivre ; pendant une
  scénette, il descend et remonte à la fin. Une partie reprise dehors repart à vélo.
- **Textes provisoires** : à partir de Hanoï, presque toutes les répliques commencent par « [Texte provisoire] » ou
  « [Nom - texte provisoire] ».

## Ordre du jeu

Fort-de-France → Saint-Ay → (route de Montépilloy) → Montépilloy → route et collège de Bonsecours → Prytanée →
Bordeaux → Hull → Hanoï → Amsterdam → Hull (retour) → New Delhi → Rajasthan → Bordeaux (stade) → Paris → Toulon
(Chemin de Saint-Jacques, Corse) → Bali → Sri Lanka → Thaïlande → Népal → « Nouveau pays » (non ouvert).

Après Bordeaux, tous les vols passent par l'**aéroport** (à Bordeaux, redessiné en Gen 4 : tarmac et avions derrière la
baie vitrée, tableau des départs, guichet, file à cordons, salle d'attente). L'hôtesse (`g64`), derrière son comptoir
(on lui parle par-dessus), propose deux choix : la destination de la suite de l'histoire et « Autre » (les lieux déjà
visités, et « Rester ici ») ; sans vol de l'histoire en attente, la liste « Autre » s'ouvre directement. Chaque vol joue
le **trajet en avion** : l'avion de ligne file au-dessus de l'océan et de ses îles, entre deux couches de nuages, deux
traînées derrière lui, au bruit des réacteurs.

---

## 1. Fort-de-France (Martinique)

### Arrivée et image d'accueil
- Nouvelle partie : Pierre se réveille dans sa chambre, à l'étage de la maison familiale (`ffHouseUp`). Bruit des
  vagues, puis carte postale `fortDeFrance` (illustration de Johto « bois aux Chênes, le matin ») avec le texte :
  **« C'est le dernier matin à Fort-de-France. »**
- Maman, d'en bas : **« Pierre ! Le ferry part cet après-midi ! Descends ! »**
- En descendant au salon, Maman s'approche et pose le cadre de la journée : « Le ferry part cet après-midi, tous
  ensemble. D'ici là, va voir ton père et ta sœur : » / « ton père trie ses affaires à sa cabane de pêche, à droite de la
  plage, et Manon prépare un coup dehors. Ensuite, reviens me voir ! »

### Décor (refonte DS d'octobre 2026, scripts/fdf_ds_v2.py)
- Île ronde, plage arrondie, en assets Diamant / Perle / HeartGold. Une allée de sable relie la maison au ponton (sans
  bande d'herbe entre les deux) ; deux branches mènent à la
  cabane de pêche (à droite) et au mémorial (à gauche), au milieu d'une clairière de sable clair.
- Mémorial de l'Anse Caffard : les six statues de pierre blanche d'origine, en trois rangées tournées vers la mer (trois
  derrière, deux au milieu, une devant), sur la clairière de sable (décor `capStatues`, octobre 2026).
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
| Papa | Trie ses cannes dans la cabane de pêche | `g119` |
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
     fois) : « Papa trie ses cannes à sa cabane de pêche. Va l'aider ! »
2. **Papa : le tri des cannes** (cabane de pêche). « Des caisses partout. Papa trie sans lever les yeux. » / Papa :
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
   ferry ne part pas sans moi. »** / « Ton père en a toute une collection, dans sa cabane de pêche. Il en aurait pas une
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
- Maman, avant la danse : « Ton père trie ses affaires à sa cabane de pêche, à droite de la plage. Va lui
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
   **Esprit d'équipe**. Pour remonter dans la cabane, il faut redonner le mot de passe.
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
  « La voiture est chargée. » ; Felix accourt devant le capot : **« Le mot de passe, tu le gardes, hein ? »** ; « Tu
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
  orange (porte grise en (10, 16)) ; le tracteur est à sa droite (x 13-14, y 12-13), Jean devant lui (13, 14), M. Bouly
  au début du chemin de la ferme (13, 16). L'école est la maison jaune de droite : sa porte bleue en (27, 14), Margaux
  devant elle (25, 15) à la sortie. La porte de la voisine (maison jaune du haut) se frappe depuis la rue (20, 7).

### Arrivée et image d'accueil
- Carte postale `montepilloy` (« bois aux Chênes, l'après-midi ») : **« Montépilloy, Oise. Quelques années plus
  tard… »** ; « Te voilà au bord de la mare. La maison est en haut du village : toute la famille y est. »
- À la maison, Maman : « Te voilà ! Dernier jour d'école primaire ! Après, le collège. » / **« Et ton petit frère Jean
  ne te lâchera pas : à huit ans, il veut déjà tout réparer dans la maison. »** / « Dépêche-toi, tu vas être en retard !
  L'école est en bas de la grand-rue, à droite. »

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
| Benoît | Copain de classe, qui n'ira pas au collège avec eux ; après le cache-cache, assis seul devant la grange | `g38` |

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
   est en panne : il lui manque une pièce. » / « Elle doit traîner quelque part dans la grange… peut-être sous la botte
   de paille, au fond à droite ? » Sous la botte de paille du fond à droite (pas dans un tonneau : Benoît se cache dans
   celui de gauche) : « Tu soulèves la botte de paille… Dessous, une pièce de tracteur ! » / « Jean va être content. » →
   **Pièce de tracteur**, rapportée à M. Bouly ou à Jean. Le tracteur et la caisse à outils sont des dessins Gen 4
   (scripts/build_props.py).
   - « Jean ouvre sa caisse à outils et se glisse sous le tracteur. » ; Jean : **« Passe-moi la clé ! »** → trois
     questions (« La clé de 12 ! », « Le tournevis plat ! », « Le marteau… non, le petit ! ») parmi cinq outils ;
     mauvaises réponses : « Ça, c'est une cuillère. Qui a mis une cuillère dans ma caisse ? », « Le gros ? Tu veux
     casser le tracteur ? », « Non, pas ça ! Regarde bien dans la caisse. »
   - « Le moteur tousse… puis repart ! » ; Jean : **« À nous deux, on répare tout. »** / « Il sent le gasoil, c'est trop
     bien. » → vertu **Ingéniosité** ; si le cache-cache n'est pas fini, Jean : « Tes copains jouent encore à cache-cache
     dans le village. Va les trouver ! » ; M. Bouly : « Bravo, les garçons ! Allez, Jean, grimpe : on va faire un tour de
     tracteur ! »
4. **La fin de la journée** (le cache-cache fini et Ingéniosité reçue ; la nuit tombe) : « La nuit tombe sur
   Montépilloy… Il serait temps de rentrer à la maison. » ; le dîner : « Le soir, toute la famille est à table. » ; Jean « On a réparé le tracteur de M. Bouly !
   Enfin… surtout moi. » ; Papa « Bravo, les garçons. Profitez bien de l'été. » ; Maman « Et en septembre, c'est le
   collège ! »
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
  toi. » / « Jean t'attend dans sa chambre. » (tant que Jean n'a pas lancé la réparation) ; « Il se fait tard : rentre plutôt dîner à la maison. »

### Passage optionnel : Benoît triste (Joie de vivre)
Après le cache-cache et jusqu'au matin de septembre, Benoît est assis seul devant la grange (il n'est plus dans la
classe avec Margaux et Étienne). Bonus sans objet.
- Benoît : « Si tu cherches un coin pour bouder, la grange est déjà prise. » / « Margaux et Étienne iront au collège
  ensemble. Moi, je pars ailleurs. Je connaîtrai personne. » →
  **« Pierre utilise Joie de vivre ! »** → « Tu lui racontes la fois où Fanny a failli casser le vase de Maman… Benoît
  éclate de rire. » / Benoît : **« T'es bête… Merci. Je t'écrirai. »**
- Ensuite : « Le vase… j'y pense encore. »

### Vertus
- **Gagnée** : Ingéniosité (le tracteur, avec Jean).
- **Utilisées** : **Esprit d'équipe**, pour ouvrir le tonneau de Benoît avec Margaux et Étienne ; **Joie de vivre**, pour
  consoler Benoît (optionnel).

### Objet optionnel
- **Cuillère de Jean**, dans la caisse à outils restée devant le tracteur : « La caisse à outils de Jean. Tout au fond,
  entre deux clés… la cuillère ! » → « Tu prends la cuillère. Un souvenir de votre réparation. »

### Boîte aux lettres (carte postale)
De Felix : « Une carte postale ! Elle vient de Felix. » / « « Pierre, la cabane tient toujours. Yanis a oublié le mot
de passe, pas nous. » / « Joshua veut changer les planches, on a dit non, c'est les tiennes. Reviens vite. Felix. » »

### Mini-jeux
Cache-cache dans tout le village, « Passe-moi la clé ! » (question reposée jusqu'à la bonne réponse), pêche à la mare.

### Départ et trajet
- **Condition** : le cache-cache fini et Ingéniosité, puis le dîner et le matin de septembre. Sortie nord : « Tu prends la route du collège,
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
  de maths → salle de sciences → salle de français, tout en haut.

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
- Le capitaine : **« Nouveau. Ici, personne ne fait les choses à ta place. »** / « Lit, armoire, affaires. Inspection dans
  dix minutes. »

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
   premier. » / « La tienne, c'est celle de droite. » ; Geoffrey : « Ton lit, c'est celui du milieu. Au carré, hein. » /
   « Et prépare tes affaires pour demain, sur le bureau. » / « Il reste l'armoire. Demande à Tanguy, c'est un
   maniaque. »
   - L'inspection : **« GARDE À VOUS ! »** ; « L'armoire d'abord. Toujours l'armoire. » / « … Pliée au carré. Je suis
     presque déçu. » ; « Le lit. Une pièce de monnaie rebondirait dessus. » / « Je n'ai pas de pièce. Mais je le sens. » ;
     « Les affaires pour demain. Même les chaussettes sont alignées. » / « Qui t'a appris ça ? … Ne réponds pas. » ;
     **« Correct. Repos. »** → vertu **Autonomie**.
2. **Le mur, la nuit.** « Le soir même… » ; Tanguy : **« Ce soir on fait le mur. T'es avec nous ? »** ; Geoffrey : « Les
   rondes passent toutes les deux minutes, faut juste bien attendre. » → **« Pierre utilise Esprit d'équipe ! »**
   - Traverser la cour sans être vu des rondes. Pris : « Hé, toi ! Retour au dortoir ! » (retour devant l'internat).
   - Derrière la porte nord, Tanguy : « T'en as mis du temps ! » ; « Au petit matin, au dortoir. » ; le capitaine entre
     au dortoir : « Trois lits vides cette nuit, d'après la ronde. Qui est sorti ? » → **« Pierre utilise Audace ! »** →
     « Tu te lèves, au garde-à-vous, et tu regardes le capitaine droit dans les yeux. » ; Pierre : **« Personne n'est
     sorti, mon capitaine. On n'a rien vu, rien entendu. »** ; le capitaine : « Rien vu, rien entendu… Bien. » /
     **« Alors la prochaine fois que « personne » sort, dites-lui d'essuyer ses rangers : il a laissé de la boue jusqu'à
     son lit. »** ;
     Geoffrey : **« Personne a rien vu. On remet ça quand vous voulez les gars ! »**
3. **Le bac.** **« Quelques années plus tard… »** ; Tanguy : « Debout, Pierre ! C'est aujourd'hui : la liste du bac est
   affichée dans la cour. » ; Geoffrey : « On descend voir. Si j'y suis pas, je refais le mur… mais pour de bon. » Au
   panneau : « La liste des résultats du baccalauréat est affichée. Tu cherches ton nom… » ; Tanguy « T'es dessus ! » ;
   Geoffrey « On y est tous les trois. Même moi. » → **Baccalauréat** (« Diplôme obtenu : Baccalauréat ! »).

### Objectifs affichés
« Objectif : prépare ta chambre, au premier étage de l'internat. » → « Objectif : rejoins Tanguy et Geoffrey derrière le
mur, à la porte nord. Gare aux rondes ! » → « Objectif : va voir les résultats du bac, sur le panneau de la place
d'armes. » → « Le capitaine t'attend à la porte nord, la route de Bordeaux. »

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
| Paulfit | Fan de musculation : prête l'enceinte | `g86` |
| Rémi | Revient d'un échange aux USA, parle franglais : prête les gobelets | `g117` |
| Léo | Étudiant de KEDGE, invité à la soirée ; on le retrouve à Hull | `g55` |
| Anaïs | Étudiante de KEDGE (« de ta promo »), invitée à la soirée ; on la retrouve à Hull | `g107` |
| Étudiants (13) | À la soirée d'intégration | figurants |
| Professeure d'anglais | L'oral à KEDGE | `g106` |
| Hôtesse | Guichet de l'aéroport | `g64` |
| Agent de sécurité | Garde le chemin de l'aéroport (sortie est) tant que Pierre n'a pas son diplôme d'anglais | `g87` |
| Ouvrier | Travaux sur la route de Paris (sortie sud-est), jusqu'au diplôme de Bordeaux | `g79` |

### Quêtes, dans l'ordre
1. **Les clés.** À l'agence → **Clés de l'appartement**. Devant l'immeuble, Ousmane : **« Salut, moi c'est Ousmane, ton
   coloc. Alors, on va voir ça ? »**
2. **La coupure.** « Il fait tout noir. L'interrupteur ne répond pas. » ; Ousmane : « C'est quoi ce délire ?
   On appelle quelqu'un ? » ; Pierre : **« Non. »** → **« Pierre utilise Ingéniosité ! »** Le compteur se cherche à tâtons
   au fond de la pièce : « Le compteur électrique. Le disjoncteur est tombé… Tu le relèves. » ; Ousmane : **« T'es
   sérieux, tu savais faire ça ? »** (sans vertu).
3. **La soirée d'intégration.** Ousmane : « Bon. Les nouveaux élèves de KEDGE arrivent, on fait la soirée ici. Il nous
   manque tout. » / « Paulfit a une enceinte, Rémi a des gobelets. » / « Ils habitent tous les deux de l'autre côté de
   la Garonne : passe un pont, c'est en bas. » / « Paulfit, c'est la maison du milieu ; Rémi, celle de droite, juste à
   côté. »
   - Paulfit : « L'enceinte ? Ok, mais tu la portes comme un vrai, dos droit. » ; choix « Dos droit, genoux pliés. » /
     « À une main, tranquille. » / « Tu me la portes ? » ; dans tous les cas → **Enceinte**.
   - Rémi : « C'est so random, les gobelets sont dans le closet. » ; choix « Le closet ? » / « Thanks, bro. » / « Parle
     français ! » ; dans tous les cas → **Gobelets**.
   - Ousmane : « On est bons. Rentre, ça commence. » ; « La soirée d'intégration bat son plein. L'enceinte de Paulfit
     trône au milieu du salon. » (répliques des étudiants, par exemple « C'est toi qui as rallumé le courant ? Respect. »)
   - Parmi les invités, Léo : **« Moi c'est Léo, aussi à KEDGE. Paraît qu'on part tous à Hull l'an prochain pour
     l'échange… Ça va être quelque chose. »** (ensuite : « La prochaine soirée, c'est à Hull ! ») ; Anaïs : **« Anaïs, de ta
     promo ! Léo dit qu'à Hull il pleut tout le temps. J'espère qu'il exagère. »** (ensuite : « À Hull, alors ! »).
   - En allant vers la porte pendant la fête : fondu, **« Le lendemain matin. L'appartement est sens dessus dessous :
     gobelets, canettes, pizza froide, confettis… »** / « Ousmane dort encore, tout habillé. » (couché dans le lit de
     gauche). Voir le passage optionnel.
4. **Le diplôme d'anglais.** En sortant de l'appartement : « Quelques mois plus tard… ». Rémi, devant KEDGE : **« T'inquiète, c'est
   easy. »** La professeure : « Welcome to your English oral! Three questions. Ready? » → **« Pierre utilise
   Audace ! »** → trois traductions (« Je suis en
   retard », « Ça marche ! », « J'ai hâte ! » ; bonnes réponses « I am late. », « Deal! », « I can't wait! » ; une erreur :
   par exemple « Very French. Try again! ») → « Excellent! Well done, Pierre. » → **Diplôme d'anglais** (« Diplôme
   obtenu : Anglais KEDGE ! ») ; « Avec ça, la route vers l'est t'est ouverte. »

### Objectifs affichés
« Objectif : récupère les clés à l'agence. » → « Objectif : va à l'appartement. » → « Objectif : trouve le compteur
électrique. » → « Objectif : récupère l'enceinte chez Paulfit et les gobelets chez Rémi. » → « Objectif : passe l'oral
d'anglais à KEDGE. » → « Objectif : va à l'aéroport, sortie est. » Ousmane rappelle aussi : « Il manque l'enceinte :
Paulfit, la maison du milieu, de l'autre côté de la Garonne. » / « Et les gobelets : Rémi, la maison de droite, juste à
côté de chez Paulfit. »

### Les gardiens des sorties est
- Chemin de l'aéroport (en haut à droite), tant que Pierre n'a pas son diplôme d'anglais : l'agent de sécurité. Passer à
  côté de lui : il se tourne vers Pierre (« ! »), **« Halte ! Par ici, c'est l'aéroport. »** / « Pas de diplôme
  d'anglais, pas d'avion. L'oral, c'est à KEDGE, de l'autre côté de la Garonne. », et Pierre recule d'un pas.
- Route de Paris (en bas à droite), jusqu'au diplôme de Bordeaux : l'ouvrier, de la même façon : **« Holà ! Travaux sur la
  route de Paris, personne ne passe. »** / « Reviens plus tard. On aura peut-être fini… peut-être. »

### Passage optionnel : le rangement après la soirée (Autonomie)
Le lendemain matin, dans l'appartement, le désordre est au sol (dessiné au style DS) : trois gobelets rouges renversés, une
boîte de pizza entamée, un paquet de chips, des canettes écrasées, des bouteilles, des confettis partout, et la couette en
vrac sur le lit de Pierre. Trois tâches, dans n'importe quel ordre ; ramasser un objet range toute sa catégorie : les
gobelets (« Pierre ramasse tous les gobelets qui traînent et les empile dans un sac. »), le salon (« Pierre jette la
pizza, les canettes, les chips et les bouteilles, et balaie les confettis. »), le lit de droite (« Pierre secoue la
couette et fait son lit. ») ; à la première : **« Pierre utilise Autonomie ! »**. Avant, Ousmane : « Ousmane dort à
poings fermés. Il ronfle. » Une fois les trois faites, Ousmane se réveille : **« Attends… t'as tout rangé ? Tout
seul ? »** / « Tiens, j'ai retrouvé ça sous les confettis. » → **Photo de la soirée** (« Tu reçois la photo de la soirée ! »). Ensuite : « Attends… t'as tout rangé ? Tout seul ? »
On peut aussi sortir tout de suite : « Quelques mois plus tard… » ; l'appartement est alors rangé, Ousmane n'est plus
couché, et la photo n'est plus disponible.

### Vertus
- **Gagnée** : aucune. Le compteur de vertus n'est pas affiché à Bordeaux.
- **Utilisées** : **Ingéniosité**, pendant la coupure ; **Audace**, avant l'oral d'anglais ; **Autonomie**, pour le
  rangement (optionnel).

### Objet optionnel
- **Photo de la soirée**, donnée par Ousmane au réveil (voir le passage optionnel). L'enceinte et les gobelets, eux, sont
  obligatoires et repris au début de la soirée.

### Boîte aux lettres
Aucune.

### Mini-jeux
Recherche à tâtons dans le noir ; trois choix sans mauvaise réponse (Paulfit, Rémi) ; oral d'anglais (trois questions).

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
  « Ousmane t'attend au bout de la grande rue. » ;
  Ousmane : **« T'es enfin là ! Bienvenue en Angleterre. Oui, il pleut. Il pleut tout le temps. »** / « Léo et Anaïs sont
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
| Charlotte | De la bande, sérieuse, colocataire d'Anaïs ; rencontre Pierre au premier pub | `g44` |
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
   « La nuit tombe sur Hull. »
   **La tournée des bars** : à chaque étape (de chez Léo au premier pub, puis au second, puis à l'Asylum), Léo sort le
   premier, part devant en éclaireur (il attend Pierre s'il traîne) et entre le premier ; Pierre le suit ; à partir du
   premier pub, Ousmane, Charlotte et Anaïs suivent Pierre à la queue leu leu, puis s'attablent en arrivant.
2. **Premier pub : la tournée.** Léo : **« Première tournée, c'est toi qui régales ! »** ; Anaïs : « Comme à Bordeaux, mais
   c'est toi qui régales cette fois ! » ; Charlotte : **« Moi, c'est Charlotte, la coloc d'Anaïs. Alors c'est toi, le
   fameux Pierre ? »** Chacun dit sa commande en
   français : Léo « Une Guinness, évidemment. », Ousmane « Un cidre, s'il te plaît. », Charlotte « Un gin tonic ! »,
   Anaïs « Un verre de vin rouge. ». Le barman les demande en anglais (« And for Léo? »…), parmi six boissons ; une
   erreur : « Euh, c'est pas ça ? » / « Retourne lui redemander sa commande. » Tout servi : « Le barman pose les verres
   sur un plateau. Tu rapportes la tournée à la table. » ; Ousmane « Santé ! » ; Léo « Cheers ! Allez, on finit ça et on
   file au pub d'en bas. Je passe devant ! » (il sort ; les autres se lèvent et suivent Pierre).
3. **Deuxième pub : les fléchettes.** L'habitué : « Hey, the new guy! Tu joues ? » ; choix « Allez ! » / « Pas
   maintenant. » ; le pari (voir le passage optionnel), puis une partie de trois lancers (écran façon jeu Pokémon : la
   cible où se plantent les fléchettes, la liste des lancers et le total, la jauge de visée), gagnée ou perdue ; Léo :
   « On file à l'Asylum ! Je passe devant, suivez Pierre ! » (l'histoire continue dans les deux cas).
4. **L'Asylum, l'aube → Insouciance.** Romain : « Vous en avez mis du temps ! » ; Léo : « Tout le monde sur la piste ! » /
   « C'est notre chanson ! Venez tous ! » → **« Pierre utilise Joie de vivre ! »** → « Tu entraînes toute la bande sur la
   piste, comme Maman au salon. » ; « Toute la bande danse sur la piste. » ; « La musique ralentit… Dernière
   chanson. » Au petit matin : « Ciel bleuté, les réverbères s'éteignent. Toute la bande est devant l'Asylum. » ; Léo :
   **« Ok guys, zis night was very, very beautiful. Now we go 'ome. Follow me, I know ze way! »** (il part du mauvais
   côté) ; Ousmane « Léo… c'est de l'autre côté. » ; Charlotte « Au fait… les exams, c'est après-demain. » ; Anaïs « Ne
   dis pas ça maintenant. » ; Léo « Demain, bibliothèque. Tout le monde. » → vertu **Insouciance** (phrase du
   carnet : « Profiter du moment, sans penser à demain. »). « Tout le monde rentre se coucher. » : la bande disparaît
   (chacun chez soi : Léo, Romain et Prophecy chez eux, Ousmane à la coloc).
5. **Dormir** : Ousmane, déjà rentré : « Enfin ! Allez, au lit. » ; « Tu t'écroules sur ton lit. » ; « Le lendemain,
   veille d'examen… » ; Ousmane réveille Pierre : « Debout ! Les exams, c'est demain. Toute la bande révise à la
   bibliothèque Brynmor Jones. » / « C'est la longère au toit d'ardoise, en haut de Newland Avenue, à gauche. On se
   retrouve là-bas ! »
6. **Les révisions** (bibliothèque Brynmor Jones) : « La bande révise autour d'une table. Tour de table ! » Trois questions
   sans mauvaise réponse bloquante : Léo (« J'ai checké le planning, on a un meeting ASAP. »), Charlotte (le present
   perfect), Prophecy (« si je dis « ze » au lieu de « the », ça passe ? »). Charlotte : **« T'es prêt. »**
7. **Les résultats**, sur le panneau « EXAM » dressé devant l'université : « Le lendemain… » ; « Les résultats de
   l'examen d'anglais sont affichés. Tu cherches ton nom… » ;
   Léo : **« Diplôme de Hull, bro ! »** → **Diplôme d'anglais de Hull** (« Diplôme obtenu : Anglais de Hull ! »).
8. **Les adieux**, devant chez Léo : « Toute la bande est là, devant chez Léo. Chacun part en échange. » ; Charlotte « Moi,
   c'est le Canada ! » ; Anaïs « Bali ! » ; Prophecy « Les États-Unis. Je vais enfin parler anglais pour de vrai. » ;
   Romain « Hong Kong ! » ; « Et toi, c'est Hanoï, au Vietnam. » ; Léo **« Hanoï, hein. Nous on garde la maison. »** ;
   Ousmane « Reviens avec des histoires. »

### Objectifs affichés
« Objectif : suis Léo jusqu'au pub, juste à côté. » → « Objectif : ramène la tournée. Demande à chacun ce
qu'il veut, puis commande au comptoir. » → « Objectif : suis Léo jusqu'au pub suivant, plus bas dans l'avenue. La bande
te suit. » → « Objectif : suis Léo jusqu'à l'Asylum, tout en haut, sur le campus. La bande te suit. » → « Objectif :
rentre dormir à la coloc. » → (Ousmane, au réveil, envoie Pierre à la bibliothèque) → « Objectif : va voir les résultats
demain, devant l'université. » → « Objectif : va voir les résultats devant l'université. » → « Objectif : retrouve la
bande devant chez Léo. » → « Objectif : va à l'aéroport, au bout de la grande rue. »

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

### Boîte aux lettres
Aucune.

### Mini-jeux
La tournée (retenir quatre commandes, les donner en anglais), fléchettes (trois lancers), danse à l'Asylum, révisions à
choix.

### Départ et trajet
- **Condition** : le diplôme de Hull et les adieux. Les deux bouts de la grande rue mènent à l'aéroport : « Tu te rends
  à l'aéroport. » ; vol « Hanoï (Vietnam) », sans personne au guichet :
  **« Pierre utilise Autonomie ! »** → « Pour la première fois, personne ne t'accompagne. Tu prends ton billet pour
  Hanoï. »
- **Trajet en avion** ; encart : « Tu emportes : Insouciance. »

---

## 8. Hanoï (Vietnam) : textes provisoires

- **Arrivée** : pas d'image d'accueil. Dans sa maison : « [Texte provisoire] Ta nouvelle maison à Hanoï. Demain, tu
  commences ton nouveau travail à l'agence de voyage ! »
- **PNJ** : Directrice de l'agence de voyage (`g37`) ; Anna (`g24`) et Tom (`g22`), les deux touristes.
- **Quêtes** :
  1. La directrice : « [Directrice - texte provisoire] Bienvenue dans l'équipe de l'agence ! » / « C'est ton premier
     jour : voici l'étape 1 de ton nouveau travail. »
  2. En sortant, Anna : « [Anna - texte provisoire] Bonjour ! Tu travailles à l'agence ? » / « Tu pourrais nous emmener
     visiter le temple ? » / « D'accord ! Tu acceptes de les guider jusqu'au temple. » Les deux touristes suivent Pierre.
  3. Au temple, sur l'autel : « [Texte provisoire] Sur l'autel, tu trouves un objet de chance. » → **Objet de chance**.
     En sortant, les remerciements (« [Anna - texte provisoire] Quel temple magnifique ! Merci pour la visite. »).
  4. La directrice : « Merci pour ton travail, les touristes sont ravis ! » / « C'est bon, c'est terminé : tu peux
     partir. »
- **Vertus** : aucune. **Objet optionnel, boîte aux lettres, mini-jeu** : aucun.
- **Départ** : vol « Amsterdam (Pays-Bas) » à l'aéroport, une fois le travail terminé, avec le trajet en avion.

## 9. Amsterdam (Pays-Bas) : textes provisoires

- **PNJ** : Laurent (`g53`), patron chez Corning ; Romain (`g92`) ; un vendeur (`g112`) au coffee shop.
- **Quêtes** :
  1. Laurent : « [Laurent - texte provisoire] Bienvenue chez Corning ! Je suis Laurent, le patron. » / « Ton stage
     commence aujourd'hui. Bienvenue dans l'équipe ! »
  2. En sortant, Romain : « [Romain - texte provisoire] Hé ! Tu sors du boulot ? » / « Tu peux passer au coffee shop
     acheter la marchandise ? » / « Rejoins-moi ensuite à notre maison commune (2e maison en haut à gauche). »
  3. Coffee shop → **Marchandise** ; donnée à Romain : « Super, tu as la marchandise ! Merci beaucoup. » / « Au fait, tu
     as dû recevoir un mail. Va voir sur l'ordinateur ! »
  4. L'ordinateur : « [Texte provisoire] Nouveau mail ! « Merci de retourner à l'université de Hull » / « pour récupérer
     ta nouvelle affectation. » »
- **Vertus, objet optionnel, boîte aux lettres, mini-jeu** : aucun.
- **Départ** : vol « Hull (Angleterre) » (ouvert depuis le premier séjour à Hull).

## 10. Hull (retour) : textes provisoires

- Le Professor : « [Professor - texte provisoire] Welcome back! Voici ta nouvelle affectation : » / « un échange
  universitaire à New Delhi, en Inde. Voici ton billet d'avion ! » → **Billet d'avion pour New Delhi**.
- **Départ** : vol « New Delhi (Inde) ».

## 11. New Delhi et le Rajasthan (Inde) : textes provisoires

- **PNJ** : la professeure de l'université de Delhi (`g54`), Harsh (`g89`), le vieux sage (`g71`).
- **Quêtes** :
  1. La professeure : « [Professeure - texte provisoire] Namaste ! Bienvenue à l'université. » / « Tu es le bienvenu dans
     ce pays : ton échange commence aujourd'hui ! »
  2. En sortant, Harsh : « Salut ! Moi c'est Harsh, j'étudie à l'université avec toi. » / « Ça te dirait de venir avec moi
     dans le désert du Rajasthan ? » ; choix Oui → le Rajasthan.
  3. Au Rajasthan, Harsh : « Notre mission : récupérer la potion magique dans la tente rayée, » / « puis l'apporter au
     vieux sage, près du feu de camp. » Tente → **Potion magique** ; au vieux sage : « La potion magique ! Merci, jeune
     voyageur. » ; Harsh : « Mission accomplie, bravo ! » → retour à New Delhi.
  4. La professeure : « Félicitations pour ton semestre ! » / « Bonne chance pour la suite de ton voyage. »
- **Vertus, objet optionnel, boîte aux lettres, mini-jeu** : aucun.
- **Départ** : vol « Bordeaux ».

## 12. Bordeaux (le stade) : textes provisoires

- Le stade s'ouvre une fois le semestre terminé. Le directeur (`g120`) : « [Directeur - texte provisoire] Bienvenue à la
  cérémonie ! Monte sur le podium pour recevoir ton diplôme. » ; douze diplômés (« Félicitations à nous tous ! »…).
- Sur le podium : « Tu montes sur le podium sous les applaudissements ! » / « Le directeur te remet ton diplôme. » →
  **Diplôme de Bordeaux**.
- **Départ** : l'ouvrier qui gardait la route de Paris (sortie sud-est) est parti ; « Ton diplôme de Bordeaux en poche, tu
  prends la route de Paris ! » Pas de scène de trajet.

## 13. Paris : textes provisoires

- **Arrivée** : « [Texte provisoire] Bienvenue à Paris ! » / « Première mission : aller manger au bistrot (2e bâtiment en
  haut à gauche). »
- **PNJ** : le cuisinier (`g63`), Hugues (`g91`), Thomas (`g90`), une responsable (`g36`), le manager (`g122`), le
  directeur (`g120`) ; à Bercy, le chanteur (`g69`), le guitariste (`g68`), le batteur (`g16`) et des fans (`g40`).
- **Quêtes** :
  1. Le bistrot. Le cuisinier : « Aujourd'hui, c'est boeuf bourguignon... et le boeuf, c'est moi qui l'ai motivé ce
     matin ! » ; « Dis-moi, tu as emménagé dans le coin ? » → « Oui, je suis nouveau à Paris ! » ouvre l'appartement.
  2. L'appartement : l'ordinateur, « Chercher un travail ? » → « Une offre correspond à ton profil ! »
  3. L'entreprise : la responsable (« Bienvenue dans l'entreprise : ton nouveau travail commence aujourd'hui ! ») ;
     l'ascenseur ; au 1er étage, le manager : « Demander une promotion ? » → « Tu la mérites ! Promotion accordée,
     félicitations ! »
  4. Le bistrot : Hugues « Le voilà ! On fête ta promotion ! » ; Thomas « Viens trinquer avec nous, et raconte-nous
     tout ! » / « Ce soir il y a un concert à Bercy, tu devrais y aller ! »
  5. Bercy : « Les lumières s'éteignent... la foule hurle ! » ; le chanteur « Bonsoir Paris ! Vous êtes prêts ?! »
  6. Le dernier étage (bloqué avant le verre au bistrot) : le directeur, « Demander une rupture conventionnelle ? » →
     « C'est d'accord. Merci pour tout ton travail ! » / « Bonne chance pour la suite : la route du sud mène à Toulon. »
- **Vertus** : aucune. Des **souvenirs de PNJ** (rangés dans le carnet après les vertus) : « Souvenir du cuisinier »,
  « Souvenir d'Hugues », « Souvenir de Thomas ».
- **Départ** : la rue sud, vers Toulon. Pas de scène de trajet.

## 14. Toulon, le Chemin de Saint-Jacques et la Corse : textes provisoires

- **Arrivée** : « [Texte provisoire] Bienvenue à Toulon ! » / « Mission : rejoindre l'appartement de Yanis (2e maison en
  haut à gauche). »
- **PNJ** : Yanis (`g96`, même couleur que le cousin de Saint-Ay) ; des pèlerins sur le Chemin ; en Corse, Maman, Papa,
  et les voisins Léo (`g55`) et Théo (`g23`).
- **Quêtes** :
  1. Yanis : « Pierre ! Te voilà enfin à Toulon ! » → « Souvenir de Yanis à Toulon » ; « Partir faire le Chemin de
     Saint-Jacques-de-Compostelle avec Yanis ? » → le Chemin (côte nord de l'Espagne), Yanis suit Pierre. Six bornes
     (« Saint-Jacques-de-Compostelle, 90 km. »… « 15 km. ») ; la cathédrale ; le bus du retour : « ¡Buen Camino ! Vous
     voici à Saint-Jacques-de-Compostelle. » / « Le bus vous ramène à Toulon, Yanis et toi. »
  2. Le ferry du port, vers la Corse : « Tu embarques sur le ferry pour la Corse, chez tes parents ! » Maman « Mon grand !
     Quelle joie de te voir en Corse ! » ; Papa « Bienvenue dans le maquis ! Va aussi dire bonjour à Léo et Théo, à
     côté. » Léo et Théo n'ont que des répliques de remplissage (« Ceci est le premier dialogue de Léo. ») → « Souvenir
     de Léo », « Souvenir de Théo ».
- **Vertus** : aucune.
- **Départ** : vol « Bali (Indonésie) », ouvert une fois le Chemin fini, la visite aux parents faite, et les souvenirs de
  Léo et de Théo obtenus.

## 15. Bali, Sri Lanka, Thaïlande, Népal : textes provisoires

Chaque destination donne un objet magique qui ouvre la suivante. Pas de PNJ à Bali ; un moine (`g72`) dans les temples
des trois autres.
- **Bali** : dans la cabane près de la mer, « Dans le coffre de bois, un objet scintille : un objet magique ! » → **Objet
  magique de Bali**.
- **Sri Lanka** : au temple, le moine « Ayubowan. L'objet sacré t'attend sur l'autel. » → **Objet magique du Sri Lanka**.
- **Thaïlande** : au wat, « Au pied du grand Bouddha doré, un objet magique brille ! » → **Objet magique de Thaïlande**.
- **Népal** : au monastère, « Parmi les lampes à beurre, un objet magique rayonne ! » → **Objet magique du Népal**.
- **Suite** : à l'aéroport, « Nouveau pays » : « [Texte provisoire] Ce vol n'est pas encore ouvert : la suite du voyage
  arrive bientôt ! »

---

## Tableau des vertus

8 vertus au plus dans tout le jeu, une par ville au plus : 6 jusqu'à Hull, 2 places réservées après Hull (pas encore
définies, rien n'est codé).

| Vertu | Ville | Où et auprès de qui elle se gagne | Phrase du carnet | Où elle resert |
|---|---|---|---|---|
| Joie de vivre | Fort-de-France | Maman, la danse au salon | « Rire et danser partout où l'on va, même le jour du départ. » | Saint-Ay : l'inauguration de la cabane, le vieux pêcheur (galet, optionnel) ; Montépilloy : Benoît triste (optionnel) ; Prytanée : le nouveau (insigne, optionnel) ; Hull : la piste de l'Asylum |
| Esprit d'équipe | Saint-Ay | Les cousins, dans la cabane | « Construire à plusieurs ce qu'on ne ferait jamais seul. » | Montépilloy : le tonneau de Benoît ; Prytanée : faire le mur |
| Ingéniosité | Montépilloy | Jean, le tracteur de M. Bouly | « Trouver comment réparer ce qui ne marche plus. » | Saint-Ay (retour) : le panier de la cabane (verrou) ; collège : la cachette de Margaux (optionnel) ; Bordeaux : la coupure |
| Audace | Collège Bonsecours | Rémy, la scène de Camille | « Oser aller vers les autres, même quand on est timide. » | Collège : l'oral du brevet ; Prytanée : le capitaine au petit matin ; Bordeaux : l'oral de KEDGE ; Hull : le pari des fléchettes (optionnel) |
| Autonomie | Prytanée | Le capitaine, l'inspection | « Faire les choses soi-même, sans attendre qu'on les fasse à sa place. » | Bordeaux : le rangement après la soirée (photo, optionnel) ; Hull : le guichet de l'aéroport, avant Hanoï |
| Insouciance | Hull | La bande, à l'aube devant l'Asylum | « Profiter du moment, sans penser à demain. » | Nulle part pour l'instant |

Vertus supprimées (leurs scènes restent, sans encart) : Pragmatisme (le tri des cannes), Confiance (le coquillage de
Manon), Patience (la main de Fanny), Loyauté (le cache-cache), Indépendance (le compteur de Bordeaux). Les anciennes
sauvegardes sont converties au chargement : l'ancienne Insouciance du collège devient Audace, l'ancien Lâcher-prise de
Hull devient la nouvelle Insouciance, les vertus supprimées sont retirées.

Aucune vertu n'est gagnée après Hull. De Paris à la Corse, le jeu donne à la place des « souvenirs de PNJ » (cuisinier,
Hugues, Thomas, Yanis à Toulon, Léo, Théo).

---

## Personnages

| Personnage | Sprite | Où il apparaît |
|---|---|---|
| Pierre | `g198` (Red) | Partout |
| Maman | `g126` | Fort-de-France (et le pont du ferry), Saint-Ay, Montépilloy, Corse |
| Papa | `g119` | Fort-de-France (et le pont du ferry), Saint-Ay, Montépilloy, Corse |
| Manon | `g57` | Fort-de-France (et le pont du ferry), Saint-Ay, Montépilloy |
| Fanny | `g49` | Saint-Ay, Montépilloy |
| Jean | `g52` | Montépilloy |
| Capitaine du ferry | `g118` | Fort-de-France, le pont du ferry ; sa carte postale à Saint-Ay |
| Promeneuse | `g82` | Fort-de-France, route de Montépilloy (deux personnes différentes) |
| Gamin | `g59` | Fort-de-France, route de Montépilloy (deux personnes différentes) |
| Felix | `g93` | Saint-Ay ; sa carte postale à Montépilloy |
| Joshua | `g18` | Saint-Ay |
| Yanis | `g96` | Saint-Ay, Toulon, Chemin de Saint-Jacques |
| Val | `g42` | Saint-Ay |
| Vieux pêcheur | `g67` | Saint-Ay |
| M. Bouly | `g33` | Montépilloy |
| Margaux | `g43` | Montépilloy, collège |
| Étienne | `g108` | Montépilloy, collège |
| Benoît | `g38` | Montépilloy (la classe, puis seul devant la grange) |
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
| Ousmane | `g105` | Bordeaux, aéroport, Hull |
| Paulfit | `g86` | Bordeaux |
| Rémi | `g117` | Bordeaux |
| Professeure d'anglais | `g106` | Bordeaux (KEDGE) |
| Hôtesse | `g64` | Aéroport |
| Léo (de Hull) | `g55` | Bordeaux (la soirée), Hull |
| Romain | `g92` | Hull, Amsterdam |
| Prophecy | `g94` | Hull |
| Charlotte | `g44` | Hull |
| Anaïs | `g107` | Bordeaux (la soirée), Hull |
| Barman | `g101` | Hull |
| Habitué | figurant | Hull |
| Nouveau | `g58` | Prytanée (hall de l'internat) |
| Professor | `g138` | Hull (deux fois) |
| Directrice | `g37` | Hanoï |
| Anna, Tom | `g24`, `g22` | Hanoï |
| Laurent | `g53` | Amsterdam |
| Vendeur | `g112` | Amsterdam |
| Professeure (Delhi) | `g54` | New Delhi |
| Harsh | `g89` | New Delhi, Rajasthan |
| Vieux sage | `g71` | Rajasthan |
| Directeur | `g120` | Bordeaux (stade), Paris (entreprise) |
| Cuisinier | `g63` | Paris |
| Hugues, Thomas | `g91`, `g90` | Paris |
| Responsable, Manager | `g36`, `g122` | Paris |
| Chanteur, Guitariste, Batteur, Fans | `g69`, `g68`, `g16`, `g40` | Paris (Bercy) |
| Pèlerins / Pèlerine | figurant / `g15` | Chemin de Saint-Jacques |
| Léo (voisin), Théo | `g55`, `g23` | Corse |
| Moine | `g72` | Sri Lanka, Thaïlande, Népal |

---

## Incohérences repérées

### Noms incertains ou en double
- **Rémy / Rémi** : deux personnages distincts. Rémy (`g109`) est le copain du collège ; Rémi (`g117`) est l'étudiant de
  Bordeaux revenu des USA, qui se présente comme un inconnu (« Hey ! Moi c'est Rémi. »). Dans le code du collège,
  l'orthographe hésite aussi : le personnage affiché est « Rémy », mais ses identifiants et drapeaux s'écrivent « remi »
  (`remi`, `remi-casier`, `remi-classe`, `remiArrive`, `remiEnClasse`, `remiInvite`) ou « remy » (`remy-autocollant`,
  `remy-sciences`, `remyAutocollant`, `remyRepart`).
- **Les deux Paul** : le code ne contient qu'un seul Paul, **Paulfit** (Bordeaux). Je n'ai trouvé aucun autre
  personnage nommé Paul.
- **Deux Léo** : Léo, meneur de la bande de Hull, et Léo, voisin des parents en Corse (avec Théo). Ils portent le même
  nom et ont donc le même sprite (`g55`). La Corse ne dit pas s'il s'agit du même Léo. `characters.js` attribue aussi
  « Leo » (sans accent) au même sprite.
- **Yanis** : cousin à Saint-Ay, puis hôte à Toulon, avec la même couleur et le même sprite. Aucune réplique de Toulon ne
  rappelle qu'il est le cousin.
- **Romain** : de la bande de Hull, il annonce partir à Hong Kong, puis on le retrouve à Amsterdam dans une « maison
  commune » avec Pierre, sans explication.
- **Sprites partagés** par des personnages différents : `g87` (les militaires, les sentinelles, le capitaine du
  Prytanée), `g138` (le prof de maths, le Professor de Hull), `g37` (la principale, la directrice de Hanoï), `g55` (Léo
  de Hull, Léo de Corse, « Leo »). La liste des figurants au hasard (`EXTRAS`) contient aussi les sprites de Tom, Fanny,
  Léo, Manon, Thomas, Felix, Yanis, Harsh, Étienne, Anaïs et de la professeure d'anglais : un figurant peut ressembler
  à un personnage.

### Répliques contradictoires ou répétées
- **L'examen de Hull** n'est pas joué : « veille d'examen », révisions, puis « Le lendemain… » directement aux résultats.
- **Deux diplômes d'anglais** se suivent : « Diplôme d'anglais » (KEDGE, Bordeaux), puis « Diplôme d'anglais de Hull ».

### Images d'accueil
- Fort-de-France, Saint-Ay et le matin de septembre à Montépilloy utilisent la **même illustration** (bois aux Chênes, le
  matin).
- Hanoï, Amsterdam, New Delhi, Paris, Toulon, la Corse, Bali, le Sri Lanka, la Thaïlande et le Népal n'ont pas
  d'ouverture. Des cartes postales existent pourtant pour Hanoï, Paris, la
  Corse, le Sri Lanka, la Thaïlande et le Népal.

### Quêtes inachevées ou textes provisoires
- Tout ce qui suit Hull est en **texte provisoire** : Hanoï, Amsterdam, Hull (retour), New Delhi, Rajasthan, le stade de
  Bordeaux, Paris, Toulon, le Chemin, la Corse, Bali, Sri Lanka, Thaïlande, Népal.
- Léo et Théo, en Corse, n'ont que des répliques de remplissage (« Ceci est le premier dialogue de Léo. »), alors qu'ils
  ouvrent la route de Bali.
- Le vol **« Nouveau pays »** n'est pas ouvert (« la suite du voyage arrive bientôt ! »).
- Plusieurs répliques provisoires restent aussi avant Hull, à Fort-de-France : la télé, la console de Manon et le frigo
  (« [Texte provisoire] … »). Dans l'entreprise parisienne, le dernier étage bloqué l'est aussi.
- **Objets sans usage** : l'objet de chance (Hanoï) reste dans le sac. Les objets optionnels (vieille canne exceptée :
  elle sert à pêcher) ne servent plus après leur ville : galet du lac, cuillère, autocollant, insigne du Prytanée, photo
  de la soirée, fléchettes de l'habitué, règlement du QG.
- **Le gamin de la route de Montépilloy** parle d'un cerf-volant perdu, mais aucun cerf-volant n'est codé.
- **La maison de la voisine** à Montépilloy est fermée (« Personne ne répond. »), et sa boîte aux lettres ne contient
  rien.

### Vertus jamais utilisées
Insouciance (Hull) ne sert encore nulle part. Joie de vivre sert cinq fois (dont trois en passage optionnel), Audace
quatre fois (dont une optionnelle), Ingéniosité trois fois (dont une optionnelle et le verrou du panier de Saint-Ay),
Esprit d'équipe et Autonomie deux fois chacune (Autonomie une fois en passage optionnel). Chaque ville de Saint-Ay à
Hull a désormais un passage optionnel qui utilise une vertu ; Fort-de-France n'en a pas (aucune vertu n'est acquise
avant). En revenant dans une ancienne ville, un seul verrou existe pour l'instant : le panier de la cabane de Saint-Ay
(Ingéniosité).

### Objectifs manquants
- À Saint-Ay, si la corde est trouvée **après** les planches, personne ne dit « On a tout ! » (Joshua est resté devant
  l'enclos) : rien n'indique de retourner chez Felix, sauf en reparlant à Joshua, Yanis ou Felix.
- Les répliques « Objectif : » n'existent qu'au Prytanée, à Bordeaux et à Hull. Fort-de-France, Saint-Ay, Montépilloy et
  le collège s'appuient seulement sur les rappels des PNJ. Paris et Toulon ont une « mission » d'arrivée ; Hanoï,
  Amsterdam, New Delhi et les pays d'Asie n'ont rien.
- À Fort-de-France, la boîte aux lettres annonce « Peut-être une carte postale de Saint-Ay, un jour ? ». Cette carte
  n'existe pas : celle de Saint-Ay vient du capitaine, et la boîte de Fort-de-France ne change jamais.
- Après Montépilloy, aucune boîte aux lettres ni carte postale.
