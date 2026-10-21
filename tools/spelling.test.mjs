// House style: American spellings, everywhere.
//
// Adapted from the pentagrid's tools/spelling.test.mjs, which exists because the
// rule lived only in a note and nothing checked it -- 204 British forms had
// drifted across 28 files before anybody counted. This repo then repeated it
// exactly: 37 forms across seven files, swept in commit 9d61033.
//
// It covers code identifiers and comments as well as prose. This file names the
// British forms it looks for, so it excludes itself.
//
// docs/penrose.txt is excluded by the extension list, deliberately: it is a
// worksheet in Jeff's own hand and stays verbatim. Quoted transcripts are the
// other exception -- see TRANSCRIPTS below.

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".github", ".venv", "__pycache__"]);
const TEXT = /\.(mjs|js|html|md|css|json)$/;
const SELF = "tools/spelling.test.mjs";

// Files that quote Jeff verbatim. His own words are not ours to respell, and
// his habits include "grey" and the occasional "mozaic".
const TRANSCRIPTS = new Set(["docs/q5-z5.md"]);

/**
 * British form -> American. Prefixes where the whole family follows the stem,
 * and whole words where it does not: `centred` has to be caught before `centre`,
 * or a stem rule would leave "centerd".
 */
const FORBIDDEN = [
    ["centred", "centered"], ["centring", "centering"], ["centre", "center"],
    ["colour", "color"], ["behaviour", "behavior"], ["honour", "honor"],
    ["neighbour", "neighbor"], ["flavour", "flavor"], ["favour", "favor"],
    ["labelled", "labeled"], ["labelling", "labeling"], ["modelled", "modeled"],
    ["cancelled", "canceled"], ["signalled", "signaled"],
    ["travelling", "traveling"], ["marvellous", "marvelous"],
    ["normalis", "normaliz"], ["serialis", "serializ"], ["organis", "organiz"],
    ["recognis", "recogniz"], ["initialis", "initializ"],
    ["specialis", "specializ"], ["generalis", "generaliz"],
    ["minimis", "minimiz"], ["maximis", "maximiz"], ["visualis", "visualiz"],
    ["summaris", "summariz"], ["prioritis", "prioritiz"],
    ["parameteris", "parameteriz"], ["analys" + "e", "analyze"],
    ["grey", "gray"], ["defence", "defense"], ["licence", "license"],
    ["practis" + "e", "practice"], ["whilst", "while"], ["amongst", "among"],
    ["judgement", "judgment"], ["programme", "program"],
    ["catalogue", "catalog"], ["sceptic", "skeptic"],
    // Not a British form, but the one misspelling this project is prone to.
    ["mozaic", "mosaic"],
];

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        if (SKIP_DIRS.has(name)) continue;
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (TEXT.test(name)) out.push(full);
    }
    return out;
}

test("no British spellings anywhere in the repo", () => {
    const offenses = [];
    for (const file of walk(ROOT)) {
        const rel = relative(ROOT, file);
        if (rel === SELF || TRANSCRIPTS.has(rel)) continue;
        readFileSync(file, "utf8").split("\n").forEach((line, i) => {
            const low = line.toLowerCase();
            for (const [bad, good] of FORBIDDEN)
                if (low.includes(bad)) {
                    offenses.push(`${rel}:${i + 1}  "${bad}" -> "${good}"`);
                    break;
                }
        });
    }
    assert.deepEqual(offenses, [],
                     `British spellings found:\n  ${offenses.join("\n  ")}`);
});

test("the worksheet is not swept", () => {
    // Guards the exclusion rather than trusting it: if the extension list ever
    // grows to .txt, this says so before the sweep rewrites his handwriting.
    const swept = walk(ROOT).map((f) => relative(ROOT, f));
    assert.ok(!swept.includes("docs/penrose.txt"),
              "docs/penrose.txt is in the sweep; it must stay verbatim");
});
