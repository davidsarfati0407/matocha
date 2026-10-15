import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Le dossier parent contient un autre projet (site vitrine) : on fixe la racine.
  turbopack: { root: __dirname },
};

export default withNextIntl(nextConfig);
