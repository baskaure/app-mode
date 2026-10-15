// Fin de génération sans l'app (15 oct. 2026) : Kie.ai appelle notre adresse de retour quand l'image est prête,
// le serveur termine l'essayage puis envoie une notification. Sans dépendance : testé par retour.test.ts (npm test).

// Jeton de l'adresse de retour : HMAC-SHA256 de l'identifiant de l'essai. Personne d'autre ne peut déclencher
// la fin d'un essai (le serveur relit de toute façon l'état chez Kie, il ne croit jamais le corps de l'appel).
export async function jetonRetour(essaiId: string, cle: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(cle),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(essaiId)));
  return [...signature].map((o) => o.toString(16).padStart(2, '0')).join('');
}

// Comparaison en temps constant : ne révèle pas par la durée combien de caractères sont justes.
export function memeJeton(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type Fin = 'fait' | 'refuse' | 'erreur';

// Notification Expo envoyée à chaque appareil du compte. Touchée, elle ouvre l'essai dans l'app.
export function messagesPush(jetons: string[], essaiId: string, fin: Fin) {
  const texte =
    fin === 'fait'
      ? { title: 'Ton essayage est prêt', body: 'Viens voir le résultat sur toi.' }
      : { title: 'Ton essayage n’a pas abouti', body: 'Ouvre Akalie pour voir pourquoi et réessayer.' };
  return jetons.map((to) => ({ to, sound: 'default', ...texte, data: { essai: essaiId } }));
}
