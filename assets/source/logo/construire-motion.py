"""Pack de calques PNG transparents pour le motion design (After Effects, CapCut, Premiere).
Tous les calques d'un même dossier sont sur la même toile et au même endroit : il suffit de les empiler.
Usage : uv run --with playwright python assets/source/logo/construire-motion.py <chrome-headless-shell>"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ICI = pathlib.Path(__file__).parent
SORTIE = ICI.parent / 'motion'
CREME, NOIR, ROSE = '#FFF7F2', '#0B0B0F', '#FF3D8B'
MOT = json.loads((ICI / 'akalie-lettres.json').read_text())


def etoile(x, y, s, c):
    k = s * .16
    return (f'<path fill="{c}" d="M{x} {y-s}C{x+k} {y-k} {x+k} {y-k} {x+s} {y}C{x+k} {y+k} {x+k} {y+k} {x} {y+s}'
            f'C{x-k} {y+k} {x-k} {y+k} {x-s} {y}C{x-k} {y-k} {x-k} {y-k} {x} {y-s}Z"/>')


def anneau(c):
    return f'<circle cx="43" cy="55" r="20.5" fill="none" stroke="{c}" stroke-width="10"/>'


def barre(c):
    return f'<rect x="63.5" y="30" width="10" height="49" rx="5" fill="{c}"/>'


def aura(base=CREME, opacite=1, vb=(100, 100), taches=None):
    w, h = vb
    taches = taches or [(35, 40, 26, '#FFC2D1'), (65, 62, 26, '#C9B8FF'), (60, 30, 16, '#FFD9B0')]
    cercles = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{opacite}"/>' for x, y, r, c in taches)
    return (f'<defs><filter id="f" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="{14 * max(w, h) / 100}"/></filter></defs>'
            f'<rect width="{w}" height="{h}" fill="{base}"/><g filter="url(#f)">{cercles}</g>')


def svg(vb, corps):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{corps}</svg>'


ICONE = '0 0 100 100'
coin = '<clipPath id="c"><rect width="100" height="100" rx="22.4"/></clipPath>'
# Le mot, cadré avec une marge : x de -60 à largeur+60, y de -820 à 60 (unités de police).
VB_MOT = f'-60 -820 {MOT["largeur"] + 120} 880'
mot = lambda c: ''.join(f'<path fill="{c}" d="{l["d"]}"/>' for l in MOT['lettres'])
# Logo horizontal : icône 100 × 100 puis le mot à 56 de haut (comme akalie-logo.svg).
ech = 56 / 750
larg_logo = 124 + MOT['largeur'] * ech + 2


def tuile():
    # L'aura découpée en carré arrondi (même rayon que l'icône de l'app).
    return (aura().replace('<defs>', f'<defs>{coin}', 1)
            .replace('<rect width="100" height="100" fill', '<g clip-path="url(#c)"><rect width="100" height="100" fill', 1) + '</g>')


logo = lambda c: (tuile() + anneau(NOIR) + barre(NOIR) + etoile(80, 22, 7, ROSE)
                  + f'<g transform="translate(124 78) scale({ech})">{mot(c)}</g>')

calques = {
    # icone/ : 4096 × 4096, tous alignés
    'icone/00-icone-complete.png': (svg(ICONE, tuile() + anneau(NOIR) + barre(NOIR) + etoile(80, 22, 7, ROSE)), 4096, 4096),
    'icone/01-tuile-aura-arrondie.png': (svg(ICONE, tuile()), 4096, 4096),
    'icone/01-tuile-aura-carree.png': (svg(ICONE, aura()), 4096, 4096),
    'icone/02-anneau-noir.png': (svg(ICONE, anneau(NOIR)), 4096, 4096),
    'icone/02-anneau-creme.png': (svg(ICONE, anneau(CREME)), 4096, 4096),
    'icone/03-barre-noire.png': (svg(ICONE, barre(NOIR)), 4096, 4096),
    'icone/03-barre-creme.png': (svg(ICONE, barre(CREME)), 4096, 4096),
    'icone/04-etincelle-rose.png': (svg(ICONE, etoile(80, 22, 7, ROSE)), 4096, 4096),
    'icone/05-symbole-noir.png': (svg(ICONE, anneau(NOIR) + barre(NOIR) + etoile(80, 22, 7, ROSE)), 4096, 4096),
    'icone/05-symbole-creme.png': (svg(ICONE, anneau(CREME) + barre(CREME) + etoile(80, 22, 7, ROSE)), 4096, 4096),
    # mot/ : 4000 px de large, toutes les lettres à leur place
    'mot/akalie-noir.png': (svg(VB_MOT, mot(NOIR)), 4000, None),
    'mot/akalie-creme.png': (svg(VB_MOT, mot(CREME)), 4000, None),
    **{f'mot/lettre-{i + 1}-{l["lettre"]}-noire.png': (svg(VB_MOT, f'<path fill="{NOIR}" d="{l["d"]}"/>'), 4000, None) for i, l in enumerate(MOT['lettres'])},
    **{f'mot/lettre-{i + 1}-{l["lettre"]}-creme.png': (svg(VB_MOT, f'<path fill="{CREME}" d="{l["d"]}"/>'), 4000, None) for i, l in enumerate(MOT['lettres'])},
    # logo/ : logo horizontal complet
    'logo/logo-complet-noir.png': (svg(f'0 0 {larg_logo:.1f} 100', logo(NOIR)), 4000, None),
    'logo/logo-complet-creme.png': (svg(f'0 0 {larg_logo:.1f} 100', logo(CREME)), 4000, None),
    # fonds/ : l'aura aux formats vidéo (opaques)
    'fonds/aura-claire-9x16.png': (svg('0 0 100 178', aura(CREME, 1, (100, 178), [(20, 22, 34, '#FFC2D1'), (85, 12, 28, '#FFD9B0'), (85, 70, 36, '#C9B8FF'), (12, 130, 30, '#FFC2D1'), (80, 160, 26, '#FFD9B0')])), 2160, 3840),
    'fonds/aura-sombre-9x16.png': (svg('0 0 100 178', aura(NOIR, .35, (100, 178), [(20, 22, 34, '#FFC2D1'), (85, 12, 28, '#FFD9B0'), (85, 70, 36, '#C9B8FF'), (12, 130, 30, '#FFC2D1'), (80, 160, 26, '#FFD9B0')])), 2160, 3840),
    'fonds/aura-claire-16x9.png': (svg('0 0 178 100', aura(CREME, 1, (178, 100), [(30, 30, 34, '#FFC2D1'), (100, 15, 26, '#FFD9B0'), (150, 70, 36, '#C9B8FF'), (60, 90, 26, '#FFD9B0')])), 3840, 2160),
    'fonds/aura-claire-carre.png': (svg(ICONE, aura()), 2160, 2160),
}

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=sys.argv[1])
    for chemin, (source, w, h) in calques.items():
        if h is None:
            vb = [float(v) for v in source.split('viewBox="')[1].split('"')[0].split()]
            h = round(w * vb[3] / vb[2])
        sortie = SORTIE / chemin
        sortie.parent.mkdir(parents=True, exist_ok=True)
        page = nav.new_page(viewport={'width': w, 'height': h})
        page.set_content('<html><body style="margin:0;background:transparent">'
                         + source.replace('<svg ', f'<svg width="{w}" height="{h}" style="display:block" ', 1) + '</body></html>')
        page.screenshot(path=str(sortie), omit_background=True)
        page.close()
        print('ok', chemin, w, h)
    nav.close()
