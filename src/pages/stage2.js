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
  RIGHT_EYE,
  getEyeCenter,
  getEyeBounds
} from "../effects/faceMorph.js";

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

      drawEyeBoxes(
        p,
        face,
        videoSize
      );

      drawStatus(
        p,
        "Stage 2: Eye Region"
      );
    }
  };

});

function drawEyeBoxes(
  p,
  face,
  videoSize
) {

  const rect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  drawSingleEye(
    p,
    face,
    LEFT_EYE,
    rect,
    videoSize
  );

  drawSingleEye(
    p,
    face,
    RIGHT_EYE,
    rect,
    videoSize
  );
}

function drawSingleEye(
  p,
  face,
  eyeIndices,
  rect,
  videoSize
) {

  const center =
    getEyeCenter(
      face,
      eyeIndices
    );

  const bounds =
    getEyeBounds(
      face,
      eyeIndices
    );

  const centerX =
    rect.x +
    (center.x /
      videoSize.width) *
      rect.w;

  const centerY =
    rect.y +
    (center.y /
      videoSize.height) *
      rect.h;

  const eyeWidth =
    (bounds.width /
      videoSize.width) *
      rect.w;

  const eyeHeight =
    (bounds.height /
      videoSize.height) *
      rect.h;

  const boxWidth = eyeWidth * 1.6;
const boxHeight = eyeHeight * 2.3;

  p.noFill();

  p.stroke(
    255,
    255,
    0
  );

  p.strokeWeight(2);

  // p.rect(
  //   centerX -
  //     boxWidth / 2,

  //   centerY -
  //     boxHeight / 2,

  //   boxWidth,
  //   boxHeight
  // );

  p.noStroke();

  p.fill(
    0,
    255,
    0
  );

  // p.circle(
  //   centerX,
  //   centerY,
  //   16
  // );

  p.stroke(255,0,0);

// p.rect(
//   centerX - eyeWidth/2,
//   centerY - eyeHeight/2,
//   eyeWidth,
//   eyeHeight
// );

const x =
  centerX - boxWidth / 2;

const y =
  centerY - boxHeight / 2;

const eyeRegion = p.get(
  x,
  y,
  boxWidth,
  boxHeight
);

p.image(
  eyeRegion,
  x - boxWidth * 0.1,
  y - boxHeight * 0.1,
  boxWidth * 1.2,
  boxHeight * 1.2
);

}