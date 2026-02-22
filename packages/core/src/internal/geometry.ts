import type { GenerationSnapshot, Rect, Segment, StepLog } from "../public/types";
import type { Graph } from "./graph";

export function graphToRects(graph: Graph): Rect[] {
  return graph.faces
    .filter((f) => f.active)
    .map((f) => ({ left: f.leftX, top: f.topY, right: f.rightX, bottom: f.bottomY }));
}

export function graphToSegments(graph: Graph): Segment[] {
  return graph.edges
    .filter((e) => e.active)
    .map((e) => {
      const a = graph.v(e.a), b = graph.v(e.b);
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, orientation: e.ori };
    });
}

export function buildSnapshot(
  graph: Graph, includeSegments: boolean, steps?: StepLog[],
): GenerationSnapshot {
  return {
    size: graph.N,
    rects: graphToRects(graph),
    segments: includeSegments ? graphToSegments(graph) : undefined,
    steps,
  };
}
