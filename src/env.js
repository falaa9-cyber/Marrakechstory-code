// Runtime environment for the static (no-bundler) site.
// These are PUBLIC values (publishable key, project URL). Safe to expose
// because RLS on form_submissions only allows anonymous INSERT.
//
// In a Next.js / Vite world these would come from process.env / import.meta.env;
// our scripts run via Babel-in-browser so we expose them on window.
window.MS_ENV = {
  SUPABASE_URL: "https://xcpkujguvrhpsmftgxtn.supabase.co",
  SUPABASE_KEY: "sb_publishable_FlUQb0R7pkGp4dVsWcnbKg_fRq6ccue"
};
