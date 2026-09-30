import { fullLook, lookFromColor } from '../art/characterArt.js';

// Apparence des personnages (voir art/characterArt.js pour les champs possibles).

// Pierre : brun, veste bordeaux fermée (col de t-shirt blanc), pantalon bleu foncé, baskets blanches
// à liseré rouge, sac à dos d'aventurier.
export const PIERRE = {
  skin: 0xf0c8a0,
  hair: 0x4a2c18,
  hairStyle: 'short',
  top: 0x8c2438,
  topStyle: 'closedJacket',
  under: 0xf8f8f8,
  bottom: 0x28345c,
  bottomStyle: 'pants',
  shoes: 0xf4f4f4,
  backpack: 0x3c5c7c,
};

// Personnages principaux, par nom affiché.
const BY_NAME = {
  Maman:   { hair: 0x6c3c20, hairStyle: 'long', top: 0xe86fa0, topStyle: 'dress', bottom: 0xc84c80, bottomStyle: 'skirt' },
  Papa:    { hair: 0x2c2420, top: 0x3f6fd8, bottom: 0x5c5c64, accessory: 'glasses' },
  Manon:   { hair: 0x8c4c20, hairStyle: 'ponytail', top: 0xf0a030, bottom: 0x3c5c9c, bottomStyle: 'skirt' },
  Jean:    { hair: 0x4a2c18, top: 0x3c7c5c, bottom: 0x3c4c6c },
  Yanis:   { skin: 0xd8a070, hair: 0x201818, top: 0xe8c040, bottom: 0x3c3c4c },
  Felix:   { hair: 0xd8b060, top: 0x9060d0, bottom: 0x3c3c4c },
  Romain:  { hair: 0x6c4020, top: 0xc0602c, bottom: 0x2c3c5c },
  Paul:    { hair: 0xc8a060, top: 0x3c8cb0, bottom: 0x4c4c54 },
  Ousmane: { skin: 0x8c5c3c, hair: 0x181414, top: 0x2c8c5c, bottom: 0x2c2c34 },
  Harsh:   { skin: 0xb07850, hair: 0x181414, top: 0x8c3cb0, bottom: 0xe8e0d0 },
  Fanny:   { hair: 0xa86030, hairStyle: 'long', top: 0x40b0a0 },
  'Hôtesse':   { hair: 0x2c2020, hairStyle: 'long', top: 0x2c5cb0, bottom: 0x2c3c6c, bottomStyle: 'skirt' },
  Cuisinier:   { hair: 0x5c3c20, top: 0xf8f8f8, bottom: 0x303038, accessory: 'chefHat' },
  Capitaine:   { hair: 0x3c3020, top: 0x5c6c3c, bottom: 0x4c5c34, accessory: 'cap', capColor: 0x3c4c2c },
  'Vieux sage': { skin: 0xc89060, hair: 0xe8e8e8, hairStyle: 'long', top: 0xf0e8d8, bottom: 0xf0e8d8 },
  Moine:       { skin: 0xc89060, hairStyle: 'bald', top: 0xe88820, bottom: 0xe88820 },
};

// Prénoms féminins sans apparence détaillée : cheveux longs par défaut.
const LONG_HAIR = ['Margot', 'Val', 'Anna', 'Directrice', 'Professeure', "Professeure d'anglais", 'Pèlerine', 'Fan'];

// Apparence d'un PNJ ou d'un suiveur : `look` explicite, sinon par nom, sinon d'après sa couleur.
export function lookOf(data) {
  if (data.look) return fullLook(data.look);
  if (data.id === 'chat') return fullLook({ kind: 'cat' });
  const named = BY_NAME[data.name] ?? BY_NAME[capitalize(data.id)];
  if (named) return fullLook({ ...named, accessory: data.hat ? 'mortarboard' : named.accessory ?? null });
  const look = lookFromColor(data.color ?? 0x4c7cc8, { hat: data.hat });
  if (LONG_HAIR.includes(data.name)) look.hairStyle = 'long';
  return look;
}

function capitalize(id = '') {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
