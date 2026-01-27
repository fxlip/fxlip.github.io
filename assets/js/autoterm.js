document.addEventListener("DOMContentLoaded", function() {
  
  // MODULE 1: HTML TRIMMER
  document.querySelectorAll('.t-out').forEach(el => {
    let html = el.innerHTML;
    if (!html.trim()) { el.innerHTML = ""; return; }
    if (html.match(/^\s*\n/)) { html = html.replace(/^\s*\n/, ''); }
    if (html.match(/\n\s*$/)) { html = html.replace(/\n\s*$/, ''); }
    el.innerHTML = html;
  });

  // MODULE 2: AUTO TERMINAL PARSER
  const processTerminals = () => {
    const rawTerminals = document.querySelectorAll('.auto-term');

    // HEURÍSTICAS DE ARQUIVOS
    // [CHANGE] Removido '.git' desta lista para ele cair na regra de ocultos
    const KNOWN_DIRS = new Set([
      'bin', 'boot', 'dev', 'etc', 'home', 'lib', 'lib64', 'media', 'mnt', 'opt', 'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var', 'snap', 'lost+found', 
      'assets', 'img', 'css', 'js', 'node_modules', '_posts', '_site', '_includes', '_layouts',
      'files', 'linux', 'feed', 'about', 'setup', 'shop', 'curadoria', 'lpi1', 'script'
    ]);
    const KNOWN_LINKS = new Set(['vmlinuz', 'initrd.img', 'vmlinuz.old', 'initrd.img.old', 'core']);
    
    // DETECTORES DE TEXTO (Frases e Datas)
    const SENTENCE_INDICATORS = /(?:^|\s)(é|eh|est[áa]|tem|s[ãa]o|um|uma|do|da|de|em|na|no|com|para|por|como|is|are|the|an|of|for|to|with|alias|shell|hash|builtin)(?=\s|$)/i;
    const DATE_INDICATORS = /\b(seg|ter|qua|qui|sex|s[áa]b|dom|mon|tue|wed|thu|fri|sat|sun|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec)\b|\d{1,2}:\d{2}/i;

    const classifyFile = (token) => {
      let clean = token.replace(/[*\/=>@|]$/, ''); 
      
      // 1. Sticky Bit (tmp) - Prioridade Máxima
      if (clean === 'tmp') return `<span class="st">${clean}</span>`;
      
      // 2. [MOVED UP] Ocultos/Dotfiles - Prioridade sobre Pastas Normais
      // Agora .git, .config, .ssh serão Cinza (.h)
      if (clean.startsWith('.')) {
         if (clean === '.' || clean === '..') return `<span class="d">${clean}</span>`; // Navegação continua Azul
         return `<span class="h">${clean}</span>`;
      }
      
      // 3. Diretórios (Conhecidos ou terminados em /)
      if (KNOWN_DIRS.has(clean) || token.endsWith('/')) return `<span class="d">${clean}</span>`;
      
      // 4. Arquivos Especiais
      if (/\.(zip|tar|gz|bz2|xz|7z|rar|jar)$/.test(clean)) return `<span class="z">${clean}</span>`;
      if (/\.(sh|bash|py|rb|pl|run|bin|appimage)$/.test(clean) || token.endsWith('*')) return `<span class="x">${clean}</span>`;
      if (KNOWN_LINKS.has(clean) || token.includes('->') || token.endsWith('@')) return `<span class="l">${clean}</span>`;

      // 5. Arquivo Comum (Default)
      return `<span class="f">${clean}</span>`;
    };

    rawTerminals.forEach(term => {
      const rawLines = term.innerText.split('\n').filter(line => line.trim() !== '');
      let htmlBuffer = '';

      rawLines.forEach(line => {
        const promptMatch = line.match(/^([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+):([^#$]+)([#$])\s*(.*)/);

        if (promptMatch) {
          const [_, user, host, path, symbol, cmd] = promptMatch;
          htmlBuffer += `
            <div>
              <span class="t-user">${user}</span><span class="t-gray">@</span><span class="t-host">${host}</span><span class="t-gray">:</span><span class="t-path">${path.trim()}</span><span class="t-gray">${symbol}</span>
              <span class="t-cmd">${cmd}</span>
            </div>`;
        } else {
          const tokens = line.trim().split(/\s+/);
          const shortAvg = (tokens.reduce((a,b) => a + b.length, 0) / tokens.length) < 20;
          const multiple = tokens.length > 1;
          const notSentence = !SENTENCE_INDICATORS.test(line);
          const notDate = !DATE_INDICATORS.test(line);

          if (multiple && shortAvg && notSentence && notDate) {
            let fileSpans = tokens.map(t => classifyFile(t)).join('\n'); 
            htmlBuffer += `<div class="t-out t-ls">${fileSpans}</div>`;
          } else {
            htmlBuffer += `<div class="t-out">${line}</div>`;
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

  processTerminals();
});