import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowUpRight,
  FileText,
  Search,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { ApplicationTracker } from "@/components/application-tracker";
import type { JobApplication } from "@/lib/application-domain";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function HomePage() {
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
          <a
            href="/login"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Account setup
          </a>
        </section>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-muted/30 text-sm text-muted-foreground">
          Loading your workspace…
        </main>
      }
    >
      <AuthenticatedHomePage />
    </Suspense>
  );
}

async function AuthenticatedHomePage() {
  await connection();

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims?.sub) {
    redirect("/login");
  }

  const { data: rows, error: applicationsError } = await supabase
    .from("job_applications")
    .select("id, company, role, stage, job_url, applied_at, created_at, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const initialApplications: JobApplication[] = (rows ?? []).map((row) => ({
      id: row.id,
      company: row.company,
      role: row.role,
      stage: row.stage,
      jobUrl: row.job_url,
      appliedAt: row.applied_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  const email =
    typeof authData.claims.email === "string"
      ? authData.claims.email
      : "Signed in";

  return (
    <div className="min-h-screen bg-muted/30 text-foreground md:flex">
      <AppSidebar email={email} />

      <main id="overview" className="min-w-0 flex-1">
        <header className="border-b border-border bg-background px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Your workspace
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Keep your job search organized.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track opportunities, see what needs attention, and plan your
                next step.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="#applications"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <FileText aria-hidden="true" className="size-4" />
                View applications
              </a>
              <a
                href="#job-matches"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Search aria-hidden="true" className="size-4" />
                Explore job discovery
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8 lg:p-10">
          <ApplicationTracker
            initialApplications={initialApplications}
            initialLoadError={
              applicationsError
                ? "Shortlist couldn't load your applications. Check the database setup and try again."
                : null
            }
          />

          <div className="grid gap-5 xl:grid-cols-2">
            <section
              id="resume-review"
              aria-labelledby="resume-title"
              className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles aria-hidden="true" className="size-4" />
                  </span>
                  Resume library
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-medium text-secondary-foreground">
                  PRIVATE TO YOUR ACCOUNT
                </span>
              </div>
              <h2
                id="resume-title"
                className="mt-5 text-xl font-semibold tracking-tight"
              >
                Save separate versions for different roles.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Give each pasted resume a title, then choose one version or all
                of them when you compare against a job description.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/resumes"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Manage resumes
                </Link>
                <Link
                  href="/resume-match"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Compare to a job description
                </Link>
              </div>
            </section>

            <section
              id="job-matches"
              aria-labelledby="matches-title"
              className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Target aria-hidden="true" className="size-4" />
                Job discovery
              </div>
              <h2
                id="matches-title"
                className="mt-2 text-xl font-semibold tracking-tight"
              >
                Find roles that fit your search.
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Job matches will use your target roles, location, and work
                preferences. No external job source is connected yet.
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-border bg-background p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Search aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">
                    Job matching is the next layer
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Set your search criteria first. Matching roles can then be
                    saved to this application tracker.
                  </p>
                  <a
                    href="#profile-criteria"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    See criteria setup
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section
              id="profile-criteria"
              aria-labelledby="criteria-title"
              className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Settings aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 id="criteria-title" className="font-semibold">
                    Search criteria
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Criteria setup follows the application tracker. It will
                    capture the roles, locations, and work styles you want.
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  "Target roles",
                  "Location and commute",
                  "Remote or hybrid preference",
                  "Skills and must-haves",
                ].map((criterion) => (
                  <li
                    key={criterion}
                    className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
                  >
                    {criterion} · Not set up
                  </li>
                ))}
              </ul>
            </section>

            <section
              id="resume-review-steps"
              aria-labelledby="review-steps-title"
              className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <FileText aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 id="review-steps-title" className="font-semibold">
                    Compare saved resume versions
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Save multiple titled versions, paste a job description,
                    then compare one resume or all saved versions.
                  </p>
                </div>
              </div>
              <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  "Save a titled resume",
                  "Paste a job description",
                  "Compare one or all versions",
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-2.5 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 leading-5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <p className="pb-2 text-center text-xs text-muted-foreground">
            Saved resumes and applications are scoped to your account. Job
            descriptions are not saved; external job discovery is not connected yet.
          </p>
        </div>
      </main>
    </div>
  );
}
