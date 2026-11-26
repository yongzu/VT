"""Fake X-ray / backlit translucency from a studio plant photo (grey bg, hand)."""
import sys, numpy as np, cv2

def load(path, maxside=1800):
    im = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)
    s = maxside / max(im.shape[:2])
    if s < 1: im = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    return im

def plant_mask(im):
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
    m = ((h > 38) & (h < 130) & (s > 0.16)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        keep = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
        big = st[1:, cv2.CC_STAT_AREA] > st[keep, cv2.CC_STAT_AREA] * 0.02
        m = np.isin(lab, 1 + np.where(big)[0]).astype(np.uint8)
    # fill small interior holes (plant hub)
    inv = (1 - m).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n):
        x, y, w, h_, a = st[i]
        touches = x == 0 or y == 0 or x + w >= m.shape[1] or y + h_ >= m.shape[0]
        if not touches and a < m.sum() * 0.01: m[lab == i] = 1
    return m.astype(np.float32)

def xray(im, m, p):
    L = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32) / 255
    ms = cv2.GaussianBlur(m, (0, 0), 1.2)
    # normalise luminance inside plant
    vals = L[m > 0.5]; lo, hi = np.percentile(vals, 2), np.percentile(vals, 98)
    Ln = np.clip((L - lo) / (hi - lo + 1e-6), 0, 1)
    Ln = cv2.bilateralFilter(Ln, 9, 0.08, p['bs'])
    # tonal structure (darker in photo = denser): large-scale
    base = cv2.GaussianBlur(Ln, (0, 0), p['sb'])
    # fine detail: veins are lighter than blade in photo -> become dense lines
    hp = Ln - cv2.GaussianBlur(Ln, (0, 0), p['sv'])
    # veins are thin lines: their sign shows up as the skewed tail of hp
    v = hp[m > 0.5]; skew = np.mean((v - v.mean()) ** 3) / (v.std() ** 3 + 1e-9)
    sign = 1.0 if skew >= 0 else -1.0
    if p.get('flip'): sign = -sign
    veins = np.clip(sign * hp * p['kv'], -1, 1)
    # internal boundaries (overlapping leaf edges)
    gx = cv2.Sobel(cv2.GaussianBlur(Ln, (0, 0), 2.0), cv2.CV_32F, 1, 0)
    gy = cv2.Sobel(cv2.GaussianBlur(Ln, (0, 0), 2.0), cv2.CV_32F, 0, 1)
    edges = cv2.GaussianBlur(np.clip(np.hypot(gx, gy) * p['ke'], 0, 1), (0, 0), 1.5)
    # silhouette rim
    er = cv2.erode(m, np.ones((p['rw'], p['rw']), np.uint8))
    rim = cv2.GaussianBlur(m - er, (0, 0), p['rw'] * 0.4)
    # center density: distance from silhouette edge
    ys, xs = np.where(m > 0.5)
    cy, cx = p.get('hub') or (ys.mean(), xs.mean())
    size = max(np.ptp(ys), np.ptp(xs))
    yy, xx = np.mgrid[:m.shape[0], :m.shape[1]]
    rr = np.hypot(yy - cy, xx - cx) / (size * p['hr'])
    dist = np.exp(-rr ** 2)
    density = (p['d0'] + p['d1'] * (1 - base) + p['dc'] * dist ** 1.5
               + p['dv'] * veins + p['de'] * edges + p['dr'] * rim)
    density = np.clip(density, 0, 1) ** p['g'] * ms
    out = 1 - density
    return np.clip(out, 0, 1), ms

P = dict(bs=5, sb=10, sv=6, kv=3.0, ke=1.2, rw=5, d0=0.06, d1=0.20, dc=0.55, hr=0.16, dv=0.20, de=0.10, dr=0.20, g=1.15)

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    if len(sys.argv) > 3 and sys.argv[3] == 'flip': P['flip'] = True
    im = load(src); m = plant_mask(im)
    out, ms = xray(im, m, P)
    ys, xs = np.where(m > 0.5); pad = 60
    y0, y1 = max(0, ys.min() - pad), min(m.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(m.shape[1], xs.max() + pad)
    g = (out[y0:y1, x0:x1] * 255).astype(np.uint8)
    mask = (ms[y0:y1, x0:x1] * 255).astype(np.uint8)
    cv2.imencode('.png', g)[1].tofile(dst)
    cv2.imencode('.png', mask)[1].tofile(dst.replace('.png', '_mask.png'))
    print(dst, g.shape)
