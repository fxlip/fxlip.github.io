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
  // 3. BADGES
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
    var inputLine = document.createElement("div");
    inputLine.id = "greeting-input-line";
    inputLine.innerHTML =
      '<span class="t-user">fxlip</span>' +
      '<span class="t-gray">@</span>' +
      '<span class="t-host">www</span>' +
      '<span class="t-gray">:</span>' +
      '<span class="t-path">~/feed</span>' +
      '<span class="t-gray">$</span> ' +
      '<span class="t-cmd">export USER=</span>' +
      '<input type="text" id="greeting-input" class="greeting-input" ' +
        'maxlength="30" autocomplete="off" spellcheck="false" ' +
        'placeholder="qual seu nome?">';

    var siteDesc = greetingBlock.nextElementSibling;
    if (siteDesc && siteDesc.classList.contains('t-out')) {
      siteDesc.insertAdjacentElement('afterend', inputLine);
    } else {
      greetingBlock.appendChild(inputLine);
    }

    var input = document.getElementById("greeting-input");

    // Respiração do placeholder
    var phStyle = document.createElement("style");
    document.head.appendChild(phStyle);
    var phStart = performance.now();
    function animatePlaceholder(ts) {
      if (!document.getElementById("greeting-input")) { phStyle.remove(); return; }
      var v = (Math.sin((ts - phStart) / 2800 * Math.PI * 2) + 1) / 2;
      var a = (0.12 + v * 0.28).toFixed(3);
      phStyle.textContent = "#greeting-input::placeholder{color:rgba(92,95,119," + a + ")}";
      requestAnimationFrame(animatePlaceholder);
    }
    requestAnimationFrame(animatePlaceholder);

    // Máscara: lowercase, espaço→hífen, sem caracteres especiais
    input.addEventListener("input", function() {
      var pos = input.selectionStart;
      var original = input.value;
      var masked = original.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9à-ú\-]/g, "").replace(/-{2,}/g, "-");
      if (masked !== original) {
        input.value = masked;
        input.selectionStart = input.selectionEnd = Math.min(pos, masked.length);
      }
    });

    input.addEventListener("keydown", function(e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var val = input.value.trim();
      if (!val) return;

      input.disabled = true;
      input.style.opacity = "0.5";

      fetchWithTimeout(WORKER_URL + "/api/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: fp, name: val }),
      }).then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.error === 'name_taken') {
            input.disabled = false;
            input.style.opacity = '1';
            var existing = document.getElementById('greeting-name-error');
            if (existing) existing.remove();
            var errEl = document.createElement('div');
            errEl.id = 'greeting-name-error';
            errEl.className = 't-out';
            errEl.style.cssText = 'color:var(--link-color);margin-top:0.2em';
            errEl.textContent = 'esse nick já existe. tenta outro?';
            inputLine.appendChild(errEl);
            input.focus();
            return;
          }
          try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
          setHelloCache(data);
          renderGreeting(data);
        }).catch(function() {
          try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
          renderGreeting({ name: val });
        });
    });
  }

  // =======================================================================
  // 5. RENDER: FIRST VISIT (Prompt de nome)
  // =======================================================================
  function renderNamePrompt(fp) {
    greetingBlock.style.display = "block";
    greetingOutput.textContent = "Primeiro acesso detectado.";
    injectNameInput(fp);
  }

  // =======================================================================
  // 6. RENDER: RETURNING VISITOR
  // =======================================================================
  function renderGreeting(data) {
    var prev = document.getElementById("greeting-input-line");
    if (prev) prev.remove();

    greetingBlock.style.display = "block";

    var ago  = data.lastSeen ? timeAgo(data.lastSeen) : null;
    var city = data.city || "desconhecido";

    var line;
    if (data.name) {
      var nameLink = '<a href="/' + esc(data.name) + '" class="file-link">@' + esc(data.name) + '</a>';
      line = nameLink
        + (ago
            ? ', seu último login foi ' + esc(ago) + ', de ' + esc(city) + '.'
            : ', primeiro acesso.');
    } else {
      line = ago
        ? esc('Último login: ' + ago + ', de ' + city)
        : esc('Último login: primeiro acesso');
    }

    greetingBlock.innerHTML = '<div class="t-gray">' + line + '</div>';
  }

  // =======================================================================
  // 7. MAIN
  // =======================================================================
  function init() {
    var storedName = null;
    try { storedName = localStorage.getItem(NAME_KEY); } catch (_) {}

    getFingerprint().then(function(fp) {
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

      // Cache de 10 min para evitar hello em toda página
      var cachedHello = getHelloCache();
      if (cachedHello) {
        renderGreeting(cachedHello);
        return;
      }

      return fetch(WORKER_URL + "/api/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: fp, name: storedName }),
      }).then(function(res) { return res.json(); })
        .then(function(data) {
          setHelloCache(data);
          renderGreeting(data);
        });
    }).catch(function() {
      if (storedName) {
        renderGreeting({ name: storedName });
      }
    });
  }

  init();
});
