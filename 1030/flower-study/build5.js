// A + B 통합, 비정형: 사람마다 크기 · 방향 · 겹친 깊이가 다르다
// 나의 원은 하나. 잎(사랑) = 나의 원과 그 사람의 원이 겹친 자리
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');

const S = 900, C = S / 2, R = 165;
const rad = (d) => (d * Math.PI) / 180;

// [각도, 사람 원 반지름, 나의 원 안으로 들어온 깊이]
const SETS = [
  {
    name: '사람 9명: 깊이 들어온 관계와 스친 관계',
    people: [[-100, 150, 150], [-58, 70, 25], [-22, 190, 90], [14, 90, 14], [68, 120, 62], [108, 60, 38], [158, 170, 120], [204, 100, 28], [248, 80, 10]],
  },
  {
    name: '사람 6명: 한쪽으로 기운 관계',
    people: [[-82, 200, 170], [-40, 110, 55], [-8, 80, 20], [58, 140, 80], [150, 62, 12], [204, 95, 36]],
  },
  {
    name: '사람 13명: 큰 관계 몇과 작은 관계 여럿',
    people: [[-95, 180, 110], [-70, 55, 18], [-45, 75, 30], [-12, 60, 12], [12, 160, 140], [48, 50, 15], [80, 90, 45], [104, 58, 22], [135, 130, 70], [170, 48, 10], [196, 85, 40], [228, 65, 16], [262, 110, 55]],
  },
];

const circ = (ctx, c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); };
const ME = { x: C, y: C, r: R };

function toCircle([deg, r, depth]) {
  const d = Math.max(Math.abs(r - R) + 8, R + r - depth);
  return { x: C + Math.cos(rad(deg)) * d, y: C + Math.sin(rad(deg)) * d, r };
}

function draw(ctx, people, showMe) {
  const ps = people.map(toCircle);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of ps) { circ(ctx, p); ctx.fillStyle = 'rgba(255,255,255,0.11)'; ctx.fill(); }
  for (const p of ps) {
    ctx.save(); circ(ctx, ME); ctx.clip(); circ(ctx, p);
    ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.fill(); ctx.restore();
  }
  ctx.restore();
  if (showMe) {
    circ(ctx, ME);
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '500 26px Pretendard'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.strokeText('나', C, C + 9); ctx.fillText('나', C, C + 9);
  }
}

function panel(people, caption, showMe) {
  const cv = createCanvas(S, S + 90), ctx = cv.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S + 90);
  draw(ctx, people, showMe);
  ctx.font = '500 30px Pretendard'; ctx.fillStyle = '#bbb'; ctx.textAlign = 'center';
  ctx.fillText(caption, C, S + 55);
  return cv;
}

const panels = [
  ...SETS.map((s) => panel(s.people, s.name, false)),
  panel(SETS[0].people, '첫 번째 안의 구조: 점선 = 나의 원', true),
];
const sheet = createCanvas(S * 2, (S + 90) * 2), sx = sheet.getContext('2d');
panels.forEach((cv, i) => sx.drawImage(cv, (i % 2) * S, Math.floor(i / 2) * (S + 90)));
fs.writeFileSync(path.join(__dirname, 'study_sheet5.png'), sheet.toBuffer('image/png'));
console.log('done');
