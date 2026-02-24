document.addEventListener("DOMContentLoaded", function() {

  // CONFIG: Conexão com o Cérebro Central
  const KNOWLEDGE_URL = '/assets/data/knowledge.json';
  const CACHE_KEY = 'term_knowledge_v2'; // Mesma chave do syntax.js para compartilhar cache

  // ESTADO INTERNO (Sets vazios aguardando dados)
  let KNOWN_DIRS = new Set();
  let SYS_FILES = new Set();
  let COMMANDS = new Set();

  // USER global: nome do visitante ou fallback
  let VISITOR_NAME = 'fxlip';
  try {
    const stored = localStorage.getItem('fxlip_visitor_name');
    if (stored && stored.trim()) VISITOR_NAME = stored.trim();
  } catch (_) {}

  // ==========================================================================
  // 1. DATA LOADER (SWR Pattern — Fonte Única para todos os módulos)
  // ==========================================================================
  const loadKnowledge = async () => {
    // 1. Renderização Rápida via Cache (Instantâneo)
    let cachedString = null;
    try {
      cachedString = localStorage.getItem(CACHE_KEY);
    } catch (e) {
      console.warn("AutoTerm: localStorage indisponível.");
    }

    if (cachedString) {
      try {
        const data = JSON.parse(cachedString);
        applyData(data);
        console.log("AutoTerm: Cache carregado. Renderizando...");
      } catch (e) {
        console.warn("AutoTerm: Cache inválido.");
      }
    }

    // 2. Atualização em Background (Network) — fetch único compartilhado
    try {
      const response = await fetch(KNOWLEDGE_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const newData = await response.json();
      const newDataString = JSON.stringify(newData);

      // Se houve mudança, atualiza cache e repinta
      if (newDataString !== cachedString) {
        applyData(newData);
        try { localStorage.setItem(CACHE_KEY, newDataString); } catch (_) {}
        console.log("AutoTerm: Dados atualizados. Re-renderizando...");
      }
      return newData;
    } catch (err) {
      console.error("AutoTerm: Falha ao buscar knowledge.json", err);
      // Fallback de emergência se não houver nada
      if (KNOWN_DIRS.size === 0) {
        KNOWN_DIRS = new Set(['bin', 'etc', 'home', 'var', 'usr', 'tmp']);
        window.renderTerminalWindows();
      }
      return null;
    }
  };

  const applyData = (data) => {
    if (data.directories) KNOWN_DIRS = new Set(data.directories);
    if (data.system_files) SYS_FILES = new Set(data.system_files);
    if (data.commands) COMMANDS = new Set(data.commands);

    // Expõe para outros módulos (ex: classify em s.md)
    window.__knowledge = { commands: COMMANDS, dirs: KNOWN_DIRS, files: SYS_FILES, vars: new Set(data.variables || []), whatis: data.whatis || {} };

    // Dispara a renderização assim que tiver dados
    window.renderTerminalWindows();
  };

  // ==========================================================================
  // 2. HELPER FUNCTIONS
  // ==========================================================================

  const trimOutput = () => {
    document.querySelectorAll('.t-out').forEach(el => {
      if (el.hasAttribute('data-no-trim')) return;
      let html = el.innerHTML;
      if (!html.trim()) { el.innerHTML = ""; return; }
      html = html.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
      el.innerHTML = html;
    });
  };

  const escapeHtml = (text) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // CLASSIFICADOR INTELIGENTE (Usa os Sets populados pelo JSON)
  const classifyFile = (token) => {
    let clean = token.replace(/[*\/=>@|]$/, ''); 
    
    // Regras Hardcoded (Prioridade Máxima)
    if (clean === 'tmp') return `<span class="st">${clean}</span>`; // Sticky Bit
    if (clean.startsWith('.')) { 
       if (clean === '.' || clean === '..') return `<span class="d">${clean}</span>`;
       return `<span class="h">${clean}</span>`; // Ocultos
    }

    // Regras Dinâmicas (Vindas do JSON)
    if (KNOWN_DIRS.has(clean) || token.endsWith('/')) return `<span class="d">${clean}</span>`; // Diretório
    if (SYS_FILES.has(clean)) return `<span class="f">${clean}</span>`; // Arquivo Sistema

    // Regras de Extensão/Padrão
    if (/\.(zip|tar|gz|bz2|xz|7z|rar|jar)$/.test(clean)) return `<span class="z">${clean}</span>`; // Comprimido
    if (/\.(sh|bash|py|rb|pl|run|bin|appimage)$/.test(clean) || token.endsWith('*') || COMMANDS.has(clean)) return `<span class="x">${clean}</span>`; // Executável
    if (token.includes('->') || token.endsWith('@')) return `<span class="l">${clean}</span>`; // Link Simbólico
    
    // Default: Arquivo Comum
    return `<span class="f">${clean}</span>`;
  };

  // ==========================================================================
  // 3. CORE LOGIC: STATE-AWARE PARSER
  // ==========================================================================
  
  window.renderTerminalWindows = () => {
    // Evita rodar antes de ter dados (opcional, mas evita FOUC)
    // Mas permitimos rodar se for re-chamada
    trimOutput();
    
    const rawTerminals = document.querySelectorAll('.auto-term');

    rawTerminals.forEach(term => {
      // Prepara as linhas
      const rawLines = term.innerText.split('\n');

      // Limpeza de bordas: remove linhas vazias do final e do início
      while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
        rawLines.pop();
      }
      while (rawLines.length > 0 && rawLines[0].trim() === '') {
        rawLines.shift();
      }

      // Configura botões da janela
      const parentBox = term.closest('.terminal-box');
      if (parentBox) {
        const minBtn = parentBox.querySelector('.btn-min');
        if (minBtn) minBtn.innerText = '−'; 
      }

      let htmlBuffer = '';
      let lastCmd = ''; 

      rawLines.forEach(line => {
        //if (line.trim() === '' && htmlBuffer === '') return; 
        // Preserva linhas vazias no MEIO para espaçamento visual
        if (line.trim() === '') {
           htmlBuffer += `<div class="t-out">&nbsp;</div>`;
           return;
        }

        // --- DETECÇÃO DE PROMPT ---
        const promptMatch = line.match(/^([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+):([^#$]+)([#$])\s*(.*)/);

        if (promptMatch) {
          const [_, user, host, path, symbol, cmd] = promptMatch;
          lastCmd = cmd.trim();
          const displayUser = (user === 'fxlip') ? VISITOR_NAME : user;

          htmlBuffer += `
            <div>
              <span class="t-user">${escapeHtml(displayUser)}</span><span class="t-gray">@</span><span class="t-host">${host}</span><span class="t-gray">:</span><span class="t-path">${path.trim()}</span><span class="t-gray">${symbol}</span>
              <span class="t-cmd">${escapeHtml(cmd)}</span>
            </div>`;
        } else {
          // --- PROCESSAMENTO DE OUTPUT ---
          
          // ESTADO 1: COMANDO HISTORY
          if (lastCmd.startsWith('history')) {
            const histMatch = line.match(/^\s*(\d+)(\s+)(.*)/);
            if (histMatch) {
              const [_, id, space, cmdContent] = histMatch;
              htmlBuffer += `<div class="t-out"><span class="t-gray">${id}</span>${space.replace(/ /g, '&nbsp;')}${escapeHtml(cmdContent)}</div>`;
              return;
            }
          }

          // ESTADO 2: GRID INTELIGENTE (LS)
          const tokens = line.trim().split(/\s+/);
          // [UPDATE] Adicionado 'lshome' (e preparados para outros como 'll' ou 'la')
          const isListTrigger = lastCmd.startsWith('!') || /(^|[;&|]\s*)(ls|lshome|ll|la)\b/.test(lastCmd);
              
          if (isListTrigger && tokens.length > 0) {
             const shortAvg = (tokens.reduce((a,b) => a + b.length, 0) / tokens.length) < 20;
             const hasCodeChars = /['"=`]/.test(line); 
             const isTime = /\d{2}:\d{2}:\d{2}/.test(line); 
             const isLongList = /^[-dcbpsl][-rwxst]{9}/.test(line); // Permissões rwx

             // Só aplica grid se parecer uma lista de nomes curtos
             if (shortAvg && !hasCodeChars && !isTime && !isLongList) {
                let fileSpans = tokens.map(t => classifyFile(escapeHtml(t))).join('\n'); 
                htmlBuffer += `<div class="t-out t-ls">${fileSpans}</div>`;
                return;
             }
          }

          // ESTADO 3: DIFF HIGHLIGHT
          const isDiffContext = /\b(diff|patch|git)\b/.test(lastCmd);
          if (isDiffContext) {
            if (/^@@\s.*\s@@/.test(line)) {
              htmlBuffer += `<div class="t-out t-diff-hdr">${escapeHtml(line)}</div>`;
              return;
            }
            if (/^\+{3}\s/.test(line) || /^-{3}\s/.test(line)) {
              htmlBuffer += `<div class="t-out t-diff-hdr">${escapeHtml(line)}</div>`;
              return;
            }
            if (line.startsWith('+')) {
              htmlBuffer += `<div class="t-out t-diff-add">${escapeHtml(line)}</div>`;
              return;
            }
            if (line.startsWith('-')) {
              htmlBuffer += `<div class="t-out t-diff-del">${escapeHtml(line)}</div>`;
              return;
            }
          }

          // ESTADO 4: TEXTO GENÉRICO

          // Compactação de espaços (ex: ls -l) para alinhar visualmente
          if (/^[-dcbpsl][-rwxst]{9}/.test(line) || /^total \d+/.test(line)) {
              line = line.replace(/[ \t]{4,}/g, '  ');
          }

          let safeContent = line === '' || line.trim() === '' ? '&nbsp;' : escapeHtml(line);
          
          // Highlight de executáveis conhecidos no meio do texto
          safeContent = safeContent.replace(
              /\b([\w.-]+\.(sh|bash|py|rb|pl|run|bin|appimage))\b/g,
              '<span class="x">$1</span>'
          );

          // Highlight de [match] (grep-style, colchetes ocultados)
          safeContent = safeContent.replace(
              /\[([^\]]*[a-zA-ZÀ-ú][^\]]*)\]/g,
              '<span class="t-match">$1</span>'
          );

          htmlBuffer += `<div class="t-out">${safeContent}</div>`;
        }
      });

      // Aplica o HTML gerado e marca como processado
      if (!term.classList.contains('terminal-body')) {
         term.innerHTML = htmlBuffer;
         term.classList.add('terminal-body');
         term.classList.remove('auto-term');
      } else {
         // Se já foi processado, só atualiza o conteúdo (re-render)
         term.innerHTML = htmlBuffer;
      }
    });

    initAnswerReveal();
    initQuiz();
  };

  // ==========================================================================
  // 4. ANSWER REVEAL (Exercícios — terminal interativo)
  // ==========================================================================

  // Cancela digitação e limpa o texto
  const clearType = (el) => {
    if (el._typer) { clearInterval(el._typer); el._typer = null; }
    el.textContent = '';
  };

  // Versão Promise de typeText (coexiste com typeText)
  const typeChars = (el, text, speed) => new Promise(resolve => {
    if (el._typer) clearInterval(el._typer);
    let i = 0;
    el.textContent = '';
    el._typer = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) {
        clearInterval(el._typer);
        el._typer = null;
        resolve();
      }
    }, speed);
  });

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const initAnswerReveal = () => {
    document.querySelectorAll('.terminal-box.answer-hidden').forEach(box => {
      if (box.dataset.answerInit) return;
      if (box.classList.contains('answer-revealed')) return;
      box.dataset.answerInit = '1';

      const body = box.querySelector('.terminal-body');
      if (!body) return;

      // Salva todos os filhos renderizados e limpa o body
      const nodes = Array.from(body.children);
      body.innerHTML = '';

      // Cria o prompt hook: "fxlip@www:~$ ▌" — cursor oculto via CSS por padrão
      const prompt = document.createElement('div');
      prompt.className = 'answer-prompt';

      const cmdSpan = document.createElement('span');
      cmdSpan.className = 't-cmd';

      prompt.innerHTML =
        `<span class="t-user">${escapeHtml(VISITOR_NAME)}</span>` +
        `<span class="t-gray">@</span>` +
        `<span class="t-host">www</span>` +
        `<span class="t-gray">:</span>` +
        `<span class="t-path">~</span>` +
        `<span class="t-gray">$</span> `;
      prompt.appendChild(cmdSpan);

      const cursor = document.createElement('span');
      cursor.className = 'ans-cursor';
      cursor.textContent = '▌';
      prompt.appendChild(cursor);

      body.appendChild(prompt);

      // Mouse saiu antes de clicar: limpa qualquer texto digitado
      box.addEventListener('mouseleave', () => {
        if (box.classList.contains('answer-revealed')) return;
        clearType(cmdSpan);
      });

      // Clique: replay terminal interativo
      box.addEventListener('click', () => {
        if (box.classList.contains('answer-revealed')) return;

        // Bloqueia re-clique imediatamente
        box.classList.add('answer-revealed');

        const playback = async () => {
          // Torna o cursor do hook visível para começar a digitar
          cursor.style.visibility = 'visible';

          let firstCmd = true;

          for (const node of nodes) {
            const cmdEl = node.querySelector('.t-cmd');

            if (cmdEl) {
              const cmdText = cmdEl.textContent;

              if (firstCmd) {
                // Primeiro prompt: digita no hook já visível (não recria a linha)
                firstCmd = false;

                if (cmdText.trim()) {
                  await typeChars(cmdSpan, cmdText, 45);
                  cursor.remove();
                  await sleep(500); // simula pressionar Enter
                } else {
                  cursor.style.visibility = 'hidden';
                }
                // Node não é adicionado ao body — o hook já representa essa linha
              } else {
                // Prompts seguintes: recria a linha com cursor
                cmdEl.textContent = '';

                const lineCursor = document.createElement('span');
                lineCursor.className = 'ans-cursor';
                lineCursor.textContent = '▌';
                node.appendChild(lineCursor);

                body.appendChild(node);

                if (cmdText.trim()) {
                  await typeChars(cmdEl, cmdText, 45);
                  lineCursor.remove();
                  await sleep(300); // simula pressionar Enter
                } else {
                  lineCursor.style.visibility = 'hidden';
                }
              }
            } else {
              // Linha de output: aparece instantaneamente
              body.appendChild(node);
            }
          }
        };

        playback();
      });
    });
  };

  // ==========================================================================
  // 5. QUIZ (Simulado Interativo)
  // ==========================================================================
  const initQuiz = () => {
    if (document.getElementById('quiz-scoreboard')) return; // já inicializado

    const questions = document.querySelectorAll('.quiz-q[data-answer]');
    if (!questions.length) return;

    const total = questions.length;
    let answered = 0;
    let correct = 0;
    let timerSecs = 0;
    let timerInterval = null;
    const topics = {}; // { "103.6": { correct: 0, total: 0 }, ... }

    const formatTime = s => {
      const m = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      return `${m}:${ss}`;
    };

    // Injeta placar no terminal-body do header
    const headerBody = document.querySelector('header .terminal-body');
    let scoreEl = null;

    if (headerBody) {
      scoreEl = document.createElement('div');
      scoreEl.className = 't-out';
      scoreEl.id = 'quiz-scoreboard';
      scoreEl.innerHTML =
        `<span id="quiz-timer" class="quiz-sc-num">00:00</span>` +
        `<span class="quiz-sc-label"> · </span>` +
        `<span id="quiz-sc-answered" class="quiz-sc-num"> 0</span>` +
        `<span class="quiz-sc-label">/${String(total).padEnd(2,' ')}</span>`;
      headerBody.appendChild(scoreEl);
    }

    const topicToLink = name => {
      const parts = name.split('.');
      if (parts.length !== 2) return null;
      return `/linux/${parts[0]}/${parts[1]}/revisao`;
    };

    const updateScore = () => {
      const ansEl = document.getElementById('quiz-sc-answered');
      if (ansEl) ansEl.textContent = String(answered).padStart(2,' ');

      if (answered === 1 && !timerInterval) {
        timerInterval = setInterval(() => {
          timerSecs++;
          const timerEl = document.getElementById('quiz-timer');
          if (timerEl) timerEl.textContent = formatTime(timerSecs);
        }, 1000);
      }

      if (answered === total) {
        clearInterval(timerInterval);
        if (!scoreEl || !headerBody) return;

        const pct = Math.round((correct / total) * 100);
        const pass = pct >= 70;

        // Linha do timer: acrescenta porcentagem total + resultado
        scoreEl.innerHTML +=
          `<span class="quiz-sc-label"> · </span>` +
          `<span class="${pass ? 'quiz-pass' : 'quiz-fail'}">${String(pct).padStart(3,' ')}%</span>` +
          `<span class="quiz-sc-label">     </span>` +
          `<span class="${pass ? 'quiz-pass' : 'quiz-fail'}">[${pass ? 'aprovado' : 'reprovado'}]</span>`;

        // Linhas dos subtópicos — ordenadas da pior taxa para a melhor
        if (Object.keys(topics).length > 0) {
          const sorted = Object.entries(topics).sort(
            ([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)
          );
          sorted.forEach(([name, stats]) => {
            const tPct = Math.round((stats.correct / stats.total) * 100);
            const bad = tPct < 70;
            const href = topicToLink(name);
            const line = document.createElement('div');
            line.className = 't-out';
            const countStr = `${String(stats.correct).padStart(2,' ')}/${String(stats.total).padEnd(2,' ')}`;
            const tPctStr = String(tPct).padStart(3,' ') + '%';
            const sep = `<span class="quiz-sc-label"> · </span>`;
            let html =
              `<span class="quiz-sc-label">${name}</span>` +
              sep +
              `<span class="quiz-sc-label">${countStr}</span>` +
              sep +
              `<span class="${bad ? 'quiz-fail' : 'quiz-pass'}">${tPctStr}</span>`;
            if (bad && href) {
              html += `<a href="${href}" class="mention-link"> @linux/${name.replace('.', '/')}/${href.split('/').pop()}</a>`;
            }
            line.innerHTML = html;
            headerBody.appendChild(line);
          });
        }
      }
    };

    questions.forEach(qEl => {
      const topic = qEl.dataset.topic || null;
      const correctIdx = parseInt(qEl.dataset.answer, 10) - 1;
      const items = qEl.querySelectorAll('ol li');

      if (topic) {
        if (!topics[topic]) topics[topic] = { correct: 0, total: 0 };
        topics[topic].total++;
      }

      items.forEach((li, idx) => {
        li.addEventListener('click', () => {
          if (qEl.classList.contains('quiz-answered')) return;
          qEl.classList.add('quiz-answered');
          answered++;
          qEl.querySelector('.quiz-explanation')?.classList.add('visible');

          if (idx === correctIdx) {
            li.classList.add('quiz-correct');
            correct++;
            if (topic) topics[topic].correct++;
          } else {
            li.classList.add('quiz-wrong');
            items[correctIdx]?.classList.add('quiz-reveal');
          }

          updateScore();
        });
      });
    });
  };

  // Expõe a promise do fetch para outros módulos (syntax.js) consumirem
  window.__knowledgePromise = loadKnowledge();
});