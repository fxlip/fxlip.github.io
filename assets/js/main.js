document.addEventListener("DOMContentLoaded", function() {
  const loader = document.getElementById("infinite-loader");
  const postsContainer = document.querySelector(".posts-list");
  
  // AUMENTADO: 4 segundos para apreciar a "decodificação"
  const ARTIFICIAL_DELAY = 4000; 

  if (loader && postsContainer) {
    
    // --- 1. NOVA ANIMAÇÃO: BINARY RESOLVER ---
    const chars = "01"; // Apenas binário
    const targetText = "carregando"; // Texto solicitado
    let animationInterval = null;

    function startAnimation() {
      loader.style.display = 'block';
      let iteration = 0;
      
      if (animationInterval) clearInterval(animationInterval);
      
      animationInterval = setInterval(() => {
        loader.innerText = targetText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            // Retorna 0 ou 1 aleatoriamente
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        
        // Velocidade da revelação (decodificação)
        if (iteration < targetText.length) {
          iteration += 1 / 3; 
        }
      }, 70); // 70ms = Ritmo "Cinematográfico"
    }

    function stopAnimation() {
      clearInterval(animationInterval);
    }

    // --- 2. LÓGICA DE CARREGAMENTO (OBSERVER) ---
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadNextPage();
      }
    }, {
      rootMargin: '50px', 
      threshold: 0.1
    });

    observer.observe(loader);

    // --- 3. FETCH & INJECTION ---
    let isLoading = false;

    function loadNextPage() {
      if (isLoading) return;
      isLoading = true;
      
      const nextPageUrl = loader.getAttribute("data-next-url");
      
      // Se não tem URL, desliga tudo imediatamente (Fim Silencioso)
      if (!nextPageUrl) {
        observer.disconnect();
        loader.style.display = 'none';
        return;
      }

      startAnimation();

      const fetchPromise = fetch(nextPageUrl)
        .then(response => {
          if (!response.ok) throw new Error("Falha na conexão");
          return response.text();
        });

      const delayPromise = new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));

      Promise.all([fetchPromise, delayPromise])
        .then(([html, _]) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          
          const newPosts = doc.querySelectorAll(".posts-list .post-item");
          const nextData = doc.getElementById("infinite-loader");

          newPosts.forEach(post => {
            // REMOVIDO: O código que criava o <hr> extra foi deletado aqui.
            // Agora usamos apenas o <hr> que já vem dentro do post.

            post.style.animation = "fadeIn 0.5s ease-out forwards";
            postsContainer.appendChild(post);
          });

          // Verifica se existe próxima página
          if (nextData) {
            const nextUrl = nextData.getAttribute("data-next-url");
            loader.setAttribute("data-next-url", nextUrl);
            isLoading = false; 
          } else {
            // FIM SILENCIOSO
            stopAnimation();
            loader.removeAttribute("data-next-url");
            observer.disconnect();
            loader.style.display = 'none'; 
          }
        })
        .catch(err => {
          console.error(err);
          stopAnimation();
          loader.innerText = "[ erro ]"; // Feedback minimalista
          loader.style.color = "#FF4444";
          
          setTimeout(() => {
            isLoading = false;
            loader.style.color = "";
          }, 3000);
        });
    }
  }
});