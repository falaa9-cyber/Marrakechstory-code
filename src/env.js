// Runtime environment for the static (no-bundler) site.
//
// These are PUBLIC values (publishable key + project URL). Safe to expose
// because RLS on form_submissions only allows anonymous INSERT.
//
// LOCAL DEV  → uses the hardcoded values below.
// PROD BUILD → vite.config.js (generateEnvJs plugin) OVERWRITES this file
//              in dist/src/env.js using VITE_SUPABASE_URL /
//              VITE_SUPABASE_PUBLISHABLE_KEY at build time. So if you
//              rotate keys you just update env vars in your host
//              (Hostinger, Cloudflare Pages, Vercel…) and redeploy.
window.MS_ENV = {
  SUPABASE_URL: "https://xcpkujguvrhpsmftgxtn.supabase.co",
  SUPABASE_KEY: "sb_publishable_FlUQb0R7pkGp4dVsWcnbKg_fRq6ccue"
};
