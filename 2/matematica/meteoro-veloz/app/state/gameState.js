/**
 * Estado mutable de la partida (sin referencias DOM).
 * La vista usa `els` en game.js; este objeto es el modelo de sesión.
 */
export function createInitialState() {
  return {
    level: 1,
    /** Entre pantalla inicio y modo (y al volver desde partida). */
    pendingLevel: /** @type {number | null} */ (null),
    /** Cómo se resuelve la partida: memoria (cuatro opciones + tiempo) o arcade (grupos). */
    gameMode: /** @type {null | "memory" | "arcade"} */ (null),
    round: 0,
    points: 0,
    answered: false,
    urgencyId: /** @type {number | null} */ (null),
    timeoutId: /** @type {number | null} */ (null),
    q: /** @type {{ a: number, b: number, product: number, options: number[] } | null} */ (null),
    timerTotalMs: 0,
    timerElapsedMs: 0,
    timerLastStart: /** @type {number | null} */ (null),
    analyzerOpen: false,
    analyzerFlipped: false,
    /** null = cerrado; memory = tabla mental; arcade = minijuego */
    analyzerHelpMode: /** @type {null | "memory" | "arcade"} */ (null),
    /** 1 = unidades y grupos · 2 = sumar burbujas (fusión) */
    analyzerPhase: 1,
    analyzerNumGroups: 0,
    analyzerGroupSize: 0,
    analyzerLockedSize: /** @type {number | null} */ (null),
    analyzerGroupsTarget: 0,
    arcadeWeapon: /** @type {"shoot" | "peel"} */ ("shoot"),
    arcadeAmmoLeft: 0,
    sumMergeModalOpen: false,
    pendingSumMerge: /** @type {{ elA: HTMLElement, elB: HTMLElement, expected: number } | null} */ (
      null
    ),
  };
}
