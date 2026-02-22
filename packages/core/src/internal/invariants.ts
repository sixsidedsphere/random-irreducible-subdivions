import { InvariantViolationError } from "../public/types";
import type { Graph } from "./graph";

export function assertInvariants(graph: Graph, strict: boolean): void {
  if (!strict) return;
  for (const face of graph.faces) {
    if (!face.active) continue;
    if (!(face.leftX < face.rightX && face.topY < face.bottomY)) {
      throw new InvariantViolationError("Face bounds must describe a rectangle.");
    }
  }
}
