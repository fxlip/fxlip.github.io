document.addEventListener("DOMContentLoaded", function() {
  const loadMoreBtn = document.getElementById("load-more-btn");
  const postsContainer = document.querySelector(".posts-list");

  if (loadMoreBtn && postsContainer) {
    loadMoreBtn.addEventListener("click", function(e) {
      e.preventDefault();
      
      // --- 1. CONFIGURAÇÃO DA ANIMAÇÃO (SCANNER STYLE) ---
      const originalText = loadMoreBtn.innerText; // Guarda o texto "Ver mais"
      const width = 10; // Largura da barra de scanner
      let position = 0;
      let direction = 1; // 1 = direita, -1 = esquerda
      
      // Trava o botão e fixa largura para não "sambar"
      loadMoreBtn.style.pointerEvents = "none";
      loadMoreBtn.style.minWidth = "160px"; 
      
      // Loop visual (Roda a cada 80ms)
      const loadingInterval = setInterval(() => {
        let bar = "";
        for (let i = 0; i < width; i++) {
          if (i === position) bar += "■"; // O cursor ativo
          else bar += " "; // Espaço vazio
        }
        
        loadMoreBtn.innerText = `[${bar}]`;
        
        // Lógica de "Bate e Volta"
        position += direction;
        if (position === width - 1 || position === 0) {
          direction *= -1; 
        }
      }, 80);
      // ----------------------------------------------------

      const nextPageUrl = this.getAttribute("href");

      fetch(nextPageUrl)
        .then(response => {
          if (!response.ok) throw new Error("Erro de conexão");
          return response.text();
        })
        .then(html => {
          // --- 2. PROCESSAMENTO DO HTML RECEBIDO ---
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          
          const newPosts = doc.querySelectorAll(".posts-list .post-item");
          const nextBtnData = doc.getElementById("load-more-btn");

          // Injeta os novos posts na lista atual
          newPosts.forEach(post => {
            post.style.animation = "fadeIn 0.5s"; // Efeito visual suave
            postsContainer.appendChild(post);
            
            // Adiciona o divisor entre posts
            const hr = document.createElement('hr');
            hr.className = 'post-list__divider';
            postsContainer.appendChild(hr);
          });

          // --- 3. FINALIZAÇÃO ---
          clearInterval(loadingInterval); // Para a animação
          
          if (nextBtnData) {
            // Atualiza o link para a próxima página (ex: page/3/)
            loadMoreBtn.setAttribute("href", nextBtnData.getAttribute("href"));
            loadMoreBtn.innerText = originalText;
            loadMoreBtn.style.pointerEvents = "auto";
          } else {
            // Se não houver mais páginas, esconde o botão
            loadMoreBtn.style.display = "none";
          }
        })
        .catch(err => {
          console.error(err);
          // Feedback de erro visual
          clearInterval(loadingInterval);
          loadMoreBtn.innerText = "[ ERRO ]";
          loadMoreBtn.style.color = "red";
          
          // Restaura o botão após 2 segundos
          setTimeout(() => {
             loadMoreBtn.innerText = originalText;
             loadMoreBtn.style.color = "";
             loadMoreBtn.style.pointerEvents = "auto";
          }, 2000);
        });
    });
  }
});