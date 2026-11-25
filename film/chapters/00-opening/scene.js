// 片头 · the opening (v4). On the valley's own paper, a few lily petals drift; the game's logo 「影之刃零」 rises off the
// page as a die-cut card, then 「剪纸版」 pops up under it, three red paper-cut seals one after another, with a small gold
// star. A held breath. Then both fold flat and leave the page, and the camera climbs to the slide pose of chapter one,
// whose first frame is this blank paper (the join is a 0.6 s dissolve in assemble.py). ~7.6 s.
import { setupChapter, drift, GROUNDS, SLIDE } from '../../common/kit.js';
import { titleCard, LOGO } from '../../common/titlecard.js';

const K = await setupChapter({
  id: '00-opening', ground: GROUNDS['01-valley'], duration: 7.6,
  bounds: { x0: -46, x1: 46, z0: -52, z1: 34 },
  light: { key: '#fff1dd', keyIntensity: 2.8, keyDir: [-0.75, 0.95, 0.45], fill: '#d6e0da', fillIntensity: 0.9, sky: '#e8efe8', ground: '#7d8a72', skyIntensity: 0.5, leak: '#2f4a46' },
  lens: { haze: '#c3c9b6', hazeStart: 40, hazeEnd: 130, hazeAmount: 0.32, saturation: 0.94, tint: [0.99, 1.0, 1.0], exposure: 0.9, vignette: 0.12 },
  stickers: { __logo: LOGO },
});
const { H, film } = K;
H.printGround(({ washes }) => washes(['#9c9f87', '#a9a895', '#b6b39d', '#a9a895']));
H.setHero(H.popup(null, null, { node: new H.THREE.Group(), x: 0, z: 30 }));
drift(film, { box: [-14, 14, 0.5, 9, 10, 34], n: 26, colors: ['#b3231a', '#d24a34', '#8e1a14'], size: 0.22, wind: [0.7, -0.15, 0.2], seed: 3 });

const TC = titleCard(K, { x: 0, z: 20, logoH: 6.6 });
TC.rise(0.6);          // the logo rises; 剪纸版 pops up at 2.2, the gold star at 2.85
TC.fold(5.5);          // a held breath, then both fold flat

// the camera: a low frontal view of the title, a slow push, then up to chapter one's slide pose over the blank paper
const L = SLIDE, land = [0, 21];
film.camera([
  { t: 0, target: [0, 3.0, 21.5], dist: 31, pitch: 8, yaw: 0, focus: [0, 3, 21] },
  { t: 5.4, target: [0, 3.0, 21.5], dist: 27.5, pitch: 9, yaw: 0, ease: 'linear', focus: [0, 3, 21] },
  { t: 7.4, target: [land[0], 1.5, land[1] + 5], dist: L.dist, pitch: L.pitch, yaw: 0, ease: 'smooth', focus: [land[0], 1.5, land[1] + 5] },
]);
film.start();
