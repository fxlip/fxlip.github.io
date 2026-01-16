document.addEventListener("DOMContentLoaded", function() {
  // Seleciona áreas de conteúdo (posts e terminal)
  const contentAreas = document.querySelectorAll('.post-content, .terminal-window p, .terminal-window div');

  contentAreas.forEach(area => {
    // Regex Poderosa: Captura @ seguido de letras, números, traços, underscores e barras
    // Exemplo: @linux/intro/teste -> Captura "linux/intro/teste"
    const regex = /@([a-zA-Z0-9_\-\/]+)/g;

    // Substituição
    area.innerHTML = area.innerHTML.replace(regex, function(match, path) {
      // url final
      const url = `https://fxlip.com/${path}`;
      
      // Estilo para destacar o link (pode ajustar no CSS se preferir)
      const style = 'color: var(--link-hover-color); text-decoration: none; font-weight: bold;';
      
      return `<a href="${url}" style="${style}" title="Go to ${path}">${match}</a>`;
    });
  });
});