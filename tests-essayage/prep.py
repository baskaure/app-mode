"""Prépare les photos personnes : padding (sans déformation) au ratio 3:4 puis 768x1024."""
import glob, os
from PIL import Image
os.makedirs("images/prep", exist_ok=True)
for f in sorted(glob.glob("images/*.jpg")):
    im = Image.open(f).convert("RGB"); w, h = im.size
    tw = round(h * 3 / 4)
    if abs(w / h - 0.75) > 0.01:
        if w < tw:   # trop étroit : on élargit avec la couleur des bords
            px = [im.getpixel((2, 2)), im.getpixel((w - 3, 2))]
            col = tuple(sum(c[i] for c in px) // 2 for i in range(3))
            can = Image.new("RGB", (tw, h), col); can.paste(im, ((tw - w) // 2, 0)); im = can
        else:        # trop large : on recadre au centre
            th = round(w * 4 / 3); can = Image.new("RGB", (w, th), im.getpixel((2, 2))); can.paste(im, (0, (th - h) // 2)); im = can
    im = im.resize((768, 1024), Image.LANCZOS)
    im.save("images/prep/" + os.path.basename(f), quality=95)
    print(f, "->", im.size)
