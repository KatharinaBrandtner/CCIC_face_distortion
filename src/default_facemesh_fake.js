


export function drawDefaultMesh(
    p,
    img,
    alphaMultiplier = 1
) {

    
    if (!img) return;

    const pulse =
        1 +
        Math.sin(
            p.millis() * 0.002
        ) * 0.025;

    const size =
        Math.min(
            p.width,
            p.height
        ) * 0.35 *
        pulse;

   
    const alpha =
(
    95 +
    Math.sin(
        p.millis() * 0.001
    ) * 20
) * alphaMultiplier;

    p.push();

    p.tint(
        255,
        alpha
    );

    p.imageMode(
        p.CENTER
    );
p.drawingContext.shadowBlur = 12;
p.drawingContext.shadowColor =
    'rgba(255,255,255,0.25)';
    p.image(
        img,
        p.width / 2,
        p.height * 0.46,
        size,
        size * 1.35
    );

    p.pop();
}