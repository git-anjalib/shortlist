"use client";

import { useState, type FormEvent } from "react";
import {
  analyzeResumeMatch,
  type ResumeMatchResult,
} from "@/lib/resume-matching";

const MAX_RESUME_CHARACTERS = 30_000;
const MAX_JOB_DESCRIPTION_CHARACTERS = 20_000;

const textAreaClassName =
  "mt-1.5 min-h-48 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function ResumeMatchAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ResumeMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resumeText.trim() || !jobDescription.trim()) {
      setResult(null);
      setError("Paste both your resume and the job description to compare them.");
      return;
    }

    try {
      setResult(analyzeResumeMatch(resumeText, jobDescription));
      setError(null);
    } catch (analysisError) {
      setResult(null);
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Shortlist couldn't compare that text. Try again.",
      );
    }
  }

  function handleClear() {
    setResumeText("");
    setJobDescription("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="mt-5 space-y-4">
      <p className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Your pasted text is compared in this page. This version does not save
        it to your account or send it to an AI service.
      </p>

      <form className="space-y-4" onSubmit={handleAnalyze}>
        <label className="block text-sm font-medium">
          Resume
          <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
            Paste the resume version you want to compare.
          </span>
          <textarea
            className={textAreaClassName}
            value={resumeText}
            onChange={(event) => {
              setResumeText(event.target.value);
              setResult(null);
              setError(null);
            }}
            maxLength={MAX_RESUME_CHARACTERS}
            placeholder="Paste your resume text here"
            required
          />
          <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">
            {resumeText.length.toLocaleString()} /{" "}
            {MAX_RESUME_CHARACTERS.toLocaleString()} characters
          </span>
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
              setResult(null);
              setError(null);
            }}
            maxLength={MAX_JOB_DESCRIPTION_CHARACTERS}
            placeholder="Paste the job description here"
            required
          />
          <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">
            {jobDescription.length.toLocaleString()} /{" "}
            {MAX_JOB_DESCRIPTION_CHARACTERS.toLocaleString()} characters
          </span>
        </label>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={primaryButtonClassName}>
            Compare text
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={handleClear}
            disabled={!resumeText && !jobDescription && !result && !error}
          >
            Clear text
          </button>
        </div>
      </form>

      {result && (
        <section
          aria-labelledby="match-results-title"
          aria-live="polite"
          className="rounded-xl border border-border bg-muted/40 p-4 sm:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            First-pass keyword comparison
          </p>
          <h3 id="match-results-title" className="mt-2 font-semibold">
            Found {result.matchedTerms.length} of {result.totalTerms} selected
            job-description terms in the resume text.
          </h3>

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
              <h4 className="text-sm font-semibold">Not found in resume text</h4>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Review these terms only if they reflect experience you actually
                have.
              </p>
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
            </div>
          </div>

          <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
            This checks exact wording among up to 16 distinctive job terms. It
            does not evaluate experience depth, recognize all synonyms, or
            estimate your chance of being hired. A term not found in the pasted
            text does not mean you lack that skill.
          </p>
        </section>
      )}
    </div>
  );
}
