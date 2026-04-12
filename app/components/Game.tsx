"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { evaluateGuess, computeSegmentOverlap, type LetterFeedback } from "@/app/lib/game-logic";
import { type WordEntry } from "@/app/lib/words";
import { type DisplayState } from "./SegmentDisplay";
import { CHAR_MAP, isSegmentOn, SEGMENT_COUNT } from "@/app/lib/segments";
import WordDisplay from "./WordDisplay";
import GuessInput from "./GuessInput";
import GuessHistory from "./GuessHistory";
import ResultsScreen from "./ResultsScreen";
import AlphabetStrip from "./AlphabetStrip";

const MAX_GUESSES = 4;

// --- State types ---

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
  error: string | null;
}

export type GameAction =
  | { type: "START_ROUND"; word: string; theme: string }
  | { type: "SUBMIT_GUESS"; guess: string }
  | { type: "PLAY_AGAIN"; word: string; theme: string }
  | { type: "CLEAR_ERROR" };

const initialState: GameState = {
  phase: "idle",
  targetWord: "",
  theme: "",
  guesses: [],
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
      };

    case "SUBMIT_GUESS": {
      if (state.phase !== "playing") return state;
      const guess = action.guess.toUpperCase();

      if (guess.length !== state.targetWord.length) {
        return { ...state, error: `Word must be ${state.targetWord.length} letters` };
      }
      if (!/^[A-Z]+$/.test(guess)) {
        return { ...state, error: "Letters only" };
      }

      const feedback = evaluateGuess(guess, state.targetWord);
      const isCorrect = guess === state.targetWord;
      const newGuesses = [{ word: guess, feedback }, ...state.guesses];
      const outOfGuesses = newGuesses.length >= MAX_GUESSES && !isCorrect;

      return {
        ...state,
        guesses: newGuesses,
        phase: isCorrect ? "won" : outOfGuesses ? "lost" : state.phase,
        error: null,
      };
    }

    case "PLAY_AGAIN":
      return {
        ...initialState,
        phase: "playing",
        targetWord: action.word.toUpperCase(),
        theme: action.theme,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

function pickWord(words: WordEntry[], previousWord?: string): WordEntry {
  const candidates = previousWord
    ? words.filter((w) => w.word !== previousWord)
    : words;
  const pool = candidates.length > 0 ? candidates : words;
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- Component ---

interface GameProps {
  words: WordEntry[];
}

export default function Game({ words }: GameProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Start first round on mount
  useEffect(() => {
    if (state.phase === "idle" && words.length > 0) {
      const entry = pickWord(words);
      dispatch({ type: "START_ROUND", word: entry.word, theme: entry.theme });
    }
  }, [state.phase, words]);

  const isPlaying = state.phase === "playing";

  // Accumulate revealed segments from all guesses.
  // For each position, the union of segment overlaps across every guess.
  const revealed: boolean[][] = useMemo(() => {
    const acc: boolean[][] = Array.from({ length: state.targetWord.length }, () =>
      new Array(SEGMENT_COUNT).fill(false)
    );

    // Walk guesses oldest-first (they're stored newest-first)
    for (let gi = state.guesses.length - 1; gi >= 0; gi--) {
      const guess = state.guesses[gi];
      const overlap = computeSegmentOverlap(guess.word, state.targetWord);
      for (let ci = 0; ci < overlap.length; ci++) {
        for (let si = 0; si < SEGMENT_COUNT; si++) {
          if (overlap[ci][si]) acc[ci][si] = true;
        }
      }
      // If letter was exactly correct, reveal ALL segments for that position
      for (let ci = 0; ci < guess.feedback.length; ci++) {
        if (guess.feedback[ci] === "correct") {
          const code = CHAR_MAP[state.targetWord[ci]?.toUpperCase()] ?? 0;
          for (let si = 0; si < SEGMENT_COUNT; si++) {
            if (isSegmentOn(code, si)) acc[ci][si] = true;
          }
        }
      }
    }

    // If game is over (lost), reveal everything
    if (state.phase === "lost") {
      for (let ci = 0; ci < state.targetWord.length; ci++) {
        const code = CHAR_MAP[state.targetWord[ci]?.toUpperCase()] ?? 0;
        for (let si = 0; si < SEGMENT_COUNT; si++) {
          if (isSegmentOn(code, si)) acc[ci][si] = true;
        }
      }
    }

    return acc;
  }, [state.guesses, state.targetWord, state.phase]);

  // Check which positions are fully revealed
  const fullyRevealedPositions: boolean[] = state.targetWord
    .split("")
    .map((char, ci) => {
      const code = CHAR_MAP[char.toUpperCase()];
      if (!code) return false;
      for (let si = 0; si < SEGMENT_COUNT; si++) {
        if (isSegmentOn(code, si) && !revealed[ci]?.[si]) {
          return false;
        }
      }
      return true;
    });

  // Collect letters that are fully revealed (for alphabet strip)
  const fullyRevealedLetters = new Set<string>();
  state.targetWord.split("").forEach((char, i) => {
    if (fullyRevealedPositions[i]) {
      fullyRevealedLetters.add(char.toUpperCase());
    }
  });

  // Build locked-letters: green if exact match guessed OR all segments revealed
  const lockedLetters: DisplayState[] = state.targetWord
    .split("")
    .map((_char, i) => {
      for (const guess of state.guesses) {
        if (guess.feedback[i] === "correct") {
          return "green" as DisplayState;
        }
      }
      if (fullyRevealedPositions[i]) {
        return "green" as DisplayState;
      }
      return "dim" as DisplayState;
    });

  const handleGuess = useCallback((guess: string) => {
    dispatch({ type: "SUBMIT_GUESS", guess });
  }, []);

  const handleClearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const handlePlayAgain = useCallback(() => {
    const entry = pickWord(words, state.targetWord);
    dispatch({ type: "PLAY_AGAIN", word: entry.word, theme: entry.theme });
  }, [words, state.targetWord]);

  if (!state.targetWord) return null;

  const guessesRemaining = MAX_GUESSES - state.guesses.length;

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
        gap: "16px",
        overflow: "hidden",
        maxHeight: "100dvh",
      }}
    >
      {/* Theme hint */}
      <div
        style={{
          fontSize: "1.8rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--amber)",
          fontWeight: "bold",
        }}
      >
        &ldquo;{state.theme}&rdquo;
      </div>

      {/* Word display + alphabet grouped tight */}
      <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "120px", gap: 0 }}>
        <WordDisplay
          word={state.targetWord}
          revealedSegments={revealed}
          lockedLetters={lockedLetters}
          isVictory={state.phase === "won"}
        />
        <AlphabetStrip fullyRevealedLetters={fullyRevealedLetters} />
      </div>

      {/* Guess counter */}
      {isPlaying && (
        <div
          style={{
            fontSize: "1rem",
            color: guessesRemaining <= 1 ? "var(--danger)" : "var(--text-muted)",
            letterSpacing: "0.1em",
          }}
        >
          {guessesRemaining} {guessesRemaining === 1 ? "guess" : "guesses"} remaining
        </div>
      )}

      {/* Input */}
      <GuessInput
        targetLength={state.targetWord.length}
        onSubmit={handleGuess}
        disabled={!isPlaying}
        error={state.error}
        onClearError={handleClearError}
      />

      {/* Guess history */}
      <GuessHistory guesses={state.guesses} />

      {/* Results overlay */}
      <ResultsScreen
        phase={state.phase}
        targetWord={state.targetWord}
        solveTime={null}
        guessCount={state.guesses.length}
        onPlayAgain={handlePlayAgain}
      />
    </main>
  );
}
