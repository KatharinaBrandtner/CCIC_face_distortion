import './style.css';
import p5 from 'p5';

import {
  setupFaceTracking,
  getVideo,
  getFaces,
  getVideoSize,
  isFaceTrackingReady,
  hasFace,
} from './faceTracking.js';

import {
  setupMoodDetection,
  detectMoodOnce,
  isMoodDetectionReady,
  resetMoodDetection,
} from './moodDetection.js';

import {
  drawCamera,
  drawFacePoints,
  drawStatus,
  drawAnalysisOverlay,
  drawMoodTint,
  drawMoodResultPanel,
  getMoodColor
} from './drawing.js';
import { runManipulation } from './pages/manupulated.js';

import { calculatePerfectFaceScore } from './faceScore.js';

document.querySelector('#app').innerHTML = `
  <section class="screen">
    <div id="p5-container"></div>

    <div class="dark-overlay"></div>

    <header class="headline">
      <h1>HOW PERFECT ARE YOU?</h1>
    </header>

    <div class="face-window"></div>
  </section>
`;

let appState = 'loading';
// loading | searching | preAnalyzing | analyzing | analyzed| manipulating| manipulated 

let lockedMood = null;
let moodAnalyzed = false;

let lockedPerfectFaceScore = null;
let perfectFaceAnalyzed = false;

let faceDetectedTime = null;
const FACE_DETECTION_DELAY = 1500;
// const FACE_DETECTION_DELAY = 1500;

let analysisStartTime = 0;
const ANALYSIS_DURATION = 3500;
// const ANALYSIS_DURATION = 3500;

// bevor manipulating einsetzt
let analyzedStartTime = 0;
const RESULT_DISPLAY_DURATION = 1500;
// const RESULT_DISPLAY_DURATION = 1500;

let manipulationStartTime = 0;
const MANIPULATION_DURATION = 5000;
// const MANIPULATION_DURATION = 3000;
const sparkles = [];

let manipulatedStartTime = 0;


function updateFaceWindowVisibility(appState) {
  const faceWindow = document.querySelector('.face-window');

  const shouldShowFaceWindow =
    appState === 'loading' ||
    appState === 'searching';

  if (faceWindow) {
    faceWindow.classList.toggle('is-hidden', !shouldShowFaceWindow);
  }
}

function drawMirroredCameraLayer(p, drawFunction) {
  p.push();
  p.translate(p.width, 0);
  p.scale(-1, 1);

  drawFunction();

  p.pop();
}

const sketch = (p) => {
  p.setup = async () => {
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent('p5-container');

    p.pixelDensity(1);

    appState = 'loading';

    await setupFaceTracking();
    await setupMoodDetection();

    appState = 'searching';
  };

  function drawStar(p, x, y, outerRadius, innerRadius) {
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

function drawSparkle(p, x, y, size, alpha) {
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


function lerpColorObject(p, from, to, amount) {
  return {
    r: p.lerp(from.r, to.r, amount),
    g: p.lerp(from.g, to.g, amount),
    b: p.lerp(from.b, to.b, amount),
  };
}

function getFacePointAlpha(p) {

  if (appState === 'preAnalyzing') {
    return 255;
  }

  if (appState === 'analyzed') {

    const elapsed =
      p.millis() - analyzedStartTime;

    const t = p.constrain(
      elapsed / RESULT_DISPLAY_DURATION,
      0,
      1
    );

    return p.lerp(255, 128, t);
  }

  if (appState === 'manipulating') {

    const elapsed =
      p.millis() - manipulationStartTime;

    const t = p.constrain(
      elapsed / MANIPULATION_DURATION,
      0,
      1
    );

    return p.lerp(128, 255, t);
  }

  if (appState === 'manipulated') {

    const elapsed =
      p.millis() - manipulatedStartTime;

    const t = p.constrain(
      elapsed / 1000,
      0,
      1
    );

    return p.lerp(255, 0, t);
  }

  return 255;
}


  p.draw = () => {
    p.clear();
    p.background(0);

    updateFaceWindowVisibility(appState);

    const video = getVideo();
    const videoSize = getVideoSize();

    if (appState === 'loading') {
      drawStatus(p, 'System lädt...');
      return;
    }

    if (!video || video.readyState < 2) {
      drawStatus(p, 'Kamera lädt...');
      return;
    }

    const faceDetected = isFaceTrackingReady() && hasFace();
    const faces = faceDetected ? getFaces() : [];
    const face = faces[0];

    // Kamera + Facepoints gemeinsam spiegeln
    drawMirroredCameraLayer(p, () => {
  drawCamera(p, video, videoSize);

  const facePointAlpha =
  getFacePointAlpha(p);



  if (
    face &&
    facePointAlpha > 0 &&
    appState !== 'loading' &&
    appState !== 'searching'
  ) {
    drawFacePoints(
      p,
      face,
      videoSize,
      facePointAlpha
    );
  }
});

    // Wenn kein Gesicht da ist
    if (!faceDetected && appState === 'searching') {
      faceDetectedTime = null;
      drawStatus(p, 'Kein Gesicht erkannt');
      return;
    }

    // Schritt 1: Gesicht erkannt → kurze Wartezeit
    if (appState === 'searching') {
      if (!faceDetectedTime) {
        faceDetectedTime = p.millis();
      }

      const elapsedSinceDetection = p.millis() - faceDetectedTime;

      if (elapsedSinceDetection >= FACE_DETECTION_DELAY) {
        appState = 'preAnalyzing';
        analysisStartTime = p.millis();
      }

      return;
    }

    // Schritt 2: Fake Analyse / Ladebalken
    if (appState === 'preAnalyzing') {
      const elapsed = p.millis() - analysisStartTime;
      const progress = p.constrain(elapsed / ANALYSIS_DURATION, 0, 1);
drawMoodTint(p, { label: 'preanalyzing' }, appState);
      drawAnalysisOverlay(p, progress);

      

      if (progress >= 1 && !moodAnalyzed && isMoodDetectionReady()) {
        appState = 'analyzing';
        moodAnalyzed = true;

        detectMoodOnce(video).then((mood) => {
          lockedMood = mood;
          appState = 'analyzed';

          analyzedStartTime = p.millis();

          console.log('Mood locked:', lockedMood);
        });
      
      }

      return;
    }

    // Schritt 3: echte Mood-Analyse läuft
    if (appState === 'analyzing') {
      drawAnalysisOverlay(p, 1);
      drawStatus(p, 'Emotional profile wird berechnet...');
      return;
    }

    // Schritt 4: Ergebnis anzeigen
    if (appState === 'analyzed' && lockedMood) {
      if (face && !perfectFaceAnalyzed) {
        lockedPerfectFaceScore = calculatePerfectFaceScore(face, videoSize);
        perfectFaceAnalyzed = true;

        console.log('Locked Perfect Face Score:', lockedPerfectFaceScore);
      }

      drawMoodTint(p, lockedMood, appState);

      drawMoodResultPanel(
        p,
        lockedMood,
        appState,
        face,
        videoSize,
        lockedPerfectFaceScore
      );

      const elapsed = p.millis() - analyzedStartTime;

      if (elapsed >= RESULT_DISPLAY_DURATION) {
        appState = 'manipulating';
        manipulationStartTime = p.millis();
        console.log('APP STATE ANALYZED RUNS');
      }

      return;
    }


    // Schritt 5: Manipulation
    if (appState === 'manipulating') {

      const gradientMood = {
        label: ``
      };
      console.log(gradientMood.label);
      const elapsed = p.millis() - manipulationStartTime;

const optimizationProgress = p.constrain(
  elapsed / MANIPULATION_DURATION,
  0,
  1
);


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

let currentTintColor;

if (optimizationProgress < 0.5) {

  const localProgress =
    optimizationProgress * 2;

  currentTintColor =
    lerpColorObject(
      p,
      moodColor,
      gradientColor,
      localProgress
    );

} else {

  const localProgress =
    (optimizationProgress - 0.5) * 2;

  currentTintColor =
    lerpColorObject(
      p,
      gradientColor,
      manipulatedColor,
      localProgress
    );
}

drawMoodTint(
  p,
  lockedMood,
  appState,
  currentTintColor
);

drawMoodResultPanel(
  p,
  lockedMood,
  appState,
  face,
  videoSize,
  lockedPerfectFaceScore,
  currentTintColor
);


const optimizationPercent =
  Math.floor(optimizationProgress * 100);





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




      if (elapsed >= MANIPULATION_DURATION) {
  appState = 'manipulated';
  manipulatedStartTime = p.millis();

  console.log('APP STATE MANIPULATING RUNS');
}

      return;
    }

    // Schritt 6: Manipulated
    if (appState === 'manipulated') {

      runManipulation(
        p,
        face,
        videoSize
      );

      drawMoodTint(p, { label: 'manipulated' }, appState);
      

      drawMoodResultPanel(
        p,
        { label: 'manipulated' },
        appState,
        face,
        videoSize,
        lockedPerfectFaceScore
      );
      console.log('APP STATE MANIPULATED RUNS');
      return;
      
    }
    
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
};

new p5(sketch);