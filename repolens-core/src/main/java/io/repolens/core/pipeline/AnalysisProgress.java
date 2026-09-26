package io.repolens.core.pipeline;

/**
 * Binds a progress tracker to the analysis worker thread.
 * Absent tracker means CLI and tests keep the previous silent pipeline.
 */
public final class AnalysisProgress {

    private static final ThreadLocal<AnalysisProgressTracker> CURRENT = new ThreadLocal<>();

    private AnalysisProgress() {
    }

    public static void use(AnalysisProgressTracker tracker, Runnable work) {
        AnalysisProgressTracker previous = CURRENT.get();
        CURRENT.set(tracker);
        try {
            work.run();
        } finally {
            if (previous == null) {
                CURRENT.remove();
            } else {
                CURRENT.set(previous);
            }
        }
    }

    public static void beginFetch() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.beginFetch();
        }
    }

    public static void fetched(int files, java.util.List<AnalysisProgressTracker.NamedStage> analyzers, String name, String sourceUrl) {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.fetched(files, analyzers, name, sourceUrl);
        }
    }

    public static void sourceFileRead() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.sourceFileRead();
        }
    }

    public static void typeRelationshipsResolved() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.typeRelationshipsResolved();
        }
    }

    public static void structuralFileRead() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.structuralFileRead();
        }
    }

    public static void structuralFactsFinished() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.structuralFactsFinished();
        }
    }

    public static void documentationIndexed() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.documentationIndexed();
        }
    }

    public static void metadataCollected() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.metadataCollected();
        }
    }

    public static void analyzerFinished() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.analyzerFinished();
        }
    }

    public static void graphPrepared() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.graphPrepared();
        }
    }

    public static void diagramsProjected() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.diagramsProjected();
        }
    }

    public static void markFinished() {
        AnalysisProgressTracker tracker = CURRENT.get();
        if (tracker != null) {
            tracker.markFinished();
        }
    }
}
