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
} from "../drawing.js";
import {
    warpTriangle,
} from "../effects/triangleWarp.js";
import {
    landmarkToCanvas,
    createManipulatedMouthPoints,
} from "../other/mouthMath.js";
import {
    MOUTH_TRIANGLES,
    MOUTH_INNER,
    MOUTH_OUTER,
    UPPER_SMILE_POINTS,
    LOWER_SMILE_POINTS,
    LEFT_SMILE_GROUP,
    RIGHT_SMILE_GROUP,
    LEFT_CHEEK_SMILE,
    RIGHT_CHEEK_SMILE,
    LEFT_CORNER_CHAIN,
    RIGHT_CORNER_CHAIN,
    LOWER_OUTER_SMILE,
    OPEN_MOUTH_TRIANGLES,
    MOUTH_ROI,
    MOUTH_SCALE_BORDER,
    MOUTH_SCALE_INNER,
    MOUTH_SCALE_TRIANGLES,
    MOUTH_INNER_FILL_TRIANGLES
} from "../triangles/mouthPoints.js";

function getMouthBounds(points) {
    const ids = MOUTH_ROI;
    const xs = ids.map(id => points[id].x);
    const ys = ids.map(id => points[id].y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

function drawScaledMouth(originalPoints) {
    const scaledPoints = originalPoints.map(p => ({
        x: p.x,
        y: p.y
    }));
    const borderPoints = MOUTH_SCALE_BORDER.map(id => originalPoints[id]);
    const centermath = {
        x: borderPoints.reduce(
            (sum, p) => sum + p.x, 0) / borderPoints.length,
        y: borderPoints.reduce(
            (sum, p) => sum + p.y, 0) / borderPoints.length
    };
    const innerScale = 1.20;
    const borderScale = 1.08;
    // Mundinhalt stärker vergrößern
    for (const id of MOUTH_SCALE_INNER) {
        const dx = scaledPoints[id].x - centermath.x;
        const dy = scaledPoints[id].y - centermath.y;
        scaledPoints[id].x = centermath.x + dx * innerScale;
        scaledPoints[id].y = centermath.y + dy * innerScale;
    }
    // Rand leicht mitziehen
    for (const id of MOUTH_SCALE_BORDER) {
        const dx = scaledPoints[id].x - centermath.x;
        const dy = scaledPoints[id].y - centermath.y;
        scaledPoints[id].x = centermath.x + dx * borderScale;
        scaledPoints[id].y = centermath.y + dy * borderScale;
    }
    const center = createMouthCenterPoint(originalPoints);
    const scaledCenter = {
        x: centermath.x,
        y: centermath.y
    };
    scaledPoints.push(createMouthCenterPoint(scaledPoints));
    return scaledPoints;
}

function createMouthCenterPoint(points) {
    const ids = MOUTH_INNER;
    return {
        x: ids.reduce(
            (sum, id) => sum + points[id].x, 0) / ids.length,
        y: ids.reduce(
            (sum, id) => sum + points[id].y, 0) / ids.length
    };
}

function clearMouthArea(cv, dstMat, points) {
    const ids = [...MOUTH_SCALE_BORDER, ];
    const poly = cv.matFromArray(ids.length, 1, cv.CV_32SC2, ids.flatMap(id => [
        Math.round(points[id].x),
        Math.round(points[id].y)
    ]));
    cv.fillConvexPoly(dstMat, poly, new cv.Scalar(0, 255, 0, 255));
    poly.delete();
}
new p5((p) => {
    p.setup = async () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.pixelDensity(1);
        await waitForOpenCV();
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
        if (!isFaceTrackingReady() || !hasFace()) {
            drawStatus(p, "Stage 3");
            return;
        }
        const face = getFaces()[0];
        const cv = window.cv;
        const originalPoints = face.keypoints.map((pt) => landmarkToCanvas(p, pt, videoSize));
        const result = createManipulatedMouthPoints(originalPoints);
        const manipulatedPoints = result.points;
        const mode = result.mode;
        const bounds = getMouthBounds(originalPoints);
        const srcMat = cv.imread(p.canvas);
        const dstMat = srcMat.clone();
        let scaledPoints = null;
        try {
            if (mode === "open") {
                scaledPoints = drawScaledMouth(originalPoints);
                const originalWithCenter = [...originalPoints,
                    createMouthCenterPoint(originalPoints)
                ];
                const allTriangles = [...MOUTH_SCALE_TRIANGLES, ...MOUTH_INNER_FILL_TRIANGLES,
                    [61, 78, 95],
                    [61, 95, 146],
                    [146, 95, 78],
                    [95, 88, 178],
                    [95, 178, 78],
                    [88, 178, 87],
                    [88, 87, 95],
                    [178, 87, 14],
                    [95, 87, 178],
                    [78, 95, 61],
                    [95, 61, 146],
                    [95, 88, 146],
                    [88, 146, 91],
                    [88, 91, 178],
                    [61, 95, 88],
                ];
                for (const tri of allTriangles) {
                    const srcTriangle = tri.map(id => {
                        if (id === 478) {
                            return originalWithCenter[478];
                        }
                        return originalPoints[id];
                    });
                    const dstTriangle = tri.map(id => {
                        if (id === 478) {
                            return scaledPoints[478];
                        }
                        return scaledPoints[id];
                    });
                    warpTriangle(srcMat, dstMat, srcTriangle, dstTriangle);
                }
            } else {
                for (const tri of MOUTH_TRIANGLES) {
                    const srcTriangle = tri.map(id => originalPoints[id]);
                    const dstTriangle = tri.map(id => manipulatedPoints[id]);
                    warpTriangle(srcMat, dstMat, srcTriangle, dstTriangle);
                }
            }
            cv.imshow(p.canvas, dstMat);
            //             
        } catch (error) {
            console.error("Error in stage3:", error);
        } finally {
            srcMat.delete();
            dstMat.delete();
        }
        drawStatus(p, "Stage 3");
    };
    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
});