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
| 2 | Map vivante (Three.js) branchée sur les vraies tables | ✅ |
| 3 | Back-office complet (9 modules), IA, automatisations | ✅ |
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

## Map vivante (phase 2)

L'accueil après connexion est `/map/maison_montreuil`.

**Raccourcis** : `/` ouvre la recherche, `T` lance la visite guidée, `H` revient à la vue d'ensemble,
`Échap` ferme ou désélectionne. Cliquer-glisser déplace la carte, le clic droit la fait pivoter et
la molette zoome.

**Plan** :
- `lib/map/generate.ts` transforme les espaces de la fiche en plan JSON : bâtiment en L, murs en
  coupe, cloisons vitrées, mobilier, un poste de travail par collaborateur et les liens vers les
  entités.
- Le plan est stocké dans `floor_plans.layout`. Le moteur reconstruit toute la scène à partir de
  ce JSON.
- Les rôles qui ont le droit `plan` peuvent l'éditer : grille de 0,5 m, rotation par pas de 15°,
  palette, liaison à une entité, annuler/rétablir, versions enregistrées et publication.

**Données → animation** :
- La map lit les mêmes tables que le back-office.
- Chaque action métier écrit dans `activity_events`. La map s'y abonne via Supabase Realtime ; si
  Realtime est absent, elle bascule sur un sondage d'une seconde, signalé par le badge
  « sondage ».
- À chaque événement, la map recharge les données et les « réconcilie » avec la scène :
  déplacements calculés par A*, colis, palettes et véhicules.

**Mode démo** : le scénario des 75 premières secondes rejoue les événements de la fiche. Chaque
étape écrit réellement en base, via `demo_step()`, au bon moment de l'animation.
`demo_reset()` le rend rejouable. Des notifications d'ambiance arrivent ensuite toutes les 14 à
20 s. En production, `supabase/functions/demo-simulator` (à planifier avec pg_cron) remplace la
boucle côté navigateur.

**Paramètres d'URL utiles** :

| Paramètre | Effet |
| --- | --- |
| `?quality=low` | Sans ombres ni anticrénelage (machines modestes) |
| `?simtest=1` | Tests sans GPU : simulation à pas fixe, rendu à la demande |
| `?focus=type:id` | Vol vers l'objet et ouverture de sa fiche (liens profonds) |

**Performance** : les maillages statiques sont fusionnés par matériau, ce qui ramène environ
5 000 appels de dessin à environ 1 900. Le pas de simulation est borné à 50 ms, et la
simulation se met en pause quand l'onglet est caché.

## Back-office (phase 3)

Connexion → `/dashboard` (« Aujourd'hui ») ; `⌘K` / `Ctrl+K` cherche partout et propose des actions
(« Nouveau devis pour … »). Chaque liste : recherche, filtres, tri, sélection multiple, vues
enregistrées, export CSV/Excel. Chaque action importante affiche un toast avec **Annuler**.

| Module | Pages | Ce qui se fait en un clic |
| --- | --- | --- |
| Pilotage | Aujourd'hui (widgets déplaçables), automatisations | tuiles « à faire » → listes filtrées ; règles évaluées et notifiées |
| Opérations | commandes pro (liste, kanban, fiche), commandes en ligne, planning, heures | glisser une carte d'étape, cocher la check-list, **Facturer** une commande livrée |
| Ressources | stock, lots & traçabilité, achats/fournisseurs, équipements, rayonnages | **Commander** (bon pré-rempli par fournisseur), **Réceptionner** (lot en quarantaine), **Libérer**, rappel de lot |
| Commercial | comptes 360°, pipeline, devis, calendrier | devis pré-rempli depuis la dernière commande, **Accepté → commande pro** créée automatiquement, PDF |
| Finance | factures (PDF + XML Factur-X), paiements, relances, notes de frais, trésorerie | import camt.054 + lettrage, relance pré-rédigée J+1/15/30, export comptable du mois |
| RH | collaborateurs, présence, congés, salaires, entretiens, recrutement | **Valider** un congé (règles vérifiées, solde décompté), embauche → fiche + intégration |
| Communication | messagerie, documents | brouillon de réponse (IA si clé, sinon modèle indiqué comme tel) |
| IA | assistant | questions sur les données, réponses avec liens vers les fiches |
| Organisation | paramètres, rôles, intégrations, audit, RGPD | export RGPD d'une personne, journal des consultations de salaires |

**Flux sans ressaisie** (testé de bout en bout) : devis accepté → commande pro (CP-24-…) → étapes →
heures facturables → facture (lignes du devis + heures, remise portée en lignes) → envoi → relevé
camt.054 → paiement lettré → facture payée.

**Règles métier** dans `lib/domain/*` (testées) et écritures multi-tables atomiques en SQL
(`save_quote`, `accept_quote`, `create_invoice`, `reorder_stock`, `receive_purchase_order`,
`hire_candidate`, `run_automations`) qui s'exécutent avec les droits de l'appelant.

**Assistant IA** (`lib/ai/assistant.ts`) : SDK `@anthropic-ai/sdk` (version figée), modèle
`claude-opus-5-5`, 7 outils **en lecture seule** qui interrogent la base avec la session de
l'utilisateur (RLS) : il ne voit jamais plus que la personne. Repli serveur en cas de refus du
modèle. Sans `ANTHROPIC_API_KEY`, l'interface affiche « non configuré » et ne simule aucune réponse.

**Ce qui reste simulé, et affiché comme tel** : envoi d'e-mails, agendas Google/Microsoft,
boutique, transporteur, banque (l'import camt.054 est réel, la connexion bancaire non), stockage de
fichiers. Le XML Factur-X est généré et contrôlé ; son embarquement dans un PDF/A-3 est prévu en
phase 4. Les automatisations « date/seuil » s'exécutent à la demande (bouton) ; leur planification
(pg_cron) arrive en phase 4.

## Tests

```bash
pnpm test        # Vitest (58) : TVA, devis, facturation, relances, congés, temps, stock, camt.054, Factur-X, écritures
pnpm test:rls    # droits réels contre l'API (24), dont masse salariale agrégée et fonctions métier
npx playwright test   # 17 parcours : connexion, droits, map, éditeur, réappro, devis→paiement, congés, ⌘K, IA
node scripts/dev/simtest.mjs <dossier> 120   # scénario de démo accéléré + captures
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
  La QR-facture suisse ne s'applique pas ; le XML Factur-X (CII) est généré, le PDF/A-3 hybride arrive en phase 4.
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
