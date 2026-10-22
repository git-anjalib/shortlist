export const APPLICATION_STAGE_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
] as const;

export type ApplicationStage =
  (typeof APPLICATION_STAGE_OPTIONS)[number]["value"];

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  jobUrl: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isApplicationStage(
  value: unknown,
): value is ApplicationStage {
  return APPLICATION_STAGE_OPTIONS.some((option) => option.value === value);
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isApplicationDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(value + "T00:00:00.000Z");
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return Number.isFinite(date.valueOf()) && date.toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJobApplication(value: unknown): JobApplication {
  if (!isRecord(value)) {
    throw new Error("Saved application data is invalid.");
  }

  const { id, company, role, stage, jobUrl, appliedAt, createdAt, updatedAt } =
    value;

  if (
    typeof id !== "string" ||
    id.length === 0 ||
    typeof company !== "string" ||
    company.trim().length === 0 ||
    typeof role !== "string" ||
    role.trim().length === 0 ||
    !isApplicationStage(stage) ||
    (jobUrl !== null && (typeof jobUrl !== "string" || !isHttpUrl(jobUrl))) ||
    (appliedAt !== null && !isApplicationDate(appliedAt)) ||
    !isTimestamp(createdAt) ||
    !isTimestamp(updatedAt)
  ) {
    throw new Error("Saved application data is invalid.");
  }

  return {
    id,
    company,
    role,
    stage,
    jobUrl,
    appliedAt,
    createdAt,
    updatedAt,
  };
}

export function isJobApplication(value: unknown): value is JobApplication {
  try {
    parseJobApplication(value);
    return true;
  } catch {
    return false;
  }
}
