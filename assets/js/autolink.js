document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 0. SHARED UTILS (TIMEAGO ENGINE)
  // Lógica centralizada para cálculo de datas relativas
  // ==========================================================================
  const getRelativeTime = (dateString) => {
    if (!dateString) return null;

    const months = {
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
    };

    // Regex para: "14:21 · 27 de jan de 2026"
    const match = dateString.match(/(\d{2}):(\d{2})\s*[·\-\|]\s*(\d{1,2})\s*de\s*([a-zç]{3})\s*de\s*(\d{4})/i);

    if (!match) return dateString; // Retorna original se falhar o parse

    const hour = parseInt(match[1]);
    const min = parseInt(match[2]);
    const day = parseInt(match[3]);
    const monthStr = match[4].toLowerCase().substring(0, 3);
    const year = parseInt(match[5]);

    if (months[monthStr] === undefined) return dateString;

    const postDate = new Date(year, months[monthStr], day, hour, min);
    const now = new Date();
    
    const diffMs = now - postDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    // Regras de Formatação
    if (diffDays < 7) {
      if (diffDays < 1 && now.getDate() === postDate.getDate()) {
         return diffHours < 1 ? "há alguns minutos" : "há algumas horas";
      } else if (diffDays < 2) {
         return "ontem";
      } else {
         return `há ${Math.floor(diffDays)} dias`;
      }
    }
    
    // Se for antigo (> 7 dias), retorna a data original
    return dateString;
  };

  // ==========================================================================
  // 1. MÓDULO: AUTOTERM DUMMY
  // ==========================================================================
  window.processAutoTerm = function() {};

  // ==========================================================================
  // 2. MÓDULO: SYSTEM LOADER
  // ==========================================================================
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
          
          return `
            <div class="sys-load-wrapper" title="${cur}/${tot} Completed">
              <div class="sys-load-track">
                  <div class="sys-load-bar" style="width: 0%" data-width="${pct}%">
                      <div class="sys-load-head"></div>
                  </div>
              </div>
              <div class="sys-load-data">
                <span class="sys-load-pct">${fmtPct}%</span>
              </div>
            </div>
          `;
        });
      }
    });
    
    setTimeout(() => {
      document.querySelectorAll('.sys-load-bar').forEach(bar => {
        if (bar.dataset.width) bar.style.width = bar.dataset.width;
      });
    }, 100);
  };

  // ==========================================================================
  // 3. UTILS & LINKIFY
  // ==========================================================================
  const isImage = (path) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  const isCode = (path) => /\.(txt|md|sh|js|css|py|rb|html|json|conf|yml|yaml)$/i.test(path);

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
      wrapper.innerHTML = text.replace(
        /(https?:\/\/(?:www\.)?fxlip\.com\/[a-zA-Z0-9\-\.]+\.html)/g, 
        '<a href="$1">$1</a>'
      );
      if (node.parentNode) {
        while (wrapper.firstChild) node.parentNode.insertBefore(wrapper.firstChild, node);
        node.parentNode.removeChild(node);
      }
    });
  };

  // ==========================================================================
  // 4. CARDS & MENTIONS (V3 - CONTENT PROBE ENGINE)
  // Extrai data e conteúdo real para gerar cards minimalistas
  // ==========================================================================
  window.processInternalEmbeds = function(context = document) {
    const links = context.querySelectorAll('.post-content a, .t-out a'); 
    const currentHost = window.location.hostname;
    const prodHost = 'fxlip.com';

    links.forEach(link => {
      if (link.dataset.processed) return;
      
      const allowedHosts = [currentHost, 'localhost', '127.0.0.1', prodHost, 'www.' + prodHost];
      if (!allowedHosts.includes(link.hostname)) return;

      // Só processa links que são a URL pura (evita estragar links em palavras)
      const linkText = link.innerText.trim().replace(/\/$/, '');
      const linkHref = link.href.trim().replace(/\/$/, '');
      if (linkText !== linkHref && linkText !== link.href) return;

      link.dataset.processed = "true"; 
      
      // Placeholder de resolução
      const loader = document.createElement('div');
      loader.className = 'rt-loading';
      loader.innerHTML = '<span class="cursor-blink">█</span> resolving internal_ref...';
      link.style.display = 'none';
      link.parentNode.insertBefore(loader, link.nextSibling);

      fetch(new URL(link.href).pathname)
        .then(response => {
          if (!response.ok) throw new Error("404");
          return response.text();
        })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // 1. Captura a data real do post remoto
          const remoteDateEl = doc.querySelector('.sys-date');
          const displayDate = getRelativeTime(remoteDateEl?.innerText.trim()) || "fxlip.com"; 

          // 2. Captura e limpa o conteúdo (a "leitura" que você pediu)
          const contentDiv = doc.querySelector('.post-content');
          let cleanDesc = "Conteúdo não indexado.";
          if (contentDiv) {
              const clone = contentDiv.cloneNode(true);
              // Remove lixo visual para o resumo não ficar quebrado
              clone.querySelectorAll('script, style, .link-card, .terminal-box').forEach(el => el.remove());
              cleanDesc = clone.innerText.replace(/\s+/g, ' ').trim().substring(0, 160) + "...";
          }

          // 3. Injeção Minimalista (Sem .lc-host)
          const card = document.createElement('a');
          card.href = link.href;
          card.className = 'link-card no-image internal-ref';
          card.innerHTML = `
              <div class="lc-meta">
                  <div class="lc-desc">${cleanDesc}</div>
                  <div class="lc-site">${displayDate}</div>
              </div>
          `;
          loader.replaceWith(card);
        })     
        .catch(err => {
          loader.remove();
          link.style.display = 'inline';
          link.classList.add('mention-link');
        });
    });
  };

  window.applyMentions = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .terminal-window p, .terminal-window div, .post-item, article, main');
    
    contentAreas.forEach(area => {
      if (area.dataset.mentionsProcessed) return;
      const regex = /@([a-zA-Z0-9_\-\/\.]+)/g;
      
      if (regex.test(area.innerHTML)) {
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            const url = `/${path}`;
            if (isImage(path)) return `<span class="embed-image-wrapper"><img src="${url}" class="embed-image" alt="${path}" onerror="this.style.display='none'"><span class="embed-caption">./${path}</span></span>`;
            if (isCode(path)) return `<div class="terminal-box embedded-terminal" data-src="${url}"><div class="terminal-header"><div class="terminal-controls"><span style="font-size:12px; color:#bd93f9; margin-right:10px;">./${path}</span></div></div><div class="terminal-body"><div class="embedded-loading"><span class="cursor-blink">█</span> loading...</div></div></div>`;
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
          });
      }
      area.dataset.mentionsProcessed = "true";
    });

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

  // ==========================================================================
  // 5. NEON PIPE
  // ==========================================================================
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

  // ==========================================================================
  // 6. TIMEAGO PROTOCOL (PAGE DATES)
  // Processa as datas da página principal usando a lógica compartilhada
  // ==========================================================================
  window.processTimeAgo = function(context = document) {
    const dateElements = context.querySelectorAll('.sys-date');
    
    dateElements.forEach(el => {
      if (el.dataset.timeagoProcessed) return;

      const originalText = el.innerText.trim();
      // Chama a função auxiliar da Seção 0
      const newText = getRelativeTime(originalText);

      if (newText && newText !== originalText) {
          el.innerText = newText;
          el.title = originalText; 
          // Estilo visual para datas relativas
          el.style.opacity = "1"; 
          el.style.color = "var(--placeholder-color)"; 
          el.style.fontWeight = "400";
      }
      
      el.dataset.timeagoProcessed = "true";
    });
  };
  
  // ==========================================================================
  // 7. ACTION BUTTONS (EVENT DELEGATION - ROBUST)
  // Escuta cliques no documento inteiro e filtra se foi num .share-btn
  // ==========================================================================
  document.addEventListener('click', function(e) {
    // Procura se o clique foi num .share-btn ou num filho dele (ícone)
    const btn = e.target.closest('.share-btn');

    // Se não foi num botão de share, o Kernel ignora
    if (!btn) return;

    // Se foi, executa a lógica
    e.preventDefault();
    e.stopPropagation();

    console.log("Kernel: Clique de Share Detectado!", btn);

    const link = btn.dataset.link;
    const feedback = btn.querySelector('.copy-feedback');

    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        if (feedback) {
           feedback.classList.add('active');
           setTimeout(() => feedback.classList.remove('active'), 2000);
        }
      }).catch(err => console.error("Clipboard Error:", err));
    }
  });

  // Mantemos a função vazia apenas para não quebrar chamadas antigas no main.js
  window.processShareButtons = function() {};

  // Execução Inicial
  window.processProgressBars();
  window.processShareButtons();
  window.applyMentions();
  window.linkifyInternalUrls();
  window.processInternalEmbeds();
  window.processNeonPipes();
  window.processTimeAgo();
});