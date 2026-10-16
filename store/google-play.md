# Akalie sur Google Play : plan de lancement (16 oct. 2026)

**Mis à jour le 16 oct. au soir : changement de plan.** Personne autour de nous n'a d'Android, donc pas 12 testeurs. Choix : iPhone d'abord, Android plus tard avec un **compte organisation** (EI), qui n'est pas soumis aux 12 testeurs. Demande de D-U-N-S envoyée le 16 oct. via l'outil gratuit d'Apple (nom légal « Aurelien Branco », 269 av. Jean Jaurès 69007 Lyon, contact@madaria.fr) ; réponse de Dun & Bradstreet par e-mail. Nom affiché sur Google Play : « Akalie ». À confirmer : que Google accepte une EI comme organisation. Le reste de ce fichier décrit l'ancien plan (compte personnel) et sert encore pour les questionnaires et la fiche.

Compte **personnel** choisi le 16 oct. 2026 (abandonné le soir même, voir plus haut). Règles vérifiées ce jour-là sur l'aide Google :
- 12 testeurs minimum, inscrits **sans interruption pendant 14 jours**, en **test fermé**, puis demande d'accès à la production ; Google répond en 7 jours ou moins en général ([aide](https://support.google.com/googleplay/android-developer/answer/14151465)).
- Le titulaire du compte doit prouver qu'il a accès à **un vrai téléphone Android** (Android 10 ou plus, non rooté), via l'app Play Console, avant de publier ; moins d'une minute, un téléphone emprunté suffit ([aide](https://support.google.com/googleplay/android-developer/answer/14316361)).
- Inscription : 25 $ une seule fois ([aide](https://support.google.com/googleplay/android-developer/answer/6112435)).

Calendrier au mieux : compte ouvert le 17 oct., test fermé lancé le 18, 12 testeurs inscrits le 20 → fin des 14 jours le 3 nov. → réponse de Google vers le 10 nov.

## Toi (une seule fois)
1. Créer le compte sur https://play.google.com/console/signup : type **Personnel**, payer les 25 $, envoyer la pièce d'identité.
2. Trouver un téléphone Android (le tien, un ami, l'associé) pour la vérification d'une minute.
3. Me dire quand le compte est validé : je fais le reste dans la console avec toi.

## Moi
- [x] Version Android de production lancée sur EAS (versionCode 2) le 16 oct.
- [ ] Créer l'app « Akalie » dans la console, fiche (textes dans `fiches-stores.md`), captures Android, icône 512 px, image de présentation 1024 × 500.
- [ ] Questionnaires : sécurité des données, classification, public cible, publicité (non), app d'actualités (non), IA générative (oui, voir plus bas).
- [ ] Envoyer le premier fichier .aab à la main (Google exige un premier envoi manuel), créer le test fermé avec la liste d'e-mails des testeurs.
- [ ] Plus tard (avant la production) : produits d'abonnement Google Play, clé Android RevenueCat (`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`), compte de service pour `eas submit`. Sans eux, les testeurs ont leurs 2 essayages offerts mais l'abonnement ne marche pas sur Android.

## Testeurs : en viser 20 pour en garder 12
Un testeur qui se désinscrit avant la fin fait retomber le compteur. Il faut un téléphone Android et un compte Google. Leur demander d'ouvrir l'app plusieurs fois : Google regarde aussi si le test a vraiment servi.
Sources : ⚠️ la liste d'attente ne compte qu'**1 inscrit** au 16 oct. (le 14 oct., sans doute un test). Les testeurs viendront donc de ton entourage et de celui de l'associé, d'un appel en story Instagram ou TikTok, ou en dernier recours des groupes d'échange de testeurs (r/AndroidClosedTesting : on teste leurs apps, ils testent la nôtre).

### Message à envoyer (à relire par toi)
Objet : Akalie arrive sur Android, tu veux l'essayer avant tout le monde ?

Salut,

Je lance Akalie, une app qui te montre un vêtement porté sur ta propre photo avant de l'acheter. Elle arrive sur Android et j'ai besoin de testeurs pendant 2 semaines avant de la publier.

Ce que ça te demande : un téléphone Android, ton adresse Gmail, et ouvrir l'app de temps en temps pendant 14 jours. Tu peux essayer 2 vêtements sur ta photo gratuitement.

Si ça te tente, réponds juste avec ton adresse Gmail. Je t'envoie le lien d'installation dès qu'il est prêt.

Aurélien, Akalie

## Réponses prévues aux questionnaires
**Sécurité des données** (reprend la confidentialité Apple de `fiches-stores.md`) : données collectées, aucune partagée (les prestataires qui traitent pour notre compte ne comptent pas comme un partage chez Google) ; chiffrées en transit ; suppression demandée dans l'app (« Supprimer toutes mes données »).
- Photos : photos (fonctionnement, personnalisation).
- Activité dans l'app : interactions (analyse) ; autre contenu généré par l'utilisateur (réponses au questionnaire, avis).
- Infos personnelles : identifiants utilisateur (compte anonyme).
- Infos financières : historique d'achats (abonnement).
- Autre : tranche d'âge.

**Public cible** : 13-15, 16-17 et 18 ans et plus (l'app bloque les moins de 15 ans ; rien sous 13 ans, donc pas de programme Familles). À confirmer au moment de remplir.

**IA générative** : oui, images d'essayage créées par IA, marquées « Créée par IA », filtre avant et après (nudité, lingerie, maillots).

## Pré-mortem : dans 3 semaines, Android n'est pas sorti, pourquoi ?
1. Moins de 12 testeurs encore inscrits au jour 14 → en recruter 20, relancer au jour 7.
2. Pas de téléphone Android pour la vérification → le trouver avant de créer le compte.
3. Google refuse la production pour test « pas assez utilisé » → demander aux testeurs 3 ou 4 essais répartis, et noter leurs retours dans le formulaire de demande.
