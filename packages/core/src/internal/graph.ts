import type { InternalModel } from "./model";

export function createInitialModel(size: number): InternalModel {
  return {
    size,
    faces: [{ id: 0, leftX: 0, topY: 0, rightX: size, bottomY: size, active: true }],
    edges: [],
    vertices: [],
  };
}
