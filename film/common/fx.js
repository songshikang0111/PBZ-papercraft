// Paper effects, v2. Every effect is cut and folded card with a real thickness, an edge and a shadow; it moves the way
// paper moves (pops up on a fold, flips, unfolds like an accordion, tears, crumples, curls), on the stepped effect
// clock (film.fxFps), never as glow, soft gradients or point particles. Colour is the stock's own: bright moments are
// bright paper, gold foil, or stacked concentric cuts. See film/PLAN-v2.md section 6.
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { paperMaterial, makeCard } from 'papercraft/lib/paperkit-3d.js';
import { FlapSpring } from 'papercraft/lib/paper-motion.js';
import { shards, paperBit, imagePiece, clamp, smooth, easeOut, easeIn, lerp } from './film.js';

// ---- shared bits --------------------------------------------------------------------------------------------------
const MATS = new Map();
/** a plain coloured card stock with the paper's grain (cached per colour) */
export function stock(H, color, { flat = false, side = THREE.DoubleSide, opacity = 1 } = {}) {
  const k = color + flat + side + opacity; if (MATS.has(k)) return MATS.get(k);
  const m = paperMaterial({ color, normalMap: H.paper.normalMap, normalScale: 0.5, side });
  if (flat) m.flatShading = true;
  if (opacity < 1) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; }
  MATS.set(k, m); return m;
}
const thick = (shape, depth = 0.05) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 }); g.translate(0, 0, -depth / 2); return g; };
const V = (a) => new THREE.Vector3(...a);
/** run an effect: build(t0) returns { group, update(lt, dt) -> alive, dispose? } at time t on the stepped clock */
function effect(film, t, build) {
  film.at(t, (t) => {
    const e = build(t); if (!e) return; if (e.group) film.H.scene.add(e.group);
    film.fx.push({ smooth: !!e.smooth, live: !!e.live, update: (tt, dt) => e.update(tt - t, dt), dispose: () => { if (e.group) film.H.scene.remove(e.group); e.dispose?.(); } });
  });
}
const faceCam = (film, obj) => { const c = film.H.camera.position; obj.lookAt(c.x, c.y, c.z); };
const yawCam = (film, obj) => { const c = film.H.camera.position; obj.rotation.y = Math.atan2(c.x - obj.position.x, c.z - obj.position.z); };

/** a star outline: n spikes, outer r, inner r * k, seeded jag so it reads hand-cut */
export function starShape(n = 12, r = 1, k = 0.45, seed = 1) {
  const rr = P2.rng(seed), s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + Math.PI / 2, R = (i % 2 ? r * k : r) * (i % 2 ? 1 : 0.75 + rr() * 0.4); i ? s.lineTo(Math.cos(a) * R, Math.sin(a) * R) : s.moveTo(Math.cos(a) * R, Math.sin(a) * R); }
  s.closePath(); return s;
}
/** a flame tongue outline of height h (base on y = 0) */
export function flameShape(h = 2, w = 0.8, lean = 0.15, seed = 1) {
  const r = P2.rng(seed), s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.bezierCurveTo(-w * 0.75, h * 0.35, -w * (0.1 + r() * 0.2), h * 0.55, w * lean, h);
  s.bezierCurveTo(w * 0.05, h * 0.7, w * (0.55 + r() * 0.2), h * 0.45, w * 0.35, h * 0.32);
  s.bezierCurveTo(w * 0.55, h * 0.2, w * 0.55, h * 0.08, w / 2, 0);
  s.closePath(); return s;
}
/** a stacked flame card: three cut tongues (dark red, orange, yellow) laid one on another */
export function flameCard(H, h = 2.2, { colors = ['#a8231a', '#e8602a', '#f2b84a'], seed = 1 } = {}) {
  const g = new THREE.Group();
  colors.forEach((c, i) => { const k = 1 - i * 0.28, m = new THREE.Mesh(thick(flameShape(h * k, h * 0.42 * k, 0.12 + i * 0.05, seed + i)), stock(H, c)); m.position.set(0, 0, i * 0.04); m.castShadow = i === 0; g.add(m); });
  return g;
}

// ---- impacts ------------------------------------------------------------------------------------------------------
/**
 * A pop-up starburst: two or three stacked star cuts that pop open toward the camera with an overshoot, hold, and fold
 * shut on their lower edge. The tell glint (red / blue), the parry flare, a guard's spark core, a lightning landing.
 */
export function starburst(film, { t, at, r = 1.5, spikes = 12, colors = ['#1a0c08', '#c0281c', '#f4d6a0'], dur = 0.45, hold = 0.12, spin = 0.6, seed = 3, sound = null }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, group = new THREE.Group(), piv = new THREE.Group(); group.position.set(...at); group.add(piv);
    colors.forEach((c, i) => { const k = 1.18 - i * 0.32, m = new THREE.Mesh(thick(starShape(spikes, r * k, 0.42, seed + i)), stock(H, c)); m.position.z = i * 0.06; m.rotation.z = i * 0.13; piv.add(m); });
    return { group, update(lt) {
      if (lt > dur) return false;
      faceCam(film, group);
      const pop = lt < 0.08 ? easeOut(lt / 0.08) * 1.18 : lt < 0.16 ? lerp(1.18, 1, (lt - 0.08) / 0.08) : 1;
      const shut = clamp((lt - (dur - 0.14 - hold * 0)) / 0.14);
      piv.scale.setScalar(Math.max(0.001, pop)); piv.rotation.z = lt * spin; piv.rotation.x = -shut * Math.PI / 2; piv.visible = shut < 0.98;
      return true; } };
  });
}
/** a ring cut with saw teeth on its rim, opening outward flat on the ground (or upright toward the camera) */
export function sawRing(film, { t, at, r0 = 0.6, r1 = 5, teeth = 30, width = 0.45, color = '#e8efe6', dur = 0.6, upright = false, seed = 4 }) {
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), s = new THREE.Shape(), n = teeth * 2;
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, R = i % 2 ? 1 + width * (0.6 + rr() * 0.6) : 1; i ? s.lineTo(Math.cos(a) * R, Math.sin(a) * R) : s.moveTo(Math.cos(a) * R, Math.sin(a) * R); }
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.9, 0, Math.PI * 2, true); s.holes.push(hole);
    const m = new THREE.Mesh(thick(s, 0.04), stock(H, color)); m.receiveShadow = true; m.castShadow = upright;
    const group = new THREE.Group(); group.position.set(...at); group.add(m); if (!upright) m.rotation.x = -Math.PI / 2;
    return { group, update(lt) { const u = lt / dur; if (u > 1) return false; if (upright) faceCam(film, group); const R = lerp(r0, r1, easeOut(u)); m.scale.set(R, R, 1); m.visible = u < 0.95; m.position.y = upright ? 0 : 0.05; return true; } };
  });
}
/** a guard's sparks: gold-foil strips and slivers thrown out of a small foil star; `dir` the way they fly (radians) */
export function sparks(film, { t, at, dir = null, n = 22, colors = ['#f2c46a', '#e8873a', '#fff0c8', '#c99a3a'], size = 0.26, speed = 10, sound = 'clang', star = true, seed = 5 }) {
  shards(film, { t, at, n, colors, speed, up: 5, size, gravity: 30, dir, spread: dir === null ? Math.PI : 1.6, life: 0.9, shape: ['strip', 'tri', 'strip', 'diamond'], seed, sound, drag: 2.5 });
  if (star) starburst(film, { t, at, r: 0.9, spikes: 10, colors: ['#5a3a14', '#e8a33a', '#fff0c8'], dur: 0.32, hold: 0.04, seed: seed + 1 });
}

// ---- the tell glint ---------------------------------------------------------------------------------------------------
/** a spindle outline: a long strip pointed at both ends, swollen in the middle, edges a little hand-cut */
export function spindleShape(L = 4, h = 0.3, seed = 1, { n = 28, jag = 0.06, p = 1.7 } = {}) {
  const r = P2.rng(seed), s = new THREE.Shape(), prof = (u) => h * Math.pow(1 - Math.abs(u), p);
  for (let i = 0; i <= n; i++) { const u = -1 + 2 * i / n, y = prof(u) * (1 + (i % n ? (r() - 0.5) * jag * 2 : 0)); i ? s.lineTo(u * L, y) : s.moveTo(u * L, y); }
  for (let i = n - 1; i > 0; i--) { const u = -1 + 2 * i / n; s.lineTo(u * L, -prof(u) * (1 + (r() - 0.5) * jag * 2)); }
  s.closePath(); return s;
}
const GLINT = {
  red: { streak: ['#4a080a', '#a8160f', '#e8402a', '#ffb49a', '#fff4ec'], star: ['#4a080a', '#e8402a', '#fff4ec'] },
  blue: { streak: ['#0a1e44', '#1f5cb8', '#5ea4f0', '#bfe0ff', '#ffffff'], star: ['#0a1e44', '#5ea4f0', '#ffffff'] },
};
/**
 * The tell glint, cut from paper the way the game's lens flare reads: one long horizontal streak through a bright star
 * at the weapon. The streak is five stacked spindle strips (dark rim -> hot core, each shorter and thinner, layered toward
 * the camera), with loose slivers above and below and a short upright spindle crossing the star. It shoots out sideways
 * from the star like a strip pulled through a slot, hangs through the hit-stop (it runs on the real clock, stepped at
 * 15 fps, its slivers creeping outward), then snaps back into the star and the star flips shut.
 * color: 'red' (unblockable: 魂 shadow-steps) | 'blue' (parryable: 魂 deflects). len: half-length of the streak.
 */
export function glint(film, { t, at, color = 'red', len = 9, h = 0.42, hold = 0.32, seed = 5, sound = null }) {
  if (sound) film.sound(t, sound);
  const pal = GLINT[color] ?? GLINT.red, open = 0.1, close = 0.16, life = open + hold + 0.12 + close;
  effect(film, t, (t) => {
    const { H } = film, rr = P2.rng(seed), group = new THREE.Group(); group.position.set(...at);
    const streak = new THREE.Group(), cross = new THREE.Group(), star = new THREE.Group(), slivers = new THREE.Group();
    group.add(slivers, streak, cross, star);
    const K = [[1, 1], [0.86, 0.72], [0.7, 0.48], [0.5, 0.28], [0.3, 0.14]];   // [length, height] per layer, rim -> core
    pal.streak.forEach((c, i) => { const m = new THREE.Mesh(thick(spindleShape(len * K[i][0], h * K[i][1], seed + i), 0.03), stock(H, c)); m.position.z = i * 0.035; m.castShadow = false; streak.add(m); });
    pal.streak.slice(2).forEach((c, i) => { const m = new THREE.Mesh(thick(spindleShape(h * (2.6 - i * 0.6), h * (0.34 - i * 0.08), seed + 9 + i), 0.03), stock(H, c)); m.rotation.z = Math.PI / 2; m.position.z = 0.2 + i * 0.035; cross.add(m); });
    pal.star.forEach((c, i) => { const m = new THREE.Mesh(thick(starShape(i ? 8 : 4, h * (2.4 - i * 0.55), i ? 0.3 : 0.16, seed + 20 + i), 0.04), stock(H, c)); m.position.z = 0.3 + i * 0.04; m.rotation.z = i * 0.39; star.add(m); });
    const sl = [];
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1, y = side * h * (0.9 + rr() * 1.6), L = len * (0.18 + rr() * 0.3), x = (rr() - 0.5) * len * 0.9;
      const m = new THREE.Mesh(thick(spindleShape(L, h * (0.08 + rr() * 0.07), seed + 40 + i, { jag: 0.1 }), 0.025), stock(H, pal.streak[1 + (i % 3)]));
      m.position.set(x, y, 0.1); slivers.add(m); sl.push({ m, x, dir: x < 0 ? -1 : 1 });
    }
    return { group, live: true, update() {
      const lr = Math.floor((film.rt - film.realOf(t)) * 15 + 1e-6) / 15;
      if (lr > life) return false;
      faceCam(film, group);
      const shut = clamp((lr - (life - close)) / close);
      const out = lr < open ? easeOut(lr / open) * 1.12 : lr < open + 0.07 ? lerp(1.12, 1, (lr - open) / 0.07) : 1;
      const sx = Math.max(0.001, out * (1 - easeIn(shut)));
      streak.scale.set(sx, 1 + 0.06 * Math.sin(lr * 40), 1);
      slivers.scale.set(sx, 1, 1); sl.forEach((s) => { s.m.position.x = s.x + s.dir * lr * len * 0.25; s.m.visible = lr > 0.05 && shut < 0.5; });
      cross.scale.set(1, Math.max(0.001, out * (1 - shut)), 1);
      const pop = lr < 0.06 ? easeOut(lr / 0.06) * 1.3 : lr < 0.14 ? lerp(1.3, 1, (lr - 0.06) / 0.08) : 1;
      star.scale.setScalar(Math.max(0.001, pop)); star.rotation.z = lr * 0.8; star.rotation.x = -shut * Math.PI / 2; star.visible = shut < 0.98;
      return true; } };
  });
  return t + life;
}

// ---- the shadow-step ------------------------------------------------------------------------------------------------
/**
 * Torn black and red scraps: out = 魂 bursts into a whirl of scraps that spiral up and away; in = scraps whirl in from
 * around `at` and close into him. The pair is the shadow-step (瞬身).
 */
export function scraps(film, { t, at, out = true, n = 34, r = 2.4, h = 3.2, dur = 0.42, colors = ['#141012', '#241a1c', '#3a2224', '#8e1a14', '#b3231a'], seed = 7, sound = null }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), group = new THREE.Group(); group.position.set(...at);
    const geos = [0, 1, 2].map(() => paperBit('scrap', rr, 0.03)), items = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geos[i % 3], stock(H, colors[i % colors.length])); m.castShadow = true; m.scale.setScalar(0.18 + rr() * 0.3); group.add(m);
      items.push({ m, a: rr() * Math.PI * 2, y: rr() * h, R: r * (0.5 + rr() * 0.7), w: (rr() < 0.5 ? -1 : 1) * (5 + rr() * 5), d: rr() * 0.12, sp: rr() * 10 });
    }
    return { group, update(lt) {
      if (lt > dur + 0.15) return false;
      for (const it of items) {
        const u = clamp((lt - it.d) / dur), k = out ? easeOut(u) : 1 - easeIn(u);   // k: 0 at 魂, 1 out at the whirl
        const a = it.a + it.w * (out ? u : 1 - u) * 0.6, R = lerp(0.3, it.R, k), y = out ? lerp(it.y * 0.6 + 0.4, it.y + 1.5, k) : lerp(it.y * 0.6 + 0.4, it.y + 1.0, k);
        it.m.position.set(Math.cos(a) * R, y, Math.sin(a) * R); it.m.rotation.set(it.sp + lt * 9, it.sp * 2 + lt * 7, lt * 5);
        it.m.visible = out ? u < 0.97 : u > 0.02 && u < 0.98;
      }
      return true; } };
  });
}

// ---- fire -----------------------------------------------------------------------------------------------------------
/** a column of flame tongues wound up a helix, popping up bottom to top on their folds, turning, folding back down */
export function flameColumn(film, { t, at, h = 10, r = 1.1, n = 18, dur = 1.3, colors, seed = 9, sound = 'pillar' }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, group = new THREE.Group(), turn = new THREE.Group(); group.position.set(at[0], at[1] ?? 0, at[2]); group.add(turn);
    const items = [];
    for (let i = 0; i < n; i++) {
      const u = i / n, a = i * 0.9, hh = lerp(2.6, 1.6, u), y = u * (h - hh);
      const hold = new THREE.Group(); hold.position.set(Math.cos(a) * r * (1 - u * 0.3), y, Math.sin(a) * r * (1 - u * 0.3)); hold.rotation.y = -a + Math.PI / 2;
      const piv = new THREE.Group(); hold.add(piv); piv.add(flameCard(H, hh, { colors, seed: seed + i })); turn.add(hold);
      items.push({ piv, d: u * 0.3, out: u * 0.15 + (dur - 0.35) });
    }
    return { group, update(lt) {
      if (lt > dur + 0.3) return false;
      turn.rotation.y = lt * 2.2;
      for (const it of items) { const up = easeOut(clamp((lt - it.d) / 0.14)), dn = easeIn(clamp((lt - it.out) / 0.2)); it.piv.rotation.x = (Math.PI / 2) * (1 - up) + (Math.PI / 2) * dn; it.piv.visible = up > 0.02 && dn < 0.98; }
      return true; } };
  });
}
/** a line of flame tongues popping up one after another from `from` to `to` ([x, z]): fire breath, a fire stream */
export function flameLine(film, { t, from, to, n = 12, h = 2.6, step = 0.035, life = 0.55, colors, seed = 11, sound = 'flame', y = 0 }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, group = new THREE.Group(), items = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), hold = new THREE.Group(); hold.position.set(lerp(from[0], to[0], u), y, lerp(from[1], to[1], u));
      const piv = new THREE.Group(); hold.add(piv); piv.add(flameCard(H, h * (0.75 + 0.5 * Math.sin(u * Math.PI)), { colors, seed: seed + i })); group.add(hold);
      items.push({ hold, piv, d: i * step });
    }
    return { group, update(lt) {
      if (lt > n * step + life + 0.2) return false;
      for (const it of items) { yawCam(film, it.hold); const l = lt - it.d, up = easeOut(clamp(l / 0.1)), dn = easeIn(clamp((l - life) / 0.16)); it.piv.rotation.x = -(Math.PI / 2) * (1 - up) - (Math.PI / 2) * dn; it.piv.visible = l > 0 && dn < 0.98; }
      return true; } };
  });
}
/** a crumpled paper ball flying from -> to on an arc ([x, y, z]); bursts open at the end if `burst` */
export function paperBall(film, { t, from, to, dur = 0.55, arc = 2.5, r = 0.7, colors = ['#e8602a', '#f2b84a'], seed = 13, sound = 'cannon', burst = true, floor = 0 }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), geo = new THREE.IcosahedronGeometry(r, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 0.7 + rr() * 0.5; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, stock(H, colors[0], { flat: true })); m.castShadow = true;
    const group = new THREE.Group(); group.add(m);
    return { group, update(lt) { const u = lt / dur; if (u > 1) return false; group.position.set(lerp(from[0], to[0], u), lerp(from[1], to[1], u) + arc * 4 * u * (1 - u), lerp(from[2], to[2], u)); m.rotation.set(lt * 9, lt * 6, 0); return true; } };
  });
  if (burst) popBurst(film, { t: t + dur, at: [to[0], floor, to[2]], r: 2.6, colors: [colors[0], ...colors, '#a8231a'], seed: seed + 3 });
}

// ---- bursts -----------------------------------------------------------------------------------------------------------
/**
 * A pop-up burst: petals hinged round a centre lie flat, spring up outward like a pop-up flower opening, then fold
 * flat again; crumpled scraps and strips fly from the middle. An explosion, a slam, a shell landing, a ground burst.
 */
export function popBurst(film, { t, at, r = 3, petals = 11, colors = ['#e8602a', '#f2b84a', '#a8231a'], h = null, crumple = 10, dur = 0.7, seed = 15, sound = 'boom' }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), group = new THREE.Group(); group.position.set(at[0], (at[1] ?? 0) + 0.02, at[2]); const items = [];
    for (let i = 0; i < petals * 2; i++) {
      const inner = i >= petals, a = (i % petals) / petals * Math.PI * 2 + (inner ? Math.PI / petals : 0) + (rr() - 0.5) * 0.2, L = (h ?? r) * (inner ? 0.6 : 1) * (0.75 + rr() * 0.5), w = L * 0.34;
      const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w * 0.3, L * 0.6); s.lineTo(0, L); s.lineTo(w * 0.3, L * 0.6); s.lineTo(w / 2, 0); s.closePath();
      const m = new THREE.Mesh(thick(s, 0.05), stock(H, colors[(i + (inner ? 1 : 0)) % colors.length])); m.castShadow = true;
      const hold = new THREE.Group(); hold.position.set(Math.cos(a) * r * 0.12, inner ? 0.03 : 0, Math.sin(a) * r * 0.12); hold.rotation.y = -a + Math.PI / 2;
      const piv = new THREE.Group(); hold.add(piv); piv.add(m); group.add(hold);
      const sp = new FlapSpring({ p: 0, size: 0.2 + L / 20 }); sp.set(1);
      items.push({ piv, sp, d: rr() * 0.05 + (inner ? 0.04 : 0), lean: 0.35 + rr() * 0.3 });
    }
    return { group, update(lt, dt) {
      let alive = lt < 0.5;
      for (const it of items) {
        if (lt < it.d) { it.piv.rotation.x = Math.PI / 2; alive = true; continue; }
        if (lt > it.d + dur * 0.55) it.sp.set(0);
        const p = it.sp.step(dt); if (!(it.sp.target === 0 && it.sp.atRest)) alive = true;
        it.piv.rotation.x = (Math.PI / 2 - 0.01) * (1 - p) - it.lean * p; it.piv.visible = p > 0.02;
      }
      return alive; } };
  });
  if (crumple) shards(film, { t, at: [at[0], (at[1] ?? 0) + 0.6, at[2]], n: crumple, colors, speed: 7, up: 9, size: 0.3, shape: ['scrap', 'strip'], seed: seed + 1, life: 1.4, ground: at[1] ?? 0 });
}

// ---- ice ------------------------------------------------------------------------------------------------------------
const ICE = ['#e6f0f2', '#b8d3dc', '#8fb2c2'];
/** folded-paper ice crystals (four-sided spikes) popping up in a row from `from` to `to` ([x, z]), then tipping flat */
export function crystals(film, { t, from, to, n = 9, h = 2.8, step = 0.04, life = 0.7, colors = ICE, spread = 0.6, seed = 17, sound = 'ice', y = 0 }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), group = new THREE.Group(), items = []; group.position.y = y;
    for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) {
      const u = i / Math.max(1, n - 1), hh = h * (0.5 + rr() * 0.7) * (k ? 0.6 : 1), geo = new THREE.ConeGeometry(hh * 0.28, hh, 4, 1); geo.translate(0, hh / 2, 0);
      const m = new THREE.Mesh(geo, stock(H, colors[(i + k) % colors.length], { flat: true })); m.castShadow = true;
      const hold = new THREE.Group(); hold.position.set(lerp(from[0], to[0], u) + (rr() - 0.5) * spread * 2, 0, lerp(from[1], to[1], u) + (rr() - 0.5) * spread * 2);
      hold.rotation.set((rr() - 0.5) * 0.6, rr() * 3, (rr() - 0.5) * 0.6); hold.add(m); group.add(hold);
      items.push({ m, d: i * step + k * 0.03 });
    }
    return { group, update(lt) {
      if (lt > n * step + life + 0.25) return false;
      for (const it of items) { const l = lt - it.d, up = l < 0.08 ? easeOut(l / 0.08) * 1.15 : l < 0.14 ? lerp(1.15, 1, (l - 0.08) / 0.06) : 1, dn = easeIn(clamp((l - life) / 0.2)); it.m.scale.set(1, Math.max(0.001, up * (1 - dn)), 1); it.m.visible = l > 0 && dn < 0.98; }
      return true; } };
  });
}
/** a faceted folded-vellum block closing round a point (the freeze), held until t1, then shattering into facets */
export function iceBlock(film, { t, t1, at, h = 4, w = 2.2, colors = ICE, seed = 19 }) {
  film.sound(t, 'freeze'); film.sound(t1, 'shatter');
  effect(film, t, () => {
    const { H } = film, geo = new THREE.IcosahedronGeometry(1, 0), group = new THREE.Group(); group.position.set(at[0], at[1] ?? 0, at[2]);
    const m = new THREE.Mesh(geo, stock(H, colors[1], { flat: true, opacity: 0.72 })); m.scale.set(w / 2, h / 2, w / 2.4); m.position.y = h / 2; group.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#6f93a6' })); e.scale.copy(m.scale); e.position.copy(m.position); group.add(e);
    return { group, update(lt) {
      if (lt > t1 - t) return false;
      const k = lt < 0.14 ? easeOut(lt / 0.14) : 1; group.scale.set(1, k, 1); group.rotation.y = 0.3;
      return true; }, dispose() { geo.dispose(); } };
  });
  shards(film, { t: t1, at: [at[0], (at[1] ?? 0) + h * 0.5, at[2]], ground: at[1] ?? 0, n: 30, colors: [...colors, '#ffffff'], speed: 8, up: 7, size: 0.5, shape: ['facet', 'tri'], seed: seed + 1, life: 1.4 });
  sawRing(film, { t: t1, at: [at[0], (at[1] ?? 0) + 0.05, at[2]], r1: 4, color: colors[0], seed });
}

// ---- lightning and wind ---------------------------------------------------------------------------------------------------
/**
 * Lightning: a strip of card folded into an accordion, snapping open from the cloud down to the ground in a zig-zag
 * (panels alternate their fold), flickering once, then pulled back up; a pop-up star and a saw ring where it lands.
 */
export function zigzag(film, { t, from, to, width = 0.7, n = 11, colors = ['#2a2418', '#f4e9b0', '#fffbe8'], dur = 0.42, seed = 21, sound = 'bolt', land = true }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), A = V(from), B = V(to), group = new THREE.Group(), panels = [];
    const dir = B.clone().sub(A), L = dir.length(); dir.normalize();
    const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1)); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize();
    let p = A.clone();
    for (let i = 0; i < n; i++) {
      const q = A.clone().addScaledVector(dir, L * (i + 1) / n).addScaledVector(side, i === n - 1 ? 0 : (i % 2 ? 1 : -1) * L * 0.06 * (0.6 + rr() * 0.8));
      const seg = new THREE.Group(); seg.position.copy(p); seg.lookAt(q); const len = p.distanceTo(q);
      colors.forEach((c, k) => { const wk = width * (1.3 - k * 0.38), m = new THREE.Mesh(new THREE.BoxGeometry(wk, 0.04, len), stock(H, c)); m.position.set(0, k * 0.03, len / 2); m.castShadow = k === 0; seg.add(m); });
      seg.rotateZ((i % 2 ? 1 : -1) * 0.7);   // the accordion: neighbouring panels folded opposite ways
      group.add(seg); panels.push({ seg, d: i / n * 0.1 }); p = q;
    }
    return { group, update(lt) {
      if (lt > dur) return false;
      const flick = lt > dur * 0.45 && lt < dur * 0.55, back = clamp((lt - dur * 0.7) / (dur * 0.3));
      panels.forEach((pn, i) => { pn.seg.visible = lt >= pn.d && !flick && i / n >= back; });
      return true; } };
  });
  if (land) { starburst(film, { t: t + 0.08, at: [to[0], to[1] + 0.8, to[2]], r: 1.6, colors: ['#2a2418', '#f4e9b0', '#ffffff'], dur: 0.35, seed }); sawRing(film, { t: t + 0.08, at: [to[0], 0, to[2]], r1: 4, color: '#f4e9b0', seed }); }
}
/** quilled paper curls (flat spiral ribbons) tumbling along a path: wind, a gust, a wind blade's wake */
export function curls(film, { t, from, to, n = 7, r = 0.9, dur = 0.8, colors = ['#7fb3a8', '#cfe3dc', '#4f8a80'], seed = 23, sound = 'gust', spread = 1.6 }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), group = new THREE.Group(), items = [];
    for (let i = 0; i < n; i++) {
      const pts = []; for (let k = 0; k <= 60; k++) { const a = k / 60 * Math.PI * 5, R = r * (0.15 + 0.85 * k / 60); pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0)); }
      const ribbon = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.05, 3, false), stock(H, colors[i % colors.length])); ribbon.scale.set(1, 1, 2.4); ribbon.castShadow = true;
      const g = new THREE.Group(); g.add(ribbon); group.add(g);
      items.push({ g, d: rr() * 0.25, off: [(rr() - 0.5) * spread * 2, (rr() - 0.5) * spread, (rr() - 0.5) * spread * 2], s: 0.6 + rr() * 0.7, w: 4 + rr() * 6 });
    }
    return { group, update(lt) {
      if (lt > dur + 0.3) return false;
      for (const it of items) { const u = clamp((lt - it.d) / dur); it.g.visible = u > 0 && u < 1; it.g.position.set(lerp(from[0], to[0], u) + it.off[0], lerp(from[1], to[1], u) + it.off[1] + Math.sin(u * 9) * 0.3, lerp(from[2], to[2], u) + it.off[2]); it.g.rotation.set(lt * 2, lt * it.w, lt * 3); it.g.scale.setScalar(it.s * Math.sin(Math.PI * u) ** 0.4); }
      return true; } };
  });
}

// ---- the paper chain --------------------------------------------------------------------------------------------------
/**
 * A chain of folded paper loops (each loop a short paper band, neighbours turned 90 degrees, like a festival paper
 * chain). path(u, lt) -> [x, y, z] along the chain from its root (u = 0) to its tip (u = 1) at time lt; reach(lt) ->
 * how much of it is out (0..1). A chain lash, a hook throw, a ring of chain closing round the arena.
 */
export function paperChain(film, { t, dur = 1, path, reach = (lt) => 1, links = 30, size = 0.32, colors = ['#5a5c62', '#3a3b40'], hook = null, sound = 'chain', smooth: sm = false }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, group = new THREE.Group(), loops = [];
    const geo = new THREE.CylinderGeometry(size, size, size * 0.55, 10, 1, true); geo.rotateX(Math.PI / 2); geo.scale(1, 1.45, 1);
    for (let i = 0; i < links; i++) { const m = new THREE.Mesh(geo, stock(H, colors[i % colors.length])); m.castShadow = true; group.add(m); loops.push(m); }
    let tip = null;
    if (hook) { tip = new THREE.Group(); const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.9, 0.2, 1.1, 1.0); s.lineTo(0.85, 0.85); s.quadraticCurveTo(0.7, 0.35, 0, 0.3); s.closePath(); const m = new THREE.Mesh(thick(s, 0.08), stock(H, hook)); m.scale.setScalar(1.6); m.castShadow = true; tip.add(m); group.add(tip); }
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    return { group, smooth: sm, update(lt) {
      if (lt > dur) return false;
      const k = clamp(reach(lt));
      loops.forEach((m, i) => { const u = (i + 0.5) / links * k; m.visible = k > 0.01; a.set(...path(u, lt)); b.set(...path(Math.min(1, u + 0.01), lt)); m.position.copy(a); m.lookAt(b); m.rotateZ(i % 2 ? Math.PI / 2 : 0); });
      if (tip) { tip.visible = k > 0.01; a.set(...path(k, lt)); b.set(...path(Math.max(0, k - 0.02), lt)); tip.position.copy(a); tip.lookAt(film.H.camera.position); }
      return true; }, dispose() { geo.dispose(); } };
  });
}

// ---- water ------------------------------------------------------------------------------------------------------------
/**
 * A waterfall of paper strips: pale strips slide down a curtain (x, z, width w, from height h to the pool), each strip
 * re-entering at the top, on the stepped clock; foam flaps pop at the foot. visible(t) gates it (an arena not yet up).
 */
export function paperFalls(film, { at, w = 6, h = 12, n = 34, colors = ['#dfe8e2', '#c5d6cf', '#eef2ec', '#aebfb8'], speed = 7, z = 0, seed = 25, visible = () => true, lean = 0.12 }) {
  const { H } = film, rr = P2.rng(seed), group = new THREE.Group(); group.position.set(...at); H.scene.add(group);
  const items = [];
  for (let i = 0; i < n; i++) {
    const L = 2.4 + rr() * 3.2, wd = 0.1 + rr() * 0.18, m = new THREE.Mesh(new THREE.BoxGeometry(wd, L, 0.04), stock(H, colors[i % colors.length])); m.castShadow = true; group.add(m);
    items.push({ m, x: (rr() - 0.5) * w, z: (rr() - 0.5) * 0.6 + z, ph: rr() * h, L, sp: speed * (0.8 + rr() * 0.4) });
  }
  const foam = [];
  for (let i = 0; i < 9; i++) { const hold = new THREE.Group(); hold.position.set((i / 8 - 0.5) * w * 1.1, 0, 0.6 + (i % 2) * 0.3); const piv = new THREE.Group(); hold.add(piv); const s = new THREE.Shape(); s.moveTo(-0.4, 0); s.quadraticCurveTo(-0.35, 0.9, 0, 1.3); s.quadraticCurveTo(0.35, 0.9, 0.4, 0); s.closePath(); const m = new THREE.Mesh(thick(s, 0.04), stock(H, colors[i % 2])); m.castShadow = true; piv.add(m); group.add(hold); foam.push({ piv, ph: i * 0.37 }); }
  film.every((t) => {
    group.visible = visible(t); if (!group.visible) return;
    const tq = Math.floor(t * film.fxFps) / film.fxFps;
    for (const it of items) { const y = h - ((it.ph + tq * it.sp) % h); it.m.position.set(it.x, y, it.z + (h - y) * lean * 0.15); it.m.rotation.x = -lean; const k = clamp(Math.min(y / 1.0, (h - y) / 1.0)); it.m.scale.set(1, Math.max(0.05, k), 1); }
    for (const f of foam) { const u = (tq * 2.2 + f.ph) % 1; f.piv.rotation.x = (Math.PI / 2) * (1 - Math.sin(Math.PI * u)); f.piv.scale.setScalar(0.8 + 0.5 * Math.sin(Math.PI * u)); }
  });
  return group;
}

// ---- afterimages and serpents ------------------------------------------------------------------------------------------
const ghostCache = new Map();
/**
 * An afterimage: a pale print of an actor's card left standing where she was (a blink-dash), that tips back flat and
 * is gone. img: the actor's PNG; at [x, z]; face 1 | -1.
 */
export function afterimage(film, { t, img, at, height = 6, face = 1, tint = '#f4efe6', alpha = 0.62, hold = 0.12, dur = 0.5 }) {
  effect(film, t, () => {
    const { H } = film, key = img.src + height + tint + alpha;
    if (!ghostCache.has(key)) {
      const [pts, paint] = imagePiece(img, height);
      const card = makeCard(pts, { paint: (P) => { paint(P); P.draw((g) => { g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alpha; g.fillStyle = tint; g.fillRect(P.box.x0 - 1, P.box.y0 - 1, P.box.w + 2, P.box.h + 2); g.restore(); }); }, paper: H.paper, thickness: 0.05, edgeWidth: 0.04, pxPerUnit: 60, back: 'kraft', folds: [] });
      ghostCache.set(key, card);
    }
    const card = ghostCache.get(key).clone(), group = new THREE.Group(), piv = new THREE.Group(); group.position.set(at[0], 0, at[1]); group.add(piv); piv.add(card); card.scale.x = face;
    return { group, update(lt) {
      if (lt > hold + dur) return false;
      yawCam(film, group); const u = easeIn(clamp((lt - hold) / dur)); piv.rotation.x = -u * Math.PI / 2; piv.position.z = -u * 0.6;
      return true; } };
  });
}
/**
 * A paper serpent: an accordion body of stacked rib cards (each a cut lens standing across the body's path, colours
 * alternating like a folded paper snake) behind a cut head with an open jaw. path(u) -> [x, y, z] (u 0 = tail end
 * of the track, 1 = its end); lead(lt) -> where the head is on the track (0..1); body = the share of the track the body
 * covers. Rises out of the ground, coils, strikes.
 */
export function paperSerpent(film, { t, dur = 2, path, lead = (lt) => lt / dur, n = 30, size = 1.1, body = 0.4, colors = ['#ece6d6', '#c9c0aa'], headColor = null, eye = '#b3231a', sound = 'serpent', seed = 31 }) {
  if (sound) film.sound(t, sound, { dur });
  effect(film, t, () => {
    const { H } = film, group = new THREE.Group(), ribs = [];
    for (let i = 0; i < n; i++) {
      const w = size * (1 - (i / n) * 0.65), s = new THREE.Shape(); s.moveTo(-w, 0); s.quadraticCurveTo(-w * 0.8, w * 1.1, 0, w * 1.25); s.quadraticCurveTo(w * 0.8, w * 1.1, w, 0); s.quadraticCurveTo(w * 0.8, -w * 1.0, 0, -w * 1.1); s.quadraticCurveTo(-w * 0.8, -w * 1.0, -w, 0);
      const m = new THREE.Mesh(thick(s, 0.06), stock(H, colors[i % colors.length])); m.castShadow = true; group.add(m); ribs.push(m);
    }
    // the head: a side-view cut with an open jaw, an eye and two fangs, snout toward +x
    const hs = size * 2.2, head = new THREE.Group(), hp = new THREE.Shape();
    hp.moveTo(-hs * 0.5, hs * 0.25); hp.quadraticCurveTo(-hs * 0.1, hs * 0.55, hs * 0.6, hs * 0.22); hp.lineTo(hs * 0.95, hs * 0.1); hp.lineTo(hs * 0.35, -hs * 0.02); hp.lineTo(hs * 0.9, -hs * 0.2); hp.lineTo(hs * 0.5, -hs * 0.32); hp.quadraticCurveTo(-hs * 0.1, -hs * 0.4, -hs * 0.5, -hs * 0.2); hp.closePath();
    const hm = new THREE.Mesh(thick(hp, 0.1), stock(H, headColor ?? colors[0])); hm.castShadow = true; head.add(hm);
    const em = new THREE.Mesh(thick(starShape(6, hs * 0.08, 0.5, seed), 0.04), stock(H, eye)); em.position.set(hs * 0.2, hs * 0.22, 0.08); head.add(em);
    const em2 = em.clone(); em2.position.z = -0.08; head.add(em2);
    for (const fx of [0.55, 0.75]) { const f = new THREE.Shape(); f.moveTo(0, 0); f.lineTo(hs * 0.05, -hs * 0.16); f.lineTo(hs * 0.1, 0); f.closePath(); const fm = new THREE.Mesh(thick(f, 0.04), stock(H, '#f4efe6')); fm.position.set(hs * fx, hs * 0.06, 0); head.add(fm); }
    group.add(head);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    return { group, update(lt) {
      if (lt > dur) return false;
      const L = clamp(lead(lt));
      ribs.forEach((m, i) => { const u = L - (i + 1) / n * body; m.visible = u >= 0; if (u < 0) return; a.set(...path(u)); b.set(...path(Math.min(1, u + 0.005))); m.position.copy(a); m.lookAt(b); m.rotateZ(i % 2 ? 0.18 : -0.18); });
      head.visible = L > 0.005; a.set(...path(L)); b.set(...path(Math.max(0, L - 0.01)));
      head.position.copy(a); const d = a.clone().sub(b); head.rotation.set(0, Math.atan2(-d.z, d.x), 0); head.rotateZ(Math.atan2(d.y, Math.hypot(d.x, d.z)));
      return true; } };
  });
}

/** sword qi: a thick cut crescent (dark backing, colour, pale core) flying from -> to ([x, y, z]) facing the camera */
export function crescentShot(film, { t, from, to, dur = 0.4, r = 1.6, colors = ['#1a0c08', '#c0281c', '#f4d6a0'], spin = 0, seed = 33, sound = 'slash', burst = null }) {
  if (sound) film.sound(t, sound);
  effect(film, t, () => {
    const { H } = film, group = new THREE.Group(), piv = new THREE.Group(); group.add(piv);
    colors.forEach((c, i) => {
      const k = 1.15 - i * 0.22, s = new THREE.Shape(); s.absarc(0, 0, r * k, -1.2, 1.2, false); s.absarc(r * 0.35, 0, r * k * 0.82, 1.05, -1.05, true); s.closePath();
      const m = new THREE.Mesh(thick(s, 0.06), stock(H, c)); m.position.z = i * 0.05; m.castShadow = i === 0; piv.add(m);
    });
    const dir = Math.sign(to[0] - from[0]) || 1; piv.scale.x = dir;
    return { group, update(lt) { const u = lt / dur; if (u > 1) return false; group.position.set(lerp(from[0], to[0], u), lerp(from[1], to[1], u), lerp(from[2], to[2], u)); faceCam(film, group); piv.rotation.z = spin * lt; return true; } };
  });
  if (burst) popBurst(film, { t: t + dur, at: [to[0], 0, to[2]], r: 1.8, colors: burst, crumple: 5, seed, sound: 'thud' });
}

/**
 * A boulder: a faceted folded-paper rock (an irregular icosahedron, flat shaded) that drops out of the sky at t, lands
 * at `at` with a bounce and a dust burst, and stays standing until `until` (then it shatters into facets if `shatter`).
 */
export function boulder(film, { t, at, size = [2.6, 3.4, 2.2], until = 1e9, shatter = true, color = '#7a7068', seed = 41, from = 26, fall = 0.4 }) {
  film.sound(t + fall, 'rockfall');
  effect(film, t, () => {
    const { H } = film, rr = P2.rng(seed), geo = new THREE.IcosahedronGeometry(1, 0), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 0.8 + rr() * 0.35; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, stock(H, color, { flat: true })); m.scale.set(size[0] / 2, size[1] / 2, size[2] / 2); m.castShadow = true; m.receiveShadow = true; m.rotation.set(rr() * 0.4, rr() * 3, rr() * 0.4);
    const group = new THREE.Group(); group.add(m); group.position.set(at[0], 0, at[2]);
    const y0 = (at[1] ?? 0) + size[1] / 2 * 0.85;
    return { group, smooth: true, update(lt) {
      if (t + lt > until) return false;
      if (lt < fall) { const u = lt / fall; group.position.y = lerp(from, y0, u * u); m.rotation.y += 0.05; }
      else { const b = lt - fall; group.position.y = y0 + Math.max(0, Math.sin(Math.min(1, b / 0.18) * Math.PI) * 0.5 * Math.exp(-b * 4)); }
      return true; } };
  });
  popBurst(film, { t: t + fall, at: [at[0], at[1] ?? 0, at[2]], r: size[0] * 1.1, colors: ['#8a7e72', '#5e544c', '#c8b8a0'], crumple: 8, seed, sound: null });
  film.at(t + fall, () => film.kick(0.7));
  if (shatter && until < 1e8) shards(film, { t: until, at: [at[0], (at[1] ?? 0) + size[1] * 0.5, at[2]], n: 26, colors: [color, '#5e544c', '#a89c90'], speed: 7, up: 6, size: 0.45, shape: ['facet', 'tri'], seed: seed + 1, life: 1.4, sound: 'shatter' });
}
/** a cannon's aim line: a thin red thread drawn from `from` to `to` that flickers, then snaps away when the shot goes */
export function aimLine(film, { t, from, to, dur = 0.7, color = '#e0281c' }) {
  film.sound(t, 'aim');
  effect(film, t, () => {
    const { H } = film, A = V(from), Bv = V(to), L = A.distanceTo(Bv), m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 1), stock(H, color));
    const group = new THREE.Group(); group.position.copy(A); group.lookAt(Bv); m.position.z = L / 2; group.add(m);
    return { group, update(lt) { if (lt > dur) return false; const grow = Math.min(1, lt / 0.15); m.scale.z = L * grow; m.position.z = L * grow / 2; m.visible = !(lt > dur * 0.6 && Math.floor(lt * 30) % 2); return true; } };
  });
}

/**
 * Flying swords (万剑): folded gold-foil swords that rise from `from` to hover points (`hover`: [[x, y, z], ...]), turn
 * their points on their targets (`targets`, one per sword), hang, then plunge and stand stuck in the ground until `until`.
 */
export function swords(film, { t, from, hover, targets, rise = 0.5, hang = 0.35, fly = 0.22, stagger = 0.03, until = null, colors = ['#7a5a1a', '#e8c060', '#fff0c8'], len = 2.6, seed = 51, sound = 'swords' }) {
  if (sound) { film.sound(t, 'swordsGather'); film.sound(t + rise + hang, sound); }
  effect(film, t, () => {
    const { H } = film, group = new THREE.Group(), items = [];
    const blade = new THREE.Shape(); blade.moveTo(0, len); blade.lineTo(0.16, len * 0.82); blade.lineTo(0.13, 0); blade.lineTo(-0.13, 0); blade.lineTo(-0.16, len * 0.82); blade.closePath();
    const bg = thick(blade, 0.05), gg = new THREE.BoxGeometry(0.7, 0.14, 0.12), hg = new THREE.BoxGeometry(0.12, 0.7, 0.1);
    hover.forEach((hv, i) => {
      const s = new THREE.Group(), inner = new THREE.Group(); s.add(inner);
      const b = new THREE.Mesh(bg, stock(H, colors[1])); b.castShadow = true; inner.add(b);
      const core = new THREE.Mesh(thick((() => { const c = new THREE.Shape(); c.moveTo(0, len * 0.95); c.lineTo(0.05, len * 0.8); c.lineTo(0.04, 0.1); c.lineTo(-0.04, 0.1); c.lineTo(-0.05, len * 0.8); c.closePath(); return c; })(), 0.02), stock(H, colors[2])); core.position.z = 0.04; inner.add(core);
      const guard = new THREE.Mesh(gg, stock(H, colors[0])); inner.add(guard); const hilt = new THREE.Mesh(hg, stock(H, '#2a2018')); hilt.position.y = -0.4; inner.add(hilt);
      inner.rotation.x = -Math.PI / 2;   // the blade lies along -z of s: s.lookAt(target) points it
      group.add(s); items.push({ s, hv: new THREE.Vector3(...hv), tg: new THREE.Vector3(...targets[i % targets.length]), d: i * stagger });
    });
    const F = new THREE.Vector3(...from), tmp = new THREE.Vector3(), end = until === null ? 1e9 : until - t;
    return { group, smooth: true, update(lt) {
      if (lt > end) return false;
      for (const it of items) {
        const l = lt - it.d; it.s.visible = l > 0; if (l <= 0) continue;
        if (l < rise) { tmp.lerpVectors(F, it.hv, easeOut(l / rise)); it.s.position.copy(tmp); it.s.lookAt(tmp.x, tmp.y + 10, tmp.z); it.s.rotateX(Math.PI); }
        else if (l < rise + hang) { it.s.position.copy(it.hv); const k = (l - rise) / hang; tmp.copy(it.hv).lerp(it.tg, 1); it.s.lookAt(tmp); it.s.rotateY(Math.PI); it.s.rotateZ(Math.sin(k * 20) * 0.03); }
        else { const k = clamp((l - rise - hang) / fly); it.s.position.lerpVectors(it.hv, it.tg, easeIn(k)); it.s.lookAt(it.hv.x * 2 - it.tg.x, it.hv.y * 2 - it.tg.y, it.hv.z * 2 - it.tg.z); }
      }
      return true; }, dispose() { bg.dispose(); } };
  });
}

// ---- v4: mid-boss showcase pieces ------------------------------------------------------------------------------------
/**
 * A cut-paper spider lily (彼岸花) thrown on an arc: six long narrow petals curling back and six fine stamen strips on a
 * card hub, spinning like a paper star as it flies from `from` to `to` ([x, y, z]); it lands, its petals spring open on
 * their folds, it holds, then folds shut flat into the page. White by default (阿花's white flowers).
 */
export function paperLily(film, { t, from, to, dur = 0.55, arc = 2.5, size = 1.1, colors = ['#f6f2ea', '#e4ddd0', '#c9bfb0'], stamen = '#f6f2ea', hold = 0.9, seed = 1, sound = 'whoosh', land = 'thud' }) {
  if (sound) film.sound(t, sound, { size: 0.6 }); if (land) film.sound(t + dur, land, { size: 0.4 });
  effect(film, t, () => {
    const { H } = film, r = P2.rng(seed), group = new THREE.Group(), spin = new THREE.Group(); group.add(spin);
    const petals = [];
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Shape(), L = size * (0.95 + r() * 0.2), w = size * 0.12;
      s.moveTo(0, 0); s.quadraticCurveTo(w * 1.4, L * 0.45, w * 0.3, L); s.quadraticCurveTo(w * 0.2, L * 0.7, -w * 0.5, L * 0.9); s.quadraticCurveTo(-w * 0.9, L * 0.4, 0, 0);
      const m = new THREE.Mesh(thick(s, 0.035), stock(H, colors[i % colors.length])); m.castShadow = true;
      const hold_ = new THREE.Group(); hold_.rotation.y = i / 6 * Math.PI * 2; const piv = new THREE.Group(); hold_.add(piv); piv.add(m); spin.add(hold_);
      petals.push(piv);
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.025, size * 1.35, 0.025), stock(H, stamen)); st.position.y = size * 0.67; const sp = new THREE.Group(); sp.rotation.y = (i + 0.5) / 6 * Math.PI * 2; const spv = new THREE.Group(); sp.add(spv); spv.add(st); spv.rotation.x = 0.55; spin.add(sp);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), stock(H, '#d8b04a')); tip.position.y = size * 1.35; spv.add(tip);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.12, size * 0.08, size * 0.18, 8), stock(H, colors[2])); spin.add(hub);
    const A = V(from), Bv = V(to);
    return { group, update(lt) {
      const fly = clamp(lt / dur), open = lt < dur ? 0.25 : easeOut(clamp((lt - dur) / 0.22)) * 1.0, shut = easeIn(clamp((lt - dur - 0.22 - hold) / 0.3));
      if (shut >= 1) return false;
      group.position.lerpVectors(A, Bv, fly); group.position.y += Math.sin(Math.PI * fly) * arc;
      spin.rotation.y = lt < dur ? lt * 14 : dur * 14; spin.rotation.x = lt < dur ? 0.9 * Math.sin(lt * 9) : 0;
      const k = lt < dur ? 0.25 : open;
      for (const p of petals) p.rotation.x = -(0.15 + k * 1.05) * (1 - shut) - shut * 1.45;
      spin.scale.set(1, Math.max(0.05, 1 - shut * 0.95), 1);
      return true; } };
  });
}

/**
 * The light gate (断魂山): a standing doorway of concentric gold cut rings (jagged, layered foil and cream stock) that
 * pop up one after another on their bottom folds and keep turning slowly, the innermost a warm cream disc; it stands
 * from t until `until`, then folds flat. at = [x, y, z] (the base centre); r = the outer radius.
 */
export function lightGate(film, { t, at, r = 3.2, until = 1e9, colors = ['#7a5a1a', '#c8a040', '#e8c060', '#f6dc98', '#fff0c8', '#fffbe8'], seed = 61, sound = 'goldBurst' }) {
  if (sound) film.sound(t, sound);
  effect(film, t, (t0) => {
    const { H } = film, group = new THREE.Group(); group.position.set(at[0], at[1], at[2]);
    const rings = colors.map((c, i) => {
      const R = r * (1 - i / colors.length * 0.92), shp = starShape(18 + i * 2, R, 0.86 - i * 0.02, seed + i);
      if (i < colors.length - 1) { const hole = new THREE.Path(); const ri = R * 0.78; hole.absarc(0, 0, ri, 0, Math.PI * 2, true); shp.holes.push(hole); }
      const m = new THREE.Mesh(thick(shp, 0.05), stock(H, c)); m.position.set(0, r, 0.06 * i); m.castShadow = i === 0;
      const piv = new THREE.Group(); piv.add(m); group.add(piv); return { piv, m, d: i * 0.09, spin: (i % 2 ? -1 : 1) * (0.25 + i * 0.06) };
    });
    const life = until - t0;
    return { group, smooth: true, update(lt) {
      if (lt > life + 0.5) return false;
      yawCam(film, group);
      for (const g of rings) {
        const up = easeOut(clamp((lt - g.d) / 0.28)), dn = easeIn(clamp((lt - life - g.d * 0.3) / 0.3));
        g.piv.rotation.x = -(Math.PI / 2) * (1 - up) - (Math.PI / 2) * dn; g.piv.visible = up > 0.01 && dn < 0.99;
        g.m.rotation.z = lt * g.spin;
      }
      return true; } };
  });
}
