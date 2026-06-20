export function testCanvasCapture(canvas) {

  console.log(
    "Canvas Test gestartet"
  );

  const cv = window.cv;

  const src =
    cv.imread(canvas);

  console.log(
    "Canvas Mat:",
    src.cols,
    src.rows
  );

  src.delete();
}