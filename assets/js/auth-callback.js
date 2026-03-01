(function () {
  var WORKER_URL = document.body.dataset.workerUrl;
  var FP_KEY     = 'fxlip_fp';
  var NAME_KEY   = 'fxlip_visitor_name';

  var stateEl = document.getElementById('oauth-callback-state');

  function showMsg(html) {
    if (stateEl) stateEl.innerHTML = html;
  }

  function showError(msg) {
    showMsg(
      '<p style="color:#ff5555">' + msg + '</p>'
      + '<p><a href="/" style="color:#bd93f9">← voltar</a></p>'
    );
  }

  var params      = new URLSearchParams(location.search);
  var code        = params.get('code');
  var state       = params.get('state');
  var errorParam  = params.get('error');

  // Provider retornou erro (ex: acesso negado)
  if (errorParam) {
    showError('Autorização negada: ' + errorParam);
    return;
  }

  if (!code || !state) {
    location.href = '/';
    return;
  }

  var fingerprint = null;
  try { fingerprint = localStorage.getItem(FP_KEY); } catch (_) {}

  if (!fingerprint) {
    showError('Sessão não encontrada. Tente novamente.');
    return;
  }

  if (!WORKER_URL) {
    showError('Worker URL não configurado.');
    return;
  }

  showMsg('<p class="t-gray">trocando token...</p>');

  fetch(WORKER_URL + '/api/auth/callback', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ code: code, state: state, fingerprint: fingerprint }),
  })
    .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
    .then(function (result) {
      if (!result.ok || !result.data.ok) {
        var errCode = result.data.error || 'erro desconhecido';
        if (errCode === 'account_already_linked') {
          showError('Esta conta já está vinculada a outro perfil.');
        } else {
          showError('Falha ao conectar: ' + errCode);
        }
        return;
      }

      var provider = result.data.provider || '';
      var username = result.data.username || '';

      showMsg(
        '<p style="color:#50fa7b">✔ ' + provider + ' conectado'
        + (username ? ' como @' + username : '') + '</p>'
        + '<p class="t-gray">redirecionando...</p>'
      );

      // Redireciona de volta para o perfil
      var name = null;
      try { name = localStorage.getItem(NAME_KEY); } catch (_) {}
      setTimeout(function () {
        location.href = name ? '/' + encodeURIComponent(name) : '/';
      }, 1200);
    })
    .catch(function (err) {
      showError('Erro de rede: ' + err.message);
    });
})();
