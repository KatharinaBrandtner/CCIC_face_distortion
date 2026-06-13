//hier wird ml5 geladen und das gesicht getrackt

const ml5Module = await import('ml5');
const ml5 = ml5Module.default || ml5Module;

// WebGPU umgehen, falls ml5 diese Funktion anbietet
if (typeof ml5.setBackend === 'function') {
  await ml5.setBackend('webgl');
}

let video;
let faceMesh;
let faces = [];

let videoW = 640;
let videoH = 480;

let videoReady = false;
let modelReady = false;
let detectionStarted = false;

const options = {
  maxFaces: 1,
  refineLandmarks: false,
  flipHorizontal: false,
};

export async function setupFaceTracking(p) {
  console.log('Starte Webcam...');

  video = p.createCapture({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user',
    },
    audio: false,
  });

  video.hide();

  const videoElement = video.elt;
  videoElement.muted = true;
  videoElement.playsInline = true;

  await waitForVideo(videoElement);

  videoW = videoElement.videoWidth || 640;
  videoH = videoElement.videoHeight || 480;
  videoReady = true;

  console.log('Video bereit:', videoW, videoH);
  console.log('Lade FaceMesh...');

  faceMesh = await loadFaceMesh(options);
  modelReady = true;
  
  faceMesh.detectStart(video, gotFaces);
  detectionStarted = true;
  
  console.log('FaceMesh läuft');
}

async function loadFaceMesh(faceMeshOptions) {
    const maybeModel = ml5.faceMesh(faceMeshOptions);
  
    const model =
      maybeModel && typeof maybeModel.then === 'function'
        ? await maybeModel
        : maybeModel;
  
    if (model.ready && typeof model.ready.then === 'function') {
      await model.ready;
    }
  
    await waitUntil(() => model.model !== null, 10000);
  
    return model;
  }
  
  function waitUntil(condition, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
  
      const check = () => {
        if (condition()) {
          resolve();
          return;
        }
  
        if (performance.now() - start > timeoutMs) {
          reject(new Error('FaceMesh-Modell wurde nicht rechtzeitig geladen.'));
          return;
        }
  
        requestAnimationFrame(check);
      };
  
      check();
    });
  }

function gotFaces(results) {
  faces = Array.isArray(results) ? results : [];
}

function waitForVideo(videoEl) {
  return new Promise((resolve) => {
    const check = () => {
      if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };

    check();
  });
}

export function getVideo() {
  return video;
}

export function getFaces() {
  return faces;
}

export function getVideoSize() {
  return {
    width: videoW,
    height: videoH,
  };
}

export function isFaceTrackingReady() {
  return videoReady && modelReady && detectionStarted;
}

export function hasFace() {
  return faces.length > 0;
}