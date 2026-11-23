import { FlapSpring, windSway } from './paper-motion.mjs';
import { closing, duration, opening, pageLength, pages } from './story.mjs';

const query = new URLSearchParams(location.search);
const portrait = query.get('format') === 'vertical';
const lowRes = query.get('preview') === '1';
const W = portrait ? 900 : 1600;
const H = portrait ? 1600 : 900;
const scale = lowRes ? .72 : 1.2;
const canvas = document.querySelector('canvas');
canvas.width = Math.round(W * scale);
canvas.height = Math.round(H * scale);
let ctx = canvas.getContext('2d', { alpha: false });

const paper = '#e8d6b1';
const ink = '#301f18';
const cjk = '"Noto Serif CJK SC", "Songti SC", serif';
const sans = '"Noto Sans CJK SC", sans-serif';
const clamp = (x) => Math.min(1, Math.max(0, x));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (x) => { const p = clamp(x); return p * p * (3 - 2 * p); };

const sheet = portrait
  ? { top: 430, bottom: 1412, left: 36, right: 864, inset: 50, bend: 29 }
  : { top: 294, bottom: 805, left: 44, right: 1556, inset: 118, bend: 36 };
const pieces = portrait
  ? [[223, 980, 163, 194], [422, 986, 178, 201], [633, 974, 165, 177],
     [557, 793, 344, 404], [319, 727, 284, 362], [721, 1144, 194, 216]]
  : [[213, 655, 202, 162], [421, 674, 229, 178], [626, 653, 203, 170],
     [1260, 694, 416, 429], [1024, 565, 369, 393], [744, 753, 135, 175]];
const covers = portrait
  ? { x: 118, y: 236, w: 664, h: 893 }
  : { x: 533, y: 88, w: 535, h: 686 };
const starts = [.99, 1.35, 1.73, 2.42, .44, .60];

function imageFile(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load ' + name));
    img.src = './art/' + name + '.webp';
  });
}

async function loadPage(page, optional) {
  try {
    const art = await Promise.all(Array.from({ length: 6 }, (_, i) => imageFile(page.id + '-' + (i + 1))));
    return { ...page, art, ground: await imageFile(page.id + '-paper') };
  } catch (error) {
    if (!optional) throw error;
    return null;
  }
}

function polygon(points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function text(string, x, y, { size = 22, color = ink, weight = 500, family = cjk, align = 'left' } = {}) {
  ctx.font = weight + ' ' + size + 'px ' + family;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(string, x, y);
}

function spaced(string, x, y, size, spacing, color, center = false) {
  ctx.font = '600 ' + size + 'px Georgia, serif';
  const width = [...string].reduce((n, char) => n + ctx.measureText(char).width + spacing, -spacing);
  let left = center ? x - width / 2 : x;
  for (const char of string) {
    text(char, left, y, { size, color, weight: 600, family: 'Georgia, serif' });
    left += ctx.measureText(char).width + spacing;
  }
}

function stroke(points, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function ellipse(x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function coverFit(img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = w / s;
  const dh = h / s;
  ctx.drawImage(img, (img.width - dw) / 2, (img.height - dh) / 2, dw, dh, x, y, w, h);
}

function backdrop(img) {
  ctx.fillStyle = '#24211e';
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.save();
    ctx.globalAlpha = .46;
    ctx.filter = 'blur(24px) saturate(.66)';
    coverFit(img, -45, -45, W + 90, H + 90);
    ctx.restore();
  }
  const vignette = ctx.createRadialGradient(W * .4, H * .41, H * .12, W * .54, H * .5, Math.max(W, H) * .69);
  vignette.addColorStop(0, '#17140f06');
  vignette.addColorStop(.55, '#100b0a58');
  vignette.addColorStop(1, '#0c0a0bdf');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function pageShape(yOffset = 0, expand = 0) {
  const { top, bottom, left, right, inset, bend } = sheet;
  const cy = top + yOffset;
  const by = bottom + yOffset;
  ctx.beginPath();
  ctx.moveTo(left + inset - expand, cy);
  ctx.bezierCurveTo(W * .27, cy - bend, W * .40, cy - bend * .37, W / 2, cy + bend * .51);
  ctx.bezierCurveTo(W * .62, cy - bend * .37, W * .76, cy - bend, right - inset + expand, cy);
  ctx.lineTo(right + expand, by);
  ctx.bezierCurveTo(W * .76, by - bend * .60, W * .60, by - bend * .41, W / 2, by + bend * .55);
  ctx.bezierCurveTo(W * .39, by - bend * .37, W * .25, by - bend * .62, left - expand, by);
  ctx.closePath();
}

function spread(page) {
  const { top, bottom, left, right, bend } = sheet;
  ctx.save();
  ctx.filter = 'blur(21px)';
  pageShape(46, 11);
  ctx.fillStyle = '#120d0ac8';
  ctx.fill();
  ctx.restore();
  pageShape(23, 10);
  ctx.fillStyle = '#372427';
  ctx.fill();
  for (let i = 14; i > 0; i -= 2) {
    pageShape(i);
    ctx.fillStyle = i % 4 === 0 ? '#b7a179' : '#dfc196';
    ctx.fill();
  }
  ctx.save();
  pageShape();
  ctx.clip();
  ctx.fillStyle = paper;
  ctx.fillRect(left, top - bend, right - left, bottom - top + bend * 2);
  const edge = portrait ? 22 : 27;
  const pw = right - left - 2 * edge;
  const ph = bottom - top + bend - edge;
  ctx.globalAlpha = portrait ? .86 : .89;
  ctx.drawImage(page.ground, left + edge, top - 1, pw, ph);
  ctx.globalAlpha = 1;
  const cornerShade = ctx.createLinearGradient(0, top, 0, bottom + bend);
  cornerShade.addColorStop(0, '#30211c22');
  cornerShade.addColorStop(.38, '#ffedd013');
  cornerShade.addColorStop(.78, '#d6aa7922');
  cornerShade.addColorStop(1, '#40241530');
  ctx.fillStyle = cornerShade;
  ctx.fillRect(left, top - bend, right - left, bottom - top + bend * 2);
  const gutter = ctx.createLinearGradient(W / 2 - 56, 0, W / 2 + 57, 0);
  gutter.addColorStop(0, '#35201500');
  gutter.addColorStop(.48, '#432a2458');
  gutter.addColorStop(.53, '#28191591');
  gutter.addColorStop(.65, '#f6d9a34c');
  gutter.addColorStop(1, '#f6d9a300');
  ctx.fillStyle = gutter;
  ctx.fillRect(W / 2 - 56, top - bend, 113, bottom - top + bend * 2);
  ctx.restore();
}

function plaque(string, x, y, options = {}) {
  const { size = 24, accent = '#a24231', main = false } = options;
  ctx.font = (main ? '800 ' : '650 ') + size + 'px ' + cjk;
  const width = ctx.measureText(string).width + (main ? 49 : 28);
  const height = size + (main ? 22 : 15);
  ctx.save();
  ctx.shadowColor = '#18100c60';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  const left = x - width / 2;
  const top = y - height / 2;
  polygon([[left - 1, top + 2], [left + width, top], [left + width + 1, top + height - 2], [left, top + height]],
    main ? accent : '#eddbb6');
  ctx.restore();
  stroke([[left + 4, top + height - 3], [left + width - 4, top + height - 5]], main ? '#efc78a6c' : '#b6916a', .8);
  text(string, x, y - 1, { size, weight: main ? 800 : 650, color: main ? '#fff0cb' : ink, align: 'center' });
}

function titleText(page, index) {
  const x = portrait ? 421 : 125;
  const y = portrait ? 249 : 110;
  const align = portrait ? 'center' : 'left';
  const color = '#f1dbac';
  spaced('SHADOW ATLAS   /   ' + String(index + 1).padStart(2, '0') + ' OF 09',
    x, y, 15, 2.5, '#d1ac7f', portrait);
  text(page.name, x, y + 61, { size: portrait ? 68 : 76, color, weight: 850, align });
  text('「' + page.subtitle + '」', x + (portrait ? 0 : -8), y + 115,
    { size: 23, color: '#edc18d', weight: 650, align });
  if (portrait) {
    text(page.shortNote || page.note, x, y + 154, { size: 18, color: '#f0dcba', family: sans, align });
  } else {
    text(page.note, x + 3, y + 153, { size: 21, color: '#ebd6b6', family: sans });
    spaced(page.en, W - 118 - page.en.length * 11.5, y + 1, 12, 2.2, '#c7a986');
  }
}

function flapTable(size) {
  const spring = new FlapSpring({ size });
  spring.set(1);
  const up = Array.from({ length: 361 }, () => spring.step(1 / 240));
  spring.reset(1);
  spring.set(0);
  const down = Array.from({ length: 361 }, () => spring.step(1 / 240));
  return { up, down };
}
const smallFlap = flapTable(.28);
const bigFlap = flapTable(.71);
const getSample = (samples, time) => samples[Math.min(samples.length - 1, Math.floor(time * 240))];

function card(page, i, t, options = {}) {
  const { scale: localScale = 1, dx = 0, dy = 0, delay = starts[i] } = options;
  const [cx, base, maxHeight, maxWidth] = pieces[i];
  const img = page.art[i];
  const x = cx + dx;
  const y = base + dy;
  const size = Math.min(maxHeight / img.height, maxWidth / img.width) * localScale;
  const width = img.width * size;
  const height = img.height * size;
  const spring = i === 3 || i === 4 ? bigFlap : smallFlap;
  const fall = pageLength - .66 - (i % 3) * .055;
  let pose = t < delay ? 0 : getSample(spring.up, t - delay);
  if (t >= fall) pose = getSample(spring.down, t - fall);
  const sway = pose * windSway(t, i * .53, i * .27, { amp: i === 5 ? 2.2 : .65, phase: i * 1.2 });
  const angle = pose * Math.PI * .48 + sway;
  const lift = Math.sin(angle);
  const projection = .24 * Math.cos(angle) + .95 * lift;
  const skew = .11 * Math.cos(angle) - .034 * lift;

  ctx.save();
  ctx.filter = 'blur(' + (3 + lift * 4) + 'px)';
  ctx.globalAlpha = .38 * lift;
  ctx.translate(x, y + 3);
  ctx.transform(1, 0, -.54, -.20, 0, 0);
  ctx.drawImage(page.shadows[i], -width / 2, -height, width, height);
  ctx.restore();
  ellipse(x, y + 1, width * .229, 3 + 2 * lift, '#34201858');

  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, skew, Math.max(.12, projection), 0, 0);
  ctx.globalAlpha = .30 + .70 * clamp(lift * 2.0);
  if (i === 5) ctx.filter = portrait ? 'blur(.7px)' : 'blur(.4px)';
  if (lift > .08) {
    ctx.drawImage(page.shadows[i], -width / 2 + 2.4, -height + 1.3, width, height);
  }
  ctx.drawImage(img, -width / 2, -height, width, height);
  ctx.restore();
  return clamp(2.3 * (pose - .24));
}

function preparePage(page) {
  page.shadows = page.art.map((img) => {
    const tile = document.createElement('canvas');
    tile.width = img.width;
    tile.height = img.height;
    const g = tile.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#392725';
    g.fillRect(0, 0, tile.width, tile.height);
    return tile;
  });
  return page;
}

function paperLife(page, t) {
  const snow = page.id === 'mountain' || page.id === 'lake';
  const moth = page.id === 'village';
  const char = page.id === 'town' || page.id === 'estate';
  const color = snow ? '#efe7c9' : moth ? '#f3d48b' : char ? '#f2b16e' : '#ad5a43';
  ctx.save();
  for (let k = 0; k < 17; k++) {
    const seed = ((k + 1) * .6180339887) % 1;
    const phase = (seed + t * (.029 + (k % 3) * .009)) % 1;
    const x = W * (.07 + .87 * phase) + 21 * Math.sin(t + k);
    const y = H * ((portrait ? .31 : .28) + .42 * ((k * .3034) % 1)) + (snow ? 31 : -24) * phase;
    ctx.globalAlpha = .40 * Math.sin(Math.PI * phase) * (.65 + .35 * Math.sin(k + t));
    ctx.translate(x, y);
    ctx.rotate((t + k) * (snow ? .16 : .39));
    const s = 1.4 + (k % 3) * 1.2;
    polygon([[-s, 0], [0, -s * .54], [s, 0], [0, s]], color);
    ctx.rotate(-(t + k) * (snow ? .16 : .39));
    ctx.translate(-x, -y);
  }
  ctx.restore();
}

function renderPage(page, index, t) {
  ctx.drawImage(page.background, 0, 0, W, H);
  const drift = 1 + .013 * ease(t / 6);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(drift, drift);
  ctx.translate(-W / 2, -H / 2);
  ctx.drawImage(page.paper, 0, 0, W, H);
  const landmark = card(page, 4, t);
  const bossVisibility = pieces.slice(0, 3).map((_, i) => card(page, i, t));
  const boss = card(page, 3, t);
  card(page, 5, t);
  if (portrait) {
    card(page, 5, t, { scale: 1.15, dx: -535, dy: 111, delay: .76 });
  } else {
    card(page, 5, t, { scale: .66, dx: 686, dy: -112, delay: .74 });
  }
  paperLife(page, t);
  ctx.restore();

  titleText(page, index);
  ctx.save();
  ctx.globalAlpha = landmark;
  const [landX, landY] = pieces[4];
  plaque(page.landmark, landX - (portrait ? 70 : 24), landY + (portrait ? 13 : 20),
    { size: portrait ? 17 : 18 });
  ctx.restore();

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.globalAlpha = bossVisibility[i];
    const [x, y] = pieces[i];
    plaque(page.bosses[i], x, y + 23, { size: portrait ? 21 : 24 });
    if (!portrait) {
      if (page.tags[i] === '支线' || page.tags[i] === '隐藏首领' || i === 2) {
        text(page.tags[i], x, y + 57, { size: 15, weight: 650, color: '#30231a', align: 'center', family: sans });
      }
    }
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = boss;
  const [bossX, bossY] = pieces[3];
  plaque(page.bosses[3], bossX, bossY + 35, { size: portrait ? 32 : 38, main: true, accent: page.seal });
  plaque(page.tags[3], bossX, bossY + 79, { size: portrait ? 17 : 19 });
  ctx.restore();

  const pageNum = String(index + 1).padStart(2, '0');
  text(pageNum, portrait ? 704 : 1487, portrait ? 1356 : 782,
    { size: 25, weight: 800, color: '#ebc990', align: 'right' });
}

function drawCover(cover, out = false) {
  backdrop(cover);
  const { x, y, w, h } = covers;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-.028);
  ctx.translate(-W / 2, -H / 2);
  ctx.shadowColor = '#080605';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 16;
  ctx.shadowOffsetY = 29;
  polygon([[x - 9, y + 10], [x + w + 6, y + 9], [x + w + 14, y + h + 29], [x - 7, y + h + 30]], '#231c1d');
  ctx.shadowColor = 'transparent';
  for (let i = 18; i > 0; i -= 2) {
    polygon([[x, y + i], [x + w + 2, y + i], [x + w + 6, y + h + i], [x, y + h + i]],
      i % 4 === 0 ? '#9e8662' : '#ccb48c');
  }
  ctx.save();
  polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
  ctx.clip();
  ctx.drawImage(cover, x, y, w, h);
  const shade = ctx.createLinearGradient(0, y, 0, y + h);
  shade.addColorStop(0, '#120a0977');
  shade.addColorStop(.33, '#23151c00');
  shade.addColorStop(.60, '#21151300');
  shade.addColorStop(1, '#100d0be0');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = '#b98c5266';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 20, y + 23, w - 40, h - 47);
  ctx.fillStyle = '#1f1b1b91';
  ctx.fillRect(x + 4, y, 9, h);
  const end = y + h * .73;
  spaced(out ? 'THE ATLAS CLOSES' : 'TALES FROM THE WULIN', W / 2, end - 3, portrait ? 17 : 12,
    3.8, '#dcaf74', true);
  text(out ? '合卷' : '影之刃零', W / 2, end + 54, { size: portrait ? 78 : 63, color: '#f5dfae', weight: 850, align: 'center' });
  text(out ? '九地尽览 · 纸上影境' : '纸 上 影 境', W / 2, end + 118, { size: 23, color: '#e5c18e', align: 'center' });
  text(out ? '同人纸艺短片' : '同人纸艺短片 · 含主线与结局剧透',
    W / 2, end + 151, { size: 16, color: '#e1c29e', align: 'center', family: sans });
  ctx.restore();
}

function turn(old, progress, cover = false) {
  const p = ease(progress);
  if (p <= 0 || p >= 1) return;
  const spine = cover ? covers.x + covers.w / 2 : W / 2;
  const top = cover ? covers.y : sheet.top + sheet.bend * .50;
  const bottom = cover ? covers.y + covers.h : sheet.bottom + sheet.bend * .48;
  const radius = cover ? covers.w * .59 : sheet.right - spine - 6;
  const theta = Math.PI * p;
  const elevation = Math.sin(theta);
  const shadeX = spine - radius * .7 * Math.sin(theta - .62);
  ctx.save();
  ctx.filter = 'blur(32px)';
  ellipse(shadeX, bottom - 80, radius * (.91 + .16 * elevation), 76, '#1f120f70');
  ctx.restore();

  const state = (u) => {
    const bend = theta - .70 * elevation * u;
    return {
      x: spine + radius * u * Math.cos(bend),
      y: top - (portrait ? 204 : 142) * Math.sin(bend) * u,
      bottom: bottom - (portrait ? 143 : 105) * Math.sin(bend) * u,
    };
  };
  const slices = 48;
  for (let i = 0; i < slices; i++) {
    const u = i / slices;
    const a = state(u);
    const b = state((i + 1) / slices);
    const dx = b.x - a.x;
    if (Math.abs(dx) < .37) continue;
    const front = Math.cos(theta - .69 * elevation * u) > 0;
    ctx.save();
    polygon([[a.x, a.y], [b.x, b.y], [b.x, b.bottom + 1], [a.x, a.bottom + 1]]);
    ctx.clip();
    if (front) {
      ctx.transform(dx + .4, b.y - a.y, 0, a.bottom - a.y, a.x, a.y);
      const srcX = (spine + radius * u) * scale;
      const srcW = radius * scale / slices + .6;
      const sw = Math.min(old.width - srcX, srcW);
      ctx.drawImage(old, srcX, top * scale, sw, (bottom - top) * scale, 0, 0, 1.05, 1.01);
      ctx.fillStyle = 'rgba(42,25,18,' + (.10 + .27 * elevation * (1 - u)) + ')';
      ctx.fillRect(0, 0, 2, 2);
    } else {
      const lit = clamp(.48 + .29 * Math.cos((u - .42) * 5) + .16 * (1 - elevation));
      ctx.fillStyle = `rgb(${165 + 71 * lit} ${130 + 78 * lit} ${94 + 74 * lit})`;
      ctx.fillRect(Math.min(a.x, b.x) - 1, Math.min(a.y, b.y) - 1, Math.abs(dx) + 2,
        Math.max(a.bottom, b.bottom) - Math.min(a.y, b.y) + 2);
    }
    ctx.restore();
  }
  const edge = state(1);
  stroke([[edge.x, edge.y], [edge.x, edge.bottom]], '#f0d7adce', 1.3);
}

const cover = await imageFile('cover');
const single = query.get('single');
const all = await Promise.all(pages.map((page) => loadPage(page, Boolean(single))));
function cacheLayer(draw) {
  const layer = document.createElement('canvas');
  layer.width = canvas.width;
  layer.height = canvas.height;
  const original = ctx;
  ctx = layer.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  try {
    draw();
  } finally {
    ctx = original;
  }
  return layer;
}

ctx.setTransform(scale, 0, 0, scale, 0, 0);
const scenePages = all.map((page) => {
  if (!page) return null;
  preparePage(page);
  page.background = cacheLayer(() => backdrop(page.ground));
  page.paper = cacheLayer(() => spread(page));
  return page;
});
const frontCover = cacheLayer(() => drawCover(cover));
const backCover = cacheLayer(() => drawCover(cover, true));

const old = document.createElement('canvas');
old.width = canvas.width;
old.height = canvas.height;
const oldCtx = old.getContext('2d');
let cached = -9;
function cachePrior(index) {
  if (cached === index) return;
  if (index === -1) ctx.drawImage(frontCover, 0, 0, W, H);
  else renderPage(scenePages[index], index, pageLength - 1 / 30);
  oldCtx.drawImage(canvas, 0, 0);
  cached = index;
}

function frame(seconds) {
  const time = Math.max(0, Math.min(seconds, duration - 1 / 30));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (single) {
    const i = pages.findIndex((p) => p.id === single);
    renderPage(scenePages[i], i, time);
    return;
  }
  if (time < opening) {
    ctx.drawImage(frontCover, 0, 0, W, H);
  } else if (time < opening + pageLength * pages.length) {
    const index = Math.floor((time - opening) / pageLength);
    const t = time - opening - index * pageLength;
    const flip = .84;
    if (t < flip) cachePrior(index - 1);
    renderPage(scenePages[index], index, Math.max(0, t - .07));
    if (t < flip) turn(old, t / flip, index === 0);
  } else {
    const t = time - (duration - closing);
    if (t < .94) cachePrior(pages.length - 1);
    ctx.drawImage(backCover, 0, 0, W, H);
    if (t < .94) turn(old, t / .94);
  }
}

window.__film = { frame, duration, canvas };
frame(0);

if (query.get('capture') !== '1') {
  const started = performance.now();
  function animate(now) {
    const end = single ? pageLength : duration;
    frame(((now - started) / 1000) % end);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
