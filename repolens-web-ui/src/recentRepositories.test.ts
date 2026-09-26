import { describe, expect, it } from "vitest";
import {
  RECENT_LIMIT,
  normalizeRepositoryUrl,
  readRecent,
  rememberRepository,
  writeRecent,
} from "./recentRepositories";

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    fail: false,
  };
}

describe("recent repositories", () => {
  it("normalizes and dedupes, newest first, bounded", () => {
    expect(normalizeRepositoryUrl("https://github.com/octocat/Hello-World.git")).toBe(
      "https://github.com/octocat/Hello-World",
    );
    let list = rememberRepository([], {
      url: "https://github.com/octocat/Hello-World.git",
      analyzedAt: "2026-01-01T00:00:00.000Z",
    });
    list = rememberRepository(list, {
      url: "https://github.com/octocat/Spoon-Knife",
      analyzedAt: "2026-01-02T00:00:00.000Z",
    });
    list = rememberRepository(list, {
      url: "https://github.com/octocat/Hello-World",
      analyzedAt: "2026-01-03T00:00:00.000Z",
    });
    expect(list.map((item) => item.url)).toEqual([
      "https://github.com/octocat/Hello-World",
      "https://github.com/octocat/Spoon-Knife",
    ]);
    let many = [] as typeof list;
    for (let i = 0; i < RECENT_LIMIT + 3; i++) {
      many = rememberRepository(many, {
        url: `https://github.com/acme/repo-${i}`,
        analyzedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }
    expect(many).toHaveLength(RECENT_LIMIT);
    expect(many[0].name).toBe(`repo-${RECENT_LIMIT + 2}`);
  });

  it("recovers from malformed storage and storage failure", () => {
    const store = memory();
    store.setItem("repolens.recentRepositories", "{");
    expect(readRecent(store)).toEqual([]);
    store.setItem("repolens.recentRepositories", JSON.stringify([{ url: "nope" }]));
    expect(readRecent(store)).toEqual([]);
    const broken = {
      setItem() {
        throw new Error("quota");
      },
    };
    expect(writeRecent(broken, [])).toBe(false);
    expect(readRecent(null)).toEqual([]);
  });
});
