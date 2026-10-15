// Formule active affichée dans l'app (15 oct. 2026), sans dépendance : testée par plan.test.ts (npm test).
// Lue dans le droit RevenueCat actif (CustomerInfo.entitlements.active[DROIT_ABONNEMENT]).

export type DroitActif = { productIdentifier: string; expirationDate: string | null; willRenew: boolean };
export type Plan = { formule: 'Annuel' | 'Mensuel' | 'Premium'; echeance: string | null; renouvele: boolean };

export function lirePlan(droit: DroitActif | undefined | null): Plan | null {
  if (!droit) return null;
  const id = droit.productIdentifier;
  const formule = id.includes('annuel') ? 'Annuel' : id.includes('mensuel') ? 'Mensuel' : 'Premium';
  return { formule, echeance: droit.expirationDate, renouvele: droit.willRenew };
}

// « Annuel · renouvelé le 15 octobre 2027 » ou « Mensuel · se termine le 15 novembre 2026 ».
export function textePlan(plan: Plan): string {
  if (!plan.echeance) return plan.formule;
  const date = new Date(plan.echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${plan.formule} · ${plan.renouvele ? 'renouvelé' : 'se termine'} le ${date}`;
}
