# Is the basis optimal?

The mosaic is built from three integer vectors — `(4,0)`, `(3,2)`, `(1,4)` — found
by doodling on quadrille paper. This asks whether they are a good choice, in a
sense precise enough to answer.

Run the search with `node tools/basis-search.mjs [bound]`.

## Closure is an exact Diophantine condition

Write the basis as `v₀ = (p,0)`, `v₁ = (q,r)`, `v₂ = (s,t)`. The pentagon is built
by mirror reflection, as every wheel in this program is:

```
edges = (q,r), (-s,t), (-p,0), (-s,-t), (q,-r)
```

The y components cancel identically. The x components sum to `2q − 2s − p`, so

```
      p = 2(q − s)
```

and for the mosaic basis `2(3 − 1) = 4`. ✓

This is not an approximation condition. Any integer triple satisfying it closes
**exactly** on the lattice; any triple failing it is not a pentagon at all. The
true regular pentagon satisfies it too, since `φ/2 − 1/(2φ) = 1/2`.

## Scoring

Take the five vertices as complex numbers, centre them, and transform. A regular
pentagon traversed in order is *exactly* the m=1 Fourier mode, so

```
irregularity = √(Σ|aₘ|² for m ≠ 1) / |a₁|
```

is invariant under scale, rotation and translation. Zero means regular, which no
integer basis can achieve.

## Record holders

Each is strictly better than every smaller basis. Search bound 64, 5,876,565
closing convex bases.

| size | v₀ | v₁ | v₂ | irregularity | gain | |
| ---- | -- | -- | -- | ------------ | ---- | - |
| 2 | (2,0) | (2,1) | (1,2) | 1.1213e-1 | — | |
| **4** | **(4,0)** | **(3,2)** | **(1,4)** | **5.3148e-2** | **2.110** | **the mosaic** |
| 6 | (6,0) | (5,4) | (2,6) | 3.0816e-2 | 1.725 | |
| 8 | (8,0) | (7,5) | (3,8) | 2.4585e-2 | 1.253 | family n=4 |
| 10 | (10,0) | (8,6) | (3,9) | 1.9928e-2 | 1.234 | |
| 12 | (12,0) | (10,7) | (4,12) | 1.5928e-2 | 1.251 | |
| 14 | (14,0) | (11,8) | (4,13) | 9.5752e-3 | 1.663 | family n=5 |
| 20 | (20,0) | (16,12) | (6,19) | 8.5580e-3 | 1.119 | |
| 22 | (22,0) | (18,13) | (7,21) | 4.1082e-3 | 2.083 | family n=6 |
| 36 | (36,0) | (29,21) | (11,34) | 2.4419e-3 | 1.682 | family n=7 |
| 58 | (58,0) | (47,34) | (18,55) | 2.0905e-3 | 1.168 | family n=8 |

**The mosaic basis is a record holder** — the best that exists at size 4, and the
first with usable fidelity, halving the error of the only smaller option.

The gains are lumpy, not smooth: 2.11 at size 4, 2.08 at 22, 1.68 at 36, against
~1.2 elsewhere. These are the **sweet spots** — sizes where several errors happen
to fall small together, the same phenomenon as the Metonic cycle or 2¹⁰ ≈ 1000.

## A Lucas and Fibonacci family

Every record from size 8 upward belongs to one family:

```
p = 2L(n−1)    q = L(n)    r = F(n+1)    s = L(n−2)    t = F(n+2)
```

Lucas numbers in x, Fibonacci in y. Sizes 8, 14, 22, 36, 58, then 94, 152, 246 …
each about φ² times the last.

**The mosaic basis is not in this family.** The family member at size 4 is
`(4,0) (4,3) (1,5)`, with irregularity 1.83e-1 — three and a half times *worse*
than the doodled basis. The systematic sequence only takes over at size 8.

## The family does not converge

Errors: 2.46e-2, 9.58e-3, 4.11e-3, 2.44e-3, 2.09e-3, 2.03e-3, 2.0259e-3,
2.0246e-3, 2.0245e-3 …

It **plateaus at 2.0245e-3**. It never reaches a regular pentagon. Splitting the
four ratios shows exactly why:

| ratio | family limit | exact | |
| ----- | ------------ | ----- | - |
| q/p | φ/2 = 0.809016994 | φ/2 = 0.809016994 | ✅ |
| s/p | 1/(2φ) = 0.309016994 | 1/(2φ) = 0.309016994 | ✅ |
| r/p | φ²/(2√5) = 0.585410197 | sin 36° = 0.587785252 | ❌ |
| t/p | φ³/(2√5) = 0.947213595 | sin 72° = 0.951056516 | ❌ |

The **x** data is reached exactly. The **y** data is not, and cannot be:

```
sin 36° = √(10 − 2√5)/4        sin 72° = √(10 + 2√5)/4
```

are **degree 4** over ℚ, while ratios of Fibonacci and Lucas numbers generate
only **ℚ(√5)**, which is degree 2. No such family can converge to a regular
pentagon, however large its terms.

## The same obstruction, twice

`docs/wheels.md` derives the substitution matrix and finds the whole discrepancy
between the mosaic and Euclidean Penrose to be a single shear:

```
r_true     = √(2 + φ)   degree 4
r_discrete =  (2 + φ)/2  degree 2
```

Here it appears again in different clothing: x lands in ℚ(√5) and y needs a
degree-4 field. Two independent computations, one obstruction.

That is the real answer to whether the basis is optimal. Within its size it is —
demonstrably, by exhaustive search. But no integer basis is optimal in the limit,
because the target does not live in the field the lattice can reach. The mosaic
is not a rough draft of Penrose that a bigger basis would sharpen; it is a
different geometry, and this is the arithmetic reason.

## Open

- The search is exhaustive only to bound 64. Whether some large non-family basis
  breaks the 2.0245e-3 plateau is unknown — it would have to approximate a
  degree-4 number well, so continued fractions of sin 36° are where to look.
- Only the pentagon is scored. The star, boat and diamond close on the same three
  vectors, so they should follow, but that is assumed rather than checked.
