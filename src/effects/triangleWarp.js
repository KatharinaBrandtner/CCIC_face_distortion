function triangleToMat(cv, triangle, matType = cv.CV_32SC2) {
  return cv.matFromArray(
    3,
    1,
    matType,
    triangle.flatMap((p) => [Math.round(p.x), Math.round(p.y)])
  );
}



export function getTrianglePoints(face, triangle) {
  return triangle.map((index) => {
    const pt = face.keypoints[index];
    return {
      x: pt.x,
      y: pt.y,
    };
  });
}

export function getWarpTrianglePoints(warpedMesh, triangle) {
  const map = {};

  for (const pt of warpedMesh) {
    map[pt.index] = {
      x: pt.warpedX,
      y: pt.warpedY,
    };
  }

  return triangle.map((index) => map[index]);
}

export function createTriangleMask(width, height, triangle) {
  const cv = window.cv;

  const mask = cv.Mat.zeros(height, width, cv.CV_8UC1);

  const pts = cv.matFromArray(
    3,
    1,
    cv.CV_32SC2,
    [
      triangle[0].x, triangle[0].y,
      triangle[1].x, triangle[1].y,
      triangle[2].x, triangle[2].y,
    ]
  );

  cv.fillConvexPoly(mask, pts, new cv.Scalar(255));
  pts.delete();

  return mask;
}

export function getTriangleBounds(triangle) {
  const xs = triangle.map((p) => p.x);
  const ys = triangle.map((p) => p.y);

  return {
    x: Math.floor(Math.min(...xs)),
    y: Math.floor(Math.min(...ys)),
    width: Math.ceil(Math.max(...xs)) - Math.floor(Math.min(...xs)),
    height: Math.ceil(Math.max(...ys)) - Math.floor(Math.min(...ys)),
  };
}

export function getEyeBounds(face, eyeIndices) {
  const points = eyeIndices.map((index) => face.keypoints[index]);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  return {
    x: Math.floor(Math.min(...xs)),
    y: Math.floor(Math.min(...ys)),
    width: Math.ceil(Math.max(...xs)) - Math.floor(Math.min(...xs)),
    height: Math.ceil(Math.max(...ys)) - Math.floor(Math.min(...ys)),
  };
}

export function getEyeWarpRegion(eyeBounds) {
  const paddingX = eyeBounds.width * 1.5;
  const paddingY = eyeBounds.height * 2.0;

  return {
    x: eyeBounds.x - paddingX,
    y: eyeBounds.y - paddingY,
    width: eyeBounds.width + paddingX * 2,
    height: eyeBounds.height + paddingY * 2,
  };
}

export function createEyeScaleTransform(eyeRegion, scale) {
  const cv = window.cv;

  const cx = eyeRegion.width / 2;
  const cy = eyeRegion.height / 2;

  return cv.matFromArray(
    2,
    3,
    cv.CV_64FC1,
    [
      scale, 0, cx - scale * cx,
      0, scale, cy - scale * cy
    ]
  );
}

export function warpEyeRegion(canvas, eyeRegion, transform) {
  const cv = window.cv;

  const pixelRatio = canvas.width / canvas.clientWidth;

  const roiX = Math.round(eyeRegion.x * pixelRatio);
  const roiY = Math.round(eyeRegion.y * pixelRatio);
  const roiW = Math.round(eyeRegion.width * pixelRatio);
  const roiH = Math.round(eyeRegion.height * pixelRatio);

  const src = cv.imread(canvas);
  const roiRect = new cv.Rect(roiX, roiY, roiW, roiH);

  const roi = src.roi(roiRect);
  const warped = new cv.Mat();

  cv.warpAffine(
    roi,
    warped,
    transform,
    new cv.Size(roiW, roiH),
    cv.INTER_LINEAR,
    cv.BORDER_REFLECT
  );

  warped.copyTo(roi);

  cv.imshow(canvas, src);

  roi.delete();
  warped.delete();
  src.delete();
}

export function warpTriangle(
  srcMat,
  dstMat,
  srcTriangle,
  dstTriangle
) {
  const cv = window.cv;

  if (
    !srcMat ||
    !dstMat ||
    !srcTriangle ||
    !dstTriangle ||
    srcTriangle.length !== 3 ||
    dstTriangle.length !== 3
  ) {
    return;
  }

  const srcTriMat = triangleToMat(cv, srcTriangle, cv.CV_32SC2);
  const dstTriMat = triangleToMat(cv, dstTriangle, cv.CV_32SC2);

  const srcRect = cv.boundingRect(srcTriMat);
  const dstRect = cv.boundingRect(dstTriMat);

  if (
    srcRect.width <= 0 ||
    srcRect.height <= 0 ||
    dstRect.width <= 0 ||
    dstRect.height <= 0
  ) {
    srcTriMat.delete();
    dstTriMat.delete();
    return;
  }

  const srcROI = srcMat.roi(srcRect);

  const srcPts = cv.matFromArray(
    3,
    1,
    cv.CV_32FC2,
    srcTriangle.flatMap((p) => [
      p.x - srcRect.x,
      p.y - srcRect.y,
    ])
  );

  const dstPts = cv.matFromArray(
    3,
    1,
    cv.CV_32FC2,
    dstTriangle.flatMap((p) => [
      p.x - dstRect.x,
      p.y - dstRect.y,
    ])
  );

  const transform = cv.getAffineTransform(srcPts, dstPts);
  const warped = new cv.Mat();

  cv.warpAffine(
    srcROI,
    warped,
    transform,
    new cv.Size(dstRect.width, dstRect.height),
    cv.INTER_LINEAR,
    cv.BORDER_REFLECT
  );

  const mask = cv.Mat.zeros(dstRect.height, dstRect.width, cv.CV_8UC1);

  const dstPoly = cv.matFromArray(
    3,
    1,
    cv.CV_32SC2,
    dstTriangle.flatMap((p) => [
      Math.round(p.x - dstRect.x),
      Math.round(p.y - dstRect.y),
    ])
  );

  cv.fillConvexPoly(mask, dstPoly, new cv.Scalar(255));

  const dstROI = dstMat.roi(dstRect);

  warped.copyTo(dstROI, mask);

  srcTriMat.delete();
  dstTriMat.delete();
  srcROI.delete();
  dstROI.delete();
  srcPts.delete();
  dstPts.delete();
  transform.delete();
  warped.delete();
  mask.delete();
  dstPoly.delete();
}