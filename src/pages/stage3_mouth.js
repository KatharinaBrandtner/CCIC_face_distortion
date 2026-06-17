import p5 from "p5";

import { waitForOpenCV } from "../opencvReady.js";

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
    createManipulatedMouthPoints
} from "../other/mouthMath.js";

import {
    MOUTH_TRIANGLES,
} from "../triangles/mouthPoints.js";




import {
    LEFT_SMILE_GROUP,
    RIGHT_SMILE_GROUP
} from "../triangles/mouthPoints.js";

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
        const manipulatedPoints = createManipulatedMouthPoints(originalPoints);



 
        

// for (const tri of MOUTH_TRIANGLES) {

//     const a = manipulatedPoints[tri[0]];
//     const b = manipulatedPoints[tri[1]];
//     const c = manipulatedPoints[tri[2]];

//     p.stroke(0);
//     p.noFill();

//     p.triangle(
//         a.x, a.y,
//         b.x, b.y,
//         c.x, c.y
//     );
// }      


// for (const id of LEFT_SMILE_GROUP) {

//     const pt = manipulatedPoints[id];

//     p.fill(255,0,0);
//     p.noStroke();
//     if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) {
//     console.log("kaputt links", id, pt);
// }
//     p.circle(pt.x, pt.y, 8);
// }

// for (const id of RIGHT_SMILE_GROUP) {

//     const pt = manipulatedPoints[id];

//     p.fill(0,255,0);
//     p.noStroke();
//    if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) {
//     console.log("kaputt rechts", id, pt);
// }
//     p.circle(pt.x, pt.y, 8);
// }



// for (const tri of MOUTH_TRIANGLES) {

//     const srcTriangle = tri.map((id) => originalPoints[id]);
//     const dstTriangle = tri.map((id) => manipulatedPoints[id]);

//     const area =
//         Math.abs(
//             (dstTriangle[1].x - dstTriangle[0].x) *
//             (dstTriangle[2].y - dstTriangle[0].y)
//             -
//             (dstTriangle[2].x - dstTriangle[0].x) *
//             (dstTriangle[1].y - dstTriangle[0].y)
//         );

//     if (area < 0.5) {
//         console.log("SEHR KLEINES TRIANGLE", tri);
//     }
// }

        const srcMat = cv.imread(p.canvas);
        const dstMat = srcMat.clone();
        try {
            // hier mund verändert wird, damit es wie ein Lächeln aussieht, wenn er offen ist. Es werden bestimmte Punkte um die Mundwinkel und Lippen angehoben und verbreitert, abhängig davon, wie weit der Mund geöffnet ist. Wenn der Mund geschlossen ist, werden die Punkte so manipuliert, dass es wie ein leichtes Lächeln aussieht.
            for (const tri of MOUTH_TRIANGLES) {
                const srcTriangle = tri.map((id) => originalPoints[id]);
                const dstTriangle = tri.map((id) => manipulatedPoints[id]);
                if (srcTriangle.some((pt) => !pt) || dstTriangle.some((pt) => !pt)) {
                    continue;
                }

                warpTriangle(srcMat, dstMat, srcTriangle, dstTriangle);
            }

            cv.imshow(p.canvas, dstMat);
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


