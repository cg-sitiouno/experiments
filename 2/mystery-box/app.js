(function () {
  "use strict";

  const MERGE_DISTANCE_PX = 84;
  const DRAG_THRESHOLD_PX = 10;
  const MAX_SUM = 99;
  const MIN_DECOMPOSE = 5;
  const SCORE_PER_UNIT = 10;
  /** Expande el área válida para soltar sobre la cajita (px por lado), cómodo en touch. */
  const MYSTERY_TARGET_INFLATE_PX = 36;

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

  function decomposePartsForMysteryBubble(b) {
    if (!state.mysteryType) return null;
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

  function decomposePartsForBubble(b) {
    const m = decomposePartsForMysteryBubble(b);
    if (m) return m;
    const du = pickDecadePlusUnits(b.value);
    if (du) return du;
    return decomposePartsClassic(b.value);
  }

  /** @type {{
   *   score: number,
   *   challengeIndex: number,
   *   mysteryType: null | 'missing_addend' | 'missing_subtrahend' | 'missing_minuend',
   *   challengeOp: 'add' | 'subtract',
   *   leftNumber: number | null,
   *   rightNumber: number | null,
   *   expectedResult: number,
   *   hiddenValue: number | null,
   *   hiddenPosition: null | 'left' | 'right',
   *   bubbles: Array<{ id: string, value: number, x: number, y: number, source: 'addend' | 'minuend' | 'subtrahend' }>,
   * }} */
  const state = {
    score: 0,
    challengeIndex: 1,
    mysteryType: null,
    challengeOp: "add",
    leftNumber: null,
    rightNumber: null,
    expectedResult: 8,
    hiddenValue: null,
    hiddenPosition: null,
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
    btnMysteryHelp: document.getElementById("btn-mystery-help"),
    hudScore: document.getElementById("hud-score"),
    hudChallenge: document.getElementById("hud-challenge"),
    hudStage: document.getElementById("hud-stage"),
    eqLeft: document.getElementById("eq-left"),
    eqOp: document.getElementById("eq-op"),
    eqRight: document.getElementById("eq-right"),
    eqResult: document.getElementById("eq-result"),
    helpPrimary: document.getElementById("help-primary"),
    helpSecondary: document.getElementById("help-secondary"),
    playArea: document.getElementById("play-area"),
    playSurface: document.getElementById("play-surface"),
    mysteryTarget: document.getElementById("mystery-target"),
    modal: document.getElementById("modal-success"),
    modalMsg: document.getElementById("modal-success-msg"),
    modalNext: document.getElementById("modal-next"),
    mergeModal: document.getElementById("modal-merge"),
    mergePrompt: document.getElementById("modal-merge-prompt"),
    mergeHint: document.getElementById("modal-merge-hint"),
    mergeForm: document.getElementById("form-merge"),
    mergeAnswer: document.getElementById("merge-answer"),
    mergeFeedback: document.getElementById("merge-feedback"),
    confetti: document.getElementById("confetti-root"),
  };

  function bubblesHostEl() {
    return els.playSurface || els.playArea;
  }

  function playAreaRect() {
    return bubblesHostEl().getBoundingClientRect();
  }

  function showScreen(name) {
    const start = name === "start";
    els.screenStart.hidden = !start;
    els.screenGame.hidden = start;
    if (start) {
      helpStickySecondary = null;
      updateHelpBanner();
    }
  }

  function syncStageHud() {
    const labels = {
      missing_addend: "Parte que falta",
      missing_subtrahend: "Lo que se fue",
      missing_minuend: "Número al inicio",
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

  function buildHelpPrimary() {
    if (state.mysteryType === "missing_addend") {
      return (
        "Cajita + " +
        state.rightNumber +
        " = " +
        state.expectedResult +
        ". Encontrá la parte que falta."
      );
    }
    if (state.mysteryType === "missing_subtrahend") {
      return (
        state.leftNumber +
        " − cajita = " +
        state.expectedResult +
        ". Encontrá lo que se fue."
      );
    }
    if (state.mysteryType === "missing_minuend") {
      return (
        "Cajita − " +
        state.rightNumber +
        " = " +
        state.expectedResult +
        ". Reconstruí el número inicial."
      );
    }
    return "Encontrá el número de la cajita.";
  }

  function buildHelpSecondary() {
    if (state.mysteryType === "missing_addend") {
      return "Podés partir el total tocando la burbuja del total (sin arrastrar).";
    }
    if (state.mysteryType === "missing_subtrahend") {
      return "Partí el número grande tocando su burbuja para ver el resto y lo que se quitó.";
    }
    if (state.mysteryType === "missing_minuend") {
      return "Juntá las dos burbujas para formar el número que había al principio.";
    }
    return "";
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
    if (!els.helpPrimary || els.screenGame.hidden) return;
    els.helpPrimary.textContent = buildHelpPrimary();
    const sec = buildHelpSecondary();
    if (helpStickySecondary) {
      els.helpSecondary.textContent = helpStickySecondary;
      els.helpSecondary.hidden = false;
      els.helpSecondary.classList.remove("help-banner__secondary--muted");
      els.helpSecondary.classList.add("help-banner__secondary--alert");
    } else {
      els.helpSecondary.textContent = sec;
      els.helpSecondary.hidden = sec.length === 0;
      els.helpSecondary.classList.add("help-banner__secondary--muted");
      els.helpSecondary.classList.remove("help-banner__secondary--alert");
    }
  }

  function stageChallengePayload(resetIndex) {
    if (!resetIndex) state.challengeIndex += 1;
    const tier = tierFromScore(state.score);
    const ch = generateMysteryChallenge(tier, state.challengeIndex);
    state.mysteryType = ch.mysteryType;
    state.challengeOp = ch.challengeOp;
    state.leftNumber = ch.leftNumber;
    state.rightNumber = ch.rightNumber;
    state.expectedResult = ch.expectedResult;
    state.hiddenValue = ch.hiddenValue;
    state.hiddenPosition = ch.hiddenPosition;
  }

  function initialMysteryBubbleLayout() {
    const t = state.mysteryType;
    if (t === "missing_addend") {
      return [
        {
          id: nextId(),
          value: /** @type {number} */ (state.rightNumber),
          x: 28,
          y: 36,
          source: /** @type {const} */ ("addend"),
        },
        {
          id: nextId(),
          value: state.expectedResult,
          x: 72,
          y: 36,
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
          y: 36,
          source: "minuend",
        },
        {
          id: nextId(),
          value: state.expectedResult,
          x: 72,
          y: 36,
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
          y: 36,
          source: "subtrahend",
        },
        {
          id: nextId(),
          value: state.expectedResult,
          x: 72,
          y: 36,
          source: "minuend",
        },
      ];
    }
    return [];
  }

  function startChallenge(resetIndex) {
    closeMergeModal();
    clearHelpStickySecondary();
    if (els.mysteryTarget) {
      els.mysteryTarget.classList.remove(
        "mystery-target--wrong",
        "mystery-target--success",
        "mystery-target--active"
      );
    }
    stageChallengePayload(resetIndex);
    state.bubbles = initialMysteryBubbleLayout();
    syncEquation();
    renderBubbles();
    updateHelpBanner();
  }

  function resetTurn() {
    closeMergeModal();
    clearHelpStickySecondary();
    if (els.mysteryTarget) {
      els.mysteryTarget.classList.remove(
        "mystery-target--wrong",
        "mystery-target--success",
        "mystery-target--active"
      );
    }
    state.bubbles = initialMysteryBubbleLayout();
    renderBubbles();
    updateHelpBanner();
  }

  function findBubble(id) {
    return state.bubbles.find((b) => b.id === id) || null;
  }

  function removeBubbleById(id) {
    state.bubbles = state.bubbles.filter((b) => b.id !== id);
  }

  function clearBubbleEls() {
    bubblesHostEl().querySelectorAll(".bubble").forEach((n) => n.remove());
  }

  function placeBubbleEl(el, xPct, yPct) {
    el.style.left = xPct + "%";
    el.style.top = yPct + "%";
  }

  function mergeOpForPair(b, partner) {
    if (state.mysteryType === "missing_minuend") return "add";
    if (state.challengeOp !== "subtract") return "add";
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
    const mergeOp = mergeOpForPair(b, partner);
    let result;
    let scoreBasis;
    let nx = (b.x + partner.x) / 2;
    let ny = (b.y + partner.y) / 2;
    if (mergeOp === "add") {
      result = b.value + partner.value;
      scoreBasis = Math.max(b.value, partner.value);
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

  /** Fusión simple sin modal para no frenar el foco en la cajita (plan 7.3). */
  function isPrimitiveAutoFuseMerge(b, partner) {
    if (mergeOpForPair(b, partner) !== "add") return false;
    const a = b.value;
    const c = partner.value;
    if (a < 1 || c < 1) return false;
    return a <= 10 && c <= 10 && a + c <= 24;
  }

  function runMergeCore(pm) {
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
  }

  function createBubbleEl(b) {
    const el = document.createElement("div");
    el.className = "bubble" + (b.source === "subtrahend" ? " bubble--subtrahend" : "");
    el.dataset.id = b.id;
    el.setAttribute("role", "button");
    el.setAttribute(
      "aria-label",
      (b.source === "subtrahend" ? "Pieza roja, valor " : "Burbuja valor ") + b.value
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
    for (const b of state.bubbles) {
      createBubbleEl(b);
    }
    updateHelpBanner();
  }

  function pxFromPercent(pxW, pxH, xPct, yPct) {
    return { x: (xPct / 100) * pxW, y: (yPct / 100) * pxH };
  }

  function bubbleCenterClient(b) {
    const r = playAreaRect();
    const p = pxFromPercent(r.width, r.height, b.x, b.y);
    return { x: r.left + p.x, y: r.top + p.y };
  }

  function distance(u, v) {
    return Math.hypot(u.x - v.x, u.y - v.y);
  }

  function openMergeModal(b, partner) {
    const pm = buildMergePayload(b, partner);
    pendingMerge = pm;
    if (pm.op === "add") {
      els.mergePrompt.textContent = pm.v1 + " + " + pm.v2 + " = ?";
    } else {
      const line =
        b.source === "minuend" && partner.source === "subtrahend"
          ? b.value + " − " + partner.value
          : partner.value + " − " + b.value;
      els.mergePrompt.textContent = line + " = ?";
    }
    els.mergeHint.textContent =
      pm.op === "add"
        ? "Escribí el resultado. Si acertás, las burbujas se juntan."
        : "Escribí el resultado de la resta. Si acertás, las burbujas se juntan.";
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

  function spawnSplitParticles(bubbleEl) {
    const br = bubbleEl.getBoundingClientRect();
    const pr = playAreaRect();
    const cx = br.left + br.width / 2 - pr.left;
    const cy = br.top + br.height / 2 - pr.top;
    const colors = ["#7cffdf", "#c084fc", "#fef08a", "#fff", "#38bdf8"];
    for (let i = 0; i < 12; i += 1) {
      const p = document.createElement("span");
      p.className = "split-particle";
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const dist = 28 + Math.random() * 36;
      p.style.setProperty("--split-dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--split-dy", Math.sin(ang) * dist + "px");
      p.style.background = colors[i % colors.length];
      bubblesHostEl().appendChild(p);
      window.setTimeout(() => p.remove(), 600);
    }
  }

  function finalizeDecompose(b, v1, v2, x1, y1, x2, y2) {
    removeBubbleById(b.id);
    state.bubbles.push(
      { id: nextId(), value: v1, x: x1, y: y1, source: b.source },
      { id: nextId(), value: v2, x: x2, y: y2, source: b.source }
    );
    renderBubbles();
    decomposeAnimating = false;
  }

  function decomposeBlockedMessage(value) {
    if (value < MIN_DECOMPOSE) {
      return "Esa pieza es muy chica para partir. Probá juntarla con otra.";
    }
    if (value === 5) {
      return "El 5 es una pieza especial acá. Juntalo con otra burbuja.";
    }
    return "Esta burbuja no se puede partir más.";
  }

  function tryDecompose(b) {
    const parts = decomposePartsForBubble(b);
    if (!parts) {
      const bel = bubblesHostEl().querySelector('.bubble[data-id="' + b.id + '"]');
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
    const x1 = Math.max(8, ox - 12);
    const y1 = Math.min(84, oy + 8);
    const x2 = Math.min(92, ox + 12);
    const y2 = y1;
    const id1 = nextId();
    const id2 = nextId();
    const el = bubblesHostEl().querySelector('.bubble[data-id="' + b.id + '"]');
    if (el) spawnSplitParticles(el);
    decomposeAnimating = true;
    finalizeDecompose(b, v1, v2, x1, y1, x2, y2);
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
        setHelpStickySecondary(
          "No podés restar si la pieza celeste es más chica que la roja. Sumá primero o usá una pieza mayor."
        );
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

  function isPointInsideMysteryTarget(clientX, clientY) {
    const target = els.mysteryTarget;
    if (!target || els.screenGame.hidden) return false;
    const r = target.getBoundingClientRect();
    const pad = MYSTERY_TARGET_INFLATE_PX;
    return (
      clientX >= r.left - pad &&
      clientX <= r.right + pad &&
      clientY >= r.top - pad &&
      clientY <= r.bottom + pad
    );
  }

  function showMysteryWrongFeedback(bubbleEl) {
    let msg = "Todavía no. Probá con otra pieza o partí las burbujas.";
    if (state.mysteryType === "missing_addend") {
      msg = "Todavía no. Pensá qué número falta para llegar al total.";
    } else if (state.mysteryType === "missing_subtrahend") {
      msg = "Casi. La cajita es lo que se quitó.";
    } else if (state.mysteryType === "missing_minuend") {
      msg = "Recordá: el número al inicio es lo que quedó más lo que se quitó.";
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
    const h = state.hiddenValue;
    if (state.mysteryType === "missing_addend") {
      return (
        "¡Genial! La cajita era " +
        h +
        ". " +
        h +
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
        h +
        ". " +
        state.leftNumber +
        " − " +
        h +
        " = " +
        state.expectedResult +
        "."
      );
    }
    if (state.mysteryType === "missing_minuend") {
      return (
        "¡Genial! Al principio había " +
        h +
        ". " +
        h +
        " − " +
        state.rightNumber +
        " = " +
        state.expectedResult +
        "."
      );
    }
    return "¡Encontraste el número de la cajita!";
  }

  function spawnConfetti() {
    els.confetti.innerHTML = "";
    const colors = ["#7cffdf", "#c084fc", "#fde047", "#f472b6"];
    const rect = document.body.getBoundingClientRect();
    for (let i = 0; i < 32; i += 1) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      p.style.left = Math.random() * rect.width + "px";
      p.style.top = -16 + Math.random() * 30 + "px";
      p.style.background = colors[i % colors.length];
      els.confetti.appendChild(p);
    }
    window.setTimeout(() => {
      els.confetti.innerHTML = "";
    }, 2000);
  }

  function openSuccessModal() {
    closeMergeModal();
    state.score += (state.hiddenValue || 0) * SCORE_PER_UNIT;
    els.hudScore.textContent = String(state.score);
    els.modalMsg.textContent = mysterySuccessMessage() + " Tenés " + state.score + " puntos.";
    els.modal.hidden = false;
    spawnConfetti();
  }

  function tryPlaceOnMysteryTarget(b, bubbleEl, dragState) {
    clearHelpStickySecondary();
    if (state.hiddenValue != null && b.value === state.hiddenValue) {
      removeBubbleById(b.id);
      renderBubbles();
      if (els.mysteryTarget) {
        els.mysteryTarget.classList.remove("mystery-target--wrong");
        els.mysteryTarget.classList.add("mystery-target--success");
      }
      openSuccessModal();
      window.setTimeout(() => {
        if (els.mysteryTarget) els.mysteryTarget.classList.remove("mystery-target--success");
      }, 700);
      return;
    }
    b.x = dragState.origX;
    b.y = dragState.origY;
    if (bubbleEl) placeBubbleEl(bubbleEl, b.x, b.y);
    showMysteryWrongFeedback(bubbleEl);
  }

  function clearMysteryHelpHighlights() {
    bubblesHostEl().querySelectorAll(".bubble--mystery-help").forEach((n) => {
      n.classList.remove("bubble--mystery-help");
    });
  }

  function highlightMysteryBubbles(pred) {
    for (const bb of state.bubbles) {
      if (!pred(bb)) continue;
      const bel = bubblesHostEl().querySelector('.bubble[data-id="' + bb.id + '"]');
      if (bel) bel.classList.add("bubble--mystery-help");
    }
  }

  function onBubblePointerDown(ev) {
    if (!els.mergeModal.hidden) return;
    clearHelpStickySecondary();
    clearMysteryHelpHighlights();
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
    const box = playAreaRect();
    const lx = clientX - grabOffset.x - box.left;
    const ly = clientY - grabOffset.y - box.top;
    b.x = Math.min(96, Math.max(4, (lx / box.width) * 100));
    b.y = Math.min(88, Math.max(10, (ly / box.height) * 100));
    placeBubbleEl(el, b.x, b.y);
  }

  function clearMergeHighlights() {
    bubblesHostEl().querySelectorAll(".bubble--merge-target").forEach((n) => {
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
        const elA = bubblesHostEl().querySelector('.bubble[data-id="' + activeId + '"]');
        const elO = bubblesHostEl().querySelector('.bubble[data-id="' + o.id + '"]');
        if (elA) elA.classList.add("bubble--merge-target");
        if (elO) elO.classList.add("bubble--merge-target");
        return;
      }
    }
  }

  function onPointerMove(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const el = bubblesHostEl().querySelector('.bubble[data-id="' + drag.id + '"]');
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
      if (els.mysteryTarget) {
        els.mysteryTarget.classList.toggle("mystery-target--active", isPointInsideMysteryTarget(ev.clientX, ev.clientY));
      }
    }
  }

  function onPointerUp(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const el = bubblesHostEl().querySelector('.bubble[data-id="' + drag.id + '"]');
    const b = findBubble(drag.id);
    const had = drag;
    drag = null;
    clearMergeHighlights();
    if (els.mysteryTarget) els.mysteryTarget.classList.remove("mystery-target--active");
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
    if (had.moved && isPointInsideMysteryTarget(ev.clientX, ev.clientY)) {
      tryPlaceOnMysteryTarget(b, el, had);
      return;
    }
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

  els.btnMysteryHelp.addEventListener("click", () => {
    clearHelpStickySecondary();
    clearMysteryHelpHighlights();
    if (state.mysteryType === "missing_addend") {
      setHelpStickySecondary("Tocate el número grande (el total) para partirlo.");
      highlightMysteryBubbles((bb) => bb.value === state.expectedResult);
    } else if (state.mysteryType === "missing_subtrahend") {
      setHelpStickySecondary("Tocá el número grande de la izquierda en la mesa para partirlo.");
      highlightMysteryBubbles((bb) => bb.value === state.leftNumber);
    } else if (state.mysteryType === "missing_minuend") {
      setHelpStickySecondary("Arrastrá una burbuja sobre la otra para sumarlas.");
      highlightMysteryBubbles(() => true);
    }
  });

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);

  updateHelpBanner();
})();
