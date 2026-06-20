// diese datei liest die Verbindungsdaten der Mediapipe Facemesh Punkte aus der face_mesh_connections.py Datei aus, 
// filtert die Dreiecke heraus und speichert sie in einem neuen JavaScript Modul, das dann in anderen Teilen des Projekts verwendet werden kann, 
// um die Dreiecksverbindungen der Gesichtslandmarken zu definieren.

// nicht alle dreiecke funktionieren, da manche punkte von mediapipe nicht immer erkannt werden, was zu fehlern führen kann, wenn versucht wird, diese punkte zu manipulieren.
// deswegen muss man immer etwas debuggen und schauen, welche punkte in welchen situationen nicht erkannt werden, um die entsprechenden dreiecke aus der liste zu entfernen, damit es nicht zu fehlern kommt.

import fs from "fs";

const text = fs.readFileSync(
    "./face_mesh_connections.py",
    "utf8"
);

const pairs = [];

const regex = /\((\d+),\s*(\d+)\)/g;

let match;

while ((match = regex.exec(text)) !== null) {

    pairs.push([
        Number(match[1]),
        Number(match[2])
    ]);
}

const triangles = [];

for (let i = 0; i < pairs.length - 2; i += 3) {

    const [a, b] = pairs[i];
    const [b2, c] = pairs[i + 1];
    const [c2, a2] = pairs[i + 2];

    if (
        b === b2 &&
        c === c2 &&
        a === a2
    ) {

        triangles.push([
            a,
            b,
            c
        ]);
    }
}

const output = `export const FACEMESH_TRIANGLES = ${JSON.stringify(
    triangles,
    null,
    4
)};\n`;

fs.writeFileSync(
    "./facemeshTriangles.js",
    output
);

console.log(
    `Created ${triangles.length} triangles`
);