"use client";

import { useReducer, useCallback } from "react";
import { evaluateGuess, type LetterFeedback } from "@/app/lib/game-logic";
import { type WordEntry } from "@/app/lib/words";

export type GamePhase = "idle" | "playing" | "won" | "lost";

export interface GuessRecord {
  word: string;
  feedback: LetterFeedback[];
}

export interface GameState {
  phase: GamePhase;
  targetWord: string;
  theme: string;
  guesses: GuessRecord[];
  startTime: number;
  solveTime: number | null;
  error: string | null;
}

export type GameAction =
  | { type: "START_ROUND"; word: string; theme: string }
  | { type: "SUBMIT_GUESS"; guess: string }
  | { type: "TIME_UP" }
  | { type: "PLAY_AGAIN"; word: string; theme: string }
  | { type: "CLEAR_ERROR" };

const initialState: GameState = {
  phase: "idle",
  targetWord: "",
  theme: "",
  guesses: [],
  startTime: 0,
  solveTime: null,
  error: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_ROUND":
      return {
        ...initialState,
        phase: "playing",
        targetWord: action.word.toUpperCase(),
        theme: action.theme,
        startTime: Date.now(),
      };

    case "SUBMIT_GUESS": {
      if (state.phase !== "playing") return state;

      const guess = action.guess.toUpperCase();

      // Validate length
      if (guess.length !== state.targetWord.length) {
        return { ...state, error: `Word must be ${state.targetWord.length} letters` };
      }

      // Validate A-Z only
      if (!/^[A-Z]+$/.test(guess)) {
        return { ...state, error: "Letters only" };
      }

      const feedback = evaluateGuess(guess, state.targetWord);
      const isCorrect = guess === state.targetWord;

      const newGuess: GuessRecord = { word: guess, feedback };

      return {
        ...state,
        guesses: [newGuess, ...state.guesses],
        phase: isCorrect ? "won" : state.phase,
        solveTime: isCorrect ? Date.now() - state.startTime : state.solveTime,
        error: null,
      };
    }

    case "TIME_UP":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "lost" };

    case "PLAY_AGAIN":
      return {
        ...initialState,
        phase: "playing",
        targetWord: action.word.toUpperCase(),
        theme: action.theme,
        startTime: Date.now(),
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

/** Pick a random word, avoiding the given previous word */
export function pickWord(
  words: WordEntry[],
  previousWord?: string
): WordEntry {
  const candidates = previousWord
    ? words.filter((w) => w.word !== previousWord)
    : words;
  const pool = candidates.length > 0 ? candidates : words;
  return pool[Math.floor(Math.random() * pool.length)];
}
