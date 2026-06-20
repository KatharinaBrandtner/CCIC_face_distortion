import {
    UPPER_SMILE_POINTS,
    LOWER_SMILE_POINTS,
    LEFT_SMILE_GROUP,
    RIGHT_SMILE_GROUP,
    LEFT_CHEEK_SMILE,
    RIGHT_CHEEK_SMILE,
    LEFT_CORNER_CHAIN,
    RIGHT_CORNER_CHAIN,
    MOUTH_TRIANGLES,
    MOUTH_INNER,
    MOUTH_ROI,
    MOUTH_SCALE_BORDER,
    MOUTH_SCALE_INNER,
    MOUTH_SCALE_TRIANGLES,
    MOUTH_INNER_FILL_TRIANGLES
} from "../triangles/mouthPoints.js";
import {
    getCoverRect
} from "../drawing.js";

import {
    CLOSED_SMILE_WEIGHTS,
    CLOSED_SMILE_CORNER_SPREAD,
    CLOSED_SMILE_CHAIN_LIFT,
    CLOSED_SMILE_UPPER_LIP_LIFT,
    CLOSED_SMILE_LOWER_LIP_DROP,
    CLOSED_SMILE_CHEEK_LIFT,
    MOUTH_OPEN_THRESHOLD,
    OPEN_MOUTH_SCALE_START_AMOUNT,
    OPEN_MOUTH_SCALE_MAX_AMOUNT,
    OPEN_MOUTH_SCALE_CURVE,
    OPEN_MOUTH_INNER_SCALE_MIN,
    OPEN_MOUTH_INNER_SCALE_MAX,
    OPEN_MOUTH_BORDER_SCALE_MIN,
    OPEN_MOUTH_BORDER_SCALE_MAX
} from "./mouthConfig.js";
// in dem import kann man die scales usw anpassen um das verhalten zu ändern, siehe mouthConfig.js


// diese funktion wandelt die von mediapipe gelieferte Punkte, die in Bezug auf die Videogröße sind, in Punkte um, die auf der p5 Canvas liegen, damit sie dort manipuliert und gezeichnet werden können. 
export function landmarkToCanvas(p, point, videoSize) {
    const rect = getCoverRect(p.width, p.height, videoSize.width, videoSize.height);
    const videoX = point.x <= 1 ? point.x * videoSize.width : point.x;
    const videoY = point.y <= 1 ? point.y * videoSize.height : point.y;
    return {
        x: rect.x + (videoX / videoSize.width) * rect.w,
        y: rect.y + (videoY / videoSize.height) * rect.h,
    };
}
// diese funktion wendet die geschlossene smile manipulation auf die übergebenen Punkte an, indem sie die y-Position der Punkte entsprechend den definierten Werten in mouthConfig.js anpasst. Es werden verschiedene Bereiche des Mundes und der Wangen manipuliert, um ein Lächeln zu erzeugen.
function applyClosedSmile(points) {
    const smileWeights = CLOSED_SMILE_WEIGHTS;
    LEFT_SMILE_GROUP.forEach((id, i) => {
        points[id].y -= smileWeights[i] ?? 0;
    });
    RIGHT_SMILE_GROUP.forEach((id, i) => {
        points[id].y -= smileWeights[i] ?? 0;
    });
    // Mundwinkel nach außen
    points[61].x -= CLOSED_SMILE_CORNER_SPREAD;
    points[291].x += CLOSED_SMILE_CORNER_SPREAD;
    // komplette Smile-Kette hochziehen
    const chainLift = CLOSED_SMILE_CHAIN_LIFT;
    LEFT_CORNER_CHAIN.forEach((id, i) => {
        points[id].y -= chainLift[i];
    });
    RIGHT_CORNER_CHAIN.forEach((id, i) => {
        points[id].y -= chainLift[i];
    });
    // Oberlippe leicht anheben
    for (const id of UPPER_SMILE_POINTS) {
        points[id].y -= CLOSED_SMILE_UPPER_LIP_LIFT;
    }
    // Unterlippe leicht senken
    for (const id of LOWER_SMILE_POINTS) {
        points[id].y += CLOSED_SMILE_LOWER_LIP_DROP;
    }
    // Wangen leicht anheben
    for (const id of LEFT_CHEEK_SMILE) {
        points[id].y -= CLOSED_SMILE_CHEEK_LIFT;
    }
    for (const id of RIGHT_CHEEK_SMILE) {
        points[id].y -= CLOSED_SMILE_CHEEK_LIFT;
    }
}
export function getMouthOpenAmount(points) {
    const top = points[13];
    const bottom = points[14];
    return Math.hypot(bottom.x - top.x, bottom.y - top.y);
}
export function isMouthOpen(points) {
    return getMouthOpenAmount(points) > MOUTH_OPEN_THRESHOLD;
}

function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}
// diese funktion berechnet die Skalierung für den offenen Mund basierend auf der aktuellen Öffnungsweite des Mundes. Sie verwendet eine lineare Interpolation zwischen einem Start- und einem Maximalwert, wobei der Fortschritt durch eine Kurve angepasst wird, um einen natürlicheren Anstieg zu erzeugen.
function getOpenMouthScale(openAmount, minScale, maxScale) {
    const rawProgress =
        (openAmount - OPEN_MOUTH_SCALE_START_AMOUNT) /
        (OPEN_MOUTH_SCALE_MAX_AMOUNT - OPEN_MOUTH_SCALE_START_AMOUNT);

    const progress = clamp01(rawProgress);
    const easedProgress = Math.pow(progress, OPEN_MOUTH_SCALE_CURVE);

    return lerp(minScale, maxScale, easedProgress);
}
// diese funktion berechnet die Mitte des Mundes basierend auf den übergebenen Punkten und den definierten Indizes für die Mundregion. Sie summiert die x- und y-Koordinaten der relevanten Punkte und teilt sie durch die Anzahl der Punkte, um den Durchschnitt zu erhalten, der als Zentrum des Mundes dient.
export function getMouthBounds(points) {
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

export function drawScaledMouth(originalPoints, openAmount = MOUTH_OPEN_THRESHOLD) {
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
    const innerScale = getOpenMouthScale(
        openAmount,
        OPEN_MOUTH_INNER_SCALE_MIN,
        OPEN_MOUTH_INNER_SCALE_MAX
    );

    const borderScale = getOpenMouthScale(
        openAmount,
        OPEN_MOUTH_BORDER_SCALE_MIN,
        OPEN_MOUTH_BORDER_SCALE_MAX
    );
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
export function createMouthCenterPoint(points) {
    const ids = MOUTH_INNER;
    return {
        x: ids.reduce(
            (sum, id) => sum + points[id].x, 0) / ids.length,
        y: ids.reduce(
            (sum, id) => sum + points[id].y, 0) / ids.length
    };
}

// diese funktion berechnet die manipulierten Punkte für den Mund basierend auf der aktuellen Öffnungsweite des Mundes. 
// Wenn der Mund geschlossen ist, wird die geschlossene Smile-Manipulation angewendet. 
// Wenn der Mund offen ist, werden die Punkte entsprechend skaliert, um den Effekt eines geöffneten Mundes zu erzeugen. 
// Die Funktion gibt die manipulierten Punkte, den Modus (offen oder geschlossen) und die Öffnungsweite zurück.
export function createManipulatedMouthPoints(originalPoints) {
    const points = originalPoints.map((p) => ({
        x: p.x,
        y: p.y,
    }));

    const openAmount = getMouthOpenAmount(originalPoints);
    let mode = "closed";
    if (isMouthOpen(originalPoints)) {
        mode = "open";
    } else {
        applyClosedSmile(points);
    }
    return {
        points,
        mode,
        openAmount
    };
}