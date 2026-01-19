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

{%- assign raw_categories = "" -%}
{%- assign all_posts = site.root | where_exp: "item", "item.path contains '_root/linux/'" -%}

{%- for post in all_posts -%}
  {%- assign relative_path = post.path | replace_first: '_root/linux/', '' -%}
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
      {%- assign cat_conn = "└──&nbsp;" -%}
      {%- assign cat_indent = "&nbsp;&nbsp;&nbsp;&nbsp;" -%} 
    {%- else -%}
      {%- assign cat_conn = "├──&nbsp;" -%}
      {%- assign cat_indent = "│&nbsp;&nbsp;&nbsp;" -%}    
    {%- endif -%}

    <div class="t-row">
      <span class="tree-lines">{{ cat_conn }}</span><span class="dir-cat">{{ cat }}</span>
    </div>

    {%- assign target_path = '_root/linux/' | append: cat | append: '/' -%}
    {%- assign cat_posts = site.root | where_exp: "item", "item.path contains target_path" | sort: 'path' -%}
    
    {%- assign raw_subfolders = "" -%}
    {%- assign orphan_count = 0 -%}
    
    {%- for post in cat_posts -%}
      {%- assign relative = post.path | replace_first: target_path, "" -%}
      {%- if relative contains "/" -%}
         {%- assign sub_name = relative | split: "/" | first -%}
         {%- assign raw_subfolders = raw_subfolders | append: sub_name | append: "|||" -%}
      {%- else -%}
         {%- assign orphan_count = orphan_count | plus: 1 -%}
      {%- endif -%}
    {%- endfor -%}

    {%- assign unique_subfolders = raw_subfolders | split: "|||" | uniq | sort -%}
    
    {%- assign total_level2_items = unique_subfolders.size | plus: orphan_count -%}
    {%- assign level2_counter = 0 -%}

    {%- for sub in unique_subfolders -%}
      {%- assign level2_counter = level2_counter | plus: 1 -%}
      
      {%- if level2_counter == total_level2_items -%}
        {%- assign tag_conn = "└──&nbsp;" -%}
        {%- assign tag_child_indent = "&nbsp;&nbsp;&nbsp;&nbsp;" -%}
      {%- else -%}
        {%- assign tag_conn = "├──&nbsp;" -%}
        {%- assign tag_child_indent = "│&nbsp;&nbsp;&nbsp;" -%}
      {%- endif -%}

      <div class="t-row">
        <span class="tree-lines">{{ cat_indent }}{{ tag_conn }}</span><span class="dir-tag">{{ sub }}</span>
      </div>

      {%- assign sub_target = target_path | append: sub | append: '/' -%}
      {%- assign sub_posts = site.root | where_exp: "item", "item.path contains sub_target" | sort: 'title' -%}
      
      {%- for post in sub_posts -%}
        {%- if forloop.last -%}
          {%- assign file_conn = "└──&nbsp;" -%}
        {%- else -%}
          {%- assign file_conn = "├──&nbsp;" -%}
        {%- endif -%}
        
        <div class="t-row">
          <span class="tree-lines">{{ cat_indent }}{{ tag_child_indent }}{{ file_conn }}</span><a href="{{ post.url }}" class="file-link">{{ post.title }}</a>
        </div>
      {%- endfor -%}
    {%- endfor -%}

    {%- for post in cat_posts -%}
      {%- assign relative = post.path | replace_first: target_path, "" -%}
      {%- unless relative contains "/" -%}
        {%- assign level2_counter = level2_counter | plus: 1 -%}
        
        {%- if level2_counter == total_level2_items -%}
           {%- assign orphan_conn = "└──&nbsp;" -%}
        {%- else -%}
           {%- assign orphan_conn = "├──&nbsp;" -%}
        {%- endif -%}

        <div class="t-row">
          <span class="tree-lines">{{ cat_indent }}{{ orphan_conn }}</span><a href="{{ post.url }}" class="file-link">{{ post.title }}</a>
        </div>
      {%- endunless -%}
    {%- endfor -%}

  {%- endunless -%}
{%- endfor -%}

</div>