import p5 from "p5";

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
  drawStatus,
  getCoverRect
} from "../drawing.js";

import {
  LEFT_EYE,
  RIGHT_EYE
} from "../effects/faceMorph.js";

import {
  warpEyePoints
} from "../effects/eyeWarp.js";

new p5((p) => {

  p.setup = async () => {

    p.createCanvas(
      window.innerWidth,
      window.innerHeight
    );

    await setupFaceTracking();
  };

  p.draw = () => {

    p.background(0);

    const video = getVideo();
    const videoSize = getVideoSize();

    if (!video || video.readyState < 2) {

      drawStatus(
        p,
        "Kamera lädt..."
      );

      return;
    }

    drawCamera(
      p,
      video,
      videoSize
    );

    if (
  isFaceTrackingReady() &&
  hasFace()
) {

  const face =
    getFaces()[0];

  drawWarpedEye(
    p,
    face,
    LEFT_EYE,
    videoSize,
    1.4
  );

  drawWarpedEye(
    p,
    face,
    RIGHT_EYE,
    videoSize,
    1.4
  );

  drawStatus(
    p,
    "Stage 3: Eye Warp"
  );
}
  };

});

function drawWarpedEye(
  p,
  face,
  eyeIndices,
  videoSize,
  strength
) {

  const rect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  const warped =
    warpEyePoints(
      face,
      eyeIndices,
      strength
    );

  p.noFill();

  p.stroke(
    0,
    255,
    255
  );

  p.strokeWeight(3);

  p.beginShape();

  for (const pt of warped) {

    const x =
      rect.x +
      (pt.x / videoSize.width) *
      rect.w;

    const y =
      rect.y +
      (pt.y / videoSize.height) *
      rect.h;

    p.vertex(x, y);
  }

  p.endShape(p.CLOSE);
}