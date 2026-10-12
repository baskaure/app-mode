"""Planches comparatives : une par personne, une ligne par vêtement.
Colonnes : personne d'origine | vêtement | FitDiT | Kolors | Texel (VTON-D)."""
import glob, os
from PIL import Image, ImageDraw, ImageFont
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
f_t, f_s, f_x = ImageFont.truetype(FB, 30), ImageFont.truetype(FB, 22), ImageFont.truetype(F, 26)
DEMOS = [("fitdit", "FitDiT"), ("kolors", "Kolors"), ("texel", "Texel VTON-D")]
PERS = {"P1": "P1 - femme ronde / grande taille", "P2": "P2 - femme menue (petit gabarit)",
        "P3": "P3 - homme", "P4": "P4 - mannequin de reference (image demo FitDiT)"}
VET = {"G1": "t-shirt imprime", "G2": "jean brode", "G3": "robe longue a motif", "G3h": "polo manches longues"}
W, H = 360, 480; TOP = 70; LAB = 70
import csv
NOTES = {(r["demo"], r["personne"], r["vetement"]): r for r in csv.DictReader(open("resultats/notes.csv"))}
f_n = ImageFont.truetype(F, 18)
def img(p):
    if not p or not os.path.exists(p): return None
    im = Image.open(p).convert("RGB"); im.thumbnail((W, H)); return im
def cell(S, d, im, x, y, txt, note=None):
    d.rectangle([x, y, x + W - 1, y + H - 1], fill=(235, 235, 235))
    if im is None: d.text((x + W // 2, y + H // 2), "pas de resultat\n(quota GPU gratuit epuise)", font=f_x, fill=(170, 0, 0), anchor="mm", align="center")
    else: S.paste(im, (x + (W - im.width) // 2, y + (H - im.height) // 2))
    d.text((x + W // 2, y + H + 6), txt, font=f_s, fill="black", anchor="ma")
    if note: d.text((x + W // 2, y + H + 36), "corps %s | visage %s | vet. %s | real. %s /5" % (note["corps"], note["visage"], note["vetement_fidelite"], note["realisme"]), font=f_n, fill=(60, 60, 60), anchor="ma")
for P, ptxt in PERS.items():
    Gs = ["G1", "G2", "G3h" if P == "P3" else "G3"]
    cols = 2 + len(DEMOS)
    S = Image.new("RGB", (cols * W + (cols + 1) * 10, TOP + len(Gs) * (H + LAB + 10) + 10), "white"); d = ImageDraw.Draw(S)
    d.text((10, 18), ptxt, font=f_t, fill="black")
    for r, G in enumerate(Gs):
        y = TOP + r * (H + LAB + 10)
        cells = [(img(glob.glob(f"images/prep/{P}_*.jpg")[0]), "Personne d'origine"),
                 (img(glob.glob(f"images/prep/{G}_*.jpg")[0]), "Vetement : " + VET[G])]
        cells = [(a, b, None) for a, b in cells]
        cells += [(img(f"resultats/brut/{k}_{P}_{G}.png"), n, NOTES.get((k, P, G))) for k, n in DEMOS]
        for c, (im, t, n) in enumerate(cells): cell(S, d, im, 10 + c * (W + 10), y, t, n)
    S.save(f"resultats/planche_{P}.jpg", quality=88); print("resultats/planche_%s.jpg" % P, S.size)
