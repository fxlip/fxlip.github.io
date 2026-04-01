# fxlip.com

Uma arquitetura estática com serverless focada em resiliência e segurança, sem custos.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Build | Jekyll 4.4.1 |
| Runtime | Cloudflare Workers + D1 (SQLite) + KV |
| Frontend | Vanilla JS, SCSS, PWA |
| CI/CD | GitHub Actions |
| Testes | Vitest 2 + jsdom + @cloudflare/vitest-pool-workers |

## Arquitetura

```
┌─────────────────────────────────────────────┐
│  GitHub                                     │
│  ├── build → _site/                         │
│  └── deploy → GitHub Pages (CDN global)     │
└────────────────────┬────────────────────────┘
                     │ conteúdo estático
                     ▼
                  Browser
                     │ fetch()
                     ▼
┌─────────────────────────────────────────────┐
│  Cloudflare                                 │
│  ├── Workers (visitor-api)                  │
│  ├── D1 SQLite (profiles, interactions,     │
│  │   sessions, page_views, page_view_ips)   │
│  └── KV (sessões, kill switch, cache)       │
└─────────────────────────────────────────────┘
```

## CI/CD

```
push → lint-and-test → build → deploy (GitHub Pages)
         │
         ├── ESLint (assets/js/**/*.js)
         ├── Vitest JS + DOM (210 testes)
         ├── Vitest Worker — Miniflare (35 testes)
         └── HTMLProofer (links, HTML, imagens)

push em workers/** → test:worker → wrangler deploy (Cloudflare)

cron (1h) → email_listener → novo post → commit → push
```

## Funcionalidades

### Simulado LPI
- Motor de quiz para os exames 101-500 e 102-500
- Histórico de tentativas de simulado vinculado ao perfil
- Embaralhamento de questões e alternativas a cada tentativa
- Persistência de progresso via `localStorage` com fallback
- Limite de requisições para prevenir scraping

### Worker — Visitor API
- Kill switch via KV (`kill_switch = 'true'`) — desliga sem redeploy
- Rate limiting in-memory (`globalThis._rl`) — zero KV puts por request
- Throttle de escrita KV: só reescreve `visitor:{fp}` se nome mudou ou passou 1h
- View counts migrados para D1 (`page_views` + `page_view_ips`)
- Gate de visita diária via D1 `last_seen`

### Frontend
- 100% Vanilla JS — sem jQuery ou frameworks
- Módulos orquestrados por `main.js` via `window.*`
- Suporte a `#hashtags` e `@mentions` com TreeWalker — sem (`innerHTML.replace`)
- Efeitos de digitação estilo terminal (`autoterm.js`)
- Scroll infinito e animações (`main.js`)
- Registro de Service Worker desacoplado (`sw-register.js`)
- PWA com (`sw.js` + `manifest.json`)

### Segurança
- CSP em `_layouts/default.html` — `script-src 'self'` sem `unsafe-inline`
- Sem rastreamento
- Fontes auto-hospedadas sem CDN externo
- OAuth via callback `auth/callback.md` → `auth-callback.js` → KV

## Estrutura

```
├── _posts/ _root/          conteúdo em markdown
├── _layouts/ _includes/    templates Jekyll
├── _sass/                  SCSS componentizado com arquitetura de partials
├── assets/js/              módulos vanilla js
│   ├── main.js             orquestrador
│   ├── autolink.js         @mentions, hashtags, link-cards, time-ago
│   ├── autoterm.js         efeitos terminal
│   ├── quiz.js             motor do simulado LPI (2.0)
│   ├── profile.js          perfil e histórico de tentativas
│   ├── greeting.js         saudação contextual
│   ├── sw-register.js      registro do Service Worker
│   └── ...
├── workers/visitor-api/    cloudflare worker (kill switch, rate limit, D1)
├── scripts/                automação ruby (email_to_post, generate_previews, etc.)
├── tests/                  vitest — 245 testes (210 JS/DOM + 35 Worker)
│   ├── js/                 autolink, quiz, quiz-storage, greeting, main
│   ├── html/               template CSP, tabs
│   └── worker/             kill switch, rate limiting, CORS, endpoints
├── _data/questions/        banco de questões LPI (101–104 → .yml)
└── .github/workflows/      CI/CD
```

## Publicação via e-mail

| Assunto do e-mail | Destino |
|-------------------|---------|
| (vazio) ou `quick_post` | `_posts/` |
| `linux/[categoria]/[tag]/[título]` | `_root/linux/` |
| `files/[caminho]/[nome]` | upload de anexo |
| `RM:[caminho]` | exclusão (com validação de path) |
