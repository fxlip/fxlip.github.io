/**
 * tests/worker/worker.test.js
 *
 * Testes de integração do Cloudflare Worker (visitor-api).
 * Usa @cloudflare/vitest-pool-workers — roda no runtime real do Cloudflare (workerd).
 *
 * Cobertura:
 *   - Kill switch (KV)
 *   - Rate limiting diferenciado por rota
 *   - Headers CORS
 *   - OPTIONS preflight
 *   - Rotas desconhecidas (404)
 *   - Validação de input em /api/hello
 *   - Smoke tests de endpoints GET
 */

import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import worker from '../../workers/visitor-api/worker.js'

// =============================================================================
// Setup: aplica o schema D1 antes dos testes
// =============================================================================

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  fingerprint      TEXT PRIMARY KEY,
  first_seen       TEXT NOT NULL,
  last_seen        TEXT NOT NULL,
  visits_count     INTEGER DEFAULT 0,
  trust_score      INTEGER DEFAULT 50,
  total_time_spent INTEGER DEFAULT 0,
  display_name     TEXT,
  email            TEXT,
  gender           TEXT,
  whatsapp         TEXT,
  instagram        TEXT,
  twitter          TEXT,
  avatar_data      TEXT,
  country          TEXT,
  continent        TEXT,
  region           TEXT,
  region_code      TEXT,
  city             TEXT,
  postal_code      TEXT,
  latitude         REAL,
  longitude        REAL,
  timezone         TEXT,
  metro_code       TEXT,
  is_eu_country    INTEGER DEFAULT 0,
  asn              INTEGER,
  as_organization  TEXT,
  colo             TEXT,
  http_protocol    TEXT,
  tls_version      TEXT,
  tls_cipher       TEXT,
  bot_score        INTEGER,
  verified_bot     INTEGER DEFAULT 0,
  client_trust_score INTEGER,
  ua_browser       TEXT,
  ua_browser_ver   TEXT,
  ua_os            TEXT,
  ua_os_ver        TEXT,
  ua_device_type   TEXT,
  ua_raw           TEXT,
  accept_language  TEXT,
  referer_domain   TEXT,
  cf_ray           TEXT,
  activity_cluster TEXT DEFAULT '{}',
  raw_cf_data      TEXT DEFAULT '{}',
  blocked          INTEGER NOT NULL DEFAULT 0,
  google_avatar_url  TEXT,
  twitter_avatar_url TEXT,
  last_ip            TEXT
);

CREATE TABLE IF NOT EXISTS interactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id   TEXT NOT NULL REFERENCES profiles(fingerprint),
  target_slug  TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  type         TEXT NOT NULL,
  content      TEXT,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  TEXT NOT NULL REFERENCES profiles(fingerprint),
  page_slug   TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  ended_at    TEXT,
  duration    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS oauth_connections (
  id               INTEGER  PRIMARY KEY AUTOINCREMENT,
  fingerprint      TEXT     NOT NULL REFERENCES profiles(fingerprint) ON DELETE CASCADE,
  provider         TEXT     NOT NULL,
  provider_user_id TEXT     NOT NULL,
  provider_username TEXT,
  access_token     TEXT     NOT NULL,
  refresh_token    TEXT,
  token_expires_at INTEGER,
  token_scope      TEXT,
  connected_at     TEXT     NOT NULL DEFAULT (datetime('now')),
  last_synced_at   TEXT,
  provider_data    TEXT     NOT NULL DEFAULT '{}',
  UNIQUE(fingerprint, provider),
  UNIQUE(provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS profile_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT    NOT NULL REFERENCES profiles(fingerprint) ON DELETE CASCADE,
  event_type TEXT    NOT NULL,
  content    TEXT,
  created_at TEXT    NOT NULL
);
`

beforeAll(async () => {
  // D1 não aceita multi-statement num único exec() — executa um por um
  const statements = SCHEMA
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const stmt of statements) {
    await env.DB.prepare(stmt).run()
  }
})

// Helper: janela de rate limit atual
function rateWindow() {
  return Math.floor(Date.now() / 60_000)
}

// Helper: chave de rate limit para um IP
function rateKey(ip) {
  return `rate:${ip}:${rateWindow()}`
}

// Helper: faz uma requisição através do Worker
async function call(path, options = {}) {
  const url = `http://localhost${path}`
  const req = new Request(url, options)
  const ctx = createExecutionContext()
  const res = await worker.fetch(req, env, ctx)
  await waitOnExecutionContext(ctx)
  return res
}

// =============================================================================
// Kill Switch
// =============================================================================

describe('Kill Switch', () => {
  afterEach(async () => {
    await env.VISITORS.delete('kill_switch')
  })

  it('retorna 503 quando kill_switch = "true"', async () => {
    await env.VISITORS.put('kill_switch', 'true')
    const res = await call('/api/views')
    expect(res.status).toBe(503)
    const text = await res.text()
    expect(text).toContain('temporariamente indisponível')
  })

  it('permite requisições quando kill_switch = "false"', async () => {
    await env.VISITORS.put('kill_switch', 'false')
    const res = await call('/api/views')
    expect(res.status).not.toBe(503)
  })

  it('permite requisições quando kill_switch ausente no KV', async () => {
    const res = await call('/api/views')
    expect(res.status).not.toBe(503)
  })

  it('bloqueia todos os métodos quando ativo', async () => {
    await env.VISITORS.put('kill_switch', 'true')
    const methods = ['GET', 'POST', 'PATCH']
    for (const method of methods) {
      const res = await call('/api/hello', { method })
      expect(res.status).toBe(503)
    }
  })
})

// =============================================================================
// Rate Limiting
// =============================================================================

describe('Rate Limiting', () => {
  afterEach(async () => {
    // Limpa chaves de rate limit usadas nos testes
    const ips = ['10.10.0.1', '10.10.0.2', '10.10.0.3', '10.10.0.4', '10.10.0.5']
    await Promise.all(ips.map(ip => env.VISITORS.delete(rateKey(ip))))
  })

  it('bloqueia após 30 requisições por minuto (rota geral)', async () => {
    const ip  = '10.10.0.1'
    const key = rateKey(ip)

    // Pré-popula contador no limite
    await env.VISITORS.put(key, '30', { expirationTtl: 90 })

    const res = await call('/api/views', {
      headers: { 'CF-Connecting-IP': ip },
    })
    expect(res.status).toBe(429)
  })

  it('permite requisição quando contador está abaixo do limite', async () => {
    const ip = '10.10.0.2'
    // Sem pré-população → começa do zero

    const res = await call('/api/views', {
      headers: { 'CF-Connecting-IP': ip },
    })
    expect(res.status).not.toBe(429)
  })

  it('bloqueia /api/exam-result após 10 requisições por minuto', async () => {
    const ip  = '10.10.0.3'
    const key = rateKey(ip)

    // Limite do simulado é 10
    await env.VISITORS.put(key, '10', { expirationTtl: 90 })

    const res = await call('/api/exam-result', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': ip,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(429)
  })

  it('limite diferenciado: 10 req no contador não bloqueia rotas gerais (limite 30)', async () => {
    const ip  = '10.10.0.4'
    const key = rateKey(ip)

    // Com 10 no contador, rota geral (limite 30) ainda deve funcionar
    await env.VISITORS.put(key, '10', { expirationTtl: 90 })

    const res = await call('/api/views', {
      headers: { 'CF-Connecting-IP': ip },
    })
    expect(res.status).not.toBe(429)
  })

  it('incrementa o contador a cada requisição bem-sucedida', async () => {
    const ip  = '10.10.0.5'
    const key = rateKey(ip)

    await call('/api/views', { headers: { 'CF-Connecting-IP': ip } })
    await call('/api/views', { headers: { 'CF-Connecting-IP': ip } })

    const count = parseInt(await env.VISITORS.get(key) ?? '0')
    expect(count).toBe(2)
  })
})

// =============================================================================
// CORS e OPTIONS
// =============================================================================

describe('CORS', () => {
  it('responde OPTIONS com 204', async () => {
    const res = await call('/api/views', { method: 'OPTIONS' })
    expect(res.status).toBe(204)
  })

  it('inclui Access-Control-Allow-Origin nas respostas', async () => {
    const res = await call('/api/views')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://fxlip.com')
  })

  it('inclui Access-Control-Allow-Methods nas respostas', async () => {
    const res = await call('/api/views', { method: 'OPTIONS' })
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
  })
})

// =============================================================================
// Roteamento
// =============================================================================

describe('Roteamento', () => {
  it('retorna 404 para rota desconhecida', async () => {
    const res = await call('/api/rota-que-nao-existe')
    expect(res.status).toBe(404)
  })

  it('retorna 404 para método errado em rota existente', async () => {
    // /api/views só aceita GET
    const res = await call('/api/views', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

// =============================================================================
// POST /api/hello — validação de input (não requer D1 quando inválido)
// =============================================================================

describe('POST /api/hello — validação', () => {
  it('retorna 400 sem fingerprint', async () => {
    const res = await call('/api/hello', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'testuser' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid fingerprint')
  })

  it('retorna 400 com fingerprint curto (< 16 chars)', async () => {
    const res = await call('/api/hello', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint: 'curto' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid fingerprint')
  })

  it('retorna 400 com fingerprint não-string', async () => {
    const res = await call('/api/hello', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint: 12345678901234567 }),
    })
    expect(res.status).toBe(400)
  })

  it('aceita fingerprint válido (>= 16 chars)', async () => {
    const res = await call('/api/hello', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint: 'a'.repeat(64) }),
    })
    // Não deve ser 400 (pode ser 200 ou outro erro de DB em test env)
    expect(res.status).not.toBe(400)
  })
})

// =============================================================================
// Smoke tests — endpoints GET básicos
// =============================================================================

describe('Smoke tests — endpoints GET', () => {
  it('GET /api/views responde (sem erro 500)', async () => {
    const res = await call('/api/views?slugs=test-post')
    expect(res.status).not.toBe(500)
  })

  it('GET /api/interactions responde (sem erro 500)', async () => {
    const res = await call('/api/interactions?slug=test-post')
    expect(res.status).not.toBe(500)
  })
})

// =============================================================================
// GET /api/exam-log
// =============================================================================

describe('GET /api/exam-log', () => {
  const FP = 'examlog_test_fp_abcdef1234567890'

  beforeAll(async () => {
    const now = new Date().toISOString()
    await env.DB.prepare(
      `INSERT OR REPLACE INTO profiles (fingerprint, first_seen, last_seen, display_name, blocked)
       VALUES (?, ?, ?, ?, 0)`
    ).bind(FP, now, now, 'testuser').run()

    await env.DB.prepare(
      `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?, ?, ?, ?)`
    ).bind(FP, 'exam_result', 'prova:101-500:85', now).run()

    await env.DB.prepare(
      `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?, ?, ?, ?)`
    ).bind(FP, 'exam_result', 'topico:103:72', now).run()
  })

  it('retorna 200 com campo entries', async () => {
    const res = await call('/api/exam-log')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.entries)).toBe(true)
  })

  it('retorna entradas com campos username, type, label, pct, created_at', async () => {
    const res = await call('/api/exam-log')
    const body = await res.json()
    const entry = body.entries.find(e => e.username === 'testuser' && e.label === '101-500')
    expect(entry).toBeDefined()
    expect(entry.type).toBe('prova')
    expect(entry.pct).toBe(85)
    expect(entry.created_at).toBeDefined()
  })

  it('retorna entrada de tópico com tipo e label corretos', async () => {
    const res = await call('/api/exam-log')
    const body = await res.json()
    const entry = body.entries.find(e => e.username === 'testuser' && e.label === '103')
    expect(entry).toBeDefined()
    expect(entry.type).toBe('topico')
    expect(entry.pct).toBe(72)
  })

  it('não retorna entradas de usuários bloqueados', async () => {
    const FP2 = 'examlog_blocked_fp_xyz9876543210000'
    const now = new Date().toISOString()
    await env.DB.prepare(
      `INSERT OR REPLACE INTO profiles (fingerprint, first_seen, last_seen, display_name, blocked)
       VALUES (?, ?, ?, ?, 1)`
    ).bind(FP2, now, now, 'blocked_user').run()
    await env.DB.prepare(
      `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?, ?, ?, ?)`
    ).bind(FP2, 'exam_result', 'prova:101-500:90', now).run()

    const res = await call('/api/exam-log')
    const body = await res.json()
    expect(body.entries.find(e => e.username === 'blocked_user')).toBeUndefined()
  })

  it('não expõe método POST (retorna 404)', async () => {
    const res = await call('/api/exam-log', { method: 'POST' })
    expect(res.status).toBe(404)
  })
})
