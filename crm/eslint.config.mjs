import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "next-env.d.ts", "supabase/**"]),
  // Interface en français : les apostrophes dans le texte JSX sont normales.
  { rules: { "react/no-unescaped-entities": "off" } },
]);
