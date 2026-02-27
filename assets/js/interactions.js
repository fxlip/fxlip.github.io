/* interactions.js — sistema de interações públicas
 * Heartbeat de sessão, contagens de comentários, thread completa nos posts,
 * like/upvote/comment em linkcards.
 * Módulo independente, carregado via defer em todas as páginas.
 */
(function () {
  'use strict';

  const WORKER_URL   = document.body.dataset.workerUrl;
  const FP_KEY       = 'fxlip_fp';
  const INT_CACHE     = 'fxlip_int_cache';
  const INT_CACHE_TTL = 3 * 60 * 1000; // 3 minutos
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
    try {
      const raw = JSON.parse(localStorage.getItem(INT_CACHE));
      // Formato: { ts: number, data: {...} }
      if (raw && raw.data) return raw;
    } catch (_) {}
    return { ts: 0, data: {} };
  }

  function setIntCache(updates) {
    try {
      const current = getIntCache();
      Object.assign(current.data, updates);
      current.ts = Date.now();
      localStorage.setItem(INT_CACHE, JSON.stringify(current));
    } catch (_) {}
  }

  // --------------------------------------------------------------------------
  // Heartbeat — acumula tempo ativo no cliente, flush a cada 5min (sem KV)
  // O servidor recebe { fingerprint, seconds } e soma direto no D1.
  // --------------------------------------------------------------------------

  function startHeartbeat() {
    let accumulated = 0;
    let lastVisible = document.hidden ? null : Date.now();

    // Rastreia janelas de visibilidade
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (lastVisible !== null) {
          accumulated += Math.floor((Date.now() - lastVisible) / 1000);
          lastVisible = null;
        }
      } else {
        lastVisible = Date.now();
      }
    });

    const flush = () => {
      // Contabiliza tempo desde o último ponto de referência
      if (lastVisible !== null) {
        const now = Date.now();
        accumulated += Math.floor((now - lastVisible) / 1000);
        lastVisible = now;
      }
      const fp = getFingerprint();
      if (!fp || accumulated < 10) return;
      const secs = accumulated;
      accumulated = 0;
      fetch(WORKER_URL + '/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp, seconds: secs })
      }).catch(() => {});
    };

    // Flush a cada 5 minutos
    setInterval(flush, 5 * 60 * 1000);

    // Flush ao sair da página (beforeunload + visibilitychange para mobile)
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  }

  // --------------------------------------------------------------------------
  // applyInteractionCounts(context) — batch fetch + renderiza contagens
  // Chamado na home, post page e pelo infinite scroll (window.applyInteractionCounts)
  // --------------------------------------------------------------------------

  window.applyInteractionCounts = function applyInteractionCounts(context) {
    const counters = (context || document).querySelectorAll('.comment-counter[data-slug]');
    if (!counters.length) return;

    const slugs = [...new Set([...counters].map(c => c.dataset.slug))];

    // Mostra cache imediato e respeita TTL de 3 min
    const cacheEntry = getIntCache();
    const cacheData  = cacheEntry.data || {};
    const cacheAge   = Date.now() - (cacheEntry.ts || 0);

    slugs.forEach(slug => {
      if (cacheData[slug] !== undefined) {
        applySingleCount(context || document, slug, cacheData[slug]);
      }
    });

    // Pula revalidação se cache for recente
    if (cacheAge < INT_CACHE_TTL && Object.keys(cacheData).length > 0) return;

    // Revalida
    fetch(`${WORKER_URL}/api/interactions/batch?slugs=${slugs.join(',')}&target_type=post`)
      .then(r => r.json())
      .then(data => {
        slugs.forEach(slug => {
          applySingleCount(context || document, slug, {
            comments: data[slug]?.comments ?? 0,
            clicks:   data[slug]?.clicks   ?? 0,
          });
        });
        setIntCache(
          Object.fromEntries(slugs.map(s => [s, {
            comments: data[s]?.comments ?? 0,
            clicks:   data[s]?.clicks   ?? 0,
          }]))
        );
      })
      .catch(() => {});
  };

  function applySingleCount(ctx, slug, counts) {
    // counts pode ser number (cache antigo) ou { comments, clicks }
    const comments = typeof counts === 'object' ? (counts.comments ?? 0) : counts;
    const clicks   = typeof counts === 'object' ? (counts.clicks   ?? 0) : 0;
    // ícone sempre visível, número só aparece quando > 0
    (ctx || document).querySelectorAll(`.comment-counter[data-slug="${slug}"] .comment-count`)
      .forEach(el => { el.textContent = comments > 0 ? comments : ''; });
    // ícone inteiro oculto por CSS enquanto vazio
    (ctx || document).querySelectorAll(`.click-counter[data-slug="${slug}"] .click-count`)
      .forEach(el => { el.textContent = clicks > 0 ? clicks : ''; });
  }

  // --------------------------------------------------------------------------
  // initLinkCardClicks() — rastreia clicks em linkcards externos
  // Registra contra o slug do POST pai para exibir no post-footer
  // --------------------------------------------------------------------------

  function initLinkCardClicks() {
    document.addEventListener('click', function(e) {
      const card = e.target.closest('.link-card');
      if (!card || card.classList.contains('internal-ref')) return;

      const fp = getFingerprint();
      if (!fp) return;

      // Slug do post pai, obtido via DOM
      const article = card.closest('article');
      const slug = article && article.querySelector('.comment-counter[data-slug]')
        ? article.querySelector('.comment-counter[data-slug]').dataset.slug
        : null;
      if (!slug) return;

      // Update otimista: incrementa counter na UI sem esperar servidor
      const countEl = article.querySelector(`.click-counter[data-slug="${slug}"] .click-count`);
      if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;

      // Espelha o incremento no cache local para sobreviver ao F5 dentro do TTL
      try {
        const c = getIntCache();
        if (c.data) {
          if (!c.data[slug]) c.data[slug] = { comments: 0, clicks: 0 };
          c.data[slug].clicks = (c.data[slug].clicks || 0) + 1;
          localStorage.setItem(INT_CACHE, JSON.stringify(c));
        }
      } catch (_) {}

      fetch(WORKER_URL + '/api/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp, target_slug: slug, target_type: 'post', type: 'click' })
      }).catch(() => {});
    });
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
        // Retorna o botão do outro post (animação reversa)
        const existingFooter = existing.previousElementSibling;
        if (existingFooter) {
          const existingBtn = existingFooter.querySelector('.comment-reply-btn');
          if (existingBtn) {
            existingBtn.style.transition = 'none';
            existingBtn.classList.remove('icf-btn-exiting', 'icf-btn-returning', 'icf-btn-completing');
            existingBtn.style.animation = 'none';
            void existingBtn.offsetWidth;
            existingBtn.style.animation = 'reply-btn-return 0.28s ease-in forwards';
            existingBtn.addEventListener('animationend', () => {
              const pink = getComputedStyle(existingBtn).color;
              existingBtn.style.animation = '';
              existingBtn.style.color = pink;
              existingBtn.style.filter = 'drop-shadow(0 0 4px rgba(255, 121, 198, 0.5))';
              void existingBtn.offsetWidth;
              existingBtn.style.transition = 'color 0.4s ease, filter 0.4s ease';
              existingBtn.style.color = '';
              existingBtn.style.filter = '';
              setTimeout(() => { existingBtn.style.transition = ''; }, 400);
            }, { once: true });
          }
        }
        existing.classList.add('icf-leaving');
        let gone = false;
        const remove = () => { if (!gone) { gone = true; existing.remove(); } };
        existing.addEventListener('animationend', remove, { once: true });
        setTimeout(remove, 500);
      });

      const slug = btn.dataset.hash;
      const fp   = getFingerprint();
      if (!fp) return;

      // Anima o botão para fora: segmento 1 (0° → -90°, fade out)
      btn.classList.add('icf-btn-exiting');

      // --- Linha de input ---
      const inputLine = document.createElement('div');
      inputLine.className = 'icf-input-line';

      const arrow = document.createElement('span');
      arrow.className = 'icf-arrow';

      const arrowIcon = document.createElement('span');
      arrowIcon.className = 'icf-arrow-icon icf-arrow-icon--entering';
      arrowIcon.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>';

      arrow.append(arrowIcon);

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
        // Botão retorna: animação inversa da saída (-90° → 0°, fade in)
        btn.style.transition = 'none';
        btn.classList.remove('icf-btn-exiting', 'icf-btn-returning', 'icf-btn-completing');
        btn.style.animation = 'none';
        void btn.offsetWidth;
        btn.style.animation = 'reply-btn-return 0.28s ease-in forwards';
        btn.addEventListener('animationend', () => {
          const pink = getComputedStyle(btn).color;
          btn.style.animation = '';
          btn.style.color = pink;
          btn.style.filter = 'drop-shadow(0 0 4px rgba(255, 121, 198, 0.5))';
          void btn.offsetWidth;
          btn.style.transition = 'color 0.4s ease, filter 0.4s ease';
          btn.style.color = '';
          btn.style.filter = '';
          setTimeout(() => { btn.style.transition = ''; }, 400);
        }, { once: true });

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

          // Atualiza contador apenas em caso de sucesso
          if (fetchOk) {
            const cntEl = footer.querySelector(`.comment-counter[data-slug="${slug}"] .comment-count`);
            if (cntEl) cntEl.textContent = (parseInt(cntEl.textContent) || 0) + 1;
            document.dispatchEvent(new CustomEvent('comment-added', { detail: { slug } }));
          }

          // Seg. 3 + Seg. 4 + slide-up: todos simultâneos
          // Seta sai na linha de baixo, botão entra na linha de cima, form sobe — ao mesmo tempo
          btn.style.transition = 'none';
          btn.style.animation = 'none';
          btn.classList.remove('icf-btn-exiting', 'icf-btn-returning', 'icf-btn-completing');
          void btn.offsetWidth;
          btn.style.animation = 'reply-btn-complete 0.28s ease-out forwards';
          btn.addEventListener('animationend', () => {
            const pink = getComputedStyle(btn).color;
            btn.style.animation = '';
            btn.style.color = pink;
            btn.style.filter = 'drop-shadow(0 0 4px rgba(255, 121, 198, 0.5))';
            void btn.offsetWidth;
            btn.style.transition = 'color 0.4s ease, filter 0.4s ease';
            btn.style.color = '';
            btn.style.filter = '';
            setTimeout(() => { btn.style.transition = ''; }, 400);
          }, { once: true });

          wrap.classList.add('icf-success');
          let gone = false;
          const remove = () => { if (!gone) { gone = true; wrap.remove(); } };
          wrap.addEventListener('animationend', e => { if (e.target === wrap) remove(); });
          setTimeout(remove, 500);
        };

        // Loading: substitui o texto da textarea progressivamente por '#'
        // Cada caractere "criptografa" da esquerda para a direita durante 2s
        arrowIcon.hidden = true;
        const origContent = content;
        const totalChars = origContent.length;
        const steps = Math.min(Math.max(totalChars, 5), 40);
        const charsPerStep = Math.ceil(totalChars / steps);
        const stepMs = Math.floor(2000 / steps);
        let filled = 0;

        const loadInterval = setInterval(() => {
          filled = Math.min(filled + charsPerStep, totalChars);
          textarea.value = '#'.repeat(filled) + origContent.substring(filled);
          if (filled >= totalChars) clearInterval(loadInterval);
        }, stepMs);

        setTimeout(() => {
          clearInterval(loadInterval);
          textarea.value = '#'.repeat(totalChars);
          arrowIcon.hidden = false;
          arrow.classList.add('icf-arrow--sent');
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
  // initPostComments() — lista de comentários na página do post
  // --------------------------------------------------------------------------

  function initPostComments() {
    const container = document.getElementById('post-comments');
    if (!container) return;
    const slug = container.dataset.slug;
    if (!slug) return;

    const load = () => {
      fetch(`${WORKER_URL}/api/interactions?slug=${encodeURIComponent(slug)}&target_type=post`)
        .then(r => r.json())
        .then(data => {
          const comments = data.comments || [];
          if (!comments.length) { container.innerHTML = ''; return; }
          render(comments);
        })
        .catch(() => {});
    };

    const render = (comments) => {
      const wrap = document.createElement('div');
      wrap.className = 'cmt-wrap';

      const header = document.createElement('div');
      header.className = 'cmt-header';
      header.textContent = `${comments.length} comentário${comments.length !== 1 ? 's' : ''}`;
      wrap.appendChild(header);
      wrap.appendChild(document.createElement('hr'));

      comments.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'cmt-item';

        const meta = document.createElement('div');
        meta.className = 'cmt-meta';
        meta.innerHTML =
          `<span class="cmt-name">${escapeHtml(c.name)}</span>` +
          `<span class="cmt-time">${timeAgo(c.created_at)}</span>`;

        const text = document.createElement('div');
        text.className = 'cmt-text';
        text.textContent = c.content;

        item.append(meta, text);
        wrap.appendChild(item);

        if (idx < comments.length - 1) wrap.appendChild(document.createElement('hr'));
      });

      container.innerHTML = '';
      container.appendChild(wrap);
    };

    load();
    document.addEventListener('comment-added', e => { if (e.detail.slug === slug) load(); });
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
    initLinkCardClicks();
    initInlineComments();
    initPostComments();
  });

})();
