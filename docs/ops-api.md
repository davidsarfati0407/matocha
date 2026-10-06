# API Ops Matocha — guide pour l'agent Instinct

Spécification complète : [`docs/ops-api.openapi.yaml`](./ops-api.openapi.yaml) (OpenAPI 3.1).
Base : `https://<domaine>/api/ops/v1`. Serveur MCP : `POST https://<domaine>/mcp`.

## 1. Créer un jeton pour l'agent

1. Renseigner les variables (§5) puis appliquer `supabase/migrations/0001_init.sql` sur le projet Supabase.
2. Ouvrir `/admin/connexion`, saisir l'adresse de David ou Gaspard (`ADMIN_EMAILS`), cliquer sur le lien reçu.
3. `/admin/jetons` → nom « Instinct », cocher les scopes nécessaires, choisir l'expiration → **Créer le jeton**.
4. Copier le jeton `mto_…` affiché **une seule fois** dans le coffre de l'agent. Seule son empreinte SHA-256 est conservée ; il se révoque d'un clic depuis la même page.

Scopes : `catalog:read`, `catalog:write`, `content:read`, `content:write`, `leads:read`, `leads:write`, `orders:read`, `orders:write`, `media:write`, `analytics:read`, `settings:propose`.

## 2. Règles communes

- `Authorization: Bearer $MATOCHA_TOKEN` sur tout sauf `/health`.
- Toute écriture (POST/PATCH) exige `Idempotency-Key` (une valeur unique par action, ex. UUID). Rejouer la même clé avec la même requête renvoie la même réponse (`Idempotent-Replayed: true`).
- 120 requêtes/min par jeton par défaut → 429 + `Retry-After`.
- Les actions sensibles répondent **202** avec `change_request.id` : rien n'est appliqué avant validation dans `/admin`. Suivi : `GET /change-requests/{id}` ou webhook `change_request.decided`.
- Erreurs : `{ "error": { "code": "…", "message": "… en français" } }`.

## 3. Exemples `curl`

```bash
API=https://matocha.vercel.app/api/ops/v1
AUTH="Authorization: Bearer $MATOCHA_TOKEN"
idem() { echo "Idempotency-Key: $(uuidgen)"; }

# Système
curl -s $API/health

# Catalogue
curl -s -H "$AUTH" $API/catalog
curl -s -H "$AUTH" $API/catalog/packs/poudre-daily-box
curl -s -X PATCH -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"fields":{"description":"Le goût du matcha, tel quel.","origin":{"value":"Japon","target":"Japon, COA attendu"}}}' \
  $API/catalog/recipes/poudre-original
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"field":"origin","value":"Japon","source":"COA lot 2026-11 (Drive/Qualité)"}' \
  $API/catalog/recipes/poudre-original/proofs                       # → 202 validation
curl -s -X PATCH -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"price":9.90,"source":"Grille tarifaire v1"}' $API/catalog/packs/poudre-daily-box/price   # → 202
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"status":"preorder"}' $API/catalog/packs/poudre-daily-box/status          # appliqué (200)
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"status":"available"}' $API/catalog/packs/poudre-daily-box/status         # → 202

# Contenu
curl -s -H "$AUTH" "$API/content/blocks?status=draft"
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"key":"announcement.home","kind":"announcement","body":"Le premier lot se prépare."}' $API/content/blocks
curl -s -X POST -H "$AUTH" -H "$(idem)" $API/content/blocks/<id>/publish      # → 202

# Inscrits (confirmés uniquement)
curl -s -H "$AUTH" "$API/leads?interest=original"
curl -s -H "$AUTH" $API/leads/export -o waitlist.csv
curl -s -X PATCH -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"add":["premier-lot"]}' $API/leads/<id>/tags

# Commandes (mode vente)
curl -s -H "$AUTH" "$API/orders?status=paid"
curl -s -H "$AUTH" $API/orders/<id>
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"carrier":"Colissimo","trackingNumber":"6A123…"}' $API/orders/<id>/shipments
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"reason":"Colis abîmé"}' $API/orders/<id>/refunds                       # → 202

# Médias
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" -d '{
  "id":"hero-pour-poudre-desktop","family":"poudre","recipe":"original","status":"concept","kind":"video",
  "source":"génération IA","license":{"name":"Interne","commercialUse":true,"proofStored":"Drive/Licences/hero.pdf"},
  "files":{"desktop":"https://…/hero.webm","mobile":"https://…/hero-4x5.mp4","poster":"https://…/hero.avif"},
  "alt":"Une main verse un stick Matocha dans un verre de lait sur glaçons","usedIn":["home/hero"]}' \
  $API/media/incoming                                                            # → 202

# Statistiques
curl -s -H "$AUTH" "$API/analytics/summary?days=14"

# Mode du site (toujours validé par un humain + checklist bloquante)
curl -s -X POST -H "$AUTH" -H "$(idem)" -H "Content-Type: application/json" \
  -d '{"mode":"sale","reason":"Premier lot reçu"}' $API/settings/mode          # → 202 + checklist
curl -s -H "$AUTH" $API/change-requests/<id>
```

### MCP

```bash
curl -s -X POST https://matocha.vercel.app/mcp -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
curl -s -X POST https://matocha.vercel.app/mcp -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"catalog_pack_price","arguments":{"id":"poudre-daily-box","price":9.9,"idempotency_key":"…"}}}'
```

Outils : `health`, `catalog_get`, `catalog_pack_get`, `catalog_recipe_patch`, `catalog_recipe_proof_confirm`, `catalog_pack_price`, `catalog_pack_status`, `content_list`, `content_create`, `content_publish`, `leads_list`, `leads_export`, `leads_tags`, `orders_list`, `orders_get`, `orders_shipment_create`, `orders_refund_request`, `media_incoming`, `analytics_summary`, `settings_mode_propose`, `change_request_get`. Les outils d'écriture exigent l'argument `idempotency_key`.

## 4. Webhooks sortants

Envoyés en POST JSON à `OPS_WEBHOOK_URL` : `lead.confirmed`, `order.paid`, `order.payment_failed`, `stock.low`, `change_request.decided`, `form.error_spike`.

`stock.low` est déclaré mais pas encore émis : il n'existe pas de gestion de stock tant qu'aucun lot n'est produit.

Corps : `{ "id", "event", "created_at", "data" }`. En-têtes : `Matocha-Signature: t=<unix>,v1=<hex>`, `Matocha-Event`, `Matocha-Delivery`.
Rejeu exponentiel (30 s, 1 min, 2 min… jusqu'à `OPS_WEBHOOK_MAX_ATTEMPTS`, 6 par défaut) via le cron `/api/cron/webhooks` (`Authorization: Bearer $CRON_SECRET`). Journal des envois : table `webhook_deliveries`. Sans URL configurée, chaque événement est journalisé `skipped`.

Vérification côté agent (Node) :

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMatocha(secret, header, rawBody, toleranceSec = 300) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return parts.v1?.length === expected.length && timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}
```

Utilisez `Matocha-Delivery` pour dédoublonner : un rejeu garde le même identifiant.

## 5. Variables d'environnement (noms uniquement)

`SITE_URL`, `SITE_MODE_SALE_UNLOCK`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `IP_HASH_SALT`, `FORM_ERROR_SPIKE_THRESHOLD`, `ADMIN_EMAILS`, `ADMIN_SESSION_SECRET`, `OPS_RATE_LIMIT_PER_MIN`, `OPS_WEBHOOK_URL`, `OPS_WEBHOOK_SECRET`, `OPS_WEBHOOK_MAX_ATTEMPTS`, `OPS_WEBHOOK_BACKOFF_MS`, `CRON_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PLAUSIBLE_API_KEY`, `PLAUSIBLE_SITE_ID`.
Développement et tests uniquement : `MATOCHA_STORE=memory`, `MATOCHA_EMAIL=console`, `ADMIN_DEV_LOGIN=true`. Voir `.env.example`.
