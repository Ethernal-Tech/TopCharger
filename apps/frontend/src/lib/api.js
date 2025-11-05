// Small helper to keep fetch calls consistent and with credentials.
// Returns { ok, status, json?, text? } without throwing.

export async function apiGet(path) {
  const res = await fetch(path, { credentials: "include" });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, ...(ct.includes("application/json") ? { json: body } : { text: body }) };
}
