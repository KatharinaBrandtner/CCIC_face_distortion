
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
    LOWER_OUTER_SMILE,
    OPEN_MOUTH_TRIANGLES, MOUTH_ROI, MOUTH_SCALE_BORDER, MOUTH_SCALE_INNER, MOUTH_SCALE_TRIANGLES
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

//     const openAmount =
//         getMouthOpenAmount(points);

//     const smileStrength = Math.min(
//         1,
//         Math.max(
//             0,
//             (openAmount - 12) / 20
//         )
//     );

//     const center = {
//         x: (points[61].x + points[291].x) / 2,
//         y: (points[13].y + points[14].y) / 2,
//     };

//     const mouthRegion = [
//         ...new Set([
//             ...MOUTH_OUTER,
//             ...MOUTH_INNER
//         ])
//     ];

    
//     const scaleX =
//         1 + smileStrength * 0.35; 

//     const scaleY =
//         1 + smileStrength * 0.35;

//     for (const id of mouthRegion) {

//         const dx =
//             points[id].x - center.x;

//         const dy =
//             points[id].y - center.y;

//         points[id].x =
//             center.x + dx * scaleX;

//         points[id].y =
//             center.y + dy * scaleY;
//     }

//     // minimale Smile-Anhebung

//     points[61].x -= 2;
//     points[291].x += 2;

//     points[61].y -= 2;
//     points[291].y -= 2;

//     console.log(
//     "OPEN",
//     smileStrength
// );

return points;

}



export function createManipulatedMouthPoints(originalPoints) {

    const points = originalPoints.map((p) => ({
        x: p.x,
        y: p.y,
    }));

    let mode = "closed";
    if (isMouthOpen(originalPoints)) {
        mode = "open";
    } else {
        applyClosedSmile(points);
    }
    // if (isOpenSmile(originalPoints)) {
    //     applyOpenSmile(points);
    //     mode = "open";
    // } else {
    //     applyClosedSmile(points);
    // }

    return {
        points,
        mode
    };



    
}