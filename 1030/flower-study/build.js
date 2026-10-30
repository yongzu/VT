// 꽃형 구도 스터디: node build.js (scratchpad의 @napi-rs/canvas 사용)
// 원 = 한 사람, 겹친 자리 = 잎(연결), 모든 원이 지나는 가운데 = 나
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const S = 900;
const FONT = 'Pretendard';

// 사람 목록: [각도(도), 가운데에서 거리 비율(d/r), 반지름]
const REGULAR = Array.from({ length: 8 }, (_, i) => [i * 45, 0.62, 230]);
const IRREGULAR = [
  [-80, 0.55, 250], [-20, 0.7, 190], [25, 0.5, 270], [95, 0.68, 210],
  [140, 0.6, 160], [190, 0.52, 240], [240, 0.75, 175],
];

function circles(list, cx, cy) {
  return list.map(([deg, k, r]) => {
    const t = (deg * Math.PI) / 180;
    return { x: cx + Math.cos(t) * r * k, y: cy + Math.sin(t) * r * k, r, deg };
  });
}

function circlePath(ctx, c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
}

// 겹칠수록 밝아지는 빛 (팀 그래픽 규칙)
function drawLight(ctx, cs, alpha = 0.2) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const c of cs) {
    circlePath(ctx, c);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
  ctx.restore();
}

// 두 원이 겹친 잎의 윤곽: 원 j 안에서 원 i의 호, 원 i 안에서 원 j의 호
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

function fillLens(ctx, a, b, color) {
  ctx.save();
  circlePath(ctx, a);
  ctx.clip();
  circlePath(ctx, b);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function neighbours(cs) {
  const sorted = [...cs].sort((p, q) => p.deg - q.deg);
  return sorted.map((c, i) => [c, sorted[(i + 1) % sorted.length]]);
}

function label(ctx, text, x, y, size = 26, color = '#fff', align = 'center') {
  ctx.font = `500 ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function panel(draw, caption) {
  const cv = createCanvas(S, S + 90);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, S, S + 90);
  draw(ctx);
  label(ctx, caption, S / 2, S + 55, 30, '#bbb');
  return cv;
}

const C = S / 2;
const out = __dirname;

// A. 지금 그래픽: 같은 원 8개, 대칭
const A = panel((ctx) => drawLight(ctx, circles(REGULAR, C, C)), 'A  지금: 같은 원 8개, 대칭');

// B. 꽃형: 크기 · 거리 · 간격이 다른 사람들
const B = panel((ctx) => drawLight(ctx, circles(IRREGULAR, C, C), 0.22), 'B  꽃형: 사람마다 다른 원');

// C. B의 구조: 원 = 사람(가는 선), 이웃한 겹침 = 잎(윤곽), 가운데 = 나
const Cv = panel((ctx) => {
  const cs = circles(IRREGULAR, C, C);
  drawLight(ctx, cs, 0.08);
  for (const c of cs) {
    circlePath(ctx, c);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (const [a, b] of neighbours(cs)) {
    fillLens(ctx, a, b, 'rgba(255,255,255,0.12)');
    strokeLens(ctx, a, b, '#fff', 3);
  }
  ctx.beginPath();
  ctx.arc(C, C, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  label(ctx, '나', C, C - 20, 26);
}, 'C  구조: 원 = 사람 · 잎 = 이웃한 두 사람의 겹침 · 가운데 = 나');

// D. 한 사람(원 하나)을 기준으로 보면: 그 사람이 다른 사람들과 만든 잎
const D = panel((ctx) => {
  const cs = circles(IRREGULAR, C, C);
  drawLight(ctx, cs, 0.06);
  const me = cs[2];
  circlePath(ctx, me);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();
  for (const o of cs) {
    if (o === me) continue;
    fillLens(ctx, me, o, 'rgba(255,255,255,0.16)');
  }
  for (const o of cs) {
    if (o === me) continue;
    circlePath(ctx, o);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}, 'D  한 사람의 원 안에 쌓인 잎들 = 그 사람이 받은 영향');

// 시트로 묶기
const sheet = createCanvas(S * 2, (S + 90) * 2);
const sx = sheet.getContext('2d');
[[A, 0, 0], [B, S, 0], [Cv, 0, S + 90], [D, S, S + 90]].forEach(([cv, x, y]) => sx.drawImage(cv, x, y));
fs.writeFileSync(path.join(out, 'study_sheet.png'), sheet.toBuffer('image/png'));
for (const [name, cv] of [['A_regular', A], ['B_flower', B], ['C_structure', Cv], ['D_one-person', D]]) {
  fs.writeFileSync(path.join(out, name + '.png'), cv.toBuffer('image/png'));
}
console.log('done');
