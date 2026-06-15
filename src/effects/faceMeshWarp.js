export function getWarpedEyeMesh(
  face,
  eyeIndices,
  strength = 1.4
) {

  let centerX = 0;
  let centerY = 0;

  for (const index of eyeIndices) {

    const pt = face.keypoints[index];

    centerX += pt.x;
    centerY += pt.y;
  }

  centerX /= eyeIndices.length;
  centerY /= eyeIndices.length;

  const mesh = [];

  for (const index of eyeIndices) {

    const pt = face.keypoints[index];

    const dx = pt.x - centerX;
    const dy = pt.y - centerY;

    mesh.push({

      index,

      originalX: pt.x,
      originalY: pt.y,

      warpedX:
        centerX + dx * strength,

      warpedY:
        centerY + dy * strength

    });
  }

  return mesh;
}