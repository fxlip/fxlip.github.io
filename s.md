---
layout: page
title: "grep"
permalink: /s
hide_header: true
hide_footer: true
---

<style>
#search-input {
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  color: var(--link-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: inherit;
  width: 0;
  min-width: 2px;
  caret-color: var(--link-color);
  caret-shape: block;
  vertical-align: baseline;
}
.grep-result { word-break: break-all; margin: 1px 0; }
</style>

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <div class="win-btn btn-min" title="Minimize">−</div>
      <div class="win-btn btn-close" title="Close">✕</div>
    </div>
  </div>

  <div class="terminal-body">
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/busca</span><span class="t-gray">$</span> <span class="t-cmd">grep -h && cat dog.txt</span>
    </div>
    <div class="t-out"><span class="t-gray">Uso: grep -r "alguma coisa"
Filtra por comandos, funções, variáveis e caminhos.
<< @feed @linux
</span></div>
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/busca</span><span class="t-gray">$</span> <span class="t-cmd">grep -r "</span><input id="search-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" size="1"><span class="t-cmd">" ~/linux/**</span>
    </div>
    <div id="grep-output" class="t-out" data-mentions-processed="true" data-no-trim></div>
  </div>
</div>

{%- assign linux_docs = site.documents | where_exp: "d", "d.url contains '/linux/'" -%}
{%- assign all_pairs = "" -%}
{%- for doc in linux_docs -%}
  {%- assign code_parts = doc.content | split: "<code" -%}
  {%- for code_part in code_parts -%}
    {%- if forloop.index0 > 0 -%}
      {%- assign after_open = code_part | split: ">" | slice: 1, 1 | first -%}
      {%- assign cmd_raw = after_open | split: "<" | first | strip | downcase -%}
      {%- if cmd_raw | slice: 0 == "#" -%}{%- assign cmd_raw = cmd_raw | slice: 1, 100 -%}{%- endif -%}
      {%- if cmd_raw.size > 0 and cmd_raw.size < 60 -%}
        {%- assign pair = cmd_raw | append: "¦" | append: doc.url | append: "¦" | append: doc.title -%}
        {%- assign all_pairs = all_pairs | append: pair | append: "¶" -%}
      {%- endif -%}
    {%- endif -%}
  {%- endfor -%}
{%- endfor -%}
{%- assign unique_pairs = all_pairs | split: "¶" | uniq -%}

<script>
const SEARCH_INDEX=[{% for pair in unique_pairs %}{% if pair != "" %}{%- assign ep = pair | split: "¦" -%}{"c":{{ ep[0] | jsonify }},"u":{{ ep[1] | jsonify }},"t":{{ ep[2] | jsonify }}},{% endif %}{% endfor %}];

document.addEventListener('DOMContentLoaded', function(){
  const input  = document.getElementById('search-input');
  const output = document.getElementById('grep-output');
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Classifica um token do índice em uma das 7 categorias
  function classify(c){
    const k    = window.__knowledge || {};
    const cmds = k.commands instanceof Set ? k.commands : new Set();
    const base = c.split(/\s+/)[0];
    if(c.startsWith('$'))                                     return 'var';
    if(/^[\/~]/.test(c))                                      return 'path';
    if(/^\.[a-zA-Z]/.test(c) && !c.includes(' '))            return 'file'; // dotfiles
    if(/[*+?^[\](){}|\\]/.test(c))                           return 'regex';
    if(/^[\w.-]+\.[a-z]{2,5}$/.test(c) && !c.includes(' ')) return 'file';
    if(cmds.has(base))                                        return 'cmd';
    if(c.startsWith('-'))                                     return 'flag';
    return 'concept';
  }

  const TYPE_CLR = {
    cmd:    'var(--accent-cyan)',       // cyan    — comandos     (= code.c-cmd, .d)
    flag:   'var(--yellow)',            // amarelo — opções       (= .x executáveis)
    var:    '#ffb86c',                  // laranja — variáveis    (= code.c-var, .z)
    path:   'var(--link-hover-color)', // roxo    — caminhos     (= code.c-path, .l)
    file:   '#f8f8f2',                  // branco  — arquivos     (= .f)
    regex:  'var(--link-color)',        // rosa    — regex        (= code.c-op)
    concept:'var(--muted-color)',       // cinza   — conceitos
  };

  // Estado da animação whatis
  let _wTimer1 = null, _wTimer2 = null, _wInterval = null;

  function cancelWhatisAnimation(){
    clearTimeout(_wTimer1);
    clearTimeout(_wTimer2);
    clearInterval(_wInterval);
    _wTimer1 = _wTimer2 = _wInterval = null;
    const old = document.getElementById('whatis-block');
    if(old) old.remove();
  }

  function showPromptBlock(){
    cancelWhatisAnimation();
    const block = document.createElement('div');
    block.id = 'whatis-block';
    block.style.marginTop = '0';
    block.innerHTML =
      `<div id="w-prompt"><span class="t-user">fxlip</span><span class="t-gray">@</span>` +
      `<span class="t-host">www</span><span class="t-gray">:</span>` +
      `<span class="t-path">~/busca</span><span class="t-gray">$</span> ` +
      `<span class="t-cmd" id="w-cmd"></span></div>`;
    output.after(block);
    return block;
  }

  function animateWhatis(q, desc){
    const block = showPromptBlock();

    // Após 2s, digita "whatis [cmd]"
    _wTimer1 = setTimeout(() => {
      const cmdEl = document.getElementById('w-cmd');
      if(!cmdEl) return;
      const full = `whatis ${q}`;
      let i = 0;
      _wInterval = setInterval(() => {
        if(!document.getElementById('w-cmd')){ clearInterval(_wInterval); return; }
        cmdEl.textContent = full.slice(0, ++i);
        if(i >= full.length){
          clearInterval(_wInterval);
          // Exibe output após 1s de delay
          _wTimer2 = setTimeout(() => {
            const out = document.createElement('div');
            out.className = 't-out';
            out.innerHTML = `<span class="t-gray">${esc(q)} (1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- ${esc(desc)}</span>`;
            block.appendChild(out);
          }, 1000);
        }
      }, 70);
    }, 1000);
  }

  function doSearch(query, push=false){
    cancelWhatisAnimation();
    const q = query.trim().toLowerCase();
    if(!q){ output.innerHTML = ''; return; }

    if(push) history.pushState(null,'','/s?='+encodeURIComponent(q));

    // Corresponde ao texto completo OU ao comando-base (ls encontra ls -l)
    const matches = SEARCH_INDEX.filter(e => {
      const base = e.c.split(/\s+/)[0];
      return e.c.includes(q) || base === q;
    });
    const byPage  = {};
    matches.forEach(e => {
      if(!byPage[e.u]) byPage[e.u] = {url:e.u, title:e.t, cmds:new Set()};
      byPage[e.u].cmds.add(e.c);
    });

    const pages = Object.values(byPage);

    if(!pages.length){
      output.innerHTML = `<span class="t-gray">grep: sem resultados para </span><span style="color:var(--link-color)">"${esc(q)}"</span>`;
      return;
    }

    let html = '';
    pages.sort((a,b) => a.url.localeCompare(b.url)).forEach(p => {
      const path = p.url.replace('/linux/','./' );
      const cmds = [...p.cmds].sort().map(c => {
        const t = classify(c);
        return `<span style="color:${TYPE_CLR[t]}" title="${t}">\`${esc(c)}\`</span>`;
      }).join(' ');
      html += `<div class="grep-result"><a href="${esc(p.url)}" class="file-link grep-file">${esc(path)}</a><span class="t-gray">: </span>${cmds}</div>`;
    });

    const n = pages.length;
    html += `\n<span class="t-gray">${n} arquivo${n!==1?'s':''} com resultados para </span><span style="color:var(--link-color)">"${esc(q)}"</span>`;

    output.innerHTML = html;

    // Prompt sempre visível quando há resultados; digita whatis só se for comando conhecido
    // Se knowledge ainda não carregou, adia para __knowledgePromise.then()
    if(window.__knowledge){
      const wk = window.__knowledge.whatis;
      const desc = wk[q] || (q.startsWith('$') ? wk[q.slice(1)] : null);
      if(desc) animateWhatis(q, desc);
      else showPromptBlock();
    }
  }

  input.addEventListener('input', function(){
    this.style.width = this.value.length ? this.value.length+'ch' : '0';
    doSearch(this.value);
  });

  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'){
      cancelWhatisAnimation();
      input.value=''; input.style.width='0';
      output.innerHTML='';
      history.pushState(null,'','/s');
      input.focus();
      return;
    }
    if(e.key==='Enter'){ doSearch(input.value, true); return; }
    if(!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== input){
      input.focus();
    }
  });

  document.addEventListener('click', function(e){
    if(!e.target.closest('a')) input.focus();
  });

  const qs  = location.search.startsWith('?') ? location.search.slice(1) : '';
  const q0  = new URLSearchParams(qs).get('') || '';
  if(q0){
    input.value=q0; input.style.width=q0.length+'ch';
    doSearch(q0);
    // Se knowledge ainda não carregou, busca e re-executa o doSearch com dados completos
    // (garante classify() correto e whatis)
    if(!window.__knowledge){
      fetch('/assets/data/knowledge.json')
        .then(r => r.json())
        .then(data => {
          if(!window.__knowledge){
            window.__knowledge = {
              commands: new Set(data.commands || []),
              whatis:   data.whatis || {},
              dirs:     new Set(data.directories || []),
              files:    new Set(data.system_files || []),
              vars:     new Set(data.variables || [])
            };
          }
          doSearch(q0);
        })
        .catch(() => {});
    }
  }
  input.focus();
});
</script>