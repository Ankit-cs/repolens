export const TUTORIAL_VERSION = 1;
export const TUTORIAL_KEY = "repolens.tutorial";

export const TUTORIAL_STEPS = [
  {
    id: "repository",
    title: "Repository",
    body: "This area shows the analyzed repository and its metadata.",
    target: "repository",
  },
  {
    id: "tree",
    title: "Tree",
    body: "The tree lists modules and symbols found in the repository model.",
    target: "tree",
  },
  {
    id: "graph",
    title: "Graph",
    body: "The graph is a projection of relationships. Switch diagrams from the tabs above it.",
    target: "graph",
  },
  {
    id: "inspector",
    title: "Inspector",
    body: "Select a node or relationship to inspect the evidence behind it.",
    target: "inspector",
  },
  {
    id: "github",
    title: "GitHub source",
    body: "Double-click a source-backed node to open its file on GitHub when a revision and path are known.",
    target: "graph",
  },
] as const;

export type TutorialRecord = {
  version: number;
  completed: boolean;
  skipped: boolean;
};

export function readTutorial(storage: Pick<Storage, "getItem"> | null): TutorialRecord {
  const fresh = { version: TUTORIAL_VERSION, completed: false, skipped: false };
  if (!storage) {
    return fresh;
  }
  try {
    const raw = storage.getItem(TUTORIAL_KEY);
    if (!raw) {
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<TutorialRecord>;
    if (parsed.version !== TUTORIAL_VERSION) {
      return fresh;
    }
    return {
      version: TUTORIAL_VERSION,
      completed: parsed.completed === true,
      skipped: parsed.skipped === true,
    };
  } catch {
    return fresh;
  }
}

export function writeTutorial(storage: Pick<Storage, "setItem"> | null, record: TutorialRecord): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(TUTORIAL_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function shouldShowTutorial(record: TutorialRecord): boolean {
  return record.version === TUTORIAL_VERSION && !record.completed && !record.skipped;
}
