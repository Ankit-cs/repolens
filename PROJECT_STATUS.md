# Project Status

**Date:** 2026-10-06
**Phase:** Repository Intelligence Workspace
**Version:** `v1.9.0` (current release)

## Current state

RepoLens statically analyzes local repositories and supported public GitHub repositories, then presents evidence-backed structure and relationships through the CLI, Web API, and interactive Web UI. `RepositoryModel` remains the shared contract between parsing, analysis, and those adapters.

## Shipped capabilities

- Repository inventory and metadata from local Git and, when available, the public GitHub API. Metadata lookup failures do not block analysis.
- Structural profiles for Java, JavaScript, TypeScript, Python, Go, Rust, C#, and Kotlin. Profiles contribute packages/modules, symbols, imports, and resolvable dependency relationships; all are partial rather than full-language implementations.
- Java extraction for classes, methods, fields, `EXTENDS` / `IMPLEMENTS`, heuristic `CALLS`, Spring endpoints, Java tests, JPA/entity facts, and supported configuration signals.
- Python extraction for Flask and FastAPI endpoint declarations and supported pytest/unittest test patterns. Extractors emit only facts they can establish; Python `CALLS` are not currently extracted.
- Test-to-subject relationships, static traces, and impact views composed from available facts and relationships. These are evidence-limited static results, not runtime traces or test coverage.
- Documentation indexing for repository Markdown, including `README` and `docs/`, deterministic entity matching, and documentation excerpts in the inspector.
- Architecture, Package, Class, Sequence, ER, DFD, Activity, Deployment, Use Case, and State Machine diagram projections. Views may be empty when source evidence is absent.
- CLI analysis with human-readable and JSON output, plus a Javalin Web API and packaged React/Cytoscape UI for interactive graph exploration, filtering, and inspection.
- Graceful degradation: Tree-sitter is used when available and structural fallback is available otherwise; unsupported constructs are omitted, metadata failures are non-blocking, and oversized files are skipped with warnings.
- Configured ingestion and projection limits bound repository size, file count, depth, extracted facts, and displayed graph size. Truncated diagram views report that they are capped.

## Language support

Language support is structural and partial for all eight profiles listed above. Java currently has the broadest specialized extraction. Python has the Flask/FastAPI endpoint and Python test extractors described above. Java is currently the only profile that extracts inheritance and `CALLS` relationships; other profiles do not provide those edges. Package-manager manifests and external dependency graphs are not ingested.

See [LANGUAGE_SUPPORT.md](docs/architecture/LANGUAGE_SUPPORT.md) for structural profile details. Framework-specific intelligence remains narrower than general structural parsing; an empty result is not proof that a repository has no endpoints, tests, or relationships.

## Current limitations

- Analysis is static: `CALLS` are heuristic, sequence views are not runtime execution, and arbitrary control flow is not fully reconstructed.
- Framework and language coverage is incomplete. Java/Python extractors cover selected patterns; other languages may contribute structure without endpoint or test facts.
- Large repositories and graph projections are subject to configured limits. Specialized views can be empty when no supported evidence is found.
- Remote analysis is limited to supported public GitHub HTTPS repositories. The remote clone cache is reused without fetching updates, so cached contents may be stale.
- Web analysis jobs are held in memory and are not durable across process restarts. CLI analysis runs synchronously.
- AI explanations are not implemented. The accepted architecture keeps any future explanation provider optional and downstream of structured RepoLens analysis.
