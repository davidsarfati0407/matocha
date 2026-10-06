import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* A stray package-lock.json in the home folder made Turbopack guess the wrong root. */
  turbopack: { root: path.resolve(__dirname) },

  /* Old routes → their current equivalents (301). */
  async redirects() {
    return [
      { source: "/product", destination: "/daily-box", statusCode: 301 },
      { source: "/why-sticks", destination: "/daily-box", statusCode: 301 },
      /* One product: the v2 format pages now point to it. */
      { source: "/formats", destination: "/daily-box", statusCode: 301 },
      { source: "/formats/:famille", destination: "/daily-box", statusCode: 301 },
      { source: "/our-matcha", destination: "/notre-produit", statusCode: 301 },
      { source: "/shipping", destination: "/aide#livraison", statusCode: 301 },
      { source: "/returns", destination: "/aide#retours", statusCode: 301 },
      { source: "/contact", destination: "/aide#contact", statusCode: 301 },
      { source: "/legal", destination: "/legal/mentions-legales", statusCode: 301 },
      { source: "/terms", destination: "/legal/cgv", statusCode: 301 },
      { source: "/privacy", destination: "/legal/confidentialite", statusCode: 301 },
      { source: "/cookies", destination: "/legal/cookies", statusCode: 301 },
      { source: "/account", destination: "/", statusCode: 301 },
    ];
  },
};

export default nextConfig;
