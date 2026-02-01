---
layout: page
title: linux
permalink: /linux
hide_header: true
hide_footer: true
---

<div class="terminal-box">
  <div class="terminal-header">
    <div class="terminal-controls">
      <div class="win-btn btn-min" title="Minimize">−</div>
      <div class="win-btn btn-close" title="Close">✕</div>
    </div>
  </div>

  <div class="terminal-body">
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/linux</span><span class="t-gray">$</span> <span class="t-cmd">cat dog.txt</span>
    </div>
    <div class="t-out">
Roadmap da certificação LPI-1
Comentários no @feed
    </div>
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/linux</span><span class="t-gray">$</span> <span class="t-cmd">tree -L 3</span>
    </div>
    <div class="t-out">.</div>

    {%- assign all_items = site.documents | concat: site.pages -%}
    {%- assign linux_items = all_items | where_exp: "item", "item.url contains '/linux/'" | sort: "url" -%}

    {%- assign l1_dirs = "" -%}
    {%- for item in linux_items -%}
      {%- assign clean = item.url | replace_first: "/linux/", "" -%}
      {%- assign parts = clean | split: "/" -%}
      {%- if parts.size > 1 and clean != "" and clean != "index.html" -%}
         {%- assign l1_dirs = l1_dirs | append: parts[0] | append: "|||" -%}
      {%- endif -%}
    {%- endfor -%}
    {%- assign unique_l1 = l1_dirs | split: "|||" | uniq | sort -%}

    {%- for dir1 in unique_l1 -%}
      
      {%- if forloop.last -%}
        {%- assign c1 = "└── " -%}
        {%- assign p1 = "    " -%}
      {%- else -%}
        {%- assign c1 = "├── " -%}
        {%- assign p1 = "│   " -%}
      {%- endif -%}

      <div class="t-row"><span class="t-tree">{{ c1 }}</span><span class="d" style="font-weight: bold; color: #ff79c6;">{{ dir1 }}</span></div>

      {%- assign prefix1 = "/linux/" | append: dir1 | append: "/" -%}
      {%- assign l2_dirs = "" -%}
      {%- assign files_in_l1 = 0 -%}
      
      {%- for item in linux_items -%}
         {%- if item.url contains prefix1 -%}
            {%- assign rel = item.url | replace_first: prefix1, "" -%}
            {%- assign parts = rel | split: "/" -%}
            {%- if parts.size > 1 -%}
               {%- assign l2_dirs = l2_dirs | append: parts[0] | append: "|||" -%}
            {%- else -%}
               {%- assign files_in_l1 = files_in_l1 | plus: 1 -%}
            {%- endif -%}
         {%- endif -%}
      {%- endfor -%}
      {%- assign unique_l2 = l2_dirs | split: "|||" | uniq | sort -%}

      {%- for dir2 in unique_l2 -%}
         
         {%- if forloop.last and files_in_l1 == 0 -%}
            {%- assign c2 = "└── " -%}
            {%- assign p2 = "    " -%}
         {%- else -%}
            {%- assign c2 = "├── " -%}
            {%- assign p2 = "│   " -%}
         {%- endif -%}

         <div class="t-row"><span class="t-tree">{{ p1 }}{{ c2 }}</span><span class="d" style="font-weight: bold; color: #bd93f9;">{{ dir2 }}</span></div>

         {%- assign prefix2 = prefix1 | append: dir2 | append: "/" -%}
         {%- assign final_items = linux_items | where_exp: "item", "item.url contains prefix2" | sort: "title" -%}

         {%- for item in final_items -%}
            {%- if forloop.last -%}
              {%- assign c3 = "└── " -%}
            {%- else -%}
              {%- assign c3 = "├── " -%}
            {%- endif -%}
            
  <div class="t-row">
    <span class="t-tree">{{ p1 }}{{ p2 }}{{ c3 }}</span>
    <a href="{{ item.url }}" class="f file-link {% if item.title contains '.exercicios' %}file-link-muted{% endif %}">
      {{ item.title | downcase }}
    </a>
  </div>
         {%- endfor -%}

      {%- endfor -%}

      {%- for item in linux_items -%}
        {%- if item.url contains prefix1 -%}
          {%- assign rel = item.url | replace_first: prefix1, "" -%}
          {%- unless rel contains "/" -%}
             {%- if item.url != prefix1 -%}
                 {%- if forloop.last -%}
                    {%- assign c2b = "└── " -%}
                 {%- else -%}
                    {%- assign c2b = "├── " -%}
                 {%- endif -%}
  <div class="t-row">
    <span class="t-tree">{{ p1 }}{{ c2b }}</span>
    <a href="{{ item.url }}" class="f file-link {% if item.title contains '.exercicios' %}file-link-muted{% endif %}">
      {{ item.title | downcase }}
    </a>
  </div>
             {%- endif -%}
          {%- endunless -%}
        {%- endif -%}
      {%- endfor -%}

    {%- endfor -%}
    
    <div class="t-out">&nbsp;</div>
  </div>
</div>

[13/83]