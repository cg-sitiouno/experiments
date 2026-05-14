(function () {
  "use strict";

  const MERGE_DISTANCE_PX = 84;
  const DRAG_THRESHOLD_PX = 10;
  const MAX_SUM = 99;
  const MIN_DECOMPOSE = 5;
  const SCORE_PER_UNIT = 10;
  const GUIDE_LAST_CHALLENGE_INDEX = 9;

  const DIFFICULTY_TIER_2_AT = 400;
  const DIFFICULTY_TIER_3_AT = 1500;

  let idCounter = 0;
  function nextId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    idCounter += 1;
    return "mb-" + idCounter;
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function tierFromScore(score) {
    if (score >= DIFFICULTY_TIER_3_AT) return 3;
    if (score >= DIFFICULTY_TIER_2_AT) return 2;
    return 1;
  }

  function mysteryStageFromChallengeIndex(challengeIndex) {
    const phase = Math.floor((challengeIndex - 1) / 3);
    if (phase >= 3) return "mixed";
    return /** @type {const} */ (["missing_addend", "missing_subtrahend", "missing_minuend"])[phase];
  }

  function generateMysteryChallenge(tier, challengeIndex) {
    const stage = mysteryStageFromChallengeIndex(challengeIndex);
    const type =
      stage === "mixed"
        ? (["missing_addend", "missing_subtrahend", "missing_minuend"][randomInt(0, 2)])
        : stage;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (type === "missing_addend") {
        const a = randomInt(2, 9);
        const hiddenValue = randomInt(2, 9);
        const expectedResult = a + hiddenValue;
        if (expectedResult <= MAX_SUM) {
          return {
            mysteryType: /** @type {const} */ ("missing_addend"),
            challengeOp: /** @type {const} */ ("add"),
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
        const maxL = tier >= 3 ? Math.min(42, MAX_SUM - 1) : 18;
        const minL = tier >= 2 ? 10 : 6;
        const leftNumber = randomInt(minL, maxL);
        const expectedResult = randomInt(2, leftNumber - 2);
        const hiddenValue = leftNumber - expectedResult;
        if (hiddenValue >= 1 && expectedResult >= 1) {
          return {
            mysteryType: /** @type {const} */ ("missing_subtrahend"),
            challengeOp: /** @type {const} */ ("subtract"),
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
          mysteryType: /** @type {const} */ ("missing_minuend"),
          challengeOp: /** @type {const} */ ("subtract"),
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
   * Cuenta auxiliar en la mesa (misma idea que Bubble Math Lab).
   * @param {ReturnType<typeof generateMysteryChallenge>} ch
   */
  function deriveWorkspace(ch) {
    if (ch.mysteryType === "missing_addend") {
      return {
        workspaceChallengeOp: /** @type {const} */ ("subtract"),
        workspaceLeft: ch.expectedResult,
        workspaceRight: /** @type {number} */ (ch.rightNumber),
      };
    }
    if (ch.mysteryType === "missing_subtrahend") {
      return {
        workspaceChallengeOp: "subtract",
        workspaceLeft: /** @type {number} */ (ch.leftNumber),
        workspaceRight: ch.expectedResult,
      };
    }
    return {
      workspaceChallengeOp: "add",
      workspaceLeft: ch.expectedResult,
      workspaceRight: /** @type {number} */ (ch.rightNumber),
    };
  }

  function pickDecadePlusUnits(n) {
    if (!Number.isFinite(n) || n <= 10 || n % 10 === 0) return null;
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    if (ones === 0) return null;
    return [tens, ones];
  }

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

  function pickComplementTenSplit(n, otherValues) {
    if (!Number.isFinite(n) || n < 2 || !otherValues || otherValues.length === 0) return null;
    let bestPair = /** @type {null | [number, number]} */ (null);
    let bestLeftover = Infinity;
    let bestV = -1;
    const seen = new Set();
    for (const v of otherValues) {
      if (!Number.isFinite(v) || v < 1 || v > 9) continue;
      if (seen.has(v)) continue;
      seen.add(v);
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

  function decomposePartsForBubble(b) {
    const n = b.value;
    const decadeUnits = pickDecadePlusUnits(n);
    if (decadeUnits) return decadeUnits;

    const others = [];
    if (state.workspaceChallengeOp === "add") {
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
      state.workspaceChallengeOp === "add" ||
      (state.workspaceChallengeOp === "subtract" && b.source === "minuend");
    if (canFriend && others.length > 0) {
      const tenPlus = pickTenPlusWhenMultipleOfTenOnBoard(n, others);
      if (tenPlus) return tenPlus;
      const friend = pickComplementTenSplit(n, others);
      if (friend) return friend;
    }
    return decomposePartsClassic(n);
  }

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

  /** @type {{
   *   score: number,
   *   challengeIndex: number,
   *   guideStep: number,
   *   mesaHintVisible: boolean,
   *   mysteryType: null | 'missing_addend' | 'missing_subtrahend' | 'missing_minuend',
   *   challengeOp: 'add' | 'subtract',
   *   leftNumber: number | null,
   *   rightNumber: number | null,
   *   expectedResult: number,
   *   hiddenValue: number | null,
   *   hiddenPosition: null | 'left' | 'right',
   *   workspaceChallengeOp: 'add' | 'subtract',
   *   workspaceLeft: number,
   *   workspaceRight: number,
   *   bubbles: Array<{ id: string, value: number, x: number, y: number, source: 'addend' | 'minuend' | 'subtrahend' }>,
   * }} */
  const state = {
    score: 0,
    challengeIndex: 1,
    guideStep: 0,
    mesaHintVisible: false,
    mysteryType: null,
    challengeOp: "add",
    leftNumber: null,
    rightNumber: null,
    expectedResult: 8,
    hiddenValue: null,
    hiddenPosition: null,
    workspaceChallengeOp: "subtract",
    workspaceLeft: 8,
    workspaceRight: 4,
    bubbles: [],
  };

  let drag = null;
  let pendingMerge = null;
  let decomposeAnimating = false;
  let helpStickySecondary = null;

  const els = {
    screenStart: document.getElementById("screen-start"),
    screenGame: document.getElementById("screen-game"),
    btnPlay: document.getElementById("btn-play"),
    btnHome: document.getElementById("btn-home"),
    btnReset: document.getElementById("btn-reset"),
    btnNew: document.getElementById("btn-new"),
    btnHint: document.getElementById("btn-hint"),
    btnGuideNext: document.getElementById("btn-guide-next"),
    btnMysteryHelp: document.getElementById("btn-mystery-help"),
    hudScore: document.getElementById("hud-score"),
    hudChallenge: document.getElementById("hud-challenge"),
    hudStage: document.getElementById("hud-stage"),
    eqLeft: document.getElementById("eq-left"),
    eqOp: document.getElementById("eq-op"),
    eqRight: document.getElementById("eq-right"),
    eqResult: document.getElementById("eq-result"),
    playSurface: document.getElementById("play-surface"),
    mesaHintBoard: document.getElementById("mesa-hint-board"),
    mesaHintEquation: document.getElementById("mesa-hint-equation"),
    footerPrimary: document.getElementById("footer-instruction-primary"),
    footerSecondary: document.getElementById("footer-instruction-secondary"),
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

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isGuidedChallenge() {
    return state.challengeIndex <= GUIDE_LAST_CHALLENGE_INDEX;
  }

  function playAreaRect() {
    return els.playSurface.getBoundingClientRect();
  }

  function showScreen(name) {
    const start = name === "start";
    els.screenStart.hidden = !start;
    els.screenGame.hidden = start;
    if (start) {
      helpStickySecondary = null;
      syncFooterInstruction();
    }
  }

  function syncGuideUi() {
    const show = isGuidedChallenge() && state.guideStep < 2;
    els.btnGuideNext.hidden = !show;
  }

  function syncStageHud() {
    const labels = {
      missing_addend: "Cajita en suma",
      missing_subtrahend: "Cajita en resta (lo quitado)",
      missing_minuend: "Cajita al inicio",
    };
    const tier = tierFromScore(state.score);
    const tierName = tier === 1 ? "Fácil" : tier === 2 ? "Medio" : "Avanzado";
    els.hudStage.textContent =
      (state.mysteryType ? labels[state.mysteryType] + " · " : "") + tierName;
  }

  function syncEquation() {
    const q = "?";
    els.eqLeft.textContent = state.hiddenPosition === "left" ? q : String(state.leftNumber);
    els.eqOp.textContent = state.challengeOp === "subtract" ? "−" : "+";
    els.eqRight.textContent = state.hiddenPosition === "right" ? q : String(state.rightNumber);
    els.eqResult.textContent = String(state.expectedResult);
    els.eqLeft.classList.toggle("equation__part--mystery", state.hiddenPosition === "left");
    els.eqRight.classList.toggle("equation__part--mystery", state.hiddenPosition === "right");
    els.hudChallenge.textContent = String(state.challengeIndex);
    els.hudScore.textContent = String(state.score);
    syncStageHud();
  }

  function formatWorkspaceEquation() {
    const L = state.workspaceLeft;
    const R = state.workspaceRight;
    if (state.workspaceChallengeOp === "subtract") {
      return L + " − " + R + " = " + (L - R);
    }
    return L + " + " + R + " = " + (L + R);
  }

  function formatWorkspaceTask() {
    const L = state.workspaceLeft;
    const R = state.workspaceRight;
    return state.workspaceChallengeOp === "subtract" ? L + " − " + R : L + " + " + R;
  }

  function syncMesaHintBoard() {
    if (!els.mesaHintBoard || !els.mesaHintEquation) return;
    els.mesaHintEquation.textContent = formatWorkspaceTask();
    els.mesaHintBoard.hidden = !state.mesaHintVisible;
  }

  function procedureExplanation() {
    if (state.mysteryType === "missing_addend") {
      return (
        "Paso 1 — Procedimiento: en una suma con cajita, el número escondido es lo que falta " +
        "para llegar al total. Para encontrarlo, en la mesa restás el número conocido del total."
      );
    }
    if (state.mysteryType === "missing_subtrahend") {
      return (
        "Paso 1 — Procedimiento: si la cajita es lo que se quitó en una resta, pensá " +
        "«grande − lo que quedó» → en la mesa restás el resultado del número grande."
      );
    }
    if (state.mysteryType === "missing_minuend") {
      return (
        "Paso 1 — Procedimiento: si la cajita es el primer número de la resta, el comienzo " +
        "es lo que quedó más lo que se quitó → en la mesa sumás esas dos piezas."
      );
    }
    return "";
  }

  function mechanicsReminder() {
    return (
      "Paso 3 — En la mesa: tocá una burbuja sin arrastrar para partirla; arrastrá " +
      "una burbuja sobre otra para juntar (como en Bubble Math Lab). Cuando quede solo una " +
      "con el número de la cajita, ganás."
    );
  }

  function buildPrimaryHelp() {
    if (isGuidedChallenge()) {
      if (state.guideStep === 0) return procedureExplanation();
      if (state.guideStep === 1) {
        return (
          "Paso 2 — Para ver en grande la cuenta en la mesa, tocá el botón Pista (arriba aparece el letrero)."
        );
      }
      return mechanicsReminder();
    }
    let short = "";
    if (state.mysteryType === "missing_addend") {
      short = "Cajita en suma: en la mesa restá el número conocido del total.";
    } else if (state.mysteryType === "missing_subtrahend") {
      short = "Cajita «lo quitado»: en la mesa restá el resultado del número grande.";
    } else if (state.mysteryType === "missing_minuend") {
      short = "Cajita al inicio: en la mesa sumá lo que quedó con lo que se quitó.";
    }
    return short + " Tocá Pista para ver la operación en grande dentro de la mesa.";
  }

  function setHelpStickySecondary(text) {
    helpStickySecondary = text;
    syncFooterInstruction();
  }

  function clearHelpStickySecondary() {
    if (helpStickySecondary === null) return;
    helpStickySecondary = null;
    syncFooterInstruction();
  }

  function syncFooterInstruction() {
    if (els.screenGame.hidden) return;
    if (els.footerPrimary) {
      els.footerPrimary.textContent = buildPrimaryHelp();
    }
    const sticky = helpStickySecondary;
    const pistaLine =
      state.mesaHintVisible && !sticky
        ? "El resultado de esa operación es el número que va en la cajita. Objetivo: una sola burbuja con ese valor."
        : "";
    const secText = sticky || pistaLine;
    if (els.footerSecondary) {
      if (secText) {
        els.footerSecondary.textContent = secText;
        els.footerSecondary.hidden = false;
      } else {
        els.footerSecondary.textContent = "";
        els.footerSecondary.hidden = true;
      }
    }
  }

  function stageChallengePayload(resetIndex) {
    if (!resetIndex) state.challengeIndex += 1;
    const tier = tierFromScore(state.score);
    const ch = generateMysteryChallenge(tier, state.challengeIndex);
    const ws = deriveWorkspace(ch);
    state.mysteryType = ch.mysteryType;
    state.challengeOp = ch.challengeOp;
    state.leftNumber = ch.leftNumber;
    state.rightNumber = ch.rightNumber;
    state.expectedResult = ch.expectedResult;
    state.hiddenValue = ch.hiddenValue;
    state.hiddenPosition = ch.hiddenPosition;
    state.workspaceChallengeOp = ws.workspaceChallengeOp;
    state.workspaceLeft = ws.workspaceLeft;
    state.workspaceRight = ws.workspaceRight;
  }

  function initialWorkspaceBubbleLayout() {
    const isSub = state.workspaceChallengeOp === "subtract";
    return [
      {
        id: nextId(),
        value: state.workspaceLeft,
        x: 28,
        y: 38,
        source: isSub ? "minuend" : "addend",
      },
      {
        id: nextId(),
        value: state.workspaceRight,
        x: 72,
        y: 38,
        source: isSub ? "subtrahend" : "addend",
      },
    ];
  }

  function startChallenge(resetIndex) {
    closeMergeModal();
    clearHelpStickySecondary();
    state.guideStep = 0;
    state.mesaHintVisible = false;
    stageChallengePayload(resetIndex);
    state.bubbles = initialWorkspaceBubbleLayout();
    syncEquation();
    syncMesaHintBoard();
    syncGuideUi();
    renderBubbles();
    syncFooterInstruction();
  }

  function resetTurn() {
    closeMergeModal();
    clearHelpStickySecondary();
    state.mesaHintVisible = false;
    syncMesaHintBoard();
    state.bubbles = initialWorkspaceBubbleLayout();
    renderBubbles();
    syncFooterInstruction();
  }

  function findBubble(id) {
    return state.bubbles.find((b) => b.id === id) || null;
  }

  function removeBubbleById(id) {
    state.bubbles = state.bubbles.filter((b) => b.id !== id);
  }

  function clearBubbleEls() {
    els.playSurface.querySelectorAll(".bubble").forEach((n) => n.remove());
  }

  function pxFromPercent(pxW, pxH, xPct, yPct) {
    return { x: (xPct / 100) * pxW, y: (yPct / 100) * pxH };
  }

  function placeBubbleEl(el, xPct, yPct) {
    el.style.left = xPct + "%";
    el.style.top = yPct + "%";
  }

  function mergeOpForPair(b, partner) {
    if (state.workspaceChallengeOp !== "subtract") return "add";
    const aMin = b.source === "minuend";
    const bMin = partner.source === "minuend";
    const aSub = b.source === "subtrahend";
    const bSub = partner.source === "subtrahend";
    if ((aMin && bSub) || (aSub && bMin)) return "subtract";
    return "add";
  }

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

  function isBlockedSubtractionMerge(b, partner) {
    const sv = subtractCrossValues(b, partner);
    if (!sv) return false;
    return sv.minuendVal < sv.subVal;
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

  function isPrimitiveAutoFuseMerge(b, partner) {
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

  function spawnMergeFireworks() {
    const rect = document.body.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height * 0.42;
    const colors = ["#7cffdf", "#fde047", "#f472b6", "#c084fc", "#38bdf8", "#ffffff"];
    const waves = 2;
    const perWave = 28;
    for (let w = 0; w < waves; w += 1) {
      window.setTimeout(() => {
        for (let i = 0; i < perWave; i += 1) {
          const p = document.createElement("span");
          p.className = "firework-ray";
          p.style.left = cx + (Math.random() * 24 - 12) + "px";
          p.style.top = cy + (Math.random() * 24 - 12) + "px";
          p.style.background = colors[i % colors.length];
          const ang = (Math.PI * 2 * i) / perWave + Math.random() * 0.2;
          const dist = 90 + Math.random() * 130;
          p.style.setProperty("--fw-dx", Math.cos(ang) * dist + "px");
          p.style.setProperty("--fw-dy", Math.sin(ang) * dist + "px");
          p.style.animationDuration = 0.85 + Math.random() * 0.2 + "s";
          els.confetti.appendChild(p);
          window.setTimeout(() => p.remove(), 1200);
        }
      }, w * 120);
    }
  }

  function runMergeCore(pm) {
    clearHelpStickySecondary();
    removeBubbleById(pm.idA);
    removeBubbleById(pm.idB);
    let newSource;
    if (pm.op === "subtract") {
      newSource = "minuend";
    } else if (state.workspaceChallengeOp === "subtract") {
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
  }

  function bubbleEligibleForMergeHint(b) {
    if (state.workspaceChallengeOp === "subtract" && b.source === "subtrahend") return false;
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
    els.playSurface.appendChild(el);
    return el;
  }

  function checkPuzzleCompleteAuto() {
    if (els.screenGame.hidden) return;
    if (!els.modal.hidden || !els.mergeModal.hidden) return;
    if (state.bubbles.length !== 1) return;
    if (state.hiddenValue == null || state.bubbles[0].value !== state.hiddenValue) return;
    openSuccessModal();
  }

  function renderBubbles() {
    clearBubbleEls();
    const hintStats = computeMergeHintStats(state.bubbles);
    for (const b of state.bubbles) {
      createBubbleEl(b, hintStats);
    }
    checkPuzzleCompleteAuto();
    syncFooterInstruction();
  }

  function bubbleCenterClient(b) {
    const r = playAreaRect();
    const p = pxFromPercent(r.width, r.height, b.x, b.y);
    return { x: r.left + p.x, y: r.top + p.y };
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function openMergeModal(b, partner) {
    const pm = buildMergePayload(b, partner);
    pendingMerge = pm;
    const promptText =
      pm.op === "add"
        ? pm.v1 + " + " + pm.v2
        : b.source === "minuend" && partner.source === "subtrahend"
          ? b.value + " − " + partner.value
          : partner.value + " − " + b.value;
    els.mergeTitle.textContent = pm.op === "subtract" ? "Restar burbujas" : "Sumar burbujas";
    els.mergePrompt.textContent = promptText + " = ?";
    els.mergeHint.textContent =
      "Escribí el resultado numérico. Si acertás, la fusión se completa (como en Bubble Math Lab).";
    els.mergeAnswer.value = "";
    els.mergeFeedback.hidden = true;
    els.mergeModal.hidden = false;
    window.setTimeout(() => {
      els.mergeAnswer.focus();
      els.mergeAnswer.select();
    }, 40);
  }

  function closeMergeModal() {
    pendingMerge = null;
    els.mergeModal.hidden = true;
    els.mergeFeedback.hidden = true;
    els.mergeAnswer.value = "";
  }

  function applyEmergeFromSplit(parentX, parentY, childIds) {
    const r = playAreaRect();
    const w = r.width;
    const h = r.height;
    for (const id of childIds) {
      const b = findBubble(id);
      if (!b) continue;
      const el = els.playSurface.querySelector('.bubble[data-id="' + id + '"]');
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
  }

  function spawnSplitParticles(bubbleEl) {
    const br = bubbleEl.getBoundingClientRect();
    const pr = playAreaRect();
    const cx = br.left + br.width / 2 - pr.left;
    const cy = br.top + br.height / 2 - pr.top;
    const colors = ["#7cffdf", "#c084fc", "#fef08a", "#fff", "#38bdf8"];
    for (let i = 0; i < 14; i += 1) {
      const p = document.createElement("span");
      p.className = "split-particle";
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.35;
      const dist = 32 + Math.random() * 44;
      p.style.setProperty("--split-dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--split-dy", Math.sin(ang) * dist + "px");
      p.style.background = colors[i % colors.length];
      els.playSurface.appendChild(p);
      window.setTimeout(() => p.remove(), 650);
    }
  }

  function decomposeBlockedMessage(value) {
    if (value < MIN_DECOMPOSE) {
      return (
        "Los números menores que " +
        MIN_DECOMPOSE +
        " no se parten acá. Juntalos con otra burbuja."
      );
    }
    if (value === 5) {
      return "El 5 es pieza base. Combiná con otra burbuja.";
    }
    return "Esa burbuja no se puede partir más. Juntala con otra.";
  }

  function tryDecompose(b) {
    const parts = decomposePartsForBubble(b);
    if (!parts) {
      const bel = els.playSurface.querySelector('.bubble[data-id="' + b.id + '"]');
      if (bel) {
        bel.classList.remove("bubble--shake");
        void bel.offsetWidth;
        bel.classList.add("bubble--shake");
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
    const el = els.playSurface.querySelector('.bubble[data-id="' + b.id + '"]');
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
    const tid = window.setTimeout(run, 580);
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

  function feedbackBlockedSubtraction(b, partner) {
    setHelpStickySecondary(
      "No podés restar si el minuendo es más chico que el sustraendo rojo. Partí el celeste o sumá antes."
    );
    for (const id of [b.id, partner.id]) {
      const bel = els.playSurface.querySelector('.bubble[data-id="' + id + '"]');
      if (bel) {
        bel.classList.remove("bubble--shake");
        void bel.offsetWidth;
        bel.classList.add("bubble--shake");
      }
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
        runMergeCore(buildMergePayload(b, partner));
        return true;
      }
      openMergeModal(b, partner);
      return true;
    }
    return false;
  }

  function mysterySuccessMessage() {
    const line = formatWorkspaceEquation();
    const h = state.hiddenValue;
    if (state.mysteryType === "missing_addend") {
      return (
        "La cajita era " +
        h +
        " porque " +
        line +
        " (lo que falta en la suma)."
      );
    }
    if (state.mysteryType === "missing_subtrahend") {
      return "La cajita era " + h + " porque " + line + " (lo que se quitó).";
    }
    if (state.mysteryType === "missing_minuend") {
      return "La cajita era " + h + " porque " + line + " (el número del inicio).";
    }
    return "¡Resolviste la cuenta de la cajita!";
  }

  function spawnConfetti() {
    els.confetti.innerHTML = "";
    const colors = ["#7cffdf", "#c084fc", "#fde047", "#f472b6"];
    const rect = document.body.getBoundingClientRect();
    for (let i = 0; i < 36; i += 1) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      p.style.left = Math.random() * rect.width + "px";
      p.style.top = -20 + Math.random() * 40 + "px";
      p.style.background = colors[i % colors.length];
      els.confetti.appendChild(p);
    }
    window.setTimeout(() => {
      els.confetti.innerHTML = "";
    }, 2200);
  }

  function openSuccessModal() {
    closeMergeModal();
    state.score += (state.hiddenValue || 0) * SCORE_PER_UNIT;
    els.hudScore.textContent = String(state.score);
    els.modalMsg.textContent = mysterySuccessMessage() + " Tenés " + state.score + " puntos.";
    els.modal.hidden = false;
    spawnConfetti();
  }

  function onBubblePointerDown(ev) {
    if (!els.mergeModal.hidden) return;
    clearHelpStickySecondary();
    const el = ev.currentTarget;
    const b = findBubble(el.dataset.id);
    if (!b) return;
    ev.preventDefault();
    el.setPointerCapture(ev.pointerId);
    const c = bubbleCenterClient(b);
    drag = {
      id: b.id,
      pointerId: ev.pointerId,
      startClient: { x: ev.clientX, y: ev.clientY },
      grabOffset: { x: ev.clientX - c.x, y: ev.clientY - c.y },
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

  function clearMergeHighlights() {
    els.playSurface.querySelectorAll(".bubble--merge-target").forEach((n) => {
      n.classList.remove("bubble--merge-target");
    });
  }

  function highlightMergeCandidates(activeId, centerX, centerY) {
    const pt = { x: centerX, y: centerY };
    clearMergeHighlights();
    const self = findBubble(activeId);
    if (!self) return;
    for (const o of state.bubbles) {
      if (o.id === activeId) continue;
      if (isBlockedSubtractionMerge(self, o)) continue;
      const c = bubbleCenterClient(o);
      if (distance(pt, c) < MERGE_DISTANCE_PX) {
        const elA = els.playSurface.querySelector('.bubble[data-id="' + activeId + '"]');
        const elO = els.playSurface.querySelector('.bubble[data-id="' + o.id + '"]');
        if (elA) elA.classList.add("bubble--merge-target");
        if (elO) elO.classList.add("bubble--merge-target");
        return;
      }
    }
  }

  function onPointerMove(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const el = els.playSurface.querySelector('.bubble[data-id="' + drag.id + '"]');
    const b = findBubble(drag.id);
    if (!el || !b) return;
    const dx = ev.clientX - drag.startClient.x;
    const dy = ev.clientY - drag.startClient.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) drag.moved = true;
    if (drag.moved) {
      moveBubbleToClient(el, b, ev.clientX, ev.clientY, drag.grabOffset);
      const cx = ev.clientX - drag.grabOffset.x;
      const cy = ev.clientY - drag.grabOffset.y;
      highlightMergeCandidates(drag.id, cx, cy);
    }
  }

  function onPointerUp(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const el = els.playSurface.querySelector('.bubble[data-id="' + drag.id + '"]');
    const b = findBubble(drag.id);
    const had = drag;
    drag = null;
    clearMergeHighlights();
    if (el) {
      el.releasePointerCapture(ev.pointerId);
      el.classList.remove("bubble--dragging");
    }
    if (!b) return;
    if (!had.moved) {
      tryDecompose(b);
      return;
    }
    const cx = ev.clientX - had.grabOffset.x;
    const cy = ev.clientY - had.grabOffset.y;
    if (tryMergeOrPlace(b, el, cx, cy, had)) return;
  }

  els.btnPlay.addEventListener("click", () => {
    state.score = 0;
    state.challengeIndex = 0;
    showScreen("game");
    startChallenge(false);
  });

  els.btnHome.addEventListener("click", () => {
    els.modal.hidden = true;
    closeMergeModal();
    showScreen("start");
  });

  els.btnReset.addEventListener("click", resetTurn);

  els.btnNew.addEventListener("click", () => {
    if (!els.modal.hidden) return;
    startChallenge(false);
  });

  els.btnGuideNext.addEventListener("click", () => {
    if (!isGuidedChallenge()) return;
    state.guideStep = Math.min(2, state.guideStep + 1);
    syncGuideUi();
    syncFooterInstruction();
  });

  els.btnHint.addEventListener("click", () => {
    state.mesaHintVisible = true;
    syncMesaHintBoard();
    syncFooterInstruction();
  });

  els.btnMysteryHelp.addEventListener("click", () => {
    clearHelpStickySecondary();
    setHelpStickySecondary(
      "En la mesa, las burbujas celestes siguen las reglas de Bubble Math Lab; las rojas son el sustraendo. " +
        "Las rayas doradas y celestes marcan buenos cruces para juntar."
    );
    renderBubbles();
  });

  els.modalNext.addEventListener("click", () => {
    els.modal.hidden = true;
    startChallenge(false);
  });

  els.mergeForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!pendingMerge) return;
    const raw = els.mergeAnswer.value.trim();
    const n = parseInt(raw, 10);
    if (raw === "" || Number.isNaN(n)) {
      els.mergeFeedback.textContent = "Escribí un número.";
      els.mergeFeedback.hidden = false;
      return;
    }
    if (n !== pendingMerge.result) {
      els.mergeFeedback.textContent = "No da ese resultado. Probá otra vez.";
      els.mergeFeedback.hidden = false;
      els.mergeAnswer.value = "";
      els.mergeAnswer.focus();
      return;
    }
    const pm = pendingMerge;
    closeMergeModal();
    runMergeCore(pm);
  });

  els.mergeModal.querySelectorAll("[data-close-merge]").forEach((n) => {
    n.addEventListener("click", closeMergeModal);
  });

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);

  syncFooterInstruction();
})();
