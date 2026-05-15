import {
  CONFIG,
  RESULT_MSGS,
  ARCADE_TAP_MAX_MS,
  ARCADE_TAP_MAX_MOVE_PX,
  ARCADE_FRICTION,
  ARCADE_SHOT_SPEED,
  ARCADE_WALL_BOUNCE,
  MERGE_DISTANCE_PX,
  DRAG_THRESHOLD_PX,
  MIN_DECOMPOSE,
} from "./config.js";
import { createInitialState } from "./state/gameState.js";
import { makeQuestion } from "./domain/question.js";
import {
  arcadePhysicsStep,
  arcadeRadiusPx,
  effectiveArcadeRadius,
} from "./logic/arcadePhysics.js";

let st = createInitialState();
let els;

/** Limpia mensaje de error temporal del paso 1 (hint). */
let analyzerCollectHintResetTimer = 0;

function initEls() {
  els = {
    screens: {
      start:  document.getElementById("screen-start"),
      game:   document.getElementById("screen-game"),
      result: document.getElementById("screen-result"),
    },
    levelBtns:          document.querySelectorAll("[data-level]"),
    hudPoints:          document.getElementById("hud-points"),
    hudRound:           document.getElementById("hud-round"),
    hudLevel:           document.getElementById("hud-level"),
    timerWrap:          document.getElementById("timer-wrap"),
    timerBar:           document.getElementById("timer-bar"),
    question:           document.getElementById("question"),
    answerBtns:         document.querySelectorAll(".answer-btn"),
    feedbackBar:        document.getElementById("feedback-bar"),
    feedbackTxt:        document.getElementById("feedback-text"),
    btnAnalyzer:        document.getElementById("btn-open-analyzer"),
    analyzer:           document.getElementById("analyzer"),
    analyzerStep:       document.getElementById("analyzer-step"),
    analyzerTitle:      document.getElementById("analyzer-title"),
    analyzerLabel:      document.getElementById("analyzer-label"),
    analyzerCollectHint: document.getElementById("analyzer-collect-hint"),
    analyzerCollectWrap: document.getElementById("analyzer-collect-wrap"),
    analyzerSumWrap:    document.getElementById("analyzer-sum-wrap"),
    analyzerFooterLine: document.getElementById("analyzer-footer-line"),
    analyzerSumHint:    document.getElementById("analyzer-sum-hint"),
    sumWorkspace:       document.getElementById("sum-workspace"),
    sumMergeHint:       document.getElementById("sum-merge-hint"),
    btnAnalyzerNext:    document.getElementById("btn-analyzer-next"),
    btnFlip:            document.getElementById("btn-flip"),
    btnResetAnalyzer:   document.getElementById("btn-reset-analyzer"),
    btnCloseAnalyzer:   document.getElementById("btn-close-analyzer"),
    arcadeField:        document.getElementById("arcade-field"),
    arcadeMuzzle:       document.getElementById("arcade-muzzle"),
    arcadeAmmo:         document.getElementById("arcade-ammo"),
    arcadeWeaponBtns:   document.querySelectorAll(".arcade-weapon"),
    arcadeAimSvg:       document.getElementById("arcade-aim-svg"),
    arcadeAimLine:      document.getElementById("arcade-aim-line"),
    collectionZone:     document.getElementById("collection-zone"),
    sumMergeModal:       document.getElementById("sum-merge-modal"),
    sumMergePrompt:      document.getElementById("sum-merge-prompt"),
    formSumMerge:        document.getElementById("form-sum-merge"),
    sumMergeAnswer:      document.getElementById("sum-merge-answer"),
    sumMergeFeedback:    document.getElementById("sum-merge-feedback"),
    btnSumMergeCancel:   document.getElementById("btn-sum-merge-cancel"),
    // resultado
    resultStars:        document.getElementById("result-stars"),
    resultPts:          document.getElementById("result-points"),
    resultMsg:          document.getElementById("result-msg"),
    btnPlayAgain:       document.getElementById("btn-play-again"),
    btnMenu:            document.getElementById("btn-menu"),
  };
}

function showScreen(name) {
  Object.entries(els.screens).forEach(([k, el]) => { el.hidden = k !== name; });
}

// ── Flujo de juego ───────────────────────────────────────────────────────────

function startGame(level) {
  st.level  = level;
  st.round  = 0;
  st.points = 0;
  showScreen("game");
  nextRound();
}

function nextRound() {
  st.round++;
  if (st.round > CONFIG.ROUNDS) { showResult(); return; }

  st.answered        = false;
  st.analyzerOpen    = false;
  st.analyzerFlipped = false;
  st.q = makeQuestion(st.level);

  els.hudLevel.textContent  = `Nivel ${st.level}`;
  els.hudRound.textContent  = `${st.round} / ${CONFIG.ROUNDS}`;
  els.hudPoints.textContent = `${st.points} pts`;
  els.question.textContent  = `${st.q.a} × ${st.q.b} = ?`;

  els.answerBtns.forEach((btn, i) => {
    btn.textContent = st.q.options[i];
    btn.disabled    = false;
    btn.className   = "answer-btn";
  });

  els.feedbackBar.hidden = true;
  els.analyzer.hidden    = true;

  const canAnalyze = st.q.product <= CONFIG.MAX_ANALYZER_PRODUCT;
  els.btnAnalyzer.hidden   = !canAnalyze;
  els.btnAnalyzer.disabled = false;

  startTimer(CONFIG.LEVELS[st.level].timeMs);
}

// ── Timer (pausable) ─────────────────────────────────────────────────────────

function startTimer(ms) {
  clearTimeout(st.urgencyId);
  clearTimeout(st.timeoutId);
  st.timerTotalMs   = ms;
  st.timerElapsedMs = 0;
  st.timerLastStart = Date.now();

  els.timerBar.style.transition = "none";
  els.timerBar.style.width      = "100%";
  els.timerBar.className        = "timer-bar";
  els.timerBar.offsetWidth;
  els.timerBar.style.transition = `width ${ms}ms linear`;
  els.timerBar.style.width      = "0%";

  _scheduleCallbacks(ms, 0);
}

function _scheduleCallbacks(totalMs, elapsedMs) {
  const remaining    = totalMs - elapsedMs;
  const halfOriginal = CONFIG.LEVELS[st.level].timeMs / 2;
  const urgencyDelay = halfOriginal - elapsedMs;

  if (urgencyDelay > 0) {
    st.urgencyId = setTimeout(() => {
      if (!st.answered && !st.analyzerOpen)
        els.timerBar.classList.add("timer-bar--urgent");
    }, urgencyDelay);
  } else {
    els.timerBar.classList.add("timer-bar--urgent");
  }

  st.timeoutId = setTimeout(() => {
    if (!st.answered && !st.analyzerOpen) handleTimeout();
  }, remaining);
}

function pauseTimer() {
  st.timerElapsedMs += Date.now() - st.timerLastStart;
  clearTimeout(st.urgencyId);
  clearTimeout(st.timeoutId);
  const wrapW = parseFloat(getComputedStyle(els.timerWrap).width) || 1;
  const barW  = parseFloat(getComputedStyle(els.timerBar).width);
  els.timerBar.style.transition = "none";
  els.timerBar.style.width = `${(barW / wrapW) * 100}%`;
}

function resumeTimer() {
  const remaining = Math.max(500, st.timerTotalMs - st.timerElapsedMs);
  st.timerLastStart = Date.now();
  els.timerBar.offsetWidth;
  els.timerBar.style.transition = `width ${remaining}ms linear`;
  els.timerBar.style.width = "0%";
  _scheduleCallbacks(st.timerTotalMs, st.timerElapsedMs);
}

function stopTimer() {
  clearTimeout(st.urgencyId);
  clearTimeout(st.timeoutId);
  els.timerBar.style.transition = "none";
}

// ── Respuestas ───────────────────────────────────────────────────────────────

function handleAnswer(idx) {
  if (st.answered) return;
  st.answered = true;
  stopTimer();

  const chosen  = st.q.options[idx];
  const correct = chosen === st.q.product;

  if (correct) {
    st.points += CONFIG.POINTS_BASE;
    showFeedback("✓ ¡Correcto!", true);
  } else {
    showFeedback(`✗  Era ${st.q.product}`, false);
  }

  revealAnswers(idx, correct);
  setTimeout(nextRound, 1400);
}

function handleTimeout() {
  st.answered = true;
  showFeedback(`⏱  Tiempo. Era ${st.q.product}`, false);
  revealAnswers(-1, false);
  setTimeout(nextRound, 1400);
}

function revealAnswers(chosenIdx, correct) {
  els.answerBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (Number(btn.textContent) === st.q.product) btn.classList.add("answer-btn--correct");
    else if (i === chosenIdx && !correct)           btn.classList.add("answer-btn--wrong");
  });
}

function showFeedback(msg, ok) {
  els.feedbackTxt.textContent = msg;
  els.feedbackBar.className   = "feedback-bar " + (ok ? "feedback-bar--ok" : "feedback-bar--no");
  els.feedbackBar.hidden      = false;
}

// ── Analizador (2 fases: agrupar unidades 1 → sumar con burbujas) ─────────────

function openAnalyzer() {
  if (st.answered || st.analyzerOpen) return;
  st.analyzerOpen = true;
  st.analyzerFlipped = false;
  els.btnAnalyzer.disabled = true;
  pauseTimer();
  renderAnalyzer();
  els.analyzer.hidden = false;
}

function closeAnalyzer() {
  stopArcadePhysics();
  resetArcadePointerState();
  closeSumMergeModal();
  st.analyzerOpen = false;
  els.analyzer.hidden = true;
  if (!st.answered) resumeTimer();
}

function flipAnalyzer() {
  if (st.analyzerPhase !== 1) return;
  st.analyzerFlipped = !st.analyzerFlipped;
  renderAnalyzer();
}

function resetAnalyzer() {
  renderAnalyzer();
}

function closeSumMergeModal() {
  st.sumMergeModalOpen = false;
  st.pendingSumMerge = null;
  if (!els.sumMergeModal) return;
  els.sumMergeModal.hidden = true;
  els.sumMergeFeedback.hidden = true;
  els.sumMergeFeedback.textContent = "";
  if (els.sumMergeAnswer) els.sumMergeAnswer.value = "";
}

function openSumMergeModal(elA, elB) {
  const va = Number(elA.dataset.value);
  const vb = Number(elB.dataset.value);
  st.sumMergeModalOpen = true;
  st.pendingSumMerge = { elA, elB, expected: va + vb };
  els.sumMergePrompt.textContent = `${va} + ${vb} = ?`;
  els.sumMergeFeedback.hidden = true;
  els.sumMergeFeedback.textContent = "";
  els.sumMergeAnswer.value = "";
  els.sumMergeModal.hidden = false;
  window.setTimeout(() => {
    els.sumMergeAnswer.focus();
    els.sumMergeAnswer.select();
  }, 30);
}

// ── Paso 1: minijuego arcade (cañón + física) ────────────────────────────────

/** @type {"shoot" | "peel"} */
let arcadeWeapon = "shoot";
let arcadeAmmoLeft = 0;
/** @type {Array<{ el: HTMLButtonElement, x: number, y: number, vx: number, vy: number, value: number }>} */
let arcadeBodies = [];
let arcadeRafId = 0;
let arcadePhysicsLastT = 0;

/** @type {{ pointerId: number, startT: number, startX: number, startY: number, maxMove: number, aiming: boolean } | null} */
let arcadeTouchPointer = null;
let arcadeSuppressClickUntil = 0;

/** @type {{ body: object, pointerId: number, startX: number, startY: number, dragging: boolean, clone: HTMLElement | null } | null} */
let arcadeBubbleDrag = null;

/** @type {{ chip: HTMLElement, pointerId: number, startX: number, startY: number, dragging: boolean, clone: HTMLElement | null } | null} */
let rackChipDrag = null;

function pointInRect(clientX, clientY, rect) {
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function resetRackLockIfEmpty() {
  if (els.collectionZone.children.length === 0) {
    st.analyzerLockedSize = null;
    st.analyzerGroupsTarget = 0;
  }
}

/**
 * Suelta la burbuja en la canasta si cumple las reglas (N = factor a o b; mismo N tras el primer grupo).
 * @returns {boolean} true si entró en la canasta
 */
function tryCommitBodyToCollection(body) {
  if (body.peelBolt) {
    shakeElement(body.el);
    showPhase1CollectError("El proyectil no va a la canasta.");
    return false;
  }
  const v = body.value;
  const { a, b: bf } = st.q;
  if (st.analyzerLockedSize == null) {
    if (v !== a && v !== bf) {
      shakeElement(body.el);
      showPhase1CollectError(`Solo grupos de ${a} o ${bf}.`);
      return false;
    }
    st.analyzerLockedSize = v;
    st.analyzerGroupsTarget = v === a ? bf : a;
  } else if (v !== st.analyzerLockedSize) {
    shakeElement(body.el);
    showPhase1CollectError(`Ya elegiste tamaño ${st.analyzerLockedSize}. No podés mezclar con ${v}.`);
    return false;
  }
  if (els.collectionZone.children.length >= st.analyzerGroupsTarget) {
    shakeElement(body.el);
    showPhase1CollectError("Canasta llena.");
    return false;
  }
  const idx = arcadeBodies.indexOf(body);
  if (idx >= 0) arcadeBodies.splice(idx, 1);
  body.el.remove();
  const chip = document.createElement("div");
  chip.className = "arcade-group-chip";
  chip.dataset.value = String(v);
  chip.textContent = String(v);
  chip.setAttribute("aria-label", `Grupo de ${v}`);
  chip.setAttribute("role", "button");
  chip.tabIndex = 0;
  bindCollectionChipPointer(chip);
  els.collectionZone.appendChild(chip);
  updateAnalyzerCollectFooter();
  return true;
}

function arcadeDetachBodyForDrag(body) {
  const idx = arcadeBodies.indexOf(body);
  if (idx >= 0) arcadeBodies.splice(idx, 1);
  body.el.classList.add("arcade-bubble--drag-source");
  body.el.style.opacity = "0.28";
  body.el.style.pointerEvents = "none";
}

function bindCollectionChipPointer(chip) {
  chip.addEventListener("pointerdown", onRackChipPointerDown);
}

function onRackChipPointerDown(e) {
  if (st.analyzerPhase !== 1) return;
  e.stopPropagation();
  const chip = /** @type {HTMLElement} */ (e.currentTarget);
  rackChipDrag = {
    chip,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    dragging: false,
    clone: null,
  };
  try {
    chip.setPointerCapture(e.pointerId);
  } catch (_) {}
  chip.addEventListener("pointermove", onRackChipDragMove);
  chip.addEventListener("pointerup", onRackChipDragEnd);
  chip.addEventListener("pointercancel", onRackChipDragEnd);
}

function onRackChipDragMove(e) {
  const d = rackChipDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
  if (!d.dragging && dist >= DRAG_THRESHOLD_PX) {
    d.dragging = true;
    const br = d.chip.getBoundingClientRect();
    d.clone = d.chip.cloneNode(true);
    d.clone.classList.add("arcade-group-chip--drag-clone");
    d.clone.removeAttribute("id");
    Object.assign(d.clone.style, {
      position: "fixed",
      left: `${br.left}px`,
      top: `${br.top}px`,
      width: `${br.width}px`,
      height: `${br.height}px`,
      margin: "0",
      pointerEvents: "none",
      zIndex: "10000",
      boxSizing: "border-box",
    });
    document.body.appendChild(d.clone);
    d.chip.style.opacity = "0.35";
  }
  if (d.dragging && d.clone) {
    const w = d.clone.offsetWidth;
    const h = d.clone.offsetHeight;
    d.clone.style.left = `${e.clientX - w / 2}px`;
    d.clone.style.top = `${e.clientY - h / 2}px`;
  }
}

function onRackChipDragEnd(e) {
  const d = rackChipDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  const chip = d.chip;
  chip.removeEventListener("pointermove", onRackChipDragMove);
  chip.removeEventListener("pointerup", onRackChipDragEnd);
  chip.removeEventListener("pointercancel", onRackChipDragEnd);
  try {
    chip.releasePointerCapture(e.pointerId);
  } catch (_) {}

  if (d.clone) {
    d.clone.remove();
    d.clone = null;
  }
  chip.style.opacity = "";

  if (d.dragging) {
    const fieldRect = els.arcadeField.getBoundingClientRect();
    if (pointInRect(e.clientX, e.clientY, fieldRect)) {
      const v = Number(chip.dataset.value);
      chip.remove();
      resetRackLockIfEmpty();
      const field = els.arcadeField;
      const fr = field.getBoundingClientRect();
      const x = Math.max(
        28,
        Math.min(fr.width - 28, e.clientX - fr.left + field.scrollLeft),
      );
      const y = Math.max(
        28,
        Math.min(fr.height - 28, e.clientY - fr.top + field.scrollTop),
      );
      arcadeCreateBody(x, y, v, (Math.random() - 0.5) * 55, (Math.random() - 0.5) * 55);
      updateAnalyzerCollectFooter();
    }
  }

  rackChipDrag = null;
}

function arcadeBubbleDragMove(e) {
  const d = arcadeBubbleDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
  if (!d.dragging && dist >= DRAG_THRESHOLD_PX) {
    d.dragging = true;
    arcadeDetachBodyForDrag(d.body);
    const br = d.body.el.getBoundingClientRect();
    d.clone = d.body.el.cloneNode(true);
    d.clone.classList.add("arcade-bubble--drag-clone");
    d.clone.removeAttribute("id");
    Object.assign(d.clone.style, {
      position: "fixed",
      left: `${br.left}px`,
      top: `${br.top}px`,
      width: `${br.width}px`,
      height: `${br.height}px`,
      margin: "0",
      padding: "0",
      pointerEvents: "none",
      zIndex: "10000",
      boxSizing: "border-box",
    });
    document.body.appendChild(d.clone);
  }
  if (d.dragging && d.clone) {
    const w = d.clone.offsetWidth;
    const h = d.clone.offsetHeight;
    d.clone.style.left = `${e.clientX - w / 2}px`;
    d.clone.style.top = `${e.clientY - h / 2}px`;
  }
}

function arcadeBubbleDragEnd(e) {
  const d = arcadeBubbleDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  const body = d.body;
  const el = body.el;
  try {
    el.releasePointerCapture(e.pointerId);
  } catch (_) {}
  el.removeEventListener("pointermove", arcadeBubbleDragMove);
  el.removeEventListener("pointerup", arcadeBubbleDragEnd);
  el.removeEventListener("pointercancel", arcadeBubbleDragEnd);

  if (d.clone) {
    d.clone.remove();
    d.clone = null;
  }

  if (d.dragging) {
    el.classList.remove("arcade-bubble--drag-source");
    el.style.opacity = "";
    el.style.pointerEvents = "";

    const rackRect = els.collectionZone.getBoundingClientRect();
    const fieldRect = els.arcadeField.getBoundingClientRect();
    const overRack = pointInRect(e.clientX, e.clientY, rackRect);

    if (overRack) {
      const ok = tryCommitBodyToCollection(body);
      if (!ok) {
        arcadeBodies.push(body);
        const field = els.arcadeField;
        const fr = field.getBoundingClientRect();
        body.x = Math.max(28, Math.min(fr.width - 28, e.clientX - fr.left + field.scrollLeft));
        body.y = Math.max(28, Math.min(fr.height - 28, e.clientY - fr.top + field.scrollTop));
        syncArcadeBodyDom(body);
      }
    } else if (pointInRect(e.clientX, e.clientY, fieldRect)) {
      arcadeBodies.push(body);
      const field = els.arcadeField;
      const fr = field.getBoundingClientRect();
      body.x = Math.max(28, Math.min(fr.width - 28, e.clientX - fr.left + field.scrollLeft));
      body.y = Math.max(28, Math.min(fr.height - 28, e.clientY - fr.top + field.scrollTop));
      syncArcadeBodyDom(body);
    } else {
      arcadeBodies.push(body);
      syncArcadeBodyDom(body);
    }
  } else if (arcadeWeapon === "peel") {
    arcadePeelBody(body);
  }

  arcadeBubbleDrag = null;
}

function arcadeOnBubblePointerDown(e, body) {
  if (st.analyzerPhase !== 1) return;
  if (body.peelBolt) return;
  e.stopPropagation();
  e.preventDefault();
  arcadeBubbleDrag = {
    body,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    dragging: false,
    clone: null,
  };
  try {
    body.el.setPointerCapture(e.pointerId);
  } catch (_) {}
  body.el.addEventListener("pointermove", arcadeBubbleDragMove);
  body.el.addEventListener("pointerup", arcadeBubbleDragEnd);
  body.el.addEventListener("pointercancel", arcadeBubbleDragEnd);
}
function arcadePressToPlay() {
  return globalThis.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ?? false;
}

function stopArcadePhysics() {
  if (arcadeRafId) {
    cancelAnimationFrame(arcadeRafId);
    arcadeRafId = 0;
  }
}

function clearArcadeFieldBubbles() {
  if (!els.arcadeField) return;
  const keep = new Set(["arcade-muzzle", "arcade-aim-svg"]);
  for (const n of [...els.arcadeField.children]) {
    if (keep.has(n.id)) continue;
    n.remove();
  }
}

function syncArcadeBodyDom(b) {
  const n = b.peelBolt ? 1 : b.value;
  const r = effectiveArcadeRadius(b);
  const s = r * 2;
  b.el.style.width = `${s}px`;
  b.el.style.height = `${s}px`;
  b.el.style.left = `${b.x - r}px`;
  b.el.style.top = `${b.y - r}px`;
  b.el.style.fontSize = `${Math.min(1.5, 0.82 + Math.sqrt(n) * 0.14)}rem`;
  if (b.peelBolt) {
    b.el.textContent = "−1";
    b.el.dataset.value = "-1";
    b.el.setAttribute("aria-label", "Menos uno");
    b.el.classList.add("arcade-bubble--peel-bolt");
  } else {
    b.el.textContent = String(b.value);
    b.el.dataset.value = String(b.value);
    b.el.setAttribute("aria-label", String(b.value));
    b.el.classList.remove("arcade-bubble--peel-bolt");
  }
}

function spawnArcadeMergeParticles(bubbleEl) {
  const zone = els.arcadeField;
  const zr = zone.getBoundingClientRect();
  const br = bubbleEl.getBoundingClientRect();
  const cx = br.left + br.width / 2 - zr.left + zone.scrollLeft;
  const cy = br.top + br.height / 2 - zr.top + zone.scrollTop;
  const colors = ["#7dd3fc", "#fde047", "#a7f3d0", "#e9d5ff", "#fff"];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "arcade-merge-particle";
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.35;
    const dist = 16 + Math.random() * 34;
    p.style.setProperty("--am-dx", `${Math.cos(ang) * dist}px`);
    p.style.setProperty("--am-dy", `${Math.sin(ang) * dist}px`);
    p.style.background = colors[i % colors.length];
    zone.appendChild(p);
    window.setTimeout(() => p.remove(), 580);
  }
}

function playArcadeMergeBurst(el) {
  el.classList.remove("arcade-bubble--merge-burst");
  void el.offsetWidth;
  el.classList.add("arcade-bubble--merge-burst");
  window.setTimeout(() => el.classList.remove("arcade-bubble--merge-burst"), 480);
  if (!prefersReducedMotion()) spawnArcadeMergeParticles(el);
}

function updateArcadeAmmoUi() {
  const wrap = els.arcadeAmmo;
  if (!wrap) return;
  const fill = wrap.querySelector(".arcade-fuel__fill");
  const cap = st.q?.product;
  const ratio =
    typeof cap === "number" && cap > 0 ? Math.max(0, Math.min(1, arcadeAmmoLeft / cap)) : 0;
  const pct = ratio * 100;
  if (fill) {
    fill.style.width = `${pct}%`;
  }
  const bucket = pct <= 0 ? 0 : pct < 34 ? 1 : pct < 67 ? 2 : 3;
  const texts = ["sin energía", "poca energía", "energía media", "bastante energía"];
  wrap.setAttribute("aria-valuenow", String(bucket));
  wrap.setAttribute("aria-valuemax", "3");
  wrap.setAttribute("aria-valuetext", texts[bucket]);
  wrap.classList.toggle("arcade-fuel--empty", pct <= 0);
}

/** Cada −1 aplicado a una burbuja > 1 recupera un disparo de uno (hasta el tope del nivel). */
function grantArcadeAmmoForPeel() {
  const cap = st.q?.product;
  if (typeof cap === "number" && cap > 0) {
    arcadeAmmoLeft = Math.min(cap, arcadeAmmoLeft + 1);
  } else {
    arcadeAmmoLeft += 1;
  }
  st.arcadeAmmoLeft = arcadeAmmoLeft;
  updateArcadeAmmoUi();
  setArcadeWeapon(arcadeWeapon);
}

/** Punta del cañón (alineado con CSS: alto 42px, bottom 10px, centrado). */
function getArcadeMuzzleCenterInField() {
  const field = els.arcadeField;
  const fr = field.getBoundingClientRect();
  const w = fr.width;
  const h = fr.height;
  return {
    x: w / 2 + field.scrollLeft,
    y: h - 10 - 42 + field.scrollTop,
  };
}

function clientToFieldXY(clientX, clientY) {
  const field = els.arcadeField;
  const fr = field.getBoundingClientRect();
  return {
    x: clientX - fr.left + field.scrollLeft,
    y: clientY - fr.top + field.scrollTop,
  };
}

function hideArcadeAimLine() {
  if (els.arcadeAimSvg) els.arcadeAimSvg.classList.remove("arcade-aim-svg--visible");
}

function muzzleRotationDegrees(mx, my, tx, ty) {
  const dx = tx - mx;
  const dy = ty - my;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

function updateArcadeAimVisual(clientX, clientY) {
  if (!els.arcadeField || !els.arcadeAimLine || !els.arcadeMuzzle || !els.arcadeAimSvg) return;
  const m = getArcadeMuzzleCenterInField();
  let p = clientToFieldXY(clientX, clientY);
  const fr = els.arcadeField.getBoundingClientRect();
  p.x = Math.max(0, Math.min(fr.width, p.x));
  p.y = Math.max(0, Math.min(fr.height, p.y));
  els.arcadeAimLine.setAttribute("x1", String(m.x));
  els.arcadeAimLine.setAttribute("y1", String(m.y));
  els.arcadeAimLine.setAttribute("x2", String(p.x));
  els.arcadeAimLine.setAttribute("y2", String(p.y));
  els.arcadeAimSvg.classList.add("arcade-aim-svg--visible");
  els.arcadeMuzzle.style.transform = `rotate(${muzzleRotationDegrees(m.x, m.y, p.x, p.y)}deg)`;
}

function resetArcadePointerState() {
  arcadeTouchPointer = null;
  arcadeSuppressClickUntil = 0;
  hideArcadeAimLine();
  if (els.arcadeMuzzle) els.arcadeMuzzle.style.transform = "rotate(0deg)";
}

function setArcadeWeapon(mode) {
  arcadeWeapon = mode;
  st.arcadeWeapon = mode;
  els.arcadeWeaponBtns.forEach((btn) => {
    const w = btn.getAttribute("data-weapon");
    const on = w === mode;
    btn.classList.toggle("arcade-weapon--active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  if (mode !== "shoot" && mode !== "peel") {
    hideArcadeAimLine();
    if (els.arcadeMuzzle) els.arcadeMuzzle.style.transform = "rotate(0deg)";
  }
  const { first, second } = phase1LabelFactors();
  const hints = {
    shoot:
      "Dispará +1 hacia el campo. Arrastrá burbujas a la canasta (solo tamaños " +
      `${first} o ${second}; el primero fija el tamaño).`,
    peel:
      "−1: dispará contra una burbuja > 1 o tocá sin arrastrar para pelar y desprender un 1. Podés devolver fichas de la canasta al campo arrastrando.",
  };
  els.analyzerCollectHint.textContent = mode === "peel" ? hints.peel : hints.shoot;
  els.analyzerCollectHint.classList.remove("analyzer__collect-hint--error");
}

function bindArcadeUiOnce() {
  if (bindArcadeUiOnce._done) return;
  if (!els.arcadeField) return;
  bindArcadeUiOnce._done = true;
  els.arcadeField.addEventListener("pointerdown", onArcadeFieldPointerDown);
  els.arcadeField.addEventListener("pointermove", onArcadeFieldPointerMove);
  els.arcadeField.addEventListener("pointerup", onArcadeFieldPointerUp);
  els.arcadeField.addEventListener("pointercancel", onArcadeFieldPointerCancel);
  els.arcadeField.addEventListener("pointerleave", onArcadeFieldPointerLeave);
  els.arcadeField.addEventListener("click", onArcadeFieldClick);
  els.arcadeWeaponBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const w = btn.getAttribute("data-weapon");
      if (w === "shoot" || w === "peel") setArcadeWeapon(/** @type {"shoot" | "peel"} */ (w));
    });
  });
}
bindArcadeUiOnce._done = false;

function arcadeRemoveBolt(bolt) {
  const idx = arcadeBodies.indexOf(bolt);
  if (idx >= 0) arcadeBodies.splice(idx, 1);
  bolt.el.remove();
}

/** Impacto del proyectil −1: solo baja el número en la misma burbuja (no se desprende un 1). */
function arcadePeelBubbleHitByBolt(b) {
  if (b.peelBolt || b.value <= 1) return;
  b.value -= 1;
  b.el.dataset.value = String(b.value);
  b.el.textContent = String(b.value);
  b.el.classList.remove("arcade-bubble--peel-source");
  void b.el.offsetWidth;
  b.el.classList.add("arcade-bubble--peel-source");
  window.setTimeout(() => b.el.classList.remove("arcade-bubble--peel-source"), 380);
  syncArcadeBodyDom(b);
  grantArcadeAmmoForPeel();
}

/** @returns {boolean} true si se restó 1 y salió una unidad (solo modo tocar burbuja con −1). */
function arcadePeelBubbleInPlace(b) {
  if (b.peelBolt || b.value <= 1) return false;
  b.value -= 1;
  b.el.dataset.value = String(b.value);
  b.el.textContent = String(b.value);
  const rP = arcadeRadiusPx(b.value);
  const rSpawn = arcadeRadiusPx(1);
  // Separar centros al menos rP + rSpawn + hueco: si quedan pegadas, el mismo frame las fusiona otra vez (2→1+1→2).
  const peelSpawnGapPx = 10;
  const separationX = rP + peelSpawnGapPx + rSpawn;
  arcadeCreateBody(
    b.x + separationX,
    b.y + (Math.random() - 0.5) * 8,
    1,
    (Math.random() - 0.5) * 60,
    (Math.random() - 0.5) * 60,
  );
  b.el.classList.remove("arcade-bubble--peel-source");
  void b.el.offsetWidth;
  b.el.classList.add("arcade-bubble--peel-source");
  window.setTimeout(() => b.el.classList.remove("arcade-bubble--peel-source"), 380);
  syncArcadeBodyDom(b);
  grantArcadeAmmoForPeel();
  return true;
}

function mergeBodiesKeepFirst(keep, drop) {
  if (keep.peelBolt || drop.peelBolt) return;
  keep.x = (keep.x + drop.x) / 2;
  keep.y = (keep.y + drop.y) / 2;
  keep.value += drop.value;
  keep.vx = (keep.vx + drop.vx) * 0.38;
  keep.vy = (keep.vy + drop.vy) * 0.38;
  const idx = arcadeBodies.indexOf(drop);
  if (idx >= 0) arcadeBodies.splice(idx, 1);
  drop.el.remove();
  keep.el.dataset.value = String(keep.value);
  keep.el.textContent = String(keep.value);
  playArcadeMergeBurst(keep.el);
  syncArcadeBodyDom(keep);
}

function arcadeStep(dt) {
  const fr = els.arcadeField.getBoundingClientRect();
  arcadePhysicsStep(arcadeBodies, {
    fieldW: fr.width,
    fieldH: fr.height,
    dt,
    friction: ARCADE_FRICTION,
    wallBounce: ARCADE_WALL_BOUNCE,
    maxSpeed: 500,
    syncDom: syncArcadeBodyDom,
    removeBolt: arcadeRemoveBolt,
    peelBubbleHitByBolt: arcadePeelBubbleHitByBolt,
    mergeBodiesKeepFirst,
  });
}

function arcadePhysicsTick(now) {
  if (st.analyzerPhase !== 1 || !st.analyzerOpen) {
    stopArcadePhysics();
    return;
  }
  const dt = Math.min(0.045, (now - arcadePhysicsLastT) / 1000);
  arcadePhysicsLastT = now;
  arcadeStep(dt);
  arcadeRafId = requestAnimationFrame(arcadePhysicsTick);
}

function startArcadePhysics() {
  stopArcadePhysics();
  arcadePhysicsLastT = performance.now();
  arcadeRafId = requestAnimationFrame(arcadePhysicsTick);
}

function arcadeCreateBody(x, y, value, vx, vy, peelBolt = false) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "arcade-bubble";
  els.arcadeField.appendChild(el);
  const body = {
    el,
    x,
    y,
    vx,
    vy,
    value: peelBolt ? -1 : value,
    peelBolt: !!peelBolt,
  };
  arcadeBodies.push(body);
  el.addEventListener("pointerdown", (ev) => arcadeOnBubblePointerDown(ev, body));
  syncArcadeBodyDom(body);
  return body;
}

function arcadePeelBody(b) {
  if (!arcadePeelBubbleInPlace(b)) shakeElement(b.el);
}

function arcadeFireToward(clientX, clientY) {
  if (st.analyzerPhase !== 1) return;
  const field = els.arcadeField;
  const fr = field.getBoundingClientRect();
  const tx = clientX - fr.left + field.scrollLeft;
  const ty = clientY - fr.top + field.scrollTop;
  const m = getArcadeMuzzleCenterInField();
  let dx = tx - m.x;
  let dy = ty - m.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  const isPeelShot = arcadeWeapon === "peel";
  if (!isPeelShot) {
    if (arcadeAmmoLeft <= 0) {
      showPhase1CollectError("Sin unos — reiniciá.");
      return;
    }
    arcadeAmmoLeft--;
    st.arcadeAmmoLeft = arcadeAmmoLeft;
    updateArcadeAmmoUi();
  }
  setArcadeWeapon(arcadeWeapon);
  const body = arcadeCreateBody(
    m.x,
    m.y,
    1,
    dx * ARCADE_SHOT_SPEED,
    dy * ARCADE_SHOT_SPEED,
    isPeelShot,
  );
  body.el.classList.add("arcade-bubble--shot");
  window.setTimeout(() => body.el.classList.remove("arcade-bubble--shot"), 200);
}

function onArcadeFieldPointerDown(e) {
  if (st.analyzerPhase !== 1) return;
  if (arcadeWeapon !== "shoot" && arcadeWeapon !== "peel") return;
  const el = /** @type {HTMLElement} */ (e.target);
  if (el.closest(".arcade-bubble")) return;
  const pressMode = arcadePressToPlay();
  const usePointerSession =
    e.pointerType === "touch" || e.pointerType === "pen" || (pressMode && e.pointerType === "mouse");
  if (!usePointerSession || e.button !== 0) return;
  arcadeTouchPointer = {
    pointerId: e.pointerId,
    startT: performance.now(),
    startX: e.clientX,
    startY: e.clientY,
    maxMove: 0,
    aiming: false,
  };
  try {
    els.arcadeField.setPointerCapture(e.pointerId);
  } catch (_) {}
  updateArcadeAimVisual(e.clientX, e.clientY);
  if (e.pointerType === "touch" || e.pointerType === "pen" || pressMode) e.preventDefault();
}

function onArcadeFieldPointerMove(e) {
  if (st.analyzerPhase !== 1) return;
  if (arcadeWeapon !== "shoot" && arcadeWeapon !== "peel") return;
  const targ = /** @type {HTMLElement} */ (e.target);
  const pressMode = arcadePressToPlay();

  if (!pressMode && e.pointerType === "mouse" && e.buttons === 0) {
    if (targ.closest(".arcade-bubble")) {
      hideArcadeAimLine();
      if (els.arcadeMuzzle) els.arcadeMuzzle.style.transform = "rotate(0deg)";
      return;
    }
    updateArcadeAimVisual(e.clientX, e.clientY);
    return;
  }

  if (arcadeTouchPointer && e.pointerId === arcadeTouchPointer.pointerId) {
    const d = Math.hypot(e.clientX - arcadeTouchPointer.startX, e.clientY - arcadeTouchPointer.startY);
    arcadeTouchPointer.maxMove = Math.max(arcadeTouchPointer.maxMove, d);
    if (d > ARCADE_TAP_MAX_MOVE_PX) arcadeTouchPointer.aiming = true;
    updateArcadeAimVisual(e.clientX, e.clientY);
  }
}

function onArcadeFieldPointerUp(e) {
  if (!arcadeTouchPointer || e.pointerId !== arcadeTouchPointer.pointerId) return;
  const stTouch = arcadeTouchPointer;
  arcadeTouchPointer = null;
  try {
    els.arcadeField.releasePointerCapture(e.pointerId);
  } catch (_) {}
  arcadeSuppressClickUntil = performance.now() + 480;
  const dur = performance.now() - stTouch.startT;
  const tap = dur <= ARCADE_TAP_MAX_MS && stTouch.maxMove <= ARCADE_TAP_MAX_MOVE_PX && !stTouch.aiming;
  if (tap) {
    if (arcadePressToPlay()) arcadeFireToward(e.clientX, e.clientY);
    else arcadeFireToward(stTouch.startX, stTouch.startY);
  }
}

function onArcadeFieldPointerCancel(e) {
  if (!arcadeTouchPointer || e.pointerId !== arcadeTouchPointer.pointerId) return;
  arcadeTouchPointer = null;
  try {
    els.arcadeField.releasePointerCapture(e.pointerId);
  } catch (_) {}
  arcadeSuppressClickUntil = performance.now() + 480;
}

function onArcadeFieldPointerLeave(e) {
  if (arcadeTouchPointer) return;
  if (arcadePressToPlay()) return;
  if (e.pointerType !== "mouse") return;
  hideArcadeAimLine();
  if (els.arcadeMuzzle) els.arcadeMuzzle.style.transform = "rotate(0deg)";
}

function onArcadeFieldClick(e) {
  if (st.analyzerPhase !== 1) return;
  if (arcadeWeapon !== "shoot" && arcadeWeapon !== "peel") return;
  if (arcadePressToPlay()) return;
  if (performance.now() < arcadeSuppressClickUntil) return;
  if ("pointerType" in e && /** @type {PointerEvent} */ (e).pointerType !== "mouse") return;
  const t = /** @type {HTMLElement} */ (e.target);
  if (t.closest(".arcade-bubble")) return;
  arcadeFireToward(e.clientX, e.clientY);
}

function phase1LabelFactors() {
  const { a, b } = st.q;
  return st.analyzerFlipped ? { first: b, second: a } : { first: a, second: b };
}

function defaultAnalyzerPhase1Hint() {
  const { first, second } = phase1LabelFactors();
  return `Arrastrá a la canasta solo burbujas de ${first} o ${second} (la primera fija el tamaño). +1 / −1 en la dock.`;
}

function clearAnalyzerCollectHintResetTimer() {
  if (analyzerCollectHintResetTimer) {
    window.clearTimeout(analyzerCollectHintResetTimer);
    analyzerCollectHintResetTimer = 0;
  }
}

function showPhase1Message(msg, asError) {
  if (asError) els.analyzerCollectHint.classList.add("analyzer__collect-hint--error");
  else els.analyzerCollectHint.classList.remove("analyzer__collect-hint--error");
  els.analyzerCollectHint.textContent = msg;
}

function showPhase1CollectError(msg) {
  showPhase1Message(msg, true);
  clearAnalyzerCollectHintResetTimer();
  analyzerCollectHintResetTimer = window.setTimeout(() => {
    analyzerCollectHintResetTimer = 0;
    els.analyzerCollectHint.classList.remove("analyzer__collect-hint--error");
    els.analyzerCollectHint.textContent = defaultAnalyzerPhase1Hint();
  }, 4200);
}

function shakeElement(el) {
  if (!el) return;
  el.classList.remove("arcade-bubble--shake");
  void el.offsetWidth;
  el.classList.add("arcade-bubble--shake");
}

function renderAnalyzer() {
  closeSumMergeModal();
  clearAnalyzerCollectHintResetTimer();
  els.analyzerCollectHint.classList.remove("analyzer__collect-hint--error");

  const { a, b, product } = st.q;

  st.analyzerPhase = 1;
  st.analyzerLockedSize = null;
  st.analyzerGroupsTarget = 0;
  st.arcadeAmmoLeft = product;
  arcadeAmmoLeft = product;

  stopArcadePhysics();
  arcadeBodies = [];
  clearArcadeFieldBubbles();
  resetArcadePointerState();

  els.analyzerStep.textContent = "1 / 2";
  els.analyzerTitle.textContent = `${a} × ${b} = ?`;
  if (els.analyzerLabel) {
    els.analyzerLabel.textContent = "";
    els.analyzerLabel.hidden = true;
  }

  els.analyzerCollectHint.textContent = defaultAnalyzerPhase1Hint();

  els.analyzerCollectWrap.hidden = false;
  els.analyzerSumWrap.hidden = true;
  els.btnFlip.disabled = false;
  els.btnAnalyzerNext.disabled = true;

  els.collectionZone.innerHTML = "";
  els.sumWorkspace.innerHTML = "";
  els.sumMergeHint.textContent = "";
  els.sumMergeHint.className = "sum-merge-hint";

  updateArcadeAmmoUi();
  bindArcadeUiOnce();
  setArcadeWeapon("shoot");
  startArcadePhysics();

  updateAnalyzerCollectFooter();
}

function updateAnalyzerCollectFooter() {
  const n = els.collectionZone.children.length;
  const { a, b } = st.q;
  const lock = st.analyzerLockedSize;
  const need = st.analyzerGroupsTarget;

  if (lock == null) {
    els.analyzerFooterLine.textContent = n
      ? `${n} en canasta · solo tamaños ${a} o ${b}`
      : `Canasta vacía · arrastrá grupos de ${a} o de ${b}`;
    els.btnAnalyzerNext.disabled = true;
  } else {
    els.analyzerFooterLine.textContent = `${n} / ${need} grupos de ${lock}`;
    els.btnAnalyzerNext.disabled = n !== need;
  }
}

function goAnalyzerSumPhase() {
  if (st.analyzerPhase !== 1) return;
  const lock = st.analyzerLockedSize;
  const need = st.analyzerGroupsTarget;
  if (lock == null || els.collectionZone.children.length !== need) return;

  for (const node of els.collectionZone.children) {
    if (Number(node.dataset.value) !== lock) {
      showPhase1CollectError(`Todos los grupos deben valer ${lock}. Revisá el panel o reiniciá.`);
      return;
    }
  }

  st.analyzerGroupSize = lock;
  st.analyzerNumGroups = need;

  clearAnalyzerCollectHintResetTimer();
  els.analyzerCollectHint.classList.remove("analyzer__collect-hint--error");

  closeSumMergeModal();
  st.analyzerPhase = 2;
  els.analyzerCollectWrap.hidden = true;
  els.analyzerSumWrap.hidden = false;
  els.btnFlip.disabled = true;

  els.analyzerStep.textContent = "Paso 2 de 2 — Sumar";
  els.analyzerFooterLine.textContent =
    `Fusioná arrastrando una burbuja sobre otra, o tocá sin mover para partir. Objetivo: ${st.q.product}.`;

  els.analyzerSumHint.textContent =
    "Cada burbuja vale lo que tenías en la cesta. Tocá una burbuja sin arrastrarla para partirla (como en Bubble Math Lab). Arrastrá una sobre otra para fusionar y escribir la suma.";

  const values = [];
  for (const node of els.collectionZone.children) {
    values.push(Number(node.dataset.value));
  }

  els.sumWorkspace.innerHTML = "";
  const n = values.length;
  values.forEach((v, i) => {
    const pct = ((i + 1) / (n + 1)) * 100;
    const leftPct = Math.min(88, Math.max(8, pct - 6));
    const el = document.createElement("button");
    el.type = "button";
    el.className = "sum-bubble";
    el.dataset.value = String(v);
    el.textContent = String(v);
    el.style.left = leftPct + "%";
    el.style.top = "36%";
    el.setAttribute("aria-label", `Burbuja ${v}`);
    initSumBubbleDrag(el);
    els.sumWorkspace.appendChild(el);
  });

  updateSumPhaseFeedback();
}

function updateSumPhaseFeedback(message, isOk) {
  if (typeof message === "string") {
    els.sumMergeHint.textContent = message;
    els.sumMergeHint.className = "sum-merge-hint" + (isOk ? " sum-merge-hint--ok" : "");
    return;
  }

  const nodes = els.sumWorkspace.querySelectorAll(".sum-bubble");
  if (nodes.length === 1) {
    const v = Number(nodes[0].dataset.value);
    if (v === st.q.product) {
      els.sumMergeHint.textContent =
        `¡Listo! ${v} = ${st.q.a} × ${st.q.b}. Volvé al juego y elegí la respuesta.`;
      els.sumMergeHint.className = "sum-merge-hint sum-merge-hint--ok";
    } else {
      els.sumMergeHint.textContent =
        v < st.q.product
          ? `Tenés ${v}. Seguí fusionando o usá Reiniciar.`
          : `Tenés ${v} (el objetivo era ${st.q.product}). Podés reiniciar el analizador.`;
      els.sumMergeHint.className = "sum-merge-hint";
    }
  } else {
    els.sumMergeHint.textContent = `${nodes.length} burbujas — tocá sin mover para partir o arrastrá para fusionar.`;
    els.sumMergeHint.className = "sum-merge-hint";
  }
}

// ── Fusión / descomposición burbujas (fase 2), misma lógica pedagógica que Bubble Math Lab ──

/** @type {{
 *   el: HTMLElement | null,
 *   clone: HTMLElement | null,
 *   grabOffset: { x: number, y: number } | null,
 *   halfW: number,
 *   halfH: number,
 *   pointerId: number | null,
 *   startClient: { x: number, y: number } | null,
 *   moved: boolean,
 * }} */
const sumDrag = {
  el: null,
  clone: null,
  grabOffset: null,
  halfW: 0,
  halfH: 0,
  pointerId: null,
  startClient: null,
  moved: false,
};

let sumDecomposeAnimating = false;

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

function pickDecadePlusUnits(n) {
  if (!Number.isFinite(n) || n <= 10 || n % 10 === 0) return null;
  const tens = Math.floor(n / 10) * 10;
  const ones = n % 10;
  if (ones === 0) return null;
  return [tens, ones];
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

function otherSumBubbleValues(excludeEl) {
  const out = [];
  for (const o of els.sumWorkspace.querySelectorAll(".sum-bubble")) {
    if (o === excludeEl) continue;
    out.push(Number(o.dataset.value));
  }
  return out;
}

function decomposePartsForSumBubble(el) {
  const n = Number(el.dataset.value);
  if (!Number.isFinite(n)) return null;
  const decadeUnits = pickDecadePlusUnits(n);
  if (decadeUnits) return decadeUnits;
  const others = otherSumBubbleValues(el);
  if (others.length > 0) {
    const tenPlus = pickTenPlusWhenMultipleOfTenOnBoard(n, others);
    if (tenPlus) return tenPlus;
    const friend = pickComplementTenSplit(n, others);
    if (friend) return friend;
  }
  return decomposePartsClassic(n);
}

function decomposeBlockedSumMessage(value) {
  if (value < MIN_DECOMPOSE) {
    return `Menor que ${MIN_DECOMPOSE}: no se parte. Fusioná con otra burbuja.`;
  }
  if (value === 5) {
    return "El 5 no se parte acá. Fusioná con otro número.";
  }
  return "Esa burbuja no se puede dividir así. Probá fusionar.";
}

function addSumBubbleToWorkspace(value, xPct, yPct, extraClass) {
  const nu = document.createElement("button");
  nu.type = "button";
  nu.className = "sum-bubble" + (extraClass ? " " + extraClass : "");
  nu.dataset.value = String(value);
  nu.textContent = String(value);
  nu.style.left = xPct + "%";
  nu.style.top = yPct + "%";
  nu.setAttribute("aria-label", `Burbuja ${value}`);
  initSumBubbleDrag(nu);
  els.sumWorkspace.appendChild(nu);
  return nu;
}

function finalizeDecomposeSum(el, v1, v2, ox, oy, x1, y1, x2, y2) {
  el.remove();
  const ws = els.sumWorkspace.getBoundingClientRect();
  const w = ws.width;
  const h = ws.height;
  const b1 = addSumBubbleToWorkspace(v1, x1, y1, "");
  const b2 = addSumBubbleToWorkspace(v2, x2, y2, "");
  if (!prefersReducedMotion()) {
    const fromX1 = ((ox - x1) / 100) * w;
    const fromY1 = ((oy - y1) / 100) * h;
    const fromX2 = ((ox - x2) / 100) * w;
    const fromY2 = ((oy - y2) / 100) * h;
    b1.style.setProperty("--split-from-x", fromX1 + "px");
    b1.style.setProperty("--split-from-y", fromY1 + "px");
    b2.style.setProperty("--split-from-x", fromX2 + "px");
    b2.style.setProperty("--split-from-y", fromY2 + "px");
    b1.classList.add("sum-bubble--emerge");
    b2.classList.add("sum-bubble--emerge");
    const clean = (node) => {
      node.classList.remove("sum-bubble--emerge");
      node.style.removeProperty("--split-from-x");
      node.style.removeProperty("--split-from-y");
    };
    b1.addEventListener(
      "animationend",
      (ev) => {
        if (!(ev.animationName || "").includes("sum-bubble-emerge")) return;
        clean(b1);
      },
      { once: true }
    );
    b2.addEventListener(
      "animationend",
      (ev) => {
        if (!(ev.animationName || "").includes("sum-bubble-emerge")) return;
        clean(b2);
      },
      { once: true }
    );
  }
  sumDecomposeAnimating = false;
  updateSumPhaseFeedback(`Partimos en ${v1} + ${v2}`, false);
  window.setTimeout(() => {
    els.sumMergeHint.className = "sum-merge-hint";
    updateSumPhaseFeedback();
  }, 850);
}

function tryDecomposeSumBubble(el) {
  if (st.sumMergeModalOpen || st.analyzerPhase !== 2) return;
  const n = Number(el.dataset.value);
  const parts = decomposePartsForSumBubble(el);
  if (!parts) {
    el.classList.remove("sum-bubble--shake");
    void el.offsetWidth;
    el.classList.add("sum-bubble--shake");
    updateSumPhaseFeedback(decomposeBlockedSumMessage(n), false);
    window.setTimeout(() => {
      el.classList.remove("sum-bubble--shake");
      updateSumPhaseFeedback();
    }, 2000);
    return;
  }
  if (sumDecomposeAnimating) return;

  const [v1, v2] = parts;
  const ox = parseFloat(el.style.left) || 40;
  const oy = parseFloat(el.style.top) || 36;
  const x1 = Math.max(8, ox - 10);
  const y1 = Math.min(82, oy + 6);
  const x2 = Math.min(88, ox + 10);
  const y2 = Math.min(82, oy + 6);

  if (prefersReducedMotion()) {
    sumDecomposeAnimating = true;
    finalizeDecomposeSum(el, v1, v2, ox, oy, x1, y1, x2, y2);
    return;
  }

  sumDecomposeAnimating = true;
  el.classList.add("sum-bubble--splitting");
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    finalizeDecomposeSum(el, v1, v2, ox, oy, x1, y1, x2, y2);
  };
  const tid = window.setTimeout(run, 580);
  el.addEventListener(
    "animationend",
    (ev) => {
      if (ev.target !== el) return;
      const name = ev.animationName || "";
      if (!name.includes("sum-bubble-splitting")) return;
      window.clearTimeout(tid);
      run();
    },
    { once: true }
  );
}

function initSumBubbleDrag(el) {
  el.addEventListener("pointerdown", onSumDragStart);
}

function bubbleCenterScreen(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function onSumDragStart(e) {
  e.preventDefault();
  if (st.analyzerPhase !== 2 || st.sumMergeModalOpen) return;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  sumDrag.el = el;
  sumDrag.grabOffset = {
    x: e.clientX - (rect.left + rect.width / 2),
    y: e.clientY - (rect.top + rect.height / 2),
  };
  sumDrag.halfW = rect.width / 2;
  sumDrag.halfH = rect.height / 2;
  sumDrag.startClient = { x: e.clientX, y: e.clientY };
  sumDrag.moved = false;
  sumDrag.pointerId = e.pointerId;

  const clone = el.cloneNode(true);
  Object.assign(clone.style, {
    position: "fixed",
    left: e.clientX - sumDrag.grabOffset.x - sumDrag.halfW + "px",
    top: e.clientY - sumDrag.grabOffset.y - sumDrag.halfH + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    pointerEvents: "none",
    opacity: "0.92",
    zIndex: "1000",
    cursor: "grabbing",
    margin: "0",
  });
  document.body.appendChild(clone);
  sumDrag.clone = clone;
  el.style.opacity = "0.2";
  el.setPointerCapture(e.pointerId);
  el.addEventListener("pointermove", onSumDragMove);
  el.addEventListener("pointerup", onSumDragEnd);
  el.addEventListener("pointercancel", onSumDragEnd);
}

function onSumDragMove(e) {
  if (!sumDrag.clone || !sumDrag.startClient || !sumDrag.grabOffset) return;
  const dx = e.clientX - sumDrag.startClient.x;
  const dy = e.clientY - sumDrag.startClient.y;
  if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) sumDrag.moved = true;

  sumDrag.clone.style.left = e.clientX - sumDrag.grabOffset.x - sumDrag.halfW + "px";
  sumDrag.clone.style.top = e.clientY - sumDrag.grabOffset.y - sumDrag.halfH + "px";
}

function onSumDragEnd(e) {
  if (!sumDrag.el || !sumDrag.grabOffset) return;
  const el = sumDrag.el;
  const grabOffset = sumDrag.grabOffset;
  const moved = sumDrag.moved;
  const pointerId = sumDrag.pointerId;

  el.removeEventListener("pointermove", onSumDragMove);
  el.removeEventListener("pointerup", onSumDragEnd);
  el.removeEventListener("pointercancel", onSumDragEnd);

  try {
    if (pointerId != null) el.releasePointerCapture(pointerId);
  } catch (_) {}

  if (sumDrag.clone) {
    sumDrag.clone.remove();
    sumDrag.clone = null;
  }
  sumDrag.el = null;
  sumDrag.grabOffset = null;
  sumDrag.pointerId = null;
  sumDrag.startClient = null;

  if (!moved) {
    el.style.opacity = "1";
    tryDecomposeSumBubble(el);
    return;
  }

  const scx = e.clientX - grabOffset.x;
  const scy = e.clientY - grabOffset.y;
  let partner = null;
  let best = MERGE_DISTANCE_PX;

  for (const o of els.sumWorkspace.querySelectorAll(".sum-bubble")) {
    if (o === el) continue;
    const c = bubbleCenterScreen(o);
    const d = Math.hypot(scx - c.x, scy - c.y);
    if (d < best) {
      best = d;
      partner = o;
    }
  }

  if (partner && best < MERGE_DISTANCE_PX) {
    el.style.opacity = "1";
    openSumMergeModal(el, partner);
  } else {
    const ws = els.sumWorkspace.getBoundingClientRect();
    let lx = ((scx - ws.left) / ws.width) * 100;
    let ly = ((scy - ws.top) / ws.height) * 100;
    lx = Math.min(88, Math.max(8, lx));
    ly = Math.min(82, Math.max(8, ly));
    el.style.left = lx + "%";
    el.style.top = ly + "%";
    el.style.opacity = "1";
  }
}

function applySumMerge(a, b) {
  const va = Number(a.dataset.value);
  const vb = Number(b.dataset.value);
  const sum = va + vb;

  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const ws = els.sumWorkspace.getBoundingClientRect();

  const cx = (ra.left + ra.width / 2 + rb.left + rb.width / 2) / 2;
  const cy = (ra.top + ra.height / 2 + rb.top + rb.height / 2) / 2;
  let lx = ((cx - ws.left) / ws.width) * 100;
  let ly = ((cy - ws.top) / ws.height) * 100;
  lx = Math.min(88, Math.max(8, lx));
  ly = Math.min(82, Math.max(8, ly));

  a.remove();
  b.remove();

  const nu = addSumBubbleToWorkspace(sum, lx, ly, "sum-bubble--pulse");
  window.setTimeout(() => nu.classList.remove("sum-bubble--pulse"), 500);

  updateSumPhaseFeedback(`${va} + ${vb} = ${sum}`, false);
  window.setTimeout(() => {
    els.sumMergeHint.className = "sum-merge-hint";
    updateSumPhaseFeedback();
  }, 850);
}

// ── Resultado ────────────────────────────────────────────────────────────────

function showResult() {
  const pct   = st.points / (CONFIG.ROUNDS * CONFIG.POINTS_BASE);
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
  els.resultStars.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  els.resultPts.textContent   = `${st.points} / ${CONFIG.ROUNDS * CONFIG.POINTS_BASE} puntos`;
  els.resultMsg.textContent   = RESULT_MSGS[stars];
  showScreen("result");
}

document.addEventListener("DOMContentLoaded", () => {
  initEls();
  els.levelBtns.forEach(btn =>
    btn.addEventListener("click", () => startGame(Number(btn.dataset.level)))
  );
  els.answerBtns.forEach((btn, i) =>
    btn.addEventListener("click", () => handleAnswer(i))
  );
  els.btnPlayAgain.addEventListener("click",      () => startGame(st.level));
  els.btnMenu.addEventListener("click",           () => showScreen("start"));
  els.btnAnalyzer.addEventListener("click", openAnalyzer);
  els.btnFlip.addEventListener("click", flipAnalyzer);
  els.btnResetAnalyzer.addEventListener("click", resetAnalyzer);
  els.btnCloseAnalyzer.addEventListener("click", closeAnalyzer);
  els.btnAnalyzerNext.addEventListener("click", goAnalyzerSumPhase);
  els.formSumMerge.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const pm = st.pendingSumMerge;
    if (!pm) return;
    const raw = els.sumMergeAnswer.value.trim();
    const n = parseInt(raw, 10);
    if (raw === "" || Number.isNaN(n)) {
      els.sumMergeFeedback.textContent = "Escribí un número.";
      els.sumMergeFeedback.hidden = false;
      return;
    }
    if (n !== pm.expected) {
      els.sumMergeFeedback.textContent = "No da ese resultado. Probá otra vez.";
      els.sumMergeFeedback.hidden = false;
      els.sumMergeAnswer.value = "";
      els.sumMergeAnswer.focus();
      return;
    }
    const { elA, elB } = pm;
    closeSumMergeModal();
    applySumMerge(elA, elB);
  });
  els.btnSumMergeCancel.addEventListener("click", closeSumMergeModal);
  els.sumMergeModal.querySelectorAll("[data-close-sum-merge]").forEach((n) => {
    n.addEventListener("click", closeSumMergeModal);
  });
  showScreen("start");
});
