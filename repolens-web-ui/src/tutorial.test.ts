import { describe, expect, it } from "vitest";
import {
  TUTORIAL_STEPS,
  TUTORIAL_VERSION,
  readTutorial,
  shouldShowTutorial,
  writeTutorial,
} from "./tutorial";

describe("tutorial persistence", () => {
  it("shows once per version and can be skipped or completed", () => {
    expect(TUTORIAL_STEPS).toHaveLength(5);
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
    expect(shouldShowTutorial(readTutorial(storage))).toBe(true);
    writeTutorial(storage, { version: TUTORIAL_VERSION, completed: false, skipped: true });
    expect(shouldShowTutorial(readTutorial(storage))).toBe(false);
    writeTutorial(storage, { version: TUTORIAL_VERSION + 1, completed: true, skipped: true });
    expect(shouldShowTutorial(readTutorial(storage))).toBe(true);
  });

  it("ignores corrupt storage", () => {
    expect(shouldShowTutorial(readTutorial({
      getItem: () => "{",
    }))).toBe(true);
  });
});
