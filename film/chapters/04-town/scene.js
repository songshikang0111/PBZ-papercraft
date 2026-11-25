// 第四章 · 庞镇 (Pangzhen), v4. A dark hillside town at night (as on the game's map): black tile, dark timber and grey
// brick halls stepping up the slopes on stone terraces on both sides of a canal and a paved street, a paifang over the
// street, a tall hall on the hill, red lanterns and warm windows. (v4: 魂 is not seen until the climb to the lion hall.) The film walks up the
// street between rows of horse-head-gabled houses (a low tracking shot): the ghost-catcher captain (火流星); the old
// square with its well and great tree under a sky of paper money, where 骨婉约 the Wailing Wraith rises and wails her
// line (no fight); the thunder spear (长鸿); then up flight after flight of stone steps to the Lion Dance Hall on its raised yard of wooden poles.
// The Grandmaster fights first in the burning lion (the opening string, fireballs, the fire stream, fire columns, the
// leaping slam, the rolling head), then, the costume burnt away, as the Final Dance: up on the poles, hopping from top
// to top, diving down, breathing fire from above, until 魂 follows him up and cuts him down. ~52 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.4: night water town, white plaster and black tile, canal and arch bridges, red lanterns, paper money; the
//          lion hall's red-earth yard of tall burning poles under strings of lanterns.
// PALETTE  ground #9c8578; walls #e6e0d4 / tiles #2e2c30 / timber #2a1e18; canal #5e6e78 / #44525c; lanterns #c0281c /
//          #ffc66a; paper money #efe8d6; yard #8a4a32; fire #e8602a / #f2b84a / #a8231a; shadow #1a1020; haze #6a4050
// LIGHT    night: dusk key, warm windows and lantern pools
// LIFE     paper money and embers drifting; flame cards on the poles
import { setupChapter, threads, threadBand, threadWrap, beats, elite, intro, outro, GROUNDS, createActor, makeHero, slash, shards, rings, crown, drift, P2, THREE, clamp, lerp } from '../../common/kit.js';
import { MOODS } from 'papercraft/templates/popup-3d/harness.js';
import { makeTerrain } from '../../common/terrain.js';
import { jiangnanHouse, paifang, tower } from '../../common/build.js';
import { imagePiece } from '../../common/film.js';
import { makeCard } from 'papercraft/lib/paperkit-3d.js';
import { flameColumn, flameLine, flameCard, paperBall, popBurst, sawRing, sparks, scraps, afterimage, curls, starburst, stock, paperChain, zigzag } from '../../common/fx.js';

const S0 = '/work/film/stickers/04-town/', BOSS = '/work/boss-chibi/透明PNG/04 庞镇/';
const C = { ground: GROUNDS['04-town'], washA: '#6e625c', washB: '#7e706a', washC: '#5e5450', street: '#8e8680', canal: '#5e6e78', canalDeep: '#44525c', yard: '#8a4a32', fire: '#e8602a', money: '#efe8d6' };
const TOWN = { key: '#ffb890', ki: 2.4, dir: [-0.8, 0.6, 0.45], fill: '#7a68a8', fi: 1.25, sky: '#a898c8', skyG: '#4a3a58', si: 0.9, leak: '#4a2a50', glow: 1.3, lamp: 6,
  post: { exposure: 1.12, tint: [1.03, 0.97, 0.98], saturation: 1.0, haze: '#6a4050', hazeStart: 40, hazeEnd: 120, hazeAmount: 0.35, vignette: 0.14, vignetteColor: '#1a1020', shadowTint: '#2a1830' } };
const K = await setupChapter({
  id: '04-town', ground: C.ground, whiteStamp: true, duration: 46.5, moods: { ...MOODS, town: TOWN }, mood: 'town',
  bounds: { x0: -46, x1: 46, z0: -54, z1: 34 },
  light: { leak: '#4a2a50' }, lens: { vignette: 0.14 },
  pieces: { stone: '#7e7470', stoneDark: '#4e4644', cap: null, bush: ['#4e5a42', '#5a4a3a'], bushDots: '#c0281c', tuft: ['#6a6448', '#5a5240'] },
  shadowInk: '#1a1020',
  stickers: {
    hall: S0 + 'lionhall.png', lanterns: S0 + 'lanterns.png', shop: S0 + 'shop.png', drum: S0 + 'drum.png', boat: S0 + 'dockboat.png', mask: S0 + 'lionmask.png', gu: S0 + 'guwanyue.png',
    bigtree: '/work/film/stickers/02-forest/bigtree.png',
    huo: BOSS + '01 鬼差队长·火流星.png', chang: BOSS + '03 雷枪·长鸿.png', lion1: BOSS + '04 舞狮尊主·烈焰.png', lion2: BOSS + '05 舞狮尊主·最后一舞.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, house, put } = K;
const T = makeTerrain(K);

// ---- the plan: street (x ~ -2) and canal (x ~ 7.5) up the page to the steps at z -17; the yard on top from z -27 -----------
const CANAL = P2.pathLine([[7.5, 36], [7, 20], [8, 6], [7.5, -8], [8, -18]]);
const STREET = P2.pathLine([[-2, 36], [-1.5, 20], [-2.5, 8], [-2, -16]]);
const SQUARE = { x: -4.5, z: -3.5, rx: 7.5, rz: 5.5 };
const inSquare = (x, z, k = 1) => ((x - SQUARE.x) / (SQUARE.rx * k)) ** 2 + ((z - SQUARE.z) / (SQUARE.rz * k)) ** 2 < 1;
const dist = (L, x, z) => { let d = 1e9; for (const [px, pz] of L.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const ELITES = [[-3, 15, -8], [-2, -3, 0], [2, -14, 8]];
const inSight = (x, z) => ELITES.some(([ex, ez, yaw]) => { const d = z - ez; if (d < -2.5 || d > 18) return false; return Math.abs(x - ex - d * Math.tan(yaw * Math.PI / 180)) < 4.5 + d * 0.35; });
const YARD = { x: 1, z0: -26.5, w: 36, d: 19, h: 4.4 }, DY = YARD.h + 0.08;

H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, drifts, water }) => {
  washes([C.washA, C.washB, C.washB, C.washC]);
  torn(bandOf(STREET.pts, 2.6), C.street);
  g.strokeStyle = P2.rgba('#5a4a44', 0.35); g.lineWidth = 0.06 * ppu;
  for (let z = 34; z > -17; z -= 1.3) for (let x = -4.4; x < 0.4; x += 1.6) g.strokeRect(X(x + (z % 2.6 > 1.3 ? 0.8 : 0)), Z(z), 1.5 * ppu, 1.2 * ppu);
  const sq = Array.from({ length: 40 }, (_, i) => { const a = i / 40 * 6.283; return [SQUARE.x + Math.cos(a) * SQUARE.rx, SQUARE.z + Math.sin(a) * SQUARE.rz]; });
  torn(sq, P2.rgba('#a89c94', 0.9));
  // paper money strewn over the square and the street
  for (let k = 0; k < 500; k++) { const x = SQUARE.x + (r() - 0.5) * 18, z = SQUARE.z + (r() - 0.5) * 16; g.fillStyle = P2.rgba(C.money, 0.85); g.beginPath(); g.arc(X(x), Z(z), 0.16 * ppu, 0, 7); g.fill(); g.fillStyle = P2.rgba('#7a6058', 0.8); g.fillRect(X(x) - 0.045 * ppu, Z(z) - 0.045 * ppu, 0.09 * ppu, 0.09 * ppu); }
  water(bandOf(CANAL.pts, 1.7), { colors: [C.canal, C.canalDeep], rim: '#a8a090', inset: 0.35, marks: 'ripples', markColor: P2.rgba('#ffc66a', 0.5), flow: 0.1 });
  drifts((x, y) => { g.fillStyle = P2.rgba(r() < 0.5 ? '#6a5a50' : '#b8a090', 0.5); g.beginPath(); g.ellipse(x, y, (0.1 + r() * 0.2) * ppu, (0.08 + r() * 0.1) * ppu, r() * 3, 0, 7); g.fill(); }, { n: 9000 });
});

// ---- the town (v4): dark halls on stone terraces, stepping up the slopes away from the street and the canal. The game's
// Pangzhen is black tile, dark timber and smoke-grey brick (few white walls, and those aged); the rows climb outward, so
// the back rows stand on taller podiums. Seven kinds, mixed per row: grey-brick horse-head houses, two-storey timber halls
// with balconies, open-fronted shops with banners, stilt houses on the slope, wide halls, plus the paifang and the tower.
const DARK = {
  brick: [{ wall: '#787068', plinth: '#4e4a46', tile: '#3a383e', tileDark: '#242328', timber: '#3a2a22', window: '#3a2c24', lit: '#f6bc68', door: '#2a1e18', podium: '#5e5a56' },
          { wall: '#6a645e', plinth: '#46423e', tile: '#36343a', tileDark: '#212024', timber: '#36281e', window: '#3a2c24', lit: '#f0b060', door: '#2a1e18', podium: '#5a5652' },
          { wall: '#a49c92', plinth: '#4e4a46', tile: '#3a383e', tileDark: '#242328', timber: '#3a2a22', window: '#3a2c24', lit: '#f6bc68', door: '#2a1e18', podium: '#625e5a' }],   // the last: an old, soot-stained white
  timber: [{ wall: '#5a4232', timber: '#2e2018', tile: '#36343a', tileDark: '#212024', window: '#2e2218', lit: '#f6bc68', door: '#24180f', plinth: '#4a4642', podium: '#5e5a56' },
           { wall: '#664c3a', timber: '#33241a', tile: '#3a383e', tileDark: '#242328', window: '#2e2218', lit: '#f0b060', door: '#24180f', plinth: '#4a4642', podium: '#5a5652' }],
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const blocks = (x, z, top) => ELITES.some(([ex, ez, yaw]) => { const d2 = z - ez; if (d2 < -3.5 || d2 > 24) return false; if (Math.abs(x - ex - d2 * Math.tan(yaw * Math.PI / 180)) > 4.2 + d2 * 0.32) return false; return d2 < 14 || top > 2.5 + d2 * 0.6; });
const HOUSES = [];
let sd = 70;
// rows: x, facing side, podium (terrace height) range, eave heights, depth, and which kinds they mix
const ROWS = [
  { x: -5.9, side: 1, pod: [0, 0.4], hs: [3.2, 5.0], d: [3.8, 4.4], kinds: ['shop', 'shop', 'timber', 'brick'] },     // A: the street's west front
  { x: 2.6, side: -1, pod: [0, 0], hs: [3.0, 4.4], d: [3.4, 3.9], kinds: ['shop', 'timber', 'brick'] },               // B: between street and canal
  { x: 12.4, side: -1, pod: [0.6, 1.2], hs: [3.4, 5.4], d: [3.8, 4.4], kinds: ['timber', 'brick', 'brick'] },          // C: over the canal
  { x: -11.6, side: 1, pod: [1.6, 2.4], hs: [4.4, 6.4], d: [4.2, 4.8], kinds: ['timber', 'brick', 'hall', 'stilt'] },   // D: the slope, west
  { x: 18.0, side: -1, pod: [1.8, 2.8], hs: [4.4, 6.6], d: [4.2, 4.8], kinds: ['timber', 'brick', 'stilt'] },           // E: the slope, east
  { x: -17.4, side: 1, pod: [3.4, 4.4], hs: [4.6, 6.8], d: [4.4, 5.0], kinds: ['timber', 'brick', 'hall'] },            // F: high on the west hill
  { x: 23.6, side: -1, pod: [3.6, 4.8], hs: [4.6, 6.8], d: [4.4, 5.0], kinds: ['timber', 'brick', 'stilt'] },           // G: high on the east hill
];
for (const R of ROWS) for (let z = 33 - rnd() * 2; z > -20;) {
  const kind = pick(R.kinds), w = kind === 'hall' ? between(7.5, 9) : between(4.0, 6.0), d = between(...R.d), pod = between(...R.pod);
  const h = kind === 'shop' ? between(3.0, 3.8) : between(...R.hs), two = kind === 'timber' || h > 4.6, zz = z - w / 2;
  const xx = R.x + (rnd() - 0.5) * 0.6, roofH = kind === 'hall' ? between(2.2, 2.6) : between(1.3, 1.9), top = pod + h + roofH + 0.9;
  z -= w + between(0.1, 0.35);
  if (inSquare(xx, zz, 1.15) || blocks(xx, zz, top) || dist(STREET, xx, zz) < d / 2 + 1.3 || dist(CANAL, xx, zz) < d / 2 + 1.3) continue;
  const o = { w, d, h, roofH, seed: sd += 3, lit: 0.7, podium: pod, lantern: rnd() < 0.3 };
  if (kind === 'brick') Object.assign(o, { stories: two ? 2 : 1, steps: rnd() < 0.6 ? 3 : 2, col: pick(DARK.brick) });
  if (kind === 'timber') Object.assign(o, { stories: 2, horse: false, col: pick(DARK.timber), balcony: rnd() < 0.7 });
  if (kind === 'shop') Object.assign(o, { stories: 1, horse: rnd() < 0.35, steps: 2, col: pick([...DARK.timber, DARK.brick[0]]), wideDoor: true, banner: pick(['#8e1a14', '#c8b890', '#2a2a3a', '#a3261c']) });
  if (kind === 'stilt') Object.assign(o, { stories: 1, horse: false, stilts: between(1.2, 1.8), col: pick(DARK.timber), podium: Math.max(0, pod - 1.4) });
  if (kind === 'hall') Object.assign(o, { stories: 1, horse: false, col: { ...pick(DARK.timber), door: '#7a1a14', lantern: '#c0281c' }, lantern: true });
  const node = jiangnanHouse(H, o);
  const hh = put(H.popup(null, null, { node, x: xx, z: zz, yaw: R.side * Math.PI / 2 + (rnd() - 0.5) * 0.06, height: top, level: true }));
  mark(xx, zz, Math.max(w, d) * 0.5);
  HOUSES.push(hh);
}
// the paifang over the street, and the tall hall on the hill above the town (its silhouette over the roofs)
for (const [z, w] of [[10.5, 7.2]]) { const node = paifang(H, { w, h: 5.4, seed: Math.round(z) }); put(H.popup(null, null, { node, x: -2, z, height: 6.8, level: true })); }
{ const node = tower(H, { floors: 4, w: 6.5, fh: 3.2, shrink: 0.82, lean: 0, seed: 7, col: { base: '#4a4642', wall: '#3a2a20', post: '#7a1a14', timber: '#1e1410', tile: '#2a282c', tileDark: '#18171a', window: '#f0b060' } });
  put(H.popup(null, null, { node, x: -21, z: -22, height: 18, level: true })); }
for (const [x, z] of [[-14, 18], [16, 10], [-14, -6], [20, -10]]) H.lamp(x, 6, z, 0.8, 10);
for (const [x, z] of [[-6, 22], [-6, 6], [12, 12], [12, -6]]) H.lamp(x, 3.2, z, 0.9, 9);
for (const z of [24, 9, -10]) T.bridge({ x: 7.6, z, w: 6.2, d: 2.6, h: 1.9, stone: '#9a9088', seed: Math.round(z + 50) });
sticker('boat', 3.2, { x: 7.6, z: 15, res: 1.1 });
for (const [x, z, f] of [[-6.5, 18, false], [12.5, 2, true], [-7, -14, false]]) if (!inSight(x, z) && clear(x, z, -1.5)) sticker('shop', 7.5, { x, z, res: 1.1, flip: f });
const lrows = [sticker('lanterns', 5, { x: -0.5, z: 27, res: 1.1 })];
// the square: the well (folded stone ring and a timber frame, red thread wound on it) and the great tree
const wellNode = new THREE.Group();
{ const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 1.1, 14, 1, true), stock(H, '#8a827c', { flat: true })); ring.position.y = 0.55; ring.castShadow = true; wellNode.add(ring);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.14, 4, 14), stock(H, '#a8a098', { flat: true })); lip.rotation.x = Math.PI / 2; lip.position.y = 1.1; wellNode.add(lip);
  const inside = new THREE.Mesh(new THREE.CircleGeometry(1.15, 14), stock(H, '#1a1416')); inside.rotation.x = -Math.PI / 2; inside.position.y = 0.6; wellNode.add(inside);
  for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 0.22), stock(H, '#3a2a20')); post.position.set(sx * 1.45, 1.5, 0); post.castShadow = true; wellNode.add(post); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.22, 0.22), stock(H, '#3a2a20')); bar.position.y = 2.9; wellNode.add(bar);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 10), stock(H, '#a3161a')); roll.rotation.z = Math.PI / 2; roll.position.y = 2.5; wellNode.add(roll); }
put(H.popup(null, null, { node: wellNode, x: -9.5, z: -6.5, height: 3, level: true }));
const tree = sticker('bigtree', 13, { x: -11, z: -9.5, res: 1.3 });
threadWrap(film, { h: tree, at: [0, 0], r: 1.0, y0: 2, y1: 4.5, turns: 10 });
mark(-9.5, -6.5, 2); mark(-2, -3, 2.4); mark(-3, 15, 2.4); mark(2, -14, 2.4);

// ---- the steps and the raised yard of the Lion Dance Hall ----------------------------------------------------------------------
const stepFace = (c) => (P) => { P.fill(c); P.felt(0.5); P.marks('brick', { color: P2.shade(c, -0.35), alpha: 0.5, size: 0.1 }); P.innerShade('#1a1020', { alpha: 0.35, blurPx: 6 }); };
const STEPS = [[-17.5, 1.1], [-20.5, 2.2], [-23.5, 3.3]];
for (const [z, h] of STEPS) T.island({ x: -1, z, w: 9, d: 3.2, h, rect: true, facePaint: stepFace('#8a8078'), deck: '#9a9088', seed: Math.round(-z) });
const yard = T.island({ x: YARD.x, z: YARD.z0, w: YARD.w, d: YARD.d, h: YARD.h, rect: true, group: 'arena', facePaint: stepFace('#7a6e68'),
  deckPaint: (P) => { P.fill(C.yard); P.felt(0.6); P.marks('dab', { color: '#6a3424', alpha: 0.45, size: 0.04 }); P.marks('dot', { color: '#c0603a', alpha: 0.4, size: 0.02, density: 0.6 }); }, seed: 41 });
const onYard = (name, h, x, z, o = {}) => sticker(name, h, { parent: yard.deck, x: x - YARD.x, z: z - YARD.z0, group: 'arena', mark: false, ...o });
onYard('hall', 13, 1, -44.5, { res: 1.5 });
onYard('lanterns', 5, -12, -42.5, { res: 1.1 }); onYard('lanterns', 5, 14, -42.5, { res: 1.1, flip: true });
onYard('drum', 3.6, 15.5, -33, { res: 1.1 });
// the poles: 3D wooden posts of three heights standing on the yard, some burning on top
const POLES = [[-11, -40, 3.2], [-7, -41.5, 4.6], [-3, -40, 3.6], [1, -42, 5.2], [5, -40.5, 4.0], [9, -41.5, 4.8], [13, -40, 3.4], [-9, -44, 5.6], [11, -44, 5.8]];
const poleTop = (i) => [POLES[i][0], DY + POLES[i][2], POLES[i][1]];
const poleGroup = new THREE.Group(); yard.deck.add(poleGroup);
const flames = [];
POLES.forEach(([x, z, h], i) => {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, h, 9), stock(H, i % 2 ? '#5a3a26' : '#6a4630', { flat: true })); p.position.set(x - YARD.x, h / 2, z - YARD.z0); p.castShadow = true; poleGroup.add(p);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.28, 9), stock(H, '#a3161a')); band.position.set(x - YARD.x, h * 0.62, z - YARD.z0); poleGroup.add(band);
  if (i % 3 !== 1) { const f = flameCard(H, 1.6, { seed: i }); f.position.set(x - YARD.x, h, z - YARD.z0); poleGroup.add(f); flames.push(f); }
});
const ARENA_T = 15.2, D = 1.5;   // v4: the boss fight keeps its v3 times, shifted D later (film.shift)
film.every((t) => { const u = clamp((t - ARENA_T - D - 0.5) / 0.8); poleGroup.scale.set(1, Math.max(0.001, u), 1); poleGroup.visible = u > 0; const tq = Math.floor(t * 12) / 12; flames.forEach((f, i) => { f.rotation.y = Math.atan2(H.camera.position.x - f.position.x, H.camera.position.z) * 0; f.scale.set(1, 0.85 + 0.2 * Math.sin(tq * 9 + i * 2), 1); }); });
threads(film, [[-14, -36], [16, -36]].map(([x, z], i) => ({ a: [x, DY + 7, z - 4], b: [-x * 0.1, DY + 8, -44] })), { sag: 0.15 });
fill(160, [-15, 15, -17, 33], [rock, bush, tuft], (x, z) => !inSquare(x, z, 1.1) && dist(STREET, x, z) > 3 && dist(CANAL, x, z) > 2.4 && !inSight(x, z), { per: [1, 3], size: [0.4, 0.7] });
T.range({ z: -50, x: -6, w: 150, h: 22, color: '#2e3632', cap: '#46524c', seed: 43, peaks: 9 });   // v4: the dark wooded hills round the town
T.range({ z: -58, x: 8, w: 170, h: 30, color: '#3c4440', cap: '#58625c', seed: 41, peaks: 7 });

H.setHero(H.popup(null, null, { node: new THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-16, 16, 0.5, 12, -24, 30], n: 120, colors: [C.money, '#e2d8c2', '#f6f0e2'], size: 0.26, wind: [0.5, -0.4, 0.3], seed: 4, shape: 'coin' });
drift(film, { box: [-14, 16, DY, DY + 9, -45, -28], n: 60, colors: ['#ffb04a', '#e8602a', '#ffd27a'], size: 0.14, wind: [0.3, 0.6, 0.2], seed: 5, shape: 'ember' });

// ---- actors ----------------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const huo = createActor(film, { name: 'huo', poses: { p: IMG.huo }, height: 5.0, x: -3, z: 15 });
const gu = createActor(film, { name: 'gu', poses: { p: IMG.gu }, height: 5.4, x: -1, z: -3.5 });
const chang = createActor(film, { name: 'chang', poses: { p: IMG.chang }, height: 5.4, x: 2, z: -14 });
const lion = createActor(film, { name: 'lion', poses: { p1: IMG.lion1, p2: IMG.lion2 }, height: 6.2, heights: { p2: 6.8 }, x: 8, z: -37, risen: true });
const FIRE = ['#a8231a', '#e8602a', '#f2b84a'];
const B = beats(film, hero, lion, { y0: DY, dust: ['#9a5a44', '#5a3a2a', '#ffb04a'], sparks: ['#ffd27a', '#ffb04a', '#fff0c8'] });
const S = film.sound, ZB = -37, ZH = -36;

// ---- the street (v4): three mid-boss showcases; 魂 is not on the page until he climbs to the hall ---------------------------
const camIntro = intro(film, hero, { land: [-2, 23], t1: 1.0 });
hero.hideBetween(1.9, 14.9 + D);
film.rise('world', 0.55, { from: [-2, 23], speed: 42 });
film.title({ t0: 1.0, dur: 3.0, name: '庞镇', sub: '肆' }); S(1.0, 'title');
const E1 = 3.6, E2 = 7.4, E3 = 13.6;
// 火流星: the burning meteor on its chain whirls over his head, then lashes down the street toward us and bursts in flame
elite(film, huo, E1, { title: '鬼差队长', name: '火流星', move: 'none', dur: 3.0 });
const HUO = [-3, 15], FIREC = ['#a8231a', '#e8602a', '#f2b84a'];
huo.key(E1 + 0.6, { lean: 0 }).key(E1 + 0.8, { lean: -0.1 }).key(E1 + 1.9, { lean: -0.1 }).key(E1 + 2.1, { lean: 0.16, ease: 'in' }).key(E1 + 2.6, { lean: 0 });
paperChain(film, { t: E1 + 0.8, dur: 1.9, links: 40, size: 0.18, colors: ['#3a3434', '#5a5452'], hook: '#e8602a',
  path: (u, lt) => { if (lt < 1.15) { const a = lt * 9 + u * 2.6, R = 3.2 * u; return [HUO[0] + 1 + Math.cos(a) * R, 5.2 + Math.sin(a) * R * 0.25, HUO[1] + Math.sin(a) * R * 0.6]; }
    const k = Math.min(1, (lt - 1.15) / 0.3); return [lerp(HUO[0] + 1, -2, u * k), lerp(5.2, 0.6, u * k) + Math.sin(Math.PI * u) * 1.5 * k, lerp(HUO[1], 23, u * k)]; },
  reach: (lt) => (lt < 0.2 ? lt / 0.2 : lt > 1.6 ? 1 - (lt - 1.6) / 0.3 : 1), sound: 'chain' });
for (let k = 0; k < 6; k++) { const a = (E1 + 0.8 + k * 0.17 - E1 - 0.8) * 9 + 2.6; crown(film, { t: E1 + 0.85 + k * 0.17, at: [HUO[0] + 1 + Math.cos(a) * 3.2, 4.2, HUO[1] + Math.sin(a) * 1.9], n: 6, radius: 0.5, height: 1.4, colors: FIREC, kind: 'flame', hold: 0.1, seed: 60 + k }); }
popBurst(film, { t: E1 + 2.3, at: [-2, 0, 22.5], r: 2.6, colors: FIREC, crumple: 8, seed: 66, sound: 'boom' }); film.at(E1 + 2.3, () => film.kick(0.8));
flameLine(film, { t: E1 + 2.35, from: [-2, 22.5], to: [-2.5, 17.5], n: 9, h: 2.4, step: 0.04, life: 0.5, colors: FIREC, y: 0, seed: 67 });
// 骨婉约: the page goes black for a breath (her mark); she is there, in the paper money by the well, singing; black
// again; she has swept to the well's lip; the money whirls up round her
elite(film, gu, E2, { title: '女妖', name: '骨婉约', move: 'none', dur: 5.6 });
gu.key(E2 + 0.02, { y: 0.6 });
film.tint(E2 - 0.15, { color: '#0a0708', dur: 0.5, peak: 0.88 }); S(E2 - 0.15, 'gust');
shards(film, { t: E2 + 0.3, at: [-1, 3, -3.5], n: 50, colors: [C.money, '#e2d8c2'], speed: 5, up: 8, size: 0.3, gravity: 5, shape: 'coin', life: 2.4, seed: 3 });
gu.key(E2 + 1.0, { jit: 0.05 }).key(E2 + 3.0, { jit: 0.05 }).key(E2 + 3.1, { jit: 0 });
film.tint(E2 + 3.35, { color: '#0a0708', dur: 0.4, peak: 0.85 }); S(E2 + 3.35, 'gust');
afterimage(film, { t: E2 + 3.45, img: IMG.gu, at: [-1, -3.5], height: 5.4, tint: '#e8e2d6', alpha: 0.5, dur: 0.5 });
gu.key(E2 + 3.45, { x: -1, z: -3.5 }).key(E2 + 3.5, { x: -7.6, z: -5.2, snap: true });
curls(film, { t: E2 + 3.7, from: [-7.6, 0.6, -5.2], to: [-6.6, 6.2, -4.6], n: 10, colors: ['#e8e2d6', '#c9c2b4', '#1a1418'], dur: 1.1, spread: 1.6, sound: 'gust' });
shards(film, { t: E2 + 3.75, at: [-7.6, 0.4, -5.2], n: 60, colors: [C.money, '#e2d8c2', '#f6f0e2'], speed: 3, up: 10, size: 0.3, gravity: 3, shape: 'coin', life: 2.6, seed: 5, drag: 2 });
gu.key(E2 + 5.9, { rise: 0 });
// 长鸿: lightning strikes the raised spear; he drives it forward in one long thrust
elite(film, chang, E3, { title: '雷枪', name: '长鸿', move: 'none', dur: 2.6 });
zigzag(film, { t: E3 + 0.55, from: [3.4, 16, -14.4], to: [3.0, 5.6, -14], width: 0.8, seed: 23 });
starburst(film, { t: E3 + 0.95, at: [3.0, 5.6, -13.8], r: 1.4, colors: ['#1a2a3a', '#8fb4ff', '#f4f8ff'], dur: 0.35, sound: null });
chang.key(E3 + 1.2, { lean: 0 }).key(E3 + 1.35, { lean: 0.12 }).key(E3 + 1.5, { lean: -0.18, ease: 'out', z: -12.5 }).key(E3 + 2.2, { lean: 0, z: -14 });
zigzag(film, { t: E3 + 1.5, from: [3.2, 3.2, -13.2], to: [1.2, 2.6, -5], width: 0.55, n: 9, seed: 24, sound: 'bolt', land: false });
film.at(E3 + 1.5, () => film.kick(0.7));
{ const V = film.voice; V(E1 + 0.05, 'vo/huoliuxing_line_01.wav'); V(E2 + 0.05, 'vo/guwanyue_prebattle_opera_01.wav', { who: '骨婉约', kind: 'line', gain: 0.9 }); V(E3 + 0.05, 'vo/changhong_line_01.wav'); }
huo.key(E2 - 0.3, { rise: 0 });
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 6, 6], dist: 62, pitch: 30, yaw: 4, focus: [0, 5, 6] },
  { t: 3.4, target: [1, 6, 0], dist: 56, pitch: 28, yaw: 1, ease: 'linear', focus: [0, 5, 0] },
  // 火流星: a low medium shot, the chain coming at the lens
  { t: E1 + 0.1, target: [-2.4, 4.0, 16], dist: 19, pitch: 13, yaw: 0, focus: [-3, 3.8, 15], ease: 'cut' },
  { t: E1 + 2.0, target: [-2.4, 3.8, 16.6], dist: 20, pitch: 14, yaw: 0, ease: 'linear', focus: [-2.6, 3.2, 17] },
  { t: E1 + 2.4, target: [-2.2, 3.2, 18.5], dist: 23, pitch: 20, yaw: 0, ease: 'out', focus: [-2.2, 2, 20] },
  // 骨婉约: the square from across it, pushed in slowly through her song; after the second black, on her at the well
  { t: E2 - 0.15, target: [-2.6, 3.6, -3.4], dist: 30, pitch: 24, yaw: 4, focus: [-1.5, 3.2, -3.4], ease: 'cut' },
  { t: E2 + 3.35, target: [-2.4, 3.6, -3.4], dist: 23, pitch: 22, yaw: 2, ease: 'linear', focus: [-1.2, 3.4, -3.4] },
  { t: E2 + 3.45, target: [-6.6, 3.6, -5], dist: 19, pitch: 18, yaw: 12, focus: [-7.6, 3.6, -5.2], ease: 'cut' },
  { t: E2 + 5.9, target: [-6.6, 4.2, -5], dist: 21, pitch: 20, yaw: 15, ease: 'linear', focus: [-7.6, 3.8, -5.2] },
  // 长鸿 under the strike, then the thrust
  { t: E3 - 0.1, target: [2.2, 4.4, -14.5], dist: 27, pitch: 24, yaw: 8, focus: [2, 4, -14], ease: 'cut' },
  { t: E3 + 1.4, target: [2.2, 4.2, -14], dist: 24, pitch: 22, yaw: 6, ease: 'linear', focus: [2, 3.8, -14] },
  { t: E3 + 2.4, target: [1.6, 3.6, -11], dist: 25, pitch: 24, yaw: 4, ease: 'out', focus: [1.5, 3, -10] },
]);
film.shift(D);   // ---- from here on: the v3 boss fight, D later

// ---- the climb to the hall: 魂 runs up the steps; the yard rises above him -------------------------------------------------------------
film.rise('arena', ARENA_T, { from: [1, -32], speed: 26 });
hero.key(14.9, { hidden: false, rise: 1, pose: 'run', x: -1, z: -14, y: 0, face: 1 })
  .key(15.35, { z: -17.2, y: 0 }).key(15.45, { y: 1.1, z: -17.8 }).key(15.75, { z: -20.2 }).key(15.85, { y: 2.2, z: -20.8 }).key(16.15, { z: -23.2 }).key(16.25, { y: 3.3, z: -23.8 })
  .key(16.55, { z: -26.2 }).key(16.65, { y: DY, z: -27 }).key(17.2, { x: -3, z: ZH, ease: 'linear' }).key(17.22, { pose: 'idle' });
S(14.95, 'steps', { dur: 2.2 });
lion.key(0, { hidden: true, y: DY + 13 }).key(17.4, { hidden: false }).key(17.82, { y: DY, ease: 'in' });
film.at(17.82, () => film.kick(1.0)); S(17.82, 'land', { size: 1 });
crown(film, { t: 17.82, at: [8, DY, ZB], n: 14, radius: 1.8, height: 3.2, colors: FIRE, kind: 'flame', rows: 2, seed: 7 });
rings(film, { t: 17.82, at: [8, 0, ZB], n: 2, r1: 6, color: '#ffb04a', width: 0.3, y: DY + 0.05 });
film.plate({ t0: 18.2, dur: 2.4, title: '被面具控制的舞狮尊主', name: '烈焰', boss: true, seal: '首' });

// phase one: the opening string (guarded), two fireballs (guarded, dodged)
[18.9, 19.15, 19.4].forEach((t, i) => { slash(film, { t, at: [2.6, DY + 2.4, -36.2], radius: 2.9, width: 0.8, a0: i % 2 ? 2.4 : -0.6, a1: i % 2 ? -0.6 : 2.4, normal: [0.1, 0.2, 1], color: '#c0481c', core: '#ffd27a', sound: 'whoosh' }); B.guard(t + 0.05, [-3 - i * 0.35, ZH], { back: 0.35, hold: 0.24 }); });
lion.key(18.7, { x: 8 }).key(18.9, { x: 5.4, ease: 'out' }).key(19.8, { x: 8.5, ease: 'out' });
paperBall(film, { t: 20.0, from: [6.5, DY + 3.5, ZB], to: [-4.2, DY + 0.6, ZH], dur: 0.5, arc: 2.5, colors: FIRE, seed: 13, floor: DY });
B.guard(20.45, [-4.2, ZH], { back: 0.8, heavy: true, hold: 0.4 });
paperBall(film, { t: 20.7, from: [6.5, DY + 3.5, ZB], to: [-5.4, DY + 0.6, -35.5], dur: 0.5, arc: 3, colors: FIRE, seed: 14, floor: DY });
hero.key(20.95, { pose: 'dodge', x: -5, z: ZH }).key(21.2, { x: -6.5, z: -34, ease: 'out' }).key(21.3, { pose: 'idle' });
// the fire stream: the red flash; 魂 shadow-steps through it to his back; the counter
hero.key(21.5, { x: -6.5, z: -34 }).key(21.7, { x: -4.5, z: ZH });
lion.key(21.7, { lean: 0 }).key(21.9, { lean: -0.2 });
B.tell(21.95, [6.2, DY + 3.6, -36.4], 'red');
B.shadowstep(22.05, [-4.5, ZH], [13, -36.4], { face: -1 });
flameLine(film, { t: 22.15, from: [5, ZB + 0.3], to: [-9, -35.8], n: 14, h: 2.8, step: 0.03, life: 0.5, colors: FIRE, y: DY, seed: 21 });
B.counter(22.8, [13, -36.4], [8.5, ZB], { face: -1, reach: 1.4 });
// fire columns erupt under 魂, one after another; he weaves between them
lion.key(23.6, { face: -1 });
const cols = [[11, -35.8], [8.5, -34.8], [12.5, -37.8]];
hero.key(23.7, { pose: 'dodge', x: 11.6, z: -36.4 });
cols.forEach(([x, z], i) => { flameColumn(film, { t: 23.8 + i * 0.42, at: [x, DY, z], h: 8, r: 0.9, n: 14, dur: 0.9, colors: FIRE, seed: 30 + i, sound: i ? 'flame' : 'pillar' }); });
hero.key(24.0, { x: 9.5, z: -34.6, ease: 'out' }).key(24.45, { x: 12.8, z: -34.4, ease: 'out' }).key(24.85, { x: 11.2, z: -36.2, ease: 'out' }).key(24.95, { pose: 'idle' });
// the leaping slam: the blue glint at the top of his leap; deflected; the counter
lion.key(25.3, { x: 8.5, hop: 3 }).key(25.9, { x: 7, ease: 'linear' });
B.tell(25.5, [7.6, DY + 7.5, -36.6], 'blue');
B.deflect(25.88, [11.6, -36.4], [7, ZB], { face: -1 });
popBurst(film, { t: 25.9, at: [7, DY, -36], r: 2.6, colors: FIRE, crumple: 8, seed: 33, sound: 'boom' });
B.counter(26.45, [11.6, -36.4], [7, ZB], { face: -1, reach: 1.4 });
// the rolling head: a burning lion-head card rolls at him; 魂 vaults it and cuts down
function rollingMask(t0, from, to, dur = 0.9, size = 4.6) {
  const [pts, paint] = imagePiece(IMG.mask, size);
  const card = makeCard(pts, { paint, paper: H.paper, thickness: 0.08, edgeWidth: 0.05, pxPerUnit: 120, back: 'kraft', folds: [] });
  card.geometry.translate(0, -size / 2, 0);
  const grp = new THREE.Group(); grp.add(card); grp.visible = false; H.scene.add(grp);
  film.sound(t0, 'roll', { dur });
  film.every((t) => { const u = (t - t0 - D) / dur; grp.visible = u >= 0 && u <= 1.1; if (!grp.visible) return; const e = clamp(u), x = lerp(from[0], to[0], e), z = lerp(from[1], to[1], e); grp.position.set(x, DY + size / 2, z); grp.lookAt(H.camera.position.x, DY + size / 2, H.camera.position.z); card.rotation.z = (x - from[0]) / (size / 2); });
  for (let k = 0; k < 5; k++) { const u = k / 5; crown(film, { t: t0 + u * dur, at: [lerp(from[0], to[0], u), DY, lerp(from[1], to[1], u)], n: 8, radius: 1.1, height: 2.4, colors: FIRE, kind: 'flame', hold: 0.2, seed: k + 5 }); }
}
hero.key(27.0, { pose: 'dodge', x: 9.5 }).key(27.3, { x: 13, ease: 'out' }).key(27.4, { pose: 'idle' });
rollingMask(27.6, [6, ZB + 0.4], [15, -36.2], 0.9);
B.leapCut(27.85, [13, -36.4], [9.5, -36.4], [6, ZB]);
hero.key(27.85, { face: -1 });

// the change: the costume burns away; a ring of fire columns round the yard
const P2T = B.phase(28.8, [6, ZB], 'p2', { heroFrom: [9.5, -36.4], heroTo: [12.5, -36.4], kind: 'flame', crownColors: FIRE, color: FIRE, flash: '#ff8a3a',
  extra: (T0) => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; flameColumn(film, { t: T0 + 0.1 + i * 0.06, at: [3 + Math.cos(a) * 12, DY, -37 + Math.sin(a) * 5.5], h: 10, r: 1.0, n: 16, dur: 2.0, colors: FIRE, seed: 50 + i, sound: i ? null : 'pillar' }); } } });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '舞狮尊主', name: '最后一舞', boss: true, seal: '舞', barColor: '#c0481c' });

// phase two: up onto the poles, hopping from top to top (a trail of flame tongues where he lands)
const W0 = P2T + 2.0;
const hopTo = (t, i, dur = 0.42) => { const [x, y, z] = poleTop(i); lion.key(t, { hop: 2.2 }).key(t + dur, { x, y, z: z + 0.2, ease: 'linear' }); crown(film, { t: t + dur, at: [x, y, z], n: 7, radius: 0.7, height: 1.6, colors: FIRE, kind: 'flame', hold: 0.15, seed: i + 70 }); S(t + dur, 'thud', { size: 0.6 }); };
lion.key(W0 - 0.05, { x: 6, y: DY, z: ZB });
hopTo(W0, 4); hopTo(W0 + 0.5, 2); hopTo(W0 + 1.0, 3); hopTo(W0 + 1.5, 5); hopTo(W0 + 2.0, 6);
// the dive from the pole top: the blue glint at the apex; deflected; he springs back up to another pole
const DV = W0 + 2.7;
lion.key(DV, { hop: 2.5 }).key(DV + 0.5, { x: 10.2, y: DY, z: ZB, ease: 'in' });
B.tell(DV + 0.2, [10.6, DY + 8.6, -40], 'blue');
B.deflect(DV + 0.5, [13.4, -36.4], [10.2, ZB], { face: -1 });
B.counter(DV + 1.0, [13.4, -36.4], [10.2, ZB], { face: -1, reach: 1.0 });
lion.key(DV + 1.5, { hop: 2.8, x: 10.2, y: DY, z: ZB }).key(DV + 2.0, { x: poleTop(2)[0], y: poleTop(2)[1], z: poleTop(2)[2] + 0.2, ease: 'linear' });
// fire from above: he breathes down a sweeping line of flame (the red flash); 魂 shadow-steps up onto a pole top
const FB = DV + 2.4;
hero.key(FB - 0.3, { x: 13.4, z: ZH }).key(FB, { x: 6, z: ZH, ease: 'out', pose: 'run' }).key(FB + 0.02, { pose: 'idle' });
B.tell(FB + 0.1, [-2.6, poleTop(2)[1] + 2.5, -40], 'red');
flameLine(film, { t: FB + 0.3, from: [-6, -35], to: [9, -36.6], n: 16, h: 2.6, step: 0.025, life: 0.5, colors: FIRE, y: DY, seed: 81 });
B.shadowstep(FB + 0.25, [6, ZH], [poleTop(4)[0], poleTop(4)[2] + 0.4], { face: -1 });
hero.key(FB + 0.25, { y: DY }).key(FB + 0.76, { y: poleTop(4)[1], snap: true });
// 魂 follows him up: a leap from pole to pole and the overhead cut; the Grandmaster falls to the yard
hero.key(FB + 1.2, { pose: 'overhead', hop: 2.5, x: poleTop(4)[0], y: poleTop(4)[1], z: poleTop(4)[2] + 0.4 }).key(FB + 1.7, { x: poleTop(2)[0] + 1.6, y: poleTop(2)[1], z: poleTop(2)[2] + 0.4, ease: 'linear' }).key(FB + 1.72, { pose: 'slash' }).key(FB + 2.3, { pose: 'idle' });
S(FB + 1.2, 'leap'); slash(film, { t: FB + 1.65, at: [poleTop(2)[0] + 0.6, poleTop(2)[1] + 3, -39.6], radius: 3.9, width: 0.95, a0: 1.9, a1: -1.5, normal: [0.25, 0, 1], color: '#b3231a', sound: 'heavy' });
B.bossHit(FB + 1.75, [poleTop(2)[0], poleTop(2)[2] + 0.2], 1.4);
lion.key(FB + 1.9, { y: poleTop(2)[1] }).key(FB + 2.35, { x: -1.5, y: DY, z: ZB, ease: 'in', lean: 0.3 }).key(FB + 2.8, { lean: 0 });
popBurst(film, { t: FB + 2.35, at: [-1.5, DY, ZB], r: 2.8, colors: FIRE, crumple: 8, seed: 91, sound: 'boom' }); film.at(FB + 2.35, () => film.kick(1.2));
hero.key(FB + 2.4, { hop: 1.6, x: poleTop(2)[0] + 1.6, y: poleTop(2)[1], z: poleTop(2)[2] + 0.4 }).key(FB + 2.85, { x: 3.6, y: DY, z: ZH, ease: 'linear' }).key(FB + 2.87, { pose: 'idle', face: -1 });
// the last: he rears up burning (the blue glint), the deflect, the finisher
const L = FB + 3.4;
lion.key(L, { face: -1, lean: -0.2 });
B.tell(L + 0.1, [0.6, DY + 5, -36.4], 'blue');
lion.key(L + 0.25, { x: -1.5 }).key(L + 0.45, { x: -0.2, ease: 'out', lean: 0 });
B.deflect(L + 0.45, [3.6, ZH], [-0.2, ZB], { face: -1, stagger: 0.55 });
const FIN = L + 1.15;
B.finisher(FIN, [3.4, ZH], [-0.6, ZB], { face: -1 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
{ const V = film.voice;   // 骨婉约's line is cued in the square above (pending in the pack)
  V(17.95, 'vo/wushizunzhu_line_02.wav');                                    // P1 entry
  V(21.75, 'vo/wushizunzhu_attack_01.wav', { cap: 1.6 }); 
  V(28.85, 'vo/wushizunzhu_hurt_01.wav', { cap: 1.8 });                     // the change: the costume burns away
  V(P2T + 0.4, 'vo/wushizunzhu_line_03.wav', { seg: 'squeeze' });           // P2 opens: 众弟子听令！……归位！
  V(FB, 'vo/wushizunzhu_attack_02.wav', { cap: 1.4 });
  V(FIN + 0.45, 'vo/wushizunzhu_death_01.wav', { cap: 2.5 }); }

const OUT = FIN + 3.2;
const camOutro = outro(film, hero, { t0: OUT, from: [3, -36], dur: 1.4, color: C.ground, nextColor: GROUNDS['05-camp'] });
hero.key(OUT, { y: DY }).key(OUT + 0.5, { y: 0, ease: 'in' });
for (const a of [huo, chang]) a.key(OUT, { rise: 0 });

// ---- camera -------------------------------------------------------------------------------------------------------------------------
const duel = (t, o = {}) => ({ t, target: [3, DY + 2.8, -36.4], dist: 33, pitch: 26, yaw: 0, focus: [3, DY + 2.8, -36.6], ...o });
film.camera([
  { t: 15.3, target: [-1, 4, -21], dist: 34, pitch: 22, yaw: 14, focus: [-1, 3, -22] },
  { t: 16.7, target: [0, 6.5, -30], dist: 38, pitch: 18, yaw: 8, ease: 'linear', focus: [0, 6, -32] },
  { t: 17.45, target: [1, 6.5, -32], dist: 38, pitch: 18, yaw: 6, ease: 'linear', focus: [0, 6, -33] },
  // v4: the Grandmaster lands, seen from the yard floor
  { t: 17.5, target: [7.4, DY + 3.6, -37], dist: 20, pitch: 6, yaw: -18, focus: [8, DY + 3.4, -37], ease: 'cut' },
  { t: 18.55, target: [7.6, DY + 3.8, -37], dist: 17, pitch: 7, yaw: -14, ease: 'linear', focus: [8, DY + 3.6, -37] },
  duel(18.6, { dist: 33, ease: 'cut' }),
  duel(21.0, { dist: 32, ease: 'linear', target: [1, DY + 2.8, -36.4] }),
  // v4: the red tell on him, close; out again as 魂 steps through the fire
  { t: 21.8, target: [5.8, DY + 4.2, -36.6], dist: 19, pitch: 14, yaw: 10, focus: [6.2, DY + 4, -36.8], ease: 'cut' },
  { t: 22.15, target: [5.8, DY + 4.2, -36.6], dist: 18, pitch: 14, yaw: 9, ease: 'linear', focus: [6.2, DY + 4, -36.8] },
  duel(22.3, { dist: 32, target: [4.5, DY + 2.8, -36.4], ease: 'cut' }),
  duel(23.6, { dist: 30, target: [9, DY + 3, -36.4] }),
  duel(27.2, { dist: 32, ease: 'linear', target: [9, DY + 3, -36.4] }),
  { t: P2T - 0.6, target: [5, DY + 3.6, -36.8], dist: 25, pitch: 25, yaw: -6, focus: [6, DY + 3.4, ZB] },
  { t: P2T + 1.4, target: [5, DY + 4, -36.8], dist: 30, pitch: 22, yaw: -8, ease: 'linear', focus: [6, DY + 3.6, ZB] },
  duel(W0, { dist: 40, pitch: 22, target: [3, DY + 5, -38.5] }),
  duel(DV + 1.0, { dist: 34, pitch: 24, ease: 'linear', target: [8, DY + 4, -37.5] }),
  duel(FB, { dist: 38, pitch: 22, target: [2, DY + 5, -38.5] }),
  duel(FB + 2.6, { dist: 34, pitch: 24, ease: 'linear', target: [1.5, DY + 4, -37.5] }),
  duel(FIN - 0.4, { dist: 27, target: [1.6, DY + 3, -36.4] }),
  // v4: the kill over 魂's shoulder, then wide for the stamp
  { t: FIN - 0.05, target: [1.6, DY + 3.0, -36.6], dist: 18, pitch: 13, yaw: 42, focus: [-0.6, DY + 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [1.6, DY + 2.8, -36.6], dist: 16.5, pitch: 13, yaw: 38, ease: 'linear', focus: [-0.6, DY + 2.6, -37] },
  duel(FIN + 1.25, { dist: 27, pitch: 30, target: [2, DY + 2.8, -36.4], ease: 'cut' }),
  duel(FIN + 2.6, { dist: 29, pitch: 30, ease: 'linear', target: [2, DY + 2.8, -36.4] }),
  ...camOutro,
]);
film.start();
