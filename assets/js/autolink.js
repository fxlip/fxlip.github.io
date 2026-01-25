document.addEventListener("DOMContentLoaded", function() {
  
  // 1. INJEÇÃO DE ESTILOS (UNIFIED SOFT NEON PALETTE)
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    .mention-link {
      color: #FF79C6; /* Rosa Neon Base */
      text-decoration: none;
      
      /* [FIX] Sincronizado com Link Card (0.4s) */
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      
      border-radius: 4px;
      padding: 0 4px; /* Mais respiro para parecer um 'mini-bloco' */
      letter-spacing: -0.5px;
      
      /* Borda invisível para reservar espaço e não pular no hover */
      border: 1px solid transparent; 
    }
    
    .mention-link:hover {
      /* [FIX] Mantém Rosa (não vira branco) para consistência */
      color: #FF79C6; 
      
      /* [FIX] Fundo Rosa Suave (igual ao Link Card) */
      background-color: rgba(255, 121, 198, 0.1); 
      
      /* [FIX] Borda Rosa Suave (50% Opacity) */
      border-color: rgba(255, 121, 198, 0.5);
      
      /* [FIX] Glow Suave (aura rosa) */
      box-shadow: 0 0 15px rgba(255, 121, 198, 0.15);
      
      text-decoration: none;
      cursor: pointer;
    }
  `;
  document.head.appendChild(styleSheet);

  // 2. FUNÇÃO GLOBAL DE SUBSTITUIÇÃO
  window.applyMentions = function(context = document) {
    const contentAreas = context.querySelectorAll('.post-content, .terminal-window p, .terminal-window div, .post-item');

    contentAreas.forEach(area => {
      if (area.dataset.mentionsProcessed) return;
      
      // Regex para @path/to/file ou @user
      const regex = /@([a-zA-Z0-9_\-\/]+)/g;

      if (area.innerHTML.match(regex)) {
          area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
            const url = `https://fxlip.com/${path}`;
            // Adicionei target="_blank" opcionalmente se quiser que abra em nova aba, mas padrão é mesma aba
            return `<a href="${url}" class="mention-link" title="./${path}">${match}</a>`;
          });
      }
      
      area.dataset.mentionsProcessed = "true";
    });
  };

  // 3. EXECUÇÃO INICIAL
  window.applyMentions();
});