import type { GenerationSnapshot, NormalizedGeneratorOptions, RectangulationGenerator, StepDelta, StepLog } from "../public/types";
import { chooseBootstrapRect } from "./bootstrapSwirl";
import { buildSnapshot, modelToRects } from "./geometry";
import { createInitialModel } from "./graph";
import { assertInvariants } from "./invariants";
import { createRng } from "../public/rng";

export class GeneratorImpl implements RectangulationGenerator {
  readonly options: NormalizedGeneratorOptions;
  private readonly logs: StepLog[];
  private readonly snapshotState: GenerationSnapshot;

  constructor(options: NormalizedGeneratorOptions) {
    this.options = options;
    const rng = createRng(options.seed);
    const bootstrap = chooseBootstrapRect(options.size, options.bootstrapRect, rng);
    const model = createInitialModel(options.size);
    assertInvariants(model, options.strict);
    const rects = modelToRects(model);
    this.logs = options.recordSteps ? [bootstrap] : [];
    this.snapshotState = buildSnapshot(options.size, rects, options.includeSegments, options.recordSteps ? this.logs : undefined);
  }

  step(): StepDelta | null {
    return null;
  }

  run(): GenerationSnapshot {
    return this.snapshot();
  }

  snapshot(): GenerationSnapshot {
    return {
      size: this.snapshotState.size,
      rects: [...this.snapshotState.rects],
      segments: this.snapshotState.segments ? [...this.snapshotState.segments] : undefined,
      steps: this.snapshotState.steps ? [...this.snapshotState.steps] : undefined,
    };
  }
}
