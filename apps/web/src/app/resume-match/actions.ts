"use server";

import {
  JOB_DESCRIPTION_MAX_LENGTH,
  type ResumeAiAnalysis,
  type ResumeComparison,
} from "@/lib/resume-domain";
import { generateResumeAiAnalysis } from "@/lib/resume-ai-analysis";
import { analyzeResumeMatch } from "@/lib/resume-matching";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResumeComparisonActionResult =
  | { ok: true; data: ResumeComparison[] }
  | { ok: false; error: string };

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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function compareSavedResumes(
  value: unknown,
): Promise<ResumeComparisonActionResult> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      ok: false,
      error: "Choose one saved resume or all saved resumes, then add a job description.",
    };
  }

  const input = value as Record<string, unknown>;
  const resumeId = input.resumeId;
  const jobDescription =
    typeof input.jobDescription === "string" ? input.jobDescription.trim() : "";

  if (
    !jobDescription ||
    jobDescription.length > JOB_DESCRIPTION_MAX_LENGTH ||
    (resumeId !== "all" &&
      (typeof resumeId !== "string" || !isUuid(resumeId)))
  ) {
    return {
      ok: false,
      error: "Choose one resume or all saved resumes, and add a job description within the character limit.",
    };
  }

  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Your session expired. Sign in again to compare resumes.",
    };
  }

  const resumeQuery = supabase
    .from("saved_resumes")
    .select("id, title, resume_text")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  const { data, error } =
    resumeId === "all"
      ? await resumeQuery
      : await resumeQuery.eq("id", resumeId as string);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return {
        ok: false,
        error: "The resume library database is not set up yet. Run apps/web/supabase/migrations/20261028000000_saved_resumes.sql in your Supabase SQL Editor.",
      };
    }

    return {
      ok: false,
      error: "Shortlist couldn't load the selected resume. Refresh the page and try again.",
    };
  }

  if (!data?.length) {
    return {
      ok: false,
      error: "That saved resume is no longer available. Refresh the page or save a resume first.",
    };
  }

  try {
    return {
      ok: true,
      data: data.map((resume) => ({
        resumeId: resume.id,
        title: resume.title,
        result: analyzeResumeMatch(resume.resume_text, jobDescription),
      })),
    };
  } catch (analysisError) {
    return {
      ok: false,
      error:
        analysisError instanceof Error
          ? analysisError.message
          : "Shortlist couldn't compare those resumes. Try again.",
    };
  }
}
export type ResumeAiAnalysisActionResult =
  | { ok: true; data: ResumeAiAnalysis }
  | { ok: false; error: string };

export async function analyzeSavedResumesWithAi(
  value: unknown,
): Promise<ResumeAiAnalysisActionResult> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "Choose a resume, add a job description, and confirm AI analysis." };
  }
  const input = value as Record<string, unknown>;
  const resumeId = input.resumeId;
  const jobDescription = typeof input.jobDescription === "string" ? input.jobDescription.trim() : "";
  if (
    input.consent !== true ||
    !jobDescription ||
    jobDescription.length > JOB_DESCRIPTION_MAX_LENGTH ||
    (resumeId !== "all" && (typeof resumeId !== "string" || !isUuid(resumeId)))
  ) {
    return {
      ok: false,
      error: input.consent !== true
        ? "Confirm the AI data-sharing notice before starting the analysis."
        : "Choose one resume or all saved resumes, and add a job description within the character limit.",
    };
  }
  const supabase = await getAuthenticatedClient();
  if (!supabase) return { ok: false, error: "Your session expired. Sign in again to analyze resumes." };

  const resumeQuery = supabase
    .from("saved_resumes")
    .select("id, title, resume_text")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  const { data, error } = resumeId === "all"
    ? await resumeQuery
    : await resumeQuery.eq("id", resumeId as string);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { ok: false, error: "The resume library database is not set up yet. Run its migration, then refresh." };
    }
    return { ok: false, error: "Shortlist couldn't load the selected resume. Refresh the page and try again." };
  }
  if (!data?.length) {
    return { ok: false, error: "That saved resume is no longer available. Refresh the page or save a resume first." };
  }
  if (data.length > 5) {
    return { ok: false, error: "AI analysis can compare up to five resumes at a time. Choose one resume or archive versions you no longer need." };
  }
  const resumes = data.map((resume) => ({
    id: resume.id,
    title: resume.title,
    resumeText: resume.resume_text,
  }));
  const inputLength = jobDescription.length + resumes.reduce((sum, resume) => sum + resume.resumeText.length, 0);
  if (inputLength > 100_000) {
    return { ok: false, error: "These resumes and the job description are too long to analyze together. Choose one resume or shorten the pasted text." };
  }
  try {
    return { ok: true, data: await generateResumeAiAnalysis(jobDescription, resumes) };
  } catch (analysisError) {
    return {
      ok: false,
      error: analysisError instanceof Error
        ? analysisError.message
        : "Shortlist couldn't analyze those resumes. Please try again.",
    };
  }
}
