---
layout: page
title: infosec
permalink: /infosec/
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
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/infosec</span><span class="t-gray">$</span> <span class="t-cmd">cat dog.txt</span>
    </div>
    <div class="t-out">
Roadmap da pós-graduação em SI
Períodos: 
01/04/2026-26/06/2026
03/08/2026-09/12/2026
01/02/2027-27/03/2027
Comentários no @feed
    </div>
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/infosec</span><span class="t-gray">$</span> <span class="t-cmd">tree -L 3</span>
    </div>
    <div class="t-out">.</div>

    {%- assign all_items = site.documents | concat: site.pages -%}
    {%- assign infosec_items = all_items | where_exp: "item", "item.url contains '/infosec/'" | sort: "url" -%}

    {%- assign l1_dirs = "" -%}
    {%- for item in infosec_items -%}
      {%- assign clean = item.url | replace_first: "/infosec/", "" -%}
      {%- assign parts = clean | split: "/" -%}
      {%- if parts.size > 1 and clean != "" and clean != "index.html" -%}
         {%- assign l1_dirs = l1_dirs | append: parts[0] | append: "|||" -%}
      {%- endif -%}
    {%- endfor -%}
    {%- assign unique_l1 = l1_dirs | split: "|||" | uniq | sort -%}

    {%- assign root_files = "" -%}
    {%- for item in infosec_items -%}
      {%- assign clean = item.url | replace_first: "/infosec/", "" -%}
      {%- assign parts = clean | split: "/" -%}
      {%- if parts.size == 1 and clean != "" and clean != "index.html" -%}
            {%- assign root_files = root_files | append: item.url | append: "|||" -%}
      {%- endif -%}
    {%- endfor -%}
    {%- assign unique_root_files = root_files | split: "|||" | uniq | sort -%}

    {%- for dir1 in unique_l1 -%}
      
      {%- if forloop.last and unique_root_files.size == 0 -%}
        {%- assign c1 = "└── " -%}
        {%- assign p1 = "    " -%}
      {%- else -%}
        {%- assign c1 = "├── " -%}
        {%- assign p1 = "│   " -%}
      {%- endif -%}

      <div class="t-row"><span class="t-tree">{{ c1 }}</span><span class="d" style="font-weight: bold; color: #ff79c6;">{{ dir1 }}</span></div>

      {%- assign prefix1 = "/infosec/" | append: dir1 | append: "/" -%}
      {%- assign l2_dirs = "" -%}
      {%- assign files_in_l1 = 0 -%}
      
      {%- for item in infosec_items -%}
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
         {%- assign final_items = infosec_items | where_exp: "item", "item.url contains prefix2" | sort: "title" -%}

         {%- for item in final_items -%}
            {%- if forloop.last -%}
              {%- assign c3 = "└── " -%}
            {%- else -%}
              {%- assign c3 = "├── " -%}
            {%- endif -%}
            
  <div class="t-row">
    <span class="t-tree">{{ p1 }}{{ p2 }}{{ c3 }}</span>
    <a href="{{ item.url }}" class="f file-link {% if item.muted %}file-link-muted{% endif %}">
      {{ item.title | downcase }}
    </a>
  </div>
         {%- endfor -%}

      {%- endfor -%}

      {%- for item in infosec_items -%}
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
    <a href="{{ item.url }}" class="f file-link {% if item.muted %}file-link-muted{% endif %}">
      {{ item.title | downcase }}
    </a>
  </div>
             {%- endif -%}
          {%- endunless -%}
        {%- endif -%}
      {%- endfor -%}

    {%- endfor -%}

    {%- for file_url in unique_root_files -%}
       {%- assign item = infosec_items | where: "url", file_url | first -%}
       {%- if forloop.last -%}
          {%- assign c_root = "└── " -%}
       {%- else -%}
          {%- assign c_root = "├── " -%}
       {%- endif -%}
       <div class="t-row">
         <span class="t-tree">{{ c_root }}</span>
         <a href="{{ item.url }}" class="f file-link {% if item.muted %}file-link-muted{% endif %}">
           {{ item.title | downcase }}
         </a>
       </div>
    {%- endfor -%}
    
    <div class="t-out">&nbsp;</div>
  </div>
</div>

---

> PROGRESSO ATÉ A CONCLUSÃO

[0/360]