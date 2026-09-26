package io.repolens.core.pipeline;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnalysisProgressTrackerTest {

    @Test
    void percentStaysUnknownUntilWorkUnitsExistAndReaches100OnlyWhenFinished() {
        AtomicReference<AnalysisProgressSnapshot> latest = new AtomicReference<>();
        AnalysisProgressTracker tracker = new AnalysisProgressTracker(latest::set);
        tracker.beginFetch();
        assertNull(latest.get().percent());
        assertEquals("fetch", latest.get().activeStageId());

        tracker.fetched(2, List.of(new AnalysisProgressTracker.NamedStage("structure", "Structure summarized")), "demo", "https://github.com/acme/demo");
        assertTrue(latest.get().detailAvailable());
        assertTrue(latest.get().percent() < 100);
        assertEquals("demo", latest.get().repositoryName());

        tracker.sourceFileRead();
        tracker.sourceFileRead();
        int afterFiles = latest.get().percent();
        tracker.typeRelationshipsResolved();
        tracker.structuralFactsFinished();
        tracker.documentationIndexed();
        tracker.metadataCollected();
        tracker.analyzerFinished();
        tracker.graphPrepared();
        tracker.diagramsProjected();
        assertTrue(latest.get().percent() > afterFiles);
        assertTrue(latest.get().percent() < 100);

        tracker.markFinished();
        assertEquals(100, latest.get().percent());
        assertTrue(latest.get().stages().stream().allMatch(stage -> "complete".equals(stage.state())));
    }

    @Test
    void failureDoesNotResetTheLastPercent() {
        AtomicReference<AnalysisProgressSnapshot> latest = new AtomicReference<>();
        AnalysisProgressTracker tracker = new AnalysisProgressTracker(latest::set);
        tracker.fetched(1, List.of(), "demo", "https://github.com/acme/demo");
        tracker.sourceFileRead();
        AnalysisProgressSnapshot frozen = latest.get();
        assertTrue(frozen.percent() != null && frozen.percent() > 0 && frozen.percent() < 100);
        assertEquals(frozen.percent(), latest.get().percent());
        assertEquals("complete", frozen.stages().stream().filter(stage -> "source".equals(stage.id())).findFirst().orElseThrow().state());
    }
}
