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

  drawWarpMesh(
  p,
  face,
  LEFT_EYE,
  videoSize
);

drawWarpMesh(
  p,
  face,
  RIGHT_EYE,
  videoSize
);

  drawStatus(
    p,
    "Stage 3: Eye Warp"
  );
}
  };

});

function drawWarpMesh(
  p,
  face,
  eyeIndices,
  videoSize
) {

  const rect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  const mesh =
    getWarpedEyeMesh(
      face,
      eyeIndices,
      1.4
    );

  for (const point of mesh) {

    const originalX =
      rect.x +
      (point.originalX /
        videoSize.width) *
        rect.w;

    const originalY =
      rect.y +
      (point.originalY /
        videoSize.height) *
        rect.h;

    const warpedX =
      rect.x +
      (point.warpedX /
        videoSize.width) *
        rect.w;

    const warpedY =
      rect.y +
      (point.warpedY /
        videoSize.height) *
        rect.h;

    p.stroke(255,255,0);

    p.line(
      originalX,
      originalY,
      warpedX,
      warpedY
    );

    p.noStroke();

    p.fill(255,0,0);

    p.circle(
      originalX,
      originalY,
      8
    );

    p.fill(0,255,255);

    p.circle(
      warpedX,
      warpedY,
      8
    );
  }
}