"""Crop and pack the ImageGen print sheets without repainting their artwork."""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


SPRITES = ('valley', 'forest', 'village', 'town', 'camp', 'lake', 'prison', 'estate', 'mountain')
GROUND_GROUPS = ('grounds_early', 'grounds_mid', 'grounds_late')
GROUND_CUTS = {'grounds_mid': (0, .333, .665, 1)}


def sprite_cells(sheet, key, output):
    if sheet.mode != 'RGBA':
        raise ValueError(f'{key}: sprite sheet has no alpha channel')
    rgba = np.array(sheet)
    alpha = rgba[:, :, 3]
    components, count = ndimage.label(ndimage.binary_dilation(alpha > 80, iterations=2))
    sizes = np.bincount(components.ravel())
    owners = np.zeros(count + 1, dtype=np.uint8)
    for i, box in enumerate(ndimage.find_objects(components), start=1):
        if sizes[i] < 30:
            continue
        ys, xs = np.where(components[box] == i)
        row = int(2 * (box[0].start + ys.mean()) / sheet.height)
        col = int(3 * (box[1].start + xs.mean()) / sheet.width)
        owners[i] = row * 3 + col + 1
    slots = owners[components]
    for slot in range(1, 7):
        slot_alpha = np.where(slots == slot, alpha, 0)
        visible = Image.fromarray(slot_alpha).point(lambda a: 255 if a > 30 else 0).getbbox()
        if not visible or np.count_nonzero(slot_alpha > 112) < .0075 * alpha.size:
            raise ValueError(f'{key} slot {slot} has no usable silhouette')
        left, top, right, bottom = visible
        x0, y0 = max(0, left - 3), max(0, top - 3)
        x1, y1 = min(sheet.width, right + 3), min(sheet.height, bottom + 3)
        cut = rgba[y0:y1, x0:x1].copy()
        cut[:, :, 3] = slot_alpha[y0:y1, x0:x1]
        Image.fromarray(cut).save(output / f'{key}-{slot}.webp', quality=93, method=2)


def ground_bands(sheet, key, names, output):
    cuts = GROUND_CUTS.get(key, (0, 1 / 3, 2 / 3, 1))
    for i, name in enumerate(names):
        y0, y1 = (round(cuts[j] * sheet.height) for j in (i, i + 1))
        cell = sheet.convert('RGB').crop((0, y0 + 5, sheet.width, y1 - 5))
        cell.save(output / f'{name}-paper.webp', quality=89, method=2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('raw', type=Path)
    parser.add_argument('--output', type=Path, default=Path(__file__).with_name('art'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for key in SPRITES:
        if (path := args.raw / f'{key}.png').is_file():
            with Image.open(path) as sheet:
                sprite_cells(sheet, key, args.output)
    for i, key in enumerate(GROUND_GROUPS):
        if (path := args.raw / f'{key}.png').is_file():
            with Image.open(path) as sheet:
                ground_bands(sheet, key, SPRITES[3 * i:3 * i + 3], args.output)
    if (path := args.raw / 'cover.png').is_file():
        with Image.open(path) as sheet:
            sheet.convert('RGB').save(args.output / 'cover.webp', quality=92, method=2)


if __name__ == '__main__':
    main()
