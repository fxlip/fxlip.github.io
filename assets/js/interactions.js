/* interactions.js — sistema de interações públicas
 * Heartbeat de sessão, contagens de comentários, thread completa nos posts,
 * like/upvote/comment em linkcards.
 * Módulo independente, carregado via defer em todas as páginas.
 */
(function () {
  'use strict';

  const WORKER_URL = document.body.dataset.workerUrl;
  const FP_KEY     = 'fxlip_fp';
  const INT_CACHE  = 'fxlip_int_cache';

  if (!WORKER_URL) return;

  // --------------------------------------------------------------------------
  // Fingerprint — lê do localStorage (definido pelo greeting.js)
  // --------------------------------------------------------------------------

  function getFingerprint() {
    try { return localStorage.getItem(FP_KEY) || null; } catch (_) { return null; }
  }

  function getDisplayName() {
    try {
      const n = localStorage.getItem('fxlip_visitor_name');
      return (n && n.trim()) ? n.trim() : 'visitante';
    } catch (_) { return 'visitante'; }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --------------------------------------------------------------------------
  // TimeAgo simples para comentários
  // --------------------------------------------------------------------------

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)   return 'agora';
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    const d = Math.floor(diff / 86400);
    return d === 1 ? 'ontem' : `há ${d} dias`;
  }

  // --------------------------------------------------------------------------
  // Cache de contagens (localStorage)
  // --------------------------------------------------------------------------

  function getIntCache() {
    try { return JSON.parse(localStorage.getItem(INT_CACHE)) || {}; } catch (_) { return {}; }
  }

  function setIntCache(updates) {
    try {
      const c = getIntCache();
      Object.assign(c, updates);
      localStorage.setItem(INT_CACHE, JSON.stringify(c));
    } catch (_) {}
  }

  // --------------------------------------------------------------------------
  // Heartbeat — ping a cada 30s, pausa com visibilitychange
  // --------------------------------------------------------------------------

  function startHeartbeat() {
    let interval = null;
    const ping = () => {
      const fp = getFingerprint();
      if (!fp) return;
      fetch(WORKER_URL + '/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp })
      }).catch(() => {});
    };
    const start = () => { if (!interval) interval = setInterval(ping, 30000); };
    const stop  = () => { clearInterval(interval); interval = null; };
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  }

  // --------------------------------------------------------------------------
  // applyInteractionCounts(context) — batch fetch + renderiza contagens
  // Chamado na home, post page e pelo infinite scroll (window.applyInteractionCounts)
  // --------------------------------------------------------------------------

  window.applyInteractionCounts = function applyInteractionCounts(context) {
    const counters = (context || document).querySelectorAll('.comment-counter[data-slug]');
    if (!counters.length) return;

    const slugs = [...new Set([...counters].map(c => c.dataset.slug))];

    // SWR: mostra cache imediato
    const cache = getIntCache();
    slugs.forEach(slug => {
      if (cache[slug] !== undefined) {
        applySingleCount(context || document, slug, cache[slug]);
      }
    });

    // Revalida
    fetch(`${WORKER_URL}/api/interactions/batch?slugs=${slugs.join(',')}&target_type=post`)
      .then(r => r.json())
      .then(data => {
        slugs.forEach(slug => {
          const n = data[slug]?.comments ?? 0;
          applySingleCount(context || document, slug, n);
        });
        setIntCache(
          Object.fromEntries(slugs.map(s => [s, data[s]?.comments ?? 0]))
        );
      })
      .catch(() => {});
  };

  function applySingleCount(ctx, slug, n) {
    (ctx || document).querySelectorAll(`.comment-counter[data-slug="${slug}"] .comment-count`)
      .forEach(el => { el.textContent = n; });
  }

  // --------------------------------------------------------------------------
  // initInlineComments() — form terminal entre dois <hr>, com prompt e textarea
  // Delegação global: funciona na home (feed) e no post individual
  // --------------------------------------------------------------------------

  function initInlineComments() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.comment-reply-btn');
      if (!btn) return;

      const footer = btn.closest('.post-footer');
      if (!footer) return;

      // Se já aberto NESTE post, só foca (wrap é irmão do footer, não filho)
      const ownWrap = footer.nextElementSibling;
      if (ownWrap && ownWrap.classList.contains('icf-wrap') && !ownWrap.classList.contains('icf-leaving')) {
        ownWrap.querySelector('.icf-textarea').focus();
        return;
      }

      // Fecha qualquer outro formulário aberto em outros posts
      document.querySelectorAll('.icf-wrap:not(.icf-leaving)').forEach(existing => {
        existing.classList.add('icf-leaving');
        let gone = false;
        const remove = () => { if (!gone) { gone = true; existing.remove(); } };
        existing.addEventListener('animationend', remove, { once: true });
        setTimeout(remove, 500);
      });

      const slug = btn.dataset.hash;
      const fp   = getFingerprint();
      if (!fp) return;

      // --- Linha de input ---
      const inputLine = document.createElement('div');
      inputLine.className = 'icf-input-line';

      const arrow = document.createElement('span');
      arrow.className = 't-gray icf-arrow';
      arrow.textContent = '›';

      const textarea = document.createElement('textarea');
      textarea.className = 'icf-textarea';
      textarea.maxLength = 500;
      textarea.rows = 3;
      textarea.autocomplete = 'off';
      textarea.spellcheck = false;
      textarea.placeholder = 'enter envia · shift+enter nova linha · esc fecha';

      inputLine.append(arrow, textarea);

      // --- Wrapper (para remoção limpa) ---
      const wrap = document.createElement('div');
      wrap.className = 'icf-wrap';
      wrap.append(inputLine);

      // Insere APÓS o .post-footer (irmão), fora do flex row
      footer.insertAdjacentElement('afterend', wrap);
      textarea.focus();

      function cleanup() {
        wrap.classList.add('icf-leaving');
        let gone = false;
        const remove = () => { if (!gone) { gone = true; wrap.remove(); } };
        wrap.addEventListener('animationend', remove, { once: true });
        setTimeout(remove, 250);
      }

      function submit() {
        const content = textarea.value.trim();
        if (!content) { cleanup(); return; }

        textarea.disabled = true;

        // Os dois gates: arrow visível E fetch completo
        let arrowShown = false;
        let fetchDone  = false;
        let fetchOk    = false;

        const tryCleanup = () => {
          if (!arrowShown || !fetchDone) return;
          if (fetchOk) {
            const cntEl = footer.querySelector(`.comment-counter[data-slug="${slug}"] .comment-count`);
            if (cntEl) cntEl.textContent = (parseInt(cntEl.textContent) || 0) + 1;
          }
          setTimeout(cleanup, 300);
        };

        setTimeout(() => {
          arrow.textContent = '…';
          arrowShown = true;
          tryCleanup();
        }, 2000);

        fetch(WORKER_URL + '/api/interact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: fp, target_slug: slug, target_type: 'post', type: 'comment', content })
        })
          .then(r => r.json())
          .then(data => { fetchOk = data.ok || false; fetchDone = true; tryCleanup(); })
          .catch(() => { fetchDone = true; tryCleanup(); });
      }

      textarea.addEventListener('keydown', e => {
        if (e.key === 'Escape') cleanup();
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
      });
    });
  }

  // --------------------------------------------------------------------------
  // Slug helper para autolink.js (exposto globalmente)
  // --------------------------------------------------------------------------

  window.urlToSlug = function urlToSlug(url) {
    try {
      const u = new URL(url);
      return (u.hostname + u.pathname)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 64);
    } catch (_) {
      return url.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 64);
    }
  };

  // --------------------------------------------------------------------------
  // Init
  // --------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', () => {
    startHeartbeat();
    window.applyInteractionCounts(document);
    initInlineComments();
  });

})();
