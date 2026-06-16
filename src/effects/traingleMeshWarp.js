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

export function getWarpedTrianglePoints(
  warpedMesh,
  triangle
) {

  return triangle.map(
    index => {

      const pt =
        warpedMesh.find(
          p => p.index === index
        );

      return {
        x: pt.warpedX,
        y: pt.warpedY
      };
    }
  );
}