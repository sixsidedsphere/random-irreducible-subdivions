import type { GenerationSnapshot } from "push-heal-rectangulation";

export function drawSnapshot(canvas: HTMLCanvasElement, snapshot: GenerationSnapshot): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / snapshot.size;
  if (snapshot.segments) {
    ctx.beginPath();
    for (const s of snapshot.segments) {
      ctx.moveTo(s.x1 * scale, s.y1 * scale);
      ctx.lineTo(s.x2 * scale, s.y2 * scale);
    }
    ctx.stroke();
  }
}
