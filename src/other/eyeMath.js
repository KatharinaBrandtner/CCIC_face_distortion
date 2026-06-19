import {
    LEFT_EYE_CONTOUR,
    RIGHT_EYE_CONTOUR,
    LEFT_BROW_POINTS,
    RIGHT_BROW_POINTS,
    LEFT_EYE_OUTER_RING1,
    LEFT_EYE_OUTER_RING2,
    LEFT_EYE_OUTER_RING3,
    RIGHT_EYE_OUTER_RING1,
    RIGHT_EYE_OUTER_RING2,
    RIGHT_EYE_OUTER_RING3,
} from "../triangles/eyeConstants";

import {
    EYE_CENTER_SCALE,
    UPPER_LID_SCALE,
    LOWER_LID_SCALE,
    OUTER_TOP_CENTER_SCALE,
    OUTER_TOP_OUTER_SCALE,
    OUTER_BOTTOM_CENTER_SCALE,
    OUTER_BOTTOM_OUTER_SCALE,
    OUTER_BOTTOM_EXTREME_SCALE,
    OUTER_INNER_SCALE,
    OUTER_RING_SCALE,
    OUTER_CORNER_SCALE,
    INNER_CORNER_SCALE,
    LASH_SCALE
} from "./eyeConfig";

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

export function createManipulatedPoints(originalPoints) {
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