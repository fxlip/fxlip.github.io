document.addEventListener("DOMContentLoaded", function() {
  const loader = document.getElementById("infinite-loader");
  const postsContainer = document.querySelector(".posts-list");
  
  // Configuração do Delay (em milissegundos)
  const ARTIFICIAL_DELAY = 2000; 

  if (loader && postsContainer) {
    
    // --- 1. CONFIGURAÇÃO DA ANIMAÇÃO (WIDESCREEN SCANNER) ---
    const width = 30; // Barra mais larga para ocupar espaço visual
    let position = 0;
    let direction = 1;
    let animationInterval = null;

    function startAnimation() {
      loader.classList.add('active');
      loader.style.display = 'block';
      
      if (animationInterval) clearInterval(animationInterval);
      
      animationInterval = setInterval(() => {
        let bar = "";
        for (let i = 0; i < width; i++) {
          if (i === position) bar += "█"; // Bloco sólido fica mais bonito
          else bar += " "; // Espaço
        }
        // Desenha: [      █      ] CARREGANDO_DADOS
        loader.innerText = `[${bar}] PROCESSANDO...`;
        
        position += direction;
        if (position === width - 1 || position === 0) {
          direction *= -1;
        }
      }, 60); // Rápido e fluído
    }

    function stopAnimation() {
      clearInterval(animationInterval);
      loader.classList.remove('active');
    }

    // --- 2. LÓGICA DE CARREGAMENTO (OBSERVER) ---
    const observer = new IntersectionObserver((entries) => {
      // Se o loader entrou na tela (isIntersecting)
      if (entries[0].isIntersecting) {
        loadNextPage();
      }
    }, {
      rootMargin: '100px', // Começa a carregar 100px antes de chegar no fundo
      threshold: 0.1
    });

    // Inicia a observação
    observer.observe(loader);

    // --- 3. FUNÇÃO DE FETCH COM DELAY ---
    let isLoading = false;

    function loadNextPage() {
      if (isLoading) return;
      isLoading = true;
      
      const nextPageUrl = loader.getAttribute("data-next-url");
      if (!nextPageUrl) {
        observer.disconnect(); // Sem mais páginas, desliga o sensor
        loader.style.display = 'none';
        return;
      }

      // Inicia o show visual
      startAnimation();

      // Promessa do Fetch (Dados)
      const fetchPromise = fetch(nextPageUrl)
        .then(response => {
          if (!response.ok) throw new Error("Erro de conexão");
          return response.text();
        });

      // Promessa do Delay (Tempo)
      const delayPromise = new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));

      // Espera OS DOIS terminarem (Dados + Tempo)
      Promise.all([fetchPromise, delayPromise])
        .then(([html, _]) => {
          // --- PROCESSAMENTO ---
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const newPosts = doc.querySelectorAll(".posts-list .post-item");
          const nextData = doc.getElementById("infinite-loader");

          // Injeção
          newPosts.forEach(post => {
            post.style.animation = "fadeIn 0.8s ease-out"; // Entrada suave
            postsContainer.appendChild(post);
            
            const hr = document.createElement('hr');
            hr.className = 'post-list__divider';
            postsContainer.appendChild(hr);
          });

          // Prepara para a próxima
          if (nextData) {
            const nextUrl = nextData.getAttribute("data-next-url");
            loader.setAttribute("data-next-url", nextUrl);
            isLoading = false; 
            // O loader continua visível se o usuário continuar scrollando
            // e o observer disparará novamente se necessário
          } else {
            // Fim do blog
            loader.removeAttribute("data-next-url");
            loader.innerText = "[ FIM DA TRANSMISSÃO ]";
            observer.disconnect();
            setTimeout(() => { loader.style.display = 'none'; }, 3000);
          }
        })
        .catch(err => {
          console.error(err);
          loader.innerText = "[ ERRO DE CONEXÃO - TENTANDO NOVAMENTE... ]";
          loader.style.color = "red";
          // Tenta de novo em 3 segundos
          setTimeout(() => {
            isLoading = false;
            loader.style.color = "";
          }, 3000);
        });
    }
  }
});