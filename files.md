---
layout: page
title: files
permalink: /files
hide_footer: true
---

<style>
  /* --- AESTHETICS (Clone exato do linux.md) --- */
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
  
  /* HIERARQUIA VISUAL */
  .dir-cat { color: #FF79C6; font-weight: bold; } /* Nível 1: Categoria (img, apresentacao) */
  .dir-tag { color: #BD93F9; font-weight: bold; } /* Nível 2: Tag (evento1) */
  
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
    <span class="p-user">root</span><span class="p-at">@</span><span class="p-host">fxlip</span>:<span class="p-path">~/files</span><span class="p-sign">$</span> tree -L 3
  </div>
  <div class="t-row" style="color: var(--base-color);">.</div>

{%- assign raw_categories = "" -%}
{%- assign all_files = site.static_files | where_exp: "item", "item.path contains '/files/'" -%}

{%- for file in all_files -%}
  {%- assign relative_path = file.path | replace_first: '/files/', '' -%}
  {%- assign parts = relative_path | split: '/' -%}
  {%- if parts.size > 0 -%}
    {%- assign root_folder = parts[0] -%}
    {%- assign raw_categories = raw_categories | append: root_folder | append: "|||" -%}
  {%- endif -%}
{%- endfor -%}

{%- assign unique_categories = raw_categories | split: "|||" | uniq | sort -%}

{%- for cat in unique_categories -%}
  
  {%- unless cat contains "." -%}

    {%- if forloop.last -%}
      {%- assign dir_conn = "└──&nbsp;" -%}
      {%- assign dir_indent = "&nbsp;&nbsp;&nbsp;&nbsp;" -%}
    {%- else -%}
      {%- assign dir_conn = "├──&nbsp;" -%}
      {%- assign dir_indent = "│&nbsp;&nbsp;&nbsp;" -%}
    {%- endif -%}

    <div class="t-row">
      <span class="tree-lines">{{ dir_conn }}</span><span class="dir-cat">{{ cat }}</span>
    </div>

    {%- assign target_path = '/files/' | append: cat | append: '/' -%}
    {%- assign cat_files = site.static_files | where_exp: "item", "item.path contains target_path" | sort: 'path' -%}
    
    {%- assign current_subfolder = "" -%}
    
    {%- for file in cat_files -%}
      
      {%- assign relative = file.path | replace_first: target_path, "" -%}
      {%- assign parts = relative | split: "/" -%}
      
      {%- if parts.size > 1 -%}
        {%- assign is_tagged = true -%}
        {%- assign subfolder = parts[0] -%}
        {%- assign filename = parts | last -%}
      {%- else -%}
        {%- assign is_tagged = false -%}
        {%- assign filename = relative -%}
      {%- endif -%}

      {%- if is_tagged and subfolder != current_subfolder -%}
        {%- assign tag_conn = "├──&nbsp;" -%}
        {%- assign tag_indent = "│&nbsp;&nbsp;&nbsp;" -%} 

        <div class="t-row">
          <span class="tree-lines">{{ dir_indent }}{{ tag_conn }}</span><span class="dir-tag">{{ subfolder }}</span>
        </div>
        {%- assign current_subfolder = subfolder -%}
      {%- endif -%}

      {%- assign file_conn = "├──&nbsp;" -%}
      {%- if forloop.last and is_tagged == false -%}{%- assign file_conn = "└──&nbsp;" -%}{%- endif -%}

      <div class="t-row">
        {%- if is_tagged -%}
          <span class="tree-lines">{{ dir_indent }}{{ tag_indent }}{{ file_conn }}</span>
        {%- else -%}
          <span class="tree-lines">{{ dir_indent }}{{ file_conn }}</span>
        {%- endif -%}
        <a href="{{ file.path }}" target="_blank" class="file-link">{{ filename }}</a>
      </div>

    {%- endfor -%}

  {%- endunless -%}
{%- endfor -%}

</div>