import * as faceapi from 'face-api.js';

let moodReady = false;
let moodLoading = false;
let detecting = false;

// Mood, die konzeptuell nicht als finale Emotion akzeptiert werden
const IGNORED_MOODS = ['happy'];

let lastMood = {
  label: 'neutral',
  score: 0,

  originalLabel: 'neutral',
  originalScore: 0,

  ignoredHappy: false,

  expressions: {},
  realExpressions: {},

  happyScore: 0,
  realHappyScore: 0,
  happyWasDistorted: false,
};

function distortHighHappiness(value) {
  
    if (value > 0.85) {
      // Hohe Happiness wird zufällig auf verschiedene Bereiche reduziert
      const randomFactor = Math.random();
  
      if (randomFactor < 0.33) {
        return 0.35 + Math.random() * 0.10;
      } else if (randomFactor < 0.66) {
        return 0.4 + Math.random() * 0.10;
      } else {
        return 0.45 + Math.random() * 0.10;
      }
    }
  
    return value;
  }

function normalizeExpressions(realExpressions) {
  const realHappy = realExpressions.happy || 0;
  const distortedHappy = distortHighHappiness(realHappy);

  return {
    neutral: realExpressions.neutral || 0,
    happy: distortedHappy,
    sad: realExpressions.sad || 0,
    angry: realExpressions.angry || 0,
    fearful: realExpressions.fearful || 0,
    disgusted: realExpressions.disgusted || 0,
    surprised: realExpressions.surprised || 0,
  };
}

export async function setupMoodDetection() {
  if (moodReady || moodLoading) return;

  moodLoading = true;

  const MODEL_URL = '/models/face-api';

  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

    moodReady = true;
    console.log('face-api Mood Detection läuft');
  } catch (error) {
    console.error('face-api Modelle konnten nicht geladen werden:', error);
  }

  moodLoading = false;
}

export async function detectMoodOnce(video) {
  if (!moodReady) {
    console.warn('Mood Detection ist noch nicht bereit');
    return lastMood;
  }

  if (detecting) {
    return lastMood;
  }

  const videoEl = video?.elt || video;

  if (!videoEl || !(videoEl instanceof HTMLVideoElement)) {
    console.warn('Kein gültiges Video-Element für Mood Detection:', videoEl);
    return lastMood;
  }

  if (videoEl.readyState < 2) {
    console.warn('Video ist noch nicht bereit für Mood Detection');
    return lastMood;
  }

  detecting = true;

  try {
    const detection = await faceapi
      .detectSingleFace(
        videoEl,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        })
      )
      .withFaceExpressions();

    if (!detection || !detection.expressions) {
      console.warn('Keine Emotion erkannt');

      lastMood = {
        label: 'unknown',
        score: 0,

        originalLabel: 'unknown',
        originalScore: 0,

        ignoredHappy: false,

        expressions: {},
        realExpressions: {},

        happyScore: 0,
        realHappyScore: 0,
        happyWasDistorted: false,
      };

      return lastMood;
    }

    const realExpressions = detection.expressions;

    // echte Sortierung, bevor irgendwas manipuliert wird
    const realSorted = Object.entries(realExpressions).sort((a, b) => b[1] - a[1]);

    const originalLabel = realSorted[0][0];
    const originalScore = realSorted[0][1];

    // manipulierte Expressions fürs UI
    const expressions = normalizeExpressions(realExpressions);

    // Sortierung mit manipuliertem happy-Wert
    const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);

    // happy wird als finale Emotion ignoriert
    const filteredMood = sorted.find(([label]) => !IGNORED_MOODS.includes(label));

    const finalLabel = filteredMood ? filteredMood[0] : 'neutral';
    const finalScore = filteredMood ? filteredMood[1] : 0;

    const realHappy = realExpressions.happy || 0;
    const distortedHappy = expressions.happy || 0;

    lastMood = {
      label: finalLabel,
      score: finalScore,

      // echte stärkste Emotion
      originalLabel,
      originalScore,

      // true, wenn eigentlich happy erkannt wurde
      ignoredHappy: originalLabel === 'happy',

      // manipulierte Werte
      expressions,

      // echte Werte zur Kontrolle
      realExpressions,

      // Prozentwerte für dein UI
      happyScore: Math.round(distortedHappy * 100),
      realHappyScore: Math.round(realHappy * 100),

      // true, wenn happy verändert wurde
      happyWasDistorted: distortedHappy !== realHappy,
    };

    console.log('Mood erkannt:', lastMood);
  } catch (error) {
    console.warn('Mood Detection Fehler:', error);
  } finally {
    detecting = false;
  }

  return lastMood;
}

export function getMood() {
  return lastMood;
}

export function isMoodDetectionReady() {
  return moodReady;
}

export function isMoodDetecting() {
  return detecting;
}

export function resetMoodDetection() {
  lastMood = {
    label: 'neutral',
    score: 0,

    originalLabel: 'neutral',
    originalScore: 0,

    ignoredHappy: false,

    expressions: {},
    realExpressions: {},

    happyScore: 0,
    realHappyScore: 0,
    happyWasDistorted: false,
  };

  detecting = false;
}