export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return corsResponse(env, new Response(null, { status: 204 }));
    }

    // Kill switch — ativar via: wrangler kv:key put --binding=VISITORS kill_switch true
    if (await isKillSwitchActive(env)) {
      return new Response('Serviço temporariamente indisponível', { status: 503 });
    }

    const url = new URL(request.url);

    try {
      // Rate limiting por IP — in-memory (globalThis._rl), sync, sem KV put
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const limited = checkRateLimitInMemory(
        ip,
        url.pathname === '/api/exam-result' ? RATE_LIMIT_EXAM : RATE_LIMIT_GENERAL
      );
      if (limited) return corsResponse(env, jsonResponse({ error: "Too many requests" }, 429));

      if (url.pathname === "/api/hello" && request.method === "POST") {
        return corsResponse(env, await handleHello(request, env));
      }
      if (url.pathname === "/api/view" && request.method === "POST") {
        return corsResponse(env, await handleView(request, env));
      }
      if (url.pathname === "/api/views" && request.method === "GET") {
        return corsResponse(env, await handleViewsBatch(request, env));
      }
      if (url.pathname === "/api/ping" && request.method === "POST") {
        return corsResponse(env, await handlePing(request, env));
      }
      if (url.pathname === "/api/interact" && request.method === "POST") {
        return corsResponse(env, await handleInteract(request, env));
      }
      if (url.pathname === "/api/interactions" && request.method === "GET") {
        return corsResponse(env, await handleInteractions(request, env));
      }
      if (url.pathname === "/api/interactions/batch" && request.method === "GET") {
        return corsResponse(env, await handleInteractionsBatch(request, env));
      }
      if (url.pathname === "/api/report" && request.method === "GET") {
        return handleReport(request, env);
      }
      // Rotas de perfil de usuário
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'api' && pathParts[1] === 'user' && pathParts[2] && request.method === 'GET') {
        if (pathParts.length === 3) return corsResponse(env, await handleGetUser(request, env, pathParts[2]));
        if (pathParts.length === 4 && pathParts[3] === 'activity') return corsResponse(env, await handleGetUserActivity(request, env, pathParts[2]));
        if (pathParts.length === 4 && pathParts[3] === 'avatar') return await handleGetUserAvatar(request, env, pathParts[2]);
      }
      if (url.pathname === '/api/profile' && request.method === 'PATCH') {
        return corsResponse(env, await handlePatchProfile(request, env));
      }
      if (url.pathname === '/api/auth/start' && request.method === 'GET') {
        return corsResponse(env, await handleAuthStart(request, env));
      }
      if (url.pathname === '/api/auth/callback' && request.method === 'POST') {
        return corsResponse(env, await handleAuthCallback(request, env));
      }
      if (url.pathname === '/api/refresh' && request.method === 'POST') {
        return corsResponse(env, await handleRefresh(request, env));
      }
      if (url.pathname === '/api/exam-result' && request.method === 'POST') {
        return corsResponse(env, await handleExamResult(request, env));
      }
      if (url.pathname === '/api/exam-log' && request.method === 'GET') {
        return corsResponse(env, await handleExamLog(env));
      }
      if (url.pathname === '/api/profile/unlink' && request.method === 'POST') {
        return corsResponse(env, await handleProfileUnlink(request, env));
      }
      return corsResponse(env, new Response("Not Found", { status: 404 }));
    } catch (err) {
      return corsResponse(env, jsonResponse({ error: "Internal error" }, 500));
    }
  }
};

// --- Helpers ---

function today() {
  return new Date().toISOString().substring(0, 10); // "YYYY-MM-DD"
}

function updateCluster(existingJson, now) {
  const d = new Date(now);
  const c = JSON.parse(existingJson || '{}');
  if (!c.dow)  c.dow  = {};
  if (!c.hour) c.hour = {};
  const dow  = String(d.getUTCDay());
  const hour = String(d.getUTCHours());
  c.dow[dow]   = (c.dow[dow]   || 0) + 1;
  c.hour[hour] = (c.hour[hour] || 0) + 1;
  return JSON.stringify(c);
}

function parseUA(ua) {
  if (!ua) return {};
  const mobile   = /Mobile|Android|iPhone|iPad/i.test(ua);
  const tablet   = /iPad|Tablet/i.test(ua);
  const browser  = ua.match(/(Chrome|Firefox|Safari|Edge|OPR)\/([0-9.]+)/)?.[1] || null;
  const bv       = ua.match(/(Chrome|Firefox|Safari|Edge|OPR)\/([0-9.]+)/)?.[2] || null;
  const os       = ua.match(/(Windows NT|Mac OS X|Linux|Android|iOS)[ /]?([0-9._]*)/)?.[1] || null;
  const osv      = ua.match(/(Windows NT|Mac OS X|Linux|Android|iOS)[ /]?([0-9._]*)/)?.[2] || null;
  return {
    browser, bv, os, osv,
    device_type: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop'
  };
}

function refererDomain(req) {
  try { return new URL(req.headers.get('Referer') || '').hostname || null; }
  catch (_) { return null; }
}

function stripTags(str) {
  return str ? String(str).replace(/<[^>]*>/g, '').trim() : '';
}

function corsResponse(env, response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN || "https://fxlip.com");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(response.body, { status: response.status, headers });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- Kill Switch & Rate Limiting via KV ---

const RATE_LIMIT_GENERAL = 30;  // req/min por IP (rotas gerais)
const RATE_LIMIT_EXAM    = 10;  // req/min por IP (simulado — previne scraping de questões)
const KV_THROTTLE_MS     = 3_600_000; // 1h — intervalo mínimo entre writes de visitor:{fp}

async function isKillSwitchActive(env) {
  const val = await env.VISITORS.get('kill_switch');
  return val === 'true';
}

// Rate limiting in-memory via globalThis._rl.
// globalThis persiste durante o ciclo de vida da instância do Worker,
// tornando o KV desnecessário para controle de flood por IP.
// Tradeoff: não é cross-instance, mas Workers do mesmo colo geralmente
// ficam na mesma instância. Aceitável para blog pessoal.
function checkRateLimitInMemory(ip, limit = RATE_LIMIT_GENERAL) {
  const win = Math.floor(Date.now() / 60_000);
  const key = `${ip}:${win}`;
  if (!globalThis._rl) globalThis._rl = new Map();
  const cur = (globalThis._rl.get(key) || 0) + 1;
  globalThis._rl.set(key, cur);
  // Limpa janelas antigas para não crescer indefinidamente
  for (const k of globalThis._rl.keys()) {
    if (!k.endsWith(`:${win}`)) globalThis._rl.delete(k);
  }
  return cur > limit;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// =======================================================================
// POST /api/hello
// Body: { fingerprint: string, name?: string }
// =======================================================================
async function handleHello(request, env) {
  const body = await request.json();
  const { fingerprint, name } = body;

  if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length < 16) {
    return jsonResponse({ error: "Invalid fingerprint" }, 400);
  }

  const cleanName = name
    ? (name
        .replace(/<[^>]*>/g, "")   // strip HTML
        .toLowerCase()
        .replace(/\s+/g, "-")      // espaço → traço
        .replace(/[^a-z0-9\u00e0-\u00fa-]/g, "") // só letras, números, traço e acentuadas
        .replace(/^-+|-+$/g, "")  // sem traço no início ou fim
        .replace(/-{2,}/g, "-")   // sem traço duplo
        .substring(0, 30) || null)
    : null;

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const geo = request.cf || {};
  const key = `visitor:${fingerprint}`;
  const now = new Date().toISOString();

  let visitor = null;
  const raw = await env.VISITORS.get(key);
  if (raw) {
    try { visitor = JSON.parse(raw); } catch (_) {}
  }

  let previousLastSeen = null;
  let previousCity = null;
  const previousName = visitor ? (visitor.name || null) : null;

  // Pre-check no D1: blocked + display_name existente
  // Deve ocorrer ANTES de qualquer escrita para impedir re-inserção de banidos
  let preCheckDisplayName = null;
  if (env.DB) {
    try {
      const preCheck = await env.DB.prepare(
        `SELECT blocked, display_name, last_seen FROM profiles WHERE fingerprint = ?`
      ).bind(fingerprint).first();
      if (preCheck) {
        if (preCheck.blocked) {
          // Limpa nome do KV para não aparecer em cache local do visitante
          if (previousName) {
            try { await env.VISITORS.delete(`name:${previousName.toLowerCase()}`); } catch (_) {}
          }
          if (visitor) {
            visitor.name = null;
            await env.VISITORS.put(key, JSON.stringify(visitor), { expirationTtl: 31536000 });
          }
          return jsonResponse({ error: 'blocked' }, 403);
        }
        preCheckDisplayName = preCheck.display_name || null;
      }
    } catch (_) {}
  }

  if (!visitor) {
    visitor = {
      name: cleanName,
      visits: 1,
      firstSeen: now,
      lastSeen: now,
      ip: await sha256(ip + (env.SALT || "")),
      country: geo.country || null,
      city: geo.city || null,
    };
  } else {
    previousLastSeen = visitor.lastSeen || null;
    previousCity = visitor.city || null;
    visitor.visits += 1;
    visitor.lastSeen = now;
    visitor.ip = await sha256(ip + (env.SALT || ""));
    visitor.country = geo.country || null;
    visitor.city = geo.city || null;
    if (cleanName) visitor.name = cleanName;
  }

  // Visitantes sem nome não são registrados — o site não desbloqueia sem identificação
  if (!visitor.name) {
    return jsonResponse({ name: null, visits: visitor.visits });
  }

  // Nomes reservados — espelha o BLACKLIST do profile.js + rotas do worker
  const RESERVED_NAMES = new Set([
    'linux','sobre','setup','manifesto','arquivos','feed','www','infosec',
    'busca','s','x','404','robots','sitemap','assets','files','favicon','api','admin',
    'u','p','tag','category','page','search','post','posts',
  ]);

  // Slugs de post são hashes hex de 16 chars — bloqueia para evitar colisão de rota
  const POST_SLUG_RE = /^[0-9a-f]{16}$/;

  // Verificar unicidade do nome no KV (O(1), sem varrer D1)
  if (cleanName && cleanName !== previousName) {
    const nameLower = cleanName.toLowerCase();

    if (RESERVED_NAMES.has(nameLower) || POST_SLUG_RE.test(nameLower)) {
      return jsonResponse({
        error: 'name_taken',
        visits: visitor.visits,
        name: previousName,
        lastSeen: previousLastSeen,
        city: previousCity || visitor.city,
      });
    }

    // Rate limit: máx 3 novos registros por IP por 24h (só para fingerprints sem nome ainda)
    if (!previousName && ip !== 'unknown') {
      const ipHash  = await sha256(ip);
      const regKey  = `reg_limit:${ipHash}`;
      const regRaw  = await env.VISITORS.get(regKey);
      const regCount = regRaw ? parseInt(regRaw, 10) : 0;
      if (regCount >= 3) {
        return jsonResponse({
          error: 'registration_limit',
          visits: visitor.visits,
          name: null,
          lastSeen: previousLastSeen,
          city: previousCity || visitor.city,
        });
      }
      await env.VISITORS.put(regKey, String(regCount + 1), { expirationTtl: 86400 });
    }

    const takenBy = await env.VISITORS.get(`name:${nameLower}`);
    if (takenBy && takenBy !== fingerprint) {
      return jsonResponse({
        error: 'name_taken',
        visits: visitor.visits,
        name: previousName,
        lastSeen: previousLastSeen,
        city: previousCity || visitor.city,
      });
    }
    await env.VISITORS.put(`name:${nameLower}`, fingerprint, { expirationTtl: 31536000 });
    if (previousName && previousName.toLowerCase() !== nameLower) {
      await env.VISITORS.delete(`name:${previousName.toLowerCase()}`);
    }
  }

  // Camada 3: só escreve no KV se nome mudou ou se passou mais de 1h desde o último write.
  // Evita 1 KV put por page load para visitantes frequentes.
  const nameChanged = cleanName !== null && cleanName !== previousName;
  const needsKvWrite = !visitor._kw || Date.now() - visitor._kw > KV_THROTTLE_MS || nameChanged;
  if (needsKvWrite) {
    visitor._kw = Date.now();
    await env.VISITORS.put(key, JSON.stringify(visitor), { expirationTtl: 31536000 });
  }

  // Camada 4: usa last_seen do D1 como gate diário em vez de uma chave KV separada.
  // preCheck já foi lido no início da função — sem round-trip extra ao D1.
  if (env.DB) {
    const alreadySynced = preCheck?.last_seen?.startsWith(today());
    if (!alreadySynced) {
      const cf  = request.cf || {};
      const ua  = parseUA(request.headers.get('User-Agent'));
      const cluster = updateCluster(visitor._cluster || '{}', now);
      visitor._cluster = cluster;

      try {
        await env.DB.prepare(`
          INSERT INTO profiles
            (fingerprint, first_seen, last_seen, visits_count,
             country, continent, region, region_code, city, postal_code,
             latitude, longitude, timezone, metro_code, is_eu_country,
             asn, as_organization, colo,
             http_protocol, tls_version, tls_cipher,
             bot_score, verified_bot,
             ua_browser, ua_browser_ver, ua_os, ua_os_ver, ua_device_type, ua_raw,
             accept_language, referer_domain, cf_ray,
             activity_cluster, raw_cf_data, last_ip)
          VALUES (?,?,?,1, ?,?,?,?,?,?, ?,?,?,?,?, ?,?,?, ?,?,?, ?,?, ?,?,?,?,?,?, ?,?,?, ?,?,?)
          ON CONFLICT(fingerprint) DO UPDATE SET
            last_seen        = excluded.last_seen,
            visits_count     = visits_count + 1,
            last_ip          = excluded.last_ip,
            country          = COALESCE(country, excluded.country),
            city             = COALESCE(city, excluded.city),
            region           = COALESCE(region, excluded.region),
            timezone         = COALESCE(timezone, excluded.timezone),
            ua_browser       = COALESCE(ua_browser, excluded.ua_browser),
            ua_os            = COALESCE(ua_os, excluded.ua_os),
            ua_os_ver        = COALESCE(ua_os_ver, excluded.ua_os_ver),
            ua_device_type   = COALESCE(ua_device_type, excluded.ua_device_type),
            ua_raw           = COALESCE(ua_raw, excluded.ua_raw),
            activity_cluster = excluded.activity_cluster,
            raw_cf_data      = excluded.raw_cf_data
        `).bind(
          fingerprint, now, now,
          cf.country ?? null,
          cf.continent ?? null,
          cf.region ?? null,
          cf.regionCode ?? null,
          cf.city ?? null,
          cf.postalCode ?? null,
          cf.latitude ?? null,
          cf.longitude ?? null,
          cf.timezone ?? null,
          cf.metroCode ?? null,
          cf.isEUCountry ? 1 : 0,
          cf.asn ?? null,
          cf.asOrganization ?? null,
          cf.colo ?? null,
          cf.httpProtocol ?? null,
          cf.tlsVersion ?? null,
          cf.tlsCipher ?? null,
          cf.botManagement?.score ?? null,
          cf.botManagement?.verifiedBot ? 1 : 0,
          ua.browser ?? null,
          ua.bv ?? null,
          ua.os ?? null,
          ua.osv ?? null,
          ua.device_type ?? null,
          request.headers.get('User-Agent'),
          request.headers.get('Accept-Language'),
          refererDomain(request),
          request.headers.get('CF-Ray'),
          cluster,
          JSON.stringify(cf),
          ip !== 'unknown' ? ip : null
        ).run();

      } catch (_) {}
    }

    // display_name: UPSERT para garantir consistência quando INSERT diário falhou
    // (ex: D1 timeout no primeiro acesso → daily gate setada mas linha não criada)
    // NÃO executa se a conta foi deletada (previousName existe mas D1 não tem a linha):
    // nesse caso o UPSERT recriaria o perfil que o admin acabou de remover.
    const isDeletedAccount = previousName && !preCheckDisplayName;
    if (cleanName && !isDeletedAccount) {
      try {
        await env.DB.prepare(`
          INSERT INTO profiles (fingerprint, first_seen, last_seen, visits_count, display_name)
          VALUES (?, ?, ?, 0, ?)
          ON CONFLICT(fingerprint) DO UPDATE SET display_name = excluded.display_name
        `).bind(fingerprint, now, now, cleanName).run();
      } catch (_) {}

      // Registra evento de nome apenas quando muda
      if (cleanName !== previousName) {
        const evType = previousName ? 'name_updated' : 'name_set';
        try {
          // Deduplicação: evita duplicata por lag de replicação do D1
          const recentEvt = await env.DB.prepare(
            `SELECT id FROM profile_events WHERE profile_id = ? AND event_type = ? AND content = ? AND created_at > datetime('now', '-5 minutes') LIMIT 1`
          ).bind(fingerprint, evType, cleanName).first();
          if (!recentEvt) {
            await env.DB.prepare(
              `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?,?,?,?)`
            ).bind(fingerprint, evType, cleanName, now).run();
          }
        } catch (_) {}
      }
    }
  }

  // Busca stats do D1 + verifica se o perfil foi deletado pelo admin
  let stats = { total_time_spent: 0, first_seen: null, comments: 0, upvotes: 0, gender: null };
  let accountDeleted = false;

  if (env.DB) {
    try {
      const row = await env.DB.prepare(`
        SELECT p.total_time_spent, p.first_seen, p.gender,
          SUM(CASE WHEN i.type = 'comment'           THEN 1 ELSE 0 END) AS comments,
          SUM(CASE WHEN i.type IN ('upvote','like')  THEN 1 ELSE 0 END) AS upvotes
        FROM profiles p
        LEFT JOIN interactions i ON i.profile_id = p.fingerprint
        WHERE p.fingerprint = ?
        GROUP BY p.fingerprint
      `).bind(fingerprint).first();

      if (row) {
        stats.total_time_spent = row.total_time_spent || 0;
        stats.first_seen       = row.first_seen       || null;
        stats.comments         = row.comments         || 0;
        stats.upvotes          = row.upvotes          || 0;
        stats.gender           = row.gender           || null;
      }

      // Detectar exclusão: havia nome no KV mas D1 não tem display_name
      // preCheckDisplayName foi capturado antes de qualquer escrita — sem risco de falso-positivo
      // para novos usuários (previousName é null até o usuário submeter um nome)
      if (previousName && !preCheckDisplayName) {
        accountDeleted = true;
        visitor.name   = null;
        try { await env.VISITORS.delete(`name:${previousName.toLowerCase()}`); } catch (_) {}
        await env.VISITORS.put(key, JSON.stringify(visitor), { expirationTtl: 31536000 });
      }
    } catch (_) {}
  }

  return jsonResponse({
    visits:           visitor.visits,
    name:             visitor.name,
    lastSeen:         previousLastSeen,
    city:             previousCity || visitor.city,
    total_time_spent: stats.total_time_spent,
    first_seen:       stats.first_seen,
    comments:         stats.comments,
    upvotes:          stats.upvotes,
    gender:           stats.gender,
    account_deleted:  accountDeleted || undefined,
  });
}


// =======================================================================
// POST /api/view
// Body: { slug: string } ou { slugs: [string] }
// =======================================================================
async function handleView(request, env) {
  const body = await request.json();
  const slugs = body.slugs || (body.slug ? [body.slug] : []);

  if (slugs.length === 0 || slugs.length > 50) {
    return jsonResponse({ error: "Invalid slugs" }, 400);
  }

  if (!env.DB) return jsonResponse({ error: "DB not configured" }, 503);

  const ip     = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = (await sha256(ip + (env.SALT || ""))).substring(0, 16);
  const date   = today();
  const now    = new Date().toISOString();
  const results = {};

  await Promise.all(slugs.map(async (slug) => {
    if (typeof slug !== "string" || slug.length > 100) return;
    try {
      // Dedup diário por IP×slug — INSERT OR IGNORE não conta duplicatas
      const inserted = await env.DB.prepare(`
        INSERT OR IGNORE INTO page_view_ips (slug, ip_hash, date) VALUES (?, ?, ?)
      `).bind(slug, ipHash, date).run();

      if (inserted.meta.changes > 0) {
        // Nova combinação IP×data — incrementa o contador agregado
        await env.DB.prepare(`
          INSERT INTO page_views (slug, view_count, updated_at) VALUES (?, 1, ?)
          ON CONFLICT(slug) DO UPDATE SET
            view_count = view_count + 1,
            updated_at = excluded.updated_at
        `).bind(slug, now).run();
      }

      const row = await env.DB.prepare(
        `SELECT view_count FROM page_views WHERE slug = ?`
      ).bind(slug).first();
      results[slug] = row?.view_count || 0;
    } catch (_) {
      results[slug] = 0;
    }
  }));

  // Retrocompatível: se veio slug único, retorna { views: N }
  if (body.slug && !body.slugs) {
    return jsonResponse({ views: results[body.slug] || 0 });
  }

  return jsonResponse(results);
}

// =======================================================================
// GET /api/views?slugs=slug1,slug2,slug3
// =======================================================================
async function handleViewsBatch(request, env) {
  const url = new URL(request.url);
  const slugsParam = url.searchParams.get("slugs") || "";
  const slugs = slugsParam.split(",").filter(s => s.length > 0).slice(0, 50);

  if (slugs.length === 0) return jsonResponse({});
  if (!env.DB) return jsonResponse({});

  const results = {};
  await Promise.all(slugs.map(async (slug) => {
    try {
      const row = await env.DB.prepare(
        `SELECT view_count FROM page_views WHERE slug = ?`
      ).bind(slug).first();
      results[slug] = row?.view_count || 0;
    } catch (_) {
      results[slug] = 0;
    }
  }));

  return jsonResponse(results);
}

// =======================================================================
// POST /api/ping
// Body: { fingerprint: string, seconds: number }
// Recebe tempo ativo acumulado no cliente e persiste direto no D1.
// Sem leitura/escrita no KV.
// =======================================================================
async function handlePing(request, env) {
  if (!env.DB) return jsonResponse({ ok: true });

  const body = await request.json();
  const { fingerprint, seconds } = body;

  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 16) {
    return jsonResponse({ error: 'Invalid fingerprint' }, 400);
  }

  const secs = Math.floor(Number(seconds) || 0);
  // Aceita valores entre 10s e 310s (margem: 5min + 10s de tolerância)
  if (secs < 10 || secs > 310) return jsonResponse({ ok: true });

  try {
    await env.DB.prepare(
      `UPDATE profiles SET total_time_spent = total_time_spent + ? WHERE fingerprint = ?`
    ).bind(secs, fingerprint).run();
  } catch (_) {}

  return jsonResponse({ ok: true });
}

// =======================================================================
// POST /api/interact
// Body: { fingerprint, target_slug, target_type, type, content? }
// =======================================================================
async function handleInteract(request, env) {
  if (!env.DB) return jsonResponse({ error: 'DB not configured' }, 503);

  const body = await request.json();
  const { fingerprint, target_slug, target_type, type, content } = body;

  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 16) {
    return jsonResponse({ error: 'Invalid fingerprint' }, 400);
  }
  if (!target_slug || typeof target_slug !== 'string' || target_slug.length > 128) {
    return jsonResponse({ error: 'Invalid target_slug' }, 400);
  }
  if (!['post', 'card'].includes(target_type)) {
    return jsonResponse({ error: 'Invalid target_type' }, 400);
  }
  if (!['comment', 'like', 'upvote', 'click'].includes(type)) {
    return jsonResponse({ error: 'Invalid type' }, 400);
  }

  // Blocked check: perfil banido não pode interagir (linha sem blocked = deletado, permite)
  try {
    const blockedRow = await env.DB.prepare(
      `SELECT blocked FROM profiles WHERE fingerprint = ?`
    ).bind(fingerprint).first();
    if (blockedRow && blockedRow.blocked) {
      return jsonResponse({ error: 'blocked' }, 403);
    }
  } catch (_) {}

  // Rate limiting via KV
  const hourKey = `ratelimit:interact:${fingerprint}:${today()}-${new Date().getUTCHours()}`;
  const limit   = type === 'comment' ? 5 : type === 'click' ? 50 : 30;
  const rawCount = await env.VISITORS.get(hourKey);
  const count   = rawCount ? parseInt(rawCount) : 0;
  if (count >= limit) return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  await env.VISITORS.put(hourKey, String(count + 1), { expirationTtl: 3600 });

  const now = new Date().toISOString();

  if (type === 'comment') {
    const safeContent = stripTags(content || '').substring(0, 500);
    if (!safeContent) return jsonResponse({ error: 'Empty content' }, 400);

    // Garante que o perfil existe antes de inserir (upsert mínimo)
    try {
      await env.DB.prepare(`
        INSERT INTO profiles (fingerprint, first_seen, last_seen, visits_count)
        VALUES (?, ?, ?, 0)
        ON CONFLICT(fingerprint) DO NOTHING
      `).bind(fingerprint, now, now).run();
    } catch (_) {}

    const result = await env.DB.prepare(`
      INSERT INTO interactions (profile_id, target_slug, target_type, type, content, created_at)
      VALUES (?, ?, ?, 'comment', ?, ?)
    `).bind(fingerprint, target_slug, target_type, safeContent, now).run();

    // Busca display_name do KV
    let name = 'anon';
    const visitorRaw = await env.VISITORS.get(`visitor:${fingerprint}`);
    if (visitorRaw) {
      try { const v = JSON.parse(visitorRaw); if (v.name) name = v.name; } catch (_) {}
    }

    return jsonResponse({
      ok: true,
      comment: { id: result.meta?.last_row_id, content: safeContent, name, created_at: now }
    });
  }

  // like / upvote — INSERT OR IGNORE via unique index
  try {
    await env.DB.prepare(`
      INSERT INTO profiles (fingerprint, first_seen, last_seen, visits_count)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(fingerprint) DO NOTHING
    `).bind(fingerprint, now, now).run();

    await env.DB.prepare(`
      INSERT OR IGNORE INTO interactions (profile_id, target_slug, target_type, type, content, created_at)
      VALUES (?, ?, ?, ?, NULL, ?)
    `).bind(fingerprint, target_slug, target_type, type, now).run();
  } catch (_) {}

  return jsonResponse({ ok: true });
}

// =======================================================================
// GET /api/interactions?slug=SLUG&target_type=TYPE
// Thread completa de comentários + contagens de likes/upvotes
// =======================================================================
async function handleInteractions(request, env) {
  if (!env.DB) return jsonResponse({ likes: 0, upvotes: 0, comments: [] });

  const url  = new URL(request.url);
  const slug = url.searchParams.get('slug') || '';
  const ttype = url.searchParams.get('target_type') || 'post';

  if (!slug || slug.length > 128 || !['post','card'].includes(ttype)) {
    return jsonResponse({ error: 'Invalid params' }, 400);
  }

  const [likesRow, upvotesRow, commentsRows] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) as n FROM interactions WHERE target_slug=? AND target_type=? AND type='like'`
    ).bind(slug, ttype).first(),
    env.DB.prepare(
      `SELECT COUNT(*) as n FROM interactions WHERE target_slug=? AND target_type=? AND type='upvote'`
    ).bind(slug, ttype).first(),
    env.DB.prepare(`
      SELECT i.id, i.content, i.created_at, i.profile_id
      FROM interactions i
      WHERE i.target_slug=? AND i.target_type=? AND i.type='comment'
      ORDER BY i.created_at DESC LIMIT 50
    `).bind(slug, ttype).all(),
  ]);

  // Enriquece comentários com dados do D1 (display_name + avatar)
  const fps = [...new Set((commentsRows.results || []).map(r => r.profile_id))];
  const profileMap = new Map();
  if (fps.length) {
    const placeholders = fps.map(() => '?').join(',');
    const pRows = await env.DB.prepare(
      `SELECT fingerprint, display_name,
              COALESCE(twitter_avatar_url, google_avatar_url) AS oauth_avatar_url,
              avatar_data IS NOT NULL AND avatar_data != '' AS has_avatar
       FROM profiles WHERE fingerprint IN (${placeholders})`
    ).bind(...fps).all();
    (pRows.results || []).forEach(p => profileMap.set(p.fingerprint, p));
  }

  const comments = (commentsRows.results || []).map(row => {
    const p = profileMap.get(row.profile_id) || {};
    return {
      id:              row.id,
      content:         row.content,
      name:            p.display_name || 'anon',
      oauth_avatar_url: p.oauth_avatar_url || null,
      has_avatar:      !!p.has_avatar,
      created_at:      row.created_at,
    };
  });

  return jsonResponse({
    likes:    likesRow?.n    || 0,
    upvotes:  upvotesRow?.n  || 0,
    comments: comments.reverse(), // mais antigos primeiro
  });
}

// =======================================================================
// GET /api/interactions/batch?slugs=s1,s2&target_type=TYPE
// Só contagens — para home e infinite scroll
// =======================================================================
async function handleInteractionsBatch(request, env) {
  if (!env.DB) return jsonResponse({});

  const url    = new URL(request.url);
  const slugsP = url.searchParams.get('slugs') || '';
  const ttype  = url.searchParams.get('target_type') || 'post';
  const slugs  = slugsP.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.length <= 128).slice(0, 50);

  if (slugs.length === 0 || !['post','card'].includes(ttype)) {
    return jsonResponse({});
  }

  const placeholders = slugs.map(() => '?').join(',');
  const rows = await env.DB.prepare(`
    SELECT target_slug, type, COUNT(*) as n
    FROM interactions
    WHERE target_slug IN (${placeholders}) AND target_type = ?
    GROUP BY target_slug, type
  `).bind(...slugs, ttype).all();

  const result = {};
  slugs.forEach(s => { result[s] = { likes: 0, upvotes: 0, comments: 0, clicks: 0 }; });
  (rows.results || []).forEach(row => {
    if (!result[row.target_slug]) result[row.target_slug] = { likes: 0, upvotes: 0, comments: 0, clicks: 0 };
    if (row.type === 'like')    result[row.target_slug].likes    = row.n;
    if (row.type === 'upvote')  result[row.target_slug].upvotes  = row.n;
    if (row.type === 'comment') result[row.target_slug].comments = row.n;
    if (row.type === 'click')   result[row.target_slug].clicks   = row.n;
  });

  return jsonResponse(result);
}

// =======================================================================
// GET /api/report (Authorization: Bearer TOKEN)
// Retorna todos os visitantes e views para gerar _data/visitors.yml
// =======================================================================
async function handleReport(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const visitors = [];
  const views = {};
  let cursor = null;

  // Pagina por todas as keys do KV
  do {
    const list = await env.VISITORS.list({ cursor, limit: 500 });

    await Promise.all(list.keys.map(async (key) => {
      const raw = await env.VISITORS.get(key.name);
      if (!raw) return;

      try {
        const data = JSON.parse(raw);

        if (key.name.startsWith("visitor:")) {
          if (data.name) {
            visitors.push({
              name: data.name,
              visits: data.visits || 0,
              firstSeen: data.firstSeen || null,
              lastSeen: data.lastSeen || null,
              country: data.country || null,
              city: data.city || null,
            });
          }
        } else if (key.name.startsWith("views:")) {
          const slug = key.name.replace("views:", "");
          views[slug] = data.count || 0;
        }
      } catch (_) {}
    }));

    cursor = list.list_complete ? null : list.cursor;
  } while (cursor);

  // Ordena visitantes por última visita (mais recente primeiro)
  visitors.sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""));

  return jsonResponse({
    generated: new Date().toISOString(),
    total_visitors: visitors.length,
    total_pages: Object.keys(views).length,
    visitors,
    views,
  });
}

// =======================================================================
// GET /api/user/:name
// Perfil público de usuário (sem email)
// =======================================================================
async function handleGetUser(request, env, username) {
  if (!env.DB) return jsonResponse({ error: 'Not found' }, 404);

  const name = decodeURIComponent(username);

  const row = await env.DB.prepare(`
    SELECT fingerprint, display_name, city, country, first_seen, last_seen,
           visits_count, total_time_spent, activity_cluster,
           email, instagram, twitter, github, bio, gender,
           blocked,
           ua_browser, ua_os, ua_device_type, ua_raw,
           COALESCE(google_avatar_url, twitter_avatar_url, oauth_avatar_url) AS oauth_avatar_url,
           avatar_data IS NOT NULL AND avatar_data != '' AS has_avatar
    FROM profiles
    WHERE LOWER(display_name) = LOWER(?)
    LIMIT 1
  `).bind(name).first();

  if (!row) return jsonResponse({ error: 'Not found' }, 404);
  if (row.blocked) return jsonResponse({ error: 'Not found' }, 404);

  // Gravatar hash (SHA-256 do email — nunca expõe o email raw)
  let gravatar_hash = '00000000000000000000000000000000';
  if (row.email) {
    const buf = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(row.email.trim().toLowerCase()));
    gravatar_hash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }

  const statsRow = await env.DB.prepare(`
    SELECT type, COUNT(*) as n
    FROM interactions
    WHERE profile_id = ?
    GROUP BY type
  `).bind(row.fingerprint).all();

  const stats = { comments: 0, likes: 0, upvotes: 0 };
  (statsRow.results || []).forEach(r => {
    if (r.type === 'comment') stats.comments = r.n;
    if (r.type === 'like')    stats.likes    = r.n;
    if (r.type === 'upvote')  stats.upvotes  = r.n;
  });

  return jsonResponse({
    display_name:     row.display_name,
    city:             row.city,
    country:          row.country,
    first_seen:       row.first_seen,
    last_seen:        row.last_seen,
    visits_count:     row.visits_count,
    total_time_spent: row.total_time_spent,
    activity_cluster: row.activity_cluster,
    gravatar_hash:    gravatar_hash,
    has_avatar:       !!row.has_avatar,
    gender:           row.gender          || null,
    email_connected:  !!row.email,
    instagram:        row.instagram       || null,
    twitter:          row.twitter         || null,
    github:           row.github          || null,
    bio:              row.bio             || null,
    fp_short:         row.fingerprint ? row.fingerprint.substring(0, 8) : null,
    ua_browser:       row.ua_browser       || null,
    ua_os:            row.ua_os            || null,
    ua_device_type:   row.ua_device_type   || null,
    ua_raw:           row.ua_raw           || null,
    oauth_avatar_url: row.oauth_avatar_url || null,
    interactions:     stats,
  });
}

// =======================================================================
// PATCH /api/profile
// Body: { fingerprint, email? }
// Atualiza dados do próprio perfil (verificado por fingerprint)
// =======================================================================
async function handlePatchProfile(request, env) {
  if (!env.DB) return jsonResponse({ error: 'Not available' }, 503);

  const body = await request.json();
  const { fingerprint, email, gender, whatsapp, instagram, twitter } = body;

  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 16) {
    return jsonResponse({ error: 'Invalid fingerprint' }, 400);
  }

  const exists = await env.DB.prepare(
    `SELECT blocked FROM profiles WHERE fingerprint = ?`
  ).bind(fingerprint).first();
  if (!exists) return jsonResponse({ error: 'Profile not found' }, 404);
  if (exists.blocked) return jsonResponse({ error: 'blocked' }, 403);

  const updates = [];
  const values  = [];

  if (email !== undefined) {
    const safeEmail = email ? String(email).trim().toLowerCase().substring(0, 254) : null;
    updates.push('email = ?');
    values.push(safeEmail);
    // Importa avatar do Gravatar e armazena como base64
    if (safeEmail) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(safeEmail));
        const hash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
        const resp = await fetch(`https://www.gravatar.com/avatar/${hash}?s=80&d=404`);
        if (resp.ok) {
          const imgBuf = await resp.arrayBuffer();
          const bytes  = new Uint8Array(imgBuf);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          updates.push('avatar_data = ?');
          values.push(btoa(binary));
        }
      } catch (_) {}
    }
  }

  if (gender !== undefined) {
    if (gender !== null && !['m','f','nb'].includes(gender)) {
      return jsonResponse({ error: 'Invalid gender' }, 400);
    }
    updates.push('gender = ?');
    values.push(gender);
  }
  const genderChanged = gender !== undefined;

  if (whatsapp !== undefined) {
    const safeWa = whatsapp ? String(whatsapp).replace(/[^\d+\-\s()]/g, '').substring(0, 20) : null;
    updates.push('whatsapp = ?');
    values.push(safeWa);
  }

  if (instagram !== undefined) {
    const safeIg = instagram ? String(instagram).replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').substring(0, 30) : null;
    updates.push('instagram = ?');
    values.push(safeIg);
  }

  if (twitter !== undefined) {
    const safeTw = twitter ? String(twitter).replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').substring(0, 15) : null;
    updates.push('twitter = ?');
    values.push(safeTw);
  }

  if (updates.length === 0) return jsonResponse({ ok: true });

  const now = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE profiles SET ${updates.join(', ')} WHERE fingerprint = ?`
  ).bind(...values, fingerprint).run();

  // Registra evento de gender (usa exists.gender — valor anterior ao UPDATE)
  if (genderChanged && gender) {
    const evType = exists.gender ? 'gender_updated' : 'gender_set';
    try {
      await env.DB.prepare(
        `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?,?,?,?)`
      ).bind(fingerprint, evType, gender, now).run();
    } catch (_) {}
  }

  return jsonResponse({ ok: true });
}

// =======================================================================
// POST /api/exam-result
// Registra resultado de simulado no histórico do perfil
// Body: { fingerprint, type: 'topico'|'prova', label: '101'|'101-500', pct: 85 }
// =======================================================================
async function handleExamResult(request, env) {
  if (!env.DB) return jsonResponse({ ok: false });

  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { fingerprint, type, label, pct } = body || {};
  if (!fingerprint || !type || !label || pct == null) return jsonResponse({ error: 'Missing fields' }, 400);
  if (!['topico', 'prova'].includes(type)) return jsonResponse({ error: 'Invalid type' }, 400);
  if (typeof pct !== 'number' || pct < 0 || pct > 100) return jsonResponse({ error: 'Invalid pct' }, 400);
  if (!/^[a-zA-Z0-9.\-]+$/.test(label)) return jsonResponse({ error: 'Invalid label' }, 400);

  const profile = await env.DB.prepare(
    `SELECT fingerprint FROM profiles WHERE fingerprint = ? AND blocked = 0 LIMIT 1`
  ).bind(fingerprint).first();
  if (!profile) return jsonResponse({ error: 'Profile not found' }, 404);

  const now     = new Date().toISOString();
  const content = `${type}:${label}:${pct}`;
  await env.DB.prepare(
    `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?,?,?,?)`
  ).bind(fingerprint, 'exam_result', content, now).run();

  return jsonResponse({ ok: true });
}

// =======================================================================
// GET /api/exam-log
// Retorna os últimos resultados de simulado de todos os usuários
// Resposta: { entries: [{ username, type, label, pct, created_at }] }
// =======================================================================
async function handleExamLog(env) {
  if (!env.DB) return jsonResponse({ entries: [] });

  const rows = await env.DB.prepare(`
    SELECT p.display_name AS username, pe.content, pe.created_at
    FROM profile_events pe
    JOIN profiles p ON p.fingerprint = pe.profile_id
    WHERE pe.event_type = 'exam_result'
      AND p.display_name IS NOT NULL
      AND p.display_name != ''
      AND p.blocked = 0
    ORDER BY pe.created_at DESC
    LIMIT 30
  `).all();

  const entries = (rows.results || []).map(row => {
    const parts  = (row.content || '').split(':');
    const type   = parts[0] || '';
    const label  = parts[1] || '';
    const pct    = parseInt(parts[2]) || 0;
    return { username: row.username, type, label, pct, created_at: row.created_at };
  }).filter(e => e.type && e.label);

  return jsonResponse({ entries });
}

// =======================================================================
// GET /api/user/:name/activity
// Atividade recente pública (comentários, likes, upvotes)
// =======================================================================
async function handleGetUserActivity(request, env, username) {
  if (!env.DB) return jsonResponse({ activities: [] });

  const name = decodeURIComponent(username);

  const identity = await env.DB.prepare(
    `SELECT fingerprint FROM profiles WHERE LOWER(display_name) = LOWER(?) AND blocked = 0 LIMIT 1`
  ).bind(name).first();

  if (!identity) return jsonResponse({ activities: [] });

  const rows = await env.DB.prepare(`
    SELECT type, target_slug, target_type, content, created_at, 'interaction' AS source
    FROM interactions
    WHERE profile_id = ? AND type IN ('comment', 'like', 'upvote')
    UNION ALL
    SELECT event_type AS type, NULL AS target_slug, NULL AS target_type, content, created_at, 'profile' AS source
    FROM profile_events
    WHERE profile_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).bind(identity.fingerprint, identity.fingerprint).all();

  return jsonResponse({ activities: rows.results || [] });
}

// =======================================================================
// GET /api/user/:name/avatar
// Retorna o avatar importado do Gravatar (base64 → image/jpeg)
// =======================================================================
async function handleGetUserAvatar(request, env, username) {
  if (!env.DB) return new Response('Not Found', { status: 404 });

  const name = decodeURIComponent(username);
  const row = await env.DB.prepare(
    `SELECT avatar_data FROM profiles WHERE LOWER(display_name) = LOWER(?) AND blocked = 0 LIMIT 1`
  ).bind(name).first();

  if (!row || !row.avatar_data) return new Response('Not Found', { status: 404 });

  const bytes = Uint8Array.from(atob(row.avatar_data), c => c.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://fxlip.com',
    },
  });
}

// =======================================================================
// OAuth helpers — PKCE
// =======================================================================

function base64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generatePKCE() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(64));
  const codeVerifier  = base64url(verifierBytes);
  const challengeData = new TextEncoder().encode(codeVerifier);
  const digest        = await crypto.subtle.digest('SHA-256', challengeData);
  const codeChallenge = base64url(digest);
  return { codeVerifier, codeChallenge };
}

// =======================================================================
// GET /api/auth/start?provider=X&fingerprint=FP
// Inicia o fluxo OAuth: gera state, armazena no KV, retorna URL de autorização
// =======================================================================
async function handleAuthStart(request, env) {
  const url         = new URL(request.url);
  const provider    = url.searchParams.get('provider') || '';
  const fingerprint = url.searchParams.get('fingerprint') || '';

  if (!['google', 'github', 'twitter'].includes(provider)) {
    return jsonResponse({ error: 'Invalid provider' }, 400);
  }
  if (!fingerprint || fingerprint.length < 16) {
    return jsonResponse({ error: 'Invalid fingerprint' }, 400);
  }

  // Verifica se o perfil existe e não está banido
  if (env.DB) {
    const exists = await env.DB.prepare(
      `SELECT blocked FROM profiles WHERE fingerprint = ?`
    ).bind(fingerprint).first();
    if (!exists) return jsonResponse({ error: 'Profile not found' }, 404);
    if (exists.blocked) return jsonResponse({ error: 'blocked' }, 403);
  }

  const state   = crypto.randomUUID();
  const stateData = { fingerprint, provider };
  const REDIRECT_URI = 'https://fxlip.com/auth/callback';

  let authUrl;

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id:    env.GOOGLE_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type:'code',
      scope:        'openid email profile',
      state,
      access_type:  'offline',
      prompt:       'consent',
    });
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  } else if (provider === 'github') {
    const params = new URLSearchParams({
      client_id:    env.GITHUB_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      scope:        'read:user user:email',
      state,
    });
    authUrl = `https://github.com/login/oauth/authorize?${params}`;
  } else if (provider === 'twitter') {
    const { codeVerifier, codeChallenge } = await generatePKCE();
    stateData.codeVerifier = codeVerifier;
    const params = new URLSearchParams({
      response_type:         'code',
      client_id:             env.TWITTER_CLIENT_ID || '',
      redirect_uri:          REDIRECT_URI,
      scope:                 'tweet.read users.read offline.access',
      state,
      code_challenge:        codeChallenge,
      code_challenge_method: 'S256',
    });
    authUrl = `https://twitter.com/i/oauth2/authorize?${params}`;
  }

  // Armazena state no KV com TTL de 10 minutos
  await env.VISITORS.put(`oauth_state:${state}`, JSON.stringify(stateData), { expirationTtl: 600 });

  return jsonResponse({ url: authUrl });
}

// =======================================================================
// POST /api/auth/callback
// Body: { code, state, fingerprint }
// Troca code por token, busca dados do provider, upsert no D1
// =======================================================================
async function handleAuthCallback(request, env) {
  const body = await request.json();
  const { code, state, fingerprint } = body;

  if (!code || !state || !fingerprint) {
    return jsonResponse({ error: 'Missing params' }, 400);
  }

  // Busca e valida state (one-time use)
  const rawState = await env.VISITORS.get(`oauth_state:${state}`);
  if (!rawState) return jsonResponse({ error: 'Invalid or expired state' }, 400);

  let stateData;
  try { stateData = JSON.parse(rawState); } catch (_) { return jsonResponse({ error: 'Invalid state data' }, 400); }

  if (stateData.fingerprint !== fingerprint) {
    return jsonResponse({ error: 'Fingerprint mismatch' }, 403);
  }

  // Deleta state (one-time use)
  await env.VISITORS.delete(`oauth_state:${state}`);

  const provider    = stateData.provider;
  const REDIRECT_URI = 'https://fxlip.com/auth/callback';

  let tokenData, profileData;

  try {
    if (provider === 'google') {
      tokenData   = await exchangeGoogleToken(code, REDIRECT_URI, env);
      profileData = await fetchGoogleProfile(tokenData.access_token);
    } else if (provider === 'github') {
      tokenData   = await exchangeGitHubToken(code, REDIRECT_URI, env);
      profileData = await fetchGitHubProfile(tokenData.access_token);
    } else if (provider === 'twitter') {
      tokenData   = await exchangeTwitterToken(code, REDIRECT_URI, stateData.codeVerifier, env);
      profileData = await fetchTwitterProfile(tokenData.access_token);
    } else {
      return jsonResponse({ error: 'Unknown provider' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: 'OAuth exchange failed', detail: err.message }, 502);
  }

  if (!env.DB) return jsonResponse({ error: 'DB not configured' }, 503);

  const now = new Date().toISOString();
  const providerUserId = String(profileData.id || profileData.sub || '');

  // Upsert oauth_connections
  try {
    await env.DB.prepare(`
      INSERT INTO oauth_connections
        (fingerprint, provider, provider_user_id, provider_username,
         access_token, refresh_token, token_expires_at, token_scope,
         connected_at, last_synced_at, provider_data)
      VALUES (?,?,?,?, ?,?,?,?, ?,?, ?)
      ON CONFLICT(fingerprint, provider) DO UPDATE SET
        provider_user_id  = excluded.provider_user_id,
        provider_username = excluded.provider_username,
        access_token      = excluded.access_token,
        refresh_token     = COALESCE(excluded.refresh_token, refresh_token),
        token_expires_at  = excluded.token_expires_at,
        token_scope       = excluded.token_scope,
        last_synced_at    = excluded.last_synced_at,
        provider_data     = excluded.provider_data
    `).bind(
      fingerprint, provider, providerUserId, profileData.username || profileData.login || null,
      tokenData.access_token,
      tokenData.refresh_token || null,
      tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : null,
      tokenData.scope || null,
      now, now,
      JSON.stringify(profileData)
    ).run();
  } catch (err) {
    // UNIQUE(provider, provider_user_id) violado — conta já conectada a outro fingerprint
    if (err.message && err.message.includes('UNIQUE')) {
      return jsonResponse({ error: 'account_already_linked' }, 409);
    }
    throw err;
  }

  // Enriquece profiles com dados do provider
  const profileUpdates = [];
  const profileValues  = [];

  if (provider === 'google') {
    if (profileData.email)   { profileUpdates.push('email = COALESCE(email, ?)'); profileValues.push(profileData.email); }
    if (profileData.name)    { profileUpdates.push('display_name = COALESCE(display_name, ?)'); profileValues.push(profileData.name); }
    if (profileData.picture) { profileUpdates.push('google_avatar_url = ?'); profileValues.push(profileData.picture.replace(/=s\d+-c$/, '=s400-c')); }
  } else if (provider === 'github') {
    if (profileData.login)      { profileUpdates.push('github = ?'); profileValues.push(profileData.login); }
    if (profileData.bio)        { profileUpdates.push('bio = COALESCE(bio, ?)'); profileValues.push(profileData.bio); }
    if (profileData.avatar_url) { profileUpdates.push('oauth_avatar_url = COALESCE(oauth_avatar_url, ?)'); profileValues.push(profileData.avatar_url.replace(/(\?v=\d+)$/, '$1&s=400')); }
  } else if (provider === 'twitter') {
    if (profileData.username)          { profileUpdates.push('twitter = ?'); profileValues.push(profileData.username); }
    if (profileData.description)       { profileUpdates.push('bio = COALESCE(bio, ?)'); profileValues.push(profileData.description); }
    if (profileData.profile_image_url) { profileUpdates.push('twitter_avatar_url = ?'); profileValues.push(profileData.profile_image_url.replace('_normal.', '_400x400.')); }
  }

  // Importa avatar do OAuth como base64 — fallback quando o URL externo expirar
  let avatarFetchUrl = null;
  if (provider === 'twitter' && profileData.profile_image_url) {
    avatarFetchUrl = profileData.profile_image_url.replace('_normal.', '_400x400.');
  } else if (provider === 'google' && profileData.picture) {
    avatarFetchUrl = profileData.picture.replace(/=s\d+-c$/, '=s400-c');
  }
  if (avatarFetchUrl) {
    try {
      const resp = await fetch(avatarFetchUrl);
      if (resp.ok) {
        const imgBuf = await resp.arrayBuffer();
        const bytes  = new Uint8Array(imgBuf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        profileUpdates.push('avatar_data = ?');
        profileValues.push(btoa(binary));
      }
    } catch (_) {}
  }

  if (profileUpdates.length > 0) {
    try {
      await env.DB.prepare(
        `UPDATE profiles SET ${profileUpdates.join(', ')} WHERE fingerprint = ?`
      ).bind(...profileValues, fingerprint).run();
    } catch (_) {}
  }

  // Registra evento de OAuth
  const oauthContent = provider === 'google'
    ? (profileData.name || profileData.email || null)
    : (profileData.username || profileData.login || null);
  try {
    await env.DB.prepare(
      `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?,?,?,?)`
    ).bind(fingerprint, 'oauth_' + provider, oauthContent, now).run();
  } catch (_) {}

  return jsonResponse({
    ok:       true,
    provider,
    username: oauthContent,
    data: {
      name:       profileData.name       || null,
      avatar_url: profileData.picture    || profileData.avatar_url || profileData.profile_image_url || null,
      followers:  profileData.public_metrics?.followers_count || profileData.followers || null,
    },
  });
}

// =======================================================================
// POST /api/profile/unlink
// Remove conexão OAuth e limpa colunas do provider no perfil
// Body: { fingerprint, provider: 'google'|'github'|'twitter' }
// =======================================================================
async function handleProfileUnlink(request, env) {
  if (!env.DB) return jsonResponse({ ok: false });

  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { fingerprint, provider } = body || {};
  if (!fingerprint || !['google', 'github', 'twitter'].includes(provider)) {
    return jsonResponse({ error: 'Missing or invalid fields' }, 400);
  }

  const profile = await env.DB.prepare(
    `SELECT fingerprint FROM profiles WHERE fingerprint = ? AND blocked = 0 LIMIT 1`
  ).bind(fingerprint).first();
  if (!profile) return jsonResponse({ error: 'Profile not found' }, 404);

  // Remove entrada em oauth_connections (libera para outro perfil vincular)
  await env.DB.prepare(
    `DELETE FROM oauth_connections WHERE fingerprint = ? AND provider = ?`
  ).bind(fingerprint, provider).run();

  // Limpa colunas do provider em profiles
  const clearMap = {
    google:  `google_avatar_url = NULL`,
    github:  `github = NULL, oauth_avatar_url = NULL`,
    twitter: `twitter = NULL, twitter_avatar_url = NULL`,
  };
  await env.DB.prepare(
    `UPDATE profiles SET ${clearMap[provider]} WHERE fingerprint = ?`
  ).bind(fingerprint).run();

  // Registra evento no histórico
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO profile_events (profile_id, event_type, content, created_at) VALUES (?,?,?,?)`
  ).bind(fingerprint, 'oauth_' + provider + '_unlinked', null, now).run();

  return jsonResponse({ ok: true });
}

// =======================================================================
// Token exchange helpers
// =======================================================================

async function exchangeGoogleToken(code, redirectUri, env) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  return res.json();
}

async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  const data = await res.json();
  return { ...data, id: data.id || data.sub };
}

async function exchangeGitHubToken(code, redirectUri, env) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code,
      client_id:     env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      redirect_uri:  redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);
  return res.json();
}

async function fetchGitHubProfile(accessToken) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'fxlip-visitor-api' },
  });
  if (!res.ok) throw new Error(`GitHub user fetch failed: ${res.status}`);
  return res.json();
}

async function exchangeTwitterToken(code, redirectUri, codeVerifier, env) {
  const credentials = btoa(`${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`);
  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      Authorization:   `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      code,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) throw new Error(`Twitter token exchange failed: ${res.status}`);
  return res.json();
}

async function fetchTwitterProfile(accessToken) {
  const fields = 'description,location,url,profile_image_url,profile_banner_url,verified,verified_type,protected,created_at,public_metrics';
  const res = await fetch(`https://api.twitter.com/2/users/me?user.fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Twitter user fetch failed: ${res.status}`);
  const json = await res.json();
  return { ...json.data, id: json.data?.id };
}

// =======================================================================
// POST /api/refresh
// Força re-sync completo do fingerprint: apaga daily key e refaz UPSERT
// Body: { fingerprint }
// =======================================================================
async function handleRefresh(request, env) {
  const body = await request.json();
  const { fingerprint } = body;

  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 16) {
    return jsonResponse({ error: 'Invalid fingerprint' }, 400);
  }

  const key     = `visitor:${fingerprint}`;
  const raw     = await env.VISITORS.get(key);
  if (!raw) return jsonResponse({ error: 'Unknown fingerprint' }, 404);

  if (!env.DB) return jsonResponse({ ok: true });

  const now  = new Date().toISOString();
  const cf   = request.cf || {};
  const ua   = parseUA(request.headers.get('User-Agent'));

  try {
    await env.DB.prepare(`
      UPDATE profiles SET
        last_seen      = ?,
        country        = ?,
        city           = ?,
        region         = ?,
        timezone       = ?,
        ua_browser     = ?,
        ua_os          = ?,
        ua_os_ver      = ?,
        ua_device_type = ?,
        ua_raw         = ?,
        raw_cf_data    = ?
      WHERE fingerprint = ?
    `).bind(
      now,
      cf.country        ?? null,
      cf.city           ?? null,
      cf.region         ?? null,
      cf.timezone       ?? null,
      ua.browser        ?? null,
      ua.os             ?? null,
      ua.osv            ?? null,
      ua.device_type    ?? null,
      request.headers.get('User-Agent'),
      JSON.stringify(cf),
      fingerprint
    ).run();
  } catch (_) {}

  return jsonResponse({ ok: true });
}
