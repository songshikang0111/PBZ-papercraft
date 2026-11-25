"""Contact sheet of transparent stickers on a paper-grey ground: python film/tools/sheet.py out.jpg a.png b.png ..."""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont
import glob
out, files = sys.argv[1], sys.argv[2:]
W, H = 360, 400
cols = min(6, len(files)); rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 28)), (214, 206, 188))
dr = ImageDraw.Draw(sheet)
f = glob.glob('/usr/share/fonts/**/*CJK*', recursive=True)
font = ImageFont.truetype(f[0], 18) if f else None
for k, p in enumerate(files):
    im = Image.open(p).convert('RGBA'); bb = im.getbbox(); im = im.crop(bb) if bb else im
    im.thumbnail((W - 20, H - 20))
    x, y = (k % cols) * W, (k // cols) * (H + 28)
    sheet.paste(im, (x + (W - im.width) // 2, y + (H - im.height) // 2), im)
    dr.text((x + 8, y + H + 2), pathlib.Path(p).stem, fill=(40, 30, 20), font=font)
sheet.save(out, quality=85)
