---
layout: page
title: root
permalink: /root/
---

<style>
  .sysadmin-tree {
    font-family: 'Courier New', monospace;
    color: var(--text-color);
    margin-top: 30px;
  }
  .sys-category {
    font-weight: bold;
    color: var(--link-hover-color); 
    margin-top: 20px;
  }
  .sys-tag {
    color: var(--code-color-3); 
    margin-left: 20px;
    margin-top: 10px;
    font-weight: bold;
  }
  .sys-file {
    margin-left: 40px;
    position: relative;
    padding-left: 15px;
    border-left: 1px dashed var(--base-color);
  }
  .sys-file::before {
    content: "__";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    color: var(--base-color);
    opacity: 0.5;
  }
  .sys-file a {
    text-decoration: none;
    color: var(--base-color);
    transition: color 0.2s;
  }
  .sys-file a:hover {
    color: var(--link-color);
    text-decoration: underline;
  }
  .sys-root {
    color: var(--base-color);
    opacity: 0.7;
    margin-bottom: 10px;
  }
</style>

<div class="sysadmin-tree">
  <div class="sys-root">/var/www/fxlip</div>

  {% comment %} Agrupa por Categoria {% endcomment %}
  {% assign grouped_by_category = site.root | group_by: "categories" %}

  {% for cat_group in grouped_by_category %}
    <div class="sys-category">
      {% comment %} Removemos o 'first' e usamos 'join' para garantir que array vire string {% endcomment %}
      /{{ cat_group.name | join: "" | default: "uncategorized" }}
    </div>

    {% comment %} Agrupa por Tag {% endcomment %}
    {% assign grouped_by_tag = cat_group.items | group_by: "tags" %}

    {% for tag_group in grouped_by_tag %}
      <div class="sys-tag">
        └── [ {{ tag_group.name | join: "" | default: "general" }} ]
      </div>

      {% for doc in tag_group.items %}
        <div class="sys-file">
          <a href="{{ doc.url | relative_url }}">{{ doc.title }}</a>
        </div>
      {% endfor %}

    {% endfor %}
  {% endfor %}
  
  <div class="sys-root" style="margin-top: 30px;">
    <span class="blink">_</span>
  </div>
</div>