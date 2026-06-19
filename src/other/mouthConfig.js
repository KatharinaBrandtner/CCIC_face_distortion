// ============================================================
// TUNING: Alle Werte hier anpassen um das Mund-Verhalten zu ändern
// ============================================================

// Geschlossener Mund: Wie stark werden die Mundwinkel angehoben?
export const CLOSED_SMILE_WEIGHTS = [8, 6, 4, 2];

// Geschlossener Mund: Wie weit nach außen gehen die Mundwinkel?
export const CLOSED_SMILE_CORNER_SPREAD = 3.7;

// Geschlossener Mund: Wie stark wird die Smile-Kette angehoben?
export const CLOSED_SMILE_CHAIN_LIFT = [1, 3, 5, 8, 12];

// Geschlossener Mund: Wie viel wird die Oberlippe angehoben?
export const CLOSED_SMILE_UPPER_LIP_LIFT = 2;

// Geschlossener Mund: Wie viel wird die Unterlippe gesenkt?
export const CLOSED_SMILE_LOWER_LIP_DROP = 2.2;

// Geschlossener Mund: Wie viel werden die Wangen angehoben?
export const CLOSED_SMILE_CHEEK_LIFT = 2.2;



// Offener Mund: Ab wann gilt der Mund als offen? (Distanz zwischen Top und Bottom)
export const MOUTH_OPEN_THRESHOLD = 10;

// Offener Mund (Skalierung): Startwert, wenn der Mund gerade erst offen ist.
export const OPEN_MOUTH_SCALE_START_AMOUNT = 10;

// Offener Mund (Skalierung): Ab hier ist die Skalierung am Maximum.
export const OPEN_MOUTH_SCALE_MAX_AMOUNT = 30;

// Offener Mund (Skalierung): Kurve für den Anstieg. > 1 = erst langsam, dann stärker.
export const OPEN_MOUTH_SCALE_CURVE = 1.37;

// Offener Mund (Skalierung): Wie stark wird der Mundinhalt beim Start vergrößert?
export const OPEN_MOUTH_INNER_SCALE_MIN = 1.02;

// Offener Mund (Skalierung): Wie stark wird der Mundinhalt maximal vergrößert?
export const OPEN_MOUTH_INNER_SCALE_MAX = 1.21;
// 1.18 

// Offener Mund (Skalierung): Wie stark wird der Mundrand beim Start mitgezogen?
export const OPEN_MOUTH_BORDER_SCALE_MIN = 1.01;

// Offener Mund (Skalierung): Wie stark wird der Mundrand maximal mitgezogen?
export const OPEN_MOUTH_BORDER_SCALE_MAX = 1.08;