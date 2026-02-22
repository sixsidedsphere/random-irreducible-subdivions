# Deep dive: push-heal rectangulation

This generator builds a rectangulation of a square integer grid by repeatedly applying a local operation called a push. A push moves one endpoint of an internal edge inward and repairs the subdivision via split and merge operations so the result remains a tiling by rectangles.

Primary output is rectangles. The internal structure is a planar orthogonal graph with rectangular faces.

## Coordinate system

- Grid is the integer lattice inside `[0..N] x [0..N]`.
- Vertices have integer `(x,y)`.
- Edges are axis-aligned:
  - horizontal edges have constant y
  - vertical edges have constant x

The algorithm uses rectangle bounds with the convention:
- left < right
- top < bottom

It does not depend on whether screen Y increases downward or upward. Rendering is your problem.

## Internal representation

Internally the subdivision is maintained as:

- Vertex
  - coordinate `(x,y)`
  - neighbor pointers `up, down, left, right`
  - active flag

- Edge
  - endpoints `a, b`
  - orientation `"h"` or `"v"`
  - face adjacency:
    - horizontal edges track `topFace` and `bottomFace`
    - vertical edges track `leftFace` and `rightFace`
  - active flag

- Face
  - axis-aligned bounds `leftX, rightX, topY, bottomY`
  - boundary vertex chains `top, bottom, left, right`
  - active flag

Faces remain rectangles by construction. The boundary chains can contain extra collinear vertices created by splitting. A simplification pass removes some collinear degree-2 vertices.

Inactive elements are often kept as tombstones for debugging. That makes it easier to implement split/merge without reindexing, but increases memory usage if you also record step history.

## Bootstrap: swirl (always on)

Starting from a single outer face often stalls under the pushability constraints, because there are no internal endpoints with the required perpendicular structure.

So the generator always begins with a deterministic bootstrap called swirl.

Input:
- `bootstrapRect = { width, height }`
- seed

The bootstrap chooses a rectangle of that size placed strictly inside the boundary, using the seeded RNG.

Let the chosen rectangle be:
- left = lx
- top = ty
- right = rx = lx + width
- bottom = by = ty + height

Constraints guarantee:
- 1 <= lx <= N - width - 1
- 1 <= ty <= N - height - 1
- rx and by are strictly inside the boundary.

Swirl then performs three pushes after an initial split:

1) Split the outer face at X = rx to create a vertical internal edge at x = rx.

2) Push the top endpoint of that vertical internal edge down to Y = ty.

3) Find the horizontal edge from (0,ty) to (rx,ty) and push its left endpoint right to X = lx.

4) Find the vertical edge at x = lx from (lx,ty) to (lx,N) and push its bottom endpoint up to Y = by.

Result:
- The subdivision contains internal edges and internal endpoints that satisfy the perpendicular-neighbor constraint, enabling the main loop.

## What is a push

A push is defined by:
- an internal edge E
- one endpoint of E: start or end
- a new integer coordinate strictly inside E along the perpendicular axis

For a vertical edge, the new value is a Y.
For a horizontal edge, the new value is an X.

The endpoint does not get “moved” directly.
Instead, the subdivision is repaired using split and merge operations that have the same net effect as moving that endpoint inward.

## Candidate endpoints

The generator considers endpoints, not just edges, because each endpoint has a different “direction” of push.

A candidate is:
- (edge, endpoint)

### Potential

Potential measures how many interior integer coordinates exist on the edge:

- potential = edgeLength - 1

If potential <= 0, there is no legal interior coordinate and the endpoint cannot be pushed.

### Pushability constraint

An endpoint is pushable only if all are true:

1) The edge is active.
2) The edge is not a boundary edge. Boundary edges are never pushed.
3) potential > 0
4) The perpendicular-neighbor constraint is satisfied.

Perpendicular-neighbor constraint as implemented in your current graph version:

- For an endpoint of a vertical edge:
  - Walk left and right along the horizontal neighbor chain through the endpoint vertex.
  - If you find any other vertex that is an endpoint of an internal vertical edge, the constraint passes.

- For an endpoint of a horizontal edge:
  - Walk up and down along the vertical neighbor chain through the endpoint vertex.
  - If you find any other vertex that is an endpoint of an internal horizontal edge, the constraint passes.

This rule biases moves toward areas where pushing will interact with existing structure.
If you weaken or remove it, acceptance rate and topology will change significantly.

## Choosing the healed coordinate

Given a candidate endpoint, the generator chooses a new coordinate that satisfies local validity rules and avoids landing on existing vertices that would break the split logic.

There are two cases.

### Vertical edge: choose Y

Let the vertical edge separate faces L (left) and R (right).
Let edge endpoints have yTop and yBot.

The chosen yNew must satisfy:
- yTop < yNew < yBot
- L and R are active
- If pushing the top endpoint: L.topY == R.topY
- If pushing the bottom endpoint: L.bottomY == R.bottomY

To avoid creating a healed endpoint that coincides with an existing vertex on the far sides, the implementation rejects yNew if either exists:
- a vertex at (L.leftX, yNew)
- a vertex at (R.rightX, yNew)

To select yNew efficiently, it builds a forbidden set of Y values:
- collect Ys from vertices on L.left chain within the interior span
- collect Ys from vertices on R.right chain within the interior span

Then compute allowed integer intervals from the remaining values, and choose a value using hopStrategy:
- smallest: closest valid coordinate on the pushed endpoint side
- biggest: farthest valid coordinate on the pushed endpoint side
- median: middle of all valid coordinates (with fallback)
- random: sample from allowed coordinates (with bounded retries and fallback)

### Horizontal edge: choose X

Symmetric.
Let the horizontal edge separate faces T (top) and B (bottom).

Choose xNew such that:
- xLeft < xNew < xRight
- T and B active
- If pushing left endpoint: T.leftX == B.leftX
- If pushing right endpoint: T.rightX == B.rightX
- Reject if vertex exists at (xNew, T.topY) or (xNew, B.bottomY)

Forbidden X values come from T.top chain and B.bottom chain.

## Applying the push (split and merge repair)

A push uses splitFace and mergeFaces, plus an optional simplification.

### Vertical edge push

Let the pushed edge separate faces L and R. We push to yNew.

1) Split L horizontally at yNew.
   - Produces L_top and L_bottom.

2) Split R horizontally at yNew.
   - Produces R_top and R_bottom.

3) Merge the pair on the healed side:
   - If pushing top endpoint: merge L_top with R_top vertically.
   - If pushing bottom endpoint: merge L_bottom with R_bottom vertically.

4) Simplify collinear degree-2 vertices that were part of the old endpoint.
   - If a vertex has degree 2 and lies on a straight line, remove it:
     - delete its two incident edges
     - replace with one longer edge
     - remove the vertex from face chains

Net effect:
- One endpoint of the internal vertical edge is moved inward, and the subdivision remains a tiling by rectangles.

### Horizontal edge push

Symmetric, swapping axes:
- split T and B vertically at xNew
- merge left halves or right halves depending on which endpoint was pushed
- simplify collinear degree-2 vertices

## Candidate selection loop

The generator repeats:

1) Maintain a pool of candidate endpoints derived from internal edges.
2) Select a candidate:
   - either random from a bag
   - or prioritized by potential with random tie-break
3) Reject if not pushable.
4) Choose healed coordinate using hopStrategy.
5) Reject if local validity fails.
6) Apply push.
7) Enqueue newly created internal edges and re-enqueue the original edge.

Termination happens when:
- no candidates remain, or
- maxAttempts is reached.

## Primary output: rectangles

At any point, the active faces in the graph are rectangles with integer bounds.

To produce output rects:
- iterate active faces
- emit `{ left, top, right, bottom }`

These rects tile the bounding square.

## Secondary output: segments

Segments correspond to active edges:
- iterate active edges
- emit an axis-aligned segment for each

Segments are often better for rendering than drawing every rectangle border, because segments already represent shared edges only once.

## Invariants (you should enforce these)

If you want this to be an open source library that users trust, you need strict invariant checks in development builds.

Minimum invariants:
- Neighbor symmetry:
  - if v.right = u then u.left = v, etc.
- Edge geometry:
  - horizontal edges have equal y
  - vertical edges have equal x
  - no zero-length active edges
- Face boundary integrity:
  - consecutive vertices in a face chain have an active edge between them
- Face bounds match chains:
  - vertices in top/bottom chains have y == topY/bottomY
  - vertices in left/right chains have x == leftX/rightX

On violation:
- throw InvariantViolationError in strict mode
- include enough diagnostic info to reproduce from seed