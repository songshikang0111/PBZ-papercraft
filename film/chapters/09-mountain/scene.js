// 第九章 · 断魂山 (Mount Soulrend), v2, the finale. A snowy pass climbs between white cliffs and snow pines: the
// crusher and the saw (力者与锯者), the dream warden (冷荼), the Holy Mother (梦华圣母); at the top, in rain, a courtyard
// gate between walls and stands of bamboo, where 左殇 the Shadow Sovereign fights with a golden sword (the golden burst,
// the whip blade, the lengthened thrust, the flying swords, the leaping slash, the ring sweep). Then the gate shatters,
// its pieces hang in the air, and the world turns gold: the True Long dives sword-first, sweeps cones of light, sends a
// golden dragon across the court, raises ten thousand swords into a ring over 魂 and lets them fall (万剑归宗), and
// meets him in a blade lock before the last cut. ~48 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.9: snow night pass, white cliffs, snow pines, a temple; a rain-soaked courtyard gate of red pillars, white
//          walls, black tiles, bamboo; phase two: gold foil everywhere, gold-paper swords, a gold paper dragon.
// PALETTE  ground #c4c8cf; snow #f2f4f8; cliffs #8a92a4 -> #d6dbe4; gate red #8e1a14 / walls #e6e2da / tiles #24222a;
//          bamboo #4e6a44; rain #c8d4e4; gold #e8c060 / #fff0c8 / #7a5a1a; shadow #121a30; haze #8a9ac8
// LIGHT    snow night; phase two: gold light, gold shadows
// LIFE     snow on the pass; rain and ripples at the gate; floating debris and gold scraps in phase two
import { setupChapter, threads, threadBand, beats, elite, intro, outro, GROUNDS, MOODS, createActor, makeHero, slash, shards, rings, crown, drift, P2, THREE, clamp, lerp } from '../../common/kit.js';
import { PAPER_LIGHT } from 'papercraft/lib/paperkit-3d.js';
import { makeTerrain, cliffOutline, paintCliff } from '../../common/terrain.js';
import { swords, paperSerpent, paperChain, crescentShot, sawRing, starburst, popBurst, sparks, lightGate, curls, crystals, afterimage } from '../../common/fx.js';

const S0 = '/work/film/stickers/09-mountain/', BOSS = '/work/boss-chibi/透明PNG/09 断魂山/';
const C = { ground: GROUNDS['09-mountain'], washA: '#b8bec8', washB: '#d4d8de', washC: '#aab0bc', path: '#e6e8ee', court: '#6a7080', courtDark: '#4a5060', gold: '#e8c060' };
const SNOWNIGHT = { key: '#dfe6ff', ki: 2.4, dir: [-0.75, 0.8, 0.45], fill: '#8aa0d8', fi: 1.0, sky: '#b8c8f0', skyG: '#4a5a80', si: 0.8, leak: '#2a3a6a', lamp: 6, glow: 1.2,
  post: { exposure: 0.95, tint: [0.97, 0.99, 1.04], saturation: 0.95, haze: '#8a9ac8', hazeStart: 40, hazeEnd: 125, hazeAmount: 0.36, vignette: 0.14, vignetteColor: '#0e1430', shadowTint: '#1a2450' } };
const K = await setupChapter({
  id: '09-mountain', ground: C.ground, duration: 42.9, moods: { ...MOODS, snow: SNOWNIGHT }, mood: 'snow', light: { leak: '#2a3a6a' }, stock: '#eef1f6',
  bounds: { x0: -46, x1: 46, z0: -54, z1: 34 },
  pieces: { stone: '#7a8294', stoneDark: '#4e5668', cap: '#f2f4f8', bush: ['#4a5a5a', '#5a6a70'], bushDots: '#f2f4f8', tuft: ['#8a92a0', '#a0a8b4'] },
  shadowInk: '#121a30',
  stickers: {
    pine: S0 + 'snowpine.png', temple: S0 + 'temple.png', plank: S0 + 'plankpath.png', altar: S0 + 'candlealtar.png', ice: S0 + 'icechunks.png', tree: S0 + 'bareTree.png', tent: S0 + 'tent.png',
    bamboo: '/work/film/stickers/06-lake/bamboo.png', redgate: '/work/film/stickers/08-estate/redgate.png', lanterns: '/work/film/stickers/04-town/lanterns.png',
    lizhe: BOSS + '01 力者与锯者.png', lengtu: BOSS + '02 梦差·冷荼.png', menghua: BOSS + '03 梦华圣母.png', zuo2: BOSS + '04 左殇·真龙之躯.png', zuo1: BOSS + '05 左殇·组织冥主（终章）.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, house, put } = K;
const T = makeTerrain(K);

const COURT = { x: 3, z: -37, w: 28, d: 15 };
const PATH = P2.pathLine([[2, -29], [-1, -20], [2, -10], [-1, 2], [2, 14], [0, 24], [1, 36]]);
const inner = (z) => 14 + Math.sin(z * 0.3) * 1.0;
const dist = (L, x, z) => { let d = 1e9; for (const [px, pz] of L.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const ELITES = [[-5, 12, -8], [5, -11, 8], [-3, -17, -6]];
// v4: the cliff top. The pass climbs three steps onto a broad snow platform that ends in a sheer edge over a sea of cloud
const PLAT = { x: 0, z: -13.5, w: 26, d: 15, h: 4.5 }, PY = PLAT.h + 0.08, onPlat = (x, z) => Math.abs(x - PLAT.x) < PLAT.w / 2 + 1 && z < PLAT.z + PLAT.d / 2 + 4.5 && z > PLAT.z - PLAT.d / 2 - 1;
const inSight = (x, z) => ELITES.some(([ex, ez, yaw]) => { const d = z - ez; if (d < -2.5 || d > 18) return false; return Math.abs(x - ex - d * Math.tan(yaw * Math.PI / 180)) < 4.5 + d * 0.35; });

H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, drifts }) => {
  washes([C.washA, C.washB, C.washB, C.washC]);
  for (const s of [-1, 1]) { const pts = []; for (let z = 36; z >= -54; z -= 2) pts.push([s * (inner(z) - 1.2 + Math.sin(z * 0.7) * 0.6), z]); pts.push([s * 50, -54], [s * 50, 36]); torn(pts, P2.rgba('#a8b0c0', 0.85)); }
  torn(bandOf(PATH.pts, 2.0), C.path);
  drifts((x, y) => { g.fillStyle = P2.rgba(r() < 0.5 ? '#ffffff' : '#dfe4ec', 0.6); g.beginPath(); g.ellipse(x, y, (0.2 + r() * 0.5) * ppu, (0.1 + r() * 0.2) * ppu, r() * 3, 0, 7); g.fill(); }, { n: 14000 });
  // the wet court before the gate: dark flagstones, puddles
  torn([[COURT.x - COURT.w / 2, COURT.z + COURT.d / 2], [COURT.x + COURT.w / 2, COURT.z + COURT.d / 2], [COURT.x + COURT.w / 2, COURT.z - COURT.d / 2], [COURT.x - COURT.w / 2, COURT.z - COURT.d / 2]], C.court);
  g.strokeStyle = P2.rgba(C.courtDark, 0.7); g.lineWidth = 0.06 * ppu;
  for (let x = COURT.x - 14; x < COURT.x + 14; x += 1.8) for (let z = COURT.z - 7.5; z < COURT.z + 7.5; z += 1.4) g.strokeRect(X(x + (Math.round(z) % 2) * 0.9), Z(z), 1.8 * ppu, 1.4 * ppu);
  for (let k = 0; k < 16; k++) { const x = COURT.x + (r() - 0.5) * 24, z = COURT.z + (r() - 0.5) * 12; g.fillStyle = P2.rgba('#8a9ab8', 0.55); g.beginPath(); g.ellipse(X(x), Z(z), (0.8 + r() * 1.6) * ppu, (0.4 + r() * 0.6) * ppu, 0, 0, 7); g.fill(); }
});

// ---- the pass: white cliffs, snow pines, the temple, plank paths ----------------------------------------------------------------
const col = (i, n) => { const k = i / (n - 1); return { rock: P2.mix('#7a8294', '#d6dbe4', k * 0.85), dark: P2.mix('#4e5668', '#9aa2b4', k * 0.85), moss: '#f2f4f8', pine: P2.mix('#2a3a3a', '#5a6a70', k * 0.7), mist: '#e6eaf2' }; };
const ZL = [27, 16, 5, -6, -17, -28, -39], ZR = [22, 11, 0, -11, -22, -33, -44];
const wl = T.wings({ zs: ZL, side: -1, inner: (z) => -inner(z), w: (z, i) => 22 + i, h: (z, i) => 14 + i * 2.4, colors: (i) => col(i, 7), seed: 91, opts: { plateau: 0.45, spires: 2, pines: 1.0 } });
const wr = T.wings({ zs: ZR, side: 1, inner: (z) => inner(z), w: (z, i) => 22 + i, h: (z, i) => 14.5 + i * 2.4, colors: (i) => col(i, 7), seed: 97, opts: { plateau: 0.45, spires: 2, pines: 1.0 } });
T.range({ z: -58, x: 0, w: 170, h: 38, color: '#9aa6c0', cap: '#f2f4f8', seed: 91, peaks: 7, group: 'far' });
for (const [x, z, h] of [[-10, 22, 9], [10.5, 17, 10], [-10.5, 1, 9], [10, -9, 10], [-10, -24, 10], [10.5, -23, 9]]) if (!inSight(x, z)) sticker('pine', h, { x, z, stamp: true, res: 1.0, group: z < -20 ? 'field' : 'world' });
sticker('temple', 9, { x: 9, z: 6, res: 1.2, flip: true });
const stepFace = (c) => (P) => { P.fill(c); P.felt(0.5); P.marks('brick', { color: P2.shade(c, -0.3), alpha: 0.4, size: 0.12 }); P.innerShade('#121a30', { alpha: 0.35, blurPx: 6 }); };
for (const [z, h] of [[-1.4, 1.1], [-3.0, 2.2], [-4.6, 3.3]]) T.island({ x: 1, z, w: 7, d: 1.8, h, rect: true, facePaint: stepFace('#9aa2b4'), deck: '#eef1f6', seed: Math.round(-z * 7) });
const plat = T.island({ x: PLAT.x, z: PLAT.z, w: PLAT.w, d: PLAT.d, h: PLAT.h, rect: true, facePaint: stepFace('#7a8294'), deck: '#eef1f6', seed: 77 });
sticker('tree', 8, { parent: plat.deck, x: -10.5, z: -5.5, res: 1.0, mark: false });
sticker('pine', 8, { parent: plat.deck, x: 10.5, z: -3, res: 1.0, mark: false, stamp: true });
// the sea of cloud below the edge: banks of white cut card at falling heights, and far peaks standing out of it
for (const [z, h, x, seed] of [[-24, 3.0, -4, 201], [-28, 3.6, 6, 202], [-32, 4.2, -8, 203], [-37, 4.8, 4, 204]]) T.range({ z, x, w: 90, h, color: '#e6eaf2', cap: '#ffffff', group: 'field', seed, peaks: 11 });
T.range({ z: -44, x: 0, w: 130, h: 15, color: '#8a94ac', cap: '#f2f4f8', group: 'field', seed: 205, peaks: 9 });
// the abyss under the cloud sea: a dark misty sheet over the floor beyond the edge (it goes with the pass at the gate)
const abyss = new THREE.Mesh(new THREE.PlaneGeometry(110, 34), new THREE.MeshStandardMaterial({ color: '#3e4a66', roughness: 1 }));
abyss.rotation.x = -Math.PI / 2; abyss.position.set(0, 0.07, -38.5); abyss.receiveShadow = true; H.scene.add(abyss);
const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
const foot = (w, dz, k = 1.5) => [w.cliff.side * (inner(w.cliff.z + dz) - k), 0.05, w.cliff.z + dz];
threadBand(film, { a: wAt(wl[1], 0.3), b: foot(wl[1], -7), n: 110, wA: 1.2, wB: 4.0, seed: 91 });
threadBand(film, { a: wAt(wr[2], 0.3), b: foot(wr[2], -7), n: 110, wA: 1.2, wB: 4.0, seed: 92 });
threadBand(film, { a: wAt(wl[4], 0.3), b: foot(wl[4], -6), n: 110, wA: 1.2, wB: 4.0, seed: 93 });
mark(-5, 12, 2.6); mark(5, -11, 2.4); mark(-3, -17, 2.4);
fill(240, [-14, 14, 0, 33], [rock, bush, tuft, tuft], (x, z) => Math.abs(x) < inner(z) - 1.5 && dist(PATH, x, z) > 2.4 && !inSight(x, z) && !onPlat(x, z), { per: [1, 3], size: [0.4, 0.7] });

// ---- the courtyard gate in the rain (rises for the fight): the gate house, walls, bamboo both sides, lanterns -------------------------------
const ARENA_T = 12.4, D = 4.2;   // v4: the boss fight keeps its v3 times, shifted D later (film.shift)
const gate = sticker('redgate', 13, { x: COURT.x, z: -45.5, res: 1.5, group: 'arena' });
house(-10.5, -46.5, { w: 9, d: 3, wallH: 3.6, roofH: 1.6, seed: 101, col: { wall: '#e6e2da', roof: '#24222a', timber: '#3a2a20', window: '#e6e2da', accent: null }, group: 'arena' });
house(16.5, -46.5, { w: 9, d: 3, wallH: 3.6, roofH: 1.6, seed: 103, col: { wall: '#e6e2da', roof: '#24222a', timber: '#3a2a20', window: '#e6e2da', accent: null }, group: 'arena' });
for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -30 - i * 3.1, x = COURT.x + s * (14.5 + (i % 2) * 2.2); sticker('bamboo', between(8.5, 11), { x, z, stamp: true, res: 1.1, flip: s > 0, sway: 0.7, group: 'arena', mark: false }); }
for (const [x, z, f] of [[-4, -43.5, false], [10, -43.5, true]]) sticker('lanterns', 5, { x, z, res: 1.1, group: 'arena', flip: f });
// the gold void for phase two: tall gold-foil flats rising round the court, a gold sky card behind
const goldCol = (i) => ({ rock: P2.mix('#a07a2a', '#f0d080', (i % 3) / 2), dark: '#7a5a1a', moss: '#fff0c8', pine: '#5a3a0a', mist: null, strata: false });
for (const [i, [x, z, side]] of [[-14, -30, -1], [-15, -41, -1], [-8, -49, -1], [20, -30, 1], [21, -41, 1], [14, -49, 1]].entries()) {
  const r = P2.rng(110 + i), { pts, top } = cliffOutline(16, 18 + (i % 3) * 3, side, r, { plateau: 0.5, spires: 2, pines: 0 });
  put(H.popup(pts, paintCliff({ top, seed: 110 + i, ...goldCol(i) }), { x, z, yaw: side < 0 ? 0.35 : -0.35, res: 0.7 }), 'void');
}
put(H.popup(P2.shape.rect(70, 30), (P) => { P.gradient('#a07a2a', '#fff0c8'); P.felt(0.6); P.marks('hatch', { color: '#7a5a1a', alpha: 0.2, size: 0.02, angle: 0.3 }); }, { x: COURT.x, z: -52, yaw: 0, res: 0.4 }), 'void');

H.setHero(H.popup(null, null, { node: new THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-16, 16, 0.5, 13, -27, 32], n: 140, colors: ['#ffffff', '#eef1f6', '#dfe4ec'], size: 0.17, wind: [0.4, -0.8, 0.3], seed: 3, shape: 'flake' });
const rain = drift(film, { box: [-14, 20, 0.2, 16, -48, -28], n: 260, colors: ['#c8d4e4', '#a8b8d0', '#e6ecf4'], size: 0.5, wind: [0.4, -14, 0.1], seed: 5, shape: 'rain' });

// ---- actors -------------------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const lizhe = createActor(film, { name: 'lizhe', poses: { p: IMG.lizhe }, height: 6.4, x: -5, z: 12 });
const lengtu = createActor(film, { name: 'lengtu', poses: { p: IMG.lengtu }, height: 5.0, x: 5, z: -11 });
const menghua = createActor(film, { name: 'menghua', poses: { p: IMG.menghua }, height: 5.6, x: -3, z: -18.8 });
lengtu.key(0, { y: PY }); menghua.key(0, { y: PY });
const zuo = createActor(film, { name: 'zuo', poses: { p1: IMG.zuo1, p2: IMG.zuo2 }, height: 6.0, heights: { p2: 7.0 }, x: 8, z: -37, risen: true });
const GOLD = ['#7a5a1a', '#e8c060', '#fff0c8'], GOLDS = ['#2a2018', '#e8c060', '#fffbe8'];
const B = beats(film, hero, zuo, { splash: ['#c8d4e4', '#8a9ab8', '#e6ecf4'], sparks: ['#fff0c8', '#e8c060', '#ffffff'] });
const S = film.sound, ZB = -37, ZH = -36;

// ---- up the pass to the cliff (v4): 力者与锯者 on the pass; 冷荼 and 梦华 on the cliff top, the cloud sea below; then the
// light gate opens at the edge, 魂 runs through it, the mountain folds away and 左殇's court stands up as its own place
const camIntro = intro(film, hero, { land: [0, 21], t1: 1.0 });
const E1 = 3.6, E2 = 7.4, E3 = 11.3, G = 15.2;
hero.hideBetween(1.9, G + 0.15);
film.rise('world', 0.55, { from: [0, 21], speed: 42 });
film.rise('far', 0.55, { sound: false });
film.rise('field', 0.55, { from: [0, 21], speed: 42, sound: false });
film.title({ t0: 1.0, dur: 3.0, name: '断魂山', sub: '玖' }); S(1.0, 'title');
// 力者与锯者: the crusher's hammer comes down and the saw-wheel runs out of the dust
elite(film, lizhe, E1, { title: '双首领', name: '力者与锯者', move: 'none', dur: 3.0 });
lizhe.key(E1 + 0.9, { lean: 0 }).key(E1 + 1.2, { lean: -0.2 }).key(E1 + 1.4, { lean: 0.12, ease: 'in' }).key(E1 + 1.9, { lean: 0 });
popBurst(film, { t: E1 + 1.4, at: [-3.2, 0, 13.4], r: 2.8, colors: ['#eef1f6', '#a0a8b4', '#4e5668'], crumple: 10, seed: 91, sound: 'boom' }); film.at(E1 + 1.4, () => film.kick(1.0));
sawRing(film, { t: E1 + 1.7, at: [-2, 1.6, 15.5], r0: 1.4, r1: 1.4, color: '#8a92a0', width: 0.4, dur: 0.9, upright: true, seed: 92 });
shards(film, { t: E1 + 1.75, at: [-1.4, 0.4, 16.5], n: 30, colors: ['#ffffff', '#dfe4ec', '#8a92a0'], speed: 6, up: 4, size: 0.3, seed: 93, sound: 'saw' });
// 冷荼 (梦差) on the cliff top: the dream comes over him, layers of torn red tissue sliding across, the red scraps flying
elite(film, lengtu, E2, { title: '梦差', name: '冷荼', move: 'none', dur: 3.4 });
lengtu.key(E2 + 0.6, { jit: 0.05 }).key(E2 + 2.6, { jit: 0.05 }).key(E2 + 2.7, { jit: 0 });
curls(film, { t: E2 + 0.7, from: [8, PY + 0.4, -10], to: [1, PY + 5, -12], n: 11, r: 1.2, colors: ['#9a1e18', '#c0281c', '#2a1012'], dur: 1.6, spread: 2.2, seed: 94, sound: 'gust' });
film.tint(E2 + 1.0, { color: '#8e1a14', dur: 1.5, peak: 0.22 });
shards(film, { t: E2 + 1.2, at: [5, PY + 2.5, -11], n: 40, colors: ['#9a1e18', '#c0281c', '#ffc66a'], speed: 4, up: 5, size: 0.3, gravity: 3, shape: 'scrap', life: 2.2, seed: 95 });
// 梦华圣母 at the very edge: her fan cuts a dark-red arc, sends a fan of frost over the snow, opens wide and lifts her up
elite(film, menghua, E3, { title: '救苦救难', name: '梦华圣母', move: 'none', dur: 3.6 });
slash(film, { t: E3 + 0.9, at: [-3, PY + 2.4, -18.4], radius: 3.6, width: 1.0, a0: 3.4, a1: -0.4, normal: [0.05, 1, 0.3], color: '#8e1a14', core: '#e8c8a0', sound: 'slash' });
crystals(film, { t: E3 + 1.6, from: [-2.4, -17.4], to: [2.5, -9], n: 9, y: PY, seed: 96 });
starburst(film, { t: E3 + 2.4, at: [-3, PY + 3.2, -19.2], r: 3.4, spikes: 22, colors: ['#2a1012', '#9a1e18', '#e8c8a0'], dur: 1.2, hold: 0.6, spin: 0.2, seed: 97, sound: 'gust' });
menghua.key(E3 + 2.4, { y: PY }).key(E3 + 3.2, { y: PY + 3.2, ease: 'out' }).key(E3 + 3.6, { rise: 0 });
// the light gate at the edge; 魂 runs up onto the cliff and through it; the page flares warm and the mountain folds
lightGate(film, { t: G - 0.2, at: [-1, PY, -19.8], r: 3.0, until: G + 1.6, seed: 61 });
hero.key(G + 0.15, { hidden: false, rise: 1, pose: 'run', x: 1, z: 1, y: 0, face: 1 }).key(G + 0.35, { z: -1.4, y: 1.1 }).key(G + 0.5, { z: -3.0, y: 2.2 }).key(G + 0.65, { z: -4.6, y: 3.3 }).key(G + 0.78, { z: -6.4, y: PY })
  .key(G + 1.25, { x: -1, z: -19.4, ease: 'linear' }).key(G + 1.3, { hidden: true });
S(G + 0.15, 'steps', { dur: 1.1 });
film.tint(G + 1.2, { color: '#fff0c8', dur: 0.55, peak: 0.9 });
film.rise('world', G + 1.3, { from: [-1, -19.8], speed: 80, open: 0 });
film.rise('field', G + 1.3, { from: [-1, -19.8], speed: 80, open: 0, sound: false });
lengtu.key(G - 0.4, { rise: 0 }).key(G + 0.1, { hidden: true }); menghua.key(E3 + 4.1, { hidden: true });
film.every((t) => { abyss.visible = t > 0.6 && t < G + 1.6; });
{ const V = film.voice; V(E1 + 1.35, 'vo/lizhe_juzhe_attack_heavy_01.wav'); V(E2 + 0.05, 'vo/lengtu_line_01.wav'); V(E3 + 0.05, 'vo/menghua_line_01.wav'); }
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 5, 4], dist: 66, pitch: 30, yaw: 4, focus: [0, 4, 4] },
  { t: 3.4, target: [1, 5, 0], dist: 58, pitch: 28, yaw: 1, ease: 'linear', focus: [0, 4, 0] },
  // 力者与锯者, low on the pass
  { t: E1 + 0.1, target: [-4, 3.6, 13], dist: 22, pitch: 10, yaw: -10, focus: [-5, 3.4, 12], ease: 'cut' },
  { t: E2 - 0.4, target: [-3.4, 3.4, 13.6], dist: 24, pitch: 12, yaw: -6, ease: 'linear', focus: [-3.6, 2.6, 14] },
  // the cliff top from the side: the deck, its sheer edge and the cloud sea falling away beyond it
  { t: E2 - 0.3, target: [3.8, PY + 1.6, -12.6], dist: 25, pitch: 22, yaw: 4, focus: [5, PY + 2.6, -11], ease: 'cut' },
  { t: E3 - 0.3, target: [4, PY + 1.8, -12.2], dist: 22, pitch: 21, yaw: 2, ease: 'linear', focus: [5, PY + 2.6, -11] },
  // 梦华 at the edge, from behind her shoulder on the cliff top: the deck ends past her and the cloud sea lies far below
  { t: E3 - 0.25, target: [-2.6, PY + 0.6, -22], dist: 25, pitch: 25, yaw: 10, focus: [-3, PY + 2.6, -18.8], ease: 'cut' },
  { t: E3 + 2.4, target: [-2.6, PY + 0.8, -22], dist: 22, pitch: 24, yaw: 7, ease: 'linear', focus: [-3, PY + 2.6, -18.8] },
  { t: E3 + 3.4, target: [-2.8, PY + 2.4, -22], dist: 23, pitch: 18, yaw: 5, ease: 'out', focus: [-3, PY + 4.6, -18.8] },
  // the gate: from behind 魂, then into the light
  { t: G - 0.3, target: [-0.6, PY + 0.6, -23], dist: 24, pitch: 22, yaw: 8, focus: [-1, PY + 2.6, -19.8], ease: 'cut' },
  { t: G + 1.3, target: [-1, PY + 3, -19.2], dist: 9, pitch: 6, yaw: 0, ease: 'in', focus: [-1, PY + 3, -19.8] },
]);
film.shift(D);   // ---- from here on: the v3 boss fight in the courtyard, D later

// ---- the gate in the rain ------------------------------------------------------------------------------------------------------------
film.rise('arena', ARENA_T, { from: [COURT.x, -40], speed: 26 });
hero.key(12.6, { hidden: false, pose: 'run', x: -1, z: -26, y: 0, face: 1, rise: 1 }).key(13.8, { x: -3, z: ZH, ease: 'linear' }).key(13.82, { pose: 'idle' });
S(12.65, 'steps', { dur: 1.2 }); S(12.5, 'rain', { dur: 20 });
for (let t = 13, k = 0; t < 26; t += 0.45, k++) rings(film, { t, at: [COURT.x + Math.sin(k * 2.3) * 11, 0, COURT.z + Math.cos(k * 1.7) * 6], n: 2, r0: 0.2, r1: 1.6, dur: 0.6, color: '#c8d4e4', width: 0.08 });
// he rises from the wet flagstones in a burst of gold rays
zuo.key(0, { hidden: true }).key(14.1, { hidden: false, rise: 1 });
starburst(film, { t: 14.15, at: [8, 3.4, -36.8], r: 2.6, spikes: 16, colors: GOLDS, dur: 0.7, seed: 3, sound: 'goldBurst' });
sawRing(film, { t: 14.2, at: [8, 0.05, ZB], r0: 0.5, r1: 7, color: C.gold, width: 0.5, dur: 0.8, seed: 4 });
film.plate({ t0: 14.5, dur: 2.4, title: '"组织"冥主', name: '左殇', boss: true, seal: '首' });

// phase one. the golden burst (guarded heavy), the whip blade: a long sweep, then the blade unspools into a gold whip (dodged)
B.guard(14.3, [-3, ZH], { back: 0.8, heavy: true, hold: 0.45 });
zuo.key(15.6, { lean: 0 }).key(15.75, { lean: -0.2 }).key(16.0, { lean: 0 });
slash(film, { t: 15.8, at: [6, 2.4, ZB], radius: 7.5, width: 0.9, a0: 0.4, a1: 3.0, normal: [0, 1, 0.15], color: '#e8c060', core: '#fffbe8', sound: 'slash' });
B.guard(16.05, [-3.8, ZH], { back: 0.5, hold: 0.3 });
paperChain(film, { t: 16.5, dur: 0.9, links: 40, size: 0.2, colors: ['#e8c060', '#a07a2a'], sound: 'whoosh', path: (u, lt) => { const h = [zuo.x - 1.4, 3.2, zuo.z + 0.2]; return [lerp(h[0], -4.5, u), h[1] - u * 1.6 + Math.sin(u * 9 + lt * 12) * 0.6, h[2] + Math.sin(u * 6) * 1.2]; }, reach: (lt) => (lt < 0.3 ? lt / 0.3 : lt > 0.6 ? 1 - (lt - 0.6) / 0.3 : 1) });
hero.key(16.7, { pose: 'dodge', x: -4.3, z: ZH }).key(16.95, { x: -6, z: -33.8, ease: 'out' }).key(17.05, { pose: 'idle' });
// the lengthened blade: the red flash; 魂 shadow-steps behind him as the blade shoots out the length of the court; the counter
hero.key(17.3, { x: -6, z: -33.8 }).key(17.6, { x: -4, z: ZH });
B.tell(17.8, [6.8, 4.4, -36.6], 'red');
B.shadowstep(17.92, [-4, ZH], [12.6, -36.4], { face: -1 });
slash(film, { t: 18.05, at: [7, 2.4 - 14, -36.2], radius: 14, width: 0.6, a0: Math.PI / 2 + 0.05, a1: Math.PI / 2 + 0.75, normal: [0, 0, 1], color: '#e8c060', core: '#fffbe8', sound: 'heavy' });
zuo.key(18.4, { face: -1 });
B.counter(18.55, [12.6, -36.4], [8, ZB], { face: -1, reach: 1.6 });
// the flying swords: eight rise from him, hang over 魂, and plunge in a ring round him (guarded twice under them)
const FS = 19.5, HX = 3.2;
hero.key(FS - 0.4, { pose: 'dodge', x: 11 }).key(FS - 0.1, { x: HX, z: ZH, ease: 'out' }).key(FS, { pose: 'idle', face: 1 });
zuo.key(FS - 0.1, { face: 1 });
swords(film, { t: FS, from: [8, 4, ZB], hover: Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2; return [HX + Math.cos(a) * 3.2, 8.5 + (i % 2), ZH + Math.sin(a) * 1.8]; }),
  targets: Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2; return [HX + Math.cos(a) * 1.9, 0.2, ZH + Math.sin(a) * 1.1]; }), rise: 0.5, hang: 0.4, stagger: 0.04, until: 25.6, seed: 5 });
B.guard(FS + 1.0, [HX, ZH], { back: 0, heavy: true, hold: 0.4 }); B.guard(FS + 1.25, [HX, ZH], { back: 0, hold: 0.35 });
for (let i = 0; i < 8; i++) shards(film, { t: FS + 0.95 + i * 0.04, at: [HX + Math.cos(i / 8 * 6.283) * 1.9, 0.3, ZH + Math.sin(i / 8 * 6.283) * 1.1], n: 8, colors: ['#c8d4e4', '#8a9ab8'], speed: 3, up: 4, size: 0.18, shape: 'drop', seed: 60 + i });
// the leaping slash from range: the blue glint; deflected; the counter
zuo.key(21.0, { x: 8, hop: 3.2 }).key(21.55, { x: 6.6, ease: 'linear' });
B.tell(21.2, [7.4, 7.4, -36.6], 'blue');
B.deflect(21.55, [HX - 0.2, ZH], [6.6, ZB]);
B.counter(22.1, [HX - 0.2, ZH], [6.6, ZB], { reach: 0.6 });
// the ring sweep: a low gold ring cuts through the water; 魂 vaults it and cuts down
sawRing(film, { t: 23.0, at: [6.6, 0.6, ZB], r0: 1, r1: 9, color: C.gold, width: 0.4, dur: 0.6, seed: 6 }); S(23.0, 'whoosh');
zuo.key(22.9, { jit: 0.05 }).key(23.3, { jit: 0 });
B.leapCut(23.0, [3.4, ZH], [2.8, -36.3], [6.6, ZB]);

// the change: the gate shatters and its pieces hang in the air; the rain stops; the world turns gold
const PH = 24.2, P2T = B.phase(PH, [6.6, ZB], 'p2', { heroFrom: [2.8, -36.3], heroTo: [-2, ZH], kind: 'spike', crownColors: GOLD, color: GOLD, flash: '#fff0c8', dur: 1.4 });
const GOLD_T = P2T;
film.at(P2T, () => film.kick(1.6));
shards(film, { t: P2T, at: [COURT.x, 5, -46], n: 70, colors: ['#8e1a14', '#24222a', '#e6e2da', '#c8a04a'], speed: 5, up: 3, size: 0.7, gravity: 0.15, drag: 2.5, shape: ['scrap', 'tri', 'strip'], life: 14, seed: 70, sound: 'pavilionShatter' });
film.rise('arena', P2T + 0.05, { from: [COURT.x, -46], speed: 60, open: 0 });
film.rise('void', P2T + 0.15, { from: [COURT.x, -40], speed: 30 });
film.every((t) => { rain.visible = t < P2T + D; });
let L0 = null;
film.every((t) => {
  if (!L0) { L0 = []; H.scene.traverse((o) => { if (o.isLight && o.color) L0.push([o, o.color.clone(), o.groundColor ? o.groundColor.clone() : null]); }); L0.leak = PAPER_LIGHT.leak.value.clone(); }
  const k = clamp((t - GOLD_T - D) / 0.8) * (1 - clamp((t - OUT - D) / 0.6)), gold = new THREE.Color('#ffd27a');
  for (const [o, c, gc] of L0) { o.color.copy(c).lerp(gold, k * 0.85); if (gc) o.groundColor.copy(gc).lerp(new THREE.Color('#7a5a1a'), k); }
  PAPER_LIGHT.leak.value.copy(L0.leak).lerp(new THREE.Color('#7a5010'), k);
});
film.tint(P2T, { color: '#e8c060', dur: 30, peak: 0.12 });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '左殇 · 终章', name: '真龙之躯', boss: true, seal: '龙', barColor: '#c8a040' });
drift(film, { box: [-14, 20, 0.5, 14, -48, -28], n: 90, colors: ['#fff0c8', '#e8c060', '#ffffff'], size: 0.2, wind: [0.2, 0.25, 0.1], seed: 9, shape: 'ember' }).visible = true;

// phase two. the dive, sword first, out of the sky: the blue glint, deflected
const W0 = P2T + 2.1;
zuo.key(W0, { y: 0 }).key(W0 + 0.4, { y: 9, ease: 'out', x: 4 }).key(W0 + 0.85, { y: 0, x: 1.6, ease: 'in' });
B.tell(W0 + 0.5, [3.6, 12.5, -36.6], 'blue');
B.deflect(W0 + 0.85, [-2, ZH], [1.6, ZB]);
popBurst(film, { t: W0 + 0.88, at: [1.6, 0, ZB], r: 2.6, colors: GOLD, crumple: 6, seed: 81, sound: 'boom' });
// the light sweep: three cones of gold light (crescents) fanned at him: guarded, guarded, the third heavy
zuo.key(W0 + 1.4, { x: 1.6 }).key(W0 + 1.7, { x: 6.5, ease: 'out' });
for (let i = 0; i < 3; i++) { crescentShot(film, { t: W0 + 2.0 + i * 0.3, from: [5, 2.4 + (i - 1) * 0.9, ZB + 0.3], to: [-1.8, 2.4 + (i - 1) * 0.9, ZH], dur: 0.25, r: 1.9, colors: GOLDS, seed: 82 + i }); B.guard(W0 + 2.25 + i * 0.3, [-2 - i * 0.4, ZH], { back: 0.4, heavy: i === 2, hold: 0.3 }); }
// the dragon spirit: a gold paper dragon pours across the court at him: the red flash; 魂 shadow-steps to his back
const DR = W0 + 3.6;
paperSerpent(film, { t: DR, dur: 1.6, n: 44, size: 1.3, body: 0.6, colors: ['#e8c060', '#fff0c8', '#c8a04a'], headColor: '#e8c060', eye: '#8e1a14', sound: 'dragon',
  path: (u) => [lerp(18, -12, u), 3 + Math.sin(u * Math.PI * 3) * 2.2, -42 + u * 6 + Math.sin(u * 7) * 1.2], lead: (lt) => Math.min(1, lt / 1.1) });
B.tell(DR + 0.45, [4, 6, -39], 'red');
B.shadowstep(DR + 0.55, [-3.2, ZH], [10.6, -36.4], { face: -1 });
zuo.key(DR + 1.0, { face: -1 });
B.counter(DR + 1.2, [10.6, -36.4], [6.5, ZB], { face: -1, reach: 1.4 });
// 万剑归宗: he raises his sword; swords gather into a vast ring high over 魂 and fall on him all at once; the red flash;
// 魂 is gone from under them a breath before they land; they stand in the court like a field
const WJ = DR + 2.2, WX = 2.0;
hero.key(WJ - 0.5, { pose: 'dodge', x: 9.2 }).key(WJ - 0.15, { x: WX, z: ZH, ease: 'out' }).key(WJ - 0.1, { pose: 'idle', face: 1 });
zuo.key(WJ - 0.2, { x: 6.5, face: 1 }).key(WJ, { x: 8.5, ease: 'out' }).key(WJ, { jit: 0.06 }).key(WJ + 1.6, { jit: 0 });
film.letterbox({ t0: WJ, dur: 2.6 }); film.plate({ t0: WJ + 0.2, dur: 1.8, title: '左殇', name: '万剑归宗', side: 'right' });
const N = 36, hover = [], tg = [];
for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, ring = i % 3; hover.push([WX + Math.cos(a) * (6 + ring * 1.6), 10 + ring * 1.4, ZH - 1 + Math.sin(a) * (3.2 + ring)]); tg.push([WX + Math.cos(a * 3) * (0.4 + (i % 5) * 0.45), 0.2, ZH + Math.sin(a * 5) * (0.3 + (i % 4) * 0.35)]); }
swords(film, { t: WJ, from: [8.5, 4, ZB], hover, targets: tg, rise: 0.9, hang: 0.55, fly: 0.2, stagger: 0.012, until: WJ + 4.6, seed: 9 });
B.tell(WJ + 1.35, [WX, 12, ZH - 1], 'red');
B.shadowstep(WJ + 1.45, [WX, ZH], [12.2, -36.4], { face: -1 });
popBurst(film, { t: WJ + 1.75, at: [WX, 0, ZH], r: 3.6, colors: GOLD, crumple: 12, seed: 90, sound: 'boom' }); film.at(WJ + 1.75, () => film.kick(1.5));
// the blade lock: they meet in the middle; the blades bind (a held star, the scene frozen); 魂 drives through
const BL = WJ + 2.7;
zuo.key(BL - 0.3, { face: -1, x: 8.5 }).key(BL, { x: 7.2, ease: 'out' });
hero.key(BL - 0.3, { pose: 'parry', x: 12.2 }).key(BL, { x: 10.2, ease: 'out' });
starburst(film, { t: BL, at: [8.8, 3, -36.2], r: 2.2, spikes: 16, colors: ['#2a2018', '#e8c060', '#ffffff'], dur: 1.1, hold: 0.6, seed: 91, sound: 'bladeLock' });
sparks(film, { t: BL, at: [8.8, 3, -36.2], n: 30, colors: ['#ffffff', '#fff0c8', '#e8c060'], star: false, seed: 92, sound: null });
film.hitstop(BL + 0.05, 0.6); film.tint(BL + 0.05, { color: '#fffbe8', dur: 0.7, peak: 0.25 });
for (let k = 0; k < 4; k++) sparks(film, { t: BL + 0.15 + k * 0.15, at: [8.8, 3, -36.2], n: 12, colors: ['#ffffff', '#e8c060'], star: false, seed: 93 + k, sound: 'guard' });
B.deflect(BL + 0.8, [10.2, -36.4], [7.2, ZB], { face: -1, stagger: 0.6 });
const FIN = BL + 1.5;
B.finisher(FIN, [10.0, -36.4], [6.8, ZB], { face: -1, stamp: '斩' });   // v4: the game's 斩; the ending page follows

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
{ const V = film.voice;
  V(14.3, 'vo/zuoshang_p1_line_01.wav');                                     // P1 entry: 世间，已无我敌手！
  V(17.6, 'vo/zuoshang_attack_01.wav');
  V(FS - 0.3, 'vo/zuoshang_p1_line_05.wav');                                 // the flying swords: 浊流万象，为我所掌！
  V(PH - 0.9, 'vo/zuoshang_p1_line_04.wav');                                 // into the change: 累世纷争，于此落定！ (v4: earlier, so it ends before the dive)
  V(W0 - 0.1, 'vo/zuoshang_p2_line_03.wav');                                 // P2, the dive: 噬裂长空！
  V(W0 + 1.4, 'vo/zuoshang_p2_line_04.wav');                                 // 你辜负了自己应有的力量！
  V(DR + 0.35, 'vo/zuoshang_p2_line_01.wav');                                // the dragon: 暗龙剑！
  V(WJ + 0.2, 'vo/zuoshang_p2_line_02.wav');                                 // 万剑归宗: 在痛苦中万劫不复吧！
  V(FIN + 0.45, 'vo/zuoshang_death_01.wav', { cap: 2.4 }); }

const OUT = FIN + 3.4;
const camOutro = outro(film, hero, { t0: OUT, from: [9, -36], dur: 1.6, color: '#c8a04a', nextColor: GROUNDS.end });
film.rise('void', OUT + 0.05, { from: [9, -36], speed: 110, open: 0, sound: false });
for (const a of [lizhe, lengtu, menghua]) a.key(OUT, { rise: 0 });
{ // the paper beyond the sheet turns gold with the world
  let beyond = null; H.scene.traverse((o) => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && o.geometry.parameters.width === 800) beyond = o; });
  const c0 = new THREE.Color(C.ground), c1 = new THREE.Color('#c8a04a'), c = new THREE.Color();
  film.every((tt) => { if (tt >= OUT + D) return; const k = clamp((tt - GOLD_T - D) / 0.8); c.copy(c0).lerp(c1, k); if (beyond) beyond.material.color.copy(c); H.scene.background = c.clone(); });
}

// ---- camera ------------------------------------------------------------------------------------------------------------------------
const duel = (t, o = {}) => ({ t, target: [3, 2.8, -36.4], dist: 33, pitch: 27, yaw: 0, focus: [3, 2.8, -36.6], ...o });
film.camera([
  { t: 12.9, target: [2, 5.5, -33], dist: 46, pitch: 24, yaw: 0, focus: [3, 4, -42] },
  { t: 13.95, target: [2.5, 5, -34], dist: 42, pitch: 24, yaw: 0, ease: 'linear', focus: [3, 4, -42] },
  // v4: 左殇 stands up out of the wet flagstones, seen from the ground
  { t: 14.0, target: [7.4, 3.6, -37], dist: 20, pitch: 5, yaw: -18, focus: [8, 3.4, -37], ease: 'cut' },
  { t: 14.9, target: [7.6, 3.8, -37], dist: 17.5, pitch: 6, yaw: -14, ease: 'linear', focus: [8, 3.6, -37] },
  duel(14.95, { dist: 34, ease: 'cut' }),
  duel(16.6, { dist: 31, ease: 'linear', target: [0.5, 2.8, -36.4] }),
  duel(17.7, { dist: 31, target: [3, 3, -36.4] }),
  duel(FS, { dist: 36, pitch: 26, target: [4, 4.5, -36.6] }),
  duel(FS + 1.6, { dist: 33, ease: 'linear', target: [4, 3.4, -36.4] }),
  duel(23.6, { dist: 31, target: [4.5, 3, -36.4] }),
  { t: P2T - 0.6, target: [5.5, 3.8, -36.8], dist: 25, pitch: 26, yaw: -6, focus: [6.6, 3.6, ZB] },
  { t: P2T + 1.4, target: [4, 5.5, -38], dist: 40, pitch: 20, yaw: -4, ease: 'linear', focus: [6.6, 4, ZB] },
  duel(W0, { dist: 36, pitch: 24, target: [2, 4.5, -36.6] }),
  duel(DR, { dist: 40, pitch: 22, target: [3, 4.5, -38] }),
  duel(WJ, { dist: 44, pitch: 20, target: [4, 7, -37.5] }),
  duel(WJ + 1.5, { dist: 40, pitch: 21, ease: 'linear', target: [4, 6, -37] }),
  duel(BL - 0.4, { dist: 24, pitch: 26, target: [8.8, 3.4, -36.4], focus: [8.8, 3, -36.4] }),
  duel(FIN - 0.4, { dist: 27, target: [8.4, 3, -36.4] }),
  // v4: the last cut over 魂's shoulder, then wide for the 斩
  { t: FIN - 0.05, target: [8.6, 3.0, -36.6], dist: 18, pitch: 13, yaw: 42, focus: [6.8, 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [8.6, 2.8, -36.6], dist: 16.5, pitch: 13, yaw: 38, ease: 'linear', focus: [6.8, 2.6, -37] },
  duel(FIN + 1.25, { dist: 28, pitch: 30, target: [8.6, 2.8, -36.4], ease: 'cut' }),
  duel(FIN + 2.8, { dist: 30, pitch: 31, ease: 'linear', target: [8.6, 2.8, -36.4] }),
  ...camOutro,
]);
film.start();
