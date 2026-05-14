"use strict";

// ROUNDS cargado desde data.js

const _deck = { 1: [], 2: [], 3: [] };

function drawRounds(level, count) {
  if (_deck[level].length < count) {
    _deck[level].push(...shuffle([...ROUNDS[level]]));
  }
  return _deck[level].splice(0, count);
}

const RESULT_MSGS = [
  "¡Sigue practicando! La ortografía mejora con esfuerzo.",
  "¡Bien! Vas aprendiendo las reglas de la C, S y Z.",
  "¡Muy bien! Tienes buen ojo para la ortografía.",
  "¡Misión cumplida! Eres un experto en C/S/Z. 🏆",
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
    sentenceEl:   document.getElementById("sentence-display"),
    completedEl:  document.getElementById("completed-word"),
    letterBtns:   document.querySelectorAll("[data-letter]"),
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
  els.hudPoints.textContent = st.points;
  els.hudRound.textContent  = `${st.idx + 1} / ${TOTAL_ROUNDS}`;
  els.hudLevel.textContent  = `Nivel ${st.level}`;
  els.sentenceEl.innerHTML  = r.sentence.replace(/___/g, '<span class="blank">___</span>');
  els.completedEl.textContent = "";
  els.feedbackBar.hidden = true;
  els.feedbackBar.className = "feedback-bar";
  els.letterBtns.forEach(b => {
    b.disabled = false;
    b.classList.remove("letter-btn--correct", "letter-btn--wrong");
  });
  st.answered = false;
}

function handleAnswer(letter) {
  if (st.answered) return;
  st.answered = true;
  const r = st.rounds[st.idx];
  const correct = letter === r.answer;

  els.letterBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.letter === r.answer) b.classList.add("letter-btn--correct");
    else if (b.dataset.letter === letter && !correct) b.classList.add("letter-btn--wrong");
  });

  els.sentenceEl.innerHTML = r.sentence.replace(
    /___/g,
    `<span class="blank blank--filled">${r.answer.toUpperCase()}</span>`
  );
  els.completedEl.textContent = r.completed;

  if (correct) {
    st.points += POINTS_PER_CORRECT;
    els.feedbackText.textContent = "¡Correcto! 🎯";
    els.feedbackBar.className = "feedback-bar feedback-bar--ok";
  } else {
    els.feedbackText.textContent = `Era: ${r.answer.toUpperCase()}`;
    els.feedbackBar.className = "feedback-bar feedback-bar--no";
  }
  els.feedbackBar.hidden = false;
  setTimeout(nextRound, 1500);
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
  els.letterBtns.forEach(b => b.addEventListener("click", () => handleAnswer(b.dataset.letter)));
  els.btnPlayAgain.addEventListener("click", () => startGame(st.level));
  els.btnMenu.addEventListener("click", () => showScreen("start"));
  showScreen("start");
});
