document.addEventListener("DOMContentLoaded", function() {

  // [CLEANUP] Highlight removido. Agora é responsabilidade exclusiva do syntax.js
  // [CLEANUP] Estilos removidos. Agora é responsabilidade do CSS.

  // ==========================================================================
  // 1. MÓDULO: AUTOTERM DUMMY (Prevenção de erro)
  // ==========================================================================
  window.processAutoTerm = function() {};

  // ==========================================================================
  // 2. MÓDULO: SYSTEM LOADER (Barras de Progresso [10/100])
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
    
    // Animação atrasada para dar efeito de carregamento
    setTimeout(() => {
      document.querySelectorAll('.sys-load-bar').forEach(bar => {
        if (bar.dataset.width) bar.style.width = bar.dataset.width;
      });
    }, 100);
  };

  // ==========================================================================
  // 3. UTILS & LINKIFY (Links internos automáticos)
  // ==========================================================================
  const isImage = (path) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  const isCode = (path) => /\.(txt|md|sh|js|css|py|rb|html|json|conf|yml|yaml)$/i.test(path);

  window.linkifyInternalUrls = function(context = document) {
    const walker = document.createTreeWalker(context.body || context, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    
    while(walker.nextNode()) {
      const node = walker.currentNode;
      // Ignora áreas onde não queremos links automáticos
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
  // 4. CARDS & MENTIONS
  // ==========================================================================
  window.processInternalEmbeds = function(context = document) {
    const links = context.querySelectorAll('.post-content a, .t-out a'); 
    const currentHost = window.location.hostname;
    const prodHost = 'fxlip.com';

    links.forEach(link => {
      if (link.dataset.processed) return;
      
      const allowedHosts = [currentHost, 'localhost', '127.0.0.1', prodHost, 'www.' + prodHost];
      if (!allowedHosts.includes(link.hostname)) return;

      // Só transforma se o texto do link for igual a URL (link cru)
      const linkText = link.innerText.trim().replace(/\/$/, '');
      const linkHref = link.href.trim().replace(/\/$/, '');
      if (linkText !== linkHref && linkText !== link.href) return;

      link.dataset.processed = "true"; 
      
      // Placeholder de loading
      const loader = document.createElement('div');
      loader.className = 'rt-loading';
      loader.innerHTML = '<span class="cursor-blink">█</span> resolving ref...';
      link.style.display = 'none';
      link.parentNode.insertBefore(loader, link.nextSibling);

      const urlObj = new URL(link.href);
      let fetchUrl = urlObj.pathname; 

      fetch(fetchUrl)
        .then(response => {
          if (!response.ok) throw new Error("404");
          return response.text();
        })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const filename = urlObj.pathname.split('/').filter(p => p).pop() || urlObj.hostname;
          const displayHash = filename.replace('.html', '');
          
          // Extrai o conteúdo para a descrição
          const contentDiv = doc.querySelector('.post-content');
          let rawText = "";
          if (contentDiv) {
            const clone = contentDiv.cloneNode(true);
            // Remove lixo para o resumo ficar limpo
            const garbages = clone.querySelectorAll('script, style, .terminal-box');
            garbages.forEach(g => g.remove());
            rawText = clone.innerText || "";
          } else {
            rawText = doc.body.innerText;
          }
          
          rawText = rawText.replace(/\s+/g, ' ').trim();
          const maxLength = 160;
          const desc = rawText.length > maxLength ? rawText.substring(0, maxLength) + "..." : rawText;

          // Cria o Card
          const card = document.createElement('a');
          card.href = link.href;
          card.className = 'link-card no-image internal-ref';
          card.title = `./${filename}`;
          card.innerHTML = `
            <div class="lc-meta">
              <div class="lc-host">fxlip/${displayHash}</div>
              <div class="lc-desc">${desc}</div>
              <div class="lc-site">fxlip.com</div>
            </div>
          `;
          loader.replaceWith(card);
        })
        .catch(err => {
          // Em caso de erro, volta a ser link, mas estilizado como mention
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
            // @imagem.png -> Vira Embed de Imagem
            if (isImage(path)) return `<span class="embed-image-wrapper"><img src="${url}" class="embed-image" alt="${path}" onerror="this.style.display='none'"><span class="embed-caption">./${path}</span></span>`;
            // @script.sh -> Vira Terminal Embutido
            if (isCode(path)) return `<div class="terminal-box embedded-terminal" data-src="${url}"><div class="terminal-header"><div class="terminal-controls"><span style="font-size:12px; color:#bd93f9; margin-right:10px;">./${path}</span></div></div><div class="terminal-body"><div class="embedded-loading"><span class="cursor-blink">█</span> loading...</div></div></div>`;
            // @path -> Vira Link Simples
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
          });
      }
      area.dataset.mentionsProcessed = "true";
    });

    // Carrega o conteúdo dos terminais embutidos
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
  
  // Execução Inicial
  window.processProgressBars();
  window.applyMentions();
  window.linkifyInternalUrls();
  window.processInternalEmbeds();
  window.processNeonPipes();
});