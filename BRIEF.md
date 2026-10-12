# Brief V1 — app-mode (nom provisoire)

> Promesse : **« Essaie-le sur toi avant de l'acheter, et sache s'il va à ta morphologie. »**
> Vision revue le 12 oct. 2026 (choix de l'utilisateur) : un assistant de shopping personnel. Morphologie et style, puis inspirations, puis essayage par IA sur sa propre photo. La bonne taille d'après les mesures vient en V2.
> Notes de fond : `~/Documents/Cerveau/10-Projets/App-IA-mode.md` (concurrence, avis Alta, risques).

## Pourquoi (le problème)
- On achète en ligne sans savoir si le vêtement nous ira : coupe, morphologie, taille. On renvoie, ou on garde un vêtement qu'on ne porte pas.
- Les apps existantes déforment le corps avec leurs avatars. C'est la 2e plainte la plus fréquente dans les 993 avis App Store d'Alta lus le 11 oct. 2026 (~25 avis sur 79 négatifs). **La fidélité au vrai corps est notre exigence n°1.**

## Pour qui
**Femmes et hommes** de 18 à 40 ans en France, qui regardent du contenu mode sur TikTok/Instagram et achètent en ligne (Zara, Shein, Vinted, Zalando…). Les problèmes de morphologie reviennent sans cesse dans les commentaires FR : ventre, petite taille, rondeurs, hanches, épaules (voir `Formats-video-app-mode.md`).

Contre-vue : deux publics, c'est deux fois plus de contenu pour l'associé. Commencer les vidéos par le public qui réagit le mieux.

## Le parcours V1
1. **Onboarding qui vend** (modèle BlowUp) : 7 questions (vestiaire, âge, ce qui gêne, style, 3 questions de morphologie). Résultat : la silhouette et ce qui la met en valeur. *Déjà codé et branché sur Supabase.*
2. **Une photo de soi**, en pied, de face, avec des vêtements près du corps, et des conseils à l'écran pour bien la prendre. Seulement sa propre photo (voir les garde-fous plus bas).
3. **Choisir un vêtement à essayer**, de 3 façons :
   - **Partager depuis une autre app** (Zara, Vinted, Instagram…) : « Partager → app-mode ». C'est la fonction la plus virale selon Robin Dormion (« analyser avec BlowUp » depuis TikTok).
   - **Coller un lien** d'article, ou **envoyer une photo** du vêtement (capture d'écran, photo en magasin).
   - **Une inspiration proposée** selon sa morphologie et son style, à partir d'un catalogue d'affiliation (voir Technique).
4. **Moment « waouh »** : l'IA habille la photo avec le vêtement, et une phrase dit **pourquoi ça va (ou pas) à ta morphologie**, d'après les règles de `src/lib/morphologie.ts`.
5. **Mur de paiement** après le 1er essayage offert. Chaque essayage coûte environ 0,075 $ (FASHN, à confirmer selon le fournisseur retenu).
6. **Abonnés** : essayages illimités (avec un plafond raisonnable), historique, « j'aime / j'aime pas », lien d'achat (affiliation).
7. **Option dressing** : ajouter ses propres pièces pour les essayer ou les associer avec un nouvel achat (« ça va avec ton jean noir »).

## Ce qu'on ne fait PAS en V1
- Pas de calcul de taille d'après les mesures : c'est la V2, parce que les données de taille par marque sont dures à obtenir.
- Pas d'extension Chrome, pas de réseau social, pas de profils publics.
- Pas de lingerie ni de maillots de bain dans l'essayage (voir les garde-fous).

## Modèle
- Abonnement via RevenueCat : **9,99 €/mois ou 39,99 €/an** (validé le 12 oct. 2026, à tester).
- Bonus : commissions d'affiliation sur les liens d'achat (5 à 8 % du panier, voir la note Obsidian). C'est un bonus, pas le moteur.

## Technique
- **App** : Expo SDK 57 + Expo Router, TypeScript. Le partage depuis une autre app passe par une extension de partage iOS et une intention Android (configuration Expo à vérifier).
- **Données et comptes** : Supabase, projet `app-mode` (organisation Free « business »), comptes anonymes au départ.
- **Essayage** : une API spécialisée (FASHN, ou une autre à comparer) appelée **uniquement depuis une fonction serveur** (Supabase Edge Function). Clé d'API jamais dans l'app. **À tester sur 20 vraies photos avant de coder l'écran**, pour vérifier la fidélité au corps.
- **Lien d'article → image** : lecture des métadonnées publiques de la page (image principale), côté serveur. Respect des conditions de chaque site : à vérifier.
- **Catalogue d'inspirations** : les flux produits des réseaux d'affiliation (Awin, Effiliation…), et non le scraping de Google Shopping, qui n'a pas d'API publique.
- **Concurrent à surveiller** : Google fait déjà l'essayage sur sa propre photo aux États-Unis (Search, Shopping, app Doppl, depuis juillet 2025). Arrivée en France : à confirmer.

## Garde-fous (non négociables)
- **Seulement sa propre photo** : un selfie de vérification avant le 1er essayage (à étudier), et un signalement facile en cas d'abus.
- **Pas de lingerie, de maillots de bain ni de vêtements transparents** : filtre côté serveur sur l'image du vêtement, pour éviter tout détournement en images dénudées.
- **Images générées signalées** comme créées par IA, avec une mention visible (règlement européen sur l'IA, article 50).
- **Données personnelles** : photos privées, suppression du compte et des photos en 1 clic, interdit aux moins de 15 ans, recommandations CNIL sur les applications mobiles. Pas de poids demandé.

## Critère de réussite de la V1
- 100 inscrits sur la liste d'attente via le compte de l'associé.
- Sur 100 personnes qui finissent l'onboarding : au moins 5 qui paient (repère : 1,7 à 2 % pour BlowUp en France selon Robin, chiffre déclaré).

## Ordre de construction
1. ~~Squelette + onboarding morphologie~~ (fait).
2. ~~Supabase : comptes anonymes, profil~~ (fait).
3. **Test de qualité de l'essayage** : 20 photos, 3 fournisseurs, jugés sur la fidélité au corps et au vêtement. On choisit ensuite.
4. Fonction serveur d'essayage + écran photo de soi + écran résultat avec « pourquoi ça te va ».
5. Entrées « envoyer une photo » et « coller un lien », puis le partage depuis une autre app.
6. Paywall RevenueCat.
7. Build de test (EAS) sur ton téléphone.
8. V2 : inspirations par catalogue d'affiliation, dressing, bonne taille.
