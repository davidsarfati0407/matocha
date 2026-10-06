# MATOCHA — Médias à produire et prompts de génération

Chaque plan correspond à une entrée `missing` de `src/content/media-manifest.json`. Une fois le fichier produit :

1. déposez-le dans `public/media/…` au chemin indiqué par le manifest (ou via `POST /api/ops/v1/media/incoming` pour l'agent) ;
2. passez l'entrée en `status: "concept"` (rendu ou génération) ou `"real"` (vrai produit filmé), avec la licence renseignée ;
3. un média `real` remplace l'illustration dans la scène. Un média `concept` garde la mention « Visuel de concept ».

## Règles communes (à coller en tête de chaque prompt)

- **Référence packaging obligatoire** : les aplats SVG du site (`/formats/poudre`, section « Le sachet », face / dos / profil), exportés en PNG HD. Le générateur **ne doit pas inventer la typographie** : MATOCHA en capitales grasses serrées, couleur forêt `#1B3B2A` sur sachet crème `#F4F2E6`, ruban (« filet ») vert matcha `#8DB33A`, bloc de couleur de recette en bas.
- **Cohérence** : même verre (gobelet droit transparent, légèrement évasé, ~30 cl), même volume, même teinte de matcha d'un plan à l'autre.
- **Poudre** : la poudre tombe en petit nuage, **reste en surface** et forme des amas tant qu'aucun outil ne bouge. La couleur ne devient uniforme qu'**après** fouet, mousseur ou shaker. Jamais de poudre qui « fond » toute seule dans le lait froid.
- **Concentré** : filet vert épais, marbrures, quelques tours de cuillère. **Jamais de filet liquide dans une séquence poudre.**
- Lumière naturelle de fenêtre, latérale, ombres longues et douces. Fond crème légèrement vert (`#EEEDE0`), bois clair ou pierre claire.
- Vraies mains, gestes plausibles, ongles naturels. Aucun logo d'une autre marque, aucun objet de marque concurrente visible.
- Interdits : texte en surimpression, verres en plastique 3D sans texture, luxe noir/or, esthétique de complément alimentaire, rotation produit en boucle.
- Formats à livrer : **16:9 (1920×1080)** pour desktop et **4:5 (1080×1350)** pour mobile. Vidéos muettes de 6 à 10 s, bouclables (dernière image proche de la première).
- Specs finales : vidéo hero desktop ≤ 4 Mo (AV1/WebM + H.264), mobile ≤ 2,5 Mo, poster AVIF. Images en AVIF/WebP.

---

## <a id="packaging"></a>1. Packaging (à faire en premier)

**stick-face / stick-dos / stick-profil, boite-fermee / boite-ouverte / boite-doses-rangees, pack-decouverte-poudre / pack-quotidien-poudre / pack-duo-poudre**

> Product render, studio daylight, of a slim single-dose stick sachet, 2 cm wide × 11 cm long (dimensions to be confirmed with the manufacturer), matte cream paper-like film `#F4F2E6`, crimped seals top and bottom in forest green `#1B3B2A`. The word MATOCHA is printed vertically in bold condensed uppercase sans-serif, forest green, **exactly as in the reference image**. A wavy matcha-green ribbon `#8DB33A` crosses the upper third. Bottom colour block in `#8DB33A` with the words ORIGINAL / POUDRE. Back view: three numbered circles « 1 OUVRIR · 2 VERSER · 3 PRÉPARER » and an empty dashed area for lot and mandatory information. Soft shadow, cream background `#EEEDE0`, 3/4 angle and straight front. No other text, no claims, no weights.

Boîte : carton forêt, ruban matcha, MATOCHA en crème, bloc de recette en bas, couvercle qui s'ouvre vers l'arrière. Sticks rangés debout, serrés : **8** (Découverte), **30** (Quotidien), deux boîtes (Duo). Les quantités sont à confirmer : régénérer si elles changent.

## <a id="m01-poudre"></a>2. M01 — Hero « Le Versement », poudre

**hero-pour-poudre** (16:9 + 4:5, 8 s, boucle), **plan-gorgee**

> Macro product film, 8 seconds, locked-off camera with a very slow push-in. Natural window light from the left. A hand holds a cream MATOCHA stick (reference image) above a clear glass tumbler filled with cold milk and three ice cubes. The hand tears the stick along the notch. Fine bright-green matcha powder falls in a small cloud and **settles on the milk surface, forming small clumps; it does not dissolve**. A handheld milk frother enters from the right and spins; the green spreads in swirls until the drink is an even pale-green latte with a light foam. A hand lifts the glass slightly; first sip (lips only, out of focus). Final frame: glass on the table, opened stick lying beside it. Muted, no text.

Mobile 4:5 : même déroulé, cadrage plus serré sur le verre, le stick reste lisible dans le premier tiers.

## <a id="m01-concentre"></a>3. M01 — variante concentré

**hero-pour-concentre** — **ne pas produire avant que la formule et le sachet soient définis.**

> Same glass, same volume, same light. A wider cream MATOCHA sachet with a drop pictogram (reference image) is torn at the top. A thick ribbon of bright-green concentrate falls into the cold milk, creating marbled swirls that sink and twist. A teaspoon enters and stirs a few turns; the colour evens out into a pale-green latte. A hand lifts the glass, first sip. Muted, no text. Label in the site: « Concentré — en développement ».

## <a id="m02"></a>4. M02 — Le geste en 3 temps

**plan-dechirure, plan-versement-poudre, plan-versement-concentre, plan-fouet, plan-mousseur, plan-shaker** — trois plans courts de 2 à 3 s chacun, même verre, même cadrage (plan moyen serré, caméra fixe, légère plongée).

1. **Ouvrir** : gros plan des doigts qui déchirent le stick à l'encoche, film qui cède proprement.
2. **Verser** : la poudre tombe et **reste en surface** (ou, pour le concentré, le filet marbre le lait).
3. **Préparer** : selon `preparation.method` : fouet en zigzag dans une tasse d'eau chaude (vapeur légère) ; mousseur dans du lait froid avec glaçons ; shaker fermé, secoué, puis versé sur glaçons.

Variante **chaud** : tasse en céramique claire, vapeur, pas de glaçons. Variante **glacé** : verre, glaçons, condensation.

## <a id="macro"></a>5. M07 — Macro du stick

**macro-stick**

> Extreme close-up, shallow depth of field, of an opened cream MATOCHA stick lying on a light stone surface, a small heap of very fine bright-green matcha powder spilling from its torn end. Visible: the powder texture, the film edge, the crimped seal with its fine ridges, and a blank area where the lot number will be printed. Soft daylight from the top left. No text other than the printed MATOCHA.

## <a id="boissons"></a>6. Boissons terminées

**boisson-glacee, boisson-chaude** — plans fixes, trois quarts, à la lumière du matin. Latte glacé : verre M01, mousse fine, glaçons, condensation. Matcha chaud : tasse en céramique claire, mousse fine, vapeur discrète. Le stick ouvert est posé à côté, MATOCHA lisible.

## <a id="m06"></a>7. M06 — Une journée avec Matocha

**vie-cuisine, vie-bureau, vie-campus, vie-sport, vie-terrasse** — 4:3 (images) ou 4 s (vidéos), lumière naturelle, vraies mains, aucun visage reconnaissable sans autorisation écrite. **Le même stick** passe de scène en scène.

- **7 h, cuisine** : plan de travail clair, lumière de fenêtre, latte glacé au mousseur, stick ouvert posé à côté.
- **10 h, bureau** : bord d'ordinateur portable, mug d'eau chaude, petit fouet, stick qui sort d'une trousse.
- **13 h, campus** : sac à dos ouvert, shaker transparent, stick dans la poche avant d'un jean.
- **18 h, sport** : sac de sport, shaker de lait froid avec glaçons, main qui secoue.
- **Samedi, terrasse** : table extérieure au soleil, latte glacé avec paille, une main qui le soulève.

**Interdit** : de la poudre préparée sans fouet, mousseur ni shaker visible dans la scène.

## 8. Goûts

Une variante par goût **validé uniquement**. Vanille (`#EBD7A8`) et Fraise (`#E2718C`) restent des pistes : ne pas produire de sachet ni de boisson pour elles tant qu'elles ne sont pas validées. Le site les dessine en illustration conceptuelle.

## 9. Ambiances (banques d'images)

Pexels ou Unsplash, licence commerciale : à télécharger dans le dépôt (jamais de lien direct vers le site source) et à consigner dans le manifest (`license.url`, `proofStored`). Aucune marque visible. Uniquement pour les fonds : lait, glaçons, mains, bureau, lumière du matin.
