// 第三章 · 陆家村 (Lu Village), v2. A crowded hill village between terraced slopes: folded timber houses of every shape
// (halls, narrow tall houses, sheds, gate towers) packed along a winding lane, the Three-Puppet Well in its red nets.
// The film walks up the lane: the gate and its terraces (拙壁), the well (玉瓒), the back lanes (荡秽); then the village
// opens onto a wide lake at sunset, reeds and a boardwalk and a moored boat on its shallows, where 沐小葵 fights: the
// Young Mistress switching from far to near (red sword-qi crescents, the dash-in string, the red burst, the ring of red
// cuts, the delayed heavy), then the Iron-Jade Queen, who fights a while and then calls 玉妖 and 铁鬼 up out of the lake
// (no red threads): the three take turns. ~46 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.3: a dense hill village of dark timber and white plaster, grey tile roofs, red lanterns and rope; dry-stone
//          terraces on the slopes; a sunset lake of gold and slate with reeds, lily pads, a boardwalk and a boat.
// PALETTE  ground #b9a888; slopes #8c8a62 -> #c2b88e; plaster #d6cdb8 / timber #3a2c22 / tile #4b4d50; reed gold
//          #d9a84a; lake #7f8f8c / #5d6e6c with gold glints; red rope #a3161a; shadow #5a3a22; haze #e6c08a
// LIGHT    low golden key #ffcf8a from the left, lilac fill; amber shadows
// LIFE     golden reed seeds drifting, red ribbon scraps over the well; ripples and splash crowns on the lake
import { setupChapter, threads, threadBand, threadWrap, beats, elite, intro, outro, GROUNDS, createActor, makeHero, slash, shards, rings, crown, drift, P2, THREE } from '../../common/kit.js';
import { makeTerrain } from '../../common/terrain.js';
import { jiangnanHouse } from '../../common/build.js';
import { crescentShot, popBurst, sawRing, sparks, scraps, afterimage, starburst, stock, curls } from '../../common/fx.js';

const S0 = '/work/film/stickers/03-village/', BOSS = '/work/boss-chibi/透明PNG/03 陆家村/';
const C = { ground: GROUNDS['03-village'], washA: '#a8966f', washB: '#cbbd9e', washC: '#9a8866', path: '#ddd0b4', reed: '#c99a46', lake: '#7f8f8c', lakeDeep: '#5d6e6c', red: '#b3231a', foam: '#efe4cc' };
const K = await setupChapter({
  id: '03-village', ground: C.ground, duration: 41.8,
  bounds: { x0: -46, x1: 46, z0: -54, z1: 34 },
  light: { key: '#ffcf8a', keyIntensity: 3.1, keyDir: [-0.85, 0.55, 0.45], fill: '#b8b0d0', fillIntensity: 0.85, sky: '#ffe6c8', ground: '#8a7a60', skyIntensity: 0.45, leak: '#6a4024' },
  lens: { haze: '#e6c08a', hazeStart: 40, hazeEnd: 130, hazeAmount: 0.32, saturation: 1.0, tint: [1.03, 0.99, 0.96], exposure: 0.86, vignette: 0.1 },
  pieces: { stone: '#958a78', stoneDark: '#6a6254', cap: '#8a8a52', bush: ['#7d8a52', '#8f8a4a', '#6b6a3e'], bushDots: '#e0b04a', tuft: ['#b09048', '#9a8a4a'] },
  shadowInk: '#2a1c10',
  stickers: {
    house: S0 + 'house.png', well: S0 + 'well.png', net: S0 + 'rednet.png', terrace: S0 + 'terrace.png', reeds: S0 + 'reeds.png', lonetree: S0 + 'lonetree.png', walk: S0 + 'boardwalk.png',
    boat: '/work/film/stickers/04-town/dockboat.png',
    zhuobi: BOSS + '01 守门人拙壁.png', yuzan: BOSS + '02 乐师偶·玉瓒.png', dangyi: BOSS + '03 操偶师·荡秽.png', mu2: BOSS + '04 沐小葵·铁玉女王.png', mu1: BOSS + '05 沐小葵·组织少主.png',
    yuyao: BOSS + '06 少主护卫·玉妖.png', tiegui: BOSS + '07 少主护卫·铁鬼.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, house } = K;
const T = makeTerrain(K);

// ---- the plan: the lane climbs the page through the village; past z -26 the lake opens wide -------------------------------------
const LAKE = { x: 2, z: -42, rx: 34, rz: 13 };
const inLake = (x, z, k = 1) => ((x - LAKE.x) / (LAKE.rx * k)) ** 2 + ((z - LAKE.z) / (LAKE.rz * k)) ** 2 < 1;
const SHORE = { x: 3, z: -35.5, rx: 13, rz: 4.5 };   // the shallows where they fight (printed lighter)
const LANE = P2.pathLine([[1, -27], [-1, -18], [2, -8], [-1, 3], [2, 14], [0, 24], [1, 36]]);
const inner = (z) => z < -24 ? 30 : 15 + Math.sin(z * 0.3) * 0.8;
const lDist = (x, z) => { let d = 1e9; for (const [px, pz] of LANE.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const ELITES = [[-5, 13, -8], [6, -1, 9], [-5, -15, -9]];
const inSight = (x, z) => ELITES.some(([ex, ez, yaw]) => { const d = z - ez; if (d < -2.5 || d > 18) return false; return Math.abs(x - ex - d * Math.tan(yaw * Math.PI / 180)) < 4 + d * 0.33; });
const floorOK = (x, z) => Math.abs(x) < inner(z) - 1.5 && !inLake(x, z, 1.02) && lDist(x, z) > 2.2;

H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, drifts, water }) => {
  washes([C.washA, C.washB, C.washB, C.washC]);
  for (const s of [-1, 1]) { const pts = []; for (let z = 36; z >= -24; z -= 2) pts.push([s * (inner(z) - 1.2 + Math.sin(z * 0.7) * 0.6), z]); pts.push([s * 50, -24], [s * 50, 36]); torn(pts, P2.rgba('#9a9468', 0.85)); }
  torn(bandOf(LANE.pts, (u) => 1.7 + Math.sin(u * 7) * 0.2), C.path);
  g.strokeStyle = P2.rgba('#8a7e64', 0.4); g.lineWidth = 0.06 * ppu; for (const [x, z] of LANE.pts) { if (r() < 0.5) continue; g.strokeRect(X(x - 0.9), Z(z - 0.6), 1.8 * ppu, 1.1 * ppu); }
  // the well yard
  torn([[1, -6], [12, -7], [13, 3], [2, 4]], P2.rgba('#bfb39a', 0.9));
  g.lineWidth = 0.07 * ppu; for (let k = 0; k < 18; k++) { const x = 2 + r() * 10, z = -6 + r() * 9; g.strokeStyle = P2.rgba('#a3161a', 0.5); g.beginPath(); g.arc(X(x), Z(z), (0.3 + r() * 0.5) * ppu, 0, 5); g.stroke(); }
  drifts((x, y) => { g.strokeStyle = P2.rgba(r() < 0.5 ? '#8a8a52' : '#b0a060', 0.6); g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 4 - r() * 3); g.stroke(); }, { n: 9000, threshold: 0.6 });
  // the lake: slate water with gold glints, the lighter shallows, lily pads
  const blob = (o, k, n = 60) => Array.from({ length: n }, (_, i) => { const a = i / n * 6.283, w = 1 + 0.05 * Math.sin(a * 5 + 1) + 0.03 * Math.sin(a * 11); return [o.x + Math.cos(a) * o.rx * k * w, o.z + Math.sin(a) * o.rz * k * w]; });
  water(blob(LAKE, 1), { colors: [C.lake, C.lakeDeep], rim: '#d8c8a0', inset: 0.8, marks: 'ripples', markColor: P2.rgba('#f2d79a', 0.7), flow: 0.1, foam: P2.rgba(C.foam, 0.5) });
  torn(blob(SHORE, 1), P2.rgba('#a8a48a', 0.55), 'rgba(0,0,0,0)');
  for (let k = 0; k < 60; k++) { const x = LAKE.x + (r() - 0.5) * 50, z = LAKE.z + (r() - 0.5) * 18; if (!inLake(x, z, 0.92) || Math.hypot((x - SHORE.x) / SHORE.rx, (z - SHORE.z) / SHORE.rz) < 1.1) continue; g.fillStyle = P2.rgba(r() < 0.5 ? '#5e7a4a' : '#7a8f54', 0.9); g.beginPath(); g.moveTo(X(x), Z(z)); g.arc(X(x), Z(z), (0.35 + r() * 0.4) * ppu, r() * 6, r() * 6 + 5.4); g.closePath(); g.fill(); }
});

// ---- the slopes: green terraces each side of the village; far ranges past the lake -------------------------------------------------
const slopeCol = (i, n) => { const k = i / (n - 1); return { rock: P2.mix('#7d7a56', '#b0aa84', k * 0.8), dark: P2.mix('#4e4a34', '#7d7a5c', k * 0.8), moss: P2.mix('#6f7d46', '#a8aa70', k * 0.8), pine: P2.mix('#3e4a2c', '#6a7a4c', k * 0.7), mist: '#eadcb8' }; };
const ZL = [27, 16, 5, -6, -17], ZR = [22, 11, 0, -11, -22];
const wl = T.wings({ zs: ZL, side: -1, inner: (z) => -inner(z), w: 22, h: (z, i) => 10 + i * 1.8, colors: (i) => slopeCol(i, 6), seed: 31, opts: { plateau: 0.6, spires: 0, pines: 0.9, jag: 0.05 } });
const wr = T.wings({ zs: ZR, side: 1, inner: (z) => inner(z), w: 22, h: (z, i) => 10.5 + i * 1.8, colors: (i) => slopeCol(i, 6), seed: 37, opts: { plateau: 0.6, spires: 0, pines: 0.9, jag: 0.05 } });
T.range({ z: -58, x: 0, w: 160, h: 24, color: '#b49a84', cap: '#dcc6a6', seed: 31, peaks: 9 });
T.range({ z: -64, x: 12, w: 180, h: 32, color: '#c4ae98', cap: '#e4d2b6', seed: 32, peaks: 6 });
// stone terraces stepping up the slopes' feet
for (const [x, z, s] of [[-12.5, 20, 1.0], [12.5, 15, 1.0], [-12, -9, 1.1], [12.5, -14, 1.0]]) sticker('terrace', 3, { x, z, scale: s, res: 1.0 });

// ---- the village: houses of many shapes packed along the lane (none in an elite's sightline) ------------------------------------------
const PAL = [
  { wall: '#d6cdb8', roof: '#4b4d50', timber: '#3a2c22', accent: '#b3231a' }, { wall: '#c9bea6', roof: '#55524e', timber: '#3e2f24' },
  { wall: '#bfb29a', roof: '#3e3a36', timber: '#2e241c', accent: '#b3231a' }, { wall: '#d9d0bc', roof: '#5a5248', timber: '#4a3424' }, { wall: '#b8a888', roof: '#4a4440', timber: '#3a2c22' }];
const KINDS = [
  { w: 6.5, d: 4.5, wallH: 3.2, roofH: 2.4 },   // a hall
  { w: 3.8, d: 3.6, wallH: 4.8, roofH: 2.6 },   // a narrow tall house
  { w: 4.6, d: 3.2, wallH: 2.4, roofH: 1.6 },   // a shed
  { w: 5.2, d: 4.0, wallH: 3.8, roofH: 3.2 },   // a steep-roofed house
  { w: 7.5, d: 4.2, wallH: 2.8, roofH: 2.0 },   // a long low house
  { w: 3.2, d: 3.2, wallH: 5.8, roofH: 2.8 },   // a gate tower
  { w: 5.6, d: 3.8, wallH: 4.4, roofH: 2.2 },   // a two-storey house
  { w: 4.2, d: 3.4, wallH: 3.0, roofH: 2.6 },   // a cottage under a tall roof
];
// timber houses in the village's other manner: dark plank walls, plain gables, some on stilts over the slope
const TIMBER = [{ wall: '#7a5e44', timber: '#2e2218', tile: '#55524e', tileDark: '#3a3834', window: '#2a1e16', lit: '#ffcf8a' },
  { wall: '#c9bea6', timber: '#3a2c22', tile: '#4b4d50', tileDark: '#34363a', window: '#2a1e16', lit: '#ffcf8a' },
  { wall: '#8a6a4c', timber: '#2a1e16', tile: '#5a5248', tileDark: '#3e3832', window: '#2a1e16', lit: '#ffcf8a' }];
const HOUSES = [];
let seedH = 40;
for (let z = 31; z > -24; z -= 2.3) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
  const kind = KINDS[Math.floor(rnd() * KINDS.length)], x = s * between(4.2 + k * 2.9, 5.4 + k * 3.2), zz = z + between(-0.8, 0.8);
  if (Math.abs(x) + kind.w * 0.35 > inner(zz) + 0.8 || lDist(x, zz) < kind.w * 0.4 + 1.1 || inSight(x, zz) || !clear(x, zz, -2.3)) continue;
  if (Math.hypot(x - 7, zz + 1.5) < 6.5) continue;   // the well yard
  const group = zz < -15 ? 'field' : 'world';
  if (rnd() < 0.35) {   // a timber house (3D model): plank walls, plain gables, on stilts when it stands up the slope
    const w = between(3.6, 5.4), d = between(3.2, 4.0), h = between(2.6, 4.4), stilts = Math.abs(x) > 10 && rnd() < 0.6 ? between(0.8, 1.6) : 0;
    const node = jiangnanHouse(H, { w, d, h, roofH: between(1.6, 2.4), stories: h > 3.6 ? 2 : 1, horse: false, stilts, seed: seedH += 2, col: TIMBER[Math.floor(rnd() * TIMBER.length)], lantern: rnd() < 0.25, lit: 0.35 });
    const hh = K.put(H.popup(null, null, { node, x, z: zz, yaw: s * between(0.05, 0.3) + (rnd() < 0.3 ? s * Math.PI / 2 : 0), height: node.userData.top, level: true }), group);
    mark(x, zz, Math.max(w, d) * 0.55); continue;
  }
  HOUSES.push(house(x, zz, { ...kind, yaw: s * between(0.05, 0.3), seed: seedH += 2, col: PAL[Math.floor(rnd() * PAL.length)], group }));
}
for (const h of HOUSES) if (rnd() < 0.4) H.glowing(h.house.node);
for (const [x, z, f] of [[-9.5, 27, false], [10, 23, true], [-10, -20, false]]) if (!inSight(x, z)) sticker('house', 7.5, { x, z, res: 1.1, flip: f, group: z < -15 ? 'field' : 'world' });
// the well, its nets and boardwalk; red ropes between eaves, stakes and nets
const well = sticker('well', 5.5, { x: 8, z: -4.5, res: 1.2 });
const net1 = sticker('net', 5, { x: 12, z: -2, res: 1.1 });
sticker('walk', 3.6, { x: 3.5, z: -8, res: 1.1 });
const st = [[3.5, 1.5], [11.5, 3.5], [-3.5, 8.5], [3.5, -12]].map(([x, z]) => { mark(x, z, 0.8); return stake(x, z, 2.3); });
const top = (h) => ({ h, at: [0, 2.2] });
const near = (x, z) => HOUSES.reduce((b, h) => (Math.hypot(h.house.x - x, h.house.z - z) < Math.hypot(b.house.x - x, b.house.z - z) ? h : b), HOUSES[0]);
threads(film, [{ a: { h: well, at: [1.8, 4.6] }, b: top(st[0]) }, { a: { h: well, at: [-1.8, 4.6] }, b: top(st[1]) }, { a: { h: net1, at: [-2, 4.6] }, b: { h: well, at: [1.8, 4.6] } },
  { a: near(-5, 9).anchors.eaveR, b: top(st[2]) }, { a: near(5, -12).anchors.eaveL, b: top(st[3]) }, { a: near(6, 18).anchors.ridgeL, b: near(-6, 18).anchors.ridgeR }, { a: near(6, 6).anchors.eaveL, b: near(-6, 4).anchors.eaveR }], { sag: 0.12 });
const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
const foot = (w, dz, k = 1.5) => [w.cliff.side * (inner(w.cliff.z + dz) - k), 0.05, w.cliff.z + dz];
threadBand(film, { a: wAt(wl[1], 0.3), b: foot(wl[1], -7), n: 110, wA: 1.2, wB: 4.0, seed: 33 });
threadBand(film, { a: wAt(wr[2], 0.3), b: foot(wr[2], -7), n: 110, wA: 1.2, wB: 4.0, seed: 34 });
threadBand(film, { a: wAt(wl[3], 0.3), b: foot(wl[3], -6), n: 110, wA: 1.2, wB: 4.0, seed: 35 });
mark(-5, 13, 2.4); mark(6, -1, 2.4); mark(-5, -15, 2.4);

// ---- the lake shore: reeds, the boardwalk, a boat, the lone tree; it rises when the film reaches the water ---------------------------------
const ARENA_T = 12.2, DS = 3.0;   // v4: the boss fight keeps its v3 times, shifted DS later (film.shift)
sticker('lonetree', 12, { x: -12, z: -44, res: 1.3, group: 'arena' });
sticker('boat', 3.6, { x: 15, z: -44, res: 1.1, group: 'arena' });
sticker('walk', 4.2, { x: 17, z: -36, res: 1.1, group: 'arena' });
for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, rr = 1.05 + rnd() * 0.25, x = SHORE.x + Math.cos(a) * SHORE.rx * rr, z = SHORE.z + Math.sin(a) * SHORE.rz * rr * 1.4; if (z > -33.5 && Math.abs(x - SHORE.x) < 11) continue; if (!clear(x, z, -0.6)) continue; sticker('reeds', between(2.4, 3.6), { x, z, stamp: true, group: 'arena', sway: 0.9, mark: false }); mark(x, z, 0.9); }
mark(SHORE.x, SHORE.z, 12);
fill(260, [-15, 15, -24, 33], [rock, bush, tuft, tuft], (x, z) => floorOK(x, z) && !inSight(x, z), { per: [2, 4], size: [0.4, 0.75] });

H.setHero(H.popup(null, null, { node: new H.THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-16, 16, 0.5, 9, -48, 30], n: 70, colors: ['#e8c470', '#f2dca0', '#c99a46'], size: 0.16, wind: [1.0, -0.05, 0.6], seed: 8, shape: 'ember' });
drift(film, { box: [-10, 16, 0.5, 6, -44, -30], n: 40, colors: ['#f2dca0', '#e8c470'], size: 0.2, wind: [1.5, -0.1, 0.2], seed: 9, shape: 'petal' });
drift(film, { box: [0, 14, 1, 7, -8, 4], n: 14, colors: ['#b3231a', '#8e1a14'], size: 0.26, wind: [0.5, -0.1, 0.2], seed: 10, shape: 'leaf' });

// ---- actors -------------------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const zhuobi = createActor(film, { name: 'zhuobi', poses: { p: IMG.zhuobi }, height: 5.6, x: -5, z: 13 });
const yuzan = createActor(film, { name: 'yuzan', poses: { p: IMG.yuzan }, height: 4.6, x: 6, z: -1 });
const dangyi = createActor(film, { name: 'dangyi', poses: { p: IMG.dangyi }, height: 4.8, x: -5, z: -15 });
const mu = createActor(film, { name: 'mu', poses: { p1: IMG.mu1, p2: IMG.mu2 }, height: 5.4, heights: { p2: 6.4 }, x: 9, z: -37, risen: true });
const yuyao = createActor(film, { name: 'yuyao', poses: { p: IMG.yuyao }, height: 5.6, x: 13, z: -38.5 });
const tiegui = createActor(film, { name: 'tiegui', poses: { p: IMG.tiegui }, height: 5.8, x: -9.5, z: -38.5 });
const SPLASH = ['#efe4cc', '#c8c6b0', '#9aa8a0'];
const B = beats(film, hero, mu, { splash: SPLASH });
const S = film.sound, ZB = -37, ZH = -36;
const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
const RED = ['#1a0c08', '#c0281c', '#f4d6a0'], JADE = ['#0c2a26', '#4fa89a', '#e2f4ee'];

// ---- the walk up the lane (v4): three mid-boss showcases; 魂 off the page until the shore ----------------------------------------
const camIntro = intro(film, hero, { land: [0, 21], t1: 1.0 });
hero.hideBetween(1.9, ARENA_T + DS + 0.15);
film.rise('world', 0.55, { from: [0, 21], speed: 42 });
film.rise('field', 0.55, { from: [0, 21], speed: 42, sound: false });
film.title({ t0: 1.0, dur: 3.0, name: '陆家村', sub: '叁' }); S(1.0, 'title');
const E1 = 3.5, E2 = 6.6, E3 = 10.1;
// 拙壁: the iron gauntlet charges ring by ring, then three blows in a row ("阵型不可乱。")
elite(film, zhuobi, E1, { title: '守门人', name: '拙壁', move: 'none', dur: 2.8 });
zhuobi.key(E1 + 0.5, { jit: 0.05 }).key(E1 + 1.2, { jit: 0.05 }).key(E1 + 1.25, { jit: 0 });
[0, 1, 2].forEach((i) => sawRing(film, { t: E1 + 0.5 + i * 0.22, at: [-3.2, 2.6, 13.6], r0: 0.4 + i * 0.3, r1: 1.0 + i * 0.4, teeth: 12, width: 0.2, color: ['#c8a040', '#e8c060', '#fff0c8'][i], dur: 0.5, upright: true, seed: 50 + i }));
[1.4, 1.75, 2.1].forEach((dt, i) => { zhuobi.key(E1 + dt, { lean: -0.16 }).key(E1 + dt + 0.14, { lean: 0.08, ease: 'out' }); starburst(film, { t: E1 + dt + 0.1, at: [-3.0, 2.4 + i * 0.4, 14.2], r: 1.1 + i * 0.3, spikes: 12, colors: ['#2a1a10', '#c8a040', '#fff0c8'], dur: 0.3, seed: 53 + i, sound: i === 2 ? 'boom' : 'hit' }); });
zhuobi.key(E1 + 2.6, { lean: 0 }); film.at(E1 + 2.2, () => film.kick(0.8));
// 玉瓒: a dark jade orb swells round the space before her (the grab), then a red orb opens and looses red crescents
elite(film, yuzan, E2, { title: '三号 · 乐师偶', name: '玉瓒', move: 'none', dur: 3.2 });
const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), stock(H, '#1e4a44', { flat: true })); orb.visible = false; orb.castShadow = true; H.scene.add(orb);
film.every((t) => { const u = t - E2 - 0.6; orb.visible = u > 0 && u < 1.4; if (!orb.visible) return; const k = u < 0.6 ? 0.4 + u * 3.2 : u < 1.1 ? 2.3 + Math.sin(u * 20) * 0.05 : 2.3 * (1 - (u - 1.1) / 0.3); orb.position.set(4.2, 2.6, 1.2); orb.scale.setScalar(Math.max(0.01, k)); orb.rotation.set(u * 1.3, u * 2, 0); });
S(E2 + 0.6, 'gust');
starburst(film, { t: E2 + 2.0, at: [5.4, 3.0, -0.6], r: 1.2, spikes: 10, colors: RED, dur: 0.3, seed: 57, sound: 'boom' });
for (let i = 0; i < 4; i++) crescentShot(film, { t: E2 + 2.1 + i * 0.1, from: [5.4, 3.0, -0.6], to: [5.4 + (i - 1.5) * 3, 1.4, 9], dur: 0.45, r: 1.0, colors: RED, spin: 10, seed: 58 + i, sound: i ? null : 'slash' });
// 荡秽: a giant puppet's palm comes down out of the air in front of him and slaps the lane ("快杀了我！快！")
elite(film, dangyi, E3, { title: '操偶师', name: '荡秽', move: 'none', dur: 4.6 });
const palm = new THREE.Group(), palmPiv = new THREE.Group(); palm.add(palmPiv);
{ const sh = new THREE.Shape(); sh.moveTo(-1.6, 0); sh.lineTo(1.6, 0); sh.lineTo(1.8, 2.2); for (let f = 0; f < 4; f++) { const x = 1.3 - f * 0.85; sh.lineTo(x + 0.3, 2.4); sh.lineTo(x + 0.25, 4.6 - Math.abs(f - 1.5) * 0.4); sh.lineTo(x - 0.25, 4.6 - Math.abs(f - 1.5) * 0.4); sh.lineTo(x - 0.3, 2.4); } sh.lineTo(-1.9, 1.9); sh.lineTo(-3.0, 3.0); sh.lineTo(-3.4, 2.6); sh.lineTo(-1.8, 0.6); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false }); g.translate(0, 0, -0.09);
  const m = new THREE.Mesh(g, stock(H, '#d8c8a8')); m.castShadow = true; palmPiv.add(m);
  const back = new THREE.Mesh(g, stock(H, '#3a2a22')); back.position.z = -0.12; back.scale.set(1.04, 1.03, 1); palmPiv.add(back); }
palm.position.set(-3.8, 0, -9.6); palm.scale.setScalar(1.25); palm.visible = false; H.scene.add(palm);
film.every((t) => { const u = t - E3 - 1.3; palm.visible = u > 0 && u < 2.4; if (!palm.visible) return; palm.rotation.y = Math.atan2(H.camera.position.x - palm.position.x, H.camera.position.z - palm.position.z) * 0.3;
  palmPiv.rotation.x = u < 0.7 ? -(1 - Math.min(1, u / 0.5)) * 0.4 : u < 1.0 ? -(((u - 0.7) / 0.3) ** 2) * (Math.PI / 2) : u < 1.9 ? -Math.PI / 2 : -Math.PI / 2 + ((u - 1.9) / 0.5) * 0.2;
  palm.position.y = u < 0.7 ? (1 - Math.min(1, u / 0.5)) * 6 : 0; palm.scale.setScalar(u > 1.9 ? 1.25 * (1 - (u - 1.9) / 0.5) + 0.01 : 1.25); });
curls(film, { t: E3 + 1.1, from: [-4, 0.5, -12], to: [-4, 6.5, -10], n: 7, colors: ['#e8e2d6', '#c9c2b4', '#4a3a30'], dur: 0.7, spread: 1.6, seed: 61, sound: 'gust' });
popBurst(film, { t: E3 + 2.3, at: [-3.8, 0, -6.2], r: 3.0, colors: ['#c9b58a', '#8a7a5a', '#efe4cc'], crumple: 10, seed: 62, sound: 'boom' }); film.at(E3 + 2.3, () => film.kick(1.1));
rings(film, { t: E3 + 2.3, at: [-3.8, 0, -6.2], n: 3, r1: 6, color: '#c9b58a', width: 0.28 });
{ const V = film.voice; V(E1 + 0.05, 'vo/zhuobi_line_01.wav'); V(E2 + 2.0, 'vo/yuzan_attack_heavy_01.wav'); V(E3 + 0.05, 'vo/danghui_encounter_line_01.wav'); }
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 5, -6], dist: 64, pitch: 34, yaw: 4, focus: [0, 4, -6] },
  { t: 3.3, target: [1, 5, -11], dist: 58, pitch: 31, yaw: 1, ease: 'linear', focus: [0, 4, -11] },
  // 拙壁, close and low on the gauntlet
  { t: E1 + 0.1, target: [-4, 3.4, 13.4], dist: 20, pitch: 14, yaw: 12, focus: [-4, 3, 13.4], ease: 'cut' },
  { t: E2 - 0.3, target: [-4, 3.2, 13.6], dist: 17.5, pitch: 13, yaw: 9, ease: 'linear', focus: [-3.6, 2.8, 13.8] },
  // 玉瓒: the orb swells toward the lens; the crescents come out at us
  { t: E2 - 0.25, target: [5, 3.2, 1], dist: 22, pitch: 18, yaw: 8, focus: [4.6, 2.8, 1], ease: 'cut' },
  { t: E3 - 0.3, target: [5, 3.2, 2], dist: 24, pitch: 20, yaw: 6, ease: 'linear', focus: [5, 2.8, 2] },
  // 荡秽, wide enough for the palm, which comes down between us and him
  { t: E3 - 0.25, target: [-4.4, 3.4, -11], dist: 30, pitch: 36, yaw: 2, focus: [-4.6, 3.4, -12], ease: 'cut' },
  { t: E3 + 2.2, target: [-4.2, 3.0, -9.5], dist: 27, pitch: 34, yaw: 2, ease: 'linear', focus: [-4, 2.4, -8] },
  { t: E3 + 4.9, target: [-4.2, 3.0, -10.5], dist: 29, pitch: 36, yaw: 2, ease: 'linear', focus: [-4.4, 3, -12] },
]);
film.shift(DS);   // ---- from here on: the v3 boss fight, DS later

// ---- the lake: the shore rises, 魂 comes down to the shallows, she lands on the water ---------------------------------------------------
film.rise('arena', ARENA_T, { from: [SHORE.x, -40], speed: 26 });
film.rise('field', ARENA_T - 0.1, { from: [0, -18], speed: 40, open: 0 });
hero.key(12.4, { hidden: false, pose: 'run', x: -1, z: -25, face: 1, rise: 1 }).key(13.6, { x: -3, z: ZH, ease: 'linear' }).key(13.62, { pose: 'idle' });
S(12.45, 'steps', { dur: 1.2 });
mu.key(0, { hidden: true, y: 14 }).key(13.6, { hidden: false, y: 14 }).key(14.0, { y: 0, ease: 'in' });
film.at(14.0, () => film.kick(0.8)); S(14.0, 'land', { size: 0.8 });
crown(film, { t: 14.0, at: [9, 0, ZB], n: 12, radius: 1.5, height: 2.4, colors: SPLASH, rows: 2, seed: 11 });
rings(film, { t: 14.0, at: [9, 0, ZB], n: 3, r1: 6, color: C.foam });
film.plate({ t0: 14.4, dur: 2.4, title: '组织少主', name: '沐小葵', boss: true, seal: '首' });

// phase one: far -> near -> far. Two red sword-qi crescents from range (guarded, dodged)
const qi = (t, y = 2.4, to = -3) => { mu.key(t - 0.15, { lean: 0 }).key(t, { lean: -0.16 }).key(t + 0.2, { lean: 0 }); crescentShot(film, { t, from: [7.5, y, ZB + 0.3], to: [to, y, ZH], dur: 0.32, r: 1.7, colors: RED }); };
qi(15.0); B.guard(15.32, [-3, ZH], { back: 0.6, hold: 0.32 });
qi(15.7, 1.2); hero.key(15.9, { pose: 'overhead', x: -3.6, z: ZH, hop: 2.2 }).key(16.3, { x: -2.6, ease: 'linear' }).key(16.32, { pose: 'idle' }); S(15.9, 'leap');
// near: she dashes in (a white streak) and cuts three times
afterimage(film, { t: 16.6, img: IMG.mu1, at: [9, ZB], height: 5.4 });
mu.key(16.6, { x: 9 }).key(16.8, { x: 2.4, ease: 'out' }); S(16.6, 'dash');
[16.95, 17.2, 17.45].forEach((t, i) => { slash(film, { t, at: [0.4, 2.4, -36.2], radius: 2.8, width: 0.7, a0: i % 2 ? 2.4 : -0.6, a1: i % 2 ? -0.6 : 2.4, normal: [0.1, 0.2, 1], color: '#c0281c', core: '#f4d6a0', sound: 'slash' }); B.guard(t + 0.04, [-2.6 - i * 0.35, ZH], { back: 0.35, hold: 0.24 }); });
// far again: a blink back, the red burst under 魂's feet (he steps off it)
afterimage(film, { t: 17.9, img: IMG.mu1, at: [2.4, ZB], height: 5.4 });
mu.key(17.9, { x: 2.4 }).key(18.1, { x: 8.5, ease: 'out' }); S(17.9, 'dash');
starburst(film, { t: 18.35, at: [-3.6, 0.3, ZH], r: 1.3, colors: RED, dur: 0.3, seed: 3 });
hero.key(18.45, { pose: 'dodge', x: -3.6 }).key(18.7, { x: -6.0, ease: 'out' }).key(18.8, { pose: 'idle' });
popBurst(film, { t: 18.65, at: [-3.6, 0, ZH], r: 2.6, colors: ['#c0281c', '#7a1a14', '#f4d6a0'], crumple: 8, seed: 21, sound: 'boom' });
// the ring of red cuts round him (the spinning crimson combo): the red flash; he shadow-steps out of the ring to her back
const R1 = 19.3;
for (let i = 0; i < 4; i++) crescentShot(film, { t: R1 + i * 0.1, from: [-6 + Math.cos(i * 1.6) * 4.5, 2.2, ZH + Math.sin(i * 1.6) * 2], to: [-6 + Math.cos(i * 1.6 + 2) * 4.5, 2.2, ZH + Math.sin(i * 1.6 + 2) * 2], dur: 0.5, r: 1.2, colors: RED, spin: 6, sound: i ? null : 'whoosh', seed: 40 + i });
sawRing(film, { t: R1, at: [-6, 0, ZH], r0: 5, r1: 3.6, color: '#c0281c', dur: 0.7, seed: 5 });
B.tell(R1 + 0.5, [6.5, 4.6, -36.4], 'red');
B.shadowstep(R1 + 0.62, [-6, ZH], [12.6, -36.4], { face: -1 });
mu.key(R1 + 0.7, { x: 8.5 }).key(R1 + 0.9, { x: -3.5, ease: 'out' }); afterimage(film, { t: R1 + 0.7, img: IMG.mu1, at: [8.5, ZB], height: 5.4 });
slash(film, { t: R1 + 0.95, at: [-6, 2.4, -36.0], radius: 3.6, width: 1.0, a0: 2.5, a1: -0.8, normal: [0, 0.15, 1], color: '#7a1a14', core: '#e2553e', sound: 'heavy' });
mu.key(R1 + 1.2, { face: -1 }).key(R1 + 1.4, { x: -3.5 }).key(R1 + 1.7, { x: 3.0, ease: 'out' });
B.counter(R1 + 1.75, [12.6, -36.4], [3.0, ZB], { face: -1, reach: 3.5 });
// the delayed heavy: she holds the swing (the blue glint), drops it; deflected; the counter
mu.key(R1 + 2.7, { lean: 0 }).key(R1 + 2.9, { lean: -0.25 });
B.tell(R1 + 3.1, [4.4, 5.2, -36.4], 'blue');
mu.key(R1 + 3.25, { lean: 0.15, ease: 'in' }).key(R1 + 3.6, { lean: 0 });
B.deflect(R1 + 3.3, [8.6, -36.4], [3.0, ZB], { face: -1 });
B.counter(R1 + 3.9, [8.6, -36.4], [3.0, ZB], { face: -1, reach: 1.8 });
hero.key(R1 + 4.7, { pose: 'dodge', x: 6.8, face: -1 }).key(R1 + 5.0, { x: 9.5, ease: 'out' }).key(R1 + 5.1, { pose: 'idle' });

// the change: the Iron-Jade Queen
const P2T = B.phase(R1 + 5.2, [3.0, ZB], 'p2', { heroFrom: [9.5, -36.4], heroTo: [11.5, -36.4], kind: 'spike', crownColors: ['#2a4a46', '#4fa89a', '#c0281c'], color: ['#4fa89a', '#c0281c', '#e2f4ee'], flash: '#4fa89a' });
mu.key(P2T + 0.1, { face: -1 });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '沐小葵 · 第二形态', name: '铁玉女王', boss: true, seal: '女', barColor: '#2a6a62' });
// she fights a while alone: a jade-and-crimson double crescent (guarded), a near cut (guarded)
const Q = P2T + 2.0;
crescentShot(film, { t: Q, from: [4.5, 2.6, ZB + 0.3], to: [11.5, 2.6, -36.4], dur: 0.3, r: 1.9, colors: JADE });
B.guard(Q + 0.3, [11.5, -36.4], { face: -1, back: -0.5, hold: 0.3 });
crescentShot(film, { t: Q + 0.45, from: [4.5, 1.4, ZB + 0.3], to: [12, 1.4, -36.4], dur: 0.3, r: 1.9, colors: RED });
B.guard(Q + 0.75, [12, -36.4], { face: -1, back: -0.5, heavy: true, hold: 0.4 });
// she calls her guards up out of the lake (no threads): 玉妖 behind 魂, 铁鬼 across the water
const G = Q + 1.5;
mu.key(G - 0.2, { lean: -0.12 }).key(G + 0.3, { lean: 0 });
for (const [a, x, z, c] of [[yuyao, 15.5, -38.8, JADE[1]], [tiegui, -6.5, -38.8, '#5a5c62']]) {
  a.key(0, { hidden: true }).key(G, { hidden: false, x, z, rise: 1 });
  crown(film, { t: G, at: [x, 0, z], n: 12, radius: 1.6, height: 2.8, colors: [...SPLASH, c], rows: 2, seed: Math.round(x) + 50 });
  rings(film, { t: G, at: [x, 0, z], n: 3, r1: 5, color: C.foam });
}
S(G, 'splash', { size: 1.2 }); S(G + 0.1, 'boom');
film.plate({ t0: G + 0.5, dur: 2.0, title: '少主护卫', name: '玉妖 · 铁鬼', side: 'right' });
// they take turns. 玉妖: a blue crescent kick from behind (guarded, he turns)
yuyao.key(G + 1.0, { lean: 0 }).key(G + 1.15, { lean: -0.2 }).key(G + 1.35, { lean: 0 });
crescentShot(film, { t: G + 1.15, from: [14.5, 1.6, -38.4], to: [12.4, 1.6, -36.6], dur: 0.2, r: 1.5, colors: JADE, sound: 'whoosh' });
B.guard(G + 1.35, [12.0, -36.4], { face: 1, back: 0.4, hold: 0.35 });
// 铁鬼: he charges across the water (the blue glint), 魂 deflects him into a stagger
tiegui.key(G + 1.8, { x: -6.5 }).key(G + 2.35, { x: 7.0, ease: 'in' }).key(G + 2.35, { z: -37.6 });
for (let k = 0; k < 4; k++) crown(film, { t: G + 1.85 + k * 0.12, at: [lerp(-6.5, 6, k / 3), 0, -38.6], n: 7, radius: 1.0, height: 1.8, colors: SPLASH, seed: 60 + k });
B.tell(G + 2.1, [3.0, 4.2, -38], 'blue');
B.deflect(G + 2.4, [10.4, -36.4], [7.0, -37.6], { face: -1 });
tiegui.key(G + 2.45, { lean: 0 }).key(G + 2.6, { lean: 0.45, ease: 'out' }).key(G + 3.2, { lean: 0 }).key(G + 3.3, { x: 7.0 }).key(G + 3.8, { x: -6.5, ease: 'out' });
// 沐小葵 and 玉妖 together: the red flash; he shadow-steps out from between them and cuts her
const D = G + 4.2;
yuyao.key(D - 0.3, { x: 15.5 }).key(D, { x: 13.8, ease: 'out' });
B.tell(D, [5.5, 4.6, -36.4], 'red');
B.shadowstep(D + 0.12, [10.4, -36.4], [0.2, -36.4], { face: 1 });
crescentShot(film, { t: D + 0.2, from: [4.6, 2.2, ZB + 0.3], to: [11, 2.2, -36.4], dur: 0.22, r: 1.8, colors: RED, sound: 'heavy' });
crescentShot(film, { t: D + 0.22, from: [13.6, 1.6, -38], to: [10.4, 1.6, -36.4], dur: 0.2, r: 1.5, colors: JADE, sound: null });
popBurst(film, { t: D + 0.45, at: [10.4, 0, -36.4], r: 2.2, colors: ['#c0281c', '#4fa89a', '#f4d6a0'], crumple: 6, seed: 71, sound: 'boom' });
mu.key(D + 0.5, { face: 1 });
B.counter(D + 0.7, [0.2, -36.4], [3.0, ZB], { reach: 0.8 });
// 铁鬼's heavy punch (guarded heavy), then the last: her blue glint, the deflect, the finisher
tiegui.key(D + 1.4, { x: -6.5 }).key(D + 1.65, { x: -3.6, ease: 'out' }).key(D + 2.2, { x: -6.5 });
slash(film, { t: D + 1.7, at: [-2.2, 2.4, -37.0], radius: 2.4, width: 0.9, a0: 2.2, a1: -0.4, normal: [0, 0.2, 1], color: '#5a5c62', core: '#d8d0c0', sound: 'heavy' });
B.guard(D + 1.75, [-0.2, -36.4], { face: -1, back: -0.8, heavy: true, hold: 0.45 });
mu.key(D + 2.4, { face: 1 });
B.tell(D + 2.6, [5.0, 4.8, -36.4], 'blue');
mu.key(D + 2.7, { x: 3.0 }).key(D + 2.9, { x: 2.8, ease: 'out' });
B.deflect(D + 2.85, [0.6, -36.4], [3.4, ZB], { face: 1, stagger: 0.55 });
const FIN = D + 3.5;
B.finisher(FIN, [0.8, -36.4], [3.6, ZB], { face: 1 });
for (const a of [yuyao, tiegui]) a.key(FIN + 0.6, { lean: 0 }).key(FIN + 0.9, { lean: 0.3 }).key(FIN + 1.1, { rise: 0 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
// 沐小葵's "玉妖、铁鬼，听命！" belongs to the second phase, just before the guards come up out of the lake.
{ const V = film.voice;
  V(16.6, 'vo/muxiaokui_attack_02.wav'); V(R1 + 0.9, 'vo/muxiaokui_attack_01.wav'); V(R1 + 1.95, 'vo/muxiaokui_hurt_01.wav'); V(R1 + 2.8, 'vo/muxiaokui_charge_01.wav');
  V(R1 + 5.25, 'vo/muxiaokui_charge_02.wav');                               // the change
  V(Q, 'vo/muxiaokui_attack_01.wav');
  V(G - 1.5, 'vo/muxiaokui_line_01.wav');                                    // P2: 玉妖、铁鬼，听命！
  V(G + 0.6, 'vo/yuyao_encounter_line_01.wav');                              // 玉妖: 魂大人，承让了！
  V(G + 2.8, 'vo/tiegui_attack_heavy_01.wav');   // pending in the pack (SFX-REQUEST D)
  V(D + 0.85, 'vo/muxiaokui_hurt_02.wav'); V(FIN + 0.45, 'vo/muxiaokui_death_02.wav'); }

const OUT = FIN + 3.2;
const camOutro = outro(film, hero, { t0: OUT, from: [1, -36], dur: 1.4, color: C.ground, nextColor: GROUNDS['04-town'] });
for (const a of [zhuobi, yuzan, dangyi]) a.key(OUT, { rise: 0 });

// ---- camera ------------------------------------------------------------------------------------------------------------------------
const duel = (t, o = {}) => ({ t, target: [3, 2.8, -36.5], dist: 33, pitch: 27, yaw: 0, focus: [3, 2.8, -36.6], ...o });
film.camera([
  { t: 12.9, target: [2, 5, -33], dist: 46, pitch: 25, yaw: 0, focus: [3, 4, -40] },
  { t: 13.55, target: [2.5, 4.5, -34], dist: 42, pitch: 25, yaw: 0, ease: 'linear', focus: [3, 4, -40] },
  // v4: she lands on the water, seen from the shallows
  { t: 13.6, target: [8.4, 3.6, -37], dist: 19, pitch: 6, yaw: -18, focus: [9, 3.4, -37], ease: 'cut' },
  { t: 14.45, target: [8.6, 3.8, -37], dist: 17, pitch: 7, yaw: -14, ease: 'linear', focus: [9, 3.6, -37] },
  duel(14.5, { dist: 34, target: [2.5, 2.8, -36.5], ease: 'cut' }),
  duel(17.0, { dist: 30, ease: 'linear', target: [0.5, 2.8, -36.4] }),
  duel(18.4, { dist: 31, target: [-1, 2.8, -36.4] }),
  duel(R1 + 0.4, { dist: 30, target: [0.5, 3, -36.4] }),
  duel(R1 + 1.6, { dist: 30, target: [6, 3, -36.4] }),
  duel(R1 + 4.4, { dist: 28, ease: 'linear', target: [5.5, 3, -36.4] }),
  { t: P2T - 0.6, target: [3.5, 3.6, -36.8], dist: 23, pitch: 27, yaw: -6, focus: [3, 3.4, ZB] },
  { t: P2T + 1.4, target: [4, 3.8, -36.8], dist: 23, pitch: 26, yaw: -8, ease: 'linear', focus: [3, 3.6, ZB] },
  duel(Q, { dist: 30, target: [7, 3, -36.6] }),
  duel(G, { dist: 40, pitch: 26, target: [4, 3.6, -37.4] }),
  duel(D, { dist: 38, pitch: 27, ease: 'linear', target: [4, 3.4, -37.2] }),
  duel(D + 1.4, { dist: 34, target: [2, 3.2, -36.8] }),
  duel(FIN - 0.4, { dist: 27, target: [2.4, 3, -36.4] }),
  // v4: the kill over 魂's shoulder (he is on her left), then wide for the stamp
  { t: FIN - 0.05, target: [1.8, 3.0, -36.6], dist: 18, pitch: 13, yaw: -42, focus: [3.6, 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [1.8, 2.8, -36.6], dist: 16.5, pitch: 13, yaw: -38, ease: 'linear', focus: [3.6, 2.6, -37] },
  duel(FIN + 1.25, { dist: 27, pitch: 30, target: [2.4, 2.8, -36.4], ease: 'cut' }),
  duel(FIN + 2.6, { dist: 29, pitch: 31, ease: 'linear', target: [2, 2.8, -36.4] }),
  ...camOutro,
]);
film.start();
