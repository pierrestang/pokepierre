"""Catalogue des intérieurs du créateur de cartes (mode simple, espace « Intérieurs ») : les données curées.

Lu par scripts/build_interior_catalogue.py, qui écrit public/assets/v2/catalogue-int.png et catalogue-int.json (même
format que le catalogue des extérieurs, voir src/builder/studio.js). Thèmes par type de pièce (pas par ville) ; « libre »
(« Tout ») reçoit tout. Sans ombres portées ni rien d'identifiable Pokémon (machines du labo, PC, Poké Balls, statues…).

Sources :
- ('hg', carte, x, y, w, h)            : un meuble des calques Props d'une carte Tiled du pack HGSS de SirMaIo, isolé au
                                         pixel près (le morceau d'un seul tenant dont les cases font ce rectangle) ;
- ('hgmur', carte, x, y, w, h)         : idem dans les calques de déco murale (Wall_B, Wall_C…) ;
- ('item', nom)                        : un objet déjà dessiné pour les intérieurs (scripts/interieurs_plans.py ITEMS).
Matières : ('sol', carte, x, y) motif 2 x 2 du calque Floor ; ('mur', carte, x, y, h) bande de 2 colonnes x h rangées des
calques Floor et Wall_A.
Crédit : « Intérieurs HGSS ripés et préparés par SirMaIo » (ASSETTILESPOKEMONV2/credits/sirmaio.txt).
"""

THEMES = [
    ('libre', 'Tout'), ('maison', 'Maison'), ('ecole', 'École et collège'), ('bureau', 'Bureaux'),
    ('cafe', 'Bar, pub, café'), ('boutique', 'Boutiques'), ('atelier', 'Grange et atelier'), ('temple', 'Temples'),
    ('sante', 'Clinique'),
]

NB = '001i_Newbark'
GI = '012i_Goldenrod interiors'
RT = '012i_Goldenrod radio tower'
ST = '012i_Goldenrod station'
DS = '012i_Goldenrod department store'
GC = '012i_Goldenrod game corner'
OL = '019i_Olivine Lighthouse'
VS = '006i_Violet School '
AZ = '010i_Azalea Houses'
LAB = '001i_Newbark-Lab'
ALPH = '074i_Ruins of Alph Lab'

ALL = ['maison', 'ecole', 'bureau', 'cafe', 'boutique', 'atelier', 'temple', 'sante']

# (id, nom, thèmes, source)
FLOORS = [
    ('parquet-lames', 'Parquet en lames', ['maison', 'cafe', 'boutique'], ('sol', NB, 10, 13)),
    ('parquet-carre', 'Parquet à carreaux', ['maison', 'sante'], ('sol', NB, 34, 15)),
    ('parquet-chevrons', 'Parquet en chevrons', ['ecole', 'bureau', 'cafe'], ('sol', VS, 19, 11)),
    ('plancher', 'Plancher de bois', ['atelier', 'cafe', 'temple'], ('sol', AZ, 10, 33)),
    ('pierre', 'Sol de pierre', ['atelier', 'temple'], ('sol', '006i_Violet houses', 10, 11)),
    ('carrelage-beige', 'Carrelage beige', ['sante', 'boutique', 'bureau'], ('sol', '003i_Cherrygrove CP', 21, 20)),
    ('terre-cuite', 'Tomettes', ['maison', 'cafe'], ('sol', GI, 66, 9)),
    ('dalles-grises', 'Dalles grises', ['bureau', 'boutique', 'ecole'], ('sol', GI, 13, 10)),
    ('damier-rose', 'Damier rose et violet', ['boutique', 'cafe'], ('sol', GI, 112, 9)),
    ('damier-bleu', 'Damier bleu ciel', ['sante', 'maison'], ('sol', GI, 13, 46)),
    ('moquette-bleue', 'Moquette bleue', ['bureau', 'maison'], ('sol', RT, 20, 34)),
    ('moquette-rouge', 'Moquette rouge', ['cafe', 'bureau'], ('sol', RT, 12, 33)),
    ('parquet-dore', 'Parquet doré', ['boutique', 'cafe'], ('sol', ST, 13, 37)),
    ('dalles-vertes', 'Dalles vertes', ['atelier', 'boutique'], ('sol', '012i_Goldenrod warehouse', 11, 16)),
    ('moquette-bordeaux', 'Moquette bordeaux à losanges', ['temple', 'cafe'], ('sol', '013i_Park-Pokéathlon Gate', 17, 10)),
    ('carrelage-gris-vert', 'Carrelage gris-vert', ['sante', 'ecole'], ('sol', OL, 10, -16)),
    ('plancher-bleu', 'Plancher peint en bleu', ['maison', 'atelier'], ('sol', OL, 16, 12)),
]

WALLS = [
    ('mur-papier-bleu', 'Papier peint bleu', ['maison', 'sante'], ('mur', '001i_Newbark houses', 12, 53, 2)),
    ('mur-lambris', 'Lambris de bois', ['atelier', 'cafe', 'temple'], ('mur', AZ, 10, 25, 2)),
    ('mur-gris-raye', 'Mur gris rayé', ['bureau', 'boutique'], ('mur', GI, 10, 8, 2)),
    ('mur-vert-olive', 'Mur vert olive', ['ecole', 'maison'], ('mur', GI, 71, 24, 3)),
    ('mur-bureau', 'Mur de bureau', ['bureau'], ('mur', GI, 107, 56, 2)),
    ('mur-gare', 'Mur beige à colonnes', ['boutique', 'bureau', 'cafe'], ('mur', RT, 12, 31, 2)),
    ('mur-blanc-vert', 'Mur blanc à frise verte', ['ecole', 'sante'], ('mur', ST, 12, 34, 3)),
    ('mur-metal', 'Mur de métal', ['atelier'], ('mur', OL, 10, -18, 2)),
    ('mur-creme', 'Mur crème', ['sante', 'maison', 'ecole'], ('mur', ALPH, 14, 8, 2)),
]

# (id, nom, catégorie, thèmes, source)
ELEMENTS = [
    # Lits
    ('lit-simple', 'Lit simple', 'lits', ['maison', 'sante'], ('hg', NB, 10, 40, 3, 3)),
    ('lit-bleu', 'Lit bleu', 'lits', ['maison'], ('item', 'fsa-lit-bleu')),
    ('lit-lavande', 'Lit lavande', 'lits', ['maison', 'sante'], ('item', 'fsa-lit-lavande')),
    ('lit-rose', 'Lit rose', 'lits', ['maison'], ('item', 'fsa-lit-rose')),
    ('lit-blanc', 'Lit blanc', 'lits', ['maison', 'sante'], ('item', 'fsa-lit-blanc')),
    ('lit-enfant', 'Lit d\'enfant', 'lits', ['maison'], ('item', 'fsa-lit-enfant')),
    # Assises et tables
    ('table-tabourets', 'Table et quatre tabourets', 'assises', ['maison', 'cafe'], ('hg', NB, 14, 14, 4, 2)),
    ('table-carree', 'Table carrée', 'assises', ['maison', 'cafe', 'bureau'], ('hg', NB, 34, 17, 2, 3)),
    ('fauteuil-bleu-g', 'Fauteuil bleu (gauche)', 'assises', ['maison', 'bureau'], ('hg', NB, 32, 17, 2, 3)),
    ('fauteuil-bleu-d', 'Fauteuil bleu (droite)', 'assises', ['maison', 'bureau'], ('hg', NB, 36, 17, 2, 3)),
    ('tabouret-rouge', 'Tabouret rouge', 'assises', ['maison', 'cafe', 'ecole'], ('hg', NB, 15, 37, 1, 1)),
    ('canape-brun', 'Canapé brun', 'assises', ['maison', 'cafe'], ('hg', '004i_Mr Pokémon House', 12, 9, 4, 2)),
    ('pupitre-chaises', 'Pupitre et trois chaises', 'assises', ['ecole'], ('hg', VS, 12, 14, 3, 2)),
    ('trois-chaises', 'Rangée de trois chaises', 'assises', ['ecole', 'bureau', 'sante'], ('hg', VS, 12, 16, 3, 1)),
    ('coussin-violet', 'Coussin de sol violet', 'assises', ['maison', 'temple'], ('hg', AZ, 14, 12, 1, 1)),
    ('grande-table', 'Grande table basse', 'assises', ['maison', 'temple', 'atelier'], ('hg', AZ, 17, 29, 3, 3)),
    ('banquette-bleue', 'Banquette bleue', 'assises', ['cafe', 'bureau', 'sante'], ('hg', GC, 15, 12, 4, 2)),
    ('gueridon', 'Guéridon et tabouret', 'assises', ['cafe'], ('hg', GC, 21, 12, 2, 2)),
    ('banquette-doree', 'Banquette à dossier doré', 'assises', ['cafe', 'boutique'], ('hg', GC, 15, 16, 4, 2)),
    ('canape-bleu', 'Canapé bleu', 'assises', ['maison', 'bureau', 'sante'], ('hg', DS, 57, 53, 2, 2)),
    ('chaise-orange', 'Chaise orange', 'assises', ['bureau', 'ecole'], ('hg', RT, 12, 37, 1, 1)),
    ('chaise-bleue', 'Chaise bleue', 'assises', ['bureau', 'ecole'], ('hg', RT, 14, 41, 1, 1)),
    ('table-reunion', 'Table de réunion', 'assises', ['bureau'], ('hg', RT, 18, 95, 4, 3)),
    ('table-reunion-fleurs', 'Table de réunion fleurie', 'assises', ['bureau'], ('hg', RT, 18, 98, 4, 3)),
    ('table-blanche', 'Grande table blanche', 'assises', ['bureau', 'sante'], ('hg', RT, 18, 56, 4, 4)),
    ('table-rouge-g', 'Table rouge et chaises (gauche)', 'assises', ['cafe'], ('hg', OL, 11, 13, 2, 3)),
    ('table-rouge-d', 'Table rouge et chaises (droite)', 'assises', ['cafe'], ('hg', OL, 22, 13, 2, 3)),
    ('pouf-vert', 'Pouf vert', 'assises', ['maison', 'cafe'], ('item', 'pouf-vert')),
    ('coussin-rouge', 'Coussin rouge', 'assises', ['maison', 'temple'], ('item', 'fsa-coussin-rouge')),
    ('coussin-bleu', 'Coussin bleu', 'assises', ['maison', 'temple'], ('item', 'fsa-coussin-bleu')),
    ('tabouret-bar', 'Tabouret de bar', 'assises', ['cafe'], ('item', 'h-tabouret')),
    ('tabouret-bar-vert', 'Tabouret de bar vert', 'assises', ['cafe'], ('item', 'h-tabouret-vert')),
    ('mange-debout', 'Mange-debout', 'assises', ['cafe'], ('item', 'h-mange-debout')),
    ('table-pub', 'Petite table ronde', 'assises', ['cafe'], ('item', 'h-table-pub')),
    ('table-bois', 'Table en bois', 'assises', ['maison', 'cafe', 'ecole'], ('item', 'h-table-bois')),
    ('table-lecture', 'Table de lecture', 'assises', ['ecole', 'bureau'], ('item', 'h-table-lecture')),
    # Rangements
    ('etagere-verte', 'Étagère verte', 'rangements', ['maison', 'ecole'], ('hg', NB, 17, 11, 2, 2)),
    ('bibliotheque', 'Bibliothèque', 'rangements', ['maison', 'ecole', 'bureau'], ('hg', VS, 23, 9, 2, 2)),
    ('vitrine', 'Vitrine en verre', 'rangements', ['boutique', 'sante', 'bureau'], ('hg', LAB, 10, 12, 2, 4)),
    ('etagere-boutique', 'Étagère de boutique', 'rangements', ['boutique'], ('hg', DS, 45, 8, 2, 3)),
    ('caisses-empilees', 'Caisses en bois empilées', 'rangements', ['atelier', 'boutique'], ('hg', GI, 19, 10, 2, 3)),
    ('pile-caisses', 'Grande pile de caisses', 'rangements', ['atelier'], ('hg', '012i_Goldenrod warehouse', 55, 11, 2, 5)),
    ('sacs-charbon', 'Sacs de charbon', 'rangements', ['atelier'], ('hg', AZ, 20, 10, 1, 2)),
    ('commode-sombre', 'Buffet en bois sombre', 'rangements', ['maison', 'bureau'], ('hg', RT, 26, 58, 2, 3)),
    ('rayonnages', 'Rayonnages de livres', 'rangements', ['ecole', 'bureau'], ('hg', ALPH, 16, 9, 5, 2)),
    ('etagere-haute', 'Étagère haute', 'rangements', ['maison', 'atelier'], ('item', 'fsa-etagere')),
    ('armoire', 'Armoire', 'rangements', ['maison'], ('item', 'fsa-armoire')),
    ('bibliotheque-haute', 'Bibliothèque haute', 'rangements', ['maison', 'ecole', 'bureau'], ('item', 'h-bibliotheque')),
    ('bibliotheque-basse', 'Bibliothèque basse', 'rangements', ['maison', 'ecole', 'bureau'], ('item', 'h-bibliotheque-basse')),
    ('etagere-objets', 'Étagère à objets', 'rangements', ['maison', 'boutique'], ('item', 'h-etagere')),
    ('casiers', 'Casiers', 'rangements', ['ecole'], ('item', 'mc-casiers')),
    ('placard', 'Placard rouge', 'rangements', ['ecole', 'atelier'], ('item', 'mc-placard')),
    ('caisse-bois', 'Caisse en bois', 'rangements', ['atelier', 'boutique'], ('item', 'fsa-caisse-hgss')),
    ('carton', 'Carton', 'rangements', ['maison', 'atelier', 'boutique'], ('item', 'fsa-carton-hgss')),
    ('tonneau', 'Tonneau', 'rangements', ['atelier', 'cafe'], ('item', 'mc-tonneau')),
    ('coffre', 'Coffre', 'rangements', ['maison', 'temple'], ('item', 'pv-coffre')),
    # Cuisine
    ('cuisine-plaques', 'Plan de cuisine et plaques', 'cuisine', ['maison', 'cafe'], ('hg', NB, 30, 12, 2, 2)),
    ('frigo', 'Frigo', 'cuisine', ['maison', 'cafe', 'bureau'], ('hg', NB, 29, 13, 1, 2)),
    ('cuisine-equipee', 'Cuisine équipée', 'cuisine', ['maison'], ('hg', NB, 10, 11, 3, 2)),
    ('cuisiniere', 'Cuisinière', 'cuisine', ['maison', 'cafe'], ('item', 'h-cuisiniere')),
    ('evier-plan', 'Évier et plan de travail', 'cuisine', ['maison', 'cafe'], ('item', 'fsa-cuisine-2')),
    ('bidon-lait', 'Bidon de lait', 'cuisine', ['atelier'], ('item', 'mc-bidon')),
    ('coupe-fruits', 'Coupe de fruits', 'cuisine', ['maison', 'cafe'], ('item', 'fsa-fruits')),
    # Électronique
    ('tele', 'Grande télé', 'electro', ['maison', 'cafe'], ('hg', NB, 34, 12, 2, 2)),
    ('tele-console', 'Télé et console', 'electro', ['maison'], ('hg', NB, 17, 35, 3, 2)),
    ('bureau-ordinateur', 'Bureau avec ordinateur', 'electro', ['maison', 'bureau', 'ecole'], ('hg', NB, 15, 35, 2, 2)),
    ('poste-travail', 'Poste de travail', 'electro', ['bureau'], ('hg', RT, 12, 35, 2, 2)),
    ('bureau-pc-poubelle', 'Bureau, ordinateur et poubelle', 'electro', ['bureau', 'sante'], ('hg', LAB, 13, 6, 3, 3)),
    ('petite-tele', 'Petite télé', 'electro', ['maison'], ('item', 'fsa-tele')),
    ('ordinateur', 'Ordinateur', 'electro', ['bureau', 'ecole'], ('item', 'h-ordinateur')),
    ('platines-dj', 'Platines de DJ', 'electro', ['cafe'], ('item', 'h-dj')),
    ('enceinte', 'Enceinte', 'electro', ['cafe'], ('item', 'h-enceinte')),
    ('batterie', 'Batterie', 'electro', ['cafe'], ('item', 'pv-batterie')),
    ('micro', 'Micro sur pied', 'electro', ['cafe'], ('item', 'pv-micro')),
    ('camera', 'Caméra sur trépied', 'electro', ['bureau'], ('hg', GI, 85, 32, 1, 2)),
    # Plantes
    ('plante-pot', 'Plante en pot', 'plantes', ALL, ('hg', NB, 40, 13, 1, 2)),
    ('petit-arbre', 'Petit arbre en pot', 'plantes', ['maison', 'bureau', 'cafe'], ('hg', GC, 10, 10, 1, 2)),
    ('plante-haute', 'Plante verte haute', 'plantes', ['bureau', 'sante', 'boutique'], ('hg', OL, 20, -8, 1, 2)),
    ('jardiniere-buisson', 'Jardinière', 'plantes', ['boutique', 'bureau'], ('hg', '002i_Gate', 10, 20, 2, 2)),
    ('jardiniere-haute', 'Jardinière haute', 'plantes', ['boutique', 'bureau'], ('hg', '002i_Gate', 10, 11, 2, 3)),
    ('fleurs-roses-orange', 'Pots de fleurs roses et orange', 'plantes', ['maison', 'boutique'], ('hg', GI, 109, 10, 2, 2)),
    ('pot-fleurs-roses', 'Pot de fleurs roses', 'plantes', ['maison', 'boutique', 'cafe'], ('hg', GI, 118, 10, 1, 2)),
    ('trois-pots', 'Trois pots de fleurs', 'plantes', ['boutique'], ('hg', GI, 109, 12, 3, 2)),
    ('pot-fleurs', 'Pot de fleurs', 'plantes', ['maison', 'boutique', 'cafe'], ('hg', GI, 118, 12, 1, 2)),
    ('bac-fleurs', 'Bac à fleurs', 'plantes', ['boutique', 'maison'], ('hg', GI, 109, 14, 2, 2)),
    ('lys', 'Lys blancs', 'plantes', ['boutique', 'temple'], ('hg', GI, 109, 7, 3, 3)),
    ('rangee-plantes', 'Rangée de plantes', 'plantes', ['bureau', 'boutique'], ('hg', DS, 30, 47, 3, 2)),
    ('caisse-raisin', 'Cagette de raisin', 'plantes', ['boutique'], ('hg', GI, 117, 8, 2, 3)),
    ('plante-grasse', 'Plante grasse', 'plantes', ['maison', 'cafe'], ('item', 'fsa-plante-grasse')),
    ('palmier-pot', 'Palmier en pot', 'plantes', ['maison', 'cafe', 'bureau'], ('item', 'h-palmier')),
    ('lotus', 'Lotus', 'plantes', ['temple'], ('item', 'pv-lotus')),
    # Tapis
    ('long-tapis', 'Long tapis orange', 'tapis', ['maison', 'bureau', 'temple'], ('hg', '005i_Route 31 Gate', 11, 15, 8, 3)),
    ('tapis-rouge', 'Tapis rouge', 'tapis', ALL, ('hg', ST, 12, 37, 1, 2)),
    ('tapis-tresse', 'Tapis tressé', 'tapis', ['maison', 'atelier'], ('item', 'fsa-tapis')),
    ('tapis-vert', 'Tapis vert ovale', 'tapis', ['maison', 'cafe'], ('item', 'tapis-vert')),
    ('piste-danse', 'Piste de danse', 'tapis', ['cafe'], ('item', 'h-piste')),
    ('tapis-sortie', 'Tapis de sortie', 'acces', ALL, ('item', 'pv-tapis-sortie')),
    # Déco murale
    ('feuille-mur', 'Feuille punaisée', 'deco', ['ecole', 'bureau', 'sante'], ('hgmur', LAB, 12, 5, 1, 1)),
    ('notes-mur', 'Notes au mur', 'deco', ['bureau', 'sante', 'ecole'], ('hgmur', LAB, 15, 5, 2, 2)),
    ('fenetre-bleue', 'Fenêtre', 'deco', ALL, ('hgmur', '002i_Gate', 10, 8, 3, 3)),
    ('tableau-ecole', 'Tableau d\'école', 'deco', ['ecole'], ('hgmur', VS, 14, 8, 3, 2)),
    ('petite-fenetre', 'Petite fenêtre', 'deco', ['maison', 'atelier'], ('hgmur', AZ, 11, 8, 1, 2)),
    ('tableau-paysage', 'Tableau de paysage', 'deco', ['maison', 'atelier', 'bureau'], ('hgmur', AZ, 18, 25, 2, 2)),
    ('rideaux', 'Rideaux', 'deco', ['cafe', 'maison'], ('hgmur', GC, 11, 9, 4, 3)),
    ('cadre-photo', 'Cadre photo', 'deco', ['maison', 'bureau'], ('hgmur', GC, 16, 9, 1, 2)),
    ('affiche-bleue', 'Affiche colorée', 'deco', ['cafe', 'boutique'], ('hgmur', GI, 66, 6, 3, 2)),
    ('affiche-rose', 'Affiche rose', 'deco', ['cafe', 'boutique'], ('hgmur', GI, 69, 6, 3, 2)),
    ('miroir', 'Miroir', 'deco', ['maison', 'sante'], ('hgmur', GI, 50, 24, 2, 2)),
    ('note-rose', 'Petite affiche', 'deco', ['bureau', 'ecole'], ('hgmur', RT, 14, 32, 1, 1)),
    ('grande-fenetre', 'Grande fenêtre', 'deco', ['bureau', 'boutique'], ('hgmur', RT, 31, 91, 2, 2)),
    ('tableau-montagne', 'Tableau de montagne', 'deco', ['maison', 'bureau'], ('hgmur', ST, 19, 41, 2, 2)),
    ('tableau-encadre', 'Tableau encadré', 'deco', ['bureau', 'maison'], ('hgmur', OL, 19, -34, 2, 2)),
    ('tableau-vert', 'Grand tableau vert', 'deco', ['ecole'], ('item', 'h-tableau-vert')),
    ('carte-monde', 'Carte du monde', 'deco', ['ecole', 'bureau', 'maison'], ('item', 'h-carte')),
    ('tableau-plage', 'Tableau de plage', 'deco', ['maison'], ('item', 'fsa-plage')),
    ('bouee', 'Bouée de sauvetage', 'deco', ['atelier', 'cafe'], ('item', 'fsa-bouee')),
    ('cible', 'Cible de fléchettes', 'deco', ['cafe'], ('item', 'cible')),
    ('etagere-bouteilles', 'Étagère à bouteilles', 'deco', ['cafe'], ('item', 'bouteilles-4')),
    ('neon-verre', 'Néon (verre)', 'deco', ['cafe'], ('item', 'h-neon-rose-verre')),
    ('neon-note', 'Néon (note de musique)', 'deco', ['cafe'], ('item', 'h-neon-cyan-note')),
    ('neon-vague', 'Néon (vague)', 'deco', ['cafe'], ('item', 'h-neon-rose-vague')),
    ('tenture', 'Tenture', 'deco', ['temple'], ('item', 'pv-thangka')),
    ('drapeaux-priere', 'Drapeaux de prière', 'deco', ['temple'], ('item', 'pv-drapeaux-8')),
    ('boule-facettes', 'Boule à facettes', 'deco', ['cafe'], ('item', 'h-boule')),
    # Accès
    ('escalier-descend', 'Escalier qui descend', 'acces', ['maison', 'bureau', 'ecole'], ('hg', NB, 10, 35, 2, 3)),
    ('escalier-monte', 'Escalier qui monte', 'acces', ['maison', 'bureau', 'ecole'], ('hg', NB, 10, 53, 2, 4)),
    ('escalier-rouge', 'Escalier rouge', 'acces', ['boutique', 'bureau'], ('hg', RT, 10, 32, 2, 3)),
    ('escalier-gris', 'Escalier gris', 'acces', ['bureau', 'boutique'], ('hg', ST, 18, 19, 2, 3)),
    ('echelle', 'Échelle', 'acces', ['atelier', 'temple'], ('hg', '006i_Sprout Tower', 28, 9, 3, 4)),
    ('trappe', 'Trappe et échelle', 'acces', ['atelier', 'temple'], ('hg', '006i_Sprout Tower', 59, 11, 3, 3)),
    ('ascenseur', 'Porte d\'ascenseur', 'acces', ['bureau', 'boutique'], ('hg', '013i_Park-Pokéathlon Gate', 12, 8, 3, 4)),
    ('escalier-bois-monte', 'Escalier de bois (monte)', 'acces', ['maison', 'cafe', 'atelier'], ('item', 'escalier-monte')),
    ('escalier-bois-descend', 'Escalier de bois (descend)', 'acces', ['maison', 'cafe', 'atelier'], ('item', 'escalier-descend')),
    ('escalier-clair-monte', 'Escalier clair (monte)', 'acces', ['maison', 'ecole'], ('item', 'escalier-monte-clair')),
    ('escalier-clair-descend', 'Escalier clair (descend)', 'acces', ['maison', 'ecole'], ('item', 'escalier-descend-clair')),
    ('escalier-large-g', 'Large escalier (gauche)', 'acces', ['ecole', 'bureau'], ('item', 'mc-monte-g')),
    ('escalier-large-d', 'Large escalier (droite)', 'acces', ['ecole', 'bureau'], ('item', 'mc-monte-d')),
    # Métiers
    ('comptoir-accueil', 'Comptoir d\'accueil', 'metier', ['bureau', 'sante', 'boutique'], ('hg', NB, 29, 14, 4, 3)),
    ('bureau-prof', 'Bureau du professeur', 'metier', ['ecole'], ('hg', VS, 16, 12, 3, 2)),
    ('long-pupitre', 'Long pupitre (ou banc)', 'metier', ['ecole', 'temple', 'atelier'], ('hg', VS, 14, 10, 3, 2)),
    ('etabli', 'Établi et outils', 'metier', ['atelier'], ('hg', AZ, 10, 27, 6, 4)),
    ('bureau-atelier', 'Bureau d\'atelier', 'metier', ['atelier'], ('hg', AZ, 19, 27, 7, 5)),
    ('comptoir-vitre', 'Comptoir vitré', 'metier', ['boutique', 'cafe'], ('hg', '011i_Daycare', 17, 8, 4, 3)),
    ('comptoir-boutique', 'Comptoir de boutique', 'metier', ['boutique'], ('hg', '011i_Daycare', 10, 9, 5, 6)),
    ('presentoir', 'Présentoir', 'metier', ['boutique'], ('hg', DS, 18, 9, 6, 2)),
    ('grand-bureau', 'Grand bureau en bois', 'metier', ['bureau'], ('hg', RT, 13, 38, 3, 3)),
    ('bureau-directeur', 'Bureau de directeur', 'metier', ['bureau'], ('hg', RT, 30, 58, 4, 4)),
    ('comptoir-ordinateur', 'Comptoir avec ordinateur', 'metier', ['bureau', 'sante', 'ecole'], ('hg', ALPH, 10, 9, 4, 2)),
    ('guichets', 'Guichets', 'metier', ['bureau', 'boutique'], ('hg', OL, 16, 9, 3, 3)),
    ('long-comptoir', 'Long comptoir', 'metier', ['cafe', 'boutique'], ('hg', ST, 28, 16, 7, 3)),
    ('comptoir-bar', 'Comptoir de bar', 'metier', ['cafe'], ('item', 'bar-4')),
    ('pompes-biere', 'Pompes à bière', 'metier', ['cafe'], ('item', 'pompes')),
    ('pintes', 'Pintes de bière', 'metier', ['cafe'], ('item', 'pintes')),
    ('comptoir-cafe', 'Comptoir de café', 'metier', ['cafe'], ('item', 'pv-comptoir-cafe')),
    ('caisse-enregistreuse', 'Caisse enregistreuse', 'metier', ['boutique', 'cafe'], ('item', 'comptoir-caisse')),
    ('menu', 'Menu', 'metier', ['cafe'], ('item', 'pv-menu')),
    ('pupitre-lampe', 'Pupitre à lampe', 'metier', ['ecole', 'bureau'], ('item', 'h-pupitre')),
    ('bureau-maitre', 'Bureau du maître', 'metier', ['ecole'], ('item', 'h-bureau-prof')),
    ('autel', 'Autel', 'metier', ['temple'], ('item', 'pv-autel')),
    ('autel-or', 'Autel doré', 'metier', ['temple'], ('item', 'pv-autel-or')),
    ('statue-doree', 'Statue dorée', 'metier', ['temple'], ('item', 'pv-bouddha')),
    ('statue-blanche', 'Statue blanche', 'metier', ['temple'], ('item', 'pv-bouddha-blanc')),
    ('bougies', 'Rangée de bougies', 'metier', ['temple'], ('item', 'pv-lampes')),
    ('lampe-beurre', 'Lampe à beurre', 'metier', ['temple'], ('item', 'pv-lampe-beurre')),
    ('encens', 'Brûle-encens', 'metier', ['temple'], ('item', 'pv-encens')),
    ('moulin-prieres', 'Moulin à prières', 'metier', ['temple'], ('item', 'pv-moulin')),
    ('ratelier-cannes', 'Râtelier en bois', 'metier', ['atelier'], ('item', 'fsa-ratelier')),
    # Divers
    ('velo-vert', 'Vélo vert', 'divers', ['boutique', 'atelier'], ('hg', GI, 10, 44, 2, 2)),
    ('velo-rouge', 'Vélo rouge', 'divers', ['boutique', 'atelier'], ('hg', GI, 10, 48, 2, 2)),
    ('cle-molette', 'Clé à molette', 'divers', ['atelier'], ('hg', GI, 19, 44, 1, 1)),
    ('bouches', 'Bûches', 'divers', ['atelier'], ('hg', AZ, 20, 12, 1, 1)),
    ('tas-foin', 'Tas de foin', 'divers', ['atelier'], ('item', 'mc-foin')),
    ('ourson', 'Ourson en peluche', 'divers', ['maison'], ('item', 'fsa-ourson')),
    ('ourson-rose', 'Ourson rose', 'divers', ['maison'], ('item', 'fsa-ourson-rose')),
    ('lampe-laiton', 'Lampe en laiton', 'divers', ['maison', 'bureau', 'cafe'], ('item', 'lampe-laiton')),
]
