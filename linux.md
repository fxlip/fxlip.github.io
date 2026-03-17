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
  {% include terminal-tabs.html %}

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

    {%- comment -%} Coleta exames únicos a partir das URLs {%- endcomment -%}
    {%- assign l1_dirs = "" -%}
    {%- for item in linux_items -%}
      {%- assign clean = item.url | replace_first: "/linux/", "" -%}
      {%- assign parts = clean | split: "/" -%}
      {%- if parts.size > 1 and clean != "" and clean != "index.html" -%}
        {%- assign l1_dirs = l1_dirs | append: parts[0] | append: "|||" -%}
      {%- endif -%}
    {%- endfor -%}
    {%- assign unique_exams = l1_dirs | split: "|||" | uniq | sort -%}

    {%- comment -%} Separa exames por grupo {%- endcomment -%}
    {%- assign set_101 = "101,102,103,104" | split: "," -%}
    {%- assign set_102 = "105,106,107,108,109,110" | split: "," -%}
    {%- assign active_101 = "" -%}
    {%- assign active_102 = "" -%}
    {%- for exam in unique_exams -%}
      {%- if set_101 contains exam -%}
        {%- assign active_101 = active_101 | append: exam | append: "|||" -%}
      {%- elsif set_102 contains exam -%}
        {%- assign active_102 = active_102 | append: exam | append: "|||" -%}
      {%- endif -%}
    {%- endfor -%}
    {%- assign active_101 = active_101 | split: "|||" -%}
    {%- assign active_102 = active_102 | split: "|||" -%}

    {%- assign active_groups = "" -%}
    {%- if active_101.size > 0 -%}{%- assign active_groups = active_groups | append: "101-500|||" -%}{%- endif -%}
    {%- if active_102.size > 0 -%}{%- assign active_groups = active_groups | append: "102-500|||" -%}{%- endif -%}
    {%- assign active_groups = active_groups | split: "|||" -%}

    {%- for group in active_groups -%}
      {%- if forloop.last -%}
        {%- assign cg = "└── " -%}
        {%- assign pg = "    " -%}
      {%- else -%}
        {%- assign cg = "├── " -%}
        {%- assign pg = "│   " -%}
      {%- endif -%}

      <div class="t-row"><span class="t-tree">{{ cg }}</span><span class="d" style="font-weight: bold; color: #ff79c6;">{{ group }}/</span></div>

      {%- if group == "101-500" -%}
        {%- assign group_exams = active_101 -%}
      {%- else -%}
        {%- assign group_exams = active_102 -%}
      {%- endif -%}

      {%- comment -%} Arquivos diretos na raiz do grupo (ex: /linux/101-500/simulado) {%- endcomment -%}
      {%- assign gf_prefix = "/linux/" | append: group | append: "/" -%}
      {%- assign gf_list = "" -%}
      {%- for item in linux_items -%}
        {%- if item.url contains gf_prefix -%}
          {%- assign gf_rel = item.url | replace_first: gf_prefix, "" -%}
          {%- assign gf_parts = gf_rel | split: "/" -%}
          {%- if gf_parts.size == 1 and gf_parts[0] != "" -%}
            {%- assign gf_sk = gf_parts[0] -%}
            {%- assign gf_fc = item.title | slice: 0, 1 -%}
            {%- if gf_fc == "." -%}{%- assign gf_sk = "!" | append: gf_parts[0] -%}{%- endif -%}
            {%- assign gf_list = gf_list | append: gf_sk | append: "####" | append: item.url | append: "|||" -%}
          {%- endif -%}
        {%- endif -%}
      {%- endfor -%}
      {%- assign gf_entries = gf_list | split: "|||" | uniq | sort -%}

      {%- for gfe in gf_entries -%}
        {%- assign gfe_parts = gfe | split: "####" -%}
        {%- assign gfe_url = gfe_parts[1] -%}
        {%- assign gf_item = nil -%}
        {%- for item in linux_items -%}
          {%- if item.url == gfe_url -%}{%- assign gf_item = item -%}{%- break -%}{%- endif -%}
        {%- endfor -%}
        {%- if forloop.last and group_exams.size == 0 -%}
          {%- assign cgf = "└── " -%}
        {%- else -%}
          {%- assign cgf = "├── " -%}
        {%- endif -%}
        <div class="t-row">
          <span class="t-tree">{{ pg }}{{ cgf }}</span>
          <a href="{{ gf_item.url }}" class="f file-link {% if gf_item.muted %}file-link-muted{% endif %}">{{ gf_item.title | downcase }}</a>
        </div>
      {%- endfor -%}

      {%- for dir1 in group_exams -%}
        {%- if forloop.last -%}
          {%- assign c1 = "└── " -%}
          {%- assign p1 = "    " -%}
        {%- else -%}
          {%- assign c1 = "├── " -%}
          {%- assign p1 = "│   " -%}
        {%- endif -%}

        <div class="t-row"><span class="t-tree">{{ pg }}{{ c1 }}</span><span class="d" style="font-weight: bold; color: #ff79c6;">{{ dir1 }}/</span></div>

        {%- assign prefix1 = "/linux/" | append: dir1 | append: "/" -%}

        {%- assign children_list = "" -%}
        {%- for item in linux_items -%}
          {%- if item.url contains prefix1 -%}
            {%- assign rel = item.url | replace_first: prefix1, "" -%}
            {%- assign parts = rel | split: "/" -%}
            {%- assign real_name = parts[0] -%}
            {%- if real_name != "" -%}
              {%- assign sort_key = real_name -%}
              {%- if parts.size == 1 -%}
                {%- assign first_char = item.title | slice: 0, 1 -%}
                {%- if first_char == "." -%}
                  {%- assign sort_key = "!" | append: real_name -%}
                {%- endif -%}
              {%- endif -%}
              {%- assign entry = sort_key | append: "####" | append: real_name -%}
              {%- assign children_list = children_list | append: entry | append: "|||" -%}
            {%- endif -%}
          {%- endif -%}
        {%- endfor -%}
        {%- assign sorted_entries = children_list | split: "|||" | uniq | sort -%}

        {%- for entry in sorted_entries -%}
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
            {%- assign path_with_slash = check_path | append: "/" -%}
            {%- if item.url == check_path or item.url == path_with_slash -%}
              {%- assign is_file = true -%}
              {%- assign target_item = item -%}
              {%- break -%}
            {%- endif -%}
          {%- endfor -%}

          {%- if is_file -%}
            <div class="t-row">
              <span class="t-tree">{{ pg }}{{ p1 }}{{ c2 }}</span>
              <a href="{{ target_item.url }}" class="f file-link {% if target_item.muted %}file-link-muted{% endif %}">{{ target_item.title | downcase }}</a>
            </div>
          {%- else -%}
            <div class="t-row"><span class="t-tree">{{ pg }}{{ p1 }}{{ c2 }}</span><span class="d" style="font-weight: bold; color: #bd93f9;">{{ child }}/</span></div>

            {%- assign prefix2 = prefix1 | append: child | append: "/" -%}
            {%- assign final_items = linux_items | where_exp: "item", "item.url contains prefix2" | sort: "title" -%}

            {%- for item in final_items -%}
              {%- if forloop.last -%}
                {%- assign c3 = "└── " -%}
              {%- else -%}
                {%- assign c3 = "├── " -%}
              {%- endif -%}
              <div class="t-row">
                <span class="t-tree">{{ pg }}{{ p1 }}{{ p2 }}{{ c3 }}</span>
                <a href="{{ item.url }}" class="f file-link {% if item.muted %}file-link-muted{% endif %}">{{ item.title | downcase }}</a>
              </div>
            {%- endfor -%}
          {%- endif -%}
        {%- endfor -%}
      {%- endfor -%}
    {%- endfor -%}
    
    <div class="t-out">&nbsp;</div>

      <span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/linux</span><span class="t-gray">$</span> <span class="t-cmd">tail /home/*/simulado.log</span>
    <div id="exam-log-output"></div>
    <div class="t-out">&nbsp;</div>
  </div>
</div>