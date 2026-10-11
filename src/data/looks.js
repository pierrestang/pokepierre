// Apparence des personnages par nom affiché : des sprites de la quatrième génération, `g{n}` (liste et noms dans
// public/assets/characters/gen4-npcs.json, classement homme / femme / âge dans data/spriteTags.js). Module sans Phaser :
// le jeu (data/characters.js), le créateur (panneau PNJ) et scripts/check_paths.js le lisent.
// Les choix faits dans le créateur (src/data/characterLooks.json) passent avant.

// Personnages par nom affiché (gen4-npcs.json : g126 maman, g138 Prof. Sorbier, g32 marin…).
export const BY_NAME = {
  Pierre: 'g198',
  // Famille
  Maman: 'g126', Papa: 'g119', Manon: 'g57',
  // Amis (garçons : jeunes gens des villes de Sinnoh et Johto ; filles : idem)
  Jean: 'g52', Felix: 'g93', Romain: 'g92', Prophecy: 'g94', Yanis: 'g96', Ousmane: 'g105', Harsh: 'g83',
  'Léo': 'g55', Tanguy: 'g56', Geoffrey: 'g41', Thomas: 'g90', Hugues: 'g121', Dalil: 'g2',
  Tam: 'g182', Louis: 'g155', Philippe: 'g6', Nico: 'g7',
  // Paris, les collègues de la tour (jeunes adultes) ; « Camille (Paris) » : la collègue (lookName). (La fille de la
  // classe de Pierre au collège s'appelle Clélia.)
  Guillaume: 'g4', Anthony: 'g105', Antoine: 'g98', Quentin: 'g139',
  Andrea: 'g1', Mariana: 'g113', Yasmine: 'g50', 'Camille (Paris)': 'g130', Yalin: 'g5',
  'Benoît': 'g38', 'Étienne': 'g14', Joshua: 'g18',
  Margaux: 'g43', 'Rémy': 'g109', 'Rémi': 'g140', Paul: 'g86', 'Clélia': 'g25', Val: 'g42', Anna: 'g24', Fanny: 'g153',
  Charlotte: 'g43', 'Anaïs': 'g107', Anais: 'g107',
  // Métiers
  'M. Bouly': 'g33', Militaire: 'g87', Directeur: 'g120', 'Directeur (Paris)': 'g123', Directrice: 'g37', Principale: 'g37', Sentinelle: 'g87',
  Manager: 'g122', Responsable: 'g36', 'Agent immobilier': 'g35', Vendeur: 'g112', Chanteur: 'g69', Serveur: 'g63',
  'Capitaine du ferry': 'g118', 'Vieux pêcheur': 'g67', 'Vieux sage': 'g71',
  Capitaine: 'g87', Surveillant: 'g52', Professor: 'g136', Professeur: 'g138', Professeure: 'g54',
  "Professeure d'anglais": 'g106', 'Hôtesse': 'g64', Promeneuse: 'g82', Gamin: 'g58', Barman: 'g101', Leo: 'g140',
};

// Figurants sans attribution (ex. les diplômés, les touristes) : choisis d'après leur id et leur place.
// Aucun n'est le sprite d'un personnage nommé (sinon un figurant lui ressemblerait) : à vérifier en changeant BY_NAME.
export const EXTRAS = ['g8', 'g40', 'g81', 'g91', 'g117', 'g124', 'g146', 'g151', 'g160', 'g164',
  'g135', 'g142', 'g163', 'g170', 'g180'];

