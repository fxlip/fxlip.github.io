document.addEventListener("DOMContentLoaded", function() {
  const loader = document.getElementById("infinite-loader");
  const postsContainer = document.querySelector(".posts-list");
  
// --- [NEW] HEADER ADAPTATIVO (SMART TRIGGER) ---
  const header = document.querySelector('header');
  // Alvo: O terminal do feed (Home) OU Janelas de terminal genéricas (Outras páginas)
  const targetTerminal = document.querySelector('.feed-terminal') || document.querySelector('.terminal-window') || document.querySelector('.terminal-box');
  if (header && targetTerminal) {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const termRect = targetTerminal.getBoundingClientRect();
          const headerHeight = header.offsetHeight;
          
          // Buffer aumentado para 15px para evitar flicker em telas de toque imprecisas
          if (termRect.top <= (headerHeight + 15)) {
            header.classList.add('header-terminal-mode');
          } else {
            header.classList.remove('header-terminal-mode');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  // -----------------------------------------------

  // CONFIGURAÇÃO
  const COMMAND_TEXT = "./nvdd.sh";
  
  // Mensagens separadas
  const MSG_LINE_1 = "Pronto.";
  const MSG_LINE_2 = "Você terminou de ler tudo que eu já publiquei. 🏆";
  
  const TYPING_SPEED = 100;  
  const SUSPENSE_DELAY = 1500; 

  if (loader && postsContainer) {
    
    function typeCommand() {
      return new Promise((resolve) => {
        loader.innerText = ""; 
        let i = 0;
        const interval = setInterval(() => {
          loader.innerText += COMMAND_TEXT.charAt(i);
          i++;
          if (i >= COMMAND_TEXT.length) {
            clearInterval(interval);
            resolve(); 
          }
        }, TYPING_SPEED);
      });
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadNextPage();
      }
    }, { rootMargin: '50px', threshold: 0.1 });

    observer.observe(loader);

    let isLoading = false;

    function loadNextPage() {
      if (isLoading) return;
      isLoading = true;
      
      const nextUrl = loader.getAttribute("data-next-url");
      
      // MUDANÇA CRUCIAL:
      // Se não tem URL, significa que o usuário rolou até o fundo DEPOIS
      // de ter carregado a última página. Hora do show final.
      if (!nextUrl) {
        runFinalSequence();
        return;
      }

      const fetchPromise = fetch(nextUrl).then(response => {
        if (!response.ok) throw new Error("Erro na rede");
        return response.text();
      });

      // Fluxo normal de carregamento
      typeCommand()
        .then(() => new Promise(resolve => setTimeout(resolve, SUSPENSE_DELAY)))
        .then(() => fetchPromise)
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const newPosts = doc.querySelectorAll("article.post-item");
          const nextData = doc.getElementById("infinite-loader");

          if (newPosts.length > 0) {
            newPosts.forEach(post => {
              post.style.animation = "fadeIn 0.8s ease forwards";
              if (window.applyMentions) {
                  window.applyMentions(post);
              }
              postsContainer.appendChild(post);
            });
          }

          // PREPARAÇÃO PARA O PRÓXIMO PASSO
          if (nextData) {
            const newNextUrl = nextData.getAttribute("data-next-url");
            if (newNextUrl) {
               // Tem mais páginas
               loader.setAttribute("data-next-url", newNextUrl);
            } else {
               // ACABOU, MAS NÃO RODA O FINAL AINDA.
               // Remove a URL e deixa o loader vazio esperando o scroll do usuário.
               loader.removeAttribute("data-next-url");
            }
          } else {
             // ACABOU (Caso sem nextData). Mesmo esquema.
             loader.removeAttribute("data-next-url");
          }

          // Limpa o texto e libera o lock para o próximo scroll
          loader.innerText = ""; 
          isLoading = false; 
        })
        .catch(err => {
          console.error(err);
          isLoading = false; 
        });
    }

    // --- SEQUÊNCIA FINAL (Acionada pelo scroll no fim da página) ---
    function runFinalSequence() {
        // 1. Digita o comando
        typeCommand()
            // 2. Suspense
            .then(() => new Promise(r => setTimeout(r, SUSPENSE_DELAY)))
            // 3. Exibe as mensagens
            .then(() => {
                handleEndOfFeed();
            });
    }

    // --- ENCERRAMENTO VISUAL (Sem logout, multilinha) ---
    function handleEndOfFeed() {
        // 1. Fixa o comando
        loader.innerText = COMMAND_TEXT; 
        
        // 2. Some cursor
        const currentCursor = loader.parentElement.querySelector(".cursor-blink");
        if (currentCursor) currentCursor.style.display = "none";

        // 3. Linha 1: "Pronto."
        const line1 = document.createElement("div");
        line1.className = "t-out";
        line1.style.marginTop = "5px";
        line1.innerText = MSG_LINE_1;
        
        // 4. Linha 2: "Você acabou..." (Com classe final para espaçamento)
        const line2 = document.createElement("div");
        line2.className = "t-eof"; // Classe que define a margem final
        line2.innerText = MSG_LINE_2;
        
        // 5. Injeta
        loader.parentElement.insertAdjacentElement('afterend', line1);
        line1.insertAdjacentElement('afterend', line2);

        // 6. Fim
        observer.disconnect();
    }
  }
});