"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { compareSavedResumes } from "@/app/resume-match/actions";
import {
  JOB_DESCRIPTION_MAX_LENGTH,
  type ResumeComparison,
  type SavedResumeSummary,
} from "@/lib/resume-domain";

const textAreaClassName =
  "mt-1.5 min-h-56 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const fieldClassName =
  "mt-1.5 min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function ResumeComparisonCard({
  comparison,
}: {
  comparison: ResumeComparison;
}) {
  const { result } = comparison;

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Resume version
      </p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight">
        {comparison.title}
      </h3>
      <p className="mt-2 text-sm font-medium">
        Found {result.matchedTerms.length} of {result.totalTerms} selected
        job-description terms in this resume.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold">Found in resume text</h4>
          {result.matchedTerms.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {result.matchedTerms.map((term) => (
                <li
                  key={term}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {term}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No exact keyword matches found.
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold">Terms to review</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Consider adding a term only if it reflects your actual experience.
          </p>
          {result.termsToReview.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {result.termsToReview.map((term) => (
                <li
                  key={term}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {term}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              All selected terms appear in this resume text.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ResumeMatchAnalyzer({
  resumes,
  initialLoadError,
}: {
  resumes: SavedResumeSummary[];
  initialLoadError: string | null;
}) {
  const [selectedResumeId, setSelectedResumeId] = useState("all");
  const [jobDescription, setJobDescription] = useState("");
  const [comparisons, setComparisons] = useState<ResumeComparison[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  async function handleCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComparisons([]);
    setError(null);

    if (!jobDescription.trim()) {
      setError("Paste a job description to compare it with your saved resume.");
      return;
    }

    if (resumes.length === 0) {
      setError("Save at least one resume before comparing.");
      return;
    }

    setIsComparing(true);

    try {
      const actionResult = await compareSavedResumes({
        resumeId: selectedResumeId,
        jobDescription,
      });

      if (!actionResult.ok) {
        setError(actionResult.error);
        return;
      }

      setComparisons(actionResult.data);
    } catch {
      setError("Shortlist couldn't compare those resumes. Try again.");
    } finally {
      setIsComparing(false);
    }
  }

  function handleClear() {
    setJobDescription("");
    setComparisons([]);
    setError(null);
  }

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Choose one saved version or compare all of them. The comparison uses
        your account data, returns keyword results, and does not save the job
        description or send your resume to an AI service.
      </p>

      {initialLoadError && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {initialLoadError}
        </p>
      )}

      {resumes.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <h2 className="font-semibold">Save a resume before comparing</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Add one or more titled resume versions. Then choose a single version
            or compare the job description with all of them.
          </p>
          <Link href="/resumes" className={primaryButtonClassName + " mt-4"}>
            Go to My resumes
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <form className="space-y-4" onSubmit={handleCompare}>
            <label className="block text-sm font-medium">
              Resume to compare
              <select
                className={fieldClassName}
                value={selectedResumeId}
                onChange={(event) => {
                  setSelectedResumeId(event.target.value);
                  setComparisons([]);
                  setError(null);
                }}
              >
                <option value="all">
                  Compare all saved resumes ({resumes.length})
                </option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Job description
              <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                Paste the full description for the role you’re considering.
              </span>
              <textarea
                className={textAreaClassName}
                value={jobDescription}
                onChange={(event) => {
                  setJobDescription(event.target.value);
                  setComparisons([]);
                  setError(null);
                }}
                maxLength={JOB_DESCRIPTION_MAX_LENGTH}
                placeholder="Paste the job description here"
                required
              />
              <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">
                {jobDescription.length.toLocaleString()} /{" "}
                {JOB_DESCRIPTION_MAX_LENGTH.toLocaleString()} characters
              </span>
            </label>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className={primaryButtonClassName}
                disabled={isComparing}
              >
                {isComparing
                  ? "Comparing…"
                  : "Compare " +
                    (selectedResumeId === "all" ? "all resumes" : "resume")}
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={handleClear}
                disabled={!jobDescription && comparisons.length === 0 && !error}
              >
                Clear job description
              </button>
            </div>
          </form>
        </section>
      )}

      {comparisons.length > 0 && (
        <section
          aria-labelledby="resume-comparison-results-title"
          aria-live="polite"
          className="space-y-3"
        >
          <div>
            <h2
              id="resume-comparison-results-title"
              className="text-base font-semibold"
            >
              Comparison results
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {comparisons.length === 1
                ? "One resume compared."
                : comparisons.length + " resumes compared."}
            </p>
          </div>
          {comparisons.map((comparison) => (
            <ResumeComparisonCard
              key={comparison.resumeId}
              comparison={comparison}
            />
          ))}
          <p className="border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
            This checks exact wording among up to 16 distinctive job terms. It
            does not evaluate experience depth, recognize all synonyms, or
            estimate your chance of being hired. A term not found in resume text
            does not mean you lack that skill.
          </p>
        </section>
      )}
    </div>
  );
}