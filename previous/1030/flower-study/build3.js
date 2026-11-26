// 꽃형 ② 정리본: 원들이 만든 바깥 윤곽 = 꽃(한 사람의 관계 전체), 안쪽 겹침 = 잎(관계 하나)
// build2.js의 RELS 배치를 그대로 쓴다
const path = require('path');
const fs = require('fs');
const { createCanvas } = require(process.env.CANVAS_PATH || '@napi-rs/canvas');
const S = 900, C = S / 2, rad = (d) => (d * Math.PI) / 180;
const through = (deg, r) => ({ x: C + Math.cos(rad(deg)) * r, y: C + Math.sin(rad(deg)) * r, r, deg });
const ME = '#5DCAA5', R_ME = 190;
const RELS = [[-90, 28, 200, '#F0997B'], [-18, 40, 175, '#FAC775'], [54, 52, 190, '#85B7EB'], [126, 66, 160, '#AFA9EC'], [198, 46, 170, '#ED93B1']];
const pairs = RELS.map(([a, g, r, color]) => ({ me: through(a - g, R_ME), other: through(a + g, r), color }));
const circ = (ctx, c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); };
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
function lens(ctx, a, b, style) { ctx.save(); circ(ctx, a); ctx.clip(); circ(ctx, b); ctx.fillStyle = style; ctx.fill(); ctx.restore(); }
function panel(bg, draw, caption, fg) {
  const cv = createCanvas(S, S + 90), ctx = cv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S + 90); draw(ctx);
  ctx.font = '500 30px Pretendard'; ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(caption, C, S + 55);
  return cv;
}
const all = pairs.flatMap((p) => [p.me, p.other]);
const I = panel('#000', (ctx) => {
  ctx.globalCompositeOperation = 'lighter';
  all.forEach((c) => { circ(ctx, c); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill(); });
  pairs.forEach((p) => lens(ctx, p.me, p.other, 'rgba(255,255,255,0.55)'));
}, 'I  흑백: 꽃 = 원들의 윤곽, 잎 = 관계 하나, 잎이 만나는 점 = 나', '#bbb');
const J = panel('#fff', (ctx) => {
  ctx.globalCompositeOperation = 'multiply';
  all.forEach((c, i) => { circ(ctx, c); ctx.fillStyle = hexA(i % 2 ? pairs[i >> 1].color : ME, 0.12); ctx.fill(); });
  pairs.forEach((p) => { lens(ctx, p.me, p.other, hexA(ME, 0.45)); lens(ctx, p.me, p.other, hexA(p.color, 0.7)); });
}, 'J  흰 바탕: 잎마다 나의 색과 그 사람의 색이 겹쳐 새 색이 된다', '#666');
const sheet = createCanvas(S * 2, S + 90), sx = sheet.getContext('2d');
sx.drawImage(I, 0, 0); sx.drawImage(J, S, 0);
fs.writeFileSync(path.join(__dirname, 'study_sheet3.png'), sheet.toBuffer('image/png'));
console.log('done');
