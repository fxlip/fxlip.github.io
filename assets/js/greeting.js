document.addEventListener("DOMContentLoaded", function() {

  var greetingBlock = document.getElementById("greeting-block");
  var greetingOutput = document.getElementById("greeting-output");
  if (!greetingBlock || !greetingOutput) return;

  var WORKER_URL = document.body.dataset.workerUrl;
  if (!WORKER_URL) return;

  var FP_KEY = "fxlip_fp";
  var NAME_KEY = "fxlip_visitor_name";

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
  // 2. ESCAPE HTML
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
  // 3. HELPER: INJETA O INPUT DE NOME NO DOM
  // Usado tanto pelo renderNamePrompt quanto pelo "revelar identidade"
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

    // Insere o input ABAIXO da descrição do site (próximo t-out irmão)
    var siteDesc = greetingBlock.nextElementSibling;
    if (siteDesc && siteDesc.classList.contains('t-out')) {
      siteDesc.insertAdjacentElement('afterend', inputLine);
    } else {
      greetingBlock.appendChild(inputLine);
    }

    var input = document.getElementById("greeting-input");

    // Respiração do placeholder (CSS animation não funciona em ::placeholder no Chrome)
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
          try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
          renderGreeting(data);
        }).catch(function() {
          try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
          renderGreeting({ name: val, greeting: "Bem-vindo, " + val + "!" });
        });
    });
  }

  // =======================================================================
  // 4. RENDER: FIRST VISIT (Prompt de nome)
  // =======================================================================
  function renderNamePrompt(fp) {
    greetingBlock.style.display = "block";
    greetingOutput.textContent = "Primeiro acesso detectado.";
    injectNameInput(fp);
  }

  // =======================================================================
  // 5. TIME AGO (ISO → texto relativo)
  // =======================================================================
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
  // 6. RENDER: RETURNING VISITOR (SSH-Style)
  // =======================================================================
  function renderGreeting(data) {
    // Remove inputLine se ainda estiver no DOM (inserido fora do greetingBlock)
    var prev = document.getElementById("greeting-input-line");
    if (prev) prev.remove();

    greetingBlock.style.display = "block";

    var lastLine;
    if (data.lastSeen) {
      var ago = timeAgo(data.lastSeen);
      var city = data.city || "desconhecido";
      lastLine = "Último login: " + ago + ", de " + city;
    } else {
      lastLine = "Último login: primeiro acesso";
    }

    var greetLine = data.greeting || ("Bem-vindo, " + (data.name || "visitante") + "!");

    greetingBlock.innerHTML =
      '<div>' +
      '<div class="t-gray">' + esc(lastLine) + '</div>' +
      '<div class="t-out">' + esc(greetLine) + '</div>';
  }

  // =======================================================================
  // 7. PLACEHOLDER DINÂMICO baseado na contagem de visitas
  // =======================================================================
  function getAnonymousPlaceholder(visits) {
    if (visits >= 99)  return `NULL`;
    if (visits >= 90)  return `ta acabaaaaaaaando a oportunidade heim`;
    if (visits >= 80)  return `daqui a pouco isso vai ser um captcha`;
    if (visits >= 40)  return `você pode se chamar invisível, que tal?`;
    if (visits >= 20)  return `um nickname que seja?`;
    if (visits >= 10)  return `sai do armário`;
    if (visits >= 5)   return `que tal assumir logo?`;
    if (visits < 5)    return `fala comigo!!!`;
    return "qual seu nome?";
  }

  // =======================================================================
  // 8. RENDER: ANONYMOUS RETURNING VISITOR
  // Mantém o prompt visível, só atualiza mensagem e placeholder
  // =======================================================================
  function renderAnonymousGreeting(data) {
    greetingOutput.textContent = data.greeting;

    var input = document.getElementById("greeting-input");
    if (input && !input.value) {
      input.placeholder = getAnonymousPlaceholder(data.visits);
    }
  }

  // =======================================================================
  // 8. MAIN
  // =======================================================================
  function init() {
    var storedName = null;
    try { storedName = localStorage.getItem(NAME_KEY); } catch (_) {}

    getFingerprint().then(function(fp) {
      if (!storedName) {
        // Mostra o prompt imediatamente, sem aguardar a API
        renderNamePrompt(fp);

        // Usa a resposta da API para identificar visitantes anônimos recorrentes
        fetchWithTimeout(WORKER_URL + "/api/hello", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint: fp }),
        }).then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.name) {
              // Auto-nick atribuído pelo worker (≥100 visitas sem nome)
              try { localStorage.setItem(NAME_KEY, data.name); } catch (_) {}
              renderGreeting(data);
            } else if (data.greeting) {
              // Visitante anônimo recorrente: atualiza mensagem + placeholder
              renderAnonymousGreeting(data);
            }
            // Sem name e sem greeting = 1ª visita: mantém o prompt
          })
          .catch(function() {
            // API offline: mantém o prompt (comportamento de fallback)
          });
        return;
      }

      return fetch(WORKER_URL + "/api/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: fp, name: storedName }),
      }).then(function(res) { return res.json(); })
        .then(function(data) {
          renderGreeting(data);
        });
    }).catch(function() {
      if (storedName) {
        renderGreeting({ name: storedName, greeting: "Olá, " + storedName + "." });
      }
    });
  }

  init();
});
