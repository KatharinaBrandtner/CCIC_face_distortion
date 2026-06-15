export function drawFaceMeshTexture(
  p,
  face,
  triangles,
  video,
  rect,
  videoW,
  videoH
) {
  if (!face) return;

  const keypoints = face.keypoints;

  p.push();

  p.translate(rect.x, rect.y);

  p.textureMode(p.NORMAL);
  p.texture(video);
  p.noStroke();

  p.beginShape(p.TRIANGLES);

  for (const tri of triangles) {
    const [a, b, c] = tri;

    const pa = keypoints[a];
    const pb = keypoints[b];
    const pc = keypoints[c];

    if (!pa || !pb || !pc) continue;

    const ax = ((videoW - pa.x) / videoW) * rect.w;
    const ay = (pa.y / videoH) * rect.h;

    const bx = ((videoW - pb.x) / videoW) * rect.w;
    const by = (pb.y / videoH) * rect.h;

    const cx = ((videoW - pc.x) / videoW) * rect.w;
    const cy = (pc.y / videoH) * rect.h;

    p.vertex(
      ax,
      ay,
      pa.x / videoW,
      pa.y / videoH
    );

    p.vertex(
      bx,
      by,
      pb.x / videoW,
      pb.y / videoH
    );

    p.vertex(
      cx,
      cy,
      pc.x / videoW,
      pc.y / videoH
    );
  }

  p.endShape();

  p.pop();
}