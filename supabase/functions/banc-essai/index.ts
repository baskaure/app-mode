// Edge Function désactivée : banc d'essai Kling et FASHN (12-13 oct. 2026), terminé.
// Le code du banc est gardé dans tests-essayage/banc-kling/banc-essai.index.ts pour un prochain test.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(() => new Response(JSON.stringify({ erreur: 'Banc d’essai terminé.' }), { status: 410 }));
