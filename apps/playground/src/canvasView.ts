import type { GenerationSnapshot } from "push-heal-rectangulation";

const PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316", "#6366f1",
];

function hashColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export function drawSnapshot(canvas: HTMLCanvasElement, snapshot: GenerationSnapshot): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scale = canvas.width / snapshot.size;

  // Clear with background
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw filled rects
  for (let i = 0; i < snapshot.rects.length; i++) {
    const r = snapshot.rects[i];
    ctx.fillStyle = hashColor(i);
    ctx.globalAlpha = 0.15;
    ctx.fillRect(
      r.left * scale,
      r.top * scale,
      (r.right - r.left) * scale,
      (r.bottom - r.top) * scale,
    );
  }
  ctx.globalAlpha = 1;

  // Draw rect outlines
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;
  for (const r of snapshot.rects) {
    ctx.strokeRect(
      r.left * scale,
      r.top * scale,
      (r.right - r.left) * scale,
      (r.bottom - r.top) * scale,
    );
  }

  // Draw segments on top
  if (snapshot.segments) {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const s of snapshot.segments) {
      ctx.moveTo(s.x1 * scale, s.y1 * scale);
      ctx.lineTo(s.x2 * scale, s.y2 * scale);
    }
    ctx.stroke();
  }
}
