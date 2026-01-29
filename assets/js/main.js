document.addEventListener("DOMContentLoaded", function() {
  
  // ==========================================================================
  // 1. INFINITE SCROLL & FEED LOADER
  // ==========================================================================
  const loader = document.getElementById("infinite-loader");
  const postsContainer = document.querySelector(".posts-list");
  
  // CONFIGURAÇÃO
  const COMMAND_TEXT = "./nvdd.sh";
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
      
      if (!nextUrl) {
        runFinalSequence();
        return;
      }

      const fetchPromise = fetch(nextUrl).then(response => {
        if (!response.ok) throw new Error("Erro na rede");
        return response.text();
      });

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
              
              // RE-APLICAÇÃO DE MÓDULOS NOS NOVOS POSTS
              if (window.applyMentions) window.applyMentions(post);
              if (window.highlightInlineCode) window.highlightInlineCode(post);
              if (window.processProgressBars) window.processProgressBars(post);
              if (window.processNeonPipes) window.processNeonPipes(post);
              
              postsContainer.appendChild(post);
            });
            
            if (window.reprocessTerminal) window.reprocessTerminal();
          }

          if (nextData) {
            const newNextUrl = nextData.getAttribute("data-next-url");
            if (newNextUrl) {
               loader.setAttribute("data-next-url", newNextUrl);
            } else {
               loader.removeAttribute("data-next-url");
            }
          } else {
             loader.removeAttribute("data-next-url");
          }

          loader.innerText = ""; 
          isLoading = false; 
        })
        .catch(err => {
          console.error(err);
          isLoading = false; 
        });
    }

    function runFinalSequence() {
        typeCommand()
            .then(() => new Promise(r => setTimeout(r, SUSPENSE_DELAY)))
            .then(() => {
                handleEndOfFeed();
            });
    }

    function handleEndOfFeed() {
        loader.innerText = COMMAND_TEXT; 
        const currentCursor = loader.parentElement.querySelector(".cursor-blink");
        if (currentCursor) currentCursor.style.display = "none";

        const line1 = document.createElement("div");
        line1.className = "t-out";
        line1.style.marginTop = "5px";
        line1.innerText = MSG_LINE_1;
        
        const line2 = document.createElement("div");
        line2.className = "t-eof"; 
        line2.innerText = MSG_LINE_2;
        
        loader.parentElement.insertAdjacentElement('afterend', line1);
        line1.insertAdjacentElement('afterend', line2);

        observer.disconnect();
    }
  }

  // ==========================================================================
  // 2. HEADER ADAPTATIVO (TERMINAL MODE)
  // ==========================================================================
  const header = document.querySelector('header');
  const targetTerminal = document.querySelector('.feed-terminal') || document.querySelector('.terminal-window') || document.querySelector('.terminal-box');
  
  if (header && targetTerminal) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const termRect = targetTerminal.getBoundingClientRect();
          const headerHeight = header.offsetHeight;
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

  // ==========================================================================
  // 3. SYSTEM HUD (READING DOCK) - v13 AUTO-DISMISS
  // ==========================================================================
  const dock = document.getElementById('sys-reading-dock');
  
  if (dock) {
    const bar = dock.querySelector('.sys-dock-bar');
    const body = document.body;
    
    // Configuração: Só ativa se a página for 1.5x maior que a janela
    const MIN_HEIGHT_THRESHOLD = 1.5; 
    let tickingDock = false;
    
    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      
      // 1. Verifica se a página é longa o suficiente
      if (docHeight <= winHeight * MIN_HEIGHT_THRESHOLD) {
        if (dock.classList.contains('active')) {
           dock.classList.remove('active');
           body.classList.remove('dock-active');
        }
        return;
      }

      // 2. Calcula porcentagem
      const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
      const cleanPct = Math.min(100, Math.max(0, scrollPercent)); 
      
      // 3. Renderiza a largura
      bar.style.width = cleanPct + "%";

      // 4. PROTOCOLO DE AUTO-DESTRUIÇÃO (>= 99.5%)
      if (cleanPct >= 99.5) {
        // Tarefa completa: Oculta o Dock
        if (!dock.classList.contains('finished')) {
          dock.classList.add('finished');
          
          // Remove o padding do body para o footer encostar no chão
          body.classList.remove('dock-active'); 
        }
      } else {
        // Usuário subiu: Traz o Dock de volta
        if (dock.classList.contains('finished')) {
          dock.classList.remove('finished');
          body.classList.add('dock-active');
        }
        
        // Garante que está ativo se não estiver finalizado
        if (!dock.classList.contains('active')) {
           dock.classList.add('active');
           body.classList.add('dock-active');
        }
      }
      
      tickingDock = false;
    }

    // Scroll Listener Otimizado
    window.addEventListener('scroll', () => {
      if (!tickingDock) {
        window.requestAnimationFrame(updateProgress);
        tickingDock = true;
      }
    }, { passive: true });
    
    window.addEventListener('resize', updateProgress);
    
    // Check inicial
    updateProgress();
  }


});