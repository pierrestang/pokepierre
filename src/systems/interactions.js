import { souvenirs } from './souvenirs.js';
import { flags } from './flags.js';
import { items } from './items.js';

// Parler à un PNJ ou examiner un objet.
// Cible : { name?, dialogue: [pages], after?: [pages], souvenir?: { id, name }, item?: { id, name }, setFlag? }
//  - `dialogue` : texte normal ;
//  - `after` : texte une fois le souvenir obtenu / le drapeau levé (sinon on répète `dialogue`) ;
//  - `souvenir` : donné à la fin du premier dialogue ;
//  - `item` : objet remis à la fin du premier dialogue (clés, diplôme…) ;
//  - `setFlag` : drapeau d'histoire levé à la fin du dialogue (fait avancer l'histoire) ;
//  - `receive` : { item, dialogue, setFlag } — si le joueur a cet objet, il le donne :
//    on affiche `receive.dialogue`, l'objet quitte l'inventaire et `receive.setFlag` est levé.
// Renvoie true si un drapeau vient d'être levé (la scène doit alors rafraîchir ses personnages).
export async function interact(dialog, target) {
  const { receive } = target;
  if (receive && !flags.has(receive.setFlag) && items.has(receive.item.id)) {
    await dialog.open(receive.dialogue, { speaker: target.name });
    items.remove(receive.item.id);
    await dialog.open([`Tu as donné : ${receive.item.name}.`]);
    flags.add(receive.setFlag);
    return true;
  }

  const { souvenir, item, setFlag } = target;
  const done =
    (souvenir && souvenirs.has(souvenir.id)) ||
    (item && items.has(item.id)) ||
    (setFlag && flags.has(setFlag)) ||
    (receive && flags.has(receive.setFlag));
  const pages = (done && target.after) || target.dialogue;

  if (pages) await dialog.open(pages, { speaker: target.name });

  if (souvenir) await giveSouvenir(dialog, souvenir);
  // Objet remis une seule fois (même s'il a été donné depuis, si `setFlag` marque l'échange).
  if (item && !done && items.add(item)) await dialog.open([`Tu as obtenu : ${item.name} !`]);
  if (setFlag && !flags.has(setFlag)) {
    flags.add(setFlag);
    return true;
  }
  return false;
}

// Donne un souvenir (s'il est nouveau) avec le message d'obtention.
export async function giveSouvenir(dialog, souvenir) {
  if (souvenirs.add(souvenir)) {
    await dialog.open([`Tu as obtenu un souvenir : ${souvenir.name} !`]);
  }
}
