"""Two colored x-ray dishes overlap; their color seeps down and gathers into one point,
so the whole silhouette reads as a heart.  usage: python tail.py"""
import numpy as np, cv2
from color import load, save, gradient_map, hex2rgb, BG, SETS

R = 560  # dish radius used in dish.py

def smear(shape, c, tip, r, n=90, power=1.25, alpha=0.06, ramp=False):
    """stack shrinking discs from circle center down to the tip -> density field"""
    T = np.zeros(shape, np.float32)
    for i in range(n):
        t = i / n
        x = c[0] + (tip[0] - c[0]) * t ** power
        y = c[1] + (tip[1] - c[1]) * t
        rr = max(4, r * 0.95 * (1 - t) ** 1.05)
        L = np.zeros(shape, np.float32)
        cv2.circle(L, (int(x), int(y)), int(rr), 1.0, -1, cv2.LINE_AA)
        T += L * alpha * ((0.6 + 0.4 * t) if ramp else 1)
    return T

def glow(shape, c, sigma):
    L = np.zeros(shape, np.float32); L[int(c[1]), int(c[0])] = 1
    L = cv2.GaussianBlur(L, (0, 0), sigma); return L / L.max()

def mul(img, T, color):
    """multiply-blend a color onto img with strength T (0..1)"""
    T = np.clip(T, 0, 1)[..., None]
    return img * (1 - T) + img * (color / BG) * T

def build(set_name='orange-pink', shift=0.62, tip_k=1.85, blur=55, k_tail=0.9,
          inside=0.2, k_lens=0.18, k_tip=0.4, k_mix=0.45):
    ta, da, tb, db = [hex2rgb(h) for h in SETS[set_name]]
    a, b = load('d_0230.png'), load('d_0222.png')
    S = a.shape[0]; off = int(S * shift)
    W, H = S + off, S + int(R * (tip_k - 0.55))
    A = np.ones((H, W, 3)) * BG; B = A.copy()
    A[:S, :S] = gradient_map(a, ta, da); B[:S, off:] = gradient_map(b, tb, db)
    img = A * B / BG

    ca, cb = (S // 2, S // 2), (off + S // 2, S // 2)
    tip = ((ca[0] + cb[0]) / 2, S // 2 + R * tip_k)
    discs = np.zeros((H, W), np.float32)
    for c in (ca, cb): cv2.circle(discs, c, R, 1.0, -1, cv2.LINE_AA)
    keep = 1 - discs * (1 - inside)  # weaker smear over the plants so they stay legible
    # each world seeps toward the shared point
    for c, tone in ((ca, ta), (cb, tb)):
        T = cv2.GaussianBlur(smear((H, W), c, tip, R), (0, 0), blur)
        img = mul(img, T * k_tail * keep, tone)
    # where the two worlds meet, a third color (theirs together) seeps down the middle
    mixed = ta * tb / BG
    lens_c = ((ca[0] + cb[0]) / 2, S // 2 + R * 0.35)
    M = cv2.GaussianBlur(smear((H, W), lens_c, tip, R * 0.6, power=1.0, ramp=True), (0, 0), blur * 1.2)
    img = mul(img, M * k_mix, mixed)
    mid = (lens_c[0], S // 2)
    img = mul(img, glow((H, W), mid, R * 0.3) * k_lens, mixed)
    # warmest where everything gathers
    img = mul(img, glow((H, W), (tip[0], tip[1] - R * 0.45), R * 0.3) * k_tip, hex2rgb('#E8384A'))
    # fine grain
    rng = np.random.default_rng(1)
    img = img + rng.normal(0, 0.012, img.shape[:2])[..., None]
    return np.clip(img, 0, 1)

if __name__ == '__main__':
    variants = {
        'tail_a': dict(),                                   # base
        'tail_b_short': dict(tip_k=1.6, blur=45),           # closer to "two circles"
        'tail_c_soft': dict(tip_k=2.05, blur=80, k_tail=1.1),  # more seeping, softer heart
    }
    rows = []
    for name, kw in variants.items():
        out = build(**kw); save(f'{name}.png', out); print(name, out.shape)
        h = 700; rows.append(cv2.resize(out, (int(out.shape[1] * h / out.shape[0]), h), interpolation=cv2.INTER_AREA))
    save('tail_sheet.png', np.hstack(rows))
