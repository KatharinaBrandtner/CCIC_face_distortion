import p5 from "p5";
import {
  waitForOpenCV
} from "../opencvReady.js";

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
  getWarpedEyeMesh
} from "../effects/faceMeshWarp.js";

import {
  FACE_REGIONS
} from "../effects/facemeshTopology.js";

import {
  testWarpAffine,
  getWarpTrianglePoints,
  getTrianglePoints,
  getTriangleBounds,
  getEyeBounds,
  getEyeWarpRegion,
  createEyeScaleTransform,
  warpEyeRegion
} from "../effects/triangleWarp.js";

import {
  testCanvasCapture
} from "../effects/opencvCanvas.js";

import {
  drawTriangles,
  drawWarpTriangles
} from "../effects/meshRenderer.js";

let tested = false;
let triangleLogged = false;

new p5((p) => {
  p.setup = async () => {

  p.createCanvas(
    window.innerWidth,
    window.innerHeight
  );

  await waitForOpenCV();
  console.log(
  "OpenCV:",
  window.cv
);

testWarpAffine();

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

    if (window.cv) {

  drawStatus(
    p,
    "OpenCV läuft"
  );
}

    drawCamera(
      p,
      video,
      videoSize
    );

    if (!tested && window.cv) {

  testCanvasCapture(
    p.canvas
  );

  tested = true;
}

 if (
  isFaceTrackingReady() &&
  hasFace()
) {

  const face =
    getFaces()[0];

  const leftWarp =
    getWarpedEyeMesh(
      face,
      LEFT_EYE,
      1.4
    );




console.log(
  "P5 SIZE",
  p.width,
  p.height
);
  const eyeBounds =
    getEyeBounds(
      face,
      LEFT_EYE
    );

  const eyeRegion =
    getEyeWarpRegion(
      eyeBounds
    );

    const coverRect =
  getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

const canvasEyeRegion = {

  x:
    coverRect.x +
    (eyeRegion.x / videoSize.width)
    * coverRect.w,

  y:
    coverRect.y +
    (eyeRegion.y / videoSize.height)
    * coverRect.h,

  width:
    (eyeRegion.width / videoSize.width)
    * coverRect.w,

  height:
    (eyeRegion.height / videoSize.height)
    * coverRect.h
};

  if (!triangleLogged) {

    console.log(
      "Eye Bounds",
      eyeBounds
    );

    console.log(
      "Eye Region",
      canvasEyeRegion
    );

    triangleLogged = true;
  }

  const eyeTransform =
    createEyeScaleTransform(
      canvasEyeRegion,
      2
    );

  warpEyeRegion(
    p.canvas,
    canvasEyeRegion,
    eyeTransform
  );

  eyeTransform.delete();

  drawWarpTriangles(
    p,
    face,
    LEFT_EYE,
    FACE_REGIONS.LEFT_EYE,
    videoSize,
    leftWarp
  );

  const rightWarp =
    getWarpedEyeMesh(
      face,
      RIGHT_EYE,
      1.4
    );

  drawWarpTriangles(
    p,
    face,
    RIGHT_EYE,
    FACE_REGIONS.RIGHT_EYE,
    videoSize,
    rightWarp
  );

  drawStatus(
    p,
    "Stage 8"
  );}}});
