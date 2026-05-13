(function () {
  "use strict";

  const MERGE_DISTANCE_PX = 76;
  const DRAG_THRESHOLD_PX = 10;
  const MAX_SUM = 99;

  /** Puntos: (a+b) × este valor. Ej.: 10+5 → 15×10 = +150. Error: la mitad en penalización. */
  const SCORE_POINTS_PER_UNIT = 10;

  /** Puntuación acumulada para subir el rango de dificultad del siguiente reto. */
  const DIFFICULTY_TIER_2_AT = 500;
  const DIFFICULTY_TIER_3_AT = 2000;

  /** Enteros menores que esto no se descomponen (piezas base: 1–4 se combinan, no se rompen). */
  const MIN_DECOMPOSE = 5;

  const HELP_MESSAGES = [
    "Los números del 1 al 4 no se rompen: son piezas pequeñas para sumar.",
    "Puedes romper un número en partes con un clic (si es " + MIN_DECOMPOSE + " o más y se puede dividir).",
    "Combina primero los números redondos: suele ser más fácil.",
    "A más puntos, el juego te propone sumas con números más grandes.",
    "Cuando en la mesa queda una sola burbuja con el resultado correcto, ¡ganaste el reto!",
  ];

  const MERGE_WRONG_HINTS = [
    "Ese no es el resultado de esta suma. ¡Inténtalo de nuevo!",
    "Casi. Sumá otra vez con calma y escribe el número.",
    "Revisa si sumaste bien las dos burbujas. Puedes intentarlo otra vez.",
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
  function generatePair(tier) {
    let a;
    let b;
    if (tier === 1) {
      a = randomInt(2, 9);
      b = randomInt(2, 9);
    } else if (tier === 2) {
      a = randomInt(5, 19);
      b = randomInt(5, 19);
    } else {
      a = randomInt(10, 49);
      b = randomInt(10, 49);
    }
    if (a + b > MAX_SUM) {
      return generatePair(tier);
    }
    return { a, b, sum: a + b };
  }

  /**
   * Reglas pedagógicas del spec + reglas de producto.
   * @param {number} n
   * @returns {[number, number] | null}
   */
  function decomposeParts(n) {
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

  /** @type {{
   *   score: number,
   *   operation: string,
   *   leftNumber: number,
   *   rightNumber: number,
   *   expectedResult: number,
   *   challengeIndex: number,
   *   bubbles: Array<{
   *     id: string,
   *     value: number,
   *     x: number,
   *     y: number,
   *     source: string,
   *   }>,
   * }} */
  const state = {
    score: 0,
    operation: "addition",
    leftNumber: 7,
    rightNumber: 8,
    expectedResult: 15,
    challengeIndex: 1,
    bubbles: [],
  };

  /** Valor mostrado en el HUD durante la animación del contador. */
  let scoreShown = 0;
  let scoreAnimId = 0;

  let drag = null;
  let helpIndex = 0;
  /** Evita doble descomposición mientras corre la animación */
  let decomposeAnimating = false;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** @type {null | { idA: string, idB: string, v1: number, v2: number, sum: number, nx: number, ny: number }} */
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
    eqRight: document.getElementById("eq-right"),
    eqResult: document.getElementById("eq-result-label"),
    helpBanner: document.getElementById("help-banner"),
    playArea: document.getElementById("play-area"),
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

  function syncDifficultyHud() {
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
    const was = state.score;
    state.score = Math.max(0, state.score + delta);
    flashHudScoreClass(delta >= 0);
    runScoreAnimationTo(state.score);
    if (delta < 0 && was > 0 && state.score === 0) {
      setHelp("Tus puntos no bajan de cero. ¡Seguí intentando!");
    }
  }

  function showScreen(name) {
    const isStart = name === "start";
    els.screenStart.hidden = !isStart;
    els.screenGame.hidden = isStart;
  }

  function setHelp(text) {
    els.helpBanner.textContent = text;
  }

  function rotateHelp() {
    setHelp(HELP_MESSAGES[helpIndex % HELP_MESSAGES.length]);
    helpIndex += 1;
  }

  function syncEquation() {
    els.eqLeft.textContent = String(state.leftNumber);
    els.eqRight.textContent = String(state.rightNumber);
    els.eqResult.textContent = "?";
    els.hudChallenge.textContent = String(state.challengeIndex);
    syncDifficultyHud();
  }

  function clearBubbleEls() {
    els.playArea.querySelectorAll(".bubble").forEach((n) => n.remove());
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

  function createBubbleEl(b) {
    const el = document.createElement("div");
    el.className = "bubble";
    el.dataset.id = b.id;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Burbuja valor " + b.value);
    const inner = document.createElement("span");
    inner.className = "bubble__inner";
    inner.textContent = String(b.value);
    el.appendChild(inner);
    placeBubbleEl(el, b.x, b.y);
    el.addEventListener("pointerdown", onBubblePointerDown);
    els.playArea.appendChild(el);
    return el;
  }

  function renderBubbles() {
    clearBubbleEls();
    for (const b of state.bubbles) {
      createBubbleEl(b);
    }
    checkPuzzleCompleteAuto();
  }

  function checkPuzzleCompleteAuto() {
    if (els.screenGame.hidden) return;
    if (!els.modal.hidden || !els.mergeModal.hidden) return;
    if (state.bubbles.length !== 1) return;
    if (state.bubbles[0].value !== state.expectedResult) return;
    applyScoreDelta(pointsForOperandSum(state.expectedResult));
    openSuccessModal();
  }

  function initialBubbleLayout() {
    return [
      {
        id: nextId(),
        value: state.leftNumber,
        x: 28,
        y: 38,
        source: "left",
      },
      {
        id: nextId(),
        value: state.rightNumber,
        x: 72,
        y: 38,
        source: "right",
      },
    ];
  }

  function startChallenge(resetIndex) {
    closeMergeModalCancelled();
    const tier = tierFromScore(state.score);
    const pair = generatePair(tier);
    state.leftNumber = pair.a;
    state.rightNumber = pair.b;
    state.expectedResult = pair.sum;
    if (!resetIndex) {
      state.challengeIndex += 1;
    }
    state.bubbles = initialBubbleLayout();
    syncEquation();
    renderBubbles();
    rotateHelp();
  }

  function resetTurn() {
    closeMergeModalCancelled();
    state.bubbles = initialBubbleLayout();
    renderBubbles();
    setHelp("Turno reiniciado. " + HELP_MESSAGES[0]);
  }

  function newChallengeFromMenu() {
    startChallenge(false);
  }

  function findBubble(id) {
    return state.bubbles.find((b) => b.id === id) || null;
  }

  function removeBubbleById(id) {
    state.bubbles = state.bubbles.filter((b) => b.id !== id);
  }

  function playAreaRect() {
    return els.playArea.getBoundingClientRect();
  }

  function spawnSplitParticles(bubbleEl) {
    const br = bubbleEl.getBoundingClientRect();
    const pr = els.playArea.getBoundingClientRect();
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
      els.playArea.appendChild(p);
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
    setHelp("Bien. Ahora acerca las piezas que quieras sumar.");
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

  function onBubblePointerDown(ev) {
    if (!els.mergeModal.hidden) return;
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
    for (const o of state.bubbles) {
      if (o.id === activeId) continue;
      const c = bubbleCenterClient(o);
      if (distance(pt, c) < MERGE_DISTANCE_PX) {
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
    const nx = (b.x + partner.x) / 2;
    const ny = (b.y + partner.y) / 2;
    pendingMerge = {
      idA: b.id,
      idB: partner.id,
      v1: b.value,
      v2: partner.value,
      sum: b.value + partner.value,
      nx,
      ny,
    };
    els.mergePrompt.textContent = b.value + " + " + partner.value;
    const sm = b.value + partner.value;
    const gain = pointsForOperandSum(sm);
    const pen = penaltyForOperandSum(sm);
    els.mergeHint.textContent =
      "Escribí el resultado. Si acertás: +" +
      gain +
      " pts. Si fallás: −" +
      pen +
      " pts (el puntaje no baja de 0).";
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
    applyScoreDelta(pointsForOperandSum(pm.sum));
    removeBubbleById(pm.idA);
    removeBubbleById(pm.idB);
    state.bubbles.push({
      id: nextId(),
      value: pm.sum,
      x: pm.nx,
      y: pm.ny,
      source: "derived",
    });
    hideMergeModalUI();
    renderBubbles();
    spawnMergeFireworks();
    setHelp("¡Muy bien! Sigue uniendo piezas para simplificar la suma.");
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

  function tryMergeOrPlace(b, el, centerX, centerY) {
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
    els.modalMsg.textContent =
      state.leftNumber +
      " + " +
      state.rightNumber +
      " = " +
      state.expectedResult +
      ". Usaste descomposición y fusión para llegar al resultado. " +
      "Llevás " +
      state.score +
      " pts.";
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
    const parts = decomposeParts(b.value);
    if (!parts) {
      const el = els.playArea.querySelector('.bubble[data-id="' + b.id + '"]');
      if (el) {
        el.classList.remove("bubble--shake");
        void el.offsetWidth;
        el.classList.add("bubble--shake");
      }
      setHelp(decomposeBlockedMessage(b.value));
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
    }
  }

  function onPointerUp(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const el = els.playArea.querySelector('.bubble[data-id="' + drag.id + '"]');
    const b = findBubble(drag.id);
    const hadDrag = drag;
    drag = null;
    clearMergeHighlights();
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
    if (tryMergeOrPlace(b, el, cx, cy)) {
      return;
    }
  }

  function bindGlobalPointer() {
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  }

  els.btnPlay.addEventListener("click", () => {
    cancelAnimationFrame(scoreAnimId);
    state.score = 0;
    scoreShown = 0;
    els.hudScore.textContent = "0";
    state.challengeIndex = 0;
    showScreen("game");
    startChallenge(false);
  });

  els.btnHome.addEventListener("click", () => {
    closeSuccessModal();
    closeMergeModalCancelled();
    showScreen("start");
  });

  els.btnReset.addEventListener("click", resetTurn);

  els.btnNew.addEventListener("click", newChallengeFromMenu);

  els.modalNext.addEventListener("click", () => {
    closeSuccessModal();
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
    if (n !== pendingMerge.sum) {
      applyScoreDelta(-penaltyForOperandSum(pendingMerge.sum));
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

  window.setInterval(() => {
    if (!els.screenGame.hidden && els.modal.hidden && els.mergeModal.hidden) {
      rotateHelp();
    }
  }, 12000);

  bindGlobalPointer();
  setHelp(HELP_MESSAGES[0]);
})();
