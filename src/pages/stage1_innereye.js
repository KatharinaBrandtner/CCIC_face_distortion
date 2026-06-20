const p5 = window.p5;
import { waitForOpenCV } from "../opencvReady.js";

import {
  setupFaceTracking,
  getFaces,
  getVideo,
  getVideoSize,
  hasFace,
  isFaceTrackingReady,
} from "../faceTracking.js";

import { drawCamera, drawStatus, getCoverRect } from "../drawing.js";

import {
  testWarpAffine,
  warpTriangle,
} from "../effects/triangleWarp.js";

let tested = false;

// ----------------------------------------------------
// Tuning
// ----------------------------------------------------

// Innere Augenkontur
const INNER_CORNER_SCALE = 1.03;   // Tränenkanal
const OUTER_CORNER_SCALE = 1.08;    // äußerer Augenwinkel

const UPPER_LID_SCALE = 1.16;       // oberes Lid / Wimpernkranz
const LOWER_LID_SCALE = 1.10;       // unteres Lid / Wimpernkranz

// äußerer Ring um das Auge herum
const OUTER_RING_SCALE = 1.08;

// ----------------------------------------------------
// MediaPipe eye contour groups (subject perspective)
// ----------------------------------------------------

// Linkes Auge aus Sicht der Person
// outer corner = 33, inner corner = 133
const LEFT_EYE_CONTOUR = [
  33, 7, 163, 144, 145, 153, 154, 155,
  133, 246, 161, 160, 159, 158, 157, 173
];

// Rechtes Auge aus Sicht der Person
// outer corner = 263, inner corner = 362
const RIGHT_EYE_CONTOUR = [
  263, 249, 390, 373, 374, 380, 381, 382,
  362, 466, 388, 387, 386, 385, 384, 398
];

// Äußerer weicher Ring um das linke Auge herum
// (keine Brauenpunkte drin, damit die Braue frei bleibt)
const LEFT_EYE_OUTER_RING = [
  130, 247, 30, 29, 27, 28, 56, 190,
  243, 112, 26, 22, 23, 24, 110, 25,
  31, 228, 229, 230, 231, 232, 233, 244
];

// Äußerer weicher Ring um das rechte Auge herum
const RIGHT_EYE_OUTER_RING = [
  463, 414, 286, 258, 257, 259, 260, 467,
  359, 255, 339, 254, 253, 252, 256, 341,
  261, 448, 449, 450, 451, 452, 453, 464
];

// ----------------------------------------------------
// Verified inner-eye triangles
// ----------------------------------------------------

const INNER_EYE_TRIANGLES = [
  // linkes Auge
  [33, 160, 158],
  [33, 158, 133],
  [33, 144, 145],
  [33, 145, 133],
  [160, 159, 158],
  [158, 157, 133],
  [144, 145, 153],
  [145, 153, 133],
  [159, 158, 157],
  [145, 153, 154],
  [33, 246, 161],
  [161, 160, 33],
  [133, 155, 154],
  [154, 153, 133],

  // rechtes Auge
  [362, 385, 387],
  [362, 387, 263],
  [362, 373, 374],
  [362, 374, 263],
  [385, 386, 387],
  [387, 388, 263],
  [373, 374, 380],
  [374, 380, 263],
  [386, 387, 388],
  [374, 380, 381],
  [362, 398, 384],
  [384, 385, 362],
  [263, 249, 390],
  [390, 380, 263],
];

// ----------------------------------------------------
// Outer band triangles: stitches inner contour to outer ring
// ----------------------------------------------------

function buildBandTriangles(innerRing, outerRing) {
  const triangles = [];
  const n = Math.max(innerRing.length, outerRing.length);

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;

    const innerA = innerRing[Math.floor((i / n) * innerRing.length)];
    const innerB = innerRing[Math.floor((j / n) * innerRing.length)];
    const outerA = outerRing[Math.floor((i / n) * outerRing.length)];
    const outerB = outerRing[Math.floor((j / n) * outerRing.length)];

    triangles.push([innerA, outerA, outerB]);
    triangles.push([innerA, outerB, innerB]);
  }

  return triangles;
}


const ALL_TRIANGLES = [
  ...INNER_EYE_TRIANGLES
];
// ----------------------------------------------------
// Helpers
// ----------------------------------------------------

function landmarkToCanvas(p, point, videoSize) {
  const rect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  const videoX = point.x <= 1 ? point.x * videoSize.width : point.x;
  const videoY = point.y <= 1 ? point.y * videoSize.height : point.y;

  return {
    x: rect.x + (videoX / videoSize.width) * rect.w,
    y: rect.y + (videoY / videoSize.height) * rect.h,
  };
}

function getCenter(points, indices) {
  let x = 0;
  let y = 0;
  let count = 0;

  for (const index of indices) {
    const pt = points[index];
    if (!pt) continue;
    x += pt.x;
    y += pt.y;
    count += 1;
  }

  if (count === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: x / count,
    y: y / count,
  };
}

function scalePoint(points, index, center, scale) {
  if (!points[index]) return;

  points[index] = {
    x: center.x + (points[index].x - center.x) * scale,
    y: center.y + (points[index].y - center.y) * scale,
  };
}

function scaleGroup(points, indices, center, scale) {
  for (const index of indices) {
    scalePoint(points, index, center, scale);
  }
}

function createManipulatedPoints(originalPoints) {
  const points = originalPoints.map((p) => ({
    x: p.x,
    y: p.y,
  }));

  const leftCenter = getCenter(originalPoints, LEFT_EYE_CONTOUR);
  const rightCenter = getCenter(originalPoints, RIGHT_EYE_CONTOUR);

  // ----------------------------------------------------
  // Linkes Auge (Personenperspektive)
  // ----------------------------------------------------

  // Eckpunkte
  scalePoint(points, 33, leftCenter, OUTER_CORNER_SCALE);
  scalePoint(points, 133, leftCenter, INNER_CORNER_SCALE);

  // Oberes Lid
  scaleGroup(points, [246, 161], leftCenter, UPPER_LID_SCALE);
  scaleGroup(points, [160, 159, 158, 157, 173], leftCenter, UPPER_LID_SCALE);

  // Unteres Lid
  scaleGroup(points, [7, 163, 144, 145, 153, 154, 155], leftCenter, LOWER_LID_SCALE);

  // Äußerer Ring
  scaleGroup(points, LEFT_EYE_OUTER_RING, leftCenter, OUTER_RING_SCALE);

  // ----------------------------------------------------
  // Rechtes Auge (Personenperspektive)
  // ----------------------------------------------------

  // Eckpunkte
  scalePoint(points, 263, rightCenter, OUTER_CORNER_SCALE);
  scalePoint(points, 362, rightCenter, INNER_CORNER_SCALE);

  // Oberes Lid
  scaleGroup(points, [466, 388], rightCenter, UPPER_LID_SCALE);
  scaleGroup(points, [387, 386, 385, 384, 398], rightCenter, UPPER_LID_SCALE);

  // Unteres Lid
  scaleGroup(points, [249, 390, 373, 374, 380, 381, 382], rightCenter, LOWER_LID_SCALE);

  // Äußerer Ring
  scaleGroup(points, RIGHT_EYE_OUTER_RING, rightCenter, OUTER_RING_SCALE);

  return points;
}

// ----------------------------------------------------
// App
// ----------------------------------------------------

new p5((p) => {
  p.setup = async () => {
    p.createCanvas(window.innerWidth, window.innerHeight);
    p.pixelDensity(1);

    await waitForOpenCV();
    testWarpAffine();
    await setupFaceTracking();
  };

  p.draw = () => {
    p.background(0);

    const video = getVideo();
    const videoSize = getVideoSize();

    if (!video || video.readyState < 2) {
      drawStatus(p, "Kamera lädt...");
      return;
    }

    drawCamera(p, video, videoSize);

    if (!tested && window.cv) {
      tested = true;
    }

    if (!isFaceTrackingReady() || !hasFace()) {
      drawStatus(p, "Stage 9");
      return;
    }

    const face = getFaces()[0];
    const cv = window.cv;

    const originalPoints = face.keypoints.map((pt) =>
      landmarkToCanvas(p, pt, videoSize)
    );

    const manipulatedPoints = createManipulatedPoints(originalPoints);

    const srcMat = cv.imread(p.canvas);
    const dstMat = srcMat.clone();

    try {
      for (const tri of ALL_TRIANGLES) {
        const srcTriangle = tri.map((id) => originalPoints[id]);
        const dstTriangle = tri.map((id) => manipulatedPoints[id]);

        if (
          srcTriangle.some((pt) => !pt) ||
          dstTriangle.some((pt) => !pt)
        ) {
          continue;
        }

        warpTriangle(
          srcMat,
          dstMat,
          srcTriangle,
          dstTriangle
        );
      }

      cv.imshow(p.canvas, dstMat);
    } catch (error) {
      console.error("Error in stage9:", error);
    } finally {
      srcMat.delete();
      dstMat.delete();
    }

    drawStatus(p, "Stage 9");
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
});