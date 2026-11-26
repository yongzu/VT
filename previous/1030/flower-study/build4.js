// A + B 통합: 나의 원은 하나, 둘레의 사람들이 꽃잎처럼 겹친다
// 잎(사랑) = 나의 원과 그 사람의 원이 겹친 자리. 관계가 늘수록 잎이 나의 윤곽을 채운다
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const S = 900, C = S / 2, R = 165;
const rad = (d) => (d * Math.PI) / 180;
// [각도, 사람 원 반지름, 잎 폭(겹친 깊이)]
const PEOPLE = [
  [-90, 130, 80], [-45, 112, 45], [0, 140, 95], [45, 105, 30],
  [90, 125, 70], [135, 118, 50], [180, 135, 85], [225, 108, 38],
];
const ORDER = [0, 4, 2, 6, 1, 5, 3, 7];

function person([deg, r, w]) {
  const d = R + r - w;
  return { x: C + Math.cos(rad(deg)) * d, y: C + Math.sin(rad(deg)) * d, r };
}
const ME = { x: C, y: C, r: R };
const circ = (ctx, c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); };

function draw(ctx, n, { showMe, labels }) {
  const ps = ORDER.slice(0, n).map((i) => person(PEOPLE[i]));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of ps) { circ(ctx, p); ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill(); }
  for (const p of ps) {
    ctx.save(); circ(ctx, ME); ctx.clip(); circ(ctx, p);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); ctx.restore();
  }
  ctx.restore();
  if (showMe) {
    circ(ctx, ME);
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (labels) {
    ctx.font = '500 26px Pretendard';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('나', C, C + 9);
  }
}

function panel(n, caption, opts = {}) {
  const cv = createCanvas(S, S + 90), ctx = cv.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S + 90);
  draw(ctx, n, opts);
  ctx.font = '500 30px Pretendard'; ctx.fillStyle = '#bbb'; ctx.textAlign = 'center';
  ctx.fillText(caption, C, S + 55);
  return cv;
}

const panels = [
  panel(1, '관계 하나: 잎 한 장'),
  panel(3, '관계 셋: 나의 윤곽이 조금씩'),
  panel(8, '관계가 모이면: 꽃이 피고, 나의 윤곽이 드러난다'),
  panel(8, '구조: 가운데 원 하나 = 나 · 둘레 = 내 사람들 · 겹친 잎 = 사랑', { showMe: true, labels: true }),
];
const sheet = createCanvas(S * 2, (S + 90) * 2), sx = sheet.getContext('2d');
panels.forEach((cv, i) => sx.drawImage(cv, (i % 2) * S, Math.floor(i / 2) * (S + 90)));
fs.writeFileSync(path.join(__dirname, 'study_sheet4.png'), sheet.toBuffer('image/png'));
console.log('done');
