import type { GraphEdge, GraphNode } from "./api";

export type GraphQualityNote = {
  level: "ok" | "warn";
  message: string;
};

/** Lightweight checks for QA. Does not invent missing relationships. */
export function assessGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphQualityNote[] {
  const notes: GraphQualityNote[] = [];
  const ids = new Set(nodes.map((node) => node.id));
  const invalid = edges.filter((edge) => !ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId));
  if (nodes.length > 0 && invalid.length === 0) {
    notes.push({ level: "ok", message: "Relationship endpoints match graph nodes." });
  }
  if (invalid.length > 0) {
    notes.push({ level: "warn", message: `${invalid.length} relationships point at missing nodes.` });
  }
  if (nodes.length >= 8 && edges.length > nodes.length * 3) {
    notes.push({ level: "warn", message: "Dense cluster: many relationships for the number of nodes." });
  }
  return notes;
}
