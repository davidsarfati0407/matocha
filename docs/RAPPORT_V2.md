# MATOCHA v2 — Rapport de livraison

> **Mise à jour du 6 octobre — mode réaliste et produit unique** (décisions F26 à F30)
> - **Visuels** : le site ne montre plus que les 4 renders photoréalistes de `public/renders/` (sticks, latte, Daily Box, jet), chacun marqué « Visuel de concept ». Plus aucune illustration dessinée : 0 SVG et 0 canvas sur les pages, vérifié par un test e2e. Seuls mouvements : Ken Burns sur le hero et parallaxe légère, coupés en reduced-motion.
> - **Catalogue** : un seul produit, le Matcha Original en poudre (stick de 2 g, Daily Box de 30). Plus de goûts, de concentré ni de packs. `/daily-box` remplace `/formats` (301).
> - **Parcours** : une carte produit, un prix (« Prix fixé après validation du fournisseur » tant qu'il n'est pas confirmé), un CTA.
> - **Mesures** : home desktop 6 319 px ; Lighthouse mobile 96 / 100, LCP 2,8 s, CLS 0, JS 153 Kio. Tests : 69 unitaires et 65 e2e verts.
> - Certaines sections ci-dessous (scènes M01–M14, Le Filet, goûts, packs) décrivent l'état précédent et ne s'appliquent plus.

6 octobre 2026. Travail réalisé en local dans `~/Desktop/Matocha` : **rien n'a été déployé, poussé ni commité** en dehors du commit de référence `0a6f138` (état v1, créé avant toute modification). Les fichiers de cadrage sont dans `docs/` : `PROMPT_V2.md`, `BRIEF.md`, `AUDIT.md`, `DECISIONS.md`.

## 1. Résumé des changements

### Avant / après

| | v1 | v2 |
|---|---|---|
| Langue | Anglais, `lang="en"`, bouton FR décoratif | Français complet, `lang="fr"`, anglais retiré tant qu'il n'est pas intégral |
| Home desktop 1440 px | 17 809 px, 18 sections | **11 055 px**, 8 blocs (épinglages allongés en revue : voir F23) |
| Home mobile 390 px | 20 571 px | 13 010 px |
| Lighthouse mobile home : perf / a11y | 91 / 96 | **96 / 100** (médiane de 3 passages) |
| LCP / CLS / TBT mobile | 3,4 s / 0 / 100 ms | **2,8 s** / 0 / 40 ms |
| JS transféré (home) | 228 Kio | **168 Kio** |
| Achat | Panier et abonnement actifs, 39 € / 35,10 € | Impossible par construction en pré-lancement |
| Inscription | Fausse confirmation, rien stocké | Double opt-in réel, ou « Inscriptions bientôt ouvertes » |
| Back-office / API | — | `/admin`, API Ops v1, MCP, webhooks signés |
| Tests | 0 | 71 unitaires + 66 e2e |

Captures : `docs/captures/avant/` (home 390 et 1440, page entière) et `docs/captures/apres/` (48 captures : home, `/formats/poudre`, `/preparer`, `/faq`, 404, admin en 360 / 390 / 768 / 1440, mouvement normal et réduit). Rapports Lighthouse bruts : `docs/lighthouse/`.

### Gardé
Identité crème / vert / noir, grain papier, Archivo en capitales serrées, le verre, le logo et le motif. Primitives `Button` et `Container`. Recomposition mobile. Stack Next.js 16 + Tailwind 4 sur Vercel.

### Refactoré
- Palette passée aux tokens du brief (`--lait-avoine`, `--foret`, `--matcha`, `--mousse`, `--encre`, `--rhubarbe`, `--vanille`).
- Header : navigation française ; « Boutique » et panier n'existent qu'en mode vente.
- Footer : mentions issues du catalogue, aucun lien vers une racine de réseau social, langue indiquée.
- Stick et boîte redessinés en route « Everyday icon », sans allégation imprimée.
- Formulaire d'inscription, 404, image Open Graph, sitemap, robots.

### Supprimé
- Les 17 sections v1 et les composants produit / panier v1, ainsi que `Reveal`, `Marquee`, `Accordion`, `Annotation`, `CtaRail` et les données `src/data/*`.
- La dépendance `motion`.
- Routes `/product`, `/why-sticks`, `/our-matcha`, `/[slug]` → redirections **301** vers leurs équivalents français.

### Nouvelles routes
- `/formats`, `/formats/poudre`, `/formats/concentre`, `/preparer`, `/recettes`, `/notre-produit`, `/faq`, `/aide`, `/legal/{mentions-legales,cgv,confidentialite,cookies}`, `/journal` (noindex).
- `/admin/*`, `/inscription/*`, `/commande/*` (mode vente uniquement), `/api/ops/v1/*`, `/mcp`.

## 2. Décisions techniques

Voir `docs/DECISIONS.md` (21 décisions front, 22 backend). Les principales :
- un seul moteur de scène SVG piloté par `t`, sans GSAP, Rive ni Three.js ;
- double verrou du mode vente (variable de déploiement + approbation humaine avec checklist) ;
- panier non rendu du tout en pré-lancement ;
- stockage derrière une interface (Supabase REST ou mémoire), magic link d'administration maison, Resend pour l'e-mail, Stripe Checkout prêt mais inactif ;
- Shopify headless documenté, non implémenté.

## 3. Scènes motion livrées

Toutes les scènes ont une version mobile et une version `reduced-motion`, et affichent « Visuel de concept » à l'écran.

| Scène | Où | Livré | Assets |
|---|---|---|---|
| Le Filet | home | Ruban SVG entre les blocs, tracé au scroll, couleur du goût, fin dans le verre M09. Statique en reduced-motion. | concept (SVG) |
| M01 Le Versement | hero | Boucle de 8 s du vrai geste poudre (déchirure, poudre en surface, mousseur, couleur uniforme, verre soulevé, gorgée) ; bascule vers le concentré « en développement ». Poster rendu côté serveur, bouton pause, pause hors écran. Reduced-motion : poster + 3 vignettes. | concept ; vidéos `missing` |
| M02 Le geste en 3 temps | home, fiches | Épinglage de 260 vh lié au scroll sur desktop, trois bandes calées sur le film, carrousel 3 cartes sur mobile, poudre/concentré, chaud/glacé, outil selon `preparation.method`. | concept ; plans `missing` |
| M03 Ouvre la boîte | home, fiches | Couvercle, nombre exact de sticks par pack, rejouée à chaque changement, `aria-expanded`. | concept ; renders `missing` |
| M04 Ma dose | home | Curseur 1–14, chaud/glacé, doses par mois, pack conseillé, durée, prix par boisson seulement s'il est confirmé. | — |
| M05 Sélecteur de goût | home, fiches | Couleur interpolée, sachet, accent du Filet, texte, ingrédients et CTA changent ensemble ; radiogroup au clavier. | concept |
| M06 Une journée | home | Défilement horizontal piloté par le scroll (200 vh, repos à trois cartes entières) sur desktop, swipe sur mobile, grille en reduced-motion ; 5 moments. | concept ; photos `missing` |
| M07 Sous la loupe + Suspension | home | 4 points d'intérêt en boutons, fiche Proof, liste lisible à côté ; canvas où l'on remue la poudre, qui retombe au repos. | concept ; macro `missing` |
| M08 Comparateur rituel | home | Avant/après avec `role="slider"` (flèches, Home/End) et tableau pour une boisson. | concept |
| M09 Dernière gorgée | home | Verre qui se remplit au scroll, paille quand il est plein, CTA jamais bloqué. | concept |
| M10 Le sachet en main | fiches | Trois vues 2D (face, dos, profil). Pas de 3D tant que le packaging n'est pas final. | concept |
| M11 Commerce | mode vente | Icône boîte qui compte les doses, stick qui y tombe ; succès seulement après lecture serveur de la session Stripe payée. | — |
| M12 Inscription | partout | Pluie de poudre seulement après un 200 réel de l'API ; erreurs précises sans animation. | — |
| M13 Chargement | panier, formulaire | Fouet SVG qui tourne. | — |
| M14 404 | 404 | « Cette page s'est renversée. », poudre à balayer au curseur. | concept |

## 4. Médias à produire

37 entrées dans `src/content/media-manifest.json` : 10 `concept` (illustrations codées, OG) et 27 `missing`. Les prompts complets (cadrage, lumière, durée, mouvement, référence packaging, formats 16:9 et 4:5) sont dans **`docs/media/PROMPTS.md`**. Ordre conseillé : packaging (aplats → renders) → hero poudre → plans du geste → moments de vie. Le hero concentré attend la formule.

## 5. API Ops pour Instinct

Guide complet : **`docs/ops-api.md`**. Spécification : **`docs/ops-api.openapi.yaml`** (OpenAPI 3.1).

**Créer un jeton :**
1. Renseigner les variables d'environnement et appliquer `supabase/migrations/0001_init.sql`.
2. Se connecter sur `/admin/connexion` (magic link, adresses de `ADMIN_EMAILS`).
3. Dans `/admin/jetons`, choisir les scopes et l'expiration.
4. Copier le jeton `mto_…`, affiché une seule fois ; seule son empreinte SHA-256 est conservée.

```bash
API=https://matocha.vercel.app/api/ops/v1
curl -s $API/health
curl -s -H "Authorization: Bearer $MATOCHA_TOKEN" $API/catalog
curl -s -X PATCH -H "Authorization: Bearer $MATOCHA_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" -d '{"price":9.90,"source":"Grille v1"}' \
  $API/catalog/packs/poudre-decouverte/price          # → 202 + change_request à valider dans /admin
curl -s -X POST -H "Authorization: Bearer $MATOCHA_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  $API/settings/mode -d '{"mode":"sale"}' -H "Content-Type: application/json"   # → toujours une demande
```

- **Garanties** : scopes ; `Idempotency-Key` obligatoire en écriture ; 120 requêtes/min par jeton ; journal d'audit avant/après. Prix, confirmation de preuve, passage en `available`, remboursement, publication et changement de mode passent par une demande à valider.
- **MCP** : `POST /mcp` (JSON-RPC, même jeton), mêmes actions en outils.
- **Webhooks sortants** : `lead.confirmed`, `order.paid`, `order.payment_failed`, `stock.low` (déclaré, non émis avant le premier lot), `change_request.decided`, `form.error_spike`. Signature HMAC-SHA256 avec horodatage, rejeu exponentiel par le cron `/api/cron/webhooks`, journal des envois. Le snippet de vérification est dans `docs/ops-api.md`.

## 6. Variables d'environnement (noms uniquement)

Voir `.env.example` (commenté).

| Rôle | Variables |
|---|---|
| Site | `SITE_URL`, `SITE_MODE_SALE_UNLOCK` |
| Stockage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| E-mail | `RESEND_API_KEY`, `EMAIL_FROM` |
| Formulaires | `IP_HASH_SALT`, `FORM_ERROR_SPIKE_THRESHOLD` |
| Admin | `ADMIN_EMAILS`, `ADMIN_SESSION_SECRET` |
| API Ops | `OPS_RATE_LIMIT_PER_MIN` |
| Webhooks | `OPS_WEBHOOK_URL`, `OPS_WEBHOOK_SECRET`, `OPS_WEBHOOK_MAX_ATTEMPTS`, `OPS_WEBHOOK_BACKOFF_MS`, `CRON_SECRET` |
| Paiement | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Analytics | `PLAUSIBLE_API_KEY`, `PLAUSIBLE_SITE_ID` |

Développement et tests uniquement : `MATOCHA_STORE=memory`, `MATOCHA_EMAIL=console`, `ADMIN_DEV_LOGIN=true` (tous refusés en production).

**Tant que Supabase et Resend ne sont pas renseignés, le site reste exactement comme aujourd'hui** : pré-lancement, « Inscriptions bientôt ouvertes », `/admin` affiche « Stockage non configuré ».

## 7. Tests

### Réalisés (tous verts)

Commandes : `npm test` · `npm run test:e2e` · `npm run check:claims`.

- **Unitaires (71)** :
  - résolveur de CTA et verrou de mode : 30 tests, un par combinaison bloquante, plus « rien n'est achetable dans le catalogue livré » ;
  - API Ops : 21 (authentification manquante, invalide, expirée ou révoquée ; scopes refusés ; idempotence et rejeu ; création de `change_request` pour les 7 actions sensibles ; approbation → application ; checklist du mode vente ; débit 429 ; audit ; CSV) ;
  - webhooks : 7 (HMAC bon, mauvais ou périmé ; signature Stripe ; rejeu ; abandon) ;
  - liste d'attente : 7 (succès, e-mail invalide, consentement requis, service absent → 503 sans enregistrement, double envoi sans doublon, confirmation, désinscription) ;
  - checkout : 3 ;
  - MCP : 3.
- **E2E Playwright (66)** :
  - 40 captures (5 pages × 4 largeurs × 2 modes de mouvement) avec titre visible, pas de défilement horizontal et zéro erreur console ;
  - home : titre et CTA dans le HTML serveur, lisibles **sans JavaScript** ; aucun contrôle d'achat ni ancien prix ou délai en pré-lancement ; liste d'attente fermée honnêtement ; checkout refusé ; aucun lien vers une racine de réseau social ;
  - interactions : goût (couleur, ingrédients, statut et CTA ensemble), boîte au nombre exact de doses, comparateur au clavier, FAQ au clavier, calculateur, `/preparer` « pas encore testée » ;
  - liens internes tous en 200 ; redirections 301 ; journal noindex ; schéma FAQPage ; sitemap ;
  - **3G lente** (400 ms, 500 kbit/s) : titre visible en 0,55 s, CTA dans la vue et cliquable, titre immobile à l'arrivée des médias ;
  - inscription sur serveur de dev avec stockage mémoire : e-mail invalide, consentement non pré-coché et requis, succès après la vraie réponse API avec un seul envoi malgré un double clic, même adresse deux fois sans doublon ;
  - admin : connexion de dev et captures aux 4 largeurs, refus des visiteurs anonymes ;
  - mobile : toutes les cibles tactiles ≥ 44 px, Le Filet absent et aucun débordement horizontal.
- **Lighthouse mobile** : home 96 / 100 / 100 / 100 (médiane de 3) ; `/formats/poudre` 97 / 100 / 100 / 100.
- **Chaînes interdites** : `scripts/check-claims.mjs` trouve **0** occurrence hors champs Proof. Le script a été vérifié sur un fichier piège : 5 détections sur 5.
- **Revue visuelle** : captures relues ; corrigé en conséquence la hauteur de page, un stick à l'envers, le Filet qui traversait des titres, la mise en page tablette du calculateur et des cartes, et un hotspot qui masquait une lettre.

### Non réalisés ou partiels
- **Supabase, Resend et Stripe réels** : aucun compte n'est configuré. Les adaptateurs sont testés contre le stockage mémoire et la console. Le parcours d'achat n'a jamais été testé de bout en bout, et le mode vente n'a jamais été activé sur un vrai déploiement.
- **LCP mobile 2,8 s** (médiane), au-dessus du budget de 2,5 s. L'élément LCP est le sous-titre en HTML statique : le délai vient du bundle principal sous l'étranglement CPU simulé. Pistes : hydratation différée des scènes sous la ligne de flottaison, réduction de la taille du DOM SVG.
- **INP** : non mesuré sur le terrain (pas de vrais utilisateurs). Le TBT de 20 à 40 ms est un bon indicateur.
- **Lecteur d'écran** : vérifié par l'arbre d'accessibilité de Playwright et Lighthouse, pas avec VoiceOver ou NVDA en conditions réelles.
- **Vidéos réelles** : aucune n'existe. Les emplacements, posters et fallbacks sont prêts.
- **Déploiement Vercel** : non fait.

### Grille de recette

| Question | Réponse |
|---|---|
| Comprend-on le format, son contenu et le geste sans scroller ? | **Oui sur desktop** : « Format présenté : Poudre · Visuel de concept », titre, promesse et animation du geste visibles d'emblée. Sur mobile, le texte et les CTA sont au-dessus de la ligne de flottaison, l'animation juste en dessous. |
| Le site donne-t-il envie de boire ? | **En partie.** Le hero montre une vraie boisson (lait, glaçons, mousse, gorgée) plutôt qu'un objet, mais c'est une illustration : il faudra les films de `PROMPTS.md` pour la gourmandise réelle. |
| Les films montrent-ils le geste réel de chaque format ? | **Oui.** La poudre reste en surface jusqu'à l'outil, le concentré marbre puis se mélange à la cuillère, et il n'y a jamais de filet liquide dans la séquence poudre. |
| Deux familles distinctes, un goût qui change toutes ses données ? | **Oui** : pictogramme stick/goutte pour le format, couleur pour le goût, et un seul objet par recette (testé en e2e). |
| Pré-lancement et vente séparés, sans faux stock ni faux paiement ? | **Oui**, par le code : le panier n'est pas rendu, le checkout est refusé côté serveur, double verrou du mode (testé). |
| Placeholders identifiés, jamais présentés comme des faits ? | **Oui** : « En cours de validation », « Objectif : … », « Visuel de concept », « quantité de travail, à confirmer ». |
| FR et liens fonctionnent ? | **Oui** : français complet, tous les liens internes en 200, redirections en 301. |
| Reduced-motion, clavier, focus, erreurs de formulaire, chargement lent testés ? | **Oui** (voir §7), sauf un test avec un vrai lecteur d'écran. |

## 8. Données à confirmer

| Donnée | Qui | Bloque | Où la saisir |
|---|---|---|---|
| Fournisseurs explorés par Gaspard, devis, échantillons | Gaspard | Origine, composition, prix | API `PATCH /catalog/recipes/:id` puis `POST …/proofs` |
| Formule et portion réelles (poudre et concentré) | David, Gaspard, fabricant | Fiches, préparation, films | `ingredients`, `matchaPerServingG`, `servingTotal`, `denomination` |
| Recettes testées (liquide, volume, chaud/glacé, matériel) | Tests internes | M02, `/preparer`, `/recettes` | `src/content/drinks.ts` (`status`, `measured`) et `preparation` |
| Prix de vente et contenu des packs (6 ou 8 / 20 ou 30) | David, Gaspard | Packs, M04 | `PATCH /catalog/packs/:id/price` (validation) |
| Statut de la société, opérateur responsable | David | Mentions légales, mode vente | `company.*` (catalogue / API) |
| Choix e-mail, paiement, expédition | David | §11 | Variables d'environnement ; Shopify à décider |
| Comptes sociaux officiels | David | Footer | `socials` (via override catalogue) |
| Packaging final et fabricant | David, Gaspard | M03, M10, renders | Aplats SVG à ajuster, puis `PROMPTS.md` |
| Assets originaux existants | David | Manifest | `media-manifest.json` / `POST /media/incoming` |
| Interface technique de l'agent Instinct | David | §11.4 | REST + MCP livrés ; à brancher |
| Allergènes, nutrition, conservation, caféine | Fabricant, laboratoire | Infos obligatoires avant vente | Proof des recettes |
| Pages légales rédigées (CGV, confidentialité complète) | Professionnel | Mode vente (`legal_pages_complete`) | `/legal/*` |
| Fréquence du cron de webhooks | David (plan Vercel) | Rejeu des webhooks | `vercel.json` (quotidien → toutes les 5 min sur Pro) |
