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
  
    p.drawingContext.drawImage(videoEl, rect.x, rect.y, rect.w, rect.h);
  }
  
  // Mood-Farben erst nach preanalyzing benutzen
  export function shouldShowMoodVisuals(appState, mood) {
    return (
      appState !== 'loading' &&
      appState !== 'searching' &&
      appState !== 'preanalyzing' &&
      mood &&
      mood.label &&
      mood.label !== 'unknown'
    );
  }
  
  // Vor der Mood Detection: weiß/grau statt gelb
  export function getInterfaceColor(mood, appState) {
    if (!shouldShowMoodVisuals(appState, mood)) {
      return [230, 230, 230];
    }
  
    return getMoodVisuals(mood).color;
  }
  
  export function drawFacePoints(p, face, videoSize, mood, appState) {
    if (!face || !face.keypoints || !videoSize) return;
  
    const rect = getCoverRect(
      p.width,
      p.height,
      videoSize.width,
      videoSize.height
    );
  
    const [r, g, b] = getInterfaceColor(mood, appState);
  
    p.noStroke();
    p.fill(r, g, b);
  
    for (const point of face.keypoints) {
      const x = rect.x + (point.x / videoSize.width) * rect.w;
      const y = rect.y + (point.y / videoSize.height) * rect.h;
  
      p.circle(x, y, 3);
    }
  }
  
  export function drawStatus(p, text, mood, appState) {
    const [r, g, b] = getInterfaceColor(mood, appState);
  
    p.noStroke();
    p.fill(r, g, b);
    p.textSize(18);
    p.textAlign(p.LEFT, p.BASELINE);
    p.text(text, 24, p.height - 32);
  }
  export function getFaceWindowCutout(p) {
    const faceWindow = document.querySelector('.face-window');
  
    if (!faceWindow || !p.canvas) {
      return {
        cx: p.width / 2,
        cy: p.height / 2,
        rx: p.width * 0.18,
        ry: p.width * 0.18,
      };
    }
  
    const canvasRect = p.canvas.getBoundingClientRect();
    const faceRect = faceWindow.getBoundingClientRect();
  
    const scaleX = p.width / canvasRect.width;
    const scaleY = p.height / canvasRect.height;
  
    const x = (faceRect.left - canvasRect.left) * scaleX;
    const y = (faceRect.top - canvasRect.top) * scaleY;
    const w = faceRect.width * scaleX;
    const h = faceRect.height * scaleY;
  
    return {
      cx: x + w / 2,
      cy: y + h / 2,
      rx: w / 2,
      ry: h / 2,
    };
  }
  
  export function drawAnalysisOverlay(p, progress, mood, appState) {
    const [r, g, b] = getInterfaceColor(mood, appState);
  
    const panel = getPanelUnderFace(p, 300);
  
    const padding = 32;
    const leftX = panel.x + padding;
    const topY = panel.y + 34;
    const rightX = panel.x + panel.w - padding;
  
    p.push();
  
    // Vignette Effect (Dark Corners)
    const vignetteAlpha = 100; // Adjust transparency of the vignette
    const vignetteSize = Math.max(p.width, p.height) * 1.5; // Size of the vignette
  
    p.noStroke();
    p.fill(0, 0, 0, vignetteAlpha);
    p.ellipseMode(p.CENTER);
    p.ellipse(p.width / 2, p.height / 2, vignetteSize, vignetteSize);
  
    // Panel Background
    p.noStroke();
    p.fill(0, 0, 0, 135);
    p.rect(panel.x, panel.y, panel.w, panel.h, 16);
  
    // Panel Border
    p.stroke(r, g, b, 90);
    p.strokeWeight(1);
    p.noFill();
    p.rect(panel.x, panel.y, panel.w, panel.h, 16);
  
    // Text
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(22);
    p.fill(r, g, b);
  
    p.text('ANALYZING FACE...', leftX, topY);
    p.text('DETECTING EMOTIONAL PROFILE...', leftX, topY + 62);
    p.text('CALCULATING POTENTIAL...', leftX, topY + 124);
  
    // Progress Bar
    const progressBarX = leftX;
    const progressBarY = topY + 188;
    const progressBarWidth = rightX - leftX;
    const progressBarHeight = 18;
  
    const safeProgress = p.constrain(progress, 0, 1);
  
    p.noStroke();
    p.fill(255, 255, 255, 35);
    p.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 4);
  
    p.fill(r, g, b);
    p.rect(
      progressBarX,
      progressBarY,
      progressBarWidth * safeProgress,
      progressBarHeight,
      4
    );
  
    p.stroke(r, g, b, 180);
    p.strokeWeight(1);
    p.noFill();
    p.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 4);
  
    p.pop();
}
  export function getMoodVisuals(mood) {
    const label = mood?.label || 'neutral';
  
    const moodMap = {
      happy: {
        label: 'HAPPY',
        color: { r: 255, g: 210, b: 90 },
      },
      neutral: {
        label: 'NEUTRAL',
        color: { r: 255, g: 220, b: 120 },
      },
      sad: {
        label: 'SAD',
        color: { r: 90, g: 150, b: 255 },
      },
      angry: {
        label: 'ANGRY',
        color: { r: 255, g: 90, b: 90 },
      },
      surprised: {
        label: 'SURPRISED',
        color: { r: 120, g: 220, b: 255 },
      },
      fearful: {
        label: 'FEARFUL',
        color: { r: 180, g: 120, b: 255 },
      },
      disgusted: {
        label: 'DISGUSTED',
        color: { r: 140, g: 220, b: 120 },
      },
      unknown: {
        label: 'UNKNOWN',
        color: { r: 180, g: 180, b: 180 },
      },
    };
    return moodMap[label] || moodMap.neutral;}
  
  export function getHappinessScore(mood) {
    if (!mood) return 0;
  
    if (typeof mood.happyScore === 'number') {
      return mood.happyScore;
    }
  
    if (!mood.expressions) return 0;
  
    return Math.round((mood.expressions.happy || 0) * 100);
  }
  
  export function drawMoodTint(p, mood, appState) {
    if (!shouldShowMoodVisuals(appState, mood)) return;
  
    const ctx = p.drawingContext;
  
    const visuals = getMoodVisuals(mood);
    const { r, g, b } = visuals.color;
  
    const cx = p.width / 2;
    const cy = p.height / 2;
  
    // Radius so groß, dass die Ecken erreicht werden
    const maxRadius = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
  
    // Mitte fast transparent
    gradient.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, 0.00)`);
  
    // Zwischenbereich leicht sichtbar
    gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.15)`);
  
    // Außen stärker
    gradient.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, 0.40)`);
  
    // Ecken am stärksten
    gradient.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.80)`);
  
    ctx.save();
  
    // wirkt mehr wie ein Farbfilter statt wie eine platte Fläche
    ctx.globalCompositeOperation = 'screen';
  
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, p.width, p.height);
  
    ctx.restore();
  }

  export function getPanelUnderFace(p, panelH = 300) {
    const cutout = getFaceWindowCutout(p);
  
    const panelW = Math.min(
      p.width * 0.75,
      Math.max(550, cutout.rx * 3)
    );
  
    let panelX = cutout.cx - panelW / 2;
    let panelY = cutout.cy + cutout.ry + 32;
  
    // Damit das Panel nie aus dem Canvas rausläuft
    panelX = p.constrain(panelX, 24, p.width - panelW - 24);
    panelY = p.constrain(panelY, 24, p.height - panelH - 24);
  
    return {
      x: panelX,
      y: panelY,
      w: panelW,
      h: panelH,
    };
  }

  export function drawMoodResultPanel(
    p,
    mood,
    appState,
    face,
    videoSize,
    lockedPerfectFaceScore
  ) {
    if (!shouldShowMoodVisuals(appState, mood)) return;
  
    const visuals = getMoodVisuals(mood);
    const { r, g, b } = visuals.color;
  
    const detectedMood = visuals.label;
    const happinessScore = getHappinessScore(mood);
  
    let perfectFaceValue = null;
  
    if (typeof lockedPerfectFaceScore === 'number') {
      perfectFaceValue = lockedPerfectFaceScore;
    } else if (
      lockedPerfectFaceScore &&
      typeof lockedPerfectFaceScore.total === 'number'
    ) {
      perfectFaceValue = lockedPerfectFaceScore.total;
    }
  
    const panel = getPanelUnderFace(p);
  
    const padding = 28;
    const leftX = panel.x + padding;
    const topY = panel.y + 24;
    const rightX = panel.x + panel.w - padding;
  
    const labelSize = 22;
    const valueSize = 22;
  
    p.push();
  
    // Panel Background
    p.noStroke();
    p.fill(0, 0, 0, 135);
    p.rect(panel.x, panel.y, panel.w, panel.h, 16);
  
    // Rahmen
    p.stroke(r, g, b, 120);
    p.strokeWeight(1);
    p.noFill();
    p.rect(panel.x, panel.y, panel.w, panel.h, 16);
  
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
  
    // PERFECT FACE SCORE
    p.fill(230);
    p.textSize(labelSize);
    p.text('PERFECT FACE SCORE', leftX, topY);
  
    p.fill(r, g, b);
    p.textSize(valueSize);
  
    if (perfectFaceValue !== null) {
      p.text(`${perfectFaceValue}%`, leftX, topY + 28);
    } else {
      p.text('--%', leftX, topY + 28);
    }
  
    // Linie
    p.stroke(r, g, b, 70);
    p.strokeWeight(1);
    p.line(leftX, topY + 64, rightX, topY + 64);
  
    // DETECTED MOOD
    p.noStroke();
    p.fill(230);
    p.textSize(labelSize);
    p.text('DETECTED MOOD', leftX, topY + 87);
  
    p.fill(r, g, b);
    p.textSize(valueSize);
    p.text(detectedMood, leftX, topY + 115);
  
    // HAPPINESS SCORE
    p.fill(230);
    p.textSize(labelSize);
    p.text('HAPPINESS SCORE', leftX, topY + 151);
  
    p.fill(r, g, b);
    p.textSize(valueSize);
    p.text(`${happinessScore}%`, leftX, topY + 179);
  
    // Happiness Bar
    const barX = leftX;
    const barY = topY + 205;
    const barW = panel.w - padding * 2;
    const barH = 8;
    const progress = p.constrain(happinessScore / 100, 0, 1);
  
    p.noStroke();
    p.fill(255, 255, 255, 35);
    p.rect(barX, barY, barW, barH, 4);
  
    p.fill(r, g, b);
    p.rect(barX, barY, barW * progress, barH, 4);
  
    p.pop();
  }