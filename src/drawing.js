// zeichent nur Kamera, Gesichtspunkte und Status
export function getCoverRect(srcW, srcH, dstW, dstH) {
    const srcRatio = srcW / srcH;
    const dstRatio = dstW / dstH;
  
    let w;
    let h;
    let x;
    let y;
  
    if (dstRatio > srcRatio) {
      w = dstW;
      h = dstW / srcRatio;
      x = 0;
      y = (dstH - h) / 2;
    } else {
      h = dstH;
      w = dstH * srcRatio;
      x = (dstW - w) / 2;
      y = 0;
    }
  
    return { x, y, w, h };
  }
  
  export function drawCamera(p, video, rect) {
    p.push(); // Speichere den aktuellen Zustand der Transformationen
    p.translate(rect.x + rect.w, rect.y); // Verschiebe den Ursprung
    p.scale(-1, 1); // Spiegele die x-Achse
    p.image(video, 0, 0, rect.w, rect.h); // Zeichne das Video
    p.pop();
  }
  export function drawFacePoints(p, faces, rect, videoW, videoH) {
    for (const face of faces) {
      const keypoints = face.keypoints || [];
  
      for (const pt of keypoints) {
        const px = pt.x ?? pt[0];
        const py = pt.y ?? pt[1];
  
        if (px == null || py == null) continue;
  
        // Spiegel die x-Koordinate relativ zur Breite des Rechtecks
        const mirroredPx = videoW - px;
  
        const x = rect.x + (mirroredPx / videoW) * rect.w;
        const y = rect.y + (py / videoH) * rect.h;
  
        // Zeichne den Punkt
        p.fill('lightgreen');
        p.noStroke();
        p.ellipse(x, y, 5, 5);
      }
    }
  }
  
  export function drawStatus(p, text) {
    p.noStroke();
    p.fill(255);
    p.textSize(18);
    p.text(text, 24, p.height - 32);
  }