document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 0. SHARED UTILS (TIMEAGO ENGINE - PRECISION v2)
  // Lógica cronométrica exata para datas
  // ==========================================================================
  const getRelativeTime = (dateString) => {
    if (!dateString) return null;

    const cleanStr = dateString.replace(/\s+/g, ' ').trim();
    
    // Mapeamento bilíngue e abreviado para evitar "Invalid Date"
    const months = {
      'jan': 0, 'fev': 1, 'feb': 1, 'mar': 2, 'abr': 3, 'apr': 3, 'mai': 4, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'aug': 7, 'set': 8, 'sep': 8, 'out': 9, 'oct': 9, 'nov': 10, 'dez': 11, 'dec': 11
    };

    const match = cleanStr.match(/(\d{2}):(\d{2})\s*[·\-\|]\s*(\d{1,2})\s*de?\s*([a-zç]{3,})\s*de?\s*(\d{4})/i);
    if (!match) return null;

    const hour = parseInt(match[1]);
    const min = parseInt(match[2]);
    const day = parseInt(match[3]);
    const monthStr = match[4].toLowerCase().substring(0, 3);
    const year = parseInt(match[5]);

    if (months[monthStr] === undefined) return null;

    const postDate = new Date(year, months[monthStr], day, hour, min);
    const now = new Date();
    const diffMs = now - postDate;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return "agora mesmo";

    // 1. Minutos (< 1h)
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? "há 1 minuto" : `há ${diffMinutes} minutos`;
    }

    // 2. Horas (< 24h)
    if (diffHours < 24) {
      return diffHours === 1 ? "há 1 hora" : `há ${diffHours} horas`;
    }

    // 3. Ontem (Entre 24h e 48h ou diff de 1 dia)
    if (diffDays === 1 || (diffHours >= 24 && diffHours < 48)) {
      return "ontem";
    }

    // 4. Dias (< 7d)
    if (diffDays < 7) {
      return `há ${diffDays} dias`;
    }

    // 5. Semanas (< 30d)
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks <= 1 ? "semana passada" : `há ${weeks} semanas`;
    }

    // Gap de 1 mês (30 a 60 dias)
    if (diffDays < 60) {
      return "mês passado";
    }

    // 6. Extenso (>= 60 dias)
    const monthFull = postDate.toLocaleString('pt-BR', { month: 'long' });
    return `em ${monthFull} de ${year}`;
  };

  // ==========================================================================
  // UTILS
  // ==========================================================================
  const escapeHtml = (text) => {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  // ==========================================================================
  // 1. MÓDULOS DE PROCESSAMENTO (TEXTO E ESTRUTURA)
  // ==========================================================================
  
  // Progress Bars [10/100]
  window.processProgressBars = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .post-excerpt, .entry-content, .terminal-window p, .terminal-window div, .post-item, article, main');
    const regex = /\[\s*(\d+)\/(\d+)(?:\s+(.*?))?\s*\]/g;

    contentAreas.forEach(area => {
      if (area.tagName === 'PRE' || area.tagName === 'CODE') return;
      regex.lastIndex = 0;
      if (regex.test(area.innerHTML)) {
        regex.lastIndex = 0;
        area.innerHTML = area.innerHTML.replace(regex, (match, current, total, label) => {
          const cur = parseInt(current);
          const tot = parseInt(total);
          if (tot === 0) return match;
          const pct = Math.round((cur / tot) * 100);
          const fmtPct = pct < 10 ? `0${pct}` : pct;
          return `<div class="sys-load-wrapper" title="${cur}/${tot} Completed"><div class="sys-load-track"><div class="sys-load-bar" style="width: 0%" data-width="${pct}%"><div class="sys-load-head"></div></div></div><div class="sys-load-data"><span class="sys-load-pct">${fmtPct}%</span></div></div>`;
        });
      }
    });
    requestAnimationFrame(() => { document.querySelectorAll('.sys-load-bar').forEach(bar => { if (bar.dataset.width) bar.style.width = bar.dataset.width; }); });
  };

  // Linkify Interno (fxlip.com/...)
  window.linkifyInternalUrls = function(context = document) {
    const walker = document.createTreeWalker(context.body || context, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    while(walker.nextNode()) {
      const node = walker.currentNode;
      if (['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'PRE', 'CODE'].includes(node.parentElement.tagName)) continue;
      if (node.parentElement.closest('.auto-term') || node.parentElement.closest('.t-cmd')) continue;
      const regex = /(https?:\/\/(?:www\.)?fxlip\.com\/[a-zA-Z0-9\-\.]+\.html)/g;
      if (regex.test(node.nodeValue)) nodesToReplace.push({ node, text: node.nodeValue });
    }
    nodesToReplace.forEach(({ node, text }) => {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = text.replace(/(https?:\/\/(?:www\.)?fxlip\.com\/[a-zA-Z0-9\-\.]+\.html)/g, '<a href="$1">$1</a>');
      if (node.parentNode) { while (wrapper.firstChild) node.parentNode.insertBefore(wrapper.firstChild, node); node.parentNode.removeChild(node); }
    });
  };

  // Embeds Internos (Cards)
  window.processInternalEmbeds = function(context = document) {
    const links = context.querySelectorAll('.post-content a, .t-out a'); 
    const currentHost = window.location.hostname;
    const prodHost = 'fxlip.com';

    links.forEach(link => {
      if (link.dataset.processed) return;
      const allowedHosts = [currentHost, 'localhost', '127.0.0.1', prodHost, 'www.' + prodHost];
      if (!allowedHosts.includes(link.hostname)) return;

      const linkText = link.innerText.trim().replace(/\/$/, '');
      const linkHref = link.href.trim().replace(/\/$/, '');
      if (linkText !== linkHref && linkText !== link.href) return;

      link.dataset.processed = "true"; 
      const loader = document.createElement('div');
      loader.className = 'rt-loading';
      loader.innerHTML = '<span class="cursor-blink">█</span> resolving ref...';
      link.style.display = 'none';
      link.parentNode.insertBefore(loader, link.nextSibling);

      const urlObj = new URL(link.href);
      fetch(urlObj.pathname)
        .then(response => { if (!response.ok) throw new Error("404"); return response.text(); })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const filename = urlObj.pathname.split('/').filter(p => p).pop() || urlObj.hostname;
          
          let displayDate = ""; 
          let dateEl = doc.querySelector('.sys-date') || doc.querySelector('time');
          if (dateEl) {
             const processed = getRelativeTime(dateEl.innerText);
             displayDate = processed ? processed : dateEl.innerText.trim();
          } else {
             displayDate = "arquivo"; 
          }

          const contentDiv = doc.querySelector('.post-content');
          let rawText = contentDiv ? contentDiv.cloneNode(true).innerText : doc.body.innerText;
          rawText = rawText.replace(/\s+/g, ' ').trim();
          const maxLength = 160;
          const desc = rawText.length > maxLength ? rawText.substring(0, maxLength) + "..." : rawText;

          const card = document.createElement('a');
          card.href = link.href;
          card.className = 'link-card no-image internal-ref';
          card.title = `./${filename}`;
          card.dataset.slug = window.urlToSlug ? window.urlToSlug(link.href) : filename;
          card.innerHTML = `<div class="lc-meta"><div class="lc-desc">${desc}</div><div class="lc-site">${displayDate}</div></div>`;
          loader.replaceWith(card);
        })
        .catch(err => { loader.remove(); link.style.display = 'inline'; link.classList.add('mention-link'); });
    });
  };

  // Menções (@usuario)
  window.applyMentions = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .post-excerpt, .terminal-window p, .terminal-window div, .t-out');
    contentAreas.forEach(area => {
      if (area.dataset.mentionsProcessed) return;
      if (area.querySelector('input, textarea, select')) return;
      const regex = /@([a-zA-Z0-9_\-\/\.]+)/g;
      regex.lastIndex = 0;
      if (regex.test(area.innerHTML)) {
          regex.lastIndex = 0;
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            if (path === 'USER') {
              let name = 'visitante';
              try { const s = localStorage.getItem('fxlip_visitor_name'); if (s && s.trim()) name = s.trim(); } catch (_) {}
              return `<span class="t-user">${escapeHtml(name)}</span>`;
            }
            const safePath = escapeHtml(path);
            const url = `/${safePath}`;
            if (path.match(/\.(jpg|jpeg|png|gif|svg)$/i)) return `<span class="embed-image-wrapper"><img src="${url}" class="embed-image" alt="${safePath}" onerror="this.style.display='none'"><span class="embed-caption">./${safePath}</span></span>`;
            if (path.match(/\.(sh|js|py|rb|txt|md|yml|json)$/i)) return `<div class="terminal-box embedded-terminal" data-src="${url}"><div class="terminal-header"><div class="terminal-controls"><span style="font-size:12px; color:#bd93f9; margin-right:10px;">./${safePath}</span></div></div><div class="terminal-body"><div class="embedded-loading"><span class="cursor-blink">█</span> loading...</div></div></div>`;
            return `<a href="${url}" class="mention-link" title="./${safePath}">${escapeHtml(match)}</a>`;
          });
      }
      area.dataset.mentionsProcessed = "true";
    });
    // Carrega terminais embutidos
    context.querySelectorAll('.embedded-terminal[data-src]').forEach(terminal => {
       const url = terminal.dataset.src;
       const body = terminal.querySelector('.terminal-body');
       terminal.removeAttribute('data-src');
       fetch(url).then(r => r.ok?r.text():Promise.reject("404")).then(text => {
           const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
           body.innerHTML = `<pre>${safeText}</pre>`;
       }).catch(err => { body.innerHTML = `<div class="t-out" style="color:#ff5555">Erro: ${err}</div>`; });
    });
  };

// Hash-Menções (#cmd → link para busca)
  window.applyHashMentions = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .post-excerpt, .t-out');
    // Suporta: #cmd  #.bash_history  #$HISTFILE  #/etc/fstab
    const regex = /#([\.\$\/]?[a-zA-Z][a-zA-Z0-9_\-\.\/]*)/g;

    contentAreas.forEach(area => {
      if (area.dataset.hashMentionsProcessed) return;
      area.dataset.hashMentionsProcessed = 'true';

      const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, null, false);
      const nodesToReplace = [];
      let node;
      while ((node = walker.nextNode())) {
        const tag = node.parentElement.tagName;
        if (['A', 'SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(tag)) continue;
        regex.lastIndex = 0;
        if (regex.test(node.nodeValue)) nodesToReplace.push(node);
      }

      nodesToReplace.forEach(node => {
        const fragment = document.createDocumentFragment();
        const parts = node.nodeValue.split(/(#[\.\$\/]?[a-zA-Z][a-zA-Z0-9_\-\.\/]*)/g);
        parts.forEach(part => {
          const m = part.match(/^#([\.\$\/]?[a-zA-Z][a-zA-Z0-9_\-\.\/]*)$/);
          if (m) {
            const a = document.createElement('a');
            a.href = '/s?=' + encodeURIComponent(m[1]);
            a.className = 'mention-link';
            a.title = 'grep ' + m[1];
            a.textContent = part;
            fragment.appendChild(a);
          } else {
            fragment.appendChild(document.createTextNode(part));
          }
        });
        node.parentNode.replaceChild(fragment, node);
      });
    });
  };

  // ==========================================================================
  // 6. CUSTOM SYNTAX HIGHLIGHTER (>> / << / ++ / ^^) - TREEWALKER ENGINE
  // ==========================================================================
  window.processSyntaxHighlighter = function(context) {
    var containers = (context || document).querySelectorAll('.post-content');
    if (containers.length === 0) return;

    containers.forEach(function(contentDiv) {
      // Função interna que percorre apenas TEXTO (ignora tags e atributos)
      const safeReplace = (regex, createEl, opts) => {
         const skipTerminals = !opts || opts.skipTerminals !== false;
         const walk = document.createTreeWalker(contentDiv, NodeFilter.SHOW_TEXT, null, false);
         let node;
         const nodesToReplace = [];

         while(node = walk.nextNode()) {
           if (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE') continue;
           if (skipTerminals && node.parentNode.closest('.terminal-box, .auto-term, .quiz-q')) continue;
           if (regex.test(node.nodeValue)) {
             nodesToReplace.push(node);
           }
         }

         nodesToReplace.forEach(node => {
           const fragment = document.createDocumentFragment();
           const parts = node.nodeValue.split(regex);

           parts.forEach((part, index) => {
              if (part) fragment.appendChild(document.createTextNode(part));
              if (index < parts.length - 1) fragment.appendChild(createEl());
           });

           node.parentNode.replaceChild(fragment, node);
         });
      };

      // Helpers para criar elementos simples
      const simpleSpan = (cls, text) => () => {
        const s = document.createElement('span');
        s.className = cls;
        s.textContent = text;
        return s;
      };

      // 1. Output (>>)
      safeReplace(/>>/g, simpleSpan('neon-pipe', '>>'));

      // 2. Input (<<)
      safeReplace(/<</g, simpleSpan('neon-in', '<<'));

      // 3. Add (++)
      safeReplace(/\+\+/g, simpleSpan('neon-plus', '++'));

      // 4. Laugh (^^) — dois ombros animados (inclusive dentro de terminais)
      safeReplace(/\^\^/g, simpleSpan('laugh-shrug', '^^'), { skipTerminals: false });

      // 5. Arrow (->)
      safeReplace(/\->/g, simpleSpan('neon-arrow', '->'));

      // 6. Left Arrow (<-)
      safeReplace(/<-/g, simpleSpan('neon-arrow', '<-'));

      // 7. Up Arrow (↑)
      safeReplace(/↑/g, simpleSpan('neon-arrow', '↑'));

      // 8. Down Arrow (↓)
      safeReplace(/↓/g, simpleSpan('neon-arrow', '↓'));

      // 9. Key separator (+ isolado entre espaços)
      safeReplace(/ \+ /g, simpleSpan('neon-key-sep', ' + '));
    });
  };

  // Code Hashtags (`#cmd` dentro de backticks → link hashtag)
  window.applyCodeHashtags = function(context = document) {
    const contentAreas = (context === document)
      ? context.querySelectorAll('.post-content')
      : [context].concat(Array.from(context.querySelectorAll?.('.post-content') || []));
    contentAreas.forEach(area => {
      if (!area || !area.querySelectorAll) return;
      area.querySelectorAll('code').forEach(code => {
        if (code.closest('a, pre')) return;
        const text = code.textContent;
        if (!text.startsWith('#')) return;
        const slug = text.slice(1);
        if (!slug) return;
        const a = document.createElement('a');
        a.href = '/s?=' + encodeURIComponent(slug);
        a.className = 'mention-link';
        a.title = 'grep ' + slug;
        a.textContent = text;
        code.replaceWith(a);
      });
    });
  };

  // TimeAgo (Aplica o cálculo nas datas)
  window.processTimeAgo = function(context = document) {
    const dateElements = context.querySelectorAll('.sys-date');
    dateElements.forEach(el => {
      if (el.dataset.timeagoProcessed) return;
      const originalText = el.innerText.trim();
      const newText = getRelativeTime(originalText);
      if (newText && newText !== originalText) {
          el.innerText = newText;
          el.title = originalText; 
          el.style.opacity = "1"; 
          el.style.color = "var(--placeholder-color)"; 
          el.style.fontWeight = "400";
      }
      el.dataset.timeagoProcessed = "true";
    });
  };

  // ==========================================================================
  // 7. ACTION BUTTONS (TOAST NOTIFICATION & SHARE)
  // Delegação de eventos para garantir funcionamento no Infinite Scroll
  // ==========================================================================
  
  // Compatibilidade com main.js (Função vazia para não dar crash se chamada)
  window.processShareButtons = function() {}; 

  // Listener Global (O Kernel do Sistema)
  document.addEventListener('click', function(e) {
    // Verifica se clicou num botão de share (ou filho dele)
    const btn = e.target.closest('.share-btn');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const link = btn.dataset.link;
    const toast = document.getElementById('sys-toast');

    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        // Feedback via Toast Global
        if (toast) {
           toast.classList.add('active');
           setTimeout(() => {
             toast.classList.remove('active');
           }, 2500);
        }
      }).catch(err => console.error("Clipboard Error:", err));
    }
  });

  // ==========================================================================
  // EXECUÇÃO INICIAL (Prioridade: visual crítico primeiro, secundário deferido)
  // ==========================================================================

  // Fase 1: Processadores visuais críticos (afetam layout/conteúdo visível)
  window.processProgressBars();
  window.applyMentions();
  window.applyHashMentions();
  window.applyCodeHashtags();
  window.processTimeAgo();

  // Fase 2: Processadores secundários (links, embeds, highlight) — deferidos
  const deferredInit = () => {
    window.linkifyInternalUrls();
    window.processInternalEmbeds();
    window.processSyntaxHighlighter();
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(deferredInit, { timeout: 2000 });
  } else {
    setTimeout(deferredInit, 100);
  }

});