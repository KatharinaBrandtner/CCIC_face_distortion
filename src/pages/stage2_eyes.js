import p5 from 'p5';

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
    createManipulatedPoints,
} from "../other/eyeMath.js";

import {
    ALL_TRIANGLES,
} from "../triangles/eyeConstants.js";

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
            drawStatus(p, "Stage 2");
            return;
        }
        const face = getFaces()[0];
        const cv = window.cv;
        const originalPoints = face.keypoints.map((pt) => landmarkToCanvas(p, pt, videoSize));
        const manipulatedPoints = createManipulatedPoints(originalPoints);
        
        const srcMat = cv.imread(p.canvas);
        const dstMat = srcMat.clone();
        try {
            for (const tri of ALL_TRIANGLES) {
                const srcTriangle = tri.map((id) => originalPoints[id]);
                const dstTriangle = tri.map((id) => manipulatedPoints[id]);
                if (srcTriangle.some((pt) => !pt) || dstTriangle.some((pt) => !pt)) {
                    continue;
                }

                warpTriangle(srcMat, dstMat, srcTriangle, dstTriangle);
            }

            cv.imshow(p.canvas, dstMat);
        } catch (error) {
            console.error("Error in stage2:", error);
        } finally {
            srcMat.delete();
            dstMat.delete();
        }
        drawStatus(p, "Stage 2");
    };
    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
});