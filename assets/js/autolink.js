document.addEventListener("DOMContentLoaded", function() {

  // 1. INJEÇÃO DE ESTILOS (PALETA DRACULA REFINADA)
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    /* --- BASE MENTION (Interativo) --- */
    .mention-link {
      color: var(--link-color); /* ERA #FF79C6 */
      text-decoration: none;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border-radius: 4px;
      padding: 0 4px;
      letter-spacing: -0.5px;
      border: 1px solid transparent; 
    }
    .mention-link:hover {
      color: var(--link-color); 
      background-color: rgba(189, 147, 249, 0.1); /* Mantive RGB para alpha, mas idealmente use var se possível ou deixe fixo por opacidade */
      border-color: rgba(189, 147, 249, 0.5);
      box-shadow: 0 0 15px rgba(189, 147, 249, 0.15);
      cursor: pointer;
    }
    /* ... (restante do código) ... */
    .embed-caption {
      /* ... */
      color: var(--base-color); /* ERA #6272a4 */
      background-color: var(--card-bg); 
    }
    .embedded-terminal pre {
      /* ... */
      color: var(--text-color); /* ERA #f8f8f2 */
    }
    .embedded-loading {
      color: var(--base-color); /* ERA #6272a4 */
      /* ... */
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
            const url = `/${path}`;

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