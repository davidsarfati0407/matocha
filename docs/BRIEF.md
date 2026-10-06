# MATOCHA - BRIEF DE STRATÉGIE, DESIGN ET REFONTE DU SITE
Version du 6 octobre 2026
Document à donner intégralement à Claude pour qu'il prépare le prompt de travail de Claude Code.

## 0. TA MISSION, CLAUDE

Tu dois transformer ce brief en un prompt d'implémentation précis pour finaliser le site Matocha, déjà commencé : https://matocha.vercel.app/

Commence par comprendre le produit, les choix validés et le diagnostic. Puis examine le projet existant si son code t'est fourni. Conserve ce qui fonctionne, plutôt que de reconstruire aveuglément. Si tu n'as pas accès au code, explique ce qui doit être inspecté avant l'implémentation; n'invente ni composants existants ni stack.

Le résultat recherché est un site de marque désirable, interactif et orienté vers la compréhension du produit. Le mouvement doit montrer ce que l'on achète et comment on le prépare. Nous ne voulons pas simplement ajouter des animations à une longue landing page.

Ton livrable attendu :
- une direction créative cohérente;
- un prompt prêt à donner à Claude Code, avec pages, sections, composants, états et interactions;
- un plan des médias et des assets à produire;
- les critères de vérification desktop/mobile;
- la liste des données produit ou commerciales encore à confirmer.

Ne traite pas les hypothèses de ce document comme des faits commerciaux. Ne crée pas de faux avis, fournisseurs, certifications, ingrédients, bénéfices santé, stocks, vidéos ou moyens de paiement. Le site peut être finalisé visuellement en mode pré-lancement sans prétendre que les produits sont déjà disponibles.

## 1. LE PROJET ET LES CHOIX VALIDÉS

David Sarfati lance ce projet avec son meilleur ami Gaspard. Ils veulent rendre l'utilisation du matcha moins intimidante : une portion simple à emporter, ouvrir et verser, plutôt qu'une préparation qui semble réservée aux initiés.

David veut un site plus vivant : motion design, visuels qui bougent, séquences de préparation, sachet versé dans une tasse ou un verre, liquide et lait visibles, personne qui boit, packs et packaging attractifs.

Choix confirmés par David :
- Le nom de marque à conserver est MATOCHA.
- Les deux formats sont envisageables : poudre prédosée et concentré liquide ou pâte.
- Gaspard a déjà commencé à explorer les fournisseurs/formules, mais ces pistes restent modifiables.
- Les références américaines servent à inspirer les codes et les usages, avec une identité propre à Matocha.

Direction de travail retenue pour le site : poudre d'abord, concentré développé en parallèle. IMPORTANT : cela ne signifie pas que la poudre Matocha est déjà prête à vendre. Le lancement reste conditionné au fournisseur, aux tests, aux coûts, aux documents et à la logistique. Si ces éléments ne sont pas confirmés, le site reste en pré-lancement.

### Faits, propositions, inconnues

| Sujet | Statut |
|---|---|
| Nom Matocha | Confirmé |
| Deux formats envisagés | Confirmé |
| 30 sticks de 2 g, box à 39 € | Données actuelles de la démo, pas tarif commercial validé |
| Abonnement 35,10 € | Donnée de la démo, pas fonctionnement ou modèle économique validé |
| Origine Japon, formule 100 % matcha | Affichés dans la démo; à vérifier sur le futur lot et la formule retenue |
| Fournisseur, région, cultivar, récolte | Non confirmés dans la démo |
| Fournisseurs explorés par Gaspard | Leur identité et leurs offres ne nous ont pas encore été données |
| Concentré sans fouet | Objectif de développement, pas performance prouvée de Matocha |
| Original, Vanille, Fraise | Propositions de gamme, pas recettes disponibles |
| Formats Découverte, Quotidien, Duo | Propositions, quantités et prix à valider |
| Photos/vidéos propres à Matocha | À inventorier ou produire; ne pas présumer leur existence |

## 2. NOTRE LECTURE DU MARCHÉ

Le stick de matcha n'est pas une invention nouvelle. Il existe des offres poudre prédosée, des mélanges instantanés et des concentrés. Le projet ne doit pas dépendre de la phrase "nous avons inventé le matcha en sachet".

La différence à construire : un geste réellement facile, un goût qui donne envie de recommencer, une marque reconnaissable et un premier achat accessible. Un prix par portion raisonnable ne suffit pas si la première commande impose une dépense de 39 € à quelqu'un qui ne sait pas encore s'il aimera le produit.

Hypothèse de cible de départ : les personnes qui aiment les matcha lattes au café mais n'en préparent pas chez elles. Ensuite, les usages bureau, campus et voyage. C'est une proposition de ciblage, pas une étude démographique.

### Repères de prix vérifiés le 6 octobre 2026
Prix affichés hors livraison, sans conversion dollar/euro. Les recettes ne sont pas toutes comparables.

| Offre | Format et prix observés |
|---|---|
| Purasana, site officiel en français | 6 × 2 g, 6,95 € barré / 6,25 € affiché, environ 1,04 €/dose |
| Lipton Barista Original avoine, MaxiCoffee | 10 sticks, 5,99 €, environ 0,60 €/boisson; mélange latte, pas poudre pure |
| Tenzo US | 10 × 2 g, 15 $ ponctuel / 12 $ abonnement |
| The Tea Spot US | 10 × 1,5 g, 19,95 $ |
| Matcha.com US | 24 portions, 38 $ |
| Republic of Tea US | Boîte de 14 sachets, 19,99 $; formule matcha/inuline/monk fruit |

Ces repères ne valident ni le prix de Matocha ni sa marge. Ils montrent que l'offre prédosée existe déjà.

Pour le concentré, Soku propose un produit japonais en portions de 18 g, six par sachet, avec un ratio annoncé de dilution 1:5-6. Poda propose une pâte en tube; Monin un concentré sucré en bouteille. Ce sont des produits et recettes différents, pas une preuve de faisabilité private-label pour Matocha.

Nous n'avons trouvé aucune donnée fiable de ventes comparées en France entre sticks poudre et sachets concentrés. Ne dis donc pas que le liquide "se vend le mieux". Il pourrait mieux convaincre un débutant SI son goût et sa simplicité sont prouvés. La poudre dispose d'une route fournisseur plus concrète identifiée, mais cela ne prouve pas une demande supérieure.

## 3. STRATÉGIE PRODUIT : UNE MARQUE, DEUX USAGES

### Ligne 1 : Original en poudre - nom de travail

Une dose de poudre, mesurée et protégée dans un stick. La simplicité porte d'abord sur le dosage et le transport. La préparation doit rester honnête : fouet, mousseur ou shaker selon le produit testé.

La poudre de matcha est constituée de feuilles finement broyées, en suspension dans la boisson. Elle ne se dissout pas comme du sucre. Ne pas animer une poudre qui disparaît sans agitation dans du lait froid.

### Ligne 2 : Concentré à mélanger - nom de travail

Une portion liquide ou pâte qui vise à supprimer la préparation au fouet. C'est la piste la plus proche de l'idée du sachet de lait concentré décrite par David. Son développement doit valider le geste, les ingrédients, le goût et la conservation.

Le poids du sachet concentré n'est pas la quantité de matcha qu'il contient. Ne pas reprendre "2 g / 60 g total / 100 % matcha" d'une fiche poudre pour une recette avec eau, base ou autres ingrédients.

### Ordre de lancement

1. Inventorier les travaux et offres déjà reçus par Gaspard.
2. Tester deux prototypes Original : poudre et concentré.
3. Préparer un lancement limité de poudre si fournisseur, produit et économie sont validés.
4. Développer le concentré en parallèle, puis le vendre seulement après ses propres validations.
5. Ajouter un goût et des bundles après les premiers retours, plutôt que lancer une dizaine de variantes.

Le concentré pourrait devenir le produit héros de la marque si les tests et les coûts le justifient. La poudre peut rester une ligne pour ceux qui aiment préparer leur matcha. Ne pas annoncer une date de sortie du concentré sans engagement industriel confirmé.

### Présentation des deux formats sur le site

- Une marque commune, deux familles clairement nommées.
- Un comparateur court : préparation, matériel, portion, composition, usages, prix par boisson, conservation.
- Une fiche propre à chaque format, avec ses médias, instructions, ingrédients et données nutritionnelles applicables.
- Une couleur ou un repère pour le FORMAT, un autre pour le GOÛT; ne pas tout confondre.
- Un format encore en développement possède un CTA d'intérêt non payant, pas un faux bouton d'achat.
- Pas de badge global "100 % matcha / sans arômes / sans additifs" si les deux familles n'ont pas la même recette.

## 4. FAISABILITÉ FOURNISSEURS : CE QUI EST VÉRIFIÉ

Il s'agit de capacités déclarées sur des pages officielles, pas d'un audit de fournisseur ni de devis. Aucun contact fournisseur n'a été fait pour cette analyse.

| Piste | Données publiées | À confirmer |
|---|---|---|
| Kyosun, Europe | Portions 1,5-3 g, minimum 20 000 pièces; boîtes de 15-30 sachets, minimum 1 000 boîtes | Relation entre les minimums, prix des sticks, lot, offre livrée France |
| MINIPAK, Slovaquie | Poudre alimentaire 1-10 g, minimum 5 000 sticks par produit ou modèle | Acceptation du matcha fin, coût, tests, conditions exactes alimentaires |
| Prodietic, France | Conditionnement de poudre alimentaire en sticks et sachets, petites et grandes séries | Pas de minimum ou prix public pour du matcha 2 g |
| AOI Matcha, Japon | Matcha OEM/private-label, single-dose sticks | Minimum et offre export France sur demande |
| UK Matcha Wholesale | Sachets possibles, premier run annoncé à partir de 50 kg | Minimum spécifique sticks, import, coûts et lot |
| Dozett, France | Liquides/pâtes, formats de 3 ml à 5 L; exemple pré-série de 1 500 unidoses 60 ml | Formule matcha, mini-dose, conservation ambiante et minimum spécifique |

Points de vigilance :
- Dozett affiche aussi "pas de minimum" dans son discours général : ne pas convertir l'exemple de 1 500 unités 60 ml en une offre garantie pour des sachets de matcha 15-20 ml. Sa fabrication de mélanges via partenaire affiche des capacités de 1 à 5 tonnes; une petite série de remplissage ne garantit pas une petite série de formulation.
- MINIPAK annonce un délai standard 5-8 semaines après acompte, design et réception de l'ingrédient, mais sa FAQ contient aussi des textes relatifs aux cosmétiques. Revalider ce délai pour notre produit alimentaire.
- Les exemples de coûts de doypacks de Kyosun ne sont pas des coûts de sticks.
- Soku vend un concentré existant; aucune offre de rebranding ou formule Matocha n'a été confirmée.
- Nous n'avons pas identifié une offre clé en main vérifiée de concentré matcha Matocha en mini-sachets.

### Ce que les minimums signifient

À 2 g par stick :
- 5 000 sticks = 10 kg et 166 boîtes complètes de 30 doses, plus 20 doses;
- 20 000 sticks = 40 kg et 666 boîtes complètes de 30 doses, plus 20 doses;
- 1 000 boîtes de 30 doses = 30 000 sticks et 60 kg.

Ce sont des calculs de planification, pas des conditions commerciales. Un minimum par recette ou par artwork peut se répéter avec chaque variante. Quatre dessins de sachets ne sont pas nécessairement gratuits à fabriquer. Demander un film commun, une impression variable ou une rotation de dessins dans un même run avant de promettre ces variantes.

### Coût à comparer

Comparer le coût de la boisson vendue, pas seulement le kilo de poudre : ingrédient, formulation, développement, analyses, traitement, film, impression, réglage, dosage, soudure, boîte, assemblage, fret/import, stockage et pertes. Puis préparation des commandes, livraison, frais de paiement et acquisition client.

Le liquide peut ajouter développement, traitement, tests et poids logistique. C'est un risque à chiffrer, pas un montant établi. Aucun budget ou prix usine fiable n'est confirmé pour Matocha.

### Conservation

Pour la poudre : protection de l'humidité, lumière, air et chaleur, régularité du lot, dosage et qualité des soudures.

Pour le concentré : formule + procédé + emballage doivent être validés ensemble. Demander au fabricant l'étude du pH, de l'activité de l'eau, du dépôt, du traitement adapté, de la température de stockage et de la durée de vie microbiologique ET sensorielle. Inertage ou film aluminium ne valent pas stérilisation.

Ne pas recopier les 540 jours annoncés par Soku ou la durée d'un stick concurrent. Les boissons au thé peuvent changer de couleur et développer un goût cuit au stockage. Une étude sur des boissons au thé vert soutient ce risque général; elle ne fixe pas la durée de vie d'un concentré Matocha.

### Demande de devis à préparer

Demander des offres comparables pour 5 000 / 10 000 / 20 000 doses, en distinguant :
- formule existante vs nouvelle formule;
- emballage standard vs film imprimé;
- minimum par recette, artwork et boîte;
- développement et tests séparés du prix unitaire;
- portion réelle, quantité de matcha, préparation et conservation;
- délai, validité des prix, réassort et lot réservé;
- fabricant réel, traçabilité, COA et analyses pertinentes, certificats;
- propriété de la formule et possibilité de changer de fabricant.

Les tensions d'offre japonaises décrites dans la presse en 2026 justifient des questions sur le réassort et les prix. Elles ne prouvent pas que les fournisseurs sont actuellement indisponibles.

## 5. DIAGNOSTIC DU SITE EXISTANT

Inspection du 6 octobre 2026, desktop et mobile 390 px. La démo n'a pas été modifiée et aucun checkout n'a été testé.

### À conserver

- Identité crème, vert profond, noir, grain discret et typographie forte.
- Marque et sachet au centre du récit.
- Informations de portion et de prix accessibles.
- Transparence sur le fournisseur encore en sélection, sans inventer une région ou un grade.
- Recomposition mobile des layouts.

### À corriger

1. La home fait environ 17 074 px en desktop à l'inspection, avec 14 sections numérotées et d'autres scènes. Le récit répète "2 g / 30 sticks / no scoop / no scale" au lieu de faire sentir immédiatement l'usage et le goût.
2. Le grand verre dessiné et les mockups graphiques évoquent davantage un concept qu'une boisson que l'on veut boire. Ajouter texture, lait, glaçons, mains, préparation et gorgée.
3. Aucun élément vidéo n'a été détecté sur la home. Il existe des transitions et apparitions, mais pas la démonstration filmée souhaitée.
4. Au chargement et pendant certaines apparitions, titre, texte ou produit restent temporairement absents ou pâles, puis apparaissent. Ce ne sont pas forcément des éléments manquants, mais les informations critiques ne doivent jamais dépendre d'un effet.
5. La démo vend "OPEN / POUR / WHISK" et dit "WHISKED, NOT STIRRED". Elle raconte la poudre, pas un concentré.
6. Les quatre artworks Classic / Ice / Pour / Whisk contiennent le même matcha. Ne pas les présenter comme quatre goûts.
7. Le bouton FR cliqué une fois n'a pas produit de traduction observable après relecture. La version française doit devenir réellement fonctionnelle, pas un contrôle décoratif.
8. Les liens sociaux du footer pointent vers les racines Instagram/TikTok/Pinterest, pas vers des comptes Matocha. Les remplacer par des comptes validés ou les retirer.
9. Mélange boutique/pré-lancement : CTA achat et abonnement, mais fournisseur et société non finalisés. Livraison 2-4 jours et franco 50 € sont affichés alors que tarifs et transporteurs restent à confirmer. Ne pas reprendre ces engagements sans validation.
10. Le journal annonce des articles à venir. Ne pas lui donner autant de priorité qu'au produit tant qu'il est vide.
11. Le comparatif sur les objets du rituel qui "ne rentrent pas dans un sac" est excessif. Comparer les étapes et les objets honnêtement, sans ridiculiser la préparation traditionnelle.

Pages inspectées :
https://matocha.vercel.app/
https://matocha.vercel.app/product
https://matocha.vercel.app/why-sticks
https://matocha.vercel.app/our-matcha
https://matocha.vercel.app/journal
https://matocha.vercel.app/shipping
https://matocha.vercel.app/legal

## 6. DIRECTION CRÉATIVE

### Idée directrice

"Le matcha facile, avec du goût et du style."

Une base éditoriale soignée, des couleurs reconnaissables, une vraie texture de boisson et des moments humains. Le site doit donner envie de goûter avant de dérouler une fiche technique.

Préserver le socle Matocha, puis le rendre plus gourmand et vivant :
- crème pour la respiration;
- vert forêt pour l'identité;
- vert plus lumineux pour la matière matcha;
- couleurs de recettes en accents, pas un arc-en-ciel permanent;
- photos ou renders crédibles de produits réellement définis;
- détails de lait, glace, sachet, main et bouche;
- typographie lisible et reconnaissable.

À éviter : faux luxe noir/or, esthétique de complément alimentaire, wellness moralisateur, gradients génériques, verres en plastique 3D sans texture, animations sur chaque mot, pyramide de badges non prouvés.

### Ton de marque

Français d'abord. Court, concret, accueillant. On simplifie l'usage, pas la culture du thé. Ni langage d'expert excluant, ni discours santé américain recopié.

Pistes de copy, à adapter à la recette réelle :
- "Le matcha, en plus simple."
- "Votre dose. Votre tasse. Votre moment."
- Poudre : "La dose est prête. À vous de la préparer."
- Concentré validé : "Ouvrez. Versez. Mélangez."
- Pré-lancement : "Le premier lot se prépare. Soyez prévenu du lancement."

Ne pas promettre "prêt en 10 secondes", "zéro grumeau", "aucune amertume" ou "compatible avec tout liquide" sans essais. Ne pas afficher "ceremonial / biologique / Uji" parce que cela semble premium.

## 7. RÉFÉRENCE VISUELLE MUACHA

David a fourni une capture du compte Instagram @drinkmuacha. Cette capture montre des sticks vert olive sombre, de grandes lettres serif dorées/crème, des accents rose vif, du lettrage manuscrit et un ton mode avec le slogan "Stay Sexy, Drink Muacha". On voit les sachets tenus en main, dans une poche de jean, en avion et sur une table avec des accessoires.

Ce que cela nous apprend : le produit peut devenir un accessoire personnel et social, pas seulement un thé rangé dans la cuisine. Les usages et les personnes donnent une échelle et une présence au produit.

Principes à traduire chez Matocha :
- marque lisible sur un petit sachet;
- contraste et accent couleur;
- vraie main, vrai geste, vrai moment de vie;
- plan serré du produit;
- produit visible dans un sac, sur un bureau, pendant un week-end;
- identité assez forte pour exister dans une vidéo courte.

Ne pas copier : slogan, logo, disposition exacte, typographie-logo reconnaissable, packaging, photos, visages ou vidéos. Remplacer Muacha par Matocha sur leurs assets ne suffit pas à créer des visuels originaux ou utilisables.

Le pays, la composition et les prix de ce compte n'ont pas été vérifiés indépendamment. Les recherches publiques ont renvoyé des homonymes : ne pas attribuer à @drinkmuacha leurs offres ou données.

Les futures références fournies par David devront être intégrées avec : ce que l'on aime / ce que l'on traduit / ce que l'on ne reprend pas / quel asset original produire. Si le brief est transmis sans les images, demander leur ajout comme références, pas comme assets prêts à publier.

## 8. ARBORESCENCE ET HOME RESSERRÉE

Navigation prioritaire : Les formats / Comment préparer / Notre produit / FAQ. Boutique uniquement si lancement validé. Les recettes peuvent être secondaires. Journal retiré de la navigation prioritaire tant qu'il n'a pas de contenu utile.

### Section 1 - Hero : comprendre et désirer

Objectif : savoir ce qu'est Matocha sans scroller.

Contenu :
- nom de marque;
- proposition en une phrase;
- indication claire du format visible;
- sachet et vraie boisson appétissante;
- CTA principal;
- CTA secondaire vers le geste.

En pré-lancement : "Être prévenu du lancement". En vente : "Découvrir les packs" ou le pack effectivement disponible. Le titre et le CTA sont visibles au premier rendu même si les médias chargent mal.

Média : vidéo courte ou render produit crédible avec poster. Le hero de lancement raconte la poudre si c'est le seul format disponible. Ne pas utiliser le concentré futur comme preuve du produit poudre vendu.

### Section 2 - Le geste, sans explication interminable

Trois étapes visibles et concrètes. Même une personne qui ne lance pas la vidéo doit comprendre la préparation.

Poudre : ouvrir > verser avec la quantité de liquide validée > fouetter ou secouer selon les tests.
Concentré : ouvrir > verser > mélanger selon les tests.

La scène animée et le texte montrent la même chose. Pas de fouet effacé pour faire croire que tout est prêt.

### Section 3 - Choisir son format et son pack

Si un seul format est prêt, le vendre clairement et présenter l'autre comme en développement.
Si les deux sont prêts, sélecteur de format accessible et comparateur simple.

Cartes de packs : nom, nombre de doses, format, goûts inclus, prix total, prix par boisson, disponibilité réelle et CTA.

Pas de faux "best-seller". Pas de prix ou de réduction automatiques inventés. Éviter de montrer huit offres quasiment identiques.

### Section 4 - À votre goût

Commencer par Original. Si des goûts ne sont pas validés, les décrire comme pistes futures ou les garder hors du catalogue commercial.

Quand les recettes existent : choisir un goût change simultanément le sachet, le pack, la boisson, le texte, les ingrédients et les informations pertinentes. Le goût n'est pas simplement la couleur d'un bouton.

### Section 5 - La vie autour du produit

Scènes courtes : cuisine le matin, bureau, sac, week-end, une personne qui boit. Matière vivante et lumière naturelle.

Le produit est une partie de la vie, pas un objet qui tourne éternellement sur un fond. Ne pas filmer une poudre préparée en voyage sans le matériel dont elle a réellement besoin.

### Section 6 - Ce qu'il y a dedans

Composition, quantité de matcha, portion, origine confirmée, fabrication, conservation, données nutritionnelles applicables. Caféine seulement avec donnée fiable pour la portion retenue.

S'il manque une donnée, l'état pré-lancement le dit sobrement. Ne pas remplacer l'absence par un badge.

### Section 7 - Pourquoi c'est plus simple

Comparatif honnête et lisible. Même unité de comparaison : une boisson finie.

Exemples de colonnes : préparation, matériel, dose, transport, ingrédients, conservation.

Avis uniquement réels et autorisés. Sinon montrer prototypes/tests sans chiffres de satisfaction fictifs et sans mettre en scène de faux clients.

### Section 8 - FAQ, CTA final, footer

Questions : poudre ou concentré? Comment préparer? Quels liquides? Chaud/froid? Sucre? Allergènes? Conservation? Livraison? Abonnement s'il est vraiment proposé?

Footer : coordonnées et données légales réelles, aide, politiques adaptées, comptes sociaux confirmés. Aucun lien vers une racine de réseau social si on veut annoncer un compte.

### Pages secondaires

- Une page par famille/produit disponible.
- Notre produit et ses origines confirmées.
- Recettes réellement réalisables avec le format.
- Aide/contact/livraison/retours.
- Mentions légales, conditions de vente, confidentialité et cookies selon les services réellement utilisés.

Ne pas fabriquer des pages denses pour remplir le menu. La home donne compréhension et désir; les fiches portent les détails nécessaires à la décision.

## 9. MOTION DESIGN : STORYBOARD PRÉCIS

### Film principal pour la poudre

1. Sachet Matocha lisible dans la main.
2. Déchirure réelle ou render physiquement plausible.
3. Poudre visible dans la tasse/verre.
4. Quantité de liquide correspondant à la recette testée.
5. Fouet, mousseur ou shaker correspondant au geste retenu.
6. Ajout de lait et/ou glace si la recette le prévoit.
7. Verre terminé, une personne goûte.
8. Pack et CTA.

Même verre, même volume et couleur cohérente. Ne pas passer d'une poudre à un filet liquide au montage.

### Film du concentré, uniquement quand la formule est définie

1. Sachet lisible entre dans le cadre.
2. Main déchire le haut avec un geste plausible.
3. Filet de concentré vert versé dans lait/eau/glace selon la recette validée.
4. Quelques mouvements de cuillère si nécessaires.
5. La couleur s'uniformise progressivement.
6. Main soulève le verre et personne qui goûte.
7. Pack de doses, CTA.

Ne pas prétendre qu'une poudre et un concentré ont la même transparence, viscosité ou quantité. Le contrat visuel suit le produit.

### Deux niveaux de mouvement

A. Hero silencieux, boucle courte de l'ordre de 6-10 secondes, durée créative indicative. Poster de qualité avant chargement. Pas d'audio autoplay.
B. Une courte scène pédagogique liée au scroll, sans bloquer le défilement. Sur mobile : progression linéaire, images ou vidéo verticale. Les trois étapes restent lisibles hors animation.

Interactions utiles :
- ouvrir visuellement une boîte;
- changer un format/goût en gardant les données synchronisées;
- choisir chaud/glacé et afficher une recette éprouvée;
- comparer les formats;
- panier avec retour clair si la vente est réellement activée.

À éviter : rotation permanente du produit, parallax partout, scroll captif, curseur personnalisé envahissant, animations qui rendent le texte illisible et grosse scène 3D utilisée uniquement pour donner l'impression d'interactivité.

### Ne pas promettre des assets inexistants

Claude Code ne peut pas créer une vraie vidéo produit à partir d'un nom de fichier absent. Prévoir les emplacements et les posters, mais identifier les médias à tourner ou produire. En attendant, utiliser une représentation illustrée clairement conceptuelle, sans la faire passer pour un test produit réel.

## 10. PACKS, GOÛTS ET PACKAGING

### Propositions de gamme

- Original : point de départ, pour valider la matière et le goût.
- Vanille : piste plus douce à tester.
- Fraise : piste gourmande et visuelle à tester.
- Hojicha peut devenir un produit adjacent, mais ce n'est pas un goût de matcha.

Une recette aromatisée ne doit pas conserver automatiquement "100 % matcha / sans arômes / sans additifs".

### Formats de vente proposés

- Découverte : 6 ou 8 doses, pour limiter le montant de la première commande.
- Quotidien : 20 ou 30 doses.
- Duo : deux boîtes, ou duo poudre/concentré seulement quand les deux sont validés.

Quantités, prix et réductions à calculer après devis. Ne pas prendre 39 € comme une validation de marge. Abonnement après validation de produit, de réachat et de fiabilité des livraisons.

### Packaging - route recommandée : Everyday icon

Sachet fin, dimensions selon le fabricant, crème/vert forêt, marque lisible, motif original de filet ou d'ondulation, un bloc de couleur par recette et trois gestes simples au dos. Boîte qui s'ouvre et distribue les portions sur un bureau.

Palette de travail :
- Original : vert;
- Vanille : crème chaud;
- Fraise : rose rhubarbe.

Garder la famille identifiable même dans une photo de téléphone.

Routes alternatives à présenter seulement comme explorations :
- Color block : plus sociale, plus franche;
- Atelier : plus éditoriale, avec place pour lot et origine.

Choisir une famille cohérente avant de produire plusieurs directions. Ne pas copier le système de marque de Muacha.

### Réalité industrielle

Le sachet doit respecter le format offert par le fabricant. Un rendu de stick poudre 2 g n'est pas automatiquement adapté à une dose liquide. Prévoir zone de déchirure, taille, soudures, barrière, remplissage et informations obligatoires.

Ne pas afficher recyclable, compostable ou "éco" sans confirmation du matériau, du produit fini et de la filière pertinente. Les dessins de sachets d'un seul Original ne doivent pas faire croire à plusieurs goûts.

## 11. INVENTAIRE DES ASSETS

Préparer un manifest, plutôt que disperser des fichiers sans statut.

Chaque asset :
- identifiant;
- format produit et goût;
- statut : réel / render de concept / manquant;
- source et droits d'utilisation;
- fichier desktop et mobile;
- poster si vidéo;
- texte alternatif ou rôle décoratif;
- sections où il apparaît.

Liste à produire/inventorier :
- hero produit;
- face, dos, profil du sachet et boîte;
- boîte ouverte et rangement des doses;
- macro du sachet;
- déchirure;
- versement;
- mélange;
- boisson terminée;
- gorgée;
- trois moments de vie;
- chaud et glacé;
- variante par goût disponible.

Écrire le nom de marque directement et correctement dans le modèle/texture de packaging. Ne pas laisser un générateur d'image inventer la typographie. Les scènes doivent être cohérentes d'un plan à l'autre.

## 12. MODE PRÉ-LANCEMENT ET MODE VENTE

Le site doit posséder un état explicite, pas un mélange ambigu.

### Pré-lancement

- Produits décrits comme concepts/prototypes lorsque c'est leur statut.
- Prix non validés absents de la vente ou explicitement indicatifs dans un environnement de démo.
- CTA de lancement/intérêt non payant.
- Pas de stock, délai de livraison ou avis inventés.
- Pas de facturation ni abonnement simulé.
- Collecte e-mail uniquement si un service réel est configuré avec information de confidentialité et consentement approprié; sinon ne pas afficher une fausse confirmation d'inscription.

### Vente activée

- Catalogue et prix confirmés, informations obligatoires présentes.
- Livraison, disponibilité et conditions d'abonnement réelles.
- Panier cohérent avec les produits et taxes applicables.
- Paiement via le système effectivement choisi, jamais un bouton factice qui dit "commande confirmée".
- États succès/erreur/rupture et protection contre doublons.
- Tests du parcours avant ouverture.

Le code doit empêcher un simple changement de style de transformer un prototype non validé en produit achetable. Définir les états produit et les conditions d'activation.

## 13. CONFORMITÉ ET PREUVES

Cette section est une checklist de travail, pas une validation réglementaire du futur produit. Un spécialiste ou le fabricant doit contrôler la formule, le process, l'étiquetage et le dossier réel.

### Allégations

- Pas de detox, brûle-graisse, anti-stress, "sans crash" ou promesse médicale copiée d'une marque américaine.
- Allégations nutritionnelles et de santé : utiliser seulement celles autorisées et dont les conditions sont remplies par la formule finale.
- Bio, Japon, Uji, grade, absence de sucre ou d'additifs : preuves propres au lot et à la recette.
- Caféine : donnée fiable pour la portion réelle et vérification des mentions applicables; ne pas inventer un chiffre ni une comparaison universelle au café.
- Sans grumeaux, mélange immédiat, compatibilité avec tous liquides : tests réels et limites clairement décrites.
- Recyclabilité ou compostabilité : preuves du packaging, pas simple couleur verte.

### Étiquetage et vente en France

Prévoir notamment : dénomination du produit, liste d'ingrédients, allergènes mis en évidence s'il y en a, quantité nette, données nutritionnelles applicables, opérateur responsable, origine lorsqu'elle est requise ou revendiquée, mode d'emploi et conservation, identification du lot et date adaptée. Vérifier les éventuelles exemptions et mentions propres à la formule avec un professionnel.

Les informations alimentaires obligatoires doivent être accessibles avant la conclusion d'une vente à distance. La DDM/DLC peut n'être fournie qu'à la livraison selon la règle expliquée par la DGCCRF. Ne pas confondre cette exception avec une exemption générale de fiche produit.

Les mentions d'étiquetage concernées doivent être en français. Le site doit proposer une vraie expérience française, pas une interface anglaise avec bouton FR décoratif.

### Droits et contenu

- Aucun avis ou chiffre de clients fictif.
- Aucun logo fournisseur/certification sans droit et preuve.
- Pas de contenus américains rebadgés.
- Droit d'utiliser les images, vidéos et personnes représentées.
- Les rendus de concept ne sont pas des preuves de performance, d'emballage fabriqué ou de disponibilité.

### Avant commerce

Valider société, produit, fournisseur, tests, documents, frais, paiement, livraison, politique de retour et conditions de vente/abonnement. Ne pas créer des engagements commerciaux à partir des placeholders actuels.

## 14. EXIGENCES TECHNIQUES ET ACCESSIBILITÉ

Choisir les outils après inspection du repo, pas imposer une stack sans savoir ce qui existe.

- Français par défaut; anglais seulement si traduction complète et contrôle réellement fonctionnel.
- Responsive, aucune information essentielle uniquement au hover.
- Navigation clavier, focus visibles, contrôles nommés, FAQ et sélecteurs accessibles.
- Contraste suffisant, texte lisible sur les médias, pas de texte essentiel uniquement dans une vidéo.
- Respect de prefers-reduced-motion : poster et séquence statique équivalente.
- Pas de scroll captif ni animation qui bloque le CTA.
- Titre, proposition et CTA visibles immédiatement, y compris si JavaScript ou médias échouent.
- Images dimensionnées et optimisées, lazy-load hors écran, posters de qualité, vidéo mobile adaptée.
- Ne pas rendre trente modèles 3D de sticks en permanence; choisir vidéo/2D lorsque cela suffit.
- Mise en page stable pendant chargement, pas de saut du CTA quand une vidéo apparaît.
- Métadonnées de pages cohérentes avec l'état pré-lancement ou vente.
- Liens réels; pas de pages légales prétendument finies avec société fictive.

### Modèle de données à prévoir dans le prompt

Sans imposer de syntaxe exacte avant lecture du repo, séparer :
- famille/format;
- recette/goût;
- quantité de matcha par portion;
- poids ou volume total de la portion;
- nombre de doses par pack;
- ingrédients et allergènes;
- origine et statut de preuve;
- instructions de préparation;
- conservation;
- prix et statut de confirmation;
- disponibilité et statut commercial;
- médias avec statut réel/concept/manquant;
- CTA approprié à l'état.

Les bénéfices, ingrédients et médias doivent dériver du produit sélectionné. Pas de champ unique qui applique "100 % matcha" à toutes les lignes.

## 15. PLAN D'IMPLÉMENTATION DEMANDÉ À CLAUDE

1. Lire le projet existant et inventorier routes, composants, médias, styles, catalogue et services.
2. Produire le diagnostic de conservation/suppression/refonte à partir de ce brief.
3. Restructurer la home en huit blocs principaux, sans compter de petits séparateurs comme de nouvelles sections.
4. Concevoir le système de deux formats, avec poudre prioritaire et concentré en développement.
5. Construire l'état pré-lancement d'abord; les achats ne deviennent actifs qu'après données confirmées.
6. Renforcer le hero, la préparation et les scènes humaines avec posters/fallbacks et slots médias explicites.
7. Déployer un système packaging cohérent et original, sans le confondre avec une fabrication validée.
8. Corriger français, liens, footer, FAQ et pages produit.
9. Vérifier visuellement desktop et mobile; corriger avant de livrer une preview.
10. Fournir un récap des changements, assets manquants, données à confirmer et tests réalisés/non réalisés.

Le prompt final doit détailler ce que Claude Code doit faire, comment les états interagissent et comment savoir que le résultat est prêt. Éviter "rends le site premium et interactif" sans instructions concrètes.

## 16. CRITÈRES DE RECETTE

Le travail n'est pas terminé parce que la build passe.

- Une personne comprend-elle le format présenté, ce qu'il contient et le geste à faire?
- Le site donne-t-il envie de boire la boisson, plutôt que seulement admirer un objet graphique?
- Le titre, CTA et informations critiques restent-ils visibles au premier rendu?
- Le film et les instructions représentent-ils le produit effectivement offert?
- Les deux familles sont-elles distinctes sans donner l'impression d'une recette unique?
- Les goûts proposés changent-ils toutes les données pertinentes ensemble?
- Prix total, doses et prix par portion sont-ils cohérents, quand validés?
- Pré-lancement et vente sont-ils séparés sans faux stock ou faux paiement?
- Les placeholders sont-ils identifiés et non vendus comme des faits?
- Pas d'avis, certifications, fournisseurs ou claims inventés?
- FR et liens fonctionnent-ils réellement?
- Home, fiche produit, FAQ, sélecteurs et footer vérifiés sur 390 px, une taille mobile plus petite, tablette et desktop?
- Reduced-motion, clavier, focus, erreurs de formulaire et chargement lent ont-ils été testés?
- Les médias sont-ils présents, légers et cadrés correctement, et les fichiers manquants explicitement listés?
- Le parcours d'achat a-t-il été testé avant activation, ou clairement déclaré non testé?

## 17. PROCHAINES DONNÉES À RÉCUPÉRER

Ne pas bloquer la direction graphique en attendant tout. Préparer les emplacements et les états, mais ne pas transformer les inconnues en faits.

Données à récupérer auprès de David/Gaspard :
- fournisseurs et échanges déjà explorés;
- échantillons/formules reçus et tests déjà faits;
- budget de premier lot et prix de vente cible;
- portion et usage recherchés;
- statut société;
- vrais comptes sociaux;
- assets originaux disponibles;
- choix du système de commerce et d'e-mail.

Test produit proposé : comparer poudre et concentré Original dans les mêmes liquides et volumes, puis tester l'usage à domicile. Un pilote de 20-30 personnes peut aider à apprendre, mais ne constitue pas une étude représentative. Mesurer goût, temps, matériel, mélange, dépôt, intention d'achat au prix réel et intérêt pour un réachat.

## 18. SOURCES ET LIMITES

Consultées le 6 octobre 2026. Les pages marchandes décrivent leurs produits; elles ne prouvent ni les ventes futures ni les coûts de Matocha.

### Marché et produits

Purasana - format et prix en français :
https://purasana.com/fr/matcha-the-vert-instantane

Lipton chez MaxiCoffee - prix distributeur, mélange avoine :
https://www.maxicoffee.com/barista-matcha-original-avoine-the-instantane-10-sticks-lipton-p-255155.html

Tenzo - sticks et prix; certains widgets coût/tasse et recharge sont incohérents et n'ont pas été repris :
https://tenzotea.co/products/single-serve-matcha

The Tea Spot - sticks et préparation :
https://www.theteaspot.com/products/ceremonial-matcha-to-go-sticks

Matcha.com - 24 portions et prix :
https://matcha.com/products/matcha-on-the-go-24-stick-packs

Republic of Tea - formule et usage shake/stir :
https://www.republicoftea.com/products/organic-matcha-to-go

Soku - produit concentré 6 × 18 g; prix et unité commerciale trop ambigus pour coût/boisson; durée de vie annoncée par le vendeur, non transférable :
https://www.soku-global.com/products-all/p/kyoto-uji-premium-matcha-concentrate-hbgze

Poda - pâte en tube, ingrédients et geste; offre de prix/abonnement ambiguë :
https://drinkpoda.com/products/matcha-paste

Monin US - concentré prémélangé sucré et ingrédients :
https://monin.us/products/matcha-green-tea-concentrate

Cytea - concentré 40 ml, portions non établies :
https://www.cytea.com/products/chayan-matcha-concentrate-40ml

### Fabrication et conditionnement

https://www.kyosun.com/en/private-label/
https://www.minipak.net/fr/stick-pack/
https://www.prodietic.fr/services/conditionnement/
https://aoimatcha.com/pages/business
https://ukmatchawholesale.co.uk/pages/white-label-matcha
https://dozett.com/

Autre exemple de capacité liquide US, pas fournisseur prioritaire validé pour Matocha :
https://msiexpress.com/capabilities/liquid-packaging-and-bottle-filling

### Science et contexte de filière

Suspension du matcha dans le lait, recherche primaire. Les proportions du résumé bilingue divergent; aucune recette n'a été déduite de cette étude :
https://www.dairyst.net.cn/EN/10.15922/j.cnki.jdst.2016.03.004

Article marchand expliquant suspension plutôt que dissolution, source secondaire :
https://matcha.com/blogs/news/does-matcha-dissolve

Étude sur la détérioration sensorielle et le brunissement des boissons au thé vert au stockage. Pas une étude de la future formule Matocha :
https://www.mdpi.com/2304-8158/15/10/1656

Presse 2026 sur demande et tension de filière, sans comparaison de ventes des deux formats :
https://japannews.yomiuri.co.jp/society/general-news/20260602-330371/
https://mainichi.jp/english/articles/20260514/p2a/00m/0bu/024000c

### Règles officielles

Allégations nutritionnelles et de santé UE :
https://europa.eu/youreurope/business/product-rules-compliance/food/health-nutrition-claims/index_fr.htm

DGCCRF - étiquetage et informations avant vente à distance :
https://www.economie.gouv.fr/particuliers/denrees-alimentaires-regles-etiquetage

### Référence créative

Capture fournie par David du compte @drinkmuacha, examinée visuellement. Source de codes graphiques et d'usages, pas preuve de formulation, origine, prix ou droits de réutilisation.

FIN DU BRIEF
