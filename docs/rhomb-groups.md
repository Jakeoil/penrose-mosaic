# Rhomb Groups

The small rhombs and the large rhombs are not two independent overlays. They are
the same construction one generation apart — one step of inflation/deflation.

Notation: `Pe5_0` is a `Pe5` at generation 0, `Pe5_1` the same shape at
generation 1. A `Pe*_0` pentagon inflates to a `Pe*_1` pattern.

Colors, as used throughout the program:

| code | color |
| ----- | ------ |
| `Pe5` | blue   |
| `Pe3` | yellow |
| `Pe1` | orange |

## Large rhombs

There is a large rhomb group center for **every blue pentagon (`Pe5_0`) center**
— blue only, not every pentagon. A blue pentagon is always surrounded by one of
three petal patterns: five yellows, three yellows, or one yellow. Which petal
pattern it wears is what decides the group.

| rhomb group | centers on                                         |
| ----------- | -------------------------------------------------- |
| star        | the blue pentagon of a `Pe5_1` — the flower pattern |
| boat        | the blue pentagon of a `Pe3_1`                      |
| diamond     | the blue pentagon of a `Pe1_1`                      |

## Small rhombs

Small rhomb group centers coincide with **every type of pentagon (`Pe*_0`)**,
not just blue.

| rhomb group | centers on                    |
| ----------- | ----------------------------- |
| star        | each blue pentagon (`Pe5_0`)  |
| boat        | each yellow pentagon (`Pe3_0`) |
| diamond     | each orange pentagon (`Pe1_0`) |

## What each group contains

| rhomb group | rhombs               |
| ----------- | -------------------- |
| star        | 5 thick              |
| boat        | 3 thick + 1 thin     |
| diamond     | 1 thick + 2 thin     |

The `St*` family emits no small rhombs at all — which is why
`drawRhombusPattern` has cases for `Pe5`, `Pe3` and `Pe1` only. In the dual it is
the other way around: the `St*` generate the rhombs and the `Pe*` generate
nothing. See TODO item 4a.

## The overlay relation, and what to call it

A P1 tiling overlaid with a P3 rhomb tiling has a characteristic property: **each
rhomb carries a fixed piece of the P1 pattern — one for thick, another for
thin.** Tiling with just those two decorated rhombs reproduces P1. The small
rhombs already show this.

The formal name for that relationship is **mutually locally derivable (MLD)**:
each tiling can be reconstructed from the other by local rules alone. P1 and P3
are MLD. The Wikipedia figure `Penrose_Tiling_(P1_over_P3).svg.webp` is a worked
example — P1 in black outline, gray pentagons and blue non-pentagon tiles, with
the P3 rhombs overlaid in yellow.

### The name: Sun/Star overlay

The construction of interest is a map centered on a `Pe5` pentagon overlaid with
one centered on a `St5` star. That is not a dual — a dual exchanges vertices and
faces. It is instead a known pair: there are exactly **two** Penrose tilings with
global five-fold symmetry, conventionally **Sun** and **Star**, distinguished by
exactly this choice of center. `wieringa-roof` already uses that vocabulary
(`expandSun`, `expandStarComposite`, and its queen/sun/star empire framing).

The feature is therefore called the **Sun/Star overlay**, not the dual.

### The names are not the papers' names

**Jeff, 2026-10-21:** the code's assignment is backwards against the literature.
The convention from here is **capitals for the paper's name**:

| this code | the papers    |
| --------- | ------------- |
| `Sun`     | **STAR**      |
| `Star`    | **SUN**       |
| `Deca`    | **CARTWHEEL** |

So the paragraph above is right that there are exactly two tilings with global
five-fold symmetry and that the choice of center distinguishes them, and wrong
about which is which. `penrose.Sun` -- the blue pentagon with five queens around
it, centered on a `Pe5` -- is what the papers call the STAR.

**The identifiers are not changing.** `Sun`, `Star` and `Deca` are wired into the
type switch in `penta()`, the sidebar's type cycle in `controls/Figure.js`, and
the stored settings of the Sun/Star page. Renaming them would break a reader's
cookie and buy nothing. Capitals in prose are the fix: STAR when the paper's
figure is meant, `Sun` in backticks when this code's seed is.

Queen was a third name for `Deca`, used while the Sun/Star page was being built.
It is retired -- `Deca` in code, CARTWHEEL in prose. The page's dropdown still
reads Queen, which is a visible string and so is not changed here.

None of this touches the tiles. `Pe5`, `Pe3`, `Pe1`, `St5`, `St3`, `St1` are the
six tile names and they stand. Sun, Star and Deca are patches built out of them,
which is a different kind of thing with a different vocabulary.

Note that this settles the name of the *feature*. It does not settle what to call
the dual rhomb *shapes* — `goThickDual`, `thinDualRhomb` and friends are a
separate rhomb geometry derived from the p and s wheels rather than t, and may
well be a genuine dual. Those names stand until the geometry says otherwise.

The open question is whether the Sun/Star overlay carries over to P1. The place
to look first is the asymmetry above: large rhomb group centers are restricted to
blue `Pe5_0` pentagons, while small ones land on every pentagon type.

## How this shows up in the code

`drawRhombusPattern` indexes its shapes by the generation it is called at,
`thickRhomb[gen]` and `thinRhomb[gen]`. The two sizes come from the two
short-circuits in `penta()` and `star()`:

- **large** — stops at `gen == 1` and draws shape index 1
- **small** — recurses to `gen == 0` and draws shape index 0

So large is the earlier generation and small is the next, exactly one inflation
step apart. Only two shape sets are ever built (`shape-modes.js`, `i < 2`), which
is sufficient because those are the only two generations the short-circuits ever
ask for.
