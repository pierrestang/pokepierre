// Le désordre du lendemain de la soirée de Bordeaux (scripts/build_party_mess.py -> public/assets/props/desordre.png) :
// des images posées au sol, comme objets (props `type: 'image'`, bloquants, qu'on ramasse) ou décors (decals `image`).
export const MESS_SHEET = 'desordre';
// Nom de l'image -> [x, largeur] dans la planche (hauteur : 16 px).
const MESS_FRAMES = {
  gobelets: [0, 16], canettes: [16, 16], pizza: [32, 16], chips: [48, 16], bouteilles: [64, 16], confettis: [80, 16],
  couette: [96, 32],
};

export function preloadPartyMess(scene) {
  scene.load.image(MESS_SHEET, `${import.meta.env.BASE_URL}assets/props/desordre.png`);
}

// Image `name` de la planche (le cadre est créé au premier usage).
export function messFrame(scene, name) {
  const tex = scene.textures.get(MESS_SHEET);
  if (!tex.has(name)) tex.add(name, 0, MESS_FRAMES[name][0], 0, MESS_FRAMES[name][1], 16);
  return name;
}
