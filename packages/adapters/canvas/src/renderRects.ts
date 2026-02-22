import type { Rect } from "push-heal-rectangulation";

export function renderRects(ctx: CanvasRenderingContext2D, rects: Rect[], scale = 10): void {
  for (const rect of rects) {
    ctx.strokeRect(rect.left * scale, rect.top * scale, (rect.right - rect.left) * scale, (rect.bottom - rect.top) * scale);
  }
}
