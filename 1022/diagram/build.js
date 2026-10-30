// 프로젝트 컨셉 슬라이드(1920×1080) 하단 도식.
// 구성은 '교육 대상 → 교육 목적' 레퍼런스를 따른다: 두 원(서로의 세계) → 화살표 → 결과 원(지금의 나).
// 좌표는 슬라이드 좌표 그대로 쓰고, diagram.svg는 도식 영역(x 60~1860, y 320~1000)만 잘라 낸다.
// 실행: node build.js → diagram.svg, slide_01.html, diagram.html 생성
const fs = require('fs');
const path = require('path');

const C = {
  me: '#2F6BF2',      // 나의 세계
  other: '#E5527F',   // 타인의 세계
  mix: '#8A5FB9',     // 둘이 섞여 생긴, 어느 한쪽의 것도 아닌 색
  ink: '#333333',
};
const R = 250;
const CY = 690;
const A = 310, B = 690, Z = 1610;   // 나 · 타인 · 지금의 나 (원 중심 x)
const FONT = `font-family="Pretendard, 'Pretendard Variable', sans-serif"`;

const t = (x, y, s, size, weight = 400, fill = '#fff', extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle" letter-spacing="-0.02em" ${extra}>${s}</text>`;

// 원 안의 아래 화살표
const down = (x, y) =>
  `<path d="M${x} ${y - 20}V${y + 18}M${x - 9} ${y + 9}L${x} ${y + 18}L${x + 9} ${y + 9}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

// 원 하나의 내용: 제목 — 선 — 무엇이 — ↓ — 어떻게 된다
const world = (x, title, what, how) => `
  ${t(x, 596, title, 32, 700)}
  <line x1="${x - 100}" y1="626" x2="${x + 100}" y2="626" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
  ${t(x, 676, what, 20, 400)}
  ${down(x, 724)}
  ${t(x, 794, how[0], 26, 700)}
  ${t(x, 830, how[1], 26, 700)}`;

// 아래쪽 범위 표시선: 양 끝 삼각형이 안쪽을 본다
const bracket = (x1, x2, y, color) => `
  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="2"/>
  <path d="M${x1} ${y - 7}L${x1 + 11} ${y}L${x1} ${y + 7}Z" fill="${color}"/>
  <path d="M${x2} ${y - 7}L${x2 - 11} ${y}L${x2} ${y + 7}Z" fill="${color}"/>`;

const body = `
  <defs>
    <linearGradient id="lens" gradientUnits="userSpaceOnUse" x1="${B - R - 70}" y1="0" x2="${A + R + 70}" y2="0">
      <stop offset="0" stop-color="${C.me}"/>
      <stop offset=".5" stop-color="${C.mix}"/>
      <stop offset="1" stop-color="${C.other}"/>
    </linearGradient>
    <linearGradient id="self" gradientUnits="userSpaceOnUse" x1="${Z - R}" y1="${CY - R}" x2="${Z + R}" y2="${CY + R}">
      <stop offset="0" stop-color="${C.me}"/>
      <stop offset=".5" stop-color="${C.mix}"/>
      <stop offset="1" stop-color="${C.other}"/>
    </linearGradient>
    <linearGradient id="span" gradientUnits="userSpaceOnUse" x1="${A - R}" y1="0" x2="${B + R}" y2="0">
      <stop offset="0" stop-color="${C.me}"/>
      <stop offset="1" stop-color="${C.other}"/>
    </linearGradient>
    <clipPath id="union"><circle cx="${A}" cy="${CY}" r="${R}"/><circle cx="${B}" cy="${CY}" r="${R}"/></clipPath>
    <filter id="bleed" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>

  <!-- 머리말 -->
  ${t((A + B) / 2, 352, 'Connection', 22, 600, C.me)}
  ${t((A + B) / 2, 398, '서로의 세계', 34, 700, C.ink)}
  ${t(Z, 352, 'Trace', 22, 600, C.mix)}
  ${t(Z, 398, '남겨진 흔적', 34, 700, C.ink)}

  <!-- 두 세계: 바깥 윤곽은 선명하게 남고(경계), 맞닿은 자리는 선 없이 번지며 새 색이 된다(스며듦).
       겹침보다 넓은 띠를 흐리게 깔아 두 원 사이의 윤곽선을 지운다 -->
  <circle cx="${A}" cy="${CY}" r="${R}" fill="${C.me}"/>
  <circle cx="${B}" cy="${CY}" r="${R}" fill="${C.other}"/>
  <g clip-path="url(#union)">
    <rect x="${B - R - 70}" y="${CY - R - 40}" width="${2 * R - (B - A) + 140}" height="${2 * R + 80}" fill="url(#lens)" filter="url(#bleed)"/>
  </g>
  ${world(A - 22, '나의 세계', '나의 말투 · 취향 · 습관', ['상대의 삶에', '나의 일부를 남긴다'])}
  ${world(B + 26, '타인의 세계', '가족 · 친구 · 연인 · 지나간 인연', ['상대의 일부를', '나의 삶에 받아들인다'])}
  ${t((A + B) / 2, CY + 8, '스며듦', 22, 700)}

  <!-- 화살표 -->
  <path d="M1090 ${CY}H1210M1192 ${CY - 18}L1210 ${CY}L1192 ${CY + 18}" stroke="${C.mix}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- 결과: 두 색이 섞인 원 = 흔적이 모여 이룬 지금의 나 -->
  <circle cx="${Z}" cy="${CY}" r="${R}" fill="url(#self)"/>
  ${t(Z, 628, '서로에게 스며든 흔적이', 30, 400)}
  ${t(Z, 704, '지금의 나를', 54, 700)}
  ${t(Z, 768, '이룬다', 30, 400)}

  <!-- 범위 표시선 -->
  ${bracket(A - R, B + R, 978, 'url(#span)')}
  ${bracket(Z - R, Z + R, 978, C.mix)}`;

const svg = (vb, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" ${FONT}>${body}\n</svg>\n`;

const dir = __dirname;
const cropped = svg('60 320 1800 680', 1800, 680);
fs.writeFileSync(path.join(dir, 'diagram.svg'), cropped);

// 미리보기: 팀 슬라이드 01을 그대로 옮기고 하단에 도식을 얹는다
const slide = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>01 프로젝트 컨셉 - 도식 미리보기</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;background:#fff}
body{font-family:Pretendard,"Pretendard Variable",sans-serif;color:#333;letter-spacing:-.02em;position:relative;overflow:hidden}
.en{position:absolute;left:60px;top:54px;font-size:24px}
.ko{position:absolute;left:60px;top:92px;font-size:27px;font-weight:700}
.txt{position:absolute;left:60px;top:189px;font-size:24px;line-height:38px}
.txt b{font-weight:700}
.foot{position:absolute;left:60px;bottom:38px;font-size:17px;color:#b9c3d3}
.no{position:absolute;right:60px;bottom:42px;font-size:17px;color:#b9c3d3}
svg{position:absolute;left:0;top:0}
</style></head><body>
<div class="en">Project Concept</div>
<div class="ko">프로젝트 컨셉</div>
<p class="txt">이 전시는 사랑을 연인 사이의 감정에 한정하지 않고, <b>가족과 친구, 지나간 인연 등 다양한 관계 속에서 서로에게 영향을 주고받는 과정</b>으로 바라본다.<br>우리는 수많은 사람과 연결되면서 서로의 세계에 스며들고, 그 흔적들이 쌓여 지금의 자신을 이룬다.</p>
<div class="foot">2026 VT·Visual Translation</div><div class="no">01</div>
${svg('0 0 1920 1080', 1920, 1080)}</body></html>
`;
fs.writeFileSync(path.join(dir, 'slide_01.html'), slide);

// 투명 배경 PNG 출력용
fs.writeFileSync(path.join(dir, 'diagram.html'),
  `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}html,body{background:transparent}svg{display:block}</style></head><body>${cropped}</body></html>\n`);
