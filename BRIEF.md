# Brief V1 — app-mode (nom provisoire)

> Promesse : **« On habille ton corps avec tes vêtements. »**
> Notes de fond : `~/Documents/Cerveau/10-Projets/App-IA-mode.md` (concurrence, avis Alta, risques).

## Pourquoi (le problème)
Chaque matin, « je n'ai rien à me mettre » alors que le placard est plein. Les apps existantes (Alta, Whering, Acloset) :
- proposent des tenues moches, répétitives, sans tenir compte du style ;
- déforment le vêtement ou le corps avec des avatars IA ;
- poussent à acheter des pièces qu'on n'a pas (leur modèle, c'est l'affiliation) ;
- sont en anglais, avec des boutiques américaines ;
- demandent des heures pour photographier tout son dressing.

Source : 993 avis App Store d'Alta lus le 11 oct. 2026, 79 avis à 3★ ou moins.

## Pour qui
**Femmes et hommes** de 18 à 40 ans en France (choix du 12 oct. 2026) qui regardent du contenu mode sur TikTok/Instagram, avec un vrai placard et un problème de morphologie (ventre, petite taille, rondeurs, hanches, épaules). Les commentaires FR reviennent sans cesse sur ces sujets (voir `Formats-video-app-mode.md`). Première question de l'onboarding : vestiaire femme ou homme. Côté hommes, la silhouette en X n'est pas utilisée (ramenée à H).

Contre-vue : deux publics, c'est deux fois plus de contenu pour l'associé. Commencer les vidéos par le public qui réagit le mieux.

## Le parcours V1 (une seule boucle, rien d'autre)
1. **Onboarding qui vend** (modèle BlowUp) : 7 questions (vestiaire femme ou homme, âge, ce qui te gêne, style, puis 3 questions de morphologie).
2. **Morphologie** : silhouette (A, H, V, X, 8, O) déduite des réponses et, en option, de 3 mesures. **Aucune photo du corps obligatoire.**
3. **Moment « waouh »** : l'utilisateur photographie **3 à 10 pièces** de son placard. L'IA les reconnaît (type, couleur, coupe, matière) et propose **3 tenues qui vont à sa morphologie, avec ses vêtements à lui**, chacune avec une phrase : *pourquoi ça te va*.
4. **Mur de paiement** juste avant la 4e tenue et le dressing illimité.
5. **Abonnés** : tenue du jour (selon la météo de sa ville), dressing illimité, « j'aime / j'aime pas » qui apprend son style.
6. **Bonus « ce qui manque »** : « avec un pantalon droit beige, tu fais 12 tenues de plus ». C'est le seul endroit où l'on propose un achat (affiliation, plus tard).

## Ce qu'on ne fait PAS en V1
- Pas d'extension Chrome, pas de catalogue maison, pas de réductions.
- Pas d'avatar généré : les tenues s'affichent **à plat** (les photos détourées des vraies pièces, posées côte à côte).
- Pas de réseau social ni de profils publics.

## Modèle
- Abonnement via RevenueCat. Prix de départ : **9,99 €/mois ou 39,99 €/an** (validé le 12 oct. 2026, à tester comme Robin : monter le prix tant que la conversion tient).
- Pas d'essai gratuit long : 3 tenues offertes, puis paiement.

## Technique
- **App** : Expo SDK 57 + Expo Router, TypeScript (`src/app/`).
- **Données et comptes** : Supabase (auth, base Postgres, stockage des photos compressées à environ 200 Ko).
- **Paiements** : RevenueCat (gratuit jusqu'à 2 500 $ de revenu mensuel).
- **IA** : un modèle de vision pour reconnaître les pièces + un modèle de texte pour composer les tenues, appelés depuis une fonction serveur (Supabase Edge Function). **La clé d'API ne doit jamais être dans l'app.**
- **Détourage** des vêtements : à choisir (bibliothèque côté serveur ou API), à tester sur 20 vraies photos.

## Données personnelles (RGPD)
- Photos privées par défaut, jamais publiques.
- Suppression du compte et des photos en 1 clic, dans l'app.
- Pas de photo du corps en V1. Le poids n'est pas demandé.
- Interdit aux moins de 15 ans en V1 (question d'âge à l'onboarding).
- Suivre les recommandations CNIL sur les applications mobiles.

## Critère de réussite de la V1
- 100 inscrits sur la liste d'attente via le compte de l'associé.
- Sur 100 personnes qui finissent l'onboarding : au moins 5 qui paient (repère : 1,7 à 2 % pour BlowUp en France selon Robin, chiffre déclaré).

## Ordre de construction
1. Squelette Expo + navigation (onboarding → dressing → tenues → paywall).
2. Supabase : comptes, tables `pieces` et `tenues`, stockage des photos.
3. Fonction IA : photo → fiche de la pièce ; pièces + morphologie → 3 tenues.
4. Écran tenues à plat + « pourquoi ça te va ».
5. RevenueCat + paywall.
6. Build de test (EAS) sur ton téléphone.
