# Push-Heal Rectangulation

Deterministic rectangulation generator for an integer grid.

It produces a subdivision of the square `[0..N] x [0..N]` into axis-aligned rectangles using a local operation called push-heal. The primary output is rectangles. Segments are optional secondary output for edge rendering.

This library is headless:
- No DOM
- No Canvas
- No engine dependencies

You render or consume the geometry however you want.

## Playground

- **GitHub Pages landing page:** https://sixsidedsphere.github.io/random-irreducible-subdivions/
- **Direct playground URL:** https://sixsidedsphere.github.io/random-irreducible-subdivions/playground/

The playground is built and deployed to GitHub Pages on every push to `main` via
`.github/workflows/playground-pages.yml`.

To verify the pages build locally:

```bash
pnpm build:playground:pages
```

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

## Quickstart

```ts
import { createGenerator } from "push-heal-rectangulation";

const gen = createGenerator({
  size: 60,
  seed: "12345",
  bootstrapRect: { width: 2, height: 2 },
  hopStrategy: "random",
  prioritizePotential: false,
  includeSegments: true,
  recordSteps: false,
});

const out = gen.run();
for (const r of out.rects) {
  // primary output
}
```

## License

MIT
