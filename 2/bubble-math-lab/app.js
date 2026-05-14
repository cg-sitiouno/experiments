(function () {
  "use strict";

  const MERGE_DISTANCE_PX = 84;
  const DRAG_THRESHOLD_PX = 10;
  const MAX_SUM = 99;

  /** Puntos: (a+b) × este valor. Ej.: 10+5 → 15×10 = +150. Error: la mitad en penalización. */
  const SCORE_POINTS_PER_UNIT = 10;

  /** Puntuación acumulada para subir el rango de dificultad del siguiente reto. */
  const DIFFICULTY_TIER_2_AT = 500;
  const DIFFICULTY_TIER_3_AT = 2000;

  /** Enteros menores que esto no se descomponen (piezas base: 1–4 se combinan, no se rompen). */
  const MIN_DECOMPOSE = 5;

  /** Aciertos seguidos en el modal para llenar la barra y activar autofusión. */
  const AUTO_FUSION_MODAL_STREAK = 10;
  /** En modo autofusión, la energía baja de 1 a 0 en este lapso si no recargás con fusiones o descomposiciones. */
  const AUTO_FUSION_DRAIN_SEC = 30;
  /** Cuánto sube la energía (0–1) por actividad válida en modo autofusión. */
  const AUTO_FUSION_ACTIVITY_BUMP = 0.07;

  /** Suma ya dominada (modal correcto) → próxima fusión del mismo par sin preguntar. */
  const LEARNED_ADD_SUMS_KEY = "bubble-math-lab-learned-add-v1";

  const MERGE_WRONG_HINTS = [
    "Ese no es el resultado de la operación. ¡Intenta de nuevo!",
    "Casi. Repasa con calma y escribe el número.",
    "Revisa las dos burbujas y la operación del reto. Puedes intentarlo otra vez.",
  ];

  /** Retos fijos del modo tutorial (orden pedagógico). */
  const TUTORIAL_SEQUENCE = [
    {
      op: "add",
      left: 7,
      right: 8,
      title: "Paso 1 de 3 — Suma y burbujas",
      body:
        "Arriba está la cuenta que hay que resolver. Tocá el 7 u el 8 (sin arrastrar) para partirlo en dos piezas más chicas. Después arrastrá una burbuja sobre otra: se suman y el juego te pedirá el resultado en un cuadro. Objetivo: quedar con una sola burbuja que muestre 15.",
    },
    {
      op: "add",
      left: 10,
      right: 6,
      title: "Paso 2 de 3 — Decenas",
      body:
        "10 + 6 = 16. Los múltiplos de 10 suelen ser buen punto de partida: podés fusionarlos primero o descomponer el otro número para sumar por partes. Objetivo: una burbuja con 16.",
    },
    {
      op: "subtract",
      left: 14,
      right: 6,
      title: "Paso 3 de 3 — Resta",
      body:
        "14 − 6 = 8. Las burbujas rojas son el sustraendo: arrástralas sobre una celeste del minuendo cuando la celeste sea mayor o igual. Si juntás dos celestes, las volvés a sumar. Objetivo: una burbuja con 8.",
    },
  ];

  let mergeWrongIndex = 0;

  let idCounter = 0;
  function nextId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    idCounter += 1;
    return "b-" + idCounter;
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function pointsForOperandSum(sum) {
    return sum * SCORE_POINTS_PER_UNIT;
  }

  function penaltyForOperandSum(sum) {
    return Math.floor(pointsForOperandSum(sum) / 2);
  }

  function canonicalAddPairKey(a, b) {
    return Math.min(a, b) + ":" + Math.max(a, b);
  }

  /**
   * Sumas que entran al historial / fusión memorizada:
   * - ambos sumandos entre 1 y 5, o
   * - un múltiplo de 10 y el otro entre 1 y 10.
   */
  function isEasyLearnableAddPair(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (a < 1 || b < 1) return false;
    if (a <= 5 && b <= 5) return true;
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    if (hi % 10 === 0 && lo <= 10) return true;
    return false;
  }

  function loadLearnedAddPairs() {
    try {
      const raw = localStorage.getItem(LEARNED_ADD_SUMS_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.filter((x) => typeof x === "string"));
    } catch (e) {
      return new Set();
    }
  }

  function persistLearnedAddPairs(set) {
    try {
      localStorage.setItem(LEARNED_ADD_SUMS_KEY, JSON.stringify([...set].sort()));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  const learnedAddPairs = loadLearnedAddPairs();

  function tierFromScore(score) {
    if (score >= DIFFICULTY_TIER_3_AT) return 3;
    if (score >= DIFFICULTY_TIER_2_AT) return 2;
    return 1;
  }

  function difficultyLabel(tier) {
    if (tier === 1) return "Rango inicial";
    if (tier === 2) return "Rango medio";
    return "Rango avanzado";
  }

  /** @returns {{ a: number, b: number, sum: number }} */
  function generateAdditionPair(tier) {
    let a;
    let b;
    if (tier === 1) {
      /** Al menos un sumando en 6…9 (mayor que 5 y menor que 10). */
      let guard = 0;
      do {
        guard += 1;
        a = randomInt(2, 9);
        b = randomInt(2, 9);
      } while ((a + b > MAX_SUM || (a < 6 && b < 6)) && guard < 80);
      if (a + b > MAX_SUM || (a < 6 && b < 6)) {
        a = 6;
        b = 2;
      }
    } else if (tier === 2) {
      a = randomInt(5, 19);
      b = randomInt(5, 19);
    } else {
      a = randomInt(10, 49);
      b = randomInt(10, 49);
    }
    if (a + b > MAX_SUM) {
      return generateAdditionPair(tier);
    }
    return { a, b, sum: a + b };
  }

  /** Minuendo a, sustraendo b, resultado a − b (siempre a > b). */
  function generateSubtractionPair(tier) {
    let minuend;
    let sub;
    if (tier === 1) {
      minuend = randomInt(6, 18);
      sub = randomInt(2, Math.min(minuend - 1, 9));
    } else if (tier === 2) {
      minuend = randomInt(14, Math.min(48, MAX_SUM));
      sub = randomInt(5, minuend - 1);
    } else {
      minuend = randomInt(24, MAX_SUM);
      sub = randomInt(10, minuend - 1);
    }
    if (sub < 2 || minuend - sub < 1) {
      return generateSubtractionPair(tier);
    }
    return { a: minuend, b: sub, sum: minuend - sub };
  }

  /** @param {'add' | 'subtract'} op */
  function generateChallengePair(tier, op) {
    return op === "subtract" ? generateSubtractionPair(tier) : generateAdditionPair(tier);
  }

  function pickChallengeOp() {
    if (state.playMode === "sub_only") return "subtract";
    if (state.playMode === "add_only") return "add";
    return Math.random() < 0.5 ? "add" : "subtract";
  }

  /**
   * Progresión pedagógica (spec_eq §8): bloques de 3 retos por tipo, luego mixto.
   * @param {number} challengeIndex índice 1-based del reto en modo mystery
   */
  function mysteryStageFromChallengeIndex(challengeIndex) {
    const phase = Math.floor((challengeIndex - 1) / 3);
    if (phase >= 3) return "mixed";
    const types = /** @type {const} */ ([
      "missing_addend",
      "missing_subtrahend",
      "missing_minuend",
    ]);
    return types[phase];
  }

  /**
   * @param {number} tier
   * @param {number} challengeIndex
   */
  function generateMysteryChallenge(tier, challengeIndex) {
    const stage = mysteryStageFromChallengeIndex(challengeIndex);
    const type =
      stage === "mixed"
        ? (["missing_addend", "missing_subtrahend", "missing_minuend"][randomInt(0, 2)])
        : stage;

    for (let attempt = 0; attempt < 55; attempt += 1) {
      if (type === "missing_addend") {
        const a = randomInt(2, 9);
        const hiddenValue = randomInt(2, 9);
        const expectedResult = a + hiddenValue;
        if (expectedResult <= MAX_SUM) {
          return {
            mysteryType: "missing_addend",
            challengeOp: "add",
            leftNumber: null,
            rightNumber: a,
            expectedResult,
            hiddenValue,
            hiddenPosition: /** @type {const} */ ("left"),
          };
        }
        continue;
      }
      if (type === "missing_subtrahend") {
        const maxL = tier >= 3 ? Math.min(48, MAX_SUM - 1) : 18;
        const minL = tier >= 2 ? 10 : 6;
        const leftNumber = randomInt(minL, maxL);
        const expectedResult = randomInt(2, leftNumber - 2);
        const hiddenValue = leftNumber - expectedResult;
        if (hiddenValue >= 1 && expectedResult >= 1) {
          return {
            mysteryType: "missing_subtrahend",
            challengeOp: "subtract",
            leftNumber,
            rightNumber: null,
            expectedResult,
            hiddenValue,
            hiddenPosition: /** @type {const} */ ("right"),
          };
        }
        continue;
      }
      const maxR = tier >= 3 ? 18 : 9;
      const rightNumber = randomInt(2, Math.min(9, maxR));
      const maxExp = tier >= 3 ? Math.min(28, MAX_SUM - rightNumber) : 12;
      const expectedResult = randomInt(2, maxExp);
      const hiddenValue = rightNumber + expectedResult;
      if (hiddenValue <= MAX_SUM) {
        return {
          mysteryType: "missing_minuend",
          challengeOp: "subtract",
          leftNumber: null,
          rightNumber,
          expectedResult,
          hiddenValue,
          hiddenPosition: /** @type {const} */ ("left"),
        };
      }
    }
    return {
      mysteryType: "missing_addend",
      challengeOp: "add",
      leftNumber: null,
      rightNumber: 4,
      expectedResult: 8,
      hiddenValue: 4,
      hiddenPosition: "left",
    };
  }

  /**
   * Prioridad pedagógica en Cajita Misteriosa (spec_eq §15).
   * @param {{ id: string, value: number, source: string }} b
   * @returns {[number, number] | null}
   */
  function decomposePartsForMysteryBubble(b) {
    if (state.playMode !== "mystery" || !state.mysteryType) return null;
    if (state.mysteryType === "missing_addend") {
      if (
        b.value === state.expectedResult &&
        state.rightNumber != null &&
        state.hiddenValue != null
      ) {
        const p = [state.rightNumber, state.hiddenValue].sort((x, y) => x - y);
        return [p[0], p[1]];
      }
      return null;
    }
    if (state.mysteryType === "missing_subtrahend") {
      if (b.value === state.leftNumber && state.expectedResult != null && state.hiddenValue != null) {
        const p = [state.expectedResult, state.hiddenValue].sort((x, y) => x - y);
        return [p[0], p[1]];
      }
      return null;
    }
    return null;
  }

  /**
   * Reglas pedagógicas clásicas (sin mirar el tablero).
   * @param {number} n
   * @returns {[number, number] | null}
   */
  function decomposePartsClassic(n) {
    if (!Number.isFinite(n) || n < MIN_DECOMPOSE) return null;
    if (n === 5) return null;
    if (n <= 9) return [5, n - 5];
    if (n === 10) return [5, 5];
    if (n > 10 && n % 10 === 0) {
      const half = n / 2;
      return [half, half];
    }
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    if (ones === 0) return null;
    return [tens, ones];
  }

  /**
   * Parte n en g + (n−g) con g = 10 − v para algún v en otherValues (complemento a 10),
   * eligiendo el split que deja menor resto (menos trabajo después del primer 10) y
   * desempatando con v mayor. Solo v en 1…9 tienen sentido como “amigos”.
   * @param {number} n
   * @param {number[]} otherValues valores de otras burbujas (mismo bando)
   * @returns {[number, number] | null}
   */
  function pickComplementTenSplit(n, otherValues) {
    if (!Number.isFinite(n) || n < 2 || !otherValues || otherValues.length === 0) return null;
    let bestPair = /** @type {null | [number, number]} */ (null);
    let bestLeftover = Infinity;
    let bestV = -1;
    const seen = new Set();
    for (const v of otherValues) {
      if (!Number.isFinite(v) || v < 1 || v > 9) continue;
      const key = v;
      if (seen.has(key)) continue;
      seen.add(key);
      const g = 10 - v;
      if (g < 1 || g > n - 1) continue;
      const leftover = n - g;
      if (leftover < 1) continue;
      if (leftover < bestLeftover || (leftover === bestLeftover && v > bestV)) {
        bestLeftover = leftover;
        bestV = v;
        const a = Math.min(g, leftover);
        const b = Math.max(g, leftover);
        bestPair = [a, b];
      }
    }
    return bestPair;
  }

  /**
   * Decena “completa” alineada al valor posicional + unidades: 26 → 20+6, 157 → 150+7.
   * Prioridad pedagógica por encima de complementos a 10 y de 10+(n−10) contextual.
   * No aplica a n ≤ 10 ni a múltiplos exactos de 10 (siguen otras reglas).
   * @param {number} n
   * @returns {[number, number] | null}
   */
  function pickDecadePlusUnits(n) {
    if (!Number.isFinite(n) || n <= 10 || n % 10 === 0) return null;
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    if (ones === 0) return null;
    return [tens, ones];
  }

  /**
   * Si ya hay un múltiplo de 10 entre las otras piezas (mismo bando), priorizar n → 10 + (n−10).
   * Evita casos como 15 → 12 + 3 por complemento cuando en mesa hay 10 y 7 (más intuitivo 10 + 5).
   * @param {number} n
   * @param {number[]} otherValues
   * @returns {[number, number] | null}
   *
   * Mejora futura: hacer el orden de heurísticas configurable (perfil pedagógico / modo docente);
   * ver §8 en plan-tareas-y-documentacion.md.
   */
  function pickTenPlusWhenMultipleOfTenOnBoard(n, otherValues) {
    if (!Number.isFinite(n) || n <= 10 || !otherValues || otherValues.length === 0) return null;
    let hasMultipleOfTen = false;
    for (const v of otherValues) {
      if (Number.isFinite(v) && v > 0 && v % 10 === 0) {
        hasMultipleOfTen = true;
        break;
      }
    }
    if (!hasMultipleOfTen) return null;
    const rest = n - 10;
    if (rest < 1) return null;
    const lo = Math.min(10, rest);
    const hi = Math.max(10, rest);
    return [lo, hi];
  }

  /**
   * Descomposición contextual (orden fijo de heurísticas; futuro: modos configurables):
   * 1) n > 10 y no múltiplo de 10 → ⌊n/10⌋×10 + (n mod 10) (p. ej. 26 → 20+6)
   * 2) Con otra pieza múltiplo de 10 en mesa → 10 + (n−10)
   * 3) Complemento a 10 con otra pieza
   * 4) Reglas clásicas
   * @param {{ id: string, value: number, source: string }} b
   * @returns {[number, number] | null}
   */
  function decomposePartsForBubble(b) {
    const n = b.value;
    if (state.playMode === "mystery") {
      const mysteryParts = decomposePartsForMysteryBubble(b);
      if (mysteryParts) return mysteryParts;
    }
    const decadeUnits = pickDecadePlusUnits(n);
    if (decadeUnits) return decadeUnits;

    const others = [];
    if (state.challengeOp === "add") {
      for (const o of state.bubbles) {
        if (o.id === b.id) continue;
        if (o.source !== "addend") continue;
        others.push(o.value);
      }
    } else if (b.source === "minuend") {
      for (const o of state.bubbles) {
        if (o.id === b.id) continue;
        if (o.source !== "minuend") continue;
        others.push(o.value);
      }
    }
    const canFriend =
      state.challengeOp === "add" || (state.challengeOp === "subtract" && b.source === "minuend");
    if (canFriend && others.length > 0) {
      const tenPlus = pickTenPlusWhenMultipleOfTenOnBoard(n, others);
      if (tenPlus) return tenPlus;
      const friend = pickComplementTenSplit(n, others);
      if (friend) return friend;
    }
    return decomposePartsClassic(n);
  }

  /** @type {{
   *   score: number,
   *   playMode: 'add_only' | 'sub_only' | 'mixed' | 'tutorial' | 'mystery',
   *   tutorialStep: number,
   *   challengeOp: 'add' | 'subtract',
   *   leftNumber: number | null,
   *   rightNumber: number | null,
   *   expectedResult: number,
   *   challengeIndex: number,
   *   mysteryType: null | 'missing_addend' | 'missing_subtrahend' | 'missing_minuend',
   *   hiddenValue: null | number,
   *   hiddenPosition: null | 'left' | 'right',
   *   bubbles: Array<{
   *     id: string,
   *     value: number,
   *     x: number,
   *     y: number,
   *     source: 'addend' | 'minuend' | 'subtrahend',
   *   }>,
   * }} */
  const state = {
    score: 0,
    playMode: "add_only",
    tutorialStep: 0,
    challengeOp: "add",
    leftNumber: 7,
    rightNumber: 8,
    expectedResult: 15,
    challengeIndex: 1,
    mysteryType: null,
    hiddenValue: null,
    hiddenPosition: null,
    bubbles: [],
  };

  /** Valor mostrado en el HUD durante la animación del contador. */
  let scoreShown = 0;
  let scoreAnimId = 0;

  let drag = null;
  /** Mensaje fijo en la segunda línea (error / aviso) hasta la próxima acción en el tablero. */
  let helpStickySecondary = null;
  /** Evita doble descomposición mientras corre la animación */
  let decomposeAnimating = false;

  /** Carga modal 0…10; modo autofusión con combustible 0…1. */
  let consecutiveModalCorrect = 0;
  let autoFusionActive = false;
  let autoFusionFuel = 0;
  let fusionDrainRaf = 0;
  let lastFusionDrainTs = 0;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** @type {null | { idA: string, idB: string, v1: number, v2: number, result: number, scoreBasis: number, nx: number, ny: number, op: 'add' | 'subtract', sourceA: string, sourceB: string }} */
  let pendingMerge = null;

  const els = {
    screenStart: document.getElementById("screen-start"),
    screenGame: document.getElementById("screen-game"),
    btnPlay: document.getElementById("btn-play"),
    btnHome: document.getElementById("btn-home"),
    btnReset: document.getElementById("btn-reset-turn"),
    btnNew: document.getElementById("btn-new-challenge"),
    hudScore: document.getElementById("hud-score"),
    hudChallenge: document.getElementById("hud-challenge"),
    hudDifficulty: document.getElementById("hud-difficulty"),
    eqLeft: document.getElementById("eq-left"),
    eqOp: document.getElementById("eq-op"),
    eqRight: document.getElementById("eq-right"),
    eqResult: document.getElementById("eq-result-label"),
    equation: document.getElementById("equation"),
    mysteryTarget: document.getElementById("mystery-target"),
    btnMysteryHelp: document.getElementById("btn-mystery-help"),
    fusionBar: document.getElementById("fusion-bar"),
    fusionBarFill: document.getElementById("fusion-bar-fill"),
    fusionBarLabel: document.getElementById("fusion-bar-label"),
    helpBanner: document.getElementById("help-banner"),
    helpPrimary: document.getElementById("help-primary"),
    helpSecondary: document.getElementById("help-secondary"),
    tutorialStrip: document.getElementById("tutorial-strip"),
    tutorialTitle: document.getElementById("tutorial-strip-title"),
    tutorialBody: document.getElementById("tutorial-strip-body"),
    tutorialSkip: document.getElementById("btn-tutorial-skip"),
    playArea: document.getElementById("play-area"),
    playSurface: document.getElementById("play-area-surface"),
    modal: document.getElementById("modal-success"),
    modalMsg: document.getElementById("modal-success-msg"),
    modalNext: document.getElementById("modal-next"),
    mergeModal: document.getElementById("modal-merge"),
    mergeTitle: document.getElementById("modal-merge-title"),
    mergePrompt: document.getElementById("modal-merge-prompt"),
    mergeHint: document.getElementById("modal-merge-hint"),
    mergeForm: document.getElementById("form-merge"),
    mergeAnswer: document.getElementById("merge-answer"),
    mergeFeedback: document.getElementById("merge-feedback"),
    confetti: document.getElementById("confetti-root"),
  };

  /** Contenedor directo de burbujas y partículas de split (mismo rect que el hit-test de arrastre). */
  function bubblesHostEl() {
    return els.playSurface || els.playArea;
  }

  function syncDifficultyHud() {
    if (state.playMode === "tutorial") {
      els.hudDifficulty.textContent = "Tutorial";
      return;
    }
    if (state.playMode === "mystery") {
      els.hudDifficulty.textContent = "Cajita Misteriosa";
      return;
    }
    const tier = tierFromScore(state.score);
    els.hudDifficulty.textContent = difficultyLabel(tier);
  }

  function flashHudScoreClass(isGain) {
    els.hudScore.classList.remove("hud-score--gain", "hud-score--loss");
    void els.hudScore.offsetWidth;
    els.hudScore.classList.add(isGain ? "hud-score--gain" : "hud-score--loss");
    window.setTimeout(() => {
      els.hudScore.classList.remove("hud-score--gain", "hud-score--loss");
    }, 450);
  }

  function runScoreAnimationTo(target) {
    cancelAnimationFrame(scoreAnimId);
    const from = scoreShown;
    if (prefersReducedMotion() || from === target) {
      scoreShown = target;
      els.hudScore.textContent = String(scoreShown);
      syncDifficultyHud();
      return;
    }
    const startTime = performance.now();
    const dur = Math.min(950, 260 + Math.min(560, Math.abs(target - from) * 3.2));
    function tick(now) {
      const t = Math.min(1, (now - startTime) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      scoreShown = Math.round(from + (target - from) * e);
      els.hudScore.textContent = String(scoreShown);
      if (t < 1) {
        scoreAnimId = requestAnimationFrame(tick);
      } else {
        scoreShown = target;
        els.hudScore.textContent = String(scoreShown);
        syncDifficultyHud();
      }
    }
    scoreAnimId = requestAnimationFrame(tick);
    syncDifficultyHud();
  }

  function applyScoreDelta(delta) {
    const mult = autoFusionActive && delta > 0 ? 2 : 1;
    const d = delta * mult;
    const was = state.score;
    state.score = Math.max(0, state.score + d);
    flashHudScoreClass(d >= 0);
    runScoreAnimationTo(state.score);
    if (d < 0 && was > 0 && state.score === 0) {
      setHelpStickySecondary("Tus puntos no bajan de cero. ¡Seguí intentando!");
    }
  }

  function showScreen(name) {
    const isStart = name === "start";
    els.screenStart.hidden = !isStart;
    els.screenGame.hidden = isStart;
    if (isStart) {
      helpStickySecondary = null;
      updateHelpBanner();
    } else {
      syncMysteryChrome();
    }
  }

  function updateFusionBarUi() {
    if (!els.fusionBarFill || !els.fusionBarLabel) return;
    let pct = 0;
    let label = "";
    if (autoFusionActive) {
      pct = Math.max(0, Math.min(100, autoFusionFuel * 100));
      label =
        "Autofusión activa · " +
        Math.round(pct) +
        "% · puntos ×2 · fusiona o descompone para recargar";
    } else {
      pct = Math.max(0, Math.min(100, (consecutiveModalCorrect / AUTO_FUSION_MODAL_STREAK) * 100));
      label =
        "Autofusión " +
        consecutiveModalCorrect +
        "/" +
        AUTO_FUSION_MODAL_STREAK +
        " aciertos seguidos";
    }
    els.fusionBarFill.style.width = pct + "%";
    els.fusionBarLabel.textContent = label;
  }

  function bumpAutoFusionFuel() {
    if (!autoFusionActive) return;
    autoFusionFuel = Math.min(1, autoFusionFuel + AUTO_FUSION_ACTIVITY_BUMP);
    updateFusionBarUi();
  }

  function cancelFusionDrainLoop() {
    if (fusionDrainRaf) {
      cancelAnimationFrame(fusionDrainRaf);
      fusionDrainRaf = 0;
    }
  }

  function fusionDrainTick(now) {
    if (!autoFusionActive || els.screenGame.hidden) {
      fusionDrainRaf = 0;
      return;
    }
    const dt = Math.min(0.48, (now - lastFusionDrainTs) / 1000);
    lastFusionDrainTs = now;
    autoFusionFuel -= dt / AUTO_FUSION_DRAIN_SEC;
    if (autoFusionFuel <= 0) {
      autoFusionFuel = 0;
      exitAutoFusionMode();
      setHelpStickySecondary(
        "Modo autofusión terminado. Acierta diez veces seguidas en el modal para volver a llenar la barra."
      );
      fusionDrainRaf = 0;
      return;
    }
    updateFusionBarUi();
    fusionDrainRaf = requestAnimationFrame(fusionDrainTick);
  }

  function ensureFusionDrainLoop() {
    if (!autoFusionActive || els.screenGame.hidden) return;
    if (!fusionDrainRaf) {
      lastFusionDrainTs = performance.now();
      fusionDrainRaf = requestAnimationFrame(fusionDrainTick);
    }
  }

  function enterAutoFusionMode() {
    if (autoFusionActive) return;
    autoFusionActive = true;
    autoFusionFuel = 1;
    consecutiveModalCorrect = 0;
    if (els.fusionBar) els.fusionBar.classList.add("fusion-bar--active");
    updateFusionBarUi();
    ensureFusionDrainLoop();
    clearHelpStickySecondary();
    updateHelpBanner();
  }

  function exitAutoFusionMode() {
    if (!autoFusionActive) return;
    autoFusionActive = false;
    autoFusionFuel = 0;
    cancelFusionDrainLoop();
    if (els.fusionBar) els.fusionBar.classList.remove("fusion-bar--active");
    updateFusionBarUi();
  }

  function resetModalStreak() {
    consecutiveModalCorrect = 0;
    updateFusionBarUi();
  }

  function onSuccessfulModalMerge() {
    if (autoFusionActive) return;
    consecutiveModalCorrect += 1;
    updateFusionBarUi();
    if (consecutiveModalCorrect >= AUTO_FUSION_MODAL_STREAK) {
      enterAutoFusionMode();
    }
  }

  /** Suma "primitiva": 1+1, 5+m (m≤5), 10+n (n≤10), o ambos ≤5. */
  function isPrimitiveAddPair(a, b) {
    if (a === 1 && b === 1) return true;
    if ((a === 5 && b <= 5 && b >= 1) || (b === 5 && a <= 5 && a >= 1)) return true;
    if ((a === 10 && b <= 10 && b >= 1) || (b === 10 && a <= 10 && a >= 1)) return true;
    if (a <= 5 && b <= 5 && a >= 1 && b >= 1) return true;
    return false;
  }

  function isPrimitiveSubtractPair(minuendVal, subVal) {
    if (minuendVal < subVal || subVal < 1) return false;
    return minuendVal <= 10 && subVal <= 10;
  }

  function isPrimitiveAutoFuseMerge(b, partner) {
    if (!autoFusionActive) return false;
    if (isBlockedSubtractionMerge(b, partner)) return false;
    const op = mergeOpForPair(b, partner);
    if (op === "add") {
      return isPrimitiveAddPair(b.value, partner.value);
    }
    if (b.source === "minuend" && partner.source === "subtrahend") {
      return isPrimitiveSubtractPair(b.value, partner.value);
    }
    if (b.source === "subtrahend" && partner.source === "minuend") {
      return isPrimitiveSubtractPair(partner.value, b.value);
    }
    return false;
  }

  /** Fusión sin modal: par ya acertado antes y sigue siendo suma “fácil”. */
  function isLearnedInstantAddMerge(b, partner) {
    if (isBlockedSubtractionMerge(b, partner)) return false;
    const pm = buildMergePayload(b, partner);
    if (pm.op !== "add") return false;
    if (!isEasyLearnableAddPair(pm.v1, pm.v2)) return false;
    return learnedAddPairs.has(canonicalAddPairKey(pm.v1, pm.v2));
  }

  function rememberLearnedAddFromSuccessfulModal(pm) {
    if (pm.op !== "add") return;
    if (!isEasyLearnableAddPair(pm.v1, pm.v2)) return;
    const k = canonicalAddPairKey(pm.v1, pm.v2);
    if (learnedAddPairs.has(k)) return;
    learnedAddPairs.add(k);
    persistLearnedAddPairs(learnedAddPairs);
  }

  function buildMergePayload(b, partner) {
    const nx = (b.x + partner.x) / 2;
    const ny = (b.y + partner.y) / 2;
    const mergeOp = mergeOpForPair(b, partner);
    let result;
    let scoreBasis;
    if (mergeOp === "add") {
      result = b.value + partner.value;
      scoreBasis = result;
    } else {
      let minuendVal;
      let subVal;
      if (b.source === "minuend" && partner.source === "subtrahend") {
        minuendVal = b.value;
        subVal = partner.value;
      } else {
        minuendVal = partner.value;
        subVal = b.value;
      }
      result = minuendVal - subVal;
      scoreBasis = Math.max(minuendVal, subVal);
    }
    return {
      idA: b.id,
      idB: partner.id,
      v1: b.value,
      v2: partner.value,
      result,
      scoreBasis,
      op: mergeOp,
      sourceA: b.source,
      sourceB: partner.source,
      nx,
      ny,
    };
  }

  function runMergeCore(pm) {
    clearHelpStickySecondary();
    applyScoreDelta(pointsForOperandSum(pm.scoreBasis));
    removeBubbleById(pm.idA);
    removeBubbleById(pm.idB);
    let newSource;
    if (pm.op === "subtract") {
      newSource = "minuend";
    } else if (state.challengeOp === "subtract") {
      newSource =
        pm.sourceA === "subtrahend" && pm.sourceB === "subtrahend" ? "subtrahend" : "minuend";
    } else {
      newSource = "addend";
    }
    state.bubbles.push({
      id: nextId(),
      value: pm.result,
      x: pm.nx,
      y: pm.ny,
      source: newSource,
    });
    renderBubbles();
    spawnMergeFireworks();
    if (autoFusionActive) {
      bumpAutoFusionFuel();
    }
  }

  function getTutorialStep() {
    return TUTORIAL_SEQUENCE[state.tutorialStep] || null;
  }

  function syncTutorialStrip() {
    if (!els.tutorialStrip) return;
    if (state.playMode !== "tutorial") {
      els.tutorialStrip.hidden = true;
      return;
    }
    const step = getTutorialStep();
    if (!step) {
      els.tutorialStrip.hidden = true;
      return;
    }
    els.tutorialStrip.hidden = false;
    els.tutorialTitle.textContent = step.title;
    els.tutorialBody.textContent = step.body;
  }

  function applyTutorialScreenClass() {
    if (!els.screenGame) return;
    els.screenGame.classList.toggle("screen--tutorial", state.playMode === "tutorial");
    els.screenGame.classList.toggle("screen--mystery", state.playMode === "mystery");
  }

  function exitTutorialCleanup() {
    state.playMode = "add_only";
    state.tutorialStep = 0;
    applyTutorialScreenClass();
    syncTutorialStrip();
    const addRadio = document.querySelector('input[name="play-mode"][value="add_only"]');
    if (addRadio) {
      addRadio.checked = true;
    }
  }

  function syncMysteryChrome() {
    if (els.equation) {
      els.equation.classList.toggle("equation--mystery", state.playMode === "mystery");
    }
    if (els.playArea) {
      els.playArea.classList.toggle(
        "play-area--mystery",
        state.playMode === "mystery" && !els.screenGame.hidden,
      );
    }
    if (els.mysteryTarget) {
      const show = state.playMode === "mystery" && !els.screenGame.hidden;
      els.mysteryTarget.hidden = !show;
      if (!show) {
        els.mysteryTarget.classList.remove(
          "mystery-target--active",
          "mystery-target--wrong",
          "mystery-target--success",
        );
      }
    }
    if (els.btnMysteryHelp) {
      els.btnMysteryHelp.hidden =
        state.playMode !== "mystery" || els.screenGame.hidden;
    }
  }

  function syncEquation() {
    els.hudChallenge.textContent = String(state.challengeIndex);
    syncDifficultyHud();

    if (state.playMode === "mystery") {
      const q = "?";
      els.eqLeft.textContent = state.hiddenPosition === "left" ? q : String(state.leftNumber);
      els.eqOp.textContent = state.challengeOp === "subtract" ? "−" : "+";
      els.eqRight.textContent = state.hiddenPosition === "right" ? q : String(state.rightNumber);
      els.eqResult.textContent = String(state.expectedResult);
      els.eqLeft.classList.toggle("equation__part--mystery", state.hiddenPosition === "left");
      els.eqRight.classList.toggle("equation__part--mystery", state.hiddenPosition === "right");
      syncMysteryChrome();
      return;
    }

    els.eqLeft.classList.remove("equation__part--mystery");
    els.eqRight.classList.remove("equation__part--mystery");
    els.eqLeft.textContent = String(state.leftNumber);
    els.eqOp.textContent = state.challengeOp === "subtract" ? "−" : "+";
    els.eqRight.textContent = String(state.rightNumber);
    els.eqResult.textContent = "?";
    syncMysteryChrome();
  }

  function clearBubbleEls() {
    bubblesHostEl().querySelectorAll(".bubble").forEach((n) => n.remove());
  }

  function pxFromPercent(pxW, pxH, xPct, yPct) {
    return {
      x: (xPct / 100) * pxW,
      y: (yPct / 100) * pxH,
    };
  }

  function placeBubbleEl(el, xPct, yPct) {
    el.style.left = xPct + "%";
    el.style.top = yPct + "%";
  }

  function bubbleEligibleForMergeHint(b) {
    if (state.challengeOp === "subtract" && b.source === "subtrahend") return false;
    return true;
  }

  function computeMergeHintStats(bubbles) {
    let tens = 0;
    let has5 = false;
    let small = 0;
    for (const b of bubbles) {
      if (!bubbleEligibleForMergeHint(b)) continue;
      const v = b.value;
      if (v > 0 && v % 10 === 0) tens += 1;
      if (v === 5) has5 = true;
      if (v >= 1 && v < 5) small += 1;
    }
    return {
      multiTens: tens >= 2,
      fiveAndSmall: has5 && small >= 1,
    };
  }

  function mergeHintClassForBubble(b, stats) {
    if (!bubbleEligibleForMergeHint(b)) return "";
    const v = b.value;
    if (stats.multiTens && v > 0 && v % 10 === 0) return " bubble--hint-priority";
    if (!stats.multiTens && stats.fiveAndSmall && (v === 5 || (v >= 1 && v < 5))) {
      return " bubble--hint-secondary";
    }
    return "";
  }

  function createBubbleEl(b, hintStats) {
    const el = document.createElement("div");
    el.className =
      "bubble" +
      (b.source === "subtrahend" ? " bubble--subtrahend" : "") +
      mergeHintClassForBubble(b, hintStats);
    el.dataset.id = b.id;
    el.setAttribute("role", "button");
    el.setAttribute(
      "aria-label",
      b.source === "subtrahend" ? "Sustraendo, valor " + b.value : "Burbuja valor " + b.value
    );
    const inner = document.createElement("span");
    inner.className = "bubble__inner";
    inner.textContent = String(b.value);
    el.appendChild(inner);
    placeBubbleEl(el, b.x, b.y);
    el.addEventListener("pointerdown", onBubblePointerDown);
    bubblesHostEl().appendChild(el);
    return el;
  }

  function renderBubbles() {
    clearBubbleEls();
    const hintStats = computeMergeHintStats(state.bubbles);
    for (const b of state.bubbles) {
      createBubbleEl(b, hintStats);
    }
    checkPuzzleCompleteAuto();
    updateHelpBanner();
  }

  function checkPuzzleCompleteAuto() {
    if (state.playMode === "mystery") return;
    if (els.screenGame.hidden) return;
    if (!els.modal.hidden || !els.mergeModal.hidden) return;
    if (state.bubbles.length !== 1) return;
    if (state.bubbles[0].value !== state.expectedResult) return;
    applyScoreDelta(pointsForOperandSum(state.expectedResult));
    openSuccessModal();
  }

  /** Reto de suma: cualquier fusión suma. Resta: solo cruce minuendo ↔ sustraendo resta; el resto suma (recomponer). */
  function mergeOpForPair(b, partner) {
    if (state.playMode === "mystery" && state.mysteryType === "missing_minuend") {
      return "add";
    }
    if (state.challengeOp !== "subtract") return "add";
    const aMin = b.source === "minuend";
    const bMin = partner.source === "minuend";
    const aSub = b.source === "subtrahend";
    const bSub = partner.source === "subtrahend";
    if ((aMin && bSub) || (aSub && bMin)) return "subtract";
    return "add";
  }

  /** @returns {{ minuendVal: number, subVal: number } | null} */
  function subtractCrossValues(b, partner) {
    if (mergeOpForPair(b, partner) !== "subtract") return null;
    if (b.source === "minuend" && partner.source === "subtrahend") {
      return { minuendVal: b.value, subVal: partner.value };
    }
    if (b.source === "subtrahend" && partner.source === "minuend") {
      return { minuendVal: partner.value, subVal: b.value };
    }
    return null;
  }

  /** En restas no permitimos resultados negativos (minuendo menor que el sustraendo). */
  function isBlockedSubtractionMerge(b, partner) {
    const sv = subtractCrossValues(b, partner);
    if (!sv) return false;
    return sv.minuendVal < sv.subVal;
  }

  function feedbackBlockedSubtraction(b, partner) {
    setHelpStickySecondary(
      "No podés restar si la parte del minuendo es más chica que el sustraendo. Usá una pieza del minuendo mayor o igual al rojo, o sumá antes partes del minuendo."
    );
    for (const id of [b.id, partner.id]) {
      const bel = els.playArea.querySelector('.bubble[data-id="' + id + '"]');
      if (bel) {
        bel.classList.remove("bubble--shake");
        void bel.offsetWidth;
        bel.classList.add("bubble--shake");
      }
    }
  }

  function initialBubbleLayout() {
    const isSub = state.challengeOp === "subtract";
    return [
      {
        id: nextId(),
        value: state.leftNumber,
        x: 28,
        y: 38,
        source: isSub ? "minuend" : "addend",
      },
      {
        id: nextId(),
        value: state.rightNumber,
        x: 72,
        y: 38,
        source: isSub ? "subtrahend" : "addend",
      },
    ];
  }

  function initialMysteryBubbleLayout() {
    const t = state.mysteryType;
    if (t === "missing_addend") {
      return [
        {
          id: nextId(),
          value: /** @type {number} */ (state.rightNumber),
          x: 28,
          y: 38,
          source: /** @type {const} */ ("addend"),
        },
        {
          id: nextId(),
          value: state.expectedResult,
          x: 72,
          y: 38,
          source: "addend",
        },
      ];
    }
    if (t === "missing_subtrahend") {
      return [
        {
          id: nextId(),
          value: /** @type {number} */ (state.leftNumber),
          x: 28,
          y: 38,
          source: "minuend",
        },
        {
          id: nextId(),
          value: state.expectedResult,
          x: 72,
          y: 38,
          source: "minuend",
        },
      ];
    }
    if (t === "missing_minuend") {
      return [
        {
          id: nextId(),
          value: /** @type {number} */ (state.rightNumber),
          x: 28,
          y: 38,
          source: "subtrahend",
        },
        {
          id: nextId(),
          value: state.expectedResult,
          x: 72,
          y: 38,
          source: "minuend",
        },
      ];
    }
    return initialBubbleLayout();
  }

  function challengePrimaryLine() {
    const a = state.leftNumber;
    const b = state.rightNumber;
    const t = state.expectedResult;
    if (state.challengeOp === "add") {
      return (
        "Suma: " + a + " + " + b + " = " + t + ". Objetivo: una sola burbuja con " + t + "."
      );
    }
    return (
      "Resta: " +
      a +
      " − " +
      b +
      " = " +
      t +
      ". Objetivo: una burbuja con " +
      t +
      " (las rojas son el sustraendo)."
    );
  }

  function isFreshChallengeLayout() {
    if (state.playMode === "mystery") return false;
    if (state.bubbles.length !== 2) return false;
    const xs = state.bubbles.map((bb) => bb.value).sort((p, q) => p - q);
    const lo = Math.min(state.leftNumber, state.rightNumber);
    const hi = Math.max(state.leftNumber, state.rightNumber);
    return xs[0] === lo && xs[1] === hi;
  }

  function countDecomposableOnBoard() {
    let n = 0;
    for (const bb of state.bubbles) {
      if (decomposePartsForBubble(bb)) n += 1;
    }
    return n;
  }

  function suggestForSumPair(a, b) {
    if (a % 10 === 0 || b % 10 === 0) {
      return "Empezá por el número redondo o descomponé el otro en decenas y unidades.";
    }
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const dp =
      pickDecadePlusUnits(big) ||
      pickTenPlusWhenMultipleOfTenOnBoard(big, [small]) ||
      pickComplementTenSplit(big, [small]) ||
      decomposePartsClassic(big);
    if (dp) {
      return (
        "Probá descomponer " +
        big +
        " en " +
        dp[0] +
        " + " +
        dp[1] +
        " para sumar paso a paso con " +
        small +
        "."
      );
    }
    return "Tocá una burbuja para descomponer o arrastrá para acercarlas y sumar.";
  }

  function buildSecondaryAddition(hintStats) {
    const a = state.leftNumber;
    const b = state.rightNumber;
    const target = state.expectedResult;

    if (hintStats.multiTens) {
      return "En la mesa hay varias decenas: sumá primero esas piezas (resplandor dorado).";
    }
    if (hintStats.fiveAndSmall) {
      return "Tenés un 5 y piezas del 1 al 4: encajan bien entre sí (resplandor celeste).";
    }

    if (state.bubbles.length === 1) {
      const only = state.bubbles[0];
      if (only.value !== target) {
        return "La pieza debería ser " + target + "; fusioná o descomponé para ajustar.";
      }
      return "";
    }

    if (isFreshChallengeLayout()) {
      return suggestForSumPair(a, b);
    }

    const dc = countDecomposableOnBoard();
    if (dc >= 1 && state.bubbles.length >= 3) {
      return (
        "Seguí: podés descomponer una de las " +
        dc +
        " burbujas elegibles o fusionar dos que quieras combinar."
      );
    }

    return "Acercá burbujas para fusionar: el total sigue representando la misma suma.";
  }

  function buildSecondarySubtraction(hintStats) {
    const subParts = state.bubbles.filter((bb) => bb.source === "subtrahend");
    const minParts = state.bubbles.filter((bb) => bb.source === "minuend");

    if (hintStats.multiTens) {
      return "Varias decenas en el minuendo: sumalas primero si conviene (resplandor dorado).";
    }
    if (hintStats.fiveAndSmall) {
      return "En el minuendo, el 5 y las piezas 1–4 combinan bien (resplandor celeste).";
    }

    if (isFreshChallengeLayout()) {
      return (
        "Restá acercando rojo al minuendo cuando la pieza celeste sea ≥ al sustraendo, o descomponé para igualar cantidades."
      );
    }

    if (subParts.length >= 2) {
      const subVals = subParts.map((bb) => bb.value).join(", ");
      return (
        "Hay varias piezas rojas (" +
        subVals +
        "): restá cada una contra una pieza del minuendo mayor o igual."
      );
    }

    if (subParts.length === 1 && minParts.length >= 2) {
      const mvs = minParts.map((bb) => bb.value).join(", ");
      return (
        "Sustraendo " +
        subParts[0].value +
        ": juntalo con una pieza del minuendo ≥ " +
        subParts[0].value +
        ", o sumá antes partes del minuendo (" +
        mvs +
        ")."
      );
    }

    return "Sumá piezas celestes si hace falta; restá solo cruzando minuendo (celeste) con sustraendo (rojo).";
  }

  function buildMysteryHelpBannerContent() {
    let primary = "";
    let secondary = "";
    if (state.mysteryType === "missing_addend") {
      primary =
        "Cajita + " +
        state.rightNumber +
        " = " +
        state.expectedResult +
        ". Encuentra la parte que falta.";
      secondary = "Rompe el total para ver qué parte ya tenés y cuál falta.";
    } else if (state.mysteryType === "missing_subtrahend") {
      primary =
        state.leftNumber +
        " − cajita = " +
        state.expectedResult +
        ". Encuentra lo que se fue.";
      secondary = "Rompe el número inicial en lo que quedó y lo que se quitó.";
    } else if (state.mysteryType === "missing_minuend") {
      primary =
        "Cajita − " +
        state.rightNumber +
        " = " +
        state.expectedResult +
        ". Reconstruye el número inicial.";
      secondary = "Junta lo que quedó con lo que se quitó.";
    }
    if (autoFusionActive) {
      secondary = "Autofusión activa (piezas simples sin modal y puntos ×2). " + secondary;
    }
    return { primary, secondary: secondary.trim() };
  }

  function buildHelpBannerContent() {
    if (state.playMode === "mystery") {
      return buildMysteryHelpBannerContent();
    }
    const primary = challengePrimaryLine();
    const hintStats = computeMergeHintStats(state.bubbles);
    let secondary =
      state.challengeOp === "add"
        ? buildSecondaryAddition(hintStats)
        : buildSecondarySubtraction(hintStats);

    if (autoFusionActive) {
      secondary = "Autofusión activa (piezas simples sin modal y puntos ×2). " + secondary;
    }

    return { primary, secondary: secondary.trim() };
  }

  function setHelpStickySecondary(text) {
    helpStickySecondary = text;
    updateHelpBanner();
  }

  function clearHelpStickySecondary() {
    if (helpStickySecondary === null) return;
    helpStickySecondary = null;
    updateHelpBanner();
  }

  function updateHelpBanner() {
    if (!els.helpPrimary) return;
    if (els.screenGame.hidden) {
      els.helpPrimary.textContent = "";
      if (els.helpSecondary) {
        els.helpSecondary.textContent = "";
        els.helpSecondary.hidden = true;
      }
      return;
    }
    const { primary, secondary } = buildHelpBannerContent();
    els.helpPrimary.textContent = primary;
    if (helpStickySecondary) {
      els.helpSecondary.textContent = helpStickySecondary;
      els.helpSecondary.hidden = false;
      els.helpSecondary.classList.remove("help-banner__secondary--muted");
      els.helpSecondary.classList.add("help-banner__secondary--alert");
    } else {
      els.helpSecondary.textContent = secondary;
      els.helpSecondary.hidden = secondary.length === 0;
      els.helpSecondary.classList.add("help-banner__secondary--muted");
      els.helpSecondary.classList.remove("help-banner__secondary--alert");
    }
  }

  function startChallenge(resetIndex) {
    closeMergeModalCancelled();
    clearHelpStickySecondary();
    if (state.playMode === "tutorial") {
      state.mysteryType = null;
      state.hiddenValue = null;
      state.hiddenPosition = null;
      const step = getTutorialStep();
      if (!step) {
        exitTutorialCleanup();
        showScreen("start");
        return;
      }
      state.challengeOp = step.op;
      state.leftNumber = step.left;
      state.rightNumber = step.right;
      state.expectedResult =
        step.op === "add" ? step.left + step.right : step.left - step.right;
      state.challengeIndex = state.tutorialStep + 1;
    } else if (state.playMode === "mystery") {
      const tier = tierFromScore(state.score);
      if (!resetIndex) {
        state.challengeIndex += 1;
      }
      const ch = generateMysteryChallenge(tier, state.challengeIndex);
      state.mysteryType = ch.mysteryType;
      state.challengeOp = ch.challengeOp;
      state.leftNumber = ch.leftNumber;
      state.rightNumber = ch.rightNumber;
      state.expectedResult = ch.expectedResult;
      state.hiddenValue = ch.hiddenValue;
      state.hiddenPosition = ch.hiddenPosition;
      state.bubbles = initialMysteryBubbleLayout();
      syncEquation();
      syncTutorialStrip();
      renderBubbles();
      return;
    } else {
      state.mysteryType = null;
      state.hiddenValue = null;
      state.hiddenPosition = null;
      const tier = tierFromScore(state.score);
      state.challengeOp = pickChallengeOp();
      const pair = generateChallengePair(tier, state.challengeOp);
      state.leftNumber = pair.a;
      state.rightNumber = pair.b;
      state.expectedResult = pair.sum;
      if (!resetIndex) {
        state.challengeIndex += 1;
      }
    }
    state.bubbles = initialBubbleLayout();
    syncEquation();
    syncTutorialStrip();
    renderBubbles();
  }

  function resetTurn() {
    closeMergeModalCancelled();
    clearHelpStickySecondary();
    state.bubbles =
      state.playMode === "mystery" ? initialMysteryBubbleLayout() : initialBubbleLayout();
    renderBubbles();
  }

  function newChallengeFromMenu() {
    if (state.playMode === "tutorial") return;
    startChallenge(false);
  }

  function findBubble(id) {
    return state.bubbles.find((b) => b.id === id) || null;
  }

  function removeBubbleById(id) {
    state.bubbles = state.bubbles.filter((b) => b.id !== id);
  }

  function playAreaRect() {
    return bubblesHostEl().getBoundingClientRect();
  }

  function spawnSplitParticles(bubbleEl) {
    const br = bubbleEl.getBoundingClientRect();
    const pr = bubblesHostEl().getBoundingClientRect();
    const cx = br.left + br.width / 2 - pr.left;
    const cy = br.top + br.height / 2 - pr.top;
    const colors = ["#7cffdf", "#c084fc", "#fef08a", "#ffffff", "#38bdf8"];
    const n = 14;
    for (let i = 0; i < n; i += 1) {
      const p = document.createElement("span");
      p.className = "split-particle";
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.35;
      const dist = 32 + Math.random() * 44;
      p.style.setProperty("--split-dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--split-dy", Math.sin(ang) * dist + "px");
      p.style.background = colors[i % colors.length];
      bubblesHostEl().appendChild(p);
      window.setTimeout(() => p.remove(), 650);
    }
  }

  function applyEmergeFromSplit(parentX, parentY, childIds) {
    const r = playAreaRect();
    const w = r.width;
    const h = r.height;
    for (const id of childIds) {
      const b = findBubble(id);
      if (!b) continue;
      const el = els.playArea.querySelector('.bubble[data-id="' + id + '"]');
      if (!el) continue;
      const fromX = ((parentX - b.x) / 100) * w;
      const fromY = ((parentY - b.y) / 100) * h;
      el.style.setProperty("--split-from-x", fromX + "px");
      el.style.setProperty("--split-from-y", fromY + "px");
      el.classList.add("bubble--emerge");
      el.addEventListener(
        "animationend",
        (e) => {
          const name = e.animationName || "";
          if (!name.includes("bubble-emerge-from-split")) return;
          el.classList.remove("bubble--emerge");
          el.style.removeProperty("--split-from-x");
          el.style.removeProperty("--split-from-y");
        },
        { once: true }
      );
    }
  }

  function finalizeDecompose(b, v1, v2, x1, y1, x2, y2, ox, oy, id1, id2) {
    removeBubbleById(b.id);
    state.bubbles.push(
      { id: id1, value: v1, x: x1, y: y1, source: b.source },
      { id: id2, value: v2, x: x2, y: y2, source: b.source }
    );
    renderBubbles();
    if (!prefersReducedMotion()) {
      applyEmergeFromSplit(ox, oy, [id1, id2]);
    }
    decomposeAnimating = false;
    if (autoFusionActive) {
      bumpAutoFusionFuel();
      ensureFusionDrainLoop();
    }
  }

  function bubbleCenterClient(b) {
    const r = playAreaRect();
    const p = pxFromPercent(r.width, r.height, b.x, b.y);
    return { x: r.left + p.x, y: r.top + p.y };
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function clearMysteryHelpHighlights() {
    els.playArea.querySelectorAll(".bubble--mystery-help").forEach((n) => {
      n.classList.remove("bubble--mystery-help");
    });
  }

  function highlightMysteryBubbles(pred) {
    for (const bb of state.bubbles) {
      if (pred(bb)) {
        const bel = els.playArea.querySelector('.bubble[data-id="' + bb.id + '"]');
        if (bel) bel.classList.add("bubble--mystery-help");
      }
    }
  }

  function isPointInsideMysteryTarget(clientX, clientY) {
    const target = els.mysteryTarget;
    if (!target || target.hidden) return false;
    const rect = target.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  function showMysteryWrongFeedback(bubbleEl) {
    let msg = "Probá otra vez.";
    if (state.mysteryType === "missing_addend") {
      msg = "Todavía no. Busca qué número falta para llegar al total.";
    } else if (state.mysteryType === "missing_subtrahend") {
      msg = "Casi. La cajita representa lo que se quitó.";
    } else if (state.mysteryType === "missing_minuend") {
      msg = "Recuerda: junta lo que quedó con lo que se quitó.";
    }
    setHelpStickySecondary(msg);
    if (els.mysteryTarget) {
      els.mysteryTarget.classList.remove("mystery-target--wrong");
      void els.mysteryTarget.offsetWidth;
      els.mysteryTarget.classList.add("mystery-target--wrong");
    }
    if (bubbleEl) {
      bubbleEl.classList.remove("bubble--shake");
      void bubbleEl.offsetWidth;
      bubbleEl.classList.add("bubble--shake");
    }
  }

  function mysterySuccessMessage() {
    if (state.mysteryType === "missing_addend") {
      return (
        "¡Excelente! La cajita era " +
        state.hiddenValue +
        ". " +
        state.hiddenValue +
        " + " +
        state.rightNumber +
        " = " +
        state.expectedResult +
        "."
      );
    }
    if (state.mysteryType === "missing_subtrahend") {
      return (
        "¡Bien! Se fueron " +
        state.hiddenValue +
        ". " +
        state.leftNumber +
        " − " +
        state.hiddenValue +
        " = " +
        state.expectedResult +
        "."
      );
    }
    if (state.mysteryType === "missing_minuend") {
      return (
        "¡Excelente! Empezaste con " +
        state.hiddenValue +
        ". " +
        state.hiddenValue +
        " − " +
        state.rightNumber +
        " = " +
        state.expectedResult +
        "."
      );
    }
    return "¡Excelente! Encontraste el número escondido.";
  }

  function tryPlaceOnMysteryTarget(b, bubbleEl, dragState) {
    clearHelpStickySecondary();
    if (state.hiddenValue != null && b.value === state.hiddenValue) {
      removeBubbleById(b.id);
      applyScoreDelta(pointsForOperandSum(state.hiddenValue));
      renderBubbles();
      if (els.mysteryTarget) {
        els.mysteryTarget.classList.remove("mystery-target--wrong");
        els.mysteryTarget.classList.add("mystery-target--success");
      }
      openSuccessModal();
      window.setTimeout(() => {
        if (els.mysteryTarget) els.mysteryTarget.classList.remove("mystery-target--success");
      }, 650);
      return;
    }
    b.x = dragState.origX;
    b.y = dragState.origY;
    if (bubbleEl) placeBubbleEl(bubbleEl, b.x, b.y);
    showMysteryWrongFeedback(bubbleEl);
  }

  function onBubblePointerDown(ev) {
    if (!els.mergeModal.hidden) return;
    clearHelpStickySecondary();
    clearMysteryHelpHighlights();
    const el = ev.currentTarget;
    const id = el.dataset.id;
    const b = findBubble(id);
    if (!b) return;
    ev.preventDefault();
    el.setPointerCapture(ev.pointerId);
    const center = bubbleCenterClient(b);
    drag = {
      id,
      pointerId: ev.pointerId,
      startClient: { x: ev.clientX, y: ev.clientY },
      grabOffset: {
        x: ev.clientX - center.x,
        y: ev.clientY - center.y,
      },
      moved: false,
      origX: b.x,
      origY: b.y,
    };
    el.classList.add("bubble--dragging");
    clearMergeHighlights();
  }

  function moveBubbleToClient(el, b, clientX, clientY, grabOffset) {
    const r = playAreaRect();
    const cx = clientX - grabOffset.x;
    const cy = clientY - grabOffset.y;
    const lx = cx - r.left;
    const ly = cy - r.top;
    const nx = (lx / r.width) * 100;
    const ny = (ly / r.height) * 100;
    b.x = Math.min(96, Math.max(4, nx));
    b.y = Math.min(92, Math.max(8, ny));
    placeBubbleEl(el, b.x, b.y);
  }

  function highlightMergeCandidates(activeId, centerX, centerY) {
    const pt = { x: centerX, y: centerY };
    clearMergeHighlights();
    const self = findBubble(activeId);
    if (!self) return;
    for (const o of state.bubbles) {
      if (o.id === activeId) continue;
      const c = bubbleCenterClient(o);
      if (distance(pt, c) < MERGE_DISTANCE_PX) {
        if (isBlockedSubtractionMerge(self, o)) {
          return;
        }
        const elA = els.playArea.querySelector('.bubble[data-id="' + activeId + '"]');
        const elO = els.playArea.querySelector('.bubble[data-id="' + o.id + '"]');
        if (elA) elA.classList.add("bubble--merge-target");
        if (elO) elO.classList.add("bubble--merge-target");
        break;
      }
    }
  }

  function clearMergeHighlights() {
    els.playArea.querySelectorAll(".bubble--merge-target").forEach((n) => {
      n.classList.remove("bubble--merge-target");
    });
  }

  function openMergeModal(b, partner) {
    if (isBlockedSubtractionMerge(b, partner)) {
      return;
    }
    const pm = buildMergePayload(b, partner);
    pendingMerge = pm;
    const promptText =
      pm.op === "add"
        ? pm.v1 + " + " + pm.v2
        : b.source === "minuend" && partner.source === "subtrahend"
          ? b.value + " − " + partner.value
          : partner.value + " − " + b.value;
    els.mergeTitle.textContent = pm.op === "subtract" ? "Restar burbujas" : "Sumar burbujas";
    els.mergePrompt.textContent = promptText;
    const gain = pointsForOperandSum(pm.scoreBasis);
    const pen = penaltyForOperandSum(pm.scoreBasis);
    const gainShow = autoFusionActive ? gain * 2 : gain;
    let hint =
      "Escribe el resultado. Si aciertas: +" +
      gainShow +
      " pts. Si fallas: −" +
      pen +
      " pts (el puntaje no baja de 0).";
    if (autoFusionActive) {
      hint += " Modo autofusión: los puntos ganados valen el doble.";
    }
    els.mergeHint.textContent = hint;
    els.mergeAnswer.value = "";
    els.mergeFeedback.hidden = true;
    els.mergeFeedback.textContent = "";
    els.mergeFeedback.classList.remove("merge-form__feedback--ok");
    els.mergeModal.hidden = false;
    els.mergeModal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      els.mergeAnswer.focus();
      els.mergeAnswer.select();
    }, 50);
  }

  function hideMergeModalUI() {
    els.mergeModal.hidden = true;
    els.mergeModal.setAttribute("aria-hidden", "true");
    els.mergeFeedback.hidden = true;
    els.mergeFeedback.textContent = "";
    els.mergeFeedback.classList.remove("merge-form__feedback--ok");
    els.mergeAnswer.value = "";
  }

  function closeMergeModalCancelled() {
    pendingMerge = null;
    hideMergeModalUI();
  }

  function executePendingMerge() {
    if (!pendingMerge) return;
    const pm = pendingMerge;
    pendingMerge = null;
    hideMergeModalUI();
    rememberLearnedAddFromSuccessfulModal(pm);
    runMergeCore(pm);
    onSuccessfulModalMerge();
  }

  function spawnMergeFireworks() {
    const rect = document.body.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height * 0.4;
    const colors = ["#7cffdf", "#fde047", "#f472b6", "#c084fc", "#38bdf8", "#ffffff"];
    const waves = 3;
    const perWave = 40;
    for (let w = 0; w < waves; w += 1) {
      window.setTimeout(() => {
        for (let i = 0; i < perWave; i += 1) {
          const p = document.createElement("span");
          p.className = "firework-ray";
          p.style.left = cx + (Math.random() * 24 - 12) + "px";
          p.style.top = cy + (Math.random() * 24 - 12) + "px";
          p.style.background = colors[i % colors.length];
          const ang = (Math.PI * 2 * i) / perWave + Math.random() * 0.25;
          const dist = 100 + Math.random() * 160;
          p.style.setProperty("--fw-dx", Math.cos(ang) * dist + "px");
          p.style.setProperty("--fw-dy", Math.sin(ang) * dist + "px");
          p.style.animationDuration = 0.85 + Math.random() * 0.25 + "s";
          els.confetti.appendChild(p);
          window.setTimeout(() => p.remove(), 1300);
        }
      }, w * 130);
    }
  }

  function tryMergeOrPlace(b, el, centerX, centerY, dragState) {
    const selfCenter = { x: centerX, y: centerY };
    let partner = null;
    let best = MERGE_DISTANCE_PX;
    for (const o of state.bubbles) {
      if (o.id === b.id) continue;
      const c = bubbleCenterClient(o);
      const d = distance(selfCenter, c);
      if (d < best) {
        best = d;
        partner = o;
      }
    }
    if (partner && best < MERGE_DISTANCE_PX) {
      if (isBlockedSubtractionMerge(b, partner)) {
        if (dragState) {
          b.x = dragState.origX;
          b.y = dragState.origY;
          if (el) placeBubbleEl(el, b.x, b.y);
        }
        feedbackBlockedSubtraction(b, partner);
        return true;
      }
      if (isPrimitiveAutoFuseMerge(b, partner)) {
        const pm = buildMergePayload(b, partner);
        runMergeCore(pm);
        return true;
      }
      if (isLearnedInstantAddMerge(b, partner)) {
        const pm = buildMergePayload(b, partner);
        runMergeCore(pm);
        return true;
      }
      openMergeModal(b, partner);
      return true;
    }
    return false;
  }

  function spawnConfetti() {
    els.confetti.innerHTML = "";
    const colors = ["#7cffdf", "#c084fc", "#fde047", "#f472b6", "#38bdf8"];
    const rect = document.body.getBoundingClientRect();
    for (let i = 0; i < 36; i += 1) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      p.style.left = Math.random() * rect.width + "px";
      p.style.top = -20 + Math.random() * 40 + "px";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = 1.4 + Math.random() * 0.8 + "s";
      els.confetti.appendChild(p);
    }
    window.setTimeout(() => {
      els.confetti.innerHTML = "";
    }, 2200);
  }

  function openSuccessModal() {
    closeMergeModalCancelled();
    const opLabel = state.challengeOp === "subtract" ? " − " : " + ";
    if (state.playMode === "tutorial") {
      const isLast = state.tutorialStep >= TUTORIAL_SEQUENCE.length - 1;
      els.modalMsg.textContent =
        state.leftNumber +
        opLabel +
        state.rightNumber +
        " = " +
        state.expectedResult +
        ". " +
        (isLast
          ? "Completaste el último paso del tutorial."
          : "Resolviste este paso. El siguiente introduce otra idea clave.");
      els.modalNext.textContent = isLast ? "Terminar tutorial" : "Siguiente paso";
    } else if (state.playMode === "mystery") {
      els.modalMsg.textContent = mysterySuccessMessage() + " Llevas " + state.score + " pts.";
      els.modalNext.textContent = "Siguiente reto";
    } else {
      els.modalMsg.textContent =
        state.leftNumber +
        opLabel +
        state.rightNumber +
        " = " +
        state.expectedResult +
        ". Usaste descomposición y fusión para llegar al resultado. " +
        "Llevas " +
        state.score +
        " pts.";
      els.modalNext.textContent = "Siguiente reto";
    }
    els.modal.hidden = false;
    els.modal.setAttribute("aria-hidden", "false");
    spawnConfetti();
  }

  function closeSuccessModal() {
    els.modal.hidden = true;
    els.modal.setAttribute("aria-hidden", "true");
  }

  function decomposeBlockedMessage(value) {
    if (value < MIN_DECOMPOSE) {
      return (
        "Los números menores que " +
        MIN_DECOMPOSE +
        " no se descomponen: son piezas base. Combínalos con otras burbujas."
      );
    }
    if (value === 5) {
      return "El 5 ya es una pieza clave. Combínalo con otro número para seguir.";
    }
    return "Esa burbuja ya no se puede dividir más. Combínala con otra.";
  }

  function tryDecompose(b) {
    const parts = decomposePartsForBubble(b);
    if (!parts) {
      const el = els.playArea.querySelector('.bubble[data-id="' + b.id + '"]');
      if (el) {
        el.classList.remove("bubble--shake");
        void el.offsetWidth;
        el.classList.add("bubble--shake");
      }
      setHelpStickySecondary(decomposeBlockedMessage(b.value));
      return;
    }

    if (decomposeAnimating) return;

    const [v1, v2] = parts;
    const ox = b.x;
    const oy = b.y;
    const x1 = Math.max(6, ox - 10);
    const y1 = Math.min(86, oy + 6);
    const x2 = Math.min(94, ox + 10);
    const y2 = Math.min(86, oy + 6);
    const id1 = nextId();
    const id2 = nextId();

    const el = els.playArea.querySelector('.bubble[data-id="' + b.id + '"]');
    if (!el || prefersReducedMotion()) {
      decomposeAnimating = true;
      finalizeDecompose(b, v1, v2, x1, y1, x2, y2, ox, oy, id1, id2);
      return;
    }

    decomposeAnimating = true;
    spawnSplitParticles(el);
    el.classList.add("bubble--splitting");

    let finalized = false;
    const run = () => {
      if (finalized) return;
      finalized = true;
      finalizeDecompose(b, v1, v2, x1, y1, x2, y2, ox, oy, id1, id2);
    };

    const fallbackMs = 580;
    const tid = window.setTimeout(run, fallbackMs);
    el.addEventListener(
      "animationend",
      (e) => {
        if (e.target !== el) return;
        const name = e.animationName || "";
        if (!name.includes("bubble-splitting")) return;
        window.clearTimeout(tid);
        run();
      },
      { once: true }
    );
  }

  function onPointerMove(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const el = els.playArea.querySelector('.bubble[data-id="' + drag.id + '"]');
    const b = findBubble(drag.id);
    if (!el || !b) return;
    const dx = ev.clientX - drag.startClient.x;
    const dy = ev.clientY - drag.startClient.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }
    if (drag.moved) {
      moveBubbleToClient(el, b, ev.clientX, ev.clientY, drag.grabOffset);
      const cx = ev.clientX - drag.grabOffset.x;
      const cy = ev.clientY - drag.grabOffset.y;
      highlightMergeCandidates(drag.id, cx, cy);
      if (state.playMode === "mystery" && els.mysteryTarget && !els.mysteryTarget.hidden) {
        els.mysteryTarget.classList.toggle(
          "mystery-target--active",
          isPointInsideMysteryTarget(ev.clientX, ev.clientY),
        );
      }
    }
  }

  function onPointerUp(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const el = els.playArea.querySelector('.bubble[data-id="' + drag.id + '"]');
    const b = findBubble(drag.id);
    const hadDrag = drag;
    drag = null;
    clearMergeHighlights();
    if (els.mysteryTarget) {
      els.mysteryTarget.classList.remove("mystery-target--active");
    }
    if (el) {
      el.releasePointerCapture(ev.pointerId);
      el.classList.remove("bubble--dragging");
    }
    if (!b) return;
    if (!hadDrag.moved) {
      tryDecompose(b);
      return;
    }
    const cx = ev.clientX - hadDrag.grabOffset.x;
    const cy = ev.clientY - hadDrag.grabOffset.y;
    if (
      state.playMode === "mystery" &&
      hadDrag.moved &&
      isPointInsideMysteryTarget(ev.clientX, ev.clientY)
    ) {
      tryPlaceOnMysteryTarget(b, el, hadDrag);
      return;
    }
    if (tryMergeOrPlace(b, el, cx, cy, hadDrag)) {
      return;
    }
  }

  function bindGlobalPointer() {
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  }

  if (els.btnMysteryHelp) {
    els.btnMysteryHelp.addEventListener("click", () => {
      if (state.playMode !== "mystery" || els.screenGame.hidden) return;
      clearHelpStickySecondary();
      clearMysteryHelpHighlights();
      if (state.mysteryType === "missing_addend") {
        setHelpStickySecondary("Rompe el total.");
        highlightMysteryBubbles((bb) => bb.value === state.expectedResult);
      } else if (state.mysteryType === "missing_subtrahend") {
        setHelpStickySecondary("Rompe el número inicial.");
        highlightMysteryBubbles((bb) => bb.value === state.leftNumber);
      } else if (state.mysteryType === "missing_minuend") {
        setHelpStickySecondary("Junta lo que quedó con lo que se quitó.");
        highlightMysteryBubbles(() => true);
      }
    });
  }

  els.btnPlay.addEventListener("click", () => {
    const sel = document.querySelector('input[name="play-mode"]:checked');
    state.playMode = sel ? sel.value : "add_only";
    state.tutorialStep = 0;
    cancelFusionDrainLoop();
    exitAutoFusionMode();
    consecutiveModalCorrect = 0;
    updateFusionBarUi();
    cancelAnimationFrame(scoreAnimId);
    state.score = 0;
    scoreShown = 0;
    els.hudScore.textContent = "0";
    state.challengeIndex = 0;
    showScreen("game");
    applyTutorialScreenClass();
    startChallenge(false);
  });

  els.btnHome.addEventListener("click", () => {
    closeSuccessModal();
    closeMergeModalCancelled();
    cancelFusionDrainLoop();
    exitAutoFusionMode();
    consecutiveModalCorrect = 0;
    updateFusionBarUi();
    if (state.playMode === "tutorial") {
      exitTutorialCleanup();
    }
    showScreen("start");
  });

  els.btnReset.addEventListener("click", resetTurn);

  els.btnNew.addEventListener("click", newChallengeFromMenu);

  els.modalNext.addEventListener("click", () => {
    closeSuccessModal();
    if (state.playMode === "tutorial") {
      if (state.tutorialStep >= TUTORIAL_SEQUENCE.length - 1) {
        exitTutorialCleanup();
        showScreen("start");
        updateHelpBanner();
        return;
      }
      state.tutorialStep += 1;
      startChallenge(true);
      return;
    }
    newChallengeFromMenu();
  });

  els.modal.querySelectorAll("[data-close-modal]").forEach((n) => {
    n.addEventListener("click", () => {
      closeSuccessModal();
    });
  });

  els.mergeForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!pendingMerge) return;
    const raw = els.mergeAnswer.value.trim();
    const n = parseInt(raw, 10);
    if (raw === "" || Number.isNaN(n)) {
      els.mergeFeedback.textContent = "Escribe un número.";
      els.mergeFeedback.hidden = false;
      els.mergeFeedback.classList.remove("merge-form__feedback--ok");
      els.mergeAnswer.focus();
      return;
    }
    if (n !== pendingMerge.result) {
      applyScoreDelta(-penaltyForOperandSum(pendingMerge.scoreBasis));
      resetModalStreak();
      els.mergeFeedback.textContent = MERGE_WRONG_HINTS[mergeWrongIndex % MERGE_WRONG_HINTS.length];
      mergeWrongIndex += 1;
      els.mergeFeedback.hidden = false;
      els.mergeFeedback.classList.remove("merge-form__feedback--ok");
      els.mergeAnswer.value = "";
      els.mergeAnswer.focus();
      return;
    }
    executePendingMerge();
  });

  els.mergeModal.querySelectorAll("[data-close-merge]").forEach((n) => {
    n.addEventListener("click", () => {
      closeMergeModalCancelled();
    });
  });

  if (els.tutorialSkip) {
    els.tutorialSkip.addEventListener("click", () => {
      exitTutorialCleanup();
      showScreen("start");
      updateHelpBanner();
    });
  }

  bindGlobalPointer();
  updateHelpBanner();
  updateFusionBarUi();
})();
