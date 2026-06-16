import './style.css';
import p5 from 'p5';
import {setupFaceTracking, getVideo, getFaces, getVideoSize, isFaceTrackingReady,hasFace} from './faceTracking.js';
import {setupMoodDetection,detectMoodOnce,isMoodDetectionReady,resetMoodDetection} from './moodDetection.js';
import {drawCamera,drawFacePoints,drawStatus, drawAnalysisOverlay,  drawMoodTint, drawMoodResultPanel} from './drawing.js';

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
// loading | searching | preanalyzing | analyzing | manipulating

let lockedMood = null;
let moodAnalyzed = false;

let analysisStartTime = 0;
const ANALYSIS_DURATION = 3500;

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
  
    const faceDetected = isFaceTrackingReady() && hasFace();
  
    // Wenn noch keine Analyse gestartet wurde und kein Gesicht da ist
    if (!faceDetected && appState === 'searching') {
      drawStatus(p, 'Kein Gesicht erkannt');
      return;
    }
  
    // Gesicht zeichnen, wenn vorhanden
    if (faceDetected) {
      const faces = getFaces();
      drawFacePoints(p, faces[0], videoSize);
    }
  
    // Schritt 1: Gesicht wurde erkannt → Fake Analyse starten
    if (appState === 'searching' && faceDetected) {
      appState = 'preAnalyzing';
      analysisStartTime = p.millis();
    }
  
    // Schritt 2: Ladebalken / Analyzing Face anzeigen
    if (appState === 'preAnalyzing') {
      const elapsed = p.millis() - analysisStartTime;
      const progress = p.constrain(elapsed / ANALYSIS_DURATION, 0, 1);
  
      drawAnalysisOverlay(p, progress);
  
      if (progress >= 1 && !moodAnalyzed && isMoodDetectionReady()) {
        appState = 'analyzing';
        moodAnalyzed = true;
  
        detectMoodOnce(video).then((mood) => {
          lockedMood = mood;
          appState = 'manipulating';
  
          console.log('Mood locked:', lockedMood);
        });
      }
  
      return;
    }
  
    // Schritt 3: face-api analysiert gerade wirklich
    if (appState === 'analyzing') {
      drawAnalysisOverlay(p, 1);
      drawStatus(p, 'Emotional profile wird berechnet...');
      return;
    }
  
    if (appState === 'manipulating' && lockedMood) {
      const faces = getFaces();
    
      // leichte Farbigkeit passend zum Mood
      drawMoodTint(p, lockedMood);
    
      // FaceMesh weiter sichtbar
      if (faces.length > 0) {
        drawFacePoints(p, faces[0], videoSize);
      }
    
      // Ergebnis-UI unten
      drawMoodResultPanel(p, lockedMood);
    
      return;
    }
  
      // später:
      // drawManipulation(p, face, videoSize, lockedMood);
  
      return;
    }
  };

new p5(sketch)