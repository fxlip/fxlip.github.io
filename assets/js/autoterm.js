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
  };

  // Expõe a promise do fetch para outros módulos (syntax.js) consumirem
  window.__knowledgePromise = loadKnowledge();
});