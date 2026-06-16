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
  testWarpAffine
} from "../effects/triangleWarp.js";

import {
  testCanvasCapture
} from "../effects/opencvCanvas.js";

let tested = false;

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

      drawTriangles(
        p,
        face,
        FACE_REGIONS.LEFT_EYE,
        videoSize
      );

      drawTriangles(
        p,
        face,
        FACE_REGIONS.RIGHT_EYE,
        videoSize
      );

      drawWarpTriangles(
        p,
        face,
        LEFT_EYE,
        FACE_REGIONS.LEFT_EYE,
        videoSize
      );

      drawWarpTriangles(
        p,
        face,
        RIGHT_EYE,
        FACE_REGIONS.RIGHT_EYE,
        videoSize
      );

      drawStatus(
        p,
        "Stage 6: Warp Mesh"
      );
    }
  };

});

function drawTriangles(
  p,
  face,
  triangles,
  videoSize
) {

  const coverRect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  p.noFill();
  p.stroke(0,255,255);
  p.strokeWeight(1);

  for (const tri of triangles) {

    p.beginShape();

    for (const index of tri) {

      const pt =
        face.keypoints[index];

      const x =
        coverRect.x +
        (pt.x / videoSize.width) *
        coverRect.w;

      const y =
        coverRect.y +
        (pt.y / videoSize.height) *
        coverRect.h;

      p.vertex(x,y);
    }

    p.endShape(p.CLOSE);
  }
}

function drawWarpTriangles(
  p,
  face,
  eyeIndices,
  triangles,
  videoSize
) {

  const coverRect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  const warpedMesh =
    getWarpedEyeMesh(
      face,
      eyeIndices,
      1.4
    );

  const warpedMap = {};

  for (const Coverpoint of warpedMesh) {

    warpedMap[Coverpoint.index] = {
      x: Coverpoint.warpedX,
      y: Coverpoint.warpedY
    };
  }

  p.noFill();
  p.stroke(255,255,0);
  p.strokeWeight(2);

  for (const tri of triangles) {

    p.beginShape();

    for (const index of tri) {

      let px;
      let py;

      if (warpedMap[index]) {

        px = warpedMap[index].x;
        py = warpedMap[index].y;

      } else {

        px = face.keypoints[index].x;
        py = face.keypoints[index].y;
      }

      const x =
        coverRect.x +
        (px / videoSize.width) *
        coverRect.w;

      const y =
        coverRect.y +
        (py / videoSize.height) *
        coverRect.h;

      p.vertex(x,y);
    }

    p.endShape(p.CLOSE);
  }
}