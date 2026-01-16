document.addEventListener("DOMContentLoaded", function() {
  
  // 1. INJEÇÃO DE ESTILOS (Cyberpunk/Dracula Palette)
  // Criamos o CSS dinamicamente para manter tudo neste arquivo
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    .mention-link {
      color: #FF79C6; /* Rosa Neon (Dracula Pink) - Base */
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Animação Suave */
      border-radius: 4px;
      padding: 0 2px; /* Pequeno respiro lateral */
      letter-spacing: -0.5px; /* Deixa o @ mais juntinho */
    }
    
    .mention-link:hover {
      color: #FFFFFF; /* Branco Puro no Hover */
      background-color: rgba(189, 147, 249, 0.25); /* Fundo Roxo Translúcido */
      text-shadow: 0 0 8px rgba(216, 180, 254, 0.6); /* Glow Lilás */
      box-shadow: 0 0 0 1px rgba(189, 147, 249, 0.1); /* Borda sutil */
      cursor: pointer;
    }
  `;
  document.head.appendChild(styleSheet);

  // 2. LOGICA DE SUBSTITUIÇÃO
  const contentAreas = document.querySelectorAll('.post-content, .terminal-window p, .terminal-window div');

  contentAreas.forEach(area => {
    // Regex: Captura @path/to/resource
    const regex = /@([a-zA-Z0-9_\-\/]+)/g;

    // Substitui pelo link com a classe .mention-link
    area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
      const url = `https://fxlip.com/${path}`;
      return `<a href="${url}" class="mention-link" title="Navigate to ${path}">${match}</a>`;
    });
  });
});