import { GeneratorImpl } from "../internal/generatorImpl";
import type { GeneratorOptions, NormalizedGeneratorOptions, RectangulationGenerator } from "./types";
import { InvalidOptionsError } from "./types";

export function createGenerator(options: GeneratorOptions): RectangulationGenerator {
  const normalized = normalizeOptions(options);
  return new GeneratorImpl(normalized);
}

function normalizeOptions(options: GeneratorOptions): NormalizedGeneratorOptions {
  if (!Number.isInteger(options.size) || options.size < 3) {
    throw new InvalidOptionsError("size must be an integer >= 3");
  }

  const bootstrapRect = options.bootstrapRect ?? { width: 2, height: 2 };
  if (!Number.isInteger(bootstrapRect.width) || !Number.isInteger(bootstrapRect.height)) {
    throw new InvalidOptionsError("bootstrapRect width/height must be integers");
  }
  if (bootstrapRect.width < 1 || bootstrapRect.height < 1) {
    throw new InvalidOptionsError("bootstrapRect width/height must be >= 1");
  }
  if (bootstrapRect.width > options.size - 2 || bootstrapRect.height > options.size - 2) {
    throw new InvalidOptionsError("bootstrapRect width/height must be <= size - 2");
  }

  return {
    size: options.size,
    seed: String(options.seed),
    bootstrapRect,
    hopStrategy: options.hopStrategy ?? "random",
    prioritizePotential: options.prioritizePotential ?? false,
    maxAttempts: options.maxAttempts ?? 50_000,
    strict: options.strict ?? true,
    recordSteps: options.recordSteps ?? false,
    includeSegments: options.includeSegments ?? true,
  };
}
