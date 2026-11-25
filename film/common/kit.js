// Chapter kit: everything a chapter shares on top of film.js. setupChapter() builds the harness + film with the
// chapter's palette and light, loads its stickers, fonts and boss cards; then the helpers place pieces (stickers,
// procedural rocks / bushes / tufts / posts / stakes, 3D box houses), stretch RED THREADS between cards (3D cords that
// follow the cards as they rise), run the standard beats of a fight, and make the slide-down transitions between
// chapters (the paper colour shifts to the next region, 魂 runs down into it, folds away, the new title rises).
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { boxFold, paperMaterial } from 'papercraft/lib/paperkit-3d.js';
import { FlapSpring } from 'papercraft/lib/paper-motion.js';
import { createHarness, MOODS } from 'papercraft/templates/popup-3d/harness.js';
import { createFilm, createActor, imagePiece, loadImage, loadFont, slash, shards, rings, crown, drift, clamp, smooth, easeOut, easeIn, lerp, lerp3 } from './film.js';
import { starburst, sparks as fxSparks, scraps, sawRing, popBurst, glint } from './fx.js';

export { THREE, P2, MOODS, createActor, slash, shards, rings, crown, drift, clamp, smooth, easeOut, easeIn, lerp, lerp3 };

export const ST = '/work/film/stickers/';
const CAL = '/work/film/art/calligraphy/';
// v4 chapter titles: [the chapter's most telling game title, the place name in the game's type, layout]
export const TITLE_ART = {
  '01-valley': ['章节原图/03_逆流而上.png', '地点名_用游戏字库排版/01_悲泣溪谷.png', 'right'],
  '02-forest': ['章节原图/05_林中血，镜中蛇.png', '地点名_用游戏字库排版/02_血色森林.png', 'right'],
  '03-village': ['章节原图/07_失心村.png', '地点名_用游戏字库排版/03_陆家村.png', 'right'],
  '04-town': ['章节原图/08_死镇.png', '地点名_用游戏字库排版/04_庞镇.png', 'right'],
  '05-camp': ['章节原图/06_英雄？罪人？.png', '地点名_用游戏字库排版/05_正道大营.png', 'right'],
  '06-lake': ['章节原图/10_湖.png', '地点名_用游戏字库排版/06_梅谷湖.png', 'center'],
  '07-prison': ['章节原图/11_监禁与背叛.png', '地点名_用游戏字库排版/07_枷笼山.png', 'right'],
  '08-estate': ['章节原图/12_破局.png', '地点名_用游戏字库排版/08_戏梦山庄.png', 'right'],
  '09-mountain': ['章节原图/13_断魂.png', '地点名_用游戏字库排版/09_断魂山.png', 'center'],
};
export const HERO_POSES = ['idle', 'run', 'slash', 'overhead', 'parry', 'dodge', 'hit', 'finisher', 'deflect', 'counter', 'crouch'];
// region ground colours, in film order: a chapter's outro slides into the next one's
export const GROUNDS = { '00-prologue': '#a7a493', '01-valley': '#a9a895', '02-forest': '#b39a86', '03-village': '#b9a888', '04-town': '#9c8578',
  '05-camp': '#b3a487', '06-lake': '#a3aba3', '07-prison': '#959d92', '08-estate': '#8f7f86', '09-mountain': '#c4c8cf', end: '#d9d2c2' };

/**
 * setupChapter({ id, palette, ground, stock, light, lens, mood, moods, bounds, view, stickers: { key: path }, duration })
 * -> { H, film, IMG, C, rnd, between, ... helpers }. Stickers are loaded (missing ones warn and are skipped).
 */
export async function setupChapter(o) {
  await Promise.all([loadFont('MaShanZheng', '/work/film/fonts/MaShanZheng-Regular.ttf'), loadFont('ZhiMangXing', '/work/film/fonts/ZhiMangXing-Regular.ttf'),
    loadFont('PBZName', '/work/film/art/fonts/boss_nameplate_ZH_ZiKuTangKuangShanKaiShuJF.ttf').catch(() => null), loadFont('PBZSub', '/work/film/art/fonts/subtitles_AaGuDianKeBenSong-2.ttf').catch(() => null)]);
  const want = { ...o.stickers };
  for (const p of HERO_POSES) want['hero-' + p] = ST + `hero/hero-${p}.png`;
  const IMG = {};
  await Promise.all(Object.entries(want).map(([k, v]) => loadImage(v).then((im) => { IMG[k] = im; }).catch(() => console.warn('missing sticker', k, v))));
  const H = createHarness({ ground: o.ground, stock: o.stock ?? '#f1efe6', bounds: o.bounds ?? { x0: -60, x1: 60, z0: -52, z1: 34 }, heroHeight: 3.6,
    view: { fov: 26, pitch: 44, dist: 70, target: [0, 2, -6], yaw: 0 }, light: { shadowExtent: 46, mapSize: 4096, distance: 110, ...o.light }, lens: { maxBlur: 16, focusBand: 0.3, ...o.lens },
    moods: o.moods ?? MOODS, mood: o.mood ?? null, subject: [0, -8] });
  const film = createFilm(H, { duration: o.duration ?? 36, fps: 30, shadowBox: o.shadowBox ?? 50 });
  // v4: the game's calligraphy for the chapter title and the kill stamp; the voice lengths for timing beats on lines
  const TA = TITLE_ART[o.id];
  if (TA) await Promise.all([loadImage(CAL + TA[0]), loadImage(CAL + TA[1]), loadImage(CAL + '斩杀/斩_原图转白.png')])
    .then(([main, place, zhan]) => { film.titleArt = { main, place, layout: TA[2] }; film.stampArt = zhan; }).catch((e) => console.warn('calligraphy', e));   // whiteStamp: the white 斩 on red grounds
  const VL = await fetch('/film/common/vo-lengths.json').then((r) => r.json()).catch(() => ({}));
  /** the trimmed length (s) of a voice clip of this chapter as mix.py will play it (seg: a phrase index or 'squeeze') */
  film.vlen = (file, seg) => { const e = VL[(file.startsWith('../') ? file.slice(3) : o.id + '/' + file)]; if (!e) { console.warn('no length for', file); return 3; } return seg === 'squeeze' ? e.squeeze : typeof seg === 'number' ? e.seg[Math.min(seg, e.seg.length - 1)] : e.len; };
  const K = makeKit(H, film, IMG, o);
  return { H, film, IMG, ...K };
}

function makeKit(H, film, IMG, o) {
  const rnd = P2.rng(o.seed ?? 101), between = (a, b) => a + rnd() * (b - a);
  const keep = [];
  const mark = (x, z, r) => keep.push([x, z, r]);
  const clear = (x, z, m = 0, extra = null) => keep.every(([kx, kz, r]) => Math.hypot(x - kx, z - kz) > r + m) && (!extra || extra(x, z));
  /** add a hinge to a named group (default 'world'): the group stays flat until film.rise(group, t) */
  const put = (h, group = 'world') => { if (h) film.add(group, h); return h; };
  const pieceCache = new Map();
  /** a sticker card: one print per (name, height), stamped on every copy. o: popup options + group, stamp, flip */
  function sticker(name, height, op = {}) {
    if (!IMG[name]) return null;
    const key = name + ':' + height + ':' + !!op.flip;
    if (!pieceCache.has(key)) { const [pts, paint, size] = imagePiece(IMG[name], height, { flipX: !!op.flip }); pieceCache.set(key, { pts, paint, mats: null, size }); }
    const pc = pieceCache.get(key), { group = 'world', stamp = false, flip, ...po } = op;
    let h;
    if (stamp) { pc.mats ??= H.printed(pc.pts, pc.paint, { res: po.res ?? 1 }); h = H.popup(pc.pts, null, { materials: pc.mats, ...po }); }
    else h = H.popup(pc.pts, pc.paint, { res: 1, ...po });
    h.size2 = pc.size; h.card = h.pivot.children[0];
    if (op.mark !== false) mark(op.x ?? 0, op.z ?? 0, pc.size.w * (op.scale ?? 1) * 0.42);
    return put(h, group);
  }
  // ---- procedural pieces: printed once per variant, stamped
  const mound = (w, h, lobes = 6, depth = 0.16) => P2.shape.mound(rnd, { w, h, lobes, depth });
  const peak = (w, h, lean = 0.2) => { const p = [[w / 2, 0]]; for (let i = 1; i < 28; i++) { const t = i / 28, x = w / 2 - t * w, k = Math.min(1, Math.abs(x / (w / 2) - lean)); p.push([x, h * (1 - Math.pow(k, 1.6)) * (0.95 + 0.05 * Math.sin(t * 11))]); } p.push([-w / 2, 0]); return p; };
  const shadowInk = o.shadowInk ?? '#1c2622';
  const paintRock = (col, cap) => (P) => {
    const { box } = P;
    P.gradient(P2.shade(col, 0.14), P2.shade(col, -0.12), 0.5); P.felt(0.4);
    P.layer((gg) => { gg.fillStyle = P2.shade(col, -0.25); gg.beginPath(); gg.moveTo(box.x0 + box.w * 0.55, box.y1); gg.lineTo(box.x1 + 0.1, box.y0 - 0.1); gg.lineTo(box.x0 + box.w * 0.4, box.y0 - 0.1); gg.closePath(); gg.fill(); }, P2.shade(col, -0.25), { lip: 0.7 });
    if (cap) P.layer((gg) => { gg.fillStyle = cap; gg.beginPath(); gg.ellipse(box.x0 + box.w * 0.42, box.y1 - box.h * 0.05, box.w * 0.36, box.h * 0.17, -0.1, 0, 7); gg.fill(); }, cap);
    P.marks('tick', { color: P2.shade(col, -0.45), alpha: 0.35, size: 0.05, angle: 0.9 });
    P.innerShade(shadowInk, { alpha: 0.35, blurPx: 8 });
  };
  const paintBush = (col, dots) => (P) => {
    const { box } = P;
    P.gradient(P2.shade(col, 0.1), P2.shade(col, -0.15)); P.felt(0.4);
    P.layer((gg) => { for (let i = 0; i < 9; i++) { const x = box.x0 + box.w * (0.12 + i * 0.1), y = box.y0 + box.h * (0.35 + 0.35 * Math.sin(i * 1.7) ** 2); gg.beginPath(); gg.ellipse(x, y, box.w * 0.07, box.h * 0.13, 0.3, 0, 7); gg.fill(); } }, P2.shade(col, 0.22));
    if (dots) P.marks('dot', { color: dots, alpha: 0.55, size: 0.04, density: 0.4 });
    P.innerShade(shadowInk, { alpha: 0.3, blurPx: 8 });
  };
  const paintTuft = (col) => (P) => { P.gradient(P2.shade(col, 0.18), P2.shade(col, -0.2)); P.marks('hatch', { color: P2.shade(col, -0.4), alpha: 0.35, size: 0.06, angle: 0.2 }); P.innerShade(shadowInk, { alpha: 0.25, blurPx: 6 }); };
  const VAR = {};
  const variant = (kind, i, make) => { const k = kind + i; if (!VAR[k]) { const [pts, paint] = make(); VAR[k] = { pts, mats: H.printed(pts, paint) }; } return VAR[k]; };
  const P = o.pieces ?? {};
  const pal = { stone: '#8d8f86', stoneDark: '#5f625c', cap: '#7d8a5e', bush: ['#7d8a5e', '#5d6b46'], bushDots: '#c9b46a', tuft: ['#7f8c5a', '#99996a'], ...P };
  const rock = (x, z, s = 1, group = 'world') => { const v = variant('rock', Math.floor(rnd() * 5), () => { const w = between(3.2, 4.6); return [P2.roughen(mound(w, w * 0.55, 4, 0.12), rnd), paintRock(P2.shade(pal.stone, (rnd() - 0.5) * 0.15), pal.cap)]; }); return put(H.popup(v.pts, null, { materials: v.mats, x, z, scale: s }), group); };
  const spire = (x, z, s = 1, group = 'world') => { const v = variant('spire', Math.floor(rnd() * 4), () => { const h = between(4, 6.5); return [peak(h * 0.5, h, 0.3 + rnd() * 0.2), paintRock(P2.shade(pal.stoneDark, (rnd() - 0.3) * 0.2), pal.cap)]; }); return put(H.popup(v.pts, null, { materials: v.mats, x, z, scale: s, yaw: (rnd() - 0.5) * 0.5 }), group); };
  const bush = (x, z, s = 1, group = 'world') => { const v = variant('bush', Math.floor(rnd() * 4), () => { const w = between(3.5, 5); return [P2.roughen(mound(w, w * 0.42, 7, 0.2), rnd), paintBush(pal.bush[Math.floor(rnd() * pal.bush.length)], pal.bushDots)]; }); return put(H.popup(v.pts, null, { materials: v.mats, x, z, scale: s, sway: 0.3 }), group); };
  const tuft = (x, z, s = 1, group = 'world') => { const v = variant('tuft', Math.floor(rnd() * 4), () => [P2.shape.mound(rnd, { w: 2.6, h: 1.8, lobes: 9, depth: 0.45 }), paintTuft(pal.tuft[Math.floor(rnd() * pal.tuft.length)])]); return put(H.popup(v.pts, null, { materials: v.mats, x, z, scale: s, sway: 0.7 }), group); };
  /** a wooden stake (a peg for red threads): returns the hinge; its card's top is at y = h */
  const stake = (x, z, h = 2.2, group = 'world', col = '#5e5045') => {
    const v = variant('stake' + h, 0, () => [P2.fromDrawing((g) => { g.fillRect(-0.22, 0, 0.44, h - 0.2); g.beginPath(); g.moveTo(-0.22, h - 0.21); g.lineTo(0, h); g.lineTo(0.22, h - 0.21); g.fill(); g.fillRect(-0.32, h * 0.55, 0.64, 0.22); }, { w: 1, h: h + 0.1, name: 'stake' }),
      (Pp) => { Pp.fill(col); Pp.draw((g) => { g.fillStyle = '#b3231a'; g.fillRect(-0.4, h * 0.55, 0.8, 0.22); }); Pp.marks('hatch', { color: '#1c1410', alpha: 0.3, size: 0.05 }); Pp.innerShade('#1c1410', { alpha: 0.3, blurPx: 4 }); }]);
    const hh = put(H.popup(v.pts, null, { materials: v.mats, x, z }), group); hh.card = hh.pivot.children[0]; hh.top = h; return hh;
  };
  /**
   * fill(n, area, kinds, ok): groups of different low pieces scattered over area [x0, x1, z0, z1] wherever ok(x, z)
   * and the marked keep-outs allow. kinds: functions (x, z, s) => hinge.
   */
  function fill(n, area, kinds, ok = () => true, { group = 'world', size = [0.55, 1.0], per = [3, 6] } = {}) {
    for (let i = 0; i < n; i++) {
      const x = between(area[0], area[1]), z = between(area[2], area[3]);
      if (!clear(x, z, 0.2, ok)) continue;
      const m = per[0] + Math.floor(rnd() * (per[1] - per[0] + 1));
      for (let k = 0; k < m; k++) {
        const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 3;
        if (!clear(px, pz, 0, ok)) continue;
        const kind = kinds[Math.floor(rnd() * kinds.length)];
        kind(px, pz, between(size[0], size[1]), group); mark(px, pz, 1.0);
      }
    }
  }
  /**
   * A 3D box house (the kit's boxFold: front wall, two gables, a pitched roof, folding up in order) printed for this
   * world: timber framing over plaster, a door, lattice windows, a tile roof. col: { wall, timber, roof, door, accent }
   */
  function house(x, z, { w = 6, d = 4, wallH = 3.2, roofH = 2.2, yaw = 0, col = {}, group = 'world', lanterns = true, seed = 5 } = {}) {
    const c = { wall: '#d6cdb8', timber: '#4a3a2e', roof: '#4d4f52', door: '#3a2a20', accent: '#b3231a', window: '#e8d9a8', ...col };
    const front = (Pp) => {
      const { box, g } = Pp; Pp.fill(c.wall); Pp.felt(0.5);
      Pp.layer((gg) => { gg.fillRect(box.x0, box.y0, box.w, 0.35); gg.fillRect(box.x0, box.y1 - 0.3, box.w, 0.3); for (const fx of [0.02, 0.48, 0.94]) gg.fillRect(box.x0 + box.w * fx, box.y0, 0.28, box.h); }, c.timber);
      Pp.layer((gg) => { gg.fillRect(-0.7, box.y0, 1.4, box.h * 0.66); }, c.door);
      Pp.layer((gg) => { for (const sx of [-1, 1]) gg.fillRect(sx * box.w * 0.3 - 0.6, box.h * 0.38, 1.2, 0.9); }, c.window);
      Pp.draw(() => { g.strokeStyle = P2.rgba(c.timber, 0.9); g.lineWidth = 0.09; for (const sx of [-1, 1]) for (let i = 1; i < 4; i++) { const xx = sx * box.w * 0.3 - 0.6 + i * 0.3; g.beginPath(); g.moveTo(xx, box.h * 0.38); g.lineTo(xx, box.h * 0.38 + 0.9); g.stroke(); } });
      if (c.accent) Pp.layer((gg) => { gg.fillRect(-1.05, box.h * 0.1, 0.25, box.h * 0.5); gg.fillRect(0.8, box.h * 0.1, 0.25, box.h * 0.5); }, c.accent);
      Pp.innerShade('#1c1410', { alpha: 0.35, blurPx: 10 });
    };
    const gable = (Pp) => { const { box } = Pp; Pp.fill(P2.shade(c.wall, -0.08)); Pp.felt(0.5); Pp.layer((gg) => { gg.fillRect(box.x0, box.y0, box.w, 0.35); gg.fillRect(box.x0 + box.w * 0.45, box.y0, 0.25, box.h * 0.6); }, c.timber); Pp.innerShade('#1c1410', { alpha: 0.4, blurPx: 10 }); };
    const roof = (Pp) => { Pp.fill(c.roof); Pp.marks('scallop', { color: P2.shade(c.roof, -0.35), alpha: 0.75, size: 0.09 }); Pp.marks('dot', { color: P2.shade(c.roof, 0.3), alpha: 0.3, size: 0.03, density: 0.3 }); Pp.innerShade('#141618', { alpha: 0.35, blurPx: 8 }); };
    const node = boxFold({ w, d, wallH, roofH, overhang: 0.45, paper: H.paper, seed, paints: { front, gable, roof }, print: H.cardOpts(x, z) });
    const h = put(H.popup(null, null, { node, x, z, yaw, height: wallH + roofH, level: true }), group);
    mark(x, z - d / 2, Math.max(w, d) * 0.6);
    h.house = { node, w, d, wallH, roofH, x, z, yaw };
    // the eave corners and the ridge ends: anchors for red threads (in the house group's frame)
    h.anchors = { eaveL: { h, obj: node, at: [-w / 2 - 0.3, wallH + 0.1, 0.3] }, eaveR: { h, obj: node, at: [w / 2 + 0.3, wallH + 0.1, 0.3] },
      ridgeL: { h, obj: node.userData.parts.ridge, at: [-w / 2, 0, 0] }, ridgeR: { h, obj: node.userData.parts.ridge, at: [w / 2, 0, 0] } };
    return h;
  }
  return { rnd, between, keep, mark, clear, put, sticker, rock, spire, bush, tuft, stake, fill, house, variant, mound, peak, paintRock, paintBush, paintTuft };
}

// ---- red threads ------------------------------------------------------------------------------------------------------
/**
 * threads(film, links, { color, radius, sag }): 3D red cords between anchors. An anchor is [object3D, [x, y, z]] (a point
 * in that object's frame: a card in shape units, so it rides the card as it rises), a hinge from H.popup / sticker /
 * stake with an [x, y] point on its card ({ h, at: [x, y] }), or a fixed world point [x, y, z]. Each cord sags like a
 * catenary and is drawn only while both ends stand (it pulls taut as the cards rise; it slackens and drops as they fold).
 */
export function threads(film, links, { color = '#a3161a', radius = 0.06, sag = 0.12, seg = 14 } = {}) {
  const { H } = film;
  const mat = paperMaterial({ color, side: THREE.DoubleSide }); mat.color.set(color);
  const g = new THREE.Group(); g.name = 'threads'; H.scene.add(g);
  // anchors: [x, y, z] (world), { h, at: [x, y] } (a point on that hinge's card), { h, obj, at: [x, y, z] } (a point in
  // obj's frame, standing as far as hinge h stands)
  const resolve = (a, out) => {
    if (Array.isArray(a)) return { pos: out.set(...a), up: 1 };
    const obj = a.obj || a.h.card || a.h.pivot.children[0];
    obj.updateWorldMatrix(true, false); out.set(a.at[0], a.at[1], a.at[2] ?? 0.05).applyMatrix4(obj.matrixWorld);
    return { pos: out, up: a.h ? a.h.p : 1 };
  };
  const L = links.map((l) => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.castShadow = true; g.add(m);
    return { ...l, t0: l.t0 === undefined ? undefined : l.t0 + film.offset, t1: l.t1 === undefined ? undefined : l.t1 + film.offset, m, A: new THREE.Vector3(), B: new THREE.Vector3(), sig: '' };
  });
  const tmp = new THREE.Vector3();
  film.every((t) => {
    H.scene.updateMatrixWorld();
    for (const l of L) {
      const a = resolve(l.a, l.A), b = resolve(l.b, l.B);
      // t0 / t1: a cord that shoots out on cue (it grows from a to b over 0.35 s) and is cut at t1
      const grow = l.t0 === undefined ? 1 : clamp((t - l.t0) / 0.35), cut = l.t1 !== undefined && t > l.t1;
      if (grow < 1 && grow > 0) l.B.lerpVectors(l.A, l.B, easeOut(grow));
      const k = cut || grow <= 0 ? 0 : clamp(Math.min(a.up, b.up) * 1.3 - 0.3);
      l.m.visible = k > 0.02;
      if (!l.m.visible) continue;
      const sig = l.A.toArray().map((v) => v.toFixed(3)).join() + l.B.toArray().map((v) => v.toFixed(3)).join() + k.toFixed(2);
      if (sig === l.sig) continue; l.sig = sig;
      const len = l.A.distanceTo(l.B), s = (l.sag ?? sag) * len * (1 + (1 - k) * 2.5);
      const pts = []; for (let i = 0; i <= seg; i++) { const u = i / seg; tmp.lerpVectors(l.A, l.B, u); tmp.y -= s * 4 * u * (1 - u); if (tmp.y < 0.03) tmp.y = 0.03; pts.push(tmp.clone()); }
      l.m.geometry.dispose(); l.m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, (l.radius ?? radius) * (0.6 + 0.4 * k), 5, false);
    }
  });
  return g;
}

// an anchor's world position and how far it stands (see threads())
function anchorAt(a, out) {
  if (Array.isArray(a)) return { pos: out.set(...a), up: 1 };
  const obj = a.obj || a.h.card || a.h.pivot.children[0];
  obj.updateWorldMatrix(true, false); out.set(a.at[0], a.at[1], a.at[2] ?? 0.05).applyMatrix4(obj.matrixWorld);
  return { pos: out, up: a.h ? a.h.p : 1 };
}
/**
 * threadBand(film, { a, b, n, wA, wB, depth }): the game's big red thread bands. Hundreds of taut, nearly parallel
 * threads pulled from a high anchor `a` (a tower top, a cliff top, a tree crown: any threads() anchor) down at a slant
 * to the ground at `b`, spread wA wide at the top and wB at the foot, `depth` thick, bunched in uneven strands so the
 * band reads dense and sparse in turn. One merged mesh (a thin three-sided prism per thread). It stands as its anchors
 * stand; t0: it shoots out from a on cue; t1: it is cut in the middle at t1 and both halves spring back / drop.
 */
export function threadBand(film, { a, b, n = 140, wA = 0.8, wB = 2.6, depth = 0.4, radius = 0.017, colors = ['#8a1216', '#a3161a', '#6e0c10', '#b52520', '#5a0a0e'], bunches = 9, seed = 1, t0, t1 } = {}) {
  if (t0 !== undefined) t0 += film.offset; if (t1 !== undefined) t1 += film.offset;
  const { H } = film, r = P2.rng(seed);
  const centres = Array.from({ length: bunches }, () => r() - 0.5), strands = [];
  for (let i = 0; i < n; i++) {
    const c = centres[Math.floor(r() * bunches)], g = () => (r() + r() + r() - 1.5) * 0.18;
    strands.push({ sa: c * 0.9 + g(), sb: c + g() * 1.4, da: (r() - 0.5), db: (r() - 0.5), rad: radius * (0.6 + r() * 0.9), col: new THREE.Color(colors[Math.floor(r() * colors.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.06), droop: 0.4 + r() * 1.2 });
  }
  const V = n * 2 * 6, pos = new Float32Array(V * 3), col = new Float32Array(V * 3), idx = [];
  for (let i = 0; i < n * 2; i++) { const o = i * 6; for (let k = 0; k < 3; k++) { const k1 = (k + 1) % 3; idx.push(o + k, o + k1, o + 3 + k, o + k1, o + 3 + k1, o + 3 + k); } for (let v = 0; v < 6; v++) col.set(strands[i >> 1].col.toArray(), (o + v) * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
  const mat = paperMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.frustumCulled = false; mesh.name = 'threadBand'; H.scene.add(mesh);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), d = new THREE.Vector3(), side = new THREE.Vector3(), nrm = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), M = new THREE.Vector3(), u1 = new THREE.Vector3(), v1 = new THREE.Vector3(), dd = new THREE.Vector3();
  const prism = (slot, P, Q, rad) => {
    dd.subVectors(Q, P); if (dd.lengthSq() < 1e-8) dd.set(0, -1e-3, 0); dd.normalize();
    u1.crossVectors(dd, up); if (u1.lengthSq() < 1e-6) u1.set(1, 0, 0); u1.normalize(); v1.crossVectors(u1, dd);
    for (let k = 0; k < 3; k++) { const th = k / 3 * Math.PI * 2, cx = Math.cos(th) * rad, cy = Math.sin(th) * rad;
      pos.set([P.x + u1.x * cx + v1.x * cy, P.y + u1.y * cx + v1.y * cy, P.z + u1.z * cx + v1.z * cy], (slot * 6 + k) * 3);
      pos.set([Q.x + u1.x * cx + v1.x * cy, Q.y + u1.y * cx + v1.y * cy, Q.z + u1.z * cx + v1.z * cy], (slot * 6 + 3 + k) * 3); }
  };
  let sig = '';
  film.every((t) => {
    H.scene.updateMatrixWorld();
    const ea = anchorAt(a, A), eb = anchorAt(b, B);
    const grow = t0 === undefined ? 1 : clamp((t - t0) / 0.4), cut = t1 === undefined ? 0 : clamp((t - t1) / 0.35);
    const k = grow <= 0 ? 0 : clamp(Math.min(ea.up, eb.up) * 1.3 - 0.3);
    mesh.visible = k > 0.02 && cut < 1; if (!mesh.visible) return;
    const s2 = A.toArray().concat(B.toArray()).map((v) => v.toFixed(3)).join() + k.toFixed(2) + grow.toFixed(2) + cut.toFixed(2);
    if (s2 === sig) return; sig = s2;
    d.subVectors(B, A); side.crossVectors(d, up); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize(); nrm.crossVectors(side, d).normalize();
    const reach = easeOut(grow), ce = easeOut(cut);
    strands.forEach((st, i) => {
      p0.copy(A).addScaledVector(side, st.sa * wA).addScaledVector(nrm, st.da * depth * 0.5);
      p1.copy(B).addScaledVector(side, st.sb * wB).addScaledVector(nrm, st.db * depth);
      p1.lerpVectors(p0, p1, reach);
      // a band that is not yet standing hangs slack: its foot end sags toward the page
      if (k < 1) { p1.y = lerp(0.05, p1.y, k); }
      M.lerpVectors(p0, p1, 0.5);
      if (cut > 0) {   // cut in the middle: the top half springs back up to its anchor, the foot half drops flat
        const m1 = M.clone().lerp(p0, ce), m2 = M.clone().lerp(p1, ce * 0.6); m2.y = Math.max(0.04, lerp(M.y, 0.04, ce)) ;
        prism(i * 2, p0, m1, st.rad); prism(i * 2 + 1, m2, p1, st.rad);
      } else { prism(i * 2, p0, M, st.rad); prism(i * 2 + 1, M, p1, st.rad); }
    });
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  });
  return mesh;
}
/** threadWrap(film, { h, at, r, y0, y1, turns }): red thread wound round a post / tower / trunk printed on hinge h's card */
export function threadWrap(film, { h, at = [0, 0], r = 1, y0 = 0, y1 = 2, turns = 9, layers = 3, colors = ['#a3161a', '#8a1216', '#bf2a22'], radius = 0.05, seed = 2 } = {}) {
  const obj = h.card || h.pivot.children[0], rr = P2.rng(seed), g = new THREE.Group(); obj.add(g); g.position.set(at[0], 0, 0.05);
  for (let L = 0; L < layers; L++) {
    const pts = [], R = r * (1 + L * 0.06), ph = rr() * 6, N = turns * 16;
    for (let i = 0; i <= N; i++) { const u = i / N, a = u * turns * Math.PI * 2 + ph; pts.push(new THREE.Vector3(Math.cos(a) * R, lerp(y0, y1, u) + Math.sin(a * 3 + L) * 0.03, Math.sin(a) * R * 0.75)); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, radius, 4, false), paperMaterial({ color: colors[L % colors.length] })); m.castShadow = true; g.add(m);
  }
  return g;
}

// ---- more effects -------------------------------------------------------------------------------------------------
const matCache = new Map();
function tissue(color, opacity = 0.8, emissive = null) {
  const k = color + opacity + emissive; if (matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity >= 1 });
  // v2: no self-lit paper. Bright effects are bright stock, lit like every other card
  matCache.set(k, m); return m;
}
/** a column of light or fire: a tissue-paper tube that unrolls upward, holds, then rolls back down */
export function pillar(film, { t, at, radius = 1.2, height = 14, color = '#f2d27a', dur = 1.4, rise = 0.25, opacity = 0.7, emissive = null, bands = '#ffffff', sound = 'pillar' }) {
  const { H } = film; if (sound) film.sound(t, sound);
  film.at(t, (t) => {
    const g = new THREE.Group(); g.position.set(at[0], 0, at[2]); H.scene.add(g);
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.15, 1, 24, 1, true), tissue(color, opacity, emissive ?? color));
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.45, radius * 0.55, 1, 16, 1, true), tissue(bands, Math.min(1, opacity + 0.15), bands));
    outer.position.y = inner.position.y = 0.5; const s = new THREE.Group(); s.add(outer, inner); g.add(s);
    const t0 = t;
    film.fx.push({ update(tt) { const lt = tt - t0; if (lt > dur) return false; const k = lt < rise ? easeOut(lt / rise) : lt > dur - 0.3 ? easeIn((dur - lt) / 0.3) : 1; s.scale.set(1 + Math.sin(lt * 30) * 0.03, Math.max(0.001, height * k), 1 + Math.cos(lt * 27) * 0.03); s.rotation.y = lt * 2; return true; }, dispose() { H.scene.remove(g); } });
  });
}
/** lightning: a jagged flat paper bolt between two points, flickering twice */
export function bolt(film, { t, from, to, color = '#8fb4ff', core = '#f4f8ff', width = 0.35, dur = 0.3, seed = 1, sound = 'bolt' }) {
  const { H } = film; if (sound) film.sound(t, sound);
  film.at(t, (t) => {
    const r = P2.rng(seed), A = new THREE.Vector3(...from), B = new THREE.Vector3(...to), n = 9, pts = [];
    const side = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3(0, 0, 1)).normalize();
    for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); if (i && i < n) p.addScaledVector(side, (r() - 0.5) * A.distanceTo(B) * 0.18); pts.push(p); }
    const mk = (w, c) => { const pos = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const d = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(w); pos.push(...a.clone().add(d).toArray(), ...a.clone().sub(d).toArray(), ...b.clone().add(d).toArray(), ...a.clone().sub(d).toArray(), ...b.clone().sub(d).toArray(), ...b.clone().add(d).toArray()); } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); return new THREE.Mesh(geo, tissue(c, 1, c)); };
    const g = new THREE.Group(); g.add(mk(width, color), mk(width * 0.35, core)); H.scene.add(g);
    const t0 = t;
    film.fx.push({ update(tt) { const lt = tt - t0; if (lt > dur) return false; g.visible = !(lt > dur * 0.35 && lt < dur * 0.5); return true; }, dispose() { H.scene.remove(g); } });
  });
}
/** rays: n paper strips shooting out from a point (sword qi, a burst), growing out then pulled in from the root */
export function rays(film, { t, at, n = 16, len = 10, width = 0.25, color = '#c0281c', dur = 0.8, flat = 0.3, seed = 2, sound = 'rays' }) {
  const { H } = film; if (sound) film.sound(t, sound);
  film.at(t, (t) => {
    const r = P2.rng(seed), g = new THREE.Group(); g.position.set(...at); H.scene.add(g); const items = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, width, width * 0.25), tissue(i % 3 ? color : '#1a0c08', 1)); m.castShadow = true;
      const piv = new THREE.Group(); piv.rotation.y = i / n * Math.PI * 2 + r() * 0.3; piv.rotation.z = (r() - 0.3) * flat; piv.add(m); g.add(piv);
      items.push({ m, L: len * (0.6 + r() * 0.6), d: r() * 0.12 });
    }
    const t0 = t;
    film.fx.push({ update(tt) { const lt = tt - t0; if (lt > dur + 0.2) return false; for (const it of items) { const u = clamp((lt - it.d) / dur), head = easeOut(u / 0.5) * it.L, tail = easeIn((u - 0.5) / 0.5) * it.L; const l = Math.max(0.001, head - tail); it.m.scale.x = l; it.m.position.x = tail + l / 2; it.m.visible = u > 0 && u < 1; } return true; }, dispose() { H.scene.remove(g); } });
  });
}
/**
 * serpent: a chain of cut-paper segments following a path through time (a snake rising out of the ground, a dragon
 * circling in the air). path(u) -> [x, y, z] for u in 0..1 along the body; the head leads at time t + u * travel.
 */
export function serpent(film, { t, dur = 2.5, path, n = 22, size = 1.2, colors = ['#e8e2d0', '#b9b2a0'], head = null, headSize = 3, scale = 1, sound = 'serpent' }) {
  const { H } = film; if (sound) film.sound(t, sound, { dur });
  film.at(t, (t) => {
    const g = new THREE.Group(); H.scene.add(g); const segs = [];
    for (let i = 0; i < n; i++) {
      const s = new THREE.Shape(), w = size * (1 - i / n * 0.6); s.moveTo(-w, 0); s.quadraticCurveTo(0, w * 1.4, w, 0); s.quadraticCurveTo(0, -w * 1.4, -w, 0);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }), tissue(colors[i % colors.length], 1)); m.castShadow = true; g.add(m); segs.push(m);
    }
    let hm = null; if (head) { const [pts, paint] = imagePiece(head, headSize); hm = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y - headSize / 2)))), tissue('#ffffff', 1)); g.add(hm); }
    const t0 = t, tmp = new THREE.Vector3(), nx = new THREE.Vector3();
    film.fx.push({ update(tt) {
      const lt = tt - t0; if (lt > dur) return false;
      const lead = clamp(lt / dur * 1.35);
      segs.forEach((m, i) => { const u = lead - i / n * 0.35; m.visible = u > 0 && u < 1; if (!m.visible) return; m.position.set(...path(u)); nx.set(...path(Math.min(1, u + 0.01))); m.lookAt(nx); m.rotateY(Math.PI / 2); m.scale.setScalar(scale); });
      return true; }, dispose() { H.scene.remove(g); } });
  });
}
/** a spinning toothed wheel card (a saw wheel), with sparks thrown off its rim */
export function wheel(film, { t, at, to = null, back = false, radius = 2.5, teeth = 14, dur = 2, color = '#6b6e74', rim = '#2a2a2e', speed = 14, sound = 'saw', sparks = true }) {
  const { H } = film; if (sound) film.sound(t, sound, { dur });
  if (sparks) for (let k = 0; k < Math.floor(dur / 0.25); k++) shards(film, { t: t + k * 0.25, at: to ? [lerp(at[0], to[0], 0.5), at[1] - radius * 0.8, lerp(at[2], to[2], 0.5)] : [at[0], at[1] - radius * 0.8, at[2]], n: 10, colors: ['#ffd27a', '#ffb04a', '#fff0c8'], speed: 6, up: 4, size: 0.16, seed: k + 3 });
  film.at(t, (t) => {
    const s = new THREE.Shape(); for (let i = 0; i <= teeth * 2; i++) { const a = i / (teeth * 2) * Math.PI * 2, r = i % 2 ? radius : radius * 0.8; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const hole = new THREE.Path(); hole.absarc(0, 0, radius * 0.25, 0, Math.PI * 2, true); s.holes.push(hole);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }), tissue(color, 1)); m.castShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.5, radius * 0.62, 32), tissue(rim, 1)); ring.position.z = 0.14;
    const g = new THREE.Group(); g.add(m, ring); g.position.set(...at); H.scene.add(g);
    const t0 = t;
    film.fx.push({ update(tt) {
      const lt = tt - t0; if (lt > dur) return false;
      if (to) { let u = lt / dur; if (back) u = u < 0.5 ? u * 2 : (1 - u) * 2; u = easeOut(u); g.position.set(lerp(at[0], to[0], u), lerp(at[1], to[1], u), lerp(at[2], to[2], u)); }
      g.lookAt(H.camera.position.x, g.position.y, H.camera.position.z); g.rotateZ(-lt * speed); return true; }, dispose() { H.scene.remove(g); } });
  });
}
/** an orb (a cannon shot, a bomb): a paper disc that flies from a to b along an arc and bursts */
export function orb(film, { t, from, to, dur = 0.5, arc = 2, radius = 0.8, color = '#ffb04a', core = '#fff0c0', sound = 'cannon' }) {
  const { H } = film; if (sound) film.sound(t, sound);
  film.at(t, (t) => {
    const g = new THREE.Group(); const a = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), tissue(color, 1, color)); const b = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.5, 16), tissue(core, 1, core)); b.position.z = 0.02; g.add(a, b); H.scene.add(g);
    const t0 = t;
    film.fx.push({ update(tt) { const u = (tt - t0) / dur; if (u > 1) return false; g.position.set(lerp(from[0], to[0], u), lerp(from[1], to[1], u) + arc * 4 * u * (1 - u), lerp(from[2], to[2], u)); g.lookAt(H.camera.position); return true; }, dispose() { H.scene.remove(g); } });
  });
}

// ---- the standard beats of a fight ------------------------------------------------------------------------------------
/**
 * beats(film, hero, boss, { sparks, blood, water }) -> helpers that write keys and effects for the common moments.
 * Positions are [x, z]; ground y = 0. Each returns the time it ends.
 */
const TELL_HOLDS = [0.32, 0.2, 0.42, 0.26, 0.36, 0.16];
let tellN = 0;
export function beats(film, hero, boss, o = {}) {
  const Y = o.y0 ?? 0;   // the floor's height (a raised yard): every effect of the beats sits on it
  const blood = o.blood ?? ['#7a1a14', '#b3231a', '#2a1a16'], sparks = o.sparks ?? ['#f2c46a', '#e8873a', '#fff0c8'], dust = o.dust ?? ['#8d8a76', '#6d6a5c', '#a8a28a'];
  const splash = o.splash ?? null;   // [colors] when the floor is water
  const ground = (t, at, big = 1) => {
    if (splash) { crown(film, { t, at: [at[0], 0 + Y, at[1]], n: Math.round(9 * big), radius: 1.2 * big, height: 2.1 * big, colors: splash, seed: Math.round(t * 10) }); rings(film, { t, at: [at[0], 0 + Y, at[1]], n: 2, r1: 4 * big, color: splash[0] }); film.sound(t, 'splash', { size: big * 0.8 }); }
    else { shards(film, { t, at: [at[0], 0.3 + Y, at[1]], n: Math.round(16 * big), colors: dust, speed: 5 * big, up: 4, size: 0.28, seed: Math.round(t * 10), ground: Y }); rings(film, { t, at: [at[0], 0 + Y, at[1]], n: 2, r1: 3.5 * big, color: dust[2], width: 0.22 }); film.sound(t, 'thud', { size: big }); }
  };
  return {
    ground,
    /** the hero parries at `at` ([x, z]) and slides back to `back` */
    parry(t, at, back) { hero.key(t, { pose: 'parry' }).key(t + 0.3, { x: at[0], z: at[1], ease: 'linear' }).key(t + 0.6, { x: back[0], z: back[1], ease: 'out' }).key(t + 0.75, { pose: 'idle' });
      film.at(t + 0.3, () => film.kick(0.5)); film.flash(t + 0.3, { dur: 0.14, peak: 0.3 });
      shards(film, { t: t + 0.3, at: [at[0] + 0.8, 2.4 + Y, at[1]], n: 18, colors: sparks, speed: 7, up: 6, size: 0.2, seed: Math.round(t * 7), sound: 'clang' }); return t + 0.75; },
    /** the hero dashes from `from` to `to` and cuts; the boss at `bossAt` is hit */
    dashCut(t, from, to, bossAt, { color = '#b3231a', radius = 3.2 } = {}) {
      hero.key(t, { pose: 'dodge', x: from[0], z: from[1] }).key(t + 0.4, { x: to[0], z: to[1], ease: 'out' }).key(t + 0.42, { pose: 'slash' }).key(t + 1.2, { pose: 'idle' });
      film.sound(t, 'dash');
      slash(film, { t: t + 0.45, at: [bossAt[0] - 1.4, 2.4 + Y, bossAt[1] + 0.6], radius, width: 0.75, a0: 2.5, a1: -0.7, normal: [0.15, 0.2, 1], color });
      this.bossHit(t + 0.58, bossAt); return t + 1.2; },
    /** the hero leaps from `from` to `to` with an overhead cut on the boss */
    leapCut(t, from, to, bossAt, { color = '#b3231a', hop = 3.2, heavy = true } = {}) {
      hero.key(t, { pose: 'overhead', x: from[0], z: from[1], hop }).key(t + 0.5, { x: to[0], z: to[1], ease: 'linear' }).key(t + 0.52, { pose: 'slash' }).key(t + 1.2, { pose: 'idle' });
      film.sound(t, 'leap');
      slash(film, { t: t + 0.48, at: [bossAt[0] - 0.8, 3.0 + Y, bossAt[1] + 0.6], radius: 3.9, width: 0.95, a0: 1.9, a1: -1.5, normal: [0.25, 0, 1], color, sound: heavy ? 'heavy' : 'slash' });
      this.bossHit(t + 0.58, bossAt, 1.4); return t + 1.2; },
    bossHit(t, at, big = 1) {
      boss.key(t, { lean: 0 }).key(t + 0.12, { lean: 0.3 * big, ease: 'out' }).key(t + 0.6, { lean: 0 });
      film.at(t, () => film.kick(0.6 * big)); film.sound(t, 'hit'); if (big > 1.2) film.flash(t, { dur: 0.16, peak: 0.3 });
      shards(film, { t, at: [at[0], 2.6 + Y, at[1] + 0.3], n: Math.round(16 * big), colors: blood, speed: 5, up: 5, size: 0.26, seed: Math.round(t * 13) });
      if (splash) ground(t + 0.05, at, 0.8); },
    /** the hero is struck at `at` and knocked back to `back` */
    heroHit(t, at, back, big = 1) {
      hero.key(t, { pose: 'hit', x: at[0], z: at[1] }).key(t + 0.45, { x: back[0], z: back[1], ease: 'out', lean: 0.15 * big }).key(t + 0.8, { pose: 'idle', lean: 0 });
      film.at(t, () => film.kick(0.6 * big)); film.sound(t, 'hit');
      shards(film, { t, at: [at[0], 2.2 + Y, at[1]], n: 12, colors: blood, speed: 4, up: 4, size: 0.2, seed: Math.round(t * 17) }); return t + 0.8; },
    /** a boss attack swing (wind-up lean, swing), with a slash arc of color around `at` */
    swing(t, at, { radius = 6, normal = [0, 1, 0], a0 = 0.3, a1 = 3.4, color = '#4b4c52', core = '#d8d0c0', y = 2, sound = 'whoosh', lunge = null } = {}) {
      boss.key(t - 0.15, { lean: 0 }).key(t, { lean: -0.16 }).key(t + 0.15, { lean: 0.08, ease: 'in' }).key(t + 0.55, { lean: 0 });
      if (lunge) boss.key(t - 0.05, { x: lunge[0][0], z: lunge[0][1] }).key(t + 0.25, { x: lunge[1][0], z: lunge[1][1], ease: 'out' }).key(t + 0.9, { x: lunge[0][0], z: lunge[0][1] });
      slash(film, { t, at: [at[0], y + Y, at[1]], radius, width: 0.9, a0, a1, normal, dur: 0.45, color, core, sound }); return t + 0.6; },
    /**
     * the phase change: the boss trembles while shards of `color` gather into it, a flash, the card flips to `to`, a
     * crown of `kind` ('spike' | 'flame' | 'drop') bursts up round it; the hero is blown back
     */
    phase(t, at, to, { color = ['#b3231a', '#7a1a14', '#e2553e'], flash = '#c0281c', kind = 'spike', crownColors = ['#8e1a14', '#b3231a', '#2a1a16'], heroFrom, heroTo, dur = 1.3, extra = null } = {}) {
      const T = t + dur;
      film.letterbox({ t0: t, dur: dur + 2.9 });
      boss.key(t, { jit: 0 }).key(T - 0.1, { jit: 0.14 }).key(T, { flipTo: to, lean: 0, jit: 0, snap: true });
      film.sound(t, 'charge', { dur });
      shards(film, { t, at: [at[0], 2.8 + Y, at[1]], n: 56, colors: color, converge: true, radius: 7, life: dur, size: 0.3, seed: Math.round(t * 3) });
      rings(film, { t: t + 0.5, at: [at[0], 0 + Y, at[1]], n: 3, r0: 7, r1: 1.0, dur: 0.8, gap: 0.22, color: color[1], width: 0.35 });
      film.flash(T, { color: flash, dur: 0.4, peak: 0.6 }); film.at(T, () => film.kick(1.5)); film.sound(T, 'boom');
      crown(film, { t: T, at: [at[0], 0 + Y, at[1]], n: 16, radius: 2.6, height: 4.8, colors: crownColors, kind, rows: 2, hold: 1.7, seed: Math.round(t) });
      shards(film, { t: T + 0.02, at: [at[0], 2 + Y, at[1]], n: 40, colors: [...color, '#e9efe6'], speed: 9, up: 8, size: 0.3, seed: Math.round(t * 5) });
      if (heroFrom) hero.key(T + 0.06, { pose: 'hit', x: heroFrom[0], z: heroFrom[1], lean: 0 }).key(T + 0.6, { x: heroTo[0], z: heroTo[1], ease: 'out', lean: 0.18 }).key(T + 1.0, { pose: 'idle', lean: 0 });
      if (extra) extra(T);
      return T;
    },
    // ---- v2: the guard / tell / deflect / shadow-step language (PLAN-v2 section 4) ----
    /** 魂 takes a blow on his blade (the parry card held across): foil sparks thrown back, a small kick, a short slide */
    guard(t, at, { face = 1, back = 0.7, heavy = false, hold = 0.42 } = {}) {
      hero.key(t, { pose: 'parry', x: at[0], z: at[1], face }).key(t + 0.22, { x: at[0] - face * back, z: at[1], ease: 'out' }).key(t + hold, { pose: 'idle' });
      film.at(t, () => film.kick(heavy ? 0.8 : 0.4));
      fxSparks(film, { t, at: [at[0] + face * 0.9, 2.3 + Y, at[1] + 0.2], dir: face > 0 ? Math.PI : 0, n: heavy ? 30 : 20, seed: Math.round(t * 31), sound: heavy ? 'guardHeavy' : 'guard' });
      return t + hold; },
    /**
     * the tell: the game's flare, cut in paper: a long horizontal streak through a star at the boss's weapon `at`
     * ([x, y, z]) shoots out; the scene hangs for `hold` (hit-stop) while it shimmers, under a faint wash of its colour.
     * 'blue' = 魂 will deflect, 'red' = he will shadow-step out.
     */
    tell(t, at, color = 'red', { hold, len = 9 } = {}) {
      const red = color === 'red';
      hold ??= TELL_HOLDS[tellN++ % TELL_HOLDS.length];   // v4: the freezes vary (no two in a row the same)
      glint(film, { t, at, color: red ? 'red' : 'blue', len, hold, seed: Math.round(t * 7), sound: red ? 'tellRed' : 'tellBlue' });
      film.hitstop(t + 0.07, hold); film.tint(t + 0.07, { color: red ? '#b3231a' : '#2f6fb8', dur: hold + 0.12, peak: 0.12 });
      return t + 0.1; },
    /** the perfect parry: the deflect card, a big blue-white star and saw ring at the blades, the boss knocked back */
    deflect(t, at, bossAt, { face = 1, stagger = 0.42 } = {}) {
      hero.key(t, { pose: 'deflect', x: at[0], z: at[1], face }).key(t + 0.5, { pose: 'idle' });
      const c = [at[0] + face * 1.3, 2.6 + Y, at[1] + 0.3];
      starburst(film, { t, at: c, r: 2.0, spikes: 14, colors: ['#0c1a2a', '#8fb8e8', '#ffffff'], dur: 0.42, seed: Math.round(t * 5), sound: 'deflect' });
      sawRing(film, { t, at: c, r1: 3.2, upright: true, color: '#d6ecff', dur: 0.45, seed: Math.round(t) });
      fxSparks(film, { t, at: c, n: 26, colors: ['#ffffff', '#d6ecff', '#8fb8e8', '#f2c46a'], star: false, seed: Math.round(t * 3), sound: null });
      film.at(t, () => film.kick(1.0));
      boss.key(t, { lean: 0 }).key(t + 0.12, { lean: stagger, ease: 'out' }).key(t + 0.75, { lean: 0 });
      return t + 0.5; },
    /** the shadow-step (瞬身): 魂 bursts into black-red scraps at `from` and closes up out of them at `to`, facing `face` */
    shadowstep(t, from, to, { face = -1, gap = 0.26 } = {}) {
      scraps(film, { t, at: [from[0], 0 + Y, from[1]], out: true, seed: Math.round(t * 11), sound: 'shadowOut' });
      hero.key(t, { x: from[0], z: from[1] }).key(t + 0.05, { hidden: true });
      scraps(film, { t: t + gap, at: [to[0], 0 + Y, to[1]], out: false, dur: 0.3, seed: Math.round(t * 13), sound: 'shadowIn' });
      hero.key(t + gap + 0.26, { hidden: false, x: to[0], z: to[1], face, pose: 'idle', snap: true });
      return t + gap + 0.26; },
    /** the counter: a lunging thrust from `from` into the boss (a straight cut through it), the boss hit hard */
    counter(t, from, bossAt, { face = 1, reach = 2.2, color = '#b3231a' } = {}) {
      hero.key(t, { pose: 'counter', x: from[0], z: from[1], face }).key(t + 0.14, { x: from[0] + face * reach, ease: 'out' }).key(t + 0.7, { pose: 'idle' });
      film.sound(t, 'dash');
      slash(film, { t: t + 0.08, at: [bossAt[0], 2.4 - 9 + Y, bossAt[1] + 0.6], radius: 9, width: 0.7, a0: Math.PI / 2 + face * 0.28, a1: Math.PI / 2 - face * 0.28, normal: [0, 0, 1], color, sound: 'slash' });
      this.bossHit(t + 0.16, bossAt, 1.4); return t + 0.7; },
    /** the finishing cross cut, ink strips across the frame, the boss card falls flat, a seal stamp */
    finisher(t, heroAt, bossAt, { stamp = '斩', face = -1, fall = 0.5 } = {}) {
      hero.key(t - 0.02, { pose: 'slash', x: heroAt[0], z: heroAt[1], face }).key(t + 0.1, { x: heroAt[0] + 0.9 * face, ease: 'out' });
      const c = [bossAt[0] + 0.7 * -face, 2.8 + Y, bossAt[1] + 0.2];
      slash(film, { t, at: c, radius: 4.4, width: 1.0, a0: 2.4, a1: -0.9, normal: [0, 0.15, 1], color: '#b3231a', sound: 'finisher' });
      slash(film, { t: t + 0.12, at: c, radius: 4.4, width: 1.0, a0: 0.7, a1: 4.0, normal: [0, 0.15, 1], color: '#b3231a', sound: null });
      film.inkStrip({ t0: t + 0.02, dur: 0.75, from: [0.08, 0.2], to: [0.92, 0.78], width: 26, seed: 3 });
      film.inkStrip({ t0: t + 0.16, dur: 0.75, from: [0.12, 0.82], to: [0.9, 0.18], width: 22, seed: 5 });
      film.flash(t + 0.02, { dur: 0.22, peak: 0.5 }); film.at(t + 0.02, () => film.kick(1.7));
      shards(film, { t: t + 0.04, at: [bossAt[0], 2.6 + Y, bossAt[1]], n: 60, colors: [...blood, '#e9efe6'], speed: 9, up: 7, size: 0.3, seed: 26 });
      boss.key(t + 0.04, { lean: 0 }).key(t + 0.2, { lean: 0.3, ease: 'out' }).key(t + fall, { rise: 0 });
      film.at(t + fall + 0.75, () => film.kick(0.6)); film.sound(t + fall + 0.75, 'slap', { size: 1 });
      ground(t + fall + 0.75, bossAt, 1.4);
      hero.key(t + 1.0, { pose: 'finisher' });
      film.stamp({ t0: t + 1.6, dur: 2.6, text: stamp, at: [0.8, 0.3], size: 210 }); film.sound(t + 1.6, 'stamp');
      return t + 1.6;
    },
  };
}

/** an elite's moment: it rises at t with a small gesture and its name plate; move: 'swing' | 'slam' | 'bow' */
export function elite(film, actor, t, { title, name, move = 'swing', at = null, burst = null, plate = 'left', dur = 2.2 } = {}) {
  actor.key(0, { hidden: true }).key(t, { hidden: false, rise: 1 });   // not even printed on the page before its moment
  film.sound(t, 'rise', { size: 0.7 });
  if (move === 'swing') actor.key(t + 1.0, { lean: 0 }).key(t + 1.25, { lean: -0.14 }).key(t + 1.55, { lean: 0.05 }).key(t + 1.9, { lean: 0 });
  if (move === 'slam') { actor.key(t + 0.9, { lean: 0 }).key(t + 1.15, { lean: -0.22 }).key(t + 1.35, { lean: 0.12, ease: 'in' }).key(t + 1.7, { lean: 0 }); film.at(t + 1.35, () => film.kick(0.5)); film.sound(t + 1.35, 'thud', { size: 0.8 }); if (at) { shards(film, { t: t + 1.35, at: [at[0] + 1.5, 0.3, at[1] + 1], n: 18, colors: ['#8d8a76', '#6d6a5c', '#a8a28a'], speed: 5, up: 4, size: 0.3, seed: Math.round(t) }); rings(film, { t: t + 1.35, at: [at[0] + 1.5, 0, at[1] + 1], n: 2, r1: 3.5, color: '#a39b82', width: 0.22 }); } }
  if (move === 'bow') actor.key(t + 1.0, { lean: 0 }).key(t + 1.3, { lean: -0.08 }).key(t + 1.7, { lean: 0 });
  if (burst && at) shards(film, { t: t + 0.1, at: [at[0], 1.2, at[1]], n: 36, colors: burst, speed: 4, up: 7, size: 0.26, gravity: 6, shape: 'drop', seed: Math.round(t * 3), life: 2.0 });
  film.plate({ t0: t + 0.3, dur, title, name, side: plate });
}

// ---- transitions ------------------------------------------------------------------------------------------------------
/**
 * The slide-UP join between chapters (the whole film climbs: 魂 always moves up the page). outro: after the boss, 魂
 * runs up the page past the arena and off the TOP of the frame while the camera drifts after him more slowly, the world
 * folds flat behind and the paper colour shifts to the next region's. intro: the next chapter opens on blank paper of
 * its colour below (near side of) the diorama; 魂 runs in from the BOTTOM edge of the frame up to his landing spot,
 * the world rises round him, he folds away, the chapter banner folds down. Both use the same camera (SLIDE pitch and
 * dist), so the cut between chapters reads as one continuous climb.
 */
export const SLIDE = { pitch: 50, dist: 46, speed: 13 };
export function paperColor(film, keys) {
  keys = keys.map((k) => ({ ...k, t: k.t > 0 ? k.t + film.offset : k.t }));
  const { H } = film; let beyond = null;
  H.scene.traverse((o) => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && o.geometry.parameters.width === 800) beyond = o; });
  const c0 = new THREE.Color(), c1 = new THREE.Color(), c = new THREE.Color();
  film.every((t) => {
    let a = keys[0], b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; }
    const u = b.t > a.t ? smooth((t - a.t) / (b.t - a.t)) : 1;
    c0.set(a.color); c1.set(b.color); c.copy(c0).lerp(c1, t < keys[0].t ? 0 : u);
    if (beyond) beyond.material.color.copy(c); H.scene.background = c.clone();
  });
}
/** intro keys: 魂 runs in from the bottom edge of the frame (`run` units below `land`) up to `land`, then folds away */
export function intro(film, hero, { land, t1 = 1.0, run = 20, cam = 5 }) {
  const [lx, lz] = land, z0 = lz + run;
  hero.key(0, { hidden: false, pose: 'run', x: lx, z: z0, face: 1 }).key(t1 - 0.15, { x: lx, z: lz - 0.5, ease: 'out' }).key(t1 - 0.12, { pose: 'idle' }).key(t1, { rise: 0 }).key(t1 + 0.9, { hidden: true });
  film.sound(0.05, 'steps', { dur: t1 - 0.2 }); film.sound(t1, 'rise', { size: 0.5 });
  return [
    { t: 0, target: [lx, 1.5, lz + cam], dist: SLIDE.dist, pitch: SLIDE.pitch, yaw: 0, focus: [lx, 1.5, lz + cam] },
    { t: t1, target: [lx, 1.5, lz], dist: SLIDE.dist, pitch: SLIDE.pitch, yaw: 0, ease: 'out', focus: [lx, 1.5, lz] },
  ];
}
/** outro keys: 魂 runs up from `from` and off the top of the frame; the box folds flat behind him; the paper recolours */
export function outro(film, hero, { t0, from, dur = 1.4, nextColor, color, foldFrom, run = 22, cam = 5 }) {
  const [fx, fz] = from, z1 = fz - run;
  hero.key(t0, { pose: 'run', face: 1, x: fx, z: fz }).key(t0 + dur, { x: fx, z: z1, ease: 'in' }).key(t0 + dur + 0.02, { hidden: true });
  film.sound(t0, 'steps', { dur });
  film.rise('world', t0 + 0.05, { from: foldFrom ?? [fx, fz], speed: 110, open: 0 });
  film.rise('arena', t0 + 0.05, { from: foldFrom ?? [fx, fz], speed: 110, open: 0, sound: false });
  paperColor(film, [{ t: 0, color }, { t: t0 + 0.3, color }, { t: t0 + dur, color: nextColor }]);
  return [
    { t: t0, target: [fx, 1.5, fz], dist: SLIDE.dist, pitch: SLIDE.pitch, yaw: 0, focus: [fx, 1.5, fz] },
    { t: t0 + dur, target: [fx, 1.5, fz - cam], dist: SLIDE.dist, pitch: SLIDE.pitch, yaw: 0, ease: 'in', focus: [fx, 1.5, fz - cam] },
  ];
}

/** 魂, the same paper puppet in every chapter */
export function makeHero(film, IMG) {
  const poses = Object.fromEntries(HERO_POSES.filter((p) => IMG['hero-' + p]).map((p) => [p, IMG['hero-' + p]]));
  return createActor(film, { name: 'hero', poses, height: 3.6, heights: { dodge: 2.4, run: 3.0, slash: 2.9, overhead: 3.7, parry: 3.0, hit: 3.4, deflect: 3.6, counter: 2.6, crouch: 2.5 }, risen: true });
}
