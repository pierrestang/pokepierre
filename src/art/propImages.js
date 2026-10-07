// Objets des cartes en image (props `image: '<nom>'`) : dessinés dans le style Gen 4 par scripts/build_props.py vers
// public/assets/props/<nom>.png. L'image est posée au milieu du bas de l'emprise du prop, triée en profondeur avec les
// personnages (on passe derrière ce qui dépasse au-dessus).
export const PROP_IMAGES = ['tracteur', 'caisse-outils'];

export const propKey = (name) => `prop-${name}`;

export function preloadPropImages(scene) {
  for (const name of PROP_IMAGES) scene.load.image(propKey(name), `${import.meta.env.BASE_URL}assets/props/${name}.png`);
}
