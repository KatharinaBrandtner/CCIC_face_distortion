export function getCoverRect(canvasW, canvasH, videoW, videoH) {
    const scale = Math.max(canvasW / videoW, canvasH / videoH);

    const w = videoW * scale;
    const h = videoH * scale;

    const x = (canvasW - w) / 2;
    const y = (canvasH - h) / 2;

    return {
        x,
        y,
        w,
        h
    };
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

export function drawFacePoints(
    p,
    face,
    videoSize,
    alpha = 255
) {
    if (!face || !face.keypoints || !videoSize) return;

    const rect = getCoverRect(
        p.width,
        p.height,
        videoSize.width,
        videoSize.height
    );

    p.noStroke();
    p.fill(255, alpha);

    for (const point of face.keypoints) {
        const x =
            rect.x +
            (point.x / videoSize.width) *
            rect.w;

        const y =
            rect.y +
            (point.y / videoSize.height) *
            rect.h;

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


export function getMoodVisuals(mood) {
    const label = (mood?.label || 'neutral').toLowerCase();

    const moodMap = {
        happy: {
            label: 'HAPPY',
            color: {
                r: 255,
                g: 210,
                b: 90
            },
        },
        neutral: {
            label: 'NEUTRAL',
            color: {
                r: 104,
                g: 93,
                b: 255
            },
        },
        sad: {
            label: 'SAD',
            color: {
                r: 90,
                g: 140,
                b: 255
            },
        },
        angry: {
            label: 'ANGRY',
            color: {
                r: 255,
                g: 70,
                b: 70
            },
        },
        surprised: {
            label: 'SURPRISED',
            color: {
                r: 120,
                g: 220,
                b: 255
            },
        },
        fearful: {
            label: 'FEARFUL',
            color: {
                r: 180,
                g: 120,
                b: 255
            },
        },
        disgusted: {
            label: 'DISGUSTED',
            color: {
                r: 120,
                g: 170,
                b: 90
            },
        },
        unknown: {
            label: 'UNKNOWN',
            color: {
                r: 180,
                g: 180,
                b: 180
            },
        },

        gradienthappy: {
            label: 'HAPPY',
            color: {
                r: 131,
                g: 219,
                b: 70
            },
        },
        gradientneutral: {
            label: 'NEUTRAL',
            color: {
                r: 38,
                g: 178,
                b: 125
            },
        },

        gradientsad: {
            label: 'SAD',
            color: {
                r: 49,
                g: 180,
                b: 161
            },
        },

        gradientangry: {
            label: 'ANGRY',
            color: {
                r: 96,
                g: 170,
                b: 58
            },
        },

        gradientsurprised: {
            label: 'SURPRISED',
            color: {
                r: 66,
                g: 224,
                b: 163
            },
        },

        gradientfearful: {
            label: 'FEARFUL',
            color: {
                r: 89,
                g: 175,
                b: 150
            },
        },

        gradientdisgusted: {
            label: 'DISGUSTED',
            color: {
                r: 67,
                g: 196,
                b: 72
            },
        },

        gradientunknown: {
            label: 'UNKNOWN',
            color: {
                r: 110,
                g: 198,
                b: 129
            },
        },

        preanalyzing: {
            label: 'PREANALYZING',
            color: {
                r: 28,
                g: 28,
                b: 28
            },
        },

        manipulated: {
            label: 'MANIPULATED',
            color: {
                r: 0,
                g: 228,
                b: 49
            },
        },

    };

    return moodMap[label] || moodMap.neutral;
}


export function drawMoodTint(
    p,
    mood,
    appState,
    overrideColor = null
) {

    if (!shouldShowMoodVisuals(appState, mood)) return;

    const ctx = p.drawingContext;

    const visuals = getMoodVisuals(mood);

    const {
        r,
        g,
        b
    } = overrideColor || visuals.color;

    const label =
        (mood?.label || '').toLowerCase();

    const cx = p.width / 2;
    const cy = p.height / 2;

    const maxRadius = Math.sqrt(
        cx * cx + cy * cy
    );

    const gradient =
        ctx.createRadialGradient(
            cx,
            cy,
            0,
            cx,
            cy,
            maxRadius
        );

    // PRE ANALYZING = dunkle Vignette
    if (label === 'preanalyzing') {

        gradient.addColorStop(
            0.0,
            'rgba(0,0,0,0)'
        );

        gradient.addColorStop(
            0.5,
            'rgba(0,0,0,0.10)'
        );

        gradient.addColorStop(
            0.75,
            'rgba(0,0,0,0.35)'
        );

        gradient.addColorStop(
            1.0,
            'rgba(0,0,0,0.80)'
        );

    } else {

        // Normale Mood-Tints

        gradient.addColorStop(
            0.0,
            `rgba(${r}, ${g}, ${b}, 0.00)`
        );

        gradient.addColorStop(
            0.45,
            `rgba(${r}, ${g}, ${b}, 0.15)`
        );

        gradient.addColorStop(
            0.75,
            `rgba(${r}, ${g}, ${b}, 0.40)`
        );

        gradient.addColorStop(
            1.0,
            `rgba(${r}, ${g}, ${b}, 0.80)`
        );
    }

    ctx.save();

    if (label === 'preanalyzing') {
        ctx.globalCompositeOperation = 'source-over';
    } else {
        ctx.globalCompositeOperation = 'screen';
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(
        0,
        0,
        p.width,
        p.height
    );

    ctx.restore();
}

export function drawSearchingOverlay(p, detectionProgress = 0) {

    const ctx = p.drawingContext;

    const cx = p.width / 2;
    const cy = p.height * 0.50;

    const maxRadius = Math.sqrt(
        cx * cx + cy * cy
    );

    const innerRadius =
        p.lerp(
            p.width * 0.017,
            0,
            detectionProgress
        );

    const outerRadius =
        p.lerp(
            p.width * 0.50,
            maxRadius,
            detectionProgress
        );

    const gradient =
        ctx.createRadialGradient(
            cx,
            cy,
            innerRadius,
            cx,
            cy,
            outerRadius
        );

    const stop0 =
        p.lerp(
            0.55,
            0.0,
            detectionProgress
        );
    const stop25 =
        p.lerp(
            0.65,
            0.20,
            detectionProgress
        );
    const stop50 =
        p.lerp(
            0.82,
            0.10,
            detectionProgress
        );
    const stop75 =
        p.lerp(
            0.92,
            0.35,
            detectionProgress
        );
    const stop100 =
        p.lerp(
            0.98,
            0.80,
            detectionProgress
        );


    gradient.addColorStop(
        0,
        `rgba(0,0,0,${stop0})`
    );

    gradient.addColorStop(
        0.25,
        `rgba(0,0,0,${stop25})`
    );

    gradient.addColorStop(
        0.50,
        `rgba(0,0,0,${stop50})`
    );

    gradient.addColorStop(
        0.75,
        `rgba(0,0,0,${stop75})`
    );

    gradient.addColorStop(
        1,
        `rgba(0,0,0,${stop100})`
    );
    ctx.save();

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        p.width,
        p.height
    );

    ctx.restore();
}

export function drawFakeFaceMesh(p) {

    const cx = p.width / 2;
    const cy = p.height * 0.45;

    const scale =
        Math.min(
            p.width,
            p.height
        ) * 0.34;

    const pulse =
        1 +
        Math.sin(
            p.millis() * 0.001
        ) * 0.015;

    p.push();

    p.translate(
        cx,
        cy
    );

    p.scale(pulse);

    p.stroke(
        255,
        255,
        255,
        30
    );

    p.strokeWeight(1);

    p.noFill();

    p.ellipse(
        0,
        0,
        scale * 0.8,
        scale
    );

    p.ellipse(
        -scale * 0.15,
        -scale * 0.10,
        scale * 0.15,
        scale * 0.10
    );

    p.ellipse(
        scale * 0.15,
        -scale * 0.10,
        scale * 0.15,
        scale * 0.10
    );

    p.line(
        0,
        -scale * 0.05,
        0,
        scale * 0.15
    );

    p.line(
        -scale * 0.12,
        scale * 0.25,
        scale * 0.12,
        scale * 0.25
    );

    for (
        let i = 0; i < 120; i++
    ) {

        const angle =
            p.TWO_PI * i / 120;

        const rx =
            Math.cos(angle) *
            scale *
            0.4;

        const ry =
            Math.sin(angle) *
            scale *
            0.5;

        p.noStroke();

        p.fill(
            255,
            255,
            255,
            35
        );

        p.circle(
            rx,
            ry,
            2
        );
    }

    p.pop();
}

export function drawScannerCorners(p) {

    const size = 700;

    const cx = p.width / 2;
    const cy = p.height * 0.45;

    const x =
        cx - size / 2;

    const y =
        cy - size / 2;

    const l = 28;

    p.push();

    p.strokeWeight(4);

    p.stroke(
        255,
        255,
        255,
        220
    );

    p.line(x, y, x + l, y);
    p.line(x, y, x, y + l);



    p.line(
        x,
        y + size,
        x + l,
        y + size
    );

    p.line(
        x,
        y + size,
        x,
        y + size - l
    );



    p.line(
        x + size,
        y,
        x + size - l,
        y
    );

    p.line(
        x + size,
        y,
        x + size,
        y + l
    );

    p.line(
        x + size,
        y + size,
        x + size - l,
        y + size
    );

    p.line(
        x + size,
        y + size,
        x + size,
        y + size - l
    );

    p.pop();
}

export function getHappinessScore(mood) {
    if (!mood) return 0;

    if (typeof mood.happyScore === 'number') {
        return mood.happyScore;
    }

    if (!mood.expressions) return 0;

    return Math.round((mood.expressions.happy || 0) * 100);
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
    perfectFaceScore,
    overrideColor = null
) {
    if (!shouldShowMoodVisuals(appState, mood)) return;

    const visuals = getMoodVisuals(mood);

    const {
        r,
        g,
        b
    } = overrideColor || visuals.color;

    const detectedMood = visuals.label;
    const happinessScore = getHappinessScore(mood);

    let perfectFaceValue = null;

    if (typeof perfectFaceScore === 'number') {
        perfectFaceValue = perfectFaceScore;
    } else if (
        perfectFaceScore &&
        typeof perfectFaceScore.total === 'number'
    ) {
        perfectFaceValue = perfectFaceScore.total;
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


export function getMoodColor(mood) {
    return getMoodVisuals(mood).color;
}


export function updateStarColor(
    appState,
    lockedMood,
    currentTintColor
) {

    const star =
        document.querySelector(
            '#brand-star'
        );

    if (!star) return;

    let color = {
        r: 0,
        g: 228,
        b: 49
    };

    if (
        appState === 'analyzed' &&
        lockedMood
    ) {
        color =
            getMoodColor(
                lockedMood
            );
    }

    if (
        appState === 'manipulating' &&
        currentTintColor
    ) {
        color =
            currentTintColor;
    }

    star.style.background =
        `rgb(
      ${Math.round(color.r)},
      ${Math.round(color.g)},
      ${Math.round(color.b)}
    )`;

    star.style.filter =
        `
    drop-shadow(
      0 0 8px
      rgba(
        ${color.r},
        ${color.g},
        ${color.b},
        .9
      )
    )
    drop-shadow(
      0 0 20px
      rgba(
        ${color.r},
        ${color.g},
        ${color.b},
        .7
      )
    )
  `;
}

export function triggerStarBurst() {

    const star =
        document.querySelector(
            '#brand-star'
        );

    if (!star) return;

    star.classList.remove(
        'glow-burst'
    );

    void star.offsetWidth;

    star.classList.add(
        'glow-burst'
    );
}