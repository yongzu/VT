// 페르소나 꽃: 흐린 빨강 = 나의 잎(페르소나, 가운데에서 뻗음), 흰 잎 + 테두리 = 타인의 잎, 진한 빨강 = 겹친 자리(사랑)
// 타인의 잎을 가운데에서 떼는 정도를 비교한다. 나의 잎끼리는 겹쳐도 짙어지지 않게 한 층으로 그린다
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const S = 1000, C = S / 2, CY = 590;
const rad = (d) => (d * Math.PI) / 180;
const FONT = 'Pretendard';

// 나의 잎: [방향, 길이, 폭] 한쪽 끝이 가운데에 붙는다
const MINE = [[-76, 560, 230], [-16, 430, 250], [196, 410, 205], [124, 400, 250], [92, 360, 220], [38, 380, 200]];
// 타인의 잎: [가운데에서 본 방향, 거리, 긴 반지름, 짧은 반지름, 기울기] (시안처럼 일부는 가운데 가까이 지난다)
const OTHERS = [[-92, 245, 230, 72, -90], [-50, 215, 205, 205, 0], [180, 175, 190, 86, 4], [150, 270, 230, 170, -30], [30, 230, 205, 145, 32], [5, 300, 180, 150, 10]];

const ell = (ctx, e) => { ctx.beginPath(); ctx.ellipse(e.x, e.y, e.a, e.b, e.rot, 0, Math.PI * 2); };
function inside(e, px, py, margin) {
  const dx = px - e.x, dy = py - e.y, c = Math.cos(-e.rot), s = Math.sin(-e.rot);
  const x = dx * c - dy * s, y = dx * s + dy * c;
  return (x * x) / ((e.a + margin) ** 2) + (y * y) / ((e.b + margin) ** 2) <= 1;
}

const mine = MINE.map(([deg, L, W]) => {
  const t = rad(deg);
  return { x: C + Math.cos(t) * L / 2, y: CY + Math.sin(t) * L / 2, a: L / 2, b: W / 2, rot: t };
});
function othersWithGap(gap) {
  return OTHERS.map(([deg, d, a, b, tilt]) => {
    const t = rad(deg);
    let dist = d, e;
    do {
      e = { x: C + Math.cos(t) * dist, y: CY + Math.sin(t) * dist, a, b, rot: rad(tilt) };
      dist += 4;
    } while (gap !== null && inside(e, C, CY, gap));
    return e;
  });
}

function draw(ctx, others, { core = 0 } = {}) {
  // 나의 잎: 한 층으로 합쳐 겹쳐도 짙어지지 않게
  const layer = createCanvas(S, S), lx = layer.getContext('2d');
  lx.fillStyle = '#ff8a8a';
  mine.forEach((m) => { ell(lx, m); lx.fill(); });
  ctx.globalAlpha = 0.32; ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1;
  // 사랑: 나의 잎과 타인의 잎이 겹친 자리. core가 있으면 가운데 원 안은 나의 잎만 남긴다
  ctx.save();
  if (core) { ctx.beginPath(); ctx.rect(0, 0, S, S); ctx.arc(C, CY, core, 0, Math.PI * 2, true); ctx.clip('evenodd'); }
  mine.forEach((m) => others.forEach((o) => {
    ctx.save(); ell(ctx, m); ctx.clip(); ell(ctx, o);
    ctx.fillStyle = 'rgba(245,70,70,0.42)'; ctx.fill(); ctx.restore();
  }));
  ctx.restore();
  // 타인의 잎: 테두리만. core가 있으면 가운데 원 안에는 선을 긋지 않는다
  ctx.save();
  if (core) {
    ctx.beginPath(); ctx.rect(0, 0, S, S); ctx.arc(C, CY, core, 0, Math.PI * 2, true); ctx.clip('evenodd');
  }
  others.forEach((o) => { ell(ctx, o); ctx.strokeStyle = 'rgba(225,90,90,0.55)'; ctx.lineWidth = 1.6; ctx.stroke(); });
  ctx.restore();
  mine.forEach((m) => { ell(ctx, m); ctx.strokeStyle = 'rgba(225,90,90,0.25)'; ctx.lineWidth = 1; ctx.stroke(); });
}

function panel(others, caption, opts) {
  const cv = createCanvas(S, S + 100), ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S + 100);
  draw(ctx, others, opts);
  ctx.font = `500 30px ${FONT}`; ctx.fillStyle = '#999'; ctx.textAlign = 'center';
  ctx.fillText(caption, C, S + 60);
  return cv;
}

const panels = [
  panel(othersWithGap(null), 'A  시안 재현: 타인의 잎 일부가 가운데를 지난다'),
  panel(othersWithGap(30), 'B  살짝 떼기: 가운데에서 30px'),
  panel(othersWithGap(110), 'C  확실히 떼기: 가운데에서 110px'),
  panel(othersWithGap(null), 'D  떼지 않고 가운데만 비우기: 중심에는 나의 잎만 있다', { core: 70 }),
];
const sheet = createCanvas(S * 2, (S + 100) * 2), sx = sheet.getContext('2d');
panels.forEach((cv, i) => sx.drawImage(cv, (i % 2) * S, Math.floor(i / 2) * (S + 100)));
fs.writeFileSync(path.join(__dirname, 'study_sheet9.png'), sheet.toBuffer('image/png'));
console.log('done');
