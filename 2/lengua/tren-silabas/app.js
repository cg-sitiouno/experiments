"use strict";

// ROUNDS cargado desde data.js

const _deck = { 1: [], 2: [], 3: [] };

function drawRounds(level, count) {
  if (_deck[level].length < count) {
    _deck[level].push(...shuffle([...ROUNDS[level]]));
  }
  return _deck[level].splice(0, count);
}

const CATEGORY_NAME = { 1: "Monosílaba", 2: "Bisílaba", 3: "Trisílaba", 4: "Polisílaba" };
const RESULT_MSGS = [
  "¡Sigue practicando, ya vas a mejorar!",
  "¡Bien! Vas aprendiendo a contar sílabas.",
  "¡Muy bien! Tienes buen ritmo.",
  "¡Perfecto! Eres un experto en sílabas. 🏆",
];
const TOTAL_ROUNDS = 10;
const POINTS_PER_CORRECT = 10;

let st = { level: 1, rounds: [], idx: 0, points: 0, answered: false };
let els;

function initEls() {
  els = {
    screens: {
      start:  document.getElementById("screen-start"),
      game:   document.getElementById("screen-game"),
      result: document.getElementById("screen-result"),
    },
    levelBtns:    document.querySelectorAll("[data-level]"),
    hudPoints:    document.getElementById("hud-points"),
    hudRound:     document.getElementById("hud-round"),
    hudLevel:     document.getElementById("hud-level"),
    wordDisplay:  document.getElementById("word-display"),
    syllableHint: document.getElementById("syllable-hint"),
    wagonBtns:    document.querySelectorAll("[data-answer]"),
    feedbackBar:  document.getElementById("feedback-bar"),
    feedbackText: document.getElementById("feedback-text"),
    resultStars:  document.getElementById("result-stars"),
    resultPts:    document.getElementById("result-points"),
    resultMsg:    document.getElementById("result-msg"),
    btnPlayAgain: document.getElementById("btn-play-again"),
    btnMenu:      document.getElementById("btn-menu"),
  };
}

function showScreen(name) {
  Object.entries(els.screens).forEach(([k, el]) => { el.hidden = k !== name; });
}

function startGame(level) {
  st.level    = level;
  st.rounds   = drawRounds(level, TOTAL_ROUNDS);
  st.idx      = 0;
  st.points   = 0;
  st.answered = false;
  showScreen("game");
  renderRound();
}

function renderRound() {
  const r = st.rounds[st.idx];
  els.hudPoints.textContent  = st.points;
  els.hudRound.textContent   = `${st.idx + 1} / ${TOTAL_ROUNDS}`;
  els.hudLevel.textContent   = `Nivel ${st.level}`;
  els.wordDisplay.textContent = r.word;
  els.syllableHint.textContent = "";   // vacío hasta que se responda
  els.feedbackBar.hidden = true;
  els.feedbackBar.className = "feedback-bar";
  els.wagonBtns.forEach(b => {
    b.disabled = false;
    b.classList.remove("wagon-btn--correct", "wagon-btn--wrong");
  });
  st.answered = false;
}

function handleAnswer(answer) {
  if (st.answered) return;
  st.answered = true;
  const r = st.rounds[st.idx];
  // count 4 en data significa 4+ (polisílaba)
  const correct = Number(answer) === r.count || (r.count >= 4 && Number(answer) === 4);

  // Revelar separación silábica como hint en el feedback
  const breakdown = r.syllables.join(" · ");

  els.wagonBtns.forEach(b => {
    b.disabled = true;
    const bCount = Number(b.dataset.answer);
    const isCorrectBtn = bCount === r.count || (r.count >= 4 && bCount === 4);
    if (isCorrectBtn) b.classList.add("wagon-btn--correct");
    else if (Number(b.dataset.answer) === Number(answer) && !correct) b.classList.add("wagon-btn--wrong");
  });

  if (correct) {
    st.points += POINTS_PER_CORRECT;
    els.feedbackText.textContent = `¡Correcto! 🎉  ${breakdown}`;
    els.feedbackBar.className = "feedback-bar feedback-bar--ok";
  } else {
    const correctName = CATEGORY_NAME[r.count >= 4 ? 4 : r.count];
    els.feedbackText.textContent = `Era ${correctName}: ${breakdown}`;
    els.feedbackBar.className = "feedback-bar feedback-bar--no";
  }
  els.syllableHint.textContent = breakdown;
  els.feedbackBar.hidden = false;
  setTimeout(nextRound, 1600);
}

function nextRound() {
  st.idx++;
  if (st.idx >= TOTAL_ROUNDS) showResult(); else renderRound();
}

function showResult() {
  const pct   = st.points / (TOTAL_ROUNDS * POINTS_PER_CORRECT);
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
  els.resultStars.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  els.resultPts.textContent   = `${st.points} / ${TOTAL_ROUNDS * POINTS_PER_CORRECT} puntos`;
  els.resultMsg.textContent   = RESULT_MSGS[stars];
  showScreen("result");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

document.addEventListener("DOMContentLoaded", () => {
  initEls();
  els.levelBtns.forEach(btn => btn.addEventListener("click", () => startGame(Number(btn.dataset.level))));
  els.wagonBtns.forEach(b => b.addEventListener("click", () => handleAnswer(b.dataset.answer)));
  els.btnPlayAgain.addEventListener("click", () => startGame(st.level));
  els.btnMenu.addEventListener("click", () => showScreen("start"));
  showScreen("start");
});
