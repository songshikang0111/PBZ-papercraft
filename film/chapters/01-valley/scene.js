// 第一章 · 悲泣溪谷 (Weeping Creek), v2. A canyon built as a tunnel book: cliff flats stand in staggered rows on both
// sides of a stream that runs down the page toward the camera. The film walks UP the canyon: the tower yard (残钢),
// the ruined hut (彭猛), the blood flower field and the bridal pavilion (阿花), and at its head the waterfall pool, whose
// cliff rises only for the fight with 追命 (two phases, his signature moves: the long chain lash, the hook throw, the
// dash-in sickle string, the vault, the six-sickle whirl and the closing chain ring). ~41 s with hit-stops.
//
// PAPER SPEC
// BRIEF    Phantom Blade Zero ch.1: a grey-green mountain canyon of weathered stone, moss and timber, cut by a field of
//          red spider lilies and strung with great bands of red thread; overcast cool day; somber wuxia.
// SUBJECT  the canyon as a pop-up tunnel book; twist: the Hunt drops into the pool and becomes the six-sickle form.
// STOCK    cool cream cardstock (#f1efe6), quiet fibre.
// PALETTE  canyon floor #a9a895 / #8c927b; cliffs #7d806f (near, dark) -> #a3a898 (far, pale); moss #6f7d52;
//          accents lily crimson #b3231a, thread #a3161a, water celadon #7d998c; ink #2a201a; shadow #2f4a46
// LIGHT    overcast key #fff1dd from the upper left, fill #d6e0da, teal-green shadows
// LENS     fov 26; the walk up the canyon at pitch 28-36 (low, so the walls read tall); the duel at 26-30
// LIFE     drifting lily petals and grey leaves; the paper-strip waterfall; splash crowns and ripples in the pool
// BANNED   odd geometric props, repeated pipes, occluding risers, glossy water, glow, CG particles
import { setupChapter, threads, threadBand, threadWrap, beats, elite, intro, outro, GROUNDS, createActor, makeHero, slash, shards, rings, crown, drift, P2 } from '../../common/kit.js';
import { makeTerrain } from '../../common/terrain.js';
import { paperChain, paperFalls, popBurst, sparks, paperLily, afterimage, curls } from '../../common/fx.js';
import { titleCard, LOGO } from '../../common/titlecard.js';

const S0 = '/work/film/stickers/01-valley/', BOSS = '/work/boss-chibi/透明PNG/01 悲泣溪谷/';
const C = { ground: GROUNDS['01-valley'], washA: '#9c9f87', washB: '#b6b39d', washC: '#8c927b', path: '#d0c9b2', moss: '#7d8a5e', mossDark: '#5d6b46', rockFloor: '#7f8172',
  water: '#7d998c', waterDeep: '#5a7569', lilyGround: '#7a4a40', red: '#b3231a', crimson: '#8e1a14', foam: '#e9efe6', steel: '#4b4c52' };
const K = await setupChapter({
  id: '01-valley', ground: C.ground, duration: 41.5,
  bounds: { x0: -46, x1: 46, z0: -52, z1: 34 },
  light: { key: '#fff1dd', keyIntensity: 2.8, keyDir: [-0.75, 0.95, 0.45], fill: '#d6e0da', fillIntensity: 0.9, sky: '#e8efe8', ground: '#7d8a72', skyIntensity: 0.5, leak: '#2f4a46' },
  lens: { haze: '#c3c9b6', hazeStart: 40, hazeEnd: 130, hazeAmount: 0.32, saturation: 0.94, tint: [0.99, 1.0, 1.0], exposure: 0.86, vignette: 0.08 },
  stickers: {
    tower: S0 + 'tower.png', falls: S0 + 'cliff-falls.png', wedding: S0 + 'wedding.png', hut: S0 + 'hut.png', lilyA: S0 + 'lily-a.png', lilyB: S0 + 'lily-b.png',
    deadtree: S0 + 'deadtree.png', pine: S0 + 'pine.png', scaffold: S0 + 'scaffold.png', stele: S0 + 'stele.png', redposts: S0 + 'redposts.png', planks: S0 + 'planks.png', pipe: S0 + 'pipe.png',
    __logo: LOGO, canggang: BOSS + '01 残钢.png', pengmeng: BOSS + '02 彭猛.png', ahua: BOSS + '03 新娘阿花.png', zm2: BOSS + '04 追命·六绝凶镰.png', zm1: BOSS + '05 追命·组织猎杀者.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, spire, bush, tuft, stake, fill, house } = K;
const T = makeTerrain(K);

// ---- the plan of the canyon ---------------------------------------------------------------------------------------
const POOL = { x: 3, z: -37, rx: 10.5, rz: 5.2 };
const inPool = (x, z, k = 1) => ((x - POOL.x) / (POOL.rx * k)) ** 2 + ((z - POOL.z) / (POOL.rz * k)) ** 2 < 1;
const poolPts = (k) => Array.from({ length: 48 }, (_, i) => { const a = i / 48 * Math.PI * 2, w = 1 + 0.06 * Math.sin(a * 3 + 1) + 0.04 * Math.sin(a * 7); return [POOL.x + Math.cos(a) * POOL.rx * k * w, POOL.z + Math.sin(a) * POOL.rz * k * w]; });
const STREAM = P2.pathLine([[3, -33], [0.5, -26], [3.5, -15], [-0.5, -3], [3, 9], [0, 21], [2, 36]]);
const LILY = { x: -7, z: -20, rx: 6.5, rz: 4.2 };
const inner = (z) => 14 + Math.max(0, (z + 40) * 0.02) + Math.sin(z * 0.3) * 0.8;   // canyon half-width
const sDist = (x, z) => { let d = 1e9; for (const [px, pz] of STREAM.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const floorOK = (x, z) => Math.abs(x) < inner(z) - 1.5 && !inPool(x, z, 1.15) && sDist(x, z) > 2.4 && z > -44;

// ---- the printed floor --------------------------------------------------------------------------------------------
H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, line, drifts, water }) => {
  washes([C.washA, C.washA, C.washB, C.washC]);
  // the rock shelves under the walls, outside the canyon floor
  for (const s of [-1, 1]) { const pts = []; for (let z = 36; z >= -54; z -= 2) pts.push([s * (inner(z) - 1.2 + Math.sin(z * 0.7) * 0.6), z]); pts.push([s * 50, -54], [s * 50, 36]); torn(pts, P2.rgba(C.rockFloor, 0.85)); }
  // the blood flower field
  const lp = (k) => Array.from({ length: 36 }, (_, i) => { const a = i / 36 * 6.283, w = 1 + 0.12 * Math.sin(a * 4 + 2) + 0.06 * Math.sin(a * 9); return [LILY.x + Math.cos(a) * LILY.rx * k * w, LILY.z + Math.sin(a) * LILY.rz * k * w]; });
  torn(lp(1.08), P2.rgba('#8b6a58', 0.7)); torn(lp(0.95), P2.rgba(C.lilyGround, 0.85)); torn(lp(0.55), P2.rgba(C.crimson, 0.55), 'rgba(0,0,0,0)');
  for (let k = 0; k < 700; k++) { const a = r() * 6.283, rr = Math.sqrt(r()), x = LILY.x + Math.cos(a) * LILY.rx * rr, z = LILY.z + Math.sin(a) * LILY.rz * rr; g.fillStyle = r() < 0.7 ? P2.rgba(C.red, 0.75) : P2.rgba('#e2553e', 0.7); g.beginPath(); g.ellipse(X(x), Z(z), 0.16 * ppu, 0.08 * ppu, r() * 3, 0, 7); g.fill(); }
  // the tower yard's flagstones and its loose coils of red thread
  g.strokeStyle = P2.rgba('#5f625c', 0.35); g.lineWidth = 0.08 * ppu;
  for (let z = 2; z < 13; z += 1.6) for (let x = -13; x < -4; x += 2.2 + r() * 0.8) { if (r() < 0.3) continue; g.strokeRect(X(x), Z(z), 2.0 * ppu, 1.4 * ppu); }
  g.lineWidth = 0.06 * ppu; for (let k = 0; k < 22; k++) { const x = -13 + r() * 9, z = 1 + r() * 10; g.strokeStyle = P2.rgba('#a3161a', 0.55); g.beginPath(); g.moveTo(X(x), Z(z)); for (let s = 0; s < 4; s++) g.quadraticCurveTo(X(x + (r() - 0.5) * 2.5), Z(z + (r() - 0.5) * 2.5), X(x + (r() - 0.5) * 3), Z(z + (r() - 0.5) * 3)); g.stroke(); }
  drifts((x, y) => { g.fillStyle = r() < 0.5 ? P2.rgba(C.moss, 0.55) : P2.rgba(C.mossDark, 0.45); g.beginPath(); g.ellipse(x, y, (0.2 + r() * 0.4) * ppu, (0.12 + r() * 0.2) * ppu, r() * 3, 0, 7); g.fill(); }, { n: 14000 });
  drifts((x, y) => { g.strokeStyle = P2.rgba(r() < 0.5 ? '#6c7a52' : '#8e9870', 0.7); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 4 - r() * 4); g.stroke(); }, { n: 8000, threshold: 0.6 });
  // the stream and the pool
  water(bandOf(STREAM.pts, (u) => 1.5 + Math.sin(u * 11) * 0.3), { colors: [C.water, C.waterDeep], rim: '#cfcbb8', inset: 0.4, marks: 'ripples', markColor: P2.rgba(C.foam, 0.7), flow: 0.3, foam: P2.rgba(C.foam, 0.5) });
  water(poolPts(1), { colors: [C.water, C.waterDeep], rim: '#cfcbb8', inset: 0.55, marks: 'ripples', markColor: P2.rgba(C.foam, 0.75), flow: 0.15, foam: P2.rgba(C.foam, 0.6) });
});

// ---- the canyon walls (tunnel-book flats) and the far ranges ----------------------------------------------------------
const cliffCol = (i, n) => { const k = i / (n - 1); return { rock: P2.mix('#5c6056', '#8f9586', k * 0.85), dark: P2.mix('#363a33', '#666c60', k * 0.85), moss: P2.mix('#5f6d46', '#8e9a74', k * 0.8), pine: P2.mix('#27302a', '#5c6a58', k * 0.8), mist: '#c9cebd' }; };
const ZL = [27, 16, 5, -6, -17, -28, -39], ZR = [22, 11, 0, -11, -22, -33, -44];
const wl = T.wings({ zs: ZL, side: -1, inner: (z) => -inner(z), w: (z, i) => 22 + i, h: (z, i) => 13 + i * 2.2, colors: (i) => cliffCol(i, ZL.length), seed: 3, opts: { plateau: 0.45, spires: 1 } });
const wr = T.wings({ zs: ZR, side: 1, inner: (z) => inner(z), w: (z, i) => 22 + i, h: (z, i) => 14 + i * 2.2, colors: (i) => cliffCol(i, ZR.length), seed: 7, opts: { plateau: 0.5, spires: 2 } });
T.range({ z: -54, x: 0, w: 150, h: 30, color: '#a7ad9f', cap: '#c9cdbf', seed: 11, peaks: 8 });
T.range({ z: -60, x: 10, w: 170, h: 38, color: '#b9beb1', cap: '#d6d9cd', seed: 12, peaks: 6 });
for (const [x, z, h] of [[-15, 24, 9], [16, 18, 10], [-15, -3, 10], [15.5, -8, 9], [-14, -26, 11], [14, -26, 10]]) sticker('pine', h, { x, z, stamp: true, res: 1.0, group: z < -20 ? 'field' : 'world' });

// ---- the tower yard (残钢) ------------------------------------------------------------------------------------------------
const tower = sticker('tower', 19, { x: -10.5, z: 1, yaw: 0.1, res: 1.4 });
sticker('scaffold', 7.5, { x: -3.5, z: 0.5, res: 1.1 });
const stele = sticker('stele', 4, { x: -12, z: 10, res: 1.1 });
sticker('redposts', 4.2, { x: -4.5, z: 12, res: 1.1 });
sticker('planks', 3, { x: -13, z: 5.5, res: 1.0 });
const st = [[-6, 6.5], [-2.8, 4.5], [-12.5, 13.5], [6, 13]].map(([x, z]) => { mark(x, z, 0.8); return stake(x, z, 2.3); });
const top = (h) => ({ h, at: [0, 2.2] });
threads(film, [{ a: top(st[0]), b: top(st[1]) }, { a: top(st[0]), b: { h: stele, at: [0, 3.4] } }, { a: { h: stele, at: [0, 3.4] }, b: top(st[2]) }], { sag: 0.12 });
threadWrap(film, { h: tower, at: [0.2, 0], r: 1.4, y0: 10.5, y1: 13.2, turns: 10 });
// the great bands: down from the tower's crown across the stream, and from the cliffs above
// (the bands run along the walls and behind the landmarks, never across a shot: they frame the canyon's sides)
threadBand(film, { a: { h: tower, at: [-0.4, 15.5] }, b: [-16, 0.05, -7], n: 120, wA: 1.2, wB: 4.5, seed: 1 });
const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
const foot = (w, dz, k = 1.5) => [w.cliff.side * (inner(w.cliff.z + dz) - k), 0.05, w.cliff.z + dz];
threadBand(film, { a: wAt(wr[1], 0.3), b: foot(wr[1], -7), n: 120, wA: 1.4, wB: 4.5, seed: 3 });
threadBand(film, { a: wAt(wl[2], 0.3), b: foot(wl[2], -8), n: 110, wA: 1.2, wB: 4.0, seed: 4 });
threadBand(film, { a: wAt(wr[3], 0.25), b: foot(wr[3], -8), n: 120, wA: 1.4, wB: 4.6, seed: 5 });
threadBand(film, { a: wAt(wl[5], 0.3), b: foot(wl[5], -7), n: 120, wA: 1.4, wB: 4.4, seed: 8 });
mark(-8, 7.5, 2.4);   // 残钢's spot

// ---- the ruined hut (彭猛) ---------------------------------------------------------------------------------------------
sticker('hut', 7.5, { x: 10.5, z: -11, res: 1.1 });
sticker('pipe', 5.5, { x: 6.5, z: -14, yaw: -0.3, res: 1.0 });
mark(8, -5.5, 2.4);

// ---- the blood flower field and the bridal pavilion (阿花) ----------------------------------------------------------------
const wedding = sticker('wedding', 8, { x: -9.5, z: -25.5, res: 1.2, group: 'field' });
const dt1 = sticker('deadtree', 9, { x: -2.5, z: -24.5, res: 1.0, group: 'field' });
const dt2 = sticker('deadtree', 8, { x: -13, z: -21.5, res: 1.0, flip: true, group: 'field' });
threads(film, [{ a: { h: dt1, at: [1.5, 6.5] }, b: { h: wedding, at: [2.6, 6.2] } }, { a: { h: wedding, at: [-2.5, 6.2] }, b: { h: dt2, at: [1.2, 5.5] } }], { sag: 0.16 });
threadBand(film, { a: { h: dt1, at: [0.5, 7.5] }, b: [-1, 0.05, -31], n: 70, wA: 0.8, wB: 2.6, seed: 6 });
mark(-6, -18.5, 2.4);
for (let i = 0; i < 24; i++) { const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * 0.95, x = LILY.x + Math.cos(a) * LILY.rx * rr, z = LILY.z + Math.sin(a) * LILY.rz * rr; if (!clear(x, z, -1)) continue; sticker(rnd() < 0.45 ? 'lilyA' : 'lilyB', rnd() < 0.45 ? 2.2 : 1.6, { x, z, stamp: true, scale: between(0.85, 1.15), sway: 0.6, mark: false, group: 'field' }); mark(x, z, 1.0); }

// ---- the arena: the waterfall cliff closes the canyon's head only when the film arrives ------------------------------------
const ARENA_T = 12.2, D = 2.6, TT = 7.5;   // v5: TT = the film's title, played over this valley before the chapter starts   // v4: the boss fight is written in its v3 times and shifted D later (film.shift)
sticker('falls', 17, { x: POOL.x, z: -45.5, yaw: 0, res: 1.6, group: 'arena' });
for (const [x, z, s] of [[-8.5, -40.5, 1.1], [14, -40, 1.2], [-9.5, -33.5, 0.8], [15.5, -34, 0.9]]) { spire(x, z, s, 'arena'); mark(x, z, 1.8); }
for (const [x, z] of [[-7, -31.5], [13, -31], [-10.5, -37], [16, -37.5]]) { rock(x, z, between(0.6, 0.85), 'arena'); mark(x, z, 1.2); }
paperFalls(film, { at: [POOL.x + 1.6, 0, -44.6], w: 3.6, h: 11, n: 56, visible: (t) => t > ARENA_T + D + TT + 0.9 });
mark(POOL.x, POOL.z, 11);
mark(0, 29, 6.5);   // v5: the title stands here
fill(300, [-15, 15, -28, 33], [rock, bush, tuft, bush, tuft], floorOK, { per: [2, 5], size: [0.45, 0.85] });
fill(120, [-15, 15, -44, -28], [rock, tuft, tuft], floorOK, { per: [2, 4], size: [0.4, 0.7], group: 'field' });

H.setHero(H.popup(null, null, { node: new H.THREE.Group(), x: 0, z: 30 }));

// ---- life ----------------------------------------------------------------------------------------------------------
drift(film, { box: [-14, 2, 0.5, 6, -26, -14], n: 34, colors: ['#b3231a', '#d24a34', '#8e1a14'], size: 0.2, wind: [0.8, -0.1, 0.25], seed: 3 });
drift(film, { box: [-16, 16, 1, 10, -44, 30], n: 46, colors: ['#8e957c', '#a8a58b', '#6f7a5a', '#b3231a'], size: 0.24, wind: [0.6, -0.15, 0.9], seed: 7, shape: 'leaf' });

// ---- actors ------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const canggang = createActor(film, { name: 'canggang', poses: { p: IMG.canggang }, height: 4.8, x: -8, z: 7.5 });
const pengmeng = createActor(film, { name: 'pengmeng', poses: { p: IMG.pengmeng }, height: 5.6, x: 8, z: -5.5 });
const ahua = createActor(film, { name: 'ahua', poses: { p: IMG.ahua }, height: 4.8, x: -6, z: -18.5 });
const zm = createActor(film, { name: 'zhuiming', poses: { p1: IMG.zm1, p2: IMG.zm2 }, height: 6.0, heights: { p2: 7.4 }, x: 8, z: -37, risen: true });
const SPLASH = ['#e9efe6', '#b9cdc5', '#9db6ad'];
const B = beats(film, hero, zm, { splash: SPLASH });
const S = film.sound;
const ZB = -37, ZH = -36;   // the duel's lines: the boss a step behind 魂

// ---- the film's title (v5): the valley stands up at once and the camera glides through it toward the canyon mouth, where
// 「影之刃零」 and the red 「剪纸版」 seals stand up; they fold away as the camera reaches the pose chapter one starts from
film.rise('world', 0.25, { from: [0, 0], speed: 60 });
film.rise('field', 0.25, { from: [0, 0], speed: 60, sound: false });
const TC = titleCard(K, { x: 0, z: 26, logoH: 6.6 });
TC.rise(1.2); TC.fold(TT - 1.7);
film.camera([
  { t: 0, target: [-6, 6, -20], dist: 44, pitch: 22, yaw: -28, focus: [-4, 4, -18] },
  { t: 2.4, target: [-1, 4, 12], dist: 40, pitch: 14, yaw: -10, ease: 'smooth', focus: [0, 4, 26] },
  { t: 3.3, target: [0, 3.2, 26.5], dist: 28.5, pitch: 9, yaw: 0, ease: 'out', focus: [0, 3, 26] },
  { t: TT - 1.8, target: [0, 3.2, 26.5], dist: 26.5, pitch: 9, yaw: 0, ease: 'linear', focus: [0, 3, 26] },
  { t: TT, target: [0, 1.5, 26], dist: 46, pitch: 50, yaw: 0, ease: 'smooth', focus: [0, 1.5, 26] },
]);
hero.hideBetween(0, TT); hero.key(TT, { x: 0, z: 41, pose: 'run', face: 1 });   // he waits below the frame until his run
film.shift(TT);   // ---- chapter one proper, TT later

// ---- the walk up the canyon: three mid-boss showcases (v4: no fight, one signature moment each, the line said whole) -----
const camIntro = intro(film, hero, { land: [0, 21], t1: 1.0 });
hero.hideBetween(TT + 1.9, ARENA_T + D + TT + 0.15);   // 魂 is off the page until the pool
film.title({ t0: 1.0, dur: 3.0, name: '悲泣溪谷', sub: '壹' }); S(1.0, 'title');
const E1 = 3.5, E2 = 6.7, E3 = 10.3;
// 残钢: he drags the serrated blade round in two bleeding sweeps (seen from low, the blade over the lens)
elite(film, canggang, E1, { title: '痴狂暴徒', name: '残钢', move: 'none', dur: 2.8 });
canggang.key(E1 + 0.7, { lean: 0 }).key(E1 + 0.95, { lean: 0.16 }).key(E1 + 1.15, { lean: -0.12, ease: 'out' }).key(E1 + 1.6, { lean: 0.1 }).key(E1 + 1.8, { lean: -0.1, ease: 'out' }).key(E1 + 2.4, { lean: 0 });
for (const [k, dt] of [[0, 1.15], [1, 1.8]].map(([k, d]) => [k, d])) {
  slash(film, { t: E1 + dt, at: [-8, 1.6 + k * 0.6, 7.5], radius: 3.4, width: 1.0, a0: k ? 3.6 : -0.4, a1: k ? -0.6 : 3.6, normal: [0.05, 1, 0.25], color: '#7a1a14', core: '#d8c8b0', sound: k ? 'heavy' : 'slash', dur: 0.42 });
  shards(film, { t: E1 + dt + 0.12, at: [-8 + (k ? -1.5 : 1.5), 2.2, 8.5], n: 22, colors: ['#b3231a', '#8e1a14', '#e2553e'], speed: 5, up: 3, size: 0.34, gravity: 12, shape: 'strip', seed: 11 + k, life: 1.5 });
}
// 彭猛: the black aura winds round him, he charges, turns his back and slams the axe down behind him ("我决不能倒下！")
elite(film, pengmeng, E2, { title: '斧老大', name: '彭猛', move: 'none', dur: 3.2 });
curls(film, { t: E2 + 0.45, from: [8.6, 0.6, -5.5], to: [7.4, 5.4, -5.2], n: 9, r: 1.1, colors: ['#1a1414', '#3a1a1a', '#0c0a0a'], dur: 0.9, spread: 1.4, seed: 31, sound: 'gust' });
pengmeng.key(E2 + 1.1, { x: 8, z: -5.5, jit: 0.07 }).key(E2 + 1.45, { jit: 0 }).key(E2 + 1.5, { x: 8 }).key(E2 + 1.95, { x: 4.6, z: -3.2, ease: 'in' });
S(E2 + 1.5, 'dash'); shards(film, { t: E2 + 1.6, at: [7, 0.3, -4.5], n: 16, colors: ['#8d8a76', '#6d6a5c', '#a8a28a'], speed: 3, up: 3, size: 0.28, seed: 33 });
pengmeng.key(E2 + 2.05, { face: -1, lean: 0 }).key(E2 + 2.3, { lean: -0.24 }).key(E2 + 2.48, { lean: 0.14, ease: 'in' }).key(E2 + 2.9, { lean: 0 });
popBurst(film, { t: E2 + 2.48, at: [3.2, 0, -3.6], r: 2.6, colors: ['#a8a28a', '#8d8a76', '#6d6a5c'], crumple: 8, seed: 34, sound: 'boom' });
rings(film, { t: E2 + 2.48, at: [3.2, 0, -3.6], n: 2, r1: 4.5, color: '#3a3434', width: 0.26 }); film.at(E2 + 2.48, () => film.kick(0.9));
// 阿花: a blink (a pale print of her left behind), three white lilies thrown out, then the red flowers round her close and
// burst ("你这个负心汉！")
elite(film, ahua, E3, { title: '血肉花田', name: '新娘 · 阿花', move: 'none', at: [-6, -18.5], burst: ['#b3231a', '#d24a34', '#8e1a14'], dur: 3.4 });
S(E3 + 0.1, 'petals');
afterimage(film, { t: E3 + 0.85, img: IMG.ahua, at: [-6, -18.5], height: 4.8, tint: '#f4efe6', alpha: 0.55, dur: 0.45 });
ahua.key(E3 + 0.85, { x: -6, z: -18.5 }).key(E3 + 0.9, { x: -2.6, z: -17.2, snap: true }); S(E3 + 0.85, 'blink');
[[-4.8, -12.0], [-1.2, -11.0], [2.4, -12.2]].forEach(([x, z], i) => paperLily(film, { t: E3 + 1.2 + i * 0.22, from: [-2.2, 3.6, -17], to: [x, 0.3, z], dur: 0.5, arc: 2.6 + i * 0.4, size: 1.8, seed: 40 + i, hold: 1.0 + (2 - i) * 0.22 }));
crown(film, { t: E3 + 2.55, at: [-2.6, 0, -17.2], n: 18, radius: 3.8, height: 2.2, colors: ['#b3231a', '#8e1a14', '#d24a34'], kind: 'drop', hold: 0.5, seed: 45, sound: 'petals' });
crown(film, { t: E3 + 2.85, at: [-2.6, 0, -17.2], n: 12, radius: 2.0, height: 1.9, colors: ['#d24a34', '#b3231a'], kind: 'drop', hold: 0.3, seed: 46 });
popBurst(film, { t: E3 + 3.3, at: [-2.6, 0, -17.2], r: 3.0, colors: ['#b3231a', '#e2553e', '#8e1a14'], crumple: 10, seed: 47, sound: 'boom' }); film.at(E3 + 3.3, () => film.kick(0.8));
{ const V = film.voice; V(E2 + 0.05, 'vo/pengmeng_line_01.wav'); V(E2 + 2.5, 'vo/pengmeng_attack_heavy_01.wav'); V(E3 + 0.05, 'vo/ahua_line_01.wav'); V(E3 + 3.35, 'vo/ahua_attack_heavy_01.wav'); }
film.camera([
  camIntro[1],
  { t: 1.25, target: [2, 5, -8], dist: 66, pitch: 34, yaw: 4, focus: [0, 4, -8] },
  { t: 3.3, target: [1, 5, -13], dist: 58, pitch: 31, yaw: 1, ease: 'linear', focus: [0, 4, -13] },
  // 残钢 from low: the blade sweeps over the lens
  { t: E1 + 0.15, target: [-7.4, 2.8, 7.5], dist: 19, pitch: 9, yaw: -14, focus: [-8, 2.6, 7.5], ease: 'cut' },
  { t: E2 - 0.25, target: [-7.6, 2.6, 7.5], dist: 16, pitch: 7, yaw: -8, ease: 'linear', focus: [-8, 2.6, 7.5] },
  // 彭猛: a medium shot that tracks his charge, pushed in on the slam
  { t: E2 - 0.2, target: [7, 3.4, -5.2], dist: 27, pitch: 30, yaw: 12, focus: [8, 3, -5.5], ease: 'cut' },
  { t: E2 + 1.5, target: [6.6, 3.2, -4.8], dist: 25, pitch: 29, yaw: 10, ease: 'linear', focus: [7.6, 3, -5.2] },
  { t: E2 + 2.4, target: [4.4, 3.0, -3.6], dist: 20, pitch: 25, yaw: 6, ease: 'out', focus: [4.4, 2.6, -3.6] },
  { t: E3 - 0.3, target: [4.2, 3.0, -3.6], dist: 19, pitch: 25, yaw: 5, ease: 'linear', focus: [4.4, 2.6, -3.6] },
  // 阿花: over the flower field, following the blink and the thrown lilies
  { t: E3 - 0.25, target: [-5.4, 3.2, -18.5], dist: 25, pitch: 32, yaw: -9, focus: [-6, 3, -18.5], ease: 'cut' },
  { t: E3 + 0.95, target: [-2.4, 2.6, -14.8], dist: 24, pitch: 30, yaw: -4, ease: 'out', focus: [-1.6, 1.6, -13] },
  { t: E3 + 3.6, target: [-2.4, 2.6, -15.6], dist: 27, pitch: 33, yaw: -2, ease: 'linear', focus: [-2.4, 2, -16] },
]);
film.shift(TT + D);   // ---- from here on: the v3 boss fight, D later

// ---- the pool: the cliff rises, 魂 runs in, 追命 drops from the falls -------------------------------------------------------
film.rise('arena', ARENA_T, { from: [POOL.x, -40], speed: 26 });
film.rise('field', ARENA_T - 0.1, { from: [-4, -22], speed: 40, open: 0 });
hero.key(12.4, { hidden: false, pose: 'run', x: -2, z: -26, face: 1, rise: 1 }).key(13.6, { x: -3, z: ZH, ease: 'linear' }).key(13.62, { pose: 'idle' });
S(12.45, 'steps', { dur: 1.2 });
zm.key(0, { hidden: true, y: 17 }).key(13.6, { hidden: false, y: 17 }).key(14.02, { y: 0, ease: 'in' });
film.at(14.02, () => film.kick(1.0)); S(14.02, 'land', { size: 1 });
crown(film, { t: 14.02, at: [8, 0, ZB], n: 14, radius: 1.7, height: 2.8, colors: SPLASH, rows: 2, seed: 11 });
rings(film, { t: 14.02, at: [8, 0, ZB], n: 3, r1: 6.5, color: C.foam });
film.plate({ t0: 14.4, dur: 2.4, title: '组织猎杀者', name: '追命', boss: true, seal: '首' });

// the chain: a paper chain from his hand; lash = a long sweep, hook = a straight throw, low = skimming the water
const hand = () => [zm.x - 1.3, 3.0, zm.z + 0.2];
const lash = (t, { len = 13, a0 = 0.55, a1 = -0.45, y = 0.7, dur = 0.95, out = 0.16, back = 0.6, low = false } = {}) => paperChain(film, { t, dur, links: 48, size: 0.2,
  path: (u, lt) => { const h = hand(), th = lerp(a0, a1, smooth(lt / (back + 0.05))), L = len * u; return [h[0] - Math.cos(th) * L, low ? lerp(h[1], 0.45, Math.min(1, u * 3)) : h[1] * (1 - u) + y + Math.sin(Math.PI * u) * 0.8, h[2] + Math.sin(th) * L]; },
  reach: (lt) => (lt < out ? lt / out : lt > back ? 1 - (lt - back) / (dur - back) : 1), hook: '#3a3b40' });
const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t)), smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

// phase one: the long lash (guarded), the hook throw (dodged late), the dash-in sickle string (guarded hit by hit)
zm.key(14.85, { lean: 0 }).key(15.0, { lean: -0.18 }).key(15.3, { lean: 0.06 }).key(15.7, { lean: 0 });
lash(15.0);
B.guard(15.2, [-3, ZH], { back: 0.9 });
zm.key(15.95, { lean: -0.12 }).key(16.15, { lean: 0.05 }).key(16.5, { lean: 0 });
paperChain(film, { t: 16.05, dur: 0.85, links: 44, size: 0.2, path: (u) => { const h = hand(); return [lerp(h[0], -3.6, u), lerp(h[1], 1.4, u) + Math.sin(Math.PI * u) * 0.6, lerp(h[2], ZH, u)]; },
  reach: (lt) => (lt < 0.22 ? lt / 0.22 : lt > 0.45 ? 1 - (lt - 0.45) / 0.4 : 1), hook: '#3a3b40' });
hero.key(16.2, { pose: 'dodge', x: -3.9, z: ZH }).key(16.42, { x: -4.4, z: -33.2, ease: 'out' }).key(16.55, { pose: 'idle' });
sparks(film, { t: 16.27, at: [-3.6, 0.6, ZH], n: 14, seed: 41, sound: null }); B.ground(16.27, [-3.6, ZH], 0.8);
hero.key(16.75, { x: -4.4, z: -33.2 }).key(16.95, { x: -3.6, z: ZH, ease: 'out' });
zm.key(17.0, { x: 8 }).key(17.28, { x: 1.6, ease: 'out' });
S(17.0, 'dash'); B.ground(17.2, [4, ZB], 0.7);
[17.35, 17.6, 17.85, 18.1].forEach((t, i) => {
  slash(film, { t, at: [-1.2, 2.5, -36.2], radius: 2.9, width: 0.75, a0: i % 2 ? 2.4 : -0.6, a1: i % 2 ? -0.6 : 2.4, normal: [0.1, 0.2, 1], color: C.steel, core: '#d8d0c0', sound: 'whoosh' });
  B.guard(t + 0.05, [-3.6 - i * 0.35, ZH], { back: 0.35, hold: 0.24 });
});
// the vault: the blue glint on the planted sickle; the drop; 魂 deflects it and counters
zm.key(18.35, { x: 1.6, hop: 2.4 }).key(18.95, { x: 0.4, ease: 'linear' });
B.tell(18.55, [-0.6, 6.0, -36.4], 'blue');
B.deflect(18.92, [-5.0, ZH], [0.4, ZB]);
crown(film, { t: 18.95, at: [0.4, 0, ZB], n: 10, radius: 1.4, height: 2.2, colors: SPLASH, seed: 13 });
B.counter(19.5, [-5.0, ZH], [0.4, ZB]);
// the red tell: the heavy double-sickle cross; 魂 shadow-steps behind him and cuts him from the back
zm.key(20.2, { x: 0.4 }).key(20.45, { x: 2.0, ease: 'out' });
hero.key(20.2, { x: -2.8 }).key(20.45, { x: -3.4 });
zm.key(20.55, { lean: 0 }).key(20.7, { lean: -0.22 });
B.tell(20.7, [1.2, 5.4, -36.4], 'red');
B.shadowstep(20.85, [-3.4, ZH], [6.6, -36.4], { face: -1 });
zm.key(20.95, { lean: 0.1, ease: 'in' }).key(21.4, { lean: 0 });
slash(film, { t: 20.95, at: [-1.2, 2.4, -36.0], radius: 4.2, width: 1.1, a0: 2.5, a1: -0.8, normal: [0, 0.15, 1], color: '#7a1a14', core: '#e2553e', sound: 'heavy' });
slash(film, { t: 21.05, at: [-1.2, 2.4, -36.0], radius: 4.2, width: 1.1, a0: 0.6, a1: 3.9, normal: [0, 0.15, 1], color: '#7a1a14', core: '#e2553e', sound: null });
B.ground(21.0, [-3.4, ZH], 1.1);
B.counter(21.45, [6.6, -36.4], [2.0, ZB], { face: -1 });
// he leaps back to the falls; the low chain skims the water; 魂 hops it and comes down with the overhead cut
zm.key(22.2, { x: 2.0, hop: 2.6 }).key(22.75, { x: 9, ease: 'linear' });
hero.key(22.25, { pose: 'dodge', x: 4.4, z: -36.4, face: 1 }).key(22.6, { x: -1, z: ZH, ease: 'out' }).key(22.7, { pose: 'idle' });
B.ground(22.75, [8, ZB], 1.0);
lash(23.0, { a0: 0.7, a1: -0.6, low: true, dur: 0.9, back: 0.55 });
[23.15, 23.3, 23.45].forEach((t, i) => crown(film, { t, at: [lerp(6, -1, i / 2), 0, -36.4 + i * 0.3], n: 7, radius: 1.0, height: 1.8, colors: SPLASH, seed: 30 + i }));
B.leapCut(23.15, [-1, ZH], [5.2, -36.2], [8, ZB]);
// the close string: one cut guarded, the blue glint, the second deflected, the counter
slash(film, { t: 24.45, at: [6.6, 2.5, -36.2], radius: 2.9, width: 0.75, a0: 2.4, a1: -0.6, normal: [0.1, 0.2, 1], color: C.steel, core: '#d8d0c0', sound: 'whoosh' });
B.guard(24.5, [5.2, -36.2], { back: 0.5, hold: 0.3 });
B.tell(24.75, [7.0, 5.2, -36.6], 'blue');
B.deflect(24.95, [4.7, -36.2], [8, ZB]);
B.counter(25.5, [4.7, -36.2], [8, ZB]);
hero.key(26.25, { pose: 'dodge', x: 6.9, z: -36.2 }).key(26.6, { x: 0, z: ZH, ease: 'out' }).key(26.7, { pose: 'idle' });

// the change: the Sixfold Scythe. Four thread bands shoot out of him to the pool's rim; they are cut by the finisher
const P2T = B.phase(26.8, [8, ZB], 'p2', { heroFrom: [0, ZH], heroTo: [-3, ZH] });
for (const [i, [x, z]] of [[-7, -41], [16, -36], [0, -43.5], [13, -43]].entries()) threadBand(film, { a: [8 + (i % 2 ? 0.6 : -0.6), 4.2, ZB - 0.4], b: [x, 0.05, z], n: 70, wA: 0.3, wB: 1.6, depth: 0.25, t0: P2T + 0.05 + i * 0.07, t1: 36.75, seed: 20 + i });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '追命 · 第二形态', name: '六绝凶镰', boss: true, seal: '凶', barColor: '#7a1a14' });

// phase two: the six-sickle whirl walking in (guarded three times)
const W0 = P2T + 2.0;
zm.key(W0, { x: 8 }).key(W0 + 1.4, { x: 3.2, ease: 'linear' }).key(W0, { jit: 0.05 }).key(W0 + 1.4, { jit: 0.05 }).key(W0 + 1.5, { jit: 0 });
for (let i = 0; i < 6; i++) { const t = W0 + i * 0.23, a = i * 1.05; slash(film, { t, at: [lerp(8, 3.2, i / 5), 1.4 + (i % 3) * 0.7, ZB], radius: 4.6 + (i % 2) * 1.6, width: 0.8, a0: a, a1: a + 3.4, normal: [(i % 3 - 1) * 0.25, 1, 0.1], dur: 0.42, color: i % 2 ? C.steel : C.red, core: i % 2 ? '#d8d0c0' : '#e8d6b8', sound: i % 2 ? 'chain' : 'slash' }); }
for (const [k, t] of [W0 + 0.3, W0 + 0.75, W0 + 1.2].entries()) B.guard(t, [-3 - k * 0.6, ZH], { back: 0.5, heavy: k === 2, hold: 0.36 });
// the chain ring closes round 魂; the red glint; he shadow-steps out and the ring snaps shut on nothing
const R0 = W0 + 2.2, HX = -4.6;   // v4: a beat longer, so 天罗地网 is said whole before the kill
paperChain(film, { t: R0, dur: 1.25, links: 70, size: 0.2, path: (u, lt) => { const R = lerp(7.5, 1.0, Math.pow(Math.min(1, lt / 1.05), 1.6)), a = u * Math.PI * 2.05 + lt * 2.5; return [HX + Math.cos(a) * R, 1.3 + Math.sin(a * 3) * 0.25, ZH + Math.sin(a) * R * 0.75]; }, reach: (lt) => Math.min(1, lt / 0.35), hook: '#3a3b40' });
zm.key(R0, { lean: 0 }).key(R0 + 0.5, { lean: -0.2 });
B.tell(R0 + 0.55, [3.4, 6.2, -36.6], 'red');
B.shadowstep(R0 + 0.72, [HX, ZH], [6.0, -36.5], { face: -1 });
sparks(film, { t: R0 + 1.05, at: [HX, 1.3, ZH], n: 26, seed: 51, sound: 'chain' });
popBurst(film, { t: R0 + 1.05, at: [HX, 0, ZH], r: 2.2, colors: ['#5a5c62', '#3a3b40', '#9a9ca2'], crumple: 6, seed: 52, sound: 'clang' });
zm.key(R0 + 1.0, { lean: 0.15 }).key(R0 + 1.3, { lean: 0 });
B.leapCut(R0 + 1.25, [6.0, -36.5], [4.6, -36.4], [3.2, ZB]);
// the sixfold slam (guarded, heavy), the last blue glint on his charge, the deflect, the finisher
const SL = R0 + 2.35;
zm.key(SL - 0.3, { lean: 0 }).key(SL - 0.05, { lean: -0.25 }).key(SL + 0.1, { lean: 0.12, ease: 'in' }).key(SL + 0.5, { lean: 0 });
popBurst(film, { t: SL + 0.1, at: [3.2, 0, -35.8], r: 3.2, colors: SPLASH, crumple: 8, seed: 61, sound: 'boom' }); crown(film, { t: SL + 0.1, at: [3.2, 0, -35.8], n: 14, radius: 2.4, height: 3.2, colors: SPLASH, rows: 2, seed: 62 });
B.guard(SL + 0.12, [4.8, -36.4], { face: -1, back: 1.1, heavy: true, hold: 0.5 });
zm.key(SL + 0.8, { face: -1 });
B.tell(SL + 1.0, [4.4, 5.6, -36.6], 'blue');
zm.key(SL + 1.1, { x: 3.2 }).key(SL + 1.3, { x: 4.2, ease: 'out' });
B.deflect(SL + 1.28, [5.9, -36.4], [4.2, ZB], { face: -1, stagger: 0.55 });
const FIN = SL + 2.05;
B.finisher(FIN, [5.6, -36.4], [3.4, ZB], { face: -1 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move; v4: every line said whole) ---------------
{ const V = film.voice;
  V(14.2, 'vo/zhuiming_p1_line_01.wav');                                   // P1 entry: 无处可逃！
  V(20.55, 'vo/zhuiming_attack_01.wav'); V(21.5, 'vo/zhuiming_hurt_01.wav'); V(24.6, 'vo/zhuiming_attack_02.wav');
  V(26.85, 'vo/zhuiming_charge_01.wav', { cap: 1.8 });                       // the change
  V(P2T + 0.3, 'vo/zhuiming_p2_line_01.wav', { seg: 0 });                  // P2: 不够快！还不够快！
  V(W0 + 0.9, 'vo/zhuiming_p2_line_02.wav', { seg: 'squeeze' });           // the whirl into the chain ring: 天罗地网，无所遁形！
  V(FIN + 0.45, 'vo/zhuiming_hurt_02.wav'); }

const OUT = FIN + 3.2;
const camOutro = outro(film, hero, { t0: OUT, from: [5, -36], dur: 1.4, color: C.ground, nextColor: GROUNDS['02-forest'] });
for (const a of [canggang, pengmeng, ahua]) a.key(OUT, { rise: 0 });

// ---- camera (the boss fight; v4 adds the low landing shot, the close red tell and the kill over 魂's shoulder) -------------
const duel = (t, o = {}) => ({ t, target: [2.5, 2.8, -36.2], dist: 32, pitch: 27, yaw: 0, focus: [2.5, 2.8, -36.4], ...o });
film.camera([
  { t: 12.9, target: [2, 4.5, -33], dist: 44, pitch: 26, yaw: 0, focus: [3, 4, -38] },
  { t: 13.7, target: [2.5, 4, -34], dist: 41, pitch: 26, yaw: 0, ease: 'linear', focus: [3, 4, -38] },
  // v4: 追命 lands seen from the water's edge, low; then the duel
  { t: 13.75, target: [7.2, 3.6, -37], dist: 19, pitch: 6, yaw: -20, focus: [8, 3.4, -37], ease: 'cut' },
  { t: 14.75, target: [7.4, 3.8, -37], dist: 16.5, pitch: 7, yaw: -16, ease: 'linear', focus: [8, 3.6, -37] },
  duel(14.8, { dist: 34, ease: 'cut' }),
  duel(18.3, { dist: 31, yaw: -3, ease: 'linear' }),
  duel(18.8, { dist: 25, pitch: 26, target: [-2.5, 3.2, -36.2], focus: [-2.5, 3.2, -36.4] }),
  duel(20.2, { dist: 26, pitch: 26, target: [0, 3.2, -36.2], focus: [0, 3, -36.4], ease: 'linear' }),
  // v4: the red tell in close-up on him, pulled back out as 魂 steps through
  { t: 20.55, target: [1.2, 4.6, -36.6], dist: 19, pitch: 14, yaw: 10, focus: [1.4, 4.8, -36.8], ease: 'cut' },
  { t: 20.8, target: [1.2, 4.6, -36.6], dist: 18, pitch: 14, yaw: 9, ease: 'linear', focus: [1.4, 4.8, -36.8] },
  duel(21.0, { dist: 25, pitch: 26, target: [1.4, 3.2, -36.2], focus: [1.4, 3, -36.4] }),
  duel(22.3, { dist: 30 }),
  duel(24.3, { dist: 29, ease: 'linear', target: [4.5, 2.8, -36.2] }),
  duel(25.0, { dist: 24, pitch: 26, target: [6, 3.2, -36.2], focus: [6, 3, -36.4] }),
  duel(26.5, { dist: 30, target: [3.5, 3, -36.2] }),
  { t: P2T - 0.6, target: [6.5, 3.8, -36.8], dist: 24, pitch: 27, yaw: -8, focus: [8, 3.6, ZB] },
  { t: P2T + 1.4, target: [7, 4, -36.8], dist: 23, pitch: 26, yaw: -10, ease: 'linear', focus: [8, 3.8, ZB] },
  duel(W0, { dist: 33, target: [2, 3, -36.2] }),
  duel(R0 + 0.4, { dist: 31, ease: 'linear', target: [0, 3, -36.2] }),
  duel(R0 + 0.9, { dist: 27, target: [0.5, 3.2, -36.2], pitch: 30 }),
  duel(SL, { dist: 29, ease: 'linear', target: [3.5, 3, -36.2] }),
  duel(FIN - 0.4, { dist: 25, target: [4.4, 3, -36.2] }),
  // v4: the kill over 魂's shoulder (camera behind him on the right, looking at 追命), then wide for the stamp
  { t: FIN - 0.05, target: [4.2, 3.0, -36.6], dist: 18, pitch: 13, yaw: 42, focus: [3.4, 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [4.2, 2.8, -36.6], dist: 16.5, pitch: 13, yaw: 38, ease: 'linear', focus: [3.4, 2.6, -37] },
  duel(FIN + 1.25, { dist: 26, pitch: 30, target: [4.4, 2.8, -36.2], ease: 'cut' }),
  duel(FIN + 2.6, { dist: 28, pitch: 31, ease: 'linear', target: [4.6, 2.8, -36.2] }),
  ...camOutro,
]);
film.start();
