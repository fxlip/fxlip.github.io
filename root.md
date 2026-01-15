---
layout: page
title: root
permalink: /root/
---

<style>
  .terminal-window {
    font-family: 'Courier New', monospace;
    color: var(--text-color);
    margin-top: 30px;
    line-height: 1.5;
    /* Garante que espaços e identações sejam respeitados */
    white-space: pre; 
    overflow-x: auto; /* Scroll lateral se a árvore for muito grande */
  }
  
  /* Força cada linha a ser um bloco separado */
  .terminal-line {
    display: block;
    width: 100%;
  }
  
  .prompt { display: inline-block; margin-bottom: 10px; }
  .user { color: #50fa7b; font-weight: bold; } /* Verde */
  .path { color: #8be9fd; font-weight: bold; } /* Azul Ciano */
  
  .dir-category { color: var(--link-hover-color); font-weight: bold; } /* Rosa */
  .dir-tag { color: #bd93f9; font-weight: bold; } /* Roxo */
  
  .file-link a {
    text-decoration: none;
    color: var(--base-color);
  }
  .file-link a:hover {
    color: #fff;
    text-decoration: underline;
  }
</style>

<div class="terminal-window">
  <div class="terminal-line"><span class="user">root@fxlip</span>:<span class="path">~/www</span>$ ls -R</div>
  <div class="terminal-line">.</div>

{% assign cats = site.root | group_by: "categories" | sort: "name" -%}
{% for cat in cats -%}
  {%- assign clean_cat = cat.name | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' -%}
  <div class="terminal-line">├── <span class="dir-category">{{ clean_cat }}</span></div>
  
  {%- assign tags = cat.items | group_by: "tags" | sort: "name" -%}
  {% for tag in tags -%}
    {%- assign clean_tag = tag.name | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' -%}
    <div class="terminal-line">│&nbsp;&nbsp;&nbsp;├── <span class="dir-tag">{{ clean_tag }}</span></div>
    
    {%- assign files = tag.items | sort: "title" -%}
    {% for file in files -%}
      {% if forloop.last -%}
        <div class="terminal-line">│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── <span class="file-link"><a href="{{ file.url }}">{{ file.title }}</a></span></div>
      {% else -%}
        <div class="terminal-line">│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="file-link"><a href="{{ file.url }}">{{ file.title }}</a></span></div>
      {% endif -%}
    {% endfor -%}
  {% endfor -%}
{% endfor %}

  <div class="terminal-line" style="margin-top: 15px;">
    <span class="user">root@fxlip</span>:<span class="path">~/www</span>$ <span class="blink">_</span>
  </div>
</div>