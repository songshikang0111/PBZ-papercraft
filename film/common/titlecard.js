// The film's title card (v4), shared by the opening and the ending: the game's own white logo 「影之刃零」 printed on a
// card that rises off the page, and under it 「剪纸版」 — the one lettering of our own in the film: three red
// paper-cut seals, each character cut clean through the red stock (window-cut, like a 窗花), that pop up one after
// another like an accordion and land with a small gold star.
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { starburst } from './fx.js';

export const LOGO = '/work/film/art/calligraphy/标志/影之刃零_白色原版标志.png';

/** a red paper-cut seal with `ch` cut through it (a canvas with alpha: the cut is transparent) */
export function cutSeal(ch, { size = 320, red = '#a8231a', seed = 3 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), r = P2.rng(seed), m = size * 0.06;
  // the seal: a square of red stock with a hand-torn edge and a thin cut frame inside it
  g.beginPath(); const n = 14;
  for (let i = 0; i < n * 4; i++) { const k = i % n, side = Math.floor(i / n), u = k / n, j = (r() - 0.5) * size * 0.018;
    const [x, y] = side === 0 ? [m + u * (size - 2 * m), m + j] : side === 1 ? [size - m + j, m + u * (size - 2 * m)] : side === 2 ? [size - m - u * (size - 2 * m), size - m + j] : [m + j, size - m - u * (size - 2 * m)];
    i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.fillStyle = red; g.fill();
  g.globalCompositeOperation = 'destination-out';
  g.lineWidth = size * 0.012; g.strokeRect(m * 2.1, m * 2.1, size - m * 4.2, size - m * 4.2);
  // the character, cut through (a brush face, then thickened a touch so the cut reads as scissor-work)
  g.font = `${size * 0.66}px "MaShanZheng", "ZhiMangXing", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [dx, dy] of [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]]) g.fillText(ch, size / 2 + dx, size / 2 + size * 0.03 + dy);
  // little cut nicks round the frame (the paper-cutter's flourish)
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, R = size * 0.42; g.beginPath(); g.arc(size / 2 + Math.cos(a) * R, size / 2 + Math.sin(a) * R, size * 0.018, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return c;
}

/** the logo on a torn ink-brush plaque (one connected card: the cutter keeps a single outline) */
export function logoPlaque(img, { seed = 11 } = {}) {
  const W = Math.round(img.width * 1.22), Hh = Math.round(img.height * 1.42), c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d'), r = P2.rng(seed);
  // a dry-brush swath: overlapping torn strokes of dark ink, ragged at both ends
  for (let k = 0; k < 7; k++) {
    const y = Hh * (0.3 + k * 0.065), th = Hh * (0.16 + r() * 0.06), x0 = W * (0.03 + r() * 0.05), x1 = W * (0.95 - r() * 0.05);
    g.beginPath(); g.moveTo(x0, y);
    for (let i = 0; i <= 24; i++) { const u = i / 24; g.lineTo(lerpN(x0, x1, u), y - th / 2 * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.05)) ** 0.4 + (r() - 0.5) * Hh * 0.025); }
    for (let i = 24; i >= 0; i--) { const u = i / 24; g.lineTo(lerpN(x0, x1, u), y + th / 2 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.03)) ** 0.4 + (r() - 0.5) * Hh * 0.025); }
    g.closePath(); g.fillStyle = k % 3 ? '#1d1a18' : '#26201c'; g.fill();
  }
  g.drawImage(img, (W - img.width) / 2, (Hh - img.height) / 2);
  // a small red seal at the swath's tail
  const ss = Hh * 0.075; g.fillStyle = '#a8231a'; g.fillRect(W * 0.9, Hh * 0.74, ss, ss);
  return c;
}
const lerpN = (a, b, t) => a + (b - a) * t;

/**
 * Stand the title on the page: the logo card at [x, z] and the three seals in front of it, in groups `logo` and `cut`.
 * Returns { rise(t), fold(t) } to cue them.
 */
export function titleCard(K, { x = 0, z = 20, logoH = 5.4, sealH = 2.0 } = {}) {
  const { film, IMG, sticker } = K;
  IMG.__plaque = logoPlaque(IMG.__logo); IMG.cut0 = cutSeal('剪', { seed: 3 }); IMG.cut1 = cutSeal('纸', { seed: 5 }); IMG.cut2 = cutSeal('版', { seed: 7 });
  sticker('__plaque', logoH, { x, z, group: 'logo', res: 1.6, mark: false });
  const seals = [0, 1, 2].map((i) => sticker('cut' + i, sealH, { x: x + (i - 1) * (sealH * 1.15), z: z + 5.6, group: 'cut', res: 1.4, mark: false }));
  seals.forEach((h, i) => { h.order = i; });
  return {
    rise(t) {
      film.rise('logo', t, { from: [x, z], speed: 30 }); film.sound(t, 'title');
      film.rise('cut', t + 1.6, { spread: 0.16 });
      for (let i = 0; i < 3; i++) film.sound(t + 1.6 + i * 0.16, 'rise', { size: 0.5 });
      starburst(film, { t: t + 2.25, at: [x + sealH * 1.15 + 1.0, sealH + 0.4, z + 5.8], r: 0.6, spikes: 8, colors: ['#3a2a0a', '#c8a050', '#f6e2a0'], dur: 0.45, sound: 'stamp' });
    },
    fold(t) { film.rise('cut', t, { open: 0, spread: 0.08 }); film.rise('logo', t + 0.25, { open: 0, from: [x, z], speed: 30 }); },
  };
}
