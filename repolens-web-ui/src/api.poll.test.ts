import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalysisFailedError, POLL_INTERVAL_MS, waitForResult } from "./api";

const resultBody = {
  schemaVersion: "1",
  repository: { id: "repo", name: "demo", origin: "remote", source: "https://github.com/octocat/Hello-World" },
  modelStats: { fileCount: 1, moduleCount: 1, symbolCount: 1, importCount: 0 },
  results: [],
  graph: { id: "g", nodes: [], edges: [] },
};

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("waitForResult", () => {
  it("polls every 400ms and stops after COMPLETED", async () => {
    expect(POLL_INTERVAL_MS).toBe(400);
    vi.useFakeTimers();
    let jobReads = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).endsWith("/result")) {
          return jsonResponse(resultBody);
        }
        jobReads += 1;
        return jsonResponse({
          id: "job-1",
          status: jobReads >= 3 ? "COMPLETED" : "RUNNING",
          source: "https://github.com/octocat/Hello-World",
          remote: true,
          error: null,
        });
      }),
    );

    const pending = waitForResult("job-1");
    await vi.waitFor(() => {
      if (jobReads < 1) {
        throw new Error("first poll has not started");
      }
    });
    await vi.advanceTimersByTimeAsync(399);
    expect(jobReads).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() => {
      if (jobReads < 2) {
        throw new Error("second poll has not started");
      }
    });
    await vi.advanceTimersByTimeAsync(400);
    const result = await pending;
    expect(result.repository.name).toBe("demo");
    expect(jobReads).toBe(3);
    await vi.advanceTimersByTimeAsync(2000);
    expect(jobReads).toBe(3);
  });

  it("stops polling when the analysis is aborted", async () => {
    vi.useFakeTimers();
    let jobReads = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        jobReads += 1;
        return jsonResponse({
          id: "job-1",
          status: "RUNNING",
          source: "https://github.com/octocat/Hello-World",
          remote: true,
          error: null,
        });
      }),
    );
    const controller = new AbortController();
    const pending = waitForResult("job-1", undefined, controller.signal);
    await vi.waitFor(() => {
      if (jobReads < 1) {
        throw new Error("first poll has not started");
      }
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    const stoppedAt = jobReads;
    await vi.advanceTimersByTimeAsync(2000);
    expect(jobReads).toBe(stoppedAt);
  });

  it("stops polling when the job FAILED and keeps the backend reason", async () => {
    vi.useFakeTimers();
    let jobReads = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        jobReads += 1;
        return jsonResponse({
          id: "job-1",
          status: "FAILED",
          source: "https://github.com/octocat/missing",
          remote: true,
          error: "repository not found",
        });
      }),
    );
    const pending = waitForResult("job-1");
    await expect(pending).rejects.toBeInstanceOf(AnalysisFailedError);
    await expect(pending).rejects.toMatchObject({ reason: "repository not found" });
    await vi.advanceTimersByTimeAsync(2000);
    expect(jobReads).toBe(1);
  });
});
