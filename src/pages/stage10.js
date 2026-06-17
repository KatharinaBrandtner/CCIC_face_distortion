import p5 from "p5";
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
const EYE_CENTER_SCALE = 1.08;
const UPPER_LID_SCALE = 1.10;
const LOWER_LID_SCALE = 1.10;
const OUTER_TOP_CENTER_SCALE = 1.06;
const OUTER_TOP_OUTER_SCALE = 1.08;
const OUTER_BOTTOM_CENTER_SCALE = 1.08;
const OUTER_BOTTOM_OUTER_SCALE = 1.14;
const OUTER_BOTTOM_EXTREME_SCALE = 1.08;
const OUTER_INNER_SCALE = 1.04;
const OUTER_RING_SCALE = 1.10;
const OUTER_CORNER_SCALE = 1.07;
const INNER_CORNER_SCALE = 1.0;
const LASH_SCALE = 1.05;
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

    // Auge
    scaleGroup(
        points,
        LEFT_EYE_CONTOUR,
        leftCenter,
        1.50
    );

    // Ring 1
    scaleGroup(
        points,
        LEFT_EYE_OUTER_RING1,
        leftCenter,
        1.25
    );

    // Ring 2
    for (const id of LEFT_EYE_OUTER_RING2) {
        scalePointWithBarrier(
            points,
            id,
            leftCenter,
            1.10,
            leftBrowLineY
        );
    }

    // Ring 3
    for (const id of LEFT_EYE_OUTER_RING3) {
        scalePointWithBarrier(
            points,
            id,
            leftCenter,
            1.05,
            leftBrowLineY
        );
    }

    // ----------------------------------------------------
    // Rechtes Auge
    // ----------------------------------------------------

    // Auge
    scaleGroup(
        points,
        RIGHT_EYE_CONTOUR,
        rightCenter,
        1.50
    );

    // Ring 1
    scaleGroup(
        points,
        RIGHT_EYE_OUTER_RING1,
        rightCenter,
        1.25
    );

    // Ring 2
    for (const id of RIGHT_EYE_OUTER_RING2) {
        scalePointWithBarrier(
            points,
            id,
            rightCenter,
            1.10,
            rightBrowLineY
        );
    }

    // Ring 3
    for (const id of RIGHT_EYE_OUTER_RING3) {
        scalePointWithBarrier(
            points,
            id,
            rightCenter,
            1.05,
            rightBrowLineY
        );
    }

    

    return points;
}


// ----------------------------------------------------
// App
// ----------------------------------------------------
new p5((p) => {
    p.setup = async () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.pixelDensity(1);
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
        drawStatus(p, "Stage 9");
    };
    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
});