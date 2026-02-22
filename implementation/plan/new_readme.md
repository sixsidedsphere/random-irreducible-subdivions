# random-irreducible-subdivions

Deterministic rectangulation generator for an integer grid.

It produces a subdivision of the square `[0..N] x [0..N]` into axis-aligned rectangles using a local operation called push-heal. The primary output is rectangles. Segments are optional secondary output for edge rendering.

This library is headless:
- No DOM
- No Canvas
- No engine dependencies

You render or consume the geometry however you want.

## Contract

Hard constraints:
- Integer coordinates only.
- Bounding region is the square from `(0,0)` to `(N,N)`.
- All edges are axis-aligned.
- Output rectangles cover the full bounding square with no overlap.

Determinism:
- Same version + same options + same seed produce identical output.

## Install

```bash
npm i push-heal-rectangulation
```

Quickstart
```
import { createGenerator } from "push-heal-rectangulation";

const gen = createGenerator({
  size: 60,
  seed: "12345",

  // Controls the swirl bootstrap. See docs for details.
  bootstrapRect: { width: 2, height: 2 },

  hopStrategy: "random",
  prioritizePotential: false,

  includeSegments: true,   // optional, but recommended for rendering
  recordSteps: false,
});

const out = gen.run();

// Primary output
for (const r of out.rects) {
  // r.left, r.top, r.right, r.bottom
  // Use for gameplay layout, room generation, packing, traversal, etc.
}

// Secondary output (optional)
if (out.segments) {
  for (const s of out.segments) {
    // Draw line from (s.x1,s.y1) to (s.x2,s.y2)
  }
}
```

# Options

* size (required) Grid size N. Output covers [0..N] x [0..N].
* seed (required) String or number.
* bootstrapRect (optional) Controls the swirl bootstrap’s initial rectangle size. Default: { width: 2, height: 2 }.

* Position is seeded and selected from valid placements.

* hopStrategy (optional) How the algorithm chooses the new healed coordinate on a selected edge.
Values: random, smallest, median, biggest.

* prioritizePotential (optional)
If true, prefer endpoints with higher potential (longer edges).

* maxAttempts (optional)
Upper bound on rejected candidate evaluations to avoid unbounded loops.
Default should be something large but finite.

* includeSegments (optional)
If true, snapshots include segments.
Default: true if you expect rendering use cases.

* recordSteps (optional)
If true, snapshots include step logs.
Default: false.

## Output
Primary output:

`rects: Rect[]`

Each rect uses integer bounds {left, top, right, bottom}.

Rectangles tile the bounding square.

Secondary output (optional):

`segments: Segment[]`

Active edges as axis-aligned segments.

Better for rendering boundaries than drawing all rectangle borders (because shared edges are already deduped).

## Optional diagnostics:

* steps: StepLog[] if recordSteps is enabled.

# License
MIT