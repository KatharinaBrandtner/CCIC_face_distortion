import * as faceapi from 'face-api.js';

let moodReady = false;
let moodLoading = false;

let detecting = false;

let lastMood = {
  label: 'neutral',
  score: 0,
  expressions: {},
};

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
        expressions: {},
      };

      detecting = false;
      return lastMood;
    }

    const expressions = detection.expressions;

    const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);

    lastMood = {
      label: sorted[0][0],
      score: sorted[0][1],
      expressions,
    };

    console.log('Mood erkannt:', lastMood);
  } catch (error) {
    console.warn('Mood Detection Fehler:', error);
  }

  detecting = false;
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
    expressions: {},
  };

  detecting = false;
}