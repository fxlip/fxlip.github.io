---
layout: page
title: files
permalink: /files
hide_footer: true

# --- CONFIGURAÇÃO DE DIRETÓRIOS ---
# O script agora procura dentro de: _root/files/
directories:
  - id: "estudos"
    desc: "Material de referência e certificações"
  
  - id: "eventos"
    desc: "Slides e conteudos de palestras"
    
  - id: "misc"
    desc: "Arquivos diversos e dumps"
    
  - id: "imgs"
    desc: "Imagens hospedadas para posts"
---

<style>
  /* --- CONFIGURAÇÕES DE TERMINAL (CSS Inline para garantir performance) --- */
  .terminal-window {
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    color: var(--text-color);
    margin-top: 30px;
    font-size: 14px;
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 80px; 
  }
  
  .terminal-window::-webkit-scrollbar { display: none; }
</style>

# // index of /root/files

Repositório central de arquivos estáticos.

{% for dir in page.directories %}

  <div style="margin-top: 40px; margin-bottom: 10px;">
    <h3 style="
      color: var(--link-hover-color); 
      font-family: monospace; 
      font-size: 1.1em; 
      border-bottom: 1px dashed rgba(135, 139, 166, 0.3);
      padding-bottom: 5px;
    ">
      ./{{ dir.id }}/
      <span style="float: right; font-size: 0.7em; opacity: 0.6; font-weight: normal;">
        # {{ dir.desc }}
      </span>
    </h3>
  </div>

  <div class="terminal-window">
    <table style="width: 100%; border-collapse: collapse; font-family: monospace;">
      <tbody>
        {% assign has_files = false %}
        
        {% assign target_path = '_root/files/' | append: dir.id %}
        
        {% assign files = site.static_files | sort: 'modified_time' | reverse %}
        
        {% for file in files %}
          {% if file.path contains target_path %}
          {% assign has_files = true %}
          
          {% assign ext = file.extname | downcase %}
          {% if ext == '.pdf' %}
            {% assign type = '[PDF]' %}{% assign color = '#FF5555' %}
          {% elsif ext == '.jpg' or ext == '.jpeg' or ext == '.png' or ext == '.gif' %}
            {% assign type = '[IMG]' %}{% assign color = '#BD93F9' %}
          {% elsif ext == '.zip' or ext == '.tar' or ext == '.gz' %}
            {% assign type = '[ZIP]' %}{% assign color = '#F1FA8C' %}
          {% elsif ext == '.txt' or ext == '.md' or ext == '.sh' %}
            {% assign type = '[TXT]' %}{% assign color = '#50FA7B' %}
          {% else %}
            {% assign type = '[BIN]' %}{% assign color = '#6272A4' %}
          {% endif %}

          <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
            <td style="color: {{ color }}; padding: 6px 5px; width: 50px;">{{ type }}</td>
            <td style="padding: 6px 5px;">
              <a href="{{ file.path }}" target="_blank" style="text-decoration: none; color: var(--text-color);">
                {{ file.name }}
              </a>
            </td>
            <td style="text-align: right; padding: 6px 5px; width: 80px;">
              <span style="opacity: 0.4; font-size: 0.8em;">{{ file.modified_time | date: "%d/%m" }}</span>
            </td>
          </tr>
          {% endif %}
        {% endfor %}

        {% if has_files == false %}
          <tr>
            <td colspan="3" style="padding: 10px; color: var(--placeholder-color); font-style: italic;">
              (empty directory)
            </td>
          </tr>
        {% endif %}
      </tbody>
    </table>
  </div>

{% endfor %}

<br>
<div style="text-align: center; margin-top: 50px; opacity: 0.5; font-size: 0.8em;">
  EOF
</div>