"""Warm gradient-map coloring for x-ray dishes, then multiply-overlap two of them.
usage: python color.py  (reads d_0230.png, d_0222.png in this folder)"""
import os, numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__))
BG = np.array([0.984, 0.953, 0.925])  # warm off-white (RGB)

def hex2rgb(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) / 255 for i in (0, 2, 4)])

def gradient_map(gray, tone, deep):
    """gray: 0..1 (bg ~0.975). density 0 -> BG, mid -> tone, high -> deep."""
    d = np.clip((gray.max() - gray) / 0.75, 0, 1)[..., None]
    a = np.clip(d / 0.45, 0, 1)            # bg -> tone
    b = np.clip((d - 0.45) / 0.55, 0, 1)   # tone -> deep
    col = BG * (1 - a) + tone * a
    col = col * (1 - b) + deep * b
    # translucent tinted disc: makes the overlap lens show a mixed color
    S = gray.shape[0]; disc = np.zeros((S, S), np.float32)
    cv2.circle(disc, (S // 2, S // 2), 560, 1.0, -1, cv2.LINE_AA)
    disc = cv2.GaussianBlur(disc, (0, 0), 2)[..., None] * TINT
    return col * (1 - disc) + (col * tone) * disc

TINT = 0.22

def load(name):
    return cv2.imdecode(np.fromfile(os.path.join(HERE, name), np.uint8), 0).astype(np.float32) / 255

def save(name, rgb):
    bgr = (np.clip(rgb, 0, 1)[..., ::-1] * 255).astype(np.uint8)
    cv2.imencode('.png', bgr)[1].tofile(os.path.join(HERE, name))

def pair(a, b, ta, da, tb, db, shift=0.62):
    A0, B0 = gradient_map(a, ta, da), gradient_map(b, tb, db)
    S = a.shape[0]; off = int(S * shift); W = S + off
    A = np.ones((S, W, 3)) * BG; B = A.copy()
    A[:, :S] = A0; B[:, off:] = B0
    return A * B / BG  # multiply blend: overlap makes a new, deeper color

SETS = {  # name: (tone A, deep A, tone B, deep B)
    'orange-pink':  ('#F4875A', '#B8401E', '#EE6F9A', '#A82858'),
    'apricot-red':  ('#F6A86A', '#C0602A', '#E8505A', '#9E1F2E'),
    'coral-magenta':('#F27860', '#B03A2A', '#D85AB0', '#8A2070'),
}

if __name__ == '__main__':
    a, b = load('d_0230.png'), load('d_0222.png')
    rows = []
    for name, (ta, da, tb, db) in SETS.items():
        out = pair(a, b, hex2rgb(ta), hex2rgb(da), hex2rgb(tb), hex2rgb(db))
        save(f'c_pair_{name}.png', out)
        rows.append(cv2.resize(out, None, fx=0.35, fy=0.35, interpolation=cv2.INTER_AREA))
        print(name)
    save('c_sheet.png', np.vstack(rows))
