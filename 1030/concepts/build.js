// A · B · C안 예시 이미지: node build.js (scratchpad의 @napi-rs/canvas 사용)
const path = require('path');
const fs = require('fs');
const { createCanvas, Path2D } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const W = 1000, H = 1250;
const rad = (d) => (d * Math.PI) / 180;
const out = (name, cv) => fs.writeFileSync(path.join(__dirname, name), cv.toBuffer('image/png'));

// 결정적인 난수 (같은 그림이 다시 나오도록)
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

// ───────── A안: 흐린 잎 = 나의 페르소나, 흰 잎 = 타인(중심에서 살짝 떨어짐), 진한 겹침 = 사랑
function conceptA() {
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const C = W / 2, CY = 640;
  const ell = (e) => { ctx.beginPath(); ctx.ellipse(e.x, e.y, e.a, e.b, e.rot, 0, Math.PI * 2); };
  const inside = (e, px, py, m) => {
    const dx = px - e.x, dy = py - e.y, c = Math.cos(-e.rot), s = Math.sin(-e.rot);
    const x = dx * c - dy * s, y = dx * s + dy * c;
    return (x * x) / ((e.a + m) ** 2) + (y * y) / ((e.b + m) ** 2) <= 1;
  };
  const mine = [[-76, 560, 230], [-16, 430, 250], [196, 410, 205], [124, 400, 250], [92, 360, 220], [38, 380, 200]]
    .map(([d, L, w]) => ({ x: C + Math.cos(rad(d)) * L / 2, y: CY + Math.sin(rad(d)) * L / 2, a: L / 2, b: w / 2, rot: rad(d) }));
  const others = [[-92, 245, 230, 72, -90], [-50, 215, 205, 205, 0], [180, 175, 190, 86, 4], [150, 270, 230, 170, -30], [30, 230, 205, 145, 32], [5, 300, 180, 150, 10]]
    .map(([d, dist, a, b, tilt]) => {
      let e;
      do { e = { x: C + Math.cos(rad(d)) * dist, y: CY + Math.sin(rad(d)) * dist, a, b, rot: rad(tilt) }; dist += 4; } while (inside(e, C, CY, 30));
      return e;
    });
  const layer = createCanvas(W, H), lx = layer.getContext('2d');
  lx.fillStyle = '#ff8a8a';
  mine.forEach((m) => { lx.beginPath(); lx.ellipse(m.x, m.y, m.a, m.b, m.rot, 0, Math.PI * 2); lx.fill(); });
  ctx.globalAlpha = 0.32; ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1;
  mine.forEach((m) => others.forEach((o) => {
    ctx.save(); ell(m); ctx.clip(); ell(o); ctx.fillStyle = 'rgba(245,70,70,0.42)'; ctx.fill(); ctx.restore();
  }));
  others.forEach((o) => { ell(o); ctx.strokeStyle = 'rgba(225,90,90,0.55)'; ctx.lineWidth = 1.6; ctx.stroke(); });
  mine.forEach((m) => { ell(m); ctx.strokeStyle = 'rgba(225,90,90,0.25)'; ctx.lineWidth = 1; ctx.stroke(); });
  return cv;
}

// ───────── B안: 투명한 잎맥 잎들이 겹친다. 굵은 가운데 줄기는 남고 가는 결은 섞인다
function leafOutline(len, width) {
  const pts = [];
  // 밑동 쪽이 넓은 달걀꼴 잎
  const half = (u) => width * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.75);
  for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([u * len, -half(u)]); }
  for (let i = 60; i >= 0; i--) { const u = i / 60; pts.push([u * len, half(u)]); }
  return { pts, half };
}
function drawLeaf(ctx, leaf, rand) {
  const { x, y, deg, len, width, tone } = leaf;
  const { pts, half } = leafOutline(len, width);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rad(deg));
  const p = new Path2D();
  pts.forEach(([px, py], i) => (i ? p.lineTo(px, py) : p.moveTo(px, py)));
  p.closePath();
  ctx.fillStyle = `rgba(${tone},0.07)`; ctx.fill(p);
  ctx.strokeStyle = `rgba(${tone},0.45)`; ctx.lineWidth = 1.1; ctx.stroke(p);
  ctx.save(); ctx.clip(p);
  // 가는 결(3차 맥): 잔 그물
  ctx.strokeStyle = `rgba(${tone},0.11)`; ctx.lineWidth = 0.6;
  for (let i = 0; i < 1100; i++) {
    const u = rand(), side = rand() < 0.5 ? -1 : 1, v = rand() * half(u) * side;
    const a = rand() * Math.PI, l = 4 + rand() * 7;
    ctx.beginPath(); ctx.moveTo(u * len, v); ctx.lineTo(u * len + Math.cos(a) * l, v + Math.sin(a) * l); ctx.stroke();
  }
  // 곁맥: 가운데 줄기에서 가장자리로
  ctx.strokeStyle = `rgba(${tone},0.5)`; ctx.lineWidth = 1.4;
  for (let u = 0.08; u < 0.86; u += 0.075) {
    for (const s of [-1, 1]) {
      const u2 = Math.min(0.96, u + 0.14), edge = half(u2) * s * 0.9;
      ctx.beginPath(); ctx.moveTo(u * len, 0);
      ctx.quadraticCurveTo((u + 0.03) * len, edge * 0.6, u2 * len, edge); ctx.stroke();
    }
  }
  ctx.restore();
  // 굵은 가운데 줄기: 밑동에서 굵고 끝으로 가늘어진다. 잎 끝을 넘지 않는다
  ctx.strokeStyle = `rgba(${tone},0.9)`; ctx.lineCap = 'round';
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const u0 = i / steps * 0.94, u1 = (i + 1) / steps * 0.94;
    ctx.lineWidth = 4.6 * (1 - u0) + 0.8;
    ctx.beginPath(); ctx.moveTo(u0 * len, 0); ctx.lineTo(u1 * len, 0); ctx.stroke();
  }
  ctx.lineWidth = 4.6;
  ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(0, 0); ctx.stroke();
  ctx.restore();
}
function conceptB() {
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = '#fbfaf8'; ctx.fillRect(0, 0, W, H);
  const rand = rng(7);
  // 한 점에 모이지 않게, 흩어 쌓은 더미처럼 놓는다. 화면 밖으로 넘쳐도 된다
  const leaves = [
    { x: -60, y: 260, deg: 14, len: 620, width: 200, tone: '70,64,58' },
    { x: 1080, y: 120, deg: 148, len: 600, width: 190, tone: '86,74,66' },
    { x: 160, y: 1180, deg: -48, len: 640, width: 210, tone: '60,60,62' },
    { x: 1040, y: 820, deg: -160, len: 620, width: 200, tone: '92,80,72' },
    { x: 560, y: 1320, deg: -96, len: 600, width: 185, tone: '66,62,60' },
    { x: 380, y: -80, deg: 72, len: 580, width: 180, tone: '78,70,64' },
    { x: -40, y: 760, deg: -14, len: 560, width: 175, tone: '74,68,62' },
  ];
  leaves.forEach((l) => drawLeaf(ctx, l, rand));
  return cv;
}

// ───────── C안: 다른 사람들의 부분이 반투명하게 겹쳐 한 사람(나)의 얼굴이 된다
const HEAD = 'M 230 1250 C 240 1120 300 1060 395 1030 L 400 940 C 362 934 332 918 324 892 C 318 870 332 860 324 842 C 312 830 320 814 312 802 C 300 790 296 776 300 762 C 284 750 268 738 278 720 C 292 694 302 672 302 650 C 298 606 300 560 312 528 C 344 428 446 384 528 394 C 632 404 694 490 684 598 C 678 684 642 748 612 792 C 600 858 612 922 652 984 C 732 1048 812 1090 852 1250 Z';
function conceptC() {
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const head = new Path2D(HEAD);
  ctx.save(); ctx.translate(20, -60);
  ctx.fillStyle = '#f4f2ef'; ctx.fill(head);
  ctx.save(); ctx.clip(head);
  ctx.globalCompositeOperation = 'multiply';
  // [x, y, 반지름 x, 반지름 y, 기울기, 색] 각자 다른 사람이 남긴 부분: 눈매 · 입 · 이마 · 뺨 · 목과 어깨 · 머리
  const parts = [
    [330, 690, 120, 70, -10, '232,140,120'],
    [345, 840, 110, 80, 12, '240,190,110'],
    [420, 520, 190, 120, -18, '140,170,210'],
    [470, 760, 170, 150, 25, '170,150,210'],
    [560, 1080, 280, 170, -8, '150,195,170'],
    [600, 560, 150, 190, 30, '220,160,190'],
    [470, 960, 150, 120, -30, '210,180,150'],
  ];
  for (const [x, y, a, b, t, c] of parts) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(a, b));
    g.addColorStop(0, `rgba(${c},0.75)`); g.addColorStop(0.7, `rgba(${c},0.45)`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rad(t)); ctx.scale(a / Math.max(a, b), b / Math.max(a, b)); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Math.max(a, b), 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke(head);
  ctx.restore();
  return cv;
}

const A = conceptA(), B = conceptB(), Cc = conceptC();
out('A.png', A); out('B.png', B); out('C.png', Cc);
const sheet = createCanvas(W * 3 + 80, H + 140), sx = sheet.getContext('2d');
sx.fillStyle = '#fff'; sx.fillRect(0, 0, sheet.width, sheet.height);
[[A, 'A안 · 나를 이룬 잎들'],[B, 'B안 · 스며든 결'], [Cc, 'C안 · 겹쳐 그린 초상']].forEach(([cv, label], i) => {
  const x = i * (W + 40);
  sx.drawImage(cv, x, 0);
  sx.font = '500 40px Pretendard'; sx.fillStyle = '#555'; sx.textAlign = 'center';
  sx.fillText(label, x + W / 2, H + 85);
});
out('concepts_sheet.png', sheet);
console.log('done');
