"""Planches API Kling vs FASHN (et démo Kolors) : une par personne, une ligne par vêtement.
Colonnes : personne d'origine | vêtement | Kolors (démo gratuite, 12 oct.) | API Kling (payante, 12-13 oct.)."""
import glob, os
from PIL import Image, ImageDraw, ImageFont
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not os.path.exists(F):
    F = FB = None
def police(chemin, taille): return ImageFont.truetype(chemin, taille) if chemin else ImageFont.load_default(taille)
f_t, f_s = police(FB, 30), police(FB, 22)
PERS = {"P1": "P1 - femme ronde", "P2": "P2 - femme menue", "P3": "P3 - homme", "P4": "P4 - mannequin de reference"}
W, H = 360, 480; TOP = 70; LAB = 40
def img(p):
    if not p or not os.path.exists(p): return None
    im = Image.open(p).convert("RGB"); im.thumbnail((W, H)); return im
def un(motif):
    l = sorted(glob.glob(motif)); return l[0] if l else None
COLS = [("Personne", lambda P, G: un(f"images/prep/{P}_*.jpg")), ("Vetement", lambda P, G: un(f"images/prep/{G}_*.jpg")),
        ("API Kling", lambda P, G: f"resultats/brut/klingapi_{P}_{G}.png"), ("FASHN", lambda P, G: f"resultats/brut/fashn_{P}_{G}.png")]
for P, ptxt in PERS.items():
    Gs = ["G1", "G2", "G3h" if P == "P3" else "G3"]
    S = Image.new("RGB", (len(COLS) * W + (len(COLS) + 1) * 10, TOP + len(Gs) * (H + LAB + 10) + 10), "white"); d = ImageDraw.Draw(S)
    d.text((10, 18), ptxt, font=f_t, fill="black")
    for r, G in enumerate(Gs):
        y = TOP + r * (H + LAB + 10)
        for c, (titre, chemin) in enumerate(COLS):
            x = 10 + c * (W + 10); im = img(chemin(P, G))
            d.rectangle([x, y, x + W - 1, y + H - 1], fill=(235, 235, 235))
            if im: S.paste(im, (x + (W - im.width) // 2, y + (H - im.height) // 2))
            d.text((x + W // 2, y + H + 6), f"{titre} - {G}" if c >= 2 else titre, font=f_s, fill="black", anchor="ma")
    S.save(f"resultats/planche_kling_fashn_{P}.jpg", quality=88)
    print("ok", P)
