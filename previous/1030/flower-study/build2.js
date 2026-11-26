// 꽃형 구도 스터디 2: 모든 원이 가운데(나)를 지난다
// ① 같은 나, 여러 사람: 사람의 원들이 모두 나를 지나고, 이웃한 두 원의 겹침이 잎
// ② 관계마다 다른 나: 관계 하나 = 나의 원 + 상대의 원 한 쌍, 그 겹침이 잎 하나
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const S = 900;
const C = S / 2;
const FONT = 'Pretendard';
const rad = (d) => (d * Math.PI) / 180;

// 가운데를 지나는 원: 중심이 가운데에서 반지름만큼 떨어져 있다
const through = (deg, r, color) => ({ x: C + Math.cos(rad(deg)) * r, y: C + Math.sin(rad(deg)) * r, r, deg, color });

function circlePath(ctx, c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
}

function light(ctx, cs, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const c of cs) {
    circlePath(ctx, c);
    ctx.fillStyle = c.color ? hexA(c.color, alpha) : `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function fillLens(ctx, a, b, color) {
  ctx.save();
  circlePath(ctx, a);
  ctx.clip();
  circlePath(ctx, b);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function strokeLens(ctx, a, b, color, width) {
  for (const [p, q] of [[a, b], [b, a]]) {
    ctx.save();
    circlePath(ctx, q);
    ctx.clip();
    circlePath(ctx, p);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }
}

function text(ctx, s, x, y, size, color, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function panel(draw, caption) {
  const cv = createCanvas(S, S + 90);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, S, S + 90);
  draw(ctx);
  text(ctx, caption, S / 2, S + 50, 30, '#bbb');
  return cv;
}

// ① 같은 나, 여러 사람: 원 크기는 사람마다 다르지만 모두 나를 지난다
const PEOPLE = [[-90, 190], [-38, 150], [8, 205], [62, 165], [118, 185], [170, 140], [222, 200]];
const one = PEOPLE.map(([d, r]) => through(d, r));

// ② 관계마다 다른 나: [축 각도, 가까움(작을수록 가깝다, 도), 상대 반지름, 상대 색, 이름]
const ME = '#5DCAA5';
const RELS = [
  [-90, 28, 200, '#F0997B', '가족'],
  [-18, 40, 175, '#FAC775', '친구'],
  [54, 52, 190, '#85B7EB', '동료'],
  [126, 66, 160, '#AFA9EC', '지나간 인연'],
  [198, 46, 170, '#ED93B1', '연인'],
];
const R_ME = 190;
const pairs = RELS.map(([axis, gap, r, color, name]) => ({
  me: through(axis - gap, R_ME, ME),
  other: through(axis + gap, r, color),
  axis, name, color,
}));

// E. ① 빛
const E = panel((ctx) => light(ctx, one, 0.2), 'E  ① 같은 나, 여러 사람: 모든 원이 나를 지난다');

// F. ② 빛
const F = panel((ctx) => light(ctx, pairs.flatMap((p) => [p.me, p.other]), 0.17), 'F  ② 관계마다 다른 나: 원 한 쌍 = 관계 하나');

// G. ② 색: 나 = 청록, 상대마다 다른 색, 잎 = 섞인 색
const G = panel((ctx) => {
  light(ctx, pairs.flatMap((p) => [p.me, p.other]), 0.1);
  for (const p of pairs) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    fillLens(ctx, p.me, p.other, hexA(ME, 0.35));
    fillLens(ctx, p.me, p.other, hexA(p.color, 0.45));
    ctx.restore();
  }
  for (const p of pairs) {
    // 잎 끝 바깥에 이름
    const gap = Math.abs(rad((p.other.deg - p.me.deg) / 2));
    const len = Math.min(p.me.r, p.other.r) * 2 * Math.cos(gap);
    const t = rad(p.axis);
    text(ctx, p.name, C + Math.cos(t) * (len + 34), C + Math.sin(t) * (len + 34), 26, p.color);
  }
}, 'G  ② 색으로 보면: 잎마다 나의 색과 그 사람의 색이 섞인다');

// H. ② 구조: 한 관계만 강조
const H = panel((ctx) => {
  const all = pairs.flatMap((p) => [p.me, p.other]);
  light(ctx, all, 0.05);
  const p = pairs[0];
  for (const c of all) {
    circlePath(ctx, c);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  circlePath(ctx, p.me);
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = ME;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.setLineDash([]);
  circlePath(ctx, p.other);
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  fillLens(ctx, p.me, p.other, 'rgba(255,255,255,0.35)');
  strokeLens(ctx, p.me, p.other, '#fff', 3);
  ctx.beginPath();
  ctx.arc(C, C, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  text(ctx, '나', C + 26, C + 4, 24, '#fff');
  text(ctx, '그 관계 속의 나', p.me.x - 150, p.me.y - 40, 24, ME);
  text(ctx, '가족', p.other.x + 120, p.other.y - 40, 24, p.color);
  text(ctx, '잎 = 사랑', C, C - 300, 26, '#fff');
}, 'H  한 관계: 잎의 한쪽은 나, 다른 쪽은 상대가 그린다');

const sheet = createCanvas(S * 2, (S + 90) * 2);
const sx = sheet.getContext('2d');
[[E, 0, 0], [F, S, 0], [G, 0, S + 90], [H, S, S + 90]].forEach(([cv, x, y]) => sx.drawImage(cv, x, y));
fs.writeFileSync(path.join(__dirname, 'study_sheet2.png'), sheet.toBuffer('image/png'));
console.log('done');
