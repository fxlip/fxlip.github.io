document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 1. INJEÇÃO DE ESTILOS ADICIONAIS
  // ==========================================================================
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    /* Animação de Loading para o RT */
    .rt-loading {
      display: block;
      margin: 15px 0;
      padding: 12px;
      color: #6272a4;
      background: rgba(40, 42, 54, 0.3);
      border: 1px dashed #44475a;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
    }
    
    /* Styles para Mentions e Embeds de código */
    .mention-link {
      color: var(--link-color);
      text-decoration: none;
      border-radius: 4px; padding: 0 4px;
      transition: all 0.3s ease;
    }
    .mention-link:hover {
      background-color: rgba(189, 147, 249, 0.1); 
      cursor: pointer;
    }
    .embedded-terminal { margin: 20px 0 !important; border: 1px solid #bd93f9 !important; }
    .embedded-terminal pre { margin: 0; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--text-color); }
    .embedded-loading { color: var(--base-color); font-family: monospace; padding: 10px; }
    .embed-image-wrapper { display: block; margin: 15px 0; border: 1px solid #44475a; border-radius: 6px; overflow: hidden; background: #282a36; }
    .embed-image { max-width: 100%; display: block; }
    .embed-caption { display: block; padding: 6px 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; color: var(--base-color); background-color: var(--card-bg); border-top: 1px solid #44475a; }
  `;
  document.head.appendChild(styleSheet);

  // ==========================================================================
  // 2. FUNÇÕES AUXILIARES
  // ==========================================================================
  const isImage = (path) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  const isCode = (path) => /\.(txt|md|sh|js|css|py|rb|html|json|conf|yml|yaml)$/i.test(path);

  // ==========================================================================
  // 3. MÓDULO: INTERNAL RT (QUOTE TWEET) - V3 (Localhost Aware)
  // ==========================================================================
  window.processInternalEmbeds = function(context = document) {
    const links = context.querySelectorAll('.post-content a, .t-out a'); 
    const currentHost = window.location.hostname;
    const prodHost = 'felip.com.br';

    links.forEach(link => {
      if (link.dataset.processed) return;
      
      // Lista de domínios permitidos
      const allowedHosts = [currentHost, 'localhost', '127.0.0.1', prodHost, 'www.' + prodHost];
      if (!allowedHosts.includes(link.hostname)) return;

      // Filtro Naked Link
      const linkText = link.innerText.trim().replace(/\/$/, '');
      const linkHref = link.href.trim().replace(/\/$/, '');
      if (linkText !== linkHref && linkText !== link.href) return;

      link.dataset.processed = "true"; 
      
      const loader = document.createElement('div');
      loader.className = 'rt-loading';
      loader.innerHTML = '<span class="cursor-blink">█</span> resolving ref...';
      
      link.style.display = 'none';
      link.parentNode.insertBefore(loader, link.nextSibling);

      // [FIX CRÍTICO] Roteamento Inteligente
      // Se o link aponta para felip.com.br mas estou no localhost, uso caminho relativo.
      // Isso permite que o fetch funcione em posts novos que ainda não subiram.
      let fetchUrl = link.href;
      if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
        if (link.hostname.includes(prodHost)) {
           // Transforma https://felip.com.br/foo.html em /foo.html
           const urlObj = new URL(link.href);
           fetchUrl = urlObj.pathname;
        }
      }

      fetch(fetchUrl)
        .then(response => {
          if (!response.ok) throw new Error("Post não encontrado (404)");
          return response.text();
        })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Extração
          const urlObj = new URL(link.href);
          const filename = urlObj.pathname.split('/').filter(p => p).pop() || urlObj.hostname;

          const contentDiv = doc.querySelector('.post-content');
          let rawText = "";

          if (contentDiv) {
            const clone = contentDiv.cloneNode(true);
            const garbages = clone.querySelectorAll('script, style, .terminal-box, .terminal-controls');
            garbages.forEach(g => g.remove());
            rawText = clone.innerText || "";
          } else {
            rawText = doc.body.innerText;
          }

          rawText = rawText.replace(/\s+/g, ' ').trim();
          const maxLength = 150;
          const desc = rawText.length > maxLength 
            ? rawText.substring(0, maxLength) + "..." 
            : rawText;

          // Criação do Card
          const card = document.createElement('a');
          card.href = link.href;
          card.className = 'link-card no-image internal-ref';
          
          card.innerHTML = `
            <div class="lc-meta">
              <div class="lc-host">${filename}</div>
              <div class="lc-desc">${desc}</div>
              <div class="lc-site">felip.com.br</div>
            </div>
          `;

          loader.replaceWith(card);
        })
        .catch(err => {
          console.warn("AutoLink RT Falhou:", err);
          loader.remove();
          link.style.display = 'inline';
          link.classList.add('mention-link');
        });
    });
  };

  // ==========================================================================
  // 4. MÓDULO: MENTIONS (@syntax)
  // ==========================================================================
  window.applyMentions = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .terminal-window p, .terminal-window div, .post-item, article, main');

    contentAreas.forEach(area => {
      if (area.dataset.mentionsProcessed) return;
      const regex = /@([a-zA-Z0-9_\-\/\.]+)/g;

      if (regex.test(area.innerHTML)) {
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            const url = `/${path}`;

            if (isImage(path)) {
              return `<span class="embed-image-wrapper"><img src="${url}" class="embed-image" alt="${path}" onerror="this.style.display='none'"><span class="embed-caption">./${path}</span></span>`;
            }
            if (isCode(path)) {
              return `<div class="terminal-box embedded-terminal" data-src="${url}"><div class="terminal-header"><div class="terminal-controls"><span style="font-size:12px; color:#bd93f9; margin-right:10px;">./${path}</span></div></div><div class="terminal-body"><div class="embedded-loading"><span class="cursor-blink">█</span> loading...</div></div></div>`;
            }
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
          });
      }
      area.dataset.mentionsProcessed = "true";
    });
    
    // Processamento de Embeds
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
  // 5. INICIALIZAÇÃO
  // ==========================================================================
  window.applyMentions();
  window.processInternalEmbeds();
});