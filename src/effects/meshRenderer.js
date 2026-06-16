import { getCoverRect }
  from "../drawing.js";

export function drawTriangles(
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

export function drawWarpTriangles(
  p,
  face,
  eyeIndices,
  triangles,
  videoSize,
  warpedMesh
) {

  const coverRect = getCoverRect(
    p.width,
    p.height,
    videoSize.width,
    videoSize.height
  );

  const warpedMap = {};

  for (const point of warpedMesh) {

    warpedMap[point.index] = {

      x: point.warpedX,
      y: point.warpedY

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