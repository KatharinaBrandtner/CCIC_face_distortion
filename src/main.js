import './style.css';
import p5 from 'p5';
import {setupFaceTracking,getVideo,getFaces,getVideoSize,isFaceTrackingReady,hasFace,} from './faceTracking.js';
import {getCoverRect, drawCamera, drawFacePoints, drawStatus} from './drawing.js';

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

    try {
      await setupFaceTracking(p);
    } catch (err) {
      console.error('Startfehler:', err);
    }
  };

  p.draw = () => {
    p.background(0);

    const video = getVideo();

    if (!video) {
      drawStatus(p, 'Webcam lädt...');
      return;
    }

    const { width: videoW, height: videoH } = getVideoSize();
    const cameraRect = getCoverRect(videoW, videoH, p.width, p.height);

    drawCamera(p, video, cameraRect);

    if (!isFaceTrackingReady()) {
      drawStatus(p, 'FaceMesh lädt...');
      return;
    }

    const faces = getFaces();

    if (!hasFace()) {
      drawStatus(p, 'Kein Gesicht erkannt');
      return;
    }

    drawFacePoints(p, faces, cameraRect, videoW, videoH);
    drawStatus(p, 'Gesicht erkannt');
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
};

new p5(sketch);