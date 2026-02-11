document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 0. VIEW COUNTER SYSTEM (SWR: Stale-While-Revalidate)
  // ==========================================================================
  const WORKER_URL = document.body.dataset.workerUrl;
  var VIEWS_CACHE_KEY = 'fxlip_views_cache';

  function getViewsCache() {
    try { return JSON.parse(localStorage.getItem(VIEWS_CACHE_KEY)) || {}; } catch (_) { return {}; }
  }

  function setViewsCache(updates) {
    try {
      var cache = getViewsCache();
      Object.keys(updates).forEach(function(k) { cache[k] = updates[k]; });
      localStorage.setItem(VIEWS_CACHE_KEY, JSON.stringify(cache));
    } catch (_) {}
  }

  function applyCountsToDOM(data, counterMap) {
    Object.keys(data).forEach(function(slug) {
      var targets = counterMap ? counterMap[slug] : null;
      if (!targets) {
        targets = [];
        document.querySelectorAll('.view-counter[data-slug="' + slug + '"]').forEach(function(c) { targets.push(c); });
      }
      if (targets) {
        targets.forEach(function(c) {
          var el = c.querySelector('.view-count');
          if (el) el.textContent = data[slug] || 0;
        });
      }
    });
  }

  window.fetchViewCounts = function(context) {
    if (!WORKER_URL) return;
    var counters = (context || document).querySelectorAll('.view-counter[data-slug]');
    if (counters.length === 0) return;

    var slugs = [];
    var counterMap = {};

    counters.forEach(function(c) {
      var slug = c.dataset.slug;
      if (slug && !c.dataset.viewLoaded) {
        slugs.push(slug);
        if (!counterMap[slug]) counterMap[slug] = [];
        counterMap[slug].push(c);
      }
    });

    if (slugs.length === 0) return;

    // SWR: mostra cache imediato
    var cache = getViewsCache();
    var cached = {};
    slugs.forEach(function(s) { if (cache[s] !== undefined) cached[s] = cache[s]; });
    if (Object.keys(cached).length > 0) applyCountsToDOM(cached, counterMap);

    // Revalida com dados frescos
    fetch(WORKER_URL + "/api/views?slugs=" + slugs.join(","))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        applyCountsToDOM(data, counterMap);
        setViewsCache(data);
        slugs.forEach(function(s) {
          if (counterMap[s]) counterMap[s].forEach(function(c) { c.dataset.viewLoaded = "true"; });
        });
      })
      .catch(function() {
        // Worker offline: marca como loaded para não retentar
        if (Object.keys(cached).length > 0) {
          slugs.forEach(function(s) {
            if (counterMap[s]) counterMap[s].forEach(function(c) { c.dataset.viewLoaded = "true"; });
          });
        }
      });
  };

  window.registerView = function(slug) {
    if (!WORKER_URL || !slug) return;
    fetch(WORKER_URL + "/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var count = data.views || 0;
      document.querySelectorAll('.view-counter[data-slug="' + slug + '"] .view-count')
        .forEach(function(el) { el.textContent = count; });
      var update = {}; update[slug] = count;
      setViewsCache(update);
    })
    .catch(function() {});
  };

  // ==========================================================================
  // 1. INFINITE SCROLL & FEED ORCHESTRATOR
  // ==========================================================================
  const loader = document.getElementById("infinite-loader");
  const postsContainer = document.querySelector(".posts-list");
  
  // CONFIGURAÇÃO
  const COMMAND_TEXT = "./nvdd.sh";
  const MSG_LINE_1 = "Parabéns!";
  const MSG_LINE_2 = "⡟⠛⠛⠛⠛⢛⣛⣛⣛⣿⣿⣿⣛⣛⣛⡛⠛⠛⠛⠛⢛\n⡇⢀⣠⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣄⡀⢐\n⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶\n⡟⢿⣿⣿⡿⠿⠿⣿⣿⣿⣿⣿⣿⣿⠿⠿⢿⣿⣿⡿⢛\n⡗⠘⣫⣤⣶⣶⣤⡀⠙⠻⣿⡟⠋⢁⣠⣶⣶⣦⣽⢇⣰\n⣧⣾⣿⣿⡿⠛⠛⠻⣶⣾⣿⣷⣶⠟⠛⠛⢿⣿⣻⣷⣴\n⣿⣿⣿⣟⣥⣤⣤⣠⣾⣟⣿⡿⣷⣄⣤⣤⣤⣿⣿⣿⣿\n⣿⡿⢫⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⡝⢻⣿\n⣿⠄⠈⠛⠛⠛⠋⠁⠄⠙⠛⠋⠄⠈⠉⠛⠛⠛⠁⠄⣿\n⡿⣄⡀⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢀⣴⢛\n⡇⠘⣿⣿⣿⣿⣯⡀⠉⠉⠉⠉⠉⢀⣼⣿⣿⣿⣿⠃⠰\n⡇⠄⢽⣿⣿⣿⣿⣿⣿⣶⣶⣶⣿⣿⣿⣿⣿⣿⡟⠄⠸\n⡇⠄⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠄⢸\n⡇⠄⠄⠄⠈⠛⢿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠁⠄⠄⠄⢨\n⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄";
  const MSG_LINE_3 = '<a href="/sobre" class="mention-link" title="./sobre">@sobre</a> <a href="/manifesto" class="mention-link" title="./manifesto">@manifesto</a> <a href="/setup" class="mention-link" title="./setup">@setup</a>'; 
  const MSG_LINE_4 = "Você leu tudo. 🏆";
  const TYPING_SPEED = 70;   // 70ms × 10 chars = 700ms (natural)
  const SUSPENSE_DELAY = 800; // Pausa pós-digitação (~1.5s total)

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
              
              // === ORQUESTRAÇÃO DE MÓDULOS (KERNEL EXECUTION) ===
              
              // 1. Parser de Links e Estrutura (autolink.js)
              if (window.applyMentions) window.applyMentions(post);
              if (window.processProgressBars) window.processProgressBars(post);
              if (window.processNeonPipes) window.processNeonPipes(post);
              if (window.processTimeAgo) window.processTimeAgo(post); // [NEW] Datas Relativas
              if (window.processShareButtons) window.processShareButtons(post);
              
              // 2. Syntax Engine (syntax.js - Usa o JSON Central)
              if (window.renderBadges) {
                  window.renderBadges(post);
              } else if (window.highlightInlineCode) {
                  window.highlightInlineCode(post);
              }
              
              postsContainer.appendChild(post);

              // 4a. Observa post para registrar view quando visível
              if (window.observePostViews) window.observePostViews(post);
            });

            // 3. Processamento Global (Terminais e Janelas)
            if (window.renderTerminalWindows) window.renderTerminalWindows();

            // 4b. Busca contagens dos novos posts
            if (window.fetchViewCounts) window.fetchViewCounts(postsContainer);
          }

          // Atualiza o link da próxima página
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
          loader.innerText = "";
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

        const line3 = document.createElement("div");
        line3.className = "t-eof"; 
        line3.innerHTML = MSG_LINE_3;

        const line4 = document.createElement("div");
        line4.className = "t-eof"; 
        line4.innerText = MSG_LINE_4;
        
        loader.parentElement.insertAdjacentElement('afterend', line1);
        line1.insertAdjacentElement('afterend', line2);
        line1.insertAdjacentElement('afterend', line3);
        line1.insertAdjacentElement('afterend', line4);

        observer.disconnect();
    }
  }

  // ==========================================================================
  // 2. VIEW COUNTER: INITIAL LOAD + VIEWPORT TRACKING
  // ==========================================================================
  var viewObserver = null;

  if (WORKER_URL) {
    // Post individual: registra view direto
    var postMeta = document.querySelector('article.post .view-counter[data-slug]');
    if (postMeta && !document.querySelector('.posts-list')) {
      window.registerView(postMeta.dataset.slug);
    }

    // Timeline: observa posts ficando visíveis para registrar view
    viewObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var counter = entry.target.querySelector('.view-counter[data-slug]');
        if (counter && !counter.dataset.viewRegistered) {
          counter.dataset.viewRegistered = "true";
          window.registerView(counter.dataset.slug);
        }
        viewObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    // Observa posts já na página
    document.querySelectorAll('article.post-item').forEach(function(post) {
      viewObserver.observe(post);
    });

    // Busca contagens iniciais
    window.fetchViewCounts();
  }

  // Expõe para o infinite scroll observar novos posts
  window.observePostViews = function(post) {
    if (viewObserver) viewObserver.observe(post);
  };

  // ==========================================================================
  // 3. HEADER ADAPTATIVO (TERMINAL MODE)
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
});