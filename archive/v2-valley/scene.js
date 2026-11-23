import * as THREE from 'three';
import { createHarness } from '../../.agents/skills/papercraft/assets/templates/popup-3d/harness.js';
import { paperMaterial } from 'papercraft/lib/paperkit-3d.js';

const duration = 14.5;
const query = new URLSearchParams(location.search);
const captures = query.has('capture');
const base = './art/';
const clamp = (t) => THREE.MathUtils.clamp(t, 0, 1);
const smooth = (t) => { const p = clamp(t); return p * p * (3 - 2 * p); };
const rng = (() => { let n = 6271; return () => ((n = (Math.imul(1664525,n)+1013904223) >>> 0) / 2 ** 32); })();

const world = { x0:-36, x1:36, z0:-58, z1:57 };
const H = createHarness({
  bounds: world, ground:'#738888', stock:'#eef1ed',
  view:{ pitch:48, yaw:-8, dist:43, fov:28, target:[-1,1,-26], closer:1.42 },
  focus:[-1,1,-26], subject:[-1,1,-26],
  light:{ key:'#ffe4c7', keyIntensity:2.5, fill:'#cbdedb', fillIntensity:.92,
          keyDir:[-.83,.97,.54], sky:'#deedea', ground:'#769387', skyIntensity:.53,
          leak:'#53756f', maxPenumbra:1.25, mapSize:2048, shadowExtent:31 },
  lens:{ focusBand:.38, ramp:.42, maxBlur:13, taps:24, haze:'#b1c2b9', hazeStart:20,
         hazeEnd:64, hazeAmount:.46, exposure:.91, contrast:1.12, shadowTint:'#2d534e',
         aoTint:'#314b43', ao:.72, shadowLift:.034, greenDesat:.08, chroma:.22,
         edgeLine:.12, vignette:.12, vignetteColor:'#273a36', tint:[1.0,1.015,1.02] },
});
const portrait = H.frame.aspect < 1;
const [cut, ground] = await Promise.all([
  fetch(base+'contours.json').then(r => r.json()),
  new Promise((resolve,reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base+'ground.webp';
  }),
]);
const loader = new THREE.TextureLoader();
const meshes = new Map();
await Promise.all(Object.entries(cut).map(async ([name, cfg]) => {
  const tex = await loader.loadAsync(base+name+'.webp');
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8,H.renderer.capabilities.getMaxAnisotropy());
  const material = paperMaterial({ map:tex });
  material.alphaTest = .46;
  const back = paperMaterial({ map:tex, color:'#e3d8c3', side:THREE.BackSide });
  back.alphaTest = .46;
  const shadow = new THREE.MeshDepthMaterial({ map:tex, alphaTest:.46, depthPacking:THREE.RGBADepthPacking, side:THREE.DoubleSide });
  const faceGeo = new THREE.PlaneGeometry(cfg.ratio,1);
  faceGeo.translate(0,.5,0);

  const xyz = [];
  for (const ring of cfg.rings) {
    for (let i=0;i<ring.length;i++) {
      const [ax,ay] = ring[i];
      const [bx,by] = ring[(i+1) % ring.length];
      const a = [ax*cfg.ratio,ay,.009], b = [bx*cfg.ratio,by,.009];
      const c = [bx*cfg.ratio,by,-.009], d = [ax*cfg.ratio,ay,-.009];
      xyz.push(...a,...b,...c,...a,...c,...d);
    }
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  edgeGeo.computeVertexNormals();
  const edge = paperMaterial({ color:name==='waterfall' ? '#899d97' : '#625645', side:THREE.DoubleSide });
  meshes.set(name,{ faceGeo, edgeGeo, material, back, shadow, edge });
}));
function blankReverse(source) {
  const paper = document.createElement('canvas');
  paper.width = source.width;
  paper.height = source.height;
  const ctx = paper.getContext('2d');
  ctx.fillStyle = '#8b826f';
  ctx.fillRect(0,0,paper.width,paper.height);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source,0,0);
  const tex = new THREE.CanvasTexture(paper);
  tex.colorSpace = THREE.SRGBColorSpace;
  const stock = paperMaterial({map:tex, side:THREE.BackSide});
  stock.alphaTest = .46;
  return stock;
}
function print(name,faceDown) {
  const q = meshes.get(name);
  const model = new THREE.Group();
  const front = new THREE.Mesh(q.faceGeo,q.material);
  front.position.z = .01;
  front.castShadow = front.receiveShadow = true;
  front.customDepthMaterial = q.shadow;
  const back = new THREE.Mesh(q.faceGeo,faceDown ? blankReverse(q.material.map.image) : q.back);
  back.position.z = -.01;
  back.receiveShadow = true;
  const edge = new THREE.Mesh(q.edgeGeo,q.edge);
  edge.receiveShadow = true;
  model.add(front,back,edge);
  return model;
}

H.printGround(({g,X,Z,W,H:sheetHeight}) => {
  g.fillStyle = '#576c6a';
  g.fillRect(0,0,W,sheetHeight);
  const a = {x:X(world.x0), y:Z(world.z0), w:X(world.x1)-X(world.x0), h:Z(world.z1)-Z(world.z0)};
  g.drawImage(ground,a.x,a.y,a.w,a.h);
},{ppu:24});

const faceDownFolds = [];
function stand(id,x,z,h,at,yaw=0,opts={}) {
  const card = H.popup(null,null,{
    x,z,height:h,scale:h,yaw,node:print(id,opts.faceDown),order:Math.max(0,(at-.1)/.09),
    sway:opts.sway ?? .35, self:opts.self ?? false, level:true, sight:false,
  });
  if (opts.faceDown) faceDownFolds.push(card);
  return card;
}

const traveler = stand('traveler',-1,-27,2.5,.45,0,{self:true});
H.setHero(traveler);
const bossA = stand('broken-steel',-2.4,-19,6.4,1.45,.13,{faceDown:true});
const bossB = stand('axe-master',1.2,-1.7,7.0,4.9,-.09,{faceDown:true});
const bossC = stand('scythe-pursuer',-1.7,16,7.8,9.45,.12,{faceDown:true});

stand('waterfall',6.5,16.1,13.8,8.0,.10,{sway:.22,faceDown:true});
stand('waterfall',10.3,20.3,9.7,7.93,-.27,{sway:.18,faceDown:true});
stand('iron-tower',-6.0,8.1,13.5,7.45,.22,{sway:.12,faceDown:true});
stand('cliff',-9.6,3.7,9.0,6.2,.43,{sway:.1});
stand('cliff',12.2,13.4,11.0,7.5,-.31,{sway:.12});
stand('pine',-5.6,5.3,6.3,6.35,-.32,{sway:.9});

// A few meaningful groups in the center band. Foreground props outline the road without covering the Q figures.
const dress = [
  ['gate',-.9,-28.5,5.5,.37,.13], ['bell',4.2,-24,3.7,.50,-.31],
  ['fence',-6.2,-21.1,2.45,.65,-.14], ['shield',4.4,-21.6,3.3,1.34,-.22],
  ['spear',4,-17.5,3.12,1.5,-.17], ['flowers',-4.3,-13,1.44,1.2,.18],
  ['bell',-4.4,-4.5,3.22,3.25,.11], ['spear',-5.0,-.3,3.25,4.32,.18],
  ['shield',4.45,-4.1,3.4,4.44,-.38], ['fence',-3.9,-9.1,2.15,3.32,.20],
  ['fence',4.5,.6,2.28,3.47,-.2], ['gate',-5.9,13.2,3.6,7.3,.25],
  ['bell',2.8,11.0,2.95,7.8,.2], ['flowers',2.3,20.3,1.48,8.1,.25],
  ['flowers',-7.3,18.8,1.45,8.05,-.22], ['reeds',5.1,14.9,1.85,7.9,.29],
];
for (const values of dress) stand(...values);
for (let row=0; row<16; row++) {
  const z = -43+row*4.8;
  for (const side of [-1,1]) {
    const x = side*(10.2+rng()*2.7)+(side===1?2.6:0);
    const delay = z<-16 ? .36+row*.08 : z<3 ? 2.5+row*.09 : 5.9+row*.09;
    const pick = row%4===0 ? 'pine' : row%4===1 ? 'cliff' : row%4===2 ? 'pines' : 'pine';
    stand(pick,x,z,4.8+rng()*4.1,delay,(rng()-.5)*.56,{sway:pick==='cliff'?.10:.72});
    stand('rocks',x-side*(1.9+rng()*2.9),z+1.25,1.05+rng()*2.9,delay+.09,(rng()-.5)*.9);
    stand(row%5===0?'flowers':'reeds',x-side*(2.0+rng()*2.6),z-1.36,1+rng()*.85,delay+.17,(rng()-.5)*.85,{sway:1.20});
    stand(row%2===0?'cliff':'pines',x+side*(5+rng()*5),z+1.0,4.3+rng()*6,delay-.10,(rng()-.5)*.87);
    stand('rocks',x+side*(3+rng()*4),z-1.6,1.4+rng()*1.9,delay+.1,(rng()-.5)*.65);
  }
}
// Printed foam lozenges skim the ground plane near the waterfall.
const foam = [];
const foamMat = new THREE.MeshBasicMaterial({color:'#c6d4c4', transparent:true, opacity:.58, depthWrite:false, side:THREE.DoubleSide});
const shape = new THREE.PlaneGeometry(.60,.045).rotateX(-Math.PI/2);
for (let i=0;i<17;i++) {
  const m = new THREE.Mesh(shape,foamMat);
  const rx = 5.0+rng()*8, rz = 18.7+rng()*11;
  m.position.set(rx,.028,rz);
  m.scale.set(.65+rng()*1.15,1,1);
  m.rotation.y = (rng()-.5)*.28;
  m.visible = false;
  H.scene.add(m);
  foam.push({m,rx,rz,k:rng()});
}
const floaters = [];
const flake = new THREE.CircleGeometry(.10,4);
const flakeMat = new THREE.MeshBasicMaterial({color:'#e5d9a9',side:THREE.DoubleSide});
for (let i=0;i<21;i++) {
  const piece = new THREE.Mesh(flake,flakeMat);
  piece.scale.set(.6+rng()*.9,.46+rng()*.5,1);
  H.scene.add(piece);
  floaters.push({piece,x:-8+rng()*20,z:-35+rng()*63,phase:rng()*6.28,y:.18+rng()*.88});
}

// Single authored camera path. Coordinates advance monotonically down the map.
const travel = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-.8,1.2,-26.1), new THREE.Vector3(-1.3,1.6,-20.7),
  new THREE.Vector3(-.15,1.64,-10.5), new THREE.Vector3(.55,1.93,-2.4),
  new THREE.Vector3(-.8,4.0,6.1), new THREE.Vector3(1.03,3.4,14.2),
  new THREE.Vector3(1.25,3.4,18.5),
],false,'catmullrom',.39);
const milestones = [0,2.95,5.15,7.25,9.2,11.8,duration];
function parameter(t) {
  const i = milestones.findIndex(v=>t<v);
  if (i<=0) return t<=0?0:1;
  return ((i-1)+(t-milestones[i-1])/(milestones[i]-milestones[i-1]))/(milestones.length-1);
}
let time=0;
const current = new THREE.Vector3();
H.onStep((t) => {
  time=t;
  // Reverse the opening arc for hero cutouts. The unprinted side is visible when closed.
  for (const card of faceDownFolds) card.pivot.rotation.x += (Math.PI-.021)*(1-card.p);
  travel.getPoint(parameter(t),current);
  const distant = smooth((t-7.35)/2.9);
  const near = 1-smooth((t-10.7)/2.4);
  const reveal = near*distant;
  const cameraX=current.x + (portrait ? -3.05 : .45)*reveal;
  const cameraZ=current.z+(portrait?1.85-1.9*reveal:0);
  const cameraY=current.y-(portrait?.42:0);
  const distance= (portrait?38.7:41.0)+reveal*(portrait?4.8:5.6);
  const frameAPI = window.__papercraft;
  if (frameAPI) frameAPI.look(cameraX,cameraZ,distance,cameraY);
  const heroZ=current.z-(portrait?3.8:5.4);
  const heroX=.42+Math.sin(heroZ*.2)*1.25;
  traveler.group.position.set(heroX,.055,heroZ);
  traveler.pivot.rotation.y=-.36+Math.sin(t*2.7)*.09;
  traveler.pivot.rotation.x=Math.sin(t*7.8)*.052;
  for (const {m,rx,rz,k} of foam) {
    m.visible=t>7.5;
    m.position.set(rx+(t*k*.43)%1.05,.028,rz+(t*(.82+k*.6))%2.2);
  }
  for (const {piece,x,z,phase,y} of floaters) {
    piece.visible=t>.9;
    piece.position.set(x+Math.sin(t*.73+phase)*.39,y+Math.cos(t+phase)*.15,z+t*.40);
    piece.rotation.set(-1.0+Math.sin(t+phase)*.36,phase,t*.43+phase);
  }
});
H.start();

const output = document.createElement('canvas');
const titles = document.createElement('canvas');
titles.id='captions';
if (!captures) document.body.appendChild(titles);
const captions = [
  [0,2.5,'悲泣溪谷','逆流而上'], [2.1,4.6,'残钢','痴狂暴徒'],
  [5.45,7.9,'彭猛','斧老大'], [8.38,10.2,'钢铁巨塔','大瀑布'],
  [10.6,14.48,'追命','六绝凶镰'],
];
function drawTitles(canvas,t) {
  const {width:w,height:h}=canvas;
  const ctx=canvas.getContext('2d');
  const scale=Math.min(w,h)/720;
  for (const [start,end,word,sub] of captions) {
    if (t<start||t>end) continue;
    const op=(start===0?1:smooth((t-start)/.28))*smooth((end-t)/.42);
    const intro=start===0;
    const x=(portrait?.13:.071)*w;
    const y=(portrait?(intro?.243:.613):(intro?.215:.844))*h;
    ctx.save();
    ctx.globalAlpha=op;
    ctx.fillStyle='#fff0ce';
    ctx.strokeStyle='#cf714a';
    ctx.lineWidth=2*scale;
    ctx.beginPath();
    ctx.moveTo(x,y-22*scale);
    ctx.lineTo(x+42*scale,y-22*scale);
    ctx.stroke();
    ctx.shadowColor='#142725';
    ctx.shadowBlur=10*scale;
    ctx.shadowOffsetY=3*scale;
    ctx.font=`800 ${(intro?48:34)*scale}px "Noto Serif CJK SC", serif`;
    ctx.fillText(word,x,y+26*scale);
    ctx.font=`600 ${(intro?17:15)*scale}px "Noto Sans CJK SC", sans-serif`;
    ctx.fillStyle='#f0d7a7';
    ctx.fillText(sub,x+1*scale,y+53*scale);
    ctx.restore();
  }
}
function capture() {
  if (H.renderer.getContext().isContextLost()) throw new Error('WebGL context lost during capture');
  const webgl=H.renderer.domElement;
  if (output.width!==webgl.width||output.height!==webgl.height) {
    output.width=webgl.width;
    output.height=webgl.height;
  }
  output.getContext('2d').drawImage(webgl,0,0);
  drawTitles(output,time);
  return output;
}
function go(t) {
  const pp=window.__papercraft;
  if (t<time-1e-5) {
    pp.restart();
    time=0;
  }
  pp.step(t-time,120);
}
window.__valley={duration,H,go,capture,metrics:()=>{
  const bounds={};
  for (const [name,boss] of [['steel',bossA],['axe',bossB],['pursuer',bossC]]) {
    const p=boss.group.position;
    const low=new THREE.Vector3(p.x,p.y,p.z).project(H.camera);
    const high=new THREE.Vector3(p.x,p.y+boss.pivot.children[0].scale.y,p.z).project(H.camera);
    bounds[name]={x:+high.x.toFixed(3),y:+high.y.toFixed(3),height:+((high.y-low.y)/2).toFixed(3),rise:+boss.p.toFixed(3)};
  }
  return {t:time,bounds,cards:window.__papercraft.cards()};
}};

if (captures) {
  document.fonts.ready.then(()=>{
    window.__papercraft.restart();
    window.__papercraft.step(0);
    window.__valley.ready=true;
  });
} else {
  function play() {
    const {width,height}=H.renderer.domElement;
    if (titles.width!==width||titles.height!==height) {
      titles.width=width;
      titles.height=height;
    }
    titles.getContext('2d').clearRect(0,0,width,height);
    drawTitles(titles,time);
    if (time>duration) window.__papercraft.restart();
    requestAnimationFrame(play);
  }
  requestAnimationFrame(play);
}
