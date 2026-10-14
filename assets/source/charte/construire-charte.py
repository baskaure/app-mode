"""Assemble la charte graphique : modele.html + logos SVG de ../logo/final → charte-graphique.html.
Usage : python3 assets/source/charte/construire-charte.py"""
import pathlib, re

ICI = pathlib.Path(__file__).parent
F = ICI.parent / 'logo' / 'final'


def svg(nom, prefixe):
    s = (F / nom).read_text()
    # Identifiants uniques à chaque insertion (filtres et découpes des SVG).
    for i in set(re.findall(r'id="([^"]+)"', s)):
        s = s.replace(f'id="{i}"', f'id="{prefixe}{i}"').replace(f'url(#{i})', f'url(#{prefixe}{i})')
    return s.replace('<svg ', '<svg width="100%" height="100%" aria-hidden="true" ', 1)


html = (ICI / 'modele.html').read_text()
n = 0
for cle, nom in [('LOGO_BLANC', 'akalie-logo-blanc.svg'), ('LOGO', 'akalie-logo.svg'),
                 ('ICONE_ARRONDIE', 'akalie-icone-arrondie.svg'), ('ICONE', 'akalie-icone-arrondie.svg'),
                 ('SYMBOLE_BLANC', 'akalie-symbole-blanc.svg'), ('SYMBOLE', 'akalie-symbole.svg'),
                 ('TEXTE', 'akalie-texte.svg')]:
    while '{{' + cle + '}}' in html:
        n += 1
        html = html.replace('{{' + cle + '}}', svg(nom, f'c{n}'), 1)

# Photo de profil : icône carrée, symbole réduit pour tenir dans le rond (comme akalie-photo-profil-1080.png).
profil = svg('akalie-icone.svg', 'cprof').replace('<circle cx="43"', '<g transform="translate(50 50) scale(.85) translate(-52 -48)"><circle cx="43"', 1)
profil = profil[: profil.rindex('</g></svg>')] + '</g></g></svg>'
html = html.replace('{{ICONE_PROFIL}}', profil)

TEINTES = [
    ('Crème', '#FFF7F2', 'Fond principal', '#0B0B0F'),
    ('Encre', '#0B0B0F', 'Texte, boutons, mode sombre', '#FFF7F2'),
    ('Rose étoile', '#FF3D8B', 'Étincelle, badges, accents', '#0B0B0F'),
    ('Rose texte', '#C81E66', 'Petit texte en rose', '#FFFFFF'),
    ('Aura rose', '#FFC2D1', 'Fond flou, illustrations', '#0B0B0F'),
    ('Aura pêche', '#FFD9B0', 'Fond flou, illustrations', '#0B0B0F'),
    ('Aura lilas', '#C9B8FF', 'Fond flou, illustrations', '#0B0B0F'),
    ('Gris texte', '#6B6470', 'Texte secondaire', '#FFFFFF'),
    ('Rose doux', '#FFE1EC', 'Cartes mises en avant', '#0B0B0F'),
    ('Bordure', '#EFE3E1', 'Contours des cartes', '#0B0B0F'),
]
html = html.replace('{{TEINTES}}', '\n      '.join(
    f'<div class="teinte"><div class="pave" style="background:{h};color:{t}">{nom}</div><div class="infos">'
    f'<strong>{nom}</strong><span class="code">{h}</span><span class="legende">{usage}</span>'
    f'<button class="copier" type="button" data-code="{h}">Copier {h}</button></div></div>'
    for nom, h, usage, t in TEINTES))
reste = re.findall(r'\{\{\w+\}\}', html)
assert not reste, reste
(ICI / 'charte-graphique.html').write_text(html)
print('charte-graphique.html', len(html), 'octets')
