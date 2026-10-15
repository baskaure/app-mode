# Génère les captures App Store (1206 x 2622, iPhone 6,3 pouces) à partir des écrans réels de l'app.
# Écrans : store/captures/source/ (app web, mannequin fictif créé par IA, vêtements sans marque, 15 oct. 2026).
# Lancer avec le Python de l'hôte (playwright) : python3 store/captures/generer.py
import os
from playwright.sync_api import sync_playwright

ICI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ICI, 'source')
EXE = os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell')

DIAPOS = [
    ('1-sur-toi', 'resultat-manteau.png', 'Vois-le sur toi avant de l’acheter.', 'Ta vraie photo, ton vrai corps. Pas un avatar.'),
    ('2-capture', 'resultat-robe.png', 'Une capture d’écran suffit.', 'Tu repères un vêtement en ligne, Akalie te le met sur toi.'),
    ('3-silhouette', 'silhouette.png', 'Ta silhouette en 7 questions.', 'Et ce qui la met en valeur, coupe par coupe.'),
    ('4-dressing', 'dressing.png', 'Ton placard, reconnu par l’IA.', 'Prends tes pièces en photo et essaie-les aussi.'),
    ('5-essayages', 'essayages.png', 'Tous tes essayages, gardés pour toi.', 'Ta photo reste privée. Tu effaces tout quand tu veux.'),
]

GABARIT = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: Onest; src: url('file://{src}/onest.woff2') format('woff2'); font-weight: 100 900; }}
* {{ margin: 0; box-sizing: border-box; }}
html, body {{ width: 402px; height: 874px; overflow: hidden; background: #FFF7F2; font-family: Onest, sans-serif; color: #0B0B0F; }}
.aura {{ position: absolute; inset: 0 0 auto 0; height: 520px; background: url('file://{src}/aura-clair.png') top center / cover no-repeat; }}
.texte {{ position: absolute; top: 58px; left: 28px; right: 28px; }}
h1 {{ font-size: 33px; line-height: 1.08; font-weight: 750; letter-spacing: -0.03em; }}
p {{ margin-top: 12px; font-size: 16.5px; line-height: 1.4; color: #4A4650; }}
.ecran {{ position: absolute; top: 236px; left: 50%; width: 318px; transform: translateX(-50%);
  border-radius: 38px; overflow: hidden; border: 7px solid #0B0B0F; background: #0B0B0F;
  box-shadow: 0 30px 60px -20px rgba(191, 29, 99, 0.35), 0 8px 24px rgba(11, 11, 15, 0.18); }}
.ecran img {{ display: block; width: 100%; border-radius: 31px; }}
</style></head><body><div class="aura"></div>
<div class="texte"><h1>{titre}</h1><p>{sous}</p></div>
<div class="ecran"><img src="file://{src}/{image}"></div>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    pg = b.new_page(viewport={'width': 402, 'height': 874}, device_scale_factor=3)
    for nom, image, titre, sous in DIAPOS:
        page = os.path.join(SRC, '_diapo.html')
        with open(page, 'w') as f:
            f.write(GABARIT.format(src=SRC, image=image, titre=titre, sous=sous))
        pg.goto('file://' + page)
        pg.wait_for_timeout(600)
        sortie = os.path.join(ICI, 'ios', nom + '.png')
        pg.screenshot(path=sortie)
        print(sortie)
    os.remove(page)
    b.close()
