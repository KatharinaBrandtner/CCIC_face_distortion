let camera;
let videoElement;
let faceMesh;

let faces = [];

let videoWidth = 1280;
let videoHeight = 720;

let cameraReady = false;
let modelReady = false;
let firstResultReceived = false;

// Größe deines sichtbaren p5-Hochkant-Canvas
let canvasWidth = 0;
let canvasHeight = 0;

export async function setupFaceTracking(width, height) {
  if (!window.FaceMesh || !window.Camera) {
    throw new Error(
      'MediaPipe wurde nicht geladen. Prüfe die Script-Tags in index.html.'
    );
  }

  // Größe des sichtbaren Hochkant-Bereichs speichern
  canvasWidth = width;
  canvasHeight = height;

  videoElement = document.createElement('video');
  videoElement.style.display = 'none';
  videoElement.setAttribute('playsinline', 'true');
  videoElement.muted = true;
  document.body.appendChild(videoElement);

  faceMesh = new window.FaceMesh({
    locateFile: (file) => `/mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(handleResults);

  camera = new window.Camera(videoElement, {
    onFrame: async () => {
      if (!videoElement || !faceMesh) return;
      await faceMesh.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
  });

  await camera.start();

  cameraReady = true;
  modelReady = true;

  console.log('MediaPipe FaceMesh läuft');
}

// Prüft, ob die Gesichtsmitte im sichtbaren Hochkant-Ausschnitt liegt
function isFaceInsideVisibleArea(landmarkList) {
  if (
    !canvasWidth ||
    !canvasHeight ||
    !videoWidth ||
    !videoHeight ||
    !landmarkList?.length
  ) {
    return true;
  }

  // Gleiche Berechnung wie bei object-fit: cover
  const scale = Math.max(
    canvasWidth / videoWidth,
    canvasHeight / videoHeight
  );

  // Bereich des originalen Kamera-Videos, der im Canvas sichtbar ist
  const visibleWidth = canvasWidth / scale;
  const visibleHeight = canvasHeight / scale;

  const cropX = (videoWidth - visibleWidth) / 2;
  const cropY = (videoHeight - visibleHeight) / 2;

  // Punkt 1 = Nasenspitze, gut als Gesichtsmitte geeignet
  const faceCenter = landmarkList[1];

  if (!faceCenter) return false;

  const faceX = faceCenter.x * videoWidth;
  const faceY = faceCenter.y * videoHeight;

  return (
    faceX >= cropX &&
    faceX <= cropX + visibleWidth &&
    faceY >= cropY &&
    faceY <= cropY + visibleHeight
  );
}

function handleResults(results) {
  firstResultReceived = true;

  // Echte Größe des Kamera-Videos beibehalten:
  // wichtig für Rendering und Face-Manipulation
  videoWidth = videoElement.videoWidth || results.image?.width || 1280;
  videoHeight = videoElement.videoHeight || results.image?.height || 720;

  // Nur Gesichter behalten, die im sichtbaren Hochkant-Bereich liegen
  const landmarks = (results.multiFaceLandmarks || []).filter(
    isFaceInsideVisibleArea
  );

  faces = landmarks.map((landmarkList) => {
    return {
      source: 'mediapipe',

      keypoints: landmarkList.map((pt, index) => {
        return {
          index,
          x: pt.x * videoWidth,
          y: pt.y * videoHeight,
          z: pt.z || 0,
        };
      }),

      raw: landmarkList,

      videoSize: {
        width: videoWidth,
        height: videoHeight,
      },
    };
  });
}

export function getVideo() {
  return videoElement;
}

export function getFaces() {
  return faces;
}

export function getVideoSize() {
  return {
    width: videoWidth,
    height: videoHeight,
  };
}

export function isFaceTrackingReady() {
  return cameraReady && modelReady && firstResultReceived;
}

export function hasFace() {
  return faces.length > 0;
}