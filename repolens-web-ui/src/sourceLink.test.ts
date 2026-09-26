import { describe, expect, it } from "vitest";
import { githubBlobUrl } from "./sourceLink";

describe("githubBlobUrl", () => {
  it("uses the analyzed revision, path, and line", () => {
    expect(githubBlobUrl({
      source: "https://github.com/octocat/Hello-World.git",
      revision: "abc123",
      filePath: "src/App.java",
      startLine: 12,
    })).toBe("https://github.com/octocat/Hello-World/blob/abc123/src/App.java#L12");
  });

  it("does not invent a URL when revision or path is missing", () => {
    expect(githubBlobUrl({
      source: "https://github.com/octocat/Hello-World",
      revision: null,
      filePath: "README",
    })).toBeNull();
    expect(githubBlobUrl({
      source: "https://github.com/octocat/Hello-World",
      revision: "abc",
      filePath: "../secrets",
    })).toBeNull();
    expect(githubBlobUrl({
      source: "https://gitlab.com/acme/demo",
      revision: "abc",
      filePath: "README",
    })).toBeNull();
  });
});
