document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 0. SHARED UTILS (TIMEAGO ENGINE - PRECISION v2)
  // Lógica cronométrica exata para datas
  // ==========================================================================
  const getRelativeTime = (dateString) => {
    if (!dateString) return null;

    // Limpeza agressiva
    const cleanStr = dateString.replace(/\s+/g, ' ').trim();

    const months = {
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
    };

    // Regex Flexível
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

    // Cálculo das unidades
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    // Se for data futura (relógio errado)
    if (diffMs < 0) return "agora mesmo";

    // Lógica (< 7 dias)
    if (diffDays < 7) {
      // 1. Minutos
      if (diffMinutes < 60) {
         if (diffMinutes <= 1) return "agora mesmo";
         return `há ${diffMinutes} minutos`;
      }
      // 2. Horas
      if (diffHours < 24) {
         const unit = diffHours === 1 ? "hora" : "horas";
         return `há ${diffHours} ${unit}`;
      }
      // 3. Ontem (24h - 48h)
      if (diffHours < 48) {
         return "ontem";
      }
      // 4. Dias
      return `há ${diffDays} dias`;
    }
    
    // Antigo
    return cleanStr;
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
      if (regex.test(area.innerHTML)) {
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
    setTimeout(() => { document.querySelectorAll('.sys-load-bar').forEach(bar => { if (bar.dataset.width) bar.style.width = bar.dataset.width; }); }, 100);
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
          card.innerHTML = `<div class="lc-meta"><div class="lc-desc">${desc}</div><div class="lc-site">${displayDate}</div></div>`;
          loader.replaceWith(card);
        })
        .catch(err => { loader.remove(); link.style.display = 'inline'; link.classList.add('mention-link'); });
    });
  };

  // Menções (@usuario)
  window.applyMentions = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .post-excerpt, .terminal-window p, .terminal-window div');
    contentAreas.forEach(area => {
      if (area.dataset.mentionsProcessed) return;
      const regex = /@([a-zA-Z0-9_\-\/\.]+)/g;
      if (regex.test(area.innerHTML)) {
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            const url = `/${path}`;
            if (path.match(/\.(jpg|jpeg|png|gif|svg)$/i)) return `<span class="embed-image-wrapper"><img src="${url}" class="embed-image" alt="${path}" onerror="this.style.display='none'"><span class="embed-caption">./${path}</span></span>`;
            if (path.match(/\.(sh|js|py|rb|txt|md|yml|json)$/i)) return `<div class="terminal-box embedded-terminal" data-src="${url}"><div class="terminal-header"><div class="terminal-controls"><span style="font-size:12px; color:#bd93f9; margin-right:10px;">./${path}</span></div></div><div class="terminal-body"><div class="embedded-loading"><span class="cursor-blink">█</span> loading...</div></div></div>`;
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
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

  // Neon Pipes (>>)
  window.processNeonPipes = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .post-excerpt, .terminal-window p, .terminal-window div, .post-item, article');
    const regex = /(\s|^|&nbsp;)(>>|»|&gt;&gt;)(\s|$|&nbsp;)/g;
    contentAreas.forEach(area => {
      if (area.closest('pre') || area.tagName === 'CODE') return;
      if (regex.test(area.innerHTML)) {
        area.innerHTML = area.innerHTML.replace(regex, '$1<span class="sys-pipe">>></span>$3');
      }
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
  // EXECUÇÃO INICIAL
  // ==========================================================================
  window.processProgressBars();
  window.applyMentions();
  window.linkifyInternalUrls();
  window.processInternalEmbeds();
  window.processNeonPipes();
  window.processTimeAgo();

});