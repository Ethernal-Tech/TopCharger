const ORIGIN = "http://localhost:5173"; // dev SPA

export function corsHeaders(extra: Record<string,string> = {}) {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Content-Type": "application/json",
    ...extra,
  };
}

export function ok(data: unknown, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), { headers: corsHeaders(extra) });
}
export function badRequest(message = "Bad Request") {
  return new Response(JSON.stringify({ error: message }), { status: 400, headers: corsHeaders() });
}
export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
}
export function forbidden(msg = "Forbidden") {
  return new Response(JSON.stringify({ error: msg }), { status: 403, headers: corsHeaders() });
}
export function notFound(msg = "Not Found") {
  return new Response(JSON.stringify({ error: msg }), { status: 404, headers: corsHeaders() });
}
export function created(data: unknown) {
  return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders() });
}
export function options() {
  return new Response(null, { headers: corsHeaders() });
}