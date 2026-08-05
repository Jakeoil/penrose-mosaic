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

## Shape wheels

`shapeWheel(up, won, too)` builds the ten orientations of a *figure* rather than a
point, using the same reflection pattern as `Wheel`. Shapes with full five-fold
symmetry need only `up`; the rest need all three.
