document.addEventListener("DOMContentLoaded", function() {

  // CONFIG: Base de Conhecimento Unificada
  const KNOWLEDGE_URL = '/assets/data/knowledge.json'; 

  // ESTADO INTERNO (Sets para busca O(1) ultra-rápida)
  let COMMAND_LIST = new Set();
  let ARCH_TERMS = new Set();
  let KNOWN_DIRS = new Set();
  let SYS_FILES = new Set();
  
  let isKnowledgeLoaded = false;

  // --- MODULE: KNOWLEDGE LOADER (Auto-Update / SWR Pattern) ---
  const loadKnowledge = async () => {
    // [UPDATE] Chave nova para forçar recarga da estrutura JSON v2
    const CACHE_KEY = 'term_knowledge_v2'; 

    // 1. FAST RENDER: Tenta carregar cache local instantaneamente
    const cachedString = localStorage.getItem(CACHE_KEY);
    
    if (cachedString) {
      try {
        const data = JSON.parse(cachedString);
        applyDataToState(data);
        console.log("Syntax: Cache v2 carregado. Validando integridade...");
      } catch (e) {
        console.warn("Syntax: Cache corrompido, resetando.");
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // 2. NETWORK UPDATE: Busca a versão mais recente em background
    try {
      const response = await fetch(KNOWLEDGE_URL);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
      const newData = await response.json();
      const newDataString = JSON.stringify(newData);

      // Só atualiza e repinta se houver mudança real
      if (cachedString !== newDataString) {
        console.log("Syntax: Atualização detectada. Re-hidratando...");
        applyDataToState(newData);
        localStorage.setItem(CACHE_KEY, newDataString);
      } else {
        console.log("Syntax: Sistema sincronizado.");
      }

    } catch (err) {
      console.error("Syntax Network Error:", err);
      // Fallback mínimo se não houver cache nem rede
      if (!isKnowledgeLoaded) {
        COMMAND_LIST = new Set(['bash', 'ls', 'cd', 'sudo', 'grep', 'vi', 'nano']); 
        isKnowledgeLoaded = true;
        window.renderBadges();
      }
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
      
      // Flags (-r, --help) - Mantém neutro ou aplica cor se desejar
      if (text.startsWith('-')) {
        return; 
      }

      // Executável Forçado ($comando)
      if (text.startsWith('$') && text.length > 1) {
        code.classList.add('tag', 'x');
        code.innerText = text.substring(1); 
        return;
      }

      // Caminhos Absolutos ou Relativos (/etc, ./script, ~/)
      if (text.startsWith('/') || text.startsWith('./') || text.startsWith('~/') || text.endsWith('/')) {
        code.classList.add('tag', 'd'); // Trata como diretório/caminho (Ciano/Roxo)
        return;
      }

      // --- 2. KNOWLEDGE BASE MATCHING ---

      // A. Comandos (Ciano)
      if (COMMAND_LIST.has(text)) {
        code.classList.add('tag', 'x');
        return;
      }

      // B. Diretórios Conhecidos (Ciano/Roxo) -> ex: "bin", "etc"
      if (KNOWN_DIRS.has(text)) {
        code.classList.add('tag', 'd');
        return;
      }

      // C. Arquivos de Sistema (Roxo Itálico) -> ex: ".bashrc", "passwd"
      if (SYS_FILES.has(text)) {
        code.classList.add('tag', 'f');
        return;
      }

      // D. Arquitetura/Conceitos (Laranja) -> ex: "kernel", "BIOS"
      if (ARCH_TERMS.has(text)) {
        code.classList.add('tag', 'm');
        return;
      }

      // --- 3. REGEX FALLBACKS (Heurísticas Finais) ---

      // Man Pages (ex: regex(7))
      if (/^[a-zA-Z0-9_\-\.]+\(\d\)$/.test(text)) {
        code.classList.add('tag', 'm');
        return;
      }

      // Keystrokes (Vim/Nano shortcuts: :wq, CTRL+C)
      const isSingleCmd = /^(:[a-z!]+|[\/?]|ZZ|gg|G|x|i|a|o)$/i.test(text);
      const isList = text.includes(',') && text.split(',').every(part => part.trim().length <= 6);
      if (isSingleCmd || isList) {
        code.classList.add('tag', 'k'); // Rosa
        return;
      }
      
      // Extensões de Arquivo genéricas (Visual de Arquivo)
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