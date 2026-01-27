document.addEventListener("DOMContentLoaded", function() {

  // 1. INJEÇÃO DE ESTILOS (PALETA DRACULA REFINADA)
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    /* --- BASE MENTION (Interativo) --- */
    .mention-link {
      color: var(--link-color);
      text-decoration: none;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border-radius: 4px;
      padding: 0 4px;
      letter-spacing: -0.5px;
      border: 1px solid transparent; 
    }
    .mention-link:hover {
      color: var(--link-color); 
      background-color: rgba(189, 147, 249, 0.1); 
      border-color: rgba(189, 147, 249, 0.5);
      box-shadow: 0 0 15px rgba(189, 147, 249, 0.15);
      cursor: pointer;
    }
    .embed-image-wrapper {
      display: block;
      margin: 10px 0;
      border: 1px solid #44475a;
      border-radius: 6px;
      overflow: hidden;
      background: #282a36;
    }
    .embed-image {
      max-width: 100%;
      display: block;
    }
    .embed-caption {
      display: block;
      padding: 5px 10px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--base-color);
      background-color: var(--card-bg); 
      border-top: 1px solid #44475a;
    }
    .embedded-terminal {
      margin: 15px 0 !important;
      border: 1px solid #bd93f9 !important; /* Borda Roxa para destacar Embed */
    }
    .embedded-terminal pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-color);
    }
    .embedded-loading {
      color: var(--base-color);
      font-family: monospace;
      padding: 10px;
    }
  `;
  document.head.appendChild(styleSheet);

  // 2. DETECTOR DE ARQUIVOS
  const isImage = (path) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  const isCode = (path) => /\.(txt|md|sh|js|css|py|rb|html|json|conf|yml|yaml)$/i.test(path);

  // 3. FUNÇÃO GLOBAL
  window.applyMentions = function(context = document) {
    // [UPDATE] Adicionado 'article' e 'main' para garantir funcionamento em páginas sem wrapper específico
    const contentAreas = context.querySelectorAll('.post-content, .terminal-window p, .terminal-window div, .post-item, article, main');

    contentAreas.forEach(area => {
      // Evita processar o mesmo elemento duas vezes ou processar containers pais depois dos filhos
      if (area.dataset.mentionsProcessed) return;
      
      // Regex para capturar @caminho/arquivo
      const regex = /@([a-zA-Z0-9_\-\/\.]+)/g;

      // Só toca no HTML se houver match, para economizar processamento
      if (regex.test(area.innerHTML)) {
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            const url = `/${path}`;

            // A. CASO IMAGEM
            if (isImage(path)) {
              return `
                <span class="embed-image-wrapper">
                  <img src="${url}" class="embed-image" alt="${path}" onerror="this.style.display='none'">
                  <span class="embed-caption">./${path}</span>
                </span>`;
            }

            // B. CASO CÓDIGO (Embed Terminal)
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

            // C. CASO PADRÃO (Link Simples)
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
          });
      }
      
      area.dataset.mentionsProcessed = "true";
    });
    
    // 4. FETCH LOGIC (Carrega o conteúdo dos embeds de código)
    const pendingEmbeds = context.querySelectorAll('.embedded-terminal[data-src]');
    pendingEmbeds.forEach(terminal => {
       const url = terminal.dataset.src;
       const body = terminal.querySelector('.terminal-body');
       terminal.removeAttribute('data-src');

       fetch(url)
         .then(r => r.ok ? r.text() : Promise.reject("404"))
         .then(text => {
           // Sanitização básica para evitar injeção de HTML do arquivo alvo
           const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
           body.innerHTML = `<pre>${safeText}</pre>`;
         })
         .catch(err => {
           body.innerHTML = `<div class="t-out" style="color:#ff5555">Erro: ${err}</div>`;
         });
    });
  };

  window.applyMentions();
});