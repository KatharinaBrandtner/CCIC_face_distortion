// in der datei sind eyess und mouth gemeinsam gerendert also das ist die datei wies am ende circa aussieht
// die imports usw verweisen dann noch auf die restlichen nötigen dateien

import p5 from 'p5';

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
    createManipulatedPoints,
} from "../other/eyeMath.js";

import {
    ALL_TRIANGLES,
} from "../triangles/eyeConstants.js";

import {
    createManipulatedMouthPoints,
    drawScaledMouth,
    createMouthCenterPoint,
} from "../other/mouthMath.js";

import {
    MOUTH_TRIANGLES,
    MOUTH_SCALE_TRIANGLES,
    MOUTH_INNER_FILL_TRIANGLES,
} from "../triangles/mouthPoints.js";

function clonePoints(points) {
    return points.map((point) => ({
        x: point.x,
        y: point.y,
    }));
}
export function runManipulation(p, face, videoSize) {
    p.push();
    p.translate(p.width, 0);
    p.scale(-1, 1);

    // hier werden die kamera pixel in points umgewandelt, die dann manipuliert werden können
    const originalPoints = face.keypoints.map((pt) =>
        landmarkToCanvas(p, pt, videoSize)
    );

    // hier werden die originalen Punkte gespiegelt, damit die Manipulation auf der gespiegelten Kamera durchgeführt wird, was für den Nutzer intuitiver ist
    const mirroredPoints = originalPoints.map((pt) => ({
        x: p.width - pt.x,
        y: pt.y,
    }));



    // augen manipulation
    const eyePoints = createManipulatedPoints(mirroredPoints);
    // mund manipulation
    const mouthResult = createManipulatedMouthPoints(mirroredPoints);
    const mouthPoints = mouthResult.points;
    const mouthMode = mouthResult.mode;
    const openAmount = mouthResult.openAmount;

    const finalPoints = clonePoints(eyePoints);
    // zsm führend von eye und mouth manipulation, damit beide gleichzeitig gerendert werden können
    for (let i = 0; i < mouthPoints.length; i++) {
        if (mouthPoints[i]) {
            finalPoints[i] = mouthPoints[i];
        }
    }
    // source und destination matrizen für opencv
    const srcMat = cv.imread(p.canvas);
    const dstMat = srcMat.clone();

    try {
        for (const tri of ALL_TRIANGLES) {
            const srcTriangle = tri.map((id) => mirroredPoints[id]);
            const dstTriangle = tri.map((id) => eyePoints[id]);

            if (
                srcTriangle.some((pt) => !pt) ||
                dstTriangle.some((pt) => !pt)
            ) {
                continue;
            }
            // hier wird die eigentliche Verzerrung durchgeführt, indem die Dreiecke von der Originalposition zur neuen Position verzerrt werden
            warpTriangle(
                srcMat,
                dstMat,
                srcTriangle,
                dstTriangle
            );
        }

        if (mouthMode === "open") {
            const scaledPoints = drawScaledMouth(mirroredPoints, openAmount);

            const originalWithCenter = [
                ...mirroredPoints,
                createMouthCenterPoint(mirroredPoints),
            ];
            // hier ist iwo noch in traingle ehler was den mund angeht 
            const openMouthTriangles = [
                ...MOUTH_SCALE_TRIANGLES,
                ...MOUTH_INNER_FILL_TRIANGLES,
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

            for (const tri of openMouthTriangles) {
                const srcTriangle = tri.map((id) => {
                    if (id === 478) {
                        return originalWithCenter[478];
                    }

                    return mirroredPoints[id];
                });

                const dstTriangle = tri.map((id) => {
                    if (id === 478) {
                        return scaledPoints[478];
                    }

                    return scaledPoints[id];
                });

                warpTriangle(
                    srcMat,
                    dstMat,
                    srcTriangle,
                    dstTriangle
                );
            }
        } else {
            for (const tri of MOUTH_TRIANGLES) {
                const srcTriangle = tri.map((id) => mirroredPoints[id]);
                const dstTriangle = tri.map((id) => finalPoints[id]);

                if (
                    srcTriangle.some((pt) => !pt) ||
                    dstTriangle.some((pt) => !pt)
                ) {
                    continue;
                }

                warpTriangle(
                    srcMat,
                    dstMat,
                    srcTriangle,
                    dstTriangle
                );
            }
        }

        cv.imshow(p.canvas, dstMat);
    } catch (error) {
        console.error("Error in stage4:", error);
    } finally {
        srcMat.delete();
        dstMat.delete();
    }

    p.pop();
}