export function getCoverRect(canvasW, canvasH, videoW, videoH) {
    const scale = Math.max(canvasW / videoW, canvasH / videoH);
  
    const w = videoW * scale;
    const h = videoH * scale;
  
    const x = (canvasW - w) / 2;
    const y = (canvasH - h) / 2;
  
    return { x, y, w, h };
  }
  export function drawCamera(p, video, videoSize) {
    const videoEl = video?.elt || video;
  
    if (!videoEl || !(videoEl instanceof HTMLVideoElement)) {
      console.warn('drawCamera: kein gültiges Video-Element:', videoEl);
      return;
    }
  
    if (videoEl.readyState < 2) {
      return;
    }
  
    const rect = getCoverRect(
      p.width,
      p.height,
      videoSize.width,
      videoSize.height
    );
  
    // statt p.image(), direkter Canvas drawImage:
    p.drawingContext.drawImage(
      videoEl,
      rect.x,
      rect.y,
      rect.w,
      rect.h
    );
  }

  export function drawFacePoints(p, face, videoSize) {
    const rect = getCoverRect(
      p.width,
      p.height,
      videoSize.width,
      videoSize.height
    );
  
    p.noStroke();
    p.fill(0, 255, 0);
  
    for (const point of face.keypoints) {
      const x = rect.x + (point.x / videoSize.width) * rect.w;
      const y = rect.y + (point.y / videoSize.height) * rect.h;
  
      p.circle(x, y, 3);
    }
  }
  export function drawStatus(p, text) {
    p.noStroke();
    p.fill(255);
    p.textSize(18);
    p.text(text, 24, p.height - 32);
  }