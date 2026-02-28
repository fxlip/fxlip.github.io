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
      id: 'popular', label: 'popular', icon: '★',
      title: '24h+ no site · 10+ visitas · 1+ comentário · 10+ upvotes',
      test: function(s) {
        return s.total_time_spent >= 86400 && s.visits >= 10 && s.comments >= 1 && s.upvotes >= 10;
      }
    },
    {
      id: 'frequente', label: 'frequente', icon: '↻',
      title: '50+ visitas',
      test: function(s) { return s.visits >= 50; }
    },
    {
      id: 'engajado', label: 'engajado', icon: '>',
      title: '5+ comentários',
      test: function(s) { return s.comments >= 5; }
    },
    {
      id: 'curtidor', label: 'curtidor', icon: '♥',
      title: '20+ upvotes dados',
      test: function(s) { return s.upvotes >= 20; }
    },
    {
      id: 'veterano', label: 'veterano', icon: '⌛',
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

  // SVG da estrela para o badge de rep
  var STAR_SVG = '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
    + '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>'
    + '</svg>';

  function renderBadgesHtml(s) {
    var parts = [];

    // Rep badge primeiro (badge pill com animação)
    var rep = computeReputation(s);
    if (rep > 0) {
      parts.push(
        '<div class="ps-badge-item" data-tier="rep">'
        + STAR_SVG
        + '<span class="ps-badge-label">rep <strong>' + rep + '</strong></span>'
        + '</div>'
      );
    }

    // Badges tradicionais como pills
    BADGE_DEFS.forEach(function(b) {
      if (b.test(s)) {
        parts.push(
          '<div class="ps-badge-item" data-tier="' + b.id + '" title="' + b.title + '">'
          + '<span class="ps-badge-label">' + b.label + '</span>'
          + '</div>'
        );
      }
    });

    return parts.join('');
  }

  // ── 404 real ──────────────────────────────────────────────────────────────

  function show404(path) {
    var displayPath = path.length > 30 ? path.substring(0, 27) + '...' : path;
    document.getElementById('cmd-display').textContent = 'cd ' + displayPath;
    document.getElementById('err-display').innerHTML =
      'bash: cd: ' + esc(displayPath) + ': Arquivo ou diretório inexistente.<br>'
      + 'Voltar pro <a href=\'/\' class=\'mention-link\'>@feed</a>?';
  }

  // ── Gender picker ─────────────────────────────────────────────────────────

  function setupGenderPicker(username, fingerprint, currentGender) {
    var picker = document.getElementById('pf-gender-picker');
    var divider = document.getElementById('pc-divider');
    if (!picker) return;

    picker.hidden = false;
    divider.hidden = false;

    var btns = picker.querySelectorAll('.ps-gender-btn');
    var selected = currentGender || null;

    // Marca o gênero atual
    if (selected) {
      btns.forEach(function(btn) {
        if (btn.dataset.value === selected) btn.classList.add('selected');
      });
    }

    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var val = btn.dataset.value;

        if (selected === val) {
          // Desselecionar
          btn.classList.remove('selected');
          btn.classList.add('deselecting');
          setTimeout(function() { btn.classList.remove('deselecting'); }, 250);
          selected = null;
          saveGender(username, fingerprint, '');
          return;
        }

        // Desselecionar anterior
        btns.forEach(function(b) {
          if (b.classList.contains('selected')) {
            b.classList.remove('selected');
            b.classList.add('deselecting');
            setTimeout(function() { b.classList.remove('deselecting'); }, 250);
          }
        });

        // Selecionar novo
        requestAnimationFrame(function() {
          btn.classList.add('selected');
          selected = val;
          saveGender(username, fingerprint, val);
        });
      });
    });
  }

  function saveGender(username, fingerprint, gender) {
    if (!WORKER_URL) return;
    fetch(WORKER_URL + '/api/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fingerprint: fingerprint, gender: gender }),
    }).then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res.ok) console.warn('[profile] gender save error:', res.error);
      })
      .catch(function(err) { console.warn('[profile] gender save failed', err); });
  }

  // ── Social icons state ────────────────────────────────────────────────────

  function setupSocialIcons(data, isMine) {
    var socials = document.getElementById('pc-social');
    if (!socials) return;

    var serviceMap = {
      email:     { key: 'email',     url: null },
      github:    { key: 'github',    url: 'https://github.com/' },
      instagram: { key: 'instagram', url: 'https://instagram.com/' },
      twitter:   { key: 'twitter',   url: 'https://x.com/' },
    };

    socials.querySelectorAll('.ps-social-btn').forEach(function(btn) {
      var svc = btn.dataset.service;
      var conf = serviceMap[svc];
      if (!conf) return;

      var val = data[conf.key];
      var hasValue = !!(val && val.trim && val.trim());

      btn.dataset.active = hasValue ? 'true' : 'false';

      // Se owner, adiciona classe para tooltip "conectar"
      if (isMine) {
        btn.classList.add('ps-social-owner');
      }

      // Click: abre link se conectado, ou redireciona para OAuth se owner
      btn.addEventListener('click', function() {
        if (hasValue && conf.url) {
          window.open(conf.url + encodeURIComponent(val), '_blank', 'noopener');
        } else if (hasValue && svc === 'email') {
          window.location.href = 'mailto:' + val;
        } else if (isMine && !hasValue) {
          // Aqui entraria o redirect para OAuth
          // window.location.href = '/auth/' + svc + '/connect';
          console.log('[profile] OAuth connect →', svc);
        }
      });
    });
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

    // Avatar
    var avatar = document.getElementById('pc-avatar');
    avatar.src = WORKER_URL + '/api/user/' + encodeURIComponent(username) + '/avatar';
    avatar.alt = '@' + username;
    avatar.onerror = function() { this.onerror = null; this.src = gravatarUrl(data.gravatar_hash, 80); };

    // Nome + badge [você]
    var nameEl = document.getElementById('pc-name');
    nameEl.textContent = '@' + username;
    if (isMine) {
      var badge = document.createElement('span');
      badge.className   = 'profile-badge';
      badge.textContent = '[você]';
      nameEl.appendChild(badge);
    }

    // Localidade + desde
    document.getElementById('pc-meta').textContent = geo;
    document.getElementById('pc-since').textContent = 'desde ' + since;

    // Stats
    document.getElementById('pc-visits').textContent   = visits;
    document.getElementById('pc-time').textContent     = timeStr;
    document.getElementById('pc-comments').textContent = String(comments);
    document.getElementById('pc-upvotes').textContent  = String(upvotes);

    // Badges
    var badgesEl = document.getElementById('pc-badges');
    if (badgesEl) {
      badgesEl.innerHTML = renderBadgesHtml({
        visits:           data.visits_count      || 0,
        total_time_spent: data.total_time_spent  || 0,
        comments:         comments,
        upvotes:          upvotes,
        first_seen:       data.first_seen        || null,
      });
    }

    // Social icons
    setupSocialIcons(data, isMine);

    // Gender picker (apenas owner)
    if (isMine) {
      setupGenderPicker(username, fingerprint, data.gender || '');
    }

    // Troca estado: esconde terminal de 404, exibe perfil
    document.getElementById('profile-terminal').hidden = true;
    document.getElementById('profile-card').hidden     = false;
    document.title = '@' + username;

    // Atividade recente (async)
    if (WORKER_URL) {
      fetch(WORKER_URL + '/api/user/' + encodeURIComponent(username) + '/activity')
        .then(function(r) { return r.json(); })
        .then(function(actData) {
          var section = document.getElementById('profile-activity-section');
          if (!section) return;
          var acts = (actData.activities || []).slice(0, 10);
          if (!acts.length) { section.innerHTML = ''; return; }
          section.innerHTML = acts.map(function(a) {
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
        }).catch(function() {});
    }
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  if (!pathSegment || BLACKLIST.has(pathSegment) || !USERNAME_RE.test(pathSegment) || !WORKER_URL) {
    show404(location.pathname);
    return;
  }

  var fingerprint = null;
  try { fingerprint = localStorage.getItem(FP_KEY); } catch (_) {}

  fetch(WORKER_URL + '/api/user/' + encodeURIComponent(pathSegment))
    .then(function(res) {
      if (res.status === 404) { show404(location.pathname); return null; }
      return res.json();
    })
    .then(function(data) {
      if (!data || data.error) { show404(location.pathname); return; }
      showProfile(pathSegment, data, fingerprint);
    })
    .catch(function() { show404(location.pathname); });
})();