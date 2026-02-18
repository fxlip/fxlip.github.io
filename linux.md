---
layout: page
title: linux
permalink: /linux/
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
Começa em @linux/103/1/bash
Comentários no @feed
Dúvidas na @busca
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
      
      {%- comment -%} 1. Renderiza a Pasta Pai (ex: 103) {%- endcomment -%}
      {%- if forloop.last -%}
        {%- assign c1 = "└── " -%}
        {%- assign p1 = "    " -%}
      {%- else -%}
        {%- assign c1 = "├── " -%}
        {%- assign p1 = "│   " -%}
      {%- endif -%}

      <div class="t-row"><span class="t-tree">{{ c1 }}</span><span class="d" style="font-weight: bold; color: #ff79c6;">{{ dir1 }}</span></div>

      {%- assign prefix1 = "/linux/" | append: dir1 | append: "/" -%}
      
      {%- comment -%} 
        2. CAPTURA INTELIGENTE COM SORT KEY
        Criamos uma lista composta: "CHAVE####NOME_REAL"
        Se o título começar com '.', a CHAVE ganha um '!' na frente para subir pro topo.
      {%- endcomment -%}
      {%- assign children_list = "" -%}
      
      {%- for item in linux_items -%}
         {%- if item.url contains prefix1 -%}
            {%- assign rel = item.url | replace_first: prefix1, "" -%}
            {%- assign parts = rel | split: "/" -%}
            {%- assign real_name = parts[0] -%}
            
            {%- if real_name != "" -%}
               
               {%- comment -%} Define a chave de ordenação padrão {%- endcomment -%}
               {%- assign sort_key = real_name -%}

               {%- comment -%} Se for um arquivo direto, verifica o título {%- endcomment -%}
               {%- if parts.size == 1 -%}
                   {%- assign first_char = item.title | slice: 0, 1 -%}
                   {%- if first_char == "." -%}
                       {%- comment -%} O caractere '!' vem antes de números e letras na tabela ASCII {%- endcomment -%}
                       {%- assign sort_key = "!" | append: real_name -%}
                   {%- endif -%}
               {%- endif -%}

               {%- assign entry = sort_key | append: "####" | append: real_name -%}
               {%- assign children_list = children_list | append: entry | append: "|||" -%}
            {%- endif -%}
         {%- endif -%}
      {%- endfor -%}
      
      {%- comment -%} Ordena pela chave (onde ! ganha de 1) {%- endcomment -%}
      {%- assign sorted_entries = children_list | split: "|||" | uniq | sort -%}

      {%- comment -%} 3. LOOP DE RENDERIZAÇÃO {%- endcomment -%}
      {%- for entry in sorted_entries -%}
         
         {%- comment -%} Separa a Chave do Nome Real {%- endcomment -%}
         {%- assign parts = entry | split: "####" -%}
         {%- assign child = parts[1] -%}

         {%- if forloop.last -%}
            {%- assign c2 = "└── " -%}
            {%- assign p2 = "    " -%}
         {%- else -%}
            {%- assign c2 = "├── " -%}
            {%- assign p2 = "│   " -%}
         {%- endif -%}

         {%- assign is_file = false -%}
         {%- assign target_item = nil -%}
         
         {%- for item in linux_items -%}
            {%- assign check_path = prefix1 | append: child -%}
            {%- if item.url == check_path or item.url == check_path | append: "/" -%}
               {%- assign is_file = true -%}
               {%- assign target_item = item -%}
               {%- break -%}
            {%- endif -%}
         {%- endfor -%}

         {%- if is_file -%}
            <div class="t-row">
                <span class="t-tree">{{ p1 }}{{ c2 }}</span>
                <a href="{{ target_item.url }}" class="f file-link {% if target_item.muted %}file-link-muted{% endif %}">
                  {{ target_item.title | downcase }}
                </a>
            </div>
         {%- else -%}
            <div class="t-row"><span class="t-tree">{{ p1 }}{{ c2 }}</span><span class="d" style="font-weight: bold; color: #bd93f9;">{{ child }}</span></div>
             
             {%- assign prefix2 = prefix1 | append: child | append: "/" -%}
             {%- assign final_items = linux_items | where_exp: "item", "item.url contains prefix2" | sort: "title" -%}
             
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
         {%- endif -%}

      {%- endfor -%}

    {%- endfor -%}
    
    <div class="t-out">&nbsp;</div>
  </div>
</div>

---

> PROGRESSO ATÉ O EXAME 101-500

[30/105]