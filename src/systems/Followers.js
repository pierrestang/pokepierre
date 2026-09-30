import { CharacterSprite, tileCenter } from './CharacterSprite.js';
import { lookOf } from '../data/characters.js';

import { WALK_DURATION } from './Player.js';

// File de personnages qui suivent le joueur : à chaque pas du joueur, le premier prend
// la case qu'il quitte, le deuxième celle du premier, etc. Non bloquants.
export class Followers {
  constructor(scene) {
    this.scene = scene;
    this.members = [];
  }

  // Aligne la file sur `list` ([{ id, color }]). Les nouveaux venus apparaissent à `startAt(id)`.
  sync(list, startAt) {
    const ids = list.map((f) => f.id);
    this.members = this.members.filter((m) => {
      if (ids.includes(m.id)) return true;
      m.sprite.destroy();
      return false;
    });
    for (const f of list) {
      if (this.members.some((m) => m.id === f.id)) continue;
      const { x, y, facing = 'down' } = startAt(f.id);
      const sprite = new CharacterSprite(this.scene, x, y, lookOf(f), facing);
      this.members.push({ id: f.id, x, y, sprite });
    }
    this.members.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  }

  // Le meneur (joueur) quitte la case (x, y) ; `duration` : durée de son pas (marche ou course).
  advance(x, y, duration = WALK_DURATION) {
    let tx = x;
    let ty = y;
    for (const m of this.members) {
      const ox = m.x;
      const oy = m.y;
      if (ox !== tx || oy !== ty) {
        const dx = tx - ox;
        const dy = ty - oy;
        m.sprite.setFacing(Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        const [px, py] = tileCenter(tx, ty);
        m.sprite.walkStep(duration);
        this.scene.tweens.add({
          targets: m.sprite, x: px, y: py, duration,
          onUpdate: () => m.sprite.updateDepth(),
        });
        m.x = tx;
        m.y = ty;
      }
      tx = ox;
      ty = oy;
    }
  }
}
