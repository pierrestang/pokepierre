// Généré par scripts/build_interiors.py (et scripts/interior_models.py) : les intérieurs dessinés en Gen 4
// (voir src/data/maps/interiors.js) ; une pièce qui reprend un modèle partagé (modeles/) y est recomposée.
import { composeInterior } from './compose.js';
import modele_chambre_type_1 from './modeles/chambre-type-1.json' with { type: 'json' };
import modele_maison_type_1 from './modeles/maison-type-1.json' with { type: 'json' };
import modele_maison_type_2 from './modeles/maison-type-2.json' with { type: 'json' };
import agence from './agence.json' with { type: 'json' };
import appartRemi from './appartRemi.json' with { type: 'json' };
import appartement from './appartement.json' with { type: 'json' };
import bonsecours from './bonsecours.json' with { type: 'json' };
import bonsecoursCasiers from './bonsecoursCasiers.json' with { type: 'json' };
import bonsecoursFrancais from './bonsecoursFrancais.json' with { type: 'json' };
import bonsecoursMaths from './bonsecoursMaths.json' with { type: 'json' };
import bonsecoursSciences from './bonsecoursSciences.json' with { type: 'json' };
import boulyBarn from './boulyBarn.json' with { type: 'json' };
import cabane from './cabane.json' with { type: 'json' };
import coffeeShop from './coffeeShop.json' with { type: 'json' };
import corning from './corning.json' with { type: 'json' };
import delhiFort from './delhiFort.json' with { type: 'json' };
import delhiUniversity from './delhiUniversity.json' with { type: 'json' };
import dortoir from './dortoir.json' with { type: 'json' };
import dortoirEtage2 from './dortoirEtage2.json' with { type: 'json' };
import dortoirHall from './dortoirHall.json' with { type: 'json' };
import entreprise from './entreprise.json' with { type: 'json' };
import entrepriseDirecteur from './entrepriseDirecteur.json' with { type: 'json' };
import entrepriseManager from './entrepriseManager.json' with { type: 'json' };
import felixHouse from './felixHouse.json' with { type: 'json' };
import ffHouse from './ffHouse.json' with { type: 'json' };
import ffHouseUp from './ffHouseUp.json' with { type: 'json' };
import ffHut from './ffHut.json' with { type: 'json' };
import hanoiHome from './hanoiHome.json' with { type: 'json' };
import hospital from './hospital.json' with { type: 'json' };
import hullAsylum from './hullAsylum.json' with { type: 'json' };
import hullColoc from './hullColoc.json' with { type: 'json' };
import hullHouse from './hullHouse.json' with { type: 'json' };
import hullLibrary from './hullLibrary.json' with { type: 'json' };
import hullPubA from './hullPubA.json' with { type: 'json' };
import hullPubB from './hullPubB.json' with { type: 'json' };
import hullUniversity from './hullUniversity.json' with { type: 'json' };
import kedge from './kedge.json' with { type: 'json' };
import kedgeCasiers from './kedgeCasiers.json' with { type: 'json' };
import kedgeSalle1 from './kedgeSalle1.json' with { type: 'json' };
import kedgeSalle2 from './kedgeSalle2.json' with { type: 'json' };
import kedgeSalle3 from './kedgeSalle3.json' with { type: 'json' };
import maisonCommune from './maisonCommune.json' with { type: 'json' };
import montHouse from './montHouse.json' with { type: 'json' };
import montHouseUp from './montHouseUp.json' with { type: 'json' };
import parisAppart from './parisAppart.json' with { type: 'json' };
import playerHouse from './playerHouse.json' with { type: 'json' };
import playerHouseUp from './playerHouseUp.json' with { type: 'json' };
import school from './school.json' with { type: 'json' };
import stade from './stade.json' with { type: 'json' };
import studioPaulfit from './studioPaulfit.json' with { type: 'json' };
import temple from './temple.json' with { type: 'json' };
import travelAgency from './travelAgency.json' with { type: 'json' };

export const MODELES = {
  'chambre-type-1': modele_chambre_type_1,
  'maison-type-1': modele_maison_type_1,
  'maison-type-2': modele_maison_type_2,
};

export const BUILT_INTERIORS = {
  agence: composeInterior(agence, MODELES),
  appartRemi: composeInterior(appartRemi, MODELES),
  appartement: composeInterior(appartement, MODELES),
  bonsecours: composeInterior(bonsecours, MODELES),
  bonsecoursCasiers: composeInterior(bonsecoursCasiers, MODELES),
  bonsecoursFrancais: composeInterior(bonsecoursFrancais, MODELES),
  bonsecoursMaths: composeInterior(bonsecoursMaths, MODELES),
  bonsecoursSciences: composeInterior(bonsecoursSciences, MODELES),
  boulyBarn: composeInterior(boulyBarn, MODELES),
  cabane: composeInterior(cabane, MODELES),
  coffeeShop: composeInterior(coffeeShop, MODELES),
  corning: composeInterior(corning, MODELES),
  delhiFort: composeInterior(delhiFort, MODELES),
  delhiUniversity: composeInterior(delhiUniversity, MODELES),
  dortoir: composeInterior(dortoir, MODELES),
  dortoirEtage2: composeInterior(dortoirEtage2, MODELES),
  dortoirHall: composeInterior(dortoirHall, MODELES),
  entreprise: composeInterior(entreprise, MODELES),
  entrepriseDirecteur: composeInterior(entrepriseDirecteur, MODELES),
  entrepriseManager: composeInterior(entrepriseManager, MODELES),
  felixHouse: composeInterior(felixHouse, MODELES),
  ffHouse: composeInterior(ffHouse, MODELES),
  ffHouseUp: composeInterior(ffHouseUp, MODELES),
  ffHut: composeInterior(ffHut, MODELES),
  hanoiHome: composeInterior(hanoiHome, MODELES),
  hospital: composeInterior(hospital, MODELES),
  hullAsylum: composeInterior(hullAsylum, MODELES),
  hullColoc: composeInterior(hullColoc, MODELES),
  hullHouse: composeInterior(hullHouse, MODELES),
  hullLibrary: composeInterior(hullLibrary, MODELES),
  hullPubA: composeInterior(hullPubA, MODELES),
  hullPubB: composeInterior(hullPubB, MODELES),
  hullUniversity: composeInterior(hullUniversity, MODELES),
  kedge: composeInterior(kedge, MODELES),
  kedgeCasiers: composeInterior(kedgeCasiers, MODELES),
  kedgeSalle1: composeInterior(kedgeSalle1, MODELES),
  kedgeSalle2: composeInterior(kedgeSalle2, MODELES),
  kedgeSalle3: composeInterior(kedgeSalle3, MODELES),
  maisonCommune: composeInterior(maisonCommune, MODELES),
  montHouse: composeInterior(montHouse, MODELES),
  montHouseUp: composeInterior(montHouseUp, MODELES),
  parisAppart: composeInterior(parisAppart, MODELES),
  playerHouse: composeInterior(playerHouse, MODELES),
  playerHouseUp: composeInterior(playerHouseUp, MODELES),
  school: composeInterior(school, MODELES),
  stade: composeInterior(stade, MODELES),
  studioPaulfit: composeInterior(studioPaulfit, MODELES),
  temple: composeInterior(temple, MODELES),
  travelAgency: composeInterior(travelAgency, MODELES),
};
