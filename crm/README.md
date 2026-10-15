# MATOCHA — Maison (CRM/ERP + Map vivante)

Application de démonstration : une **vue 3D vivante des locaux** (phase 2) reliée à un **CRM/ERP**
(phase 3), sur la même base Supabase.

> ⚠️ **Données fictives.** L'entreprise représentée est une *projection à l'an 3* de MATOCHA :
> équipe, locaux, clients, montants, plaques et numéros sont inventés.

## Avancement

| Phase | Contenu | État |
| --- | --- | --- |
| 0 | Fiche secteur `config/sector.config.ts` (validée par Zod) | ✅ |
| 1 | Socle : Next.js 16, Supabase (schéma, RLS, auth), seed, page technique | ✅ |
| 2 | Map vivante (Three.js) | à venir |
| 3 | Back-office, module par module | à venir |
| 4 | Temps réel bidirectionnel, intégrations, IA, finitions | à venir |

## Démarrer en local (recommandé : Docker + Supabase CLI)

Prérequis : Node 20+ (22 conseillé), pnpm 10, **Docker Desktop** démarré.

```bash
cd crm
pnpm install
cp .env.example .env.local       # valeurs de démo publiques de Supabase local
pnpm db:start                    # lance Supabase en local (Postgres, Auth, Realtime, Studio…)
pnpm db:reset                    # régénère seed.sql, rejoue migrations + seed
pnpm dev                         # http://localhost:3000
```

Connexion : `http://localhost:3000/login`. Un clic sur un compte de démo vous connecte.
Le mot de passe commun est **`matocha-demo`**.

| Compte | Rôle | Voit les salaires |
| --- | --- | --- |
| direction@matocha.demo | Direction | oui |
| rh@matocha.demo | RH | oui |
| admin@matocha.demo | Administrateur (paramètres, plan 3D) | non |
| finance@ · operations@ · commercial@ · manager@ · employe@ · lecture@ | … | non |

Outils locaux de Supabase : Studio `http://127.0.0.1:54323`, Mailpit (liens magiques) `http://127.0.0.1:54324`.

### Sans Docker (stack de dev minimale)

`scripts/devstack/` assemble Postgres local, GoTrue (auth) et PostgREST, plus une petite passerelle
sur `:54321`. Les routes sont les mêmes que Supabase, mais **sans Realtime, Storage ni Studio**.
Ce mode a servi à vérifier la phase 1 dans un conteneur sans Docker. Il suppose PostgreSQL 16
installé sur la machine, ainsi que les binaires `postgrest` et `auth` dans `/opt/devstack`
(voir `start.sh`).

```bash
pnpm devstack:start && pnpm devstack:reset && pnpm dev
```

Dans ce mode, mettez `DATABASE_URL` sur le port 5432 dans `.env.local`.

## Tests

```bash
pnpm test        # Vitest : TVA, arrondis, totaux de devis, alertes de budget
pnpm test:rls    # droits réels contre l'API (base réinitialisée requise)
npx playwright test   # parcours navigateur + captures dans test-results/
pnpm typecheck && pnpm lint
```

## Architecture (phase 1)

- `config/sector.config.ts` contient toute la configuration métier : vocabulaire, espaces, postes,
  étapes, KPI, scénario de démo, rôles et matrice de droits. Aucun libellé métier n'est codé en dur
  dans les composants.
- `supabase/migrations/` contient les migrations versionnées :
  - `core` : organisation, rôles, permissions, profils et fonctions de droits `app.*` ;
  - `domain` : toutes les tables métier (plan 3D, personnes, présence, temps, RH, commercial,
    opérations, ressources et lots, finance, communication, pilotage) ;
  - `rls_triggers` : RLS par organisation et par module ;
  - `views_kpis` : vue `presence_status` et KPI `kpi_*()` partagés par la map et le back-office.
- RLS par organisation et par module :
  - **salaires** dans une table séparée, visibles seulement par la RH et la direction. La révélation
    passe par `reveal_salary()`, qui écrit dans `audit_log` ;
  - **fil d'événements** (`activity_events`) alimenté *uniquement* par des triggers : un client ne
    peut pas fabriquer d'événement ;
  - **audit avant/après** sur les tables sensibles.
- `scripts/gen-seed.ts` lit la fiche et produit `supabase/seed.sql`. Les identifiants sont
  déterministes, ce qui garde les liens profonds stables. Les dates sont relatives au jour du seed et
  l'historique couvre 30 jours.
- `lib/domain/money.ts` fait tous les calculs en centimes entiers : TVA par taux, remise, arrondi,
  marge. Le seed utilise les mêmes fonctions que l'application.
- `proxy.ts` (ex-`middleware`, Next 16) rafraîchit la session Supabase et protège les pages.
- Interface en FR (EN disponible), avec les formats français : `1 234,50 €` et `15/10/2026`.

## Écarts assumés par rapport au cahier des charges

- **France au lieu de la Suisse** : EUR, TVA 5,5 % / 20 %, arrondi au centime et RGPD.
  La QR-facture suisse ne s'applique pas ; Factur-X est prévu en phase 3.
- **Next.js 16.3**, aligné sur le site vitrine du dépôt.
- **Intégrations** Google, Microsoft, boutique et transporteur : en *mode simulé*, affiché comme tel.
- **SSO, 2FA TOTP et lien magique** : le TOTP est activé dans `supabase/config.toml`, mais les écrans
  arrivent en phase 4. Le lien magique fonctionne avec Supabase local (Mailpit).

## Déploiement

1. Créez un projet Supabase, région **Zurich (eu-central-2)** ou **Francfort (eu-central-1)**.
2. Liez-le et poussez les migrations : `npx supabase link` puis `npx supabase db push`. Le seed est
   réservé à un environnement de démo.
3. Sur Vercel (région `fra1`), renseignez les variables de `.env.example` avec les clés du projet,
   et la racine du projet sur `crm/`.
