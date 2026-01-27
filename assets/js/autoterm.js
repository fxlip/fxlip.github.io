document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 1. CONSTANTES & HEURÍSTICAS
  // ==========================================================================
  
  // Diretórios conhecidos (Azul/Ciano)
  const KNOWN_DIRS = new Set([
    'bin', 'boot', 'dev', 'etc', 'home', 'lib', 'lib64', 'media', 'mnt', 'opt', 
    'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var', 'snap', 
    'lost+found', 'assets', 'img', 'css', 'js', 'node_modules', '_posts', 
    '_site', '_includes', '_layouts', 'files', 'linux', 'feed', 'about', 
    'setup', 'shop', 'curadoria', 'lpi1', 'www', 'script'
  ]);
  
  // Arquivos de sistema e Links (Roxo/Cinza)
  const KNOWN_LINKS = new Set([
    'vmlinuz', 'initrd.img', 'vmlinuz.old', 'initrd.img.old', 'core'
  ]);
  
  const SENTENCE_INDICATORS = /(?:^|\s)(é|eh|est[áa]|tem|s[ãa]o|um|uma|do|da|de|em|na|no|com|para|por|como|is|are|the|an|of|for|to|with|alias|shell|hash|builtin)(?=\s|$)/i;
  const DATE_INDICATORS = /\b(seg|ter|qua|qui|sex|s[áa]b|dom|mon|tue|wed|thu|fri|sat|sun|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec)\b|\d{1,2}:\d{2}/i;

  // ==========================================================================
  // 2. HELPER FUNCTIONS
  // ==========================================================================

  const trimOutput = () => {
    document.querySelectorAll('.t-out').forEach(el => {
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

  const classifyFile = (token) => {
    let clean = token.replace(/[*\/=>@|]$/, ''); 
    
    if (clean === 'tmp') return `<span class="st">${clean}</span>`;
    
    if (clean.startsWith('.')) { 
       if (clean === '.' || clean === '..') return `<span class="d">${clean}</span>`;
       return `<span class="h">${clean}</span>`;
    }
    
    if (KNOWN_DIRS.has(clean) || token.endsWith('/')) return `<span class="d">${clean}</span>`;
    if (/\.(zip|tar|gz|bz2|xz|7z|rar|jar)$/.test(clean)) return `<span class="z">${clean}</span>`;
    if (/\.(sh|bash|py|rb|pl|run|bin|appimage)$/.test(clean) || token.endsWith('*')) return `<span class="x">${clean}</span>`;
    if (KNOWN_LINKS.has(clean) || token.includes('->') || token.endsWith('@')) return `<span class="l">${clean}</span>`;

    return `<span class="f">${clean}</span>`;
  };

  // ==========================================================================
  // 3. CORE LOGIC
  // ==========================================================================
  
  window.renderTerminalWindows = () => {
    trimOutput();
    const rawTerminals = document.querySelectorAll('.auto-term');

    rawTerminals.forEach(term => {
      const rawLines = term.innerText.split('\n');
      
      // Limpeza de fim de arquivo
      while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
        rawLines.pop();
      }

      // Fix Botão Minimizar
      const parentBox = term.closest('.terminal-box');
      if (parentBox) {
        const minBtn = parentBox.querySelector('.btn-min');
        if (minBtn) minBtn.innerText = '−'; 
      }

      let htmlBuffer = '';

      rawLines.forEach(line => {
        if (line.trim() === '' && htmlBuffer === '') return; 

        // DETECTA PROMPT
        const promptMatch = line.match(/^([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+):([^#$]+)([#$])\s*(.*)/);

        if (promptMatch) {
          const [_, user, host, path, symbol, cmd] = promptMatch;
          htmlBuffer += `
            <div>
              <span class="t-user">${user}</span><span class="t-gray">@</span><span class="t-host">${host}</span><span class="t-gray">:</span><span class="t-path">${path.trim()}</span><span class="t-gray">${symbol}</span>
              <span class="t-cmd">${escapeHtml(cmd)}</span>
            </div>`;
        } else {
          // PROCESSA OUTPUT
          const tokens = line.trim().split(/\s+/);
          const shortAvg = (tokens.reduce((a,b) => a + b.length, 0) / tokens.length) < 20;
          const multiple = tokens.length > 1;
          const notSentence = !SENTENCE_INDICATORS.test(line);
          const notDate = !DATE_INDICATORS.test(line);
          const hasCodeChars = /['"=`]/.test(line) || line.trim().startsWith('#!');
          
          // [FIX] Permite item único se estiver na lista de pastas conhecidas (ex: 'ls' retornando só 'www')
          const isSingleKnown = tokens.length === 1 && KNOWN_DIRS.has(tokens[0].replace(/[*\/=>@|]$/, ''));

          // CASO A: Grid de Arquivos
          if (line.trim() !== '' && (multiple || isSingleKnown) && shortAvg && notSentence && notDate && !hasCodeChars) {
            let fileSpans = tokens.map(t => classifyFile(escapeHtml(t))).join('\n'); 
            htmlBuffer += `<div class="t-out t-ls">${fileSpans}</div>`;
          } else {
            // CASO B: Texto Genérico
            let safeContent = line === '' || line.trim() === '' ? '&nbsp;' : escapeHtml(line);
            
            // Highlight de executáveis no meio do texto
            safeContent = safeContent.replace(
                /\b([\w.-]+\.(sh|bash|py|rb|pl|run|bin|appimage))\b/g, 
                '<span class="x">$1</span>'
            );

            htmlBuffer += `<div class="t-out">${safeContent}</div>`;
          }
        }
      });

      if (!term.classList.contains('terminal-body')) {
         term.innerHTML = htmlBuffer;
         term.classList.add('terminal-body'); 
         term.classList.remove('auto-term');
      } else {
         term.innerHTML = htmlBuffer;
      }
    });
  };

  // ==========================================================================
  // 4. INIT
  // ==========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderTerminalWindows);
  } else {
    window.renderTerminalWindows();
  }
});