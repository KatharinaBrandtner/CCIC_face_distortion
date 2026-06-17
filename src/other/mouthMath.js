
import {
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
    LOWER_OUTER_SMILE
} from "../triangles/mouthPoints.js";

import { getCoverRect } from "../drawing.js";


export function landmarkToCanvas(p, point, videoSize) {
    const rect = getCoverRect(p.width, p.height, videoSize.width, videoSize.height);
    const videoX = point.x <= 1 ? point.x * videoSize.width : point.x;
    const videoY = point.y <= 1 ? point.y * videoSize.height : point.y;
    return {
        x: rect.x + (videoX / videoSize.width) * rect.w,
        y: rect.y + (videoY / videoSize.height) * rect.h,
    };
}

function applyClosedSmile(points) {

    const smileWeights = [8, 6, 4, 2];

    LEFT_SMILE_GROUP.forEach((id, i) => {
        points[id].y -= smileWeights[i] ?? 0;
    });

    RIGHT_SMILE_GROUP.forEach((id, i) => {
        points[id].y -= smileWeights[i] ?? 0;
    });

    // Mundwinkel nach außen
    points[61].x -= 4;
    points[291].x += 4;

    // komplette Smile-Kette hochziehen
    const chainLift = [1, 3, 5, 8, 12];

    LEFT_CORNER_CHAIN.forEach((id, i) => {
        points[id].y -= chainLift[i];
    });

    RIGHT_CORNER_CHAIN.forEach((id, i) => {
        points[id].y -= chainLift[i];
    });

    // Oberlippe leicht anheben
    for (const id of UPPER_SMILE_POINTS) {
        points[id].y -= 2;
    }

    // Unterlippe leicht senken
    for (const id of LOWER_SMILE_POINTS) {
        points[id].y += 2;
    }

    // Wangen leicht anheben
    for (const id of LEFT_CHEEK_SMILE) {
        points[id].y -= 2;
    }

    for (const id of RIGHT_CHEEK_SMILE) {
        points[id].y -= 2;
    }
}



export function getMouthOpenAmount(points) {
    const top = points[13];
    const bottom = points[14];

    return Math.hypot(
        bottom.x - top.x,
        bottom.y - top.y
    );
}
export function isMouthOpen(points) {
    return getMouthOpenAmount(points) > 12;
}
export function isOpenSmile(points) {

    const mouthOpen =
        getMouthOpenAmount(points);

    const leftCorner = points[61];
    const rightCorner = points[291];
    const mouthCenter = points[13];

    const avgRise =
        (
            mouthCenter.y - leftCorner.y +
            mouthCenter.y - rightCorner.y
        ) / 2;

    return (
        mouthOpen > 12 &&
        avgRise > 6
    );
}


export function applyOpenSmile(points) {

    const openAmount = getMouthOpenAmount(points);

    const smileStrength = Math.min(
        1,
        Math.max(
            0,
            (openAmount - 12) / 20
        )
    );

    const cornerLift = 20 + smileStrength * 12;
    const cornerSpread = 8 + smileStrength * 6;

    // Mundwinkel
    points[61].y -= cornerLift;
    points[291].y -= cornerLift;

    points[61].x -= cornerSpread;
    points[291].x += cornerSpread;


    
    // Smile-Kette mitziehen
    const chainLift = [
    0,
    2 + smileStrength,
    4 + smileStrength * 2,
    8 + smileStrength * 3,
    18 + smileStrength * 6
];

    LEFT_CORNER_CHAIN.forEach((id, i) => {
        points[id].y -= chainLift[i];
    });

    RIGHT_CORNER_CHAIN.forEach((id, i) => {
        points[id].y -= chainLift[i];
    });

    // Oberlippe
    for (const id of UPPER_SMILE_POINTS) {
        points[id].y -= 2 + smileStrength * 2;
    }

    // Unterlippe
    for (const id of LOWER_SMILE_POINTS) {
        points[id].y += 2 + smileStrength * 2;
    }

    // unteren Außenring mitziehen
    const lowerLift = 1 + smileStrength * 2;

    for (const id of LOWER_OUTER_SMILE) {
        points[id].y -= lowerLift;
    }

    // Lippenöffnung etwas verbreitern
    points[78].x -= smileStrength * 2;
    points[308].x += smileStrength * 2;

    points[95].x -= smileStrength;
    points[324].x += smileStrength;

    // Wangen hochziehen
    const cheekLift = 3 + smileStrength * 4;

    for (const id of LEFT_CHEEK_SMILE) {
        points[id].y -= cheekLift;
    }

    for (const id of RIGHT_CHEEK_SMILE) {
        points[id].y -= cheekLift;
    }
}



export function createManipulatedMouthPoints(originalPoints) {

    const points = originalPoints.map((p) => ({
        x: p.x,
        y: p.y,
    }));

    if (isOpenSmile(originalPoints)) {
    applyOpenSmile(points);
} else {
    applyClosedSmile(points);
}

    return points;
}