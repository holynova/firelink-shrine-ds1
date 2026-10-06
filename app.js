import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============ 基础场景 ============ */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141821);
scene.fog = new THREE.Fog(0x141821, 40, 90);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 300);
camera.position.set(13, 8, 15);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 1.5;
controls.maxDistance = 45;
controls.autoRotateSpeed = 1.2;

const hemi = new THREE.HemisphereLight(0x5a6a8a, 0x3a3226, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xcfd8ff, 0.75);
sun.position.set(-12, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0006;
scene.add(sun);

/* ============ 程序化纹理 ============ */
function canvasTex(size, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
let _s = 29;
function rnd() { _s = (_s * 16807) % 2147483647; return (_s - 1) / 2147483646; }

const stoneTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#6f7379'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = rnd() > .5 ? 'rgba(40,42,48,.3)' : 'rgba(200,205,215,.18)';
    g.fillRect(rnd() * s, rnd() * s, 3, 3);
  }
  g.strokeStyle = 'rgba(30,32,38,.65)'; g.lineWidth = 4;
  for (let y = 0; y <= s; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
  for (let y = 0; y < s; y += 64) for (let x = (y / 64 % 2) * 64; x <= s; x += 128) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke();
  }
}, 2, 2);
const ashTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#3b3835'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 3200; i++) {
    g.fillStyle = rnd() > .5 ? 'rgba(20,18,16,.5)' : 'rgba(120,112,100,.28)';
    g.fillRect(rnd() * s, rnd() * s, 2, 2 + rnd() * 2);
  }
}, 16, 16);
const darkWoodTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#5e4128'; g.fillRect(0, 0, s, s);
  for (let x = 0; x < s; x += 32) {
    g.fillStyle = `rgba(${60 + rnd() * 25 | 0},${38 + rnd() * 16 | 0},18,.4)`;
    g.fillRect(x, 0, 30, s);
    g.strokeStyle = 'rgba(25,15,6,.55)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, s); g.stroke();
  }
}, 2, 2);
function signTex(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#6e4f2e'; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = 'rgba(40,25,10,.5)'; g.lineWidth = 3;
  for (let y = 32; y < 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.fillStyle = '#2e1d0e'; g.font = 'bold 54px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============ 材质与建模助手 ============ */
function M(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.95, metalness: o.metal ?? 0,
    map: o.map || null, transparent: !!o.transparent, opacity: o.opacity ?? 1,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1,
    side: o.side || THREE.FrontSide
  });
}
const extMats = [];   // 石墙材质（透视模式下变透明）
function extM(color, o = {}) { const m = M(color, o); extMats.push(m); return m; }

function box(w, h, d, material, x, y, z, parent, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true;
  (parent || scene).add(m);
  tagPart(m, parent);
  return m;
}
function cyl(rt, rb, h, material, x, y, z, parent, seg = 14) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  (parent || scene).add(m);
  tagPart(m, parent);
  return m;
}
function sph(r, material, x, y, z, parent, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), material);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  m.castShadow = m.receiveShadow = true;
  (parent || scene).add(m);
  tagPart(m, parent);
  return m;
}
function cone(r, h, material, x, y, z, parent, seg = 14) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  (parent || scene).add(m);
  tagPart(m, parent);
  return m;
}
function tagPart(mesh, parent) {
  let n = parent;
  while (n) {
    if (n.userData && n.userData.isPart) { mesh.userData.partId = n.userData.partId; break; }
    n = n.parent;
  }
}
function wallSeg(x1, z1, x2, z2, y0, h, t, material, parent) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  return (Math.abs(x2 - x1) > Math.abs(z2 - z1))
    ? box(len, h, t, material, cx, y0 + h / 2, cz, parent)
    : box(t, h, len, material, cx, y0 + h / 2, cz, parent);
}
// 两根石柱之间的半圆拱
function arch(x1, z1, x2, z2, y, material, parent) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const t = new THREE.Mesh(new THREE.TorusGeometry(len / 2, 0.28, 10, 22, Math.PI), material);
  t.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  t.rotation.y = Math.atan2(-(z2 - z1), x2 - x1);
  t.castShadow = t.receiveShadow = true;
  parent.add(t); tagPart(t, parent);
  return t;
}

/* ============ 部件注册表 ============ */
const PARTS = {};
const CATS = { out: '外部', main: '遗迹内部', under: '地下层', yard: '室外' };
function defPart(id, meta) { PARTS[id] = Object.assign({ id, group: null }, meta); }
function P(id, parent) {
  const g = new THREE.Group();
  g.userData.isPart = true; g.userData.partId = id;
  PARTS[id].group = g;
  (parent || scene).add(g);
  return g;
}

defPart('ruins',    { name: '遗迹外观', cat: 'out', layer: 'main', go: 'exterior', label: [-5.2, 4.6, -4.2], viewDir: [-.6, .5, -.8], desc: '半坍塌的石砌遗迹，比三代的祭祀场更加残破矮小。断壁残垣之间，是不死人最初的篝火，也是整个传火之旅的起点。' });
defPart('bonfire',  { name: '中央篝火', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [0, 2.4, 0], viewDir: [1, .55, 1], desc: '螺旋剑插在灰烬之中，火焰永不熄灭。坐下来吧，喝口原素瓶——前面的路还长着呢。' });
defPart('columns',  { name: '断裂石柱群', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [5, 5.0, 0], viewDir: [1, .5, .3], desc: '环绕篝火的石柱群，大多已经断裂，少数还撑着残缺的拱门。它们站在这里的时间，比火还要久。' });
defPart('archway',  { name: '残缺拱门', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [-4.3, 5.2, -1.8], viewDir: [-1, .5, -.4], desc: '石柱之间残存的拱门。穿过这样的门，你会去往城外不死镇、地下墓地，或者……更深的地方。' });
defPart('roofslab', { name: '残破石顶', cat: 'out', layer: 'roof', go: 'exterior', label: [-3.5, 5.8, -3], viewDir: [-1, .7, -.6], desc: '遗迹上方残存的石顶，只盖住了大厅的一角，剩下的早塌了。遮不住雨，但遮得住乌鸦。' });
defPart('crownest', { name: '乌鸦巢', cat: 'out', layer: 'roof', go: 'exterior', label: [-4.5, 6.6, -3.5], viewDir: [-.8, .6, -.8], desc: '石顶上的巨型乌鸦巢。蜷缩进去睡一觉，乌鸦就会把你抓回北方不死院——这是真的可以，不是玩笑。' });
defPart('stairs',   { name: '地下石阶', cat: 'under', layer: 'under', go: 'under', under: 1, label: [3, -1.2, 2.5], viewDir: [1, .5, .1], desc: '通往地下的石阶。防火女和升降机都在下面，活尸们一般懒得往下走，你也最好小心点。' });
defPart('firekeeper',{ name: '防火女囚室', cat: 'under', layer: 'under', go: 'under', under: 1, label: [3.3, -1.4, 5.3], viewDir: [.25, .3, 1], desc: '防火女安娜斯塔西娅的囚室。她蜷缩在栅栏后，用微弱的火守护着这里。是她让你每次坐篝火都能升级，别忘了回来看看她。' });
defPart('elevator', { name: '升降机', cat: 'under', layer: 'under', go: 'under', under: 1, label: [5.8, 1.2, 2.7], viewDir: [.35, 1, .3], desc: '通往小隆德遗迹的大升降机。踩下机关，铁链会载着你沉入黑暗——下面可是有四王在等着你。' });
defPart('ladder',   { name: '木梯', cat: 'under', layer: 'under', go: 'under', under: 1, label: [5.8, -0.8, 3.3], viewDir: [.3, 1, .35], desc: '升降机井里的木梯。赶时间可以直接爬下去——当然，也可能直接摔死。' });
defPart('well',     { name: '水井', cat: 'yard', layer: 'garden', go: 'exterior', label: [8.5, 2.2, 5], viewDir: [1, .5, .6], desc: '遗迹外的水井。井水早干了，只剩石头、木架和一只铁桶。不死人也不需要喝水，摆着看就行。' });
defPart('graves',   { name: '墓碑群', cat: 'yard', layer: 'garden', go: 'exterior', label: [-8, 1.6, -3], viewDir: [-1, .5, -.5], desc: '东倒西歪的墓碑群。埋的是谁已经没人记得，反正在这个世界，死了也不一定能安息。' });
defPart('deadtree', { name: '枯树', cat: 'yard', layer: 'garden', go: 'exterior', label: [-6, 3.8, 7], viewDir: [-1, .55, 1], desc: '早就枯死的树，枝桠像爪子一样伸向天空。传火祭祀场周围，全是这种半死不活的东西。' });
defPart('signs',    { name: '岔路木牌', cat: 'yard', layer: 'garden', go: 'exterior', label: [3, 2.0, 9], viewDir: [.3, .5, 1], desc: '指引方向的木牌：南去城外不死镇，西往地下墓地，东下小隆德遗迹。每条路的尽头都是受苦，建议都走一遍。' });

/* 层组（用于分层展开与视角切换） */
const gOut = new THREE.Group(), gMain = new THREE.Group(),
      gUnder = new THREE.Group(), gRoof = new THREE.Group();
scene.add(gOut, gMain, gUnder, gRoof);
const cutWalls = {};   // 遗迹内部视角时隐藏的墙分组
const underCut = {};   // 地下层视角时隐藏的顶/墙

/* ============ 室外 ============ */
const stoneM = extM(0xffffff, { map: stoneTex, rough: 0.95 });
const stoneDark = M(0x4a4d54, { rough: 0.95 });
const woodM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
const ironM = M(0x2c2f36, { metal: 0.65, rough: 0.5 });

(function buildOutdoor() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), M(0xffffff, { map: ashTex, rough: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; ground.receiveShadow = true;
  scene.add(ground);
  // 土路
  const pathM = M(0x2e2b28, { rough: 1 });
  box(2.4, 0.05, 7, pathM, 3, -0.02, 9.5, gOut).castShadow = false;
  box(6, 0.05, 2.2, pathM, -9, -0.02, 4, gOut).castShadow = false;
  box(6, 0.05, 2.2, pathM, 9, -0.02, -1, gOut).castShadow = false;

  // 水井
  const w = P('well', gOut);
  cyl(1.0, 1.12, 0.9, stoneM, 8.5, 0.45, 5, w, 18);
  cyl(0.8, 0.8, 0.12, M(0x0a0a0c, { rough: 1 }), 8.5, 0.82, 5, w, 18).castShadow = false;
  box(0.14, 2.0, 0.14, woodM, 7.55, 1.35, 5, w);
  box(0.14, 2.0, 0.14, woodM, 9.45, 1.35, 5, w);
  const bar = cyl(0.06, 0.06, 2.1, woodM, 8.5, 2.3, 5, w); bar.rotation.z = Math.PI / 2;
  const r1 = box(1.5, 0.08, 1.0, woodM, 8.5, 2.85, 4.72, w); r1.rotation.x = 0.55;
  const r2 = box(1.5, 0.08, 1.0, woodM, 8.5, 2.85, 5.28, w); r2.rotation.x = -0.55;
  cyl(0.02, 0.02, 0.7, ironM, 8.5, 1.95, 5, w);
  cyl(0.17, 0.13, 0.26, woodM, 8.5, 1.5, 5, w);

  // 墓碑群
  const gv = P('graves', gOut);
  const spots = [[-8.2, -3.2, .2], [-7.4, -2.4, -.3], [-8.8, -2.2, .5], [-7.6, -4.1, -.15], [-8.9, -3.9, .35], [-7.9, -2.9, 0]];
  spots.forEach(([x, z, tilt], i) => {
    const st = box(0.55, 0.85, 0.16, stoneDark, x, 0.36, z, gv, tilt);
    st.rotation.z = tilt * 0.5;
    if (i === 2) { // 十字架
      box(0.16, 1.1, 0.16, stoneDark, x + 1.1, 0.5, z, gv);
      box(0.6, 0.16, 0.16, stoneDark, x + 1.1, 0.72, z, gv);
    }
  });

  // 枯树
  const t = P('deadtree', gOut);
  const barkM = M(0x3a2c1e, { rough: 1 });
  cyl(0.2, 0.34, 3.4, barkM, -6, 1.7, 7, t);
  const branches = [
    [-6, 3.3, 7, 0.7, 0.3, 2.0], [-6, 3.0, 7, -0.8, -0.4, 1.7],
    [-6, 3.5, 7, 0.2, 0.9, 1.9], [-6, 2.8, 7, 0.1, -1.0, 1.5],
    [-6, 3.6, 7, -0.5, 0.7, 1.6]
  ];
  branches.forEach(b => {
    const br = cyl(0.035, 0.06, b[5], barkM, b[0], b[1] + b[5] * 0.28, b[2], t, 8);
    br.rotation.x = b[3]; br.rotation.z = b[4];
  });

  // 岔路木牌
  const sg = P('signs', gOut);
  function signpost(x, z, text, ry) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; sg.add(grp);
    cyl(0.06, 0.09, 1.7, woodM, 0, 0.85, 0, grp);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.07),
      M(0xffffff, { map: signTex(text), rough: 0.9 }));
    plank.position.set(0, 1.35, 0); plank.castShadow = plank.receiveShadow = true;
    grp.add(plank); tagPart(plank, grp);
  }
  signpost(3, 9, '城外不死镇 →', 0.15);
  signpost(-9, 5, '→ 地下墓地', -0.4);
  signpost(9, -2, '小隆德遗迹 ↓', 0.5);
})();

/* ============ 遗迹主层 ============ */
let fireLight, flame1, flame2;
(function buildMain() {
  // 地板（避开地下室区域 x[1.5,6.8] z[1.5,5.9]）
  const flM = extM(0xffffff, { map: stoneTex, rough: 0.95 });
  box(14, 0.3, 7.5, flM, 0, -0.15, -2.25, gMain);            // A
  box(8.5, 0.3, 4.5, flM, -2.75, -0.15, 3.75, gMain);        // B
  box(0.2, 0.3, 4.5, flM, 6.9, -0.15, 3.75, gMain);          // C
  box(5.3, 0.3, 0.1, flM, 4.15, -0.15, 5.95, gMain);         // D（北沿条带）

  // 断裂石柱群（环绕篝火，半径5）
  const col = P('columns', gMain);
  const colH = [1.8, 2.6, 1.2, 2.0, 4.2, 4.2, 4.2, 3.4];
  const colPos = [];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const x = Math.cos(a) * 5, z = Math.sin(a) * 5;
    colPos.push([x, z]);
    const h = colH[i];
    box(1.0, 0.4, 1.0, stoneM, x, 0.2, z, col);
    cyl(0.34, 0.4, h, stoneM, x, 0.4 + h / 2, z, col, 12);
    if (h > 3) {
      box(0.95, 0.35, 0.95, stoneM, x, 0.4 + h + 0.17, z, col);  // 柱头
    } else {
      const chip = box(0.6, 0.35, 0.6, stoneM, x + 0.12, 0.4 + h + 0.1, z - 0.08, col);
      chip.rotation.z = 0.28; chip.rotation.y = 0.4;              // 断裂茬口
    }
  }
  // 倒塌的柱段
  const drum1 = cyl(0.34, 0.34, 1.6, stoneM, -2.5, 0.34, 4.2, col, 12);
  drum1.rotation.z = Math.PI / 2; drum1.rotation.y = 0.5;
  const drum2 = cyl(0.34, 0.34, 1.1, stoneM, 3.2, 0.34, -4.4, col, 12);
  drum2.rotation.z = Math.PI / 2; drum2.rotation.y = -0.9;

  // 残缺拱门（在最高的几根柱子之间）
  const ar = P('archway', gMain);
  arch(colPos[4][0], colPos[4][1], colPos[5][0], colPos[5][1], 4.6, stoneM, ar);
  arch(colPos[5][0], colPos[5][1], colPos[6][0], colPos[6][1], 4.6, stoneM, ar);
  arch(colPos[6][0], colPos[6][1], colPos[7][0], colPos[7][1], 3.8, stoneM, ar);

  // 半坍塌石墙（南/东分组，遗迹内部视角隐藏）
  const ru = P('ruins', gMain);
  const wN = new THREE.Group(), wW = new THREE.Group(),
        wS = new THREE.Group(), wE = new THREE.Group();
  ru.add(wN, wW, wS, wE);
  const wm = extM(0xffffff, { map: stoneTex, rough: 0.95 });
  wallSeg(-7, -5.5, -3, -5.5, 0, 3.4, 0.5, wm, wN);
  wallSeg(-3, -5.5, 1, -5.5, 0, 2.2, 0.5, wm, wN);
  wallSeg(1, -5.5, 5, -5.5, 0, 3.0, 0.5, wm, wN);
  wallSeg(5, -5.5, 7, -5.5, 0, 1.6, 0.5, wm, wN);
  wallSeg(-6.5, -5.5, -6.5, -1, 0, 2.8, 0.5, wm, wW);
  wallSeg(-6.5, -1, -6.5, 3, 0, 3.6, 0.5, wm, wW);
  wallSeg(-6.5, 3, -6.5, 5.5, 0, 2.0, 0.5, wm, wW);
  wallSeg(-7, 5.5, -2, 5.5, 0, 1.6, 0.5, wm, wS);
  wallSeg(-2, 5.5, 3, 5.5, 0, 2.2, 0.5, wm, wS);
  wallSeg(3, 5.5, 7, 5.5, 0, 1.4, 0.5, wm, wS);
  wallSeg(6.5, -5.5, 6.5, 0, 0, 2.4, 0.5, wm, wE);
  wallSeg(6.5, 0, 6.5, 5.5, 0, 1.8, 0.5, wm, wE);
  // 墙头残茬
  const stubs = [
    [-5, 3.65, -5.5, 1.6, wN], [3, 3.25, -5.5, 1.2, wN],
    [-6.5, 3.85, 1, 1.4, wW], [0.5, 2.45, 5.5, 1.8, wS], [6.5, 2.65, -2.5, 1.3, wE]
  ];
  stubs.forEach(([x, y, z, w, grp]) => {
    const s = box(w, 0.5, 0.5, wm, x, y, z, grp);
    s.rotation.y = (rnd() - 0.5) * 0.3;
  });
  cutWalls.south = wS; cutWalls.east = wE;

  // 瓦砾
  for (let i = 0; i < 9; i++) {
    const r = box(0.4 + rnd() * 0.5, 0.25 + rnd() * 0.3, 0.4 + rnd() * 0.4, stoneDark,
      -6 + rnd() * 12, 0.15, -5 + rnd() * 10, ru, rnd() * 3);
    r.rotation.z = (rnd() - 0.5) * 0.4;
  }

  // 中央篝火
  const bf = P('bonfire', gMain);
  cyl(0.75, 1.15, 0.5, M(0x555049, { rough: 1 }), 0, 0.25, 0, bf, 16);
  const steelM = M(0x3a3f46, { metal: 0.7, rough: 0.45 });
  const blade = box(0.13, 1.5, 0.035, steelM, 0.12, 1.05, 0, bf); blade.rotation.z = 0.1;
  box(0.46, 0.07, 0.09, steelM, 0.2, 1.78, 0, bf).rotation.z = 0.1;
  cyl(0.035, 0.035, 0.32, steelM, 0.22, 1.95, 0, bf).rotation.z = 0.1;
  sph(0.06, steelM, 0.24, 2.12, 0, bf);
  const broken = box(0.11, 0.7, 0.03, steelM, -0.75, 0.55, 0.5, bf); broken.rotation.z = -0.5; broken.rotation.x = 0.2;
  flame1 = cone(0.34, 0.95, M(0xff7a1e, { emissive: 0xff6a00, ei: 2.2, rough: 0.6 }), 0, 1.05, 0, bf, 12);
  flame2 = cone(0.18, 0.6, M(0xffc46b, { emissive: 0xffb84d, ei: 2.8, rough: 0.6 }), 0, 1.0, 0, bf, 10);
  flame1.castShadow = flame2.castShadow = false;
  for (let i = 0; i < 8; i++) {
    const e = sph(0.045 + rnd() * 0.03, M(0xff8c2e, { emissive: 0xff7a1e, ei: 2 }), (rnd() - .5) * 1.4, 0.5, (rnd() - .5) * 1.4, bf);
    e.castShadow = false;
  }
  fireLight = new THREE.PointLight(0xff8c2e, 42, 22, 2);
  fireLight.position.set(0, 1.7, 0);
  bf.add(fireLight);
})();

/* ============ 地下层 ============ */
(function buildUnder() {
  const um = extM(0xffffff, { map: stoneTex, rough: 0.95 });
  // 地下室地面与墙体（x[1.5,6.8] z[1.5,5.9]，地面 y=-3.2）
  box(5.3, 0.25, 4.4, um, 4.15, -3.325, 3.7, gUnder);
  wallSeg(1.5, 1.5, 1.5, 5.9, -3.2, 3.2, 0.4, um, gUnder);   // 西
  wallSeg(1.5, 5.9, 6.8, 5.9, -3.2, 3.2, 0.4, um, gUnder);   // 北
  wallSeg(1.5, 1.5, 6.8, 1.5, -3.2, 3.2, 0.4, um, gUnder);   // 南
  const uwE = new THREE.Group(); gUnder.add(uwE);
  wallSeg(6.8, 1.5, 6.8, 5.9, -3.2, 3.2, 0.4, um, uwE);      // 东（地下视角隐藏）
  underCut.east = uwE;
  // 顶部露台板（地下视角隐藏）
  const ceil = new THREE.Group(); gUnder.add(ceil);
  box(2.3, 0.3, 2.4, um, 5.65, -0.15, 4.7, ceil);            // T1n
  box(2.3, 0.3, 0.4, um, 5.65, -0.15, 1.7, ceil);            // T1s
  box(0.5, 0.3, 1.6, um, 4.75, -0.15, 2.7, ceil);            // T1w
  box(0.2, 0.3, 1.6, um, 6.7, -0.15, 2.7, ceil);             // T1e
  box(3, 0.3, 2.9, um, 3, -0.15, 4.45, ceil);                // T2
  box(3, 0.3, 0.5, um, 3, -0.15, 1.75, ceil);                // T3
  underCut.ceiling = ceil;

  // 地下石阶（x 1.5→4.5，z[2.0,3.0]，0→-3.2）
  const st = P('stairs', gUnder);
  const N = 14, rise = 3.2 / N, run = 3.0 / N;
  for (let i = 0; i < N; i++)
    box(run + 0.03, (i + 1) * rise, 1.0, um, 1.5 + (i + 0.5) * run, -(i + 1) * rise / 2, 2.5, st);

  // 防火女囚室（x[2.0,4.6] z[4.6,5.9]）
  const fk = P('firekeeper', gUnder);
  const cellM = extM(0xffffff, { map: stoneTex, rough: 0.95 });
  wallSeg(2.0, 4.6, 2.0, 5.9, -3.2, 3.2, 0.3, cellM, fk);
  wallSeg(4.6, 4.6, 4.6, 5.9, -3.2, 3.2, 0.3, cellM, fk);
  box(2.9, 0.6, 0.35, cellM, 3.3, -0.3, 4.6, fk);            // 门楣
  for (let i = 0; i < 7; i++)
    cyl(0.045, 0.045, 2.6, ironM, 2.2 + i * 0.37, -1.9, 4.6, fk, 10);  // 铁栅栏
  box(2.6, 0.09, 0.09, ironM, 3.3, -0.75, 4.6, fk);
  box(2.6, 0.09, 0.09, ironM, 3.3, -3.05, 4.6, fk);
  // 安娜斯塔西娅（蜷缩剪影）
  const robeM = M(0x23232e, { rough: 1 });
  cone(0.34, 0.9, robeM, 3.3, -2.75, 5.45, fk, 12);
  sph(0.15, robeM, 3.3, -2.32, 5.32, fk);
  // 蜡烛
  cyl(0.035, 0.045, 0.28, M(0xd8cfb8, { rough: 0.8 }), 2.65, -3.06, 5.0, fk, 8);
  const cf = sph(0.05, M(0xffb84d, { emissive: 0xff9a2e, ei: 2.5 }), 2.65, -2.88, 5.0, fk);
  cf.castShadow = false;
  const candle = new THREE.PointLight(0xff9a3c, 6, 8, 2);
  candle.position.set(2.65, -2.6, 5.0);
  fk.add(candle);

  // 升降机（井 x[5.0,6.6] z[1.9,3.5]）
  const el = P('elevator', gUnder);
  const shaftM = extM(0xffffff, { map: stoneTex, rough: 0.95 });
  wallSeg(5.0, 1.9, 5.0, 3.5, -3.2, 3.5, 0.25, shaftM, el);
  wallSeg(6.6, 1.9, 6.6, 3.5, -3.2, 3.5, 0.25, shaftM, el);
  wallSeg(5.0, 1.9, 6.6, 1.9, -3.2, 3.5, 0.25, shaftM, el);
  wallSeg(5.0, 3.5, 6.6, 3.5, -3.2, 3.5, 0.25, shaftM, el);
  box(1.35, 3.2, 1.35, M(0x050506, { rough: 1 }), 5.8, -4.9, 2.7, el).castShadow = false; // 井底黑暗
  box(1.5, 0.18, 1.5, woodM, 5.8, -2.75, 2.7, el);           // 平台
  box(1.6, 0.1, 0.12, ironM, 5.8, -2.68, 2.02, el);
  box(1.6, 0.1, 0.12, ironM, 5.8, -2.68, 3.38, el);
  for (const sx of [-0.6, 0.6]) for (const sz of [-0.6, 0.6])
    cyl(0.03, 0.03, 3.3, ironM, 5.8 + sx, -1.0, 2.7 + sz, el, 8);  // 铁链
  box(0.8, 0.09, 0.8, ironM, 4.35, -3.14, 2.7, el);          // 踩踏机关板
  box(0.12, 0.34, 0.22, ironM, 4.82, -2.0, 2.7, el);         // 墙拉杆座
  const lever = cyl(0.025, 0.025, 0.55, woodM, 4.72, -1.85, 2.7, el, 8);
  lever.rotation.z = 0.9;

  // 木梯（井内南侧）
  const ld = P('ladder', gUnder);
  for (const sx of [-0.2, 0.2]) cyl(0.04, 0.04, 3.2, woodM, 5.8 + sx, -1.15, 3.3, ld, 8);
  for (let i = 0; i < 6; i++) {
    const rung = cyl(0.028, 0.028, 0.44, woodM, 5.8, -2.5 + i * 0.52, 3.3, ld, 8);
    rung.rotation.z = Math.PI / 2;
  }
})();

/* ============ 穹顶与乌鸦巢 ============ */
(function buildRoof() {
  const rs = P('roofslab', gRoof);
  const sm = M(0xffffff, { map: stoneTex, rough: 0.95 });
  box(5, 0.35, 5, sm, -4.5, 4.75, -3.5, rs);
  box(2.5, 0.35, 2.5, sm, -0.75, 4.75, -4.75, rs);
  box(2.5, 0.35, 1.5, sm, -5.75, 4.75, -0.25, rs);
  const tilt = box(2.2, 0.3, 2.0, sm, -2.2, 4.5, -1.6, rs);
  tilt.rotation.z = 0.12; tilt.rotation.x = -0.08;

  // 乌鸦巢
  const cn = P('crownest', gRoof);
  const twigM = M(0x3a2c1c, { rough: 1 });
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.3, 10, 20), twigM);
  nest.position.set(-4.5, 5.1, -3.5); nest.rotation.x = Math.PI / 2; nest.scale.set(1, 1, 0.55);
  nest.castShadow = nest.receiveShadow = true;
  cn.add(nest); tagPart(nest, cn);
  cyl(1.0, 1.0, 0.12, M(0x1c140c, { rough: 1 }), -4.5, 5.0, -3.5, cn, 16).castShadow = false;
  for (let i = 0; i < 9; i++) {
    const tw = cyl(0.03, 0.04, 0.9 + rnd() * 0.5, twigM, -4.5 + (rnd() - .5) * 1.6, 5.25, -3.5 + (rnd() - .5) * 1.6, cn, 6);
    tw.rotation.z = Math.PI / 2 + (rnd() - .5) * 0.9;
    tw.rotation.y = rnd() * Math.PI;
  }
  // 巨型乌鸦剪影
  const crowM = M(0x14141c, { rough: 1 });
  sph(0.36, crowM, -4.5, 5.75, -3.5, cn, 1, 0.85, 1.35);
  sph(0.2, crowM, -4.5, 6.05, -2.95, cn);
  const beak = cone(0.09, 0.3, M(0x6e5a2e, { rough: 0.8 }), -4.5, 6.02, -2.68, cn, 8);
  beak.rotation.x = -Math.PI / 2 - 0.25;
  box(0.3, 0.08, 0.7, crowM, -4.5, 5.7, -4.15, cn);  // 尾羽
  // 乌鸦收集的亮闪闪
  const shinies = [0xffd76a, 0x6ab8ff, 0xff6a9a];
  shinies.forEach((cc, i) => {
    const s = sph(0.07, M(cc, { emissive: cc, ei: 1.2, rough: 0.3 }), -4.9 + i * 0.4, 5.32, -3.2 + (i % 2) * 0.3, cn, 8);
    s.castShadow = false;
  });
})();

/* ============ 交互 ============ */
const view = document.getElementById('view');
const panel = document.getElementById('panel');
const labelWrap = document.getElementById('labels');
const infoEl = document.getElementById('info');
const infoName = document.getElementById('infoName');
const infoCat = document.getElementById('infoCat');
const infoDesc = document.getElementById('infoDesc');
let viewW = 800, viewH = 600;
let cur = 'exterior', selected = null, labelsOn = true;
let fly = null, hlBox = null;
const tmpBox = new THREE.Box3();
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function flyTo(pos, tgt) { fly = { pos: pos.clone(), tgt: tgt.clone() }; }
controls.addEventListener('start', () => { fly = null; });

// 部件列表
const partsWrap = document.getElementById('parts');
for (const ck of ['out', 'main', 'under', 'yard']) {
  const h = document.createElement('div'); h.className = 'cat'; h.textContent = CATS[ck];
  partsWrap.appendChild(h);
  for (const id in PARTS) {
    const p = PARTS[id];
    if (p.cat !== ck) continue;
    const b = document.createElement('button');
    b.className = 'pbtn'; b.dataset.part = id; b.textContent = p.name;
    b.onclick = () => selectPart(id);
    partsWrap.appendChild(b);
  }
}

// 视角模式
function setMode(m) {
  cur = m;
  document.querySelectorAll('.vbtn').forEach(b => b.classList.toggle('on', b.dataset.view === m));
  gRoof.visible = (m === 'exterior');
  const cut = (m === 'main');
  cutWalls.south.visible = !cut; cutWalls.east.visible = !cut;
  underCut.ceiling.visible = (m !== 'under');
  underCut.east.visible = (m !== 'under');
  const xray = (m === 'xray');
  extMats.forEach(mt => { mt.transparent = xray; mt.opacity = xray ? 0.15 : 1; mt.depthWrite = !xray; mt.needsUpdate = true; });
  if (m === 'exterior') flyTo(V(13, 8, 15), V(0, 1.5, 0));
  if (m === 'main') flyTo(V(8.5, 7.5, 12), V(0, 1, 0));
  if (m === 'under') flyTo(V(11.5, 1.8, 9), V(4.2, -2.2, 3.8));
  if (m === 'xray') flyTo(V(13, 9, 14), V(0, 0.5, 0));
}
document.querySelectorAll('.vbtn').forEach(b => b.onclick = () => setMode(b.dataset.view));

// 开关
const tLabels = document.getElementById('tLabels');
tLabels.onclick = () => { labelsOn = !labelsOn; tLabels.classList.toggle('on', labelsOn); };
const tRotate = document.getElementById('tRotate');
tRotate.onclick = () => { controls.autoRotate = !controls.autoRotate; tRotate.classList.toggle('on', controls.autoRotate); };
document.getElementById('explode').addEventListener('input', e => {
  const t = e.target.value / 100;
  gRoof.position.y = 4.6 * t;
  gMain.position.y = 2.3 * t;
});
document.getElementById('menuBtn').onclick = () => { panel.classList.toggle('hide'); setTimeout(onResize, 260); };
document.getElementById('infoX').onclick = () => infoEl.classList.remove('show');

// 选择部件
function ensureVisible(p) {
  if (p.go && cur !== p.go) setMode(p.go);
}
function clearHl() {
  if (hlBox) { scene.remove(hlBox); hlBox.geometry.dispose(); hlBox.material.dispose(); hlBox = null; }
}
const LAYERSUFFIX = { roof: ' · 穹顶', main: ' · 遗迹内部', under: ' · 地下层', garden: ' · 室外' };
function selectPart(id) {
  const p = PARTS[id];
  if (!p || !p.group) return;
  ensureVisible(p);
  selected = id;
  document.querySelectorAll('.pbtn').forEach(b => b.classList.toggle('on', b.dataset.part === id));
  document.querySelectorAll('.lbl').forEach(el => el.classList.toggle('hot', el.dataset.part === id));
  infoName.textContent = p.name;
  infoCat.textContent = CATS[p.cat] + (LAYERSUFFIX[p.layer] || '');
  infoDesc.textContent = p.desc;
  infoEl.classList.add('show');
  p.group.updateWorldMatrix(true, true);
  tmpBox.setFromObject(p.group);
  if (!tmpBox.isEmpty()) {
    const c = tmpBox.getCenter(new THREE.Vector3());
    const size = tmpBox.getSize(new THREE.Vector3()).length();
    const dir = V(...(p.viewDir || [1, 0.6, 1])).normalize();
    flyTo(c.clone().addScaledVector(dir, Math.max(2.6, size * 1.5)), c);
  }
  clearHl();
  hlBox = new THREE.Box3Helper(tmpBox, 0xff8c2e);
  hlBox.material.depthTest = false;
  hlBox.renderOrder = 999;
  scene.add(hlBox);
}
function clearSelection() {
  selected = null; clearHl();
  infoEl.classList.remove('show');
  document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.lbl').forEach(el => el.classList.remove('hot'));
}

// 点击射线拾取
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downX = 0, downY = 0;
canvas.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
canvas.addEventListener('pointerup', e => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  const r = canvas.getBoundingClientRect();
  ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects(scene.children, true);
  for (const h of hits) {
    let n = h.object;
    while (n) {
      if (n.userData && n.userData.partId) { selectPart(n.userData.partId); return; }
      n = n.parent;
    }
  }
  clearSelection();
});

// 标注
const labelEls = [];
for (const id in PARTS) {
  const p = PARTS[id];
  if (p.noLabel || !p.label) continue;
  const el = document.createElement('div');
  el.className = 'lbl'; el.textContent = p.name; el.dataset.part = id;
  el.style.display = 'none';
  labelWrap.appendChild(el);
  labelEls.push({ id, el, v: V(...p.label) });
}
function isShown(obj) { let n = obj; while (n) { if (!n.visible) return false; n = n.parent; } return true; }
function labelOk(p) {
  if (cur === 'exterior') return !p.inMain && !p.under;
  if (cur === 'main') return !p.under;
  if (cur === 'under') return !!p.under || p.layer === 'garden';
  return true; // xray
}
const pv = new THREE.Vector3();
function refreshLabels() {
  for (const { id, el, v } of labelEls) {
    const p = PARTS[id];
    if (!labelsOn || !isShown(p.group) || !labelOk(p)) { el.style.display = 'none'; continue; }
    pv.copy(v).applyMatrix4(p.group.matrixWorld).project(camera);
    if (pv.z > 1 || pv.z < -1) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    el.style.left = ((pv.x * 0.5 + 0.5) * viewW) + 'px';
    el.style.top = ((-pv.y * 0.5 + 0.5) * viewH) + 'px';
  }
}

// 自适应
function onResize() {
  viewW = view.clientWidth; viewH = view.clientHeight;
  if (viewW < 2 || viewH < 2) return;
  renderer.setSize(viewW, viewH);
  camera.aspect = viewW / viewH;
  camera.fov = viewW < viewH ? 62 : 48; // 竖屏拉开视野，房子能完整入镜
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

// 主循环（篝火闪烁）
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (fireLight) fireLight.intensity = 42 + Math.sin(t * 13) * 5 + Math.sin(t * 7.3) * 4;
  if (flame1) { flame1.scale.y = 1 + Math.sin(t * 11) * 0.12; flame1.rotation.y = t * 1.5; }
  if (flame2) { flame2.scale.y = 1 + Math.sin(t * 15 + 1) * 0.15; }
  if (fly) {
    camera.position.lerp(fly.pos, 0.07);
    controls.target.lerp(fly.tgt, 0.07);
    if (camera.position.distanceTo(fly.pos) < 0.06) fly = null;
  }
  controls.update();
  if (selected && hlBox && PARTS[selected].group) tmpBox.setFromObject(PARTS[selected].group);
  refreshLabels();
  renderer.render(scene, camera);
}

if (window.matchMedia('(max-width: 760px)').matches) panel.classList.add('hide'); // 手机默认收起侧栏
onResize();
setMode('exterior');
animate();
document.getElementById('loading').style.display = 'none';
