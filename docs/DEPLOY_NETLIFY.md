# Deploying to Netlify

1. Create a repository on GitHub (or Git provider) and push this project.

2. Create a Supabase project and run `db/schema.sql` in the SQL editor to create the `chants` table.

3. In your Supabase project, get the project URL (e.g. `https://abcd.supabase.co`) and a key. For production use create a restricted service role key or use serverless functions with a secure key stored in Netlify env.

4. In Netlify, click "New site from Git" and connect your repository. Configure build settings:
   - Build command: (none)
   - Publish directory: `web`
   - Functions directory: `netlify/functions` (this is auto-detected via `netlify.toml`)

5. Add environment variables in Netlify Site > Site settings > Build & deploy > Environment:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_KEY` = your Supabase key (keep this secret)

6. Deploy the site. After deployment the frontend will call the functions at `/.netlify/functions/submit` and `/.netlify/functions/aggregate` which talk to Supabase.

Local testing with Netlify Dev

1. Install dependencies and Netlify CLI (if not already):

```bash
npm install
npm install --global netlify-cli
```

2. Create a `.env` file at the project root (or export env vars) with the values from `.env.example`.

3. Run Netlify dev:

```bash
npm run dev
```

Netlify Dev will serve the static site from `web/` and spin up the functions locally.
