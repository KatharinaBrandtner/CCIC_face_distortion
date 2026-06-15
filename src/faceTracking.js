let camera;
let videoElement;
let faceMesh;

let faces = [];

let videoWidth = 1280;
let videoHeight = 720;

let cameraReady = false;
let modelReady = false;
let firstResultReceived = false;

export async function setupFaceTracking() {
  if (!window.FaceMesh || !window.Camera) {
    throw new Error(
      'MediaPipe wurde nicht geladen. Prüfe die Script-Tags in index.html.'
    );
  }

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

function handleResults(results) {
  firstResultReceived = true;

  videoWidth = videoElement.videoWidth || results.image?.width || 1280;
  videoHeight = videoElement.videoHeight || results.image?.height || 720;

  const landmarks = results.multiFaceLandmarks || [];

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