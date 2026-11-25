// 第七章 · 枷笼山 (Mount Jialong), v2. A prison mountain: a stone path climbs a gorge of misty cliffs past hanging cages,
// ribboned posts, ferns and a shrine gate; up top, rising for the fight, the Lady's Shrine, a red timber hall with its
// pillars, altar and candles, paper coins drifting down. The film climbs the gorge: the broad blade (毕峰), the mad woman
// (奎艳艳), the jade-faced lord (玉面郎君); then 荒行子 the Kunlun Renegade (the ball and chain swung and slammed, the
// bladed ball thrown, the spin in its dark red circle, the pole thrust, the skidding dash); then he becomes the Whirling
// Executioner with a saw for a head, and only then do the saws come: the hall folds away, the whole world turns red, a
// void of blood-red flats; the saw wheels roll, he rushes saw-first. ~44 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.7: grey-green misty gorge, black iron cages, red ribbons; the shrine's red timber, gold candles, coins;
//          phase two: everything red, silhouettes on a red ground.
// PALETTE  ground #959d92; cliffs #4e5a52 -> #9aa49c; floor #5a4a48; shrine red #8e1a14 / #b3231a; iron #3a3b40;
//          coins #efe8d6; the red void #7a0e0e / #c0281c; shadow #121a16; haze #b8c4bc
// LIGHT    pale overcast; phase two: red light, red shadows
// LIFE     mist, red ribbon scraps, paper coins
import { setupChapter, threads, threadBand, beats, elite, intro, outro, GROUNDS, MOODS, createActor, makeHero, slash, shards, rings, crown, drift, wheel, P2, THREE, clamp, lerp } from '../../common/kit.js';
import { PAPER_LIGHT } from 'papercraft/lib/paperkit-3d.js';
import { makeTerrain, cliffOutline, paintCliff } from '../../common/terrain.js';
import { paperChain, paperBall, popBurst, sawRing, starburst, sparks, afterimage, curls } from '../../common/fx.js';

const S0 = '/work/film/stickers/07-prison/', BOSS = '/work/boss-chibi/透明PNG/07 枷笼山/';
const C = { ground: GROUNDS['07-prison'], washA: '#889088', washB: '#a8aea4', washC: '#7c847c', path: '#b8bcb0', floor: '#5a4a48', red: '#b3231a', crimson: '#8e1a14', iron: '#3a3b40' };
const PRISON = { key: '#eef0e8', ki: 2.5, dir: [-0.75, 0.9, 0.45], fill: '#c0ccc4', fi: 1.0, sky: '#e4ece6', skyG: '#6a7a70', si: 0.6, leak: '#243028', lamp: 6, glow: 1.0,
  post: { exposure: 0.88, tint: [0.99, 1.0, 0.99], saturation: 0.92, haze: '#b8c4bc', hazeStart: 40, hazeEnd: 125, hazeAmount: 0.38, vignette: 0.1, vignetteColor: '#10181a', shadowTint: '#1a2620' } };
const K = await setupChapter({
  id: '07-prison', ground: C.ground, whiteStamp: true, duration: 40.4, moods: { ...MOODS, prison: PRISON }, mood: 'prison', light: { leak: '#243028' },
  bounds: { x0: -46, x1: 46, z0: -54, z1: 34 },
  pieces: { stone: '#7e8680', stoneDark: '#525a56', cap: '#5e7a4e', bush: ['#4e6a44', '#5a6e4a'], bushDots: '#b3231a', tuft: ['#6a7a52', '#5e7048'] },
  shadowInk: '#121a16',
  stickers: {
    cage: S0 + 'cage.png', cliff: S0 + 'mistcliff.png', ribbons: S0 + 'ribbons.png', gate: S0 + 'shrinegate.png', redhall: S0 + 'redhall.png', fern: S0 + 'fern.png', altar: S0 + 'altar.png',
    candles: '/work/film/stickers/05-camp/candles.png',
    bifeng: BOSS + '01 横刀·毕峰.png', kui: BOSS + '02 疯婆子奎艳艳.png', yumian: BOSS + '03 玉面郎君.png', huang2: BOSS + '04 荒行子·撕裂锯轮.png', huang1: BOSS + '05 荒行子·昆仑叛教者.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, put } = K;
const T = makeTerrain(K);

const HALL = { x: 3, z: -37, rx: 12, rz: 6 };
const PATH = P2.pathLine([[2, -30], [-1, -22], [2, -12], [-1, 0], [2, 12], [0, 24], [1, 36]]);
const inner = (z) => 14 + Math.sin(z * 0.3) * 1.0;
const dist = (L, x, z) => { let d = 1e9; for (const [px, pz] of L.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const ELITES = [[-5, 12, -8], [6, -2, 9], [-5, -17, -9]];
const inSight = (x, z) => ELITES.some(([ex, ez, yaw]) => { const d = z - ez; if (d < -2.5 || d > 18) return false; return Math.abs(x - ex - d * Math.tan(yaw * Math.PI / 180)) < 4.5 + d * 0.35; });

H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, drifts }) => {
  washes([C.washA, C.washB, C.washB, C.washC]);
  for (const s of [-1, 1]) { const pts = []; for (let z = 36; z >= -54; z -= 2) pts.push([s * (inner(z) - 1.2 + Math.sin(z * 0.7) * 0.6), z]); pts.push([s * 50, -54], [s * 50, 36]); torn(pts, P2.rgba('#5e6860', 0.85)); }
  torn(bandOf(PATH.pts, 1.9), C.path);
  g.strokeStyle = P2.rgba('#5a5e58', 0.4); g.lineWidth = 0.06 * ppu; for (const [x, z] of PATH.pts) { if (r() < 0.4) continue; g.strokeRect(X(x - 1.1), Z(z - 0.5), 2.2 * ppu, 0.9 * ppu); }
  const ell = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * 6.283; return [HALL.x + Math.cos(a) * HALL.rx * 1.15, HALL.z + Math.sin(a) * HALL.rz * 1.3]; });
  torn(ell, P2.rgba(C.floor, 0.95));
  g.strokeStyle = P2.rgba('#3a2a28', 0.5); g.lineWidth = 0.05 * ppu; for (let z = -45; z < -29; z += 1.2) { g.beginPath(); g.moveTo(X(-11), Z(z)); g.lineTo(X(17), Z(z)); g.stroke(); }
  for (let k = 0; k < 300; k++) { const x = HALL.x + (r() - 0.5) * 26, z = HALL.z + (r() - 0.5) * 13; g.fillStyle = P2.rgba('#efe8d6', 0.8); g.beginPath(); g.arc(X(x), Z(z), 0.15 * ppu, 0, 7); g.fill(); }
  drifts((x, y) => { g.fillStyle = r() < 0.5 ? P2.rgba('#5e7a4e', 0.5) : P2.rgba('#3e5a3e', 0.4); g.beginPath(); g.ellipse(x, y, (0.2 + r() * 0.4) * ppu, (0.12 + r() * 0.2) * ppu, r() * 3, 0, 7); g.fill(); }, { n: 12000 });
});

// ---- the gorge: misty cliffs (dark near, pale far), cages hung along the path, ribbons, ferns, the shrine gate ----------------------------
const col = (i, n) => { const k = i / (n - 1); return { rock: P2.mix('#4e5a52', '#9aa49c', k * 0.85), dark: P2.mix('#2a322e', '#6a746e', k * 0.85), moss: P2.mix('#4e6a44', '#8a9a7a', k * 0.8), pine: P2.mix('#1e2a24', '#4a5a50', k * 0.7), mist: '#d8e0da' }; };
const ZL = [27, 16, 5, -6, -17, -28, -39], ZR = [22, 11, 0, -11, -22, -33, -44];
const wl = T.wings({ zs: ZL, side: -1, inner: (z) => -inner(z), w: (z, i) => 22 + i, h: (z, i) => 14 + i * 2.4, colors: (i) => col(i, 7), seed: 71, opts: { plateau: 0.4, spires: 2 } });
const wr = T.wings({ zs: ZR, side: 1, inner: (z) => inner(z), w: (z, i) => 22 + i, h: (z, i) => 14.5 + i * 2.4, colors: (i) => col(i, 7), seed: 77, opts: { plateau: 0.4, spires: 2 } });
T.range({ z: -58, x: 0, w: 160, h: 34, color: '#8a948e', cap: '#c8d0ca', seed: 71, peaks: 8 });
const cages = [];
for (const [x, z, f] of [[-10, 20, false], [10, 15, true], [-10.5, 2, false], [11, -10, true], [-11, -25, false], [10.5, -24, true]]) if (!inSight(x, z)) cages.push(sticker('cage', 6.5, { x, z, res: 1.1, flip: f, group: z < -20 ? 'field' : 'world' }));
sticker('gate', 10, { x: 0.5, z: -6.5, res: 1.3 });
for (const [x, z, f] of [[-6.5, 26, false], [7, 6, true], [-7, -9, false]]) if (!inSight(x, z)) sticker('ribbons', 4.6, { x, z, res: 1.1, flip: f });
const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
const foot = (w, dz, k = 1.5) => [w.cliff.side * (inner(w.cliff.z + dz) - k), 0.05, w.cliff.z + dz];
threadBand(film, { a: wAt(wl[1], 0.3), b: foot(wl[1], -7), n: 110, wA: 1.2, wB: 4.0, seed: 71 });
threadBand(film, { a: wAt(wr[2], 0.3), b: foot(wr[2], -7), n: 110, wA: 1.2, wB: 4.0, seed: 72 });
threadBand(film, { a: wAt(wl[3], 0.25), b: [-12, 0.05, -14], n: 110, wA: 1.2, wB: 4.0, seed: 73 });
mark(-5, 12, 2.4); mark(6, -2, 2.4); mark(-5, -17, 2.4);
fill(260, [-14, 14, -28, 33], [rock, bush, tuft, tuft], (x, z) => Math.abs(x) < inner(z) - 1.5 && dist(PATH, x, z) > 2.4 && !inSight(x, z), { per: [2, 4], size: [0.4, 0.75] });
for (let i = 0; i < 18; i++) { const x = between(-12, 12), z = between(-26, 30); if (dist(PATH, x, z) < 2.5 || inSight(x, z) || !clear(x, z, -0.5)) continue; sticker('fern', 2.4, { x, z, stamp: true, sway: 0.6, mark: false }); }

// ---- the Lady's Shrine (rises for the fight) and, for phase two, the red void --------------------------------------------------------
const ARENA_T = 12.4, DS = 3.9;   // v4: the boss fight keeps its v3 times, shifted DS later (film.shift)
const hall = sticker('redhall', 14, { x: HALL.x, z: -46, res: 1.5, group: 'arena' });
sticker('altar', 4, { x: HALL.x, z: -42.5, res: 1.2, group: 'arena' });
for (const [x, z] of [[-6, -42.5], [12, -42.5]]) sticker('candles', 2.2, { x, z, stamp: true, group: 'arena' });
// the hall's pillars: tall 3D red columns on their stone feet, both sides of the floor
const pillars = new THREE.Group();
for (const [x, z] of [[-10, -41], [-10, -34], [16, -41], [16, -34]]) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 11, 10), new THREE.MeshLambertMaterial({ color: '#8e1a14' })); p.position.set(x, 5.5, z); p.castShadow = true; pillars.add(p);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.6, 8), new THREE.MeshLambertMaterial({ color: '#6a625c' })); b.position.set(x, 0.3, z); pillars.add(b);
}
H.scene.add(pillars);
const P2START = 25.6;   // when the world turns red (set from the phase change below)
film.every((t) => { const up = clamp((t - ARENA_T - DS - 0.6) / 0.6), down = clamp((t - P2START - DS - 0.1) / 0.4); pillars.scale.set(1, Math.max(0.001, up * (1 - down)), 1); pillars.visible = up > 0 && down < 1; });
// the red void: tall plain red flats (a ring of cliff outlines, printed in red only) rise round the floor in phase two
const voidCol = (i) => ({ rock: P2.mix('#7a0e0e', '#c0281c', (i % 3) / 2), dark: '#4a0606', moss: '#c0281c', pine: '#3a0404', mist: null, strata: false });
for (const [i, [x, z, side]] of [[-14, -30, -1], [-15, -41, -1], [-8, -49, -1], [20, -30, 1], [21, -41, 1], [14, -49, 1]].entries()) {
  const r = P2.rng(80 + i), { pts, top } = cliffOutline(16, 18 + (i % 3) * 3, side, r, { plateau: 0.5, spires: 2, pines: 0 });
  put(H.popup(pts, paintCliff({ top, seed: 80 + i, ...voidCol(i) }), { x, z, yaw: side < 0 ? 0.35 : -0.35, res: 0.7 }), 'void');
}
put(H.popup(P2.shape.rect(70, 30), (P) => { P.gradient('#5a0606', '#c0281c'); P.felt(0.6); P.marks('hatch', { color: '#3a0404', alpha: 0.25, size: 0.02, angle: 0.3 }); }, { x: HALL.x, z: -52, yaw: 0, res: 0.4 }), 'void');
// the red light: key, fill, sky and the paper's shadow colour all turn red in phase two
let L0 = null;
film.every((t) => {
  if (!L0) { L0 = []; H.scene.traverse((o) => { if (o.isLight && o.color) L0.push([o, o.color.clone(), o.groundColor ? o.groundColor.clone() : null]); }); L0.leak = PAPER_LIGHT.leak.value.clone(); }
  const k = clamp((t - P2START - DS) / 0.8), red = new THREE.Color('#ff3a28');
  for (const [o, c, gc] of L0) { o.color.copy(c).lerp(red, k * 0.85); if (gc) o.groundColor.copy(gc).lerp(new THREE.Color('#5a0606'), k); }
  PAPER_LIGHT.leak.value.copy(L0.leak).lerp(new THREE.Color('#6a0808'), k);
});

H.setHero(H.popup(null, null, { node: new THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-14, 16, 1, 14, -45, -28], n: 70, colors: ['#efe8d6', '#e2d8c2'], size: 0.24, wind: [0.2, -0.6, 0.2], seed: 4, shape: 'coin' });
drift(film, { box: [-16, 16, 0.5, 6, -30, 30], n: 30, colors: ['#d8e0da', '#c4ccc6'], size: 1.1, wind: [0.4, 0.02, 0.2], seed: 5, shape: 'petal' });
drift(film, { box: [-14, 14, 1, 9, -30, 30], n: 24, colors: ['#b3231a', '#8e1a14'], size: 0.24, wind: [0.6, -0.15, 0.3], seed: 6, shape: 'leaf' });

// ---- actors -------------------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const bifeng = createActor(film, { name: 'bifeng', poses: { p: IMG.bifeng }, height: 5.0, x: -5, z: 12 });
const kui = createActor(film, { name: 'kui', poses: { p: IMG.kui }, height: 4.8, x: 6, z: -2 });
const yumian = createActor(film, { name: 'yumian', poses: { p: IMG.yumian }, height: 4.8, x: -5, z: -17 });
const huang = createActor(film, { name: 'huang', poses: { p1: IMG.huang1, p2: IMG.huang2 }, height: 5.8, heights: { p2: 6.8 }, x: 8, z: -37, risen: true });
const B = beats(film, hero, huang, { dust: ['#5a4a48', '#3a2a28', '#efe8d6'] });
const S = film.sound, ZB = -37, ZH = -36;
const IRON = ['#3a3b40', '#5a5c62'];

// ---- up the gorge ----------------------------------------------------------------------------------------------------------------
const camIntro = intro(film, hero, { land: [0, 21], t1: 1.0 });
film.rise('world', 0.55, { from: [0, 21], speed: 42 });
film.rise('field', 0.55, { from: [0, 21], speed: 42, sound: false });
film.title({ t0: 1.0, dur: 3.0, name: '枷笼山', sub: '柒' }); S(1.0, 'title');
hero.hideBetween(1.9, ARENA_T + DS + 0.15);   // v4: 魂 off the page until the shrine
const E1 = 3.5, E2 = 5.9, E3 = 8.7;
// 毕峰 (横刀): the sword drawn flat from its sheath in one wide cut, a long crescent across the path
elite(film, bifeng, E1, { title: '横刀', name: '毕峰', move: 'none', dur: 2.2 });
bifeng.key(E1 + 0.6, { lean: 0.1 }).key(E1 + 0.85, { lean: -0.14, ease: 'out' }).key(E1 + 1.4, { lean: 0 });
slash(film, { t: E1 + 0.8, at: [-5, 2.0, 12.6], radius: 5.6, width: 0.7, a0: 3.4, a1: -0.3, normal: [0, 1, 0.08], dur: 0.4, color: '#2a2a2e', core: '#e8e0d0', sound: 'heavy' });
shards(film, { t: E1 + 0.95, at: [-2, 1.2, 13.5], n: 20, colors: ['#d8e0da', '#b3231a'], speed: 6, up: 2, size: 0.3, seed: 71, shape: 'strip' });
// 奎艳艳 (疯婆子): the huge blade swung round and round her like a mill wheel
elite(film, kui, E2, { title: '疯婆子', name: '奎艳艳', move: 'none', dur: 2.6 });
kui.key(E2 + 0.5, { jit: 0.05 }).key(E2 + 2.0, { jit: 0.05 }).key(E2 + 2.1, { jit: 0 });
for (let k = 0; k < 3; k++) slash(film, { t: E2 + 0.6 + k * 0.42, at: [6, 2.4, -2], radius: 3.4, width: 1.0, a0: k * 2.1, a1: k * 2.1 + 5.6, normal: [0.15 * (k - 1), 1, 0.2], dur: 0.45, color: '#5a1a14', core: '#efe8d6', sound: k === 2 ? 'heavy' : 'whoosh' });
sawRing(film, { t: E2 + 1.4, at: [6, 0.05, -2], r0: 1, r1: 5, color: '#8e1a14', width: 0.4, dur: 0.7, seed: 72 });
// 玉面郎君: he opens his fan; paper petals fall like a veil; he is gone from where he stood and bows from somewhere else,
// twice, as he talks
elite(film, yumian, E3, { title: '玉面郎君', name: '玉面郎君', move: 'none', at: [-5, -17], burst: ['#ece2c8', '#b3231a'], dur: 7.2 });
shards(film, { t: E3 + 0.9, at: [-4, 9, -16.5], n: 70, colors: ['#ece2c8', '#f6f0e2', '#b3231a'], speed: 2, up: -1, size: 0.34, gravity: 1.2, shape: 'drop', life: 4.5, seed: 73, drag: 2.5 });
for (const [k, [a, b]] of [[[-5, -17], [-8.2, -15.6]], [[-8.2, -15.6], [-4.4, -18.6]]].entries()) {
  const t = E3 + 2.2 + k * 2.2; afterimage(film, { t, img: IMG.yumian, at: a, height: 4.8, tint: '#ece2c8', alpha: 0.6, dur: 0.6 });
  yumian.key(t, { x: a[0], z: a[1] }).key(t + 0.05, { x: b[0], z: b[1], snap: true }).key(t + 0.6, { lean: 0 }).key(t + 0.85, { lean: -0.12 }).key(t + 1.3, { lean: 0 }); S(t, 'blink');
  curls(film, { t: t + 0.05, from: [b[0], 0.5, b[1]], to: [b[0] + 1, 4.5, b[1]], n: 6, colors: ['#ece2c8', '#b3231a', '#f6f0e2'], dur: 0.6, spread: 1.2, seed: 74 + k, sound: null });
}
{ const V = film.voice; V(E1 + 0.85, 'vo/bifeng_hurt_01.wav'); V(E2 + 1.3, 'vo/kuiyanyan_attack_heavy_01.wav'); V(E3 + 0.3, 'vo/yumianlangjun_encounter_line_01.wav', { kind: 'line', seg: 'squeeze' }); }
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 5, -6], dist: 64, pitch: 32, yaw: 4, focus: [0, 4, -6] },
  { t: 3.3, target: [1, 5, -11], dist: 58, pitch: 30, yaw: 1, ease: 'linear', focus: [0, 4, -11] },
  // 毕峰, low: the long cut sweeps across the frame
  { t: E1 + 0.1, target: [-4.4, 3.2, 12.6], dist: 21, pitch: 11, yaw: -6, focus: [-5, 3, 12], ease: 'cut' },
  { t: E2 - 0.25, target: [-4.6, 3.2, 12.4], dist: 19, pitch: 11, yaw: -3, ease: 'linear', focus: [-5, 3, 12] },
  // 奎艳艳 from above, the mill of her blade
  { t: E2 - 0.2, target: [5.6, 2.6, -1.6], dist: 24, pitch: 40, yaw: 10, focus: [6, 2.4, -2], ease: 'cut' },
  { t: E3 - 0.25, target: [5.8, 2.6, -1.8], dist: 22, pitch: 38, yaw: 7, ease: 'linear', focus: [6, 2.4, -2] },
  // 玉面郎君: a slow arc round him through the falling petals
  { t: E3 - 0.2, target: [-5.6, 3.4, -16.6], dist: 27, pitch: 33, yaw: -18, focus: [-5.5, 3.2, -16.5], ease: 'cut' },
  { t: E3 + 4.0, target: [-6.6, 3.2, -16.2], dist: 24, pitch: 31, yaw: -22, ease: 'linear', focus: [-7, 3.2, -16] },
  { t: E3 + 7.3, target: [-5.0, 3.2, -17.6], dist: 22, pitch: 29, yaw: -16, ease: 'linear', focus: [-4.6, 3.2, -18.4] },
]);
film.shift(DS);   // ---- from here on: the v3 boss fight, DS later

// ---- the shrine -------------------------------------------------------------------------------------------------------------------
film.rise('arena', ARENA_T, { from: [HALL.x, -40], speed: 26 });
film.rise('field', ARENA_T - 0.1, { from: [0, -22], speed: 40, open: 0 });
hero.key(12.6, { hidden: false, pose: 'run', x: -1, z: -26, face: 1, rise: 1 }).key(13.8, { x: -3, z: ZH, ease: 'linear' }).key(13.82, { pose: 'idle' });
S(12.65, 'steps', { dur: 1.2 });
huang.key(0, { hidden: true }).key(14.0, { hidden: false, rise: 1 }); S(14.0, 'rise', { size: 0.9 });
film.plate({ t0: 14.3, dur: 2.4, title: '昆仑叛教者', name: '荒行子', boss: true, seal: '首' });

// phase one. the ball and chain: swung overhead (a circling chain), slammed down in front of 魂 (he steps back)
const hand = () => [huang.x - 1.0, 4.2, huang.z + 0.2];
paperChain(film, { t: 14.8, dur: 1.3, links: 26, size: 0.22, colors: IRON, sound: 'chain', path: (u, lt) => { const h = hand(), a = lt * 9; return [h[0] + Math.cos(a) * 3.6 * u, h[1] + 1.2 * u, h[2] + Math.sin(a) * 2 * u]; }, reach: (lt) => Math.min(1, lt / 0.25) });
paperBall(film, { t: 16.0, from: [6, 6.5, ZB], to: [-1.2, 0.6, -36.2], dur: 0.32, arc: 1.5, r: 1.0, colors: IRON, seed: 3, sound: 'whoosh', burst: false });
hero.key(16.05, { pose: 'dodge', x: -3 }).key(16.3, { x: -5.2, ease: 'out' }).key(16.4, { pose: 'idle' });
popBurst(film, { t: 16.32, at: [-1.2, 0, -36.2], r: 2.6, colors: ['#5a4a48', '#3a2a28', '#efe8d6'], crumple: 10, seed: 4, sound: 'boom' }); film.at(16.32, () => film.kick(1.0));
// the bladed ball thrown straight: guarded in a shower of orange sparks, 魂 slides back
paperBall(film, { t: 17.1, from: [6, 3, ZB], to: [-4.2, 2.4, ZH], dur: 0.3, arc: 0.3, r: 0.9, colors: IRON, seed: 5, sound: 'whoosh', burst: false });
paperChain(film, { t: 17.1, dur: 0.75, links: 24, size: 0.2, colors: IRON, sound: null, path: (u) => { const h = hand(); return [lerp(h[0], -4.2, u), lerp(h[1], 2.4, u), lerp(h[2], ZH, u)]; }, reach: (lt) => (lt < 0.3 ? lt / 0.3 : 1 - (lt - 0.3) / 0.45) });
B.guard(17.4, [-5.2, ZH], { back: 1.4, heavy: true, hold: 0.5 });
// the spin: a dark red circle spreads on the floor round him (the red flash); 魂 shadow-steps out to his back
huang.key(18.2, { x: 8 }).key(18.5, { x: 1.5, ease: 'out' });
sawRing(film, { t: 18.5, at: [1.5, 0.04, ZB], r0: 0.5, r1: 7, color: '#5a0a0a', width: 0.3, dur: 0.9, seed: 11 });
B.tell(18.7, [1.5, 5, -36.6], 'red');
B.shadowstep(18.85, [-6.6, ZH], [8.6, -36.4], { face: -1 });
huang.key(18.9, { jit: 0.1 }).key(19.5, { jit: 0.1 }).key(19.55, { jit: 0 });
paperChain(film, { t: 18.95, dur: 0.6, links: 26, size: 0.22, colors: IRON, sound: 'chain', path: (u, lt) => { const a = lt * 18; return [1.5 + Math.cos(a) * 5 * u, 2 + u * 0.5, ZB + Math.sin(a) * 2.6 * u]; } });
B.counter(19.7, [8.6, -36.4], [1.5, ZB], { face: -1, reach: 2.6 });
// the pole thrust (blue glint): deflected; the counter
huang.key(20.6, { face: -1 });
B.tell(20.8, [3.4, 3, -36.4], 'blue');
huang.key(20.85, { x: 1.5 }).key(21.0, { x: 2.6, ease: 'out' });
slash(film, { t: 21.0, at: [2.6, 2.6 - 9, -36], radius: 9, width: 0.5, a0: Math.PI / 2 + 0.05, a1: Math.PI / 2 - 0.3, normal: [0, 0, 1], color: '#3a3b40', core: '#d8d0c0', sound: 'whoosh' });
B.deflect(21.05, [6.4, -36.4], [2.6, ZB], { face: -1 });
B.counter(21.6, [6.4, -36.4], [2.6, ZB], { face: -1, reach: 1.4 });
// the skidding dash under grey dust (guarded heavy), then 魂's leap cut
huang.key(22.4, { x: 2.6 }).key(22.8, { x: 0.2, ease: 'out' });
for (let k = 0; k < 3; k++) B.ground(22.45 + k * 0.12, [2.6 - k * 0.9, ZB], 0.7);
B.guard(22.8, [4.6, -36.4], { face: -1, back: -1.0, heavy: true, hold: 0.5 });
B.leapCut(23.5, [5.6, -36.4], [4.2, -36.3], [0.2, ZB]);
hero.key(23.5, { face: -1 });

// the change: the Whirling Executioner. the hall folds away, the world turns red, a void of red flats rises
const P2T = B.phase(24.3, [0.2, ZB], 'p2', { heroFrom: [4.2, -36.3], heroTo: [7.5, -36.4], kind: 'spike', crownColors: ['#3a0404', '#c0281c', '#efe8d6'], color: ['#c0281c', '#7a0e0e', '#3a3b40'], flash: '#c0281c' });
film.rise('arena', P2START, { from: [HALL.x, -40], speed: 40, open: 0 });
film.rise('void', P2START + 0.1, { from: [HALL.x, -38], speed: 30 });
film.tint(P2START, { color: '#c0281c', dur: 30, peak: 0.12 });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '荒行子', name: '撕裂锯轮', boss: true, seal: '锯', barColor: '#7a0e0e' });
// the saw head spins up; now the saws: a wheel rolled at 魂 and back (guarded), another (he leaps it)
const W0 = P2T + 2.0;
wheel(film, { color: '#d8dce2', rim: '#5a0a0a', t: W0, at: [0.2, 6.2, -37.2], radius: 1.6, dur: 1.0, speed: 18 });
wheel(film, { color: '#d8dce2', rim: '#5a0a0a', t: W0 + 1.0, at: [1.5, 2.0, -36.8], to: [6.6, 2.0, -36.4], back: true, radius: 2.0, dur: 1.2, speed: 22 });
B.guard(W0 + 1.45, [7.5, -36.4], { face: -1, back: -0.6, heavy: true, hold: 0.5 });
wheel(film, { color: '#d8dce2', rim: '#5a0a0a', t: W0 + 2.3, at: [1.5, 2.0, -36.8], to: [9.5, 2.0, -36.4], back: true, radius: 2.0, dur: 1.2, speed: 22 });
hero.key(W0 + 2.55, { pose: 'overhead', x: 8.1, hop: 3 }).key(W0 + 3.0, { x: 7.4, ease: 'linear' }).key(W0 + 3.02, { pose: 'idle' }); S(W0 + 2.55, 'leap');
// the saw rush: he charges saw-first (the red flash); 魂 shadow-steps; the counter
const R = W0 + 3.6;
B.tell(R, [2, 6, -36.8], 'red');
B.shadowstep(R + 0.12, [7.4, -36.4], [-4.6, -36.4], { face: 1 });
huang.key(R + 0.2, { x: 0.2 }).key(R + 0.55, { x: 7, ease: 'out' });
wheel(film, { color: '#d8dce2', rim: '#5a0a0a', t: R + 0.2, at: [0.2, 4.6, -36.6], to: [8.5, 4.6, -36.6], radius: 1.6, dur: 0.6, speed: 26 });
huang.key(R + 0.9, { face: 1 });
B.counter(R + 1.0, [-4.6, -36.4], [7, ZB], { reach: 3.2 });
// two saws at once along the floor (guarded, guarded heavy); the last: the blue glint, the deflect, the finisher
wheel(film, { color: '#d8dce2', rim: '#5a0a0a', t: R + 1.9, at: [6, 1.8, -37.4], to: [-1.0, 1.8, -36.6], back: true, radius: 1.7, dur: 1.0, speed: 24, sound: 'saw' });
wheel(film, { color: '#d8dce2', rim: '#5a0a0a', t: R + 2.2, at: [6, 1.8, -35.8], to: [-1.0, 1.8, -35.8], back: true, radius: 1.7, dur: 1.0, speed: 24, sound: null });
B.guard(R + 2.35, [-1.4, ZH], { back: 0.6, hold: 0.3 }); B.guard(R + 2.65, [-2.0, ZH], { back: 0.8, heavy: true, hold: 0.45 });
B.tell(R + 3.4, [5, 5.2, -36.6], 'blue');
huang.key(R + 3.5, { x: 7 }).key(R + 3.7, { x: 3.6, ease: 'out' });
B.deflect(R + 3.7, [-2.6, ZH], [3.6, ZB], { stagger: 0.55 });
const FIN = R + 4.4;
B.finisher(FIN, [-2.4, ZH], [3.6, ZB], { face: 1 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
{ const V = film.voice;
  V(18.6, 'vo/huangxingzi_attack_01.wav', { cap: 1.6 }); V(19.6, 'vo/huangxingzi_hurt_01.wav');
  V(24.35, 'vo/huangxingzi_attack_02.wav', { cap: 1.8 });                   // the change
  V(R - 0.1, 'vo/huangxingzi_attack_01.wav', { cap: 1.6 }); V(R + 1.0, 'vo/huangxingzi_hurt_02.wav');
  V(FIN + 0.45, 'vo/huangxingzi_death_01.wav'); }

const OUT = FIN + 3.2;
const camOutro = outro(film, hero, { t0: OUT, from: [-2, -36], dur: 1.4, color: '#7a1010', nextColor: GROUNDS['08-estate'] });
for (const a of [bifeng, kui, yumian]) a.key(OUT, { rise: 0 });
film.rise('void', OUT + 0.05, { from: [-2, -36], speed: 110, open: 0, sound: false });
paperColorTo(P2START + DS, '#7a1010');
function paperColorTo(t, color) {
  // the paper beyond the sheet and the background go red with the world (the outro's own colour keys take over later)
  let beyond = null; H.scene.traverse((o) => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && o.geometry.parameters.width === 800) beyond = o; });
  const c0 = new THREE.Color(C.ground), c1 = new THREE.Color(color), c = new THREE.Color();
  film.every((tt) => { if (tt >= OUT + DS) return; const k = clamp((tt - t) / 0.8); c.copy(c0).lerp(c1, k); if (beyond) beyond.material.color.copy(c); H.scene.background = c.clone(); });
}

// ---- camera ----------------------------------------------------------------------------------------------------------------------
const duel = (t, o = {}) => ({ t, target: [2, 2.8, -36.4], dist: 33, pitch: 27, yaw: 0, focus: [2, 2.8, -36.6], ...o });
film.camera([
  { t: 12.9, target: [2, 5, -33], dist: 44, pitch: 25, yaw: 0, focus: [3, 4, -40] },
  { t: 13.85, target: [2.5, 4.5, -34], dist: 40, pitch: 25, yaw: 0, ease: 'linear', focus: [3, 4, -40] },
  // v4: 荒行子 seen from the shrine floor
  { t: 13.9, target: [7.4, 3.6, -37], dist: 19, pitch: 6, yaw: -18, focus: [8, 3.4, -37], ease: 'cut' },
  { t: 14.85, target: [7.6, 3.8, -37], dist: 17, pitch: 7, yaw: -14, ease: 'linear', focus: [8, 3.6, -37] },
  duel(14.9, { dist: 34, ease: 'cut' }),
  duel(16.8, { dist: 31, ease: 'linear', target: [0.5, 2.8, -36.4] }),
  duel(18.4, { dist: 31, target: [1.5, 3, -36.4] }),
  duel(20.6, { dist: 29, target: [4, 3, -36.4] }),
  duel(23.4, { dist: 30, ease: 'linear', target: [3, 3, -36.4] }),
  { t: P2T - 0.6, target: [1.5, 3.6, -36.8], dist: 25, pitch: 27, yaw: -6, focus: [0.2, 3.4, ZB] },
  { t: P2T + 1.4, target: [2, 5, -37], dist: 36, pitch: 22, yaw: -4, ease: 'linear', focus: [0.2, 3.8, ZB] },
  duel(W0, { dist: 33, target: [3.5, 3, -36.4] }),
  duel(R, { dist: 32, ease: 'linear', target: [3, 3, -36.4] }),
  duel(R + 1.6, { dist: 32, target: [1.5, 3, -36.4] }),
  duel(FIN - 0.4, { dist: 27, target: [0.6, 3, -36.4] }),
  // v4: the kill over 魂's shoulder (he is on the left), then wide for the stamp
  { t: FIN - 0.05, target: [-0.6, 3.0, -36.6], dist: 18, pitch: 13, yaw: -42, focus: [3.6, 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [-0.6, 2.8, -36.6], dist: 16.5, pitch: 13, yaw: -38, ease: 'linear', focus: [3.6, 2.6, -37] },
  duel(FIN + 1.25, { dist: 27, pitch: 30, target: [0.6, 2.8, -36.4], ease: 'cut' }),
  duel(FIN + 2.6, { dist: 29, pitch: 31, ease: 'linear', target: [0.6, 2.8, -36.4] }),
  ...camOutro,
]);
film.start();
