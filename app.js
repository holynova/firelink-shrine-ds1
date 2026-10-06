import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============ 基础场景（v2：按 REFERENCE.md 真实布局重建） ============ */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141821);
scene.fog = new THREE.Fog(0x141821, 48, 115);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 400);
camera.position.set(17, 11, 21);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 1.5;
controls.maxDistance = 60;
controls.autoRotateSpeed = 1.2;

const hemi = new THREE.HemisphereLight(0x8f9fbb, 0x54493c, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xe2e9ff, 1.9);
sun.position.set(-14, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -36; sun.shadow.camera.right = 36;
sun.shadow.camera.top = 36; sun.shadow.camera.bottom = -36;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0006;
scene.add(sun);

/* ============ 程序化纹理（v2：石材旧化） ============ */
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

// 旧化石材：砌块 + 裂缝 + 苔斑 + 风化污渍
const stoneOldTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#77716a'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 1100; i++) {
    g.fillStyle = rnd() > .5 ? 'rgba(42,40,38,.32)' : 'rgba(205,200,190,.16)';
    g.fillRect(rnd() * s, rnd() * s, 3, 3);
  }
  g.strokeStyle = 'rgba(32,30,28,.7)'; g.lineWidth = 4;
  for (let y = 0; y <= s; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
  for (let y = 0; y < s; y += 64) for (let x = (y / 64 % 2) * 64; x <= s; x += 128) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke();
  }
  // 裂缝
  g.strokeStyle = 'rgba(20,18,16,.8)'; g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    let x = rnd() * s, y = rnd() * s;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (rnd() - .5) * 36; y += rnd() * 26; g.lineTo(x, y); }
    g.stroke();
  }
  // 苔斑
  for (let i = 0; i < 26; i++) {
    const x = rnd() * s, y = rnd() * s, r = 4 + rnd() * 12;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(74,96,52,.55)'); gr.addColorStop(1, 'rgba(74,96,52,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  // 风化污渍
  for (let i = 0; i < 14; i++) {
    const x = rnd() * s, y = rnd() * s, r = 8 + rnd() * 20;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(30,28,25,.3)'); gr.addColorStop(1, 'rgba(30,28,25,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
}, 2, 2);
// 广场石板：大块石板 + 放射状裂缝 + 灰烬堆积
const plazaTex = canvasTex(512, (g, s) => {
  g.fillStyle = '#6e6a63'; g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(30,28,26,.75)'; g.lineWidth = 5;
  const n = 4;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s / n, 0); g.lineTo(i * s / n, s); g.stroke();
    g.beginPath(); g.moveTo(0, i * s / n); g.lineTo(s, i * s / n); g.stroke();
  }
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = rnd() > .5 ? 'rgba(40,38,36,.3)' : 'rgba(200,195,185,.14)';
    g.fillRect(rnd() * s, rnd() * s, 3, 3);
  }
  g.strokeStyle = 'rgba(18,16,14,.85)'; g.lineWidth = 2.5;
  for (let i = 0; i < 10; i++) {
    let x = s / 2 + (rnd() - .5) * 200, y = s / 2 + (rnd() - .5) * 200;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (rnd() - .5) * 60; y += (rnd() - .5) * 60; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 30; i++) { // 灰烬堆
    const x = rnd() * s, y = rnd() * s, r = 6 + rnd() * 18;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(25,23,22,.5)'); gr.addColorStop(1, 'rgba(25,23,22,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  for (let i = 0; i < 20; i++) { // 苔
    const x = rnd() * s, y = rnd() * s, r = 5 + rnd() * 14;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(70,92,50,.5)'); gr.addColorStop(1, 'rgba(70,92,50,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
}, 3, 3);
const ashTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#3b3835'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 3200; i++) {
    g.fillStyle = rnd() > .5 ? 'rgba(20,18,16,.5)' : 'rgba(120,112,100,.28)';
    g.fillRect(rnd() * s, rnd() * s, 2, 2 + rnd() * 2);
  }
}, 18, 18);
const darkWoodTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#5e4128'; g.fillRect(0, 0, s, s);
  for (let x = 0; x < s; x += 32) {
    g.fillStyle = `rgba(${60 + rnd() * 25 | 0},${38 + rnd() * 16 | 0},18,.4)`;
    g.fillRect(x, 0, 30, s);
    g.strokeStyle = 'rgba(25,15,6,.55)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, s); g.stroke();
    g.strokeStyle = 'rgba(40,24,10,.35)'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const gx = x + 5 + rnd() * 22; g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx + 3, s); g.stroke(); }
  }
}, 2, 2);
const grassTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#4a5238'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = rnd() > .5 ? 'rgba(60,76,40,.6)' : 'rgba(110,120,80,.4)';
    g.fillRect(rnd() * s, rnd() * s, 2, 3 + rnd() * 4);
  }
  for (let i = 0; i < 300; i++) {
    g.fillStyle = 'rgba(50,48,44,.5)';
    g.fillRect(rnd() * s, rnd() * s, 3, 3);
  }
}, 8, 8);
function signTex(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#6e4f2e'; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = 'rgba(40,25,10,.5)'; g.lineWidth = 3;
  for (let y = 32; y < 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.fillStyle = '#2e1d0e'; g.font = 'bold 52px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
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
const extMats = [];
function extM(color, o = {}) { const m = M(color, o); extMats.push(m); return m; }
const stoneMat = extM(0xffffff, { map: stoneOldTex, rough: 0.96 });
const stoneDark = extM(0x8a857e, { map: stoneOldTex, rough: 0.96 });

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
// 参差断墙：分段随机高度
function brokenWall(x1, z1, x2, z2, y0, h, t, material, parent) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(2, Math.round(len / 2.2));
  for (let i = 0; i < n; i++) {
    const hh = h * (0.3 + rnd() * 0.7);
    const a = i / n, b = (i + 1) / n;
    wallSeg(x1 + (x2 - x1) * a, z1 + (z2 - z1) * a, x1 + (x2 - x1) * b, z1 + (z2 - z1) * b, y0, hh, t, material, parent);
  }
}
// 楔形石拱门（局部坐标沿 X 轴）
function arch(span, parent, x, y, z, ry = 0, n = 11) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = ry;
  parent.add(g);
  const R = span / 2;
  const tw = Math.PI * R / n * 1.3;      // 楔形石切向宽（咬合）
  const rh = Math.max(0.7, span * 0.14); // 楔形石径向高
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + 0.5) / n;
    const w = box(tw, rh, 0.8, stoneMat, Math.cos(a) * R, Math.sin(a) * R, 0, g);
    w.rotation.z = a - Math.PI / 2;
  }
  return g;
}
// 铁栅栏
function ironBars(x1, x2, y0, y1, z, parent) {
  const m = M(0x26262b, { metal: 0.65, rough: 0.45 });
  const n = Math.max(2, Math.round((x2 - x1) / 0.32));
  for (let i = 0; i <= n; i++) cyl(0.035, 0.035, y1 - y0, m, x1 + (x2 - x1) * i / n, (y0 + y1) / 2, z, parent, 6);
  box(x2 - x1 + 0.25, 0.14, 0.14, m, (x1 + x2) / 2, y1, z, parent);
  box(x2 - x1 + 0.25, 0.14, 0.14, m, (x1 + x2) / 2, y0 + 0.07, z, parent);
}
// 石柱（带柱础/柱头；broken=断裂高度比例）
function column(x, z, h, parent, broken = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  box(1.15, 0.45, 1.15, stoneMat, 0, 0.22, 0, g);
  box(0.9, 0.25, 0.9, stoneMat, 0, 0.55, 0, g);
  if (broken > 0) {
    cyl(0.42, 0.5, h * broken, stoneMat, 0, 0.67 + h * broken / 2, 0, g, 12);
    for (let i = 0; i < 4; i++) // 断裂茬口
      box(0.2 + rnd() * 0.25, 0.22, 0.2 + rnd() * 0.25, stoneMat, (rnd() - .5) * 0.6, 0.67 + h * broken + 0.08, (rnd() - .5) * 0.6, g, rnd() * 3);
  } else {
    cyl(0.42, 0.5, h, stoneMat, 0, 0.67 + h / 2, 0, g, 12);
    box(1.15, 0.32, 1.15, stoneMat, 0, 0.67 + h + 0.16, 0, g);
    box(0.85, 0.22, 0.85, stoneMat, 0, 0.67 + h + 0.43, 0, g);
  }
  return g;
}
// 碎石堆
function rubble(x, y, z, parent, n = 6, spread = 1.6) {
  for (let i = 0; i < n; i++) {
    const s = 0.18 + rnd() * 0.4;
    const r = box(s, s * (0.6 + rnd() * 0.6), s, stoneDark, x + (rnd() - .5) * spread, y + s / 2, z + (rnd() - .5) * spread, parent, rnd() * 3);
    r.rotation.x = (rnd() - .5) * 0.5;
  }
}
// 墓碑
function tombstone(x, y, z, s, parent) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.rotation.z = (rnd() - .5) * 0.5; g.rotation.x = (rnd() - .5) * 0.3;
  parent.add(g);
  box(0.75 * s, 0.22 * s, 0.55 * s, stoneDark, 0, 0.11 * s, 0, g);
  box(0.62 * s, 0.85 * s, 0.28 * s, stoneDark, 0, 0.6 * s, 0, g);
  const cap = cyl(0.31 * s, 0.31 * s, 0.28 * s, stoneDark, 0, 1.02 * s, 0, g, 10);
  cap.rotation.x = Math.PI / 2;
  return g;
}
// NPC 人形（cloak 斗篷色；sitting 坐姿）
function figure(x, y, z, parent, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  if (o.ry) g.rotation.y = o.ry;
  parent.add(g);
  const cm = M(o.cloak ?? 0x5a5148, { rough: 1 });
  const skin = M(o.skin ?? 0xb99a78, { rough: 0.9 });
  if (o.sitting) {
    const torso = cyl(0.22, 0.3, 0.72, cm, 0, 0.48, 0, g, 8); torso.rotation.x = 0.28;
    sph(0.155, skin, 0, 0.98, 0.1, g);
    if (o.hood !== false) cone(0.2, 0.32, cm, 0, 1.12, 0.06, g, 8);
    const legM = M(o.legs ?? 0x3a3630, { rough: 1 });
    box(0.15, 0.15, 0.55, legM, -0.13, 0.1, 0.3, g);
    box(0.15, 0.15, 0.55, legM, 0.13, 0.1, 0.3, g);
    box(0.15, 0.5, 0.15, legM, -0.13, 0.32, 0.55, g);
    box(0.15, 0.5, 0.15, legM, 0.13, 0.32, 0.55, g);
    const armL = cyl(0.06, 0.07, 0.55, cm, -0.3, 0.5, 0.12, g, 6); armL.rotation.x = 0.5;
    const armR = cyl(0.06, 0.07, 0.55, cm, 0.3, 0.5, 0.12, g, 6); armR.rotation.x = 0.5;
  } else {
    cyl(0.24, 0.36, 1.15, cm, 0, 0.58, 0, g, 8);
    box(0.5, 0.18, 0.4, cm, 0, 0.12, 0, g); // 下摆
    sph(0.155, skin, 0, 1.32, 0, g);
    if (o.hood) cone(0.21, 0.34, cm, 0, 1.48, -0.02, g, 8);
    if (o.bald) sph(0.16, skin, 0, 1.32, 0, g, 1, 0.85, 1);
  }
  return g;
}
// 骷髅（散架/重组中）
function skeleton(x, y, z, ry, parent, scattered = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const bm = M(0xcfc8b8, { rough: 0.9 });
  sph(0.17, bm, 0, 0.42, 0, g);
  box(0.1, 0.12, 0.1, bm, 0, 0.42, 0.14, g); // 下颌
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.17 - i * 0.025, 0.028, 6, 12), bm);
    rib.position.set(0, 0.3 - i * 0.1, 0); rib.rotation.x = Math.PI / 2;
    rib.castShadow = rib.receiveShadow = true; g.add(rib); tagPart(rib, parent);
  }
  cyl(0.045, 0.045, 0.5, bm, 0, 0.1, 0, g, 6);
  if (scattered) {
    const a1 = cyl(0.04, 0.04, 0.55, bm, 0.5, 0.05, 0.3, g, 6); a1.rotation.z = Math.PI / 2; a1.rotation.y = 0.6;
    const a2 = cyl(0.04, 0.04, 0.5, bm, -0.45, 0.05, -0.25, g, 6); a2.rotation.z = Math.PI / 2; a2.rotation.y = -0.9;
    sph(0.13, bm, 0.75, 0.08, -0.4, g);
  } else {
    const l1 = cyl(0.04, 0.04, 0.55, bm, -0.28, 0.35, 0, g, 6); l1.rotation.z = 0.5;
    const l2 = cyl(0.04, 0.04, 0.55, bm, 0.28, 0.35, 0, g, 6); l2.rotation.z = -0.5;
  }
  return g;
}
// 枯树
function deadTree(x, z, s, parent) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const bm = M(0x3d332a, { rough: 1 });
  cyl(0.14 * s, 0.22 * s, 2.6 * s, bm, 0, 1.3 * s, 0, g, 8);
  for (let i = 0; i < 5; i++) {
    const br = cyl(0.04 * s, 0.07 * s, (1 + rnd() * 0.9) * s, bm, (rnd() - .5) * 0.8 * s, (2 + rnd() * 1.2) * s, (rnd() - .5) * 0.8 * s, g, 6);
    br.rotation.z = (rnd() - .5) * 1.6; br.rotation.x = (rnd() - .5) * 1.2;
  }
  return g;
}

/* ============ 部件注册表（v2：38 部件） ============ */
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

defPart('ruins-out', { name: '遗迹外墙', cat: 'out', layer: 'main', go: 'exterior', label: [-9.5, 3.2, 0], viewDir: [-1, .55, .4], desc: '环绕中央广场的残破石墙。火快要熄灭了，墙却还在这里——它们比大多数不死人都要长寿。' });
defPart('plaza', { name: '中央广场', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [0, 1.4, 6], viewDir: [.7, .85, .7], desc: '被不死人踩了无数遍的环形广场。石板上全是裂缝和灰烬，但只要篝火还在，传火祭祀场就还在。' });
defPart('roofslab', { name: '残破石顶', cat: 'out', layer: 'roof', go: 'exterior', label: [19, 7.6, -5], viewDir: [.8, .7, -.4], desc: '东废墟上残存的石顶，只盖住了一角。塌下来的石头，现在都是广场的地砖。' });
defPart('crownest', { name: '乌鸦巢', cat: 'out', layer: 'roof', go: 'exterior', label: [19, 7.2, -5], viewDir: [.6, .7, -.6], desc: '东屋顶上的巨型鸟巢，树枝编得比王宫还结实。想回北方不死院？蜷起来装睡，乌鸦自会把你抓走。' });
defPart('crow', { name: '巨型乌鸦', cat: 'out', layer: 'roof', go: 'exterior', label: [19, 8.8, -5], viewDir: [.6, .5, -.6], desc: '巢的主人。它不说话，只跑快递——把装睡的不死人空运回北方不死院，童叟无欺。' });
defPart('aqueduct', { name: '水道桥', cat: 'out', layer: 'main', go: 'exterior', label: [-23, 10, 2], viewDir: [-1, .5, .5], desc: '通往城外不死镇的古老水道桥。桥身全是拱门，风声混着深渊的回响，走夜路记得扶稳。' });
defPart('aqua-entry', { name: '水道桥入口', cat: 'out', layer: 'main', go: 'exterior', label: [-32, 4.5, 2], viewDir: [-1, .4, .3], desc: '水道桥西端的黑暗廊道。里面有只下水道老鼠和一具尸体——老鼠比尸体难对付。' });
defPart('bonfire', { name: '中央篝火', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [0, 2.8, 1.5], viewDir: [1, .55, 1], desc: '螺旋剑插在灰烬里，火光永不熄灭。坐下吧，喝口原素瓶，前面的路还长着呢。' });
defPart('corpse', { name: '篝火旁的人性', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [2, 1.2, 2.8], viewDir: [1, .5, .6], desc: '趴在篝火边的人性尸体。拿走吧，反正他也用不上了——在这地方，人性是最不缺的东西。' });
defPart('crestfallen', { name: '消沉战士', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [-2.4, 2, 3.6], viewDir: [-.8, .6, .8], desc: '靠着断墙发呆的消沉战士。他会告诉你两个钟的事，然后看着你去送死。千万别学他。' });
defPart('columns', { name: '断裂石柱群', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [-5.8, 4.8, -3], viewDir: [-1, .6, -.3], desc: '环绕广场的石柱，断的断、倒的倒。柱头柱础散落一地，拼都拼不回去——它们站在这里的时间比火还久。' });
defPart('arches', { name: '残缺拱门', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [4.5, 5.4, -4], viewDir: [1, .6, -.5], desc: '石柱间残存的拱门，楔形石一块块凿出来的。穿过这样的门，通往的都是别的受苦之地。' });
defPart('doorways', { name: '三重门洞', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [8, 3.8, -1], viewDir: [-1, .5, .3], desc: '东废墟西墙上并排的三道门：左经水淹遗迹通地下墓地，中通佩特鲁斯的藏身处，右通一条堆满火弹药的窄道。选吧。' });
defPart('petrus', { name: '佩特鲁斯一行', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [14, 2.2, -1], viewDir: [.8, .5, .4], desc: '白教的佩特鲁斯和跟班文斯、尼克，蕾雅之后也会来。他们卖奇迹，也卖队友——小心你的后背。' });
defPart('chests', { name: '密室宝箱群', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [20.5, 2, 1.5], viewDir: [.9, .5, .5], desc: '从"通往虚空的门"跳下去找到的密室。晨星锤、护符、归乡骨、罗伊德护符、破裂红眼宝珠——全是好东西，前提是你敢跳。' });
defPart('firebombs', { name: '火弹药通道', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [15, 1.8, 5.5], viewDir: [.7, .5, .7], desc: '右门洞里的窄道，尽头堆着火弹药。扔出去很好玩，被扔到就不好玩了。' });
defPart('well', { name: '水井', cat: 'main', layer: 'main', go: 'main', label: [-6.5, 2.6, 3.5], viewDir: [-.8, .6, .6], desc: '广场西边的水井，辘轳还能转。井水早干了——不死人又不喝水，摆着好看。' });
defPart('graves', { name: '墓碑群', cat: 'main', layer: 'main', go: 'main', label: [-4, 4.5, -18], viewDir: [-.6, .7, -.8], desc: '北坡上东倒西歪的墓碑。埋的是谁没人记得，反正死了也不一定能安息，墓碑更多是装饰。' });
defPart('skeletons', { name: '骷髅战士', cat: 'main', layer: 'main', go: 'main', label: [3.5, 4, -16], viewDir: [.6, .6, -.7], desc: '墓地里的骷髅，散了架也能自己拼回去。对付它们记住一条：钝器，一下敲散。' });
defPart('zweihander', { name: '大剑之冢', cat: 'main', layer: 'main', go: 'main', label: [-2, 6.5, -24], viewDir: [-.5, .6, -.8], desc: '插在墓地最高处的双手大剑。拔出来就是你的——如果骷髅们同意的话。' });
defPart('flooded', { name: '被水淹的遗迹', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [0, 1.2, -10.5], viewDir: [.5, .8, -.8], desc: '广场和墓地之间的低洼遗迹，常年积水。寻王大蛇就喜欢从这种黑水里钻出来。' });
defPart('catacombs', { name: '地下墓地入口', cat: 'main', layer: 'main', go: 'main', label: [0, 6.5, -27], viewDir: [0, .5, -1], desc: '墓地尽头的黑暗拱门，通往地下墓地。下面的骷髅比上面的更不讲道理，带把神圣武器再下去。' });
defPart('parish-elevator', { name: '教区升降机井', cat: 'main', layer: 'main', go: 'main', label: [28, 9, -4], viewDir: [1, .6, -.3], desc: '东边高耸的升降机井，坐它直达不死教区。胆子大的可以从井道跳下去捡东西——前提是没摔死。' });
defPart('ring', { name: '牺牲戒指', cat: 'main', layer: 'main', go: 'main', label: [-23, 10.2, 2], viewDir: [-.8, .6, .4], desc: '水道桥上的人性戒指……是牺牲戒指。死了掉的灵魂能保住，人保不住。' });
defPart('frampt', { name: '大蛇之坑', cat: 'main', layer: 'main', go: 'main', inMain: 1, label: [3.2, 0.8, -10.5], viewDir: [.6, .7, -.6], desc: '水淹遗迹里的黑水深坑。敲响两口钟之后，寻王弗拉姆特会从这里钻出来，用它那张大脸对着你笑。' });
defPart('stairs', { name: '地下石阶', cat: 'under', layer: 'under', go: 'under', under: 1, label: [3, -1.2, 11.5], viewDir: [.8, .4, .8], desc: '广场南边的石阶，通往地下。防火女和升降机都在下面——下去容易，上来难。' });
defPart('firekeeper', { name: '防火女囚室', cat: 'under', layer: 'under', go: 'under', under: 1, label: [8, -1.6, 18], viewDir: [.4, .35, .9], desc: '安娜斯塔西娅，灰之圣女，蜷缩在栅栏后面。她不能说话，但你的原素瓶每次变强都是她的功劳。记得带防火女之魂回来。' });
defPart('lautrec', { name: '骑士洛特里克', cat: 'under', layer: 'under', go: 'under', under: 1, label: [0.5, -1.8, 16.5], viewDir: [-.6, .4, .8], desc: '守在楼梯口的黄金骑士，笑得让人发毛。防火女的魂丢了，八成和他脱不了干系。' });
defPart('elevator', { name: '小隆德升降机', cat: 'under', layer: 'under', go: 'under', under: 1, label: [3, -3.5, 26], viewDir: [.5, .5, 1], desc: '通往小隆德遗迹的大升降机。踩下机关，铁链载你沉入黑暗。底下有四王，还有一大群鬼——祝好运。' });
defPart('deadtrees', { name: '枯树群', cat: 'yard', layer: 'garden', go: 'exterior', label: [-14, 4.5, 8], viewDir: [-1, .5, .6], desc: '祭祀场周围的枯树，枝桠像爪子。这里的东西除了篝火，全是半死不活的。' });
defPart('signs', { name: '岔路木牌', cat: 'yard', layer: 'garden', go: 'exterior', label: [4.5, 2.2, 6.5], viewDir: [.5, .5, 1], desc: '木牌上刻着：西去城外不死镇，北往地下墓地，南下小隆德遗迹。每条路的尽头都是受苦，建议都走一遍。' });
defPart('patches', { name: '帕奇斯', cat: 'yard', layer: 'garden', go: 'exterior', label: [-11, 2, -2.5], viewDir: [-1, .5, -.3], desc: '蹲在西边悬崖边的帕奇斯，卖便宜货的光头。他看你的眼神，就像在看一件会上当的商品。' });
defPart('laurentius', { name: '劳伦缇斯', cat: 'yard', layer: 'garden', go: 'exterior', label: [-2, 1.8, 10.5], viewDir: [-.5, .5, .8], desc: '大沼泽的劳伦缇斯，坐在通往小隆德的楼梯口。他会教你火球术，是个好人——好人不长命。' });
defPart('griggs', { name: '葛里格斯', cat: 'yard', layer: 'garden', go: 'exterior', label: [10.5, 2, 3.5], viewDir: [.7, .5, .6], desc: '文海姆的葛里格斯，蹲在废墟边卖魔法。他一辈子都在找大帽子罗根。' });
defPart('ingward', { name: '英格沃德', cat: 'yard', layer: 'garden', go: 'exterior', label: [22, 2, 5.5], viewDir: [1, .5, .4], desc: '封印的看守者英格沃德，水退去后搬到了祭祀场东边。买他的暂时诅咒，再下小隆德。' });
defPart('siegmeyer', { name: '洋葱骑士', cat: 'yard', layer: 'garden', go: 'exterior', label: [3, 1.8, 4.8], viewDir: [.6, .5, .8], desc: '卡塔利纳的西格迈尔，坐在篝火边打盹。他的口头禅是"嗯嗯"，他的结局是"呜呜"。' });
defPart('domhnall', { name: '多姆纳尔', cat: 'yard', layer: 'garden', go: 'exterior', label: [-9.5, 2, 6.5], viewDir: [-.8, .5, .6], desc: '赛那的多姆纳尔，守在水道桥入口卖稀有货。打完病村之后，他才会在这里摆摊。' });
defPart('wisps', { name: '灵魂光点', cat: 'yard', layer: 'garden', go: 'exterior', label: [-3, 1.8, -14], viewDir: [-.5, .6, -.7], desc: '飘在废墟里的灵魂光点。每一个光点，都是一个没能传火的不死人。' });

/* ============ 层组 ============ */
const gRoof = new THREE.Group(), gMain = new THREE.Group(),
      gUnder = new THREE.Group(), gGarden = new THREE.Group();
scene.add(gRoof, gMain, gUnder, gGarden);
const cutWalls = {}, underCut = {};
let fireLight = null, flame1 = null, flame2 = null, groundMesh = null;
const embers = [];

/* ============ 大地与中央广场 ============ */
(function buildGround() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), extM(0xffffff, { map: ashTex, rough: 1 }));
  groundMesh = ground;
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06;
  ground.receiveShadow = true;
  scene.add(ground);
  // 远处乱石与土丘点缀
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = 42 + rnd() * 22;
    const s = 1 + rnd() * 3;
    const rock = box(s, s * (0.5 + rnd() * 0.5), s, stoneDark, Math.cos(a) * r, s * 0.2, Math.sin(a) * r, gGarden, rnd() * 3);
    rock.rotation.x = (rnd() - .5) * 0.3;
  }
})();

(function buildPlaza() {
  const pz = P('plaza', gMain);
  const plazaM = M(0xffffff, { map: plazaTex, rough: 0.97 });
  const floor = cyl(8, 8.4, 0.5, plazaM, 0, -0.25, 0, pz, 36);
  floor.receiveShadow = true;
  // 广场边缘碎石
  rubble(5, 0, 5, pz, 8, 3); rubble(-5, 0, -4, pz, 8, 3); rubble(2, 0, -6.5, pz, 6, 2.5);
  // 苔藓斑块
  const mossM = M(0x4a5e34, { rough: 1 });
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2, r = 2 + rnd() * 5.5;
    const m = cyl(0.3 + rnd() * 0.5, 0.4 + rnd() * 0.5, 0.04, mossM, Math.cos(a) * r, 0.03, Math.sin(a) * r, pz, 8);
    m.castShadow = false;
  }

  // ---- 中央篝火 ----
  const bf = P('bonfire', gMain);
  for (let i = 0; i < 10; i++) { // 石环
    const a = i / 10 * Math.PI * 2;
    box(0.42, 0.3, 0.3, stoneDark, Math.cos(a) * 1.15, 0.15, 1.5 + Math.sin(a) * 1.15, bf, -a);
  }
  const ash = sph(0.95, M(0x2e2b28, { rough: 1 }), 0, 0.12, 1.5, bf, 1, 0.38, 1);
  ash.castShadow = false;
  // 螺旋剑
  const blade = box(0.13, 1.7, 0.035, M(0x9aa0a8, { metal: 0.75, rough: 0.35 }), 0.06, 1.0, 1.5, bf);
  blade.rotation.z = 0.1; blade.rotation.x = -0.06;
  box(0.55, 0.09, 0.12, M(0x6e5a34, { metal: 0.5, rough: 0.5 }), 0.14, 1.82, 1.44, bf).rotation.z = 0.1;
  const grip = cyl(0.055, 0.055, 0.32, M(0x3a2c1c, { rough: 0.9 }), 0.22, 2.0, 1.4, bf, 8);
  grip.rotation.z = 0.1;
  sph(0.08, M(0x6e5a34, { metal: 0.5, rough: 0.5 }), 0.24, 2.18, 1.39, bf);
  // 木柴
  const woodM = M(0x4a3a26, { rough: 1 });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    const log = cyl(0.07, 0.09, 1.3, M(0x4a3a26, { rough: 1 }), Math.cos(a) * 0.55, 0.35, 1.5 + Math.sin(a) * 0.55, bf, 7);
    log.rotation.z = Math.PI / 2.4; log.rotation.y = -a;
  }
  // 火焰（双层锥）
  flame1 = cone(0.42, 1.25, M(0xff7a1e, { emissive: 0xff6a00, ei: 2.2, rough: 0.6 }), 0, 1.0, 1.5, bf, 10);
  flame1.castShadow = false;
  flame2 = cone(0.22, 0.75, M(0xffd76a, { emissive: 0xffc040, ei: 2.6, rough: 0.6 }), 0, 0.85, 1.5, bf, 8);
  flame2.castShadow = false;
  fireLight = new THREE.PointLight(0xff8c2e, 42, 24, 2);
  fireLight.position.set(0, 1.8, 1.5);
  bf.add(fireLight);
  // 上升余烬
  const embM = M(0xffa040, { emissive: 0xff7a10, ei: 2.5, rough: 0.5 });
  for (let i = 0; i < 22; i++) {
    const e = sph(0.03 + rnd() * 0.035, embM, (rnd() - .5) * 1.2, rnd() * 3, 1.5 + (rnd() - .5) * 1.2, bf, 6);
    e.castShadow = false;
    embers.push({ m: e, sp: 0.5 + rnd() * 0.9, ph: rnd() * 6.28 });
  }

  // ---- 篝火旁的尸体（人性） ----
  const cp = P('corpse', gMain);
  const bodyM = M(0x4c4438, { rough: 1 });
  const torso = box(0.45, 0.28, 1.1, bodyM, 2.1, 0.14, 2.9, cp, 0.5);
  sph(0.16, M(0x8a7a64, { rough: 1 }), 2.45, 0.16, 3.35, cp);
  const hum = sph(0.12, M(0x0a0a0c, { emissive: 0x303038, ei: 0.8, rough: 0.4 }), 2.1, 0.42, 2.9, cp, 8);
  hum.castShadow = false;

  // ---- 消沉战士 ----
  const cw = P('crestfallen', gMain);
  figure(-2.4, 0, 3.6, cw, { cloak: 0x4e5a66, legs: 0x35322c, sitting: true, ry: 2.6 });
  box(1.6, 1.1, 0.5, stoneDark, -3.1, 0.55, 4.1, cw, 0.5); // 他靠着的断墙

  // ---- 石柱群（4 整柱 + 拱，2 断柱，1 倒柱） ----
  const col = P('columns', gMain);
  column(3.9, 3.9, 4.2, col);
  column(-3.9, 3.9, 4.2, col);
  column(-3.9, -3.9, 4.2, col);
  column(3.9, -3.9, 4.2, col);
  column(-5.8, 0.5, 4.0, col, 0.45);
  column(5.8, -0.5, 4.0, col, 0.3);
  // 倒柱
  const fc = new THREE.Group(); fc.position.set(1.5, 0, -5.5); fc.rotation.y = 0.7; col.add(fc);
  const seg1 = cyl(0.42, 0.42, 1.8, stoneMat, 0, 0.42, 0, fc, 12); seg1.rotation.z = Math.PI / 2;
  const seg2 = cyl(0.42, 0.42, 1.2, stoneMat, 2.2, 0.42, 0.3, fc, 12); seg2.rotation.z = Math.PI / 2; seg2.rotation.y = 0.4;
  box(1.1, 0.4, 1.1, stoneMat, -1.2, 0.2, -0.1, fc, 0.4);
  rubble(1.5, 0, -5.5, col, 6, 2.5);

  const ar = P('arches', gMain);
  arch(7.8, ar, 0, 4.25, 3.9, 0);            // 南拱
  arch(7.8, ar, 0, 4.25, -3.9, 0);           // 北拱
  arch(7.8, ar, 3.9, 4.25, 0, Math.PI / 2);   // 东拱
  const arW = arch(7.8, ar, -3.9, 4.25, 0, Math.PI / 2, 6); // 西拱（残缺一半）

  // ---- 遗迹外墙（环形断墙，留缺口） ----
  const rw = P('ruins-out', gMain);
  const cutS = new THREE.Group(), cutE = new THREE.Group();
  rw.add(cutS, cutE);
  cutWalls.south = cutS; cutWalls.east = cutE;
  const R = 8.5;
  function ringSeg(degC, parent) {
    const a0 = (degC - 24) * Math.PI / 180, a1 = (degC + 24) * Math.PI / 180;
    brokenWall(Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R, 0, 3.2, 0.8, stoneMat, parent);
  }
  ringSeg(45, cutS); ringSeg(135, cutS);      // 南侧两段（main 视角隐藏）
  ringSeg(225, rw); ringSeg(315, rw);
  // 北段矮墙（墓地入口两侧）
  brokenWall(-8, -3.4, -3.2, -7.6, 0, 2.2, 0.8, stoneMat, rw);
  brokenWall(3.2, -7.6, 8, -3.4, 0, 2.2, 0.8, stoneMat, rw);
  rubble(-6, 0, 6, rw, 10, 4); rubble(6, 0, -6, rw, 10, 4);

  // ---- 水井 ----
  const wl = P('well', gMain);
  cyl(1.0, 1.1, 1.0, stoneMat, -6.5, 0.5, 3.5, wl, 12);
  const wellDark = cyl(0.78, 0.78, 0.9, M(0x0c0b0a, { rough: 1 }), -6.5, 0.55, 3.5, wl, 12);
  wellDark.castShadow = false;
  const postM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  box(0.14, 1.9, 0.14, postM, -7.3, 1.4, 3.5, wl);
  box(0.14, 1.9, 0.14, postM, -5.7, 1.4, 3.5, wl);
  box(1.9, 0.14, 0.14, postM, -6.5, 2.25, 3.5, wl);
  const wind = cyl(0.09, 0.09, 1.5, postM, -6.5, 1.85, 3.5, wl, 8);
  wind.rotation.z = Math.PI / 2;
  box(0.08, 0.5, 0.08, postM, -5.85, 1.85, 3.62, wl).rotation.x = 0.5; // 摇柄
  cyl(0.015, 0.015, 1.1, M(0x8a7a5e, { rough: 1 }), -6.5, 1.25, 3.5, wl, 6).castShadow = false; // 绳
  cyl(0.16, 0.12, 0.28, postM, -6.5, 0.75, 3.5, wl, 8); // 桶
})();

/* ============ 东废墟（三重门洞 / 佩特鲁斯 / 密室） ============ */
(function buildEastRuins() {
  const eru = new THREE.Group(); gMain.add(eru); // 仅作容器，非部件
  const eruS = new THREE.Group(), eruE = new THREE.Group(), eruN = new THREE.Group(), eruW = new THREE.Group();
  eru.add(eruS, eruE, eruN, eruW);
  cutWalls.south.add(eruS); cutWalls.east.add(eruE);
  const WH = 5.5, T = 0.7;
  // 地板
  box(16.5, 0.3, 16.5, M(0xffffff, { map: plazaTex, rough: 0.97 }), 16, -0.1, 0, eruW);
  // 西墙 x=8：三重门洞（门宽1.7，高3）
  const doors = [-5.5, -1, 3.5];
  let z0 = -8;
  for (const dz of doors) {
    wallSeg(8, z0, 8, dz - 0.85, 0, WH, T, stoneMat, eruW);
    z0 = dz + 0.85;
  }
  wallSeg(8, z0, 8, 8, 0, WH, T, stoneMat, eruW);
  // 北墙 z=-8（参差）
  brokenWall(8, -8, 24, -8, 0, WH, T, stoneMat, eruN);
  // 南墙 z=8（参差，可隐藏）
  brokenWall(8, 8, 24, 8, 0, WH, T, stoneMat, eruS);
  // 东墙 x=24（可隐藏）
  brokenWall(24, -8, 24, 8, 0, WH, T, stoneMat, eruE);
  // 内部断柱
  column(12, -4, 4.5, eruW, 0.5);
  column(20, -4, 4.5, eruW);
  column(12, 3, 4.5, eruW, 0.35);

  // ---- 三重门洞（独立部件：门框特写） ----
  const dw = P('doorways', gMain);
  for (const dz of doors) {
    box(1.1, 3.2, 0.4, stoneDark, 7.9, 1.6, dz - 1.05, dw);
    box(1.1, 3.2, 0.4, stoneDark, 7.9, 1.6, dz + 1.05, dw);
    box(1.1, 0.55, 2.5, stoneDark, 7.9, 3.45, dz, dw);
    // 门楣刻痕
    box(1.15, 0.12, 2.0, M(0x2c2a26, { rough: 1 }), 7.9, 3.1, dz, dw).castShadow = false;
  }

  // ---- 佩特鲁斯一行 ----
  const pt = P('petrus', gMain);
  figure(14, 0, -1.5, pt, { cloak: 0x8a2f2a, hood: true, ry: -1.2 });       // 佩特鲁斯（红）
  figure(15.2, 0, -0.4, pt, { cloak: 0x5c5648, hood: true, ry: 2.4 });      // 文斯
  figure(13.1, 0, -0.2, pt, { cloak: 0x4c4a52, hood: true, ry: 0.8 });      // 尼克
  figure(14.6, 0, -2.6, pt, { cloak: 0xd8cfc0, hood: true, sitting: true, ry: 1.8 }); // 蕾雅（白）
  // 篝火堆余烬
  sph(0.5, M(0x2e2b28, { rough: 1 }), 14, 0.1, -1.4, pt, 1, 0.3, 1).castShadow = false;

  // ---- 上楼楼梯 + 二层 + 通往虚空的门 ----
  const woodM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  for (let i = 0; i < 10; i++)
    box(0.55, 0.32, 1.6, stoneDark, 17 + i * 0.55, 0.16 + i * 0.32, -6, eruW);
  box(8, 0.3, 6, woodM, 20, 3.35, -5, eruW); // 二层木地板
  for (let i = 0; i < 4; i++) box(0.18, 3.2, 0.18, woodM, 16.5 + i * 2.4, 1.7, -7.8, eruW);
  // 两扇"通往虚空的门" + 下面的黑洞
  for (const dx of [21.5, 23]) {
    box(0.25, 2.2, 1.1, woodM, dx, 4.6, -0.5, eruW);
    box(0.3, 0.15, 1.3, stoneDark, dx, 3.55, -0.5, eruW);
  }
  const hole = box(2.2, 0.1, 1.8, M(0x050505, { rough: 1 }), 22.2, 3.52, 1.8, eruW);
  hole.castShadow = false;
  box(2.6, 0.12, 0.3, stoneDark, 22.2, 3.55, 0.85, eruW);
  box(2.6, 0.12, 0.3, stoneDark, 22.2, 3.55, 2.75, eruW);

  // ---- 密室宝箱群 ----
  const ch = P('chests', gMain);
  box(5, 2.6, 4, stoneDark, 20.5, 1.3, 2, ch); // 密室围墙（低）
  function chest(x, z, open) {
    const g = new THREE.Group(); g.position.set(x, 0, z); ch.add(g);
    box(0.9, 0.5, 0.6, woodM, 0, 0.25, 0, g);
    const lid = box(0.9, 0.18, 0.6, woodM, 0, open ? 0.62 : 0.55, open ? -0.28 : 0, g);
    if (open) lid.rotation.x = -1.1;
    box(0.94, 0.1, 0.64, M(0x6e6a66, { metal: 0.6, rough: 0.4 }), 0, 0.42, 0, g);
  }
  chest(19.2, 1.2, true); chest(20.5, 1.2, true); chest(21.8, 1.2, false);
  // 晨星锤
  const ms = sph(0.16, M(0x5a5a60, { metal: 0.5, rough: 0.5 }), 19.2, 0.75, 1.2, ch, 8);
  for (let i = 0; i < 6; i++) cone(0.04, 0.12, M(0x8a8a92, { metal: 0.6, rough: 0.4 }), 19.2 + (rnd() - .5) * 0.25, 0.75 + (rnd() - .5) * 0.25, 1.2 + (rnd() - .5) * 0.25, ch, 6);
  cyl(0.035, 0.035, 0.7, woodM, 19.2, 0.45, 1.75, ch, 6).rotation.x = 1.2;
  // 护符
  box(0.12, 0.3, 0.04, M(0xc9a86a, { metal: 0.4, rough: 0.5 }), 20.5, 0.72, 1.2, ch, 0.4);
  // 归乡骨 / 罗伊德护符 / 破裂红眼宝珠
  for (let i = 0; i < 3; i++) sph(0.07, M(0xd8d2c4, { rough: 0.8 }), 21.6 + i * 0.18, 0.62, 1.5, ch, 8);
  for (let i = 0; i < 2; i++) sph(0.06, M(0xc9a86a, { rough: 0.7 }), 19.4 + i * 0.15, 0.6, 0.9, ch, 8);
  for (let i = 0; i < 3; i++) {
    const orb = sph(0.08, M(0xa01010, { emissive: 0xcc1010, ei: 1.4, rough: 0.3 }), 20.3 + i * 0.2, 0.65, 2.4, ch, 8);
    orb.castShadow = false;
  }

  // ---- 火弹药通道 ----
  const fb = P('firebombs', gMain);
  wallSeg(10, 4.5, 20, 4.5, 0, 2.6, 0.5, stoneMat, fb);
  wallSeg(10, 6.5, 20, 6.5, 0, 2.6, 0.5, stoneMat, fb);
  box(10.5, 0.4, 2.5, stoneDark, 15, 2.8, 5.5, fb); // 通道顶
  for (let i = 0; i < 6; i++) { // 火弹药堆
    const b = sph(0.14, M(0x1c1a18, { rough: 0.8 }), 17.5 + (rnd() - .5) * 1.6, 0.14, 5.5 + (rnd() - .5) * 1.2, fb, 8);
    cyl(0.02, 0.02, 0.16, M(0x8a7a5e, { rough: 1 }), b.position.x, 0.3, b.position.z, fb, 5);
  }
  // 葛里格斯（通道口）
  const gr = P('griggs', gGarden);
  figure(10.5, 0, 3.2, gr, { cloak: 0x3a5a8a, hood: true, ry: 2.8 });

  // ---- 英格沃德（东边） ----
  const ig = P('ingward', gGarden);
  figure(23, 0, 5.5, ig, { cloak: 0x6a6a72, hood: true, ry: -2.2 });
})();

/* ============ 教区升降机井 + 屋顶乌鸦巢 ============ */
(function buildShaftAndNest() {
  const sh = P('parish-elevator', gMain);
  const X0 = 26, X1 = 30, Z0 = -6, Z1 = -2, H = 13, T = 0.6;
  // 北/南墙
  wallSeg(X0, Z0, X1, Z0, 0, H, T, stoneMat, sh);
  wallSeg(X0, Z1, X1, Z1, 0, H, T, stoneMat, sh);
  // 东墙
  wallSeg(X1, Z0, X1, Z1, 0, H, T, stoneMat, sh);
  // 西墙 x=26：留两个开口（y0-3，y6-9）
  wallSeg(X0, Z0, X0, Z1, 9, H - 9, T, stoneMat, sh);
  wallSeg(X0, Z0, X0, Z1, 3, 3, T, stoneMat, sh);
  // 井底黑暗
  const pit = cyl(1.8, 1.8, 2, M(0x050505, { rough: 1 }), 28, -0.9, -4, sh, 12);
  pit.castShadow = false;
  // 木平台
  const woodM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  box(3.2, 0.35, 3.2, woodM, 28, 0.4, -4, sh);
  // 铁链
  const chM = M(0x2c2c30, { metal: 0.6, rough: 0.5 });
  for (const [cx, cz] of [[26.8, -5.2], [29.2, -5.2], [26.8, -2.8], [29.2, -2.8]])
    cyl(0.05, 0.05, 12.4, chM, cx, 6.8, cz, sh, 6);
  // 顶框
  box(4.6, 0.5, 0.5, stoneDark, 28, 13.2, Z0, sh);
  box(4.6, 0.5, 0.5, stoneDark, 28, 13.2, Z1, sh);
  // 通往乌鸦巢的横杆（y=6 向西）
  box(4.5, 0.28, 0.28, woodM, 23.8, 6, -4, sh);

  // ---- 屋顶平台 + 石顶 ----
  const rf = P('roofslab', gRoof);
  box(10.5, 0.45, 6.5, stoneMat, 19, 5.85, -5, rf);
  box(3, 0.4, 4, stoneMat, 13, 5.8, -6, rf);
  const tilt = box(2.6, 0.35, 2.4, stoneMat, 22.5, 5.6, -3, rf);
  tilt.rotation.z = 0.1; tilt.rotation.x = -0.06;
  rubble(16, 6.1, -4, rf, 8, 3);

  // ---- 乌鸦巢 ----
  const cn = P('crownest', gRoof);
  const twigM = M(0x3a2c1c, { rough: 1 });
  const nest = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.32, 10, 22), twigM);
  nest.position.set(19, 6.35, -5); nest.rotation.x = Math.PI / 2; nest.scale.set(1, 1, 0.55);
  nest.castShadow = nest.receiveShadow = true;
  cn.add(nest); tagPart(nest, cn);
  cyl(1.05, 1.05, 0.14, M(0x1c140c, { rough: 1 }), 19, 6.22, -5, cn, 18).castShadow = false;
  for (let i = 0; i < 14; i++) {
    const tw = cyl(0.03, 0.045, 1 + rnd() * 0.6, twigM, 19 + (rnd() - .5) * 1.9, 6.5, -5 + (rnd() - .5) * 1.9, cn, 6);
    tw.rotation.z = Math.PI / 2 + (rnd() - .5) * 1.0;
    tw.rotation.y = rnd() * Math.PI;
  }
  // ---- 巨型乌鸦 ----
  const cr = P('crow', gRoof);
  const crowM = M(0x14141c, { rough: 1 });
  sph(0.42, crowM, 19, 7.15, -5, cr, 1, 0.85, 1.4);
  sph(0.24, crowM, 19, 7.5, -4.35, cr);
  const beak = cone(0.1, 0.34, M(0x6e5a2e, { rough: 0.8 }), 19, 7.46, -4.02, cr, 8);
  beak.rotation.x = -Math.PI / 2 - 0.25;
  box(0.34, 0.09, 0.8, crowM, 19, 7.1, -5.65, cr);
  const wingL = box(0.1, 0.5, 0.9, crowM, 18.55, 7.2, -5, cr); wingL.rotation.z = 0.35;
  const wingR = box(0.1, 0.5, 0.9, crowM, 19.45, 7.2, -5, cr); wingR.rotation.z = -0.35;
  // 乌鸦收集的亮闪闪
  const shinies = [0xffd76a, 0x6ab8ff, 0xff6a9a];
  shinies.forEach((cc, i) => {
    const s = sph(0.08, M(cc, { emissive: cc, ei: 1.4, rough: 0.3 }), 18.5 + i * 0.45, 6.6, -4.6 + (i % 2) * 0.35, cr, 8);
    s.castShadow = false;
  });
})();

/* ============ 地下层：石阶 / 防火女囚室 / 小隆德升降机 ============ */
(function buildUnderground() {
  // ---- 地下石阶（广场南边向下） ----
  const st = P('stairs', gUnder);
  for (let i = 0; i < 12; i++)
    box(3, 0.32, 0.62, stoneDark, 3, -0.16 - i * 0.29, 8.6 + i * 0.58, st);
  // 阶梯侧墙
  wallSeg(1.4, 8.4, 1.4, 15.6, -3.8, 1.2, 0.4, stoneDark, st);
  wallSeg(4.6, 8.4, 4.6, 15.6, -3.8, 1.2, 0.4, stoneDark, st);
  // 劳伦缇斯（楼梯口）
  const lz = P('laurentius', gGarden);
  figure(-2, 0, 10.5, lz, { cloak: 0x4e5a3a, hood: true, sitting: true, ry: 1.2 });

  const UF = -3.5; // 地下层地面
  // 地下层地板
  box(26, 0.4, 24, stoneDark, 2, UF - 0.2, 20, st);
  // 地下层四周围墙（东墙可隐藏）
  const uwE = new THREE.Group(); gUnder.add(uwE); underCut.east = uwE;
  const dirtM = extM(0x6a5a48, { rough: 1 });
  wallSeg(-10, 8.5, -10, 31.5, UF, 3.5, 0.6, stoneDark, st);
  wallSeg(14, 8.5, 14, 31.5, UF, 3.5, 0.6, dirtM, uwE);
  wallSeg(-10, 31.5, 14, 31.5, UF, 3.5, 0.6, stoneDark, st);

  // ---- 防火女囚室 ----
  const fk = P('firekeeper', gUnder);
  wallSeg(5, 15, 11, 15, UF, 3, 0.5, stoneDark, fk);       // 北墙（栅栏段在中间）
  ironBars(6, 10, UF, UF + 2.6, 15, fk);                    // 铁栅栏
  wallSeg(5, 15, 5, 21, UF, 3, 0.5, stoneDark, fk);        // 西墙
  wallSeg(11, 15, 11, 21, UF, 3, 0.5, stoneDark, fk);      // 东墙
  wallSeg(5, 21, 11, 21, UF, 3, 0.5, stoneDark, fk);       // 南墙
  box(6.5, 0.3, 6.5, stoneDark, 8, UF + 3.15, 18, fk);    // 囚室顶
  // 安娜斯塔西娅蜷缩剪影
  const anM = M(0x3a3630, { rough: 1 });
  sph(0.3, anM, 8, UF + 0.3, 18.2, fk, 1, 0.75, 1.2);
  sph(0.14, anM, 8, UF + 0.62, 17.6, fk);
  box(0.5, 0.18, 0.9, anM, 8, UF + 0.12, 18.9, fk, 0.3);
  // 蜡烛
  cyl(0.05, 0.06, 0.3, M(0xd8cfc0, { rough: 0.8 }), 6.6, UF + 0.15, 16.8, fk, 8);
  const cf = sph(0.045, M(0xffc860, { emissive: 0xffa020, ei: 2.2 }), 6.6, UF + 0.36, 16.8, fk, 8);
  cf.castShadow = false;
  const cl = new THREE.PointLight(0xffa040, 6, 7, 2);
  cl.position.set(6.6, UF + 0.8, 16.8); fk.add(cl);
  // 稻草堆
  for (let i = 0; i < 5; i++)
    cyl(0.02, 0.02, 0.7, M(0x8a7a4e, { rough: 1 }), 8.8 + (rnd() - .5) * 0.8, UF + 0.05, 19 + (rnd() - .5) * 0.8, fk, 5).rotation.z = Math.PI / 2;

  // ---- 洛特里克 ----
  const lt = P('lautrec', gUnder);
  figure(0.5, UF, 16.5, lt, { cloak: 0x8a7a3a, hood: false, bald: false, ry: -0.6 });
  box(0.5, 0.9, 0.12, M(0x9a8a4a, { metal: 0.4, rough: 0.5 }), 0.5, UF + 0.75, 16.1, lt); // 金甲胸

  // ---- 小隆德升降机 ----
  const el = P('elevator', gUnder);
  const ECX = 3, ECZ = 26, ER = 3.4;
  // 八角竖井壁
  for (let i = 0; i < 8; i++) {
    const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2;
    wallSeg(ECX + Math.cos(a0) * ER, ECZ + Math.sin(a0) * ER, ECX + Math.cos(a1) * ER, ECZ + Math.sin(a1) * ER, UF, 3.2, 0.5, stoneDark, el);
  }
  box(ER * 2 + 1.4, 0.5, ER * 2 + 1.4, stoneDark, ECX, UF + 3.4, ECZ, el); // 井口框
  // 深渊
  const abyss = cyl(ER - 0.3, ER - 0.3, 12, M(0x040405, { rough: 1 }), ECX, UF - 6, ECZ, el, 16);
  abyss.castShadow = false;
  // 大木平台
  const woodM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  box(4.6, 0.35, 4.6, woodM, ECX, UF - 3.5, ECZ, el);
  box(4.6, 0.5, 0.3, woodM, ECX, UF - 3.1, ECZ - 2.2, el);
  box(4.6, 0.5, 0.3, woodM, ECX, UF - 3.1, ECZ + 2.2, el);
  // 铁链
  const chM = M(0x2c2c30, { metal: 0.6, rough: 0.5 });
  for (const [cx, cz] of [[ECX - 1.8, ECZ - 1.8], [ECX + 1.8, ECZ - 1.8], [ECX - 1.8, ECZ + 1.8], [ECX + 1.8, ECZ + 1.8]])
    cyl(0.06, 0.06, 3.4, chM, cx, UF - 1.6, cz, el, 6);
  // 机关踏板 + 拉杆
  box(1.2, 0.12, 0.8, woodM, ECX, UF + 0.06, ECZ - 4.4, el);
  cyl(0.05, 0.05, 1.4, chM, ECX + 2.8, UF + 0.7, ECZ - 4.2, el, 6);
  sph(0.09, woodM, ECX + 2.8, UF + 1.45, ECZ - 4.2, el, 8);

  // ---- 地下层顶盖（土丘，under 视角隐藏） ----
  const cap = new THREE.Group(); gUnder.add(cap); underCut.ceiling = cap;
  const rockM = extM(0xffffff, { map: ashTex, rough: 1 });
  // 楼梯口留洞 x[1,5], z[8,16]
  box(13, 0.7, 8, rockM, -3.5, -0.35, 12, cap);
  box(9, 0.7, 8, rockM, 9.5, -0.35, 12, cap);
  box(26, 0.7, 17, rockM, 2, -0.35, 24.5, cap);
  const grassTop = extM(0xffffff, { map: grassTex, rough: 1 });
  box(13, 0.08, 8, grassTop, -3.5, 0.04, 12, cap).castShadow = false;
  box(9, 0.08, 8, grassTop, 9.5, 0.04, 12, cap).castShadow = false;
  box(26, 0.08, 17, grassTop, 2, 0.04, 24.5, cap).castShadow = false;
})();

/* ============ 水道桥（西） ============ */
(function buildAqueduct() {
  const aq = P('aqueduct', gMain);
  // 上桥石阶
  for (let i = 0; i < 10; i++)
    box(0.62, 0.32, 3, stoneDark, -8.4 - i * 0.58, 0.16 + i * 0.3, 2, aq);
  // 桥墩 + 拱
  const piers = [-15, -19, -23, -27, -31];
  for (const px of piers) {
    box(1.8, 8, 3.4, stoneMat, px, 4, 2, aq);
    box(2.4, 0.6, 4, stoneMat, px, 0.3, 2, aq); // 墩础
  }
  for (let i = 0; i < piers.length - 1; i++) {
    const mid = (piers[i] + piers[i + 1]) / 2;
    const t = new THREE.Mesh(new THREE.TorusGeometry(2, 0.55, 8, 18, Math.PI), stoneMat);
    t.position.set(mid, 5.2, 2);
    t.rotation.y = Math.PI / 2;
    t.castShadow = t.receiveShadow = true;
    aq.add(t); tagPart(t, aq);
  }
  // 桥面
  box(20, 0.5, 2.8, stoneMat, -23, 8.25, 2, aq);
  // 栏杆
  for (let i = 0; i <= 10; i++) {
    box(0.14, 0.9, 0.14, stoneDark, -32.5 + i * 1.9, 8.95, 0.75, aq);
    box(0.14, 0.9, 0.14, stoneDark, -32.5 + i * 1.9, 8.95, 3.25, aq);
  }
  box(19.5, 0.12, 0.16, stoneDark, -23, 9.45, 0.75, aq);
  box(19.5, 0.12, 0.16, stoneDark, -23, 9.45, 3.25, aq);
  // 桥身苔斑
  const mossM = M(0x4a5e34, { rough: 1 });
  for (let i = 0; i < 8; i++) {
    const m = box(0.5 + rnd(), 0.4, 0.1, mossM, -15 - rnd() * 15, 2 + rnd() * 4, 2 + (rnd() > .5 ? 1.75 : -1.75), aq);
    m.castShadow = false;
  }

  // ---- 牺牲戒指 ----
  const rg = P('ring', gMain);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 18), M(0xd8b04a, { metal: 0.7, rough: 0.3, emissive: 0x6a4a10, ei: 0.8 }));
  band.position.set(-23, 8.85, 2); band.rotation.x = Math.PI / 2.3;
  band.castShadow = false;
  rg.add(band); tagPart(band, rg);
  const glow = sph(0.3, M(0xffd76a, { emissive: 0xffb020, ei: 1.2, transparent: true, opacity: 0.35 }), -23, 8.85, 2, rg, 8);
  glow.castShadow = false;

  // ---- 水道桥入口（黑暗廊道） ----
  const en = P('aqua-entry', gMain);
  wallSeg(-33, 0.4, -33, 3.6, 8, 3, 0.8, stoneMat, en);
  wallSeg(-39, 0.4, -39, 3.6, 8, 3, 0.8, stoneMat, en);
  box(6.8, 0.8, 4, stoneMat, -36, 11.2, 2, en); // 廊顶
  box(6.8, 0.4, 4, stoneDark, -36, 7.9, 2, en); // 廊底
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3), M(0x030304, { rough: 1 }));
  dark.position.set(-38.9, 9.5, 2); dark.rotation.y = Math.PI / 2; en.add(dark); tagPart(dark, en);
  // 下水道老鼠
  const ratM = M(0x2a2622, { rough: 1 });
  sph(0.22, ratM, -36.5, 8.35, 1.4, en, 1.4, 0.8, 1);
  sph(0.12, ratM, -36.1, 8.45, 1.4, en);
  const tail = cyl(0.02, 0.03, 0.8, ratM, -37.1, 8.3, 1.5, en, 5);
  tail.rotation.z = Math.PI / 2; tail.rotation.y = 0.5;
  // 尸体
  box(0.4, 0.25, 1.0, M(0x4c4438, { rough: 1 }), -37, 8.25, 2.6, en, 0.4);

  // ---- 多姆纳尔（桥头） ----
  const dm = P('domhnall', gGarden);
  figure(-9.5, 0, 6.5, dm, { cloak: 0x5c4a6a, hood: true, ry: 2.2 });
  box(1.2, 0.7, 0.8, M(0xffffff, { map: darkWoodTex, rough: 0.9 }), -10.6, 0.35, 6.5, dm); // 货箱
})();

/* ============ 墓地山丘（北） ============ */
(function buildGraveyard() {
  const gv = P('graves', gMain);
  // 三级台地
  const terraces = [
    { z0: -16, z1: -13, top: 1.0 },
    { z0: -21, z1: -16, top: 2.2 },
    { z0: -27, z1: -21, top: 3.4 },
  ];
  for (const t of terraces) {
    const h = t.top, d = t.z1 - t.z0;
    box(20, h, d, stoneDark, 0, h / 2, (t.z0 + t.z1) / 2, gv);
    // 挡土墙（南面）
    box(20, h + 0.5, 0.5, stoneMat, 0, (h + 0.5) / 2 - 0.2, t.z1 + 0.1, gv);
    const gt = M(0xffffff, { map: grassTex, rough: 1 });
    const gr = box(20, 0.08, d, gt, 0, h + 0.02, (t.z0 + t.z1) / 2, gv);
    gr.castShadow = false;
  }
  // 台地间石阶
  for (let i = 0; i < 3; i++) box(2, 0.35, 1.1, stoneDark, 0, 0.9 - i * 0.05 + (i > 0 ? 1.1 : 0), -13.2 - i * 0.1, gv);
  box(2, 0.4, 1.2, stoneDark, 0, 2.0, -16.4, gv);
  box(2, 0.4, 1.2, stoneDark, 0, 3.2, -21.4, gv);
  // 墓碑（高低错落、歪斜）
  const spots = [
    [-6, 1.0, -14.5, 1.1], [-2.5, 1.0, -15, 0.9], [2, 1.0, -14.2, 1.2], [6, 1.0, -15.2, 0.8],
    [-7, 2.2, -18, 1.0], [-3, 2.2, -17.5, 1.3], [1.5, 2.2, -19, 0.9], [5.5, 2.2, -18.2, 1.1], [8, 2.2, -19.5, 0.8],
    [-6, 3.4, -23, 1.2], [-3.5, 3.4, -24.5, 0.9], [2, 3.4, -23.5, 1.0], [5, 3.4, -25, 1.25], [7.5, 3.4, -22.5, 0.85],
  ];
  for (const [x, y, z, s] of spots) tombstone(x, y, z, s, gv);
  rubble(-4, 2.2, -20, gv, 8, 3); rubble(4, 3.4, -24, gv, 8, 3);

  // ---- 骷髅战士 ----
  const sk = P('skeletons', gMain);
  skeleton(-3, 2.2, -17.5, 0.7, sk, true);
  skeleton(4.5, 1.0, -14.8, -1.2, sk, false);
  skeleton(1, 3.4, -25.5, 2.6, sk, true);

  // ---- 大剑之冢 ----
  const zw = P('zweihander', gMain);
  const blade = box(0.22, 3.1, 0.05, M(0x9aa0a8, { metal: 0.7, rough: 0.35 }), -2, 4.6, -24, zw);
  blade.rotation.z = 0.28; blade.rotation.x = -0.12;
  const cg = box(0.9, 0.12, 0.14, M(0x6e5a34, { metal: 0.5, rough: 0.5 }), -2.42, 6.05, -24.2, zw);
  cg.rotation.z = 0.28;
  sph(0.11, M(0x6e5a34, { metal: 0.5, rough: 0.5 }), -2.55, 6.35, -24.25, zw);
  // 坟堆
  const mound = sph(1.1, M(0x4a463e, { rough: 1 }), -2, 3.5, -24, zw, 1, 0.35, 1);
  mound.castShadow = false;
  // 翼枪 / 卡杜斯圆盾 / 望远镜（拾取点）
  const spear = cyl(0.03, 0.03, 1.9, M(0x6e4f2e, { rough: 0.8 }), 3.2, 4.1, -23, zw, 6);
  spear.rotation.z = 1.1;
  cone(0.07, 0.3, M(0x9aa0a8, { metal: 0.6, rough: 0.4 }), 4.0, 4.5, -23, zw, 6).rotation.z = -1.1;
  const sh = cyl(0.35, 0.35, 0.06, M(0x8a6a3a, { metal: 0.4, rough: 0.5 }), -5, 3.85, -22.5, zw, 12);
  sh.rotation.x = 0.4;
  cyl(0.06, 0.08, 0.35, M(0x3a3a40, { metal: 0.5, rough: 0.4 }), 6.5, 3.7, -24.5, zw, 8).rotation.z = 1.35;

  // ---- 地下墓地入口 ----
  const ct = P('catacombs', gMain);
  wallSeg(-4, -27.5, 4, -27.5, 3.4, 4.5, 1.2, stoneMat, ct);
  arch(3.2, ct, 0, 4.6, -27.5, 0, 9);
  box(0.55, 1.5, 0.55, stoneMat, -1.75, 4.05, -27.5, ct);
  box(0.55, 1.5, 0.55, stoneMat, 1.75, 4.05, -27.5, ct);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.2), M(0x020203, { rough: 1 }));
  dark.position.set(0, 5.2, -27.4); ct.add(dark); tagPart(dark, ct);
  dark.castShadow = false;
  // 门前骷髅守卫
  skeleton(-2.2, 3.4, -26, 0.4, ct, false);
  skeleton(2.2, 3.4, -26, -0.5, ct, false);
})();

/* ============ 被水淹的遗迹 + 大蛇之坑 ============ */
(function buildFlooded() {
  const fl = P('flooded', gMain);
  box(12.5, 0.5, 5.5, stoneDark, 0, -1.05, -10.5, fl); // 池底
  const water = new THREE.Mesh(new THREE.PlaneGeometry(12, 5),
    M(0x2a4a5a, { transparent: true, opacity: 0.72, rough: 0.15, metal: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.35, -10.5);
  water.receiveShadow = true; fl.add(water); tagPart(water, fl);
  // 残墙露出水面
  brokenWall(-5.5, -12.5, -2, -12.5, -0.8, 1.6, 0.6, stoneMat, fl);
  brokenWall(2, -8.5, 5.5, -8.5, -0.8, 1.8, 0.6, stoneMat, fl);
  box(0.8, 1.2, 0.8, stoneMat, -4, -0.4, -9.5, fl, 0.4);
  box(0.7, 0.9, 0.7, stoneMat, 4.5, -0.5, -11.5, fl, 1.1);
  // 倒塌的柱子横在水面
  const fc = cyl(0.4, 0.4, 4.5, stoneMat, 0, -0.1, -10.5, fl, 10);
  fc.rotation.z = Math.PI / 2; fc.rotation.y = 0.25;

  // ---- 大蛇之坑 ----
  const fr = P('frampt', gMain);
  const pit = cyl(1.3, 1.1, 0.6, M(0x060708, { rough: 1 }), 3.2, -0.7, -10.5, fr, 14);
  pit.castShadow = false;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    box(0.4, 0.3, 0.3, stoneDark, 3.2 + Math.cos(a) * 1.45, -0.5, -10.5 + Math.sin(a) * 1.45, fr, -a);
  }
  // 水面涟漪
  const rip = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 6, 20),
    M(0x6a8a9a, { transparent: true, opacity: 0.5, rough: 0.3 }));
  rip.position.set(3.2, -0.32, -10.5); rip.rotation.x = Math.PI / 2;
  rip.castShadow = false; fr.add(rip); tagPart(rip, fr);
})();

/* ============ 室外：枯树 / 木牌 / NPC / 灵魂光点 ============ */
(function buildYard() {
  const dt = P('deadtrees', gGarden);
  deadTree(-14, 8, 1.2, dt); deadTree(15, 12, 1.0, dt);
  deadTree(-7, -15, 0.9, dt); deadTree(27, 7, 1.1, dt);
  deadTree(33, -6, 0.8, dt);

  // ---- 岔路木牌 ----
  const sg = P('signs', gGarden);
  const postM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  cyl(0.09, 0.11, 2.2, postM, 4.5, 1.1, 6.5, sg, 8);
  const signs = [
    ['城外不死镇 →', 0.5, 1.75, 0.5],
    ['← 地下墓地', -0.5, 1.45, -0.5],
    ['小隆德遗迹 ↓', 0, 1.15, 0],
  ];
  for (const [txt, ox, oy, ry] of signs) {
    const arm = box(1.7, 0.32, 0.08, M(0xffffff, { map: signTex(txt), rough: 0.9 }), 4.5 + ox, oy, 6.5, sg, ry);
    arm.castShadow = true;
  }

  // ---- 帕奇斯 ----
  const pa = P('patches', gGarden);
  figure(-11, 0, -2.5, pa, { cloak: 0x6e5a3a, hood: false, bald: true, sitting: true, ry: 1.9 });

  // ---- 洋葱骑士 ----
  const sm = P('siegmeyer', gGarden);
  const onionM = M(0x8a8a90, { metal: 0.3, rough: 0.6 });
  sph(0.42, onionM, 3, 0.5, 4.8, sm);
  sph(0.16, M(0xb99a78, { rough: 0.9 }), 3, 0.95, 4.9, sm);
  box(0.2, 0.5, 0.2, onionM, 2.7, 0.25, 5.2, sm);
  box(0.2, 0.5, 0.2, onionM, 3.3, 0.25, 5.2, sm);

  // ---- 灵魂光点 ----
  const wp = P('wisps', gGarden);
  const wispM = M(0x6affa0, { emissive: 0x2aff70, ei: 1.8, transparent: true, opacity: 0.85, rough: 0.3 });
  const wispSpots = [
    [-3, -14], [2, -12], [-6, -17], [5, -15], [10, -6],
    [-9, 4], [12, 8], [-12, -8], [20, -6], [6, 12],
  ];
  for (const [x, z] of wispSpots) {
    const gy = z < -13 ? (z < -21 ? 3.9 : z < -16 ? 2.7 : 1.5) : 0.5;
    const w = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), wispM);
    w.position.set(x + (rnd() - .5), gy + 0.6 + rnd() * 0.8, z + (rnd() - .5));
    w.castShadow = false; wp.add(w); tagPart(w, wp);
    embers.push({ m: w, sp: 0.25 + rnd() * 0.3, ph: rnd() * 6.28, wisp: true });
  }
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
  if (groundMesh) groundMesh.visible = (m !== 'under');
  const xray = (m === 'xray');
  extMats.forEach(mt => { mt.transparent = xray; mt.opacity = xray ? 0.15 : 1; mt.depthWrite = !xray; mt.needsUpdate = true; });
  if (m === 'exterior') flyTo(V(17, 11, 21), V(0, 1, 0));
  if (m === 'main') flyTo(V(11, 9, 15), V(2, 1, -1));
  if (m === 'under') flyTo(V(13, 0.5, 12), V(4, -2.5, 20));
  if (m === 'xray') flyTo(V(17, 12, 19), V(2, 0, 2));
}
document.querySelectorAll('.vbtn').forEach(b => b.onclick = () => setMode(b.dataset.view));

// 开关
const tLabels = document.getElementById('tLabels');
tLabels.onclick = () => { labelsOn = !labelsOn; tLabels.classList.toggle('on', labelsOn); };
const tRotate = document.getElementById('tRotate');
tRotate.onclick = () => { controls.autoRotate = !controls.autoRotate; tRotate.classList.toggle('on', controls.autoRotate); };
document.getElementById('explode').addEventListener('input', e => {
  const t = e.target.value / 100;
  gRoof.position.y = 6 * t;
  gMain.position.y = 3 * t;
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
const LAYERSUFFIX = { roof: ' · 穹顶', main: ' · 遗迹', under: ' · 地下层', garden: ' · 室外' };
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

// 自适应（手机端修复：统一用 onResize + 零值保护，不写死 296）
function onResize() {
  viewW = view.clientWidth; viewH = view.clientHeight;
  if (viewW < 2 || viewH < 2) return;
  renderer.setSize(viewW, viewH);
  camera.aspect = viewW / viewH;
  camera.fov = viewW < viewH ? 62 : 48; // 竖屏拉开视野
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

// 主循环（篝火闪烁 + 余烬上升）
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (fireLight) fireLight.intensity = 42 + Math.sin(t * 13) * 5 + Math.sin(t * 7.3) * 4;
  if (flame1) { flame1.scale.y = 1 + Math.sin(t * 11) * 0.12; flame1.rotation.y = t * 1.5; }
  if (flame2) { flame2.scale.y = 1 + Math.sin(t * 15 + 1) * 0.15; }
  for (const e of embers) {
    e.m.position.y += e.sp * 0.03;
    e.m.position.x += Math.sin(t * 2 + e.ph) * 0.008;
    if (e.wisp) {
      e.m.position.y += Math.sin(t * 1.5 + e.ph) * 0.004;
      if (e.m.position.y > 3.2) e.m.position.y = 0.8;
    } else if (e.m.position.y > 4.2) {
      e.m.position.y = 0.4;
      e.m.position.x = (rnd() - .5) * 1.2;
      e.m.position.z = 1.5 + (rnd() - .5) * 1.2;
    }
  }
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
