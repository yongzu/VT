// A + B 통합, 팀 벤 도식의 언어로: 원은 선만, 사랑(나와 겹친 자리)만 검게
// 나의 원은 굵은 선, 타인의 원은 가는 선. 타인끼리 겹친 자리는 칠하지 않는다
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const S = 900, C = S / 2, R = 165;
const rad = (d) => (d * Math.PI) / 180;
const INK = '#333';
const FONT = 'Pretendard';

// [각도, 반지름, 나의 원 안으로 들어온 깊이, 이름]
const MANY = [
  [-95, 180, 110, '가족'], [-70, 55, 18, ''], [-45, 75, 30, '친구'], [-12, 60, 12, ''],
  [12, 160, 140, '오랜 친구'], [48, 50, 15, ''], [80, 90, 45, '동료'], [104, 58, 22, ''],
  [135, 130, 70, '연인'], [170, 48, 10, ''], [196, 85, 40, '지나간 인연'], [228, 65, 16, ''],
  [262, 110, 55, ''],
];
const THREE = [MANY[0], MANY[4], MANY[8]];
const ONE = [[0, 165, 100, '타인의 세계']];

const ME = { x: C, y: C, r: R };
const circ = (ctx, c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); };
function toCircle([deg, r, depth, name]) {
  const d = Math.max(Math.abs(r - R) + 8, R + r - depth);
  return { x: C + Math.cos(rad(deg)) * d, y: C + Math.sin(rad(deg)) * d, r, deg, name };
}

function text(ctx, s, x, y, size, color, weight = 600) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function draw(ctx, people, { labels, shift = 0, meDx = 0 }) {
  const me = { ...ME, x: ME.x - shift };
  const ps = people.map(toCircle).map((p) => ({ ...p, x: p.x - shift }));
  // 사랑: 나와 각 사람이 겹친 자리만 칠한다 (겹친 잎끼리는 조금 더 짙어진다)
  for (const p of ps) {
    ctx.save(); circ(ctx, me); ctx.clip(); circ(ctx, p);
    ctx.fillStyle = 'rgba(40,40,40,0.82)'; ctx.fill(); ctx.restore();
  }
  for (const p of ps) { circ(ctx, p); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); }
  circ(ctx, me); ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke();
  if (!labels) return;
  text(ctx, '나의 세계', me.x - (shift ? 40 : 0) + meDx, me.y, 30, INK);
  for (const p of ps) {
    if (!p.name) continue;
    const t = rad(p.deg), k = shift ? 0.25 : 0.45;
    text(ctx, p.name, p.x + Math.cos(t) * p.r * k, p.y + Math.sin(t) * p.r * k, 24, '#777', 500);
  }
}

function panel(people, caption, opts = {}) {
  const cv = createCanvas(S, S + 90), ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S + 90);
  draw(ctx, people, opts);
  if (opts.love) text(ctx, '사랑', opts.love[0], opts.love[1], 26, '#fff');
  text(ctx, caption, C, S + 50, 28, '#999', 500);
  return cv;
}

const panels = [
  panel(ONE, '관계 하나: 팀 도식 그대로', { labels: true, shift: 120, love: [C - 120 + R - 50, C] }),
  panel(THREE, '관계 셋: 나의 세계에 사랑이 늘어난다', { labels: true, meDx: -50 }),
  panel(MANY, '관계가 모이면: 사랑이 나의 윤곽을 그리고, 꽃이 된다'),
  panel(MANY, '이름을 붙이면: 연인은 여러 사랑 중 하나', { labels: true, meDx: -45 }),
];
const sheet = createCanvas(S * 2, (S + 90) * 2), sx = sheet.getContext('2d');
panels.forEach((cv, i) => sx.drawImage(cv, (i % 2) * S, Math.floor(i / 2) * (S + 90)));
fs.writeFileSync(path.join(__dirname, 'study_sheet6.png'), sheet.toBuffer('image/png'));
console.log('done');
