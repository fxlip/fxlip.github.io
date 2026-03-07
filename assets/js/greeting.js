document.addEventListener("DOMContentLoaded", function() {

  var greetingBlock = document.getElementById("greeting-block");
  var greetingOutput = document.getElementById("greeting-output");
  if (!greetingBlock || !greetingOutput) return;

  var WORKER_URL = document.body.dataset.workerUrl;
  if (!WORKER_URL) return;

  var FP_KEY         = "fxlip_fp";
  var NAME_KEY       = "fxlip_visitor_name";
  var HELLO_CACHE_KEY = "fxlip_hello_cache";
  var HELLO_TTL       = 10 * 60 * 1000; // 10 minutos
  var currentFp      = null;

  function getHelloCache() {
    try {
      var c = JSON.parse(localStorage.getItem(HELLO_CACHE_KEY));
      if (c && c.ts && (Date.now() - c.ts) < HELLO_TTL) return c.data;
    } catch (_) {}
    return null;
  }

  function setHelloCache(data) {
    try {
      localStorage.setItem(HELLO_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (_) {}
  }

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
  // 3. HELPER: DIGITAÇÃO TERMINAL — réplica do padrão de main.js
  // =======================================================================
  var TYPING_SPEED   = 45;  // ms/char (main.js usa 70ms × 9 chars ≈ mesmo feel)
  var SUSPENSE_DELAY = 800; // ms de pausa pós-digitação antes do output (= main.js)

  // Digita texto no elemento e retorna Promise (idêntico ao typeCommand de main.js)
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
  // 4. WHOAMI
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

    var existing = document.getElementById('rename-line');
    if (existing) existing.remove();

    var finalText = applyGender(applyVars(template, vars), data.gender || null);

    // Encontra o .t-cmd do "whoami && cat dog.txt" no mesmo terminal-body
    var termBody = dogEl.parentElement;
    var cmdEl = termBody ? termBody.querySelector('.t-cmd') : null;
    // Salva o texto original na primeira chamada (evita reler o DOM alterado)
    if (cmdEl && !cmdEl._origText) cmdEl._origText = cmdEl.textContent.trim();
    var cmdText = cmdEl ? cmdEl._origText : '';

    var afterOutput = function() {
      dogEl.removeAttribute('data-mentions-processed');
      if (window.applyMentions) window.applyMentions(dogEl);
      // Novo usuário: evento só dispara após renderDogTxt com nome real
      if (data.name) document.dispatchEvent(new CustomEvent('whoami:ready'));
    };

    // Anima apenas quando há dados reais e animação não foi suprimida
    if (!skipAnimation && (data.name || data.visits) && cmdEl && cmdText) {
      typeCmd(cmdEl, cmdText)
        .then(function() { return new Promise(function(r) { setTimeout(r, SUSPENSE_DELAY); }); })
        .then(function() {
          var whoamiCursor = cmdEl.parentElement ? cmdEl.parentElement.querySelector('.cursor-blink') : null;
          if (whoamiCursor) whoamiCursor.style.display = 'none';
          dogEl.textContent = finalText;
          afterOutput();
        });
    } else {
      // Oculta o cursor do whoami (ramo sem animação) para evitar briga visual
      var whoamiCursorElse = cmdEl && cmdEl.parentElement
        ? cmdEl.parentElement.querySelector('.cursor-blink') : null;
      if (whoamiCursorElse) whoamiCursorElse.style.display = 'none';
      dogEl.textContent = finalText;
      afterOutput();
    }
  }

  // =======================================================================
  // 4. BADGES
  // =======================================================================
  var BADGE_DEFS = [
    {
      id:    'popular',
      label: 'popular',
      title: '24h+ no site · 10+ visitas · 1+ comentário · 10+ upvotes',
      test:  function(s) {
        return s.total_time_spent >= 86400
            && s.visits    >= 10
            && s.comments  >= 1
            && s.upvotes   >= 10;
      }
    },
    {
      id:    'frequente',
      label: 'frequente',
      title: '50+ visitas',
      test:  function(s) { return s.visits >= 50; }
    },
    {
      id:    'engajado',
      label: 'engajado',
      title: '5+ comentários',
      test:  function(s) { return s.comments >= 5; }
    },
    {
      id:    'curtidor',
      label: 'curtidor',
      title: '20+ upvotes dados',
      test:  function(s) { return s.upvotes >= 20; }
    },
    {
      id:    'veterano',
      label: 'veterano',
      title: 'membro há 90+ dias',
      test:  function(s) {
        if (!s.first_seen) return false;
        return (Date.now() - new Date(s.first_seen).getTime()) >= 90 * 86400 * 1000;
      }
    }
  ];

  function computeReputation(s) {
    return Math.floor(
      (s.visits             || 0) * 1  +
      Math.floor((s.total_time_spent || 0) / 3600) * 2 +
      (s.comments           || 0) * 10 +
      (s.upvotes            || 0) * 3
    );
  }

  function renderBadgesHtml(s) {
    var parts = [];
    BADGE_DEFS.forEach(function(b) {
      if (b.test(s)) {
        parts.push('<span class="badge badge-' + b.id + '" title="' + b.title + '">' + b.label + '</span>');
      }
    });
    var rep = computeReputation(s);
    if (rep > 0) {
      parts.push('<span class="badge badge-rep" title="reputação: visitas + tempo + interações">rep ' + rep + '</span>');
    }
    return parts.join(' ');
  }

  // =======================================================================
  // 4. HELPER: INJETA O INPUT DE NOME NO DOM
  // =======================================================================
  function injectNameInput(fp) {
    var prev = document.getElementById('greeting-input-line');
    if (prev) prev.remove();

    var niDataEl = document.getElementById('whoami-data');
    var niWhoami = {};
    try { niWhoami = JSON.parse(niDataEl.textContent); } catch (_) {}
    var niCmd = niWhoami.prompt_cmd || 'export USER=';

    var inputLine = document.createElement("div");
    inputLine.id = "greeting-input-line";
    inputLine.innerHTML =
      '<span class="t-user">fxlip</span>' +
      '<span class="t-gray">@</span>' +
      '<span class="t-host">www</span>' +
      '<span class="t-gray">:</span>' +
      '<span class="t-path">~/feed</span>' +
      '<span class="t-gray">$</span> ' +
      '<span class="t-cmd"></span>';

    var dogEl = document.getElementById('whoami-dog-txt');
    if (dogEl) {
      dogEl.insertAdjacentElement('afterend', inputLine);
    } else {
      greetingBlock.appendChild(inputLine);
    }

    var cmdSpan = inputLine.querySelector('.t-cmd');

    typeCmd(cmdSpan, niCmd).then(function() {
      var input = document.createElement('input');
      input.type = 'text';
      input.id = 'greeting-input';
      input.className = 'greeting-input';
      input.maxLength = 30;
      input.autocomplete = 'off';
      input.spellcheck = false;

      var cursor = document.createElement('span');
      cursor.className = 'cursor-blink';
      cursor.textContent = '█';

      // Cursor colado ao USER=; input colapsado até receber foco
      input.style.width    = '0';
      input.style.minWidth = '0';
      input.style.padding  = '0';
      inputLine.appendChild(cursor);
      inputLine.appendChild(input);

      input.addEventListener('focus', function() {
        input.style.caretColor = '';
        cursor.style.display = 'none';
        input.style.width    = '';
        input.style.minWidth = '';
        input.style.padding  = '';
        if (!input.size) input.size = 1;
      });
      input.addEventListener('blur', function() {
        if (!input.value) {
          cursor.style.display = '';
          input.style.width    = '0';
          input.style.minWidth = '0';
          input.style.padding  = '0';
        }
      });

      // Clicar no █ reativa o input
      cursor.style.cursor = 'text';
      cursor.addEventListener('click', function() { input.focus(); });

      input.focus();

      // Máscara: lowercase, espaço→hífen, só [a-z0-9à-ú-], sem traço inicial nem duplo
      input.addEventListener("input", function() {
        var pos = input.selectionStart;
        var original = input.value;
        var masked = original
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9à-ú-]/g, "")
          .replace(/^-+/, "")
          .replace(/-{2,}/g, "-");
        if (masked !== original) {
          input.value = masked;
          input.selectionStart = input.selectionEnd = Math.min(pos, masked.length);
        }
        input.size = Math.max(input.value.length, 1);
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
              input.disabled = false;
              input.style.opacity = '1';
              var existing = document.getElementById('greeting-name-error');
              if (existing) existing.remove();
              var errEl = document.createElement('div');
              errEl.id = 'greeting-name-error';
              errEl.className = 't-out';
              errEl.style.cssText = 'color:var(--link-color);margin-top:0.2em';
              errEl.textContent = data.error === 'registration_limit'
                ? 'ta com sabor de spam'
                : 'esse nick já existe. tenta outro?';
              inputLine.appendChild(errEl);
              if (data.error === 'name_taken') input.focus();
              return;
            }
            try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
            setHelloCache(data);
            renderGreeting(data, true);
          }).catch(function() {
            try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
            renderGreeting({ name: val }, true);
          });
      });
    });
  }

  // =======================================================================
  // 5. RENDER: FIRST VISIT (Prompt de nome)
  // =======================================================================
  function renderNamePrompt(fp) {
    renderDogTxt({});
    injectNameInput(fp);
  }

  // =======================================================================
  // 6. RENDER: RETURNING VISITOR
  // =======================================================================
  function renderGreeting(data, isNew) {
    var prev = document.getElementById("greeting-input-line");
    if (prev) prev.remove();

    if (isNew && data.name) {
      var welcomeDataEl = document.getElementById('whoami-data');
      var welcomeWhoami = {};
      try { welcomeWhoami = JSON.parse(welcomeDataEl.textContent); } catch (_) {}
      var welcomeTemplate = welcomeWhoami.welcome_new || 'Legal, @{{name}}. Agora você tem um perfil.';
      var welcomeText = applyGender(applyVars(welcomeTemplate, { name: esc(data.name) }), data.gender);

      var welcomeDiv = document.createElement('div');
      welcomeDiv.className = 't-out';
      welcomeDiv.textContent = welcomeText;
      greetingBlock.style.display = 'block';
      greetingBlock.innerHTML = '';
      greetingBlock.appendChild(welcomeDiv);
      if (window.applyMentions) window.applyMentions(greetingBlock);

      // Limpa o dog_txt do estado de primeiro acesso e dispara o nvdd.sh
      var wDogEl = document.getElementById('whoami-dog-txt');
      if (wDogEl) wDogEl.textContent = '';
      document.dispatchEvent(new CustomEvent('whoami:ready'));
      return;
    }

    // Usuário retornando: dog_txt com animação normal
    renderDogTxt(data, false);
  }

  // =======================================================================
  // 7. MAIN
  // =======================================================================
  function init() {
    var storedName = null;
    try { storedName = localStorage.getItem(NAME_KEY); } catch (_) {}

    getFingerprint().then(function(fp) {
      currentFp = fp;
      if (!storedName) {
        // Mostra prompt imediatamente
        renderNamePrompt(fp);

        // Consulta API para detectar auto-nick (≥100 visitas sem nome)
        fetchWithTimeout(WORKER_URL + "/api/hello", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint: fp }),
        }).then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.name) {
              try { localStorage.setItem(NAME_KEY, data.name); } catch (_) {}
              renderGreeting(data);
            }
            // Sem nome → mantém prompt, sem mensagem de visitas
          })
          .catch(function() {});
        return;
      }

      // Render imediato do cache (UX instantânea) enquanto API verifica em background
      var cachedHello = getHelloCache();
      if (cachedHello) {
        renderGreeting(cachedHello);
      }

      // SEMPRE consulta a API quando há nome — detecta deleção mesmo com cache válido
      fetchWithTimeout(WORKER_URL + "/api/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: fp, name: storedName }),
      }).then(function(res) { return res.json(); })
        .then(function(data) {
          // Perfil deletado pelo admin: limpa cache local e recarrega para mostrar prompt
          if (data.account_deleted) {
            try { localStorage.removeItem(NAME_KEY); } catch (_) {}
            try { localStorage.removeItem(HELLO_CACHE_KEY); } catch (_) {}
            location.reload();
            return;
          }
          setHelloCache(data);
          // Só renderiza se não usou o cache (evita re-render desnecessário)
          if (!cachedHello) renderGreeting(data);
        })
        .catch(function() {
          if (!cachedHello) renderGreeting({ name: storedName });
        });
      return;
    }).catch(function() {
      if (storedName) {
        renderGreeting({ name: storedName });
      }
    });
  }

  init();
});
