import { formatBytes } from "./format";

/** Frontend-only elapsed threshold. The job API has no progress percentage. */
export const LONG_RUNNING_AFTER_MS = 20_000;

export const EMPTY_SOURCE_MESSAGE = "Enter a GitHub repository URL.";
export const INVALID_URL_MESSAGE = "Only https://github.com/owner/repo URLs are supported.";
export const MISSING_FAILURE_REASON = "The analysis job failed without a detailed reason.";

const GITHUB_HTTPS =
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;

export type SourceValidation =
  | { ok: true; source: string }
  | { ok: false; message: string };

export type JobPhase = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export type AnalysisFact = {
  label: string;
  value: string;
};

export function validateRepositorySource(raw: string): SourceValidation {
  const source = raw.trim();
  if (!source) {
    return { ok: false, message: EMPTY_SOURCE_MESSAGE };
  }
  const lower = source.toLowerCase();
  const remote =
    lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("git@");
  if (!remote) {
    return { ok: true, source };
  }
  if (GITHUB_HTTPS.test(source)) {
    return { ok: true, source };
  }
  return { ok: false, message: INVALID_URL_MESSAGE };
}

/** True when a poll or completion belongs to the analysis the UI is still showing. */
export function isCurrentAnalysis(activeGeneration: number, eventGeneration: number): boolean {
  return activeGeneration === eventGeneration;
}

export function analysisStatusCopy(status: JobPhase | null): { title: string; detail: string } {
  if (status === "RUNNING" || status === "COMPLETED") {
    return {
      title: "Analyzing repository",
      detail: "RepoLens is analyzing the repository structure and building its repository model.",
    };
  }
  return {
    title: "Preparing repository analysis",
    detail: "RepoLens is waiting for the analysis worker to begin.",
  };
}

export function isLongRunning(elapsedMs: number, thresholdMs = LONG_RUNNING_AFTER_MS): boolean {
  return Number.isFinite(elapsedMs) && elapsedMs >= thresholdMs;
}

export function longRunningNotice(sizeBytes?: number | null): { title: string; detail: string } {
  const size = formatBytes(sizeBytes);
  const detail = size
    ? `RepoLens is still processing the repository. Larger repositories may require more time. Repository size: ${size}.`
    : "RepoLens is still processing the repository. Larger repositories may require more time.";
  return {
    title: "Analysis is taking longer than usual.",
    detail,
  };
}

/**
 * Rows for values the API (or the submitted source) has actually provided.
 * Missing stats are omitted.
 */
export function analysisFacts(input: {
  source?: string | null;
  repositoryName?: string | null;
  fileCount?: number | null;
  moduleCount?: number | null;
  symbolCount?: number | null;
  importCount?: number | null;
  sizeBytes?: number | null;
}): AnalysisFact[] {
  const facts: AnalysisFact[] = [];
  const name = input.repositoryName?.trim();
  if (name) {
    facts.push({ label: "Repository", value: name });
  }
  const source = input.source?.trim();
  if (source) {
    facts.push({ label: "URL", value: source });
  }
  pushCount(facts, "Files", input.fileCount);
  pushCount(facts, "Modules", input.moduleCount);
  pushCount(facts, "Symbols", input.symbolCount);
  pushCount(facts, "Imports", input.importCount);
  const size = formatBytes(input.sizeBytes);
  if (size) {
    facts.push({ label: "Size", value: size });
  }
  return facts;
}

export function failureReason(raw: string | null | undefined): string {
  if (raw == null) {
    return MISSING_FAILURE_REASON;
  }
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^at\s+/.test(line));
  if (lines.length === 0) {
    return MISSING_FAILURE_REASON;
  }
  return lines[0];
}

export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function pushCount(facts: AnalysisFact[], label: string, value: number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    facts.push({ label, value: String(value) });
  }
}
