"use client";

import { useReducer, useCallback, useEffect } from "react";
import { evaluateGuess, type LetterFeedback } from "@/app/lib/game-logic";
import { type WordEntry } from "@/app/lib/words";
import { type DisplayState } from "./SegmentDisplay";
import { CHAR_MAP, isSegmentOn, SEGMENT_COUNT } from "@/app/lib/segments";
import { useRevealSchedule } from "@/app/hooks/useRevealSchedule";
import { useCountdown } from "@/app/hooks/useCountdown";
import WordDisplay from "./WordDisplay";
import GuessInput from "./GuessInput";
import GuessHistory from "./GuessHistory";
import Timer from "./Timer";
import ResultsScreen from "./ResultsScreen";
import AlphabetStrip from "./AlphabetStrip";

const ROUND_DURATION_MS = 60_000;

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

      if (guess.length !== state.targetWord.length) {
        return { ...state, error: `Word must be ${state.targetWord.length} letters` };
      }
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

  // Timer
  const handleExpire = useCallback(() => {
    dispatch({ type: "TIME_UP" });
  }, []);

  const { remaining } = useCountdown({
    durationMs: ROUND_DURATION_MS,
    onExpire: handleExpire,
    running: isPlaying,
  });

  // Reveal schedule
  const { revealed, revealAll } = useRevealSchedule({
    word: state.targetWord || "A",
    durationMs: ROUND_DURATION_MS,
    running: isPlaying,
  });

  // Reveal all segments when round ends
  useEffect(() => {
    if (state.phase === "won" || state.phase === "lost") {
      revealAll();
    }
  }, [state.phase, revealAll]);

  // Check which character positions are fully revealed by the drip
  // (all active segments for that character have been revealed)
  const fullyRevealedPositions: boolean[] = state.targetWord
    .split("")
    .map((char, ci) => {
      const code = CHAR_MAP[char.toUpperCase()];
      if (!code) return false;
      for (let si = 0; si < SEGMENT_COUNT; si++) {
        if (isSegmentOn(code, si) && !(revealed[ci]?.[si])) {
          return false;
        }
      }
      return true;
    });

  // Collect unique letters that are fully revealed by drip (for alphabet strip)
  const fullyRevealedLetters = new Set<string>();
  state.targetWord.split("").forEach((char, i) => {
    if (fullyRevealedPositions[i]) {
      fullyRevealedLetters.add(char.toUpperCase());
    }
  });
  // Also include letters confirmed by guesses
  for (const guess of state.guesses) {
    guess.feedback.forEach((fb, i) => {
      if (fb === "correct") {
        fullyRevealedLetters.add(guess.word[i]);
      }
    });
  }

  // Build locked-letters array: green if guessed correct OR fully revealed by drip
  const lockedLetters: DisplayState[] = state.targetWord
    .split("")
    .map((char, i) => {
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

  const handleGuess = useCallback(
    (guess: string) => {
      dispatch({ type: "SUBMIT_GUESS", guess });
    },
    []
  );

  const handleClearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const handlePlayAgain = useCallback(() => {
    const entry = pickWord(words, state.targetWord);
    dispatch({ type: "PLAY_AGAIN", word: entry.word, theme: entry.theme });
  }, [words, state.targetWord]);

  if (!state.targetWord) return null;

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

      {/* Word display */}
      <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center", minHeight: "120px" }}>
        <WordDisplay
          word={state.targetWord}
          revealedSegments={revealed}
          lockedLetters={lockedLetters}
          isVictory={state.phase === "won"}
        />
      </div>

      {/* Alphabet reference — directly below the display, above input */}
      <AlphabetStrip fullyRevealedLetters={fullyRevealedLetters} />

      {/* Timer */}
      {isPlaying && <Timer remainingMs={remaining} />}

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
        solveTime={state.solveTime}
        guessCount={state.guesses.length}
        onPlayAgain={handlePlayAgain}
      />
    </main>
  );
}
