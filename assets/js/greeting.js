document.addEventListener("DOMContentLoaded", function() {

  var WORKER_URL = document.body.dataset.workerUrl;
  if (!WORKER_URL) return;

  var FP_KEY   = "fxlip_fp";
  var NAME_KEY = "fxlip_visitor_name";

  // =======================================================================
  // 1. FINGERPRINT (SHA-256, sem lib externa)
  // =======================================================================
  function generateFingerprint() {
    var components = [];
    try {
      var canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 50;
      var ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60"; ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069"; ctx.fillText("fxlip.com", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)"; ctx.fillText("fxlip.com", 4, 17);
      components.push(canvas.toDataURL());
    } catch (_) { components.push("no-canvas"); }
    components.push(String(screen.width));
    components.push(String(screen.height));
    components.push(String(screen.colorDepth));
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    components.push(navigator.language || "");
    var raw = components.join("|");
    var data = new TextEncoder().encode(raw);
    return crypto.subtle.digest("SHA-256", data).then(function(buf) {
      return Array.from(new Uint8Array(buf))
        .map(function(b) { return b.toString(16).padStart(2, "0"); })
        .join("");
    });
  }

  function getFingerprint() {
    var fp = null;
    try { fp = localStorage.getItem(FP_KEY); } catch (_) {}
    if (fp && fp.length === 64) return Promise.resolve(fp);
    return generateFingerprint().then(function(fp) {
      try { localStorage.setItem(FP_KEY, fp); } catch (_) {}
      return fp;
    });
  }

  // =======================================================================
  // 2. UTILITÁRIOS
  // =======================================================================
  function esc(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fetchWithTimeout(url, options, timeout) {
    timeout = timeout || 5000;
    var controller = new AbortController();
    var id = setTimeout(function() { controller.abort(); }, timeout);
    options = options || {};
    options.signal = controller.signal;
    return fetch(url, options).finally(function() { clearTimeout(id); });
  }

  // =======================================================================
  // 3. MÁSCARA DE INPUT (função pura — testada em greeting-id-prompt.test.js)
  // =======================================================================
  function maskName(raw) {
    return raw
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9à-ú-]/g, '')
      .replace(/^-+/, '')
      .replace(/-{2,}/g, '-');
  }

  // =======================================================================
  // 4. APÓS NOME DEFINIDO — restaura terminal, mostra aba @
  // =======================================================================
  function onNameSet(name) {
    var prev = document.getElementById("greeting-input-line");
    if (prev) prev.remove();

    var container = document.getElementById('id-prompt');

    // Restaura o conteúdo do terminal que estava oculto
    if (container) {
      var termBody = container.nextElementSibling;
      if (termBody && termBody.classList.contains('terminal-body')) {
        termBody.style.display = '';
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    // Mostra a aba @username
    document.querySelectorAll('[id="terminal-tab-profile"]').forEach(function(tab) {
      tab.href = '/' + name;
      tab.style.display = '';
    });
  }

  // =======================================================================
  // 5. INPUT DE NOME
  // =======================================================================
  function injectNameInput(fp, afterEl, parentEl) {
    var prev = document.getElementById('greeting-input-line');
    if (prev) prev.remove();

    var niDataEl = document.getElementById('whoami-data');
    var niWhoami = {};
    try { niWhoami = JSON.parse(niDataEl ? niDataEl.textContent : '{}'); } catch (_) {}
    var niCmd = niWhoami.prompt_cmd || 'export USER=';

    var inputLine = document.createElement("div");
    inputLine.id = "greeting-input-line";
    inputLine.innerHTML =
      '<span class="t-user">fxlip</span>' +
      '<span class="t-gray">@</span>' +
      '<span class="t-host">www</span>' +
      '<span class="t-gray">:</span>' +
      '<span class="t-path">~</span>' +
      '<span class="t-gray">$</span> ' +
      '<span class="t-cmd"></span>';

    if (afterEl) {
      afterEl.insertAdjacentElement('afterend', inputLine);
    } else if (parentEl) {
      parentEl.appendChild(inputLine);
    } else {
      var body = document.querySelector('.terminal-body');
      if (body) body.prepend(inputLine);
    }

    var cmdSpan = inputLine.querySelector('.t-cmd');
    var TYPING_SPEED = 45;

    // Digita o comando de identificação
    (function typeCmd(el, text, cb) {
      var i = 0;
      var id = setInterval(function() {
        el.textContent += text[i++];
        if (i >= text.length) { clearInterval(id); cb(); }
      }, TYPING_SPEED);
    }(cmdSpan, niCmd, function() {
      var input = document.createElement('input');
      input.type = 'text';
      input.id = 'greeting-input';
      input.className = 'greeting-input';
      input.maxLength = 23;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.style.width      = '0ch';
      input.style.caretColor = 'transparent';

      var cursor = document.createElement('span');
      cursor.className = 'cursor-blink';
      cursor.textContent = '█';

      inputLine.appendChild(input);
      inputLine.appendChild(cursor);

      input.addEventListener('blur', function() {
        requestAnimationFrame(function() { input.focus(); });
      });
      input.focus();

      input.addEventListener("input", function() {
        var pos = input.selectionStart;
        var masked = maskName(input.value);
        if (masked !== input.value) {
          input.value = masked;
          input.selectionStart = input.selectionEnd = Math.min(pos, masked.length);
        }
        input.style.width = input.value.length + 'ch';
      });

      input.addEventListener("keydown", function(e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var val = input.value.replace(/^-+|-+$/g, "").trim();
        if (!val || val.length < 2) return;
        input.value = val;
        input.disabled = true;
        input.style.opacity = "0.5";

        fetchWithTimeout(WORKER_URL + "/api/hello", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint: fp, name: val }),
        }).then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.error === 'name_taken' || data.error === 'registration_limit') {
              inputLine.removeAttribute('id');
              cursor.remove();
              input.replaceWith(document.createTextNode(val));
              var errOut = document.createElement('div');
              errOut.className = 't-out';
              errOut.textContent = data.error === 'registration_limit'
                ? 'bash: USER=' + esc(val) + ': ta com sabor de spam, marca um dez'
                : 'bash: USER=' + esc(val) + ': usuário já em uso';
              inputLine.insertAdjacentElement('afterend', errOut);
              injectNameInput(fp, errOut);
              return;
            }
            try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
            onNameSet(val);
          }).catch(function() {
            try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
            onNameSet(val);
          });
      });
    }));
  }

  // =======================================================================
  // 6. PROMPT UNIVERSAL (inject em qualquer página com terminal-tabs-bar)
  // =======================================================================
  function injectIdPrompt(fp) {
    var tabsBar = document.querySelector('.terminal-tabs-bar');
    if (!tabsBar) return;

    if (document.getElementById('id-prompt')) return;

    // Oculta o conteúdo do terminal enquanto o nome não está definido
    var termBody = tabsBar.nextElementSibling;
    if (termBody && termBody.classList.contains('terminal-body')) {
      termBody.style.display = 'none';
    }

    var container = document.createElement('div');
    container.id = 'id-prompt';
    container.style.cssText = 'padding:10px 15px;border-bottom:1px solid #2d2b3b';
    tabsBar.insertAdjacentElement('afterend', container);

    injectNameInput(fp, null, container);
  }

  // =======================================================================
  // 7. MAIN
  // =======================================================================
  var storedName = null;
  try { storedName = localStorage.getItem(NAME_KEY); } catch (_) {}
  if (storedName) return;

  getFingerprint().then(function(fp) {
    injectIdPrompt(fp);

    // Verifica auto-nick (≥100 visitas sem nome)
    fetchWithTimeout(WORKER_URL + "/api/hello", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: fp }),
    }).then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.name) {
          try { localStorage.setItem(NAME_KEY, data.name); } catch (_) {}
        }
      })
      .catch(function() {});
  }).catch(function() {});

});
