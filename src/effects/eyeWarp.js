export function warpEyePoints(
  face,
  eyeIndices,
  strength = 1.2
) {

  const points = [];

  let centerX = 0;
  let centerY = 0;

  for (const index of eyeIndices) {

    const pt = face.keypoints[index];

    centerX += pt.x;
    centerY += pt.y;
  }

  centerX /= eyeIndices.length;
  centerY /= eyeIndices.length;

  for (const index of eyeIndices) {

    const pt = face.keypoints[index];

    const dx = pt.x - centerX;
    const dy = pt.y - centerY;

    points.push({
      x: centerX + dx * strength,
      y: centerY + dy * strength
    });
  }

  return points;
}