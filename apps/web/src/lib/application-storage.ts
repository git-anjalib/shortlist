import { parseJobApplication, type JobApplication } from "@/lib/application-domain";

export const APPLICATIONS_STORAGE_KEY = "shortlist:applications:v1";

export function loadLegacyApplications(): JobApplication[] {
  const serialized = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);

  if (serialized === null) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Saved application data could not be read.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Saved application data is invalid.");
  }

  const applications = parsed.map(parseJobApplication);
  const ids = new Set(applications.map((application) => application.id));

  if (ids.size !== applications.length) {
    throw new Error("Saved application data contains duplicate records.");
  }

  return applications;
}

export function clearLegacyApplications(): void {
  window.localStorage.removeItem(APPLICATIONS_STORAGE_KEY);
}
