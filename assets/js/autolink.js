// --- [1] DEFINIÇÃO GLOBAL IMEDIATA (Sem esperar DOMContentLoaded) ---
window.applyMentions = function(context = document) {
  // console.log("🔍 applyMentions executado em:", context); // (Debug)

  const contentAreas = context.querySelectorAll('.post-content, .terminal-window p, .terminal-window div, .post-item');

  contentAreas.forEach(area => {
    if (area.dataset.mentionsProcessed) return;
    
    // Regex para @user, @linux/path, etc.
    const regex = /@([a-zA-Z0-9_\-\/]+)/g;

    if (area.innerHTML.match(regex)) {
        area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
          const url = `https://fxlip.com/${path}`;
          return `<a href="${url}" class="mention-link" title="Navigate to ${path}">${match}</a>`;
        });
    }
    
    area.dataset.mentionsProcessed = "true";
  });
};

// --- [2] INJEÇÃO DE ESTILOS (Executa imediatamente) ---
(function injectStyles() {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    .mention-link {
      color: #FF79C6; 
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 4px;
      padding: 0 2px;
      letter-spacing: -0.5px;
    }
    .mention-link:hover {
      color: #FFFFFF;
      background-color: rgba(189, 147, 249, 0.25);
      text-shadow: 0 0 8px rgba(216, 180, 254, 0.6);
      box-shadow: 0 0 0 1px rgba(189, 147, 249, 0.1);
      cursor: pointer;
    }
  `;
  document.head.appendChild(styleSheet);
})();

// --- [3] GATILHO INICIAL (Para conteúdo estático) ---
// Como removemos o wrapper, adicionamos um listener apenas para a execução inicial
document.addEventListener("DOMContentLoaded", function() {
    window.applyMentions();
});