# MATOCHA v2 — PROMPT DE TRAVAIL POUR CLAUDE CODE

> À placer à la racine du repo (`/docs/PROMPT_V2.md`) avec le brief stratégique complet (`/docs/BRIEF.md`).
> Claude Code : lis ce document en entier avant de toucher au code, puis exécute de bout en bout.
> Tu ne t'arrêtes pas pour demander une validation à chaque étape : tu journalises tes décisions dans `/docs/DECISIONS.md` et tu livres un rapport final unique. Tu ne t'arrêtes que si une action est destructive, irréversible ou exige un secret que tu n'as pas.

---

## 1. TON RÔLE

Tu es à la fois lead front-end, motion designer et architecte e-commerce sur le site de **Matocha**. Le site actuel (https://matocha.vercel.app/) est une vitrine statique de ~17 000 px avec 14 sections qui répètent les mêmes arguments. Ta mission : en faire un site de marque **vivant, interactif et honnête**, où le mouvement montre ce qu'on achète et comment on le prépare, avec un socle commerce et une API qui permettent à l'agent IA de David (« Instinct ») de piloter l'opérationnel.

Méthode imposée :
- **Chirurgical avant tout.** Tu conserves ce qui marche (identité crème / vert profond / noir, grain, typo forte, marque et sachet au centre, recomposition mobile). Tu refactores, tu ne rases pas.
- **Aucune invention factuelle.** Pas de faux avis, faux stock, faux fournisseur, fausse certification, faux bénéfice santé, faux moyen de paiement, fausse vidéo produit.
- **Tout ce qui n'est pas confirmé est une donnée typée « à confirmer »**, jamais une phrase en dur dans un composant.
- **Tu vérifies visuellement** (captures desktop et mobile) avant de déclarer terminé.

---

## 2. LE PROJET EN CLAIR

**Matocha** est la marque de David Sarfati et de son meilleur ami Gaspard. L'idée : rendre le matcha aussi simple qu'un sachet de sucre ou un tube de lait concentré. Une portion prête, qu'on ouvre et qu'on verse, au lieu d'un rituel qui semble réservé aux initiés (balance, tamis, bol, fouet en bambou).

La cible de départ (hypothèse, pas étude) : les gens qui adorent le matcha latte au café mais n'en font jamais chez eux. Ensuite : bureau, campus, voyage, sport.

**Réalité du marché à intégrer dans le discours :** le stick de matcha en poudre existe déjà en France (Purasana, Lipton Barista…) et cartonne aux États-Unis (Tenzo, Matcha.com…). Matocha ne doit donc **jamais** dire « le premier » ou « inventé ». La différence se construit sur : un geste vraiment facile, un goût qui donne envie de recommencer, une marque qu'on reconnaît dans une poche de jean, et un premier achat accessible.

**Deux familles, une marque :**

| Famille | Nom de travail | Promesse honnête | Statut |
|---|---|---|---|
| Poudre prédosée (stick) | « Original Poudre » | « La dose est prête. À vous de la préparer. » Fouet, mousseur ou shaker restent nécessaires : la poudre est en **suspension**, elle ne se dissout pas. | Prioritaire, en sélection fournisseur |
| Concentré liquide / pâte (sachet) | « Original Concentré » | « Ouvrez. Versez. Mélangez. » — c'est l'idée « lait concentré » de David, potentiellement le futur héros. | En développement, formule non définie |

Gamme envisagée : **Original** d'abord. **Vanille** et **Fraise** sont des pistes à tester. Hojicha = produit adjacent, pas un goût de matcha.

Le site démarre en **mode pré-lancement**. Il doit pouvoir basculer en **mode vente** sans réécriture, uniquement quand les données réelles sont confirmées.

---

## 3. RÈGLES DE VÉRITÉ (NON NÉGOCIABLES)

1. Aucun avis, note, compteur de clients, « best-seller », stock ou délai inventé.
2. Aucun « bio », « Uji », « cérémonial », « 100 % matcha », « sans additifs », « recyclable » sans champ de preuve renseigné dans les données produit.
3. Aucune allégation santé : pas de detox, brûle-graisse, anti-stress, « sans crash », « focus ». Caféine uniquement avec donnée réelle pour la portion.
4. La poudre n'est **jamais** animée comme si elle disparaissait dans du lait froid sans agitation. Chaque film montre le geste réel du format.
5. Les visuels conceptuels (renders, illustrations, vidéos générées) portent un statut `concept` dans le manifest et, quand ils montrent le produit, une mention discrète « Visuel de concept ».
6. Aucun bouton d'achat ou d'abonnement actif tant que `siteMode !== "sale"` ET que le produit n'est pas `available`. C'est garanti **par le code**, pas par le style.
7. Aucun lien vers une racine de réseau social. Comptes réels ou rien.
8. Le français est la langue par défaut et doit être complet. L'anglais n'existe que s'il est intégral.
9. Aucune image tirée d'Internet sans licence commerciale documentée dans le manifest. Aucun asset d'une autre marque (en particulier @drinkmuacha : on traduit des principes, on ne copie rien).

---

## 4. PHASE 0 — INSPECTION (AVANT TOUTE MODIFICATION)

Produis `/docs/AUDIT.md` contenant :
- stack réelle (framework, version, router, styling, libs d'animation, déploiement, variables d'env existantes **par nom uniquement**) ;
- arbre des routes et composants, avec pour chacun : garder / refactorer / supprimer ;
- inventaire des médias existants (chemin, poids, dimensions, usage) ;
- catalogue produit actuel et où il vit (en dur ? JSON ? CMS ?) ;
- état du bouton FR et du système i18n ;
- toutes les chaînes « engageantes » à neutraliser (39 €, 35,10 €, « 2-4 jours », « franco 50 € », « 100 % matcha », « Japon »…) ;
- mesures de départ : hauteur de la home, Lighthouse mobile (perf, a11y, CLS, LCP), poids JS.

Adapte toutes les recommandations techniques de ce document à la stack trouvée. Si le projet est en Next.js App Router sur Vercel (probable), garde-le. Si un choix de ce document contredit l'existant de façon coûteuse, choisis l'option la moins invasive et note-le dans `DECISIONS.md`.

---

## 5. DIRECTION CRÉATIVE

### 5.1 Concept : « Le Filet »

Un seul élément audacieux, tout le reste discipliné. **Le Filet** est un ruban vert matcha, fluide, qui sort du sachet dans le hero et devient le fil conducteur graphique de la page : il ondule entre les sections, se resserre autour du geste, change de teinte avec le goût sélectionné et vient remplir le verre final au-dessus du footer.

- C'est un **motif de marque** (repris sur le packaging : « motif original de filet ou d'ondulation »), pas une démonstration produit. Il ne remplace jamais les vraies scènes de préparation.
- Il est dessiné en SVG (path animé lié au scroll), sans WebGL obligatoire.
- `prefers-reduced-motion` : le filet est statique, entièrement tracé.
- Mobile : tracé simplifié, une seule ondulation par section.

Tout le reste est calme : pas d'apparition fade-up sur chaque bloc, pas de parallax partout, pas de produit qui tourne en boucle, pas de curseur personnalisé.

### 5.2 Palette (tokens à créer en CSS custom properties)

Point de départ ; ajuste après avoir relevé les valeurs actuelles du site pour garder la continuité.

| Token | Hex | Rôle |
|---|---|---|
| `--lait-avoine` | `#EEEDE0` | Fond principal, une crème légèrement verte (pas le crème beige générique) |
| `--foret` | `#1E3A2A` | Identité, texte fort, packaging |
| `--matcha` | `#8DB33A` | Matière, le Filet, la boisson |
| `--mousse` | `#C9DB8E` | Mousse de lait teintée, survols, fonds de scène |
| `--encre` | `#16241B` | Texte courant (noir verdi) |
| `--rhubarbe` | `#E2718C` | Accent goût Fraise uniquement |
| `--vanille` | `#EBD7A8` | Accent goût Vanille uniquement |

Règle : **un repère pour le format** (Poudre = pictogramme stick plein / Concentré = pictogramme goutte), **une couleur pour le goût**. Ne jamais mélanger les deux systèmes.

### 5.3 Typographie

Garde la typo actuelle si elle est distinctive et lisible. Sinon, teste deux couples (licences commerciales gratuites, Fontshare) et choisis-en un seul :
- Display **Zodiak** ou **Gambarino** (serif gourmande, matière) + texte **General Sans** ;
- échelle typographique stricte (ratio ~1.25), lignes < 75 caractères, interlignage serif plus généreux.

À éviter : un mot du titre en italique ou en couleur, étiquettes en capitales espacées au-dessus de chaque titre, flèches « → » ajoutées partout, numérotation 01/02/03 sur du contenu qui n'est pas une séquence (le geste en 3 temps, lui, **est** une séquence : numérotation légitime).

### 5.4 Ton et banque de copy

Français d'abord. Court, concret, accueillant. On simplifie l'usage, pas la culture du thé.

- Hero : « Le matcha, en plus simple. »
- Sous-titre : « Une dose de matcha dans un stick. Vous l'ouvrez, vous la versez, vous la préparez en un geste. »
- Signature : « Votre dose. Votre tasse. Votre moment. »
- Poudre : « La dose est prête. À vous de la préparer. »
- Concentré (quand validé) : « Ouvrez. Versez. Mélangez. »
- Pré-lancement : « Le premier lot se prépare. Soyez prévenu du lancement. »
- CTA principal pré-lancement : « Être prévenu du lancement »
- Confirmation : « C'est noté. Vous recevrez un e-mail pour confirmer votre inscription. »
- Erreur formulaire : « Cette adresse e-mail semble incomplète. Vérifiez le @ et le domaine. »

Interdits : « prêt en 10 secondes », « zéro grumeau », « aucune amertume », « compatible avec tout liquide » (tant que non testés).

---

## 6. ARBORESCENCE

Navigation : **Les formats · Comment préparer · Notre produit · FAQ** (+ « Boutique » uniquement en mode vente). Journal retiré de la nav tant qu'il est vide (route conservée, `noindex`).

| Route | Contenu |
|---|---|
| `/` | Home resserrée en 8 blocs (§7) |
| `/formats` | Comparateur + accès aux deux familles |
| `/formats/poudre` | Fiche famille Poudre (goûts, packs, préparation, composition) |
| `/formats/concentre` | Fiche famille Concentré, état « en développement » + CTA d'intérêt |
| `/preparer` | Guide interactif chaud / glacé / shaker / mousseur |
| `/recettes` | Recettes réellement réalisables avec chaque format (statut par recette) |
| `/notre-produit` | Origine confirmée, fabrication, conservation, ce qu'on sait / ce qu'on vérifie encore |
| `/faq` | FAQ complète, accessible, structurée (schema.org FAQPage) |
| `/aide` | Contact, livraison, retours (contenus conditionnés au mode) |
| `/legal/*` | Mentions légales, CGV, confidentialité, cookies — gabarits marqués « à compléter » tant que la société n'existe pas |
| `/admin` | Back-office protégé (validation des demandes de l'agent, §11.5) |
| 404 | Page ludique (§8, M14) |

Supprime ou redirige (301) les anciennes routes anglaises (`/product`, `/why-sticks`, `/our-matcha`, `/shipping`, `/legal`) vers leurs équivalents.

---

## 7. LA HOME EN 8 BLOCS

Objectif de longueur : **6 000 à 8 000 px desktop** (contre ~17 000). Chaque bloc a un seul travail.

### Bloc 1 — Hero : comprendre et désirer (scène M01)
- Gauche : nom, titre, sous-titre, indicateur de format visible (« Format présenté : Poudre · Concept »), CTA principal + CTA secondaire « Voir le geste » (ancre Bloc 2).
- Droite / plein cadre : la scène **M01 « Le Versement »**.
- Le titre, le sous-titre et les CTA sont rendus en HTML serveur, visibles au premier paint, sans dépendre de JS ni du média. Aucune animation d'entrée sur le texte critique.
- Réserve l'espace média (aspect-ratio fixe) : zéro CLS quand la vidéo arrive.

### Bloc 2 — Le geste (scène M02)
Trois étapes, lisibles même si la scène ne joue pas : **Ouvrir → Verser → Préparer**. Le texte et l'animation montrent exactement la même chose. Toggle Poudre / Concentré qui change la scène et les étapes (Concentré marqué « en développement »).

### Bloc 3 — Choisir son format et son pack (scènes M03 + M04)
Comparateur court (préparation, matériel, portion, composition, usages, prix par boisson, conservation) puis cartes de packs Découverte / Quotidien / Duo générées depuis les données. En pré-lancement : doses et contenu affichés, prix absents ou « indicatif, non définitif » selon le flag `priceStatus`, CTA d'intérêt.

### Bloc 4 — À votre goût (scène M05)
Original d'abord. Vanille et Fraise présentés comme « pistes en test ». Changer de goût change **ensemble** : couleur de la boisson, habillage du sachet, accent du Filet, texte, ingrédients affichés.

### Bloc 5 — La vie autour du produit (scène M06)
« Une journée avec Matocha » : cuisine le matin, bureau, sac, campus, week-end, une gorgée. Lumière naturelle, vraies mains. Pas de poudre préparée en voyage sans le matériel nécessaire (shaker visible).

### Bloc 6 — Ce qu'il y a dedans (scène M07)
Composition, quantité de matcha par portion, portion totale, origine, conservation, nutrition — chaque ligne affiche sa valeur **ou** « En cours de validation ». Pas de badge pour combler un vide.

### Bloc 7 — Pourquoi c'est plus simple (scène M08)
Comparatif honnête « Rituel traditionnel / Stick Matocha » ramené à une boisson finie. Respectueux du rituel : on simplifie, on ne ridiculise pas.

### Bloc 8 — FAQ courte + CTA final + footer (scène M09)
6 questions clés (lien vers `/faq`), CTA final, footer avec mentions réelles, comptes sociaux confirmés uniquement, sélecteur de langue fonctionnel. Le Filet termine sa course dans le verre final.

---

## 8. CATALOGUE DES SCÈNES MOTION

Chaque scène est un composant isolé (`/components/scenes/`) avec : props de données, version mobile, version `reduced-motion`, poster, et statut des assets. Aucune scène ne bloque le scroll (pas de scroll captif ; les sections « épinglées » sont courtes et toujours dépassables).

**Outils recommandés** (à adapter à la stack) : GSAP + ScrollTrigger pour les séquences liées au scroll, Motion (motion.dev) pour les micro-interactions UI, Rive pour les illustrations interactives à états (boîte, verre), `<canvas>` + séquence d'images pour le scrub vidéo desktop, `<video>` muette `playsinline` sur mobile. Three.js / R3F seulement pour M10 et seulement si le gain est réel. Lenis optionnel, désactivé en reduced-motion.

### M01 — « Le Versement » (hero)
- **Déroulé poudre (8 plans, ~8 s en boucle) :** main qui tient le stick Matocha lisible → déchirure → la poudre tombe en petit nuage dans un verre transparent de lait sur glaçons → le shaker/mousseur entre dans le cadre → mouvement → la couleur devient uniforme, mousse en surface → une main soulève le verre → première gorgée → retour au sachet.
- **Déroulé concentré (même verre, même volume, toggle) :** le sachet se déchire, un filet vert épais tombe dans le lait, marbrure qui tourbillonne, quelques tours de cuillère, couleur qui s'uniformise, gorgée. C'est la scène que David imagine : elle n'est montrée qu'avec la mention « Concentré — en développement ».
- **Tech :** desktop = vidéo boucle 6-10 s (AV1/WebM + H.264) ; option scrub au scroll via séquence d'images 72 frames si les assets le permettent. Mobile = vidéo verticale 4:5 légère. Poster AVIF haute qualité affiché immédiatement.
- **Fallback :** reduced-motion = poster + 3 vignettes fixes du geste. Média absent = illustration Rive conceptuelle (verre, sachet, main stylisée) clairement graphique.

### M02 — « Le Geste en 3 temps »
- Section brièvement épinglée (≤ 150 vh desktop). Le scroll fait avancer : 1 Ouvrir (le stick se déchire en suivant la ligne de découpe), 2 Verser, 3 Préparer (fouet / shaker / mousseur selon `preparation.method` du produit).
- Chaque étape = un plan vidéo court ou un état Rive, synchronisé avec un texte toujours visible.
- Mobile : carrousel horizontal à 3 cartes avec swipe et indicateurs, sans épinglage.
- Toggle chaud / glacé intégré : change le liquide, la température affichée et le plan final (vapeur vs glaçons).

### M03 — « Ouvre la boîte »
- La boîte du pack est fermée. L'utilisateur clique, tape ou fait glisser le couvercle : les sticks se dévoilent en éventail, rangés comme dans le vrai packaging, avec le **nombre exact de doses** du pack sélectionné (6/8, 20/30…).
- Changer de pack rejoue l'ouverture avec le bon nombre de sticks.
- Tech : Rive (state machine `closed → opening → open`) ou SVG + GSAP. Accessible : bouton « Ouvrir la boîte » avec `aria-expanded`.
- Reduced-motion : boîte affichée ouverte.

### M04 — « Ma dose » (calculateur de pack)
- Slider « Combien de matchas par semaine ? » (1 à 14) + choix chaud / glacé.
- Sortie : nombre de doses par mois, pack conseillé, durée d'un pack. Le prix par boisson n'apparaît **que** si `priceStatus === "confirmed"`.
- Un verre se remplit visuellement selon la fréquence ; la boîte se vide sur la durée calculée.
- C'est un outil utile, pas une tactique de vente : aucune pression (« plus que 3 ! »).

### M05 — « Le Sélecteur de goût »
- Trois pastilles Original / Vanille / Fraise. Au changement : la teinte du liquide transite (interpolation de couleur dans le verre), le sachet change d'habillage, le Filet change d'accent, les données (ingrédients, statut, recette) se mettent à jour.
- Vanille et Fraise : badge « Piste en test », CTA « Je veux goûter celui-ci » (intérêt non payant, alimente un tag dans la waitlist).
- Toutes les données viennent du même objet produit/recette : impossible d'afficher la couleur Fraise avec les ingrédients Original.

### M06 — « Une journée avec Matocha »
- Défilement horizontal piloté par le scroll vertical (desktop) ou swipe (mobile) : 7 h cuisine, 10 h bureau, 13 h campus, 18 h sport, samedi terrasse.
- Un même stick passe de scène en scène : sur la table, dans une poche de jean, dans une trousse, dans un sac de sport, à côté d'un shaker.
- Chaque scène : une photo ou vidéo courte (statut dans le manifest), une ligne de texte, une recette liée.
- Reduced-motion : grille statique de 5 cartes.

### M07 — « Sous la loupe »
- Un macro du sachet ouvert. Au survol/tap sur des points d'intérêt (poudre, sachet, soudure, lot), une fiche s'ouvre avec la donnée réelle ou « En cours de validation ».
- Micro-scène pédagogique « Suspension, pas dissolution » : quelques particules en canvas que l'utilisateur peut « remuer » au doigt ou à la souris. Sans agitation, elles retombent ; en remuant, elles se répartissent. Ça explique honnêtement pourquoi on secoue la poudre.
- Accessibilité : chaque point d'intérêt est un bouton ; le contenu existe aussi en liste lisible sous la scène.

### M08 — « Le Comparateur rituel »
- Slider avant/après à poignée : à gauche, les objets du rituel traditionnel (balance, tamis, bol, chasen), à droite un stick et un shaker. Sous la poignée, un tableau qui compare les étapes pour **une boisson**.
- Ton respectueux : « Le rituel a sa beauté. Le stick, lui, tient dans une poche. »
- Clavier : flèches gauche/droite sur la poignée (`role="slider"`).

### M09 — « La Dernière gorgée » (fin de page)
- Le Filet descend dans un grand verre au-dessus du footer, qui se remplit selon la progression du scroll dans le dernier bloc. Une paille apparaît quand il est plein ; le CTA final est posé à côté, toujours visible et cliquable sans attendre l'animation.

### M10 — « Le Sachet en main » (fiche produit, optionnel 3D)
- Viewer du stick : face / dos / profil, rotation à la souris ou au doigt, zoom sur le dos (les 3 gestes imprimés). Un seul modèle, chargé uniquement sur la fiche, avec poster statique et fallback 2D (trois images).
- Ne le construis que si le packaging final est défini ; sinon trois vues 2D conceptuelles.

### M11 — Micro-interactions commerce (mode vente)
- Ajout au panier : le stick « vole » dans l'icône du panier, qui est une petite boîte qui se remplit.
- Icône panier : nombre de doses total, pas seulement d'articles.
- Validation de commande : animation uniquement **après** confirmation serveur du paiement.

### M12 — Inscription waitlist
- Après succès réel de l'API (pas avant) : le stick se déchire et libère une petite pluie de poudre verte, puis le message de confirmation. Échec : message d'erreur précis, sans animation festive.

### M13 — Chargements
- Indicateur de chargement : un fouet stylisé qui tourne (SVG léger). Skeletons aux dimensions finales.

### M14 — Page 404
- Un stick renversé, un petit tas de poudre sur la table. « Cette page s'est renversée. » + liens vers la home et les formats. L'utilisateur peut « balayer » la poudre au curseur (bonus, désactivé en reduced-motion).

---

## 9. PAGES SECONDAIRES (POINTS CLÉS)

- **`/formats`** : comparateur complet, deux colonnes, le Concentré visiblement « en développement ». Pas de faux bouton d'achat.
- **`/formats/poudre` et `/formats/concentre`** : hero propre au format, M02 adapté, M05, packs, composition détaillée, préparation, conservation, FAQ ciblée. Toutes les infos alimentaires obligatoires sont prévues comme champs (dénomination, ingrédients, allergènes en évidence, quantité nette, nutrition, opérateur responsable, origine si revendiquée, mode d'emploi, conservation) et affichées « à compléter » tant que vides — elles devront être présentes avant toute vente à distance.
- **`/preparer`** : guide interactif. Choix : format → chaud ou glacé → matériel disponible (fouet, mousseur, shaker, rien). Sortie : la recette validée correspondante, ou « Cette combinaison n'a pas encore été testée ». Le choix « rien » pour la poudre renvoie honnêtement vers le shaker.
- **`/notre-produit`** : deux colonnes « Ce qu'on sait » / « Ce qu'on vérifie encore ». Transparence plutôt que badges.
- **`/faq`** : poudre ou concentré ? comment préparer ? quels liquides ? chaud/froid ? sucre ? allergènes ? conservation ? livraison ? abonnement (si proposé) ? Accordéons accessibles (`<details>` ou ARIA complet), schema.org.

---

## 10. MODÈLE DE DONNÉES ET ÉTATS

Crée un catalogue typé unique (TypeScript, dans `/content/catalog/` ou une base selon §11). **Aucun composant ne contient de donnée produit en dur.**

```ts
type SiteMode = "prelaunch" | "sale";

type Proof<T> = {
  value: T | null;
  status: "confirmed" | "to_confirm" | "unknown";
  source?: string;        // document, COA, devis… (interne)
  verifiedAt?: string;
};

type Family = {
  id: "poudre" | "concentre";
  name: string;            // nom affiché
  formatIcon: "stick" | "drop";
  devStatus: "concept" | "prototype" | "in_development" | "validated";
};

type Recipe = {            // = goût
  id: "original" | "vanille" | "fraise";
  familyId: Family["id"];
  accentToken: string;     // --matcha, --vanille, --rhubarbe
  liquidColor: string;
  ingredients: Proof<string[]>;
  allergens: Proof<string[]>;
  matchaPerServingG: Proof<number>;
  servingTotal: Proof<{ value: number; unit: "g" | "ml" }>;
  origin: Proof<string>;
  claims: { label: string; proof: Proof<boolean> }[]; // affichées seulement si confirmed
  preparation: Proof<{ method: "whisk" | "frother" | "shaker" | "spoon"; liquidMl: number; hot: boolean; iced: boolean }[]>;
  storage: Proof<string>;
  nutrition: Proof<Record<string, string>>;
  caffeineMg: Proof<number>;
  status: "test_track" | "validated";
};

type Pack = {
  id: string;              // decouverte | quotidien | duo
  familyId: Family["id"];
  recipeIds: Recipe["id"][];
  doses: number;
  price: Proof<number>;    // TTC €
  commercialStatus: "concept" | "waitlist" | "preorder" | "available" | "sold_out" | "retired";
  media: string[];         // ids du manifest
};
```

**Résolveur de CTA (fonction pure, testée unitairement) :**

```ts
function resolveCta(mode: SiteMode, pack: Pack, recipe: Recipe):
  | { kind: "buy"; label: "Ajouter au panier" }
  | { kind: "interest"; label: "Être prévenu du lancement" | "Je veux goûter celui-ci" }
  | { kind: "none" }
```
- `buy` uniquement si `mode === "sale"` ET `pack.commercialStatus === "available"` ET `price.status === "confirmed"` ET `recipe.status === "validated"` ET toutes les infos alimentaires obligatoires sont `confirmed`.
- Le passage en `sale` est contrôlé côté serveur (§11.5) ; aucune variable front ne suffit.
- Tests unitaires couvrant chaque combinaison bloquante.

`siteMode` est lu côté serveur (env + table `settings`) et injecté dans les métadonnées (titre, description, Open Graph cohérents avec le pré-lancement).

---

## 11. COMMERCE ET API POUR L'AGENT

### 11.1 Architecture recommandée (à valider par David, implémentée derrière une interface)

Implémente une couche `CommerceProvider` (interface) pour pouvoir changer de solution sans toucher aux composants.

**Recommandation par défaut :**
- **Base de données & auth :** Supabase (Postgres + Row Level Security + auth magic link pour `/admin`).
- **E-mail :** Brevo ou Resend (double opt-in pour la waitlist, e-mails transactionnels plus tard).
- **Paiement (mode vente uniquement) :** Stripe Checkout hébergé + webhooks. Abonnement Stripe Billing seulement quand l'abonnement est validé.
- **Expédition (mode vente) :** connecteur prévu pour une solution multi-transporteurs (Sendcloud ou Boxtal) — interface seulement en pré-lancement.
- **Analytics :** solution sans cookie (Vercel Analytics ou Plausible) pour éviter une bannière lourde ; bannière de consentement seulement si un traceur non essentiel est ajouté.

Alternative à documenter dans `DECISIONS.md` : Shopify headless (Storefront API + Admin API), plus coûteux mais qui gère TVA, factures et expéditions clé en main. Ne l'implémente pas sans décision.

### 11.2 Pré-lancement (à construire maintenant)
- Formulaire waitlist : e-mail, intérêt (poudre / concentré / goût), case de consentement **non pré-cochée** avec texte versionné, lien vers la politique de confidentialité.
- Double opt-in. Stockage : e-mail, intérêts, version du texte de consentement, horodatage, statut (`pending` / `confirmed` / `unsubscribed`). Pas d'IP en clair (hash).
- Si aucun service e-mail n'est configuré (variables absentes), le formulaire affiche un état « Inscriptions bientôt ouvertes » — **jamais** une fausse confirmation.
- Désinscription en un clic.

### 11.3 Mode vente (à préparer, désactivé)
- Panier persistant, quantités en doses, totaux TTC, frais de livraison issus de la configuration réelle.
- Checkout Stripe, page succès qui lit la session côté serveur, gestion des états : paiement échoué, rupture, double soumission (clé d'idempotence), retour arrière.
- Infos alimentaires obligatoires visibles sur la fiche avant l'ajout au panier.
- Tout est derrière le résolveur de CTA et le verrou serveur du mode.

### 11.4 API « Matocha Ops » pour l'agent Instinct

L'agent de David doit pouvoir faire tourner l'opérationnel. Construis une API REST versionnée `/api/ops/v1`, documentée en OpenAPI (`/docs/ops-api.openapi.yaml`), plus un petit serveur MCP optionnel (`/mcp`) qui expose les mêmes actions comme outils, pour qu'un agent compatible MCP les appelle directement.

**Authentification & sécurité**
- Jetons Bearer générés depuis `/admin`, stockés **hachés**, avec scopes, date d'expiration et révocation.
- Scopes : `catalog:read`, `catalog:write`, `content:read`, `content:write`, `leads:read`, `leads:write`, `orders:read`, `orders:write`, `media:write`, `analytics:read`, `settings:propose`.
- En-tête `Idempotency-Key` obligatoire sur toute écriture.
- Rate limiting par jeton. Journal d'audit de chaque appel (qui, quoi, avant/après).
- Aucun secret côté client, aucun secret dans le repo ; uniquement des noms de variables dans `.env.example`.

**Endpoints**

| Méthode & route | Scope | Effet | Validation humaine |
|---|---|---|---|
| `GET /health` | — | État de l'API et du mode | Non |
| `GET /catalog` · `GET /catalog/packs/:id` | catalog:read | Lire familles, recettes, packs | Non |
| `PATCH /catalog/recipes/:id` | catalog:write | Modifier textes, champs `Proof` en `to_confirm` | Non |
| `POST /catalog/recipes/:id/proofs` | catalog:write | Passer un champ en `confirmed` avec source | **Oui** |
| `PATCH /catalog/packs/:id/price` | catalog:write | Changer un prix | **Oui** |
| `POST /catalog/packs/:id/status` | catalog:write | Changer `commercialStatus` | **Oui** si → `available` |
| `GET/POST /content/blocks` | content:* | Brouillons FAQ, bandeau d'annonce, textes de sections | Publication : **Oui** |
| `GET /leads` · `GET /leads/export` | leads:read | Liste et export CSV de la waitlist (confirmés seulement) | Non |
| `PATCH /leads/:id/tags` | leads:write | Tagger un inscrit | Non |
| `GET /orders` · `GET /orders/:id` | orders:read | Lire les commandes | Non |
| `POST /orders/:id/shipments` | orders:write | Créer l'expédition d'une commande payée | Non |
| `POST /orders/:id/refunds` | orders:write | Remboursement | **Oui** |
| `POST /media/incoming` | media:write | Déposer un asset avec son statut et sa licence | Publication : **Oui** |
| `GET /analytics/summary` | analytics:read | Visites, inscriptions, conversions par jour | Non |
| `POST /settings/mode` | settings:propose | Proposer le passage `prelaunch → sale` | **Toujours** |

**File de validation** — Toute action marquée « Oui » crée une `change_request` (`pending → approved/rejected → applied`) visible dans `/admin`. David ou Gaspard valident d'un clic ; l'agent est notifié du résultat. Le passage en mode vente vérifie en plus, côté serveur, une checklist bloquante : société renseignée, pages légales complètes, au moins un pack `available` avec prix et infos alimentaires confirmés, paiement configuré, livraison configurée.

**Webhooks sortants vers l'agent** — `lead.confirmed`, `order.paid`, `order.payment_failed`, `stock.low`, `change_request.decided`, `form.error_spike`. Signature HMAC-SHA256 en en-tête, horodatage, rejeu exponentiel, journal des envois.

### 11.5 Back-office `/admin`
Accès magic link limité aux e-mails de David et Gaspard (liste en variable d'env). Pages : demandes de l'agent à valider, waitlist, catalogue avec statuts `Proof`, jetons API, journal d'audit, mode du site avec checklist. Sobre et fonctionnel ; pas besoin de motion ici.

---

## 12. MÉDIAS ET ASSETS

### 12.1 Manifest obligatoire
Crée `/content/media-manifest.json`. Aucun média n'est utilisé sans entrée.

```json
{
  "id": "hero-pour-poudre-desktop",
  "family": "poudre",
  "recipe": "original",
  "status": "real | concept | missing",
  "kind": "video | image | rive | lottie | model3d",
  "source": "tournage | génération IA | banque d'images | illustration interne",
  "license": { "name": "", "url": "", "commercialUse": true, "proofStored": "" },
  "files": { "desktop": "", "mobile": "", "poster": "" },
  "alt": "",
  "decorative": false,
  "usedIn": ["home/hero"],
  "notes": ""
}
```

### 12.2 Pipeline de production
1. **Packaging d'abord.** Dessine en SVG les aplats du stick (face / dos / profil) et de la boîte, route « Everyday icon » : sachet fin crème / vert forêt, MATOCHA parfaitement lisible, motif de filet original, bloc de couleur par recette, trois gestes au dos. Exporte des PNG haute définition. Ce sont les **références** de toutes les générations : aucun générateur ne doit inventer la typo.
2. **Renders produit** à partir de ces aplats (générateur d'images avec image de référence, ou Blender). Statut `concept`.
3. **Plans vidéo** (pour M01, M02, M06) générés en image-to-video à partir des renders, ou tournés. Statut `concept` tant que ce n'est pas le vrai produit.
4. **Ambiances** (lait, glaçons, mains, bureau, lumière du matin) possibles via banques à licence commerciale (Pexels, Unsplash) : téléchargées dans le repo, jamais hotlinkées, sans marque concurrente visible, licence consignée.
5. Ne génère pas toi-même de médias que tu ne peux pas produire : écris pour chaque plan manquant un prompt de génération précis dans `/docs/media/PROMPTS.md` (cadrage, lumière, durée, mouvement de caméra, référence packaging, format 16:9 et 4:5), et place un emplacement typé avec poster dans le site. David ou son agent produiront les fichiers et les déposeront dans `/media/incoming/`.

### 12.3 Liste des plans à produire
Hero produit · stick face / dos / profil · boîte fermée, ouverte, doses rangées · macro du stick · déchirure · versement poudre · versement concentré · fouet / shaker / mousseur · boisson glacée terminée · boisson chaude terminée · gorgée · 5 moments de vie (M06) · une variante par goût **validé** uniquement.

Cohérence : même verre, même volume, même teinte de matcha d'un plan à l'autre. Jamais un filet liquide dans une séquence poudre.

### 12.4 Specs techniques
- Vidéo hero desktop : 1920×1080, 6-10 s, AV1/WebM + H.264 fallback, ≤ 4 Mo ; mobile 1080×1350, ≤ 2,5 Mo ; muette, `playsinline`, `preload="metadata"`, poster AVIF.
- Séquence de scrub : 60-90 frames WebP/AVIF à 1280 px, chargement progressif, desktop seulement.
- Images : AVIF/WebP, `srcset`, dimensions explicites, lazy-load hors écran.
- Rive / Lottie : < 150 Ko par fichier.

---

## 13. LANGUE, ACCESSIBILITÉ, PERFORMANCE, SEO

- **i18n :** toutes les chaînes dans des fichiers de traduction ; FR complet par défaut ; EN seulement s'il est complet, sinon sélecteur masqué. URL et `hreflang` cohérents.
- **Accessibilité :** navigation clavier complète, focus visibles, contrôles nommés, contrastes AA y compris sur médias, pas d'info uniquement au survol, `prefers-reduced-motion` respecté partout (chaque scène a son équivalent statique), aucune info essentielle uniquement dans une vidéo.
- **Performance (budgets mobile) :** LCP < 2,5 s, CLS < 0,05, INP < 200 ms, JS initial home < 180 Ko gzip. Les scènes lourdes sont chargées dynamiquement à l'approche (IntersectionObserver).
- **Robustesse :** titre, proposition et CTA visibles sans JS et si les médias échouent. Aucun saut de mise en page quand une vidéo arrive.
- **SEO :** métadonnées par page cohérentes avec le mode, Open Graph avec visuel concept marqué, schema.org Organization + FAQPage (Product seulement en mode vente avec données réelles), sitemap, journal `noindex` tant que vide.

---

## 14. VÉRIFICATION AVANT LIVRAISON

La build qui passe n'est pas un critère de fin. Tu dois :

1. Lancer des tests Playwright qui capturent home, `/formats/poudre`, `/preparer`, `/faq`, 404 et `/admin` (login mocké) en **360, 390, 768, 1440 px**, en mode normal et en `reduced-motion`. Relis chaque capture et corrige.
2. Tests unitaires du résolveur de CTA et du verrou de mode (une combinaison qui ne doit pas permettre l'achat = un test).
3. Tests de l'API Ops : authentification, scopes refusés, idempotence, création de `change_request`, signature des webhooks.
4. Test du formulaire waitlist : succès, e-mail invalide, service absent, double soumission.
5. Lighthouse mobile sur la home et une fiche : consigner avant/après.
6. Simulation réseau lent (3G) : le hero reste lisible et cliquable.
7. Recherche dans le code de toutes les chaînes interdites (§3, §5.4) : zéro occurrence hors champs `Proof` non confirmés.

Grille de recette (réponds oui/non argumenté dans le rapport) :
- On comprend le format présenté, ce qu'il contient et le geste, sans scroller ?
- Le site donne envie de **boire**, pas seulement d'admirer un objet ?
- Les films montrent le geste réel de chaque format ?
- Les deux familles sont distinctes ; un goût change toutes ses données ensemble ?
- Pré-lancement et vente sont séparés sans faux stock ni faux paiement ?
- Les placeholders sont identifiés et jamais présentés comme des faits ?
- FR et tous les liens fonctionnent ?
- Reduced-motion, clavier, focus, erreurs de formulaire et chargement lent testés ?

---

## 15. RAPPORT FINAL ATTENDU

Un seul fichier `/docs/RAPPORT_V2.md` :
1. Résumé des changements (gardé / refactoré / supprimé), avec captures avant/après.
2. Décisions techniques et alternatives écartées.
3. Scènes motion livrées, leur statut d'assets (`real` / `concept` / `missing`).
4. Liste des médias à produire avec leurs prompts (renvoi vers `PROMPTS.md`).
5. API Ops : comment créer un jeton pour l'agent, URL de la doc OpenAPI, exemples `curl`, liste des webhooks.
6. Variables d'environnement à renseigner (noms uniquement).
7. Tests réalisés, résultats, et tests **non** réalisés.
8. Données à confirmer (tableau §16), à jour.

---

## 16. DONNÉES ENCORE À CONFIRMER (NE PAS INVENTER)

| Donnée | Qui | Bloque |
|---|---|---|
| Fournisseurs explorés par Gaspard, devis, échantillons | Gaspard | Origine, composition, prix |
| Formule et portion réelles (poudre et concentré) | David / Gaspard + fabricant | Fiches, préparation, films |
| Recettes testées (liquide, volume, chaud/glacé, matériel) | Tests internes | M02, `/preparer` |
| Prix de vente et contenu des packs | David / Gaspard | Packs, M04 |
| Statut de la société, opérateur responsable | David | Légal, mode vente |
| Choix e-mail / paiement / expédition | David | §11 |
| Comptes sociaux officiels | David | Footer |
| Packaging final et fabricant | David / Gaspard | M03, M10, renders |
| Assets originaux existants | David | Manifest |
| Interface technique de l'agent Instinct (REST, MCP, autre) | David | §11.4 |

Tu ne bloques pas la direction graphique en attendant ces données : tu construis les emplacements, les états et les fallbacks, et tu laisses les inconnues visibles comme telles.

FIN DU PROMPT
