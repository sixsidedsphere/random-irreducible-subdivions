import type { HopStrategy } from "../public/types";

export function chooseNewValue(values: number[], strategy: HopStrategy, fallback: number): number {
  if (values.length === 0) return fallback;
  const sorted = [...values].sort((a, b) => a - b);
  if (strategy === "smallest") return sorted[0];
  if (strategy === "biggest") return sorted[sorted.length - 1];
  if (strategy === "median") return sorted[Math.floor(sorted.length / 2)];
  return sorted[0];
}
