import type { StepDelta, Endpoint, PushLog } from "../public/types";
import type { Graph } from "./graph";

export function applyPush(
  graph: Graph, edgeId: number, end: Endpoint, newVal: number,
): StepDelta {
  const e = graph.e(edgeId);
  const a = graph.v(e.a), b = graph.v(e.b);
  const log: PushLog = {
    type: "push",
    edge: { x1: a.x, y1: a.y, x2: b.x, y2: b.y, orientation: e.ori },
    endpoint: end,
    value: newVal,
  };

  graph.applyPush(edgeId, end, newVal);

  return { removedRects: [], addedRects: [], log };
}
