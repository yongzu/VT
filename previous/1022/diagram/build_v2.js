// v2: 팀이 흑백으로 정리한 벤 도식(나의 세계 · 사랑 · 타인의 세계 / 연결) 오른쪽에
// '연인 사이의 사랑을 품은 더 큰 사랑'을 붙인다.
// 좌표는 팀 이미지(1564×1210) 단위를 그대로 쓰고, 오른쪽을 이어 붙여 전체 2866×1210.
// 실행: node build_v2.js → v2_full.html(왼쪽 재현 + 오른쪽), v2_right.svg(오른쪽만)
const fs = require('fs');
const path = require('path');

const INK = '#000';
const RULE = '#c8c8c8';
const H = 1210;
const R = 500, CY = 500;
const L1 = 500, L2 = 1063;   // 팀 벤 도식의 두 원
const Z = 2364;              // 더 큰 사랑
const FONT = `font-family="Pretendard, 'Pretendard Variable', sans-serif"`;

const t = (x, y, s, size, weight = 400, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle" letter-spacing="-0.02em" ${extra}>${s}</text>`;

const bracket = (x1, x2, y, label) => `
  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${RULE}" stroke-width="3"/>
  <path d="M${x1} ${y - 10}L${x1 + 18} ${y}L${x1} ${y + 10}Z" fill="${RULE}"/>
  <path d="M${x2} ${y - 10}L${x2 - 18} ${y}L${x2} ${y + 10}Z" fill="${RULE}"/>
  ${t((x1 + x2) / 2, 1200, label, 56, 700)}`;

// 왼쪽: 팀 도식 재현 (미리보기용)
const left = `
  <defs><clipPath id="c1"><circle cx="${L1}" cy="${CY}" r="${R - 2}"/></clipPath></defs>
  <circle cx="${L2}" cy="${CY}" r="${R}" fill="${INK}" clip-path="url(#c1)"/>
  <circle cx="${L1}" cy="${CY}" r="${R - 2}" fill="none" stroke="${INK}" stroke-width="2"/>
  <circle cx="${L2}" cy="${CY}" r="${R}" fill="none" stroke="${INK}" stroke-width="2"/>
  ${t(298, 485, '나의 세계', 56, 700)}
  ${t(298, 562, '나의 말투 · 취향 · 습관', 34)}
  ${t(782, 485, '사랑', 56, 700, '#fff')}
  ${t(782, 562, '서로에게 영향을 주다', 34, 400, '#fff')}
  ${t(782, 610, '스며들다', 34, 400, '#fff')}
  ${t(1272, 470, '타인의 세계', 56, 700)}
  ${t(1272, 562, '가족 · 친구 · 연인 등', 34)}
  ${bracket(2, 1562, 1088, '연결')}`;

// 오른쪽: 겹친 자리의 사랑(검정)이 커진 원. 우리가 흔히 '사랑'이라 부르는 연인 사이의 사랑은 그 안의 작은 원이다
const ring = 330;   // 다른 관계 이름을 놓는 반지름
const at = (deg) => [Z + ring * Math.cos(deg * Math.PI / 180), CY + ring * Math.sin(deg * Math.PI / 180)];
const others = [[-90, '가족'], [150, '친구'], [30, '지나간 인연']]
  .map(([d, s]) => { const [x, y] = at(d); return t(x.toFixed(0), (y + 14).toFixed(0), s, 40, 600, '#fff'); })
  .join('\n  ');
const right = `
  <path d="M1650 ${CY}H1800M1776 ${CY - 24}L1800 ${CY}L1776 ${CY + 24}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${Z}" cy="${CY}" r="${R}" fill="${INK}"/>
  <circle cx="${Z}" cy="${CY}" r="150" fill="none" stroke="#fff" stroke-width="2"/>
  ${t(Z, CY + 2, '연인', 52, 700, '#fff')}
  ${t(Z, CY + 52, '우리가 알던 사랑', 26, 400, '#fff', 'fill-opacity=".7"')}
  ${others}
  ${t(Z, CY + 338, '· · ·', 40, 600, '#fff', 'fill-opacity=".5"')}
  ${bracket(Z - R, Z + R, 1088, '사랑')}`;

const dir = __dirname;
fs.writeFileSync(path.join(dir, 'v2_right.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="1600 0 1266 ${H}" width="1266" height="${H}" ${FONT}>${right}\n</svg>\n`);
fs.writeFileSync(path.join(dir, 'v2_full.html'),
  `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}html,body{background:#fff}svg{display:block}</style></head><body>` +
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2866 ${H}" width="2866" height="${H}" ${FONT}>${left}${right}\n</svg></body></html>\n`);
