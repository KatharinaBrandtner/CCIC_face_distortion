
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


export function drawStar(
  p,
  x,
  y,
  outerRadius,
  innerRadius = outerRadius * 0.1,
  armLengthFactor = 0.75
) {

  const armRadius =
    outerRadius * armLengthFactor;

  p.beginShape();

  for (let i = 0; i < 8; i++) {

    const angle =
      i * p.PI / 4 -
      p.HALF_PI;

    const radius =
      i % 2 === 0
        ? armRadius
        : innerRadius;

    p.vertex(
      x + p.cos(angle) * radius,
      y + p.sin(angle) * radius
    );
  }

  p.endShape(p.CLOSE);
}

export function drawSparkle(
  p,
  x,
  y,
  size,
  alpha,
  color
) {

  const {
    r,
    g,
    b
  } = color;

  const sizefactor = 0.1

  p.push();

  p.noStroke();

  // // riesiger weicher Glow

  p.fill(
    r,
    g,
    b,
    alpha * 0.05
  );

  drawStar(
  p,
  x,
  y,
  size * 3.5,
  size * sizefactor
);


  // // mittlerer Glow

  p.fill(
    r,
    g,
    b,
    alpha * 0.12
  );

  drawStar(
  p,
  x,
  y,
  size * 2.0,
  size * sizefactor
);


  // Kern

  p.drawingContext.shadowBlur =
  size * 0.4;

p.drawingContext.shadowColor =
  `rgba(${r},${g},${b},0.8)`;

  p.fill(
    r,
    g,
    b,
    alpha
  );

  drawStar(
  p,
  x,
  y,
  size,
  size * sizefactor
);

  p.pop();
}

export function drawManipulationSparkles(p, currentTintColor) {
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
        sparkleAlpha,
        currentTintColor
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