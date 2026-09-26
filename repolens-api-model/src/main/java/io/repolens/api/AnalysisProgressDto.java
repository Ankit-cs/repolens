package io.repolens.api;

import io.repolens.core.pipeline.AnalysisProgressSnapshot;

import java.util.List;

/**
 * Job progress published by the analysis worker. Percent is null until work units are known.
 */
public record AnalysisProgressDto(
        Integer percent,
        String activeStageId,
        String activeLabel,
        boolean detailAvailable,
        String repositoryName,
        String sourceUrl,
        Integer fileCount,
        List<StageDto> stages
) {
    public AnalysisProgressDto {
        stages = stages == null ? List.of() : List.copyOf(stages);
    }

    public static AnalysisProgressDto from(AnalysisProgressSnapshot snapshot) {
        if (snapshot == null) {
            return null;
        }
        return new AnalysisProgressDto(
                snapshot.percent(),
                snapshot.activeStageId(),
                snapshot.activeLabel(),
                snapshot.detailAvailable(),
                snapshot.repositoryName(),
                snapshot.sourceUrl(),
                snapshot.fileCount(),
                snapshot.stages().stream()
                        .map(stage -> new StageDto(stage.id(), stage.label(), stage.state()))
                        .toList()
        );
    }

    public record StageDto(String id, String label, String state) {
    }
}
