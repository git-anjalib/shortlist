"use client";

import { useState, type FormEvent } from "react";
import {
  deleteResume,
  saveResume,
} from "@/app/resumes/actions";
import {
  RESUME_TEXT_MAX_LENGTH,
  RESUME_TITLE_MAX_LENGTH,
  type SavedResumeSummary,
} from "@/lib/resume-domain";

const fieldClassName =
  "mt-1.5 min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textAreaClassName =
  "mt-1.5 min-h-56 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

type ResumeLibraryProps = {
  initialResumes: SavedResumeSummary[];
  initialLoadError: string | null;
};

function sortResumes(resumes: SavedResumeSummary[]) {
  return [...resumes].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function ResumeLibrary({
  initialResumes,
  initialLoadError,
}: ResumeLibraryProps) {
  const [resumes, setResumes] = useState(() => sortResumes(initialResumes));
  const [title, setTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loadError, setLoadError] = useState(initialLoadError);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const isReady = loadError === null;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanResumeText = resumeText.trim();

    if (
      !cleanTitle ||
      cleanTitle.length > RESUME_TITLE_MAX_LENGTH ||
      !cleanResumeText ||
      cleanResumeText.length > RESUME_TEXT_MAX_LENGTH
    ) {
      setActionError("Add a title and resume text within the limits shown.");
      return;
    }

    setActionError(null);
    setFeedback("");
    setIsWorking(true);

    try {
      const result = await saveResume({
        title: cleanTitle,
        resumeText: cleanResumeText,
      });

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setResumes((current) => sortResumes([...current, result.data]));
      setTitle("");
      setResumeText("");
      setFeedback("Resume saved to your account.");
    } catch {
      setActionError("Shortlist couldn't save that resume. Try again.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDelete(resume: SavedResumeSummary) {
    if (isWorking) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete " + resume.title + "? Its saved resume text will be removed from your account.",
    );

    if (!shouldDelete) {
      return;
    }

    setActionError(null);
    setFeedback("");
    setIsWorking(true);

    try {
      const result = await deleteResume(resume.id);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setResumes((current) =>
        current.filter((item) => item.id !== result.data),
      );
      setFeedback("Resume deleted from your account.");
    } catch {
      setActionError("Shortlist couldn't delete that resume. Try again.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Paste and save each resume version with its own title. Saved resume
        text is stored in your account so you can reuse it in comparisons.
      </p>

      {loadError && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </p>
      )}

      <section
        aria-labelledby="add-resume-title"
        className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 id="add-resume-title" className="text-base font-semibold">
          Add a resume
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Give this version a title, such as “Frontend engineer” or “Product
          manager — APAC”.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSave}>
          <label className="block text-sm font-medium">
            Resume title
            <input
              className={fieldClassName}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setActionError(null);
              }}
              maxLength={RESUME_TITLE_MAX_LENGTH}
              placeholder="Frontend engineer"
              required
            />
            <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">
              {title.length} / {RESUME_TITLE_MAX_LENGTH} characters
            </span>
          </label>

          <label className="block text-sm font-medium">
            Resume text
            <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
              Paste the resume text you want to keep in your account.
            </span>
            <textarea
              className={textAreaClassName}
              value={resumeText}
              onChange={(event) => {
                setResumeText(event.target.value);
                setActionError(null);
              }}
              maxLength={RESUME_TEXT_MAX_LENGTH}
              placeholder="Paste your resume text here"
              required
            />
            <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">
              {resumeText.length.toLocaleString()} /{" "}
              {RESUME_TEXT_MAX_LENGTH.toLocaleString()} characters
            </span>
          </label>

          {actionError && (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className="text-xs text-muted-foreground"
              aria-live="polite"
              role="status"
            >
              {feedback}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => {
                  setTitle("");
                  setResumeText("");
                  setActionError(null);
                  setFeedback("");
                }}
                disabled={isWorking || (!title && !resumeText)}
              >
                Clear
              </button>
              <button
                type="submit"
                className={primaryButtonClassName}
                disabled={!isReady || isWorking}
              >
                {isWorking ? "Saving…" : "Save resume"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section aria-labelledby="saved-resumes-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="saved-resumes-title" className="font-semibold">
              Saved resumes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {resumes.length} {resumes.length === 1 ? "version" : "versions"}{" "}
              saved to your account.
            </p>
          </div>
        </div>

        {resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
            <h3 className="font-semibold">No saved resumes yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Add a titled version above. You can keep separate resumes for
              different roles and compare one or all of them with a job
              description.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border/80 bg-card px-5 shadow-sm">
            {resumes.map((resume) => (
              <li
                key={resume.id}
                className="flex flex-col gap-3 py-4 first:pt-5 last:pb-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{resume.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Private to your account
                  </p>
                </div>
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => handleDelete(resume)}
                  disabled={isWorking}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
