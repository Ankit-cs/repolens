# Roadmap

**Baseline:** `v1.9.0` (current release)

## Current

RepoLens is a Repository Intelligence Workspace built as a modular monolith. The current release includes structural analysis, evidence-backed Java and Python intelligence extractors, diagram projections, interactive graph exploration, CLI analysis, and a Web API/UI. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the current capability boundaries and limitations.

## Planned

Priorities are incremental; no release date or language-parity commitment is implied.

### Analysis depth

- Add richer node and entity details where the `RepositoryModel` contains supporting facts.
- Improve relationship extraction and static inference only where source evidence supports it; retain confidence/provenance and omit unsupported guesses.

### Graph and visualization

- Add graph export.
- Improve filtering, navigation, and usability on large repositories while preserving clear truncation and empty-result states.

### Language coverage

- Extend endpoint, test, and relationship extraction beyond the currently supported Java and Python patterns.
- Improve the existing partial JavaScript, TypeScript, Go, Rust, C#, and Kotlin profiles, prioritizing framework extractors consistent with [ADR-013](docs/adr/ADR-013-multi-language-intelligence-architecture.md).
- Keep language syntax and framework-specific extraction in `repolens-parse`; keep analyzers and consumers language-agnostic.

### Developer experience

- Improve clarity and consistency of CLI/Web analysis output and continue closing documentation gaps as capabilities change.

## Longer-term and optional

- Consider optional persistence for analysis jobs and local results. The current Web job store is in-memory; a database is not required by the core architecture.
- Improve remote clone freshness with an explicit refresh or age-based policy. Current cached working trees are reuse-only and may be stale.
- Explore optional AI-assisted explanations over structured RepoLens facts and results. AI must not replace parsing, primary relationship discovery, or deterministic analysis.

## Completed history

### v1.6.0

- Completed the focused structural extractors for JPA, Spring, calls, activity, state, deployment, and configuration signals.
- Completed Architecture, Package, Class, Sequence, ER, DFD, Activity, Deployment, Use Case, and State Machine projections.
- Completed client-side graph filtering and the v1.6 analysis-quality and UI-reliability work.

### Foundation

- Established the modular monolith, Gradle modules, ADRs, ports, and `RepositoryModel` as the central contract.
- Delivered local and supported public GitHub ingestion with safety limits, language profiles with Tree-sitter/fallback parsing, core analyzers, CLI, Web API, and interactive graph UI.

## Architecture constraints

- Keep RepoLens a modular monolith; do not introduce microservices or Kubernetes.
- Keep `RepositoryModel` as the central contract and CLI/Web as thin adapters.
- Do not move language-specific parsing into the model or analyzer layers.
- Do not require a database for core analysis. Keep AI optional and downstream of deterministic, structured analysis.
