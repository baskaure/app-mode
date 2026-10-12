// Génère l'icône et l'écran de démarrage : un cintre crème et une étincelle corail (l'IA) sur fond quasi noir.
// Usage : npm i @resvg/resvg-js@2.6.2 dans un dossier à part, puis node generer-icone.js <dossier de sortie>.
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const FOND = '#141414';
const CREME = '#F5EFE6';
const CORAIL = '#FF6B4A';

// Symbole dessiné dans un carré de 1024, centré.
function symbole(couleurCintre, couleurEtincelle) {
  const etincelle = (cx, cy, r) =>
    `<path d="M${cx} ${cy - r} C${cx + r * 0.12} ${cy - r * 0.12} ${cx + r * 0.12} ${cy - r * 0.12} ${cx + r} ${cy}
      C${cx + r * 0.12} ${cy + r * 0.12} ${cx + r * 0.12} ${cy + r * 0.12} ${cx} ${cy + r}
      C${cx - r * 0.12} ${cy + r * 0.12} ${cx - r * 0.12} ${cy + r * 0.12} ${cx - r} ${cy}
      C${cx - r * 0.12} ${cy - r * 0.12} ${cx - r * 0.12} ${cy - r * 0.12} ${cx} ${cy - r}Z" fill="${couleurEtincelle}"/>`;
  return `<g transform="translate(0 70)">
    <path d="M512 420 L512 372 C512 352 528 340 546 336 C572 330 594 312 594 284 C594 252 568 228 536 228 C506 228 482 250 480 278"
      fill="none" stroke="${couleurCintre}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M512 420 L236 610 Q214 626 240 632 L784 632 Q810 626 788 610 Z"
      fill="none" stroke="${couleurCintre}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
    ${etincelle(742, 300, 74)}
    ${etincelle(820, 410, 34)}
  </g>`;
}

function svg({ fond, cintre = CREME, etincelle = CORAIL, echelle = 1 }) {
  const t = 512 * (1 - echelle);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${fond ? `<rect width="1024" height="1024" fill="${fond}"/>` : ''}
    <g transform="translate(${t} ${t}) scale(${echelle})">${symbole(cintre, etincelle)}</g>
  </svg>`;
}

function png(nom, contenu, taille = 1024) {
  const r = new Resvg(contenu, { fitTo: { mode: 'width', value: taille } });
  fs.writeFileSync(path.join(OUT, nom), r.render().asPng());
}

png('icon.png', svg({ fond: FOND, echelle: 0.92 }));
// Android : zone sûre = 66 % du centre, d'où l'échelle réduite.
png('android-icon-foreground.png', svg({ echelle: 0.62 }));
png('android-icon-background.png', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${FOND}"/></svg>`);
png('android-icon-monochrome.png', svg({ cintre: '#FFFFFF', etincelle: '#FFFFFF', echelle: 0.62 }));
png('splash-icon.png', svg({ echelle: 1 }));
png('favicon.png', svg({ fond: FOND, echelle: 0.95 }), 48);
// Aperçu pour contrôle visuel (rond = masque Android, carré arrondi = iOS).
png('apercu.png', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 2048 1024">
  <defs><clipPath id="c"><circle cx="1536" cy="512" r="340"/></clipPath><clipPath id="r"><rect x="172" y="172" width="680" height="680" rx="150"/></clipPath></defs>
  <rect width="2048" height="1024" fill="#d9d9d9"/>
  <g clip-path="url(#r)"><g transform="translate(172 172) scale(0.664)">${svg({ fond: FOND, echelle: 0.92 }).replace(/<\/?svg[^>]*>/g, '')}</g></g>
  <g clip-path="url(#c)"><rect x="1024" width="1024" height="1024" fill="${FOND}"/><g transform="translate(1024 0)">${svg({ echelle: 0.62 }).replace(/<\/?svg[^>]*>/g, '')}</g></g>
</svg>`);
