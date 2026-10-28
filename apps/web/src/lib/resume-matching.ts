const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "all", "also", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "could", "did", "do", "does", "during",
  "each", "few", "for", "from", "further", "had", "has", "have", "having", "he",
  "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if",
  "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my",
  "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or",
  "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
  "them", "themselves", "then", "there", "these", "they", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "we", "were",
  "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with",
  "you", "your", "yours", "yourself", "yourselves",
  "able", "across", "applicant", "applications", "candidate", "candidates",
  "company", "excellent", "experience", "experienced", "ideal", "including",
  "job", "knowledge", "looking", "position", "preferred", "requirements",
  "responsibilities", "responsible", "role", "roles", "strong", "team", "teams",
  "work", "working", "years",
]);

const SHORT_TERMS = new Set([
  "ai", "bi", "c", "cd", "ci", "go", "hr", "it", "ml", "qa", "r", "ui", "ux",
]);

const MAX_KEYWORDS = 16;

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .match(/[\p{L}\p{N}]+(?:[+#]+|[-.][\p{L}\p{N}]+)*/gu) ??
    []
  );
}

function extractKeywords(text: string): string[] {
  const frequencies = new Map<string, number>();

  for (const token of tokenize(text)) {
    if (
      token.length < 3 &&
      !SHORT_TERMS.has(token) &&
      !/^[a-z]\+\+$/.test(token) &&
      !/^[a-z]#$/.test(token)
    ) {
      continue;
    }

    if (STOP_WORDS.has(token) || /^\d+$/.test(token)) {
      continue;
    }

    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort(([leftTerm, leftCount], [rightTerm, rightCount]) => {
      return rightCount - leftCount || leftTerm.localeCompare(rightTerm);
    })
    .slice(0, MAX_KEYWORDS)
    .map(([term]) => term);
}

export type ResumeMatchResult = {
  matchedTerms: string[];
  termsToReview: string[];
  totalTerms: number;
};

export function analyzeResumeMatch(
  resumeText: string,
  jobDescription: string,
): ResumeMatchResult {
  const keywords = extractKeywords(jobDescription);

  if (keywords.length < 3) {
    throw new Error(
      "Add more detail to the job description so there are enough role-specific terms to compare.",
    );
  }

  const resumeTerms = new Set(tokenize(resumeText));
  const matchedTerms = keywords.filter((term) => resumeTerms.has(term));

  return {
    matchedTerms,
    termsToReview: keywords.filter((term) => !resumeTerms.has(term)),
    totalTerms: keywords.length,
  };
}
