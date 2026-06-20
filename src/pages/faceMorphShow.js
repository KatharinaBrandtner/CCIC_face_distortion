const p5 = window.p5;

import {
  getCoverRect
} from "../drawing.js";

import {
  setupFaceTracking,
  getFaces,
  getVideo,
  getVideoSize,
  hasFace,
  isFaceTrackingReady
} from "../faceTracking.js";

import {
  drawCamera,
  drawStatus
} from "../drawing.js";

import {
  LEFT_EYE,
  RIGHT_EYE,
  getEyeCenter,
  getEyeBounds
} from "../effects/faceMorph.js";

new p5((p) => {

  p.setup = async () => {
    p.createCanvas(window.innerWidth, window.innerHeight);

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

    if (isFaceTrackingReady() && hasFace()) {

      const faces = getFaces();
      const face = faces[0];

      drawEyeDebug(
        p,
        face,
        videoSize
      );

      drawStatus(
        p,
        "Eye Debug"
      );
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(
      window.innerWidth,
      window.innerHeight
    );
  };

});

function drawEyeDebug(p, face, videoSize) {

  const rect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  const leftCenter = getEyeCenter(face, LEFT_EYE);
  const rightCenter = getEyeCenter(face, RIGHT_EYE);
  const leftBounds =
    getEyeBounds(face, LEFT_EYE);
  const rightBounds =
    getEyeBounds(face, RIGHT_EYE);

  p.noStroke();

  // Augenpunkte rot
  p.fill(255, 0, 0);

  for (const index of LEFT_EYE) {

    const pt = face.keypoints[index];

    const x =
      rect.x +
      (pt.x / videoSize.width) *
      rect.w;

    const y =
      rect.y +
      (pt.y / videoSize.height) *
      rect.h;

    p.circle(x, y, 8);
  }

  for (const index of RIGHT_EYE) {

    const pt = face.keypoints[index];

    const x =
      rect.x +
      (pt.x / videoSize.width) *
      rect.w;

    const y =
      rect.y +
      (pt.y / videoSize.height) *
      rect.h;

    p.circle(x, y, 8);
  }

  // Augenzentren grün

  const leftX =
    rect.x +
    (leftCenter.x / videoSize.width) *
    rect.w;

  const leftY =
    rect.y +
    (leftCenter.y / videoSize.height) *
    rect.h;

  const rightX =
    rect.x +
    (rightCenter.x / videoSize.width) *
    rect.w;

  const rightY =
    rect.y +
    (rightCenter.y / videoSize.height) *
    rect.h;

  p.fill(0, 255, 0);

  p.circle(leftX, leftY, 20);
  p.circle(rightX, rightY, 20);

p.noFill();
p.stroke(0, 255, 255);
p.strokeWeight(2);

const leftWidth =
  (leftBounds.width / videoSize.width) *
  rect.w;

const leftHeight =
  (leftBounds.height / videoSize.height) *
  rect.h;
p.noStroke();
p.fill(0,255,0,80);
p.ellipse(
  leftX,
  leftY,
  leftWidth * 1.7,
  leftHeight * 2.5
);

const rightWidth =
  (rightBounds.width / videoSize.width) *
  rect.w;

const rightHeight =
  (rightBounds.height / videoSize.height) *
  rect.h;

p.ellipse(
  rightX,
  rightY,
  rightWidth * 1.7,
  rightHeight * 2.5
);
}