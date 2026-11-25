// 片尾 · the ending (v4). After 左殇's 斩 the film lands on the last paper colour. The nine bosses stand up in a row like
// an accordion book for a curtain call (左殇 in the middle, 魂 in front of him), bow in a wave and fold away; the title
// card of the opening rises again — 「影之刃零」 and the red 「剪纸版」 seals — and under it the credit 「制作人：Shiki」 is
// brushed in. The page darkens to the end. ~12.5 s.
// (The credit is set in the brush face for now; it moves to the game's UI type once that font is exported.)
import { setupChapter, drift, GROUNDS, SLIDE, createActor, makeHero, THREE } from '../../common/kit.js';
import { titleCard, LOGO } from '../../common/titlecard.js';

const BC = '/work/boss-chibi/透明PNG/';
const CAST = [['01 悲泣溪谷/04 追命·六绝凶镰.png', 6.2], ['02 血色森林/05 白赤练·双蛇夫人.png', 5.6], ['03 陆家村/05 沐小葵·组织少主.png', 5.2], ['04 庞镇/05 舞狮尊主·最后一舞.png', 5.8],
  ['09 断魂山/05 左殇·组织冥主（终章）.png', 7.0],
  ['05 正道大营/04 剑偶·玉璧.png', 5.6], ['06 梅谷湖/03 风雪刀客.png', 5.8], ['07 枷笼山/05 荒行子·昆仑叛教者.png', 5.8], ['08 戏梦山庄/04 雷当·独臂虎.png', 6.0]];
const K = await setupChapter({
  id: '10-ending', ground: GROUNDS.end, duration: 12.5, stock: '#f1ece2',
  bounds: { x0: -46, x1: 46, z0: -52, z1: 34 },
  light: { key: '#fff1dd', keyIntensity: 2.6, keyDir: [-0.6, 0.95, 0.5], fill: '#e0dcd2', fillIntensity: 0.9, sky: '#f0ece4', ground: '#a09a8c', skyIntensity: 0.5, leak: '#3a3430' },
  lens: { haze: '#d6d0c4', hazeStart: 40, hazeEnd: 130, hazeAmount: 0.3, saturation: 0.95, exposure: 0.9, vignette: 0.14 },
  stickers: { __logo: LOGO, ...Object.fromEntries(CAST.map(([f], i) => ['b' + i, BC + f])) },
});
const { H, film, IMG } = K;
H.printGround(({ washes }) => washes(['#cfc8b8', '#d9d2c2', '#e2dccd', '#d9d2c2']));
H.setHero(H.popup(null, null, { node: new THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-18, 18, 0.5, 10, 8, 34], n: 30, colors: ['#b3231a', '#e8c060', '#8e1a14'], size: 0.2, wind: [0.6, -0.15, 0.2], seed: 9 });

// the curtain call: the nine stand up from the middle outward, bow in a wave, fold away from the ends inward
const Z = 14, N = CAST.length, mid = (N - 1) / 2;
const cast = CAST.map(([, h], i) => {
  const x = (i - mid) * 3.9, a = createActor(film, { name: 'b' + i, poses: { p: IMG['b' + i] }, height: h, x, z: Z - Math.abs(i - mid) * 0.5 });
  const d = Math.abs(i - mid) * 0.14;
  a.key(0, { hidden: true }).key(0.7 + d, { hidden: false, rise: 1 }).key(2.7 + i * 0.09, { lean: 0 }).key(2.95 + i * 0.09, { lean: -0.2 }).key(3.4 + i * 0.09, { lean: 0 }).key(4.9 - d * 0.6, { rise: 0 }).key(5.6, { hidden: true });
  film.sound(0.7 + d, 'rise', { size: 0.6 });
  return a;
});
const hero = makeHero(film, IMG);
hero.key(0, { hidden: true, x: 0, z: Z + 3.4, pose: 'idle', face: 1 }).key(1.4, { hidden: false, rise: 0 }).key(1.45, { rise: 1 }).key(2.95 + mid * 0.09, { lean: -0.2 }).key(3.4 + mid * 0.09, { lean: 0 }).key(4.8, { rise: 0 }).key(5.5, { hidden: true });

// the title again, and the credit brushed in under it
const TC = titleCard(K, { x: 0, z: 19, logoH: 6.6 });
TC.rise(5.4);
const credit = document.createElement('canvas'); credit.width = 900; credit.height = 160;
{ const g = credit.getContext('2d'); g.font = '104px "PBZSub", "MaShanZheng", serif'; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('制作人：Shiki', 450, 86); }
film.art({ t0: 8.2, dur: 4.6, img: credit, at: [0.5, 0.855], h: 84, reveal: 0.8 });
film.fade({ t0: 10.7, dur: 1.6, color: '#0e0c0b' });

film.camera([
  { t: 0, target: [0, 1.5, 26], dist: SLIDE.dist, pitch: SLIDE.pitch, yaw: 0, focus: [0, 1.5, 26] },
  { t: 1.3, target: [0, 3.6, Z + 1], dist: 50, pitch: 10, yaw: 0, ease: 'smooth', focus: [0, 3.4, Z + 1] },
  { t: 4.6, target: [0, 3.6, Z + 1], dist: 47, pitch: 10, yaw: 0, ease: 'linear', focus: [0, 3.4, Z + 1] },
  { t: 5.6, target: [0, 2.4, 20.5], dist: 32, pitch: 8, yaw: 0, ease: 'smooth', focus: [0, 3, 20] },
  { t: 12.5, target: [0, 2.3, 20.5], dist: 29, pitch: 8, yaw: 0, ease: 'linear', focus: [0, 3, 20] },
]);
film.start();
