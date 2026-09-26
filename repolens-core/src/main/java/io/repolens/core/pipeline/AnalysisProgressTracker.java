package io.repolens.core.pipeline;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;

/**
 * Stage progress for one analysis job. Percent is completed work units over
 * units that already exist in the pipeline (files and analyzer passes), not elapsed time.
 * 100 is published only when the job finishes successfully.
 */
public final class AnalysisProgressTracker {

    private final Consumer<AnalysisProgressSnapshot> publish;
    private int fileCount = -1;
    private int analyzerCount = -1;
    private int filesRead;
    private int factsRead;
    private int analyzersDone;
    private boolean fetchDone;
    private boolean sourceDone;
    private boolean typesDone;
    private boolean factsDone;
    private boolean docsDone;
    private boolean metadataDone;
    private boolean graphDone;
    private boolean diagramsDone;
    private boolean finished;
    private String repositoryName;
    private String sourceUrl;
    private final List<NamedStage> analyzers = new ArrayList<>();

    public AnalysisProgressTracker(Consumer<AnalysisProgressSnapshot> publish) {
        this.publish = Objects.requireNonNull(publish, "publish");
    }

    public void beginFetch() {
        emit();
    }

    public void fetched(int files, List<NamedStage> analyzerStages, String repositoryName, String sourceUrl) {
        this.fileCount = Math.max(0, files);
        this.analyzers.clear();
        if (analyzerStages != null) {
            this.analyzers.addAll(analyzerStages);
        }
        this.analyzerCount = this.analyzers.size();
        this.fetchDone = true;
        this.repositoryName = blankToNull(repositoryName);
        this.sourceUrl = blankToNull(sourceUrl);
        if (this.fileCount == 0) {
            this.filesRead = fileWeight();
            this.sourceDone = true;
            this.factsRead = fileWeight();
            this.factsDone = true;
        }
        emit();
    }

    public void sourceFileRead() {
        if (sourceDone || fileCount < 0) {
            return;
        }
        if (filesRead < fileCount) {
            filesRead++;
        }
        if (filesRead >= fileCount) {
            sourceDone = true;
        }
        emit();
    }

    public void typeRelationshipsResolved() {
        typesDone = true;
        emit();
    }

    public void structuralFileRead() {
        if (factsDone || fileCount < 0) {
            return;
        }
        if (factsRead < fileCount) {
            factsRead++;
        }
        emit();
    }

    public void structuralFactsFinished() {
        factsDone = true;
        if (fileCount >= 0) {
            factsRead = fileWeight();
        }
        emit();
    }

    public void documentationIndexed() {
        docsDone = true;
        emit();
    }

    public void metadataCollected() {
        metadataDone = true;
        emit();
    }

    public void analyzerFinished() {
        if (analyzerCount >= 0 && analyzersDone < analyzerCount) {
            analyzersDone++;
        }
        emit();
    }

    public void graphPrepared() {
        graphDone = true;
        emit();
    }

    public void diagramsProjected() {
        diagramsDone = true;
        emit();
    }

    public void markFinished() {
        finished = true;
        fetchDone = true;
        sourceDone = true;
        typesDone = true;
        factsDone = true;
        docsDone = true;
        metadataDone = true;
        graphDone = true;
        diagramsDone = true;
        if (fileCount < 0) {
            fileCount = 0;
        }
        if (analyzerCount < 0) {
            analyzerCount = analyzers.size();
        }
        filesRead = fileWeight();
        factsRead = fileWeight();
        analyzersDone = Math.max(analyzerCount, 0);
        emit();
    }

    public AnalysisProgressSnapshot snapshot() {
        return build();
    }

    private void emit() {
        publish.accept(build());
    }

    private AnalysisProgressSnapshot build() {
        boolean detail = fileCount >= 0;
        List<AnalysisProgressSnapshot.Stage> stages = new ArrayList<>();
        boolean priorOpen = false;
        priorOpen = addStage(stages, priorOpen, "fetch", "Repository fetched", fetchDone, !fetchDone);
        priorOpen = addStage(stages, priorOpen, "source", "Source files read", sourceDone, fetchDone && !sourceDone);
        priorOpen = addStage(stages, priorOpen, "symbols", "Symbols and imports extracted", sourceDone, false);
        priorOpen = addStage(stages, priorOpen, "types", "Type relationships resolved", typesDone, sourceDone && !typesDone);
        priorOpen = addStage(stages, priorOpen, "facts", "Structural facts extracted", factsDone, typesDone && !factsDone);
        priorOpen = addStage(stages, priorOpen, "docs", "Documentation indexed", docsDone, factsDone && !docsDone);
        priorOpen = addStage(stages, priorOpen, "metadata", "Repository metadata collected", metadataDone, docsDone && !metadataDone);
        for (int i = 0; i < analyzers.size(); i++) {
            NamedStage analyzer = analyzers.get(i);
            boolean complete = analyzersDone > i;
            boolean active = metadataDone && !complete && analyzersDone == i;
            priorOpen = addStage(stages, priorOpen, analyzer.id(), analyzer.label(), complete, active);
        }
        priorOpen = addStage(stages, priorOpen, "graph", "Repository graph prepared", graphDone, analyzersComplete() && !graphDone);
        addStage(stages, priorOpen, "diagrams", "Diagrams projected", diagramsDone, graphDone && !diagramsDone);
        String activeId = null;
        String activeLabel = null;
        for (AnalysisProgressSnapshot.Stage stage : stages) {
            if ("active".equals(stage.state())) {
                activeId = stage.id();
                activeLabel = stage.label();
                break;
            }
        }
        Integer percent;
        if (finished) {
            percent = 100;
        } else if (!detail) {
            percent = null;
        } else {
            percent = Math.min(99, (int) Math.floor(doneUnits() * 100.0 / totalUnits()));
        }
        return new AnalysisProgressSnapshot(
                percent,
                activeId,
                activeLabel,
                detail,
                repositoryName,
                sourceUrl,
                fileCount >= 0 ? fileCount : null,
                List.copyOf(stages)
        );
    }

    private boolean analyzersComplete() {
        return metadataDone && analyzerCount >= 0 && analyzersDone >= analyzerCount;
    }

    private boolean addStage(
            List<AnalysisProgressSnapshot.Stage> stages,
            boolean priorOpen,
            String id,
            String label,
            boolean complete,
            boolean active
    ) {
        if (priorOpen) {
            complete = false;
            active = false;
        }
        AnalysisProgressSnapshot.Stage stage = stage(id, label, complete, active);
        stages.add(stage);
        return priorOpen || !"complete".equals(stage.state());
    }

    private AnalysisProgressSnapshot.Stage stage(String id, String label, boolean complete, boolean active) {
        String state = complete ? "complete" : active ? "active" : "pending";
        return new AnalysisProgressSnapshot.Stage(id, label, state);
    }

    private int fileWeight() {
        return Math.max(fileCount, 1);
    }

    private int totalUnits() {
        int analyzersWeight = Math.max(analyzerCount, 0);
        return 1 + fileWeight() + 1 + fileWeight() + 1 + 1 + analyzersWeight + 1 + 1;
    }

    private int doneUnits() {
        int done = 0;
        if (fetchDone) {
            done += 1;
        }
        done += sourceDone ? fileWeight() : Math.min(filesRead, fileWeight());
        if (typesDone) {
            done += 1;
        }
        done += factsDone ? fileWeight() : Math.min(factsRead, fileWeight());
        if (docsDone) {
            done += 1;
        }
        if (metadataDone) {
            done += 1;
        }
        done += analyzersDone;
        if (graphDone) {
            done += 1;
        }
        if (diagramsDone) {
            done += 1;
        }
        return done;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    public record NamedStage(String id, String label) {
        public NamedStage {
            Objects.requireNonNull(id, "id");
            Objects.requireNonNull(label, "label");
        }
    }
}
