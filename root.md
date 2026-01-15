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
    white-space: pre; /* Garante que os espaços do desenho ASCII fiquem perfeitos */
  }
  
  .prompt { display: inline-block; margin-bottom: 10px; }
  .user { color: #50fa7b; font-weight: bold; } /* Verde */
  .path { color: #8be9fd; font-weight: bold; } /* Azul Ciano */
  
  .dir-category { color: var(--link-hover-color); font-weight: bold; } /* Rosa */
  .dir-tag { color: #bd93f9; font-weight: bold; } /* Roxo */
  
  /* Link do arquivo final */
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
  <div class="prompt"><span class="user">root@fxlip</span>:<span class="path">~/www</span>$ ls -R</div>
.<br>
{% assign cats = site.root | group_by: "categories" | sort: "name" -%}
{% for cat in cats -%}
  {%- assign clean_cat = cat.name | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' -%}
├── <span class="dir-category">{{ clean_cat }}</span>
  {%- assign tags = cat.items | group_by: "tags" | sort: "name" -%}
  {% for tag in tags -%}
    {%- assign clean_tag = tag.name | replace: '["', '' | replace: '"]', '' | replace: '"', '' | replace: '[', '' | replace: ']', '' -%}
│   ├── <span class="dir-tag">{{ clean_tag }}</span>
    {%- assign files = tag.items | sort: "title" -%}
    {% for file in files -%}
      {% if forloop.last -%}
│   │   └── <span class="file-link"><a href="{{ file.url }}">{{ file.title }}</a></span>
      {% else -%}
│   │   ├── <span class="file-link"><a href="{{ file.url }}">{{ file.title }}</a></span>
      {% endif -%}
    {% endfor -%}
  {% endfor -%}
{% endfor %}
  <div style="margin-top: 15px;"><span class="user">root@fxlip</span>:<span class="path">~/www</span>$ <span class="blink">_</span></div>
</div>