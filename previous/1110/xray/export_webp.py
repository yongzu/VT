"""Save web-size previews of the outputs into results/ (committed)."""
import os, numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__))
NAMES = ['x_0230f', 'x_0222', 'x_0178', 'x_0236', 'd_0230', 'd_0222', 'd_0178',
         'c_pair_orange-pink', 'c_pair_apricot-red', 'c_pair_coral-magenta', 'c_sheet',
         'tail_a', 'tail_b_short', 'tail_c_soft', 'tail_sheet']
os.makedirs(os.path.join(HERE, 'results'), exist_ok=True)
for n in NAMES:
    p = os.path.join(HERE, n + '.png')
    if not os.path.exists(p): continue
    im = cv2.imdecode(np.fromfile(p, np.uint8), cv2.IMREAD_COLOR)
    s = 1600 / max(im.shape[:2])
    if s < 1: im = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    cv2.imencode('.webp', im, [cv2.IMWRITE_WEBP_QUALITY, 88])[1].tofile(os.path.join(HERE, 'results', n + '.webp'))
    print('results/' + n + '.webp')
