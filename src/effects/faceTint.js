export function drawBlush(
    p,
    points,
    progress = 1
) {
    if (!points) return;

    const blushAlpha =
    70 * progress;

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

    const blushW = faceWidth * 0.18;
    const blushH = faceWidth * 0.10;

    p.push();
    p.noStroke();

    // weichere, kompaktere Fläche
    p.drawingContext.filter = "blur(18px)";
    p.fill(255, 45, 95, blushAlpha);

    p.ellipse(leftCheek.x, leftCheek.y, blushW, blushH);
    p.ellipse(rightCheek.x, rightCheek.y, blushW, blushH);

    p.drawingContext.filter = "none";
    p.pop();
}

function lerpPoint(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    };
}

function scaleFromCenter(pt, center, scaleX, scaleY) {
    return {
        x: center.x + (pt.x - center.x) * scaleX,
        y: center.y + (pt.y - center.y) * scaleY,
    };
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
        p.fill(185, 30, 50, alpha);
    
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