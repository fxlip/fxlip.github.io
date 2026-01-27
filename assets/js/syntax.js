document.addEventListener("DOMContentLoaded", function() {

  // CONFIG: Onde está sua base de conhecimento?
  // Ajuste o caminho se necessário (ex: /assets/data/knowledge.json)
  const KNOWLEDGE_URL = '/assets/data/knowledge.json'; 

  // ESTADO INTERNO (Vazio até carregar)
  let COMMAND_LIST = new Set();
  let ARCH_TERMS = new Set();
  let isKnowledgeLoaded = false;

  // --- MODULE: KNOWLEDGE LOADER (Auto-Update / SWR Pattern) ---
  const loadKnowledge = async () => {
    // Chave única. Não precisa mais mudar versão aqui.
    const CACHE_KEY = 'term_knowledge_live'; 

    // 1. FAST RENDER: Tenta carregar cache imediatamente para não piscar
    const cachedString = localStorage.getItem(CACHE_KEY);
    
    if (cachedString) {
      try {
        const data = JSON.parse(cachedString);
        COMMAND_LIST = new Set(data.commands);
        ARCH_TERMS = new Set(data.architecture);
        isKnowledgeLoaded = true;
        window.renderBadges(); // Pinta a tela com o que já sabe
        console.log("Syntax: Cache visualizado. Verificando atualizações em background...");
      } catch (e) {
        console.warn("Syntax: Cache corrompido, limpando.");
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // 2. NETWORK UPDATE: Busca a verdade atualizada
    try {
      const response = await fetch(KNOWLEDGE_URL);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
      const newData = await response.json();
      const newDataString = JSON.stringify(newData);

      // A Mágica: Só atualiza se houver diferença
      if (cachedString !== newDataString) {
        console.log("Syntax: Nova definição detectada. Atualizando sistema...");
        
        // Atualiza Estado
        COMMAND_LIST = new Set(newData.commands);
        ARCH_TERMS = new Set(newData.architecture);
        isKnowledgeLoaded = true;

        // Atualiza Cache
        localStorage.setItem(CACHE_KEY, newDataString);
        
        // Reprocessa a tela com os novos dados
        window.renderBadges();
      } else {
        console.log("Syntax: Sistema já está na versão mais recente.");
      }

    } catch (err) {
      console.error("Syntax Network Error:", err);
      
      // Fallback de emergência (apenas se não tinha cache nenhum antes)
      if (!isKnowledgeLoaded) {
        COMMAND_LIST = new Set(['bash', 'ls', 'cd', 'sudo', 'grep', 'vi', 'nano']); 
        isKnowledgeLoaded = true;
        window.renderBadges();
      }
    }
  };

  // --- CORE: BADGE STYLER (O Motor Lógico) ---
  window.renderBadges = () => {
    // Se os dados ainda não chegaram, espera. A função loadKnowledge chamará isso de novo.
    if (!isKnowledgeLoaded) return; 

    const codeBlocks = document.querySelectorAll('p code, li code, td code, th code');
    
    codeBlocks.forEach(code => {
      if (code.classList.contains('tag') || code.closest('.terminal-box')) return;

      let text = code.innerText.trim();
      code.classList.remove('language-plaintext', 'highlighter-rouge');

      // 1. FORÇAR EXECUTÁVEL ($)
      if (text.startsWith('$') && text.length > 1) {
        code.classList.add('tag', 'x');
        code.innerText = text.substring(1); 
        return;
      }

      // 2. DIRETÓRIOS (/)
      if (text.startsWith('/') || text.endsWith('/')) {
        code.classList.add('tag', 'd');
        return;
      }
      
      // 3. MAN PAGES (regex(7)) -> .tag.m (Laranja)
      if (/^[a-zA-Z0-9_\-\.]+\(\d\)$/.test(text)) {
        code.classList.add('tag', 'm');
        return;
      }

      // 4. ARQUITETURA (Do JSON) -> .tag.m (Laranja)
      if (ARCH_TERMS.has(text)) {
        code.classList.add('tag', 'm');
        return;
      }

      // 5. KEYSTROKES (RegEx Hardcoded - não compensa por no JSON pela complexidade)
      const isSingleCmd = /^(:[a-z!]+|[\/?]|ZZ|gg|G|x|i|a|o)$/i.test(text);
      const isList = text.includes(',') && text.split(',').every(part => part.trim().length <= 6);

      if (isSingleCmd || isList) {
        code.classList.add('tag', 'k');
        return;
      }

      // 6. COMANDOS (Do JSON) -> .tag.x (Amarelo)
      if (COMMAND_LIST.has(text)) {
        code.classList.add('tag', 'x');
        return;
      }
      
      // 7. ARQUIVOS (Extensões)
      if (/\.(conf|cfg|ini|txt|md|yml|yaml|xml|html|css|js|json|sh|py|rb|lock|gemspec|list|lst|log)$/.test(text) || text.startsWith('.')) {
        code.classList.add('tag', 'f');
        return;
      }
      
      // Fallback: Ghost Protocol
      code.classList.add('tag');
    });
  };

  // Inicializa o processo
  loadKnowledge();

  // --- ORCHESTRATOR ---
  window.reprocessTerminal = function() {
      if (window.renderTerminalWindows) window.renderTerminalWindows();
      // Apenas chama renderBadges se o conhecimento já estiver carregado
      // Se não estiver, o loadKnowledge chamará sozinho quando terminar
      if (isKnowledgeLoaded && window.renderBadges) window.renderBadges();
  };
});