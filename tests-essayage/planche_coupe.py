"""Planche « coupe du jean » : personne | jean | API Kling keep_pose=true | API Kling keep_pose=false."""
import glob, os
from PIL import Image, ImageDraw, ImageFont
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
f_t = ImageFont.truetype(FB, 30) if os.path.exists(FB) else ImageFont.load_default(30)
f_s = ImageFont.truetype(FB, 22) if os.path.exists(FB) else ImageFont.load_default(22)
W, H, TOP, LAB = 360, 480, 70, 40
def un(m):
    l = sorted(glob.glob(m)); return l[0] if l else None
COLS = [("Personne", lambda P: un(f"images/prep/{P}_*.jpg")), ("Jean droit", lambda P: un("images/prep/G2_*.jpg")),
        ("keep_pose = oui", lambda P: f"resultats/brut/klingapi_{P}_G2.png"), ("keep_pose = non", lambda P: f"resultats/brut/klinglibre_{P}_G2.png")]
Ps = ["P1", "P2", "P3", "P4"]
S = Image.new("RGB", (len(COLS) * W + (len(COLS) + 1) * 10, TOP + len(Ps) * (H + LAB + 10) + 10), "white"); d = ImageDraw.Draw(S)
d.text((10, 18), "Coupe du jean droit selon le reglage keep_pose (API Kling, 13 oct. 2026)", font=f_t, fill="black")
for r, P in enumerate(Ps):
    y = TOP + r * (H + LAB + 10)
    for c, (titre, chemin) in enumerate(COLS):
        x = 10 + c * (W + 10); p = chemin(P)
        d.rectangle([x, y, x + W - 1, y + H - 1], fill=(235, 235, 235))
        if p and os.path.exists(p):
            im = Image.open(p).convert("RGB"); im.thumbnail((W, H)); S.paste(im, (x + (W - im.width) // 2, y + (H - im.height) // 2))
        d.text((x + W // 2, y + H + 6), f"{P} - {titre}", font=f_s, fill="black", anchor="ma")
S.save("resultats/planche_coupe_jean.jpg", quality=88); print("ok")
