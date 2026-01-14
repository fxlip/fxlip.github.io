document.addEventListener("DOMContentLoaded", function() {
  const loader = document.getElementById("infinite-loader");
  const postsContainer = document.querySelector(".posts-list");
  
  // Delay mantido para apreciação (2 segundos)
  const ARTIFICIAL_DELAY = 2000; 

  if (loader && postsContainer) {
    
    // --- 1. NOVA ANIMAÇÃO: DATA DECRYPTION (SCRAMBLE) ---
    // Caracteres usados para o efeito "Matrix/Hacker"
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>";
    const targetText = "CARREGANDO_DADOS_DO_SERVIDOR...";
    let animationInterval = null;

    function startAnimation() {
      loader.style.display = 'block';
      let iteration = 0;
      
      if (animationInterval) clearInterval(animationInterval);
      
      animationInterval = setInterval(() => {
        // Gera o texto embaralhado
        loader.innerText = targetText
          .split("")
          .map((letter, index) => {
            // Se já passou da iteração, fixa a letra certa
            if (index < iteration) {
              return targetText[index];
            }
            // Senão, mostra caractere aleatório
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        
        // Controla a velocidade da revelação (decodificação)
        if (iteration < targetText.length) {
          iteration += 1 / 3; // Quanto menor, mais tempo "decodificando"
        }
      }, 30); // 30ms = Framerate frenético
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
          
          // Seleciona APENAS os articles, ignorando HRs antigos da outra página
          const newPosts = doc.querySelectorAll(".posts-list .post-item");
          const nextData = doc.getElementById("infinite-loader");

          newPosts.forEach(post => {
            // Cria o HR ANTES de inserir o post (separador de topo)
            // Isso evita criar um HR no final de tudo que briga com o footer
            const hr = document.createElement('hr');
            hr.className = 'post-list__divider';
            postsContainer.appendChild(hr);

            // Insere o post com animação
            post.style.animation = "fadeIn 0.5s ease-out forwards";
            postsContainer.appendChild(post);
          });

          // Atualiza estado
          if (nextData) {
            const nextUrl = nextData.getAttribute("data-next-url");
            loader.setAttribute("data-next-url", nextUrl);
            isLoading = false; 
            // Mantém loader visível se ainda estiver na tela, observer cuida do resto
          } else {
            stopAnimation();
            loader.innerText = "EOF [ END_OF_FILE ]";
            loader.removeAttribute("data-next-url");
            observer.disconnect();
            
            // Remove o loader suavemente após 3s
            setTimeout(() => { 
                loader.style.display = 'none'; 
            }, 3000);
          }
        })
        .catch(err => {
          console.error(err);
          stopAnimation();
          loader.innerText = "[ CONEXÃO_INTERROMPIDA ]";
          loader.style.color = "#FF4444";
          
          setTimeout(() => {
            isLoading = false;
            loader.style.color = "";
            // Se o usuário scrollar de novo, tenta de novo
          }, 3000);
        });
    }
  }
});