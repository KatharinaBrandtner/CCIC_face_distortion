// src/effects/faceSmoothing.js

const FACE_OVAL = [
    10, 338, 297, 332, 284, 251, 389, 356, 454,
    323, 361, 288, 397, 365, 379, 378, 400, 377,
    152, 148, 176, 149, 150, 136, 172, 58, 132,
    93, 234, 127, 162, 21, 54, 103, 67, 109,
];

const LEFT_EYE_AREA = [
    33, 246, 161, 160, 159, 158, 157, 173,
    133, 155, 154, 153, 145, 144, 163, 7,
    33,
];

const RIGHT_EYE_AREA = [
    362, 398, 384, 385, 386, 387, 388, 466,
    263, 249, 390, 373, 374, 380, 381, 382,
    362,
];

const LEFT_BROW_AREA = [
    70, 63, 105, 66, 107, 55, 65, 52, 53,
    46, 124, 35, 156, 143, 70,
];

const RIGHT_BROW_AREA = [
    300, 293, 334, 296, 336, 285, 295, 282, 283,
    276, 353, 265, 383, 372, 300,
];

const MOUTH_AREA = [
    61, 185, 40, 39, 37, 0, 267, 269, 270,
    409, 291, 375, 321, 405, 314, 17, 84,
    181, 91, 146, 61,
];

const INNER_MOUTH_AREA = [
    78, 95, 88, 178, 87, 14, 317, 402, 318,
    324, 308, 415, 310, 311, 312, 13, 82, 81,
    42, 183, 78,
];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getFaceRect(points, canvasW, canvasH, padding = 12) {
    const facePoints = FACE_OVAL
        .map((id) => points[id])
        .filter(Boolean);

    if (facePoints.length < 20) {
        return null;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const point of facePoints) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }

    const x = clamp(Math.floor(minX - padding), 0, canvasW - 1);
    const y = clamp(Math.floor(minY - padding), 0, canvasH - 1);

    const right = clamp(Math.ceil(maxX + padding), 1, canvasW);
    const bottom = clamp(Math.ceil(maxY + padding), 1, canvasH);

    if (right <= x || bottom <= y) {
        return null;
    }

    return new cv.Rect(
        x,
        y,
        right - x,
        bottom - y
    );
}

function fillPolygon(mask, points, ids, value) {
    const polygon = [];

    for (const id of ids) {
        const point = points[id];

        if (!point) {
            return;
        }

        polygon.push(
            Math.round(point.x),
            Math.round(point.y)
        );
    }

    const contour = cv.matFromArray(
        ids.length,
        1,
        cv.CV_32SC2,
        polygon
    );

    const contours = new cv.MatVector();
    contours.push_back(contour);

    cv.fillPoly(
        mask,
        contours,
        new cv.Scalar(value, value, value, 255)
    );

    contour.delete();
    contours.delete();
}

export function applyFaceSmoothing(faceMat, points, strength = 0.55) {
    if (!faceMat || !points?.length || strength <= 0) {
        return;
    }

    const amount = clamp(strength, 0, 1);

    const faceRect = getFaceRect(
        points,
        faceMat.cols,
        faceMat.rows
    );

    if (!faceRect) {
        return;
    }

    let roi;
    let originalRgb;
    let smoothedRgb;

    let faceMask;
    let protectedFeatures;
    let expandedFeatures;
    let skinMask;
    let protectKernel;

    let skinMaskFloat;
    let skinMaskRgb;
    let inverseMaskRgb;

    let originalFloat;
    let smoothFloat;

    let smoothPart;
    let originalPart;
    let resultFloat;
    let result;
    let output;
    let ones;

    try {
        roi = faceMat.roi(faceRect);

        originalRgb = new cv.Mat();

        if (roi.channels() === 4) {
            cv.cvtColor(
                roi,
                originalRgb,
                cv.COLOR_RGBA2RGB
            );
        } else {
            roi.copyTo(originalRgb);
        }

        // Haut glätten, Kanten bleiben besser erhalten als bei GaussianBlur
        smoothedRgb = new cv.Mat();

        cv.bilateralFilter(
            originalRgb,
            smoothedRgb,
            9,
            95,
            95
        );

        // Punkte in lokale Koordinaten des ROI umrechnen
        const localPoints = points.map((point) => {
            if (!point) {
                return null;
            }

            return {
                x: point.x - faceRect.x,
                y: point.y - faceRect.y,
            };
        });

        // Ganzes Gesicht als mögliche Hautfläche
        faceMask = cv.Mat.zeros(
            roi.rows,
            roi.cols,
            cv.CV_8UC1
        );

        fillPolygon(
            faceMask,
            localPoints,
            FACE_OVAL,
            255
        );

        // Bereiche, die auf keinen Fall geglättet werden sollen
        protectedFeatures = cv.Mat.zeros(
            roi.rows,
            roi.cols,
            cv.CV_8UC1
        );

        fillPolygon(
            protectedFeatures,
            localPoints,
            LEFT_EYE_AREA,
            255
        );

        fillPolygon(
            protectedFeatures,
            localPoints,
            RIGHT_EYE_AREA,
            255
        );

        fillPolygon(
            protectedFeatures,
            localPoints,
            LEFT_BROW_AREA,
            255
        );

        fillPolygon(
            protectedFeatures,
            localPoints,
            RIGHT_BROW_AREA,
            255
        );

        fillPolygon(
            protectedFeatures,
            localPoints,
            MOUTH_AREA,
            255
        );

        fillPolygon(
            protectedFeatures,
            localPoints,
            INNER_MOUTH_AREA,
            255
        );

        // Schutzbereiche vergrößern, damit die Glättung
        // nicht bis an Augen, Lippen oder Brauen reicht
        protectKernel = cv.getStructuringElement(
            cv.MORPH_ELLIPSE,
            new cv.Size(25, 25)
        );

        expandedFeatures = new cv.Mat();

        cv.dilate(
            protectedFeatures,
            expandedFeatures,
            protectKernel
        );

        // Weiß = Haut glätten
        // Schwarz = Originalpixel behalten
        skinMask = new cv.Mat();

        cv.subtract(
            faceMask,
            expandedFeatures,
            skinMask
        );

        // Maske auf 0 bis "strength" umrechnen
        skinMaskFloat = new cv.Mat();

        skinMask.convertTo(
            skinMaskFloat,
            cv.CV_32FC1,
            amount / 255
        );

        skinMaskRgb = new cv.Mat();

        cv.cvtColor(
            skinMaskFloat,
            skinMaskRgb,
            cv.COLOR_GRAY2RGB
        );

        ones = new cv.Mat(
            skinMaskRgb.rows,
            skinMaskRgb.cols,
            cv.CV_32FC3,
            new cv.Scalar(1, 1, 1)
        );

        inverseMaskRgb = new cv.Mat();

        cv.subtract(
            ones,
            skinMaskRgb,
            inverseMaskRgb
        );

        originalFloat = new cv.Mat();
        smoothFloat = new cv.Mat();

        originalRgb.convertTo(
            originalFloat,
            cv.CV_32FC3
        );

        smoothedRgb.convertTo(
            smoothFloat,
            cv.CV_32FC3
        );

        smoothPart = new cv.Mat();
        originalPart = new cv.Mat();
        resultFloat = new cv.Mat();

        cv.multiply(
            smoothFloat,
            skinMaskRgb,
            smoothPart
        );

        cv.multiply(
            originalFloat,
            inverseMaskRgb,
            originalPart
        );

        cv.add(
            smoothPart,
            originalPart,
            resultFloat
        );

        result = new cv.Mat();

        resultFloat.convertTo(
            result,
            cv.CV_8UC3
        );

        output = new cv.Mat();

        if (roi.channels() === 4) {
            cv.cvtColor(
                result,
                output,
                cv.COLOR_RGB2RGBA
            );
        } else {
            result.copyTo(output);
        }

        output.copyTo(roi);

    } catch (error) {
        console.error("Face smoothing error:", error);
    } finally {
        roi?.delete();
        originalRgb?.delete();
        smoothedRgb?.delete();

        faceMask?.delete();
        protectedFeatures?.delete();
        expandedFeatures?.delete();
        skinMask?.delete();
        protectKernel?.delete();

        skinMaskFloat?.delete();
        skinMaskRgb?.delete();
        inverseMaskRgb?.delete();

        originalFloat?.delete();
        smoothFloat?.delete();

        smoothPart?.delete();
        originalPart?.delete();
        resultFloat?.delete();
        result?.delete();
        output?.delete();
        ones?.delete();
    }
}