// Chinese buildings as folded-card 3D models (v3). Each model is a group of plain card stocks (the fx.js stock with the
// paper's grain), merged into one mesh per colour so a street of fifty houses stays cheap. The caller stands the group
// on a hinge (H.popup with node, level) so it rises with its group like every other piece.
//   jiangnanHouse  white plaster, black tile, stepped horse-head gable walls (马头墙), a mid-storey eave, lattice
//                  windows, a door hood; or a plain gabled timber house (horse: false), optionally on stilts
//   tower          a tall many-storey timber tower (楼阁) with flared tiled roofs, leaning as it sinks on one side
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { stock } from './fx.js';

/** collect geometry per colour, then merge into one mesh per colour */
export function parts(H) {
  const bins = new Map(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  const add = (color, geo, pos = [0, 0, 0], rot = [0, 0, 0]) => {
    const g = geo.index ? geo.toNonIndexed() : geo; geo !== g && geo.dispose();
    M.compose(P.set(...pos), Q.setFromEuler(E.set(...rot)), one); g.applyMatrix4(M);
    if (!bins.has(color)) bins.set(color, []); bins.get(color).push(g);
  };
  const box = (color, [w, h, d], pos, rot) => add(color, new THREE.BoxGeometry(w, h, d), pos, rot);
  const build = (group = new THREE.Group()) => {
    for (const [c, gs] of bins) {
      const names = ['position', 'normal', 'uv'], out = new THREE.BufferGeometry();
      for (const n of names) {
        const size = gs[0].attributes[n].itemSize, total = gs.reduce((s, g) => s + g.attributes[n].count * size, 0), arr = new Float32Array(total); let o = 0;
        for (const g of gs) { arr.set(g.attributes[n].array, o); o += g.attributes[n].count * size; }
        out.setAttribute(n, new THREE.BufferAttribute(arr, size));
      }
      gs.forEach((g) => g.dispose());
      const m = new THREE.Mesh(out, stock(H, c)); m.castShadow = true; m.receiveShadow = true; group.add(m);
    }
    return group;
  };
  return { add, box, build };
}

/** a step-pyramid outline in (z, y): the horse-head gable wall from y0 up in `n` steps to `top` */
function gableShape(half, y0, top, n) {
  const W = (k) => half * (1 - k / (n + 0.4)), Y = (k) => y0 + (top - y0) * (k + 1) / n, pts = [[-W(0), y0 - 0.01]];
  for (let k = 0; k < n; k++) { pts.push([-W(k), Y(k)]); if (k < n - 1) pts.push([-W(k + 1), Y(k)]); }
  for (let k = n - 1; k >= 0; k--) { if (k < n - 1) pts.push([W(k + 1), Y(k)]); pts.push([W(k), Y(k)]); }
  pts.push([W(0), y0 - 0.01]);
  const s = new THREE.Shape(); pts.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
  return { s, steps: Array.from({ length: n }, (_, k) => ({ y: Y(k), a: k < n - 1 ? W(k + 1) : -W(k), b: W(k) })) };
}

/**
 * jiangnanHouse(H, o) -> group (front faces +z, base at y = 0). o: w, d, h (eave height), roofH, stories (1 | 2),
 * steps (horse-head steps, 0 = plain gables), horse (false: a plain timber house), stilts (posts under it), seed,
 * col { wall, plinth, tile, tileDark, timber, window, lit, door, lantern }, lantern (bool), lit (share of lit windows)
 */
export function jiangnanHouse(H, { w = 5, d = 4.2, h = 4, roofH = 1.8, stories = 1, steps = 3, horse = true, stilts = 0, seed = 1, col = {}, lantern = false, lit = 0.5, door = true, podium = 0, balcony = false, banner = null, wideDoor = false } = {}) {
  const c = { wall: '#e8e3d8', plinth: '#6e6a66', tile: '#2e2c30', tileDark: '#1c1b1f', timber: '#2a1e18', window: '#3a2c24', lit: '#ffc66a', door: '#2a1e18', lantern: '#c0281c', ...col };
  const r = P2.rng(seed), K = parts(H), y0 = stilts + podium;
  // v4: a dressed-stone podium (the house stands on its own terrace on the hillside)
  if (podium > 0) { K.box(c.podium ?? '#4a4642', [w + 0.8, podium, d + 0.9], [0, podium / 2, 0.1]); K.box(P2.shade(c.podium ?? '#4a4642', 0.18), [w + 0.95, 0.14, d + 1.05], [0, podium + 0.02, 0.1]);
    for (let i = 0; i < Math.floor(podium / 0.45); i++) K.box(P2.shade(c.podium ?? '#4a4642', -0.25), [w + 0.82, 0.04, 0.02], [0, 0.4 + i * 0.45, d / 2 + 0.56]); }
  if (stilts) { for (const sx of [-1, -0.33, 0.33, 1]) for (const sz of [-1, 1]) K.box(c.timber, [0.26, stilts, 0.26], [sx * (w / 2 - 0.3), podium + stilts / 2, sz * (d / 2 - 0.3)]); K.box(c.timber, [w + 0.6, 0.16, d + 0.8], [0, y0 - 0.05, 0.2]); }
  // body, plinth
  K.box(c.wall, [w, h, d], [0, y0 + h / 2, 0]);
  if (!stilts) K.box(c.plinth, [w + 0.06, 0.45, d + 0.06], [0, y0 + 0.225, 0]);
  if (!horse) for (const fx of [-0.5, 0, 0.5]) K.box(c.timber, [0.2, h, 0.06], [fx * (w - 0.2), y0 + h / 2, d / 2 + 0.03]);
  // the roof: two slopes of channel tiles between the gables, the ridge with upturned ends
  const ov = horse ? 0.45 : 0.7, run = d / 2 + ov, a = Math.atan2(roofH, d / 2), rw = horse ? w - 0.2 : w + 0.9;
  const Yr = y0 + h + roofH, Ye = y0 + h - ov * Math.tan(a), L = Math.hypot(run, Yr - Ye) + 0.05;
  for (const s of [1, -1]) {
    const cz = s * run / 2, cy = (Yr + Ye) / 2, nx = Math.max(4, Math.round(rw / 0.42));
    K.box(c.tile, [rw, 0.14, L], [0, cy, cz], [s * a, 0, 0]);
    for (let i = 0; i < nx; i++) { const x = -rw / 2 + (i + 0.5) * rw / nx; K.box(c.tileDark, [0.13, 0.1, L], [x, cy + Math.cos(a) * 0.1, cz + s * Math.sin(a) * 0.1], [s * a, 0, 0]); }
    K.box(c.tileDark, [rw + 0.04, 0.18, 0.24], [0, Ye + 0.02, s * (run - 0.08)]);   // the eave lip
  }
  const ry = Yr + 0.1;
  K.box(c.tileDark, [rw - 0.1, 0.32, 0.34], [0, ry, 0]);
  for (const sx of [-1, 1]) K.box(c.tileDark, [0.6, 0.26, 0.3], [sx * (rw / 2 - 0.15), ry + 0.18, 0], [0, 0, -sx * 0.55]);
  // the gables: stepped horse-head walls with tile caps standing above the roof, or plain timber triangles
  for (const sx of [-1, 1]) {
    if (horse && steps) {
      const { s, steps: st } = gableShape(d / 2 + 0.3, y0 + h, y0 + h + roofH + 0.7, steps);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: false }); g.rotateY(Math.PI / 2);
      K.add(c.wall, g, [sx * (w / 2) - 0.16, 0, 0]);
      for (const p of st) {
        const segs = p.a < 0 ? [[p.a, p.b]] : [[p.a, p.b], [-p.b, -p.a]];
        for (const [x0, x1] of segs) {
          const len = x1 - x0 + 0.3, zc = -(x0 + x1) / 2;   // shape X -> world z = -X
          K.box(c.tileDark, [0.56, 0.17, len], [sx * (w / 2), p.y + 0.08, zc]);
          if (p.a >= 0) { const out = Math.sign(zc); K.box(c.tileDark, [0.5, 0.16, 0.42], [sx * (w / 2), p.y + 0.2, zc + out * len / 2], [-out * 0.5, 0, 0]); }
        }
      }
    } else {
      const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(0, roofH); s.lineTo(d / 2, 0); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }); g.rotateY(Math.PI / 2);
      K.add(horse ? c.wall : c.timber, g, [sx * (w / 2) - 0.06, y0 + h, 0]);
    }
  }
  // the front: per storey a pair of lattice windows; a mid-storey eave; the door with its tile hood; a lantern
  const fz = d / 2 + 0.035, sh = h / stories;
  for (let k = 0; k < stories; k++) {
    const wy = y0 + sh * k + sh * (k ? 0.5 : 0.58), nW = w > 5.6 ? 3 : 2;
    for (let i = 0; i < nW; i++) {
      const wx = (i - (nW - 1) / 2) * (w / nW) + (k === 0 && door && nW === 2 ? (i ? 0.5 : -0.5) : 0);
      if (k === 0 && door && Math.abs(wx) < 1.0) continue;
      const ww = Math.min(1.1, w / nW - 0.5), wh = Math.min(1.0, sh * 0.32);
      K.box(c.timber, [ww + 0.18, wh + 0.18, 0.06], [wx, wy, fz]);
      K.box(r() < lit ? c.lit : c.window, [ww, wh, 0.07], [wx, wy, fz + 0.01]);
      for (let b = 1; b < 4; b++) K.box(c.timber, [0.06, wh, 0.09], [wx - ww / 2 + b * ww / 4, wy, fz + 0.02]);
      K.box(c.timber, [ww, 0.06, 0.09], [wx, wy, fz + 0.02]);
    }
    if (k > 0) K.box(c.tile, [w + 0.1, 0.12, 0.95], [0, y0 + sh * k + 0.05, d / 2 + 0.38], [0.5, 0, 0]);
  }
  if (door) {
    K.box(c.door, [wideDoor ? w * 0.62 : 1.2, Math.min(2.1, sh * 0.7), 0.07], [0, y0 + Math.min(2.1, sh * 0.7) / 2 + (stilts ? 0 : 0.45), fz]);
    K.box('#b8b0a4', [1.6, 0.2, 0.1], [0, y0 + Math.min(2.1, sh * 0.7) + 0.55, fz]);
    K.box(c.tile, [1.9, 0.12, 0.7], [0, y0 + Math.min(2.1, sh * 0.7) + 0.85, d / 2 + 0.3], [0.45, 0, 0]);
  }
  // v4: a balcony rail on the upper storey; a shop banner (a cloth strip on a pole) beside the door
  if (balcony && stories > 1) { const by = y0 + sh + 0.1; K.box(c.timber, [w + 0.2, 0.12, 0.9], [0, by, d / 2 + 0.45]); K.box(c.timber, [w + 0.2, 0.1, 0.08], [0, by + 0.8, d / 2 + 0.88]);
    for (let i = 0; i <= Math.round(w / 0.5); i++) K.box(c.timber, [0.06, 0.8, 0.06], [-w / 2 - 0.1 + i * (w + 0.2) / Math.round(w / 0.5), by + 0.4, d / 2 + 0.88]); }
  if (banner) { const bx = w / 2 - 0.5; K.box(c.timber, [0.1, 3.2, 0.1], [bx, y0 + 1.6, d / 2 + 0.6]); K.box(c.timber, [0.9, 0.08, 0.08], [bx - 0.4, y0 + 3.1, d / 2 + 0.6]); K.box(banner, [0.62, 2.0, 0.04], [bx - 0.45, y0 + 2.05, d / 2 + 0.62]); K.box(P2.shade(banner, -0.35), [0.62, 0.12, 0.05], [bx - 0.45, y0 + 3.0, d / 2 + 0.63]); }
  if (lantern) for (const sx of [-1, 1]) { K.add(c.lantern, new THREE.CylinderGeometry(0.24, 0.24, 0.46, 8), [sx * 1.05, y0 + 2.2, d / 2 + 0.35]); K.box(c.tileDark, [0.36, 0.06, 0.36], [sx * 1.05, y0 + 2.46, d / 2 + 0.35]); }
  const g = K.build(); g.userData.top = y0 + h + roofH + (horse ? 0.9 : 0.3); return g;
}

/**
 * tower(H, o) -> group: a many-storey timber tower (楼阁) on a stone base: each floor a plastered box with red posts
 * and a balcony band, each roof a flared square frustum of tiles with upturned corners; it leans by `lean` (radians,
 * toward +x) and its top floors sit twisted and slipped, as if the tower were sinking and coming apart.
 */
export function tower(H, { floors = 5, w = 6, fh = 3.0, shrink = 0.84, lean = 0.16, seed = 3, col = {}, stairs = false, slip = true } = {}) {
  const c = { base: '#6a6660', wall: '#d8d0bc', post: '#8a2a1e', timber: '#3a2a20', tile: '#2e2c30', tileDark: '#1c1b1f', window: '#3a2c24', ...col };
  const r = P2.rng(seed), outer = new THREE.Group(), body = new THREE.Group(); outer.add(body);
  const KB = parts(H); KB.box(c.base, [w + 1.6, 1.0, w + 1.6], [0, 0.5, 0]); KB.box(P2.shade(c.base, 0.12), [w + 1.8, 0.16, w + 1.8], [0, 1.02, 0]); KB.build(outer);
  let y = 1.1, ww = w;
  for (let f = 0; f < floors; f++) {
    const K = parts(H), fl = new THREE.Group(); fl.position.y = y; body.add(fl);
    const wallH = fh * (f ? 0.78 : 1);
    K.box(c.wall, [ww, wallH, ww], [0, wallH / 2, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(c.post, [0.24, wallH, 0.24], [sx * ww / 2, wallH / 2, sz * ww / 2]);
    for (const [rx, rz, ry] of [[0, ww / 2 + 0.04, 0], [ww / 2 + 0.04, 0, Math.PI / 2], [0, -ww / 2 - 0.04, 0], [-ww / 2 - 0.04, 0, Math.PI / 2]]) {
      for (let i = -1; i <= 1; i++) { const off = i * ww * 0.3; K.box(c.timber, [0.9, wallH * 0.42, 0.06], [rx + (ry ? 0 : off), wallH * 0.55, rz + (ry ? off : 0)], [0, ry, 0]); K.box(c.window, [0.7, wallH * 0.36, 0.07], [rx + (ry ? 0.01 : off), wallH * 0.55, rz + (ry ? off : 0.01)], [0, ry, 0]); }
      if (f) K.box(c.timber, [ww + 0.6, 0.14, 0.12], [rx, 0.55, rz], [0, ry, 0]);   // the balcony rail
    }
    // the roof: a flared frustum (4 sides), a ridge cap block, upturned corner tips
    const rr = ww * 0.78 + 0.9, rH = fh * 0.42;
    const roof = new THREE.CylinderGeometry(ww * 0.34, rr, rH, 4, 1, false); roof.rotateY(Math.PI / 4);
    K.add(c.tile, roof, [0, wallH + rH / 2, 0]);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, cx = Math.cos(a) * rr * 0.98, cz = Math.sin(a) * rr * 0.98; K.box(c.tileDark, [0.7, 0.18, 0.24], [cx, wallH + 0.15, cz], [0, -a, 0.6]); }
    K.box(c.tileDark, [ww * 0.5, 0.3, ww * 0.5], [0, wallH + rH, 0]);
    // v4: an outside stair climbing to the next floor along one face (turning a face each floor) with a rail: the tower can be climbed
    if (stairs && f < floors - 1) {
      const side = f % 4, nSt = 9, run = ww * 0.9, rise = wallH + fh * 0.42 * 0.75, out = ww / 2 + 0.55;
      for (let i = 0; i < nSt; i++) {
        const u = (i + 0.5) / nSt, along = -run / 2 + u * run, y = u * rise;
        const pos = side === 0 ? [along, y, out] : side === 1 ? [out, y, -along] : side === 2 ? [-along, y, -out] : [-out, y, along];
        K.box(c.timber, side % 2 ? [0.9, 0.12, run / nSt + 0.05] : [run / nSt + 0.05, 0.12, 0.9], pos);
        const rp = side === 0 ? [along, y + 0.55, out + 0.42] : side === 1 ? [out + 0.42, y + 0.55, -along] : side === 2 ? [-along, y + 0.55, -out - 0.42] : [-out - 0.42, y + 0.55, along];
        K.box(c.post, [0.07, 1.1, 0.07], rp);
      }
      const len = Math.hypot(run, rise), ang = Math.atan2(rise, run), mid = rise / 2 + 1.05;
      const rail = side === 0 ? [[0, mid, out + 0.42], [0, 0, ang]] : side === 1 ? [[out + 0.42, mid, 0], [ang, 0, 0]] : side === 2 ? [[0, mid, -out - 0.42], [0, 0, -ang]] : [[-out - 0.42, mid, 0], [-ang, 0, 0]];
      K.box(c.post, side % 2 ? [0.08, 0.08, len] : [len, 0.08, 0.08], rail[0], rail[1]);
    }
    K.build(fl);
    // floors above the third slip and twist a little (the tower coming apart)
    if (slip && f >= 2) { fl.rotation.y = (r() - 0.5) * 0.12 * (f - 1); fl.position.x = (f - 1) * 0.12; fl.rotation.z = (r() - 0.3) * 0.05; }
    y += wallH + rH * 0.75; ww *= shrink;
  }
  // a spire
  const K = parts(H); K.add(c.tileDark, new THREE.ConeGeometry(0.35, 2.2, 6), [0, y + 1.1, 0]); for (let i = 0; i < 3; i++) K.add('#7a6a4a', new THREE.CylinderGeometry(0.42 - i * 0.08, 0.42 - i * 0.08, 0.12, 8), [0, y + 0.3 + i * 0.45, 0]); K.build(body);
  body.rotation.z = -lean; body.position.x = 0.0;
  outer.userData.top = y + 2.2; return outer;
}

/**
 * paifang(H, o) -> group: a timber memorial gateway (牌坊) over a street: two or four posts on stone drums, tie beams, a
 * name board, and small tiled roofs with upturned ends over each bay. Front faces +z; base at y = 0.
 */
export function paifang(H, { w = 7, h = 5.2, bays = 3, seed = 2, col = {} } = {}) {
  const c = { post: '#2e221c', beam: '#3a2a20', drum: '#5a5652', tile: '#2a282c', tileDark: '#1a191c', board: '#1a1414', gold: '#c8a050', red: '#8e1a14', ...col };
  const K = parts(H), xs = bays === 3 ? [-w / 2, -w / 6, w / 6, w / 2] : [-w / 2, w / 2];
  for (const x of xs) { K.box(c.drum, [0.8, 0.7, 0.8], [x, 0.35, 0]); K.box(c.post, [0.36, h, 0.36], [x, h / 2, 0]); }
  K.box(c.beam, [w + 0.6, 0.34, 0.4], [0, h * 0.72, 0]); K.box(c.beam, [w + 0.4, 0.26, 0.36], [0, h * 0.9, 0]);
  K.box(c.red, [w * 0.36, 0.9, 0.08], [0, h * 0.81, 0.22]); K.box(c.board, [w * 0.3, 0.62, 0.1], [0, h * 0.81, 0.24]); K.box(c.gold, [w * 0.22, 0.08, 0.11], [0, h * 0.81, 0.25]);
  const roofs = bays === 3 ? [[0, w / 3 + 0.9, h + 0.55], [-w / 3, w / 3 + 0.5, h + 0.1], [w / 3, w / 3 + 0.5, h + 0.1]] : [[0, w + 0.9, h + 0.3]];
  for (const [x, rw, y] of roofs) {
    for (const s of [1, -1]) K.box(c.tile, [rw, 0.12, 1.1], [x, y, s * 0.38], [s * 0.5, 0, 0]);
    K.box(c.tileDark, [rw - 0.1, 0.24, 0.26], [x, y + 0.3, 0]);
    for (const sx of [-1, 1]) K.box(c.tileDark, [0.55, 0.2, 0.26], [x + sx * (rw / 2 - 0.1), y + 0.42, 0], [0, 0, -sx * 0.6]);
  }
  const g = K.build(); g.userData.top = h + 1.3; return g;
}
