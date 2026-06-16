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
    p.text(text, 24, p.height - 32);
  }
  export function getFaceWindowCutout(p) {
    const faceWindow = document.querySelector('.face-window');
  
    // Fallback, falls das Element nicht gefunden wird
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
  
    p.push();
  
    const marginX = 60;
    const panelWidth = p.width / 3;
    const bottomY = p.height - 210;
  
    p.noStroke();
    p.fill(0, 120);
    p.rect(0, p.height - 280, panelWidth, 280);
  
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(22);
    p.fill(r, g, b);
  
    p.text('ANALYZING FACE...', marginX, bottomY);
    p.text('DETECTING EMOTIONAL PROFILE...', marginX, bottomY + 58);
    p.text('CALCULATING POTENTIAL...', marginX, bottomY + 116);
  
    const progressBarWidth = panelWidth - 2 * marginX;
    const progressBarHeight = 20;
    const progressBarX = marginX;
    const progressBarY = bottomY + 180;
  
    p.noStroke();
    p.fill(r, g, b);
    p.rect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
  
    p.stroke(r, g, b);
    p.noFill();
    p.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
  
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
    if (!mood) return 0;
  
    // Falls du in moodDetection.js happyScore speicherst,
    // wird dieser manipulierte Wert bevorzugt
    if (typeof mood.happyScore === 'number') {
      return mood.happyScore;
    }
  
    if (!mood.expressions) return 0;
  
    return Math.round((mood.expressions.happy || 0) * 100);
  }
  
  export function drawMoodTint(p, mood, appState) {
    // Einfärbung erst nach preanalyzing
    if (!shouldShowMoodVisuals(appState, mood)) return;
  
    const visuals = getMoodVisuals(mood);
    const [r, g, b] = visuals.color;
  
    const cutout = getFaceWindowCutout(p);
  
    p.push();
  
    const ctx = p.drawingContext;
  
    ctx.save();
  
    // Ein Pfad: kompletter Screen + ausgesparter Kreis
    ctx.beginPath();
    ctx.rect(0, 0, p.width, p.height);
  
    ctx.ellipse(
      cutout.cx,
      cutout.cy,
      cutout.rx,
      cutout.ry,
      0,
      0,
      Math.PI * 2
    );
  
    // Mood-Farbe
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.30)`;
  
    // "evenodd" sorgt dafür, dass der Kreis ausgespart wird
    ctx.fill('evenodd');
  
    ctx.restore();
  
    p.pop();
  }
  
  export function drawMoodResultPanel(p, mood, appState) {
    // Panel erst nach preanalyzing anzeigen
    if (!shouldShowMoodVisuals(appState, mood)) return;
  
    const visuals = getMoodVisuals(mood);
    const [r, g, b] = visuals.color;
  
    const detectedMood = visuals.label;
    const happinessScore = getHappinessScore(mood);
  
    const leftX = 28;
    const panelWidth = p.width / 3;
    const blockTop = p.height - 170;
    const labelSize = 22;
    const valueSize = 22;
    const bigValueSize = 22;
  
    p.push();
  
    p.noStroke();
    p.fill(0, 0, 0, 120);
    p.rect(0, p.height - 210, panelWidth, 210);
  
    p.stroke(r, g, b, 70);
    p.strokeWeight(1);
    p.line(leftX, blockTop + 42, panelWidth - leftX, blockTop + 42);
  
    p.noStroke();
    p.fill(230);
    p.textAlign(p.LEFT, p.TOP);
  
    p.textSize(labelSize);
    p.text('DETECTED MOOD', leftX, blockTop);
  
    p.textSize(valueSize);
    p.fill(r, g, b);
    p.text(detectedMood, leftX, blockTop + 20);
  
    p.textSize(labelSize);
    p.fill(230);
    p.text('HAPPINESS SCORE', leftX, blockTop + 58);
  
    p.textSize(bigValueSize);
    p.fill(r, g, b);
    p.text(`${happinessScore}%`, leftX, blockTop + 78);
  
    const barX = leftX;
    const barY = blockTop + 112;
    const barW = panelWidth - leftX * 2;
    const barH = 8;
    const progress = happinessScore / 100;
  
    p.noStroke();
    p.fill(255, 255, 255, 35);
    p.rect(barX, barY, barW, barH, 2);
  
    p.fill(r, g, b);
    p.rect(barX, barY, barW * progress, barH, 2);
  
    p.stroke(r, g, b, 180);
    p.strokeWeight(2);
    p.line(barX, barY - 2, barX + barW * progress, barY - 2);
  
    p.pop();
  }