import type {
  GenerationSnapshot, NormalizedGeneratorOptions, RectangulationGenerator,
  StepDelta, StepLog, Endpoint, Rng,
} from "../public/types";
import { chooseBootstrapRect, applyBootstrapSwirl } from "./bootstrapSwirl";
import { buildSnapshot } from "./geometry";
import { Graph } from "./graph";
import { assertInvariants } from "./invariants";
import { createRng } from "../public/rng";
import { isEndpointPushable, candidatePotential } from "./candidates";
import { chooseNewValForCandidate, canApplyPush } from "./chooseNewVal";

interface CandEntry {
  edgeId: number;
  end: Endpoint;
  potential: number;
  tie: number;
}

class MaxHeap {
  private a: CandEntry[] = [];
  private cmp: (a: CandEntry, b: CandEntry) => number;
  constructor(cmp: (a: CandEntry, b: CandEntry) => number) { this.cmp = cmp; }
  size(): number { return this.a.length; }
  push(x: CandEntry): void {
    this.a.push(x);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(this.a[i], this.a[p]) <= 0) break;
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
      i = p;
    }
  }
  pop(): CandEntry | null {
    if (this.a.length === 0) return null;
    const top = this.a[0];
    const last = this.a.pop()!;
    if (this.a.length > 0) {
      this.a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let best = i;
        if (l < this.a.length && this.cmp(this.a[l], this.a[best]) > 0) best = l;
        if (r < this.a.length && this.cmp(this.a[r], this.a[best]) > 0) best = r;
        if (best === i) break;
        [this.a[i], this.a[best]] = [this.a[best], this.a[i]];
        i = best;
      }
    }
    return top;
  }
}

export class GeneratorImpl implements RectangulationGenerator {
  readonly options: NormalizedGeneratorOptions;
  private graph: Graph;
  private rng: Rng;
  private bag: CandEntry[];
  private heap: MaxHeap;
  private logs: StepLog[];
  private attempts: number;
  private done: boolean;

  constructor(options: NormalizedGeneratorOptions) {
    this.options = options;
    this.rng = createRng(options.seed);
    this.logs = [];
    this.attempts = 0;
    this.done = false;
    this.bag = [];
    this.heap = new MaxHeap((a, b) => {
      if (a.potential !== b.potential) return a.potential - b.potential;
      return a.tie - b.tie;
    });

    this.graph = new Graph(options.size);
    this.graph.initBoundary();

    const rect = chooseBootstrapRect(options.size, options.bootstrapRect, this.rng);
    applyBootstrapSwirl(this.graph, rect);

    if (options.recordSteps) {
      this.logs.push({ type: "bootstrap", rect, desc: "Bootstrap swirl placement." });
    }

    assertInvariants(this.graph, options.strict);

    // Seed candidate pool
    for (let i = 0; i < this.graph.edges.length; i++) {
      const e = this.graph.edges[i];
      if (!e.active || this.graph.isBoundaryEdge(i)) continue;
      this.enqueue(i, "start");
      this.enqueue(i, "end");
    }
  }

  private enqueue(edgeId: number, end: Endpoint): void {
    if (!this.graph.e(edgeId).active) return;
    if (this.graph.isBoundaryEdge(edgeId)) return;
    const pot = candidatePotential(this.graph, edgeId);
    if (pot <= 0) return;
    const entry: CandEntry = { edgeId, end, potential: pot, tie: this.rng.nextFloat() };
    if (this.options.prioritizePotential) this.heap.push(entry);
    else this.bag.push(entry);
  }

  step(): StepDelta | null {
    if (this.done) return null;

    while (this.attempts < this.options.maxAttempts) {
      this.attempts++;

      let cand: CandEntry | null = null;
      if (this.options.prioritizePotential) {
        while (this.heap.size() > 0) {
          const it = this.heap.pop()!;
          if (!this.graph.e(it.edgeId).active) continue;
          if (this.graph.isBoundaryEdge(it.edgeId)) continue;
          const potNow = candidatePotential(this.graph, it.edgeId);
          if (potNow <= 0) continue;
          it.potential = potNow;
          cand = it;
          break;
        }
      } else {
        while (this.bag.length > 0) {
          const idx = this.rng.nextInt(this.bag.length);
          const it = this.bag[idx];
          this.bag[idx] = this.bag[this.bag.length - 1];
          this.bag.pop();
          if (!this.graph.e(it.edgeId).active) continue;
          if (this.graph.isBoundaryEdge(it.edgeId)) continue;
          const potNow = candidatePotential(this.graph, it.edgeId);
          if (potNow <= 0) continue;
          it.potential = potNow;
          cand = it;
          break;
        }
      }

      if (!cand) { this.done = true; return null; }

      if (!isEndpointPushable(this.graph, cand.edgeId, cand.end)) continue;

      const newVal = chooseNewValForCandidate(
        this.graph, cand.edgeId, cand.end, this.options.hopStrategy, this.rng,
      );
      if (newVal === null) continue;
      if (!canApplyPush(this.graph, cand.edgeId, cand.end, newVal)) continue;

      try {
        const e = this.graph.e(cand.edgeId);
        const a = this.graph.v(e.a), b = this.graph.v(e.b);
        const log: StepLog = {
          type: "push",
          edge: { x1: a.x, y1: a.y, x2: b.x, y2: b.y, orientation: e.ori },
          endpoint: cand.end,
          value: newVal,
        };

        const res = this.graph.applyPush(cand.edgeId, cand.end, newVal);

        if (this.options.recordSteps) this.logs.push(log);

        for (const eid of res.createdEdgeIds) {
          this.enqueue(eid, "start");
          this.enqueue(eid, "end");
        }
        this.enqueue(cand.edgeId, "start");
        this.enqueue(cand.edgeId, "end");

        return {
          removedRects: [],
          addedRects: [],
          log: this.options.recordSteps ? log : undefined,
        };
      } catch (_e) {
        // Failed push — continue to next candidate
      }
    }

    this.done = true;
    return null;
  }

  run(): GenerationSnapshot {
    while (!this.done && this.attempts < this.options.maxAttempts) {
      if (this.step() === null) break;
    }
    return this.snapshot();
  }

  snapshot(): GenerationSnapshot {
    return buildSnapshot(
      this.graph,
      this.options.includeSegments,
      this.options.recordSteps ? [...this.logs] : undefined,
    );
  }
}
