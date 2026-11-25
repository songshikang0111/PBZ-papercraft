// 第五章 · 正道大营 (Mandate Encampment), v2. A war camp in a mountain pass: rows of folded army tents both sides of a
// muster road, palisades, watchtowers, banners, weapon racks; mountains on both sides and ranges beyond. The film walks
// up the road: the hammer (万钧), the swordswoman in red (红衣女剑客), the Seven-Star Formation on the drill ground (大师兄);
// at the top, the training yard before the hall gate, where the sword puppet 玉璧 fights with wind and thunder (the
// lightning thrust, the teal spectral copy, the gust she dashes out of, the skimming ring, the star glint), then raises
// the storm: a whirlwind of lightning rings the yard, gold circles burst under 魂, lightning falls on him, a wall of
// wind blades. ~46 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.5: an army camp of canvas tents, timber palisades and watchtowers, red and black banners; red-earth yard;
//          a wind-and-thunder storm of teal paper curls and gold zig-zag lightning.
// PALETTE  ground #b3a487; canvas #d8ccb0 / stripes #8a2a1e; timber #5a4030; yard #8a6a4a; teal #4f9a8a / #cfe3dc;
//          gold #e8c060 / #fff0c8; banners #a3261c / #2a2420; shadow #24180e; haze #d8b088
// LIGHT    warm afternoon key from the left, cool fill
// LIFE     ash and banner scraps; teal curls in the storm
import { setupChapter, threads, threadBand, beats, elite, intro, outro, GROUNDS, createActor, makeHero, slash, shards, rings, crown, drift, P2, THREE } from '../../common/kit.js';
import { makeTerrain } from '../../common/terrain.js';
import { zigzag, curls, crescentShot, sawRing, starburst, popBurst, afterimage, sparks } from '../../common/fx.js';

const S0 = '/work/film/stickers/05-camp/', BOSS = '/work/boss-chibi/透明PNG/05 正道大营/';
const C = { ground: GROUNDS['05-camp'], washA: '#a29070', washB: '#c4b498', washC: '#968466', road: '#cbb894', drill: '#a8865e', yard: '#8a6a4a', red: '#c0281c', gold: '#e8c060', teal: '#4f9a8a' };
const K = await setupChapter({
  id: '05-camp', ground: C.ground, duration: 39.5 + 11.6,
  bounds: { x0: -46, x1: 46, z0: -54, z1: 34 },
  light: { key: '#ffd6a0', keyIntensity: 2.9, keyDir: [-0.8, 0.7, 0.45], fill: '#b8c0d8', fillIntensity: 0.85, sky: '#ffe8d0', ground: '#8a7458', skyIntensity: 0.45, leak: '#5a3a24' },
  lens: { haze: '#d8b088', hazeStart: 40, hazeEnd: 130, hazeAmount: 0.32, saturation: 0.98, tint: [1.03, 0.99, 0.96], exposure: 0.86, vignette: 0.1 },
  pieces: { stone: '#8e8474', stoneDark: '#62584a', cap: '#8a8a52', bush: ['#7a7a4a', '#6a6444'], bushDots: '#d8a040', tuft: ['#a08a50', '#8a7a48'] },
  shadowInk: '#24180e',
  stickers: {
    palisade: S0 + 'palisade.png', watch: S0 + 'watchtower.png', burn: S0 + 'burningtower.png', roof: S0 + 'roof.png', hallgate: S0 + 'hallgate.png', rack: S0 + 'weaponrack.png',
    candles: S0 + 'candles.png', loft: S0 + 'pigeonhouse.png',
    wanjun: BOSS + '01 巨锤客·万钧.png', hongyi: BOSS + '02 红衣女剑客.png', dashi: BOSS + '03 七星剑阵·大师兄.png', yubi: BOSS + '04 剑偶·玉璧.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, house } = K;
const T = makeTerrain(K);

// ---- the plan ----------------------------------------------------------------------------------------------------------------
const YARD = { x: 3, z: -37, rx: 12, rz: 6 };
const inYard = (x, z, k = 1) => ((x - YARD.x) / (YARD.rx * k)) ** 2 + ((z - YARD.z) / (YARD.rz * k)) ** 2 < 1;
const DRILL = { x: 0, z: -15, r: 6 };
const ROAD = P2.pathLine([[2, -30], [0, -22], [1, -8], [-1, 6], [1, 20], [0, 36]]);
const inner = (z) => 16 + Math.sin(z * 0.25) * 0.8;
const dist = (L, x, z) => { let d = 1e9; for (const [px, pz] of L.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const ELITES = [[-5, 12, -8], [6, -1, 9], [0, -13, 0]];
const inSight = (x, z) => ELITES.some(([ex, ez, yaw]) => { const d = z - ez; if (d < -2.5 || d > 18) return false; return Math.abs(x - ex - d * Math.tan(yaw * Math.PI / 180)) < 4.5 + d * 0.35; });
const STAR = [[-5, -11.5], [-3.5, -15.5], [0, -17.5], [0, -13.5], [3.5, -15.5], [5.5, -12], [4, -19]];

H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, drifts }) => {
  washes([C.washA, C.washB, C.washB, C.washC]);
  for (const s of [-1, 1]) { const pts = []; for (let z = 36; z >= -54; z -= 2) pts.push([s * (inner(z) - 1.2 + Math.sin(z * 0.7) * 0.6), z]); pts.push([s * 50, -54], [s * 50, 36]); torn(pts, P2.rgba('#8a7c62', 0.85)); }
  torn(bandOf(ROAD.pts, 2.4), C.road);
  const circ = (o, rr, n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * 6.283; return [o.x + Math.cos(a) * rr, o.z + Math.sin(a) * rr * 0.8]; });
  torn(circ(DRILL, DRILL.r), P2.rgba(C.drill, 0.9));
  g.strokeStyle = P2.rgba('#5a4030', 0.6); g.lineWidth = 0.09 * ppu; g.beginPath(); STAR.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke();
  const ell = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * 6.283; return [YARD.x + Math.cos(a) * YARD.rx * 1.15, YARD.z + Math.sin(a) * YARD.rz * 1.3]; });
  torn(ell, P2.rgba(C.yard, 0.95));
  for (let k = 0; k < 40; k++) { const a = r() * 6.283, rr = Math.sqrt(r()) * 0.9, x = YARD.x + Math.cos(a) * YARD.rx * rr, z = YARD.z + Math.sin(a) * YARD.rz * rr; g.fillStyle = P2.rgba('#6a4a30', 0.4); g.beginPath(); g.ellipse(X(x), Z(z), 0.5 * ppu, 0.25 * ppu, r() * 3, 0, 7); g.fill(); }
  drifts((x, y) => { g.strokeStyle = P2.rgba(r() < 0.5 ? '#8a7a48' : '#b8a068', 0.7); g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 4 - r() * 4); g.stroke(); }, { n: 9000, threshold: 0.6 });
});

// ---- the pass: rugged slopes each side, ranges beyond ----------------------------------------------------------------------------
const col = (i, n) => { const k = i / (n - 1); return { rock: P2.mix('#6e6456', '#a49a88', k * 0.85), dark: P2.mix('#463e34', '#746a5c', k * 0.85), moss: P2.mix('#6a6a44', '#9a9a70', k * 0.8), pine: P2.mix('#33382a', '#5c6450', k * 0.7), mist: '#e6d8bc' }; };
const ZL = [27, 16, 5, -6, -17, -28, -39], ZR = [22, 11, 0, -11, -22, -33, -44];
const wl = T.wings({ zs: ZL, side: -1, inner: (z) => -inner(z), w: (z, i) => 22 + i, h: (z, i) => 12 + i * 2.2, colors: (i) => col(i, 7), seed: 51, opts: { plateau: 0.5, spires: 2 } });
const wr = T.wings({ zs: ZR, side: 1, inner: (z) => inner(z), w: (z, i) => 22 + i, h: (z, i) => 12.5 + i * 2.2, colors: (i) => col(i, 7), seed: 57, opts: { plateau: 0.5, spires: 1 } });
T.range({ z: -58, x: 0, w: 160, h: 32, color: '#a89a8c', cap: '#d8cec0', seed: 51, peaks: 7 });
T.range({ z: -64, x: -10, w: 180, h: 40, color: '#b8aea2', cap: '#e4dcd0', seed: 52, peaks: 5 });

// ---- the camp: tents in rows each side of the road, palisades along the slopes' feet, towers, banners, racks -------------------------
const TENTS = [];
for (let z = 30; z > -26; z -= 4.4) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
  const x = s * between(5.2 + k * 5, 6.4 + k * 5.2), zz = z + between(-0.8, 0.8);
  if (Math.abs(x) > inner(zz) - 2.4 || inSight(x, zz) || Math.hypot(x - DRILL.x, (zz - DRILL.z) / 0.8) < DRILL.r + 2.5 || dist(ROAD, x, zz) < 3.6 || !clear(x, zz, -1.0)) continue;
  const six = rnd() < 0.35;
  TENTS.push(T.tent({ x, z: zz, r: six ? 2.6 : 2.3, sides: six ? 6 : 4, h: six ? 1.4 : 1.7, roofH: six ? 3.4 : 3.0, yaw: rnd() * 0.6, canvas: rnd() < 0.3 ? '#c8bca0' : '#d8ccb0', stripe: rnd() < 0.5 ? '#8a2a1e' : '#3a3430', seed: 60 + TENTS.length * 3, group: zz < -20 ? 'field' : 'world' }));
}
for (const s of [-1, 1]) for (let z = 30; z > -30; z -= 7) sticker('palisade', 3.4, { x: s * (inner(z) - 1.6), z: z + (s > 0 ? 3 : 0), res: 1.0, stamp: true, flip: s > 0, group: z < -20 ? 'field' : 'world' });
sticker('watch', 12, { x: -12.5, z: 4, res: 1.2 }); sticker('watch', 11, { x: 12.5, z: -8, res: 1.2, flip: true });
const roofCard = sticker('roof', 5, { x: 8.5, z: -3.5, res: 1.2 });
sticker('loft', 7, { x: -11, z: 22, res: 1.1 });
for (const [x, z, f] of [[-3.5, 18, false], [3.8, 2, true], [-4, -6, false]]) if (!inSight(x, z)) T.banner({ x, z, h: 7, cloth: rnd() < 0.5 ? '#a3261c' : '#2a2420', flip: f });
sticker('rack', 4, { x: -8, z: 9, res: 1.1 }); sticker('rack', 4, { x: 8, z: -11, res: 1.1, flip: true });
const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
const foot = (w, dz, k = 1.5) => [w.cliff.side * (inner(w.cliff.z + dz) - k), 0.05, w.cliff.z + dz];
threadBand(film, { a: wAt(wl[1], 0.3), b: foot(wl[1], -7), n: 110, wA: 1.2, wB: 4.0, seed: 53 });
threadBand(film, { a: wAt(wr[3], 0.3), b: foot(wr[3], -7), n: 110, wA: 1.2, wB: 4.0, seed: 54 });
mark(-5, 12, 2.4); mark(6, -1, 2.4); mark(DRILL.x, DRILL.z, DRILL.r);

// ---- the training yard before the hall gate (it rises for the fight) --------------------------------------------------------------
const ARENA_T = 12.6, DS = 0.4;   // v4: the boss fight keeps its v3 times, shifted DS later (film.shift)
const gate = sticker('hallgate', 12, { x: YARD.x, z: -46, res: 1.5, group: 'arena' });
for (const [x, z, f] of [[-11, -43, 0], [17, -43, 1]]) sticker('palisade', 3.4, { x, z, res: 1.0, flip: !!f, group: 'arena' });
for (const [x, z] of [[-6, -43.5], [12, -43.5]]) sticker('candles', 2.2, { x, z, stamp: true, group: 'arena' });
for (const [x, z, f] of [[-12, -38, false], [18, -38.5, true]]) sticker('rack', 4, { x, z, res: 1.1, group: 'arena', flip: f });
for (const [x, z, f] of [[-9, -44.5, false], [15, -44.5, true]]) T.banner({ x, z, h: 8, cloth: '#a3261c', flip: f, group: 'arena' });
mark(YARD.x, YARD.z, 12);
fill(220, [-15, 15, -28, 33], [rock, tuft, tuft, bush], (x, z) => Math.abs(x) < inner(z) - 2 && dist(ROAD, x, z) > 3 && !inSight(x, z), { per: [1, 3], size: [0.4, 0.7] });

H.setHero(H.popup(null, null, { node: new THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-16, 16, 1, 12, -44, 30], n: 50, colors: ['#e8e4dc', '#c8c4bc', '#a3261c'], size: 0.2, wind: [0.9, -0.2, 0.4], seed: 6, shape: 'petal' });

// ---- actors -----------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const wanjun = createActor(film, { name: 'wanjun', poses: { p: IMG.wanjun }, height: 5.8, x: -5, z: 12 });
const hongyi = createActor(film, { name: 'hongyi', poses: { p: IMG.hongyi }, height: 4.4, x: 6, z: -1 });
const disciples = STAR.map(([x, z], i) => createActor(film, { name: 'd' + i, poses: { p: IMG.dashi }, height: i === 3 ? 5.2 : 3.9, x, z }));
const yubi = createActor(film, { name: 'yubi', poses: { p: IMG.yubi }, height: 5.8, x: 8, z: -37, risen: true });
const B = beats(film, hero, yubi, { dust: ['#8a6a4a', '#5a4030', '#d8c090'], sparks: ['#ffe08a', '#e8c060', '#fff0c8'] });
const S = film.sound, ZB = -37, ZH = -36;
const GOLD = ['#2a2418', '#f4e9b0', '#fffbe8'], TEAL = ['#0c2a26', '#4f9a8a', '#e2f4ee'], TEALC = ['#7fb3a8', '#cfe3dc', '#4f8a80'];
const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));

// ---- the muster road (v4): three showcases, 魂 off the page until the yard ------------------------------------------------------------
const camIntro = intro(film, hero, { land: [0, 21], t1: 1.0 });
hero.hideBetween(1.9, ARENA_T + DS + 0.15);
film.rise('world', 0.55, { from: [0, 21], speed: 42 });
film.rise('field', 0.55, { from: [0, 21], speed: 42, sound: false });
film.title({ t0: 1.0, dur: 3.0, name: '正道大营', sub: '伍' }); S(1.0, 'title');
const E1 = 3.5, E2 = 6.5, E3 = 9.5;
// 万钧: the great hammer whirled round him on its chain, two full turns, the wind of it flattening the dust in a ring
elite(film, wanjun, E1, { title: '巨锤客', name: '万钧', move: 'none', dur: 2.8 });
wanjun.key(E1 + 0.6, { jit: 0.04 }).key(E1 + 2.2, { jit: 0.04 }).key(E1 + 2.3, { jit: 0 });
for (let k = 0; k < 2; k++) slash(film, { t: E1 + 0.8 + k * 0.6, at: [-5, 2.2 + k * 0.4, 12], radius: 3.8 + k * 0.6, width: 1.1, a0: k * 3, a1: k * 3 + 6.0, normal: [0, 1, 0.1], dur: 0.55, color: '#5a4a3a', core: '#e8c060', sound: k ? 'heavy' : 'whoosh' });
rings(film, { t: E1 + 1.5, at: [-5, 0, 12], n: 3, r0: 2, r1: 7.5, color: '#c4b498', width: 0.35 }); shards(film, { t: E1 + 1.5, at: [-5, 0.3, 12], n: 30, colors: ['#c4b498', '#a29070', '#d8c090'], speed: 8, up: 2, size: 0.28, seed: 71 });
// 红衣女剑客: the sword out in a flash, three red steps that leave red prints behind her, the cut ("我先走一步……")
elite(film, hongyi, E2, { title: '神秘剑客', name: '红衣女剑客', move: 'none', plate: 'right', dur: 2.8 });
[[6, -1], [3, 1.5], [7.5, 3], [4.5, 5]].forEach(([x, z], i, a) => { if (!i) return; const t = E2 + 0.7 + i * 0.28; afterimage(film, { t, img: IMG.hongyi, at: a[i - 1], height: 4.4, tint: '#c0281c', alpha: 0.55, dur: 0.45 }); hongyi.key(t, { x: a[i - 1][0], z: a[i - 1][1] }).key(t + 0.04, { x, z, snap: true }); S(t, 'blink'); });
slash(film, { t: E2 + 1.65, at: [4.5, 2.4, 5.6], radius: 4.2, width: 0.9, a0: 2.6, a1: -0.8, normal: [0.1, 0.25, 1], color: '#c0281c', core: '#fff0c8', sound: 'slash' });
hongyi.key(E2 + 2.9, { rise: 0 });
// 七星剑阵: the seven disciples stand up in their star, a red thread runs from point to point, and all seven strike at once
disciples.forEach((d, i) => { d.key(0, { hidden: true }).key(E3 + i * 0.1, { hidden: false, rise: 1 }); });
S(E3, 'riseMany', { n: 40 });
threads(film, STAR.slice(0, -1).map((p, i) => ({ a: [p[0], 0.08, p[1]], b: [STAR[i + 1][0], 0.08, STAR[i + 1][1]], t0: E3 + 0.8 + i * 0.1 })), { sag: 0, radius: 0.09, color: '#c0281c' });
film.plate({ t0: E3 + 0.3, dur: 2.4, title: '七星剑阵', name: '大师兄', side: 'left' });
disciples.forEach((d) => d.key(E3 + 1.8, { lean: 0 }).key(E3 + 1.95, { lean: -0.12 }).key(E3 + 2.15, { lean: 0.06 }).key(E3 + 2.4, { lean: 0 }));
for (let i = 0; i < STAR.length; i++) starburst(film, { t: E3 + 2.0 + i * 0.04, at: [STAR[i][0], 3.6, STAR[i][1]], r: 0.8, colors: ['#1a0c08', '#c0281c', '#f4d6a0'], dur: 0.35, seed: i });
sawRing(film, { t: E3 + 2.05, at: [DRILL.x, 0, DRILL.z], r0: 1, r1: 8, color: '#c0281c', dur: 0.7 }); S(E3 + 2.05, 'clang');
{ const V = film.voice; V(E1 + 1.45, 'vo/wanjun_attack_heavy_01.wav'); V(E2 + 0.05, 'vo/hongyinvjianke_encounter_line_01.wav'); }
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 5, -4], dist: 64, pitch: 34, yaw: 4, focus: [0, 4, -4] },
  { t: 3.3, target: [1, 5, -9], dist: 58, pitch: 31, yaw: 1, ease: 'linear', focus: [0, 4, -9] },
  // 万钧 from above-front: the two turns of the hammer read as rings
  { t: E1 + 0.1, target: [-4.6, 2.8, 12.5], dist: 26, pitch: 38, yaw: -6, focus: [-5, 2.6, 12], ease: 'cut' },
  { t: E2 - 0.25, target: [-4.8, 2.8, 12], dist: 24, pitch: 36, yaw: -3, ease: 'linear', focus: [-5, 2.6, 12] },
  // 红衣女剑客: low and close, she steps toward the lens
  { t: E2 - 0.2, target: [5.4, 3.0, 1.5], dist: 21, pitch: 12, yaw: 8, focus: [5, 2.6, 2], ease: 'cut' },
  { t: E3 - 0.3, target: [5, 2.8, 4.5], dist: 20, pitch: 12, yaw: 5, ease: 'linear', focus: [4.6, 2.4, 5] },
  // the sword array from high overhead: the star
  { t: E3 - 0.25, target: [0, 3, -14], dist: 32, pitch: 46, yaw: 0, focus: [0, 2.6, -15], ease: 'cut' },
  { t: E3 + 2.8, target: [0, 3, -15], dist: 28, pitch: 42, yaw: 2, ease: 'linear', focus: [0, 2.6, -15] },
]);
film.shift(DS);   // ---- from here on: the v3 boss fight, DS later

// ---- the yard: the gate rises, 魂 comes up the road, she stands up out of a ring of gold sparks ------------------------------------------
film.rise('arena', ARENA_T, { from: [YARD.x, -40], speed: 26 });
film.rise('field', ARENA_T - 0.1, { from: [0, -22], speed: 40, open: 0 });
hero.key(12.8, { hidden: false, pose: 'run', x: -1, z: -26, face: 1, rise: 1 }).key(14.0, { x: -3, z: ZH, ease: 'linear' }).key(14.02, { pose: 'idle' });
S(12.85, 'steps', { dur: 1.2 });
yubi.key(0, { hidden: true }).key(14.2, { hidden: false, rise: 1 }); S(14.2, 'rise', { size: 0.9 });
rings(film, { t: 14.3, at: [8, 0, ZB], n: 3, r0: 1, r1: 5.5, dur: 1.2, color: C.gold, width: 0.35 });
sparks(film, { t: 14.3, at: [8, 1.5, ZB], n: 30, colors: ['#ffe08a', '#e8c060', '#fff0c8'], star: false, seed: 50, sound: 'clang' });
film.plate({ t0: 14.6, dur: 2.4, title: '廿一号 · 剑偶', name: '玉璧', boss: true, seal: '首' });

// phase one. the lightning thrust: a gold zig-zag streak across the yard (guarded heavy)
yubi.key(15.3, { lean: 0 }).key(15.45, { lean: -0.2 }).key(15.65, { lean: 0 });
zigzag(film, { t: 15.5, from: [6.5, 2.4, ZB + 0.3], to: [-2.2, 2.4, ZH], width: 0.6, n: 9, colors: GOLD, dur: 0.35, land: false });
B.guard(15.6, [-3, ZH], { back: 0.9, heavy: true, hold: 0.42 });
// the spectral copy: a teal print of her steps out and cuts with her (two cuts guarded)
afterimage(film, { t: 16.3, img: IMG.yubi, at: [4.5, -37.6], height: 5.8, tint: '#7fb3a8', alpha: 0.6, hold: 0.7, dur: 0.4 });
crescentShot(film, { t: 16.5, from: [4, 2.4, -37.3], to: [-3.6, 2.4, ZH], dur: 0.25, r: 1.6, colors: TEAL });
B.guard(16.75, [-3.9, ZH], { back: 0.4, hold: 0.28 });
crescentShot(film, { t: 16.85, from: [7, 2.0, ZB], to: [-4.2, 2.0, ZH], dur: 0.25, r: 1.6, colors: GOLD, sound: 'slash' });
B.guard(17.1, [-4.3, ZH], { back: 0.4, hold: 0.3 });
// the teal gust: the yard fills with teal haze and curls; she dashes out of it (the red flash) -> shadow-step, counter
curls(film, { t: 17.7, from: [10, 2, -38], to: [-8, 2, -35], n: 12, colors: TEALC, dur: 1.0, spread: 2.5, sound: 'gust' });
film.tint(17.8, { color: '#4f8a80', dur: 1.0, peak: 0.3 });
yubi.key(17.9, { hidden: true }).key(18.35, { hidden: false, x: 6, z: ZB, snap: true });
B.tell(18.4, [5, 4.4, -36.6], 'red');
B.shadowstep(18.5, [-4.7, ZH], [11.5, -36.4], { face: -1 });
yubi.key(18.55, { x: 6 }).key(18.8, { x: -3.5, ease: 'out' }); afterimage(film, { t: 18.55, img: IMG.yubi, at: [6, ZB], height: 5.8, tint: '#cfe3dc' });
slash(film, { t: 18.8, at: [-6, 2.4, -36.0], radius: 3.4, width: 1.0, a0: 2.4, a1: -0.6, normal: [0, 0.2, 1], color: '#ece6d6', core: C.gold, sound: 'heavy' });
yubi.key(19.1, { face: -1 }).key(19.2, { x: -3.5 }).key(19.5, { x: 4.5, ease: 'out' });
B.counter(19.6, [11.5, -36.4], [4.5, ZB], { face: -1, reach: 2.4 });
// the skimming ring: she spins in the air; a grey-teal saw ring skims the ground; 魂 vaults it and cuts down
yubi.key(20.4, { y: 0, hop: 2.4, x: 4.5 }).key(21.0, { x: 4.5, y: 0 }).key(20.5, { jit: 0.06 }).key(20.95, { jit: 0 });
sawRing(film, { t: 20.7, at: [4.5, 0.6, ZB], r0: 1.5, r1: 9, color: '#9ab8b0', width: 0.5, dur: 0.6, seed: 7 }); S(20.7, 'whoosh');
B.leapCut(20.75, [9.1, -36.4], [7.8, -36.3], [4.5, ZB]);
hero.key(20.75, { face: -1 });
// the star glint: blue on her blade; deflected; the counter
B.tell(21.9, [6.4, 4.8, -36.6], 'blue');
yubi.key(22.0, { x: 4.5 }).key(22.2, { x: 5.4, ease: 'out' });
B.deflect(22.2, [9.0, -36.4], [5.4, ZB], { face: -1 });
B.counter(22.75, [9.0, -36.4], [5.4, ZB], { face: -1, reach: 1.2 });
hero.key(23.5, { pose: 'dodge', x: 7.8 }).key(23.8, { x: 11, ease: 'out' }).key(23.9, { pose: 'idle' });

// the storm: the sky darkens; a whirlwind of lightning and teal wind rings the yard for the rest of the fight
const P2T = B.phase(24.2, [5.4, ZB], 'p', { heroFrom: [11, -36.4], heroTo: [12.5, -36.4], kind: 'spike', crownColors: ['#4f9a8a', '#e8c060', '#cfe3dc'], color: ['#4f9a8a', '#e8c060', '#fff0c8'], flash: '#e8c060' });
film.tint(P2T, { color: '#2a3a48', dur: 30, peak: 0.16 });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '玉璧 · 风雷', name: '雷旋', boss: true, seal: '雷', barColor: '#a08a30' });
const STORM0 = P2T + 0.3, STORM1 = P2T + 15;
for (let t = STORM0, k = 0; t < STORM1; t += 0.32, k++) {
  const a = k * 0.83, R = 13 + Math.sin(k) * 1.2, x = YARD.x + Math.cos(a) * R, z = YARD.z + Math.sin(a) * R * 0.5;
  if (Math.sin(a) > -0.25) continue;   // only the ring's back arc: the front would stand in the camera's way
  zigzag(film, { t, from: [x + 1.5, 16, z - 2], to: [x, 0, z], width: 0.6, n: 10, colors: GOLD, dur: 0.3, seed: k, sound: k % 3 ? null : 'bolt', land: k % 2 === 0 });
}
for (let t = STORM0, k = 0; t < STORM1; t += 1.1, k++) { const a0 = k * 1.7; curls(film, { t, from: [YARD.x + Math.cos(a0) * 13, 3, YARD.z + Math.sin(a0) * 6 - 2], to: [YARD.x + Math.cos(a0 + 2) * 13, 4, YARD.z + Math.sin(a0 + 2) * 6 - 2], n: 6, colors: TEALC, dur: 1.2, spread: 2, sound: k % 2 ? null : 'gust' }); }
// gold circles under 魂: each one opens, holds, bursts; he steps off them
const W0 = P2T + 2.1;
for (const [i, [x, z, dx, dz]] of [[12.5, -36.4, 10, -34.6], [10, -34.6, 12.8, -37.6], [12.8, -37.6, 9.6, -36.4]].entries()) {
  const t = W0 + i * 0.75;
  sawRing(film, { t, at: [x, 0.05, z], r0: 0.2, r1: 2.2, color: C.gold, dur: 0.3, seed: 20 + i });
  starburst(film, { t: t + 0.05, at: [x, 0.4, z], r: 0.9, colors: GOLD, dur: 0.35, seed: 20 + i });
  hero.key(t + 0.2, { pose: 'dodge', x, z }).key(t + 0.45, { x: dx, z: dz, ease: 'out' }).key(t + 0.5, { pose: 'idle' });
  popBurst(film, { t: t + 0.45, at: [x, 0, z], r: 2.2, colors: ['#e8c060', '#fff0c8', '#a08a30'], crumple: 6, seed: 30 + i, sound: 'boom' });
}
// lightning falls on him (the red flash); he shadow-steps to her back; the counter
const LB = W0 + 2.6;
B.tell(LB, [9.6, 7, -36.4], 'red');
B.shadowstep(LB + 0.1, [9.6, -36.4], [0, -36.4], { face: 1 });
zigzag(film, { t: LB + 0.3, from: [11, 18, -38], to: [9.6, 0, -36.4], width: 1.0, n: 12, colors: GOLD, dur: 0.4, seed: 77 });
yubi.key(LB + 0.5, { face: 1 });
B.counter(LB + 0.8, [0, -36.4], [5.4, ZB], { reach: 2.2 });
// the wind-blade wall: a row of teal crescents marches at him (guarded three times, heavy)
const WW = LB + 1.9;
hero.key(WW - 0.4, { pose: 'dodge', x: 2.2 }).key(WW - 0.1, { x: -2.5, ease: 'out' }).key(WW, { pose: 'idle' });
yubi.key(WW - 0.2, { lean: -0.15 }).key(WW + 0.9, { lean: 0 });
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) crescentShot(film, { t: WW + i * 0.3, from: [5, 1.2 + j * 1.3, ZB + 0.3 + (j - 1) * 0.4], to: [-2.5, 1.2 + j * 1.3, ZH + (j - 1) * 0.4], dur: 0.3, r: 1.2, colors: TEAL, sound: j ? null : 'whoosh', seed: i * 3 + j });
for (let i = 0; i < 3; i++) B.guard(WW + 0.3 + i * 0.3, [-2.5 - i * 0.4, ZH], { back: 0.4, heavy: i === 2, hold: 0.28 });
// the last: the star glint as she lunges; the deflect; the finisher
B.tell(WW + 1.6, [3.6, 4.6, -36.6], 'blue');
yubi.key(WW + 1.7, { x: 5.4 }).key(WW + 1.9, { x: 2.6, ease: 'out' });
B.deflect(WW + 1.9, [-3.7, ZH], [2.6, ZB], { stagger: 0.55 });
const FIN = WW + 2.6;
B.finisher(FIN, [-3.2, ZH], [2.8, ZB], { face: 1 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
{ const V = film.voice;
  V(18.3, 'vo/yubi_attack_01.wav'); V(19.1, 'vo/yubi_hurt_01.wav');
  V(24.25, 'vo/yubi_charge_01.wav'); V(24.9, 'vo/yubi_attack_02.wav');                                         // the change
  V(LB - 0.1, 'vo/yubi_attack_01.wav'); V(LB + 1.2, 'vo/yubi_hurt_02.wav');
  V(FIN + 0.8, 'vo/yubi_post_battle_line_02.wav', { seg: 'squeeze' }); }   // 啊！是啊……白山派……为何总是如此凄凉？                      // as she falls: 我是谁？你知道我是谁吗？ (v4: said whole; the outro waits)

const OUT = FIN + 14.8;   // v4: the outro waits for her last line
const camOutro = outro(film, hero, { t0: OUT, from: [-2, -36], dur: 1.4, color: C.ground, nextColor: GROUNDS['06-lake'] });
for (const a of [wanjun, hongyi, ...disciples]) a.key(OUT, { rise: 0 });

// ---- camera --------------------------------------------------------------------------------------------------------------------
const duel = (t, o = {}) => ({ t, target: [3, 2.8, -36.4], dist: 33, pitch: 27, yaw: 0, focus: [3, 2.8, -36.6], ...o });
film.camera([
  { t: 13.0, target: [2, 5, -33], dist: 44, pitch: 26, yaw: 0, focus: [3, 4, -40] },
  { t: 14.1, target: [2.5, 4.5, -34], dist: 40, pitch: 26, yaw: 0, ease: 'linear', focus: [3, 4, -40] },
  // v4: she stands up out of the gold sparks, seen from the yard floor
  { t: 14.15, target: [7.4, 3.6, -37], dist: 19, pitch: 6, yaw: -18, focus: [8, 3.4, -37], ease: 'cut' },
  { t: 15.0, target: [7.6, 3.8, -37], dist: 17, pitch: 7, yaw: -14, ease: 'linear', focus: [8, 3.6, -37] },
  duel(15.05, { dist: 34, ease: 'cut' }),
  duel(17.4, { dist: 31, ease: 'linear', target: [1, 2.8, -36.4] }),
  duel(18.4, { dist: 30, target: [3, 3, -36.4] }),
  duel(20.2, { dist: 30, target: [6, 3, -36.4] }),
  duel(23.4, { dist: 29, ease: 'linear', target: [7, 3, -36.4] }),
  { t: P2T - 0.6, target: [5, 3.6, -36.8], dist: 24, pitch: 27, yaw: -6, focus: [5.4, 3.4, ZB] },
  { t: P2T + 1.4, target: [5, 4.5, -36.8], dist: 30, pitch: 23, yaw: -6, ease: 'linear', focus: [5.4, 3.8, ZB] },
  duel(W0, { dist: 38, pitch: 25, target: [6, 4, -37] }),
  duel(LB + 1.2, { dist: 34, pitch: 26, ease: 'linear', target: [4, 3.5, -36.8] }),
  duel(WW, { dist: 32, target: [1.5, 3, -36.4] }),
  duel(FIN - 0.4, { dist: 27, target: [0, 3, -36.4] }),
  // v4: the kill over 魂's shoulder (he is on her left); then in on her as she asks who she is
  { t: FIN - 0.05, target: [-1.4, 3.0, -36.6], dist: 18, pitch: 13, yaw: -42, focus: [2.8, 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [-1.4, 2.8, -36.6], dist: 16.5, pitch: 13, yaw: -38, ease: 'linear', focus: [2.8, 2.6, -37] },
  duel(FIN + 1.25, { dist: 27, pitch: 30, target: [0.5, 2.8, -36.4], ease: 'cut' }),
  { t: FIN + 14.6, target: [2.4, 2.2, -36.8], dist: 15, pitch: 20, yaw: 6, ease: 'linear', focus: [2.8, 1.6, -37] },
  ...camOutro,
]);
film.start();
