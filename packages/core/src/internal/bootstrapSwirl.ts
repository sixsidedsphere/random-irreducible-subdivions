import type { BootstrapRectSize, Rect, Rng } from "../public/types";
import type { Graph } from "./graph";

export function chooseBootstrapRect(size: number, bootstrapRect: BootstrapRectSize, rng: Rng): Rect {
  const maxLeft = size - bootstrapRect.width - 1;
  const maxTop = size - bootstrapRect.height - 1;
  const left = 1 + rng.nextInt(Math.max(1, maxLeft));
  const top = 1 + rng.nextInt(Math.max(1, maxTop));
  return {
    left,
    top,
    right: left + bootstrapRect.width,
    bottom: top + bootstrapRect.height,
  };
}

export function applyBootstrapSwirl(graph: Graph, rect: Rect): void {
  const { left: lx, top: ty, right: rx, bottom: by } = rect;
  const N = graph.N;

  // Step 1: Split face 0 vertically at rx
  const initRes = graph.splitFace(0, "v", rx);
  const initEdgeId = initRes.cutEdgeId;

  // Swirl step 1: Push vertical edge start down to ty
  graph.applyPush(initEdgeId, "start", ty);

  // Swirl step 2: Push horizontal edge (0,ty)→(rx,ty) start right to lx
  const v0 = graph.vertexIdAt(0, ty);
  const vP = graph.vertexIdAt(rx, ty);
  if (v0 === null || vP === null) throw new Error("Bootstrap: missing vertices for h-edge");
  const eLeftH = graph.getEdgeBetween(v0, vP);
  if (eLeftH === null) throw new Error("Bootstrap: missing horizontal edge");
  graph.applyPush(eLeftH, "start", lx);

  // Swirl step 3: Push vertical edge (lx,ty)→(lx,N) end up to by
  const vTop = graph.vertexIdAt(lx, ty);
  const vBot = graph.vertexIdAt(lx, N);
  if (vTop === null || vBot === null) throw new Error("Bootstrap: missing vertices for v-edge");
  const eVB = graph.getEdgeBetween(vTop, vBot);
  if (eVB === null) throw new Error("Bootstrap: missing vertical edge");
  graph.applyPush(eVB, "end", by);
}
