Map[func, list]
Map[fu nc, list]

SortBy[func]
SortBy[fu nc]
SortBy[list, func]
SortBy[list, fu nc]

Block[{x, y}z, w]
Block[{x = 1, y, {x}}]

Function[a]
Function[a, v]
Function[{a, v}]
Function[{a, {c}, b}, a]
Function[{a, {c}, b}d, a]

Compile[{{a, b}, {{c}}, {d}, e}]
Compile[{a, b}c]

Limit[a, b -> c, d -> e]
Limit[a, {b, c} -> {d, e}]
Limit[a, {b, c}x -> {d, e}]
Limit[a, {b -> c}, d -> e]
Limit[a, {b -> c}y, d -> e]

AsymptoticEquivalent[a, b -> c, d -> e, f -> g]
AsymptoticEquivalent[a, b, {c -> d, e -> f}]
AsymptoticEquivalent[a, b, {c, d} -> {e, f}]
AsymptoticEquivalent[a, b, {c -> d, e -> f}x]
AsymptoticEquivalent[a, b, {c, d}y -> {e, f}]

Solve[a, x, b]
Solve[a, {x, y}, b]
Solve[a, {x, y}z, b]

FourierTransform[a, b, {c, d + e}, f * g , {h}i, j]

Grad[func, x, p]
Grad[func, {x, y, z}t, p]
Grad[x ^ 2, {x, y, z}, p]

Plot[a, {x, b}, {y, c, d}, z]
NDSolve[a, a, {x, b}, {y, c, d}]
Sum[func, a, {b, c}, d, {e, f}]

Manipulate[expr, {u, u1, u2}, {{v, v0}, {x, y, z}}, w]
