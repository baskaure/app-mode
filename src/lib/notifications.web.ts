// Version web : pas de notification (expo-notifications n'existe pas sur le web et faisait planter l'app,
// 15 oct. 2026). Mêmes exports que notifications.ts, vérifiés par notifications.test.ts.
export function preparerNotifications() {}

export function useOuvrirDepuisNotification() {}

export async function activerNotifications(): Promise<void> {}
