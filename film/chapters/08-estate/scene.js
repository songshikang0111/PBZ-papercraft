// 第八章 · 戏梦山庄 (Mirage Estate), v2. A night estate in a hollow of dark hills: pavilions with red pillars and black
// tiles, a pond of floating lanterns under a willow, the opera stage and the puppet screen. The film walks the estate's
// lane past the halberd puppet (玉鼎) and the red-shadow blade (囚锋), then climbs to the paved court before the gate,
// fires along its edges, where 雷当 the Tiger Cannon fights: the long red aim line and the far shot, the fanned barrage,
// the overhead slam, the leap and the cracked floor, the grab, the glowing cannon's one huge blast; then the One-Armed
// Tiger: the floor bursts into flame where he lands; his great move: he soars up, boulders crash down and stand all
// over the court; 魂 crouches behind a boulder while the slams come, the last a leap and a crushing drop that the
// boulder takes for him; then he comes over the top. ~44 s with hit-stops.
//
// PAPER SPEC
// BRIEF    ch.8: night estate of red pillars and black tiles, lantern pond, opera stage; a paved court with carved round
//          medallions, braziers; a tiger-head cannon; folded faceted boulders.
// PALETTE  ground #8f7f86; hills #3e3448 -> #7a6a86; court #7a2a24 / stone #8a7e7a; pond #4a4660; fire #e8602a /
//          #f2b84a; gold #c8a04a; shadow #140c1c; haze #5a4060
// LIGHT    night: rose key, violet fill, warm windows and braziers
// LIFE     embers and lantern-light petals
import { setupChapter, threads, threadBand, beats, elite, intro, outro, GROUNDS, MOODS, createActor, makeHero, slash, shards, rings, crown, drift, P2, THREE, clamp, lerp } from '../../common/kit.js';
import { makeTerrain } from '../../common/terrain.js';
import { paperBall, popBurst, sawRing, starburst, sparks, flameColumn, flameCard, boulder, aimLine, afterimage } from '../../common/fx.js';

const S0 = '/work/film/stickers/08-estate/', BOSS = '/work/boss-chibi/透明PNG/08 戏梦山庄/';
const C = { ground: GROUNDS['08-estate'], washA: '#82717a', washB: '#a09098', washC: '#76666e', lane: '#b0a0a4', court: '#8a7e7a', courtDark: '#5e5450', pond: '#4a4660', pondDeep: '#36324a', gold: '#c8a04a' };
const ESTATE = { key: '#ffb8a8', ki: 2.3, dir: [-0.8, 0.65, 0.45], fill: '#6a5aa8', fi: 1.25, sky: '#9888c8', skyG: '#4a3a68', si: 0.95, leak: '#3a2050', glow: 1.3, lamp: 7,
  post: { exposure: 1.0, tint: [1.02, 0.97, 1.01], saturation: 1.02, haze: '#5a4060', hazeStart: 40, hazeEnd: 125, hazeAmount: 0.38, vignette: 0.16, vignetteColor: '#140c1c', shadowTint: '#24142c' } };
const K = await setupChapter({
  id: '08-estate', ground: C.ground, duration: 42.6, moods: { ...MOODS, estate: ESTATE }, mood: 'estate', light: { leak: '#3a2050' },
  bounds: { x0: -46, x1: 46, z0: -54, z1: 34 },
  pieces: { stone: '#7a7078', stoneDark: '#4e464e', cap: null, bush: ['#3e4a44', '#4a4038'], bushDots: '#c0281c', tuft: ['#5a5a48', '#4e4a40'] },
  shadowInk: '#140c1c',
  stickers: {
    redgate: S0 + 'redgate.png', opera: S0 + 'opera.png', screen: S0 + 'puppetscreen.png', lamps: S0 + 'waterlanterns.png', stairs: S0 + 'stairs.png', willow: S0 + 'willow.png', cannon: S0 + 'tigercannon.png',
    lanterns: '/work/film/stickers/04-town/lanterns.png',
    yuding: BOSS + '01 偃月刀偶·玉鼎.png', qiufeng: BOSS + '02 赤影骨刃·囚锋.png', lei1: BOSS + '03 虎炮·雷当.png', lei2: BOSS + '04 雷当·独臂虎.png',
  },
});
const { H, film, IMG, rnd, between, mark, clear, sticker, rock, bush, tuft, stake, fill, house } = K;
const T = makeTerrain(K);

const COURT = { x: 3, z: -37, w: 26, d: 14 };
const POND = { x: -7, z: -6, rx: 6.5, rz: 4 };
const LANE = P2.pathLine([[2, -28], [3, -18], [1, -8], [4, 4], [1, 16], [2, 36]]);
const inner = (z) => 15 + Math.sin(z * 0.27) * 0.8;
const dist = (L, x, z) => { let d = 1e9; for (const [px, pz] of L.pts) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
const ELITES = [[-4, 12, -8], [7, -10, 9]];
const inSight = (x, z) => ELITES.some(([ex, ez, yaw]) => { const d = z - ez; if (d < -2.5 || d > 18) return false; return Math.abs(x - ex - d * Math.tan(yaw * Math.PI / 180)) < 4.5 + d * 0.35; });
const inPond = (x, z, k = 1) => ((x - POND.x) / (POND.rx * k)) ** 2 + ((z - POND.z) / (POND.rz * k)) ** 2 < 1;

H.printGround(({ g, ppu, X, Z, rnd: r, washes, torn, bandOf, water }) => {
  washes([C.washA, C.washB, C.washB, C.washC]);
  for (const s of [-1, 1]) { const pts = []; for (let z = 36; z >= -54; z -= 2) pts.push([s * (inner(z) - 1.2 + Math.sin(z * 0.7) * 0.6), z]); pts.push([s * 50, -54], [s * 50, 36]); torn(pts, P2.rgba('#5e4e60', 0.85)); }
  torn(bandOf(LANE.pts, 2.0), C.lane);
  const pond = Array.from({ length: 40 }, (_, i) => { const a = i / 40 * 6.283; return [POND.x + Math.cos(a) * POND.rx, POND.z + Math.sin(a) * POND.rz]; });
  water(pond, { colors: [C.pond, C.pondDeep], rim: '#a898a0', inset: 0.4, marks: 'ripples', markColor: P2.rgba('#ffc66a', 0.6), flow: 0.1 });
  // the court: square paving, carved round medallions
  torn([[COURT.x - COURT.w / 2, COURT.z + COURT.d / 2], [COURT.x + COURT.w / 2, COURT.z + COURT.d / 2], [COURT.x + COURT.w / 2, COURT.z - COURT.d / 2], [COURT.x - COURT.w / 2, COURT.z - COURT.d / 2]], C.court);
  g.strokeStyle = P2.rgba(C.courtDark, 0.6); g.lineWidth = 0.06 * ppu;
  for (let x = COURT.x - 13; x < COURT.x + 13; x += 2) for (let z = COURT.z - 7; z < COURT.z + 7; z += 2) g.strokeRect(X(x), Z(z), 2 * ppu, 2 * ppu);
  for (const [x, z] of [[-4, -35], [3, -38.5], [10, -35]]) { g.fillStyle = P2.rgba('#a89c96', 0.9); g.beginPath(); g.arc(X(x), Z(z), 1.8 * ppu, 0, 7); g.fill(); g.strokeStyle = P2.rgba(C.courtDark, 0.8); g.lineWidth = 0.1 * ppu; for (const rr of [1.4, 1.0, 0.5]) { g.beginPath(); g.arc(X(x), Z(z), rr * ppu, 0, 7); g.stroke(); } }
});

// ---- the hollow: dark hills each side, ranges in the night beyond ---------------------------------------------------------------------
const col = (i, n) => { const k = i / (n - 1); return { rock: P2.mix('#3e3448', '#7a6a86', k * 0.85), dark: P2.mix('#241c2c', '#4e4258', k * 0.85), moss: P2.mix('#3a4a40', '#6a7a6a', k * 0.8), pine: P2.mix('#1a2420', '#3e4a44', k * 0.7), mist: '#8a7a92' }; };
const ZL = [27, 16, 5, -6, -17, -28, -39], ZR = [22, 11, 0, -11, -22, -33, -44];
const wl = T.wings({ zs: ZL, side: -1, inner: (z) => -inner(z), w: (z, i) => 22 + i, h: (z, i) => 11 + i * 2.0, colors: (i) => col(i, 7), seed: 81, opts: { plateau: 0.55, spires: 0, pines: 1.4 } });
const wr = T.wings({ zs: ZR, side: 1, inner: (z) => inner(z), w: (z, i) => 22 + i, h: (z, i) => 11.5 + i * 2.0, colors: (i) => col(i, 7), seed: 87, opts: { plateau: 0.55, spires: 0, pines: 1.4 } });
T.range({ z: -58, x: 0, w: 160, h: 26, color: '#4a3e56', cap: '#6a5a76', seed: 81, peaks: 7 });

// ---- the estate: pavilions (red pillars, black tiles), the pond and its lanterns, the opera stage, the puppet screen ------------------------
const PAL = [{ wall: '#7a2a24', roof: '#1e1c22', timber: '#2a1a16', window: '#ffc66a', accent: '#c8a04a' }, { wall: '#d6ccc0', roof: '#24222a', timber: '#7a2a24', window: '#ffc66a', accent: '#c0281c' }, { wall: '#8a3a2a', roof: '#2a2830', timber: '#1a1412', window: '#ffd27a' }];
const KINDS = [{ w: 6.5, d: 4.5, wallH: 3.6, roofH: 2.6 }, { w: 4.2, d: 4.2, wallH: 4.6, roofH: 2.8 }, { w: 7.5, d: 4.5, wallH: 3.2, roofH: 2.4 }];
const HOUSES = [];
let sd = 90;
for (let z = 30; z > -24; z -= 4.2) for (const s of [-1, 1]) {
  const kind = KINDS[Math.floor(rnd() * KINDS.length)], x = s * between(8.5, 11), zz = z + between(-0.8, 0.8);
  if (inSight(x, zz) || inPond(x, zz, 1.4) || dist(LANE, x, zz) < kind.w / 2 + 2 || !clear(x, zz, -1.4)) continue;
  HOUSES.push(house(x, zz, { ...kind, yaw: s * between(0.1, 0.35), seed: sd += 2, col: PAL[Math.floor(rnd() * PAL.length)], group: zz < -20 ? 'field' : 'world' }));
}
for (const h of HOUSES) H.glowing(h.house.node);
sticker('opera', 9, { x: 10, z: -16, res: 1.3, flip: true, group: 'field' });
sticker('screen', 5, { x: -9, z: 3, res: 1.1 });
sticker('willow', 9, { x: -12, z: -10, res: 1.2 });
for (const [x, z] of [[-9, -5], [-5, -7.5], [-7, -3.5]]) sticker('lamps', 2.0, { x, z, stamp: true, res: 1.0 });
for (const [x, z, f] of [[-4, 24, false], [6, 6, true]]) if (!inSight(x, z)) sticker('lanterns', 5, { x, z, res: 1.1, flip: f });
for (const [x, z] of [[-5, 18], [6, 0], [-4, -16]]) H.lamp(x, 3, z, 0.9, 9);
const wAt = (w, u) => { const p = w.top[Math.round(u * (w.top.length - 1))]; return { h: w, at: [p[0], p[1] - 0.3] }; };
const foot = (w, dz, k = 1.5) => [w.cliff.side * (inner(w.cliff.z + dz) - k), 0.05, w.cliff.z + dz];
threadBand(film, { a: wAt(wl[1], 0.3), b: foot(wl[1], -7), n: 110, wA: 1.2, wB: 4.0, seed: 81 });
threadBand(film, { a: wAt(wr[3], 0.3), b: foot(wr[3], -7), n: 110, wA: 1.2, wB: 4.0, seed: 82 });
mark(-4, 12, 2.4); mark(7, -10, 2.4);
fill(200, [-14, 14, -26, 33], [rock, bush, tuft], (x, z) => Math.abs(x) < inner(z) - 1.5 && dist(LANE, x, z) > 2.6 && !inPond(x, z, 1.2) && !inSight(x, z), { per: [1, 3], size: [0.4, 0.7] });

// ---- the court before the gate (rises for the fight): the gate, the steps up to it, braziers, lantern poles ---------------------------------
const ARENA_T = 12.4, DS = 0.6;   // v4: the boss fight keeps its v3 times, shifted DS later (film.shift)
sticker('redgate', 13, { x: COURT.x, z: -47, res: 1.5, group: 'arena' });
sticker('stairs', 6, { x: COURT.x, z: -44, res: 1.2, group: 'arena' });
for (const [x, z, f] of [[-10, -43.5, false], [16, -43.5, true]]) sticker('lanterns', 5, { x, z, res: 1.1, group: 'arena', flip: f });
const braziers = new THREE.Group(), bflames = [];
for (const [x, z] of [[-11, -31], [-11, -42], [17, -31], [17, -42]]) {
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.5, 0.8, 8), new THREE.MeshLambertMaterial({ color: '#3a3034' })); bowl.position.set(x, 1.6, z); braziers.add(bowl);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.4, 6), new THREE.MeshLambertMaterial({ color: '#2a2024' })); leg.position.set(x, 0.7, z); braziers.add(leg);
  const f = flameCard(H, 1.8, { seed: Math.round(x * z) }); f.position.set(x, 2.0, z); braziers.add(f); bflames.push(f);
  H.lamp(x, 2.4, z, 1.0, 10);
}
H.scene.add(braziers);
film.every((t) => { const u = clamp((t - ARENA_T - DS - 0.5) / 0.5); braziers.scale.set(1, Math.max(0.001, u), 1); braziers.visible = u > 0; const tq = Math.floor(t * 12) / 12; bflames.forEach((f, i) => { f.lookAt(H.camera.position.x, f.position.y, H.camera.position.z); f.scale.set(1, 0.85 + 0.25 * Math.sin(tq * 9 + i * 2), 1); }); });

H.setHero(H.popup(null, null, { node: new THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-14, 18, 0.5, 9, -45, 30], n: 60, colors: ['#ffb04a', '#e8602a', '#ffd27a'], size: 0.13, wind: [0.3, 0.5, 0.2], seed: 4, shape: 'ember' });
drift(film, { box: [-14, 14, 1, 7, -26, 30], n: 30, colors: ['#e8c0c8', '#c890a0'], size: 0.2, wind: [0.6, -0.2, 0.3], seed: 5, shape: 'petal' });

// ---- actors -------------------------------------------------------------------------------------------------------------------------
const hero = makeHero(film, IMG);
const yuding = createActor(film, { name: 'yuding', poses: { p: IMG.yuding }, height: 5.4, x: -4, z: 12 });
const qiufeng = createActor(film, { name: 'qiufeng', poses: { p: IMG.qiufeng }, height: 5.0, x: 7, z: -10 });
const lei = createActor(film, { name: 'lei', poses: { p1: IMG.lei1, p2: IMG.lei2 }, height: 6.2, heights: { p2: 6.8 }, x: 9, z: -37, risen: true });
const FIRE = ['#a8231a', '#e8602a', '#f2b84a'], DUST = ['#8a7e72', '#5e544c', '#c8b8a0'];
const B = beats(film, hero, lei, { dust: DUST, sparks: ['#ffd27a', '#ffb04a', '#fff0c8'] });
const S = film.sound, ZB = -37, ZH = -36;
const muzzle = () => [lei.x - 2.2, 3.4, lei.z + 0.3];
const shot = (t, to, { dur = 0.35, aim = 0.6, big = false } = {}) => {
  aimLine(film, { t: t - aim, from: muzzle(), to: [to[0], 1.2, to[1]], dur: aim });
  lei.key(t - 0.05, { lean: 0 }).key(t, { lean: 0.18, ease: 'out' }).key(t + 0.4, { lean: 0 });
  starburst(film, { t, at: [lei.x - 2.6, 3.4, lei.z + 0.4], r: big ? 1.8 : 1.1, colors: FIRE, dur: 0.3, seed: Math.round(t * 7) });
  paperBall(film, { t, from: [lei.x - 2.4, 3.4, lei.z + 0.3], to: [to[0], 0.8, to[1]], dur, arc: 0.8, r: big ? 1.2 : 0.7, colors: FIRE, seed: Math.round(t * 5), sound: 'cannon' });
};

// ---- the estate lane --------------------------------------------------------------------------------------------------------------
const camIntro = intro(film, hero, { land: [2, 21], t1: 1.0 });
film.rise('world', 0.55, { from: [2, 21], speed: 42 });
film.rise('field', 0.55, { from: [2, 21], speed: 42, sound: false });
film.title({ t0: 1.0, dur: 3.0, name: '戏梦山庄', sub: '捌' }); S(1.0, 'title');
hero.hideBetween(1.9, ARENA_T + DS + 0.15);   // v4: 魂 off the page until the court
const E1 = 3.5, E2 = 6.9;
// 玉鼎 (偃月刀偶): the moon-blade glaive swept round in a half circle, the flagstones flipping up in a row along its path
elite(film, yuding, E1, { title: '十二号 · 偃月刀偶', name: '玉鼎', move: 'none', dur: 3.0 });
yuding.key(E1 + 0.7, { lean: 0.12 }).key(E1 + 1.0, { lean: -0.16, ease: 'out' }).key(E1 + 1.6, { lean: 0 });
slash(film, { t: E1 + 0.95, at: [-4, 1.6, 12.4], radius: 4.6, width: 1.2, a0: Math.PI, a1: 0, normal: [0, 1, 0.12], dur: 0.5, color: '#3a3a42', core: '#e8c060', sound: 'heavy' });
for (let i = 0; i < 9; i++) { const a = Math.PI - i / 8 * Math.PI; crown(film, { t: E1 + 1.0 + i * 0.04, at: [-4 + Math.cos(a) * 4.8, 0, 12.4 + Math.sin(a) * 2.4], n: 3, radius: 0.4, height: 1.1, colors: ['#8a7e72', '#5e544c', '#c8b8a0'], kind: 'spike', hold: 0.25, seed: 90 + i }); }
// 囚锋 (赤影骨刃): the bone blade thrust in a red streak, three red shadows of him left along the line
elite(film, qiufeng, E2, { title: '赤影骨刃', name: '囚锋', move: 'none', at: [7, -10], burst: ['#c0281c', '#8e1a14', '#e8e0d0'], dur: 3.0 });
qiufeng.key(E2 + 1.0, { x: 7, z: -10, lean: -0.12 }).key(E2 + 1.25, { x: 2.5, z: -7.5, ease: 'out', lean: 0.1 }).key(E2 + 1.9, { lean: 0 });
[0, 0.06, 0.12].forEach((dt, i) => afterimage(film, { t: E2 + 1.05 + dt, img: IMG.qiufeng, at: [lerp(7, 3.8, i / 2), lerp(-10, -8.2, i / 2)], height: 5.0, tint: '#c0281c', alpha: 0.6, dur: 0.5 }));
slash(film, { t: E2 + 1.15, at: [4, 2.6, -8.4], radius: 10, width: 0.55, a0: 1.78, a1: 1.36, normal: [0, 0, 1], dur: 0.35, color: '#5a0a0a', core: '#e8e0d0', sound: 'heavy' });
film.voice(E1 + 1.0, 'vo/yuding_attack_heavy_01.wav');
film.camera([
  ...camIntro,
  { t: 1.25, target: [2, 5, -6], dist: 64, pitch: 33, yaw: 4, focus: [0, 4, -6] },
  { t: 3.3, target: [1, 5, -11], dist: 58, pitch: 30, yaw: 1, ease: 'linear', focus: [0, 4, -11] },
  // 玉鼎 from above-front: the half moon and the row of flipping stones
  { t: E1 + 0.1, target: [-3.6, 2.6, 13], dist: 25, pitch: 36, yaw: -6, focus: [-4, 2.4, 12.4], ease: 'cut' },
  { t: E2 - 0.3, target: [-3.8, 2.6, 13], dist: 23, pitch: 34, yaw: -3, ease: 'linear', focus: [-4, 2.4, 12.4] },
  // 囚锋, low, the thrust coming across
  { t: E2 - 0.25, target: [5.6, 3.2, -8.5], dist: 21, pitch: 12, yaw: 14, focus: [6, 3, -9], ease: 'cut' },
  { t: E2 + 3.2, target: [4.4, 3.0, -8], dist: 22, pitch: 13, yaw: 10, ease: 'linear', focus: [4, 2.8, -8] },
  // the estate by night: the opera stage and the puppet screen, before the court rises
  { t: E2 + 3.3, target: [-5, 3.4, -5], dist: 34, pitch: 34, yaw: -12, focus: [-7, 2.5, -6], ease: 'cut' },
  { t: 12.6, target: [2, 3.6, -12], dist: 36, pitch: 30, yaw: -4, ease: 'linear', focus: [4, 3, -16] },
]);
film.shift(DS);   // ---- from here on: the v3 boss fight, DS later

// ---- the court -----------------------------------------------------------------------------------------------------------------------
film.rise('arena', ARENA_T, { from: [COURT.x, -40], speed: 26 });
film.rise('field', ARENA_T - 0.1, { from: [2, -20], speed: 40, open: 0 });
hero.key(12.6, { hidden: false, pose: 'run', x: 1, z: -25, face: 1, rise: 1 }).key(13.8, { x: -3, z: ZH, ease: 'linear' }).key(13.82, { pose: 'idle' });
S(12.65, 'steps', { dur: 1.2 });
lei.key(0, { hidden: true, y: 14 }).key(13.7, { hidden: false }).key(14.1, { y: 0, ease: 'in' });
film.at(14.1, () => film.kick(1.2)); S(14.1, 'land', { size: 1.2 });
popBurst(film, { t: 14.1, at: [9, 0, ZB], r: 3.0, colors: DUST, crumple: 10, seed: 7, sound: 'boom' });
film.plate({ t0: 14.5, dur: 2.4, title: '戏梦山庄', name: '虎炮 · 雷当', boss: true, seal: '首' });

// phase one. the far shot down a long red aim line: 魂 sidesteps, the shell bursts where he stood
shot(15.7, [-3, ZH]);
hero.key(15.6, { pose: 'dodge', x: -3, z: ZH }).key(15.85, { x: -4.2, z: -33.6, ease: 'out' }).key(15.95, { pose: 'idle' });
// the barrage: three aim lines fanned, a volley; the first guarded (heavy), the others burst round him
for (const [k, dz] of [-1.6, 0, 1.6].entries()) aimLine(film, { t: 16.5 + k * 0.08, from: muzzle(), to: [-4, 1.2, -34.2 + dz], dur: 0.7 });
for (const [k, dz] of [-1.6, 0, 1.6].entries()) paperBall(film, { t: 17.25 + k * 0.12, from: [lei.x - 2.4, 3.4, lei.z + 0.3], to: [-4 + (k - 1) * 2.4, 0.8, -34.2 + dz], dur: 0.32, arc: 1, r: 0.6, colors: FIRE, seed: 20 + k, sound: k ? null : 'cannon' });
lei.key(17.2, { lean: 0.2, ease: 'out' }).key(17.7, { lean: 0 });
B.guard(17.55, [-4.2, -33.6], { back: 0.8, heavy: true, hold: 0.45 });
hero.key(18.1, { x: -5, z: -33.6 }).key(18.4, { x: -4, z: ZH });
// the overhead slam: he closes, raises the tiger head (blue glint), drives it down; deflected; the counter
lei.key(18.5, { x: 9 }).key(18.8, { x: 2.2, ease: 'out' });
lei.key(18.95, { lean: -0.25 });
B.tell(19.1, [2.6, 7.4, -36.6], 'blue');
lei.key(19.25, { lean: 0.15, ease: 'in' }).key(19.6, { lean: 0 });
B.deflect(19.25, [-4, ZH], [2.2, ZB]);
popBurst(film, { t: 19.3, at: [0.6, 0, -36.2], r: 2.4, colors: DUST, crumple: 6, seed: 25, sound: 'thud' });
B.counter(19.8, [-4, ZH], [2.2, ZB]);
// the leap and the cracked floor: he leaps back and lands with a glowing crack spreading (魂 leaps back too)
lei.key(20.6, { x: 2.2, hop: 3.4 }).key(21.2, { x: 1, ease: 'linear' });
hero.key(20.9, { pose: 'overhead', x: -1.8, hop: 2 }).key(21.3, { x: -5.6, ease: 'linear' }).key(21.32, { pose: 'idle' });
sawRing(film, { t: 21.2, at: [1, 0.04, ZB], r0: 0.4, r1: 6, color: '#ff8a3a', width: 0.7, dur: 0.6, seed: 31 });
popBurst(film, { t: 21.2, at: [1, 0, ZB], r: 3.2, colors: FIRE, crumple: 8, seed: 32, sound: 'boom' }); film.at(21.2, () => film.kick(1.1));
// the grab: the red flash; 魂 shadow-steps behind him; the point-blank orb goes off on nothing; the counter
lei.key(21.9, { x: 1 }).key(22.15, { x: -1.4, ease: 'out' });
B.tell(22.1, [-0.8, 4.6, -36.4], 'red');
B.shadowstep(22.25, [-5.6, ZH], [5.2, -36.4], { face: -1 });
popBurst(film, { t: 22.5, at: [-4.8, 0.5, ZH], r: 2.4, colors: FIRE, crumple: 6, seed: 33, sound: 'boom' });
lei.key(22.6, { face: -1 });
B.counter(22.8, [5.2, -36.4], [-1.4, ZB], { face: -1, reach: 2.2 });
// the glowing cannon: he leaps far back, the cannon glows red (a red star held), one huge blast; guarded heavy, 魂 skids far
lei.key(23.6, { x: -1.4, hop: 3.6 }).key(24.2, { x: -8, ease: 'linear' }).key(24.2, { face: 1 });
const BIG = 25.0;
starburst(film, { t: BIG - 0.6, at: [-5.4, 3.4, -36.7], r: 1.5, colors: FIRE, dur: 0.6, seed: 41, sound: 'chargeUp' });
aimLine(film, { t: BIG - 0.6, from: [-5.6, 3.4, -36.7], to: [3, 1.6, -36.4], dur: 0.6 });
paperBall(film, { t: BIG, from: [-5.6, 3.4, -36.7], to: [2.5, 2, -36.4], dur: 0.22, arc: 0.2, r: 1.4, colors: FIRE, seed: 42, sound: 'cannon', burst: false });
lei.key(BIG, { lean: -0.2, ease: 'out' }).key(BIG + 0.5, { lean: 0 });
B.guard(BIG + 0.2, [2.6, -36.4], { face: -1, back: -3, heavy: true, hold: 0.6 });
popBurst(film, { t: BIG + 0.2, at: [3.4, 0, -36.4], r: 3.4, colors: FIRE, crumple: 12, seed: 43, sound: 'boom' }); film.at(BIG + 0.2, () => film.kick(1.4));

// the change: the One-Armed Tiger
const P2T = B.phase(26.0, [-8, ZB], 'p2', { heroFrom: [5.6, -36.4], heroTo: [7, -36.4], kind: 'flame', crownColors: FIRE, color: FIRE, flash: '#ff8a3a' });
film.plate({ t0: P2T + 1.6, dur: 2.4, title: '雷当 · 第二形态', name: '独臂虎', boss: true, seal: '虎', barColor: '#c0481c' });
// the leap: the floor bursts into flame where he lands (guarded)
const W0 = P2T + 2.0;
lei.key(W0, { x: -8, hop: 3.4, face: 1 }).key(W0 + 0.55, { x: 1.5, ease: 'linear' });
flameColumn(film, { t: W0 + 0.55, at: [1.5, 0, ZB], h: 7, r: 1.2, n: 14, dur: 0.9, colors: FIRE, seed: 51 });
popBurst(film, { t: W0 + 0.55, at: [1.5, 0, ZB], r: 3, colors: FIRE, crumple: 8, seed: 52, sound: 'boom' });
B.guard(W0 + 0.6, [7, -36.4], { face: -1, back: -0.8, heavy: true, hold: 0.45 });
// his great move: he soars up ("you won't escape this move"), boulders crash down and stand all over the court
const SO = W0 + 1.5;
lei.key(SO, { y: 0, x: 1.5 }).key(SO + 0.6, { y: 14, ease: 'out' });
S(SO, 'leap'); S(SO + 0.1, 'line_leidang');
const ROCKS = [[-6, -39, 41], [12, -40.5, 42], [4.5, -34.4, 43], [-3, -33.6, 44], [9, -33.8, 45], [0, -41, 46]];
ROCKS.forEach(([x, z, s], i) => boulder(film, { t: SO + 0.5 + i * 0.18, at: [x, 0, z], size: [2.4 + (i % 2) * 0.8, 3.0 + (i % 3) * 0.6, 2.2], until: i === 2 ? SO + 4.6 : 1e9, seed: s }));
// 魂 runs to the boulder at (4.5, -34.4) and crouches behind it (camera side)
hero.key(SO + 1.4, { pose: 'run', x: 7, z: -36.4, face: -1 }).key(SO + 1.9, { x: 5.2, z: -32.2, ease: 'out' }).key(SO + 1.92, { pose: 'crouch', face: -1 });
// the slams: he drops, slams twice (shockwaves roll over the court, the boulders take them), leaps high, crushes down
lei.key(SO + 2.0, { y: 14, x: -1 }).key(SO + 2.3, { y: 0, ease: 'in' });
for (const [k, t] of [SO + 2.3, SO + 3.0].entries()) {
  if (k) lei.key(t - 0.3, { lean: -0.25 }).key(t, { lean: 0.15, ease: 'in' }).key(t + 0.3, { lean: 0 });
  popBurst(film, { t, at: [-1, 0, ZB], r: 3.4, colors: FIRE, crumple: 8, seed: 60 + k, sound: 'boom' }); sawRing(film, { t, at: [-1, 0.04, ZB], r0: 1, r1: 12, color: '#ff8a3a', width: 0.6, dur: 0.7, seed: 62 + k });
  film.at(t, () => film.kick(1.2)); sparks(film, { t: t + 0.15, at: [4.5, 1.8, -34], dir: 0, n: 16, seed: 64 + k, sound: 'clang' });
}
lei.key(SO + 3.4, { y: 0, x: -1, hop: 6 }).key(SO + 4.4, { x: 3.6, ease: 'linear' });
B.tell(SO + 3.9, [1.4, 13, -36.6], 'red');
const CR = SO + 4.4;
popBurst(film, { t: CR, at: [3.6, 0, ZB], r: 4.6, colors: FIRE, crumple: 14, seed: 70, sound: 'boom' }); film.at(CR, () => film.kick(1.8));
for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; flameColumn(film, { t: CR + 0.05 + i * 0.04, at: [3.6 + Math.cos(a) * 6, 0, ZB + Math.sin(a) * 3.5], h: 8, r: 0.9, n: 12, dur: 1.0, colors: FIRE, seed: 71 + i, sound: i ? null : 'pillar' }); }
// the boulder takes it and breaks; 魂 comes up over the shards with the overhead cut
B.leapCut(CR + 0.5, [5.2, -32.2], [6.2, -36.3], [3.6, ZB]);
hero.key(CR + 0.5, { face: -1 });
// the last: the blue glint as he swings the tiger head round; the deflect; the finisher
B.tell(CR + 1.6, [2.4, 4.8, -36.6], 'blue');
lei.key(CR + 1.7, { x: 3.6, face: 1 }).key(CR + 1.9, { x: 4.2, ease: 'out' });
B.deflect(CR + 1.9, [8.4, -36.4], [4.2, ZB], { face: -1, stagger: 0.55 });
const FIN = CR + 2.6;
B.finisher(FIN, [8.2, -36.4], [4.4, ZB], { face: -1 });

// ---- voices (tools/mix.py places them; each line in its own phase, on its move) ----------------------------------------------
{ const V = film.voice;
  V(14.25, 'vo/leidang_p1_line_01.wav');                                     // P1 entry: 来得好！
  V(19.9, 'vo/leidang_p1_line_02.wav');                                      // after the counter: 痛快，痛快！
  V(22.0, 'vo/leidang_attack_01.wav'); V(BIG - 1.1, 'vo/leidang_p1_line_04.wav');   // the glowing cannon: 来吧！
  V(26.4, 'vo/leidang_p2_line_01.wav');                                      // the change: 哼，实在是失望！                                     // the change: 哼，实在是失望！
  V(SO - 0.3, 'vo/leidang_ultimate_line_01.wav');                                  // his great move: 这一招，你避无可避！
  V(CR + 0.1, 'vo/leidang_p2_line_02.wav', { cap: 6.2 });                    // the crush: 天地万物，皆归尘土！
  V(FIN + 0.45, 'vo/leidang_death_01.wav'); }

const OUT = FIN + 3.2;
const camOutro = outro(film, hero, { t0: OUT, from: [7.5, -36], dur: 1.4, color: C.ground, nextColor: GROUNDS['09-mountain'] });
for (const a of [yuding, qiufeng]) a.key(OUT, { rise: 0 });

// ---- camera -----------------------------------------------------------------------------------------------------------------------
const duel = (t, o = {}) => ({ t, target: [2, 2.8, -36.4], dist: 33, pitch: 27, yaw: 0, focus: [2, 2.8, -36.6], ...o });
film.camera([
  { t: 12.9, target: [2, 5, -33], dist: 44, pitch: 25, yaw: 0, focus: [3, 4, -40] },
  { t: 13.6, target: [2.5, 4.5, -34], dist: 40, pitch: 25, yaw: 0, ease: 'linear', focus: [3, 4, -40] },
  // v4: 雷当 drops in, seen from the court floor
  { t: 13.65, target: [8.4, 3.8, -37], dist: 20, pitch: 6, yaw: -18, focus: [9, 3.6, -37], ease: 'cut' },
  { t: 14.95, target: [8.6, 4.0, -37], dist: 18, pitch: 7, yaw: -14, ease: 'linear', focus: [9, 3.8, -37] },
  duel(15.0, { dist: 35, ease: 'cut' }),
  duel(17.6, { dist: 33, ease: 'linear', target: [0, 3, -36] }),
  duel(18.6, { dist: 30, target: [0, 3, -36.4] }),
  duel(21.0, { dist: 32, target: [0, 3, -36.4] }),
  duel(23.4, { dist: 34, target: [0, 3, -36.4] }),
  duel(25.4, { dist: 34, ease: 'linear', target: [0, 3, -36.4] }),
  { t: P2T - 0.6, target: [-6, 3.8, -36.8], dist: 25, pitch: 26, yaw: 6, focus: [-8, 3.6, ZB] },
  { t: P2T + 1.4, target: [-5.5, 4.2, -36.8], dist: 26, pitch: 25, yaw: 6, ease: 'linear', focus: [-8, 3.8, ZB] },
  duel(W0, { dist: 33, target: [1.5, 3, -36.4] }),
  duel(SO + 0.4, { dist: 44, pitch: 24, target: [2, 6, -37] }),
  duel(SO + 2.0, { dist: 38, pitch: 25, ease: 'linear', target: [2.5, 4, -36] }),
  duel(CR, { dist: 38, pitch: 25, target: [3, 4, -36] }),
  duel(FIN - 0.4, { dist: 27, target: [6.2, 3, -36.4] }),
  // v4: the kill over 魂's shoulder (he is on the right), then wide for the stamp
  { t: FIN - 0.05, target: [6.6, 3.0, -36.6], dist: 18, pitch: 13, yaw: 42, focus: [4.4, 3, -37], ease: 'cut' },
  { t: FIN + 1.2, target: [6.6, 2.8, -36.6], dist: 16.5, pitch: 13, yaw: 38, ease: 'linear', focus: [4.4, 2.6, -37] },
  duel(FIN + 1.25, { dist: 27, pitch: 30, target: [6.2, 2.8, -36.4], ease: 'cut' }),
  duel(FIN + 2.6, { dist: 29, pitch: 31, ease: 'linear', target: [6.4, 2.8, -36.4] }),
  ...camOutro,
]);
film.start();
