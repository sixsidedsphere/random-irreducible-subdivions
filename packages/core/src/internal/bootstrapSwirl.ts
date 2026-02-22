import type { BootstrapLog, BootstrapRectSize, Rect, Rng } from "../public/types";

export function chooseBootstrapRect(size: number, bootstrapRect: BootstrapRectSize, rng: Rng): BootstrapLog {
  const maxLeft = size - bootstrapRect.width - 1;
  const maxTop = size - bootstrapRect.height - 1;
  const left = 1 + rng.nextInt(Math.max(1, maxLeft));
  const top = 1 + rng.nextInt(Math.max(1, maxTop));
  const rect: Rect = {
    left,
    top,
    right: left + bootstrapRect.width,
    bottom: top + bootstrapRect.height,
  };
  return { type: "bootstrap", rect, desc: "Deterministic swirl bootstrap placement." };
}
