// Calculs de prix affichés sur le paywall, sans dépendance : testés par prix.test.ts (npm test).

// Économie de l'annuel par rapport à 12 mois au mensuel, arrondie : 59,99 € contre 12 × 9,99 € → 50 %.
// Remplace « Le plus choisi » (15 oct. 2026) : faux le jour du lancement, alors qu'un calcul se vérifie.
export function economieAnnuel(prixAnnuel: number, prixMensuel: number): number | null {
  if (!(prixAnnuel > 0) || !(prixMensuel > 0)) return null;
  const economie = Math.round((1 - prixAnnuel / (12 * prixMensuel)) * 100);
  return economie > 0 ? economie : null;
}
