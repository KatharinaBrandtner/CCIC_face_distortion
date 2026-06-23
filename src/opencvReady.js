let openCvPromise = null;

export function waitForOpenCV() {
    if (window.cv?.Mat) {
        return Promise.resolve(window.cv);
    }

    if (openCvPromise) {
        return openCvPromise;
    }

    openCvPromise = new Promise((resolve, reject) => {
        const waitUntilReady = () => {
            const startedAt = performance.now();
            const timeout = 15000;

            const check = () => {
                if (window.cv?.Mat) {
                    resolve(window.cv);
                    return;
                }

                if (performance.now() - startedAt > timeout) {
                    reject(
                        new Error(
                            "OpenCV wurde geladen, aber nicht initialisiert. Prüfe /opencv/opencv.js."
                        )
                    );
                    return;
                }

                requestAnimationFrame(check);
            };

            check();
        };

        waitUntilReady();
    });

    return openCvPromise;
}