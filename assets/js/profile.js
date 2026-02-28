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
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>',
      test: function(s) {
        return s.total_time_spent >= 86400 && s.visits >= 10 && s.comments >= 1 && s.upvotes >= 10;
      }
    },
    {
      id: 'frequente', label: 'frequente',
      title: '50+ visitas',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.89"/></svg>',
      test: function(s) { return s.visits >= 50; }
    },
    {
      id: 'engajado', label: 'engajado',
      title: '5+ comentários',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      test: function(s) { return s.comments >= 5; }
    },
    {
      id: 'curtidor', label: 'curtidor',
      title: '20+ upvotes dados',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      test: function(s) { return s.upvotes >= 20; }
    },
    {
      id: 'veterano', label: 'veterano',
      title: 'membro há 90+ dias',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 1 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/></svg>',
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

  // SVG da estrela para o badge de rep (totem)
  var STAR_SVG = '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" '
    + 'stroke-width="1" stroke-linecap="round" stroke-linejoin="round">'
    + '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>'
    + '</svg>';

  function renderBadgesHtml(s) {
    var parts = [];

    // Rep totem (sempre primeiro)
    var rep = computeReputation(s);
    if (rep > 0) {
      parts.push(
        '<div class="ps-badge-item" data-tier="rep" title="Reputação acumulada">'
        + STAR_SVG
        + '<span class="ps-badge-label">reputação</span>'
        + '<strong class="ps-badge-value">' + rep + '</strong>'
        + '</div>'
      );
    }

    // Badges tradicionais como totens
    BADGE_DEFS.forEach(function(b) {
      if (b.test(s)) {
        parts.push(
          '<div class="ps-badge-item" data-tier="' + b.id + '" title="' + b.title + '">'
          + b.svg
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

    // Aplica estado inicial
    if (selected) {
      btns.forEach(function(btn) {
        if (btn.dataset.value === selected) {
          btn.classList.add('selected');
        }
      });
      picker.classList.add('ps-gender-collapsed');
    }

    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var val = btn.dataset.value;

        if (selected === val) {
          // Clicou no selecionado → expande os outros e desseleciona
          picker.classList.remove('ps-gender-collapsed');
          btn.classList.remove('selected');
          btn.classList.add('deselecting');
          setTimeout(function() { btn.classList.remove('deselecting'); }, 250);
          selected = null;
          saveGender(username, fingerprint, '');
          return;
        }

        // Desselecionar anterior (sem colapsar ainda)
        btns.forEach(function(b) {
          if (b.classList.contains('selected')) {
            b.classList.remove('selected');
            b.classList.add('deselecting');
            setTimeout(function() { b.classList.remove('deselecting'); }, 250);
          }
        });

        // Selecionar novo e colapsar os outros
        requestAnimationFrame(function() {
          btn.classList.add('selected');
          selected = val;
          picker.classList.add('ps-gender-collapsed');
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

          var typeIcon  = { comment: '›', like: '♥', upvote: '▲' };
          var typeLabel = { comment: 'comentou', like: 'curtiu', upvote: 'upvotou' };

          var items = acts.map(function(a) {
            var dateStr  = a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
            var icon     = typeIcon[a.type]  || '·';
            var verb     = typeLabel[a.type] || a.type;
            var quote    = a.content
              ? ' <span class="pal-quote">"' + esc(a.content.substring(0, 60)) + (a.content.length > 60 ? '…' : '') + '"</span>'
              : '';

            return '<div class="profile-activity-item">'
              + '<span class="pal-icon t-gray">' + icon + '</span>'
              + '<span class="pal-content">'
              + verb + ' <a href="/' + esc(a.target_slug) + '" class="file-link">' + esc(a.target_slug) + '</a>'
              + quote
              + '</span>'
              + '<span class="pal-date">' + esc(dateStr) + '</span>'
              + '</div>';
          }).join('');

          section.innerHTML = '<div class="profile-activity-log">'
            + '<div class="pal-header t-gray">log de atividade</div>'
            + items
            + '</div>';
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