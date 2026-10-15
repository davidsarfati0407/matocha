// Migrations au déploiement (Vercel) : applique les fichiers de supabase/migrations pas encore passés,
// puis, si SEED_DEMO=1 et que la base est vide, charge le seed de démonstration (données fictives).
// Sans URL de base, ne fait rien (build local ou aperçu sans base).
// node scripts/deploy/migrate.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
// DATABASE_URL, ou les variables posées par l'intégration Supabase de Vercel (essayées dans l'ordre :
// la connexion directe Supabase est souvent IPv6 seulement, le pooler passe partout)
const urls = [process.env.DATABASE_URL, process.env.POSTGRES_URL_NON_POOLING, process.env.POSTGRES_URL].filter(Boolean);
if (!urls.length) {
  console.log("[migrate] aucune URL de base (DATABASE_URL) : étape ignorée");
  process.exit(0);
}

let db;
for (const url of urls) {
  const u = new URL(url);
  u.searchParams.delete("sslmode"); // la chaîne des poolers Supabase n'est pas vérifiable par Node : TLS sans vérification
  u.searchParams.delete("supa");
  const local = ["127.0.0.1", "localhost"].includes(u.hostname);
  const c = new pg.Client({ connectionString: u.toString(), ssl: local ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 10_000 });
  try {
    await c.connect();
    db = c;
    console.log(`[migrate] connecté à ${u.hostname}:${u.port || 5432}`);
    break;
  } catch (e) {
    console.warn(`[migrate] connexion impossible à ${u.hostname} (${e.message}), essai suivant`);
  }
}
if (!db) {
  console.error("[migrate] aucune base joignable : vérifiez DATABASE_URL (chaîne « Session pooler » de Supabase)");
  process.exit(1);
}

await db.query(`create schema if not exists deploy;
  create table if not exists deploy.migrations (name text primary key, applied_at timestamptz not null default now());
  revoke all on schema deploy from public;`);
const done = new Set((await db.query("select name from deploy.migrations")).rows.map((r) => r.name));
// Migrations déjà poussées par la CLI Supabase (supabase db push) : on ne les rejoue pas
const cli = await db.query("select to_regclass('supabase_migrations.schema_migrations') is not null as ok");
if (cli.rows[0].ok) for (const r of (await db.query("select version from supabase_migrations.schema_migrations")).rows) done.add(r.version);

const dir = path.join(ROOT, "supabase/migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
let applied = 0;
for (const f of files) {
  const name = f.replace(/\.sql$/, "");
  if (done.has(name) || done.has(name.split("_")[0])) continue;
  const sql = await readFile(path.join(dir, f), "utf8");
  try {
    await db.query("begin");
    await db.query(sql);
    await db.query("insert into deploy.migrations (name) values ($1)", [name]);
    await db.query("commit");
    applied++;
    console.log(`[migrate] ✓ ${f}`);
  } catch (e) {
    await db.query("rollback");
    console.error(`[migrate] ✗ ${f} : ${e.message}`);
    process.exit(1);
  }
}
console.log(`[migrate] ${applied} migration(s) appliquée(s), ${files.length - applied} déjà en place`);

if (process.env.SEED_DEMO === "1") {
  const { rows } = await db.query("select count(*)::int as n from public.orgs");
  if (rows[0].n === 0) {
    await db.query("begin");
    try {
      await db.query(await readFile(path.join(ROOT, "supabase/seed.sql"), "utf8"));
      await db.query("commit");
      console.log("[migrate] ✓ seed de démonstration chargé (données fictives)");
    } catch (e) {
      await db.query("rollback");
      console.error(`[migrate] ✗ seed : ${e.message}`);
      process.exit(1);
    }
  } else console.log("[migrate] seed ignoré : la base contient déjà une organisation");
}

await db.query("notify pgrst, 'reload schema'"); // l'API REST recharge son cache de schéma
await db.end();
