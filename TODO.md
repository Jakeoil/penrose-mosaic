# Penrose Mosaic — TODO

## Measurements Page

### 1. Tie tables to control mode (DONE)
- [x] Wire wheel tables to the shape mode control (mosaic, quadrille, real)
- [x] When mode is real, show rounded floating-point values in the tables
- [x] When mode is quadrille/mosaic, show integer values (current behavior)

### 1a. Intermittent: mode change doesn't update tables
- [ ] Rare bug — changing shape mode sometimes leaves stale table data
- [ ] Hard refresh clears it (not guaranteed). May be timing-related
- [ ] Hypothesis: iframe cookie read races with parent mode write, or `measureTasks` fires before cookie is committed
- [ ] Diagnostic logging added to `measureTasks()` and `wheelTables()`

### 2. Decagon figures match mode
- [ ] Make the two decagon figures at the top render in the current mode (mosaic, quadrille, real)
- [ ] Ignore overlay values and colors for now

### 3. Wheel line diagrams
- [ ] Draw small figures showing the line each wheel (P, S, T, D) represents
- [ ] Place each diagram to the left of its respective table
- [ ] P: distance between pentagon centers
- [ ] S: pentagon corner to star (pgon.R + pgram.R)
- [ ] T: star center to boat center (2 × (pgram.R + pgram.y))
- [ ] D: pentagon center to corner (pgon.r)
