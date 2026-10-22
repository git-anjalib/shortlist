"use server";

import { revalidatePath } from "next/cache";
import {
  isApplicationDate,
  isApplicationStage,
  isHttpUrl,
  isJobApplication,
  type ApplicationStage,
  type JobApplication,
} from "@/lib/application-domain";
import type { JobApplicationRow } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateApplicationInput = {
  company: string;
  role: string;
  stage: ApplicationStage;
  jobUrl: string | null;
  appliedAt: string | null;
};

export type ApplicationActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toApplication(row: JobApplicationRow): JobApplication {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    stage: row.stage,
    jobUrl: row.job_url,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getUserInput(value: unknown): CreateApplicationInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const company = typeof input.company === "string" ? input.company.trim() : "";
  const role = typeof input.role === "string" ? input.role.trim() : "";
  const jobUrl = typeof input.jobUrl === "string" ? input.jobUrl.trim() : "";
  const appliedAt = typeof input.appliedAt === "string" ? input.appliedAt : "";

  if (
    !company ||
    company.length > 120 ||
    !role ||
    role.length > 160 ||
    !isApplicationStage(input.stage) ||
    (jobUrl.length > 0 && (jobUrl.length > 2048 || !isHttpUrl(jobUrl))) ||
    (appliedAt.length > 0 && !isApplicationDate(appliedAt))
  ) {
    return null;
  }

  return {
    company,
    role,
    stage: input.stage,
    jobUrl: jobUrl || null,
    appliedAt: appliedAt || null,
  };
}

async function requireAuthenticatedClient() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return supabase;
}

export async function createApplication(
  value: unknown,
): Promise<ApplicationActionResult<JobApplication>> {
  const input = getUserInput(value);
  if (!input) {
    return { ok: false, error: "Application details are invalid. Check the fields and try again." };
  }

  const supabase = await requireAuthenticatedClient();
  if (!supabase) {
    return { ok: false, error: "Your session expired. Sign in again to continue." };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      company: input.company,
      role: input.role,
      stage: input.stage,
      job_url: input.jobUrl,
      applied_at: input.appliedAt,
    })
    .select("id, user_id, company, role, stage, job_url, applied_at, created_at, updated_at")
    .single();

  if (error) {
    return { ok: false, error: "Shortlist couldn't save that application. Try again." };
  }

  revalidatePath("/");
  return { ok: true, data: toApplication(data) };
}

export async function updateApplicationStage(
  id: string,
  stage: unknown,
): Promise<ApplicationActionResult<JobApplication>> {
  if (!isUuid(id) || !isApplicationStage(stage)) {
    return { ok: false, error: "That application update is invalid." };
  }

  const supabase = await requireAuthenticatedClient();
  if (!supabase) {
    return { ok: false, error: "Your session expired. Sign in again to continue." };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .update({ stage })
    .eq("id", id)
    .select("id, user_id, company, role, stage, job_url, applied_at, created_at, updated_at")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Shortlist couldn't update that application. Try again." };
  }

  revalidatePath("/");
  return { ok: true, data: toApplication(data) };
}

export async function deleteApplication(
  id: string,
): Promise<ApplicationActionResult<string>> {
  if (!isUuid(id)) {
    return { ok: false, error: "That application could not be removed." };
  }

  const supabase = await requireAuthenticatedClient();
  if (!supabase) {
    return { ok: false, error: "Your session expired. Sign in again to continue." };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Shortlist couldn't remove that application. Try again." };
  }

  revalidatePath("/");
  return { ok: true, data: data.id };
}

export async function importLegacyApplications(
  value: unknown,
): Promise<ApplicationActionResult<JobApplication[]>> {
  if (
    !Array.isArray(value) ||
    value.length > 500 ||
    !value.every(isJobApplication)
  ) {
    return { ok: false, error: "The saved browser records are invalid. They were left untouched." };
  }

  const applications = value as JobApplication[];
  if (applications.length === 0) {
    return { ok: true, data: [] };
  }

  const ids = applications.map((application) => application.id);
  if (
    applications.some(
      (application) =>
        !isUuid(application.id) ||
        application.company.trim().length > 120 ||
        application.role.trim().length > 160 ||
        (application.jobUrl !== null && application.jobUrl.length > 2048),
    ) ||
    new Set(ids).size !== ids.length
  ) {
    return { ok: false, error: "Some saved browser records have unsupported IDs. They were left untouched." };
  }

  const supabase = await requireAuthenticatedClient();
  if (!supabase) {
    return { ok: false, error: "Your session expired. Sign in again to continue." };
  }

  const { data: existingRows, error: lookupError } = await supabase
    .from("job_applications")
    .select("id")
    .in("id", ids);

  if (lookupError) {
    return { ok: false, error: "Shortlist couldn't check existing applications. The browser records were left untouched." };
  }

  const existingIds = new Set((existingRows ?? []).map((application) => application.id));
  const applicationsToInsert = applications.filter(
    (application) => !existingIds.has(application.id),
  );

  if (applicationsToInsert.length === 0) {
    revalidatePath("/");
    return { ok: true, data: [] };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .insert(
      applicationsToInsert.map((application) => ({
        id: application.id,
        company: application.company.trim(),
        role: application.role.trim(),
        stage: application.stage,
        job_url: application.jobUrl,
        applied_at: application.appliedAt,
        created_at: application.createdAt,
        updated_at: application.updatedAt,
      })),
    )
    .select("id, user_id, company, role, stage, job_url, applied_at, created_at, updated_at");

  if (error) {
    return { ok: false, error: "Shortlist couldn't import the saved records. They were left untouched." };
  }

  revalidatePath("/");
  return { ok: true, data: (data ?? []).map(toApplication) };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
