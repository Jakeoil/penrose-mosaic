# The Wheels

A wheel is the ten rotations of one measurement, indexed by tenths of a turn. The
program keeps four of them, and everything else is derived.

## Two geometries, not four shape modes

The code presents `Real`, `Quadrille`, `Mosaic` and `Typographic` as four peer
classes. The mathematics has **two**:

- **real** — five-fold symmetric, built from sines, cosines and φ. Simple, and
  very redundant.
- **discrete** — integer coordinates, computed by hand. **Quadrille and mosaic
  are both this same geometry.** They differ only in rendering, and in how
  reflections are taken: `shapeWheel` uses `vr`/`neg`/`hr`, `shapeWheelMosaic`
  uses `vrm`/`negm`/`hrm`.

A third **typographic** geometry exists (`shape-modes.js`, `key = "typographic"`)
but is unreachable — it is not in `ShapeMode.MODE_LIST` — and has no current
purpose.

## The four wheels

| wheel | measures                                          |
| ----- | ------------------------------------------------- |
| `P`   | distance between pentagon centers                 |
| `S`   | pentagon corner to star — `pgon.R + pgram.R`      |
| `T`   | star center to boat center — `2 × (pgram.R + pgram.y)` |
| `D`   | pentagon center to corner — `pgon.r`              |

## Only three rotations are stored

A `Wheel` is constructed from three points and expands to ten by reflection
alone:

```js
[p0, p1, p2, p2.vr, p1.vr, p0.vr, p1.neg, p2.neg, p2.hr, p1.hr]
```

The three seeds are nicknamed `up`, `won`, `too` throughout the code — a pun on
0, 1, 2. In wheel-index terms they are **`up0`, `down3`, `up1`**.

That naming is worth pinning down, because two comments in `wheels.js` disagreed
about it. The index layout is fixed by `get up()` and `get down()`, and confirmed
by the table headers in `measurements.js`:

| index | 0     | 1       | 2     | 3       | 4     | 5       | 6     | 7       | 8     | 9       |
| ----- | ----- | ------- | ----- | ------- | ----- | ------- | ----- | ------- | ----- | ------- |
| name  | `up0` | `down3` | `up1` | `down4` | `up2` | `down0` | `up3` | `down1` | `up4` | `down2` |

So index 1 is `down3` and index 2 is `up1` — not `up2`.

## Inflation and deflation

`successorPoint` produces the next generation of seeds from the current one. Each
new seed is a sum of three consecutive entries:

```
s0 = p9 + p0 + p1
s1 = p0 + p1 + p2
s2 = p1 + p2 + p3
```

where `p9` and `p3` come from the reflections `p1.hr` and `p2.vr`. `makeWheels`
applies this repeatedly to fill generations 2 upward.

`interpolateWheel` runs the same step backward, solving that little system for
the previous seed. Its derivation is written out line by line in the source.
`makeWheels` uses it once, to produce generation 0 from the seed at generation 1.

**The two are exact inverses.** Verified over 20,000 random integer triples:
`interpolateWheel(successorPoint(v)) === v` in every case, with no rounding
slack, because the discrete wheels are integers throughout.

## Where the discrete wheels came from

They were reverse-engineered by **counting squares on a mosaic printout**. Once
two generations were in hand, the Fibonacci-style recurrence

```
k(n+2) = k(n) + k(n+1)
```

extrapolated the rest — and it worked. At scale the discrete tiling is uncannily
close to the real one, which is the whole reason the mosaic is convincing.

The vectors behind it are `[4,0]`, `[3,2]` and `[1,4]`, approximating
`4·[cos n, sin n]` for n = 0°, 36°, 72°. Everything else follows by sign changes.

## What the discrete wheels actually do

All of the following was computed from the quadrille seeds and holds exactly, in
integer arithmetic, for every generation tested.

### The growth ratio is φ², not φ

Successive radii of any wheel approach

```
φ² = (3 + √5) / 2 = 2.618033988750
```

Not φ. Each generation is a full inflation of the *pattern*, which scales lengths
by φ².

| gen | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | - | - | - | - | - | - | - | - | - |
| P | 2 | 6 | 14 | 38 | 98 | 258 | 674 | 1766 | 4622 |
| S | 3 | 5 | 15 | 37 | 99 | 257 | 675 | 1765 | 4623 |
| T | 4 | 8 | 24 | 60 | 160 | 416 | 1092 | 2856 | 7480 |
| D | 1 | 3 | 9 | 23 | 61 | 159 | 417 | 1091 | 2857 |

### The x-components are alternate Fibonacci numbers, exactly

Look at components rather than radii and the structure is immediate. For the P
wheel:

| slot | x-components | |
| ---- | ------------ | - |
| index 1 (`down3`) | 1, 3, 8, 21, 55, 144, 377, 987, 2584, 6765 | F₂, F₄, F₆, F₈ … **even**-indexed |
| index 2 (`up1`)   | 2, 5, 13, 34, 89, 233, 610, 1597, 4181, 10946 | F₃, F₅, F₇, F₉ … **odd**-indexed |

Each inflation steps two places along the Fibonacci sequence. That is why the
growth ratio is φ² and not φ — one generation is two Fibonacci steps.

The recurrence follows from the standard bisection identity, and in **x** it is
exact, with no correction term whatsoever:

```
a(n+1) = 3·a(n) − a(n−1)
```

Verified with zero residual at every generation. Its characteristic equation
`x² = 3x − 1` has roots φ² and φ⁻².

The **y**-components obey the same recurrence but carry an alternating `± 2`.
Working with radii instead of components smears that correction across the whole
figure — it appears as `k(n+2) = 3k(n+1) − k(n) ± k(0)`, with the constant equal
to each wheel's generation 0 radius (P±2, S±3, T±4, D±1). The component form is
the true statement; the radius form is its shadow.

Note also that index 2's y-column is index 1's y-column shifted by one
generation.

Plain `k(n+2) = k(n) + k(n+1)` does **not** hold on radii — residuals for P run
6, 18, 46, 122, 318, growing. The Fibonacci content is in the bisection, not in
the naive sum.

### Where Fibonacci really does appear

Between wheels, exactly:

```
P(n+1) = P(n) + T(n)
D(n+1) = D(n) + P(n)
T(n+1) − T(n) = 4·F(n+2)²        F = 1, 1, 2, 3, 5, 8, 13, 21 …
```

All three verified for every generation available. The third is the striking one:
successive T gaps are four times a **square** of a Fibonacci number — 4, 16, 36,
100, 256, 676, 1764 — that is, `(2F)²` for 2, 4, 6, 10, 16, 26, 42.

So the hand-waving was right in substance. The wheels are Fibonacci-driven; the
recurrence just runs *across* the four wheels rather than within one.

### The discrete slopes are algebraic, and they are not 36°

The real wheels sit at exactly 36k°. The discrete ones do not, and they do not
converge there either. Iterating the seed recurrence to fixpoint:

| slot | discrete limit | tangent (exact) | true value |
| ---- | -------------- | --------------- | ---------- |
| index 1 (`down3`) | 34.643814023° | `(5 − √5)/4` = `(3 − φ)/2` | 36° |
| index 2 (`up1`) | 71.137740275° | `(5 + 3√5)/4` | 72° |

Both limits are **algebraic numbers of degree 2 over ℚ, lying in ℚ(√5)** —
matched to 3·10⁻¹⁶. That is a *simpler* field than the true tangents, which need
nested radicals: `tan 36° = √(5 − 2√5)`, `tan 72° = √(5 + 2√5)`.

The full limiting wheel is

```
0, 34.6438, 71.1377, 108.8623, 145.3562, 180, 214.6438, 251.1377, 288.8623, 325.3562
```

still mirror-symmetric about the vertical, as the reflection construction forces,
but with gaps 34.64, 36.50, 37.71, 36.50, 34.64 rather than five equal 36s.

Equivalently, as slopes: `|y|/x → 1 + 1/√5 = (5+√5)/5 = 1.4472136` at index 1,
the reciprocal of the tangent above.

**This is the substantive point.** The discrete tiling is not a five-fold
symmetric tiling that has been rounded off, and it is not a rational approximant
converging back to Euclidean Penrose geometry. Its inflation generates **its own
irrational geometry** — one with Fibonacci growth, exact lattice coordinates at
every finite stage, and limiting slopes that are algebraic but *not* the
Euclidean ones. The vectors `(4,0)`, `(3,2)`, `(1,4)` are not fixed rational
stand-ins for the golden directions; they are the first term of a sequence whose
limit is something else.

The limiting directions are the dominant eigenvector of the substitution, which
is why they come out in ℚ(√5): the eigenvalue is φ². The next section derives
this rather than asserting it.

## The substitution matrix

`successorPoint` looks like one operation on three points, but the reflections it
uses are `hr` (negate x) and `vr` (negate y), which act on the two coordinates
differently. Substituting them in:

```
s0 = (-x1 + x0 + x1,  y1 + y0 + y1)  =  (x0,          y0 + 2y1)
s1 = ( x0 + x1 + x2,  y0 + y1 + y2)  =  (x0+x1+x2,    y0+y1+y2)
s2 = ( x1 + x2 + x2,  y1 + y2 - y2)  =  (x1 + 2x2,    y1)
```

So **x and y evolve under two different integer matrices**:

```
        ⎡1 0 0⎤              ⎡1 2 0⎤
  Mx =  ⎢1 1 1⎥        My =  ⎢1 1 1⎥
        ⎣0 1 2⎦              ⎣0 1 0⎦
```

Verified against `successorPoint` over 50,000 random seeds, zero mismatches.

That asymmetry is the whole story. A similarity would use one matrix for both;
this uses two, so inflation is not a rotation-and-scale.

### Spectrum

```
char(Mx) = (1 − λ)(λ² − 3λ + 1)
char(My) = (1 + λ)(λ² − 3λ + 1)
```

They share the factor `λ² − 3λ + 1`, whose roots are **φ² and φ⁻²**. Each also
carries one extra eigenvalue of modulus 1, and both of those are meaningful:

- **Mx has λ = 1.** `x0` is invariant. The `up0` direction stays at x = 0 for
  every generation — the first column of the P table is all zeros, and this is
  why.
- **My has λ = −1.** An alternating component that never grows and never decays.
  **This is the ±2 correction** recorded earlier as an empirical oddity. It is
  not an anomaly; it is an eigenvalue sitting on the unit circle beside the
  growth.

So the growth ratio φ² is now proved, not measured.

### Eigenvectors and the limiting slopes

The dominant eigenvectors, exact:

```
ex = (0, 1, φ)          ey = (2φ, φ², 1)
```

A seed's limiting direction at slot k is `(cx·ex[k], cy·ey[k])`, where `cx` and
`cy` are its projections onto those eigenvectors. Only their ratio matters. Put
`r = cx / cy`. Then

```
tan θ₁ = r · ex[1]/|ey[1]| = r / φ²
tan θ₂ = r · ex[2]/|ey[2]| = r · φ
```

For the quadrille seed, `r = (5 + √5)/4 = (2 + φ)/2 = 1.809016994375`, giving

```
tan θ₁ = (5 + √5)/(4φ²) = (5 − √5)/4     θ₁ = 34.643814°
tan θ₂ = (5 + √5)·φ/4   = (5 + 3√5)/4    θ₂ = 71.137740°
```

which is exactly what iterating to fixpoint produced. The closed form is
established.

### Two consequences worth keeping

**The ratio of the limiting tangents is φ³, always.**

```
tan θ₂ / tan θ₁ = (r·φ)/(r/φ²) = φ³ = 4.236067977500
```

`r` cancels. So φ³ is an invariant of the substitution itself — **no choice of
integer seed can change it.** A different basis moves the angles; it cannot move
their ratio.

**The whole discrepancy with Euclidean Penrose is one number.** Asking which `r`
would give exactly 36° and 72°:

```
r_true     = √(2 + φ) = 2 sin 72° = 1.902113032590
r_discrete =  (2 + φ)/2           = 1.809016994375
```

Both are built from the same quantity `2 + φ`. True Penrose needs its **square
root**; the discrete geometry gets **half of it**. One is irrational of degree 4,
the other rational in φ — and that single substitution is the entire difference
between the two geometries.

That is a precise answer to what the mosaic is doing: not approximating the
Penrose angles, but realizing the same substitution with the arithmetically
simpler shear that the integer lattice permits.

## Shape wheels

`shapeWheel(up, won, too)` builds the ten orientations of a *figure* rather than a
point, using the same reflection pattern as `Wheel`. Shapes with full five-fold
symmetry need only `up`; the rest need all three.
