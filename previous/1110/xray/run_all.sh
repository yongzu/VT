#!/usr/bin/env bash
# Rebuild every 1110 x-ray / color / heart-tail output from the photos in src/.
# setup once:  pip install -r requirements.txt
set -e
cd "$(dirname "$0")"
python xray.py src/DSC_0230.jpg x_0230f.png flip   # flip: this plant's veins are darker than the blade
python xray.py src/DSC_0222.jpg x_0222.png
python xray.py src/DSC_0178.jpg x_0178.png
python xray.py src/DSC_0236.jpg x_0236.png
python dish.py x_0230f.png d_0230.png
python dish.py x_0222.png d_0222.png
python dish.py x_0178.png d_0178.png nob           # nob: no bubbles
python color.py
python tail.py
python merge.py a
python export_webp.py
