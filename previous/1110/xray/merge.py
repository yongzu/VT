"""두 엑스레이 식물을 웜톤 원 두 개로 합성한다. 겹친 자리가 가장 진하고, 식물은 가운데로 스며든다.

python merge.py [이름]  →  merge_<이름>.png
입력: mj/plant_a_dense.webp(왼쪽), mj/plant_b_sparse.webp(오른쪽). MJ 결과 2000px, 접시 중심이 이미지 중심.
"""
import sys
import cv2
import numpy as np

HERE = __file__.rsplit("/", 1)[0].rsplit("\\", 1)[0] or "."


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])[::-1]  # BGR


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# 기포 위치(x, y, r) — MJ 결과에서 눈으로 찍은 값(2000px 기준)
BUBBLES = {
    "plant_a_dense": [(792, 1750, 56), (979, 1739, 98), (1116, 1752, 48), (1225, 1604, 42), (1168, 1549, 26), (1135, 1651, 18)],
    "plant_b_sparse": [(1161, 500, 50), (888, 529, 14), (875, 700, 14), (1657, 591, 16), (1530, 588, 16), (1694, 721, 12),
                       (1050, 1126, 38), (493, 1221, 56), (533, 1180, 40), (799, 1247, 24), (965, 1317, 46), (1084, 1304, 76),
                       (892, 1504, 32), (1454, 1297, 14), (1170, 1414, 14), (819, 1674, 14)],
}


def plant_density(path, rim_r=850, feather=25):
    """밝은 배경 위 회색 식물 → 밀도(0~1). 기포는 지우고, 접시 테두리는 원형 마스크로 지운다."""
    g8 = cv2.imread(path, 0)
    key = path.replace("\\", "/").rsplit("/", 1)[-1].split(".")[0]
    m = np.zeros_like(g8)
    for x, y, r in BUBBLES.get(key, []):
        cv2.circle(m, (x, y), r + 8, 255, -1)
    if m.any():
        fill = cv2.inpaint(g8, m, 9, cv2.INPAINT_TELEA)
        for x, y, r in BUBBLES.get(key, []):          # 빈 바탕 위 기포는 그냥 흰색으로
            ring = np.zeros_like(g8)
            cv2.circle(ring, (x, y), r + 22, 255, 10)
            if np.median(g8[ring > 0]) > 242:
                cv2.circle(fill, (x, y), r + 10, 250, -1)
        g8 = fill
    g = g8.astype(np.float32) / 255
    n = g.shape[0]
    d = np.clip((0.97 - g) / 0.9, 0, 1) ** 0.9
    # 잎에 붙지 않은 작은 점(작은 기포, 먼지)을 지운다
    n_, lab, st, _ = cv2.connectedComponentsWithStats((d > 0.06).astype(np.uint8), 8)
    small = np.isin(lab, np.where(st[:, cv2.CC_STAT_AREA] < 600)[0])
    d[small] = 0
    yy, xx = np.mgrid[:n, :n]
    r = np.hypot(xx - n / 2, yy - n / 2)
    return d * (1 - smooth(rim_r - feather, rim_r, r))


P = dict(
    W=4200, H=2700, R=1000, gap=1.5,          # 원 반지름, 중심 거리 = gap*R (1.5 → 지름의 1/4 겹침)
    bg="#FBF1EA",
    left="#F28C8C", right="#F6B08A", mix="#E8405A",
    k_field=0.75, k_lens=0.45,                # 원 색 농도, 겹친 자리 추가 농도
    bias=2.2,                                 # 상대를 향한 쪽이 진해지는 정도
    soft=22, blur=14,                         # 원 가장자리 부드러움, 전체 번짐
    k_plant=0.9, fade=(0.3, 0.95), shift=0.12,  # shift: 식물을 상대 쪽으로 당기는 정도(R 비율)          # 식물 농도, 식물이 사라지기 시작/끝나는 위치(u: -1 바깥 → 1 상대쪽)
    seep_len=700, k_seep=0.9,                # 식물이 가운데로 끌려가는 길이와 농도
    plant_scale=1.0,
)


def motion(img, length, direction):
    """한쪽 방향으로만 끌리는 번짐(direction=+1 오른쪽, -1 왼쪽)."""
    k = np.zeros((1, length), np.float32)
    w = np.linspace(1, 0.05, length // 2) ** 1.5
    if direction > 0:
        k[0, :length // 2] = w[::-1]
    else:
        k[0, length // 2:length // 2 + len(w)] = w
    k /= k.sum()
    return cv2.filter2D(img, -1, k, borderType=cv2.BORDER_CONSTANT)


def build(p=P, name="a"):
    W, H, R = p["W"], p["H"], p["R"]
    cy = H / 2
    cxs = [W / 2 - p["gap"] * R / 2, W / 2 + p["gap"] * R / 2]
    yy, xx = np.mgrid[:H, :W].astype(np.float32)
    out = np.ones((H, W, 3), np.float32) * hexrgb(p["bg"])

    fields, us = [], []
    for i, cx in enumerate(cxs):
        r = np.hypot(xx - cx, yy - cy)
        inside = 1 / (1 + np.exp((r - R) / p["soft"]))
        dirx = 1 if i == 0 else -1
        u = np.clip((xx - cx) * dirx / R, -1, 1)          # -1 바깥쪽, +1 상대 쪽
        w = 0.12 + 0.88 * ((u + 1) / 2) ** p["bias"]
        f = cv2.GaussianBlur(inside * w, (0, 0), p["blur"])
        fields.append(f)
        us.append(u)

    # 원 두 개: 곱하기
    for f, tone in zip(fields, [p["left"], p["right"]]):
        c = hexrgb(tone)
        out *= 1 - (p["k_field"] * f)[..., None] * (1 - c)
    # 겹친 자리: 어느 쪽 것도 아닌 새 색
    lens = cv2.GaussianBlur(fields[0] * fields[1], (0, 0), p["blur"] * 5)
    lens = (lens / lens.max()) ** 1.3
    out *= 1 - (p["k_lens"] * lens)[..., None] * (1 - hexrgb(p["mix"]))

    # 식물
    srcs = [f"{HERE}/mj/plant_a_dense.webp", f"{HERE}/mj/plant_b_sparse.webp"]
    deep = [hexrgb("#B8404A"), hexrgb("#D2603E")]
    for i, (cx, src) in enumerate(zip(cxs, srcs)):
        d = plant_density(src)
        n = int(d.shape[0] * p["plant_scale"])
        d = cv2.resize(d, (n, n), interpolation=cv2.INTER_AREA)
        layer = np.zeros((H, W), np.float32)
        dirx = 1 if i == 0 else -1
        x0, y0 = int(cx + dirx * p["shift"] * R - n / 2), int(cy - n / 2)
        layer[y0:y0 + n, x0:x0 + n] = d
        u = us[i]
        keep = 1 - smooth(p["fade"][0], p["fade"][1], u)     # 바깥은 선명, 가운데로 갈수록 사라짐
        dirx = 1 if i == 0 else -1
        seep = motion(cv2.GaussianBlur(layer, (0, 0), 6), p["seep_len"], dirx)
        seep = cv2.GaussianBlur(seep, (0, 0), 14) * smooth(0.0, 0.7, u) * (1 - smooth(0.9, 1.0, u) * 0.3)
        tone = deep[i]
        out *= 1 - (p["k_plant"] * layer * keep)[..., None] * (1 - tone)
        out *= 1 - (p["k_seep"] * seep)[..., None] * (1 - hexrgb(p["mix"]))

    # 그레인
    rng = np.random.default_rng(3)
    out += rng.normal(0, 0.008, out.shape[:2])[..., None]
    out = np.clip(out, 0, 1)
    dst = f"{HERE}/merge_{name}.png"
    cv2.imwrite(dst, (out * 255).astype(np.uint8))
    return dst


if __name__ == "__main__":
    print(build(name=sys.argv[1] if len(sys.argv) > 1 else "a"))
