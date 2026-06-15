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

const sketch = (p) => {
  p.setup = async () => {
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent('p5-container');
    p.pixelDensity(1);

    await setupFaceTracking();
  };

  p.draw = () => {
    p.clear();
    p.background(0);

    const video = getVideo();
    const videoSize = getVideoSize();

    // Kamera noch nicht bereit
    if (!video || video.readyState < 2) {
      drawStatus(p, 'Kamera lädt...');
      return;
    }

    // Kamera IMMER zeichnen
    drawCamera(p, video, videoSize);

    // FacePoints nur zeichnen, wenn Gesicht da ist
    if (isFaceTrackingReady() && hasFace()) {
      const faces = getFaces();

      drawFacePoints(p, faces[0], videoSize);
      drawStatus(p, 'Gesicht erkannt!');
    } else {
      drawStatus(p, 'Kein Gesicht erkannt');
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
};

new p5(sketch);