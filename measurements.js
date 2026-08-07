import { p, ang } from "./point.js";
import { interpolateWheel } from "./wheels.js";
//import { penrose } from "./penrose.js";
//import { MODE_REAL } from "./controls/shape-mode.js"; // Now _really_
import { quadrille, real, mosaic } from "./shape-modes.js";
import { PenroseScreen } from "./penrose-screen.js";
import { measureTaskGlobals, globals } from "./controls.js";
import { initControls, logRefresh } from "./controls.js";
//import { CanvasRenderer } from "./renderers.js";
import { resizeAndRender } from "./renderings.js";

function activeShapeData() {
    const mode = measureTaskGlobals.shapeMode.shapeMode;
    switch (mode) {
        case "real": return real;
        default: return quadrille; // discrete
    }
}

function isRealMode() {
    return measureTaskGlobals.shapeMode.shapeMode === "real";
}

function formatVal(v) {
    if (isRealMode()) {
        if (Math.abs(v) < 1e-10) return "0";
        // Round to 5 significant digits, strip trailing zeros
        return parseFloat(v.toPrecision(5)).toString();
    }
    return `${v}`;
}

window.addEventListener("load", measureTasks, false);
window.measureTasks = measureTasks;

export function measureTasks(source) {
    logRefresh(measureTasks, source);
    initControls(measureTasks);

    // Re-read mode from cookie (parent may have changed it)
    if (measureTaskGlobals.shapeMode) {
        const before = measureTaskGlobals.shapeMode.shapeMode;
        measureTaskGlobals.shapeMode.reset();
        const after = measureTaskGlobals.shapeMode.shapeMode;
        if (before !== after) {
            console.log(`measureTasks: mode changed ${before} → ${after} (source: ${source})`);
        }
        console.log(`measureTasks: mode=${after}, source=${source}, cookie=${document.cookie}`);
    }

    drawQuadrille();
    drawImage();
    wheelTables();
}

function drawQuadrille() {
    const canvas = document.querySelector("#quadrille");
    const scene = new PenroseScreen(measureTaskGlobals.shapeMode.shapeMode);

    let loc = p(0, 0);
    function drawScreen() {
        let fifths = 0;
        let isDown = false;
        let gen = 2;
        // Now some decagons
        scene.deca({ angle: ang(fifths, isDown), loc, gen });
        resizeAndRender(scene, canvas, 3.7);
    }

    scene.setToMeasure();
    drawScreen();
    loc = loc.tr(scene.bounds.minPoint.neg);
    scene.setToRender();
    drawScreen();
    const img = canvas.toDataURL("img.png");
}

function drawImage() {
    const canvas = document.createElement("canvas");

    // Stupid way to get the globals.
    const { shapeMode } = measureTaskGlobals;
    const scene = new PenroseScreen(shapeMode.shapeMode);

    // Now some decagons

    let loc = p(0, 0);
    const angle = ang(0, false);
    const gen = 1;
    scene.setToMeasure();
    scene.deca({ angle, loc, gen });
    scene.bounds.pad(1);
    const scale = 5;
    resizeAndRender(scene, canvas, scale);
    loc = loc.tr(scene.bounds.minPoint.neg);
    scene.setToRender();
    scene.deca({ angle, loc, gen });
    scene.bounds.pad(1);
    resizeAndRender(scene, canvas, scale);

    const img = canvas.toDataURL("img.png");
    const ele = document.querySelector("#image");
    ele.src = img;
}

function wheelTables() {
    const mode = measureTaskGlobals.shapeMode.shapeMode;
    const shapeData = activeShapeData();
    const wheels = shapeData.wheels;
    console.log(`wheelTables: rendering mode=${mode}, data=${shapeData.constructor.name}`);

    wheelTable("pWheel", wheels.p);
    wheelTable("sWheel", wheels.s);
    wheelTable("tWheel", wheels.t);
    wheelTable("dWheel", wheels.d);

    if (!isRealMode()) {
        testInt(wheels.p);
        testInt(wheels.s);
        testInt(wheels.t);
        testInt(wheels.d);
    }

    function testInt(wheels) {
        for (let i = 6; i > 1; i--) {
            const input = wheels[i].w;
            const correct = wheels[i - 1].w;
            const result = interpolateWheel(...input);
            const matches = result.every((v, index) =>
                v.equals(correct[index])
            );
            if (!matches) console.log("Interpolation failed: " + matches);
        }
    }
}
const caption = {
    pWheel: "P Distance between pentagons",
    sWheel: "S Pentagon, corner, star ",
    tWheel: "T Star to boat",
    dWheel: "D Pentagon to corner",
};

function wheelTable(id, wheel) {
    const tableDiv = document.querySelector(`#${id}`);
    tableDiv.innerHTML = "";

    const tableEle = document.createElement("table");
    const captionEle = document.createElement("caption");
    captionEle.innerHTML = caption[id];
    tableDiv.appendChild(tableEle);
    tableEle.appendChild(captionEle);

    // heading one.
    const eleH1 = document.createElement("tr");
    const eleRh1 = document.createElement("th");
    eleRh1.innerHTML = "";
    eleH1.appendChild(eleRh1);
    const h1Headers = "up0,down3,up1,down4,up2,down0,up3,down1,up4,down2".split(
        ","
    );

    const insertTh = function (value) {
        const thEle = document.createElement("th");
        thEle.innerHTML = value;
        eleH1.appendChild(thEle);
    };

    h1Headers.forEach(insertTh);
    tableEle.appendChild(eleH1);

    // heading two
    const eleH2 = document.createElement("tr");
    const eleRh2 = document.createElement("th");
    eleRh2.innerHTML = "expansion";

    eleH2.appendChild(eleRh2);
    const insertTh2 = function (value) {
        const thEle = document.createElement("th");
        thEle.innerHTML = value;
        eleH2.appendChild(thEle);
    };

    Array.from(Array(10).keys()).forEach(insertTh2);

    tableEle.appendChild(eleH2);

    for (let i = 0; i < 7; i++) {
        const eleRow = document.createElement("tr");
        const eleIndex = document.createElement("th");
        eleIndex.innerHTML = i;

        eleRow.appendChild(eleIndex);
        const tenths = wheel[i].w;
        const insertTd = function (value) {
            const tdEle = document.createElement("td");
            tdEle.innerHTML = `${formatVal(value.x)}, ${formatVal(value.y)}`;
            eleRow.appendChild(tdEle);
        };

        tenths.forEach(insertTd);
        tableEle.appendChild(eleRow);
    }
}

