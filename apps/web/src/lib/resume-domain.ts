export const RESUME_TITLE_MAX_LENGTH = 80;
export const RESUME_TEXT_MAX_LENGTH = 30_000;
export const JOB_DESCRIPTION_MAX_LENGTH = 20_000;

export type SavedResumeSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedResume = SavedResumeSummary & {
  resumeText: string;
};

export type ResumeComparison = {
  resumeId: string;
  title: string;
  result: {
    matchedTerms: string[];
    termsToReview: string[];
    totalTerms: number;
  };
};

export type ResumeAiAnalysis = {
  jobSnapshot: { roleTitle: string; seniority: string; summary: string };
  priorityFactors: Array<{
    factor: string;
    category: string;
    importance: "must_have" | "preferred" | "unclear";
    reason: string;
  }>;
  versionComparisonSummary: string;
  comparisons: Array<{
    resumeId: string;
    title: string;
    fitLevel: "strong_alignment" | "partial_alignment" | "development_needed";
    fitSummary: string;
    requirements: Array<{
      factor: string;
      importance: "must_have" | "preferred" | "unclear";
      status: "strong_evidence" | "partial_evidence" | "no_evidence";
      evidenceQuote: string;
      assessment: string;
      nextStep: string;
    }>;
    tailoringSuggestions: Array<{
      section: string;
      suggestion: string;
      supportingQuote: string;
    }>;
    learningPlan: Array<{
      skill: string;
      learningGoal: string;
      searchQuery: string;
      priority: "high" | "medium" | "low";
      whyItHelps: string;
    }>;
  }>;
  interviewPrep: Array<{ question: string; whyItMayComeUp: string }>;
  caveat: string;
};
