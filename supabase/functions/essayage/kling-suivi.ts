// Lecture de la réponse de suivi Kling (GET /solutions?task_ids=…). Sans dépendance : testé par kling-suivi.test.ts.
// La doc Kling annonce `data` en liste, mais pour UNE tâche l'API renvoie un objet (constaté le 12 oct. 2026 :
// tous les essayages seraient restés « en cours » sans cette correction). On accepte les deux formes.

export type TacheKling = {
  id?: string;
  status: string;
  message?: string;
  outputs?: Array<{ type: string; url: string }>;
};

export function lireTache(data: unknown, taskId: string): TacheKling | null {
  const liste = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [];
  const taches = liste.filter((t): t is TacheKling => !!t && typeof t === 'object' && typeof t.status === 'string');
  return taches.find((t) => t.id === taskId) ?? (taches.length === 1 && !taches[0].id ? taches[0] : null);
}

export function imageDeSortie(tache: TacheKling): string | null {
  return tache.outputs?.find((o) => o.type === 'image' && typeof o.url === 'string')?.url ?? null;
}
