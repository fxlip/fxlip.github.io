---
layout: page
title: files
permalink: /files
hide_footer: true

# --- CONFIGURAÇÃO DE DIRETÓRIOS ---
directories:
  - id: "estudos"
    desc: "Material de referência e certificações"
  
  - id: "eventos"
    desc: "Slides e conteudos de palestras"
    
  - id: "misc"
    desc: "Arquivos diversos e dumps"
    
  - id: "imgs"
    desc: "Imagens hospedadas para posts"
---

<style>
  /* --- AESTHETICS (Cópia exata do linux.md) --- */
  .terminal-window {
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    color: var(--text-color);
    margin-top: 30px;
    font-size: 14px;
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 80px; 
  }
  .terminal-window::-webkit-scrollbar { display: none; }
  .t-row { display: block; line-height: 1.35; white-space: nowrap; }

  /* --- PALETA DE CORES --- */
  .p-user { color: #FF79C6; font-weight: bold; } 
  .p-at, .p-sign { color: var(--base-color); opacity: 0.7; }
  .p-host { color: #BD93F9; font-weight: bold; } 
  .p-path { color: #D8B4FE; font-style: italic; } 
  .tree-lines { color: var(--base-color); opacity: 0.4; }
  
  /* Cores específicas para Diretórios de Arquivos */
  .dir-folder { color: #F1FA8C; font-weight: bold; } /* Amarelo para Pastas */
  
  .file-link { 
    text-decoration: none !important;
    color: var(--text-color); 
    transition: all 0.2s ease;
  }
  .file-link:hover {
    color: #FFFFFF; 
    background-color: rgba(189, 147, 249, 0.2);
    text-shadow: 0 0 5px rgba(216, 180, 254, 0.5);
  }
</style>

<div class="terminal-window">
  <div class="t-row">
    <span class="p-user">root</span><span class="p-at">@</span><span class="p-host">fxlip</span>:<span class="p-path">~/files</span><span class="p-sign">$</span> tree
  </div>
  <div class="t-row" style="color: var(--base-color);">.</div>

{% for dir in page.directories %}
  
  {% if forloop.last %}
    {% assign dir_conn = "└──&nbsp;" %}
    {% assign dir_indent = "&nbsp;&nbsp;&nbsp;&nbsp;" %}
  {% else %}
    {% assign dir_conn = "├──&nbsp;" %}
    {% assign dir_indent = "│&