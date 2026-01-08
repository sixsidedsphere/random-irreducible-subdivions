# random-irreducible-subdivions

Prompted by:
https://www.boristhebrave.com/2025/05/03/exploring-rectangle-subdivisions/#f0f71769-4ba9-4ad3-8a31-6a2e2d350582-link

An attempt to create a random algorithm that constructs an NxN grid of entirely irreduceble rectangles.

From the acticle

> I define a rectangular subdivision as reducible if there is a strict subset of at least two rectangles that has a rectangular boundary. I.e. a subdivision is reducible if you can swap out a subset of rectangles for a single larger rectangle and get a simpler rectangular subdivision.

Algorithm looks like this at the moment (not perfect by any means)

- create an NxN integral grid
- draw a "whirl" pattern anywhere on the grid
- An edge can be pushed in if:
    - it has length > 1
    - the distance from the edge vertex to the next vertex on the line is > 1
    - the perpendicular bisector created at the target spot would not collide with an already existing vertex
    - there is at least one "neighbor" to the target vertex on its perpendicular bisector that is not the start or end vertex of that line. (aka, at least 1 more line terminates on the perpendicular bisector)
- Iteratively pick an edge and "push" it in, creating a perpendicular bisector along the now dangling vertex. There is an option to optimise for potential, meaning "pick the longest line to push in".
- we allow four distinct strategies for picking the distance a line can be pushed in.
    -  "random" takes a random distance
    -  "shortest" takes the smallest possible step (this tends to create very "stripy" results
    -  "longest" takes the longest possible step (this is less stripy, but does tend to create very large gaps)
    -  "median" takes the middle option, optimising for a more evenly spaced final result.
 
