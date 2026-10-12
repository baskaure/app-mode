// Qui a droit à un essayage. Sans dépendance : testé par quota.test.ts (npm test).
//   - sans abonnement : ESSAIS_GRATUITS essayages offerts au total (1 par défaut, « moment waouh ») ;
//   - abonné : MAX_PAR_MOIS essayages par mois civil (plafond de coût Kling) ;
//   - tous comptes confondus : GRATUITS_JOUR essayages offerts par jour (un compte anonyme se recrée à volonté).

// Droit d'accès tel que renvoyé par l'API RevenueCat v1 (GET /v1/subscribers/{id}, `subscriber.entitlements`).
export type DroitRevenueCat = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
};

// Actif s'il n'expire pas (achat à vie), s'il expire plus tard, ou pendant le délai de grâce d'un paiement raté.
// Une réponse mal formée (pas un objet, champ `expires_date` absent) ne vaut jamais un abonnement.
export function droitActif(droit: unknown, maintenant: Date): boolean {
  if (!droit || typeof droit !== 'object' || Array.isArray(droit) || !('expires_date' in droit)) return false;
  const d = droit as DroitRevenueCat;
  const apres = (date: unknown) => typeof date === 'string' && new Date(date).getTime() > maintenant.getTime();
  if (d.expires_date === null) return true;
  return apres(d.expires_date) || apres(d.grace_period_expires_date);
}

export type Quota = { ok: true } | { ok: false; code: 'abonnement' | 'plafond' | 'offerts_du_jour' };

// `inclus` : la ligne du journal de l'essai en cours est déjà comptée (2e contrôle, après réservation).
export function verifierQuota(e: {
  abonne: boolean;
  ceMois: number;
  total: number;
  maxParMois: number;
  gratuits: number;
  offertsAujourdhui: number;
  maxOffertsJour: number;
  inclus: boolean;
}): Quota {
  const marge = e.inclus ? 1 : 0;
  if (e.abonne) return e.ceMois - marge < e.maxParMois ? { ok: true } : { ok: false, code: 'plafond' };
  if (e.total - marge >= e.gratuits) return { ok: false, code: 'abonnement' };
  if (e.offertsAujourdhui - marge >= e.maxOffertsJour) return { ok: false, code: 'offerts_du_jour' };
  return { ok: true };
}
