// 第二章 · 血色森林 (Crimson Forest), v2. A forest valley between rust-red slopes, packed with red maples, a leaf-strewn
// path running up the page. The film walks up it: the bandit camp (花千笑), the rope bridge (荆野), the teal mirror
// forest (铁狂); at its head, rising only for the fight, the great red-threaded tree over a meadow of pale flowers, where
// 白赤练 fights as the Lady of the Twin Serpents (blink-dashes that leave white afterimages, ribbon crescents, the
// leaping slash, the power lunge, twin serpents from the ground), then, under a sky gone red and a rain of red thread,
// as the Sacrificial Serpent (the crawling rush, the great summoned serpent, the serpent ring). ~44 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.2: autumn forest of crimson maples on rust slopes, a bandit camp; a teal mirror forest in mist; a giant
//          tree hung with red threads over pale flowers at violet dusk.
// PALETTE  ground #b39a86; slopes #8a5a48 -> #b49080, foliage teeth crimson #9a2a1e; teal #4f6f6c; violet #6a5878;
//          pale flowers #f2ece4 / #c9d6e4; thread #a3161a; shadow #4a2e40; haze #c9a4a6
// LIGHT    warm low dusk key #ffd2ac from the left, violet fill; plum shadows
// LIFE     red maple leaves everywhere (heavy), pale petals over the meadow
import { setupChapter, threads, threadBand, threadWrap, beats, elite, intro, outro, GROUNDS, createActor, makeHero, slash, shards, rings, crown, drift, P2, THREE } from '../../common/kit.js';
import { makeTerrain } from '../../common/terrain.js';
import { afterimage, paperSerpent, curls, popBurst, sparks, scraps, crescentShot, sawRing, starburst, glint, stock } from '../../common/fx.js';

const S0 = '/work/film/stickers/02-forest/', BOSS = '/work/boss-chibi/透明PNG/02 血色森林/';
const C = { ground: GROUNDS['02-forest'], washA: '#a8806a', washB: '#c4ad94', washC: '#9a7a66', path: '#d9c8b0', teal: '#4f6f6c', tealGround: '#7d8a82', violet: '#6a5878', violetGround: '#857890', red: '#b3231a', slope: '#8f6a58' };
const K = await setupChapter({
  id: '02-forest', ground: C.ground, whiteStamp: true, duration: 47.3,
  bounds: { x0: -46, x1: 46, z0: -52, z1: 34 },
  light: { key: '#ffd2ac', keyIntensity: 2.7, keyDir: [-0.8, 0.8, 0.4], fill: '#b8a8c8', fillIntensity: 0.95, sky: '#f0e0dc', ground: '#8a6a5a', skyIntensity: 0.5, leak: '#4a2e40' },
  lens: { haze: '#c9a4a6', hazeStart: 40, hazeEnd: 130, hazeAmount: 0.32, saturation: 0.96, tint: [1.02, 0.98, 1.0], exposure: 0.86, vignette: 0.1 },
  pieces: { stone: '#8a7e78', stoneDark: '#5e5250', cap: '#9a3a26', bush: ['#9a3a26', '#7a4a2e', '#6b6b4a'], bushDots: '#e0a04a', tuft: ['#a0703a', '#8a5a3a'] },
  shadowInk: '#2a1820',
  stickers: {
    maple: S0 + 'maple.png', bigtree: S0 + 'bigtree.png', camp: S0 + 'banditcamp.png', bridge: S0 + 'bridge.png', white: S0 + 'whiteflowers.png',
    redbush: S0 + 'redbush.png', mpine: S0 + 'mirrorpine.png', redposts: '/work/film/stickers/01-valley/redposts.png',
    hua: BOSS + '01 花千笑.png', jing: BOSS + '02 荆野.png', tie: BOSS + '03 铁狂.png', bai2: BOSS + '04 白赤练·献祭之蛇.png', bai1: BOSS + '05 白赤练·双蛇夫人.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, house } = K;
const T = makeTerrain(K);

// ---- the plan ------------------------------------------------------------------------------------------------------------
const FIELD = { x: 3, z: -37, rx: 11, rz: 5.6 };
const inField = (x, z, k = 1) => ((x - FIELD.x) / (FIELD.rx * k)) ** 2 + ((z - FIELD.z) / (FIELD.rz * k)) ** 2 < 1;
const MIRROR = { x: -7, z: -21, rx: 6.5, rz: 5 };
const PATH = P2.pathLine([[2, -32], [-1, -24], [2, -13], [0, 0], [3, 12], [0, 24], [1, 36]]);
const inner = (z) => 14.5 + Math.sin(z * 0.27) * 1.0;
const pDist = (x, z) => { let d = 1e9; for (const [px, pz] of PATH.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const floorOK = (x, z) => Math.abs(x) < inner(z) - 1.5 && !inField(x, z, 1.15) && pDist(x, z) > 2.3 && z > -44;

H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, drifts }) => {
  washes([C.washA, C.washB, C.washB, C.washC]);
  for (const s of [-1, 1]) { const pts = []; for (let z = 36; z >= -54; z -= 2) pts.push([s * (inner(z) - 1.2 + Math.sin(z * 0.7) * 0.6), z]); pts.push([s * 50, -54], [s * 50, 36]); torn(pts, P2.rgba(C.slope, 0.85)); }
  const blob = (o, k, n = 36) => Array.from({ length: n }, (_, i) => { const a = i / n * 6.283, w = 1 + 0.1 * Math.sin(a * 4 + o.x) + 0.05 * Math.sin(a * 9); return [o.x + Math.cos(a) * o.rx * k * w, o.z + Math.sin(a) * o.rz * k * w]; });
  torn(blob(MIRROR, 1.0), P2.rgba(C.tealGround, 0.85)); torn(blob(MIRROR, 0.6), P2.rgba(C.teal, 0.35), 'rgba(0,0,0,0)');
  torn(blob(FIELD, 1.12), P2.rgba('#9a8aa0', 0.6)); torn(blob(FIELD, 1.0), P2.rgba(C.violetGround, 0.9)); torn(blob(FIELD, 0.55), P2.rgba(C.violet, 0.45), 'rgba(0,0,0,0)');
  for (let k = 0; k < 900; k++) { const a = r() * 6.283, rr = Math.sqrt(r()), x = FIELD.x + Math.cos(a) * FIELD.rx * rr, z = FIELD.z + Math.sin(a) * FIELD.rz * rr; g.fillStyle = r() < 0.6 ? P2.rgba('#f2ece4', 0.85) : P2.rgba('#b8cce0', 0.85); for (let q = 0; q < 5; q++) { const t = q / 5 * 6.283; g.beginPath(); g.arc(X(x) + Math.cos(t) * 0.09 * ppu, Z(z) + Math.sin(t) * 0.09 * ppu, 0.07 * ppu, 0, 7); g.fill(); } }
  torn(bandOf(PATH.pts, (u) => 1.6 + Math.sin(u * 7) * 0.2), C.path);
  drifts((x, y) => { const c = ['#b3231a', '#d2552a', '#8e2a1a', '#e08a3a'][Math.floor(r() * 4)]; g.fillStyle = P2.rgba(c, 0.78); g.save(); g.translate(x, y); g.rotate(r() * 6); g.beginPath(); for (let i = 0; i <= 10; i++) { const a = i / 10 * 6.283, rr = (i % 2 ? 0.45 : 1) * (0.18 + r() * 0.1) * ppu; i ? g.lineTo(Math.sin(a) * rr, Math.cos(a) * rr) : g.moveTo(Math.sin(a) * rr, Math.cos(a) * rr); } g.fill(); g.restore(); }, { n: 30000, threshold: 0.45 });
  g.lineWidth = 0.06 * ppu; for (let k = 0; k < 18; k++) { const x = FIELD.x - 9 + r() * 18, z = FIELD.z - 5 + r() * 8; g.strokeStyle = P2.rgba('#a3161a', 0.5); g.beginPath(); g.moveTo(X(x), Z(z)); g.quadraticCurveTo(X(x + (r() - 0.5) * 4), Z(z + (r() - 0.5) * 3), X(x + (r() - 0.5) * 5), Z(z + (r() - 0.5) * 3)); g.stroke(); }
});

// ---- slopes: rust cliffs crowned with red maple teeth; far ranges in dusk violet ----------------------------------------------
const slopeCol = (i, n) => { const k = i / (n - 1); return { rock: P2.mix('#7a4e40', '#b08a7c', k * 0.85), dark: P2.mix('#4a2a22', '#7a5a50', k * 0.85), moss: P2.mix('#9a2a1e', '#c0705a', k * 0.8), pine: P2.mix('#7a1a14', '#a85a48', k * 0.7), mist: '#e4ccc4' }; };
const ZL = [27, 16, 5, -6, -17, -28, -39], ZR = [22, 11, 0, -11, -22, -33, -44];
const wl = T.wings({ zs: ZL, side: -1, inner: (z) => -inner(z), w: (z, i) => 22 + i, h: (z, i) => 12 + i * 2.0, colors: (i) => slopeCol(i, ZL.length), seed: 21, opts: { plateau: 0.55, spires: 0, pines: 1.6, jag: 0.12 } });
const wr = T.wings({ zs: ZR, side: 1, inner: (z) => inner(z), w: (z, i) => 22 + i, h: (z, i) => 12.5 + i * 2.0, colors: (i) => slopeCol(i, ZR.length), seed: 27, opts: { plateau: 0.55, spires: 1, pines: 1.6, jag: 0.12 } });
T.range({ z: -54, x: 0, w: 150, h: 28, color: '#a88a96', cap: '#c9aeb4', seed: 21, peaks: 9 });
T.range({ z: -60, x: -10, w: 170, h: 36, color: '#b9a2ac', cap: '#d8c4c6', seed: 22, peaks: 6 });
// the maple woods: dense rows on both sides of the path, under the slopes (a few big, many small, all one print)
const MAPLES = [], ELITES = [[-5, 7.5, -8], [6, -4.5, 9], [-6, -19, -9]];
// keep the camera's line to every elite clear: no tree in the wedge from the elite toward the camera (+z, turned by its yaw)
const inSight = (x, z) => ELITES.some(([ex, ez, yaw]) => { const d = z - ez; if (d < -2 || d > 18) return false; return Math.abs(x - ex - d * Math.tan(yaw * Math.PI / 180)) < 3.5 + d * 0.32; });
for (let z = 31; z > -31; z -= 2.3) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
  const x = s * between(7.5 + k * 3, 10 + k * 3.5), zz = z + between(-0.8, 0.8);
  if (Math.abs(x) > inner(zz) - 0.8 || !clear(x, zz, -0.6) || Math.hypot(x - MIRROR.x, zz - MIRROR.z) < 7 || inSight(x, zz)) continue;
  MAPLES.push(sticker('maple', between(5.5, 9.5), { x, z: zz, stamp: true, res: 1.0, sway: 0.4, group: zz < -24 ? 'field' : 'world' })); mark(x, zz, 1.4);
}

// ---- the bandit camp (花千笑) -----------------------------------------------------------------------------------------
const camp = sticker('camp', 7.5, { x: -8.5, z: 2, res: 1.1 });
const hut = house(-10.5, 11, { w: 5.5, d: 4, wallH: 3.0, roofH: 2.4, yaw: 0.25, seed: 21, col: { wall: '#c9b89a', roof: '#8a6a3a', timber: '#4a3424', accent: '#b3231a' } });
mark(-5, 7.5, 2.4);
// ---- the rope bridge and the red posts (荆野) ----------------------------------------------------------------------------
sticker('bridge', 3.6, { x: 3.5, z: -9.5, res: 1.1 });
const rp = sticker('redposts', 4.2, { x: 9.5, z: -10, res: 1.1 });
const st = [[4.5, -1], [10, -2.5], [-3, -6]].map(([x, z]) => { mark(x, z, 0.8); return stake(x, z, 2.3); });
threads(film, [{ a: { h: st[0], at: [0, 2.2] }, b: { h: st[1], at: [0, 2.2] } }, { a: { h: st[1], at: [0, 2.2] }, b: { h: rp, at: [0, 3.6] } }, { a: hut.anchors.eaveR, b: { h: st[2], at: [0, 2.2] } }], { sag: 0.12 });
mark(6, -4.5, 2.4);
// ---- the mirror forest (铁狂) ----------------------------------------------------------------------------------------------
for (const [x, z, h] of [[-11.5, -24.5, 11], [-3.5, -25.5, 10], [-13, -15.5, 9], [-13, -21, 10], [-0.5, -23, 8]]) sticker('mpine', h, { x, z, stamp: true, res: 1.1, group: 'field' });
mark(-6, -19, 2.4);
// ---- bands of red thread from the slope crowns down along the walls ------------------------------------------------------------------
const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
const foot = (w, dz, k = 1.5) => [w.cliff.side * (inner(w.cliff.z + dz) - k), 0.05, w.cliff.z + dz];
threadBand(film, { a: wAt(wl[1], 0.3), b: foot(wl[1], -7), n: 120, wA: 1.3, wB: 4.4, seed: 23 });
threadBand(film, { a: wAt(wr[2], 0.3), b: foot(wr[2], -8), n: 120, wA: 1.3, wB: 4.4, seed: 24 });
threadBand(film, { a: wAt(wl[4], 0.25), b: foot(wl[4], -8), n: 120, wA: 1.3, wB: 4.4, seed: 25 });
threadBand(film, { a: wAt(wr[4], 0.3), b: foot(wr[4], -7), n: 110, wA: 1.2, wB: 4.0, seed: 26 });

// ---- the arena: the great threaded tree over the meadow, rising only for the fight ------------------------------------------
const ARENA_T = 12.2, D = 4.4, D2 = 0.4;   // v4: the boss fight is shifted D later; its phase two D2 more (白赤练's lines said whole)
const tree = sticker('bigtree', 20, { x: FIELD.x + 1, z: -46, res: 1.6, group: 'arena' });
threadWrap(film, { h: tree, at: [0, 0], r: 1.6, y0: 3, y1: 6.5, turns: 12 });
for (const [i, [x, z]] of [[-10, -43.5], [16, -43.5], [-13, -39.5], [18, -39.5]].entries()) threadBand(film, { a: { h: tree, at: [(i % 2 ? 1 : -1) * (4 + i), 14 - i] }, b: [x, 0.05, z], n: 110, wA: 1.0, wB: 3.2, seed: 30 + i });
for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, rr = 0.55 + Math.sqrt(rnd()) * 0.45, x = FIELD.x + Math.cos(a) * FIELD.rx * rr, z = FIELD.z + Math.sin(a) * FIELD.rz * rr; if (z > -40.5 && Math.abs(x - FIELD.x) < 10.5) continue; if (!clear(x, z, -0.5)) continue; sticker('white', 1.5, { x, z, stamp: true, scale: between(0.8, 1.2), group: 'arena', mark: false }); mark(x, z, 1); }
for (const [x, z] of [[-9.5, -38], [15.5, -38.5], [-8, -43], [14, -43.5]]) sticker('redbush', 2.6, { x, z, stamp: true, group: 'arena' });
mark(FIELD.x, FIELD.z, 11);
fill(300, [-15, 15, -28, 33], [rock, bush, tuft, bush, tuft], floorOK, { per: [2, 5], size: [0.45, 0.85] });
fill(90, [-15, 15, -44, -28], [tuft, bush], floorOK, { per: [2, 4], size: [0.4, 0.7], group: 'field' });

H.setHero(H.popup(null, null, { node: new H.THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-16, 16, 0.5, 11, -44, 30], n: 110, colors: ['#b3231a', '#d2552a', '#8e2a1a', '#e08a3a'], size: 0.3, wind: [0.7, -0.35, 0.9], seed: 5, shape: 'maple' });
drift(film, { box: [-8, 14, 0.5, 6, -42, -32], n: 34, colors: ['#f2ece4', '#c9d6e4'], size: 0.18, wind: [0.6, -0.08, 0.2], seed: 6 });

// ---- actors ------------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const hua = createActor(film, { name: 'hua', poses: { p: IMG.hua }, height: 4.8, x: -5, z: 7.5 });
const jing = createActor(film, { name: 'jing', poses: { p: IMG.jing }, height: 4.8, x: 6, z: -4.5 });
const tie = createActor(film, { name: 'tie', poses: { p: IMG.tie }, height: 5.4, x: -6, z: -19 });
const bai = createActor(film, { name: 'bai', poses: { p1: IMG.bai1, p2: IMG.bai2 }, height: 5.8, heights: { p2: 6.4 }, x: 8, z: -37, risen: true });
const B = beats(film, hero, bai, { dust: ['#a8806a', '#8a5a3a', '#e9d8c0'] });
const S = film.sound, ZB = -37, ZH = -36;
const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
const WHITE = ['#f4efe6', '#e2d8c6'], RIBBON = ['#b3231a', '#d24a34', '#7a1a14'];

// ---- the walk up the valley (v4): three mid-boss showcases, 魂 off the page until the meadow ---------------------------------
const camIntro = intro(film, hero, { land: [0, 21], t1: 1.0 });
hero.hideBetween(1.9, ARENA_T + D + 0.15);
film.rise('world', 0.55, { from: [0, 21], speed: 42 });
film.rise('field', 0.55, { from: [0, 21], speed: 42, sound: false });
film.title({ t0: 1.0, dur: 3.0, name: '血色森林', sub: '贰' }); S(1.0, 'title');
const E1 = 3.5, E2 = 9.9, E3 = 13.6;
// 花千笑: a long pull at the gourd ("我喝敬酒……"), the killing intent turns into a shield of cut rings round her, then she
// throws it off in one blast that shoves the leaves flat ("……你喝……罚酒！")
elite(film, hua, E1, { title: '剑痴', name: '花千笑', move: 'none', dur: 5.8 });
const gourd = new THREE.Group(); { const m1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), stock(H, '#b08a4a', { flat: true })); const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), stock(H, '#b08a4a', { flat: true })); m2.position.y = 0.6; const cord = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 4, 10), stock(H, '#b3231a')); cord.position.y = 0.33; cord.rotation.x = Math.PI / 2; gourd.add(m1, m2, cord); gourd.visible = false; H.scene.add(gourd); }
film.every((t) => { const u = t - E1 - 0.4; gourd.visible = u > 0 && u < 2.0; if (!gourd.visible) return; gourd.position.set(-3.6, 3.6 + Math.min(1, u / 0.3) * 0.6, 8.2); gourd.rotation.z = u < 0.4 ? -u * 2 : -0.8 - 0.2 * Math.sin(u * 6); });
hua.key(E1 + 0.5, { lean: 0 }).key(E1 + 0.8, { lean: 0.14 }).key(E1 + 2.3, { lean: 0.14 }).key(E1 + 2.5, { lean: 0 });
sawRing(film, { t: E1 + 2.5, at: [-5, 2.6, 8.2], r0: 1.2, r1: 2.6, teeth: 18, width: 0.35, color: '#e8d6a0', dur: 1.4, upright: true, seed: 21 });
sawRing(film, { t: E1 + 2.65, at: [-5, 2.6, 8.3], r0: 0.8, r1: 2.0, teeth: 14, width: 0.3, color: '#f4efe6', dur: 1.3, upright: true, seed: 22 });
hua.key(E1 + 4.0, { lean: -0.18 }).key(E1 + 4.25, { lean: 0.1, ease: 'out' }).key(E1 + 4.7, { lean: 0 });
starburst(film, { t: E1 + 4.2, at: [-5, 2.8, 8.4], r: 2.2, spikes: 14, colors: ['#3a1a14', '#e8d6a0', '#fffbe8'], dur: 0.5, seed: 23, sound: 'boom' });
rings(film, { t: E1 + 4.2, at: [-5, 0, 7.5], n: 3, r1: 8, color: '#e8d6a0', width: 0.3 }); film.at(E1 + 4.2, () => film.kick(0.8));
shards(film, { t: E1 + 4.25, at: [-5, 0.4, 8.5], n: 40, colors: ['#b3231a', '#d24a34', '#8e1a14'], speed: 9, up: 3, size: 0.28, gravity: 8, shape: 'leaf', seed: 24, life: 1.4 });
// 荆野: from horseback he slings a fan of blood-drops, spinning blades that cut the air toward us ("又一个刀下之鬼……")
elite(film, jing, E2, { title: '亡命徒', name: '荆野', move: 'none', dur: 3.2 });
jing.key(E2 + 0.9, { lean: 0 }).key(E2 + 1.1, { lean: -0.16 }).key(E2 + 1.35, { lean: 0.08, ease: 'out' }).key(E2 + 1.8, { lean: 0 });
for (let i = 0; i < 6; i++) { const a = (i - 2.5) * 0.28; crescentShot(film, { t: E2 + 1.2 + i * 0.07, from: [6, 3.2, -4], to: [6 + Math.sin(a) * 12, 1.2 + (i % 2) * 0.8, -4 + Math.cos(a) * 12], dur: 0.5, r: 0.7, colors: ['#2a1012', '#8e1a14', '#d8d0c0'], spin: 18, seed: 30 + i, sound: i ? null : 'whoosh' }); }
// 铁狂: a three-punch string; the last fist flares red and the ground bursts ("你赢不了！")
elite(film, tie, E3, { title: '拳痴', name: '铁狂', move: 'none', at: [-6, -19], dur: 2.8 });
[0.6, 0.9, 1.2].forEach((dt, i) => { tie.key(E3 + dt, { lean: -0.12 }).key(E3 + dt + 0.12, { lean: 0.06, ease: 'out' }); starburst(film, { t: E3 + dt + 0.08, at: [-4.2, 3.2, -18.4], r: 0.9, spikes: 10, colors: ['#2a1a10', '#ffb04a', '#fff0c8'], dur: 0.25, seed: 40 + i, sound: 'hit' }); });
glint(film, { t: E3 + 1.5, at: [-4.4, 3.6, -18.4], color: 'red', len: 7, hold: 0.25, seed: 44, sound: 'tellRed' });
tie.key(E3 + 1.95, { lean: -0.2 }).key(E3 + 2.15, { lean: 0.15, ease: 'in' }).key(E3 + 2.6, { lean: 0 });
popBurst(film, { t: E3 + 2.15, at: [-3.8, 0, -17.6], r: 2.8, colors: ['#8a5a3a', '#b3231a', '#f2ece4'], crumple: 9, seed: 45, sound: 'boom' }); film.at(E3 + 2.15, () => film.kick(1.0));
{ const V = film.voice; V(E1 + 0.45, 'vo/huaqianxiao_line_01.wav', { seg: 'squeeze' }); V(E2 + 0.05, 'vo/jingye_line_01.wav'); V(E3 + 0.05, 'vo/tiekuang_line_01.wav'); }
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 5, -8], dist: 66, pitch: 34, yaw: 4, focus: [0, 4, -8] },
  { t: 3.3, target: [1, 5, -13], dist: 58, pitch: 31, yaw: 1, ease: 'linear', focus: [0, 4, -13] },
  // 花千笑: a slow push through her drink, wide again for the blast
  { t: E1 + 0.1, target: [-4.6, 3.6, 7.5], dist: 24, pitch: 22, yaw: 12, focus: [-5, 3.4, 7.5], ease: 'cut' },
  { t: E1 + 4.0, target: [-4.6, 3.8, 7.5], dist: 17, pitch: 18, yaw: 10, ease: 'linear', focus: [-5, 3.6, 7.5] },
  { t: E1 + 4.4, target: [-4.6, 3.2, 7.8], dist: 27, pitch: 26, yaw: 14, ease: 'out', focus: [-5, 3, 7.5] },
  { t: E2 - 0.4, target: [-4.6, 3.2, 7.8], dist: 28, pitch: 27, yaw: 14, ease: 'linear', focus: [-5, 3, 7.5] },
  // 荆野 from low in front: the blades come at the lens
  { t: E2 - 0.3, target: [5.6, 3.8, -3.5], dist: 20, pitch: 10, yaw: 6, focus: [6, 3.6, -4.5], ease: 'cut' },
  { t: E3 - 0.35, target: [5.6, 3.6, -3.2], dist: 22, pitch: 12, yaw: 4, ease: 'linear', focus: [6, 3.2, -4] },
  // 铁狂: tight on the fists, out for the burst
  { t: E3 - 0.3, target: [-5, 3.8, -18.6], dist: 20, pitch: 20, yaw: 14, focus: [-5, 3.6, -18.6], ease: 'cut' },
  { t: E3 + 1.9, target: [-5, 3.8, -18.4], dist: 18, pitch: 19, yaw: 12, ease: 'linear', focus: [-5, 3.6, -18.6] },
  { t: E3 + 2.3, target: [-5, 3.2, -18], dist: 26, pitch: 26, yaw: 12, ease: 'out', focus: [-5, 3, -18.4] },
]);
film.shift(D);   // ---- from here on: the v3 boss fight, D later

// ---- the meadow: the tree rises, 魂 runs in, she glides down out of the tree's threads -------------------------------------------
film.rise('arena', ARENA_T, { from: [FIELD.x, -40], speed: 26 });
film.rise('field', ARENA_T - 0.1, { from: [-4, -22], speed: 40, open: 0 });
hero.key(12.4, { hidden: false, pose: 'run', x: -2, z: -26, face: 1, rise: 1 }).key(13.6, { x: -3, z: ZH, ease: 'linear' }).key(13.62, { pose: 'idle' });
S(12.45, 'steps', { dur: 1.2 });
bai.key(0, { hidden: true, y: 12 }).key(13.5, { hidden: false, y: 12 }).key(14.1, { y: 0, ease: 'out' });
curls(film, { t: 13.5, from: [8, 10, ZB], to: [8, 1, ZB], n: 8, colors: RIBBON, dur: 0.7, spread: 2, sound: 'gust' });
shards(film, { t: 14.1, at: [8, 0.6, ZB], n: 26, colors: ['#f2ece4', '#c9d6e4', '#b3231a'], speed: 5, up: 6, size: 0.24, shape: 'drop', seed: 12 });
rings(film, { t: 14.1, at: [8, 0, ZB], n: 2, r1: 5, color: '#f2ece4' });
film.plate({ t0: 14.4, dur: 2.4, title: '双蛇夫人', name: '白赤练', boss: true, seal: '首' });

// phase one: three blink-dashes (white afterimages left behind, a cut on each arrival, each guarded)
const blink = (t, from, to, face, cutA) => {
  afterimage(film, { t, img: IMG.bai1, at: from, height: 5.8, face: bai.st.face });
  scraps(film, { t, at: [from[0], 0, from[1]], out: true, n: 18, colors: [...WHITE, '#b3231a'], dur: 0.3, seed: Math.round(t * 9), sound: 'shadowOut' });
  bai.key(t, { hidden: true }).key(t + 0.18, { hidden: false, x: to[0], z: to[1], face, snap: true });
  slash(film, { t: t + 0.22, at: [to[0] - face * 2.2, 2.4, to[1] + 0.6], radius: 3.2, width: 0.75, a0: face > 0 ? 2.5 : 0.6, a1: face > 0 ? -0.7 : 3.8, normal: [0.1, 0.2, 1], color: '#f4efe6', core: '#b3231a', sound: 'slash' });
};
blink(15.0, [8, ZB], [2.6, -36.6], 1); B.guard(15.27, [-3, ZH], { back: 0.5, hold: 0.3 });
blink(15.75, [2.6, -36.6], [-9.5, -36.4], -1); B.guard(16.02, [-3.5, ZH], { face: -1, back: -0.5, hold: 0.3 });
blink(16.5, [-9.5, -36.4], [2.2, -36.6], 1); B.guard(16.77, [-3.0, ZH], { face: 1, back: 0.5, hold: 0.35 });
// the ribbon crescent: a wide white sweep that throws red ribbons (curls) at him; guarded heavy
bai.key(17.25, { lean: 0 }).key(17.4, { lean: -0.2 }).key(17.6, { lean: 0.08 }).key(17.9, { lean: 0 });
slash(film, { t: 17.45, at: [2.2, 2.0, ZB], radius: 6, width: 1.0, a0: 0.3, a1: 3.4, normal: [0, 1, 0.15], color: '#f4efe6', core: '#b3231a', sound: 'whoosh' });
curls(film, { t: 17.5, from: [1, 2.5, ZB], to: [-6, 1.5, ZH], n: 7, colors: RIBBON, dur: 0.55, spread: 1.2, sound: null });
B.guard(17.65, [-3.5, ZH], { back: 0.9, heavy: true, hold: 0.45 });
// the leaping slash: the blue glint at the top of the leap; deflected; the counter
bai.key(18.3, { x: 2.2, hop: 3.0 }).key(18.9, { x: 0.6, ease: 'linear' });
B.tell(18.5, [1.2, 6.2, -36.4], 'blue');
B.deflect(18.88, [-4.6, ZH], [0.6, ZB]);
B.counter(19.45, [-4.6, ZH], [0.6, ZB]);
// the power lunge: the red flash; 魂 shadow-steps behind her; she runs through nothing; he cuts her from behind
bai.key(20.2, { x: 0.6 }).key(20.5, { x: 4.5, ease: 'out' });
hero.key(20.2, { x: -2.4 }).key(20.5, { x: -3.6 });
B.tell(20.75, [3.8, 4.6, -36.4], 'red');
B.shadowstep(20.9, [-3.6, ZH], [7.8, -36.4], { face: -1 });
bai.key(20.95, { x: 4.5 }).key(21.25, { x: -2.5, ease: 'out' });
afterimage(film, { t: 20.95, img: IMG.bai1, at: [4.5, ZB], height: 5.8 }); afterimage(film, { t: 21.05, img: IMG.bai1, at: [1.5, ZB], height: 5.8 });
slash(film, { t: 21.15, at: [-5.5, 2.4, -36.0], radius: 3.6, width: 0.9, a0: 2.4, a1: -0.6, normal: [0, 0.2, 1], color: '#f4efe6', core: '#b3231a', sound: 'heavy' });
B.counter(21.55, [3.2, -36.4], [-2.5, ZB], { face: -1, reach: 2.6 });
hero.key(21.5, { x: 3.2 });
// twin serpents burst from the ground (one white, one crimson) and lunge; 魂 dodges the first, guards the second
bai.key(22.4, { face: 1, x: -2.5 }).key(22.8, { x: 8, ease: 'out' });
hero.key(22.4, { pose: 'dodge', x: 0.6, face: 1 }).key(22.8, { x: -3, z: ZH, ease: 'out' }).key(22.9, { pose: 'idle' });
popBurst(film, { t: 23.0, at: [6, 0, -39], r: 2.2, colors: ['#8a5a3a', '#a8806a', '#f2ece4'], crumple: 8, seed: 41, sound: 'boom' });
paperSerpent(film, { t: 23.0, dur: 1.5, n: 26, size: 0.75, body: 0.5, colors: WHITE, path: (u) => [lerp(6, -2.6, u), Math.sin(u * Math.PI) * 4.5 + 0.3, lerp(-39, ZH, u)], lead: (lt) => Math.min(1, lt / 0.7) });
hero.key(23.55, { pose: 'dodge', x: -3, z: ZH }).key(23.8, { x: -5.5, z: -34, ease: 'out' }).key(23.9, { pose: 'idle' });
popBurst(film, { t: 23.7, at: [-2.6, 0, ZH], r: 2.0, colors: ['#8a5a3a', '#f2ece4'], crumple: 6, seed: 42, sound: 'thud' });
popBurst(film, { t: 24.0, at: [10, 0, -39], r: 2.2, colors: ['#8a5a3a', '#a8806a', '#b3231a'], crumple: 8, seed: 43, sound: 'boom' });
paperSerpent(film, { t: 24.0, dur: 1.5, n: 26, size: 0.75, body: 0.5, colors: ['#b3231a', '#7a1a14'], headColor: '#8e1a14', eye: '#f2d27a', path: (u) => [lerp(10, -4.2, u), Math.sin(u * Math.PI) * 3.8 + 0.3, lerp(-39, -34.6, u)], lead: (lt) => Math.min(1, lt / 0.7) });
hero.key(24.2, { z: -34 }).key(24.4, { z: -35 });
B.guard(24.7, [-5.5, -35], { back: 0.8, heavy: true, hold: 0.45 });
B.leapCut(25.4, [-5.5, -35], [4.4, -36.2], [8, ZB]);

{ const V = film.voice;   // phase one's lines, said whole (the phase change waits D2 for the second)
  V(14.25, 'vo/baichilian_p2_line_01.wav');                                   // P1: 圣母娘娘，带我走吧！
  V(18.35, 'vo/baichilian_attack_01.wav'); V(21.6, 'vo/baichilian_p2_line_02.wav'); }   // 那琵琶，是献给圣母娘娘的！
{ const duel = (t, o = {}) => ({ t, target: [2.5, 2.8, -36.2], dist: 32, pitch: 27, yaw: 0, focus: [2.5, 2.8, -36.4], ...o });
  film.camera([
  { t: 12.9, target: [2, 5, -33], dist: 44, pitch: 26, yaw: 0, focus: [3, 4, -38] },
  { t: 13.45, target: [2.5, 4.5, -34], dist: 40, pitch: 26, yaw: 0, ease: 'linear', focus: [3, 4, -38] },
  // v4: she glides down out of the tree, seen from the meadow floor
  { t: 13.5, target: [7.4, 4.2, -37], dist: 19, pitch: 6, yaw: -18, focus: [8, 4, -37], ease: 'cut' },
  { t: 14.45, target: [7.6, 3.8, -37], dist: 17, pitch: 7, yaw: -14, ease: 'linear', focus: [8, 3.6, -37] },
  duel(14.5, { dist: 34, ease: 'cut' }),
  duel(15.0, { dist: 33, target: [-1, 2.8, -36.2] }),
  duel(16.9, { dist: 32, ease: 'linear', target: [-1.5, 2.8, -36.2] }),
  duel(18.6, { dist: 26, target: [-1.8, 3.2, -36.2], focus: [-1.8, 3, -36.4] }),
  duel(20.3, { dist: 27, target: [0.6, 3.2, -36.2], ease: 'linear' }),
  // v4: the red tell close on her
  { t: 20.6, target: [3.6, 4.4, -36.6], dist: 18, pitch: 14, yaw: 10, focus: [3.8, 4.4, -36.8], ease: 'cut' },
  { t: 20.95, target: [3.6, 4.4, -36.6], dist: 17, pitch: 14, yaw: 9, ease: 'linear', focus: [3.8, 4.4, -36.8] },
  duel(21.3, { dist: 26, target: [1.4, 3.2, -36.2], ease: 'cut' }),
  duel(22.8, { dist: 34, target: [1.5, 3.5, -37] }),
  duel(25.2, { dist: 32, ease: 'linear', target: [1.5, 3.2, -37] }),
  // the stand-off while she speaks (D2), the camera creeping in on her
  { t: 25.9, target: [6, 3.8, -36.8], dist: 26, pitch: 24, yaw: -6, focus: [8, 3.6, ZB] },
  ]); }
film.shift(D + D2);   // ---- phase two, D2 later still

// the change: she is bound by the tree's threads; the sky goes red, a rain of red thread falls round the meadow
const P2T = B.phase(26.8, [8, ZB], 'p2', { heroFrom: [4.4, -36.2], heroTo: [-3, ZH], kind: 'spike', crownColors: ['#ece6d6', '#b3231a', '#6a5878'], color: ['#b3231a', '#a3161a', '#ece6d6'], flash: '#a3161a', dur: 1.4 });
for (let i = 0; i < 4; i++) threadBand(film, { a: { h: tree, at: [(i % 2 ? 1 : -1) * (2 + i), 13 + i * 0.5] }, b: [8 + (i % 2 ? 0.7 : -0.7), 4.4, ZB - 0.3], n: 60, wA: 0.8, wB: 0.6, depth: 0.2, t0: 26.9 + i * 0.12, t1: 37.5, seed: 50 + i });
film.tint(P2T, { color: '#b3231a', dur: 40, peak: 0.1 });
for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, x = FIELD.x + Math.cos(a) * 12, z = FIELD.z + Math.sin(a) * 6.5; if (z > -34) continue; threadBand(film, { a: [x + (rnd() - 0.5) * 2, 30, z - 2], b: [x, 0.05, z], n: 60, wA: 1.6, wB: 2.2, depth: 0.5, t0: P2T + 0.1 + i * 0.08, seed: 60 + i }); }
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '白赤练 · 第二形态', name: '献祭之蛇', boss: true, seal: '蛇', barColor: '#8e1a14' });

// phase two (her coiled card is wide: she holds the back of the meadow at x 7-8, 魂 works round her edges)
const BX = 5.5, W0 = P2T + 2.1;
bai.key(W0, { x: 8 }).key(W0 + 0.8, { x: BX - 1.5, ease: 'out' }).key(W0 + 1.4, { x: BX, ease: 'out' });
paperSerpent(film, { t: W0, dur: 1.1, n: 30, size: 0.6, body: 0.85, colors: WHITE, sound: 'serpent', path: (u) => { const x = lerp(10, -0.5, u); return [x, 0.5 + Math.abs(Math.sin(u * 9)) * 1.2, ZB + 1.2 + Math.sin(u * 12) * 1.0]; }, lead: (lt) => Math.min(1, lt / 0.8) });
B.guard(W0 + 0.6, [-4, ZH], { back: 0.6, hold: 0.32 }); B.guard(W0 + 0.95, [-4.6, ZH], { back: 0.6, heavy: true, hold: 0.4 });
// the great serpent: the ground breaks behind 魂, a huge accordion serpent rears and strikes; the red flash on its head
const GS = W0 + 1.6, HX = -5.2;
popBurst(film, { t: GS, at: [-11, 0, -40], r: 3.4, colors: ['#8a5a3a', '#a8806a', '#f2ece4', '#b3231a'], crumple: 12, seed: 71, sound: 'boom' });
film.at(GS, () => film.kick(1.2));
paperSerpent(film, { t: GS, dur: 2.0, n: 40, size: 1.5, body: 0.55, colors: ['#f4efe6', '#d8ccb8', '#b3231a'], headColor: '#f4efe6', sound: 'serpent',
  path: (u) => u < 0.6 ? [lerp(-11, -8.5, u / 0.6), Math.sin(u / 0.6 * Math.PI * 0.5) * 10, lerp(-40, -39, u / 0.6)] : [lerp(-8.5, HX, (u - 0.6) / 0.4), lerp(10, 0.6, (u - 0.6) / 0.4), lerp(-39, ZH, (u - 0.6) / 0.4)],
  lead: (lt) => (lt < 0.55 ? lt / 0.55 * 0.6 : lt < 0.9 ? 0.6 : 0.6 + Math.min(0.4, (lt - 0.9) / 0.25 * 0.4)) });
hero.key(GS + 0.2, { x: HX, z: ZH });
B.tell(GS + 0.75, [-8.5, 10.5, -39], 'red');
B.shadowstep(GS + 0.85, [HX, ZH], [12.4, -36.4], { face: -1 });
popBurst(film, { t: GS + 1.15, at: [HX, 0, ZH], r: 3.0, colors: ['#8a5a3a', '#f2ece4', '#b3231a'], crumple: 10, seed: 72, sound: 'boom' }); film.at(GS + 1.15, () => film.kick(1.3));
B.counter(GS + 1.45, [12.4, -36.4], [BX, ZB], { face: -1, reach: 1.6 });
// the serpent ring: she spins, a serpent circles the meadow round her; 魂 vaults it and comes down on her
const SR = GS + 2.4;
bai.key(SR, { jit: 0.05 }).key(SR + 1.0, { jit: 0.05 }).key(SR + 1.05, { jit: 0 });
paperSerpent(film, { t: SR, dur: 1.4, n: 46, size: 0.8, body: 0.75, colors: ['#b3231a', '#f4efe6'], headColor: '#8e1a14', eye: '#f2d27a', sound: 'serpent', path: (u) => { const a = u * Math.PI * 2.2 + 1.2; return [BX + Math.cos(a) * 7.6, 0.7 + Math.sin(u * 20) * 0.3, ZB + Math.sin(a) * 3.4]; }, lead: (lt) => Math.min(1, lt / 1.1) });
B.leapCut(SR + 0.55, [10.8, -36.4], [12.2, -36.3], [BX, ZB]);
hero.key(SR + 0.55, { face: -1 });
// the last lunge at him: the blue glint, the deflect, the finisher
bai.key(SR + 1.6, { face: -1 });
B.tell(SR + 1.9, [BX + 2.6, 4.6, -36.4], 'blue');
bai.key(SR + 2.0, { x: BX }).key(SR + 2.2, { x: BX + 1.4, ease: 'out' });
B.deflect(SR + 2.2, [12.4, -36.4], [BX + 1.4, ZB], { face: -1, stagger: 0.55 });
const FIN = SR + 2.9;
B.finisher(FIN, [12.2, -36.4], [BX + 1.0, ZB], { face: -1 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
{ const V = film.voice;
  V(26.85, 'vo/baichilian_charge_01.wav');                                  // the change
  V(P2T + 0.4, 'vo/baichilian_p1_line_02.wav', { seg: 'squeeze' });          // P2: 一年前那一战，你们早就输了！
  V(SR + 1.2, 'vo/baichilian_hurt_01.wav'); V(FIN + 0.7, 'vo/baichilian_p1_line_01.wav', { seg: 'squeeze' }); }   // dying: 嘿嘿……杀了我，输的还是你……

const OUT = FIN + 9.8;   // v5: her last words are said whole
const camOutro = outro(film, hero, { t0: OUT, from: [11, -36], dur: 1.4, color: C.ground, nextColor: GROUNDS['03-village'] });
for (const a of [hua, jing, tie]) a.key(OUT, { rise: 0 });

// ---- camera --------------------------------------------------------------------------------------------------------------------
const duel = (t, o = {}) => ({ t, target: [2.5, 2.8, -36.2], dist: 32, pitch: 27, yaw: 0, focus: [2.5, 2.8, -36.4], ...o });
film.camera([
  { t: P2T - 0.6, target: [6.5, 4, -36.8], dist: 24, pitch: 27, yaw: -8, focus: [8, 3.8, ZB] },
  { t: P2T + 1.4, target: [7, 4.5, -36.8], dist: 25, pitch: 25, yaw: -10, ease: 'linear', focus: [8, 4, ZB] },
  duel(W0, { dist: 34, target: [1.5, 3, -36.2] }),
  duel(GS, { dist: 40, pitch: 25, target: [0, 4.5, -37.5] }),
  duel(GS + 1.4, { dist: 38, pitch: 25, ease: 'linear', target: [3, 4, -37] }),
  duel(SR, { dist: 34, pitch: 30, target: [6.5, 3, -36.6] }),
  duel(FIN - 0.4, { dist: 27, target: [9, 3, -36.2] }),
  // v4: the kill over 魂's shoulder (he stands to her right), then wide for the stamp
  { t: FIN - 0.05, target: [9.8, 3.0, -36.6], dist: 18, pitch: 13, yaw: 42, focus: [6.5, 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [9.8, 2.8, -36.6], dist: 16.5, pitch: 13, yaw: 38, ease: 'linear', focus: [6.5, 2.6, -37] },
  duel(FIN + 1.25, { dist: 27, pitch: 30, target: [9, 2.8, -36.2], ease: 'cut' }),
  duel(FIN + 2.6, { dist: 29, pitch: 31, ease: 'linear', target: [9.5, 2.8, -36.2] }),
  ...camOutro,
]);
film.start();
