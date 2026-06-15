import './style.css';
import p5 from 'p5';

import {
  setupFaceTracking,
  getVideo,
  getFaces,
  getVideoSize,
  isFaceTrackingReady,
  hasFace,
  getFaceMesh
} from './faceTracking.js';

import {
  getCoverRect,
  drawCamera,
  drawFacePoints,
  drawStatus
} from './drawing.js';

import { drawFaceMeshTexture } from './faceWarp.js';

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

  let debugPrinted = false;

  p.setup = async () => {

    const canvas = p.createCanvas(
      window.innerWidth,
      window.innerHeight
    );

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

    const {
      width: videoW,
      height: videoH
    } = getVideoSize();

    const cameraRect = getCoverRect(
      videoW,
      videoH,
      p.width,
      p.height
    );

    drawCamera(
      p,
      video,
      cameraRect
    );

    if (!isFaceTrackingReady()) {
      drawStatus(p, 'FaceMesh lädt...');
      return;
    }

    const faces = getFaces();

    const faceMesh = getFaceMesh();

    // NUR EINMAL AUSGEBEN
    if (!debugPrinted) {

      console.log('====================');
      console.log('Faces:', faces);
      console.log('Anzahl Faces:', faces.length);

      console.log('FaceMesh Objekt:');
      console.log(faceMesh);

      console.log(
        'typeof getTriangles:',
        typeof faceMesh?.getTriangles
      );

      console.log('====================');

      debugPrinted = true;
    }

    if (!hasFace()) {

      drawStatus(
        p,
        'Kein Gesicht erkannt'
      );

      return;
    }

    // TESTWEISE PUNKTE ZEICHNEN
    drawFacePoints(
      p,
      faces,
      cameraRect,
      videoW,
      videoH
    );

    // TRIANGLE TEST
    if (
      faceMesh &&
      typeof faceMesh.getTriangles === 'function'
    ) {

      console.log('getTriangles vorhanden');

      const triangles =
        faceMesh.getTriangles();

      console.log(
        'Anzahl Triangles:',
        triangles.length
      );

      drawFaceMeshTexture(
        p,
        faces[0],
        triangles,
        video,
        cameraRect,
        videoW,
        videoH
      );
    }

    drawStatus(
      p,
      'Gesicht erkannt'
    );
  };

  p.windowResized = () => {

    p.resizeCanvas(
      window.innerWidth,
      window.innerHeight
    );
  };
};

new p5(sketch);