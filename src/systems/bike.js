import { items } from './items.js';
import { ITEMS } from '../data/story.js';
import { sfx, playMusic } from './audio.js';

// Le vélo de Pierre, comme dans Pokémon : il roule bien plus vite qu'il ne court (Player.BIKE_DURATION).
// - Il faut l'objet Vélo (ITEMS.velo) : à Bordeaux, le cycliste du quai l'offre (facultatif, bordeauxStory.js CYCLIST) ;
//   ?velo dans l'adresse le donne pour essayer.
// - Monter ou descendre : touche V (ou B), entrée VÉLO du menu Start, bouton VÉLO des commandes tactiles.
// - Seulement dehors : dans un bâtiment on descend (et on reste à pied en ressortant, comme dans Diamant / Perle) ;
//   pas quand quelqu'un suit Pierre (on descend s'il se met à le suivre) ; pendant une scénette, Pierre descend et
//   remonte à la fin.
// - Musique du vélo tant qu'on roule ; l'état est sauvegardé (une partie reprise dehors repart à vélo).
const STORAGE_KEY = 'pokepierre.velo';

export const hasBike = () => items.has(ITEMS.velo.id);

function wanted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function remember(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    // Stockage indisponible : l'état reste en mémoire.
  }
}

// Donne le vélo pour l'essayer (?velo dans l'adresse).
export function giveBikeForTesting() {
  if (new URLSearchParams(window.location.search).has('velo')) items.add(ITEMS.velo);
}

// Pourquoi Pierre ne peut pas monter ici (une réplique), ou null.
export function bikeRefusal(scene) {
  if (!hasBike()) return null;
  if (scene.scene.key !== 'Overworld') return ['Pas de vélo à l\'intérieur !'];
  if (scene.followers?.members.length) return ['Ce n\'est pas le moment de monter sur ton vélo : on t\'accompagne.'];
  return null;
}

// `music` : la musique du vélo (ou celle du lieu en descendant) ; pas pour une courte pause pendant une scénette.
function ride(scene, on, music = true) {
  scene.player.setRiding(on);
  if (!music) return;
  if (on) playMusic('velo');
  else scene.playPlaceMusic?.();
}

// Touche V, menu Start, bouton tactile : monter ou descendre.
export async function toggleBike(scene) {
  if (!hasBike() || scene.player.moving) return;
  if (scene.player.riding) {
    remember(false);
    ride(scene, false);
    return;
  }
  const refusal = bikeRefusal(scene);
  if (refusal) {
    await scene.dialog.open(refusal);
    return;
  }
  sfx('sonnette');
  remember(true);
  ride(scene, true);
}

// À l'arrivée sur une carte : on reprend le vélo si on roulait (dehors, seul), on reste à pied dans un bâtiment.
export function resumeBike(scene) {
  if (!hasBike() || !wanted()) return;
  if (scene.scene.key !== 'Overworld') {
    remember(false);
    return;
  }
  if (!bikeRefusal(scene)) ride(scene, true);
}

// Quelqu'un se met à suivre Pierre : il descend.
export function checkBike(scene) {
  if (scene.player?.riding && bikeRefusal(scene)) {
    remember(false);
    ride(scene, false);
  }
}

// Pendant une scénette, Pierre descend ; il remonte à la fin s'il le peut encore.
export function pauseBike(scene) {
  if (!scene.player.riding) return false;
  ride(scene, false, false);
  return true;
}

export function unpauseBike(scene) {
  if (scene.transitioning) return;
  if (hasBike() && wanted() && !bikeRefusal(scene)) ride(scene, true, false);
  else {
    remember(false);
    scene.playPlaceMusic?.();
  }
}
