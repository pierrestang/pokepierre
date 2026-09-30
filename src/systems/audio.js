// Son façon Game Boy Advance, entièrement synthétisé (aucun fichier audio, aucune musique Nintendo) :
// deux voix « pulse » (ondes carrées à rapport cyclique réglable), une basse triangle et un bruit blanc
// pour les percussions. Musiques originales en boucle + bruitages courts.
// Le navigateur n'autorise le son qu'après une action du joueur : tout démarre au premier appui.

const OPTIONS_KEY = 'pokepierre.options';

function loadOptions() {
  try {
    return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(OPTIONS_KEY)) };
  } catch {
    return { music: true, sfx: true };
  }
}

export const options = loadOptions();

export function saveOptions() {
  try {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
  } catch {
    // stockage indisponible : options pour cette session seulement
  }
}

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
const waves = {};

function init() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = options.music ? 0.55 : 0;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = options.sfx ? 0.8 : 0;
  sfxBus.connect(master);
  // Ondes « pulse » à 12,5 %, 25 % et 50 % (série de Fourier), comme les voix carrées de la console.
  for (const duty of [0.125, 0.25, 0.5]) {
    const n = 32;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    waves[duty] = ctx.createPeriodicWave(real, imag);
  }
  return ctx;
}

// À appeler sur un geste du joueur (clavier, clic, toucher).
export function unlockAudio() {
  const c = init();
  if (!c) return;
  // resume() est asynchrone : on attend que le son soit vraiment actif avant de lancer la musique
  // en attente et le ressac demandé avant le premier appui.
  const start = () => {
    if (pendingSong) {
      const s = pendingSong;
      pendingSong = null;
      playMusic(s);
    }
    if (seaOn) setSeaAmbience(true);
  };
  if (c.state === 'running') start();
  else c.resume().then(start);
}
['keydown', 'pointerdown', 'touchstart'].forEach((type) => window.addEventListener(type, unlockAudio, { passive: true }));

export function setMusicEnabled(on) {
  options.music = on;
  saveOptions();
  if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.05);
}

export function setSfxEnabled(on) {
  options.sfx = on;
  saveOptions();
  if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.05);
  if (seaGain) seaGain.gain.setTargetAtTime(on && seaOn ? 0.05 : 0, ctx.currentTime, 0.3);
}

// ---------- Notes ----------

const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(note) {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  const midi = (Number(m[2]) + 1) * 12 + NOTE_INDEX[m[1]];
  return 440 * 2 ** ((midi - 69) / 12);
}

// Une note : oscillateur + enveloppe (attaque nette, léger déclin, relâche courte).
function tone(bus, { type = 'pulse', duty = 0.5, f, start, dur, vol = 0.2, slide = 0, decay = 0.6, vibrato = false }) {
  const osc = ctx.createOscillator();
  if (type === 'pulse') osc.setPeriodicWave(waves[duty]);
  else osc.type = type;
  osc.frequency.setValueAtTime(f, start);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), start + dur);
  if (vibrato && dur > 0.3) {
    // Vibrato qui s'installe après l'attaque, comme sur les notes tenues de la console.
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, start);
    depth.gain.linearRampToValueAtTime(f * 0.012, start + 0.25);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(start);
    lfo.stop(start + dur + 0.02);
  }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.005);
  g.gain.linearRampToValueAtTime(vol * decay, start + Math.min(dur * 0.6, 0.12));
  g.gain.setValueAtTime(vol * decay, start + dur - 0.02);
  g.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(g).connect(bus);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

let noiseBuffer = null;
function noise(bus, { start, dur, vol = 0.1, filter = 'highpass', cutoff = 4000 }) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(start, Math.random() * 0.5);
  src.stop(start + dur + 0.02);
}

// ---------- Musiques (compositions originales, dans l'esprit des jeux Pokémon) ----------
// Procédés typiques de la Game Boy Advance : mélodie en onde carrée avec vibrato sur les notes tenues,
// voix d'écho (la même mélodie, décalée et plus douce), arpèges rapides des accords, basse qui saute
// d'octave, caisse claire sur les temps 2 et 4.
// Chaque piste : suite de [note | null (silence), durée en croches]. Aucun air existant n'est repris.

const r = null;
// Thème de l'île (ville de départ) : ré majeur, chaleureux et entraînant.
const ISLAND_LEAD = [
  // A
  ['A4', 2], ['D5', 2], ['F#5', 3], ['E5', 1],
  ['D5', 2], ['C#5', 1], ['D5', 1], ['E5', 4],
  ['F#5', 2], ['G5', 1], ['A5', 1], ['B5', 2], ['A5', 2],
  ['F#5', 6], [r, 2],
  ['G5', 2], ['F#5', 1], ['E5', 1], ['D5', 2], ['B4', 2],
  ['C#5', 2], ['D5', 1], ['E5', 1], ['A4', 4],
  ['B4', 2], ['C#5', 2], ['D5', 2], ['E5', 2],
  ['D5', 6], [r, 2],
  // B
  ['B4', 1], ['C#5', 1], ['D5', 2], ['D5', 1], ['E5', 1], ['F#5', 2],
  ['G5', 3], ['F#5', 1], ['E5', 4],
  ['A5', 2], ['G5', 1], ['F#5', 1], ['E5', 2], ['D5', 2],
  ['E5', 6], [r, 2],
  ['A4', 2], ['D5', 2], ['F#5', 3], ['G5', 1],
  ['A5', 2], ['B5', 1], ['A5', 1], ['F#5', 4],
  ['G5', 2], ['E5', 2], ['C#5', 2], ['E5', 2],
  ['D5', 6], [r, 2],
];
const ISLAND_CHORDS = ['D', 'A', 'G', 'D', 'G', 'A', 'G', 'D', 'Bm', 'G', 'F#m', 'A', 'D', 'G', 'A', 'D'];

// Thème de l'écran titre : plus solennel, en sol majeur, grandes notes tenues.
const TITLE_LEAD = [
  ['D5', 3], ['G5', 1], ['G5', 2], ['A5', 2],
  ['B5', 6], ['A5', 2],
  ['G5', 3], ['E5', 1], ['E5', 2], ['G5', 2],
  ['D5', 6], [r, 2],
  ['C5', 3], ['E5', 1], ['G5', 2], ['C6', 2],
  ['B5', 3], ['A5', 1], ['G5', 4],
  ['A5', 2], ['F#5', 2], ['D5', 2], ['F#5', 2],
  ['G5', 6], [r, 2],
];
const TITLE_CHORDS = ['G', 'Em', 'C', 'D', 'C', 'G', 'D', 'G'];

// Thème de la maison : berceuse posée, en ré majeur.
const HOME_LEAD = [
  ['F#4', 2], ['A4', 2], ['D5', 3], ['C#5', 1],
  ['B4', 2], ['A4', 2], ['F#4', 4],
  ['G4', 2], ['B4', 2], ['E5', 3], ['D5', 1],
  ['C#5', 2], ['B4', 2], ['A4', 4],
  ['F#4', 2], ['A4', 2], ['D5', 3], ['E5', 1],
  ['F#5', 2], ['E5', 2], ['D5', 4],
  ['B4', 2], ['C#5', 2], ['E5', 2], ['C#5', 2],
  ['D5', 6], [r, 2],
];
const HOME_CHORDS = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'D'];

const CHORDS = {
  C: ['C', 'E', 'G'], D: ['D', 'F#', 'A'], E: ['E', 'G#', 'B'], F: ['F', 'A', 'C'], G: ['G', 'B', 'D'], A: ['A', 'C#', 'E'],
  Am: ['A', 'C', 'E'], Bm: ['B', 'D', 'F#'], Dm: ['D', 'F', 'A'], Em: ['E', 'G', 'B'], 'F#m': ['F#', 'A', 'C#'],
};

const SONGS = {
  island: { tempo: 132, lead: ISLAND_LEAD, chords: ISLAND_CHORDS, duty: 0.25, drums: true, leadVol: 0.12, arp: true },
  title: { tempo: 104, lead: TITLE_LEAD, chords: TITLE_CHORDS, duty: 0.5, drums: true, leadVol: 0.12, arp: true },
  home: { tempo: 92, lead: HOME_LEAD, chords: HOME_CHORDS, duty: 0.125, drums: false, leadVol: 0.1, arp: true },
};

let current = null;       // { name, timer, ... }
let pendingSong = null;

export function playMusic(name) {
  if (current?.name === name) return;
  stopMusic();
  if (!ctx || ctx.state !== 'running') {
    pendingSong = name;                                              // démarrera au premier appui
    return;
  }
  const song = SONGS[name];
  const eighth = 60 / song.tempo / 2;
  // Ordonnancement : pistes aplaties en événements, programmés un peu à l'avance.
  const events = [];
  let t = 0;
  for (const [note, len] of song.lead) {
    if (note) events.push({ t, kind: 'lead', note, len });
    t += len;
  }
  const total = t;
  song.chords.forEach((chord, bar) => {
    const [root, third, fifth] = CHORDS[chord];
    const b = bar * 8;
    // Basse : croches qui sautent d'octave (grave / aigu).
    for (let i = 0; i < 8; i++) events.push({ t: b + i, kind: 'bass', note: `${root}${i % 2 ? 3 : 2}`, len: 0.9 });
    // Arpèges rapides (doubles croches) de l'accord, en fond.
    if (song.arp) {
      const tones = [`${root}4`, `${third}4`, `${fifth}4`, `${third}4`];
      for (let i = 0; i < 16; i++) events.push({ t: b + i / 2, kind: 'arp', note: tones[i % 4], len: 0.45 });
    }
    if (song.drums) {
      for (let i = 0; i < 8; i++) {
        events.push({ t: b + i, kind: 'hat' });
        if (i === 0 || i === 4) events.push({ t: b + i, kind: 'kick' });
        if (i === 2 || i === 6) events.push({ t: b + i, kind: 'snare' });
      }
      if (bar % 4 === 3) events.push({ t: b + 7.5, kind: 'snare' });          // petite relance
    }
  });
  events.sort((a, b) => a.t - b.t);

  const state = { name, loopStart: ctx.currentTime + 0.1, index: 0 };
  const schedule = () => {
    const horizon = ctx.currentTime + 0.2;
    for (;;) {
      const e = events[state.index];
      const at = state.loopStart + e.t * eighth;
      if (at > horizon) break;
      const dur = (e.len ?? 0.5) * eighth;
      if (e.kind === 'lead') {
        tone(musicBus, { duty: song.duty, f: freq(e.note), start: at, dur: dur * 0.94, vol: song.leadVol, vibrato: true });
        // Écho : même note, un peu plus tard, plus douce et plus fine.
        tone(musicBus, { duty: 0.125, f: freq(e.note), start: at + eighth * 0.75, dur: dur * 0.9, vol: song.leadVol * 0.35, vibrato: true });
      } else if (e.kind === 'arp') tone(musicBus, { duty: 0.125, f: freq(e.note), start: at, dur, vol: 0.03, decay: 0.5 });
      else if (e.kind === 'bass') tone(musicBus, { type: 'triangle', f: freq(e.note), start: at, dur, vol: 0.22, decay: 0.85 });
      else if (e.kind === 'hat') noise(musicBus, { start: at, dur: 0.03, vol: 0.02, cutoff: 8000 });
      else if (e.kind === 'snare') noise(musicBus, { start: at, dur: 0.1, vol: 0.06, filter: 'bandpass', cutoff: 2200 });
      else if (e.kind === 'kick') tone(musicBus, { type: 'sine', f: 110, start: at, dur: 0.12, vol: 0.25, slide: 0.35, decay: 0.3 });
      state.index++;
      if (state.index >= events.length) {
        state.index = 0;
        state.loopStart += total * eighth;
      }
    }
  };
  schedule();
  state.timer = setInterval(schedule, 50);
  current = state;
}

export function stopMusic() {
  pendingSong = null;
  if (current) clearInterval(current.timer);
  current = null;
}

// ---------- Ambiance : ressac ----------

let seaSource = null;
let seaGain = null;
let seaOn = false;

// Bruit des vagues en fond (bruit filtré dont le volume ondule lentement).
export function setSeaAmbience(on) {
  seaOn = on;
  if (!ctx) return;
  if (!seaSource) {
    const len = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.sin((i / len) * Math.PI * 2 * 2) ** 2);
    seaSource = ctx.createBufferSource();
    seaSource.buffer = buffer;
    seaSource.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 700;
    seaGain = ctx.createGain();
    seaGain.gain.value = 0;
    seaSource.connect(f).connect(seaGain).connect(master);
    seaSource.start();
  }
  seaGain.gain.setTargetAtTime(on && options.sfx ? 0.05 : 0, ctx.currentTime, 0.4);
}

// ---------- Bruitages ----------

const SFX = {
  // Petit « bip » du texte qui s'affiche
  blip: (t) => tone(sfxBus, { duty: 0.5, f: 1320, start: t, dur: 0.025, vol: 0.05 }),
  // Déplacement dans un menu
  select: (t) => tone(sfxBus, { duty: 0.25, f: 1760, start: t, dur: 0.035, vol: 0.08 }),
  // Validation
  confirm: (t) => {
    tone(sfxBus, { duty: 0.25, f: 988, start: t, dur: 0.05, vol: 0.09 });
    tone(sfxBus, { duty: 0.25, f: 1480, start: t + 0.05, dur: 0.07, vol: 0.09 });
  },
  // Ouverture du menu
  menu: (t) => {
    tone(sfxBus, { duty: 0.5, f: 1175, start: t, dur: 0.04, vol: 0.08 });
    tone(sfxBus, { duty: 0.5, f: 1568, start: t + 0.04, dur: 0.05, vol: 0.08 });
  },
  // On fonce dans un mur
  bump: (t) => tone(sfxBus, { duty: 0.5, f: 150, start: t, dur: 0.09, vol: 0.14, slide: 0.6 }),
  // Porte qui s'ouvre, puis pas vers l'intérieur
  door: (t) => {
    noise(sfxBus, { start: t, dur: 0.12, vol: 0.12, filter: 'lowpass', cutoff: 1200 });
    tone(sfxBus, { duty: 0.5, f: 220, start: t + 0.02, dur: 0.12, vol: 0.1, slide: 0.7 });
    tone(sfxBus, { duty: 0.5, f: 330, start: t + 0.14, dur: 0.1, vol: 0.08, slide: 0.8 });
  },
  // Escalier
  stairs: (t) => {
    for (let i = 0; i < 3; i++) tone(sfxBus, { duty: 0.5, f: 440 + i * 110, start: t + i * 0.07, dur: 0.05, vol: 0.08 });
  },
  // Hautes herbes froissées
  rustle: (t) => noise(sfxBus, { start: t, dur: 0.09, vol: 0.09, filter: 'bandpass', cutoff: 3200 }),
  // Objet ou souvenir obtenu : petite fanfare
  item: (t) => {
    [['C5', 0], ['E5', 0.1], ['G5', 0.2], ['C6', 0.3]].forEach(([n, d]) =>
      tone(sfxBus, { duty: 0.25, f: freq(n), start: t + d, dur: d === 0.3 ? 0.35 : 0.1, vol: 0.12 }));
    tone(sfxBus, { type: 'triangle', f: freq('C3'), start: t, dur: 0.65, vol: 0.18 });
  },
  // Partie sauvegardée
  save: (t) => {
    [['G5', 0], ['C6', 0.09], ['E6', 0.18]].forEach(([n, d]) => tone(sfxBus, { duty: 0.125, f: freq(n), start: t + d, dur: 0.12, vol: 0.1 }));
  },
};

export function sfx(name) {
  if (!ctx || ctx.state !== 'running') return;
  SFX[name]?.(ctx.currentTime + 0.005);
}
