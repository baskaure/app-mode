// Inscription à la liste d'attente : appelle la fonction Supabase inscrire_liste_attente (migration 000015).
// La clé est la clé PUBLIQUE du projet (sans droit sur les tables) : elle peut figurer dans la page.
(function () {
  var URL_SUPABASE = 'https://ccqlylvpqugdixqojjxk.supabase.co';
  var CLE_PUBLIQUE = 'sb_publishable_kuAi0LFR9CNIIEbibYtTlw_MXF8OIXe';
  var MESSAGES = {
    ok: 'C’est noté. On t’écrit le jour du lancement.',
    invalide: 'Cette adresse ne semble pas valide. Vérifie-la et réessaie.',
    trop: 'Beaucoup d’inscriptions en ce moment. Réessaie dans une minute.',
    erreur: 'L’inscription n’est pas passée. Vérifie ta connexion et réessaie.',
  };

  // D'où vient le visiteur (lien en bio TikTok, Instagram…) : ?ref=tiktok ou utm_source=tiktok.
  var params = new URLSearchParams(location.search);
  var source = (params.get('ref') || params.get('utm_source') || '').slice(0, 40) || null;

  document.querySelectorAll('form[data-liste]').forEach(function (form) {
    var champ = form.querySelector('input[type=email]');
    var bouton = form.querySelector('button');
    var message = form.querySelector('[data-message]');
    var piege = form.querySelector('input[name=site]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Champ invisible rempli : c'est un robot, on fait comme si tout allait bien.
      if (piege && piege.value) return afficher('ok');
      if (!champ.checkValidity()) return afficher('invalide');
      bouton.disabled = true;
      bouton.textContent = 'Inscription…';
      fetch(URL_SUPABASE + '/rest/v1/rpc/inscrire_liste_attente', {
        method: 'POST',
        headers: { apikey: CLE_PUBLIQUE, Authorization: 'Bearer ' + CLE_PUBLIQUE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_email: champ.value, p_source: source }),
      })
        .then(function (r) { return r.ok ? r.json() : 'erreur'; })
        .then(function (statut) { afficher(MESSAGES[statut] ? statut : 'erreur'); })
        .catch(function () { afficher('erreur'); });
    });

    function afficher(statut) {
      message.textContent = MESSAGES[statut];
      message.dataset.etat = statut === 'ok' ? 'ok' : 'erreur';
      bouton.disabled = false;
      bouton.textContent = form.dataset.bouton;
      if (statut === 'ok') {
        form.classList.add('inscrit');
        champ.value = '';
      }
    }
  });
})();
