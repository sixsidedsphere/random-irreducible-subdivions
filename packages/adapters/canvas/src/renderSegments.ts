import type { Segment } from "push-heal-rectangulation";

export function renderSegments(ctx: CanvasRenderingContext2D, segments: Segment[], scale = 10): void {
  ctx.beginPath();
  for (const s of segments) {
    ctx.moveTo(s.x1 * scale, s.y1 * scale);
    ctx.lineTo(s.x2 * scale, s.y2 * scale);
  }
  ctx.stroke();
}
