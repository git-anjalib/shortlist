"use server";

import { revalidatePath } from "next/cache";
import {
  RESUME_TEXT_MAX_LENGTH,
  RESUME_TITLE_MAX_LENGTH,
  type SavedResumeSummary,
} from "@/lib/resume-domain";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResumeActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type SavedResumeRow = Pick<
  Database["public"]["Tables"]["saved_resumes"]["Row"],
  "id" | "title" | "created_at" | "updated_at"
>;

function toResumeSummary(row: SavedResumeRow): SavedResumeSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getResumeInput(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const resumeText =
    typeof input.resumeText === "string" ? input.resumeText.trim() : "";

  if (
    !title ||
    title.length > RESUME_TITLE_MAX_LENGTH ||
    !resumeText ||
    resumeText.length > RESUME_TEXT_MAX_LENGTH
  ) {
    return null;
  }

  return { title, resumeText };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getAuthenticatedClient() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims?.sub) {
      return null;
    }

    return supabase;
  } catch {
    return null;
  }
}

export async function saveResume(
  value: unknown,
): Promise<ResumeActionResult<SavedResumeSummary>> {
  const input = getResumeInput(value);

  if (!input) {
    return {
      ok: false,
      error: "Add a title and resume text within the character limits.",
    };
  }

  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Your session expired. Sign in again to save a resume.",
    };
  }

  const { data, error } = await supabase
    .from("saved_resumes")
    .insert({
      title: input.title,
      resume_text: input.resumeText,
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error || !data) {
    const message =
      error?.code === "42P01" || error?.code === "PGRST205"
        ? "Resume storage is not set up yet. Run the saved-resumes migration in Supabase, then try again."
        : "Shortlist couldn't save that resume. Check the database connection and try again.";

    return { ok: false, error: message };
  }

  revalidatePath("/resumes");
  revalidatePath("/resume-match");

  return { ok: true, data: toResumeSummary(data) };
}

export async function deleteResume(
  id: string,
): Promise<ResumeActionResult<string>> {
  if (!isUuid(id)) {
    return { ok: false, error: "That saved resume could not be removed." };
  }

  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Your session expired. Sign in again to remove a resume.",
    };
  }

  const { data, error } = await supabase
    .from("saved_resumes")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: "Shortlist couldn't remove that resume. Try again.",
    };
  }

  revalidatePath("/resumes");
  revalidatePath("/resume-match");

  return { ok: true, data: data.id };
}
