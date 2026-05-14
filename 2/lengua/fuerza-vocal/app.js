"use strict";

// ROUNDS cargado desde data.js

const _deck = { 1: [], 2: [], 3: [] };

function drawRounds(level, count) {
  if (_deck[level].length < count) {
    _deck[level].push(...shuffle([...ROUNDS[level]]));
  }
  return _deck[level].splice(0, count);
}

const LABEL = { fuerte: "Fuerte (a · e · o)", debil: "Débil (i · u)" };
const VOWEL_COLOR = {
  a: "#fb923c", e: "#f97316", o: "#ea580c", // cálidas — fuertes
  i: "#38bdf8", u: "#0ea5e9",               // frías — débiles
};
const RESULT_MSGS = [
  "¡Sigue practicando, ya vas a mejorar!",
  "¡Bien! Vas aprendiendo las vocales.",
  "¡Muy bien! Ya distingues fuertes de débiles.",
  "¡Perfecto! Eres un experto en vocales. 🏆",
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
    vowelDisplay: document.getElementById("vowel-display"),
    vowelWord:    document.getElementById("vowel-word"),
    choices:      document.querySelectorAll("[data-answer]"),
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
  els.hudPoints.textContent   = st.points;
  els.hudRound.textContent    = `${st.idx + 1} / ${TOTAL_ROUNDS}`;
  els.hudLevel.textContent    = `Nivel ${st.level}`;
  els.vowelDisplay.textContent = r.vowel.toUpperCase();
  els.vowelDisplay.style.color = VOWEL_COLOR[r.vowel] ?? "#f4f7ff";
  els.vowelWord.textContent    = r.word.toUpperCase();
  els.feedbackBar.hidden = true;
  els.feedbackBar.className = "feedback-bar";
  els.choices.forEach(c => {
    c.disabled = false;
    c.classList.remove("choice--correct", "choice--wrong");
  });
  st.answered = false;
}

function handleAnswer(answer) {
  if (st.answered) return;
  st.answered = true;
  const correct = answer === st.rounds[st.idx].answer;
  els.choices.forEach(c => {
    c.disabled = true;
    if (c.dataset.answer === st.rounds[st.idx].answer) c.classList.add("choice--correct");
    else if (c.dataset.answer === answer && !correct)   c.classList.add("choice--wrong");
  });
  if (correct) {
    st.points += POINTS_PER_CORRECT;
    els.feedbackText.textContent = "¡Correcto! 🎉";
    els.feedbackBar.className = "feedback-bar feedback-bar--ok";
  } else {
    els.feedbackText.textContent = `Era: ${LABEL[st.rounds[st.idx].answer]}`;
    els.feedbackBar.className = "feedback-bar feedback-bar--no";
  }
  els.feedbackBar.hidden = false;
  setTimeout(nextRound, 1400);
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
  els.choices.forEach(c => c.addEventListener("click", () => handleAnswer(c.dataset.answer)));
  els.btnPlayAgain.addEventListener("click", () => startGame(st.level));
  els.btnMenu.addEventListener("click", () => showScreen("start"));
  showScreen("start");
});
