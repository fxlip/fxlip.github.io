document.addEventListener("DOMContentLoaded", function() {

  var WORKER_URL = document.body.dataset.workerUrl;
  if (!WORKER_URL) return;

  var FP_KEY   = "fxlip_fp";
  var NAME_KEY = "fxlip_visitor_name";

  var currentFp = null;

  // =======================================================================
  // 1. FINGERPRINT (SHA-256, sem lib externa)
  // =======================================================================
  function generateFingerprint() {
    var components = [];

    try {
      var canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 50;
      var ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("fxlip.com", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("fxlip.com", 4, 17);
      components.push(canvas.toDataURL());
    } catch (_) {
      components.push("no-canvas");
    }

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

  function timeAgo(isoString) {
    if (!isoString) return null;
    var now = Date.now();
    var then = new Date(isoString).getTime();
    var diff = Math.floor((now - then) / 1000);

    if (diff < 60) return "agora mesmo";
    if (diff < 3600) {
      var m = Math.floor(diff / 60);
      return "há " + m + " min";
    }
    if (diff < 86400) {
      var h = Math.floor(diff / 3600);
      return "há " + h + "h";
    }
    if (diff < 172800) return "ontem";
    if (diff < 2592000) {
      var d = Math.floor(diff / 86400);
      return "há " + d + " dias";
    }
    if (diff < 31536000) {
      var mo = Math.floor(diff / 2592000);
      return "há " + mo + (mo === 1 ? " mês" : " meses");
    }
    return "há muito tempo";
  }

  // =======================================================================
  // 3. HELPER: DIGITAÇÃO TERMINAL
  // =======================================================================
  var TYPING_SPEED   = 45;
  var SUSPENSE_DELAY = 800;

  function typeCmd(el, text) {
    return new Promise(function(resolve) {
      if (el._typer) clearInterval(el._typer);
      el.textContent = '';
      var i = 0;
      el._typer = setInterval(function() {
        el.textContent += text[i++];
        if (i >= text.length) {
          clearInterval(el._typer);
          el._typer = null;
          resolve();
        }
      }, TYPING_SPEED);
    });
  }

  // =======================================================================
  // 4. WHOAMI (usado no perfil)
  // =======================================================================

  function selectMessage(messages, rep) {
    rep = rep || 0;
    if (!messages || !messages.length) return null;
    var sorted = messages.slice().sort(function(a, b) { return (b.min || 0) - (a.min || 0); });
    for (var i = 0; i < sorted.length; i++) {
      if (rep >= (sorted[i].min || 0) && sorted[i].dog_txt) return sorted[i].dog_txt;
    }
    return null;
  }

  function resolveGender(gender) {
    if (gender === 'f')  return 'a';
    if (gender === 'nb') return 'e';
    return 'o';
  }

  function applyGender(text, gender) {
    if (!text) return '';
    return text.replace(/%/g, resolveGender(gender));
  }

  function applyVars(text, vars) {
    if (!text) return '';
    vars = vars || {};
    return text.replace(/\{\{(\w+)\}\}/g, function(match, key) {
      var val = vars[key];
      return (val !== undefined && val !== null && val !== '') ? String(val) : match;
    });
  }

  function formatTimeSecs(secs) {
    if (!secs) return '0min';
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    if (h > 0) return h + 'h' + (m > 0 ? ' ' + m + 'min' : '');
    return m + 'min';
  }

  function renderDogTxt(data, skipAnimation) {
    var dataEl = document.getElementById('whoami-data');
    if (!dataEl) return;
    var whoami;
    try { whoami = JSON.parse(dataEl.textContent); } catch (_) { return; }

    var dogEl = document.getElementById('whoami-dog-txt');
    if (!dogEl) return;

    var visits           = data.visits           || 0;
    var total_time_spent = data.total_time_spent  || 0;
    var comments         = data.comments         || 0;
    var upvotes          = data.upvotes          || 0;

    var rep = Math.floor(
      visits * 1 +
      Math.floor(total_time_spent / 3600) * 2 +
      comments * 10 +
      upvotes  * 3
    );

    var firstSeenMs = data.first_seen ? new Date(data.first_seen).getTime() : null;
    var days        = firstSeenMs ? Math.floor((Date.now() - firstSeenMs) / 86400000) : 0;

    var vars = {
      name:       data.name  || '',
      visits:     visits,
      time:       formatTimeSecs(total_time_spent),
      city:       data.city  || '',
      comments:   comments,
      upvotes:    upvotes,
      rep:        rep,
      days:       days,
      last_login: data.lastSeen ? timeAgo(data.lastSeen) : 'primeiro acesso',
    };

    var template = selectMessage(whoami.messages, rep);
    if (!template) return;

    var finalText = applyGender(applyVars(template, vars), data.gender || null);

    var afterOutput = function() {
      dogEl.removeAttribute('data-mentions-processed');
      if (window.applyMentions) window.applyMentions(dogEl);
    };

    var termBody = dogEl.parentElement;
    var cmdEl = termBody ? termBody.querySelector('.t-cmd') : null;
    if (cmdEl && !cmdEl._origText) cmdEl._origText = cmdEl.textContent.trim();
    var cmdText = cmdEl ? cmdEl._origText : '';

    if (!skipAnimation && (data.name || data.visits) && cmdEl && cmdText) {
      typeCmd(cmdEl, cmdText)
        .then(function() { return new Promise(function(r) { setTimeout(r, SUSPENSE_DELAY); }); })
        .then(function() {
          var cursor = cmdEl.parentElement ? cmdEl.parentElement.querySelector('.cursor-blink') : null;
          if (cursor) cursor.style.display = 'none';
          dogEl.textContent = finalText;
          afterOutput();
        });
    } else {
      dogEl.textContent = finalText;
      afterOutput();
    }
  }

  // =======================================================================
  // 5. MASCARA DE INPUT (função pura — testada em greeting-id-prompt.test.js)
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
  // 6. INPUT DE NOME (injetado no #id-prompt ou em posição relativa)
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

    typeCmd(cmdSpan, niCmd).then(function() {
      var input = document.createElement('input');
      input.type = 'text';
      input.id = 'greeting-input';
      input.className = 'greeting-input';
      input.maxLength = 23;
      input.autocomplete = 'off';
      input.spellcheck = false;

      var cursor = document.createElement('span');
      cursor.className = 'cursor-blink';
      cursor.textContent = '█';

      input.style.width      = '0ch';
      input.style.caretColor = 'transparent';
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
                ? 'bash: USER=' + val + ': ta com sabor de spam, marca um dez'
                : 'bash: USER=' + val + ': usuário já em uso';
              inputLine.insertAdjacentElement('afterend', errOut);

              injectNameInput(fp, errOut);
              return;
            }
            try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
            renderWelcome(val, data);
          }).catch(function() {
            try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
            renderWelcome(val, { name: val });
          });
      });
    });
  }

  // =======================================================================
  // 7. BOAS-VINDAS (após nome ser definido)
  // =======================================================================
  function renderWelcome(name, data) {
    var prev = document.getElementById("greeting-input-line");
    if (prev) prev.remove();

    var container = document.getElementById('id-prompt');

    var dataEl = document.getElementById('whoami-data');
    var whoami = {};
    try { whoami = JSON.parse(dataEl ? dataEl.textContent : '{}'); } catch (_) {}
    var template = whoami.welcome_new || 'Legal, @{{name}}. Agora você tem um perfil.';
    var welcomeText = applyGender(applyVars(template, { name: esc(name) }), data.gender);

    if (container) {
      container.innerHTML = '';
      var welcomeDiv = document.createElement('div');
      welcomeDiv.className = 't-out';
      welcomeDiv.textContent = welcomeText;
      container.appendChild(welcomeDiv);
      if (window.applyMentions) window.applyMentions(container);
    }

    // Mostra a aba @username
    document.querySelectorAll('[id="terminal-tab-profile"]').forEach(function(tab) {
      tab.href = '/' + name;
      tab.style.display = '';
    });

    // Remove o prompt após exibir a boas-vindas
    if (container) {
      setTimeout(function() {
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 3000);
    }
  }

  // =======================================================================
  // 8. PROMPT UNIVERSAL (inject em qualquer página com terminal-tabs-bar)
  // =======================================================================
  function injectIdPrompt(fp) {
    var tabsBar = document.querySelector('.terminal-tabs-bar');
    if (!tabsBar) return;

    var existing = document.getElementById('id-prompt');
    if (existing) return;

    var container = document.createElement('div');
    container.id = 'id-prompt';
    container.style.cssText = 'padding:10px 15px;border-bottom:1px solid #2d2b3b';
    tabsBar.insertAdjacentElement('afterend', container);

    injectNameInput(fp, null, container);
  }

  // =======================================================================
  // 9. PERFIL — whoami do visitante na página do próprio perfil
  // =======================================================================
  document.addEventListener('profile:shown', function(e) {
    var data = e.detail || {};
    var dogEl = document.getElementById('whoami-dog-txt');
    if (!dogEl) return;
    // skipAnimation=true: perfil já está visível, evita re-digitar ./profile.sh
    renderDogTxt(data, true);
  });

  // =======================================================================
  // 10. MAIN
  // =======================================================================
  function init() {
    var storedName = null;
    try { storedName = localStorage.getItem(NAME_KEY); } catch (_) {}

    if (storedName) return; // Usuário identificado — sem prompt universal

    // Sem nome: injeta o prompt de identificação em qualquer página
    getFingerprint().then(function(fp) {
      currentFp = fp;
      injectIdPrompt(fp);

      // Consulta API para detectar auto-nick (≥100 visitas sem nome)
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
  }

  init();
});
