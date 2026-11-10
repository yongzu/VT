"""Place an x-ray plant inside a glass petri dish with lens bubbles."""
import sys, numpy as np, cv2
rng = np.random.default_rng(3)

def place(plant, mask, S, R):
    h, w = plant.shape; s = (2 * R * 0.92) / max(h, w)
    plant = cv2.resize(plant, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    mask = cv2.resize(mask, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    canvas = np.ones((S, S), np.float32); M = np.zeros((S, S), np.float32)
    h, w = plant.shape; y0, x0 = (S - h) // 2, (S - w) // 2
    canvas[y0:y0+h, x0:x0+w] = plant; M[y0:y0+h, x0:x0+w] = mask
    return canvas, M

def ring(S, c, r, width, blur):
    L = np.zeros((S, S), np.float32)
    cv2.circle(L, c, int(r), 1.0, int(width), cv2.LINE_AA)
    return cv2.GaussianBlur(L, (0, 0), blur) if blur else L

def glass(img, c, r, k=1.0):
    S = img.shape[0]; t = max(r / 560, 0.12)
    w = lambda x: max(1, int(round(x * t)))
    shadow = ring(S, (c[0], c[1] + w(4)), r, w(10), 6 * t) * 0.10 * k
    body = ring(S, c, r, w(9), 1.2 * t + 0.3) * 0.16 * k
    inner = ring(S, c, max(1, r - w(7)), w(2), 0.8 * t + 0.2) * 0.12 * k
    hi = ring(S, (c[0] - 1, c[1] - 1), max(1, r - w(2)), w(2), 0.6 * t + 0.2) * 0.9 * k
    img = img * (1 - shadow) * (1 - body) * (1 - inner)
    return np.clip(img + hi * (1 - img), 0, 1)

def bubble(img, c, r):
    S = img.shape[0]; yy, xx = np.mgrid[:S, :S].astype(np.float32)
    dx, dy = xx - c[0], yy - c[1]; d = np.sqrt(dx**2 + dy**2) / r
    f = np.where(d < 1, 0.55 + 0.45 * d**2, 1.0)
    src = cv2.remap(img, c[0] + dx * f, c[1] + dy * f, cv2.INTER_LINEAR)
    inside = cv2.GaussianBlur((d < 1).astype(np.float32), (0, 0), 1.0)
    out = img * (1 - inside) + (src * 0.97 + 0.02) * inside
    out = glass(out, c, r, 0.7)
    # crescent highlight
    hl = np.zeros_like(img); cv2.ellipse(hl, (int(c[0] - r*0.35), int(c[1] - r*0.4)), (int(r*0.35), int(r*0.12)), -35, 0, 360, 1.0, -1, cv2.LINE_AA)
    hl = cv2.GaussianBlur(hl, (0, 0), r * 0.06) * 0.55
    return np.clip(out + hl * (1 - out), 0, 1)

def dish(plant_path, S=1400, R=560, bubbles=True):
    plant = cv2.imdecode(np.fromfile(plant_path, np.uint8), 0).astype(np.float32) / 255
    mask = cv2.imdecode(np.fromfile(plant_path.replace('.png', '_mask.png'), np.uint8), 0).astype(np.float32) / 255
    img, M = place(plant, mask, S, R * 0.95)
    c = (S // 2, S // 2)
    if bubbles:
        for (ox, oy, br) in [(-0.38, -0.30, 0.30), (0.42, -0.10, 0.12), (0.18, 0.12, 0.11), (-0.32, 0.30, 0.13)]:
            img = bubble(img, (int(c[0] + ox*R), int(c[1] + oy*R)), int(br*R))
        for _ in range(9):
            a = rng.uniform(0, 2*np.pi); rr = rng.uniform(0.3, 0.9) * R
            img = glass(img, (int(c[0] + np.cos(a)*rr), int(c[1] + np.sin(a)*rr)), int(rng.uniform(5, 12)), 0.6)
    img = glass(img, c, R)
    bg = 0.975
    return img * bg

if __name__ == '__main__':
    out = dish(sys.argv[1], bubbles=(len(sys.argv) < 4))
    cv2.imencode('.png', (out * 255).astype(np.uint8))[1].tofile(sys.argv[2]); print(sys.argv[2])
