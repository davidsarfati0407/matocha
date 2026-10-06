# Matocha — site v2

Le matcha, en plus simple. Site de marque en **pré-lancement** (Next.js 16, App Router, Tailwind 4, Vercel), avec back-office, API Ops pour l'agent Instinct et serveur MCP.

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
npm test               # tests unitaires (Vitest)
npm run test:e2e       # Playwright : lancer `npm run build` avant
npm run check:claims   # chaînes interdites hors champs Proof
```

En local, pour tester l'inscription et `/admin` sans services externes :

```bash
MATOCHA_STORE=memory MATOCHA_EMAIL=console ADMIN_DEV_LOGIN=true \
ADMIN_EMAILS=vous@exemple.fr ADMIN_SESSION_SECRET=$(openssl rand -hex 32) npm run dev
# puis http://localhost:3000/admin/dev-login
```

## Où est quoi

| Chemin | Contenu |
|---|---|
| `src/content/catalog/` | Catalogue typé : familles, recettes, packs. Chaque fait est un `Proof` |
| `src/content/i18n/fr.ts` | Textes d'interface (français) |
| `src/content/media-manifest.json` | Statut et licence de chaque média |
| `src/lib/commerce/cta.ts` | Résolveur de CTA, seul juge de ce qui est achetable |
| `src/lib/mode.ts` | Mode du site, décidé côté serveur |
| `src/components/scenes/` | Scènes motion M01–M14 et Le Filet |
| `src/lib/ops/`, `src/app/api/ops/v1/` | API Ops ; `src/app/mcp/` pour le MCP |
| `supabase/migrations/` | Schéma de la base |
| `docs/` | Audit, décisions, rapport, prompts médias, API |

À lire en premier : `docs/RAPPORT_V2.md`.
