export function drawBlush(p, points) {
    if (!points) return;

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
    p.fill(255, 45, 95, 70);

    p.ellipse(leftCheek.x, leftCheek.y, blushW, blushH);
    p.ellipse(rightCheek.x, rightCheek.y, blushW, blushH);

    p.drawingContext.filter = "none";
    p.pop();
}

export function enhanceLipColor(p, points, strength = 1.35) {
        if (!points) return;
    
        const upperLipIds = [
            61, 185, 40, 39, 37, 0,
            267, 269, 270, 409, 291,
            308, 324, 318, 402, 317,
            14, 87, 178, 88, 95, 78,
        ];
    
        const lowerLipIds = [
            61, 146, 91, 181, 84, 17,
            314, 405, 321, 375, 291,
            308, 324, 318, 402, 317,
            14, 87, 178, 88, 95, 78,
        ];
    
        const upperLip = upperLipIds
            .map((id) => points[id])
            .filter(Boolean);
    
        const lowerLip = lowerLipIds
            .map((id) => points[id])
            .filter(Boolean);
    
        if (upperLip.length < 3 || lowerLip.length < 3) return;
    
        p.push();
        p.noStroke();
    
        // Macht das Rot weicher, aber nicht so verschwommen wie Blush
        p.drawingContext.filter = "blur(2px)";
        p.fill(205, 20, 45, strength);
    
        p.beginShape();
        for (const pt of upperLip) {
            p.vertex(pt.x, pt.y);
        }
        p.endShape(p.CLOSE);
    
        p.beginShape();
        for (const pt of lowerLip) {
            p.vertex(pt.x, pt.y);
        }
        p.endShape(p.CLOSE);
    
        p.drawingContext.filter = "none";
        p.pop();
    }