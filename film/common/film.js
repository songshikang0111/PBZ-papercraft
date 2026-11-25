// 影之刃零 · Papercraft film runtime, shared by every chapter.
// It drives the skill's fixed harness (.agents/skills/papercraft/assets/templates/popup-3d/harness.js, kept as is)
// as a film: scripted camera and lens focus on the harness clock, groups of cards that rise on cue, actor puppets
// (the user's chibi PNG boss cards and the hero's pose cards, printed on card stock with a cut edge), paper effects
// (slash ribbons, flung shards, splash crowns, ripple rings, spike rings, card flips), a 2D overlay for name plates
// and flashes, and a log of sound events that tools/render.py turns into the SFX track.
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { makeCard, paperMaterial, fitShadow } from 'papercraft/lib/paperkit-3d.js';
import { FlapSpring, Spring } from 'papercraft/lib/paper-motion.js';

export { THREE, P2 };
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x) => 1 - (1 - clamp(x)) ** 3;
export const easeIn = (x) => clamp(x) ** 2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// ---- assets --------------------------------------------------------------------------------------------------------
export function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image ' + src)); im.src = encodeURI(src); });
}
export async function loadImages(map) {
  const out = {};
  await Promise.all(Object.entries(map).map(async ([k, v]) => { out[k] = await loadImage(v); }));
  return out;
}
export async function loadFont(name, url) {
  const f = new FontFace(name, `url(${encodeURI(url)})`); await f.load(); document.fonts.add(f); return f;
}

/** The alpha bounding box of an image (pixels), so cards are cut to the subject, not the canvas. */
function alphaBox(img) {
  const c = document.createElement('canvas'), k = Math.min(1, 512 / Math.max(img.width, img.height));
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
}

/**
 * A printed card cut from a transparent PNG: [pts, paint] for makeCard / H.popup / H.printed. The outline traces the
 * image's alpha, grown by `grow` (a fraction of the height) so near parts join into one die-cut and a thin dark ink
 * border shows round the art (the printed cut edge, never a pale halo). Base on y = 0, centred on x = 0.
 * height: card height in world units (the hero is 3.6). bottom: crop the base (feet on the fold) by this fraction.
 */
export function imagePiece(img, height, { grow = 0.012, ink = '#2a201a', simplify = 0.7, flipX = false, bottom = 0 } = {}) {
  const b = alphaBox(img), cut = b.h * bottom, h0 = b.h - cut, w = height * b.w / h0, h = height;
  const pad = grow * h * 2.5;
  const drawImg = (g, dx = 0, dy = 0) => {
    g.save(); g.scale(flipX ? -1 : 1, -1);
    g.drawImage(img, b.x, b.y, b.w, h0, -w / 2 + dx, -h + dy, w, h);   // y flipped: the image's top at y = h
    g.restore();
  };
  const res = Math.max(20, 300 / h);
  const pts = P2.fromDrawing((g) => {
    const r = grow * h;
    for (let a = 0; a < 12; a++) drawImg(g, Math.cos(a / 12 * 6.283) * r, Math.sin(a / 12 * 6.283) * r);
    drawImg(g); g.fillRect(-w * 0.18, 0, w * 0.36, Math.min(h * 0.04, 0.3));   // a flat foot on the fold
  }, { w: w + pad * 2, h: h + pad, res, simplify, name: 'image' }).map(([x, y]) => [x, Math.max(0, y)]);
  const paint = (P) => { P.fill(ink); P.draw((g) => drawImg(g)); };
  return [pts, paint, { w, h }];
}

// ---- the film: clock, cues, camera, focus, overlay -----------------------------------------------------------------
/**
 * createFilm(H, { duration, fps }) after createHarness and before H.start(); call film.start() instead of H.start().
 * film.at(t, fn): a one-shot cue on the harness clock (replays on restart).
 * film.every(fn): fn(t, dt) every step.
 * film.camera(keys): camera keyframes [{ t, target: [x,y,z], dist, pitch, yaw, focus?: [x,y,z], ease: 'smooth'|'linear'|'cut' }].
 * film.group(name): cards (hinge handles from H.popup) that stay flat until film.rise(name, t, { from, speed }).
 */
export function createFilm(H, { duration = 30, fps = 30, shadowBox = 46 } = {}) {
  const film = { H, duration, fps, cues: [], hooks: [], camKeys: [], groups: new Map(), sfx: [], shake: 0, actors: [], fx: [], overlays: [], restartHooks: [], t: 0, rt: 0, stops: [], offset: 0, warnings: [] };
  // ---- v4 time offset: a script writes its boss fight in its own times and sets film.offset first (film.shift(dt)), so
  // the mid-boss segments before it can grow without rewriting every time. Every registration (cues, sounds, voices,
  // actor keys, camera keys, group rises, overlays, hit-stops) adds the offset; cues hand their scheduled time to fn.
  const O = (t) => t + film.offset;
  film.shift = (dt) => { film.offset = dt; return film; };
  // ---- hit-stop: the script is written in SCENE time (tau). film.hitstop(tau, dur) freezes the scene for dur seconds
  // of real time there (actors, effects, cues and the camera hold; shake, overlays and flashes keep running), so a boss's
  // red / blue glint can hang before the answer. Overlays, sounds and the render clock are in real time.
  film.hitstop = (t, dur = 0.28) => { t = O(t); film.stops.push({ t, dur }); film.stops.sort((a, b) => a.t - b.t); return t; };
  film.tauOf = (rt) => { let acc = 0; for (const s of film.stops) { const r0 = s.t + acc; if (rt < r0) return rt - acc; if (rt < r0 + s.dur) return s.t; acc += s.dur; } return rt - acc; };
  film.realOf = (t) => { let acc = 0; for (const s of film.stops) if (s.t < t - 1e-6) acc += s.dur; return t + acc; };
  film.frozen = (rt) => { let acc = 0; for (const s of film.stops) { const r0 = s.t + acc; if (rt >= r0 && rt < r0 + s.dur) return (rt - r0) / s.dur; acc += s.dur; } return -1; };
  // paper effects move on twos and threes like hand-shot stop motion (FX_FPS); actors and the camera stay smooth
  film.fxFps = 15;
  // ---- cues
  film.at = (t, fn) => { film.cues.push({ t: O(t), fn, done: false }); return film; };
  film.every = (fn) => { film.hooks.push(fn); return film; };
  film.onRestart = (fn) => film.restartHooks.push(fn);
  film.sound = (t, type, o = {}) => { film.sfx.push({ t: +O(t).toFixed(3), type, ...o }); };
  /** a voice cue for tools/mix.py: `file` relative to work/film/audio/<chapter>/ (missing files are skipped there).
   *  o.kind: 'line' (spoken, never moved) | 'grunt' (an attack / hurt cry: shifted off any line it would step on) */
  film.voice = (t, file, o = {}) => film.sound(t, 'vo', { file, kind: o.kind ?? (/(line|dialogue)/.test(file) ? 'line' : 'grunt'), ...o });
  // ---- groups of popups that rise on cue (the rest of the world rises with the harness at t = 0 unless grouped)
  film.group = (name) => { if (!film.groups.has(name)) film.groups.set(name, { name, hinges: [], plan: [] }); return film.groups.get(name); };
  film.add = (name, h) => { film.group(name).hinges.push(h); return h; };
  /** rise (open = 1) or fold (open = 0) a group at time t; from: [x, z] the ripple's origin; speed: units a second */
  film.rise = (name, t, { from = null, speed = 30, open = 1, spread = 0.03, sound = true } = {}) => {
    film.group(name).plan.push({ t: O(t), from, speed, open, spread });
    if (sound) film.sound(t, open ? 'riseMany' : 'foldMany', { n: film.group(name).hinges.length, group: name });
  };
  // ---- camera
  film.camera = (keys) => { film.camKeys = film.camKeys.concat(keys.map((k) => ({ ...k, t: k.t > 0 ? O(k.t) : k.t }))).sort((a, b) => a.t - b.t); };
  const camAt = (t) => {
    const K = film.camKeys; if (!K.length) return null;
    if (t <= K[0].t) return K[0];
    for (let i = 0; i < K.length - 1; i++) {
      const a = K[i], b = K[i + 1];
      if (t >= a.t && t <= b.t) {
        if (b.ease === 'cut') return a;
        const u = (t - a.t) / Math.max(1e-6, b.t - a.t), e = b.ease === 'linear' ? u : b.ease === 'out' ? easeOut(u) : b.ease === 'in' ? easeIn(u) : smooth(u);
        return { target: lerp3(a.target, b.target, e), dist: lerp(a.dist, b.dist, e), pitch: lerp(a.pitch, b.pitch, e), yaw: lerp(a.yaw ?? 0, b.yaw ?? 0, e),
          focus: lerp3(a.focus || a.target, b.focus || b.target, e) };
      }
    }
    return K[K.length - 1];
  };
  film.kick = (amount = 1) => { film.shake = Math.max(film.shake, amount); };
  // a flash is a sheet of tinted tissue laid over the frame (paper grain, torn margins), never a CG white-out
  film.flash = (t, { color = '#fff6e6', dur = 0.25, peak = 0.75 } = {}) => film.overlays.push({ kind: 'flash', t0: O(t), dur, color, peak: peak * 0.6 });
  /** a coloured tissue sheet that slides in from the frame edges and holds (the red / blue tell during a hit-stop) */
  film.tint = (t, { color = '#c0281c', dur = 0.5, peak = 0.32 } = {}) => film.overlays.push({ kind: 'tint', t0: O(t), dur, color, peak });

  let lights = null, shadowAt = new THREE.Vector3(1e9, 0, 0);
  const focus = new THREE.Vector3();
  let lastTau = 0;
  function stepFilm(rt, rdt) {
    const t = film.tauOf(rt), dt = Math.max(0, t - lastTau); lastTau = t;
    film.t = t; film.rt = rt;
    for (const c of film.cues) if (!c.done && t >= c.t) { c.done = true; c.fn(c.t); }
    for (const [, g] of film.groups) {
      for (const p of g.plan) {
        if (p.started) continue;
        if (t < p.t) continue;
        p.started = true;
        for (const h of g.hinges) {
          const d = p.from ? Math.hypot(h.x - p.from[0], h.z - p.from[1]) / p.speed : (h.order ?? 0) * p.spread;
          h.set(p.open, Math.max(0, (p.t - t) + d + (h.jit || 0)));
        }
      }
      const started = g.plan.some((p) => p.started);
      if (!started) for (const h of g.hinges) if (h.p !== 0 || h.pending) h.reset(0);   // flat until its first cue
      // a staged group (any but 'world') is not even printed on the page until it rises: it never shows early
      // ... and once it has folded flat again it leaves the page (it never lies printed in a later shot)
      const last = [...g.plan].reverse().find((p) => p.started);
      const gone = last && last.open === 0 && t > last.t + 0.3 && g.hinges.every((h) => h.p < 0.02);
      if (g.name !== 'world') for (const h of g.hinges) h.group.visible = started && !gone;
    }
    for (const fn of film.hooks) fn(t, dt);
    for (const a of film.actors) a.update(t, dt);
    const tq = Math.floor(t * film.fxFps + 1e-6) / film.fxFps;
    for (let i = film.fx.length - 1; i >= 0; i--) {
      const f = film.fx[i]; let alive = true;
      if (f.live) alive = f.update(t, dt);   // runs on the real clock, through hit-stops (the tell glint)
      else if (f.smooth) { if (dt > 0 || f.last === undefined) alive = f.update(t, dt); f.last = t; }
      else if (f.last !== tq) { alive = f.update(tq, f.last === undefined ? 0 : tq - f.last); f.last = tq; }
      if (alive === false) { f.dispose?.(); film.fx.splice(i, 1); }
    }
    // camera from the keyframes, plus a decaying shake
    const k = camAt(t);
    if (k) {
      film.shake *= Math.exp(-rdt * 7);
      const s = film.shake, j = (f, p) => Math.sin(rt * f + p) * s;
      H.view.dist = k.dist; H.view.yaw = H.view.tyaw = k.yaw + j(53, 1) * 0.5; H.view.pitch = H.view.tpitch = k.pitch + j(61, 2) * 0.35;
      H.target.set(k.target[0] + j(47, 3) * 0.12, k.target[1] + j(71, 4) * 0.1, k.target[2]);
      focus.set(...(k.focus || k.target));
      if (lights && H.target.distanceTo(shadowAt) > 3) { shadowAt.copy(H.target); fitShadow(lights, shadowAt); }
    }
  }
  H.onStep(stepFilm);

  // ---- overlay canvas: name plates, chapter titles, flashes, ink strips (drawn from the clock, captured by the page)
  const ov = document.createElement('canvas'); ov.id = 'overlay';
  ov.style.cssText = 'position:absolute;pointer-events:none;z-index:4';
  document.body.appendChild(ov);
  film.overlayCanvas = ov;
  const ovl = (kind) => (o) => film.overlays.push({ kind, ...o, t0: O(o.t0) });
  film.plate = ovl('plate'); film.title = ovl('title'); film.inkStrip = ovl('strip'); film.stamp = ovl('stamp'); film.letterbox = ovl('letterbox');
  film.art = ovl('art');   // a game calligraphy PNG (o.img) drawn on the overlay with an ink-brush reveal
  film.subtitle = ovl('sub'); film.fade = ovl('fade');

  film.start = () => {
    film.duration += film.offset; film.offset = 0;   // from here on cues register in absolute scene time
    H.start();
    const PC = window.__papercraft;
    lights = { key: null, fill: null };
    H.scene.traverse((o) => { if (o.isDirectionalLight) { if (o.castShadow && !lights.key) lights.key = o; else if (!o.castShadow && !lights.fill) lights.fill = o; } });
    if (lights.key) { const c = lights.key.shadow.camera; c.left = c.bottom = -shadowBox; c.right = c.top = shadowBox; c.updateProjectionMatrix(); }
    const post = PC.post, render0 = post.render.bind(post);
    post.render = (time) => { post.focus.copy(focus); render0(time); drawOverlay(); };
    const restart0 = PC.restart;
    PC.restart = () => {
      for (const c of film.cues) c.done = false; lastTau = 0;
      for (const [, g] of film.groups) for (const p of g.plan) p.started = false;
      for (const f of film.fx) f.dispose?.(); film.fx.length = 0; film.shake = 0;
      for (const fn of film.restartHooks) fn();
      for (const a of film.actors) a.reset();
      restart0();
    };
    // the render clock is real time: the duration and every sound event are moved past the hit-stops before them
    window.__film = { duration: film.realOf(film.duration), fps: film.fps, sfx: film.sfx.map((e) => ({ ...e, t: +film.realOf(e.t).toFixed(3) })), film, warnings: film.warnings };
    PC.restart();
    PC.step(1 / 60);
  };

  // ---- overlay drawing --------------------------------------------------------------------------------------------
  const FONT = '"PBZName", "MaShanZheng", "ZhiMangXing", "Noto Serif CJK SC", serif';   // v5: the game's boss-nameplate face
  function drawOverlay() {
    const gl = H.renderer.domElement, r = gl.getBoundingClientRect();
    const W = gl.width, Hh = gl.height;
    if (ov.width !== W || ov.height !== Hh) { ov.width = W; ov.height = Hh; }
    Object.assign(ov.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const g = ov.getContext('2d'); g.clearRect(0, 0, W, Hh);
    const rt = film.rt, u = Hh / 1080;
    for (const o of film.overlays) {
      const lt = rt - film.realOf(o.t0); if (lt < 0 || (o.kind !== 'fade' && lt > (o.dur ?? 3) + 0.6)) continue;
      if (o.kind === 'flash') {
        const a = lt < 0.04 ? lt / 0.04 : Math.max(0, 1 - (lt - 0.04) / (o.dur - 0.04));
        if (a <= 0) continue; tissueSheet(g, W, Hh, u, o.color, a * o.peak, 0, 17);
      } else if (o.kind === 'tint') {
        const k = lt < 0.08 ? easeOut(lt / 0.08) : lt > o.dur - 0.12 ? clamp((o.dur - lt) / 0.12) : 1;
        if (k <= 0) continue; tissueSheet(g, W, Hh, u, o.color, o.peak * k, 0, 29);
      } else if (o.kind === 'plate') drawPlate(g, o, lt, W, Hh, u);
      else if (o.kind === 'title') { if (film.titleArt) drawTitleArt(g, o, lt, W, Hh, u); else drawTitle(g, o, lt, W, Hh, u); }
      else if (o.kind === 'fade') { g.save(); g.globalAlpha = clamp(lt / (o.dur ?? 1)) * (o.peak ?? 1); g.fillStyle = o.color ?? '#0e0c0b'; g.fillRect(0, 0, W, Hh); g.restore(); }
      else if (o.kind === 'art') drawArt(g, o.img, lt, o.dur ?? 3, (o.at?.[0] ?? 0.5) * W, (o.at?.[1] ?? 0.5) * Hh, (o.h ?? 400) * u, u, o);
      else if (o.kind === 'strip') drawStrip(g, o, lt, W, Hh, u);
      else if (o.kind === 'stamp') drawStamp(g, o, lt, W, Hh, u);
      else if (o.kind === 'letterbox') {
        const k = o.dur ? smooth(Math.min(lt / 0.5, (o.dur - lt) / 0.5)) : smooth(lt / 0.5), bh = 78 * u * k;
        g.fillStyle = '#120e0c'; g.fillRect(0, 0, W, bh); g.fillRect(0, Hh - bh, W, bh);
      }
    }
  }
  // a sheet of coloured tissue over the frame: paper grain multiplied in, torn margins; `open` 0..1 pulls the sheet
  // back toward the frame edges (a frame of tissue closing in)
  let grain = null;
  function tissueSheet(g, W, Hh, u, color, alpha, open, seed) {
    if (!grain) { const c = document.createElement('canvas'); c.width = c.height = 256; const gg = c.getContext('2d'); const r = P2.rng(5); gg.fillStyle = '#fff'; gg.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) { gg.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.06})`; gg.fillRect(r() * 256, r() * 256, 1 + r() * 7, 1); } grain = g.createPattern(c, 'repeat'); }
    g.save(); g.globalAlpha = alpha; g.fillStyle = color;
    if (open <= 0.001) g.fillRect(0, 0, W, Hh);
    else { const ix = W * 0.5 * open, iy = Hh * 0.5 * open; g.beginPath(); g.rect(0, 0, W, Hh); tornRect(g, ix, iy, W - 2 * ix, Hh - 2 * iy, seed, 22 * u); g.fill('evenodd'); }
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = alpha * 0.8; g.fillStyle = grain; g.fillRect(0, 0, W, Hh);
    g.restore();
  }
  // a fold-in factor: 0 -> 1 over `inT` with a paper overshoot, held, then folds away over `outT` (cos of a hinge angle)
  const fold = (lt, dur, inT = 0.45, outT = 0.35) => {
    if (lt < inT) { const x = lt / inT; return clamp(1 - Math.cos(x * Math.PI * 0.5) ** 2 + Math.sin(x * Math.PI) * 0.12, 0, 1.12); }
    if (lt > dur - outT) return clamp((dur - lt) / outT, 0, 1) ** 1.5;
    return 1;
  };
  function tornRect(g, x, y, w, h, seed, jag = 4) {
    const r = P2.rng(seed); g.beginPath();
    const n = Math.max(6, Math.round(w / 14));
    g.moveTo(x, y + (r() - 0.5) * jag);
    for (let i = 1; i <= n; i++) g.lineTo(x + w * i / n, y + (r() - 0.5) * jag);
    for (let i = 1; i <= 4; i++) g.lineTo(x + w + (r() - 0.5) * jag, y + h * i / 4);
    for (let i = n - 1; i >= 0; i--) g.lineTo(x + w * i / n, y + h + (r() - 0.5) * jag);
    for (let i = 3; i >= 1; i--) g.lineTo(x + (r() - 0.5) * jag, y + h * i / 4);
    g.closePath();
  }
  // a boss / elite name plate: a dark ink-washed paper strip with a pale torn under-layer, a red seal and the name in
  // brush script; it folds down from its top edge like a paper flap. o: { t0, dur, title, name, boss, side }
  function drawPlate(g, o, lt, W, Hh, u) {
    const k = fold(lt, o.dur ?? 2.4); if (k <= 0.01) return;
    const big = !!o.boss, fs = (big ? 74 : 54) * u, sub = (big ? 30 : 24) * u;
    g.font = `${fs}px ${FONT}`; const nw = g.measureText(o.name).width;
    g.font = `${sub}px ${FONT}`; const tw = o.title ? g.measureText(o.title).width : 0;
    const w = Math.max(nw, tw) + (big ? 200 : 150) * u, h = (big ? 150 : 118) * u;
    const x = o.side === 'left' ? 90 * u : o.side === 'right' ? W - w - 90 * u : (W - w) / 2;
    const y = big ? Hh - h - 96 * u : Hh - h - 80 * u;
    g.save(); g.translate(0, y); g.scale(1, k); g.translate(0, -y);
    g.shadowColor = 'rgba(10,6,4,0.45)'; g.shadowBlur = 14 * u; g.shadowOffsetY = 6 * u;
    tornRect(g, x - 10 * u, y + 8 * u, w + 20 * u, h, 11 + o.name.length, 6 * u); g.fillStyle = '#d9cdb2'; g.fill();
    g.shadowColor = 'transparent';
    tornRect(g, x, y, w, h - 4 * u, 3 + o.name.length, 5 * u); g.fillStyle = '#1d1815'; g.fill();
    // ink wash and fibres on the dark strip
    const rr = P2.rng(5 + o.name.length);
    for (let i = 0; i < 26; i++) { g.globalAlpha = 0.06; g.fillStyle = i % 3 ? '#4a3a30' : '#6a2a22'; g.beginPath(); g.ellipse(x + rr() * w, y + rr() * h, 40 * u + rr() * 90 * u, 10 * u + rr() * 20 * u, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(232,210,170,0.35)'; g.lineWidth = 1.5 * u; g.beginPath(); g.moveTo(x + 26 * u, y + h - 30 * u); g.lineTo(x + w - 26 * u, y + h - 30 * u); g.stroke();
    // seal
    const sx = x + 34 * u, sy = y + 30 * u, ss = (big ? 52 : 42) * u;
    g.fillStyle = '#a3261c'; tornRect(g, sx, sy, ss, ss, 9, 2.5 * u); g.fill();
    g.fillStyle = '#efe2c8'; g.font = `${ss * 0.62}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(o.seal || (big ? '首' : '敌'), sx + ss / 2, sy + ss / 2 + 2 * u);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const tx = sx + ss + 26 * u;
    if (o.title) { g.font = `${sub}px ${FONT}`; g.fillStyle = '#b9a98c'; g.fillText(o.title, tx, y + 44 * u); }
    g.font = `${fs}px ${FONT}`; g.fillStyle = '#f1e6cf'; g.fillText(o.name, tx, y + (o.title ? 44 * u + fs * 0.98 : h * 0.62));
    if (big && o.bar !== false) {   // the boss bar: a torn crimson strip
      const bx = x + 26 * u, by = y + h - 22 * u, bw = (w - 52 * u) * clamp((lt - 0.4) / 0.6);
      g.fillStyle = '#3a2a22'; g.fillRect(bx, by, w - 52 * u, 8 * u);
      g.fillStyle = o.barColor || '#b02a1e'; tornRect(g, bx, by, bw, 8 * u, 21, 2 * u); g.fill();
    }
    g.restore();
  }
  // the chapter title: a tall vertical paper banner on the left with the region in big brush script
  function drawTitle(g, o, lt, W, Hh, u) {
    const k = fold(lt, o.dur ?? 3.5, 0.6, 0.45); if (k <= 0.01) return;
    const fs = 120 * u, x = 150 * u, y0 = 110 * u;
    const chars = [...o.name], h = chars.length * fs * 1.02 + 150 * u, w = fs * 1.55;
    g.save(); g.translate(0, y0); g.scale(1, k); g.translate(0, -y0);
    g.shadowColor = 'rgba(10,6,4,0.5)'; g.shadowBlur = 20 * u; g.shadowOffsetY = 8 * u;
    tornRect(g, x - 12 * u, y0 + 10 * u, w + 24 * u, h, 31, 7 * u); g.fillStyle = '#d8ccb0'; g.fill(); g.shadowColor = 'transparent';
    tornRect(g, x, y0, w, h - 6 * u, 17, 6 * u); g.fillStyle = '#1b1714'; g.fill();
    g.fillStyle = '#ece0c6'; g.font = `${fs}px ${FONT}`; g.textAlign = 'center';
    chars.forEach((c, i) => g.fillText(c, x + w / 2, y0 + 70 * u + fs * (i + 0.88) * 1.02));
    if (o.sub) {   // the chapter number in a red seal at the foot
      const ss = 64 * u, sx = x + (w - ss) / 2, sy = y0 + h - ss - 40 * u;
      g.fillStyle = '#a3261c'; tornRect(g, sx, sy, ss, ss, 7, 3 * u); g.fill();
      g.fillStyle = '#efe2c8'; g.font = `${ss * 0.5}px ${FONT}`; g.textBaseline = 'middle'; g.fillText(o.sub, sx + ss / 2, sy + ss / 2 + 2 * u);
    }
    g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }
  // a slash of red ink paper across the frame: a long torn crimson ribbon that unrolls along a line, then is pulled away
  function drawStrip(g, o, lt, W, Hh, u) {
    const dur = o.dur ?? 0.6, grow = easeOut(lt / (dur * 0.35)), tail = easeIn((lt - dur * 0.45) / (dur * 0.55));
    if (tail >= 1) return;
    const [ax, ay] = [o.from[0] * W, o.from[1] * Hh], [bx, by] = [o.to[0] * W, o.to[1] * Hh];
    const p0 = tail, p1 = grow, th = (o.width ?? 46) * u, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const r = P2.rng(o.seed ?? 3), pt = (s, side) => { const w = th * Math.sin(Math.PI * clamp(s)) ** 0.6 * (1 + (r() - 0.5) * 0.25); return [ax + dx * s + nx * w * side, ay + dy * s + ny * w * side]; };
    const N = 28;
    for (const [col, k, off] of [['#1a0d0a', 1.25, 3 * u], [o.color || '#b3231a', 1, 0], ['#e0503a', 0.35, -th * 0.25]]) {
      g.beginPath();
      for (let i = 0; i <= N; i++) { const s = lerp(p0, p1, i / N), [x, y] = pt(s, k); i ? g.lineTo(x + off, y + off) : g.moveTo(x + off, y + off); }
      for (let i = N; i >= 0; i--) { const s = lerp(p0, p1, i / N), [x, y] = pt(s, -k * (col === '#e0503a' ? 0.2 : 1)); g.lineTo(x + off, y + off); }
      g.closePath(); g.fillStyle = col; g.fill();
    }
  }
  // ---- v4: the game's own calligraphy (white brush PNGs with transparent ground), revealed by an ink brush stroke
  const artCache = new Map();
  function artCut(img) {   // the image trimmed to its ink (alpha box), cached
    if (artCache.has(img)) return artCache.get(img);
    const b = alphaBox(img), c = document.createElement('canvas'); c.width = Math.ceil(b.w); c.height = Math.ceil(b.h);
    c.getContext('2d').drawImage(img, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h); artCache.set(img, c); return c;
  }
  const scratch = document.createElement('canvas');
  /** draw art centred at (cx, top cy) `h` px tall: a brush reveal from the top (0.55 s), hold, then it thins and lifts away */
  function drawArt(g, img, lt, dur, cx, cy, h, u, o = {}) {
    if (!img || lt > dur) return;
    const a = artCut(img); let w = h * a.width / a.height;
    if (o.maxW && w > o.maxW * u) { h *= o.maxW * u / w; w = o.maxW * u; }
    const rv = o.reveal ?? 0.55, k = easeOut(lt / rv), out = clamp((lt - (dur - 0.45)) / 0.45);
    if (k <= 0) return;
    scratch.width = Math.ceil(w + 80 * u); scratch.height = Math.ceil(h + 80 * u);
    const s = scratch.getContext('2d'), pad = 40 * u; s.clearRect(0, 0, scratch.width, scratch.height);
    // a dark smoky under-print so white brush reads on pale paper (like the game's own title cards)
    s.save(); s.shadowColor = 'rgba(8,6,6,0.85)'; s.shadowBlur = 26 * u; s.globalAlpha = 0.75; s.drawImage(a, pad, pad, w, h); s.restore();
    s.drawImage(a, pad, pad, w, h);
    // the brush mask: everything above a ragged front that runs down the column (vertical text reads top to bottom)
    s.globalCompositeOperation = 'destination-in'; s.beginPath();
    const front = pad + (h + pad) * k * 1.08, r = P2.rng(o.seed ?? 7);
    s.moveTo(0, 0); s.lineTo(scratch.width, 0);
    for (let i = 0; i <= 12; i++) { const x = scratch.width * (1 - i / 12); s.lineTo(x, front - 30 * u * Math.sin(i * 1.7 + 1) - r() * 22 * u); }
    s.closePath(); s.fillStyle = '#000'; s.fill(); s.globalCompositeOperation = 'source-over';
    g.save(); g.globalAlpha = 1 - out; g.drawImage(scratch, cx - w / 2 - pad, cy - pad - out * 24 * u); g.restore();
  }
  // the chapter title, v4: the chapter's game calligraphy (film.titleArt = { main, place, layout })
  function drawTitleArt(g, o, lt, W, Hh, u) {
    const A = film.titleArt, dur = o.dur ?? 3.2;
    if (A.layout === 'center') {
      drawArt(g, A.main, lt, dur, W * 0.5, Hh * 0.17, 640 * u, u, { maxW: 760, seed: 3 });
      drawArt(g, A.place, lt - 0.35, dur - 0.35, W * 0.5 + 430 * u, Hh * 0.22, 300 * u, u, { seed: 5 });
    } else {
      drawArt(g, A.main, lt, dur, W - 300 * u, 70 * u, 520 * u, u, { maxW: 420, seed: 3 });
      drawArt(g, A.place, lt - 0.35, dur - 0.35, W - 560 * u, 110 * u, 290 * u, u, { seed: 5 });
    }
  }
  // a red seal stamp (斩, 破): slams down with a tiny overshoot; 斩 is the game's own red brush character when loaded
  function drawStamp(g, o, lt, W, Hh, u) {
    const dur = o.dur ?? 2; if (lt > dur) return;
    if ((o.text ?? '斩') === '斩' && film.stampArt) {
      const a = artCut(film.stampArt), sc = lt < 0.1 ? 1.5 - lt / 0.1 * 0.5 : lt < 0.18 ? 1 - Math.sin((lt - 0.1) / 0.08 * Math.PI) * 0.04 : 1;
      const al = lt > dur - 0.35 ? (dur - lt) / 0.35 : Math.min(1, lt / 0.05), h = (o.size ?? 200) * 2.3 * u * sc, w = h * a.width / a.height;
      const x = (o.at?.[0] ?? 0.78) * W, y = (o.at?.[1] ?? 0.32) * Hh;
      g.save(); g.globalAlpha = al; g.shadowColor = 'rgba(10,4,2,0.55)'; g.shadowBlur = 18 * u; g.drawImage(a, x - w / 2, y - h / 2, w, h); g.restore();
      return;
    }
    const a = lt < 0.12 ? 1.35 - lt / 0.12 * 0.35 : 1, al = lt > dur - 0.3 ? (dur - lt) / 0.3 : 1;
    const s = (o.size ?? 200) * u * a, x = (o.at?.[0] ?? 0.78) * W, y = (o.at?.[1] ?? 0.32) * Hh;
    g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(-0.08);
    g.fillStyle = '#a3261c'; tornRect(g, -s / 2, -s / 2, s, s, 41, 6 * u); g.fill();
    g.strokeStyle = '#efe2c8'; g.lineWidth = 5 * u; tornRect(g, -s / 2 + 14 * u, -s / 2 + 14 * u, s - 28 * u, s - 28 * u, 43, 3 * u); g.stroke();
    g.fillStyle = '#efe2c8'; g.font = `${s * 0.62}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.text || '斩', 0, 4 * u);
    g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }
  return film;
}

// ---- actors: chibi cards on a hinge that move, turn to the camera, swap poses and flip between phases ----------------
/**
 * createActor(film, { poses: { name: img }, height, x, z, face: 1|-1, heights: { pose: h } })
 * The actor is a group of cards (one per pose, the visible one swapped), standing on a fold that rises / falls with a
 * FlapSpring, facing the camera (turned to it about the vertical, the way a stand-up puppet is turned by hand), and
 * mirrored to face left or right. Script it with keys on the clock:
 *   a.key(t, { pose, x, z, y, face, lean, rise: 1|0, flipTo: 'pose', hidden })   positions ease between keys
 */
export function createActor(film, { name = 'actor', poses, height = 3.6, heights = {}, x = 0, z = 0, face = 1, flipX = {}, risen = false, ink = '#2a201a', scaleY = {} } = {}) {
  const { H } = film, paper = H.paper;
  const root = new THREE.Group(), turn = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group();
  root.add(turn); turn.add(pivot); pivot.add(body); H.scene.add(root); root.name = name;
  const cards = {};
  for (const [k, img] of Object.entries(poses)) {
    const hh = heights[k] ?? height;
    const [pts, paint] = imagePiece(img, hh, { flipX: !!flipX[k], ink });
    const m = makeCard(pts, { paint, paper, seed: 900 + Object.keys(cards).length * 7 + name.length, thickness: 0.07, edgeWidth: 0.05, pxPerUnit: Math.min(200, 1400 / hh), back: 'kraft', effects: 1, contact: { amount: 0.1, height: 0.3 } });
    m.visible = false; m.name = `${name}:${k}`; body.add(m); cards[k] = m;
  }
  const flap = new FlapSpring({ p: risen ? 1 : 0, size: 0.35 });
  const keys = [];
  const st = { pose: Object.keys(poses)[0], x, z, y: 0, face, lean: 0, flip: 0, flipFrom: null, flipT: -1, hidden: false };
  const a = {
    name, root, cards, flap, keys, st, x, z, off: [],
    /** v4: never shown between t0 and t1 (absolute scene times), whatever the keys say (魂 stays off the mid-boss beats) */
    hideBetween(t0, t1) { a.off.push([t0, t1]); return a; },
    key(t, o) { keys.push({ t: t > 0 ? t + film.offset : t, ...o }); keys.sort((p, q) => p.t - q.t); return a; },
    pos() { return [root.position.x, root.position.y, root.position.z]; },
    reset() { flap.reset(risen ? 1 : 0); for (const k of keys) k.done = false; Object.assign(st, { pose: Object.keys(poses)[0], x, z, y: 0, face, lean: 0, flipFrom: null, flipT: -1, hidden: false, rise: null, tilt: 0 }); a.apply(0); },
    apply(t) {
      for (const c of Object.values(cards)) c.visible = false;
      if (st.hidden || a.off.some(([x, y]) => t >= x && t < y)) return;
      // the flip: the card turns about its vertical through 90 deg, the new pose's card turns in from -90 deg
      let ang = 0, show = st.pose;
      if (st.flipT >= 0) {
        const u = clamp((t - st.flipT) / 0.42), e = u < 0.5 ? easeIn(u * 2) : 1 - easeIn((1 - u) * 2) ;
        if (u < 0.5) { show = st.flipFrom; ang = e * Math.PI / 2; } else { show = st.pose; ang = -((1 - (u - 0.5) * 2) ** 2) * Math.PI / 2; }
        if (u >= 1) st.flipT = -1;
      }
      cards[show].visible = true;
      body.rotation.y = ang;
    },
    update(t, dt) {
      // discrete keys (pose, face, rise, flip) fire once; positions interpolate between the keys that carry them
      for (const k of keys) if (!k.done && t >= k.t) {
        k.done = true;
        if (k.pose && !k.flipTo) st.pose = k.pose;
        if (k.flipTo) { st.flipFrom = st.pose; st.pose = k.flipTo; st.flipT = k.t; }
        if (k.face) st.face = k.face;
        if (k.rise === 1) flap.set(1); if (k.rise === 0) flap.set(0);
        if (k.hidden !== undefined) st.hidden = k.hidden;
      }
      const track = (prop, def) => {
        let prev = null, next = null;
        for (const k of keys) { if (k[prop] === undefined) continue; if (k.t <= t) prev = k; else { next = k; break; } }
        if (!prev) return def; if (!next || next.snap) return prev[prop];
        const u = (t - prev.t) / (next.t - prev.t), e = next.ease === 'linear' ? u : next.ease === 'out' ? easeOut(u) : next.ease === 'in' ? easeIn(u) : next.ease === 'arc' ? u : smooth(u);
        return lerp(prev[prop], next[prop], e);
      };
      const px = track('x', x), pz = track('z', z), py = track('y', 0), lean = track('lean', 0);
      // a hop: keys with `hop` lift the actor along a parabola between that key and the next
      let hop = 0; for (let i = 0; i < keys.length - 1; i++) { const k = keys[i]; if (k.hop && t >= k.t) { const n = keys.slice(i + 1).find((q) => q.x !== undefined || q.z !== undefined); if (n && t <= n.t) hop = k.hop * 4 * ((t - k.t) / (n.t - k.t)) * (1 - (t - k.t) / (n.t - k.t)); } }
      const jit = track('jit', 0);   // a tremble (charging up): a fast seeded shake of the whole card
      root.position.set(px + Math.sin(t * 71) * jit + Math.sin(t * 113) * jit * 0.5, py + hop, pz + Math.sin(t * 89) * jit * 0.4);
      a.x = px; a.z = pz;
      // turn to the camera about the vertical, then mirror for left / right
      const cam = H.camera.position, yaw = Math.atan2(cam.x - px, cam.z - pz);
      turn.rotation.y = yaw;
      body.scale.x = st.face;
      const p = flap.step(dt);
      pivot.rotation.x = (-Math.PI / 2 + 0.01) * (1 - p) - lean;   // lean > 0 tips back (a hit), < 0 forward
      // a running bob for the run pose
      body.position.y = st.pose === 'run' ? Math.abs(Math.sin(t * 14)) * 0.12 : 0;
      a.apply(t);
    },
  };
  film.actors.push(a);
  a.reset();
  return a;
}

// ---- paper effects ----------------------------------------------------------------------------------------------------
const texCache = new Map();
/** A small paper-printed texture: a flat ink colour with a pale lit lip along the top and the stock's fibre. */
function inkTex(H, color, { lip = '#ffe9d0', w = 256, h = 64 } = {}) {
  const key = color + lip + w + h; if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, P2.rgba(lip, 0.55)); gr.addColorStop(0.18, P2.rgba(lip, 0)); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,6,4,0.35)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(H.paper.sheet, 'repeat'); g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache.set(key, t); return t;
}
export function fxMat(H, color, o = {}) {
  const m = paperMaterial({ map: inkTex(H, color, o), normalMap: H.paper.normalMap, normalScale: 0.4, side: THREE.DoubleSide });
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 0.6; }
  return m;
}

/**
 * A slash: a crescent ribbon of cut paper swept round a centre (the blade's path), in layers (a dark backing card, the
 * ink colour, a pale core), that grows from a0 toward a1 and is then pulled in from its tail. Oriented by `normal`
 * (the plane of the swing) and `up`. All in world units.
 */
export function slash(film, { t, at, radius = 4, width = 0.9, a0 = -0.4, a1 = 2.6, dur = 0.38, hold = 0.06, normal = [0, 0, 1], spin = 0, color = '#a8231a', core = '#e8d6b8', tilt = 0, sound = 'slash' }) {
  const { H } = film;
  film.sound(t, sound, { size: radius / 4 });
  film.at(t, (t) => {
    const g = new THREE.Group(); g.position.set(...at);
    const n = new THREE.Vector3(...normal).normalize(); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); g.rotateZ(spin); g.rotateX(tilt);
    const layers = [['#1a0c08', 1.25, -0.03], [color, 1, 0], [core, 0.32, 0.03]].map(([c, k, dz]) => {
      const m = new THREE.Mesh(new THREE.BufferGeometry(), fxMat(H, c)); m.position.z = dz; m.castShadow = true; m.userData.k = k; g.add(m); return m;
    });
    H.scene.add(g);
    const build = (s0, s1) => {
      for (const m of layers) {
        const N = 40, pos = [], uv = [], idx = [], k = m.userData.k;
        for (let i = 0; i <= N; i++) {
          const s = lerp(s0, s1, i / N), a = lerp(a0, a1, s), taper = Math.sin(Math.PI * clamp((s - s0) / Math.max(1e-4, s1 - s0))) ** 0.7 * Math.min(1, s * 6);
          const wi = width * k * taper, r0 = radius - wi * (k < 1 ? 0.2 : 0.6), r1 = radius + wi * (k < 1 ? 0.2 : 0.4);
          pos.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0); uv.push(i / N, 0, i / N, 1);
          if (i) { const b = i * 2; idx.push(b - 2, b - 1, b, b - 1, b + 1, b); }
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
        m.geometry.dispose(); m.geometry = geo;
      }
    };
    const t0 = t;
    film.fx.push({
      update(tt) {
        const u = (tt - t0) / dur, head = easeOut(u / 0.55), tail = easeIn((u - 0.55 - hold) / 0.45);
        if (tail >= 1) return false;
        build(clamp(tail), clamp(head)); return true;
      },
      dispose() { H.scene.remove(g); layers.forEach((m) => m.geometry.dispose()); },
    });
  });
}

/** Flung paper shards: small triangles / droplets thrown from a point, spinning, falling and landing flat on the page. */
export function shards(film, { t, at, n = 24, colors = ['#c8b48a'], speed = 6, up = 6, size = 0.35, gravity = 22, dir = null, spread = Math.PI, life = 1.6, converge = false, radius = 5, shape = 'tri', seed = 1, ground = 0, sound = null, drag = 1.2 }) {
  const { H } = film;
  if (sound) film.sound(t, sound, { n });
  film.at(t, (t) => {
    const r = P2.rng(seed + Math.round(t * 100)), g = new THREE.Group(); H.scene.add(g);
    const geos = (Array.isArray(shape) ? shape : [shape]).map((sh) => paperBit(sh, r));
    const ps = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geos[i % geos.length], fxMat(H, colors[i % colors.length])); m.castShadow = true;
      const s = size * (0.6 + r() * 0.8); m.scale.setScalar(s);
      const base = dir ?? r() * Math.PI * 2, a = base + (r() - 0.5) * spread, sp = speed * (0.4 + r() * 0.8);
      const p = { m, v: new THREE.Vector3(Math.cos(a) * sp, up * (0.5 + r() * 0.7), Math.sin(a) * sp), w: new THREE.Vector3(r() * 12 - 6, r() * 12 - 6, r() * 12 - 6), landed: false, s };
      if (converge) { const rr = radius * (0.7 + r() * 0.5), ph = r() * Math.PI * 2, hh = r() * radius * 0.8; p.from = new THREE.Vector3(at[0] + Math.cos(ph) * rr, at[1] + hh - radius * 0.2, at[2] + Math.sin(ph) * rr * 0.6); p.delay = r() * 0.35; m.position.copy(p.from); }
      else m.position.set(...at);
      m.rotation.set(r() * 6, r() * 6, r() * 6); g.add(m); ps.push(p);
    }
    const t0 = t, center = new THREE.Vector3(...at);
    film.fx.push({
      update(tt, dt) {
        const lt = tt - t0; if (lt > life) return false;
        for (const p of ps) {
          if (converge) {
            const u = clamp((lt - p.delay) / (life * 0.8 - p.delay)), e = easeIn(u);
            p.m.position.lerpVectors(p.from, center, e); p.m.rotation.x += dt * 8; p.m.rotation.y += dt * 6;
            p.m.visible = u < 0.98; continue;
          }
          if (p.landed) continue;
          p.v.y -= gravity * dt; p.v.multiplyScalar(Math.exp(-dt * drag));
          p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += p.w.x * dt; p.m.rotation.y += p.w.y * dt; p.m.rotation.z += p.w.z * dt;
          if (p.m.position.y <= ground + 0.03) { p.m.position.y = ground + 0.03; p.m.rotation.set(-Math.PI / 2, 0, p.m.rotation.z); p.landed = true; }
        }
        // the last 0.25 s: landed shards fold flat into the page (shrink in height only: they lie down)
        const k = clamp((life - lt) / 0.25); if (k < 1) for (const p of ps) p.m.scale.set(p.s, p.s * k, p.s);
        return true;
      },
      dispose() { H.scene.remove(g); geos.forEach((q) => q.dispose()); },
    });
  });
}

/**
 * A small cut of card with a real thickness (so it catches light on its edge and casts a shadow): 'tri' a triangle,
 * 'drop' a droplet, 'strip' a thin long strip, 'scrap' a torn scrap, 'coin' a round paper coin with a square hole,
 * 'diamond' an ember, 'facet' a sharp ice / glass sliver. Unit size (scaled by the caller).
 */
export function paperBit(shape, r = Math.random, depth = 0.05) {
  const s = new THREE.Shape();
  if (shape === 'drop') { s.moveTo(0, 1); s.quadraticCurveTo(0.7, -0.2, 0, -0.6); s.quadraticCurveTo(-0.7, -0.2, 0, 1); }
  else if (shape === 'strip') { s.moveTo(-0.09, -1.1); s.lineTo(0.09, -1.05); s.lineTo(0.07, 1.1); s.lineTo(-0.08, 1.02); s.closePath(); }
  else if (shape === 'scrap') { const n = 7; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = 0.55 + r() * 0.55; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8); } s.closePath(); }
  else if (shape === 'rain') { shp.moveTo(-0.04, -1); shp.lineTo(0.04, -1); shp.lineTo(0.03, 1); shp.lineTo(-0.03, 1); shp.closePath(); }
  else if (shape === 'coin') { s.absarc(0, 0, 0.8, 0, Math.PI * 2, false); const h = new THREE.Path(); h.moveTo(-0.22, -0.22); h.lineTo(-0.22, 0.22); h.lineTo(0.22, 0.22); h.lineTo(0.22, -0.22); h.closePath(); s.holes.push(h); }
  else if (shape === 'diamond') { s.moveTo(0, -0.6); s.lineTo(0.35, 0); s.lineTo(0, 0.6); s.lineTo(-0.35, 0); s.closePath(); }
  else if (shape === 'facet') { s.moveTo(0, 1.2); s.lineTo(0.3, -0.2); s.lineTo(0.05, -0.8); s.lineTo(-0.3, -0.1); s.closePath(); }
  else { s.moveTo(0, 1); s.lineTo(0.55, -0.6); s.lineTo(-0.5, -0.45); s.closePath(); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -depth / 2); return g;
}

/** Ripple rings on water or a shockwave on the ground: flat paper rings that open outward and thin to nothing. */
export function rings(film, { t, at, n = 3, r0 = 0.6, r1 = 5, dur = 1.1, gap = 0.18, color = '#e8efe6', width = 0.28, y = 0.04 }) {
  const { H } = film;
  film.at(t, (t) => {
    const g = new THREE.Group(); g.position.set(at[0], y, at[2]); H.scene.add(g);
    const ms = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(1, 1.1, 48), fxMat(H, color)); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; g.add(m); ms.push(m); }
    const t0 = t;
    film.fx.push({
      update(tt) {
        const lt = tt - t0; if (lt > dur + gap * n) return false;
        ms.forEach((m, i) => {
          const u = clamp((lt - i * gap) / dur), r = lerp(r0, r1, easeOut(u)) * (1 - i * 0.12), w = width * (1 - u) ** 0.8;
          m.visible = u > 0 && u < 1; if (!m.visible) return;
          m.geometry.dispose(); m.geometry = new THREE.RingGeometry(Math.max(0.01, r - w), r, 56);
        });
        return true;
      },
      dispose() { H.scene.remove(g); ms.forEach((m) => m.geometry.dispose()); },
    });
  });
}

/**
 * A crown of upright cut cards round a point that rise on their folds and fall again: a splash crown (droplet cards),
 * a ring of blood spikes, a burst of flames. kind: 'drop' | 'spike' | 'flame'.
 */
export function crown(film, { t, at, n = 10, radius = 1.6, height = 2.2, colors = ['#e8efe6', '#a9c2bc'], kind = 'drop', hold = 0.25, seed = 3, jitter = 0.35, rows = 1, sound = null }) {
  const { H } = film;
  if (sound) film.sound(t, sound, { n });
  film.at(t, (t) => {
    const r = P2.rng(seed), g = new THREE.Group(); g.position.set(...at); H.scene.add(g);
    const items = [];
    for (let row = 0; row < rows; row++) for (let i = 0; i < n; i++) {
      const a = (i + row * 0.5) / n * Math.PI * 2 + (r() - 0.5) * 0.3, rr = radius * (1 + row * 0.55) * (0.85 + r() * 0.3), hh = height * (1 - row * 0.3) * (0.6 + r() * 0.6), w = hh * (kind === 'spike' ? 0.32 : 0.42);
      const s = new THREE.Shape();
      if (kind === 'spike') { s.moveTo(-w / 2, 0); s.lineTo(w * 0.1, hh); s.lineTo(w / 2, 0); }
      else if (kind === 'flame') { s.moveTo(-w / 2, 0); s.quadraticCurveTo(-w * 0.6, hh * 0.5, 0, hh); s.quadraticCurveTo(w * 0.1, hh * 0.55, w / 2, 0); }
      else { s.moveTo(-w / 2, 0); s.quadraticCurveTo(-w * 0.45, hh * 0.7, 0, hh); s.quadraticCurveTo(w * 0.45, hh * 0.7, w / 2, 0); }
      s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
      const m = new THREE.Mesh(geo, fxMat(H, colors[(i + row) % colors.length])); m.castShadow = true;
      const hold_ = new THREE.Group(); hold_.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); hold_.rotation.y = -a + Math.PI / 2 + (kind === 'drop' ? 0 : 0);
      const piv = new THREE.Group(); hold_.add(piv); piv.add(m); g.add(hold_);
      const sp = new FlapSpring({ p: 0, size: 0.15 + hh / 20 }); sp.set(1);
      items.push({ piv, sp, delay: r() * 0.08 + row * 0.06, out: kind === 'drop' ? 0.35 : 0.12 });
    }
    const t0 = t;
    film.fx.push({
      update(tt, dt) {
        const lt = tt - t0;
        let alive = false;
        for (const it of items) {
          if (lt < it.delay) { it.piv.rotation.x = Math.PI / 2; alive = true; continue; }
          if (lt > it.delay + 0.45 + hold) it.sp.set(0);
          const p = it.sp.step(dt); if (!(it.sp.target === 0 && it.sp.atRest)) alive = true;
          it.piv.rotation.x = (Math.PI / 2 - 0.01) * (1 - p) - it.out * p;   // falls outward (away from the centre)
          it.piv.visible = p > 0.02 || lt < 0.2;
        }
        return alive || lt < 0.6;
      },
      dispose() { H.scene.remove(g); },
    });
  });
}

/** Drifting paper petals / leaves / motes in a box: the world's own weather, seeded and on the clock. */
export function drift(film, { box = [-20, 20, 0, 8, -20, 20], n = 40, colors = ['#b3231a'], size = 0.22, wind = [1.2, -0.2, 0.3], seed = 9, shape = 'petal' }) {
  const { H } = film, r = P2.rng(seed), g = new THREE.Group(); g.name = 'life'; H.scene.add(g);
  const shp = new THREE.Shape();
  if (shape === 'petal') { shp.moveTo(0, -1); shp.quadraticCurveTo(0.8, 0, 0, 1); shp.quadraticCurveTo(-0.8, 0, 0, -1); }
  else if (shape === 'maple') { for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? 0.45 : 1; i ? shp.lineTo(Math.sin(a) * r, Math.cos(a) * r) : shp.moveTo(Math.sin(a) * r, Math.cos(a) * r); } }
  else if (shape === 'flake') { for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2, r = i % 2 ? 0.55 : 1; i ? shp.lineTo(Math.sin(a) * r, Math.cos(a) * r) : shp.moveTo(Math.sin(a) * r, Math.cos(a) * r); } }
  else if (shape === 'rain') { shp.moveTo(-0.04, -1); shp.lineTo(0.04, -1); shp.lineTo(0.03, 1); shp.lineTo(-0.03, 1); shp.closePath(); }
  else if (shape === 'coin') { shp.absarc(0, 0, 1, 0, Math.PI * 2, false); const hp = new THREE.Path(); hp.moveTo(-0.28, -0.28); hp.lineTo(-0.28, 0.28); hp.lineTo(0.28, 0.28); hp.lineTo(0.28, -0.28); hp.closePath(); shp.holes.push(hp); }
  else if (shape === 'ember') { shp.moveTo(0, -0.5); shp.lineTo(0.35, 0); shp.lineTo(0, 0.5); shp.lineTo(-0.35, 0); shp.closePath(); }
  else { shp.moveTo(-1, -0.6); shp.lineTo(1, -0.4); shp.lineTo(0.1, 0.9); shp.closePath(); }
  const geo = new THREE.ShapeGeometry(shp), ps = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, fxMat(H, colors[i % colors.length])); m.scale.setScalar(size * (0.6 + r() * 0.8)); m.castShadow = true; g.add(m); ps.push({ m, p0: [lerp(box[0], box[1], r()), lerp(box[2], box[3], r()), lerp(box[4], box[5], r())], ph: r() * 10, sp: 0.6 + r() * 0.8 }); }
  const W = box[1] - box[0], Hh = box[3] - box[2], D = box[5] - box[4];
  const wrap = (v, a, L) => a + ((((v - a) % L) + L) % L);
  film.every((t) => {
    for (const p of ps) {
      const x = wrap(p.p0[0] + wind[0] * t * p.sp + Math.sin(t * 0.9 + p.ph) * 0.6, box[0], W);
      const y = wrap(p.p0[1] + wind[1] * t * p.sp + Math.sin(t * 1.3 + p.ph) * 0.3, box[2], Hh);
      const z = wrap(p.p0[2] + wind[2] * t * p.sp + Math.cos(t * 0.7 + p.ph) * 0.5, box[4], D);
      p.m.position.set(x, y, z); if (shape === 'rain') p.m.rotation.set(0, p.ph, -0.35); else p.m.rotation.set(t * 1.7 + p.ph, t * 1.1 + p.ph * 2, t * 0.6);
    }
  });
  return g;
}
