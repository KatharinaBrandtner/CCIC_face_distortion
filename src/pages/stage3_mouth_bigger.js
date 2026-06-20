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
    createManipulatedMouthPoints,
    getMouthBounds,
    drawScaledMouth,
    createMouthCenterPoint
} from "../other/mouthMath.js";
import {
    MOUTH_TRIANGLES,
    MOUTH_INNER,
    MOUTH_SCALE_TRIANGLES,
    MOUTH_INNER_FILL_TRIANGLES
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
        const result = createManipulatedMouthPoints(originalPoints);
        const manipulatedPoints = result.points;
        const mode = result.mode;
        const openAmount = result.openAmount;
        const bounds = getMouthBounds(originalPoints);
        const srcMat = cv.imread(p.canvas);
        const dstMat = srcMat.clone();
        let scaledPoints = null;
        try {
            if (mode === "open") {
                scaledPoints = drawScaledMouth(originalPoints, openAmount);
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