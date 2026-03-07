import { p, ang } from "./point.js";
import { interpolateWheel, successorPoint } from "./wheels.js";
//import { penrose } from "./penrose.js";
//import { MODE_REAL } from "./controls/shape-mode.js"; // Now _really_
import { quadrille } from "./shape-modes.js";
import { PenroseScreen } from "./penrose-screen.js";
import { measureTaskGlobals, globals } from "./controls.js";
import { initControls, logRefresh } from "./controls.js";
//import { CanvasRenderer } from "./renderers.js";
import { resizeAndRender } from "./renderings.js";

window.addEventListener("load", measureTasks, false);

export function measureTasks(source) {
    logRefresh(measureTasks, source);
    initControls(measureTasks);

    drawQuadrille();
    drawImage();
    wheelTables();
    shapeWheelTests();
}

function drawQuadrille() {
    const canvas = document.querySelector("#quadrille");
    const scene = new PenroseScreen(measureTaskGlobals.shapeMode.MODE_REAL);

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
    const scene = new PenroseScreen(shapeMode.MODE_REAL);

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
    const wheels = quadrille.wheels;
    const pWheels = wheels.p;
    wheelTable("pWheel", pWheels);
    wheelTable("sWheel", quadrille.wheels.s);
    wheelTable("tWheel", quadrille.wheels.t);
    wheelTable("dWheel", quadrille.wheels.d);

    testInt(quadrille.wheels.p);
    testInt(quadrille.wheels.s);
    testInt(quadrille.wheels.t);
    testInt(quadrille.wheels.d);

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
    const n = 10;
    const tableDiv = document.querySelector(`#${id}`);

    const tableEle = document.createElement("table");
    const captionEle = document.createElement("caption");
    captionEle.innerHTML = caption[id];
    //captionEle.innerHTML(caption[id]);
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
            tdEle.innerHTML = `${value.x}, ${value.y}`;
            eleRow.appendChild(tdEle);
        };

        tenths.forEach(insertTd);
        tableEle.appendChild(eleRow);
    }
}

function makeShapesSeedSuccessor(shapesSeed) {
    const shapesSeedSuccessor = [[], [], []];
    for (let i = 0; i < shapesSeed[0].length; i++) {
        const point0 = shapesSeed[0][i];
        const point1 = shapesSeed[1][i];
        const point2 = shapesSeed[2][i];
        const [sPoint0, sPoint1, sPoint2] = successorPoint(
            point0,
            point1,
            point2
        );
        [
            shapesSeedSuccessor[0][i],
            shapesSeedSuccessor[1][i],
            shapesSeedSuccessor[2][i],
        ] = [sPoint0, sPoint1, sPoint2];
        // console.log(
        //     `${point0}${point1}${point2} ==> ${sPoint0}${sPoint0}${sPoint0}`
        // );
    }
    return shapesSeedSuccessor;
}

function shapeWheelTests() {
    // First find the quadrille rhombuses.
    const thickRhomb = quadrille.thickRhomb[0];

    const thickBigRhomb = quadrille.thickRhomb[1];
    // The angle arrays
    let shapesSeed = thickRhomb.slice(0, 3);
    const shapesSeedSuccessor = makeShapesSeedSuccessor(shapesSeed);
}
