(function () {
  var BLACKLIST = new Set([
    'linux','sobre','setup','manifesto','arquivos','feed','www','infosec',
    'busca','s','x','404','robots','sitemap','assets','files','favicon','api','admin',
    'u','p','tag','category','page','search','post','posts'
  ]);

  var WORKER_URL  = document.body.dataset.workerUrl;
  var FP_KEY      = 'fxlip_fp';
  var NAME_KEY    = 'fxlip_visitor_name';
  var USERNAME_RE = /^[a-z0-9à-ú][a-z0-9à-ú-]{0,28}[a-z0-9à-ú]?$/;

  var pathSegment = location.pathname.slice(1).split('/')[0].toLowerCase();

  // ── Utilitários ────────────────────────────────────────────────────────────

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '?';
    return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }

  function formatTime(secs) {
    if (!secs) return '0min';
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    if (h > 0) return h + 'h' + (m > 0 ? ' ' + m + 'min' : '');
    return m + 'min';
  }

  function gravatarUrl(hash, size) {
    return 'https://www.gravatar.com/avatar/'
      + (hash || '00000000000000000000000000000000')
      + '?s=' + (size || 80) + '&d=identicon';
  }

  // ── Badges ────────────────────────────────────────────────────────────────

  var BADGE_DEFS = [
    {
      id: 'popular', label: 'popular',
      title: '24h+ no site · 10+ visitas · 1+ comentário · 10+ upvotes',
      test: function(s) {
        return s.total_time_spent >= 86400 && s.visits >= 10 && s.comments >= 1 && s.upvotes >= 10;
      }
    },
    {
      id: 'frequente', label: 'frequente',
      title: '50+ visitas',
      test: function(s) { return s.visits >= 50; }
    },
    {
      id: 'engajado', label: 'engajado',
      title: '5+ comentários',
      test: function(s) { return s.comments >= 5; }
    },
    {
      id: 'curtidor', label: 'curtidor',
      title: '20+ upvotes dados',
      test: function(s) { return s.upvotes >= 20; }
    },
    {
      id: 'veterano', label: 'veterano',
      title: 'membro há 90+ dias',
      test: function(s) {
        if (!s.first_seen) return false;
        return (Date.now() - new Date(s.first_seen).getTime()) >= 90 * 86400 * 1000;
      }
    }
  ];

  function computeReputation(s) {
    return Math.floor(
      (s.visits || 0) * 1 +
      Math.floor((s.total_time_spent || 0) / 3600) * 2 +
      (s.comments || 0) * 10 +
      (s.upvotes  || 0) * 3
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

  // ── 404 real ──────────────────────────────────────────────────────────────

  function show404(path) {
    var displayPath = path.length > 30 ? path.substring(0, 27) + '...' : path;
    document.getElementById('cmd-display').textContent = 'cd ' + displayPath;
    document.getElementById('err-display').innerHTML =
      'bash: cd: ' + esc(displayPath) + ': Arquivo ou diretório inexistente.<br>'
      + 'Voltar pro <a href=\'/\' class=\'mention-link\'>@feed</a>?';
  }

  // ── Heatmap estilo GitHub ──────────────────────────────────────────────────

  function renderHeatmap(container, clusterJson) {
    var cluster  = {};
    try { cluster = JSON.parse(clusterJson || '{}'); } catch (_) {}
    var hourData = cluster.hour || {};
    var vals     = Object.values(hourData).map(Number);
    var maxVal   = vals.length ? Math.max.apply(null, vals) : 1;
    if (maxVal < 1) maxVal = 1;

    var periods = [[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17],[18,19,20,21,22,23]];
    var plabels = ['00–05','06–11','12–17','18–23'];

    container.innerHTML = periods.map(function (hours, i) {
      var cells = hours.map(function (h) {
        var n  = hourData[String(h)] || 0;
        var lv = n === 0 ? 0 : n <= maxVal * 0.25 ? 1 : n <= maxVal * 0.5 ? 2 : n <= maxVal * 0.75 ? 3 : 4;
        return '<span class="gh-cell gh-lv' + lv + '" title="'
          + (h < 10 ? '0' : '') + h + 'h: ' + n + '"></span>';
      }).join('');
      return '<div class="gh-row"><span class="gh-lbl t-gray">' + plabels[i]
        + '</span><div class="gh-cells">' + cells + '</div></div>';
    }).join('');
  }

  // ── Popula o perfil no DOM ────────────────────────────────────────────────

  function showProfile(username, data, fingerprint) {
    var storedName = null;
    try { storedName = localStorage.getItem(NAME_KEY); } catch (_) {}
    var isMine = !!(storedName && storedName.toLowerCase() === username.toLowerCase() && fingerprint);

    var geo      = [data.city, data.country].filter(Boolean).join(', ') || '?';
    var since    = formatDate(data.first_seen);
    var visits   = (data.visits_count || 0).toLocaleString('pt-BR');
    var timeStr  = formatTime(data.total_time_spent);
    var comments = (data.interactions && data.interactions.comments) || 0;
    var upvotes  = ((data.interactions && data.interactions.likes) || 0)
                 + ((data.interactions && data.interactions.upvotes) || 0);

    // Badges
    var badgesEl = document.getElementById('pc-badges');
    if (badgesEl) {
      badgesEl.innerHTML = renderBadgesHtml({
        visits:           data.visits_count     || 0,
        total_time_spent: data.total_time_spent  || 0,
        comments:         comments,
        upvotes:          upvotes,
        first_seen:       data.first_seen        || null,
      });
    }

    // Avatar
    var avatar   = document.getElementById('pc-avatar');
    avatar.src   = WORKER_URL + '/api/user/' + encodeURIComponent(username) + '/avatar';
    avatar.alt   = '@' + username;
    avatar.onerror = function () { this.onerror = null; this.src = gravatarUrl(data.gravatar_hash, 80); };

    // Nome + badge
    var nameEl = document.getElementById('pc-name');
    nameEl.textContent = '@' + username;
    if (isMine) {
      var badge = document.createElement('span');
      badge.className   = 'profile-badge';
      badge.textContent = '[você]';
      nameEl.appendChild(badge);
    }

    // Meta (geo + data)
    document.getElementById('pc-meta').textContent = geo + ' · desde ' + since;

    // Links sociais
    var socialEl = document.getElementById('pc-social');
    var links    = [];
    if (data.instagram) links.push('<a href="https://instagram.com/' + esc(data.instagram) + '" class="file-link" target="_blank" rel="noopener">ig/' + esc(data.instagram) + '</a>');
    if (data.twitter)   links.push('<a href="https://x.com/'         + esc(data.twitter)   + '" class="file-link" target="_blank" rel="noopener">x/'  + esc(data.twitter)   + '</a>');
    if (links.length) { socialEl.innerHTML = links.join(' '); socialEl.hidden = false; }

    // Stats
    document.getElementById('pc-visits').textContent   = visits;
    document.getElementById('pc-time').textContent     = timeStr;
    document.getElementById('pc-comments').textContent = String(comments);
    document.getElementById('pc-upvotes').textContent  = String(upvotes);

    // Heatmap (único HTML gerado por JS — os dados são dinâmicos)
    renderHeatmap(document.getElementById('pc-heatmap'), data.activity_cluster);

    // Prompts do terminal (username@www:~$)
    var promptHTML = '<span class="t-user">' + esc(username) + '</span>'
      + '<span class="t-gray">@</span><span class="t-host">www</span>'
      + '<span class="t-gray">:~$&nbsp;</span>';
    document.querySelectorAll('.pc-prompt').forEach(function (el) {
      el.innerHTML = promptHTML;
    });

    // Localização travada
    document.getElementById('pc-location-val').textContent = geo;

    // Zona do dono
    if (isMine) {
      document.getElementById('pc-owner-zone').hidden = false;
      setupOwnerZone(username, fingerprint);
    }

    // Troca estado: esconde terminal de 404, exibe perfil
    document.getElementById('profile-terminal').hidden = true;
    document.getElementById('profile-card').hidden     = false;
    document.title = '@' + username;

    // Atividade recente (async)
    if (WORKER_URL) {
      fetch(WORKER_URL + '/api/user/' + encodeURIComponent(username) + '/activity')
        .then(function (r) { return r.json(); })
        .then(function (actData) {
          var section = document.getElementById('profile-activity-section');
          if (!section) return;
          var acts = (actData.activities || []).slice(0, 10);
          if (!acts.length) { section.innerHTML = ''; return; }
          section.innerHTML = acts.map(function (a) {
            var dateStr = a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '';
            var icon    = a.type === 'comment' ? '>' : a.type === 'like' ? '♥' : '▲';
            var content = a.content
              ? ' "' + esc(a.content.substring(0, 80)) + (a.content.length > 80 ? '…' : '') + '"'
              : '';
            return '<div class="profile-activity-item">'
              + '<span class="t-gray">' + icon + '</span> '
              + '<a href="/' + esc(a.target_slug) + '" class="file-link">' + esc(a.target_slug) + '</a>'
              + content + ' <span class="t-gray">' + esc(dateStr) + '</span>'
              + '</div>';
          }).join('');
        }).catch(function () {});
    }
  }

  // ── Owner zone: masks + lock-on-enter ─────────────────────────────────────

  function setupOwnerZone(username, fingerprint) {
    var ownerFields = [
      { id: 'pf-email',     lineId: 'tl-email',     mask: null     },
      { id: 'pf-gender',    lineId: 'tl-gender',     mask: null     },
      { id: 'pf-instagram', lineId: 'tl-instagram',  mask: 'handle' },
      { id: 'pf-twitter',   lineId: 'tl-twitter',    mask: 'handle' },
      { id: 'pf-whatsapp',  lineId: 'tl-whatsapp',   mask: 'phone'  },
    ];

    function maskHandle(el) {
      el.addEventListener('input', function () {
        el.value = el.value.replace(/^@+/, '').replace(/[^a-zA-Z0-9._\-]/g, '');
      });
    }

    function maskPhone(el) {
      el.addEventListener('input', function () {
        var d = el.value.replace(/\D/g, '').slice(0, 13);
        var r = '';
        if (d.length > 0) r  = '+' + d.slice(0, 2);
        if (d.length > 2) r += ' ' + d.slice(2, 4);
        if (d.length > 4) r += ' ' + d.slice(4, 9);
        if (d.length > 9) r += '-' + d.slice(9, 13);
        el.value = r;
      });
    }

    function lockField(fieldId, lineId) {
      var el   = document.getElementById(fieldId);
      var line = document.getElementById(lineId);
      if (el)   el.disabled = true;
      if (line) line.classList.add('ps-term-saved');
    }

    function saveProfile() {
      var status    = document.getElementById('profile-save-status');
      var emailVal  = (document.getElementById('pf-email')     || {}).value || '';
      var genderVal = (document.getElementById('pf-gender')    || {}).value || '';
      var igVal     = (document.getElementById('pf-instagram') || {}).value || '';
      var twVal     = (document.getElementById('pf-twitter')   || {}).value || '';
      var waVal     = (document.getElementById('pf-whatsapp')  || {}).value || '';
      var payload   = { fingerprint: fingerprint };
      if (emailVal)  payload.email     = emailVal.trim();
      if (genderVal) payload.gender    = genderVal;
      if (igVal)     payload.instagram = igVal.trim();
      if (twVal)     payload.twitter   = twVal.trim();
      if (waVal)     payload.whatsapp  = waVal.trim();
      fetch(WORKER_URL + '/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }).then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            if (status) status.textContent = 'salvo.';
            if (emailVal.trim()) {
              var av = document.getElementById('pc-avatar');
              if (av) av.src = WORKER_URL + '/api/user/' + encodeURIComponent(username) + '/avatar?' + Date.now();
            }
          } else {
            if (status) status.textContent = res.error || 'erro ao salvar.';
          }
        }).catch(function () { if (status) status.textContent = 'erro ao salvar.'; });
    }

    ownerFields.forEach(function (item) {
      var el = document.getElementById(item.id);
      if (!el) return;
      if (item.mask === 'handle') maskHandle(el);
      if (item.mask === 'phone')  maskPhone(el);
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        saveProfile();
        lockField(item.id, item.lineId);
      });
    });
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  if (!pathSegment || BLACKLIST.has(pathSegment) || !USERNAME_RE.test(pathSegment) || !WORKER_URL) {
    show404(location.pathname);
    return;
  }

  var fingerprint = null;
  try { fingerprint = localStorage.getItem(FP_KEY); } catch (_) {}

  fetch(WORKER_URL + '/api/user/' + encodeURIComponent(pathSegment))
    .then(function (res) {
      if (res.status === 404) { show404(location.pathname); return null; }
      return res.json();
    })
    .then(function (data) {
      if (!data || data.error) { show404(location.pathname); return; }
      showProfile(pathSegment, data, fingerprint);
    })
    .catch(function () { show404(location.pathname); });
})();
