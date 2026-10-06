# MATOCHA — Audit de départ (Phase 0)

Date : 6 octobre 2026. Inspection du dépôt local `~/Desktop/Matocha` et de https://matocha.vercel.app/ (le code local et le site en ligne sont identiques : même `<title>`, mêmes prix 39,00 € / 35,10 €, `lang="en"`).

Le dossier n'était pas un dépôt git. Un commit de référence a été créé avant toute modification (`0a6f138 Baseline: site v1 avant refonte v2`). Il sert à faire les captures avant/après et à revenir en arrière si nécessaire.

## 1. Stack réelle

| Élément | Valeur |
|---|---|
| Framework | Next.js **16.3.0**, App Router, dossier `src/` |
| React | 19.2.8 |
| Styling | Tailwind CSS v4 (`@theme` dans `globals.css`, pas de `tailwind.config`) |
| Animation | `motion` 13.1 (motion.dev). Pas de GSAP, Rive, Lottie ni Three.js |
| Polices | `next/font/google` : Archivo (400/500/600) + Instrument Serif (400, normal/italique) |
| Données | TypeScript en dur : `src/data/brand.ts`, `product.ts`, `site.ts`, `content.ts`, `faq.ts` |
| Backend | Une seule route : `POST /api/waitlist`. Elle valide l'e-mail puis répond « You're on the list » **sans rien stocker** : c'est une fausse confirmation |
| Panier | `src/lib/cart.tsx`, contexte React + `localStorage`, prix en dur, checkout factice (« Checkout opens with the first production run ») |
| Déploiement | Vercel (`matocha.vercel.app`). Pas de `vercel.json`, pas de `.vercel/` local |
| Variables d'env | **Aucune** n'est utilisée dans le code (aucun `process.env`) |
| Tests | Aucun |
| Lint | ESLint 9 + `eslint-config-next` |
| Médias | **Aucun fichier** : pas de `public/`. Toutes les images sont des composants SVG |

Avertissement de build : Turbopack détecte un `package-lock.json` dans le dossier personnel (`/Users/davidsarfati`). Corrigé avec `turbopack.root`.

## 2. Routes et composants

| Route / fichier | Rôle actuel | Décision |
|---|---|---|
| `/` (`app/page.tsx`) | 17 sections empilées | **Refactorer** : 8 blocs (§7) |
| `/product` | Fiche « Daily Box » avec achat et abonnement | **Supprimer** : redirection 301 vers `/formats/poudre` |
| `/why-sticks` | Argumentaire | **Supprimer** : 301 vers `/formats` |
| `/our-matcha` | Origine « Japan » | **Supprimer** : 301 vers `/notre-produit` |
| `/journal` | Trois articles « à venir » | **Garder la route** en `noindex`, hors navigation, en français |
| `/[slug]` (contact, shipping, returns, legal, terms, privacy, cookies, account) | Pages utilitaires génériques | **Refactorer** : `/aide`, `/legal/*`. Les anciennes URL passent en 301 |
| `not-found.tsx` | Verre vide | **Refactorer** : M14 « Cette page s'est renversée » |
| `opengraph-image.tsx` | « Premium Japanese matcha » | **Refactorer** : visuel concept marqué, sans allégation |
| `sitemap.ts`, `robots.ts` | Routes anglaises | **Refactorer** |
| `api/waitlist` | Fausse confirmation | **Refactorer** : double opt-in réel ou état « bientôt ouvertes » |
| `components/brand/MatochaGlass`, `MatochaWave`, `MatochaLogo`, `MatochaPattern` | Identité | **Garder** |
| `components/brand/ProductStick`, `ProductBox` | Sachet et boîte avec « 100% JAPANESE MATCHA » imprimé | **Refactorer** : packaging « Everyday icon » sans allégation |
| `components/brand/StickTray`, `LifestyleFrame` | Plateau de 30 sticks, cadres de vie illustrés | **Refactorer** pour M03 et M06 |
| `components/layout/Header`, `Footer` | Nav anglaise, bouton FR décoratif, liens vers les racines Instagram/TikTok/Pinterest | **Refactorer** |
| `components/layout/CartDrawer`, `lib/cart.tsx`, `components/product/*` | Panier et achat actifs | **Refactorer** : derrière le résolveur de CTA, invisibles en pré-lancement |
| `components/ui/*` (Button, Section, Accordion, WaitlistForm, Reveal…) | Primitives | **Garder** (Button, Container) / **refactorer** (Accordion → `<details>`, WaitlistForm) / **supprimer** (Marquee, CtaRail, Annotation, Reveal sur texte critique) |
| `sections/*` (17 fichiers) | Home actuelle | **Supprimer** après migration de ce qui sert (verre, sticks, rituel) |

## 3. Médias existants

| Chemin | Poids | Dimensions | Usage |
|---|---|---|---|
| — | — | — | Aucun fichier image ou vidéo dans le site |
| `business-plan-assets/*.svg` | 0,8 à 1,6 Ko | vectoriels | Business plan seulement (verre ×5, stick ×2, boîte) |
| `business-plan-assets/fonts.css` | 88 Ko | — | Polices en base64 pour le PDF |

Il n'y a pas de photo, de vidéo ni de fichier Rive/Lottie. Toute scène filmée est donc un emplacement à produire (voir `docs/media/PROMPTS.md`).

## 4. Catalogue produit actuel

Le catalogue est écrit en dur dans `src/data/brand.ts` et dérivé dans `product.ts`. Il contient un seul produit, « MATOCHA Daily Box » : 30 × 2 g, 39,00 €, abonnement −10 % (35,10 €), disponibilité `preorder`. Le texte et les SVG répètent des faits non prouvés : « 100% Japanese matcha », « No sugar », « No additives », « recyclable outer box », origine « Japan ».

## 5. Bouton FR et i18n

Il n'y a aucun système i18n. `<html lang="en">`, tout le texte est en anglais. Le bouton « FR » de l'en-tête est un `<button>` sans `onClick` : c'est un contrôle décoratif. La métadonnée `locale: "fr_FR"` contredit le contenu.

## 6. Chaînes engageantes à neutraliser

| Chaîne | Où |
|---|---|
| 39,00 € / `price: 3900` | `data/brand.ts`, hero, BuyBox, sticky bar, footer |
| 35,10 € / abonnement −10 %, « Save 10% », « Pause anytime » | `brand.ts`, `Subscription.tsx`, `BuyBox.tsx`, `cart.tsx` |
| « Delivery in 2–4 working days » | `data/site.ts`, CartDrawer, `/shipping` |
| Franco 50 € (`freeShippingThreshold: 5000`), « away from free shipping » | `brand.ts`, CartDrawer, BuyBox |
| « 100% Japanese matcha » | brand, product, content, faq, hero, BrandStrip, SpecSheet, ProductStick, ProductBox, our-matcha |
| « No sugar », « No additives », « No flavourings » | brand, product, content, hero, BrandStrip, our-matcha |
| « Premium Japanese… » | `<title>`, metadata, OG image, JSON-LD |
| Origine « Japan » | `brand.sourcing.origin`, FAQ, footer |
| « One recyclable outer box » | `product.ts` |
| « Fresh by design », « as fresh as the first » | `content.ts`, `product.ts` |
| « We answer within two working days » | `site.ts` |
| Liens `https://instagram.com`, `tiktok.com`, `pinterest.com` | `Footer.tsx` |
| JSON-LD `makesOffer` Product | `app/page.tsx` |
| « You're on the list » sans stockage | `api/waitlist/route.ts` |

## 7. Mesures de départ

Serveur de production local (`next build && next start`), Chromium headless.

| Mesure | Valeur |
|---|---|
| Hauteur home desktop 1440 px | **17 809 px** (le brief indique ~17 074 px) |
| Hauteur home mobile 390 px | **20 571 px** |
| Sections dans `<main>` | 18 |
| Lighthouse mobile — Performance | **91** |
| Lighthouse mobile — Accessibilité | **96** |
| Lighthouse mobile — Bonnes pratiques / SEO | 100 / 100 |
| LCP mobile | **3,4 s** (au-dessus du budget de 2,5 s) |
| CLS | 0 |
| TBT | 100 ms |
| JS transféré (home, mobile) | **228 Kio** sur 12 requêtes |
| Poids total de la page | 353 Kio |

Rapport brut : `docs/lighthouse/avant-home-mobile.json`. Captures : `docs/captures/avant/`.

## 8. Conséquences pour la suite

- La stack est conservée : Next 16 App Router sur Vercel, Tailwind 4, `motion`. La plupart des besoins d'animation sont couverts par `motion` (scroll, ressorts, interpolation de couleur). GSAP, Rive et Lottie ne sont pas ajoutés (voir `DECISIONS.md`).
- Le LCP vient du titre animé (`RevealLine` démarre à `y: 110%`). Le texte critique sera rendu sans animation d'entrée.
- Le JS initial est au-dessus du budget de 180 Ko gzip. Le panier, le tiroir et `motion` sont chargés sur toutes les pages : ils seront retirés du chemin critique en pré-lancement.
