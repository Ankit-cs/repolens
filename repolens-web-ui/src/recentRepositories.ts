const GITHUB = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;

export const RECENT_KEY = "repolens.recentRepositories";
export const RECENT_LIMIT = 12;

export type RecentRepository = {
  owner: string | null;
  name: string;
  url: string;
  lastAnalyzedAt: string;
};

export function normalizeRepositoryUrl(raw: string): string | null {
  const match = GITHUB.exec(raw.trim());
  if (!match) {
    return null;
  }
  return `https://github.com/${match[1]}/${match[2]}`;
}

export function rememberRepository(
  current: RecentRepository[],
  entry: { url: string; analyzedAt: string },
): RecentRepository[] {
  const url = normalizeRepositoryUrl(entry.url);
  if (!url) {
    return current.slice(0, RECENT_LIMIT);
  }
  const match = GITHUB.exec(url);
  const next: RecentRepository = {
    owner: match?.[1] ?? null,
    name: match?.[2] ?? url,
    url,
    lastAnalyzedAt: entry.analyzedAt,
  };
  return [next, ...current.filter((item) => normalizeRepositoryUrl(item.url) !== url)].slice(0, RECENT_LIMIT);
}

export function readRecent(storage: Pick<Storage, "getItem"> | null): RecentRepository[] {
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }
      const record = item as Partial<RecentRepository>;
      const url = typeof record.url === "string" ? normalizeRepositoryUrl(record.url) : null;
      if (!url || typeof record.name !== "string" || typeof record.lastAnalyzedAt !== "string") {
        return [];
      }
      return [{
        owner: typeof record.owner === "string" ? record.owner : null,
        name: record.name,
        url,
        lastAnalyzedAt: record.lastAnalyzedAt,
      }];
    }).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

export function writeRecent(storage: Pick<Storage, "setItem"> | null, entries: RecentRepository[]): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, RECENT_LIMIT)));
    return true;
  } catch {
    return false;
  }
}
