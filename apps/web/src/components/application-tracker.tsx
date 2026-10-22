"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Clock3,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import {
  APPLICATIONS_STORAGE_KEY,
  APPLICATION_STAGE_OPTIONS,
  isApplicationStage,
  isHttpUrl,
  loadApplications,
  saveApplications,
  type ApplicationStage,
  type JobApplication,
} from "@/lib/application-storage";

const stageStyles: Record<ApplicationStage, string> = {
  saved: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  applied: "bg-muted text-muted-foreground",
  interview: "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  offer:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-destructive/10 text-destructive",
};

const fieldClassName =
  "mt-1.5 min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function sortApplications(applications: JobApplication[]): JobApplication[] {
  return [...applications].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(year, month - 1, day),
  );
}

export function ApplicationTracker() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [storageError, setStorageError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setApplications(sortApplications(loadApplications()));
      setLoadState("ready");
    } catch {
      setStorageError(
        "Shortlist couldn't read saved application data. Your records have been left untouched.",
      );
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    if (loadState !== "ready") {
      return;
    }

    function handleStorageChange(event: StorageEvent) {
      if (
        event.key !== APPLICATIONS_STORAGE_KEY &&
        event.key !== null
      ) {
        return;
      }

      try {
        setApplications(sortApplications(loadApplications()));
        setStorageError(null);
        setFeedback("Applications updated from another browser tab.");
        setLoadState("ready");
      } catch {
        setStorageError(
          "Shortlist couldn't read saved application data. Your records have been left untouched.",
        );
        setLoadState("error");
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadState]);

  function persistChanges(
    nextApplications: JobApplication[],
    successMessage: string,
  ): boolean {
    try {
      saveApplications(nextApplications);
      setApplications(sortApplications(nextApplications));
      setStorageError(null);
      setFeedback(successMessage);
      setLoadState("ready");
      return true;
    } catch {
      setStorageError(
        "Shortlist couldn't save changes. Check that browser storage is available and has space.",
      );
      setLoadState("error");
      setFeedback("");
      return false;
    }
  }

  function handleAddApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const company = String(formData.get("company") ?? "").trim();
    const role = String(formData.get("role") ?? "").trim();
    const jobUrlValue = String(formData.get("jobUrl") ?? "").trim();
    const stageValue = formData.get("stage");
    const appliedAtValue = String(formData.get("appliedAt") ?? "");

    if (!company || !role) {
      setFormError("Add both a company and a role.");
      return;
    }

    if (jobUrlValue && !isHttpUrl(jobUrlValue)) {
      setFormError("Use a complete job URL that starts with http:// or https://.");
      return;
    }

    if (!isApplicationStage(stageValue)) {
      setFormError("Choose a valid application stage.");
      return;
    }

    if (
      appliedAtValue &&
      !/^\d{4}-\d{2}-\d{2}$/.test(appliedAtValue)
    ) {
      setFormError("Choose a valid application date.");
      return;
    }

    const now = new Date().toISOString();
    const application: JobApplication = {
      id: crypto.randomUUID(),
      company,
      role,
      stage: stageValue,
      jobUrl: jobUrlValue || null,
      appliedAt: appliedAtValue || null,
      createdAt: now,
      updatedAt: now,
    };

    if (
      persistChanges(
        [...applications, application],
        "Application added and saved in this browser.",
      )
    ) {
      form.reset();
      setFormError(null);
      setIsFormOpen(false);
    }
  }

  function handleStageChange(
    application: JobApplication,
    stageValue: string,
  ) {
    if (!isApplicationStage(stageValue)) {
      return;
    }

    const updatedAt = new Date().toISOString();
    const nextApplications = applications.map((item) =>
      item.id === application.id
        ? { ...item, stage: stageValue, updatedAt }
        : item,
    );

    persistChanges(
      nextApplications,
      "Application stage updated and saved.",
    );
  }

  function handleRemove(application: JobApplication) {
    const shouldRemove = window.confirm(
      "Remove " + application.role + " at " + application.company + "?",
    );

    if (!shouldRemove) {
      return;
    }

    const nextApplications = applications.filter(
      (item) => item.id !== application.id,
    );

    persistChanges(nextApplications, "Application removed.");
  }

  const activeCount = applications.filter(
    (application) =>
      application.stage === "saved" ||
      application.stage === "applied" ||
      application.stage === "interview",
  ).length;
  const interviewCount = applications.filter(
    (application) => application.stage === "interview",
  ).length;
  const offerCount = applications.filter(
    (application) => application.stage === "offer",
  ).length;

  const metrics = [
    {
      label: "Applications",
      value: applications.length,
      detail: "Tracked across all stages",
      icon: Briefcase,
    },
    {
      label: "In progress",
      value: activeCount,
      detail: "Saved, applied, or interviewing",
      icon: Clock3,
    },
    {
      label: "Interviews",
      value: interviewCount,
      detail: "Roles at interview stage",
      icon: CalendarDays,
    },
    {
      label: "Offers",
      value: offerCount,
      detail: "Roles with an offer",
      icon: Target,
    },
  ];

  return (
    <>
      <section aria-labelledby="summary-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="summary-title" className="text-base font-semibold">
              At a glance
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Live totals from the applications you track.
            </p>
          </div>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[0.65rem] font-medium text-muted-foreground">
            SAVED IN THIS BROWSER
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight">
                  {loadState === "ready" ? metric.value : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metric.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="applications"
        aria-labelledby="applications-title"
        className="min-w-0 rounded-2xl border border-border/80 bg-card shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="applications-title" className="font-semibold">
              Your applications
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep every opportunity and next step in view.
            </p>
          </div>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={loadState !== "ready"}
            aria-expanded={isFormOpen}
            onClick={() => {
              setFormError(null);
              setIsFormOpen((open) => !open);
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            {isFormOpen ? "Cancel" : "Add application"}
          </button>
        </div>

        <div className="px-5 py-4">
          <p
            className="text-xs text-muted-foreground"
            aria-live="polite"
            role="status"
          >
            {feedback}
          </p>

          {storageError && (
            <p
              className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {storageError}
            </p>
          )}

          {isFormOpen && (
            <form
              id="new-application-form"
              className="mb-5 rounded-xl border border-border bg-muted/30 p-4 sm:p-5"
              onSubmit={handleAddApplication}
            >
              <div className="mb-4">
                <h3 className="font-semibold">Add an opportunity</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save the role and update its stage as your search progresses.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-medium">
                  Company
                  <input
                    className={fieldClassName}
                    name="company"
                    autoComplete="organization"
                    maxLength={120}
                    placeholder="Company name"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Role
                  <input
                    className={fieldClassName}
                    name="role"
                    autoComplete="organization-title"
                    maxLength={160}
                    placeholder="Role title"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Stage
                  <select
                    className={fieldClassName}
                    name="stage"
                    defaultValue="applied"
                  >
                    {APPLICATION_STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Job link <span className="font-normal text-muted-foreground">(optional)</span>
                  <input
                    className={fieldClassName}
                    name="jobUrl"
                    type="url"
                    maxLength={2048}
                    placeholder="https://company.com/jobs/..."
                  />
                </label>
                <label className="text-sm font-medium">
                  Applied on <span className="font-normal text-muted-foreground">(optional)</span>
                  <input
                    className={fieldClassName}
                    name="appliedAt"
                    type="date"
                  />
                </label>
              </div>

              {formError && (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setFormError(null);
                    setIsFormOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={primaryButtonClassName}>
                  Save application
                </button>
              </div>
            </form>
          )}

          {loadState === "loading" ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading saved applications…
            </p>
          ) : loadState === "error" ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Your saved list is unavailable until browser storage can be read.
            </p>
          ) : applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
              <span className="mx-auto grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Briefcase aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">No applications yet</h3>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Add a role you’ve saved or applied to. Your list and dashboard
                totals will update as you track each step.
              </p>
              <button
                type="button"
                className={secondaryButtonClassName + " mt-4"}
                onClick={() => setIsFormOpen(true)}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add your first application
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {applications.map((application) => (
                  <li
                    key={application.id}
                    className="flex flex-col gap-4 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{application.role}</h3>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {application.company}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {application.appliedAt
                          ? "Applied " + formatDate(application.appliedAt)
                          : "Added " +
                            formatDate(application.createdAt.slice(0, 10))}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className="sr-only"
                        htmlFor={"stage-" + application.id}
                      >
                        Stage for {application.role} at {application.company}
                      </label>
                      <select
                        id={"stage-" + application.id}
                        className={
                          "min-h-9 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                          stageStyles[application.stage]
                        }
                        value={application.stage}
                        onChange={(event) =>
                          handleStageChange(application, event.target.value)
                        }
                        disabled={loadState !== "ready"}
                      >
                        {APPLICATION_STAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {application.jobUrl && (
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Job post
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        </a>
                      )}
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={
                          "Remove " +
                          application.role +
                          " at " +
                          application.company
                        }
                        onClick={() => handleRemove(application)}
                        disabled={loadState !== "ready"}
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                        Remove
                      </button>
                    </div>
                  </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
