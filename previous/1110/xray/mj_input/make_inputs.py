"""Make Midjourney input images from a transparent plant cutout (PNG/WebP with alpha).
usage: python mj_input/make_inputs.py <cutout> <name>
  -> mj_input/<name>_A_gray.png  (plain grey, light)   -> mj_input/<name>_B_xray.png (code x-ray)
Plant fills ~60% of a 2000px white square so it stays inside the dish."""
import sys, os, numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.dirname(HERE))
from xray import xray, P

def pad(g, frac=0.6, S=2000):
    ys, xs = np.where(g < 250); crop = g[ys.min():ys.max()+1, xs.min():xs.max()+1]
    s = S * frac / max(crop.shape); crop = cv2.resize(crop, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    out = np.full((S, S), 255, np.uint8); h, w = crop.shape
    out[(S-h)//2:(S-h)//2+h, (S-w)//2:(S-w)//2+w] = crop; return out

src, name = sys.argv[1], sys.argv[2]
rgba = cv2.imdecode(np.fromfile(src, np.uint8), cv2.IMREAD_UNCHANGED)
a = rgba[..., 3].astype(np.float32) / 255
im = (rgba[..., :3] * a[..., None] + 255 * (1 - a[..., None])).astype(np.uint8)
m = (a > 0.5).astype(np.float32); ms = cv2.GaussianBlur(a, (0, 0), 0.8)
g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
v = g[m > 0]; gn = np.clip((g - np.percentile(v, 2)) / (np.percentile(v, 98) - np.percentile(v, 2)), 0, 1)
A = 1 - (1 - (0.55 + 0.35 * gn)) * ms
P2 = dict(P, flip=('flip' in sys.argv))
B, _ = xray(im, m, P2)
for tag, img in (('A_gray', A), ('B_xray', B)):
    cv2.imencode('.png', pad((np.clip(img, 0, 1) * 255).astype(np.uint8)))[1].tofile(os.path.join(HERE, f'{name}_{tag}.png'))
print('ok', name)
