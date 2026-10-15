import { Platform } from 'react-native';
import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import { lirePlan, type Plan } from '@/lib/plan';

// Abonnement par RevenueCat (App Store / Google Play). L'identifiant RevenueCat = l'id Supabase de l'utilisateur :
// la fonction serveur `essayage` interroge RevenueCat avec cet id pour savoir s'il est abonné.
// Les clés EXPO_PUBLIC_REVENUECAT_* sont les clés publiques du SDK (faites pour être dans l'app).

export const DROIT_ABONNEMENT = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? 'premium';

const CLE =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : Platform.OS === 'android'
      ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
      : undefined;

let configure = false;

// Achats possibles seulement dans l'app mobile, avec une clé (le web et Expo Go n'ont pas les stores).
export function achatsDisponibles(): boolean {
  return Platform.OS !== 'web' && !!CLE;
}

export function configurerAchats(uid: string) {
  if (!achatsDisponibles() || configure) return;
  Purchases.configure({ apiKey: CLE!, appUserID: uid });
  configure = true;
}

// Nouveau compte (après suppression des données) : RevenueCat doit suivre le nouvel id.
export async function changerUtilisateurAchats(uid: string) {
  if (!configure) return configurerAchats(uid);
  await Purchases.logIn(uid);
}

// Écran de gestion de l'abonnement du store (pour résilier). Sans effet hors app mobile.
export async function gererAbonnement() {
  if (configure) await Purchases.showManageSubscriptions();
}

// Formule active du compte, ou null (pas abonné, web, Expo Go).
export async function lireFormule(): Promise<Plan | null> {
  if (!configure) return null;
  const info = await Purchases.getCustomerInfo();
  return lirePlan(info.entitlements.active[DROIT_ABONNEMENT]);
}

export function estAbonne(info: CustomerInfo): boolean {
  return info.entitlements.active[DROIT_ABONNEMENT] !== undefined;
}

export type Formule = {
  id: 'annuel' | 'mensuel';
  prix: string;
  montant: number;
  parMois: string | null;
  paquet: PurchasesPackage;
};

// Les deux formules de l'offre courante, prix affichés par le store (devise et taxes du pays).
export async function chargerFormules(): Promise<Formule[]> {
  if (!configure) return [];
  const offres = await Purchases.getOfferings();
  const paquets = offres.current?.availablePackages ?? [];
  const formules: Formule[] = [];
  const annuel = paquets.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
  const mensuel = paquets.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
  if (annuel) {
    formules.push({
      id: 'annuel',
      prix: annuel.product.priceString,
      montant: annuel.product.price,
      parMois: annuel.product.pricePerMonthString,
      paquet: annuel,
    });
  }
  if (mensuel)
    formules.push({
      id: 'mensuel',
      prix: mensuel.product.priceString,
      montant: mensuel.product.price,
      parMois: null,
      paquet: mensuel,
    });
  return formules;
}

// « en_attente » : le store a pris l'achat mais le droit n'est pas encore actif (paiement en attente,
// ou nom du droit différent entre l'app et le tableau de bord RevenueCat).
export type ResultatAchat = 'actif' | 'annule' | 'en_attente';

export async function acheter(formule: Formule): Promise<ResultatAchat> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(formule.paquet);
    return estAbonne(customerInfo) ? 'actif' : 'en_attente';
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'annule';
    // Paiement à valider plus tard (ex. « Demander l'autorisation » d'un parent) : pas un échec.
    if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'en_attente';
    throw new Error('L’achat n’a pas abouti. Aucun montant n’a été débité si le store ne l’a pas confirmé.');
  }
}

// Liens exigés par Apple et Google sur un écran d'abonnement. Sans page CGU à nous, l'App Store accepte
// le contrat de licence standard d'Apple ; la politique de confidentialité doit être la nôtre.
export const LIEN_CGU =
  process.env.EXPO_PUBLIC_URL_CGU ??
  (Platform.OS === 'ios' ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/' : undefined);
export const LIEN_CONFIDENTIALITE = process.env.EXPO_PUBLIC_URL_CONFIDENTIALITE;

export async function restaurer(): Promise<boolean> {
  if (!configure) return false;
  return estAbonne(await Purchases.restorePurchases());
}
