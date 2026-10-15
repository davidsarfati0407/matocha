// Passerelle minimale qui imite Kong de Supabase local : /auth/v1 → GoTrue, /rest/v1 → PostgREST.
import http from "node:http";

const routes = [
  { prefix: "/auth/v1", port: 9999 },
  { prefix: "/rest/v1", port: 3001 },
];

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, prefer, range, accept-profile, content-profile, x-supabase-api-version",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-expose-headers": "content-range, x-supabase-api-version",
};

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") return res.writeHead(204, cors).end();
    const route = routes.find((r) => req.url.startsWith(r.prefix));
    if (!route) return res.writeHead(404, cors).end("not found");
    const headers = { ...req.headers, host: `127.0.0.1:${route.port}` };
    // Comme Kong : sans Authorization, la clé apikey sert de jeton.
    if (!headers.authorization && headers.apikey) headers.authorization = `Bearer ${headers.apikey}`;
    const upstream = http.request(
      { host: "127.0.0.1", port: route.port, method: req.method, path: req.url.slice(route.prefix.length) || "/", headers },
      (up) => {
        res.writeHead(up.statusCode ?? 502, { ...up.headers, ...cors });
        up.pipe(res);
      },
    );
    upstream.on("error", (e) => res.writeHead(502, cors).end(String(e)));
    req.pipe(upstream);
  })
  .listen(54321, "127.0.0.1");
