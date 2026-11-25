// Terrain, v2: the regions get real relief, built the pop-up / tunnel-book way. Mountains and canyon walls are stacks
// of big cut flats standing one behind another (each nearer flat lower and darker, the far ones paler), so a camera
// moving through them sees parallax and height; distant ranges are wide silhouettes past the sheet's far edge;
// islands and terraces are parallel-fold platforms with a rock face. Everything stands on hinges and rises with its
// group like every other card (film.rise). PLAN-v2 section 1.
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { platform, prismFold } from 'papercraft/lib/paperkit-3d.js';

/**
 * A cliff outline for a wing flat w wide and up to h tall. side -1: a LEFT wall (the canyon is to its right, so the
 * flat is tall on the left and steps down to the right); +1 mirrored. Pine teeth are cut into the plateau.
 * Returns { pts, top } (top: the profile points, outer to inner, for the painter).
 */
export function cliffOutline(w, h, side, r, { plateau = 0.5, foot = 0.14, pines = 0.6, jag = 0.08, spires = 1 } = {}) {
  const N = 46, top = [];
  const spireAt = Array.from({ length: spires }, () => 0.1 + r() * plateau * 0.8);
  for (let i = 0; i <= N; i++) {
    const u = i / N;   // 0 outer edge, 1 the canyon edge
    let f = u < plateau ? 0.82 + 0.12 * Math.sin(u * 13 + r()) : lerp(0.82, foot, Math.pow((u - plateau) / (1 - plateau), 0.8));
    if (u > plateau) f -= ((Math.floor(u * 9) % 2) ? 0.04 : 0);   // ledges stepping down to the water
    for (const s of spireAt) f += Math.max(0, 0.22 - Math.abs(u - s) * 2.2);
    f += (r() - 0.5) * jag;
    top.push([u, Math.max(0.08, Math.min(1.08, f))]);
  }
  // cut pine teeth into the high ground (tree silhouettes on the ridge)
  const prof = [];
  for (let i = 0; i < top.length; i++) {
    const [u, f] = top[i]; prof.push([u, f]);
    if (i < top.length - 1 && f > 0.55 && r() < pines * 0.5) {
      const du = 1 / N, th = 0.05 + r() * 0.07;
      prof.push([u + du * 0.25, f + th * 0.45], [u + du * 0.35, f + th * 0.3], [u + du * 0.5, f + th], [u + du * 0.65, f + th * 0.3], [u + du * 0.75, f + th * 0.45]);
    }
  }
  const X = (u) => side < 0 ? -w / 2 + u * w : w / 2 - u * w;
  const pts = [[X(0), 0], ...prof.map(([u, f]) => [X(u), f * h]), [X(1), 0]];
  if (side > 0) pts.reverse();
  return { pts, top: prof.map(([u, f]) => [X(u), f * h]) };
}
const lerp = (a, b, t) => a + (b - a) * t;

/** the print of a cliff flat: lit stone, darker faceted faces, moss ledges under the ridge, dark pines, mist at the foot */
export function paintCliff({ top, rock = '#7d806f', dark = '#4f5348', moss = '#6f7d52', pine = '#2f3a2c', mist = '#c3c9b6', ink = '#1c2622', strata = true, seed = 1 }) {
  return (P) => {
    const { box } = P, r = P2.rng(seed);
    P.gradient(P2.shade(rock, -0.06), P2.shade(rock, 0.1)); P.felt(0.5);
    // faceted rock faces: tall slanted slabs in two darker values
    P.layer((g) => { for (let i = 0; i < 14; i++) { const x = box.x0 + r() * box.w, w = 0.8 + r() * 2.2, y1 = box.y0 + box.h * (0.3 + r() * 0.6), sl = (r() - 0.5) * 1.6; g.beginPath(); g.moveTo(x, box.y0); g.lineTo(x + w, box.y0); g.lineTo(x + w + sl, y1); g.lineTo(x + sl * 0.5, y1 + 0.6); g.closePath(); g.fill(); } }, P2.shade(rock, -0.14), { lip: 0.6 });
    P.layer((g) => { for (let i = 0; i < 9; i++) { const x = box.x0 + r() * box.w, w = 0.4 + r() * 1.0, y1 = box.y0 + box.h * (0.2 + r() * 0.5); g.beginPath(); g.moveTo(x, box.y0); g.lineTo(x + w, box.y0); g.lineTo(x + w * 0.6, y1); g.closePath(); g.fill(); } }, dark, { lip: 0.5 });
    if (strata) P.marks('hatch', { color: P2.shade(rock, -0.35), alpha: 0.22, size: 0.035, angle: 0.06 });
    // moss ledges hanging under the ridge line, and dark pines on it
    P.layer((g) => { g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(x, y + 0.2) : g.moveTo(x, y + 0.2))); for (let i = top.length - 1; i >= 0; i--) { const [x, y] = top[i]; g.lineTo(x, y - 0.5 - 0.9 * Math.abs(Math.sin(x * 1.7 + 2))); } g.closePath(); g.fill(); }, moss, { lip: 0.8 });
    P.layer((g) => { for (let i = 1; i < top.length - 1; i++) { const [x, y] = top[i]; if (y < box.h * 0.5 || r() < 0.45) continue; const s = 0.5 + r() * 0.7; g.beginPath(); g.moveTo(x - s * 0.5, y - 0.4); g.lineTo(x, y + s * 1.3); g.lineTo(x + s * 0.5, y - 0.4); g.closePath(); g.fill(); } }, pine, { lip: 0.5 });
    P.marks('tick', { color: P2.shade(rock, -0.45), alpha: 0.3, size: 0.03, angle: 1.1 });
    // mist lying at the foot (a pale torn band)
    if (mist) P.layer((g) => { g.beginPath(); g.moveTo(box.x0 - 1, box.y0 - 1); for (let x = box.x0; x <= box.x1 + 0.5; x += 0.5) g.lineTo(x, 0.9 + Math.sin(x * 0.9 + seed) * 0.35 + r() * 0.15); g.lineTo(box.x1 + 1, box.y0 - 1); g.closePath(); g.fill(); }, P2.rgba(mist, 0.75), { shadow: 0.4, lip: 0.4 });
    P.innerShade(ink, { alpha: 0.35, blurPx: 12 });
  };
}

/** a far mountain range: a wide soft silhouette, peaks and saddles, printed in one value with paler snow / haze caps */
export function rangeOutline(w, h, r, { peaks = 6, sharp = 1.4 } = {}) {
  const pts = [[w / 2, 0]], N = 90, P = Array.from({ length: peaks }, (_, i) => ({ u: (i + 0.2 + r() * 0.6) / peaks, h: 0.5 + r() * 0.5, wd: 0.06 + r() * 0.08 }));
  for (let i = N; i >= 0; i--) {
    const u = i / N; let f = 0.25 + 0.05 * Math.sin(u * 17);
    for (const p of P) f = Math.max(f, p.h * Math.max(0, 1 - Math.pow(Math.abs(u - p.u) / p.wd / 3, 1 / sharp) ));
    pts.push([-w / 2 + u * w, f * h + (r() - 0.5) * h * 0.02]);
  }
  pts.push([-w / 2, 0]); return pts.reverse();
}

/**
 * makeTerrain(K): K is setupChapter's kit. Returns:
 *  wings({ zs, side, inner(z), w, h(z), colors(i), group, seed, yaw }) -> hinges: canyon / valley walls, one flat per z
 *  range({ z, x, w, h, color, cap, group, seed }) -> hinge: a far range silhouette
 *  island({ x, z, w, d, h, face, deck, group }) -> hinge with .deckY: a raised islet / terrace (actors stand at y = h)
 */
export function makeTerrain(K) {
  const { H, put, mark } = K;
  function wings({ zs, side, inner, w = 24, h, colors = () => ({}), group = 'world', seed = 1, yaw = 0.18, opts = {} }) {
    return zs.map((z, i) => {
      const r = P2.rng(seed * 97 + i * 13), hh = typeof h === 'function' ? h(z, i) : h, ww = typeof w === 'function' ? w(z, i) : w;
      const { pts, top } = cliffOutline(ww, hh, side, r, opts);
      const xc = inner(z, i) + (side < 0 ? -ww / 2 : ww / 2);
      const paint = paintCliff({ top, seed: seed + i, ...colors(i, z) });
      const hdl = put(H.popup(pts, paint, { x: xc, z, yaw: side < 0 ? yaw : -yaw, res: 0.9 }), group);
      hdl.card = hdl.pivot.children[0]; hdl.top = top; hdl.cliff = { side, w: ww, h: hh, xc, z };
      return hdl;
    });
  }
  function range({ z, x = 0, w = 140, h = 26, color = '#9aa093', cap = '#c9cdbf', group = 'world', seed = 3, peaks = 7 }) {
    const r = P2.rng(seed), pts = rangeOutline(w, h, r, { peaks });
    const paint = (P) => { P.fill(color); P.felt(0.4);
      P.layer((g) => { g.beginPath(); pts.forEach(([x2, y], i) => (i ? g.lineTo(x2, y) : g.moveTo(x2, y))); for (let i = pts.length - 1; i >= 0; i--) { const [x2, y] = pts[i]; g.lineTo(x2, y - h * (0.08 + 0.05 * Math.sin(x2 * 0.3))); } g.closePath(); g.fill(); }, cap, { lip: 0.6, shadow: 0.5 });
      P.marks('hatch', { color: P2.shade(color, -0.2), alpha: 0.18, size: 0.03, angle: -0.5 });
      P.innerShade('#1c2622', { alpha: 0.2, blurPx: 14 }); };
    const hdl = put(H.popup(pts, paint, { x, z, yaw: 0, res: 0.6 }), group); hdl.card = hdl.pivot.children[0]; return hdl;
  }
  function island({ x, z, w = 8, d = 6, h = 1.6, face = '#6f6a5c', deck = '#7d8a5e', group = 'world', seed = 5, rim = '#c9c2a8', rect = false, deckPaint = null, facePaint = null }) {
    const r = P2.rng(seed), facePts = [[-w / 2, 0]];
    for (let i = 0; i <= 16; i++) { const u = i / 16; facePts.push([-w / 2 + u * w, h * (0.7 + 0.3 * (1 - Math.abs(u - 0.5) * 2)) + (r() - 0.5) * 0.1 * h]); }
    facePts[1][1] = h; facePts[facePts.length - 1][1] = h; facePts.push([w / 2, 0]);
    const fixTop = facePts.map(([px, py], i) => [px, i > 0 && i < facePts.length - 1 ? h : py]);   // the deck fold stays straight
    const deckPts = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI; deckPts.push([Math.cos(a) * w / 2 * (0.96 + r() * 0.04), Math.sin(a) * d * (0.95 + r() * 0.08)]); }
    deckPts[0][1] = 0; deckPts[deckPts.length - 1][1] = 0;
    if (rect) { deckPts.length = 0; deckPts.push([-w / 2, 0], [w / 2, 0], [w / 2, d], [-w / 2, d]); }
    const node = platform({ w, d, h, paper: H.paper, support: false, seed, facePts: fixTop, deckPts,
      paints: { face: facePaint ?? ((P) => { P.gradient(P2.shade(face, -0.12), P2.shade(face, 0.08)); P.felt(0.5); P.marks('tick', { color: P2.shade(face, -0.4), alpha: 0.4, size: 0.06, angle: 1.2 }); P.layer((g) => { g.fillRect(-w / 2, h - 0.25, w, 0.25); }, rim, { lip: 0.6 }); P.innerShade('#1c2622', { alpha: 0.35, blurPx: 8 }); }),
        deck: deckPaint ?? ((P) => { P.fill(deck); P.felt(0.5); P.marks('dab', { color: P2.shade(deck, -0.2), alpha: 0.4, size: 0.05 }); P.marks('dot', { color: P2.shade(deck, 0.25), alpha: 0.35, size: 0.03, density: 0.5 }); }) },
      print: H.cardOpts(x, z) });
    const hdl = put(H.popup(null, null, { node, x, z, yaw: 0, height: h, level: true }), group);
    hdl.deckY = h; hdl.deck = node.userData.deck; mark(x, z - d / 2, Math.max(w, d) * 0.55); return hdl;
  }
  /** a stone arch bridge (a parallel-fold platform whose face has an arch cut through it), spanning x, level deck */
  function bridge({ x, z, w = 6, d = 2.4, h = 1.8, stone = '#a8a294', group = 'world', seed = 9 }) {
    const arch = []; for (let i = 0; i <= 16; i++) { const a = Math.PI - i / 16 * Math.PI; arch.push([Math.cos(a) * w * 0.3, Math.sin(a) * h * 0.72]); }
    arch[0][1] = -0.01; arch[arch.length - 1][1] = -0.01;
    const sp = (P) => { P.fill(stone); P.felt(0.5); P.marks('brick', { color: P2.shade(stone, -0.35), alpha: 0.5, size: 0.08 }); P.innerShade('#1c1410', { alpha: 0.35, blurPx: 6 }); };
    const node = platform({ w, d, h, paper: H.paper, support: true, seed, holes: { face: [arch], support: [arch.map(([a2, b2]) => [a2 * 0.9, b2 - h])] }, paints: { face: sp, deck: (P) => { P.fill(P2.shade(stone, 0.08)); P.marks('brick', { color: P2.shade(stone, -0.3), alpha: 0.4, size: 0.12 }); }, support: sp }, print: H.cardOpts(x, z) });
    const hdl = put(H.popup(null, null, { node, x, z, yaw: 0, height: h, level: true }), group); mark(x, z - d / 2, w * 0.5); return hdl;
  }
  /** an army tent: a square or hexagonal canvas tent with a tall pyramid roof (a folded prism), striped canvas, a door flap */
  function tent({ x, z, r = 2.6, sides = 4, h = 1.6, roofH = 3.2, canvas = '#d8ccb0', stripe = '#8a2a1e', yaw = 0, group = 'world', seed = 11 }) {
    const fp = Array.from({ length: sides }, (_, i) => { const a = Math.PI / 2 + Math.PI / sides + i / sides * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r]; });
    const wall = (P) => { const { box } = P; P.fill(canvas); P.felt(0.6); P.layer((g) => { g.fillRect(box.x0, box.y1 - 0.25, box.w, 0.25); g.fillRect(box.x0, box.y0, box.w, 0.18); }, stripe, { lip: 0.5 }); P.layer((g) => { g.beginPath(); g.moveTo(box.x0 + box.w * 0.38, box.y0); g.lineTo(box.x0 + box.w * 0.5, box.y1 - 0.3); g.lineTo(box.x0 + box.w * 0.62, box.y0); g.closePath(); g.fill(); }, P2.shade(canvas, -0.45), { lip: 0.4 }); P.innerShade('#24180e', { alpha: 0.3, blurPx: 8 }); };
    const roof = (P) => { const { box } = P; P.gradient(P2.shade(canvas, -0.12), P2.shade(canvas, 0.06)); P.felt(0.6); P.marks('hatch', { color: P2.shade(canvas, -0.4), alpha: 0.25, size: 0.05, angle: 1.4 }); P.layer((g) => { g.fillRect(box.x0, box.y0, box.w, 0.3); }, stripe, { lip: 0.5 }); P.innerShade('#24180e', { alpha: 0.3, blurPx: 8 }); };
    const node = prismFold(fp, { h, roof: 'pyramid', roofH, paper: H.paper, seed, paints: { wall, roof }, print: H.cardOpts(x, z) });
    const hdl = put(H.popup(null, null, { node, x, z, yaw, height: h + roofH, level: true }), group); mark(x, z, r * 1.1); return hdl;
  }
  /** a banner: a tall pole with a cloth flag card (red or black with a pale border) */
  function banner({ x, z, h = 7, w = 1.6, fh = 3.4, cloth = '#a3261c', edge = '#e8d8b0', group = 'world', flip = false }) {
    const pts = [[-0.12, 0], [0.12, 0], [0.12, h - fh], [0.12 + w * (flip ? -1 : 1), h - fh + 0.3], [0.12 + w * (flip ? -1 : 1), h - 0.1], [0.12, h], [0.06, h + 0.4], [-0.12, h]].map(([a, b2]) => [a, b2]);
    const paint = (P) => { P.fill('#3a2a20'); P.layer((g) => { g.beginPath(); g.moveTo(0.12, h - fh); g.lineTo(0.12 + w * (flip ? -1 : 1), h - fh + 0.3); g.lineTo(0.12 + w * (flip ? -1 : 1), h - 0.1); g.lineTo(0.12, h); g.closePath(); g.fill(); }, cloth, { lip: 0.8 }); P.layer((g) => { g.lineWidth = 0.14; g.strokeStyle = edge; g.beginPath(); g.moveTo(0.2 * (flip ? -1 : 1) + 0.12, h - fh + 0.4); g.lineTo(0.12 + w * 0.88 * (flip ? -1 : 1), h - fh + 0.6); g.lineTo(0.12 + w * 0.88 * (flip ? -1 : 1), h - 0.35); g.stroke(); }, edge); P.innerShade('#1a1008', { alpha: 0.3, blurPx: 5 }); };
    const hdl = put(H.popup(pts, paint, { x, z, sway: 0.8, res: 1 }), group); return hdl;
  }
  return { wings, range, island, bridge, tent, banner };
}
