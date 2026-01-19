---
layout: page
title: linux
permalink: /linux/
hide_footer: true
---

<style>
  /* --- CONFIGURAÇÕES DE TERMINAL --- */
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
  .dir-cat { color: #FF79C6; font-weight: bold; } 
  .dir-tag { color: #BD93F9; font-weight: bold; } 
  
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
    <span class="p-user">root</span><span class="p-at">@</span><span class="p-host">fxlip</span>:<span class="p-path">~/linux</span><span class="p-sign">$</span> tree -L 3
  </div>
  <div class="t-row" style="color: var(--base-color);">.</div>

{%- assign cats = site.root | group_by: "categories" | sort: "name" -%}
{%- for cat in cats -%}
  
  {%- assign raw_name = cat.name | append: "" -%}
  {%- assign clean_cat = raw_name | split: ',' | first -%}
  {%- assign clean_cat = clean_cat | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' | strip -%}
  
  {%- if clean_cat != "" -%}

    {%- if forloop.last -%}
      {%- assign cat_conn = "└──&nbsp;" -%}
      {%- assign cat_indent = "&nbsp;&nbsp;&nbsp;&nbsp;" -%}
    {%- else -%}
      {%- assign cat_conn = "├──&nbsp;" -%}
      {%- assign cat_indent = "│&nbsp;&nbsp;&nbsp;" -%}
    {%- endif -%}

    <div class="t-row">
      <span class="tree-lines">{{ cat_conn }}</span><span class="dir-cat">{{ clean_cat }}</span>
    </div>

    {%- assign tags = cat.items | group_by: "tags" | sort: "name" -%}
    {%- for tag in tags -%}
      {%- assign raw_tag = tag.name | append: "" -%}
      {%- assign clean_tag = raw_tag | split: ',' | first -%}
      {%- assign clean_tag = clean_tag | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' | strip -%}
      
      {%- if forloop.last -%}
        {%- assign tag_conn = "└──&nbsp;" -%}
        {%- assign tag_indent = "&nbsp;&nbsp;&nbsp;&nbsp;" -%}
      {%- else -%}
        {%- assign tag_conn = "├──&nbsp;" -%}
        {%- assign tag_indent = "│&nbsp;&nbsp;&nbsp;" -%}
      {%- endif -%}

      <div class="t-row">
        <span class="tree-lines">{{ cat_indent }}{{ tag_conn }}</span><span class="dir-tag">{{ clean_tag }}</span>
      </div>

      {%- assign files = tag.items | sort: "title" -%}
      {%- for file in files -%}
        {%- if forloop.last -%}
          {%- assign file_conn = "└──&nbsp;" -%}
        {%- else -%}
          {%- assign file_conn = "├──&nbsp;" -%}
        {%- endif -%}

        <div class="t-row">
          <span class="tree-lines">{{ cat_indent }}{{ tag_indent }}{{ file_conn }}</span><a href="https://fxlip.com{{ file.url }}" class="file-link">{{ file.title }}</a>
        </div>

      {%- endfor -%}
    {%- endfor -%}
  {%- endif -%}
{%- endfor -%}

</div>