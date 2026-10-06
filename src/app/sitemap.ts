import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/* The journal stays out while empty (noindex). */
const ROUTES = [
  "",
  "/formats",
  "/formats/poudre",
  "/formats/concentre",
  "/preparer",
  "/recettes",
  "/notre-produit",
  "/faq",
  "/aide",
  "/legal/mentions-legales",
  "/legal/cgv",
  "/legal/confidentialite",
  "/legal/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/legal") ? 0.2 : 0.7,
  }));
}
