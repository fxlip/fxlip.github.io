(function () {
  var WORKER_URL  = document.body.dataset.workerUrl;
  var FP_KEY      = 'fxlip_fp';
  var NAME_KEY    = 'fxlip_visitor_name';
  var output      = document.getElementById('auth-output');
  var wrap        = document.getElementById('auth-cb-wrap');
  var providerArg = document.getElementById('auth-provider-arg');

  var PROVIDER_LABEL = { google: 'gmail', github: 'github', twitter: 'twitter' };
  var PROVIDER_COLOR = { google: '#ea4335', github: 'var(--accent-cyan)', twitter: '#1da1f2' };

  var done = false; // interrompe digitações em curso quando resultado chega

  // ── Utilitários de linha ─────────────────────────────────────────────

  function appendLine(className) {
    var el = document.createElement('div');
    el.className = 'auth-line' + (className ? ' ' + className : '');
    output.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('auth-line-in'); });
    });
    return el;
  }

  function typeLine(text, className, delay) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var el = appendLine(className);
        if (done) { el.textContent = text; resolve(el); return; }
        var i = 0;
        var cursor = document.createElement('span');
        cursor.className = 'auth-cursor';
        cursor.textContent = '▌';
        el.appendChild(cursor);
        var tick = setInterval(function () {
          if (done) { clearInterval(tick); cursor.remove(); el.textContent = text; resolve(el); return; }
          cursor.insertAdjacentText('beforebegin', text[i++]);
          if (i >= text.length) { clearInterval(tick); cursor.remove(); resolve(el); }
        }, 20);
      }, delay || 0);
    });
  }

  function staticLine(html, className, delay) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var el = appendLine(className);
        el.innerHTML = html;
        resolve(el);
      }, delay || 0);
    });
  }

  function showError(msg, detail) {
    done = true;
    staticLine('<span class="auth-icon-err">✗</span> <span class="auth-text-err">' + msg + '</span>');
    if (detail) staticLine('<span class="t-gray">' + detail + '</span>', '', 80);
    staticLine('<a href="/" class="file-link">← voltar</a>', '', 160);
  }

  function fadeAndGo(url) {
    setTimeout(function () {
      if (wrap) {
        wrap.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        wrap.style.opacity    = '0';
        wrap.style.transform  = 'translateY(-16px)';
        setTimeout(function () { location.href = url; }, 530);
      } else {
        location.href = url;
      }
    }, 750);
  }

  // ── Validações ───────────────────────────────────────────────────────

  var params     = new URLSearchParams(location.search);
  var code       = params.get('code');
  var state      = params.get('state');
  var errorParam = params.get('error');

  if (errorParam) {
    typeLine('inicializando...', 't-gray', 100).then(function () {
      showError('autorização negada', errorParam);
    });
    return;
  }

  if (!code || !state) { location.href = '/'; return; }

  var fingerprint = null;
  try { fingerprint = localStorage.getItem(FP_KEY); } catch (_) {}

  if (!fingerprint) {
    typeLine('inicializando...', 't-gray', 100).then(function () {
      showError('sessão não encontrada', 'tente novamente a partir do seu perfil.');
    });
    return;
  }

  if (!WORKER_URL) { showError('configuração inválida'); return; }

  // ── Fluxo principal ──────────────────────────────────────────────────

  var startTs = performance.now();

  // Animações de espera (correm em paralelo com o fetch)
  typeLine('inicializando...', 't-gray', 80)
    .then(function () { return typeLine('aguardando servidor...', 't-gray', 280); });

  fetch(WORKER_URL + '/api/auth/callback', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ code: code, state: state, fingerprint: fingerprint }),
  })
    .then(function (res) {
      return res.json().then(function (d) { return { ok: res.ok, data: d }; });
    })
    .then(function (result) {
      // Aguarda mínimo de 1.1s para as linhas ficarem legíveis
      var wait = Math.max(0, 1100 - (performance.now() - startTs));
      setTimeout(function () {
        done = true;

        if (!result.ok || !result.data.ok) {
          var errCode = result.data.error || 'erro desconhecido';
          if (errCode === 'account_already_linked') {
            showError('conta já vinculada', 'esta conta já está conectada a outro perfil.');
          } else {
            showError('falha ao conectar', errCode);
          }
          return;
        }

        var provider = result.data.provider || '';
        var username = result.data.username || '';
        var label    = PROVIDER_LABEL[provider] || provider;
        var color    = PROVIDER_COLOR[provider] || 'var(--green)';

        // Atualiza argumento do comando no prompt
        if (providerArg) providerArg.textContent = label;

        staticLine(
          '<span class="auth-icon-ok">✔</span>'
          + ' <span style="color:' + color + ';font-weight:600">' + label + '</span>'
          + ' conectado'
          + (username ? ' como <span class="t-cmd">@' + username + '</span>' : ''),
          'auth-line-ok'
        ).then(function () {
          typeLine('retornando ao perfil...', 't-gray', 340).then(function () {
            var name = null;
            try { name = localStorage.getItem(NAME_KEY); } catch (_) {}
            fadeAndGo(name ? '/' + encodeURIComponent(name) : '/');
          });
        });
      }, wait);
    })
    .catch(function (err) {
      var wait = Math.max(0, 600 - (performance.now() - startTs));
      setTimeout(function () { showError('erro de rede', err.message); }, wait);
    });
})();
