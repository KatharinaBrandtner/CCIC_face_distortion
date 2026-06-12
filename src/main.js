import './style.css';

document.querySelector('#app').innerHTML = `
  <section class="screen">
    <video id="webcam" autoplay playsinline muted></video>

    <div class="dark-overlay"></div>

    <header class="headline">
      <h1>HOW PERFECT ARE YOU?</h1>
    </header>

    <div class="face-window"></div>
  </section>
`;

const video = document.querySelector('#webcam');

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    video.srcObject = stream;
  } catch (error) {
    console.error('Camera error:', error);
  }
}

startCamera();