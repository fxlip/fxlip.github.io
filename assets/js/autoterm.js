document.addEventListener("DOMContentLoaded", function() {

  // ==========================================================================
  // 1. CONSTANTES & HEURÍSTICAS
  // ==========================================================================
  
  // Diretórios conhecidos para colorir output do comando 'ls' (Azul/Ciano)
  const KNOWN_DIRS = new Set([
    'bin', 'boot', 'dev', 'etc', 'home', 'lib', 'lib64', 'media', 'mnt', 'opt', 
    'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var', 'snap', 
    'lost+found', 'assets', 'img', 'css', 'js', 'node_modules', '_posts', 
    '_site', '_includes', '_layouts', 'files', 'linux', 'feed', 'about', 
    'setup', 'shop', 'curadoria', 'lpi1', 'www', 'script'
  ]);
  
  // Links simbólicos e arquivos de sistema (Roxo/Cinza)
  const KNOWN_LINKS = new Set([
    'vmlinuz', 'initrd.img', 'vmlinuz.old', 'initrd.img.old', 'core'
  ]);
  
  // Regex para detectar frases e datas (evita que texto comum vire grid de 'ls')
  const SENTENCE_INDICATORS = /(?:^|\s)(é|eh|est[áa]|tem|s[ãa]o|um|uma|do|da|de|em|na|no|com|para|por|como|is|are|the|an|of|for|to|with|alias|shell|hash|builtin)(?=\s|$)/i;
  const DATE_INDICATORS = /\b(seg|ter|qua|qui|sex|s[áa]b|dom|mon|tue|wed|thu|fri|sat|sun|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec)\b|\d{1,2}:\d{2}/i;

  // ==========================================================================
  // 2. FUNÇÕES AUXILIARES (HELPERS)
  // ==========================================================================

  // Limpa espaços extras no HTML bruto antes do parsing
  const trimOutput = () => {
    document.querySelectorAll('.t-out').forEach(el => {
      let html = el.innerHTML;
      if (!html.trim()) { el.innerHTML = ""; return; }
      // Remove quebras de linha apenas no início e fim absoluto
      html = html.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
      el.innerHTML = html;
    });
  };

  // Sanitiza caracteres especiais para evitar injeção ou quebra de HTML
  const escapeHtml = (text) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Classifica arquivos para coloração (ls style)
  const classifyFile = (token) => {
    let clean = token.replace(/[*\/=>@|]$/, ''); 
    
    if (clean === 'tmp') return `<span class="st">${clean}</span>`; // Sticky bit
    
    if (clean.startsWith('.')) { // Ocultos
       if (clean === '.' || clean === '..') return `<span class="d">${clean}</span>`;
       return `<span class="h">${clean}</span>`;
    }
    
    if (KNOWN_DIRS.has(clean) || token.endsWith('/')) return `<span class="d">${clean}</span>`;
    if (/\.(zip|tar|gz|bz2|xz|7z|rar|jar)$/.test(clean)) return `<span class="z">${clean}</span>`;
    if (/\.(sh|bash|py|rb|pl|run|bin|appimage)$/.test(clean) || token.endsWith('*')) return `<span class="x">${clean}</span>`;
    if (KNOWN_LINKS.has(clean) || token.includes('->') || token.endsWith('@')) return `<span class="l">${clean}</span>`;

    return `<span class="f">${clean}</span>`; // Arquivo comum
  };

  // ==========================================================================
  // 3. CORE LOGIC: TERMINAL PARSER
  // ==========================================================================
  
  window.renderTerminalWindows = () => {
    trimOutput();
    const rawTerminals = document.querySelectorAll('.auto-term');

    rawTerminals.forEach(term => {
      // 3.1. Preparação
      const rawLines = term.innerText.split('\n');
      
      // [FIX] Limpeza de Linhas Vazias no Final (Trailing Newlines)
      // Garante que o terminal não tenha um "buraco" vazio no rodapé
      while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
        rawLines.pop();
      }

      // [FIX] Normalização do Botão Minimizar ('_' -> '−')
      // Garante alinhamento perfeito com Flexbox, substituindo o underscore pelo sinal matemático
      const parentBox = term.closest('.terminal-box');
      if (parentBox) {
        const minBtn = parentBox.querySelector('.btn-min');
        if (minBtn) minBtn.innerText = '−'; 
      }

      let htmlBuffer = '';

      // 3.2. Processamento Linha a Linha
      rawLines.forEach(line => {
        // Ignora linhas vazias no topo se o buffer estiver vazio
        if (line.trim() === '' && htmlBuffer === '') return; 

        // DETECTA PROMPT: user@host:path$ comando
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
          // Estatísticas da linha para heurística
          const shortAvg = (tokens.reduce((a,b) => a + b.length, 0) / tokens.length) < 20;
          const multiple = tokens.length > 1;
          const notSentence = !SENTENCE_INDICATORS.test(line);
          const notDate = !DATE_INDICATORS.test(line);
          // Se tem aspas ou shebang, é código, não lista de arquivos
          const hasCodeChars = /['"=`]/.test(line) || line.trim().startsWith('#!');

          // CASO A: Grid de Arquivos (estilo 'ls')
          // Condições estritas para não quebrar textos normais
          if (line.trim() !== '' && multiple && shortAvg && notSentence && notDate && !hasCodeChars) {
            let fileSpans = tokens.map(t => classifyFile(escapeHtml(t))).join('\n'); 
            htmlBuffer += `<div class="t-out t-ls">${fileSpans}</div>`;
          } else {
            // CASO B: Texto Genérico ou Código
            // Se linha vazia, usa &nbsp; para manter a altura
            let safeContent = line === '' || line.trim() === '' ? '&nbsp;' : escapeHtml(line);
            
            // [HIGHLIGHT] Realça executáveis (.sh, .py) dentro de textos comuns (ex: ls -l)
            safeContent = safeContent.replace(
                /\b([\w.-]+\.(sh|bash|py|rb|pl|run|bin|appimage))\b/g, 
                '<span class="x">$1</span>'
            );

            htmlBuffer += `<div class="t-out">${safeContent}</div>`;
          }
        }
      });

      // 3.3. Renderização Final
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
  // 4. INICIALIZAÇÃO
  // ==========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderTerminalWindows);
  } else {
    window.renderTerminalWindows();
  }
});