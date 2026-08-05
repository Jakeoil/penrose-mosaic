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
