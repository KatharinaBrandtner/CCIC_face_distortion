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
} from './drawing.js';

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
// loading | searching | analyzing | manipulating

let lockedMood = null;
let moodAnalyzed = false;

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

    // Kamera immer zeichnen
    drawCamera(p, video, videoSize);

    if (!isFaceTrackingReady() || !hasFace()) {
      drawStatus(p, 'Kein Gesicht erkannt');
      return;
    }

    const faces = getFaces();
    const face = faces[0];
    drawFacePoints(p, face, videoSize);

    // Schritt 1: Gesicht gefunden, Mood noch nicht analysiert
    if (appState === 'searching' && !moodAnalyzed && isMoodDetectionReady()) {
      appState = 'analyzing';
      moodAnalyzed = true;

      detectMoodOnce(video).then((mood) => {
        lockedMood = mood;
        appState = 'manipulating';

        console.log('Mood locked:', lockedMood);

        // Später hier deine Manipulation starten:
        // startManipulation(lockedMood);
      });

      drawStatus(p, 'Mood wird analysiert...');
      return;
    }
    if (appState === 'analyzing') {
      drawStatus(p, 'Mood wird analysiert...');
      return;
    }

    // Schritt 3: Mood ist eingefroren
    if (appState === 'manipulating' && lockedMood) {
      const percent = Math.round(lockedMood.score * 100);

      drawStatus(
        p,
        `Mood locked: ${lockedMood.label} ${percent}%`
      );

      // Später hier Manipulation zeichnen:
      // drawManipulation(p, face, videoSize, lockedMood);

      return;
    }
  };

  p.keyPressed = () => {
    if (p.key === 'r' || p.key === 'R') {
      appState = 'searching';
      lockedMood = null;
      moodAnalyzed = false;

      resetMoodDetection();

      console.log('Reset: neue Mood-Erkennung möglich');
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
};

new p5(sketch);