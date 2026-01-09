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

/**
 * Controls the deterministic swirl bootstrap.
 * This is the size of the initial interior rectangle in grid units.
 *
 * Constraints:
 * - width >= 1, height >= 1
 * - width <= size - 2, height <= size - 2
 *
 * The rectangle position is still seeded and chosen uniformly from valid placements.
 */
export interface BootstrapRectSize {
    width: Int;
    height: Int;
}

export interface GeneratorOptions {
    size: Int;
    seed: string | number;

    /**
     * Swirl is always used. This only controls the initial rectangle dimensions.
     */
    bootstrapRect?: BootstrapRectSize;

    hopStrategy?: HopStrategy;
    prioritizePotential?: boolean;
    maxAttempts?: Int;

    /**
     * If true, throw on invariant violations.
     */
    strict?: boolean;

    /**
     * If true, snapshot/run include step logs.
     * Default should be false to avoid memory bloat.
     */
    recordSteps?: boolean;

    /**
     * If true, snapshot/run include segments.
     * Default true for rendering use cases.
     */
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
    nextFloat(): number;                 // [0,1)
    nextInt(maxExclusive: number): number; // [0,maxExclusive)
}

export type StepLog = BootstrapLog | PushLog;

export interface BootstrapLog {
    type: "bootstrap";
    /**
     * The chosen rectangle placement for the swirl bootstrap.
     * This is derived deterministically from seed + bootstrapRect size.
     */
    rect: Rect;

    /**
     * Optional human-readable description for debugging.
     */
    desc?: string;
}

export interface PushLog {
    type: "push";

    /**
     * Edge coordinates at the time the push was chosen.
     * Stored in canonical order:
     * - horizontal: x1 < x2 and y1 === y2
     * - vertical: y1 < y2 and x1 === x2
     */
    edge: Segment;

    endpoint: Endpoint;

    /**
     * Healed coordinate. For vertical edges, value is Y. For horizontal, value is X.
     * Must be an integer strictly inside the edge.
     */
    value: Int;

    desc?: string;
}

export interface StepDelta {
    removedRects: Rect[];
    addedRects: Rect[];

    /**
     * Optional secondary geometry deltas.
     * Useful for rendering edges efficiently.
     */
    removedSegments?: Segment[];
    addedSegments?: Segment[];

    log?: StepLog;
}

/**
 * Primary output is rects.
 * Segments are optional, controlled via includeSegments.
 */
export interface GenerationSnapshot {
    size: Int;
    rects: Rect[];

    segments?: Segment[];

    steps?: StepLog[];
}

/**
 * Headless generator. No DOM, no Canvas, no engine dependencies.
 */
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
