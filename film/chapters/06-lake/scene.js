// 第六章 · 梅谷湖 (Meigu Lake), v2. One great lake under far snowy ranges; small rocky islets stand out of it, each a
// raised fold with a snow deck. The film crosses the lake from islet to islet: the zither girl (烟千岁) before her ruined
// temple yard and its tall leaning tower, the ghost catcher (断肠), the frenzied water-gang chief (游龙) before his little
// stilt-house water village; at the far side, the big island with the wreck, rising only for
// the fight with the Blizzard Blademaster: the ice crescent, the ground burst of ice, the red-flash cut, the ice ring
// ("I'll strike only once"), the leaping slam; then the triple slash, three waves of ice in a row, the third freezing
// 魂 in a block of folded vellum until he breaks out. Snow and mist drift over everything. ~44 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.6: a vast pale lake, far snowy ranges in layers, rocky islets with snow decks and bamboo, a wreck, a pier;
//          snow falling; ice as faceted folded paper.
// PALETTE  ground/lake #6f8a84 / #536c68; snow #eef2f4; rock #6a7078; ranges #9aa6ae -> #d6dde2; ice #e6f0f2 / #b8d3dc /
//          #8fb2c2; thread #a3161a; shadow #18242a; haze #c4ccc8
// LIGHT    cold overcast key, blue-grey fill
// LIFE     heavy snow; mist; ripples
import { setupChapter, threads, threadBand, beats, elite, intro, outro, GROUNDS, createActor, makeHero, slash, shards, rings, crown, drift, P2, THREE } from '../../common/kit.js';
import { makeTerrain } from '../../common/terrain.js';
import { jiangnanHouse, tower, parts } from '../../common/build.js';
import { crystals, iceBlock, crescentShot, sawRing, starburst, popBurst, sparks, afterimage } from '../../common/fx.js';

const S0 = '/work/film/stickers/06-lake/', BOSS = '/work/boss-chibi/透明PNG/06 梅谷湖/';
const C = { ground: GROUNDS['06-lake'], lake: '#6f8a84', lakeDeep: '#536c68', snow: '#eef2f4', rock: '#6a7078', ice: '#b8d0dc', red: '#b3231a' };
const K = await setupChapter({
  id: '06-lake', ground: C.ground, duration: 39.4 + 2.2,
  bounds: { x0: -46, x1: 46, z0: -54, z1: 34 },
  light: { key: '#f2f2ea', keyIntensity: 2.6, keyDir: [-0.75, 0.9, 0.45], fill: '#c8d4dc', fillIntensity: 1.0, sky: '#e8eef0', ground: '#7a8a84', skyIntensity: 0.55, leak: '#34464c' },
  lens: { haze: '#c4ccc8', hazeStart: 50, hazeEnd: 170, hazeAmount: 0.3, saturation: 0.9, tint: [0.98, 1.0, 1.01], exposure: 0.87, vignette: 0.08 },
  pieces: { stone: '#868e8a', stoneDark: '#5a6260', cap: '#e8ecee', bush: ['#5e7a5a', '#6a7a5e'], bushDots: '#c8d0b8', tuft: ['#7a8a62', '#8a9470'] },
  shadowInk: '#18242a',
  stickers: {
    boat: S0 + 'mechboat.png', pier: S0 + 'pier.png', reeds: S0 + 'reeds.png', bamboo: S0 + 'bamboo.png', snakehouse: S0 + 'snakehouse.png', islet: S0 + 'island.png',
    wreck: S0 + 'wreck.png', snowdock: S0 + 'snowdock.png',
    qin: BOSS + '01 琴女烟千岁.png', you: BOSS + '02 游龙·发狂.png', blizzard: BOSS + '03 风雪刀客.png', duanchang: BOSS + '04 鬼差高手·断肠.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, house } = K;
const T = makeTerrain(K);

H.printGround(({ g, ppu, X, Z, rnd: r, water }) => {
  water([[-60, -60], [60, -60], [60, 40], [-60, 40]], { colors: [C.lake, C.lakeDeep], rim: '#c4ccc8', inset: 0.3, marks: 'ripples', markColor: P2.rgba('#eef2f4', 0.6), flow: 0.06 });
  for (let k = 0; k < 220; k++) { const x = (r() - 0.5) * 90, z = -54 + r() * 88; g.fillStyle = P2.rgba('#e6eef0', 0.35); g.beginPath(); g.ellipse(X(x), Z(z), (0.6 + r() * 2.4) * ppu, (0.08 + r() * 0.1) * ppu, 0, 0, 7); g.fill(); }
});

// ---- the islets: rocky folds with snow decks; bamboo, the snake house, reeds on them -----------------------------------------------
const snowDeck = (P) => { P.fill(C.snow); P.felt(0.5); P.marks('dab', { color: '#c8d4da', alpha: 0.5, size: 0.05 }); P.marks('dot', { color: '#8a9aa0', alpha: 0.3, size: 0.02, density: 0.4 }); };
const rockFace = (P) => { P.gradient('#545a62', '#7a828a'); P.felt(0.5); P.marks('tick', { color: '#2a3036', alpha: 0.45, size: 0.06, angle: 1.2 }); P.layer((g) => { g.fillRect(P.box.x0, P.box.y1 - 0.3, P.box.w, 0.3); }, C.snow, { lip: 0.6 }); P.innerShade('#18242a', { alpha: 0.35, blurPx: 8 }); };
const ISL = { qin: { x: -5, z: 16, w: 17, d: 10, h: 1.2 }, duan: { x: 7, z: 1, w: 16, d: 10, h: 1.4 }, you: { x: -6, z: -12, w: 19, d: 10, h: 1.3 } };
const isl = {};
// the two elite sets (the tower yard, the water village) stand only around their elite's moment, so the tall tower never
// fills the later shots: groups 'qinset' / 'youset' rise with the world and fold after their elite
for (const [k, o] of Object.entries(ISL)) isl[k] = T.island({ ...o, facePaint: rockFace, deckPaint: snowDeck, seed: Math.round(o.x * 3 + o.z) });
const onIsl = (i, name, h, x, z, o = {}) => sticker(name, h, { parent: isl[i].deck, x: x - ISL[i].x, z: z - ISL[i].z, mark: false, ...o });
const onDeck = (i, node, x, z, height, group, yaw = 0) => K.put(H.popup(null, null, { node, parent: isl[i].deck, x: x - ISL[i].x, z: z - ISL[i].z, yaw, height, level: true }), group);
const stoneLantern = (lit = '#ffd27a') => { const P = parts(H); P.box('#8a8e8c', [0.9, 0.3, 0.9], [0, 0.15, 0]); P.box('#7a7e7c', [0.34, 1.3, 0.34], [0, 0.95, 0]); P.box('#8a8e8c', [0.8, 0.18, 0.8], [0, 1.65, 0]); P.box(lit, [0.5, 0.5, 0.5], [0, 2.0, 0]); P.add('#5e6260', new H.THREE.CylinderGeometry(0.12, 0.72, 0.5, 4), [0, 2.5, 0], [0, Math.PI / 4, 0]); P.box('#eef2f4', [0.95, 0.08, 0.95], [0, 2.3, 0]); return P.build(); };
// 烟千岁: the temple yard. A tall timber tower leaning hard over her, a stone lantern pair, a broken fence, bamboo aside
// v4: a short, broad, leaning tower (Q proportions, like the game's climbable leaning pagoda), an outside stair winding up it
onDeck('qin', tower(H, { floors: 4, w: 6.6, fh: 2.7, shrink: 0.84, lean: 0.12, seed: 7, stairs: true, slip: false, col: { wall: '#d6d0c2', tile: '#3e3e46', tileDark: '#2a2a30', post: '#7a2a20', timber: '#4a3626' } }), -9.0, 6.8, 16, 'qinset', 0.25);
onDeck('qin', stoneLantern(), -1.2, 9.5, 3, 'qinset'); onDeck('qin', stoneLantern(), 2.2, 12.5, 3, 'qinset');
onIsl('qin', 'bamboo', 8, 0.5, 7.5, { res: 1.1, flip: true, group: 'qinset' });
for (let i = 0; i < 6; i++) { const x = -12.5 + i * 1.3, z = 12.8 - i * 0.25; if (i !== 3) onDeck('qin', (() => { const P = parts(H); const hh = 1.2 + (i % 3) * 0.4; P.box('#5a4a3a', [0.22, hh, 0.22], [0, hh / 2, 0], [0, 0, (i % 2 - 0.5) * 0.3]); P.box('#5a4a3a', [1.3, 0.14, 0.12], [0.6, hh * 0.7, 0]); return P.build(); })(), x, z, 2, 'qinset'); }
onIsl('qin', 'reeds', 2.6, 6.5, 14.5, { stamp: true, group: 'qinset' });
// 断肠: the snake house, rocks, a beached boat, stakes with red thread
onIsl('duan', 'snakehouse', 8, 12, -6.5, { res: 1.2 });
onIsl('duan', 'bamboo', 7.5, 0.5, -6.5, { res: 1.1 });
onIsl('duan', 'reeds', 2.6, 13.5, -0.5, { stamp: true }); onIsl('duan', 'reeds', 2.2, -0.2, -0.8, { stamp: true });
// 游龙: the water village. Stilt houses on the islet's back, the gang's white banner, a picket of dock stakes in front
const YOUW = [{ wall: '#6a5442', timber: '#2a2018', tile: '#4a4a50', tileDark: '#2e2e34', window: '#241a14', lit: '#e8c890' }, { wall: '#7e6650', timber: '#2a2018', tile: '#55545a', tileDark: '#36363c', window: '#241a14', lit: '#e8c890' }];
for (const [x, z, w, h, st, yaw] of [[-13, -19.5, 4.6, 3.2, 1.2, 0.15], [-7.5, -20.5, 5.4, 3.8, 1.0, 0], [-1.5, -19.8, 4.2, 3.0, 1.4, -0.2], [2.6, -16.5, 3.6, 2.6, 1.0, -0.9]])
  onDeck('you', jiangnanHouse(H, { w, d: 3.4, h, roofH: 1.6, stories: h > 3.4 ? 2 : 1, horse: false, stilts: st, seed: Math.round(x * 7), col: YOUW[Math.round(Math.abs(x)) % 2], lit: 0.3 }), x, z, h + st + 2, 'youset', yaw);
const flag = T.banner({ x: -1.5, z: -14.5, h: 7.5, w: 1.6, fh: 3.6, cloth: '#e2ddd0', edge: '#2a2018', group: 'youset' });
for (let i = 0; i < 9; i++) { const x = -15.5 + i * 2.1; if (x > -8.5 && x < -2) continue; stake(x, -11.2 - (i % 2) * 0.5, 1.6 + (i % 3) * 0.5, 'youset', '#4a3a2c'); }
onIsl('you', 'reeds', 3, -14, -15.5, { stamp: true, group: 'youset' }); onIsl('you', 'reeds', 2.6, 3, -13.5, { stamp: true, group: 'youset' });
// small islets dotted round the lake (printed island cards), the pier at the near shore, a machine boat
for (const [x, z, s] of [[-20, 6, 1], [20, 10, 0.9], [-22, -24, 1.1], [24, -18, 1], [18, 24, 0.8], [-18, 26, 0.9]]) sticker('islet', 6 * s, { x, z, res: 1.0 });
sticker('snowdock', 4, { x: 2, z: 25, res: 1.1 });
sticker('boat', 4.2, { x: 17, z: -6, res: 1.1 });
// far ranges in layers, palest furthest
T.range({ z: -50, x: 0, w: 170, h: 30, color: '#5e6c76', cap: '#eef2f4', seed: 61, peaks: 8 });
T.range({ z: -56, x: 15, w: 190, h: 40, color: '#7a8892', cap: '#f2f5f6', seed: 62, peaks: 6 });
T.range({ z: -62, x: -10, w: 210, h: 52, color: '#98a4ac', cap: '#f6f8f9', seed: 63, peaks: 5 });
const SIDE = {};
for (const s of [-1, 1]) SIDE[s] = T.wings({ zs: [10, -10, -30], side: s, inner: (z) => s * (30 - z * 0.15), w: 26, h: (z, i) => 14 + i * 4, colors: (i) => ({ rock: P2.mix('#6a747c', '#a2acb2', i / 2), dark: P2.mix('#40484e', '#7a848a', i / 2), moss: '#e6ecef', pine: '#3a4a46', mist: '#dfe6e8' }), seed: 64 + s, opts: { plateau: 0.4, spires: 2, pines: 0.6 } });

const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
threadBand(film, { a: wAt(SIDE[-1][0], 0.35), b: [-20, 0.05, 2], n: 120, wA: 1.4, wB: 4.6, seed: 61 });
threadBand(film, { a: wAt(SIDE[1][1], 0.35), b: [21, 0.05, -18], n: 120, wA: 1.4, wB: 4.6, seed: 62 });

// ---- the big island with the wreck (rises for the fight) -------------------------------------------------------------------------
const BI = { x: 3, z: -30.5, w: 30, d: 14, h: 1.4 }, Y = BI.h + 0.08;
const big = T.island({ ...BI, group: 'arena', facePaint: rockFace, deckPaint: snowDeck, seed: 66 });
const onBig = (name, h, x, z, o = {}) => sticker(name, h, { parent: big.deck, x: x - BI.x, z: z - BI.z, group: 'arena', mark: false, ...o });
onBig('wreck', 9, 4, -42.5, { res: 1.4 });
onBig('bamboo', 9, -10, -41, { res: 1.1 }); onBig('bamboo', 8, 16, -41.5, { res: 1.1, flip: true });
for (const [x, z] of [[-11, -34], [17, -34]]) onBig('reeds', 2.8, x, z, { stamp: true });
const ARENA_T = 12.4, DS = 0.4;   // v4: the boss fight keeps its v3 times, shifted DS later (film.shift)

H.setHero(H.popup(null, null, { node: new THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-30, 30, 0.5, 14, -50, 30], n: 160, colors: ['#ffffff', '#eef2f4', '#dfe6ea'], size: 0.16, wind: [0.35, -0.7, 0.25], seed: 3, shape: 'flake' });
drift(film, { box: [-20, 24, 0.3, 2.5, -44, 28], n: 26, colors: ['#e6eef0', '#d6e0e4'], size: 1.2, wind: [0.4, 0.02, 0.1], seed: 4, shape: 'petal' });

// ---- actors ---------------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const qin = createActor(film, { name: 'qin', poses: { p: IMG.qin }, height: 4.6, x: -5, z: 10.5 });
const duan = createActor(film, { name: 'duan', poses: { p: IMG.duanchang }, height: 5.0, x: 6.5, z: -4.5 });
const you = createActor(film, { name: 'you', poses: { p: IMG.you }, height: 5.6, x: -5, z: -17.5 });
qin.key(0, { y: ISL.qin.h + 0.08 }); duan.key(0, { y: ISL.duan.h + 0.08 }); you.key(0, { y: ISL.you.h + 0.08 });
const blz = createActor(film, { name: 'blizzard', poses: { p: IMG.blizzard }, height: 5.8, x: 8, z: -37, risen: true });
const ICE = ['#e6f0f2', '#b8d3dc', '#8fb2c2'], ICEC = ['#1a2a34', '#8fb2c2', '#eef6f8'];
const B = beats(film, hero, blz, { y0: Y, dust: ['#eef2f4', '#c8d4da', '#8fb2c2'], sparks: ['#eef6ff', '#bcd8ff', '#ffffff'] });
const S = film.sound, ZB = -37, ZH = -36;

// ---- across the lake --------------------------------------------------------------------------------------------------------------
const camIntro = intro(film, hero, { land: [2, 22], t1: 1.0 });
film.rise('world', 0.55, { from: [2, 22], speed: 42 });
film.rise('qinset', 0.55, { from: [2, 22], speed: 42, sound: false }); film.rise('youset', 0.55, { from: [2, 22], speed: 42, sound: false });
film.rise('qinset', 6.6, { from: [-5, 12], speed: 40, open: 0 }); film.rise('youset', ARENA_T + DS - 0.1, { from: [-5, -16], speed: 40, open: 0 });
film.title({ t0: 1.0, dur: 3.0, name: '梅谷湖', sub: '陆' }); S(1.0, 'title');
hero.hideBetween(1.9, ARENA_T + DS + 0.15);   // v4: 魂 off the page until the big island
const E1 = 3.5, E2 = 6.9, E3 = 9.5;
// 烟千岁 at the foot of her tower: she sweeps the strings and the sound goes out over the water in rings of cut paper
elite(film, qin, E1, { title: '琴女', name: '烟千岁', move: 'none', dur: 3.0 });
for (let k = 0; k < 4; k++) sawRing(film, { t: E1 + 0.8 + k * 0.32, at: [-5, ISL.qin.h + 1.8, 10.8], r0: 0.8, r1: 6 + k, teeth: 26, width: 0.22, color: ['#e8e0d0', '#c9d6dc', '#f4efe6', '#b8c8d0'][k], dur: 1.1, upright: true, seed: 80 + k });
S(E1 + 0.8, 'chime');
shards(film, { t: E1 + 1.0, at: [-5, ISL.qin.h + 2, 11.2], n: 26, colors: ['#f4efe6', '#e8e0d0'], speed: 6, up: 3, size: 0.4, gravity: 2, shape: 'strip', life: 2.0, seed: 84, drag: 2 });
// 断肠: the spear-runner's one long thrust across his islet, a streak of cut paper and his after-images behind him
elite(film, duan, E2, { title: '鬼差高手', name: '断肠', move: 'none', dur: 2.4 });
duan.key(E2 + 0.8, { x: 6.5, lean: -0.1 }).key(E2 + 1.05, { x: 1.5, z: -3.2, ease: 'out', lean: 0.08 }).key(E2 + 1.8, { lean: 0 });
[0, 0.07, 0.14].forEach((dt, i) => afterimage(film, { t: E2 + 0.85 + dt, img: IMG.duanchang, at: [lerp(6.5, 3, i / 2), lerp(-4.5, -3.6, i / 2)], height: 5.0, tint: '#d8e4ea', alpha: 0.5, dur: 0.4 }));
slash(film, { t: E2 + 0.95, at: [3.5, ISL.duan.h + 2.6, -3.6], radius: 9, width: 0.5, a0: 1.75, a1: 1.39, normal: [0, 0, 1], dur: 0.35, color: '#2a3a44', core: '#eef6f8', sound: 'heavy' });
popBurst(film, { t: E2 + 1.1, at: [0.5, ISL.duan.h, -3], r: 1.8, colors: ['#eef2f4', '#8fb2c2'], crumple: 6, seed: 86 });
// 游龙, maddened: he heaves the lake up in a wall of paper water and brings it down
elite(film, you, E3, { title: '发狂的水行帮主', name: '游龙', move: 'none', at: [-5, -17.5], dur: 2.8 });
you.key(E3 + 0.6, { jit: 0.06 }).key(E3 + 1.3, { jit: 0.06 }).key(E3 + 1.35, { jit: 0, lean: -0.2 }).key(E3 + 1.6, { lean: 0.14, ease: 'in' }).key(E3 + 2.1, { lean: 0 });
crown(film, { t: E3 + 0.9, at: [-3.5, 0, -15.5], n: 18, radius: 2.6, height: 4.8, colors: ['#eef2f4', '#b9cdc5', '#9db6ad'], rows: 3, hold: 0.45, seed: 87, sound: 'splash' });
crown(film, { t: E3 + 1.6, at: [-2.6, 0, -13.5], n: 14, radius: 2.0, height: 3.2, colors: ['#eef2f4', '#b9cdc5'], rows: 2, seed: 88 });
rings(film, { t: E3 + 1.6, at: [-2.6, 0, -13.5], n: 4, r1: 8, color: '#eef2f4' }); film.at(E3 + 1.6, () => film.kick(0.9)); S(E3 + 1.6, 'land', { size: 1 });
film.voice(E3 + 1.55, '../04-town/vo/youlong_hurt_01.wav');
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 5, -2], dist: 64, pitch: 30, yaw: 4, focus: [0, 4, -2] },
  { t: 3.3, target: [1, 5, -6], dist: 58, pitch: 28, yaw: 1, ease: 'linear', focus: [0, 4, -6] },
  // 烟千岁 under her leaning tower, the rings coming out over the water toward us
  { t: E1 + 0.1, target: [-5.4, 5.0, 10.5], dist: 26, pitch: 16, yaw: -4, focus: [-5, 3.6, 10.8], ease: 'cut' },
  { t: E2 - 0.25, target: [-5.4, 5.6, 10.5], dist: 29, pitch: 16, yaw: -2, ease: 'linear', focus: [-5, 4, 10.8] },
  // 断肠's thrust, from the side, the streak across the frame
  { t: E2 - 0.2, target: [3.8, 3.6, -3.8], dist: 24, pitch: 18, yaw: 24, focus: [4, 3.2, -4], ease: 'cut' },
  { t: E3 - 0.25, target: [3, 3.4, -3.6], dist: 23, pitch: 18, yaw: 22, ease: 'linear', focus: [3, 3.0, -3.6] },
  // 游龙: low over the water, the wall of water standing up in front of him
  { t: E3 - 0.2, target: [-4, 3.6, -15.5], dist: 24, pitch: 10, yaw: -6, focus: [-4.4, 3.4, -16], ease: 'cut' },
  { t: E3 + 2.8, target: [-3.6, 3.4, -15], dist: 26, pitch: 14, yaw: -4, ease: 'linear', focus: [-4, 3, -15.5] },
]);
film.shift(DS);   // ---- from here on: the v3 boss fight, DS later

// ---- the big island: it rises out of the lake; 魂 crosses the water; the Blademaster turns ----------------------------------------------
film.rise('arena', ARENA_T, { from: [BI.x, -36], speed: 26 });
hero.key(12.6, { hidden: false, pose: 'run', x: -1, z: -24, face: 1, rise: 1, y: 0 }).key(13.5, { x: -2.5, z: -30.2, y: 0, ease: 'linear' }).key(13.6, { y: Y, z: -31.2 }).key(14.0, { x: -3, z: ZH, ease: 'linear' }).key(14.02, { pose: 'idle' });
for (let k = 0; k < 4; k++) crown(film, { t: 12.7 + k * 0.22, at: [lerp(-1, -2.5, k / 3), 0, lerp(-24, -30, k / 3)], n: 6, radius: 0.8, height: 1.3, colors: ['#eef2f4', '#c4ccc8'], seed: k });
S(12.65, 'steps', { dur: 1.3 });
blz.key(0, { hidden: true, y: Y }).key(14.1, { hidden: false, rise: 1 }); S(14.1, 'rise', { size: 0.9 });
shards(film, { t: 14.2, at: [8, Y + 2, ZB], n: 40, colors: ['#ffffff', '#eef2f4'], speed: 6, up: 4, size: 0.2, gravity: 3, shape: 'facet', life: 1.8, seed: 5 });
film.plate({ t0: 14.5, dur: 2.4, title: '梅谷湖', name: '风雪刀客', boss: true, seal: '首' });

// phase one. the ice crescent (guarded), the ground burst of ice under 魂 (he leaps back)
blz.key(15.2, { lean: 0 }).key(15.35, { lean: -0.2 }).key(15.55, { lean: 0 });
crescentShot(film, { t: 15.4, from: [6.5, Y + 2.4, ZB + 0.3], to: [-2.6, Y + 2.4, ZH], dur: 0.3, r: 1.8, colors: ICEC });
B.guard(15.7, [-3, ZH], { back: 0.8, hold: 0.35 });
blz.key(16.2, { x: 8 }).key(16.4, { x: 2.5, ease: 'out' });
crystals(film, { t: 16.55, from: [1.5, -36.4], to: [-3.6, ZH], n: 7, h: 2.6, colors: ICE, y: Y, seed: 21 });
hero.key(16.6, { pose: 'overhead', x: -3.8, z: ZH, hop: 2.4 }).key(17.0, { x: -6, ease: 'linear' }).key(17.02, { pose: 'idle' }); S(16.6, 'leap');
// the red-flash cut: he lunges; 魂 shadow-steps behind him; the counter
B.tell(17.5, [1.6, Y + 4.6, -36.4], 'red');
B.shadowstep(17.62, [-6, ZH], [7.8, -36.4], { face: -1 });
blz.key(17.65, { x: 2.5 }).key(17.9, { x: -4, ease: 'out' });
slash(film, { t: 17.9, at: [-6.5, Y + 2.4, -36.0], radius: 3.6, width: 1.0, a0: 2.4, a1: -0.6, normal: [0, 0.2, 1], color: '#8fb2c2', core: '#eef6f8', sound: 'heavy' });
crystals(film, { t: 17.95, from: [-5, -35.6], to: [-9, -35.4], n: 5, h: 2.2, colors: ICE, y: Y, seed: 22, sound: null });
blz.key(18.2, { face: -1 }).key(18.3, { x: -4 }).key(18.55, { x: 2.6, ease: 'out' });
B.counter(18.6, [7.8, -36.4], [2.6, ZB], { face: -1, reach: 2.2 });
// the ice ring: "watch closely, I'll strike only once": a flat disc of ice spreads round him; 魂 vaults it and cuts down
blz.key(19.4, { jit: 0.08 }).key(20.1, { jit: 0.08 }).key(20.15, { jit: 0 });
S(19.4, 'chargeUp', { dur: 0.7 });
sawRing(film, { t: 20.1, at: [2.6, Y + 0.05, ZB], r0: 0.5, r1: 8, color: '#d6e8ee', width: 0.5, dur: 0.6, seed: 31 });
for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; crystals(film, { t: 20.15 + i * 0.02, from: [2.6 + Math.cos(a) * 2.5, ZB + Math.sin(a) * 1.4], to: [2.6 + Math.cos(a) * 6.5, ZB + Math.sin(a) * 3.2], n: 4, h: 2.4, colors: ICE, y: Y, life: 0.6, seed: 40 + i, sound: i ? null : 'ice' }); }
B.leapCut(20.05, [5.6, -36.4], [5.0, -36.3], [2.6, ZB]);
hero.key(20.05, { face: -1 });
// the leap: blue at the top; the slam deflected; the counter
blz.key(21.2, { x: 2.6, hop: 3.2 }).key(21.8, { x: 0.8, ease: 'linear' });
B.tell(21.45, [1.6, Y + 7.4, -36.6], 'blue');
B.deflect(21.8, [5.2, -36.4], [0.8, ZB], { face: -1 });
crystals(film, { t: 21.82, from: [0.2, -37.4], to: [-2.6, -36.4], n: 4, h: 2.0, colors: ICE, y: Y, seed: 45, sound: 'ice' });
B.counter(22.35, [5.2, -36.4], [0.8, ZB], { face: -1, reach: 1.6 });
hero.key(23.0, { pose: 'dodge', x: 3.6 }).key(23.3, { x: 7.4, ease: 'out' }).key(23.4, { pose: 'idle' });

// the change: the snow thickens, the island ices over
const P2T = B.phase(23.7, [0.8, ZB], 'p', { heroFrom: [7.4, -36.4], heroTo: [8.6, -36.4], kind: 'spike', crownColors: ICE, color: ['#8fb2c2', '#eef6f8', '#b8d3dc'], flash: '#d6e8ee' });
drift(film, { box: [-14, 18, Y, 12, -44, -30], n: 120, colors: ['#ffffff', '#eef2f4'], size: 0.14, wind: [-1.6, -0.9, 0.3], seed: 8, shape: 'flake' });
film.tint(P2T, { color: '#c8dce4', dur: 30, peak: 0.12 });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '风雪刀客 · 冰封', name: '三连斩', boss: true, seal: '冰', barColor: '#5a8aa0' });
// the triple slash: three waves of ice in a row. One guarded, one leapt, the third freezes him
const W0 = P2T + 2.1, HX = 8.6;
for (let i = 0; i < 3; i++) {
  const t = W0 + i * 0.6;
  blz.key(t - 0.12, { lean: 0 }).key(t, { lean: -0.2 }).key(t + 0.2, { lean: 0 });
  slash(film, { t, at: [2.2, Y + 2.4, -36.6], radius: 3.2, width: 0.9, a0: i % 2 ? 2.6 : -0.8, a1: i % 2 ? -0.8 : 2.6, normal: [0, 0.2, 1], color: '#8fb2c2', core: '#eef6f8', sound: 'slash' });
  crystals(film, { t: t + 0.05, from: [3, -36.6], to: [HX + 0.8, -36.2], n: 10, h: 2.8 + i * 0.5, step: 0.025, colors: ICE, y: Y, seed: 50 + i });
}
blz.key(W0 - 0.3, { face: -1 });
B.guard(W0 + 0.3, [HX, -36.4], { face: -1, back: -0.4, hold: 0.3 });
hero.key(W0 + 0.7, { pose: 'overhead', x: HX + 0.4, hop: 2.4 }).key(W0 + 1.05, { x: HX + 0.4, ease: 'linear' }).key(W0 + 1.07, { pose: 'idle' }); S(W0 + 0.7, 'leap');
hero.key(W0 + 1.4, { pose: 'hit', x: HX + 0.4 });
iceBlock(film, { t: W0 + 1.45, t1: W0 + 3.0, at: [HX + 0.4, Y, -36.4], h: 4.2, w: 2.6 });
film.at(W0 + 1.45, () => film.kick(0.8));
// frozen, he waits; the Blademaster walks in for the kill (the blue glint); 魂 bursts out of the ice into the deflect
blz.key(W0 + 1.9, { x: 2.2 }).key(W0 + 2.8, { x: 4.6, ease: 'linear' });
B.tell(W0 + 2.85, [5.4, Y + 4.8, -36.6], 'blue');
B.deflect(W0 + 3.0, [HX + 0.4, -36.4], [4.6, ZB], { face: -1 });
B.counter(W0 + 3.55, [HX + 0.4, -36.4], [4.6, ZB], { face: -1, reach: 1.4 });
// the red flash: the ice ring again, all at once; shadow-step; the last blue glint; the finisher
const R2 = W0 + 4.5;
blz.key(R2 - 0.4, { jit: 0.08 }).key(R2 + 0.2, { jit: 0 });
B.tell(R2, [4.6, Y + 5, -36.6], 'red');
B.shadowstep(R2 + 0.1, [7.6, -36.4], [-1.5, -36.4], { face: 1 });
sawRing(film, { t: R2 + 0.3, at: [4.6, Y + 0.05, ZB], r0: 0.5, r1: 9, color: '#d6e8ee', width: 0.5, dur: 0.6, seed: 61 });
for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; crystals(film, { t: R2 + 0.32, from: [4.6 + Math.cos(a) * 2.2, ZB + Math.sin(a) * 1.2], to: [4.6 + Math.cos(a) * 7, ZB + Math.sin(a) * 3.4], n: 4, h: 2.6, colors: ICE, y: Y, life: 0.6, seed: 70 + i, sound: i ? null : 'ice' }); }
blz.key(R2 + 0.8, { face: 1 });
B.counter(R2 + 1.0, [-1.5, -36.4], [4.6, ZB], { reach: 1.6 });
B.tell(R2 + 2.0, [3.6, Y + 4.6, -36.6], 'blue');
blz.key(R2 + 2.1, { x: 4.6 }).key(R2 + 2.3, { x: 3.0, ease: 'out' });
B.deflect(R2 + 2.3, [-0.6, -36.4], [3.0, ZB], { stagger: 0.55 });
const FIN = R2 + 3.0;
B.finisher(FIN, [-0.4, -36.4], [3.2, ZB], { face: 1 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
{ const V = film.voice;
  V(14.3, 'vo/fengxuedaoke_p1_line_04.wav');                                 // 击败我这具身躯，你能做到吗？
  V(18.65, 'vo/fengxuedaoke_hurt_01.wav');
  V(18.95, 'vo/fengxuedaoke_p1_line_05.wav');                                // before the ice ring: 看好了，我只出这一刀！
  V(22.7, 'vo/fengxuedaoke_p1_line_03.wav');                                 // 可惜不能与你多过几招！
  V(23.75, 'vo/fengxuedaoke_attack_01.wav');                                 // the change
  V(P2T + 1.1, 'vo/fengxuedaoke_p1_line_01.wav');                            // the snow thickens: 还不够，还不够！
  V(W0, 'vo/fengxuedaoke_attack_02.wav');
  V(W0 + 1.55, 'vo/fengxuedaoke_p1_line_06.wav');                            // 魂 frozen: 若你得胜，请替我斩尽那些魑魅魍魉！
  V(R2 + 1.1, 'vo/fengxuedaoke_hurt_02.wav');
  V(FIN + 0.6, 'vo/fengxuedaoke_p1_line_07.wav', { seg: 'squeeze' }); }    // falling: 替……晓风……报仇…… (v4: said whole; the outro waits)

const OUT = FIN + 5.4;
const camOutro = outro(film, hero, { t0: OUT, from: [0, -36], dur: 1.4, color: C.ground, nextColor: GROUNDS['07-prison'] });
hero.key(OUT, { y: Y }).key(OUT + 0.4, { y: 0, ease: 'in' });
for (const a of [qin, duan, you]) a.key(OUT, { rise: 0 });

// ---- camera ------------------------------------------------------------------------------------------------------------------------
function lerp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)); }
const duel = (t, o = {}) => ({ t, target: [3, Y + 2.8, -36.4], dist: 33, pitch: 26, yaw: 0, focus: [3, Y + 2.8, -36.6], ...o });
film.camera([
  { t: 12.9, target: [1, 5, -30], dist: 44, pitch: 24, yaw: 0, focus: [3, 4, -38] },
  { t: 14.05, target: [2, 4.5, -33], dist: 40, pitch: 24, yaw: 0, ease: 'linear', focus: [3, 4, -38] },
  // v4: the Blademaster turns, seen from the snow at his feet
  { t: 14.1, target: [7.4, Y + 3.6, -37], dist: 19, pitch: 6, yaw: -18, focus: [8, Y + 3.4, -37], ease: 'cut' },
  { t: 14.95, target: [7.6, Y + 3.8, -37], dist: 17, pitch: 7, yaw: -14, ease: 'linear', focus: [8, Y + 3.6, -37] },
  duel(15.0, { dist: 34, ease: 'cut' }),
  duel(17.3, { dist: 31, ease: 'linear', target: [0, Y + 2.8, -36.4] }),
  duel(18.2, { dist: 30, target: [2.5, Y + 3, -36.4] }),
  duel(20.0, { dist: 30, target: [4, Y + 3, -36.4] }),
  duel(23.2, { dist: 29, ease: 'linear', target: [3.5, Y + 3, -36.4] }),
  { t: P2T - 0.6, target: [1.5, Y + 3.6, -36.8], dist: 24, pitch: 26, yaw: -6, focus: [0.8, Y + 3.4, ZB] },
  { t: P2T + 1.4, target: [2, Y + 4, -36.8], dist: 28, pitch: 24, yaw: -6, ease: 'linear', focus: [0.8, Y + 3.6, ZB] },
  duel(W0, { dist: 32, target: [5, Y + 3, -36.4] }),
  duel(W0 + 1.5, { dist: 26, target: [7.5, Y + 3.2, -36.4] }),
  duel(W0 + 3.0, { dist: 28, ease: 'linear', target: [6.5, Y + 3, -36.4] }),
  duel(R2, { dist: 32, target: [3, Y + 3, -36.4] }),
  duel(FIN - 0.4, { dist: 27, target: [1.4, Y + 3, -36.4] }),
  // v4: the kill over 魂's shoulder (he is on the left), then in on the Blademaster's last words
  { t: FIN - 0.05, target: [0.8, Y + 3.0, -36.6], dist: 18, pitch: 13, yaw: -42, focus: [3.2, Y + 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [0.8, Y + 2.8, -36.6], dist: 16.5, pitch: 13, yaw: -38, ease: 'linear', focus: [3.2, Y + 2.6, -37] },
  duel(FIN + 1.25, { dist: 26, pitch: 28, target: [2.2, Y + 2.8, -36.4], ease: 'cut' }),
  duel(FIN + 5.0, { dist: 20, pitch: 24, ease: 'linear', target: [2.8, Y + 2.4, -36.6] }),
  ...camOutro,
]);
film.start();
