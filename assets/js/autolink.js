document.addEventListener("DOMContentLoaded", function() {

  // 1. INJEÇÃO DE ESTILOS (PALETA DRACULA REFINADA)
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    /* --- BASE MENTION (Interativo) --- */
    .mention-link {
      color: #FF79C6; 
      text-decoration: none;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border-radius: 4px;
      padding: 0 4px;
      letter-spacing: -0.5px;
      border: 1px solid transparent; 
    }
    .mention-link:hover {
      color: #FF79C6; 
      background-color: rgba(255, 121, 198, 0.1); 
      border-color: rgba(255, 121, 198, 0.5);
      box-shadow: 0 0 15px rgba(255, 121, 198, 0.15);
      cursor: pointer;
    }

    /* --- IMAGE ATTACHMENT STYLE --- */
    .embed-image-wrapper {
      margin: 30px 0;
      display: flex; 
      flex-direction: column; 
      width: fit-content; 
      max-width: 100%;
      background-color: transparent;
      border: none;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      line-height: 0; 
    }
    
    .embed-image {
      display: block; width: 100%; height: auto; object-fit: cover;
      opacity: 0.95; transition: opacity 0.4s ease;
      padding: 0 !important; margin: 0 !important;
      background: none !important; border: none !important; 
      border-radius: 0 !important; box-shadow: none !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    
    .embed-image:hover { opacity: 1; }
    
    .embed-caption {
      line-height: 1.5; width: 100%; box-sizing: border-box; padding: 8px 12px;
      font-size: 0.85em; color: #6272a4; font-family: 'JetBrains Mono', monospace;
      background-color: var(--card-bg, #1c1a26); 
    }

    /* --- CODE TERMINAL INJECTION --- */
    .embedded-terminal { margin: 20px 0; width: 100%; }
    .embedded-terminal pre {
      margin: 0; padding: 0;
      background: transparent; border: none;
      white-space: pre-wrap; font-size: 0.9em; color: #f8f8f2;
    }
    .embedded-loading {
      color: #6272a4; font-style: italic; padding: 20px; text-align: center;
    }
  `;
  document.head.appendChild(styleSheet);

  // 2. DETECTOR DE ARQUIVOS
  const isImage = (path) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  const isCode = (path) => /\.(txt|md|sh|js|css|py|rb|html|json|conf|yml|yaml)$/i.test(path);

  // 3. FUNÇÃO GLOBAL
  window.applyMentions = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .terminal-window p, .terminal-window div, .post-item');

    contentAreas.forEach(area => {
      if (area.dataset.mentionsProcessed) return;
      
      const regex = /@([a-zA-Z0-9_\-\/\.]+)/g;

      if (area.innerHTML.match(regex)) {
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            const url = `https://felip.com.br/${path}`;

            // A. CASO IMAGEM
            if (isImage(path)) {
              return `
                <span class="embed-image-wrapper">
                  <img src="${url}" class="embed-image" alt="${path}" onerror="this.style.display='none'">
                  <span class="embed-caption">./${path}</span>
                </span>`;
            }

            // B. CASO CÓDIGO
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

            // C. CASO PADRÃO
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
          });
      }
      
      area.dataset.mentionsProcessed = "true";
    });
    
    // 4. FETCH LOGIC
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

  window.applyMentions();
});