// Version web : la session reste dans le stockage du navigateur, pas de trousseau. Mêmes exports que
// sauvegarde-session.ts (vérifié par notifications.test.ts).
export function suivreSession() {
  return () => {};
}

export async function reprendreSession(): Promise<string | null> {
  return null;
}
