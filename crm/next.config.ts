import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Le dossier parent contient un autre projet (site vitrine) : on fixe la racine.
  turbopack: { root: __dirname },
  // Polices embarquées et profil ICC lus à l'exécution par la génération PDF (déploiement serverless)
  outputFileTracingIncludes: { "/**": ["./lib/pdf/assets/**/*"] },
};

export default withNextIntl(nextConfig);
