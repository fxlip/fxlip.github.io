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

  // Avatar padrão — silhueta estilo WhatsApp (Dracula palette)
  var DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%23282a36'/%3E%3Ccircle cx='40' cy='29' r='14' fill='%2344475a'/%3E%3Cellipse cx='40' cy='70' rx='25' ry='17' fill='%2344475a'/%3E%3C/svg%3E";

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

  function formatDateFull(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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

  // ── Detecção de dispositivo/OS/browser ────────────────────────────────────

  function detectOSLabel() {
    var ua = navigator.userAgent || '';
    var pf = navigator.platform  || '';

    if (/iPhone/i.test(ua))                                                    return 'iPhone';
    if (/iPad/i.test(ua) || (/Mac/i.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
    if (/Android/i.test(ua))                                                   return 'Android';
    if (/Windows/i.test(ua) || /Win/i.test(pf))                               return 'Windows';
    if (/Mac OS X/i.test(ua) || /Mac/i.test(pf))                              return 'macOS';
    if (/Linux/i.test(ua)   || /Linux/i.test(pf))                             return 'Linux';
    return 'dispositivo';
  }

  function detectBrowser() {
    var ua = navigator.userAgent || '';
    if (/Firefox\//i.test(ua))                                                           return 'Firefox';
    if (/Edg\//i.test(ua))                                                               return 'Edge';
    if (/OPR\/|Opera/i.test(ua))                                                         return 'Opera';
    if (/SamsungBrowser/i.test(ua))                                                      return 'Samsung';
    if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) return 'Chrome';
    if (/Chromium/i.test(ua))                                                            return 'Chromium';
    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua))                                    return 'Safari';
    return 'navegador';
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

  var STAR_SVG = '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" '
    + 'stroke-width="1" stroke-linecap="round" stroke-linejoin="round">'
    + '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>'
    + '</svg>';

  function renderBadgesHtml(s) {
    var parts = [];

    var rep = computeReputation(s);
    if (rep > 0) {
      parts.push(
        '<div class="ps-badge-item" data-tier="rep" title="Reputação: ' + rep + '">'
        + STAR_SVG
        + '<strong class="ps-badge-value">' + rep + '</strong>'
        + '</div>'
      );
    }

    BADGE_DEFS.forEach(function(b) {
      if (b.test(s)) {
        parts.push(
          '<div class="ps-badge-item" data-tier="' + b.id + '" title="' + b.title + '">'
          + b.svg
          + '</div>'
        );
      }
    });

    return parts.join('');
  }

  // ── Badges de redes sociais conectadas ───────────────────────────────────

  var SOCIAL_BADGE_DEFS = [
    {
      service: 'email',
      connected: function(d) { return !!d.email_connected; },
      label: 'organizado',
      tier: 'social-email',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
        + '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>'
        + '<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
        + '</svg>',
    },
    {
      service: 'github',
      connected: function(d) { return !!(d.github && d.github.trim()); },
      label: 'desenvolvedor',
      tier: 'social-github',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<polyline points="16 18 22 12 16 6"/>'
        + '<polyline points="8 6 2 12 8 18"/>'
        + '</svg>',
    },
    {
      service: 'instagram',
      connected: function(d) { return !!(d.instagram && d.instagram.trim()); },
      label: 'vaidoso',
      tier: 'social-instagram',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>'
        + '</svg>',
    },
    {
      service: 'twitter',
      connected: function(d) { return !!(d.twitter && d.twitter.trim()); },
      label: 'comunicativo',
      tier: 'social-twitter',
      svg: '<svg class="ps-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
        + '</svg>',
    },
  ];

  function renderSocialBadgesHtml(data) {
    var parts = [];
    SOCIAL_BADGE_DEFS.forEach(function(b) {
      if (b.connected(data)) {
        parts.push(
          '<div class="ps-badge-item" data-tier="' + b.tier + '" title="' + b.label + '">'
          + b.svg
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
    if (!picker) return;

    var btns = picker.querySelectorAll('.ps-gender-btn');
    var selected = currentGender || null;

    picker.classList.add('ps-gender-no-anim');

    if (selected) {
      btns.forEach(function(btn) {
        if (btn.dataset.value === selected) btn.classList.add('selected');
      });
      picker.classList.add('ps-gender-collapsed');
    }

    picker.hidden = false;

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        picker.classList.remove('ps-gender-no-anim');
      });
    });

    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var val = btn.dataset.value;

        if (selected === val) {
          picker.classList.remove('ps-gender-collapsed');
          btn.classList.remove('selected');
          btn.classList.add('deselecting');
          setTimeout(function() { btn.classList.remove('deselecting'); }, 250);
          selected = null;
          saveGender(username, fingerprint, '');
          return;
        }

        btns.forEach(function(b) {
          if (b.classList.contains('selected')) {
            b.classList.remove('selected');
            b.classList.add('deselecting');
            setTimeout(function() { b.classList.remove('deselecting'); }, 250);
          }
        });

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

  // ── Social icons — lista com info à direita ───────────────────────────────

  function setupSocialIcons(data, isMine, fingerprint) {
    var socials = document.getElementById('pc-social');
    if (!socials) return;

    var serviceMap = {
      email:   { key: 'email_connected', url: null, boolCheck: true },
      github:  { key: 'github',  url: 'https://github.com/' },
      twitter: { key: 'twitter', url: 'https://x.com/' },
    };

    socials.querySelectorAll('.ps-social-btn').forEach(function(btn) {
      var svc  = btn.dataset.service;
      var conf = serviceMap[svc];
      if (!conf) return;

      var val      = data[conf.key];
      var hasValue = conf.boolCheck ? !!val : !!(val && val.trim && val.trim());

      btn.dataset.active = hasValue ? 'true' : 'false';

      // Preenche o span de info (lado direito)
      var infoEl = btn.querySelector('.ps-social-info');
      if (infoEl) {
        if (hasValue) {
          infoEl.textContent = (svc === 'email') ? val : '@' + val;
        } else if (isMine) {
          infoEl.textContent = 'conectar';
        } else {
          infoEl.textContent = '—';
        }
      }

      if (isMine) btn.classList.add('ps-social-owner');

      btn.addEventListener('click', function() {
        if (hasValue && conf.url) {
          window.open(conf.url + encodeURIComponent(val), '_blank', 'noopener');
        } else if (hasValue && svc === 'email') {
          window.location.href = 'mailto:' + val;
        } else if (isMine && !hasValue) {
          if (svc === 'email') {
            startOAuth('google', fingerprint);
          } else if (svc === 'github') {
            startOAuth('github', fingerprint);
          } else if (svc === 'twitter') {
            startOAuth('twitter', fingerprint);
          } else if (svc === 'instagram') {
            showInstagramInput(btn, fingerprint, socials);
          }
        }
      });
    });
  }

  // ── OAuth: redireciona para provider via /api/auth/start ─────────────────

  function startOAuth(provider, fingerprint) {
    if (!WORKER_URL || !fingerprint) return;
    fetch(WORKER_URL + '/api/auth/start?provider=' + provider + '&fingerprint=' + encodeURIComponent(fingerprint))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.url) {
          window.location.href = data.url;
        } else {
          console.warn('[profile] auth/start error:', data && data.error);
        }
      })
      .catch(function(err) { console.warn('[profile] auth/start failed', err); });
  }

  // ── Instagram: input inline (sem OAuth) ──────────────────────────────────

  function showInstagramInput(btn, fingerprint, container) {
    // Evita duplicatas
    if (container.querySelector('.ps-ig-input-wrap')) return;

    var wrap  = document.createElement('div');
    wrap.className = 'ps-ig-input-wrap';

    var input = document.createElement('input');
    input.type        = 'text';
    input.placeholder = '@handle';
    input.maxLength   = 30;
    input.className   = 'ps-ig-input';

    var cancel = document.createElement('button');
    cancel.textContent = '✕';
    cancel.className   = 'ps-ig-cancel';
    cancel.addEventListener('click', function() { wrap.remove(); });

    wrap.appendChild(input);
    wrap.appendChild(cancel);
    btn.insertAdjacentElement('afterend', wrap);
    input.focus();

    function save() {
      var handle = input.value.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').substring(0, 30);
      if (!handle) return;
      if (!WORKER_URL) return;
      fetch(WORKER_URL + '/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fingerprint: fingerprint, instagram: handle }),
      })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (res.ok) {
            wrap.remove();
            // Atualiza o botão localmente sem recarregar a página
            btn.dataset.active = 'true';
            var infoEl = btn.querySelector('.ps-social-info');
            if (infoEl) infoEl.textContent = '@' + handle;
          } else {
            console.warn('[profile] instagram save error:', res.error);
          }
        })
        .catch(function(err) { console.warn('[profile] instagram save failed', err); });
    }

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') wrap.remove();
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
    avatar.alt = '@' + username;
    if (data.has_avatar) {
      avatar.src = WORKER_URL + '/api/user/' + encodeURIComponent(username) + '/avatar';
      avatar.onerror = function() { this.onerror = null; this.src = DEFAULT_AVATAR; };
    } else if (data.email_connected && data.gravatar_hash !== '00000000000000000000000000000000') {
      avatar.src = 'https://www.gravatar.com/avatar/' + data.gravatar_hash + '?s=80&d=404';
      avatar.onerror = function() { this.onerror = null; this.src = DEFAULT_AVATAR; };
    } else {
      avatar.src = DEFAULT_AVATAR;
    }

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
    document.getElementById('pc-meta').textContent  = geo;
    document.getElementById('pc-since').textContent = 'desde ' + since;

    // Stats
    document.getElementById('pc-visits').textContent   = visits;
    document.getElementById('pc-time').textContent     = timeStr;
    document.getElementById('pc-comments').textContent = String(comments);
    document.getElementById('pc-upvotes').textContent  = String(upvotes);

    // Badges — reputação/atividade + redes conectadas (mesmo container)
    var badgesEl = document.getElementById('pc-badges');
    if (badgesEl) {
      badgesEl.innerHTML =
        renderBadgesHtml({
          visits:           data.visits_count      || 0,
          total_time_spent: data.total_time_spent  || 0,
          comments:         comments,
          upvotes:          upvotes,
          first_seen:       data.first_seen        || null,
        })
        + renderSocialBadgesHtml(data);
    }

    // Social icons
    setupSocialIcons(data, isMine, fingerprint);

    // Gender picker (apenas owner)
    if (isMine) setupGenderPicker(username, fingerprint, data.gender || '');

    // Troca estado: esconde terminal de 404, exibe perfil
    document.getElementById('profile-terminal').hidden = true;
    document.getElementById('profile-card').hidden     = false;
    document.title = '@' + username;

    // ── Log de atividade (síncrono: monta container + entrada de first_seen) ──
    var section = document.getElementById('profile-activity-section');
    if (section) {
      var browser  = detectBrowser();
      var osLabel  = detectOSLabel();
      var city     = data.city || 'local desconhecido';
      var fpShort  = fingerprint ? fingerprint.substring(0, 8) : '????????';

      var firstSeenDate = data.first_seen ? new Date(data.first_seen) : null;
      var fpTs = firstSeenDate
        ? firstSeenDate.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '')
        : '--';

      var tailCmd = '<div class="pal-cmd">'
        + '<span class="t-user">fxlip</span>'
        + '<span class="t-gray">@</span><span class="t-host">www</span>'
        + '<span class="t-gray">:</span><span class="t-path">~</span>'
        + '<span class="t-gray">$</span>'
        + ' <span class="t-cmd">tail /home/' + esc(username) + '/action.log</span>'
        + '</div>';

      var fingerprintEntry = '<div class="profile-activity-item">'
        + '<span class="pal-ts t-gray">[' + esc(fpTs) + ']</span>'
        + '<span class="pal-content">'
        + '<span class="pal-verb">' + esc(fpShort) + '</span>'
        + ' entrou usando um ' + esc(browser) + ' no ' + esc(osLabel) + ' em ' + esc(city)
        + '</span>'
        + '<span class="pal-type-icon">⌁</span>'
        + '</div>';

      section.innerHTML = '<div class="profile-activity-log" id="pc-log">'
        + tailCmd + fingerprintEntry
        + '</div>';
    }

    // ── Atividade recente (async) ──────────────────────────────────────────
    if (WORKER_URL) {
      fetch(WORKER_URL + '/api/user/' + encodeURIComponent(username) + '/activity')
        .then(function(r) { return r.json(); })
        .then(function(actData) {
          var log  = document.getElementById('pc-log');
          if (!log) return;
          var acts = (actData.activities || []).slice(0, 10);
          if (!acts.length) return;

          var typeIcon  = { comment: '›', like: '♥', upvote: '▲' };
          var typeLabel = { comment: 'comentou', like: 'curtiu', upvote: 'upvotou' };

          var items = acts.map(function(a) {
            var d     = a.created_at ? new Date(a.created_at) : null;
            var ts    = d ? d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '') : '--';
            var icon  = typeIcon[a.type]  || '·';
            var verb  = typeLabel[a.type] || a.type;
            var quote = a.content
              ? ' <span class="pal-quote">"' + esc(a.content.substring(0, 55)) + (a.content.length > 55 ? '…' : '') + '"</span>'
              : '';

            return '<div class="profile-activity-item">'
              + '<span class="pal-ts t-gray">[' + esc(ts) + ']</span>'
              + '<span class="pal-content">'
              + '<span class="pal-verb">' + verb + '</span>'
              + '<a href="/' + esc(a.target_slug) + '" class="file-link">/' + esc(a.target_slug) + '</a>'
              + quote
              + '</span>'
              + '<span class="pal-type-icon">' + icon + '</span>'
              + '</div>';
          }).join('');

          log.insertAdjacentHTML('beforeend', items);
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
