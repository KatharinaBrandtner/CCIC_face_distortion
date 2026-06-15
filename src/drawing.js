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

  export function drawAnalysisOverlay(p, progress) {
    p.push();
  
    const marginX = 60;
    const bottomY = p.height - 210;
  
    // dunkler Glow unten
    p.noStroke();
    p.fill(0, 170);
    p.rect(0, p.height - 280, p.width, 280);
  
    // Text
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(22);
    p.fill(220, 245, 255);
  
    p.text('ANALYZING FACE...', marginX, bottomY);
    p.text('DETECTING EMOTIONAL PROFILE...', marginX, bottomY + 58);
    p.text('CALCULATING POTENTIAL...', marginX, bottomY + 116);
  
    // Ladebalken
    const barX = marginX;
    const barY = p.height - 55;
    const barW = p.width - marginX * 2;
    const barH = 8;
  
    // Hintergrund Balken
    p.noStroke();
    p.fill(180, 220, 230, 50);
    p.rect(barX, barY, barW, barH);
  
    // Fortschritt
    p.fill(220, 250, 255);
    p.rect(barX, barY, barW * progress, barH);
  
    // Glow-Linie
    p.stroke(220, 250, 255, 180);
    p.strokeWeight(1);
    p.line(barX, barY - 3, barX + barW * progress, barY - 3);
  
    p.pop();
  }