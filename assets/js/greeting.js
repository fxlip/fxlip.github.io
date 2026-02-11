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

  // =======================================================================
  // 3. RENDER: FIRST VISIT (Input)
  // =======================================================================
  function renderNamePrompt() {
    greetingBlock.style.display = "block";
    greetingOutput.textContent = "visitor: n\u00e3o identificado";

    var inputLine = document.createElement("div");
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
        'placeholder="seu nome">';

    greetingBlock.appendChild(inputLine);

    var input = document.getElementById("greeting-input");

    input.addEventListener("keydown", function(e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var val = input.value.trim();
      if (!val) return;

      input.disabled = true;
      input.style.opacity = "0.5";

      getFingerprint().then(function(fp) {
        return fetch(WORKER_URL + "/api/hello", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint: fp, name: val }),
        }).then(function(res) { return res.json(); });
      }).then(function(data) {
        try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
        renderGreeting(data.greeting || ("Bem-vindo, " + val + "!"));
      }).catch(function() {
        try { localStorage.setItem(NAME_KEY, val); } catch (_) {}
        renderGreeting("Bem-vindo, " + val + "!");
      });
    });
  }

  // =======================================================================
  // 4. RENDER: RETURNING VISITOR
  // =======================================================================
  function renderGreeting(text) {
    greetingBlock.style.display = "block";
    greetingBlock.innerHTML =
      '<div>' +
        '<span class="t-user">fxlip</span>' +
        '<span class="t-gray">@</span>' +
        '<span class="t-host">www</span>' +
        '<span class="t-gray">:</span>' +
        '<span class="t-path">~/feed</span>' +
        '<span class="t-gray">$</span> ' +
        '<span class="t-cmd">whoami</span>' +
      '</div>' +
      '<div class="t-out">' + esc(text) + '</div>';
  }

  // =======================================================================
  // 5. MAIN
  // =======================================================================
  function init() {
    var storedName = null;
    try { storedName = localStorage.getItem(NAME_KEY); } catch (_) {}

    getFingerprint().then(function(fp) {
      if (!storedName) {
        renderNamePrompt();
        fetch(WORKER_URL + "/api/hello", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint: fp }),
        }).catch(function() {});
        return;
      }

      return fetch(WORKER_URL + "/api/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: fp, name: storedName }),
      }).then(function(res) { return res.json(); })
        .then(function(data) {
          renderGreeting(data.greeting || ("Bem-vindo, " + storedName + "!"));
        });
    }).catch(function() {
      if (storedName) {
        renderGreeting("Ol\u00e1, " + storedName + ".");
      }
    });
  }

  init();
});
