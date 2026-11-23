"""Pack reference-guided ImageGen plates and trace opaque print edges."""

import argparse
from pathlib import Path
import json

import cv2
import numpy as np
from PIL import Image


PROJECT = Path(__file__).resolve().parent
PROPS = ('pine', 'pines', 'rocks', 'cliff', 'bell', 'fence', 'gate', 'reeds',
         'traveler', 'shield', 'spear', 'flowers')
INDIVIDUAL = ('broken-steel', 'axe-master', 'scythe-pursuer', 'iron-tower', 'waterfall')


def split_props(sheet):
    """Assign connected silhouettes to a cell by overlap with the atlas grid."""
    rgba = np.asarray(sheet.convert('RGBA'))
    alpha = rgba[:, :, 3]
    mask = cv2.dilate((alpha > 76).astype(np.uint8), np.ones((3, 3), np.uint8))
    count, labels, stats, centers = cv2.connectedComponentsWithStats(mask)
    assignments = np.zeros(count, dtype=np.uint8)
    for label in range(1, count):
        if stats[label, cv2.CC_STAT_AREA] < 42:
            continue
        x, y = centers[label]
        column = min(3, int(4 * x / sheet.width))
        row = min(2, int(3 * y / sheet.height))
        assignments[label] = row * 4 + column + 1
    slots = assignments[labels]
    for index, key in enumerate(PROPS, 1):
        isolated = rgba.copy()
        isolated[:, :, 3] = np.where(slots == index, alpha, 0)
        if np.count_nonzero(isolated[:, :, 3] > 92) < alpha.size * .003:
            raise ValueError(f'{key} has insufficient alpha in atlas cell {index}')
        yield key, Image.fromarray(isolated)


def pack(image, target):
    image = image.convert('RGBA')
    alpha = image.getchannel('A')
    bbox = alpha.point(lambda value: 255 if value > 30 else 0).getbbox()
    if not bbox or alpha.getextrema()[0] > 4:
        raise ValueError(f'{target.name} has no transparent, usable print')
    image = image.crop(bbox)
    image.thumbnail((1350, 1350), Image.Resampling.LANCZOS)
    image.save(target, quality=93, method=3)
    solid = (np.asarray(image.getchannel('A')) > 119).astype(np.uint8)
    contours, _ = cv2.findContours(solid, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    rings = []
    for contour in contours:
        if cv2.contourArea(contour) < max(48, image.width * image.height * .0004):
            continue
        route = cv2.approxPolyDP(contour, max(1.3, image.height * .0013), True)
        if len(route) < 3:
            continue
        rings.append([[round(x / image.width - .5, 5), round(1 - y / image.height, 5)]
                      for [[x, y]] in route.tolist()])
    return {'ratio': round(image.width / image.height, 6), 'rings': rings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('raw', type=Path)
    args = parser.parse_args()
    out = PROJECT / 'art'
    out.mkdir(exist_ok=True)
    assets = {}
    for key in INDIVIDUAL:
        with Image.open(args.raw / f'{key}.png') as im:
            assets[key] = pack(im, out / f'{key}.webp')
    with Image.open(args.raw / 'props.png') as atlas:
        for key, im in split_props(atlas):
            assets[key] = pack(im, out / f'{key}.webp')
    with Image.open(args.raw / 'ground.png') as ground:
        ground.convert('RGB').save(out / 'ground.webp', quality=93, method=3)
    (out / 'contours.json').write_text(json.dumps(assets, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
