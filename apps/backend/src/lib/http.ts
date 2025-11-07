// apps/backend/src/lib/http.ts
// Unified CORS + HTTP helpers for all routes

const ORIGIN =
  process.env.VITE_FRONTEND_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  // Keep preflights cacheable (optional)
  "Access-Control-Max-Age": "600",
  // Important so proxies/CDNs don’t mix responses by origin/cookie
  Vary: "Origin, Cookie",
};

function corsHeaders(extra: Record<string, string> = {}) {
  return { ...BASE_HEADERS, ...extra };
}

/** JSON 200 */
export function ok(data: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: corsHeaders({ "Content-Type": "application/json", ...extra }),
  });
}

/** JSON 201 */
export function created(data: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status: 201,
    headers: corsHeaders({ "Content-Type": "application/json", ...extra }),
  });
}

/** JSON 400 */
export function badRequest(message = "Bad Request", extra: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: corsHeaders({ "Content-Type": "application/json", ...extra }),
  });
}

/** JSON 401 */
export function unauthorized(message = "Unauthorized", extra: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: corsHeaders({ "Content-Type": "application/json", ...extra }),
  });
}

/** JSON 403 */
export function forbidden(message = "Forbidden", extra: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: corsHeaders({ "Content-Type": "application/json", ...extra }),
  });
}

/** JSON 404 */
export function notFound(message = "Not Found", extra: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status: 404,
    headers: corsHeaders({ "Content-Type": "application/json", ...extra }),
  });
}

/** 204 No Content (with CORS) */
export function noContent(extra: Record<string, string> = {}) {
  return new Response(null, { status: 204, headers: corsHeaders(extra) });
}

/** Generic JSON with custom status */
export function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json", ...extra }),
  });
}

/** Plain text (rarely needed) */
export function text(body: string, status = 200, extra: Record<string, string> = {}) {
  return new Response(body, { status, headers: corsHeaders(extra) });
}

/** OPTIONS preflight responder */
export function options(extra: Record<string, string> = {}) {
  return new Response(null, { status: 204, headers: corsHeaders(extra) });
}

// Export ORIGIN in case any route needs it explicitly (e.g., cookies on NextResponse)
export { ORIGIN };
