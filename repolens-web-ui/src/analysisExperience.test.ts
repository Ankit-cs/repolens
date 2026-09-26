import { describe, expect, it } from "vitest";
import {
  EMPTY_SOURCE_MESSAGE,
  INVALID_URL_MESSAGE,
  LONG_RUNNING_AFTER_MS,
  MISSING_FAILURE_REASON,
  analysisFacts,
  analysisStatusCopy,
  failureReason,
  isCurrentAnalysis,
  isLongRunning,
  longRunningNotice,
  validateRepositorySource,
} from "./analysisExperience";

describe("repository input", () => {
  it("rejects empty input", () => {
    expect(validateRepositorySource("")).toEqual({ ok: false, message: EMPTY_SOURCE_MESSAGE });
    expect(validateRepositorySource("   ")).toEqual({ ok: false, message: EMPTY_SOURCE_MESSAGE });
  });

  it("rejects an invalid remote URL", () => {
    expect(validateRepositorySource("https://gitlab.com/acme/demo")).toEqual({
      ok: false,
      message: INVALID_URL_MESSAGE,
    });
    expect(validateRepositorySource("https://github.com/only-owner")).toEqual({
      ok: false,
      message: INVALID_URL_MESSAGE,
    });
    expect(validateRepositorySource("git@github.com:acme/demo.git")).toEqual({
      ok: false,
      message: INVALID_URL_MESSAGE,
    });
  });

  it("accepts a public GitHub HTTPS URL and a local path", () => {
    expect(validateRepositorySource("  https://github.com/octocat/Hello-World.git  ")).toEqual({
      ok: true,
      source: "https://github.com/octocat/Hello-World.git",
    });
    expect(validateRepositorySource("C:\\src\\demo")).toEqual({
      ok: true,
      source: "C:\\src\\demo",
    });
  });
});

describe("analysis status copy", () => {
  it("describes QUEUED without a fake stage", () => {
    expect(analysisStatusCopy("QUEUED")).toEqual({
      title: "Preparing repository analysis",
      detail: "RepoLens is waiting for the analysis worker to begin.",
    });
    expect(analysisStatusCopy(null).title).toBe("Preparing repository analysis");
  });

  it("describes RUNNING from the job status", () => {
    expect(analysisStatusCopy("RUNNING")).toEqual({
      title: "Analyzing repository",
      detail: "RepoLens is analyzing the repository structure and building its repository model.",
    });
  });

  it("does not invent a progress percentage", () => {
    const copy = `${analysisStatusCopy("QUEUED").detail} ${analysisStatusCopy("RUNNING").detail}`;
    expect(copy).not.toMatch(/%/);
    expect(copy).not.toContain("Building relationships");
    expect(copy).not.toContain("Detecting tests");
  });
});

describe("known analysis facts", () => {
  it("omits statistics the API has not provided", () => {
    expect(analysisFacts({ source: "https://github.com/octocat/Hello-World" })).toEqual([
      { label: "URL", value: "https://github.com/octocat/Hello-World" },
    ]);
  });

  it("shows repository stats only when they are present", () => {
    expect(
      analysisFacts({
        repositoryName: "Hello-World",
        source: "https://github.com/octocat/Hello-World",
        fileCount: 12,
        moduleCount: 2,
        symbolCount: 40,
        importCount: 0,
        sizeBytes: 2048,
      }),
    ).toEqual([
      { label: "Repository", value: "Hello-World" },
      { label: "URL", value: "https://github.com/octocat/Hello-World" },
      { label: "Files", value: "12" },
      { label: "Modules", value: "2" },
      { label: "Symbols", value: "40" },
      { label: "Imports", value: "0" },
      { label: "Size", value: "2 KB" },
    ]);
  });
});

describe("long-running analysis", () => {
  it("stays quiet before the elapsed threshold", () => {
    expect(isLongRunning(LONG_RUNNING_AFTER_MS - 1)).toBe(false);
    expect(isLongRunning(LONG_RUNNING_AFTER_MS)).toBe(true);
  });

  it("explains the wait without claiming a backend stage", () => {
    const notice = longRunningNotice(null);
    expect(notice.title).toBe("Analysis is taking longer than usual.");
    expect(notice.detail).toBe(
      "RepoLens is still processing the repository. Larger repositories may require more time.",
    );
    expect(notice.detail).not.toContain("Building relationships");
  });

  it("includes repository size only when it is known", () => {
    expect(longRunningNotice(5_242_880).detail).toContain("Repository size: 5 MB.");
  });
});

describe("failure reasons", () => {
  it("uses the backend message", () => {
    expect(failureReason("repository not found")).toBe("repository not found");
  });

  it("says when the backend did not provide a reason", () => {
    expect(failureReason(null)).toBe(MISSING_FAILURE_REASON);
    expect(failureReason("   ")).toBe(MISSING_FAILURE_REASON);
  });

  it("does not surface a stack trace as the reason", () => {
    expect(failureReason("clone failed\n    at GitRemoteCloner.clone (Git.java:20)")).toBe(
      "clone failed",
    );
  });
});

describe("analysis generation", () => {
  it("ignores a completed job from an older analysis", () => {
    expect(isCurrentAnalysis(2, 1)).toBe(false);
    expect(isCurrentAnalysis(2, 2)).toBe(true);
  });
});
