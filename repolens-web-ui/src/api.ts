export type GraphNode = {
  id: string;
  label: string;
  kind: string;
  sourceEntityId: string | null;
};

export type GraphEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: string;
};

export type DocumentationSection = {
  id: string;
  heading: string;
  text: string;
  startLine: number;
};

export type DocumentationRef = {
  id: string;
  sectionId: string;
  entityId: string;
  matchedText: string;
};

export type DocumentationEntry = {
  id: string;
  path: string;
  title: string;
  sections: DocumentationSection[];
  references: DocumentationRef[];
};

export type SymbolDetail = {
  id: string;
  name: string;
  kind: string;
  moduleId: string | null;
  moduleName: string | null;
  filePath: string | null;
  parentSymbolId: string | null;
  fieldNames: string[];
  methodNames: string[];
  startLine?: number;
};

export type RepositoryMetadata = {
  name?: string | null;
  owner?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
  firstCommitAt?: string | null;
  defaultBranch?: string | null;
  lastCommit?: {
    sha?: string | null;
    message?: string | null;
    author?: string | null;
    authoredAt?: string | null;
    committedAt?: string | null;
  } | null;
  commitCount?: number | null;
};

export type DiagramView = {
  type: string;
  title: string;
  graph: {
    id: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  emptyMessage?: string | null;
  advisoryMessage?: string | null;
  totalNodeCount?: number;
  truncated?: boolean;
};

export type AnalysisResponse = {
  schemaVersion: string;
  repository: {
    id: string;
    name: string;
    origin: string;
    source: string;
  };
  modelStats: {
    fileCount: number;
    moduleCount: number;
    symbolCount: number;
    importCount: number;
    relationshipCount: number;
  };
  results: Array<{
    analyzerId: string;
    summary: string;
    metrics: Array<{ name: string; value: number; unit: string | null; scopeId: string | null }>;
    findings: Array<{ id: string; severity: string; message: string; subjectId: string | null }>;
  }>;
  graph: {
    id: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  documentation?: DocumentationEntry[];
  symbols?: SymbolDetail[];
  metadata?: RepositoryMetadata | null;
  diagrams?: DiagramView[];
  endpoints?: EndpointRecord[];
  tests?: TestRecord[];
  traces?: TraceRecord[];
};

export type SourceLocationRecord = {
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export type EvidenceRecord = {
  inferenceMethod: string;
  location?: SourceLocationRecord | null;
  referencedId?: string | null;
  summary?: string | null;
};

export type EndpointRecord = {
  id: string;
  httpMethod: string;
  path: string;
  ownerTypeId?: string | null;
  handlerMethodId?: string | null;
  location: SourceLocationRecord;
  evidence: EvidenceRecord;
};

export type TestRecord = {
  id: string;
  symbolId: string;
  frameworkHint?: string | null;
  location: SourceLocationRecord;
  evidence: EvidenceRecord;
};

export type TraceHopRecord = {
  entityId: string;
  role: string;
  relationshipId?: string | null;
  evidence: EvidenceRecord;
  confidence: number;
  resolved: boolean;
};

export type TraceRecord = {
  id: string;
  endpointId: string;
  hops: TraceHopRecord[];
  confidence: number;
  unresolved: boolean;
  inferenceKind: string;
};

export function analysisEndpoints(result: AnalysisResponse): EndpointRecord[] {
  return result.endpoints ?? [];
}

export function analysisTests(result: AnalysisResponse): TestRecord[] {
  return result.tests ?? [];
}

export function analysisTraces(result: AnalysisResponse): TraceRecord[] {
  return result.traces ?? [];
}

export function oversizedSkipWarning(result: AnalysisResponse): string | null {
  const ingest = result.results.find((item) => item.analyzerId === "ingest");
  const warning = ingest?.findings.find((finding) => finding.severity === "warning");
  return warning?.message ?? ingest?.summary ?? null;
}

export function metadataWarning(result: AnalysisResponse): string | null {
  const meta = result.results.find((item) => item.analyzerId === "metadata");
  const warning = meta?.findings.find((finding) => finding.severity === "warning");
  return warning?.message ?? null;
}

export function docsForEntity(
  result: AnalysisResponse,
  entityId: string | null | undefined,
): Array<{
  path: string;
  heading: string;
  text: string;
  matchedText: string;
}> {
  if (!entityId || !result.documentation) {
    return [];
  }
  const hits: Array<{ path: string; heading: string; text: string; matchedText: string }> = [];
  for (const doc of result.documentation) {
    for (const ref of doc.references) {
      if (ref.entityId !== entityId) {
        continue;
      }
      const section = doc.sections.find((item) => item.id === ref.sectionId);
      if (!section) {
        continue;
      }
      hits.push({
        path: doc.path,
        heading: section.heading,
        text: section.text,
        matchedText: ref.matchedText,
      });
    }
  }
  return hits;
}

export function symbolDetailForNode(
  result: AnalysisResponse,
  node: GraphNode | null,
): SymbolDetail | null {
  if (!node?.sourceEntityId || !result.symbols) {
    return null;
  }
  return result.symbols.find((symbol) => symbol.id === node.sourceEntityId) ?? null;
}

export type AnalysisStage = {
  id: string;
  label: string;
  state: "pending" | "active" | "complete";
};

export type AnalysisProgress = {
  percent: number | null;
  activeStageId: string | null;
  activeLabel: string | null;
  detailAvailable: boolean;
  repositoryName?: string | null;
  sourceUrl?: string | null;
  fileCount?: number | null;
  stages: AnalysisStage[];
};

export type JobStatus = {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  source: string;
  remote: boolean;
  error: string | null;
  progress?: AnalysisProgress | null;
};

function looksRemote(source: string): boolean {
  const value = source.trim().toLowerCase();
  return value.startsWith("https://") || value.startsWith("git@");
}

/** Status poll interval. Job state is QUEUED, RUNNING, COMPLETED, or FAILED. */
export const POLL_INTERVAL_MS = 400;

export class AnalysisFailedError extends Error {
  readonly reason: string | null;

  constructor(reason: string | null) {
    super(reason && reason.trim() ? reason : "Analysis failed");
    this.name = "AnalysisFailedError";
    this.reason = reason && reason.trim() ? reason : null;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function startAnalysis(source: string, signal?: AbortSignal): Promise<JobStatus> {
  const response = await fetch("/v1/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: source.trim(), remote: looksRemote(source) }),
    signal,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to start analysis");
  }
  return body as JobStatus;
}

export async function getJob(id: string, signal?: AbortSignal): Promise<JobStatus> {
  const response = await fetch(`/v1/jobs/${id}`, { signal });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to load job");
  }
  return body as JobStatus;
}

export async function getResult(id: string, signal?: AbortSignal): Promise<AnalysisResponse> {
  const response = await fetch(`/v1/jobs/${id}/result`, { signal });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to load result");
  }
  return body as AnalysisResponse;
}

export async function waitForResult(
  id: string,
  onStatus?: (status: JobStatus) => void,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  for (;;) {
    throwIfAborted(signal);
    const job = await getJob(id, signal);
    throwIfAborted(signal);
    onStatus?.(job);
    if (job.status === "COMPLETED") {
      return getResult(id, signal);
    }
    if (job.status === "FAILED") {
      throw new AnalysisFailedError(job.error);
    }
    await delay(POLL_INTERVAL_MS, signal);
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw signal.reason instanceof Error ? signal.reason : abortError();
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : abortError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason instanceof Error ? signal.reason : abortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function abortError(): Error {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}
