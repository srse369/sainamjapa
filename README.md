# Sainam Japa Tracker

Static frontend deployed to Netlify with serverless functions that talk to Supabase (Postgres) for persistence.

Quick start

1. Create a Supabase project and run the SQL in `db/schema.sql` to create the `chants` table.
2. Add the following environment variables in Netlify (Site settings → Build & deploy → Environment):
   - `SUPABASE_URL` — your Supabase project URL (e.g. https://abcd.supabase.co)
   - `SUPABASE_KEY` — a service role key or anon key with insert/select privileges (keep this secret)
3. Connect this repo to Netlify and deploy. Netlify will publish the `web/` folder and run functions from `netlify/functions/`.

See `docs/DEPLOY_NETLIFY.md` for a step-by-step Netlify deployment guide and local dev instructions.

Local development

Install dev tools and run the Netlify dev server:

```bash
npm install
npm run dev
```

This runs `netlify dev`, which serves the static site and emulates the functions.

Files of interest

- `web/` — static frontend (index.html, styles.css, app.js)
- `netlify/functions/submit.js` — serverless endpoint to insert submissions
- `netlify/functions/aggregate.js` — serverless endpoint to return aggregated totals and daily breakdown
- `db/schema.sql` — table schema for Supabase
- `netlify.toml` — Netlify config
