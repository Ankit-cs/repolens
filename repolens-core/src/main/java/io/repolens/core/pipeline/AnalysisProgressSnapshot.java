package io.repolens.core.pipeline;

import java.util.List;

/**
 * Immutable progress view safe to publish to a polling client.
 * {@code percent} is null until the pipeline knows its work units.
 */
public record AnalysisProgressSnapshot(
        Integer percent,
        String activeStageId,
        String activeLabel,
        boolean detailAvailable,
        String repositoryName,
        String sourceUrl,
        Integer fileCount,
        List<Stage> stages
) {
    public AnalysisProgressSnapshot {
        stages = stages == null ? List.of() : List.copyOf(stages);
    }

    public record Stage(String id, String label, String state) {
    }
}
