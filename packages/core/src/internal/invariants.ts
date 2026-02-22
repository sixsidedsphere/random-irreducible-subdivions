import { InvariantViolationError } from "../public/types";
import type { InternalModel } from "./model";

export function assertInvariants(model: InternalModel, strict: boolean): void {
  if (!strict) return;
  for (const face of model.faces) {
    if (!face.active) continue;
    if (!(face.leftX < face.rightX && face.topY < face.bottomY)) {
      throw new InvariantViolationError("Face bounds must describe a rectangle.");
    }
  }
}
