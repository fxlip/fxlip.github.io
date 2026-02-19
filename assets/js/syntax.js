document.addEventListener("DOMContentLoaded", function() {

  // ESTADO INTERNO (Sets para busca O(1) ultra-rápida)
  let COMMAND_LIST = new Set();
  let ARCH_TERMS = new Set();
  let KNOWN_DIRS = new Set();
  let SYS_FILES = new Set();

  let isKnowledgeLoaded = false;

  // --- MODULE: KNOWLEDGE LOADER (Consome dados do autoterm.js — zero fetch extra) ---
  const loadKnowledge = async () => {
    const CACHE_KEY = 'term_knowledge_v2';

    // 1. FAST RENDER: Cache local para pintura instantânea
    try {
      const cachedString = localStorage.getItem(CACHE_KEY);
      if (cachedString) {
        const data = JSON.parse(cachedString);
        applyDataToState(data);
      }
    } catch (e) {
      // Cache indisponível ou corrompido — segue sem
    }

    // 2. NETWORK UPDATE: Aguarda o fetch único feito pelo autoterm.js
    if (window.__knowledgePromise) {
      try {
        const newData = await window.__knowledgePromise;
        if (newData) {
          applyDataToState(newData);
        }
      } catch (err) {
        // autoterm.js já logou o erro
      }
    }

    // 3. Fallback se nada funcionou
    if (!isKnowledgeLoaded) {
      COMMAND_LIST = new Set(['bash', 'ls', 'cd', 'sudo', 'grep', 'vi', 'nano']);
      isKnowledgeLoaded = true;
      window.renderBadges();
    }
  };

  // Helper para distribuir dados nos Sets e pintar
  const applyDataToState = (data) => {
    if (data.commands) COMMAND_LIST = new Set(data.commands);
    if (data.architecture) ARCH_TERMS = new Set(data.architecture);
    if (data.directories) KNOWN_DIRS = new Set(data.directories);
    if (data.system_files) SYS_FILES = new Set(data.system_files);
    
    isKnowledgeLoaded = true;
    window.renderBadges(); // Dispara a pintura global
  };

  // --- CORE: BADGE STYLER (O Motor Lógico) ---
  // Aceita 'context' para funcionar com Infinite Scroll do main.js
  window.renderBadges = (context = document) => {
    if (!isKnowledgeLoaded) return; 

    // Seleciona códigos inline fora do terminal
    const codeBlocks = context.querySelectorAll('p code, li code, td code, th code, .post-content code');
    
    codeBlocks.forEach(code => {
      // Ignora se já foi processado ou está dentro de um terminal/pre
      if (code.classList.contains('tag') || code.closest('.terminal-box') || code.parentElement.tagName === 'PRE') return;

      let text = code.innerText.trim();
      
      // Limpeza de classes legadas do Jekyll
      code.classList.remove('language-plaintext', 'highlighter-rouge');

      // --- 1. HIGHEST PRIORITY: HARD SYNTAX ---

      // Variáveis de shell ($HOME, $PATH, $?, $1...) — Laranja
      if (text.startsWith('$')) {
        code.classList.add('tag', 'm');
        return;
      }

      // Flags/opções (-r, --help) — Amarelo
      if (text.startsWith('-')) {
        code.classList.add('c-flag');
        return;
      }

      // Caminhos Absolutos ou Relativos (/etc, ./script, ~/) — Roxo
      if (text.startsWith('/') || text.startsWith('./') || text.startsWith('~/') || text.endsWith('/')) {
        code.classList.add('tag', 'f'); // roxo itálico (= code.c-path)
        return;
      }

      // Keystrokes tipo [CTRL+X], [CTRL+B] + [C] — detecta ANTES do regex
      if (/^\[.+?\](\s*\+\s*\[.+?\])*$/.test(text)) {
        code.classList.add('c-key');
        return;
      }

      // Expressões Regulares (contém metacaracteres regex) — Rosa
      if (/[*+?^$[\](){}|\\]/.test(text) && text.length > 1) {
        code.classList.add('tag', 'k'); // Rosa (= code.c-op)
        return;
      }

      // --- 2. KNOWLEDGE BASE MATCHING ---

      // A. Comandos exatos (Ciano)
      if (COMMAND_LIST.has(text)) {
        code.classList.add('tag', 'x');
        return;
      }

      // B. Comandos com flags: extrai a base e verifica ("ls -l" → "ls")
      const baseCmd = text.split(/\s+/)[0];
      if (COMMAND_LIST.has(baseCmd) && baseCmd !== text) {
        code.classList.add('tag', 'x');
        return;
      }

      // C. Diretórios Conhecidos (Ciano) -> ex: "bin", "etc"
      if (KNOWN_DIRS.has(text)) {
        code.classList.add('tag', 'd');
        return;
      }

      // D. Arquivos de Sistema (Roxo Itálico) -> ex: ".bashrc", "passwd"
      if (SYS_FILES.has(text)) {
        code.classList.add('tag', 'f');
        return;
      }

      // E. Arquitetura/Conceitos (Laranja) -> ex: "kernel", "BIOS"
      if (ARCH_TERMS.has(text)) {
        code.classList.add('tag', 'm');
        return;
      }

      // --- 3. REGEX FALLBACKS (Heurísticas Finais) ---

      // Man Pages (ex: grep(1), regex(7))
      if (/^[a-zA-Z0-9_\-\.]+\(\d\)$/.test(text)) {
        code.classList.add('tag', 'm');
        return;
      }

      // Keystrokes (Vim/Nano: :wq, ZZ, h/j/k/l, i/o/a combos)
      const isSingleCmd = /^(:[a-z!]+|[\/?]|ZZ|gg|G|x|i|a|o)$/i.test(text);
      const isList = text.includes(',') && text.split(',').every(part => part.trim().length <= 6);
      if (isSingleCmd || isList) {
        code.classList.add('c-key');
        return;
      }

      // Extensões de Arquivo genéricas (Roxo Itálico)
      if (/\.(conf|cfg|ini|txt|md|yml|yaml|xml|html|css|js|json|sh|py|rb|lock|gemspec|list|lst|log|sql|db)$/.test(text) || text.startsWith('.')) {
        code.classList.add('tag', 'f');
        return;
      }

      // Fallback: Default Ghost (apenas borda, sem cor forte)
      code.classList.add('tag');
    });
  };

  // Inicializa
  loadKnowledge();

  // --- ORCHESTRATOR & ALIASES ---
  
  // Alias para manter compatibilidade com o main.js antigo
  window.highlightInlineCode = window.renderBadges;

  // Função global de reprocessamento (se necessário chamar manualmente)
  window.reprocessTerminal = function() {
      if (window.renderTerminalWindows) window.renderTerminalWindows();
      if (isKnowledgeLoaded) window.renderBadges();
  };
});