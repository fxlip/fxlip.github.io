---
layout: page
title: root
permalink: /root/
---

<style>
  .terminal-window {
    font-family: 'Courier New', Courier, monospace;
    color: var(--text-color);
    margin-top: 30px;
    line-height: 1.2; /* Aperta a altura para as linhas se tocarem */
    white-space: pre; /* Respeita espaços rigorosamente */
    overflow-x: auto;
    font-size: 14px;
  }
  
  /* Cores baseadas no seu tema */
  .prompt-user { color: #50fa7b; font-weight: bold; } /* Verde Terminal */
  .prompt-path { color: #8be9fd; font-weight: bold; } /* Azul Terminal */
  .tree-lines  { color: var(--base-color); opacity: 0.7; }
  
  /* Pastas em Rosa (Sua cor de destaque) */
  .dir-name    { color: var(--link-hover-color); font-weight: bold; }
  
  /* Arquivos na cor de texto padrão, hover em rosa */
  .file-name   { color: var(--text-color); text-decoration: none; }
  .file-name:hover { color: var(--link-hover-color); text-decoration: underline; }
</style>

<div class="terminal-window">
<span class="prompt-user">root@fxlip</span>:<span class="prompt-path">~/www</span>$ tree
<span class="dir-name">.</span>
{% assign cats = site.root | group_by: "categories" | sort: "name" -%}
{% for cat in cats -%}
  {%- assign cat_clean = cat.name | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' -%}
  {%- if forloop.last -%}
    {%- assign cat_conn = "└── " -%}
    {%- assign cat_indent = "    " -%}
  {%- else -%}
    {%- assign cat_conn = "├── " -%}
    {%- assign cat_indent = "│   " -%}
  {%- endif -%}
<span class="tree-lines">{{ cat_conn }}</span><span class="dir-name">{{ cat_clean }}</span>
  {%- assign tags = cat.items | group_by: "tags" | sort: "name" -%}
  {% for tag in tags -%}
    {%- assign tag_clean = tag.name | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' -%}
    {%- if forloop.last -%}
      {%- assign tag_conn = "└── " -%}
      {%- assign tag_indent = "    " -%}
    {%- else -%}
      {%- assign tag_conn = "├── " -%}
      {%- assign tag_indent = "│   " -%}
    {%- endif -%}
<span class="tree-lines">{{ cat_indent }}{{ tag_conn }}</span><span class="dir-name">{{ tag_clean }}</span>
    {%- assign files = tag.items | sort: "title" -%}
    {% for file in files -%}
      {%- if forloop.last -%}
        {%- assign file_conn = "└── " -%}
      {%- else -%}
        {%- assign file_conn = "├── " -%}
      {%- endif -%}
<span class="tree-lines">{{ cat_indent }}{{ tag_indent }}{{ file_conn }}</span><a href="{{ file.url }}" class="file-name">{{ file.title }}</a>
    {% endfor -%}
  {% endfor -%}
{% endfor %}
<div style="margin-top: 10px;"><span class="prompt-user">root@fxlip</span>:<span class="prompt-path">~/www</span>$ <span class="blink">_</span></div>
</div>