# fxlip.com

Uma arquitetura estática com serverless focada em resiliência e segurança, sem custos. 

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Build | Jekyll 4.4 |
| Runtime | Workers + D1 + KV |
| Frontend | Vanilla JS, SCSS, PWA |
| CI/CD | GitHub Actions |

## Arquitetura

```
┌─────────────────────────────────────────────┐
│  GitHub                                     │
│  ├── build → _site/                         │
│  └── deploy                                 │
└────────────────────┬────────────────────────┘
                     │ conteúdo estático
                     ▼
                  Browser
                     │ fetch()
                     ▼
┌─────────────────────────────────────────────┐
│  Cloudflare                                 │
│  ├── SQLite serverless                      │
│  └── Sessões e rate limiting                │
└─────────────────────────────────────────────┘
```

## CI/CD

```
push → lint-and-test → build → deploy (Github)
         │
         ├── ESLint
         ├── Vitest
         └── HTMLProofer

push em workers/** → test:worker → wrangler deploy (Cloudflare)

cron → email_listener → novo post → commit → push
```

## Estrutura

```
├── _posts/ _root/        conteúdo em markdown
├── _layouts/ _includes/  templates
├── _sass/                SCSS componentizado com arquitetura de partials
├── assets/js/            módulos vanilla js
├── workers/visitor-api/  cloudflare worker
├── scripts/              automação com ruby
├── tests/                vitest
└── .github/workflows/    CI/CD
```
