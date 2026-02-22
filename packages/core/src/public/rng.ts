import type { Rng } from "./types";

export function createRng(seed: string): Rng {
  let state = hash(seed) || 1;
  return {
    nextFloat() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return ((state >>> 0) % 1_000_000) / 1_000_000;
    },
    nextInt(maxExclusive: number) {
      if (maxExclusive <= 0) return 0;
      return Math.floor(this.nextFloat() * maxExclusive);
    },
  };
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
