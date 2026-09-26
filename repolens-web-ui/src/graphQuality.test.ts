import { describe, expect, it } from "vitest";
import { assessGraph } from "./graphQuality";

describe("graph quality", () => {
  it("warns on dangling relationships and dense clusters", () => {
    expect(assessGraph(
      [{ id: "a", label: "A", kind: "class", sourceEntityId: null }],
      [{ id: "e", fromNodeId: "a", toNodeId: "missing", type: "CALLS" }],
    ).some((note) => note.level === "warn")).toBe(true);
    const nodes = Array.from({ length: 8 }, (_, index) => ({
      id: `n${index}`,
      label: `N${index}`,
      kind: "class",
      sourceEntityId: null,
    }));
    const edges = nodes.flatMap((from) => nodes.map((to) => ({
      id: `${from.id}-${to.id}`,
      fromNodeId: from.id,
      toNodeId: to.id,
      type: "DEPENDS_ON",
    })));
    expect(assessGraph(nodes, edges).some((note) => note.message.startsWith("Dense cluster"))).toBe(true);
  });
});
