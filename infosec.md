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
  {% include terminal-tabs.html %}

  <div class="terminal-body">
    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/infosec</span><span class="t-gray">$</span> <span class="t-cmd">cat dog.txt</span>
    </div>
    <div class="t-out">
Roadmap da pós-graduação em SI
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

    {% comment %}
    TODO: reabilitar quando houver mais volume de arquivos em /files/infosec/

    <div>
      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/infosec</span><span class="t-gray">$</span> <span class="t-cmd">tree ~/files/infosec/senac/</span>
    </div>
    <div class="t-out">.</div>

    {%- assign infosec_files = site.static_files | where_exp: "f", "f.path contains '/files/infosec/senac/'" | sort: "path" -%}

    {%- assign l1_list = "" -%}
    {%- for f in infosec_files -%}
      {%- assign rel = f.path | replace_first: "/files/infosec/senac/", "" -%}
      {%- assign parts = rel | split: "/" -%}
      {%- if parts.size > 0 and parts[0] != "" -%}
        {%- assign l1_list = l1_list | append: parts[0] | append: "|||" -%}
      {%- endif -%}
    {%- endfor -%}
    {%- assign l1_dirs = l1_list | split: "|||" | uniq | sort -%}

    {%- for d1 in l1_dirs -%}
      {%- if forloop.last -%}
        {%- assign c1 = "└── " -%}{%- assign p1 = "    " -%}
      {%- else -%}
        {%- assign c1 = "├── " -%}{%- assign p1 = "│   " -%}
      {%- endif -%}
      <div class="t-row"><span class="t-tree">{{ c1 }}</span><span class="d" style="font-weight: bold; color: #ff79c6;">{{ d1 }}/</span></div>

      {%- assign prefix1 = "/files/infosec/senac/" | append: d1 | append: "/" -%}
      {%- assign l2_list = "" -%}
      {%- for f in infosec_files -%}
        {%- if f.path contains prefix1 -%}
          {%- assign rel = f.path | replace_first: prefix1, "" -%}
          {%- assign parts = rel | split: "/" -%}
          {%- if parts[0] != "" -%}
            {%- assign l2_list = l2_list | append: parts[0] | append: "|||" -%}
          {%- endif -%}
        {%- endif -%}
      {%- endfor -%}
      {%- assign l2_entries = l2_list | split: "|||" | uniq | sort -%}

      {%- for e2 in l2_entries -%}
        {%- if forloop.last -%}
          {%- assign c2 = "└── " -%}{%- assign p2 = "    " -%}
        {%- else -%}
          {%- assign c2 = "├── " -%}{%- assign p2 = "│   " -%}
        {%- endif -%}
        {%- assign check2 = prefix1 | append: e2 | append: "/" -%}
        {%- assign is_dir2 = false -%}
        {%- for f in infosec_files -%}
          {%- if f.path contains check2 -%}
            {%- assign is_dir2 = true -%}
            {%- break -%}
          {%- endif -%}
        {%- endfor -%}
        {%- if is_dir2 -%}
          <div class="t-row"><span class="t-tree">{{ p1 }}{{ c2 }}</span><span class="d" style="font-weight: bold; color: #bd93f9;">{{ e2 }}/</span></div>

          {%- assign prefix2 = prefix1 | append: e2 | append: "/" -%}
          {%- assign l3_list = "" -%}
          {%- for f in infosec_files -%}
            {%- if f.path contains prefix2 -%}
              {%- assign rel = f.path | replace_first: prefix2, "" -%}
              {%- assign parts = rel | split: "/" -%}
              {%- if parts[0] != "" -%}
                {%- assign l3_list = l3_list | append: parts[0] | append: "|||" -%}
              {%- endif -%}
            {%- endif -%}
          {%- endfor -%}
          {%- assign l3_entries = l3_list | split: "|||" | uniq | sort -%}

          {%- for e3 in l3_entries -%}
            {%- if forloop.last -%}
              {%- assign c3 = "└── " -%}{%- assign p3 = "    " -%}
            {%- else -%}
              {%- assign c3 = "├── " -%}{%- assign p3 = "│   " -%}
            {%- endif -%}
            {%- assign check3 = prefix2 | append: e3 | append: "/" -%}
            {%- assign is_dir3 = false -%}
            {%- for f in infosec_files -%}
              {%- if f.path contains check3 -%}
                {%- assign is_dir3 = true -%}
                {%- break -%}
              {%- endif -%}
            {%- endfor -%}
            {%- if is_dir3 -%}
              <div class="t-row"><span class="t-tree">{{ p1 }}{{ p2 }}{{ c3 }}</span><span class="d" style="font-weight: bold; color: #6272a4;">{{ e3 }}/</span></div>

              {%- assign prefix3 = prefix2 | append: e3 | append: "/" -%}
              {%- assign l4_files = infosec_files | where_exp: "f", "f.path contains prefix3" | sort: "path" -%}
              {%- for file in l4_files -%}
                {%- if forloop.last -%}{%- assign c4 = "└── " -%}{%- else -%}{%- assign c4 = "├── " -%}{%- endif -%}
                <div class="t-row">
                  <span class="t-tree">{{ p1 }}{{ p2 }}{{ p3 }}{{ c4 }}</span>
                  <a href="{{ file.path }}" class="f file-link" target="_blank">{{ file.name }}</a>
                </div>
              {%- endfor -%}
            {%- else -%}
              <div class="t-row">
                <span class="t-tree">{{ p1 }}{{ p2 }}{{ c3 }}</span>
                <a href="{{ prefix2 | append: e3 }}" class="f file-link" target="_blank">{{ e3 }}</a>
              </div>
            {%- endif -%}
          {%- endfor -%}
        {%- else -%}
          <div class="t-row">
            <span class="t-tree">{{ p1 }}{{ c2 }}</span>
            <a href="{{ prefix1 | append: e2 }}" class="f file-link" target="_blank">{{ e2 }}</a>
          </div>
        {%- endif -%}
      {%- endfor -%}
    {%- endfor -%}

    {% endcomment %}
  </div>
</div>