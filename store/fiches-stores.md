# Fiches des stores (V1) : Akalie

Rédigé le 12 oct. 2026, mis à jour le 15 oct. 2026 pour l'App Store (nom Akalie, Inspirations, dressing reconnu par l'IA, chaussures, story avant/après).
Limites vérifiées le 15 oct. 2026 sur la [page Apple des champs de version](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) : texte promotionnel 170 caractères, description 4 000, mots-clés 100 octets (une lettre accentuée compte pour 2). Nom et sous-titre : 30 caractères chacun (à confirmer, la page ne le dit pas).

## Ce qui bloque l'envoi à Apple (à régler avant de soumettre)

1. **Abonnements** : créer les deux abonnements (9,99 €/mois, 59,99 €/an) dans App Store Connect et brancher RevenueCat. Apple refuse une app dont le bouton d'achat ne marche pas, et les abonnements doivent partir en relecture avec la première version.
2. **Politique de confidentialité en ligne** : `legal/confidentialite.html` remplie (éditeur, contact, prestataires), publiée sur akalie.app, et son adresse mise dans `EXPO_PUBLIC_URL_CONFIDENTIALITE` (le mur de paiement affiche le lien). Les passages « à confirmer avec le juriste » restent à trancher.
3. **Adresse d'assistance** : Apple exige une page avec un vrai moyen de contact. Prévu : akalie.app/aide (e-mail contact@madaria.fr).
4. **Inspirations vides pour Apple** : les articles de test (`source='test'`) ne sont visibles que des testeurs. Sans catalogue Awin, le relecteur verra un onglet vide, ce qui risque un refus pour app incomplète (règle 2.1, à confirmer). Il faut le catalogue Awin, ou masquer l'onglet tant qu'il est vide.
5. **Captures d'écran** iPhone 6,9 pouces : 1320 × 2868 px (à confirmer sur la [page des formats](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)).

---

## App Store (Apple)

**Nom** (30 max)
Akalie : essayage virtuel

**Sous-titre** (30 max)
Vois le vêtement sur toi

**Texte promotionnel** (170 max, modifiable sans nouvelle version)
Une capture d'écran, un lien, une pièce de ton placard : Akalie te la met sur ta propre photo et te dit si elle va à ta silhouette. Avant de payer, et avant le colis.

**Mots-clés** (100 octets max, virgules sans espace ; inutile de répéter les mots du nom et du sous-titre, Apple les compte déjà)
morphologie,silhouette,tenue,look,style,dressing,mode,cabine,ia,essayer,habits,shopping,try on,robe

**Catégories**
Shopping en principal, Style de vie en secondaire.

**Adresses**
- Assistance : https://akalie.app/aide (à créer)
- Marketing : https://akalie.app
- Confidentialité : https://akalie.app/confidentialite-app (à publier, voir plus haut)

**Description** (4 000 max)

Tu as repéré un jean en ligne. Sur le mannequin, il est parfait. Sur toi ? Aucune idée, jusqu'à l'arrivée du colis.

Akalie règle ça. Tu prends une photo de toi en pied, une seule fois. Ensuite tu choisis le vêtement : une capture d'écran, une photo prise en magasin, le lien d'un article, ou une pièce de ton propre placard. L'IA t'habille avec, sur ta vraie photo. Ton corps à toi, pas un avatar. Ça marche aussi avec les chaussures.

Et l'app te dit pourquoi ça marche, ou pourquoi ça ne marche pas. Au départ, 7 questions sur ta silhouette et ce que tu veux mettre en valeur. Chaque essayage arrive ensuite avec une phrase claire, du genre « la taille haute allonge tes jambes » ou « cette coupe élargit tes épaules ».

Ton dressing compte aussi. Prends en photo quelques pièces que tu as déjà : Akalie reconnaît chacune (« ton jean droit bleu », « tes baskets blanches ») et te propose, dans Inspirations, des articles qui vont avec. Tu les essaies sur toi avant d'acheter quoi que ce soit.

Dans l'app, tu retrouves aussi tous tes essayages, avec j'aime / j'aime pas pour faire le tri, le lien vers l'article quand il vient d'une boutique, et une story avant / après à partager si le résultat te plaît.

Le premier essayage est offert. L'abonnement donne ensuite 30 essayages par mois.

CE QU'ON REFUSE DE FAIRE
L'essayage marche uniquement sur ta propre photo. Pas de photo de quelqu'un d'autre, pas de lingerie, pas de maillot de bain. Chaque image est créée par IA et marquée comme telle : elle donne une très bonne idée du rendu, mais ce n'est pas une photo, et la coupe peut varier un peu. Ta photo n'est jamais publiée. Tu peux effacer toutes tes données depuis l'app, d'un seul bouton.

ABONNEMENT
9,99 € par mois ou 59,99 € par an. Le paiement est débité sur ton compte Apple à la confirmation de l'achat. L'abonnement se renouvelle automatiquement, sauf si tu le résilies au moins 24 heures avant la fin de la période en cours. Tu le gères et le résilies dans les réglages de ton compte Apple.

Conditions d'utilisation : contrat de licence standard d'Apple (https://www.apple.com/legal/internet-services/itunes/dev/stdeula/).
Confidentialité : https://akalie.app/confidentialite-app

---

## Classement par âge (questionnaire App Store Connect)

Catégories d'Apple : 4+, 9+, 13+, 16+, 18+ ([Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions)).

Réponses proposées :
- Contenu généré par les utilisateurs : **non** (les photos restent privées, personne d'autre ne les voit).
- Messagerie, réseau social, publicité, jeux de hasard, violence, contenus pour adultes : **non**.
- Accès web libre : **non** (« Voir l'article » ouvre une seule page de boutique ; à confirmer).
- Contrôle de l'âge dans l'app (« Age Assurance ») : **oui**, le questionnaire bloque les moins de 15 ans.
- **Forcer un classement plus élevé : 16+.** Apple le prévoit : si l'app exige un âge minimum au-dessus du classement calculé, il faut choisir « Override to Higher Age Rating » ([Apple](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating)). Notre âge minimum est 15 ans, et 16+ est la première catégorie au-dessus.

Contre-vue : 16+ ferme l'app aux 15 ans, alors que notre politique les accepte. Ils sont hors cible (18-40 ans), donc la perte est faible. L'autre option (13+) laisse télécharger des 13-14 ans, que l'app refoule ensuite.

---

## Confidentialité de l'app (« App Privacy » dans App Store Connect)

Définitions d'Apple : [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/).

**Suivi (tracking) : non.** Aucune donnée n'est croisée avec celles d'autres entreprises pour de la publicité, et rien n'est vendu.

| Donnée (nom Apple) | Ce que c'est chez nous | Usage déclaré | Liée à la personne |
|---|---|---|---|
| Photos ou vidéos | photo en pied, photos des vêtements et du dressing, images d'essayage | Fonctionnement de l'app ; Personnalisation (dressing → Inspirations) | Oui |
| Autre contenu de l'utilisateur | réponses au questionnaire (silhouette, style, ce qui gêne), avis j'aime / j'aime pas | Fonctionnement ; Personnalisation | Oui |
| Identifiant utilisateur | compte anonyme Supabase, identifiant RevenueCat | Fonctionnement | Oui |
| Historique d'achats | abonnement (RevenueCat) | Fonctionnement | Oui |
| Interactions avec le produit | étapes du parcours (table `evenements`) | Analyse | Oui |
| Autres types de données | tranche d'âge | Fonctionnement (blocage des moins de 15 ans) | Oui |
| Données de plantage | **seulement le jour où Sentry est activé** (DSN) | Fonctionnement | Non (`sendDefaultPii: false`, à confirmer) |

« Liée » : Apple considère une donnée comme liée dès qu'elle est rattachée à un compte, même anonyme. Pas d'e-mail, de nom, de position ni de contacts collectés.

---

## Notes pour la relecture Apple (champ « Notes »)

Akalie crée un compte anonyme au premier lancement : pas d'identifiant ni de mot de passe à fournir.

Parcours : répondre aux 7 questions, ajouter une photo de soi en pied (une personne, de face), puis choisir un vêtement (capture d'écran, lien ou pièce du dressing) et toucher « M'essayer ». La création de l'image prend environ 2 minutes. Le premier essayage est offert ; les suivants demandent l'abonnement (bac à sable Apple).

Les images d'essayage sont créées par IA et marquées « Créée par IA ». Une vérification automatique refuse la nudité, la lingerie et les maillots de bain.

Suppression du compte (règle 5.1.1 v) : onglet Essayer, lien « Supprimer toutes mes données » en bas de l'écran. Tout est effacé de nos serveurs.

Contact : contact@madaria.fr

---

## Google Play

**Description courte** (80 max)
Essaie un vêtement sur ta photo et sache s'il va à ta morphologie.

**Description complète** (4 000 max)

Tu as repéré un jean en ligne. Sur le mannequin, il est parfait. Sur toi ? Aucune idée, jusqu'à l'arrivée du colis.

L'app règle ça. Tu prends une photo de toi en pied, une seule fois. Ensuite tu envoies le vêtement : une capture d'écran, une photo prise en magasin, un lien d'article, ou un partage direct depuis l'app de la boutique. L'IA t'habille avec, sur ta vraie photo. Ton corps à toi, pas un avatar.

Et elle te dit pourquoi ça marche, ou pourquoi ça ne marche pas. Au départ, 7 questions sur ta silhouette et sur ce que tu veux mettre en valeur. Chaque essayage arrive ensuite avec une phrase claire, du genre « la taille haute allonge tes jambes » ou « cette coupe élargit tes épaules ».

Dans l'app, tu retrouves aussi :
• tous tes essayages dans un historique, avec j'aime / j'aime pas pour faire le tri ;
• le lien vers l'article quand le vêtement vient d'une boutique en ligne ;
• ton dressing, si tu veux essayer tes propres pièces.

Le premier essayage est offert. L'abonnement donne ensuite 30 essayages par mois.

CE QU'ON REFUSE DE FAIRE
L'essayage marche uniquement sur ta propre photo. Pas de photo de quelqu'un d'autre, pas de lingerie, pas de maillot de bain. Chaque image est créée par IA et indiquée comme telle : elle donne une très bonne idée du rendu, mais ce n'est pas une photo, et la coupe peut varier un peu. Tu peux effacer toutes tes données depuis l'app, d'un seul bouton.

ABONNEMENT
9,99 € par mois ou 59,99 € par an, payé via Google Play. L'abonnement se renouvelle automatiquement tant que tu ne le résilies pas. Tu le gères et le résilies dans Google Play, rubrique Paiements et abonnements.
