import './style.css';
import p5 from 'p5';

import {
    setupFaceTracking,
    getVideo,
    getFaces,
    getVideoSize,
    isFaceTrackingReady,
    hasFace,
} from './faceTracking.js';

import {
    setupMoodDetection,
    detectMoodOnce,
    isMoodDetectionReady,
    resetMoodDetection,
} from './moodDetection.js';

import {
    drawCamera,
    drawFacePoints,
    // drawStatus,
    drawMoodTint,
    drawMoodResultPanel,
    getMoodColor,
    updateStarColor,
    triggerStarBurst,
    drawSearchingOverlay,
    drawScannerCorners,
} from './drawing.js';
import {
    drawDefaultMesh
} from './default_facemesh_fake.js';
import {
    drawStar,
    drawSparkle,
    lerpColorObject,
    drawManipulationSparkles,
    drawOptimizationUI,
    getManipulationTintColor
} from './pages/manipulating.js';
import {
    runManipulation
} from './pages/manupulated.js';

import {
    calculatePerfectFaceScore
} from './faceScore.js';

document.querySelector('#app').innerHTML = `
  <section class="screen">
    <div id="p5-container"></div>

    <div class="dark-overlay"></div>

    <header class="brand-ui">

  <div id="brand-star" class="brand-star"></div>

  <div class="brand-title">
    <span>PERFECT</span>
    <span>YOU</span>
  </div>

  <div
    id="status-message"
    class="status-message"
  ></div>

  <div
    id="top-right-message"
    class="top-right-message"
  ></div>

</header>

<div
  id="searching-prompt"
  class="searching-prompt"
>
  HOW PERFECT <br> ARE YOU?
</div>
<img
  id="searching-star"
  class="searching-star"
  src="/searching_star.png"
  alt=""
>

<div
  id="ui-panel"
  class="ui-panel"
>
  <div id="panel-content"></div>
</div>

<div
  id="manipulated-message"
  class="manipulated-message"
>
  THAT'S THE BEST VERSION OF YOURSELF
</div>

    <div class="face-window"></div>
  </section>
`;


let defaultMeshImg;

let appState = 'loading';
// loading | searching | preAnalyzing | analyzing | analyzed| manipulating| manipulated 

let lockedMood = null;
let moodAnalyzed = false;

let previousStarState = null;

let lockedPerfectFaceScore = null;
let perfectFaceAnalyzed = false;

let faceDetectedTime = null;
const FACE_DETECTION_DELAY = 2500;
// const FACE_DETECTION_DELAY = 2500;

let analysisStartTime = 0;
const ANALYSIS_DURATION = 3500;
// const ANALYSIS_DURATION = 3500;

// bevor manipulating einsetzt
let analyzedStartTime = 0;
const RESULT_DISPLAY_DURATION = 6000;
// const RESULT_DISPLAY_DURATION = 6000;

let manipulationStartTime = 0;
const MANIPULATION_DURATION = 4000;
// const MANIPULATION_DURATION = 4000;


let manipulatedStartTime = 0;



function updateBrandingUI(
    appState,
    p,
    analyzedStartTime,
    manipulationStartTime,
    manipulatedStartTime,
    lockedMood
) {
    const statusEl =
        document.querySelector(
            '#status-message'
        );

    const topRightEl =
        document.querySelector(
            '#top-right-message'
        );

    const manipulatedMessage =
        document.querySelector(
            '#manipulated-message'
        );

    const searchingPrompt =
        document.querySelector(
            '#searching-prompt'
        );

    const searchingStar =
        document.getElementById(
            'searching-star'
        );

    statusEl.style.textShadow = 'none';
    statusEl.style.color = 'white';

    if (!statusEl) return;

    statusEl.textContent = '';
    topRightEl.textContent = '';

    statusEl.style.textShadow = 'none';

    if (manipulatedMessage) {
        manipulatedMessage.style.textShadow =
            '0 0 24px rgba(255,255,255,.08)';
    }

    if (appState === 'searching') {
        statusEl.textContent = '';
    }
    if (searchingPrompt) {
        searchingPrompt.style.opacity =
            appState === 'searching' ?
            '1' :
            '0';


    }

    if (searchingStar) {

        searchingStar.style.opacity =
            appState === 'searching' ?
            '.95' :
            '0';
    }

    if (appState === 'preAnalyzing') {
        statusEl.textContent =
            'ANALYZING. PLEASE HOLD STILL.';
    }

    if (appState === 'analyzing') {
        statusEl.textContent =
            'ANALYZING. PLEASE HOLD STILL.';
    }

    if (appState === 'analyzed' && lockedMood) {

        const elapsed =
            p.millis() - analyzedStartTime;

        const seconds =
            Math.max(
                0,
                Math.ceil(
                    (RESULT_DISPLAY_DURATION - elapsed) /
                    1000
                )
            );

        statusEl.textContent =
            `YOU COULD BE HAPPIER... ${seconds}s`;

        const {
            r,
            g,
            b
        } = getMoodColor(
            lockedMood
        );

        statusEl.style.textShadow = `
    0 0 10px rgba(${r},${g},${b},1),
    0 0 24px rgba(${r},${g},${b},0.9),
    0 0 50px rgba(${r},${g},${b},0.8),
    0 0 100px rgba(${r},${g},${b},0.45),
    0 0 180px rgba(${r},${g},${b},0.25)
`;
        statusEl.style.color = `
rgb(
  ${Math.round(255 * 0.88 + r * 0.12)},
  ${Math.round(255 * 0.88 + g * 0.12)},
  ${Math.round(255 * 0.88 + b * 0.12)}
)
`;
    }

    if (appState === 'manipulating') {

        const elapsed =
            p.millis() - manipulationStartTime;

        const progress =
            Math.floor(
                p.constrain(
                    elapsed /
                    MANIPULATION_DURATION,
                    0,
                    1
                ) * 100
            );

        statusEl.textContent =
            `${progress}% OPTIMIZATION`;
    }

    if (appState === 'manipulated') {

        statusEl.textContent =
            'OPTIMIZATION COMPLETE.';

        if (manipulatedMessage) {

            manipulatedMessage.style.textShadow = `
    0 0 10px rgba(0,228,49,0.8),
    0 0 24px rgba(0,228,49,0.7),
    0 0 50px rgba(0,228,49,0.86),
    0 0 100px rgba(0,228,49,0.3),
    0 0 180px rgba(0,228,49,0.1)
`;
            manipulatedMessage.style.color = `
rgb(
  ${Math.round(255 * 0.88 + 0 * 0.12)},
  ${Math.round(255 * 0.88 + 228 * 0.12)},
  ${Math.round(255 * 0.88 + 49 * 0.12)}
)
`;
        }

        const elapsed =
            p.millis() -
            manipulatedStartTime;

        const seconds =
            Math.max(
                0,
                30 -
                Math.floor(
                    elapsed / 1000
                )
            );

        topRightEl.textContent =
            `NEW ANALYZING IN ${seconds}s`;
    }
    if (manipulatedMessage) {

        manipulatedMessage.classList.toggle(
            'visible',
            appState === 'manipulated'
        );
    }
}


function drawMirroredCameraLayer(p, drawFunction) {
    p.push();
    p.translate(p.width, 0);
    p.scale(-1, 1);

    drawFunction();

    p.pop();
}



function updatePanelUI({
    appState,
    progress = 0,
    perfectFaceScore = 0,
    happinessScore = 0,
    moodLabel = '',
    color = {
        r: 255,
        g: 255,
        b: 255
    }
}) {


    const panel =
        document.querySelector('#ui-panel');

    const content =
        document.querySelector('#panel-content');



    if (!panel || !content) return;

    panel.style.setProperty(
        '--accent',
        `rgb(${color.r}, ${color.g}, ${color.b})`
    );

    if (appState === 'searching') {
        panel.classList.remove('visible');
        return;
    }

    panel.classList.add('visible');

    if (
        appState === 'preAnalyzing' ||
        appState === 'analyzing'
    ) {

        content.innerHTML = `
      <div class="panel-row">
        ANALYZING FACE...
      </div>

      <div class="panel-row">
        DETECTING EMOTIONAL PROFILE...
      </div>

      <div class="panel-row">
        CALCULATING POTENTIAL...
      </div>

      <div class="progress-track">
        <div
          class="progress-fill"
          style="
            width:${progress * 100}%;
          "
        ></div>
      </div>
    `;

        return;
    }

    content.innerHTML = `
    <div class="panel-label">
      PERFECT FACE SCORE
    </div>

    <div class="panel-value">
      ${perfectFaceScore}%
    </div>

    <div class="panel-divider"></div>

    <div class="panel-label">
      DETECTED MOOD
    </div>

    <div class="panel-value">
      ${moodLabel}
    </div>

    <div class="panel-label">
      HAPPINESS SCORE
    </div>

    <div class="panel-value">
      ${happinessScore}%
    </div>

    <div class="progress-track">
      <div
        class="progress-fill"
        style="
          width:${happinessScore}%;
        "
      ></div>
    </div>
  `;
}


const sketch = (p) => {

    p.setup = async () => {

        defaultMeshImg =
            await p.loadImage(
                '/default_mesh.png'
            );

        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent('p5-container');

        p.pixelDensity(1);

        appState = 'loading';

        await setupFaceTracking();
        await setupMoodDetection();

        appState = 'searching';
    };






    function getFacePointAlpha(p) {

        if (appState === 'preAnalyzing') {
            return 255;
        }

        if (appState === 'analyzed') {

            const elapsed =
                p.millis() - analyzedStartTime;

            const t = p.constrain(
                elapsed / RESULT_DISPLAY_DURATION,
                0,
                1
            );

            return p.lerp(255, 128, t);
        }

        if (appState === 'manipulating') {

            const elapsed =
                p.millis() - manipulationStartTime;

            const t = p.constrain(
                elapsed / MANIPULATION_DURATION,
                0,
                1
            );

            return p.lerp(128, 255, t);
        }

        if (appState === 'manipulated') {

            const elapsed =
                p.millis() - manipulatedStartTime;

            const t = p.constrain(
                elapsed / 1000,
                0,
                1
            );

            return p.lerp(255, 0, t);
        }

        if (
            appState === 'searching' &&
            faceDetectedTime
        ) {

            const elapsed =
                p.millis() -
                faceDetectedTime;

            const transitionProgress =
                p.constrain(
                    elapsed / 1000,
                    0,
                    1
                );

            return p.lerp(
                0,
                255,
                transitionProgress
            );
        }

        return 255;
    }



    p.draw = () => {
        p.clear();
        p.background(0);

        updateBrandingUI(
            appState,
            p,
            analyzedStartTime,
            manipulationStartTime,
            manipulatedStartTime,
            lockedMood
        );

        if (
            previousStarState !== appState
        ) {
            triggerStarBurst();

            previousStarState =
                appState;
        }



        const video = getVideo();
        const videoSize = getVideoSize();

        if (appState === 'loading') {
            // drawStatus(p, 'System lädt...');
            return;
        }

        if (!video || video.readyState < 2) {
            // drawStatus(p, 'Kamera lädt...');
            return;
        }

        const faceDetected = isFaceTrackingReady() && hasFace();
        const faces = faceDetected ? getFaces() : [];
        const face = faces[0];

        // Kamera + Facepoints gemeinsam spiegeln
        drawMirroredCameraLayer(p, () => {
            drawCamera(p, video, videoSize);

            const facePointAlpha =
                getFacePointAlpha(p);



            if (
                face &&
                facePointAlpha > 0 &&
                appState !== 'loading'
            ) {
                drawFacePoints(
                    p,
                    face,
                    videoSize,
                    facePointAlpha
                );
            }
        });

        if (!faceDetected && appState === 'searching') {
            faceDetectedTime = null;

            drawSearchingOverlay(p, 0);

            if (defaultMeshImg) {

                drawDefaultMesh(
                    p,
                    defaultMeshImg,
                    1
                );

            }
            drawScannerCorners(p);

            // drawStatus(p, 'Kein Gesicht erkannt');
            return;
        }

        // Schritt 1: Gesicht erkannt → kurze Wartezeit

        if (appState === 'searching') {



            if (!faceDetected) {
                faceDetectedTime = null;
                return;
            }

            if (!faceDetectedTime) {
                faceDetectedTime = p.millis();
            }

            const elapsedSinceDetection =
                p.millis() - faceDetectedTime;

            const detectionProgress =
                p.constrain(
                    elapsedSinceDetection /
                    FACE_DETECTION_DELAY,
                    0,
                    1
                );

            const transitionProgress =
                p.constrain(
                    detectionProgress / 0.35,
                    0,
                    1
                );

            if (
                elapsedSinceDetection >=
                FACE_DETECTION_DELAY
            ) {
                appState = 'preAnalyzing';
                analysisStartTime = p.millis();
            }

            updateStarColor(
                appState
            );

            drawSearchingOverlay(p, detectionProgress);
            if (defaultMeshImg) {

                drawDefaultMesh(
                    p,
                    defaultMeshImg,
                    1 - transitionProgress
                );

            }
            drawScannerCorners(p);

            return;
        }

        // Schritt 2: Fake Analyse / Ladebalken
        if (appState === 'preAnalyzing') {
            const elapsed = p.millis() - analysisStartTime;
            const progress = p.constrain(elapsed / ANALYSIS_DURATION, 0, 1);
            drawMoodTint(
                p, {
                    label: 'preanalyzing'
                },
                appState
            );

            updatePanelUI({
                appState,
                progress,
                color: {
                    r: 230,
                    g: 230,
                    b: 230
                }
            });



            if (progress >= 1 && !moodAnalyzed && isMoodDetectionReady()) {
                appState = 'analyzing';
                moodAnalyzed = true;

                detectMoodOnce(video).then((mood) => {
                    lockedMood = mood;
                    appState = 'analyzed';

                    analyzedStartTime = p.millis();

                    console.log('Mood locked:', lockedMood);
                });

                updateStarColor(
                    appState
                );

            }

            return;
        }

        // Schritt 3: echte Mood-Analyse läuft
        if (appState === 'analyzing') {

            // drawStatus(p, 'Emotional profile wird berechnet...');

            updatePanelUI({
                appState,
                progress: 1,
                color: {
                    r: 230,
                    g: 230,
                    b: 230
                }
            });

            updateStarColor(
                appState
            );



            return;
        }

        // Schritt 4: Ergebnis anzeigen
        if (appState === 'analyzed' && lockedMood) {
            if (face && !perfectFaceAnalyzed) {
                lockedPerfectFaceScore = calculatePerfectFaceScore(face, videoSize);
                perfectFaceAnalyzed = true;

                console.log('Locked Perfect Face Score:', lockedPerfectFaceScore);
            }

            drawMoodTint(p, lockedMood, appState);

            const moodColor =
                getMoodColor(lockedMood);

            updatePanelUI({
                appState,
                perfectFaceScore: lockedPerfectFaceScore.total,
                happinessScore: lockedMood.happyScore || 0,
                moodLabel: lockedMood.label.toUpperCase(),
                color: moodColor
            });

            updateStarColor(
                appState,
                lockedMood
            );

            const elapsed = p.millis() - analyzedStartTime;

            if (elapsed >= RESULT_DISPLAY_DURATION) {
                appState = 'manipulating';
                manipulationStartTime = p.millis();
                console.log('APP STATE ANALYZED RUNS');
            }

            return;
        }


        // Schritt 5: Manipulation
        if (appState === 'manipulating') {

            const elapsed = p.millis() - manipulationStartTime;

            const optimizationProgress = p.constrain(
                elapsed / MANIPULATION_DURATION,
                0,
                1
            );
            const currentTintColor =
                getManipulationTintColor(
                    p,
                    lockedMood,
                    optimizationProgress
                );

            const faceProgress =
                p.constrain(
                    (optimizationProgress - 0.3) / 0.7,
                    0,
                    1
                );
            if (faceProgress > 0) {
                runManipulation(
                    p,
                    face,
                    videoSize,
                    faceProgress
                );
            }

            drawMoodTint(
                p,
                lockedMood,
                appState,
                currentTintColor
            );


            const displayedPerfectFace =
                Math.round(
                    p.lerp(
                        lockedPerfectFaceScore.total,
                        100,
                        optimizationProgress
                    )
                );

            const displayedHappy =
                Math.round(
                    p.lerp(
                        lockedMood.happyScore || 0,
                        100,
                        optimizationProgress
                    )
                );

            updatePanelUI({
                appState,

                perfectFaceScore: displayedPerfectFace,

                happinessScore: displayedHappy,

                moodLabel: optimizationProgress < 0.5 ?
                    lockedMood.label.toUpperCase() : 'HAPPY',

                color: currentTintColor
            });


            drawManipulationSparkles(p, currentTintColor);

            updateStarColor(
                appState,
                lockedMood,
                currentTintColor
            );



            if (elapsed >= MANIPULATION_DURATION) {
                appState = 'manipulated';
                manipulatedStartTime = p.millis();

                console.log('APP STATE MANIPULATING RUNS');
            }

            return;
        }

        // Schritt 6: Manipulated
        if (appState === 'manipulated') {

            runManipulation(
                p,
                face,
                videoSize
            );

            drawMoodTint(p, {
                label: 'manipulated'
            }, appState);


            updatePanelUI({
                appState,
                perfectFaceScore: 100,
                happinessScore: 100,
                moodLabel: 'HAPPY',
                color: {
                    r: 0,
                    g: 228,
                    b: 49
                }
            });
            updateStarColor(
                appState
            );

            console.log('APP STATE MANIPULATED RUNS');
            return;

        }

    };

    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
};

new p5(sketch);