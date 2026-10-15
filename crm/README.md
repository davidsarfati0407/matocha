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
| 4 | Connexion fine map ↔ back-office, intégrations M365/Google, Factur-X, 2FA/SSO, i18n, accessibilité | ✅ |

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
Le temps réel y passe par le serveur Next (`NEXT_PUBLIC_REALTIME=sse` : Postgres `LISTEN/NOTIFY` →
flux SSE), avec la même latence (< 1 s).
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

## Phase 4 : connexion fine, intégrations, finitions

### Map ↔ back-office

- **Temps réel < 1 s, dans les deux sens.** Chaque écriture métier produit un `activity_events` (triggers).
  - Avec Supabase, la diffusion passe par Realtime.
  - Sans serveur Realtime, un `pg_notify` alimente un hub `LISTEN` unique, et une route SSE
    authentifiée (`/api/realtime`) relaie les événements filtrés par organisation.
  - Latence mesurée de l'écriture en base à la réception navigateur : **médiane 7 ms, max 25 ms**
    (`node scripts/dev/latency.mjs`).
- **Écritures depuis la map**, avec les mêmes fonctions et droits que le back-office :
  - occuper ou libérer une salle (vraie réservation, conflits refusés) ;
  - affecter un véhicule par **glisser-déposer** sur une personne de la scène.
- **Liens profonds dans les deux sens.**
  - Fiche de la map → « Back-office ».
  - Fiche du back-office → « Voir sur la map » : vol de caméra et sélection.
  - KPI (liens définis dans la fiche secteur), lignes, notifications et fil d'activité sont cliquables.
  - La caméra et la sélection sont mémorisées.
- **Transition douce** entre map et back-office (React `ViewTransition`, zoom et fondu). La boucle de
  rendu se fige pendant la sortie de la map.

### Intégrations Microsoft 365 et Google Workspace

Sans compte connecté, tout passe par le **connecteur simulé**, signalé comme tel dans l'interface. Pour
brancher un vrai compte, renseignez `.env.local` comme suit.

| Variable | Rôle |
| --- | --- |
| `APP_URL` | URL publique (redirections OAuth, adresses des webhooks) |
| `INTEGRATIONS_ENCRYPTION_KEY` | 32 octets en base64 (`openssl rand -base64 32`) : chiffrement AES-256-GCM des jetons |
| `MICROSOFT_CLIENT_ID` / `_SECRET` / `_TENANT_ID` | Inscription d'application Entra ID (permissions déléguées : `User.Read Mail.ReadWrite Mail.Send Calendars.ReadWrite OnlineMeetings.ReadWrite Files.ReadWrite offline_access`), URI de redirection `APP_URL/api/integrations/microsoft/callback` |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Client OAuth « Application Web » (Gmail, Calendar, Drive), URI de redirection `APP_URL/api/integrations/google/callback` |
| `CRON_SECRET` | Protège le worker `/api/integrations/worker` (appelé par Vercel Cron toutes les 10 min) |

Fonctionnement :

- **Jetons** : chiffrés et stockés dans `integration_secrets`, une table sans aucune politique RLS,
  donc illisible par les clients. Ils sont rafraîchis automatiquement ; si le rafraîchissement échoue,
  le compte passe « en erreur ».
- **File `sync_jobs`** : chaque tâche n'est exécutée qu'une fois (réservation atomique). En cas
  d'échec, reprise après 30 s, 1 min, 2 min… jusqu'à 6 h, et abandon après 6 essais ou sur une erreur
  définitive. L'écran Intégrations permet de tester la connexion, de traiter la file et de relancer
  une tâche.
- **Microsoft Graph** :
  - Outlook : envoi avec pièces jointes, brouillons, réception par requêtes delta ;
  - Agenda : création des rendez-vous, réunion Teams, `transactionId` contre les doublons ;
  - OneDrive : un dossier par compte client ;
  - **webhooks** : validation, vérification `clientState`, renouvellement automatique.
- **Google** :
  - Gmail : envoi MIME avec pièces jointes ; réception par historique, via la file (le push Gmail
    exigerait Pub/Sub) ;
  - Agenda : rendez-vous avec Meet, **notifications push** et renouvellement des canaux ;
  - Drive : dossiers par compte client.
- **Flux branchés** : réponses de la messagerie, devis et factures (PDF joint), relances, rendez-vous,
  dossiers partagés.

> **Honnêtement :** la forme des requêtes Graph, Gmail et OAuth est testée unitairement avec un `fetch`
> simulé (`tests/unit/integrations.test.ts`). Faute d'identifiants, aucun appel n'a été fait contre de
> vrais comptes Microsoft ou Google : à valider lors du premier branchement.

### Factures électroniques Factur-X

Le PDF de facture est un **PDF/A-3b Factur-X (profil BASIC WL)** :

- polices Liberation Sans embarquées (licence OFL) ;
- profil de couleur sRGB ;
- métadonnées XMP (`pdfaid` et extension `fx`) ;
- `factur-x.xml` joint (`AFRelationship /Data`, entrée `/AF` du catalogue).

Le XML est **validé contre le XSD officiel** :

```bash
python3 -m venv .fx && .fx/bin/pip install factur-x
.fx/bin/python -I scripts/dev/check_facturx.py facture.pdf   # → factur-x basicwl · XSD valide
```

La conformité PDF/A n'a pas été vérifiée avec veraPDF : le téléchargement était bloqué dans
l'environnement de développement. À faire avant la production.

### Sécurité

- **Double authentification TOTP** (« Sécurité du compte ») :
  - une fois activée, le code est exigé avant toute page **et toute API** : proxy, action de
    connexion et `getCtx` vérifient tous trois le niveau `aal2` ;
  - test E2E avec calcul réel des codes (RFC 6238).
- **SSO Microsoft Entra ID / Google** via les fournisseurs Supabase Auth :
  - activez-les dans `supabase/config.toml` (`[auth.external.azure|google]`), puis listez-les dans
    `NEXT_PUBLIC_SSO_PROVIDERS=azure,google` ;
  - non testé ici, faute de fournisseur d'identité.
- **Droits éditables** (« Rôles & droits »), avec des garde-fous en base :
  - seules la RH et la direction peuvent distribuer l'accès aux salaires ;
  - personne ne peut retirer à son propre rôle l'administration des droits ;
  - les tests RLS couvrent ces tentatives d'escalade.

### Planification

- **`pg_cron`**, installé par la migration lorsque l'extension existe (Supabase hébergé) :
  - factures échues : toutes les heures ;
  - automatisations de chaque organisation : chaque nuit.
- **Vercel Cron** (`vercel.json`) : worker des intégrations toutes les 10 minutes. Le plan Hobby
  limite la fréquence ; sinon, utilisez `pg_cron` + `pg_net` vers la même URL.
- En local, sans `pg_cron`, les boutons « Exécuter maintenant » et « Traiter la file » font le même
  travail.

### Langues et accessibilité

- **Interface en FR et EN** (next-intl) : sélecteur dans la barre latérale, un fichier de messages par
  module dans `messages/{fr,en}/`.
- **Ne sont pas traduits, volontairement**, car ce sont des données et non de l'interface :
  - le vocabulaire et les libellés de la fiche secteur ;
  - les données saisies ;
  - les courriers envoyés aux clients.
- **Formats** : les montants et nombres suivent le format régional de l'entreprise ; les noms de jours
  et de mois suivent la langue choisie.
- **Accessibilité** : audit axe-core (WCAG 2.1 A/AA) avec `node scripts/dev/a11y.mjs [rôle]`.
  L'accent de marque `#E07A5F` est conservé pour la map et les éléments décoratifs ; une variante
  contrastée (`accentTexte`, fiche secteur) sert aux textes et aux boutons. Résultat : 0 anomalie sur
  29 pages, en FR et en EN, pour les rôles Direction et Collaborateur.
- **Vocabulaire métier** : les libellés venant de la fiche secteur (« Comptes », « Commandes pro »,
  KPI…) restent dans la langue de la fiche, même en anglais : ils sont de la configuration, pas du code.

## Tests

```bash
pnpm test        # Vitest (69) : TVA, devis, facturation, relances, congés, temps, stock, camt.054, Factur-X, écritures, intégrations (chiffrement, file, reprise)
pnpm test:rls    # droits réels contre l'API (27), dont masse salariale agrégée, fonctions métier et escalade de droits
npx playwright test   # 22 parcours : connexion, 2FA, droits, map (lien profond, temps réel, salle, glisser-déposer), éditeur,
                      # réappro, devis→paiement, congés, ⌘K, IA, intégrations, bascule FR/EN
node scripts/dev/a11y.mjs Direction [--lang en]   # audit axe-core WCAG 2.1 A/AA de 29 pages (0 anomalie)
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
  La QR-facture suisse ne s'applique pas ; la facture électronique est un Factur-X (PDF/A-3 + XML CII).
- **Next.js 16.3**, aligné sur le site vitrine du dépôt.
- **Intégrations** :
  - Microsoft 365 et Google Workspace sont implémentées ; elles restent en connecteur simulé tant
    qu'aucun compte n'est connecté ;
  - la boutique, le transporteur et la banque restent en *mode simulé*, affiché comme tel.
- **Formats** : français (et non suisses) par défaut, cohérents avec le choix France ci-dessus.

## Déploiement

### Démo en ligne en 10 minutes (Vercel + Supabase, sans terminal)

Le build Vercel lance `scripts/deploy/migrate.mjs` : il applique les migrations manquantes, puis,
avec `SEED_DEMO=1` et une base vide, les données fictives. Les relances suivantes ne refont rien.

1. **Supabase** (supabase.com) : nouveau projet, région Francfort (eu-central-1). Notez le mot de
   passe de la base.
2. **Vercel** (vercel.com) : *Add New → Project*, importez le dépôt, **Root Directory = `crm`**.
3. **Variables** (Settings → Environment Variables) :
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` :
     Supabase → Project Settings → API ;
   - `DATABASE_URL` : Supabase → *Connect* → **Session pooler** (remplacez `[YOUR-PASSWORD]`) ;
   - `SEED_DEMO` = `1`.
   L'intégration Supabase de Vercel (Marketplace) pose ces variables elle-même ; le script lit aussi
   `POSTGRES_URL_NON_POOLING` / `POSTGRES_URL`.
4. **Branche** : Settings → Git → *Production Branch* = la branche qui contient `crm/`, puis
   *Deployments → Redeploy*.
5. Ouvrez `https://<projet>.vercel.app/login` et cliquez sur un compte de démo.

Limites du plan gratuit : le cron Vercel du worker d'intégrations passe une fois par jour (le plan
Hobby n'accepte pas plus) ; pg_cron, côté base, garde ses horaires. Le temps réel passe par Supabase
Realtime (`NEXT_PUBLIC_REALTIME` vide).

### Production

1. Projet Supabase en région **Zurich (eu-central-2)** ou **Francfort (eu-central-1)**.
2. Migrations : automatiques au build (ci-dessus) ou `npx supabase link` puis `npx supabase db push`.
   **Ne mettez jamais `SEED_DEMO=1` en production.**
3. Sur Vercel (région `dub1` dans `vercel.json`, à aligner sur la région du projet Supabase), renseignez les variables de
   `.env.example`, racine du projet sur `crm/`.
4. **Variables à ne jamais exposer au navigateur** : `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`,
   `INTEGRATIONS_ENCRYPTION_KEY`, `CRON_SECRET`, `ANTHROPIC_API_KEY` et les secrets OAuth.
5. **Temps réel** : laissez `NEXT_PUBLIC_REALTIME` vide (Supabase Realtime) ; la migration ajoute
   `activity_events` à la publication Realtime.
6. **Intégrations** : déclarez les URI de redirection et l'URL publique des webhooks
   (`APP_URL/api/integrations/{microsoft|google}/notify`), en HTTPS. Plan Vercel Pro pour un worker
   toutes les 10 min (`vercel.json`).
7. **Planification** : `pg_cron` s'installe avec les migrations sur Supabase.
8. **Sécurité** : activez la 2FA pour les comptes Direction, RH et Finance, puis configurez le SSO
   (Entra ID / Google) dans Supabase Auth.
