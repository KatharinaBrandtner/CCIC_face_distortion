export const LEFT_EYE = [
  33, 133, 160, 159, 158, 157, 173,
  144, 145, 153, 154, 155
];

export const RIGHT_EYE = [
  362, 263, 387, 386, 385, 384, 398,
  373, 374, 380, 381, 382
];

export function getEyeCenter(face, indices) {
  let x = 0;
  let y = 0;

  for (const index of indices) {
    x += face.keypoints[index].x;
    y += face.keypoints[index].y;
  }

  return {
    x: x / indices.length,
    y: y / indices.length,
  };
}
export function getEyeBounds(face, indices) {

  let minX = Infinity;
  let minY = Infinity;

  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const index of indices) {

    const pt = face.keypoints[index];

    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);

    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width,
    height
  };
}