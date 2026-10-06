import type { MetadataRoute } from "next";
import { site } from "@/data/site";

const ROUTES = [
  "",
  "/product",
  "/why-sticks",
  "/our-matcha",
  "/journal",
  "/contact",
  "/shipping",
  "/returns",
  "/legal",
  "/terms",
  "/privacy",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${site.url}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/product" ? 0.9 : 0.5,
  }));
}
