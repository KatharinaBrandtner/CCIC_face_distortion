export async function waitForOpenCV() {

  return new Promise((resolve) => {

    const check = () => {

      if (
        window.cv &&
        window.cv.Mat
      ) {

        console.log(
          "OpenCV bereit"
        );

        resolve();
        return;
      }

      setTimeout(
        check,
        100
      );
    };

    check();
  });
}