# Logo Akalie : recherche du 16 oct. 2026

Point de départ : l'icône actuelle (« a » noir + étoile rose sur fond aura pastel, `final/`), jugée trop générique et pas assez mode par l'utilisateur. Couleurs gardées.

| Planche | Contenu | Verdict |
|---|---|---|
| `propositions-v2.html` | 5 pistes mode (Didone, étiquette cousue, cabine, reflet, fil) | aucune validée |
| `propositions-v3.html` | 4 icônes-symboles (cintre, miroir, robe trapèze, étiquette de prix) + nom en Didone | pas de suite |
| `propositions-v4.png` | piste « noire irisée » d'après une image de l'utilisateur (a en dégradé sur noir, étoile) | le a se lisait « oi » (encoche dans la hampe) |
| `propositions-v5.png` | 6 formes de a avec étoile | — |
| `propositions-v6.png` | 8 formes de a **sans étoile**, noir irisé | **préféré de Claude : n°7 « penché »**, puis n°2 « avec une queue » |
| `propositions-v7.png` | les mêmes 8 en clair (noir sur aura, dégradé sur crème) | — |
| `propositions-v8.png` | 6 essais a + cintre | 2 et 5 se lisent « ? » ; 4 et 6 corrects |
| `propositions-v10.png` | 6 cintres seuls, **couleurs exactes de l'app** | préféré : n°6 « penché » |

⚠️ Les planches v2 à v9 utilisent des dégradés approximatifs ; seule la v10 reprend les codes exacts (`src/constants/couleurs.ts`, `theme.ts`). Refaire la piste retenue avec ces codes.

## Recommandation de Claude (16 oct.)
- Icône : le **a penché (v6 n°7) en noir irisé** (aura #FFD9B0 → #FFC2D1 → #C9B8FF sur #0B0B0F), version claire en dégradé rose #FF3D8B → #BF1D63 sur crème #FFF7F2.
- Pourquoi : reconnaissable en tout petit, garde le lien avec le nom, le noir ressort sur les écrans clairs.
- L'étoile retirée : elle signifie « IA » et c'est elle qui rendait le logo générique.
- Mieux qu'avant ? Modérément ; à prouver par un test A/B « Optimisation de la page produit » d'Apple après la sortie (ancienne icône contre nouvelle).
- Contre-vue : le frein actuel est l'audience (1 inscrit), pas le logo.

**Décision : en attente de l'utilisateur.** Une nouvelle icône demande un nouveau build et une nouvelle vérification Apple.
