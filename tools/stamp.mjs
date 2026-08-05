// Writes build-id.js so the page can report which build it is running.
//
// This project has no build step -- the modules are served straight to the
// browser -- so run this by hand after changing any script:
//
//     node tools/stamp.mjs
//
// The stamp shows on the defaults button. When a change appears to have no
// effect, compare the number on screen with the one printed here: if they
// differ, the browser is serving a stale script and a hard reload is the fix,
// not more debugging. Sessions have been lost to exactly that.
import { writeFileSync } from "node:fs";

const stamp = new Date().toISOString().slice(11, 19);
writeFileSync("build-id.js", `export const BUILD_ID = "${stamp}";\n`);
console.log(`build id ${stamp}`);
