export function drawBlush(p, points) {
    if (!points) return;

    const leftCheek = points[205];
    const rightCheek = points[425];

    if (!leftCheek || !rightCheek) return;

    p.push();
    p.noStroke();

    p.drawingContext.filter = "blur(10px)";
    p.fill(255, 0, 70, 20); 

    const cheekW = p.width * 0.06;
    const cheekH = p.height * 0.04;

    p.ellipse(leftCheek.x, leftCheek.y, cheekW, cheekH);
    p.ellipse(rightCheek.x, rightCheek.y, cheekW, cheekH);

    p.drawingContext.filter = "none";
    p.pop();
}