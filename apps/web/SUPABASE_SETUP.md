# Supabase setup for Shortlist

Shortlist stores applications in Supabase Postgres. Supabase Auth provides the account session, and database row-level security scopes every application to its owner.

## Create and configure a project

1. Create a Supabase project.
2. In **Project Settings → API**, copy the project URL and the **publishable key**.
3. Copy `apps/web/.env.example` to `apps/web/.env.local` and replace the URL and key. Keep the publishable key in the `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variable; do not put a secret or service-role key in the app.
4. In the Supabase SQL Editor, run [`supabase/migrations/20261022000000_job_applications.sql`](supabase/migrations/20261022000000_job_applications.sql).
5. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect URLs. For a deployed app, add its HTTPS callback URL and set `NEXT_PUBLIC_SITE_URL` to that app's origin.

## Run locally

From the repository root, run `pnpm --filter web dev` and open `http://localhost:3000`. Create an account with an email address you can access, confirm it if Supabase email confirmation is enabled, then sign in.

If you used the earlier browser-storage tracker, sign in in the same browser. Shortlist will offer to import those saved applications. It removes the local copy only after the database import succeeds.
