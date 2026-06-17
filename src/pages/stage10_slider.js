import p5 from "p5";
import "../style.css";
import {
    waitForOpenCV
} from "../opencvReady.js";
import {
    setupFaceTracking,
    getFaces,
    getVideo,
    getVideoSize,
    hasFace,
    isFaceTrackingReady,
} from "../faceTracking.js";
import {
    drawCamera,
    drawStatus,
    getCoverRect
} from "../drawing.js";
import {
    testWarpAffine,
    warpTriangle,
} from "../effects/triangleWarp.js";
let tested = false;
const DEBUG_DRAW_TRIANGLES2 = true;
const DEBUG_DRAW_TRIANGLES = false;
const DEBUG_SKIP_WARP = false;
const DEBUG_DRAW_INDEX_LABELS = false;

// ----------------------------------------------------
// Tuning
// ----------------------------------------------------
const DEFAULT_TUNING = {
    EYE_CENTER_SCALE: 1.08,
    UPPER_LID_SCALE: 1.10,
    LOWER_LID_SCALE: 1.10,
    OUTER_TOP_CENTER_SCALE: 1.06,
    OUTER_TOP_OUTER_SCALE: 1.08,
    OUTER_BOTTOM_CENTER_SCALE: 1.08,
    OUTER_BOTTOM_OUTER_SCALE: 1.14,
    OUTER_BOTTOM_EXTREME_SCALE: 1.08,
    OUTER_INNER_SCALE: 1.04,
    OUTER_RING_SCALE: 1.10,
    OUTER_CORNER_SCALE: 1.07,
    INNER_CORNER_SCALE: 1.00,
    LASH_SCALE: 1.05,
};

const tuning = { ...DEFAULT_TUNING };

const TUNING_CONFIG = [
    { key: "EYE_CENTER_SCALE", label: "Eye center", min: 0.85, max: 1.80, step: 0.01 },
    { key: "UPPER_LID_SCALE", label: "Upper lid", min: 0.85, max: 1.60, step: 0.01 },
    { key: "LOWER_LID_SCALE", label: "Lower lid", min: 0.85, max: 1.60, step: 0.01 },
    { key: "OUTER_TOP_CENTER_SCALE", label: "Outer top center", min: 0.85, max: 1.40, step: 0.01 },
    { key: "OUTER_TOP_OUTER_SCALE", label: "Outer top outer", min: 0.85, max: 1.40, step: 0.01 },
    { key: "OUTER_BOTTOM_CENTER_SCALE", label: "Outer bottom center", min: 0.85, max: 1.40, step: 0.01 },
    { key: "OUTER_BOTTOM_OUTER_SCALE", label: "Outer bottom outer", min: 0.85, max: 1.60, step: 0.01 },
    { key: "OUTER_BOTTOM_EXTREME_SCALE", label: "Outer bottom extreme", min: 0.85, max: 1.40, step: 0.01 },
    { key: "OUTER_INNER_SCALE", label: "Outer inner", min: 0.85, max: 1.40, step: 0.01 },
    { key: "OUTER_RING_SCALE", label: "Outer ring", min: 0.85, max: 1.60, step: 0.01 },
    { key: "OUTER_CORNER_SCALE", label: "Outer corner", min: 0.85, max: 1.40, step: 0.01 },
    { key: "INNER_CORNER_SCALE", label: "Inner corner", min: 0.80, max: 1.20, step: 0.01 },
    { key: "LASH_SCALE", label: "Lash ring", min: 0.85, max: 1.40, step: 0.01 },
];

const TUNING_STORAGE_KEY = "ccic-face-distortion-stage10-slider";
const tuningControls = new Map();
// ----------------------------------------------------
// MediaPipe eye contour groups (subject perspective)
// ----------------------------------------------------
const LEFT_EYE_CONTOUR = [33, 7, 163, 144, 145, 153, 154, 155, 133, 246, 161, 160, 159, 158, 157, 173];

const RIGHT_EYE_CONTOUR = [263, 249, 390, 373, 374, 380, 381, 382, 362, 466, 388, 387, 386, 385, 384, 398];

const LEFT_BROW_POINTS = [55, 107, 65, 66, 52, 105, 63, 53, 46, 70];

const RIGHT_BROW_POINTS = [285, 336, 296, 295, 282, 334, 293, 283, 300, 276];


// Äußerer weicher Ring um das linke Auge herum
// (keine Brauenpunkte drin, damit die Braue frei bleibt)
const LEFT_EYE_OUTER_RING1 = [130, 247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 25];

const LEFT_EYE_OUTER_RING2 = [226, 113, 225, 224, 223, 222, 221, 189, 244, 233, 232, 231, 230, 229, 228, 31];

const LEFT_EYE_OUTER_RING3 = [53, 46, 124, 35, 111, 117, 118];


// rechts
// Äußerer weicher Ring um das rechte Auge herum
const RIGHT_EYE_OUTER_RING1 = [359, 467, 260, 259, 257, 258, 286, 414, 463, 341, 256, 252, 253, 254, 339, 255];

const RIGHT_EYE_OUTER_RING2 = [446, 342, 445, 444, 443, 442, 441, 413, 464, 341, 453, 452, 451, 450, 449, 448, 261];

const RIGHT_EYE_OUTER_RING3 = [283, 276, 353, 265, 340, 346, 347];



// ----------------------------------------------------
// Outer ring groups for softer shaping
// ----------------------------------------------------
const LEFT_OUTER_TOP_INNER = [30, 29];

const LEFT_OUTER_TOP_CENTER = [27, 28];

const LEFT_OUTER_TOP_OUTER = [130, 247, 56, 190];

const LEFT_OUTER_BOTTOM_INNER = [23, 24];

const LEFT_OUTER_BOTTOM_CENTER = [243, 112, 26, 22, 110, 25];

const LEFT_OUTER_BOTTOM_OUTER = [228, 229, 230, 231, 232, 233];

const LEFT_OUTER_BOTTOM_EXTREME = [31, 244];

// punkte updaten gkeich wie links nur jetzt rechts
const RIGHT_OUTER_TOP_INNER = [260, 259];

const RIGHT_OUTER_TOP_CENTER = [257, 258];

const RIGHT_OUTER_TOP_OUTER = [359, 467, 286, 414];

const RIGHT_OUTER_BOTTOM_INNER = [253, 254];

const RIGHT_OUTER_BOTTOM_CENTER = [341, 256, 252, 339];

const RIGHT_OUTER_BOTTOM_OUTER = [452, 451, 450, 449, 448, 261];

const RIGHT_OUTER_BOTTOM_EXTREME = [453, 452];

const RIGHT_CAT_EYE_POINTS = [
    342,
    265,
    340,
    346
];


// ----------------------------------------------------
// Verified inner-eye triangles
// ----------------------------------------------------
const INNER_EYE_TRIANGLES = [[33, 160, 158], [33, 158, 133], [33, 144, 145], [33, 145, 133], [160, 159, 158], [158, 157, 133], [144, 145, 153], [145, 153, 133], [159, 158, 157], [145, 153, 154], [33, 246, 161], [161, 160, 33], [133, 155, 154], [154, 153, 133], [362, 385, 387], [362, 387, 263], [362, 373, 374], [362, 374, 263], [385, 386, 387], [387, 388, 263], [373, 374, 380], [374, 380, 263], [386, 387, 388], [374, 380, 381], [362, 398, 384], [384, 385, 362], [263, 249, 390], [390, 380, 263], 
[381,382,362],
[381,380,382],
[374,380,381],
[381,380,382],
[381,382,362],
[374,373,390],
[374,390,380]];


const LEFT_EYE_REGION_TRIANGLES = [[33, 7, 25], [7, 25, 110], [7, 163, 110], [163, 110, 144], [144, 110, 24], [144, 24, 23], [144, 145, 23], [145, 23, 22], [145, 22, 153], [153, 154, 22], [154, 22, 26], [154, 26, 155], [130, 25, 33], [226, 130, 25], [155, 112, 133], [112, 243, 133], [133, 243, 190], [133, 190, 173], [173, 190, 56], [173, 157, 56], [157, 28, 56], [157, 158, 28], [158, 28, 159], [159, 28, 27], [160, 159, 27], [29, 27, 160], [30, 29, 160], [30, 160, 161], [30, 247, 161], [247, 161, 246], [247, 246, 33], [33, 247, 130], [247, 226, 130],
 [130,247,246], [26, 155, 112],
];

const LEFT_EYE_RING2_TRIANGLES = [[226, 113, 247], [113, 247, 225], [225, 247, 30], [30, 225, 224], [30, 224, 29], [29, 224, 223], [29, 223, 27], [223, 27, 222], [27, 222, 28], [222, 28, 221], [28, 221, 56], [56, 221, 190], [221, 190, 189], [190, 189, 243], [189, 243, 244], [226, 31, 25], [31, 25, 228], [25, 228, 110], [228, 110, 24], [228, 24, 229], [24, 229, 23], [23, 229, 230], [230, 23, 22], [230, 22, 231], [231, 22, 26], [26, 231, 232], [232, 26, 112], [112, 232, 233], [233, 112, 244], [112, 243, 244]];

const LEFT_EYE_RING3_TRIANGLES = [[223, 224, 53], [224, 225, 53], [53, 46, 225], [46, 225, 113], [46, 113, 124], [124, 113, 35], [35, 226, 113], [35, 226, 111], [226, 111, 31], [111, 31, 117], [31, 228, 117], [228, 117, 229], [117, 118, 229], [229, 230, 118]];

const RIGHT_EYE_REGION_TRIANGLES = [

    // außen unten

    [382,341,256],
    [256,382,381],

    [256,381,252],

    [252,381,380],
    [380,252,374],

    [252,374,253],
    [374,253,373],

    [373,253,254],
    [254,373,339],

    [373,390,339],
    [390,249,339],

    [339,249,255],

    [249,255,390],
    [249,255,263],

    // inner corner unten

    [463,362,341],
    [362,382,341],

    // inner corner oben

    [463,362,414],
    [414,362,398],

    // außen oben

    [414,398,286],
    [398,384,286],

    [286,384,258],

    [258,385,384],
    [258,385,386],

    [258,386,257],
    [386,257,387],

    [257,259,387],
    [259,387,260],

    [260,387,388],
    [388,260,466],

    [466,260,467],
    [466,467,263],

    [263,467,359]
];
const RIGHT_EYE_RING2_TRIANGLES = [[359, 446, 467], [467, 342, 446], [467, 342, 445], [445, 467, 260], [260, 445, 444], [444, 260, 259], [444, 259, 443], [443, 257, 259], [443, 257, 442], [442, 258, 257], [442, 258, 441], [441, 286, 258], [441, 286, 414], [414, 441, 413], [413, 414, 463], [463, 464, 413], [464, 463, 341], [341, 464, 453], [453, 341, 452], [341, 256, 452], [256, 452, 451], [256, 451, 252], [252, 451, 450], [252, 253, 450], [253, 450, 449], [253, 449, 254], [254, 449, 448], [339, 254, 448], [339, 255, 448], [255, 448, 261], [261, 255, 446], [255, 446, 359]];

const RIGHT_EYE_RING3_TRIANGLES = [[443, 444, 283], [444, 283, 445], [445, 283, 276], [276, 445, 342], [342, 276, 353], [353, 342, 265], [265, 446, 342], [446, 340, 265], [446, 340, 261], [261, 340, 346], [448, 261, 346], [449, 448, 346], [346, 449, 347], [347, 449, 450]];


// ----------------------------------------------------
// Outer band triangles: stitches inner contour to outer ring
// ----------------------------------------------------
const ALL_TRIANGLES = [
    ...INNER_EYE_TRIANGLES, 

    ...LEFT_EYE_REGION_TRIANGLES, 
    ...LEFT_EYE_RING2_TRIANGLES, 
    ...LEFT_EYE_RING3_TRIANGLES, 
    
    ...RIGHT_EYE_REGION_TRIANGLES, 
    ...RIGHT_EYE_RING2_TRIANGLES, 
    ...RIGHT_EYE_RING3_TRIANGLES
];


// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
function landmarkToCanvas(p, point, videoSize) {
    const rect = getCoverRect(p.width, p.height, videoSize.width, videoSize.height);
    const videoX = point.x <= 1 ? point.x * videoSize.width : point.x;
    const videoY = point.y <= 1 ? point.y * videoSize.height : point.y;
    return {
        x: rect.x + (videoX / videoSize.width) * rect.w,
        y: rect.y + (videoY / videoSize.height) * rect.h,
    };
}

function getCenter(points, indices) {
    let x = 0;
    let y = 0;
    let count = 0;
    for (const index of indices) {
        const pt = points[index];
        if (!pt) continue;
        x += pt.x;
        y += pt.y;
        count += 1;
    }
    if (count === 0) {
        return {
            x: 0,
            y: 0
        };
    }
    return {
        x: x / count,
        y: y / count,
    };
}

function scalePoint(points, index, center, scale) {
    if (!points[index]) return;
    points[index] = {
        x: center.x + (points[index].x - center.x) * scale,
        y: center.y + (points[index].y - center.y) * scale,
    };
}

function scalePointWithBarrier(points, index, center, scale, browLineY) {
    if (!points[index]) return;
    const p = points[index];
    // Abstand zur Brauenlinie
    const distance = p.y - browLineY;
    // Oberhalb der Braue
    if (distance < 0) {
        return;
    }
    // 0..1 Übergang innerhalb von 30px
    const weight = Math.min(1, Math.max(0, distance / 30));
    const finalScale = 1 + (scale - 1) * weight;
    points[index] = {
        x: center.x + (p.x - center.x) * finalScale,
        y: center.y + (p.y - center.y) * finalScale,
    };
}

function scaleGroup(points, indices, center, scale) {
    for (const index of indices) {
        scalePoint(points, index, center, scale);
    }
}

function scaleGroups(points, groups, center, scale) {
    for (const group of groups) {
        scaleGroup(points, group, center, scale);
    }
}

function readStoredTuning() {
    try {
        const raw = window.localStorage.getItem(TUNING_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        for (const config of TUNING_CONFIG) {
            const value = Number(parsed[config.key]);
            if (Number.isFinite(value)) {
                tuning[config.key] = value;
            }
        }
    } catch (error) {
        console.warn("Could not load tuning preset:", error);
    }
}

function saveStoredTuning() {
    try {
        window.localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(tuning));
    } catch (error) {
        console.warn("Could not save tuning preset:", error);
    }
}

function setTuningValue(key, value, persist = true) {
    tuning[key] = value;
    const control = tuningControls.get(key);
    if (control) {
        control.valueLabel.html(value.toFixed(2));
        if (Number(control.slider.value()) !== value) {
            control.slider.value(value);
        }
    }
    if (persist) {
        saveStoredTuning();
    }
}

function syncAllControls() {
    for (const config of TUNING_CONFIG) {
        setTuningValue(config.key, tuning[config.key], false);
    }
}

function createTuningOverlay(p) {
    const panel = p.createDiv();
    panel.parent(document.body);
    panel.style("position", "fixed");
    panel.style("top", "16px");
    panel.style("right", "16px");
    panel.style("width", "320px");
    panel.style("max-height", "calc(100vh - 32px)");
    panel.style("overflow-y", "auto");
    panel.style("padding", "14px 14px 12px");
    panel.style("border-radius", "16px");
    panel.style("background", "rgba(10, 10, 10, 0.78)");
    panel.style("backdrop-filter", "blur(16px)");
    panel.style("-webkit-backdrop-filter", "blur(16px)");
    panel.style("border", "1px solid rgba(255, 255, 255, 0.14)");
    panel.style("box-shadow", "0 18px 50px rgba(0, 0, 0, 0.45)");
    panel.style("color", "#fff");
    panel.style("font-family", "Arial, sans-serif");
    panel.style("z-index", "20");

    const title = p.createDiv("Stage 10 Slider");
    title.parent(panel);
    title.style("font-size", "14px");
    title.style("font-weight", "700");
    title.style("letter-spacing", "0.08em");
    title.style("text-transform", "uppercase");
    title.style("margin-bottom", "10px");

    const description = p.createDiv("Live tuning for the eye warp constants.");
    description.parent(panel);
    description.style("font-size", "12px");
    description.style("line-height", "1.35");
    description.style("opacity", "0.72");
    description.style("margin-bottom", "12px");

    for (const config of TUNING_CONFIG) {
        const row = p.createDiv();
        row.parent(panel);
        row.style("margin-bottom", "10px");

        const top = p.createDiv();
        top.parent(row);
        top.style("display", "flex");
        top.style("justify-content", "space-between");
        top.style("align-items", "baseline");
        top.style("gap", "12px");

        const label = p.createDiv(config.label);
        label.parent(top);
        label.style("font-size", "12px");
        label.style("font-weight", "600");

        const valueLabel = p.createDiv(tuning[config.key].toFixed(2));
        valueLabel.parent(top);
        valueLabel.style("font-size", "12px");
        valueLabel.style("font-variant-numeric", "tabular-nums");
        valueLabel.style("opacity", "0.85");

        const slider = p.createSlider(config.min, config.max, tuning[config.key], config.step);
        slider.parent(row);
        slider.style("width", "100%");

        slider.input(() => {
            const value = Number(slider.value());
            setTuningValue(config.key, value);
        });

        tuningControls.set(config.key, { slider, valueLabel });
    }

    const actions = p.createDiv();
    actions.parent(panel);
    actions.style("display", "flex");
    actions.style("gap", "8px");
    actions.style("margin-top", "8px");

    const resetButton = p.createButton("Reset");
    resetButton.parent(actions);
    resetButton.style("flex", "1");
    resetButton.style("padding", "10px 12px");
    resetButton.style("border", "0");
    resetButton.style("border-radius", "10px");
    resetButton.style("background", "#ffffff");
    resetButton.style("color", "#111111");
    resetButton.style("font-weight", "700");
    resetButton.style("cursor", "pointer");
    resetButton.mousePressed(() => {
        Object.assign(tuning, DEFAULT_TUNING);
        syncAllControls();
        saveStoredTuning();
    });

    const presetButton = p.createButton("Save");
    presetButton.parent(actions);
    presetButton.style("flex", "1");
    presetButton.style("padding", "10px 12px");
    presetButton.style("border", "0");
    presetButton.style("border-radius", "10px");
    presetButton.style("background", "#4b8cff");
    presetButton.style("color", "#ffffff");
    presetButton.style("font-weight", "700");
    presetButton.style("cursor", "pointer");
    presetButton.mousePressed(() => {
        saveStoredTuning();
    });

    syncAllControls();
}

function createManipulatedPoints(originalPoints) {
    const points = originalPoints.map((p) => ({
        x: p.x,
        y: p.y,
    }));

    // ----------------------------------------------------
    // Zentren berechnen
    // ----------------------------------------------------

    const leftCenter = getCenter(
        originalPoints,
        LEFT_EYE_CONTOUR
    );

    const rightCenter = getCenter(
        originalPoints,
        RIGHT_EYE_CONTOUR
    );

    // ----------------------------------------------------
    // Brow Barrier links
    // ----------------------------------------------------

    let leftBrowLineY = 0;

    for (const id of LEFT_BROW_POINTS) {
        leftBrowLineY += originalPoints[id].y;
    }

    leftBrowLineY /= LEFT_BROW_POINTS.length;

    // ----------------------------------------------------
    // Brow Barrier rechts
    // ----------------------------------------------------

    let rightBrowLineY = 0;

    for (const id of RIGHT_BROW_POINTS) {
        rightBrowLineY += originalPoints[id].y;
    }

    rightBrowLineY /= RIGHT_BROW_POINTS.length;

    // ----------------------------------------------------
    // Linkes Auge
    // ----------------------------------------------------

    scaleGroup(points, LEFT_EYE_CONTOUR, leftCenter, tuning.EYE_CENTER_SCALE);
    scalePoint(points, 33, leftCenter, tuning.OUTER_CORNER_SCALE);
    scalePoint(points, 133, leftCenter, tuning.INNER_CORNER_SCALE);

    scaleGroups(points, [[246, 161], [160, 159, 158, 157, 173]], leftCenter, tuning.UPPER_LID_SCALE);
    scaleGroups(points, [[7, 163, 144, 145, 153, 154, 155]], leftCenter, tuning.LOWER_LID_SCALE);

    scaleGroup(points, LEFT_EYE_OUTER_RING1, leftCenter, tuning.OUTER_RING_SCALE);

    for (const id of LEFT_EYE_OUTER_RING2) {
        scalePointWithBarrier(points, id, leftCenter, tuning.LASH_SCALE, leftBrowLineY);
    }

    for (const id of LEFT_EYE_OUTER_RING3) {
        scalePointWithBarrier(points, id, leftCenter, tuning.LASH_SCALE, leftBrowLineY);
    }

    scaleGroups(points, [LEFT_OUTER_TOP_INNER, LEFT_OUTER_BOTTOM_INNER], leftCenter, tuning.OUTER_INNER_SCALE);
    scaleGroups(points, [LEFT_OUTER_TOP_CENTER], leftCenter, tuning.OUTER_TOP_CENTER_SCALE);
    scaleGroups(points, [LEFT_OUTER_TOP_OUTER], leftCenter, tuning.OUTER_TOP_OUTER_SCALE);
    scaleGroups(points, [LEFT_OUTER_BOTTOM_CENTER], leftCenter, tuning.OUTER_BOTTOM_CENTER_SCALE);
    scaleGroups(points, [LEFT_OUTER_BOTTOM_OUTER], leftCenter, tuning.OUTER_BOTTOM_OUTER_SCALE);
    scaleGroups(points, [LEFT_OUTER_BOTTOM_EXTREME], leftCenter, tuning.OUTER_BOTTOM_EXTREME_SCALE);

    // ----------------------------------------------------
    // Rechtes Auge
    // ----------------------------------------------------

    scaleGroup(points, RIGHT_EYE_CONTOUR, rightCenter, tuning.EYE_CENTER_SCALE);
    scalePoint(points, 263, rightCenter, tuning.OUTER_CORNER_SCALE);
    scalePoint(points, 362, rightCenter, tuning.INNER_CORNER_SCALE);

    scaleGroups(points, [[466, 388], [387, 386, 385, 384, 398]], rightCenter, tuning.UPPER_LID_SCALE);
    scaleGroups(points, [[249, 390, 373, 374, 380, 381, 382]], rightCenter, tuning.LOWER_LID_SCALE);

    scaleGroup(points, RIGHT_EYE_OUTER_RING1, rightCenter, tuning.OUTER_RING_SCALE);

    for (const id of RIGHT_EYE_OUTER_RING2) {
        scalePointWithBarrier(points, id, rightCenter, tuning.LASH_SCALE, rightBrowLineY);
    }

    for (const id of RIGHT_EYE_OUTER_RING3) {
        scalePointWithBarrier(points, id, rightCenter, tuning.LASH_SCALE, rightBrowLineY);
    }

    scaleGroups(points, [RIGHT_OUTER_TOP_INNER, RIGHT_OUTER_BOTTOM_INNER], rightCenter, tuning.OUTER_INNER_SCALE);
    scaleGroups(points, [RIGHT_OUTER_TOP_CENTER], rightCenter, tuning.OUTER_TOP_CENTER_SCALE);
    scaleGroups(points, [RIGHT_OUTER_TOP_OUTER], rightCenter, tuning.OUTER_TOP_OUTER_SCALE);
    scaleGroups(points, [RIGHT_OUTER_BOTTOM_CENTER], rightCenter, tuning.OUTER_BOTTOM_CENTER_SCALE);
    scaleGroups(points, [RIGHT_OUTER_BOTTOM_OUTER], rightCenter, tuning.OUTER_BOTTOM_OUTER_SCALE);
    scaleGroups(points, [RIGHT_OUTER_BOTTOM_EXTREME], rightCenter, tuning.OUTER_BOTTOM_EXTREME_SCALE);

    return points;
}


// ----------------------------------------------------
// App
// ----------------------------------------------------
new p5((p) => {
    p.setup = async () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        p.pixelDensity(1);
        canvas.style("position", "fixed");
        canvas.style("inset", "0");
        canvas.style("z-index", "0");

        readStoredTuning();
        createTuningOverlay(p);
        await waitForOpenCV();
        testWarpAffine();
        await setupFaceTracking();
    };
    p.draw = () => {
        p.background(0);
        const video = getVideo();
        const videoSize = getVideoSize();
        if (!video || video.readyState < 2) {
            drawStatus(p, "Kamera lädt...");
            return;
        }
        drawCamera(p, video, videoSize);
        if (!tested && window.cv) {
            tested = true;
        }
        if (!isFaceTrackingReady() || !hasFace()) {
            drawStatus(p, "Stage 9");
            return;
        }
        const face = getFaces()[0];
        const cv = window.cv;
        const originalPoints = face.keypoints.map((pt) => landmarkToCanvas(p, pt, videoSize));
        const manipulatedPoints = createManipulatedPoints(originalPoints);
        
          

// const DEBUG_POINTS = [
//     ...RIGHT_EYE_OUTER_RING2,
//     ...RIGHT_EYE_OUTER_RING3
// ];

// for (const id of DEBUG_POINTS) {
//     const pt = manipulatedPoints[id];

//     p.fill(255,0,0);
//     p.noStroke();
//     p.textSize(6)
//     p.circle(pt.x, pt.y, 8);

//     p.fill(255,255,0);
//     p.text(id, pt.x, pt.y - 10);
// }

        const srcMat = cv.imread(p.canvas);
        const dstMat = srcMat.clone();
        try {
            for (const tri of ALL_TRIANGLES) {
                const srcTriangle = tri.map((id) => originalPoints[id]);
                const dstTriangle = tri.map((id) => manipulatedPoints[id]);
                if (srcTriangle.some((pt) => !pt) || dstTriangle.some((pt) => !pt)) {
                    continue;
                }
                
                
                if (!DEBUG_SKIP_WARP) {
                    warpTriangle(srcMat, dstMat, srcTriangle, dstTriangle);
                }


            }
            
            
            if (!DEBUG_SKIP_WARP) {
                cv.imshow(p.canvas, dstMat);
            }

        } catch (error) {
            console.error("Error in stage9:", error);
        } finally {
            srcMat.delete();
            dstMat.delete();
        }
        drawStatus(p, "Stage 10 Slider");
    };
    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
});