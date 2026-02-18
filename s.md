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
    <div class="t-out" style="margin-bottom:.6em"><span class="t-gray">Uso: grep -r "alguma coisa"
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

  function doSearch(query, push=false){
    const q = query.trim().toLowerCase();
    if(!q){ output.innerHTML = ''; return; }

    if(push) history.pushState(null,'','/s?='+encodeURIComponent(q));

    const matches = SEARCH_INDEX.filter(e => e.c.includes(q));
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
      const cmds = [...p.cmds].sort().map(c => '`'+esc(c)+'`').join('  ');
      html += `<div class="grep-result"><a href="${esc(p.url)}" class="file-link grep-file">${esc(path)}</a><span class="t-gray">: </span><span style="color:var(--accent-cyan)">${cmds}</span></div>`;
    });

    const n = pages.length;
    html += `\n<span class="t-gray">${n} arquivo${n!==1?'s':''} com resultados para </span><span style="color:var(--link-color)">"${esc(q)}"</span>`;
    output.innerHTML = html;
  }

  input.addEventListener('input', function(){
    this.style.width = this.value.length ? this.value.length+'ch' : '0';
    doSearch(this.value);
  });

  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'){
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
  if(q0){ input.value=q0; input.style.width=q0.length+'ch'; doSearch(q0); }
  input.focus();
});
</script>