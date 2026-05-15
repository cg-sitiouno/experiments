/** Configuración global y constantes de física / UI del minijuego. */

export const CONFIG = {
  ROUNDS: 10,
  POINTS_BASE: 10,
  /** Máximo de burbujas de 1 en el paso 1 del analizador (a × b). */
  MAX_ANALYZER_PRODUCT: 120,
  LEVELS: {
    1: { tables: [2, 3, 4, 5], maxMult: 10, timeMs: 10000 },
    2: { tables: [6, 7, 8, 9], maxMult: 10, timeMs: 7000 },
    3: { tables: [2, 3, 4, 5, 6, 7, 8, 9], maxMult: 12, timeMs: 5000 },
  },
};

export const RESULT_MSGS = [
  "¡Seguí practicando!",
  "¡Bien!",
  "¡Muy bien!",
  "¡Genial! 🏆",
];

/* ── Arcade (paso 1 analizador) ── */
export const ARCADE_TAP_MAX_MS = 320;
export const ARCADE_TAP_MAX_MOVE_PX = 28;
export const ARCADE_FRICTION = 0.992;
/** Velocidad inicial al disparar (~px/s en coords de campo). */
export const ARCADE_SHOT_SPEED = 410;
/** Rebote en pared: factor sobre componente normal (menos = más amortiguado). */
export const ARCADE_WALL_BOUNCE = 0.34;

/* ── Fase 2 suma (workspace) ── */
export const MERGE_DISTANCE_PX = 84;
export const DRAG_THRESHOLD_PX = 10;
export const MIN_DECOMPOSE = 5;
