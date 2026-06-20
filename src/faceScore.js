function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }
  
  function distance(a, b) {
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  
  function getPoint(face, index) {
    return face?.keypoints?.[index] || null;
  }
  
  function getFaceBox(face) {
    if (!face?.keypoints?.length) {
      return null;
    }
  
    const xs = face.keypoints.map((p) => p.x);
    const ys = face.keypoints.map((p) => p.y);
  
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
  
    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      cx: minX + (maxX - minX) / 2,
      cy: minY + (maxY - minY) / 2,
    };
  }
  
  function scoreRange(value, min, max) {
    return clamp(((value - min) / (max - min)) * 100, 0, 100);
  }
  
  export function calculateFaceSymmetry(face) {
    const box = getFaceBox(face);
    if (!box) return 0;
  
    // MediaPipe FaceMesh Punkte
    const leftFace = getPoint(face, 234);
    const rightFace = getPoint(face, 454);
  
    const leftEye = getPoint(face, 33);
    const rightEye = getPoint(face, 263);
  
    const nose = getPoint(face, 1);
  
    const mouthLeft = getPoint(face, 61);
    const mouthRight = getPoint(face, 291);
  
    const faceWidth = distance(leftFace, rightFace) || box.w;
    if (!faceWidth) return 0;
  
    const centerX =
      leftFace && rightFace
        ? (leftFace.x + rightFace.x) / 2
        : box.cx;
  
    const mouthCenterX =
      mouthLeft && mouthRight
        ? (mouthLeft.x + mouthRight.x) / 2
        : centerX;
  
    const noseOffset = nose ? Math.abs(nose.x - centerX) / faceWidth : 0;
    const mouthOffset = Math.abs(mouthCenterX - centerX) / faceWidth;
  
    const eyeTilt =
      leftEye && rightEye
        ? Math.abs(leftEye.y - rightEye.y) / faceWidth
        : 0;
  
    const mouthTilt =
      mouthLeft && mouthRight
        ? Math.abs(mouthLeft.y - mouthRight.y) / faceWidth
        : 0;
  
    let score = 100;
  
    score -= noseOffset * 180;
    score -= mouthOffset * 140;
    score -= eyeTilt * 120;
    score -= mouthTilt * 90;
  
    return Math.round(clamp(score, 0, 100));
  }
  
  export function calculateSmileCompliance(face, happinessScore) {
    const box = getFaceBox(face);
    if (!box) return 0;
  
    const mouthLeft = getPoint(face, 61);
    const mouthRight = getPoint(face, 291);
  
    const upperLip = getPoint(face, 13);
    const lowerLip = getPoint(face, 14);
  
    if (!mouthLeft || !mouthRight || !upperLip || !lowerLip) {
      return Math.round(clamp(happinessScore, 0, 100));
    }
  
    const faceWidth = box.w;
    if (!faceWidth) return Math.round(clamp(happinessScore, 0, 100));
  
    const mouthWidth = distance(mouthLeft, mouthRight);
    const mouthOpen = distance(upperLip, lowerLip);
  
    const mouthWidthRatio = mouthWidth / faceWidth;
    const mouthOpenRatio = mouthOpen / faceWidth;
  
    // Mundbreite: breiter Mund = mehr Smile Compliance
    const widthScore = scoreRange(mouthWidthRatio, 0.28, 0.45);
  
    // Mundöffnung: leicht geöffnet ist okay, zu offen wird schlechter
    const idealOpenRatio = 0.035;
    const openScore = 100 - Math.abs(mouthOpenRatio - idealOpenRatio) * 900;
  
    const mouthGeometryScore =
      widthScore * 0.75 +
      clamp(openScore, 0, 100) * 0.25;
  
    // Happiness Score kommt von außen aus deiner Mood Detection
    const score =
      clamp(happinessScore, 0, 100) * 0.55 +
      mouthGeometryScore * 0.45;
  
    return Math.round(clamp(score, 0, 100));
  }
  
  export function calculateAttentionAlignment(face, videoSize) {
    const box = getFaceBox(face);
  
    if (!box || !videoSize?.width || !videoSize?.height) {
      return 0;
    }
  
    const leftEye = getPoint(face, 33);
    const rightEye = getPoint(face, 263);
  
    const videoCenterX = videoSize.width / 2;
    const videoCenterY = videoSize.height / 2;
  
    const dx = Math.abs(box.cx - videoCenterX) / videoSize.width;
    const dy = Math.abs(box.cy - videoCenterY) / videoSize.height;
  
    const centerOffset = Math.sqrt(dx * dx + dy * dy);
    const centerScore = 100 - centerOffset * 260;
  
    let tiltScore = 100;
  
    if (leftEye && rightEye) {
      const angle = Math.atan2(
        rightEye.y - leftEye.y,
        rightEye.x - leftEye.x
      );
  
      const angleDeg = Math.abs((angle * 180) / Math.PI);
      tiltScore = 100 - angleDeg * 5;
    }
  
    const faceHeightRatio = box.h / videoSize.height;
  
    // Ideal: Gesicht ungefähr mittig und sichtbar groß
    const sizeScore = 100 - Math.abs(faceHeightRatio - 0.52) * 220;
  
    const score =
      clamp(centerScore, 0, 100) * 0.45 +
      clamp(tiltScore, 0, 100) * 0.30 +
      clamp(sizeScore, 0, 100) * 0.25;
  
    return Math.round(clamp(score, 0, 100));
  }
  
  export function calculatePerfectFaceScore(face, videoSize, happinessScore) {
    const symmetry = calculateFaceSymmetry(face);
    const smileCompliance = calculateSmileCompliance(face, happinessScore);
    const attentionAlignment = calculateAttentionAlignment(face, videoSize);
  
    const total =
      symmetry * 0.4 +
      smileCompliance * 0.35 +
      attentionAlignment * 0.25;
  
    return {
      total: Math.round(clamp(total, 0, 100)),
      symmetry,
      smileCompliance,
      attentionAlignment,
    };
  }