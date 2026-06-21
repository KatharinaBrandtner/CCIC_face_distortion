
// die imports usw verweisen dann noch auf die restlichen nötigen dateien

import p5 from 'p5';

import { waitForOpenCV } from "../opencvReady.js";
import { getMoodColor } from '../drawing.js';

const sparkles = [];




export function getManipulationTintColor(
  p,
  lockedMood,
  optimizationProgress
) {

  const moodColor =
    getMoodColor(lockedMood);

  const gradientColor =
    getMoodColor({
      label: `gradient${lockedMood.label}`
    });

  const manipulatedColor =
    getMoodColor({
      label: 'manipulated'
    });

  if (optimizationProgress < 0.5) {

    const localProgress =
      optimizationProgress * 2;

    return lerpColorObject(
      p,
      moodColor,
      gradientColor,
      localProgress
    );
  }

  const localProgress =
    (optimizationProgress - 0.5) * 2;

  return lerpColorObject(
    p,
    gradientColor,
    manipulatedColor,
    localProgress
  );
}

export function lerpColorObject(p, from, to, amount) {
  return {
    r: p.lerp(from.r, to.r, amount),
    g: p.lerp(from.g, to.g, amount),
    b: p.lerp(from.b, to.b, amount),
  };
}


  export function drawStar(p, x, y, outerRadius, innerRadius) {
  p.beginShape();

  for (let i = 0; i < 8; i++) {
    const angle = i * p.PI / 4 - p.HALF_PI;

    const r =
      i % 2 === 0
        ? outerRadius
        : innerRadius;

    p.vertex(
      x + p.cos(angle) * r,
      y + p.sin(angle) * r
    );
  }

  p.endShape(p.CLOSE);
}

export function drawSparkle(p, x, y, size, alpha) {
  p.push();

  p.noStroke();

  // Glow groß
  p.fill(0, 255, 55, alpha * 0.12);
  drawStar(
    p,
    x,
    y,
    size * 2.2,
    size * 0.08
  );

  // Glow mittel
  p.fill(0, 255, 55, alpha * 0.25);
  drawStar(
    p,
    x,
    y,
    size * 1.6,
    size * 0.08
  );

  // Glow klein
  p.fill(0, 255, 55, alpha * 0.5);
  drawStar(
    p,
    x,
    y,
    size * 1.2,
    size * 0.08
  );

  // Kern
  p.fill(0, 255, 55, alpha);
  drawStar(
    p,
    x,
    y,
    size,
    size * 0.08
  );

  p.pop();
}

export function drawManipulationSparkles(p){
    if (p.frameCount % 19 === 0) {
      sparkles.push({
        x: p.random(
          p.width * 0.2,
          p.width * 0.8
        ),
    
        y: p.random(
          p.height * 0.15,
          p.height * 0.8
        ),
    
        size: p.random(30, 80),
    
        age: 0,
        maxAge: p.random(120, 200)
      });
    }
    
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const sparkle = sparkles[i];
    
      sparkle.age++;
    
      const life =
        sparkle.age / sparkle.maxAge;
    
      const sparkleAlpha =
        Math.sin(life * Math.PI) * 255;
    
      const currentSize =
        sparkle.size *
        Math.sin(life * Math.PI);
    
      drawSparkle(
        p,
        sparkle.x,
        sparkle.y,
        currentSize,
        sparkleAlpha
      );
    
      if (sparkle.age >= sparkle.maxAge) {
        sparkles.splice(i, 1);
      }
    }
}


export function drawOptimizationUI(
  p,
  optimizationPercent
){
  p.fill(255);
  p.noStroke();

  p.textAlign(
    p.CENTER,
    p.CENTER
  );

  p.textSize(52);

  p.text(
    `${optimizationPercent}%`,
    p.width / 2,
    130
  );

  p.textSize(22);

  p.text(
    'OPTIMIZING SUBJECT',
    p.width / 2,
    180
  );
}