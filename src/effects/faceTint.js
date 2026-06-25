import { MAKEUP_CONFIG } from "../other/faceColorConfig.js";

export function drawBlush(
    p,
    points,
    progress = 1
) {
    if (!points) return;

    const blushAlpha =
    MAKEUP_CONFIG.blush.alpha * progress;

    // Wangenpunkte aus FaceMesh
    const leftOuter = points[234];
    const leftInner = points[205];

    const rightOuter = points[454];
    const rightInner = points[425];

    const nose = points[1];
    const mouthTop = points[13];

    if (
        !leftOuter || !leftInner ||
        !rightOuter || !rightInner ||
        !nose || !mouthTop
    ) {
        return;
    }

    // Position zwischen äußerer und innerer Wange
    const leftCheek = {
        x: leftOuter.x * 0.58 + leftInner.x * 0.42,
        y: leftOuter.y * 0.45 + leftInner.y * 0.55,
    };

    const rightCheek = {
        x: rightOuter.x * 0.58 + rightInner.x * 0.42,
        y: rightOuter.y * 0.45 + rightInner.y * 0.55,
    };

    // Blush etwas oberhalb der Mundlinie halten
    const cheekYLimit = mouthTop.y - p.height * 0.015;

    leftCheek.y = Math.min(leftCheek.y, cheekYLimit);
    rightCheek.y = Math.min(rightCheek.y, cheekYLimit);

    const faceWidth = Math.abs(rightOuter.x - leftOuter.x);

    const blushW =
    faceWidth * MAKEUP_CONFIG.blush.width;

    const blushH =
    faceWidth * MAKEUP_CONFIG.blush.height;

    p.push();
    p.noStroke();

    p.drawingContext.filter =
    `blur(${MAKEUP_CONFIG.blush.blur}px)`;

    p.fill(
    MAKEUP_CONFIG.blush.color.r,
    MAKEUP_CONFIG.blush.color.g,
    MAKEUP_CONFIG.blush.color.b,
    blushAlpha
);

    p.ellipse(leftCheek.x, leftCheek.y, blushW, blushH);
    p.ellipse(rightCheek.x, rightCheek.y, blushW, blushH);

    p.drawingContext.filter = "none";
    p.pop();
}

export function enhanceLipColor(p, points, alpha = 30) {
        if (!points) return;
    
        // Oberlippe:
        const upperLipIds = [
            78, 185, 40, 39, 37, 0,
            267, 269, 270, 409, 291,
    
            308, 415, 310, 311, 312, 13,
            82, 81, 80, 191, 78,
        ];
    
        // Unterlippe:
        const lowerLipIds = [
            78, 95, 88, 178, 87, 14,
            317, 402, 318, 324, 308,
    
            308, 375, 321, 405, 314, 17,
            84, 181, 91, 146, 61,
        ];
    
        function getPoints(ids) {
            return ids
                .map((id) => points[id])
                .filter(Boolean);
        }
    
        const upperLip = getPoints(upperLipIds);
        const lowerLip = getPoints(lowerLipIds);
    
        if (upperLip.length < 3 || lowerLip.length < 3) return;
    
        p.push();
        p.noStroke();
        p.drawingContext.filter = "none";
    
        // leicht dunkles Rot, damit die vorhandene Struktur noch sichtbar bleibt
        p.fill(
            MAKEUP_CONFIG.lipstick.color.r,
            MAKEUP_CONFIG.lipstick.color.g,
            MAKEUP_CONFIG.lipstick.color.b,
            MAKEUP_CONFIG.lipstick.alpha
        );
    
        // Oberlippe als eine saubere Fläche
        p.beginShape();
        for (const pt of upperLip) {
            p.vertex(pt.x, pt.y);
        }
        p.endShape(p.CLOSE);
    
        // Unterlippe als eine saubere Fläche
        p.beginShape();
        for (const pt of lowerLip) {
            p.vertex(pt.x, pt.y);
        }
        p.endShape(p.CLOSE);
    
        p.pop();
    }