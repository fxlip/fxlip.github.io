---
layout: page
title: arquivos
permalink: /arquivos
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
Todos os arquivos usados.
Comentários no @feed
    </div>
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/files</span><span class="t-gray">$</span> <span class="t-cmd">tree -L 3</span>
    </div>
    <div class="t-out">.</div>

    {%- assign raw_files = site.static_files | where_exp: "item", "item.path contains '/files/'" -%}
    
    {%- assign l1_dirs = "" -%}
    {%- for file in raw_files -%}
      {%- assign clean = file.path | replace_first: "/files/", "" -%}
      {%- assign parts = clean | split: "/" -%}
      {%- if parts.size > 1 -%}
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

      {%- assign path1 = "/files/" | append: dir1 | append: "/" -%}
      {%- assign l2_dirs = "" -%}
      {%- assign files_in_l1 = 0 -%}
      
      {%- for file in raw_files -%}
        {%- if file.path contains path1 -%}
           {%- assign rel = file.path | replace_first: path1, "" -%}
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

         {%- assign path2 = path1 | append: dir2 | append: "/" -%}
         {%- assign l3_files = raw_files | where_exp: "item", "item.path contains path2" | sort: "name" -%}

         {%- for file in l3_files -%}
            {%- if forloop.last -%}
              {%- assign c3 = "└── " -%}
            {%- else -%}
              {%- assign c3 = "├── " -%}
            {%- endif -%}
            
            <div class="t-row"><span class="t-tree">{{ p1 }}{{ p2 }}{{ c3 }}</span><a href="{{ file.path }}" target="_blank" class="f file-link">{{ file.name }}</a></div>
         {%- endfor -%}

      {%- endfor -%}

      {%- assign l1_files_list = raw_files | where_exp: "item", "item.path contains path1" | sort: "name" -%}
      {%- for file in l1_files_list -%}
         {%- assign rel = file.path | replace_first: path1, "" -%}
         {%- unless rel contains "/" -%}
            {%- if forloop.last -%}
              {%- assign c2b = "└── " -%}
            {%- else -%}
              {%- assign c2b = "├── " -%}
            {%- endif -%}
            <div class="t-row"><span class="t-tree">{{ p1 }}{{ c2b }}</span><a href="{{ file.path }}" target="_blank" class="f file-link">{{ file.name }}</a></div>
         {%- endunless -%}
      {%- endfor -%}

    {%- endfor -%}
    
    {%- for file in raw_files -%}
       {%- assign clean = file.path | replace_first: "/files/", "" -%}
       {%- unless clean contains "/" -%}
         <div class="t-row"><span class="t-tree">├── </span><a href="{{ file.path }}" target="_blank" class="f file-link">{{ file.name }}</a></div>
       {%- endunless -%}
    {%- endfor -%}

    <div class="t-out">&nbsp;</div>
  </div>
</div>