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