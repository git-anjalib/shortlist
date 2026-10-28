import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppSidebar } from "@/components/app-sidebar";
import { ResumeLibrary } from "@/components/resume-library";
import type { SavedResumeSummary } from "@/lib/resume-domain";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function ResumesPage() {
  if (!getSupabasePublicConfig()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 text-foreground">
        <section className="max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold">Connect your Shortlist database</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add the Supabase URL and publishable key to
            <code className="mx-1 rounded bg-muted px-1 py-0.5">apps/web/.env.local</code>
            and run the setup steps in
            <code className="mx-1 rounded bg-muted px-1 py-0.5">apps/web/SUPABASE_SETUP.md</code>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-muted/30 text-sm text-muted-foreground">
          Loading your resumes…
        </main>
      }
    >
      <AuthenticatedResumesPage />
    </Suspense>
  );
}

async function AuthenticatedResumesPage() {
  await connection();

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims?.sub) {
    redirect("/login");
  }

  const { data: rows, error: resumesError } = await supabase
    .from("saved_resumes")
    .select("id, title, created_at, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const initialResumes: SavedResumeSummary[] = (rows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  const email =
    typeof authData.claims.email === "string"
      ? authData.claims.email
      : "Signed in";

  return (
    <div className="min-h-screen bg-muted/30 text-foreground md:flex">
      <AppSidebar email={email} activeSection="resumes" />
      <main className="min-w-0 flex-1">
        <header className="border-b border-border bg-background px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              My resumes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep titled versions in one place and choose which ones to compare.
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8 lg:p-10">
          <ResumeLibrary
            initialResumes={initialResumes}
            initialLoadError={
              resumesError
                ? "Shortlist couldn't load your resumes. Apply the saved-resumes migration in Supabase, then refresh."
                : null
            }
          />
        </div>
      </main>
    </div>
  );
}
