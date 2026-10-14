"""Tracé SVG de chaque lettre de « akalie » (Onest 700, interlettrage -0,04 em), à sa place dans le mot.
Usage : uv run --with fonttools python assets/source/logo/lettres.py <Onest[wght].ttf> > assets/source/logo/akalie-lettres.json"""
import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

f = instantiateVariableFont(TTFont(sys.argv[1]), {'wght': 700})
gs, cmap = f.getGlyphSet(), f.getBestCmap()
x, track, lettres = 0, -0.04 * f['head'].unitsPerEm, []
for ch in 'akalie':
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
    lettres.append({'lettre': ch, 'd': pen.getCommands()})
    x += gs[g].width + track
print(json.dumps({'largeur': round(x - track), 'lettres': lettres}))
