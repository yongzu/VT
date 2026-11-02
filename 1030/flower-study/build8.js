// 점에서 뻗는 나의 타원 + 위치가 자유로운 타인의 타원, 겹친 자리 = 잎(사랑)
// 나의 타원: 한쪽 끝이 가운데 점에 붙어 바깥으로 뻗는다
// 타인의 타원: 나의 갈래를 가로지르게 기울이고 옆으로 비켜 놓는다. 가운데 점은 덮지 않는다
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const S = 900, C = S / 2;
const rad = (d) => (d * Math.PI) / 180;
const INK = '#333';
const FONT = 'Pretendard';

// [방향, 길이, 폭] 나의 갈래
const ME = [[-92, 300, 104], [-40, 240, 86], [5, 278, 98], [55, 226, 78], [112, 292, 110], [160, 210, 74], [212, 256, 92]];
// [갈래 위 위치(0~1), 옆으로 비킨 거리, 갈래 대비 기울기, 긴 반지름, 짧은 반지름] 타인
// v2: 타인의 타원은 갈래의 한쪽 옆구리에만 걸친다 → 잎이 뾰족한 렌즈가 된다
// [갈래 위 위치(0~1), 옆쪽(+1/-1), 갈래 대비 기울기, 긴 반지름, 짧은 반지름]
const OTHER = [[0.6, 1, 28, 150, 62], [0.62, -1, -32, 110, 50], [0.55, 1, 22, 170, 70], [0.7, -1, -26, 95, 44], [0.58, 1, 34, 160, 80], [0.66, -1, -24, 100, 46], [0.6, 1, 30, 125, 56]];

function ellipsePath(ctx, e) {
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.a, e.b, e.rot, 0, Math.PI * 2);
}
function inside(e, px, py, margin = 0) {
  const dx = px - e.x, dy = py - e.y, c = Math.cos(-e.rot), s = Math.sin(-e.rot);
  const x = dx * c - dy * s, y = dx * s + dy * c;
  return (x * x) / ((e.a + margin) ** 2) + (y * y) / ((e.b + margin) ** 2) <= 1;
}

const mine = ME.map(([deg, L, W]) => {
  const t = rad(deg);
  return { x: C + Math.cos(t) * L / 2, y: C + Math.sin(t) * L / 2, a: L / 2, b: W / 2, rot: t, deg, L };
});
const others = OTHER.map(([pos, sideSign, tilt, a, b], i) => {
  const side = sideSign * (mine[i].b + b * 0.35);
  const m = mine[i], t = rad(m.deg), n = t + Math.PI / 2;
  let p = pos, e;
  do {
    e = {
      x: C + Math.cos(t) * m.L * p + Math.cos(n) * side,
      y: C + Math.sin(t) * m.L * p + Math.sin(n) * side,
      a, b, rot: t + rad(tilt),
    };
    p += 0.02;
  } while (inside(e, C, C, 22));
  return e;
});

function dot(ctx) { ctx.beginPath(); ctx.arc(C, C, 9, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill(); }
function leaves(ctx, alpha = 0.8) {
  mine.forEach((m, i) => {
    ctx.save(); ellipsePath(ctx, m); ctx.clip(); ellipsePath(ctx, others[i]);
    ctx.fillStyle = `rgba(40,40,40,${alpha})`; ctx.fill(); ctx.restore();
  });
}
function strokeAll(ctx, list, width, color, fill) {
  for (const e of list) {
    ellipsePath(ctx, e);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
}

function panel(draw, caption) {
  const cv = createCanvas(S, S + 90), ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S + 90);
  draw(ctx);
  ctx.font = `500 28px ${FONT}`; ctx.fillStyle = '#999'; ctx.textAlign = 'center';
  ctx.fillText(caption, C, S + 55);
  return cv;
}

const P1 = panel((ctx) => { leaves(ctx); dot(ctx); }, '1  심볼: 점과 잎만');
const P2 = panel((ctx) => {
  leaves(ctx, 0.75);
  strokeAll(ctx, others, 1.3, '#999');
  strokeAll(ctx, mine, 3, INK);
  dot(ctx);
}, '2  구조: 굵은 선 = 나의 갈래 · 가는 선 = 타인의 세계');
const P3 = panel((ctx) => {
  strokeAll(ctx, others, 1.3, '#aaa', 'rgba(0,0,0,0.05)');
  strokeAll(ctx, mine, 3, INK);
  dot(ctx);
}, '3  타원만: 나는 점에서 뻗고, 타인은 제자리에 있다');
const P4 = panel((ctx) => {
  strokeAll(ctx, [...others, ...mine], 1, '#bbb', '#e6e6e6');
  dot(ctx);
}, '4  윤곽: 관계 전체의 모양');

const sheet = createCanvas(S * 2, (S + 90) * 2), sx = sheet.getContext('2d');
[P1, P2, P3, P4].forEach((cv, i) => sx.drawImage(cv, (i % 2) * S, Math.floor(i / 2) * (S + 90)));
fs.writeFileSync(path.join(__dirname, 'study_sheet8.png'), sheet.toBuffer('image/png'));
fs.writeFileSync(path.join(__dirname, 'symbol_v2.png'), P1.toBuffer('image/png'));
console.log('done');
