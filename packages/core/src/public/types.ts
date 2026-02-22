export type Int = number;

export type Orientation = "h" | "v";
export type Endpoint = "start" | "end";

export type HopStrategy = "random" | "smallest" | "median" | "biggest";

export interface Rect {
  left: Int;
  top: Int;
  right: Int;
  bottom: Int;
}

export interface Segment {
  x1: Int;
  y1: Int;
  x2: Int;
  y2: Int;
  orientation: Orientation;
}

export interface BootstrapRectSize {
  width: Int;
  height: Int;
}

export interface GeneratorOptions {
  size: Int;
  seed: string | number;
  bootstrapRect?: BootstrapRectSize;
  hopStrategy?: HopStrategy;
  prioritizePotential?: boolean;
  maxAttempts?: Int;
  strict?: boolean;
  recordSteps?: boolean;
  includeSegments?: boolean;
}

export interface NormalizedGeneratorOptions {
  size: Int;
  seed: string;
  bootstrapRect: BootstrapRectSize;
  hopStrategy: HopStrategy;
  prioritizePotential: boolean;
  maxAttempts: Int;
  strict: boolean;
  recordSteps: boolean;
  includeSegments: boolean;
}

export interface Rng {
  nextFloat(): number;
  nextInt(maxExclusive: number): number;
}

export type StepLog = BootstrapLog | PushLog;

export interface BootstrapLog {
  type: "bootstrap";
  rect: Rect;
  desc?: string;
}

export interface PushLog {
  type: "push";
  edge: Segment;
  endpoint: Endpoint;
  value: Int;
  desc?: string;
}

export interface StepDelta {
  removedRects: Rect[];
  addedRects: Rect[];
  removedSegments?: Segment[];
  addedSegments?: Segment[];
  log?: StepLog;
}

export interface GenerationSnapshot {
  size: Int;
  rects: Rect[];
  segments?: Segment[];
  steps?: StepLog[];
}

export interface RectangulationGenerator {
  readonly options: NormalizedGeneratorOptions;
  step(): StepDelta | null;
  run(): GenerationSnapshot;
  snapshot(): GenerationSnapshot;
}

export class InvalidOptionsError extends Error {
  name = "InvalidOptionsError";
}

export class InvariantViolationError extends Error {
  name = "InvariantViolationError";
}
