---
title: www
layout: page
permalink: /www
hide_header: true
hide_footer: true
---

> SITE

---

## Visão Geral do Projeto

Blog pessoal/base de conhecimento (fxlip.com) construído com Jekyll 4.4.1, hospedado no GitHub Pages. Tema escuro inspirado em terminal (paleta Dracula). O conteúdo está em Português (Brasileiro).

## Comandos de Build e Desenvolvimento

```bash
bundle install             #Instalar dependências
bundle exec jekyll serve   #Servidor de desenvolvimento em localhost:4000
bundle exec jekyll build   #Build de produção para _site/

#Scripts de automação Ruby
bundle exec ruby scripts/email_to_post.rb     #Processar e-mails em posts
bundle exec ruby scripts/generate_previews.rb #Coletar prévias de links
ruby scripts/index_now.rb                     #Ping IndexNow/Bing
```

## Arquitetura

### Pipeline de Conteúdo
- **`_posts/`**: Posts rápidos do feed (~150 arquivos, `AAAA-MM-DD-[hash].md`)
- **`_root/linux/`**: Documentos de estudo LPI-1 estruturados, organizados como `[exame]/[tópico]/[tag]/AAAA-MM-DD-[slug].md`
- **Markdowns na raíz**: Páginas independentes (linux.md, sobre.md, setup.md, manifesto.md, arquivos.md)

### Publicação via Email (`scripts/email_to_post.rb`)
Consulta o Gmail IMAP de hora em hora via GitHub Actions. O assunto do e-mail determina a ação:
- Vazio/`quick_post` → cria post de feed em `_posts/`
- `linux/[categoria]/[tag]/[título]` → cria documento em `_root/linux/`
- `files/[caminho]/[nome]` → faz upload de anexo para `files/`
- `RM:[caminho_do_arquivo]` → exclui arquivo (com validação de caminho)

Os commits do bot usam a conta `kernel-bot`.

### Sistema de Pré-visualização de Links (`scripts/generate_previews.rb`)
Escaneia todos os arquivos markdown em busca de URLs, busca metadados OpenGraph, faz cache em `_data/previews.yml`. Regras específicas de domínio para G1, UOL, Twitter/X, YouTube.

### Frontend (Vanilla JS, `/assets/js/`)
- **main.js**: Scroll infinito (Intersection Observer), animações de digitação e orquestrador de módulos

- **autolink.js**: @mentions, link-cards, barras de progresso [90/100] neon pipes, tempo relativo (time-ago) e botões de compartilhamento

- **autoterm.js**: Efeitos de animação de digitação de terminal

- **syntax.js**: Destaque de blocos de código

### Estilização (`_sass/`)
SCSS com propriedades personalizadas CSS. Cores principais: bg `#13121d`, texto `#c5c6d0`, rosa `#ff79c6`, roxo `#bd93f9`, ciano `#8be9fd`. Ponto de entrada: `assets/css/main.scss`.

## CI/CD (GitHub Actions)

- **deploy.yml**: Push para master/main → Build Jekyll → Deploy no GitHub Pages (Ruby 3.1)
- **email_listener.yml**: Cron de hora em hora → processamento de e-mail → geração de prévias → commit & push → Ping IndexNow
- **generate-previews.yml**: Push → regenerar `_data/previews.yml`

## Configurações Principais

- **`_config.yml`**: Paginação 8/página, fuso horário America/Sao_Paulo, `future: true`, coleções de `_root/`
- **Segredos** (GitHub): `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `ALLOWED_SENDER`, `RW_TOKEN`
- **Estratégia de Branch**: `master` (dev) e `main` ambas fazem deploy no Pages

## Convenções

- **Slugs de posts**: hashes hexadecimais aleatórios para posts do feed, títulos higienizados para documentos.

- **Mensagens de commit da automação**: `"auto-update via smtp"`, `"new content via smtp"`, `"new asset via smtp"`

- **Headers CSP** e **meta tags** de segurança estão em `_layouts/default.html`

- **Sem** scripts de análise ou rastreamento de terceiros

- Todo o conteúdo e texto da UI em **Português (Brasileiro)**


---