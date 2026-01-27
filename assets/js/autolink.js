document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 1. INJEÇÃO DE ESTILOS (SISTEMA VISUAL UNIFICADO)
  // ==========================================================================
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    /* --- BASE MENTION (@link) --- */
    .mention-link {
      color: var(--link-color);
      text-decoration: none;
      border-radius: 4px;
      padding: 0 4px;
      letter-spacing: -0.5px;
      border: 1px solid transparent; 
      transition: all 0.3s ease;
    }
    .mention-link:hover {
      background-color: rgba(189, 147, 249, 0.1); 
      border-color: rgba(189, 147, 249, 0.5);
      box-shadow: 0 0 15px rgba(189, 147, 249, 0.15);
      cursor: pointer;
    }

    /* --- INTERNAL QUOTE CARD (O "RT") --- */
    .internal-embed-card {
      display: block;
      margin: 20px 0;
      padding: 15px;
      background-color: rgba(40, 42, 54, 0.6); /* Dracula Darker */
      border: 1px solid #44475a;
      border-left: 3px solid #bd93f9; /* Roxo Dracula */
      border-radius: 6px;
      text-decoration: none !important;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .internal-embed-card:hover {
      border-color: #6272a4;
      border-left-color: #ff79c6; /* Rosa no Hover */
      transform: translateX(2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .rt-meta {
      font-size: 11px;
      color: #6272a4;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rt-title {
      font-family: inherit;
      font-size: 1.1em;
      font-weight: bold;
      color: #f8f8f2;
      margin: 0 0 5px 0;
      line-height: 1.3;
    }
    .rt-desc {
      font-size: 0.9em;
      color: #bfbfbf;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 0;
      opacity: 0.8;
    }
    .rt-loading {
      color: #6272a4;
      font-family: monospace;
      font-size: 13px;
      padding: 10px;
      border: 1px dashed #44475a;
      border-radius: 4px;
    }

    /* --- EMBEDS GERAIS (Imagens e Terminais) --- */
    .embed-image-wrapper {
      display: block;
      margin: 15px 0;
      border: 1px solid #44475a;
      border-radius: 6px;
      overflow: hidden;
      background: #282a36;
    }
    .embed-image { max-width: 100%; display: block; }
    .embed-caption {
      display: block; padding: 6px 12px; font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--base-color); background-color: var(--card-bg); 
      border-top: 1px solid #44475a;
    }
    .embedded-terminal {
      margin: 20px 0 !important;
      border: 1px solid #bd93f9 !important;
    }
    .embedded-terminal pre {
      margin: 0; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace;
      font-size: 13px; color: var(--text-color);
    }
    .embedded-loading { color: var(--base-color); font-family: monospace; padding: 10px; }
  `;
  document.head.appendChild(styleSheet);

  // ==========================================================================
  // 2. FUNÇÕES AUXILIARES
  // ==========================================================================
  const isImage = (path) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  const isCode = (path) => /\.(txt|md|sh|js|css|py|rb|html|json|conf|yml|yaml)$/i.test(path);

  // ==========================================================================
  // 3. MÓDULO: QUOTE TWEET (RT COMENTADO)
  // Transforma links "nus" do próprio domínio em cards ricos
  // ==========================================================================
  window.processInternalEmbeds = function(context = document) {
    // Procura links apenas dentro de áreas de conteúdo
    const links = context.querySelectorAll('.post-content a');
    const currentHost = window.location.hostname;

    links.forEach(link => {
      // 1. Segurança: Ignora se já foi processado
      if (link.dataset.processed) return;
      
      // 2. Filtro: Deve ser do mesmo domínio
      if (link.hostname !== currentHost && link.hostname !== 'localhost') return;

      // 3. Filtro "Naked Link": Só transforma se o texto do link for igual à URL
      // Isso preserva links em frases como "clique [aqui](url) para ver".
      // Removemos http/https e barras finais para comparar "limpo"
      const linkText = link.innerText.trim().replace(/\/$/, '');
      const linkHref = link.href.trim().replace(/\/$/, '');
      
      if (linkText !== linkHref && linkText !== link.href) return;

      // 4. Transformação Visual (Placeholder)
      link.dataset.processed = "true"; // Marca para não repetir
      
      const card = document.createElement('div');
      card.className = 'rt-loading';
      card.innerHTML = '<span class="cursor-blink">█</span> Buscando referência interna...';
      
      // Insere o card e esconde o link original (não removemos para manter SEO/Acessibilidade se js falhar)
      link.style.display = 'none';
      link.parentNode.insertBefore(card, link.nextSibling);

      // 5. Data Fetch (Lê a página de destino)
      fetch(link.href)
        .then(response => {
          if (!response.ok) throw new Error("Post não encontrado");
          return response.text();
        })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Extração de Metadados do Post Alvo
          // Tenta pegar o h1, se não, pega o title da página
          const title = doc.querySelector('h1.post-title')?.innerText.trim() || doc.title;
          
          // Tenta pegar a data, se não, pega meta tags
          const date = doc.querySelector('time.post-date')?.innerText.trim() || '';
          
          // Tenta pegar a descrição (meta description ou primeiro parágrafo)
          let desc = doc.querySelector('meta[name="description"]')?.content || '';
          if (!desc) {
             const firstP = doc.querySelector('.post-content p');
             if (firstP) desc = firstP.innerText.substring(0, 140) + '...';
          }

          // Renderização Final do Card
          card.outerHTML = `
            <a href="${link.href}" class="internal-embed-card">
              <div class="rt-meta">
                <span>↳ EM RESPOSTA A:</span>
                <span style="opacity:0.6">${date}</span>
              </div>
              <div class="rt-title">${title}</div>
              ${desc ? `<div class="rt-desc">${desc}</div>` : ''}
            </a>
          `;
        })
        .catch(err => {
          // Se falhar (404), restaura o link original texto
          card.remove();
          link.style.display = 'inline';
          link.classList.add('mention-link'); // Dá o estilo de link rosa pelo menos
          console.warn('Falha no RT:', err);
        });
    });
  };

  // ==========================================================================
  // 4. MÓDULO: MENTIONS (@syntax)
  // ==========================================================================
  window.applyMentions = function(context = document) {
    // [UPDATED SELECTOR] Garante que pegue em qualquer lugar relevante
    const contentAreas = context.querySelectorAll('.post-content, .terminal-window p, .terminal-window div, .post-item, article, main');

    contentAreas.forEach(area => {
      if (area.dataset.mentionsProcessed) return;
      
      const regex = /@([a-zA-Z0-9_\-\/\.]+)/g;

      if (regex.test(area.innerHTML)) {
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            const url = `/${path}`;

            // A. IMAGEM
            if (isImage(path)) {
              return `
                <span class="embed-image-wrapper">
                  <img src="${url}" class="embed-image" alt="${path}" onerror="this.style.display='none'">
                  <span class="embed-caption">./${path}</span>
                </span>`;
            }

            // B. CÓDIGO (EMBED TERMINAL)
            if (isCode(path)) {
              return `
                <div class="terminal-box embedded-terminal" data-src="${url}">
                  <div class="terminal-header">
                    <div class="terminal-controls">
                       <span style="font-size:12px; color:#bd93f9; margin-right:10px;">./${path}</span>
                    </div>
                  </div>
                  <div class="terminal-body">
                    <div class="embedded-loading">
                       <span class="cursor-blink">█</span> Carregando source...
                    </div>
                  </div>
                </div>`;
            }

            // C. LINK COMUM
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
          });
      }
      area.dataset.mentionsProcessed = "true";
    });
    
    // Processamento de Conteúdo dos Embeds de Código
    const pendingEmbeds = context.querySelectorAll('.embedded-terminal[data-src]');
    pendingEmbeds.forEach(terminal => {
       const url = terminal.dataset.src;
       const body = terminal.querySelector('.terminal-body');
       terminal.removeAttribute('data-src');

       fetch(url)
         .then(r => r.ok ? r.text() : Promise.reject("404"))
         .then(text => {
           const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
           body.innerHTML = `<pre>${safeText}</pre>`;
         })
         .catch(err => {
           body.innerHTML = `<div class="t-out" style="color:#ff5555">Erro: ${err}</div>`;
         });
    });
  };

  // ==========================================================================
  // 5. INICIALIZAÇÃO
  // ==========================================================================
  window.applyMentions();       // Roda as @menções
  window.processInternalEmbeds(); // Roda os RTs
});