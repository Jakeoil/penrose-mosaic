# Penrose Mosaic

A square tiling based on [Penrose's first non-periodic tiling](https://web.ma.utexas.edu/users/radin/Pentaplexity.pdf) (P1).

The mosaic pattern was found while working with graph paper. A convincing version of the Penrose tiling can be produced with the segments [4,0], [3,2] and [1,4], giving a sufficient approximation of 4 * [cos n, sin n] where n = 0, 36 and 72 degrees.

## Running

Serve the directory with any static file server:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Pages

- **Measurements** — Wheel tables and quadrille visualization (iframe)
- **Inflation 1 shapes** — All 6 tile types in 10 rotations at generation 1
- **Inflation 2 shapes** — All 6 tile types in 10 rotations at generation 2
- **Grid work area** — Mosaic vs quadrille comparison with decagons
- **Shape expansions** — Generations 0-3 side by side, controlled by type/angle buttons
- **Decagon expansion** — Large generation 5 decagon rendering

## Shape Modes

- **Mosaic** — Square tile approximation
- **Quadrille** — Vector outlines on graph paper coordinates
- **Real** — True five-fold symmetric Penrose tiling

## Controls

- Shape type, orientation (fifths, up/down)
- Overlay toggles: pentagons, rhombs, Ammann bars, duals, tree structure
- Fill/stroke styles for pentas and rhombs
- Per-shape color pickers

## File Structure

- `index.html` — Main page
- `measurements.html` — Wheel measurement tables (loaded as iframe)
- `math.js` — App entry point
- `penrose.js` — Tile type definitions and color data
- `penrose-screen.js` — Scene builder with recursive penta/star/deca expansion
- `renderings.js` — Drawing orchestration for each page
- `renderers.js` — Canvas 2D renderer
- `shape-modes.js` — Real, Quadrille, and Mosaic shape definitions
- `wheels.js` — Wheel math for computing tile positions across generations
- `point.js` — Point and Angle classes
- `bounds.js` — Bounding rectangle with render list
- `controls.js` — Control initialization, globals, cookie persistence
- `controls/` — UI control classes (Figure, ShapeColors, Overlays, etc.)
- `build-id.js` — generated build stamp, shown on the defaults button
- `tools/stamp.mjs` — regenerates `build-id.js`

## Build stamp

There is no build step; the modules are served straight to the browser. After
changing any script, run:

```
node tools/stamp.mjs
```

The stamp is on the `defaults` button, hidden until you hover it so the button
reads plain `defaults` at rest. If a change seems to have no effect, hover and
compare the number with the one the script printed — when they differ the browser
is serving a stale module, and a hard reload is the fix.

It is also logged to the console on every load.

## Author

Jeff Coyle
