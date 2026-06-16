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
    const panelWidth = p.width / 3; // Panel nur auf der linken Seite
    const bottomY = p.height - 210;
  
    // Dunkler Glow unten links mit erhöhter Transparenz
    p.noStroke();
    p.fill(0, 120); // Transparenz erhöht (170 -> 120)
    p.rect(0, p.height - 280, panelWidth, 280); // Rechteck nur links
  
    // Text
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(22);
    p.fill(220, 245, 255);
  
    p.text('ANALYZING FACE...', marginX, bottomY);
    p.text('DETECTING EMOTIONAL PROFILE...', marginX, bottomY + 58);
    p.text('CALCULATING POTENTIAL...', marginX, bottomY + 116);
  
    // Ladeanzeige (Progress Bar)
    const progressBarWidth = panelWidth - 2 * marginX;
    const progressBarHeight = 20;
    const progressBarX = marginX;
    const progressBarY = bottomY + 180;

    p.noStroke();
    p.fill('white'); // Farbe der Ladeanzeige
    p.rect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);

    p.stroke(220, 245, 255);
    p.noFill();
    p.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight); // Rahmen
  
    p.pop();
}
  export function getMoodVisuals(mood) {
    const label = mood?.label || 'neutral';
  
    const moodMap = {
      happy: {
        label: 'HAPPY',
        color: [255, 210, 90],
      },
      neutral: {
        label: 'NEUTRAL',
        color: [255, 220, 120],
      },
      sad: {
        label: 'SAD',
        color: [90, 150, 255],
      },
      angry: {
        label: 'ANGRY',
        color: [255, 90, 90],
      },
      surprised: {
        label: 'SURPRISED',
        color: [120, 220, 255],
      },
      fearful: {
        label: 'FEARFUL',
        color: [180, 120, 255],
      },
      disgusted: {
        label: 'DISGUSTED',
        color: [140, 220, 120],
      },
      unknown: {
        label: 'UNKNOWN',
        color: [180, 180, 180],
      },
    };
  
    return moodMap[label] || moodMap.neutral;
  }
  
  export function getHappinessScore(mood) {
    if (!mood?.expressions) return 0;
    return Math.round((mood.expressions.happy || 0) * 100);
  }
  
  export function drawMoodTint(p, mood) {
    const visuals = getMoodVisuals(mood);
    const [r, g, b] = visuals.color;
  
    p.push();
    p.noStroke();
  
    // leichte Vollflächen-Tönung über dem ganzen Bild
    p.fill(r, g, b, 28);
    p.rect(0, 0, p.width, p.height);
  
    p.pop();
  }
  
export function drawMoodResultPanel(p, mood) {
    const visuals = getMoodVisuals(mood);
    const [r, g, b] = visuals.color;

    const detectedMood = visuals.label;
    const happinessScore = getHappinessScore(mood);

    const leftX = 28;
    const panelWidth = p.width / 3; // Panel nur auf der linken Seite
    const blockTop = p.height - 170;
    const labelSize = 22;
    const valueSize = 16;
    const bigValueSize = 22;

    p.push();

    // Unterer Panel-Hintergrund (nur links)
    p.noStroke();
    p.fill(0, 0, 0, 120);
    p.rect(0, p.height - 210, panelWidth, 210);

    // feine Linie
    p.stroke(r, g, b, 70);
    p.strokeWeight(1);
    p.line(leftX, blockTop + 42, panelWidth - leftX, blockTop + 42);

    // Labels / Werte
    p.noStroke();
    p.fill(230);
    p.textAlign(p.LEFT, p.TOP);

    p.textSize(labelSize);
    p.text('DETECTED MOOD', leftX, blockTop);

    p.textSize(valueSize);
    p.fill(r, g, b);
    p.text(detectedMood, leftX, blockTop + 20);

    // Happiness Score
    p.textSize(labelSize);
    p.fill(230);
    p.text('HAPPINESS SCORE', leftX, blockTop + 58);

    p.textSize(bigValueSize);
    p.fill(r, g, b);
    p.text(`${happinessScore}%`, leftX, blockTop + 78);

    // Progress bar
    const barX = leftX;
    const barY = blockTop + 112;
    const barW = panelWidth - leftX * 2; // Fortschrittsbalken nur im linken Bereich
    const barH = 8;
    const progress = happinessScore / 100;

    // Balken Hintergrund
    p.noStroke();
    p.fill(255, 255, 255, 35);
    p.rect(barX, barY, barW, barH, 2);

    // Balken Füllung
    p.fill(r, g, b);
    p.rect(barX, barY, barW * progress, barH, 2);

    // leichter Glow
    p.stroke(r, g, b, 180);
    p.strokeWeight(2);
    p.line(barX, barY - 2, barX + barW * progress, barY - 2);

    p.pop();
}