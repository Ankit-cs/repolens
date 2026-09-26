const GITHUB = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;

/**
 * Builds a GitHub blob URL only when origin, revision, and path are all known.
 * Does not guess a branch.
 */
export function githubBlobUrl(input: {
  source: string | null | undefined;
  revision: string | null | undefined;
  filePath: string | null | undefined;
  startLine?: number | null;
}): string | null {
  const parsed = GITHUB.exec((input.source ?? "").trim());
  const revision = input.revision?.trim() ?? "";
  const filePath = normalizePath(input.filePath);
  if (!parsed || !revision || !filePath) {
    return null;
  }
  if (revision.includes("..") || /[\s?#/]/.test(revision)) {
    return null;
  }
  const line = input.startLine && input.startLine > 0 ? `#L${input.startLine}` : "";
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${parsed[1]}/${parsed[2]}/blob/${encodeURIComponent(revision)}/${encodedPath}${line}`;
}

function normalizePath(filePath: string | null | undefined): string | null {
  if (!filePath) {
    return null;
  }
  const path = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!path || path.split("/").some((part) => part === ".." || part.length === 0)) {
    return null;
  }
  return path;
}
