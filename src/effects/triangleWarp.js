export function testWarpAffine() {

  const cv = window.cv;

  const srcTri = cv.matFromArray(
    3,
    1,
    cv.CV_32FC2,
    [
      0, 0,
      100, 0,
      0, 100
    ]
  );

  const dstTri = cv.matFromArray(
    3,
    1,
    cv.CV_32FC2,
    [
      0, 0,
      120, 0,
      0, 120
    ]
  );

  const warpMat =
    cv.getAffineTransform(
      srcTri,
      dstTri
    );

  console.log(
    "Affine Matrix:",
    warpMat.data64F
  );

  srcTri.delete();
  dstTri.delete();
  warpMat.delete();
}


export function getTrianglePoints(
  face,
  triangle
) {

  return triangle.map(
    index => {

      const pt =
        face.keypoints[index];

      return {
        x: pt.x,
        y: pt.y
      };

    }
  );

}

export function getWarpTrianglePoints(
  warpedMesh,
  triangle
) {

  const map = {};

  for (const pt of warpedMesh) {

    map[pt.index] = {

      x: pt.warpedX,
      y: pt.warpedY

    };
  }

  return triangle.map(
    index => map[index]
  );
}




export function createTriangleMask(
  width,
  height,
  triangle
) {

  const cv = window.cv;

  const mask =
    new cv.Mat.zeros(
      height,
      width,
      cv.CV_8UC1
    );

  const pts =
    cv.matFromArray(
      3,
      1,
      cv.CV_32SC2,
      [

        triangle[0].x,
        triangle[0].y,

        triangle[1].x,
        triangle[1].y,

        triangle[2].x,
        triangle[2].y

      ]
    );

  cv.fillConvexPoly(
    mask,
    pts,
    new cv.Scalar(255)
  );

  pts.delete();

  return mask;
}

export function getTriangleBounds(
  triangle
) {

  const xs =
    triangle.map(
      p => p.x
    );

  const ys =
    triangle.map(
      p => p.y
    );

  return {

    x: Math.floor(
      Math.min(...xs)
    ),

    y: Math.floor(
      Math.min(...ys)
    ),

    width: Math.ceil(
      Math.max(...xs)
    ) - Math.floor(
      Math.min(...xs)
    ),

    height: Math.ceil(
      Math.max(...ys)
    ) - Math.floor(
      Math.min(...ys)
    )

  };
}

export function getEyeBounds(
  face,
  eyeIndices
) {

  const points =
    eyeIndices.map(
      index =>
        face.keypoints[index]
    );

  const xs =
    points.map(p => p.x);

  const ys =
    points.map(p => p.y);

  return {

    x: Math.floor(
      Math.min(...xs)
    ),

    y: Math.floor(
      Math.min(...ys)
    ),

    width:
      Math.ceil(
        Math.max(...xs)
      ) -
      Math.floor(
        Math.min(...xs)
      ),

    height:
      Math.ceil(
        Math.max(...ys)
      ) -
      Math.floor(
        Math.min(...ys)
      )

  };
}

export function getEyeWarpRegion(
  eyeBounds
) {

  const paddingX =
    eyeBounds.width * 1.5;

  const paddingY =
    eyeBounds.height * 2.0;

  return {

    x:
      eyeBounds.x - paddingX,

    y:
      eyeBounds.y - paddingY,

    width:
      eyeBounds.width +
      paddingX * 2,

    height:
      eyeBounds.height +
      paddingY * 2

  };
}

export function createEyeScaleTransform(
  eyeRegion,
  scale
) {

  const cv = window.cv;

  const cx =
    eyeRegion.width / 2;

  const cy =
    eyeRegion.height / 2;

  return cv.matFromArray(
    2,
    3,
    cv.CV_64FC1,
    [

      scale,
      0,
      cx - scale * cx,

      0,
      scale,
      cy - scale * cy

    ]
  );
}
export function warpEyeRegion(
  canvas,
  eyeRegion,
  transform
) {
   const pixelRatio =
  canvas.width /
  canvas.clientWidth;
  const roiX =
  Math.round(
    eyeRegion.x * pixelRatio
  );

const roiY =
  Math.round(
    eyeRegion.y * pixelRatio
  );

const roiW =
  Math.round(
    eyeRegion.width * pixelRatio
  );

const roiH =
  Math.round(
    eyeRegion.height * pixelRatio
  );

  const cv = window.cv;

  const src =
    cv.imread(canvas);

     console.log(
  "SRC SIZE",
  src.cols,
  src.rows
);

console.log(
  "ROI",
  roiX,
  roiY,
  roiW,
  roiH
);
  const roi =
    src.roi(
      new cv.Rect(
        roiX,
        roiY,
        roiW,
        roiH
        )
    );

  const warped =
    new cv.Mat();

  const size =
    new cv.Size(
      eyeRegion.width,
      eyeRegion.height
    );
console.log(
  "Transform",
  transform.data64F
);
  cv.warpAffine(
    roi,
    warped,
    transform,
    size,
    cv.INTER_LINEAR,
    cv.BORDER_REFLECT
  );

  warped.copyTo(
  src.roi(
    new cv.Rect(
      Math.round(eyeRegion.x),
      Math.round(eyeRegion.y),
      Math.round(eyeRegion.width),
      Math.round(eyeRegion.height)
    )
  )
);


  cv.imshow(
    canvas,
    src
  );

  roi.delete();
  warped.delete();
  src.delete();
}
