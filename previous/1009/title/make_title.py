"""21°C 스크립트 타이틀 생성기.

획의 뼈대(베지어)를 브로드닙 펜처럼 굵기를 바꿔 가며 칠한 뒤, 획들을 합쳐
외곽선 한 줄만 남긴다. 결과 SVG는 일러스트레이터·피그마에서 패스로 편집할 수 있다.

    python make_title.py          # title/*.svg 생성
"""
import math
from pathlib import Path

import numpy as np
from shapely.geometry import Point
from shapely.ops import unary_union

OUT = Path(__file__).parent
W = H = 1500
PAPER, INK, ICE = "#ECEBE6", "#121212", "#E6F6FF"

# 원본 좌표: 기준선 y=600, 대문자 높이 y=200 (y는 아래로 증가)
# 각 획 = [P0, C1, C2, P1, C1, C2, P2, ...]
STROKES = {
    # 2 → 기준선 → 1의 올라가는 획까지 한 획
    "two": [
        (-450, 560),
        (-200, 575), (20, 470), (140, 350),
        (230, 250), (380, 170), (470, 215),
        (560, 260), (520, 380), (400, 470),
        (300, 545), (190, 610), (170, 630),
        (260, 590), (420, 640), (600, 615),
        (700, 600), (770, 540), (820, 470),
        (870, 390), (920, 260), (960, 190),
    ],
    # 1의 내려오는 획과 아래 고리 (꼭짓점에서 획을 나눠 끝이 뾰족해지게)
    "one": [
        (960, 190),
        (940, 320), (890, 520), (850, 720),
        (825, 900), (680, 930), (668, 820),
        (660, 730), (820, 700), (990, 705),
    ],
    "degree": [
        (1110, 330),
        (1030, 270), (1080, 120), (1190, 125),
        (1300, 130), (1310, 290), (1210, 325),
        (1150, 345), (1100, 310), (1118, 255),
    ],
    "c": [
        (1640, 290),
        (1650, 240), (1600, 195), (1530, 205),
        (1400, 220), (1290, 330), (1280, 450),
        (1270, 580), (1370, 650), (1500, 620),
        (1600, 590), (1780, 500), (2000, 470),
        (2150, 450), (2300, 470), (2450, 500),
    ],
}
# 문자 아래를 길게 가로지르는 바람결 (variant에 따라 추가)
SWASH = [
    (-450, 760),
    (0, 700), (500, 800), (1000, 740),
    (1400, 690), (1800, 760), (2450, 690),
]


def bezier_chain(pts, n=70):
    pts = np.asarray(pts, float)
    out = []
    for i in range(0, len(pts) - 1, 3):
        p0, c1, c2, p1 = pts[i:i + 4]
        t = np.linspace(0, 1, n)[:, None]
        seg = (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3 * p1
        out.append(seg if i == 0 else seg[1:])
    return np.vstack(out)


def transform(pts, skew, sx, sy, fit):
    x, y = pts[:, 0], 600 + (pts[:, 1] - 600) * sy
    x = (x + skew * (600 - y)) * sx
    s, ox, oy = fit
    return np.column_stack([x * s + ox, y * s + oy])


def warp(pts, amp, seed):
    if not amp:
        return pts
    r = np.random.default_rng(seed).uniform(0, 2 * math.pi, 4)
    x, y = pts[:, 0], pts[:, 1]
    dx = amp * (np.sin(y * 0.013 + r[0]) + 0.5 * np.sin(x * 0.007 + r[1]))
    dy = amp * (np.sin(x * 0.011 + r[2]) + 0.5 * np.sin(y * 0.021 + r[3]))
    return np.column_stack([x + dx, y + dy])


def nib_stroke(pts, wmin, wmax, nib_deg=-35):
    """브로드닙: 펜촉 각도와 진행 방향의 차이만큼 굵어진다. 양 끝은 가늘게."""
    d = np.gradient(pts, axis=0)
    theta = np.arctan2(d[:, 1], d[:, 0])
    w = wmin + (wmax - wmin) * np.abs(np.sin(theta - math.radians(nib_deg)))
    t = np.linspace(0, 1, len(pts))
    taper = np.minimum(1, np.minimum(t, 1 - t) / 0.12)
    w *= 0.08 + 0.92 * taper * taper * (3 - 2 * taper)
    discs = [Point(p).buffer(r / 2, 16) for p, r in zip(pts, w)]
    hulls = [discs[i].union(discs[i + 1]).convex_hull for i in range(len(discs) - 1)]
    return unary_union(hulls)


def fit_params(strokes, skew, sx, sy, left, right, top):
    allp = np.vstack([bezier_chain(s, 8) for s in strokes])
    y = 600 + (allp[:, 1] - 600) * sy
    x = (allp[:, 0] + skew * (600 - y)) * sx
    s = (right - left) / (x.max() - x.min())
    return s, left - x.min() * s, top - y.min() * s


def to_path(geom):
    polys = getattr(geom, "geoms", [geom])
    d = []
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            c = np.asarray(ring.simplify(0.4).coords)
            d.append("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in c) + "Z")
    return " ".join(d)


def build(swash, skew, sx, amp, wmin, wmax, sy=1.0, seed=3, top=110, left=-80, right=1590):
    strokes = list(STROKES.values()) + ([SWASH] if swash else [])
    fit = fit_params(strokes, skew, sx, sy, left, right, top)
    shapes = []
    for s in strokes:
        pts = warp(transform(bezier_chain(s), skew, sx, sy, fit), amp, seed)
        shapes.append(nib_stroke(pts, wmin, wmax))
    return to_path(unary_union(shapes))


def svg(body, bg, defs=""):
    rect = f'<rect width="{W}" height="{H}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f"<defs>{defs}</defs>{rect}{body}</svg>\n")


INK_FILTER = """
<filter id="ink" x="-5%" y="-20%" width="110%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7"/>
  <feDisplacementMap in="SourceGraphic" scale="14" xChannelSelector="R" yChannelSelector="G"/>
  <feGaussianBlur stdDeviation="5"/>
  <feComponentTransfer><feFuncA type="discrete" tableValues="0 1 1"/></feComponentTransfer>
</filter>"""

VARIANTS = {
    # 레퍼런스에 가장 가까운 기본형
    "t01_outline-flow": dict(swash=False, skew=.32, sx=1.0, sy=1.45, amp=8, wmin=7, wmax=74),
    # 가로로 더 늘리고 바람결 획을 더해 공기가 흐르는 느낌
    "t02_outline-airflow": dict(swash=True, skew=.42, sx=1.2, sy=1.6, amp=16, wmin=6, wmax=64, left=-200, right=1720),
    # 비교용: 녹아내리는 잉크 (덥다 쪽)
    "t03_ink-melt": dict(swash=False, skew=.32, sx=1.0, sy=1.45, amp=10, wmin=12, wmax=70),
}

if __name__ == "__main__":
    paths = {}
    for name, kw in VARIANTS.items():
        d = build(**kw)
        paths[name] = d
        if "ink" in name:
            body = f'<path d="{d}" fill="{INK}" fill-rule="nonzero" filter="url(#ink)"/>'
            (OUT / f"{name}.svg").write_text(svg(body, PAPER, INK_FILTER), encoding="utf-8")
        else:
            line = f'<path d="{d}" fill="none" stroke="{{c}}" stroke-width="{{w}}" stroke-linejoin="round"/>'
            (OUT / f"{name}.svg").write_text(svg(line.format(c=INK, w=2.4), PAPER), encoding="utf-8")
            # 배경 없는 얼음색 버전 (사진 위 합성용)
            (OUT / f"{name}_ice.svg").write_text(svg(line.format(c=ICE, w=3.2), None), encoding="utf-8")
        print("wrote", name)
