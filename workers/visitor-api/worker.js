export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return corsResponse(env, new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/hello" && request.method === "POST") {
        return corsResponse(env, await handleHello(request, env));
      }
      if (url.pathname === "/api/view" && request.method === "POST") {
        return corsResponse(env, await handleView(request, env));
      }
      if (url.pathname === "/api/views" && request.method === "GET") {
        return corsResponse(env, await handleViewsBatch(request, env));
      }
      return corsResponse(env, new Response("Not Found", { status: 404 }));
    } catch (err) {
      return corsResponse(env, jsonResponse({ error: "Internal error" }, 500));
    }
  }
};

// --- Helpers ---

function corsResponse(env, response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN || "https://fxlip.com");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
    ? name.replace(/<[^>]*>/g, "").trim().substring(0, 30)
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
    visitor.visits += 1;
    visitor.lastSeen = now;
    visitor.ip = await sha256(ip + (env.SALT || ""));
    visitor.country = geo.country || null;
    visitor.city = geo.city || null;
    if (cleanName) visitor.name = cleanName;
  }

  await env.VISITORS.put(key, JSON.stringify(visitor), {
    expirationTtl: 31536000, // 1 ano
  });

  return jsonResponse({
    greeting: buildGreeting(visitor.name, visitor.visits),
    visits: visitor.visits,
    name: visitor.name,
  });
}

function buildGreeting(name, visits) {
  if (!name) return null;
  if (visits >= 50) return `Acabou minha criatividade para te saudar ${name}, essa é simplesmente a ${visits}º vez que você vem aqui!`;
  if (visits >= 11) return `Essa é a ${visits}º vez que você vem aqui ${name}, tmj.`;
  if (visits == 10) return `Valeu pela sua décima visita ${name}!`;
  if (visits >= 6)  return `Eai ${name}, ta curtindo?`;
  if (visits >= 3)  return `${name}, né? Beleza`;
  return `Bem-vindo, ${name}!`;
}

// =======================================================================
// POST /api/view
// Body: { slug: string }
// =======================================================================
async function handleView(request, env) {
  const body = await request.json();
  const { slug } = body;

  if (!slug || typeof slug !== "string" || slug.length > 100) {
    return jsonResponse({ error: "Invalid slug" }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = (await sha256(ip + (env.SALT || ""))).substring(0, 16);

  const key = `views:${slug}`;
  let data = { count: 0, ips: [] };

  const raw = await env.VISITORS.get(key);
  if (raw) {
    try { data = JSON.parse(raw); } catch (_) {}
  }

  if (!data.ips.includes(ipHash)) {
    data.ips.push(ipHash);
    data.count = data.ips.length;
    await env.VISITORS.put(key, JSON.stringify(data));
  }

  return jsonResponse({ views: data.count });
}

// =======================================================================
// GET /api/views?slugs=slug1,slug2,slug3
// =======================================================================
async function handleViewsBatch(request, env) {
  const url = new URL(request.url);
  const slugsParam = url.searchParams.get("slugs") || "";
  const slugs = slugsParam.split(",").filter(s => s.length > 0).slice(0, 50);

  if (slugs.length === 0) return jsonResponse({});

  const results = {};
  await Promise.all(slugs.map(async (slug) => {
    const raw = await env.VISITORS.get(`views:${slug}`);
    if (raw) {
      try { results[slug] = JSON.parse(raw).count || 0; } catch (_) { results[slug] = 0; }
    } else {
      results[slug] = 0;
    }
  }));

  return jsonResponse(results);
}
