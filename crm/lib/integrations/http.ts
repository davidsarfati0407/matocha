import { HttpError } from "./queue";

/** Appel JSON authentifié ; renvoie null pour 202/204. Lève HttpError (avec le statut) sinon. */
export async function call<T>(f: typeof fetch, token: string, url: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const res = await f(url, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { authorization: `Bearer ${token}`, ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 202 || res.status === 204) return null as T;
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new HttpError(json?.error?.message ?? json?.error_description ?? `HTTP ${res.status}`, res.status);
  return json as T;
}
