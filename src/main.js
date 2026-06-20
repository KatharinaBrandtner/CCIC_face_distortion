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
const ANALYSIS_DURATION = 1000;
// const ANALYSIS_DURATION = 3500;

// bevor manipulating einsetzt
let analyzedStartTime = 0;
const RESULT_DISPLAY_DURATION = 1000;
// const RESULT_DISPLAY_DURATION = 10000;

let manipulationStartTime = 0;
const MANIPULATION_DURATION = 1000;
// const MANIPULATION_DURATION = 3000;

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

      if (face) {
        drawFacePoints(p, face, videoSize);
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

      drawMoodTint(p, { label: 'angry' }, appState);

      drawMoodResultPanel(
        p,
       { label: 'angry' },
        appState,
        face,
        videoSize,
        lockedPerfectFaceScore
      );

      const elapsed = p.millis() - manipulationStartTime;

      if (elapsed >= MANIPULATION_DURATION) {
        appState = 'manipulated';
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

      drawMoodTint(p, { label: 'happy' }, appState);

      drawMoodResultPanel(
        p,
        { label: 'happy' },
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