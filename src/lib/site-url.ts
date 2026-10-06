/** Canonical origin. Set SITE_URL (server) or NEXT_PUBLIC_SITE_URL once the final domain exists. */
export const SITE_URL = (
  process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://matocha.vercel.app"
).replace(/\/$/, "");
