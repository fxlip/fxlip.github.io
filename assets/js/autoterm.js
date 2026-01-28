document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 1. CONSTANTES & HEURÍSTICAS
  // ==========================================================================
  
  const KNOWN_DIRS = new Set([
    'bin', 'boot', 'dev', 'etc', 'home', 'lib', 'lib64', 'media', 'mnt', 'opt', 
    'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var', 'snap', 
    'lost+found', 'assets', 'img', 'css', 'js', 'node_modules', '_posts', 
    '_site', '_includes', '_layouts', 'files', 'linux', 'feed', 'about', 
    'setup', 'shop', 'curadoria', 'lpi1', 'www', 'script'
  ]);
  
  const KNOWN_LINKS = new Set([
    'vmlinuz', 'initrd.img', 'vmlinuz.old', 'initrd.img.old', 'core'
  ]);
  
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
  // 3. CORE LOGIC: STATE-AWARE PARSER
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
      let lastCmd = ''; // [NEW] Rastreador de Estado do Comando

      rawLines.forEach(line => {
        if (line.trim() === '' && htmlBuffer === '') return; 

        // --- DETECÇÃO DE PROMPT ---
        const promptMatch = line.match(/^([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+):([^#$]+)([#$])\s*(.*)/);

        if (promptMatch) {
          const [_, user, host, path, symbol, cmd] = promptMatch;
          
          // Atualiza o estado para a próxima linha de output saber o que fazer
          lastCmd = cmd.trim();

          htmlBuffer += `
            <div>
              <span class="t-user">${user}</span><span class="t-gray">@</span><span class="t-host">${host}</span><span class="t-gray">:</span><span class="t-path">${path.trim()}</span><span class="t-gray">${symbol}</span>
              <span class="t-cmd">${escapeHtml(cmd)}</span>
            </div>`;
        } else {
          // --- PROCESSAMENTO DE OUTPUT (BASEADO NO COMANDO ANTERIOR) ---
          
          // ESTADO 1: COMANDO HISTORY
          // Formato esperado: "  123  comando"
          if (lastCmd.startsWith('history')) {
            const histMatch = line.match(/^\s*(\d+)(\s+)(.*)/);
            if (histMatch) {
              const [_, id, space, cmdContent] = histMatch;
              // Pinta o ID de cinza (.t-gray) e mantém o espaçamento original
              htmlBuffer += `<div class="t-out"><span class="t-gray">${id}</span>${space.replace(/ /g, '&nbsp;')}${escapeHtml(cmdContent)}</div>`;
              return;
            }
          }

          // ESTADO 2: COMANDO LS (Grid View)
          // Só ativa o grid se o comando for explicitamente 'ls'
          const tokens = line.trim().split(/\s+/);
          if (lastCmd.startsWith('ls') && tokens.length > 0) {
             // Verificações de segurança para não gridar erros ou frases
             const shortAvg = (tokens.reduce((a,b) => a + b.length, 0) / tokens.length) < 20;
             const hasCodeChars = /['"=`]/.test(line); // Aspas indicam texto, não arquivo
             
             // Se passou no filtro, renderiza como Grid de Arquivos
             if (shortAvg && !hasCodeChars) {
                let fileSpans = tokens.map(t => classifyFile(escapeHtml(t))).join('\n'); 
                htmlBuffer += `<div class="t-out t-ls">${fileSpans}</div>`;
                return;
             }
          }

          // ESTADO 3: TEXTO GENÉRICO (Padrão / cat / man / echo)
          // Mantém o comportamento original, mas sem tentar forçar grid
          let safeContent = line === '' || line.trim() === '' ? '&nbsp;' : escapeHtml(line);
          
          // Highlight de executáveis no meio do texto
          safeContent = safeContent.replace(
              /\b([\w.-]+\.(sh|bash|py|rb|pl|run|bin|appimage))\b/g, 
              '<span class="x">$1</span>'
          );

          htmlBuffer += `<div class="t-out">${safeContent}</div>`;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderTerminalWindows);
  } else {
    window.renderTerminalWindows();
  }
});