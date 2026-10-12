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
6. **Abonnés** : essayages illimités (avec un plafond raisonnable), historique (*codé le 12 oct. 2026 : onglet « Essayages », rouvrir ou supprimer un essai*), « j'aime / j'aime pas » (*codé le 12 oct. 2026 : sous chaque résultat, filtre « J'aime » dans l'historique ; colonne `avis`, seule modifiable par l'app, date posée par la base, migrations 000007-000008*). ⚠️ Le jour où ces avis servent à recommander des vêtements, c'est du profilage : revoir la base légale et la politique de confidentialité, lien d'achat (affiliation) (*codé le 12 oct. 2026 : bouton « Voir l'article » sous le résultat quand le vêtement vient d'un lien ; lien Awin si le marchand est dans la table `marchands_affilies`, sinon l'article tel quel ; mention « Lien affilié » ; à faire : compte éditeur Awin, `EXPO_PUBLIC_AWIN_ID_EDITEUR`, une ligne par marchand accepté*).
7. **Option dressing** : ajouter ses propres pièces pour les essayer ou les associer avec un nouvel achat (« ça va avec ton jean noir »).

## Ce qu'on ne fait PAS en V1
- Pas de calcul de taille d'après les mesures : c'est la V2, parce que les données de taille par marque sont dures à obtenir.
- Pas d'extension Chrome, pas de réseau social, pas de profils publics.
- Pas de lingerie ni de maillots de bain dans l'essayage (voir les garde-fous).

## Modèle
- Abonnement via RevenueCat : **9,99 €/mois ou 59,99 €/an** (validé le 12 oct. 2026 ; annuel relevé de 39,99 à 59,99 € pour couvrir les crédits d'essayage, 1 €/mois/abonné).
- Bonus : commissions d'affiliation sur les liens d'achat (5 à 8 % du panier, voir la note Obsidian). C'est un bonus, pas le moteur.

## Technique
- **App** : Expo SDK 57 + Expo Router, TypeScript. Le partage depuis une autre app passe par le module officiel `expo-sharing` (expérimental en SDK 57) : extension de partage iOS + intention Android, écran `src/app/partage.tsx`, codé le 12 oct. 2026. Une capture d'écran ou une photo passe avant un lien. **Pas encore testé sur téléphone** (il faut un build de développement). Identifiant provisoire `com.cortexa.appmode`, définitif à la première publication en boutique.
- **Données et comptes** : Supabase, projet `app-mode` (organisation Free « business »), comptes anonymes au départ.
- **Essayage** : une API spécialisée (FASHN, ou une autre à comparer) appelée **uniquement depuis une fonction serveur** (Supabase Edge Function). Clé d'API jamais dans l'app. **À tester sur 20 vraies photos avant de coder l'écran**, pour vérifier la fidélité au corps.
- **Lien d'article → image** : Edge Function `extraire-vetement` qui lit l'image de partage (og:image) de la page. **Test du 12 oct. 2026 : la plupart des sites de mode bloquent la lecture automatique** (403 chez Kiabi, Celio, Lacoste, La Redoute, Decathlon, Uniqlo ; Zara sans image de partage ; Vinted OK). On ne contourne pas ces protections. La capture d'écran reste la voie fiable ; le lien est un bonus.
- **Catalogue d'inspirations** : les flux produits des réseaux d'affiliation (Awin, Effiliation…), et non le scraping de Google Shopping, qui n'a pas d'API publique.
- **Prix de l'essayage (page officielle https://kling.ai/dev/pricing, lue le 12 oct. 2026)** : Kling « Virtual Try-On » = 32 unités = **0,112 $ par image** (1K). Offre d'essai : 2,45 $ pour 1 000 unités (environ 31 essais) ou 24,50 $ pour 10 000 unités (environ 312 essais), 30 jours, -30 % au 1er achat. Pack standard : 350 $ pour 100 000 unités (environ 3 125 essais), 180 jours. Comparaison : FASHN environ 0,075 $ par image (à confirmer). **Point RGPD à trancher avant tout usage réel** : Kling appartient à Kuaishou (Chine) ; envoyer des photos de personnes hors de l'UE demande une base légale (clauses contractuelles types…), lieu de traitement à confirmer.
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
6. ~~Paywall RevenueCat~~ (codé le 12 oct. 2026 : `src/app/paywall.tsx`, `src/lib/abonnement.ts` ; le serveur vérifie l'abonnement auprès de RevenueCat, 1 essayage offert puis paywall).
7. Build de test (EAS) sur ton téléphone.
8. V2 : inspirations par catalogue d'affiliation, dressing, bonne taille.

## À faire avant tout lancement public (bloquant)
- [x] **Filtre lingerie / maillots / transparence** codé le 12 oct. 2026 (`supabase/functions/essayage/moderation.ts` + `regles.ts`, tests : `npm run test:filtre`). Claude Haiku 5.5 vérifie le vêtement **et** la photo de soi avant Kling ; en cas de doute ou de panne, l'essai est bloqué. Les images vérifiées sont figées (bucket `figes`) pour que Kling reçoive exactement ce qui a été vérifié ; l'app ne peut plus écrire le statut ni contourner le plafond (migration 000005, journal `essayages_journal`). Coût estimé : moins de 0,001 $ par essayage (à confirmer sur la facture).
- [x] **Secrets `KLING_API_KEY` et `ANTHROPIC_API_KEY`** ajoutés le 12 oct. 2026. Vérifié par un vrai appel : le filtre répond, et Kling reconnaît la clé mais refuse faute de crédit (« Account balance not enough »).
- [x] **Crédit Kling** acheté le 12 oct. 2026 : pack « Trial-Image » de 1 000 unités, valable jusqu'au 11 nov., 9 tâches en parallèle au maximum.
- [x] **Banc d'essai sur l'API Kling** (12-13 oct., 12 essais) : corps 4,5, visage 5,0, vêtement 3,5, réalisme 4,1, au niveau de la démo Kolors. Voir `tests-essayage/resultats/RAPPORT.md`. Bug corrigé au passage : pour une tâche, le suivi Kling renvoie un objet et non une liste. Sans cette correction, tous les essayages restaient « en cours » (`kling-suivi.ts`, testé).
- [x] **Vérification de l'image produite** codée le 13 oct. 2026 (`verifierResultat`, `deciderResultat`, tests `npm test`). Si l'image montre de la nudité, des sous-vêtements ou une zone floutée sur le corps, elle n'est ni enregistrée ni affichée, et l'essai passe au statut « refuse ». Testé sur 6 vraies sorties Kling : le buste nu flouté et le t-shirt sans bas sont refusés, robe, jean, polo et t-shirt passent.
- [ ] **Conseils de la photo de soi** : haut et bas séparés, pas de robe (Kling recompose mal une tenue d'une seule pièce).
- [ ] **File d'attente** au-delà de 9 essayages simultanés (limite du pack Kling).
- [ ] ⚠️ **La clé Anthropic expire le 11 nov. 2026** (30 jours, espace de travail « Default », partagé avec d'autres clés). Avant le lancement : espace de travail dédié `app-mode` avec plafond de dépenses, et clé longue durée.
- [ ] **Tester le filtre sur 10 vraies images** (5 à refuser, 5 à accepter). ⚠️ Le 12 oct., une image de test, un simple rectangle rouge, a été **acceptée** au lieu d'être classée « pas un vêtement » : sans danger pour la sécurité, mais chaque erreur de ce genre coûterait un essayage Kling. Revoir la consigne si ça se répète.
- [ ] **Avis juridique : Anthropic (États-Unis) voit aussi la photo de soi** (mentionné dans le consentement de `photo-soi.tsx`).
- [ ] **Avis juridique RGPD** : transfert des photos vers Kling (serveurs à Singapour, société Kuaishou), base légale, mention dans la politique de confidentialité.
- [x] **CAPTCHA (Cloudflare Turnstile)** codé le 12 oct. 2026 : demandé seulement à la création d'un compte anonyme (`src/lib/captcha.ts`, `src/components/captcha.tsx` pour le téléphone via WebView, `captcha.web.tsx` pour le web ; tests : `npm test`). Testé sur le web avec la clé de test officielle de Cloudflare : défi Turnstile, puis création du compte.
- [ ] **Activer le CAPTCHA**, dans cet ordre : 1) créer le widget Turnstile chez Cloudflare (gratuit), en déclarant le domaine qui servira de `EXPO_PUBLIC_TURNSTILE_DOMAINE` ; 2) mettre `EXPO_PUBLIC_TURNSTILE_SITE_KEY` et `EXPO_PUBLIC_TURNSTILE_DOMAINE` dans l'environnement de build, puis publier l'app ; 3) **seulement ensuite**, activer « Enable CAPTCHA protection » dans Supabase (Authentication > Bot and Abuse Protection) avec la clé secrète Turnstile. Dans l'autre ordre, plus personne ne peut créer de compte.
- [ ] Réglage « Allow manual linking » dans Supabase, pour passer un compte anonyme en compte e-mail (plus tard).
- [ ] Tester le widget dans la WebView sur un vrai téléphone (iOS et Android).
- [ ] **Projet Supabase** passé en formule payante, sinon il se met en pause après 1 semaine sans activité.
- [x] Plafond d'essayages relié à l'abonnement RevenueCat (12 oct. 2026, `quota.ts`, tests : `npm test`). Sans abonnement : `ESSAIS_GRATUITS` (1) au total ; abonné : `ESSAIS_MAX_PAR_MOIS` (30) par mois.
- [ ] **Brancher RevenueCat** : créer le projet, l'« entitlement » `premium`, une offre avec un paquet mensuel (9,99 €) et un annuel (59,99 €) reliés aux produits App Store et Google Play. Clés publiques dans `.env.local` (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`) ; clé secrète `REVENUECAT_SECRET_KEY` dans les secrets Supabase. Sans elle, personne n'est abonné (seul l'essayage offert passe).
- [x] Comptes anonymes recréés à volonté : les essayages offerts sont aussi plafonnés à `ESSAIS_GRATUITS_JOUR` (50) par jour, tous comptes confondus, soit environ 5,6 $ par jour au maximum. Le CAPTCHA reste nécessaire.
- [ ] Le jour où un vrai compte (e-mail) remplace le compte anonyme : appeler `Purchases.logIn` avec le nouvel id, sinon l'abonnement reste rattaché à l'ancien.
- [x] **Politique de confidentialité rédigée** le 12 oct. 2026 : `legal/confidentialite.html` (page autonome, prête à héberger). Relue par le vérificateur (GO). **Avant publication** : remplir les 13 passages surlignés en jaune (éditeur, contact, garanties de transfert, durées chez RevenueCat, Supabase et Kling), la faire valider par un juriste, l'héberger, puis mettre son adresse dans `EXPO_PUBLIC_URL_CONFIDENTIALITE`.
- [ ] **Page CGU** pour Android (`EXPO_PUBLIC_URL_CGU`) ; sur iOS, le contrat standard d'Apple sert par défaut.
- [x] **« Supprimer toutes mes données »** codé le 12 oct. 2026 : lien en bas de l'onglet Essayer → `src/app/supprimer-donnees.tsx` → Edge Function `supprimer-compte` (fichiers des 5 buckets, client RevenueCat, puis compte : les tables partent en cascade). Avertit si un abonnement est actif (409). Testé de bout en bout sur un compte jetable : 0 compte, 0 profil, 0 essai, 0 fichier restant. Exigé par Apple (règle 5.1.1 v).
  - À savoir : sans le secret `REVENUECAT_SECRET_KEY`, l'étape RevenueCat est sautée sans erreur. Poser la clé secrète **en même temps** que les clés publiques de l'app.
  - Cas rare non couvert : un essayage qui se termine pendant la suppression peut déposer une image après l'effacement (orpheline dans `essayages/uid/`). À traiter dans `suivre()` si ça arrive : vérifier que l'essai existe encore avant d'écrire.
