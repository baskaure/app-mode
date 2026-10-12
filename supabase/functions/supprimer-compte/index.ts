// Edge Function : « Supprimer toutes mes données » (RGPD art. 17, App Store règle 5.1.1 v).
//   POST { malgre_abonnement?: boolean }
// Efface, dans cet ordre : les fichiers des 5 buckets, le client RevenueCat, puis le compte Supabase
// (les lignes des tables partent en cascade : profils, pieces, tenues, essais, essayages_journal).
// Supprimer l'utilisateur seul n'efface pas ses fichiers : d'où la première étape.
// Chaque étape peut être rejouée sans risque : en cas d'échec, l'utilisateur relance et on reprend.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { droitActif } from '../essayage/quota.ts';
import { listerTout, paquets } from './fichiers.ts';

const BUCKETS = ['pieces', 'silhouettes', 'vetements', 'essayages', 'figes'] as const;
const DROIT_ABONNEMENT = Deno.env.get('REVENUECAT_ENTITLEMENT') ?? 'premium';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reponse(statut: number, corps: Record<string, unknown>) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function effacerFichiers(admin: SupabaseClient, uid: string) {
  let total = 0;
  for (const bucket of BUCKETS) {
    const chemins = await listerTout(async (dossier, offset, limite) => {
      const { data, error } = await admin.storage.from(bucket).list(dossier, { limit: limite, offset });
      if (error) throw new Error(`stockage:${bucket}:${error.message}`);
      return data;
    }, uid);
    for (const paquet of paquets(chemins)) {
      const { error } = await admin.storage.from(bucket).remove(paquet);
      if (error) throw new Error(`stockage:${bucket}:${error.message}`);
    }
    total += chemins.length;
  }
  return total;
}

// RevenueCat : on lit l'abonnement (pour prévenir), puis on efface le client. Sans clé, rien à faire.
async function revenueCat(uid: string, methode: 'GET' | 'DELETE') {
  const cle = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!cle) return null;
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    method: methode,
    headers: { Authorization: `Bearer ${cle}` },
    signal: AbortSignal.timeout(10000),
  });
  // Pour l'effacement, 404 = déjà effacé (doc RevenueCat : « traiter 200 et 404 comme réussis »).
  if (methode === 'DELETE' && res.status === 404) return null;
  if (!res.ok) throw new Error(`revenuecat:${res.status}`);
  return res.json().catch(() => null);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reponse(405, { erreur: 'Méthode non autorisée.' });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: utilisateur } = await supabase.auth.getUser();
  if (!utilisateur.user) return reponse(401, { erreur: 'Session invalide.' });
  const uid = utilisateur.user.id;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const corps = await req.json().catch(() => ({}));
  const malgreAbonnement = corps?.malgre_abonnement === true;

  try {
    // Effacer le compte ne résilie pas l'abonnement chez Apple ou Google : on prévient d'abord.
    if (!malgreAbonnement) {
      const client = await revenueCat(uid, 'GET');
      if (droitActif(client?.subscriber?.entitlements?.[DROIT_ABONNEMENT], new Date())) {
        return reponse(409, {
          code: 'abonne_actif',
          erreur: 'Tu as un abonnement actif. Supprimer tes données ne l’arrête pas : résilie-le d’abord dans ton store.',
        });
      }
    }

    const fichiers = await effacerFichiers(admin, uid);
    await revenueCat(uid, 'DELETE');
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) throw new Error(`compte:${error.message}`);
    return reponse(200, { supprime: true, fichiers });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('supprimer-compte', uid, message);
    return reponse(502, { erreur: 'La suppression n’a pas pu aller au bout. Réessaie : rien n’est perdu, on reprendra où on en était.' });
  }
});
