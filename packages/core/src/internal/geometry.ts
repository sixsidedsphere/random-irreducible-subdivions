import type { GenerationSnapshot, Rect, Segment } from "../public/types";
import type { InternalModel } from "./model";

export function modelToRects(model: InternalModel): Rect[] {
  return model.faces
    .filter((f) => f.active)
    .map((f) => ({ left: f.leftX, top: f.topY, right: f.rightX, bottom: f.bottomY }));
}

export function modelToBoundarySegments(size: number): Segment[] {
  return [
    { x1: 0, y1: 0, x2: size, y2: 0, orientation: "h" },
    { x1: size, y1: 0, x2: size, y2: size, orientation: "v" },
    { x1: 0, y1: size, x2: size, y2: size, orientation: "h" },
    { x1: 0, y1: 0, x2: 0, y2: size, orientation: "v" },
  ];
}

export function buildSnapshot(size: number, rects: Rect[], includeSegments: boolean, steps?: GenerationSnapshot["steps"]): GenerationSnapshot {
  return {
    size,
    rects,
    segments: includeSegments ? modelToBoundarySegments(size) : undefined,
    steps,
  };
}
