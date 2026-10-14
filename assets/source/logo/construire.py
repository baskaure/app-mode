"""Construit le logo Akalie (piste 6 « Aura pastel ») : SVG sources + PNG pour l'app et les réseaux.
Usage : uv run --with playwright python assets/source/logo/construire.py assets/source/logo/akalie-mot-onest700.path <chrome-headless-shell>
Le tracé du mot vient de la police Onest 700 (OFL), interlettrage -0,04 em, converti avec fontTools."""
import sys, pathlib
from playwright.sync_api import sync_playwright

ICI = pathlib.Path(__file__).parent
FINAL = ICI / 'final'; FINAL.mkdir(exist_ok=True)
IMAGES = ICI.parent.parent / 'images'
MOT = pathlib.Path(sys.argv[1]).read_text()
MOT_LARGEUR = 2572  # unités de police (1000 par em)

CREME, NOIR, ROSE = '#FFF7F2', '#0B0B0F', '#FF3D8B'

def etoile(x, y, s, c):
    k = s * .16
    return (f'<path fill="{c}" d="M{x} {y-s}C{x+k} {y-k} {x+k} {y-k} {x+s} {y}C{x+k} {y+k} {x+k} {y+k} {x} {y+s}'
            f'C{x-k} {y+k} {x-k} {y+k} {x-s} {y}C{x-k} {y-k} {x-k} {y-k} {x} {y-s}Z"/>')

def symbole(c=NOIR, accent=ROSE):
    # « a » géométrique : un anneau + une barre, et l'étoile de l'IA
    return (f'<circle cx="43" cy="55" r="20.5" fill="none" stroke="{c}" stroke-width="10"/>'
            f'<rect x="63.5" y="30" width="10" height="49" rx="5" fill="{c}"/>' + etoile(80, 22, 7, accent))

def aura(pid):
    return (f'<filter id="flou{pid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>',
            f'<rect width="100" height="100" fill="{CREME}"/><g filter="url(#flou{pid})">'
            '<circle cx="35" cy="40" r="26" fill="#FFC2D1"/><circle cx="65" cy="62" r="26" fill="#C9B8FF"/>'
            '<circle cx="60" cy="30" r="16" fill="#FFD9B0"/></g>')

def svg(vb, defs, corps):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><defs>{defs}</defs>{corps}</svg>'

def icone(arrondie=False, pid='a', echelle=1.0):
    f, fond = aura(pid)
    clip = f'<clipPath id="coin{pid}"><rect width="100" height="100" rx="22.4"/></clipPath>' if arrondie else ''
    g = f'<g clip-path="url(#coin{pid})">' if arrondie else '<g>'
    sym = symbole() if echelle == 1 else f'<g transform="translate(50 50) scale({echelle}) translate(-52 -48)">{symbole()}</g>'
    return svg('0 0 100 100', f + clip, g + fond + sym + '</g>')

def mot(c, x, base, h):
    # h = hauteur des ascendantes (~750 unités)
    s = h / 750
    return f'<g transform="translate({x} {base}) scale({s})"><path fill="{c}" d="{MOT}"/></g>', MOT_LARGEUR * s

def logo(c_mot):
    m, l = mot(c_mot, 124, 78, 56)
    f, fond = aura('h')
    tuile = f'<clipPath id="ch"><rect width="100" height="100" rx="22.4"/></clipPath>'
    return svg(f'0 0 {124 + l + 2:.1f} 100', f + tuile, f'<g clip-path="url(#ch)">{fond}{symbole()}</g>{m}')

def texte(c):
    m, l = mot(c, 0, 56, 56)
    return svg(f'0 0 {l:.1f} 58', '', m)

fichiers = {
    'akalie-icone.svg': icone(),
    'akalie-icone-arrondie.svg': icone(arrondie=True),
    'akalie-symbole.svg': svg('0 0 100 100', '', symbole()),
    'akalie-symbole-blanc.svg': svg('0 0 100 100', '', symbole('#FFFFFF', ROSE)),
    'akalie-logo.svg': logo(NOIR),
    'akalie-logo-blanc.svg': logo('#FFFFFF'),
    'akalie-texte.svg': texte(NOIR),
    'akalie-texte-blanc.svg': texte('#FFFFFF'),
}
for nom, contenu in fichiers.items():
    (FINAL / nom).write_text(contenu)

# Rendus PNG : (source svg, sortie, largeur, hauteur)
fond_seul = svg('0 0 100 100', aura('b')[0], aura('b')[1])
avant_plan = svg('0 0 100 100', '', f'<g transform="translate(50 50) scale(.72) translate(-52 -48)">{symbole()}</g>')
mono = svg('0 0 100 100', '', f'<g transform="translate(50 50) scale(.72) translate(-52 -48)">{symbole(NOIR, NOIR)}</g>')
rendus = [
    (fichiers['akalie-icone.svg'], IMAGES / 'icon.png', 1024, 1024),
    (fond_seul, IMAGES / 'android-icon-background.png', 1024, 1024),
    (avant_plan, IMAGES / 'android-icon-foreground.png', 1024, 1024),
    (mono, IMAGES / 'android-icon-monochrome.png', 1024, 1024),
    (fichiers['akalie-icone-arrondie.svg'], IMAGES / 'splash-icon.png', 1024, 1024),
    (fichiers['akalie-icone-arrondie.svg'], IMAGES / 'favicon.png', 48, 48),
    (icone(pid='r', echelle=.85), FINAL / 'akalie-photo-profil-1080.png', 1080, 1080),
    (fichiers['akalie-icone-arrondie.svg'], FINAL / 'akalie-icone-arrondie-1024.png', 1024, 1024),
    (fichiers['akalie-logo.svg'], FINAL / 'akalie-logo-2000.png', 2000, None),
    (fichiers['akalie-logo-blanc.svg'], FINAL / 'akalie-logo-blanc-2000.png', 2000, None),
]
with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=sys.argv[2])
    for src, sortie, w, h in rendus:
        if h is None:
            vb = src.split('viewBox="')[1].split('"')[0].split()
            h = round(w * float(vb[3]) / float(vb[2]))
        page = nav.new_page(viewport={'width': w, 'height': h})
        page.set_content(f'<html><body style="margin:0;background:transparent">'
                         f'{src.replace("<svg ", f"<svg width=\"{w}\" height=\"{h}\" style=\"display:block\" ", 1)}</body></html>')
        page.screenshot(path=str(sortie), omit_background=True)
        page.close()
        print('ok', sortie.name, w, h)
    nav.close()
