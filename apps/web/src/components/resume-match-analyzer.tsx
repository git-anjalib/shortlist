"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { analyzeSavedResumesWithAi, compareSavedResumes } from "@/app/resume-match/actions";
import {
  JOB_DESCRIPTION_MAX_LENGTH,
  type ResumeAiAnalysis,
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


function ResumeAiAnalysisReport({ analysis }: { analysis: ResumeAiAnalysis }) {
  return (
    <section aria-labelledby="resume-ai-analysis-title" aria-live="polite" className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI career analysis</p>
        <h2 id="resume-ai-analysis-title" className="mt-2 text-xl font-semibold">{analysis.jobSnapshot.roleTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{analysis.jobSnapshot.seniority}</p>
        <p className="mt-3 text-sm leading-6">{analysis.jobSnapshot.summary}</p>
        <p className="mt-3 border-t border-primary/15 pt-3 text-sm leading-6">{analysis.versionComparisonSummary}</p>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold">What matters most in this role</h3>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2">
          {analysis.priorityFactors.map((factor, index) => (
            <li key={factor.factor} className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">{index + 1}. {factor.factor}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">{factor.importance.replaceAll("_", " ")} · {factor.category.replaceAll("_", " ")}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{factor.reason}</p>
            </li>
          ))}
        </ol>
      </section>
      {analysis.comparisons.map((comparison) => (
        <article key={comparison.resumeId} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resume version</p>
              <h3 className="mt-1 text-lg font-semibold">{comparison.title}</h3>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize">{comparison.fitLevel.replaceAll("_", " ")}</span>
          </div>
          <p className="mt-3 text-sm leading-6">{comparison.fitSummary}</p>
          <h4 className="mt-5 text-sm font-semibold">Skill evidence and gaps</h4>
          <ul className="mt-2 space-y-3">
            {comparison.requirements.map((item) => (
              <li key={item.factor} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.factor}</p>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {item.status === "strong_evidence" ? "Clear evidence" : item.status === "partial_evidence" ? "Some evidence" : "Not shown in this version"}
                    {" · "}{item.importance.replaceAll("_", " ")}
                  </span>
                </div>
                {item.evidenceQuote && <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">“{item.evidenceQuote}”</blockquote>}
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.assessment}</p>
                {item.nextStep && <p className="mt-2 text-sm leading-5"><strong>Next step:</strong> {item.nextStep}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">“Not shown” means this resume version has no direct evidence; it does not prove you lack the skill.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section>
              <h4 className="text-sm font-semibold">Truthful resume improvements</h4>
              {comparison.tailoringSuggestions.length ? (
                <ul className="mt-2 space-y-2">
                  {comparison.tailoringSuggestions.map((item, index) => (
                    <li key={item.section + index} className="rounded-xl border border-border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{item.section}</p>
                      <p className="mt-1 text-sm leading-5">{item.suggestion}</p>
                      {item.supportingQuote && <p className="mt-2 text-xs italic text-muted-foreground">Based on: “{item.supportingQuote}”</p>}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-muted-foreground">No specific rewrite is suggested. Keep the resume accurate and emphasize its clearest role evidence.</p>}
            </section>
            <section>
              <h4 className="text-sm font-semibold">Courses and learning plan</h4>
              {comparison.learningPlan.length ? (
                <ul className="mt-2 space-y-2">
                  {comparison.learningPlan.map((item) => (
                    <li key={item.skill} className="rounded-xl border border-border p-3">
                      <p className="text-sm font-medium">{item.skill} <span className="text-xs font-normal capitalize text-muted-foreground">· {item.priority} priority</span></p>
                      <p className="mt-1 text-sm leading-5">{item.learningGoal}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.whyItHelps}</p>
                      <a className="mt-2 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" href={"https://www.google.com/search?q=" + encodeURIComponent(item.searchQuery + " online course")} target="_blank" rel="noreferrer">Find a course</a>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-muted-foreground">No major learning gap stood out from this resume.</p>}
            </section>
          </div>
        </article>
      ))}
      {analysis.interviewPrep.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Questions to prepare for</h3>
          <ul className="mt-3 space-y-3">
            {analysis.interviewPrep.map((item, index) => (
              <li key={item.question} className="text-sm">
                <p className="font-medium">{index + 1}. {item.question}</p>
                <p className="mt-1 text-muted-foreground">{item.whyItMayComeUp}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="border-t border-border pt-3 text-xs leading-5 text-muted-foreground">{analysis.caveat} Use this as a coaching aid, not a hiring prediction. Verify suggestions and include only true experience.</p>
    </section>
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
  const [analysis, setAnalysis] = useState<ResumeAiAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasAiConsent, setHasAiConsent] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  async function handleCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComparisons([]);
    setAnalysis(null);
    setAnalysisError(null);
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

  async function handleAiAnalysis() {
    setComparisons([]);
    setAnalysis(null);
    setError(null);
    setAnalysisError(null);
    if (!jobDescription.trim()) {
      setAnalysisError("Paste a job description before starting AI analysis.");
      return;
    }
    if (!hasAiConsent) {
      setAnalysisError("Confirm the data-sharing notice before starting AI analysis.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeSavedResumesWithAi({
        resumeId: selectedResumeId,
        jobDescription,
        consent: true,
      });
      if (!result.ok) {
        setAnalysisError(result.error);
        return;
      }
      setAnalysis(result.data);
    } catch {
      setAnalysisError("Shortlist couldn't analyze those resumes. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleClear() {
    setJobDescription("");
    setComparisons([]);
    setAnalysis(null);
    setAnalysisError(null);
    setHasAiConsent(false);
    setError(null);
  }

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Run a quick keyword check privately in Shortlist, or opt in to a deeper AI review with role priorities, resume evidence, gaps, truthful edits, and learning recommendations.
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
                  setAnalysis(null);
                  setAnalysisError(null);
                  setHasAiConsent(false);
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
                  setAnalysis(null);
                  setAnalysisError(null);
                  setHasAiConsent(false);
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
                disabled={isComparing || isAnalyzing}
              >
                {isComparing
                  ? "Comparing…"
                  : "Quick keyword check"}
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={handleClear}
                disabled={isComparing || isAnalyzing || (!jobDescription && comparisons.length === 0 && !analysis && !error && !analysisError)}
              >
                Clear job description
              </button>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <h2 className="text-sm font-semibold">Deeper AI analysis</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                The selected saved resume text and job description will be sent to OpenAI’s API only after you confirm and start analysis. Shortlist does not save the job description or report. OpenAI API data policies apply, and API use may be billed to your API account.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm leading-5">
                <input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" checked={hasAiConsent}
                  onChange={(event) => { setHasAiConsent(event.target.checked); setAnalysisError(null); }}
                  disabled={isAnalyzing} />
                <span>I agree to send the selected saved {selectedResumeId === "all" ? "resumes" : "resume"} and job description to OpenAI for this analysis.</span>
              </label>
              {analysisError && <p className="mt-3 text-sm text-destructive" role="alert">{analysisError}</p>}
              <button type="button" className={primaryButtonClassName + " mt-3"} onClick={handleAiAnalysis}
                disabled={!hasAiConsent || isAnalyzing || isComparing}>
                {isAnalyzing ? "Analyzing resumes…" : "Analyze with AI"}
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
      {analysis && <ResumeAiAnalysisReport analysis={analysis} />}
    </div>
  );
}