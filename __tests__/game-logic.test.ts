import { evaluateGuess, computeSegmentOverlap } from "@/app/lib/game-logic";
import { gameReducer, type GameState } from "@/app/components/Game";
import { CHAR_MAP, isSegmentOn, SEGMENT_COUNT } from "@/app/lib/segments";

describe("evaluateGuess", () => {
  it("all correct for exact match", () => {
    const result = evaluateGuess("CRANE", "CRANE");
    expect(result).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  it("identifies present letters in wrong positions", () => {
    const result = evaluateGuess("CRANE", "REACT");
    expect(result).toEqual(["present", "present", "correct", "absent", "present"]);
  });

  it("handles duplicate letters: PAPER vs APPLE", () => {
    const result = evaluateGuess("PAPER", "APPLE");
    expect(result).toEqual(["present", "present", "correct", "present", "absent"]);
  });

  it("handles all identical correct letters", () => {
    const result = evaluateGuess("LLAMA", "LLAMA");
    expect(result).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  it("handles excess duplicates in guess", () => {
    const result = evaluateGuess("AABBB", "ABCDE");
    expect(result).toEqual(["correct", "absent", "present", "absent", "absent"]);
  });
});

describe("computeSegmentOverlap", () => {
  it("returns all true for identical letters", () => {
    const overlap = computeSegmentOverlap("A", "A");
    const activeSegments = [];
    const code = CHAR_MAP["A"];
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      if (isSegmentOn(code, s)) activeSegments.push(s);
    }
    // Every active segment of A should overlap with itself
    for (const s of activeSegments) {
      expect(overlap[0][s]).toBe(true);
    }
  });

  it("returns no overlap for letters with no shared segments", () => {
    // I = A, D, I(center), L(center) — mostly top/bottom + center verticals
    // X = H, J, K, M — all diagonals
    // These should share zero segments
    const overlap = computeSegmentOverlap("X", "I");
    const anyOverlap = overlap[0].some(Boolean);
    expect(anyOverlap).toBe(false);
  });

  it("returns partial overlap for letters sharing some segments", () => {
    // O = A,B,C,D,E,F (outer box)
    // C = A,D,E,F (left + top + bottom)
    // Overlap should be A,D,E,F
    const overlap = computeSegmentOverlap("O", "C");
    expect(overlap[0][0]).toBe(true);  // A (top)
    expect(overlap[0][3]).toBe(true);  // D (bottom)
    expect(overlap[0][4]).toBe(true);  // E (lower-left)
    expect(overlap[0][5]).toBe(true);  // F (upper-left)
    // B and C are in O but not in target C
    expect(overlap[0][1]).toBe(false); // B
    expect(overlap[0][2]).toBe(false); // C
  });

  it("works across multiple positions", () => {
    const overlap = computeSegmentOverlap("AB", "AC");
    // Position 0: A vs A → full overlap
    // Position 1: B vs C → partial overlap (B and C share segment C = lower-right vertical)
    expect(overlap).toHaveLength(2);
    // Position 0: all A segments should overlap
    const codeA = CHAR_MAP["A"];
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      if (isSegmentOn(codeA, s)) {
        expect(overlap[0][s]).toBe(true);
      }
    }
  });
});

describe("gameReducer", () => {
  const basePlayingState: GameState = {
    phase: "playing",
    targetWord: "CRANE",
    theme: "Animals",
    guesses: [],
    error: null,
  };

  it("START_ROUND transitions to playing", () => {
    const state = gameReducer(
      { ...basePlayingState, phase: "idle" },
      { type: "START_ROUND", word: "HAWK", theme: "Animals" }
    );
    expect(state.phase).toBe("playing");
    expect(state.targetWord).toBe("HAWK");
    expect(state.guesses).toEqual([]);
  });

  it("correct guess transitions to won", () => {
    const state = gameReducer(basePlayingState, {
      type: "SUBMIT_GUESS",
      guess: "CRANE",
    });
    expect(state.phase).toBe("won");
    expect(state.guesses).toHaveLength(1);
    expect(state.guesses[0].feedback).toEqual([
      "correct", "correct", "correct", "correct", "correct",
    ]);
  });

  it("wrong-length guess is rejected with error", () => {
    const state = gameReducer(basePlayingState, {
      type: "SUBMIT_GUESS",
      guess: "HI",
    });
    expect(state.phase).toBe("playing");
    expect(state.guesses).toHaveLength(0);
    expect(state.error).toContain("5 letters");
  });

  it("non-alpha guess is rejected", () => {
    const state = gameReducer(basePlayingState, {
      type: "SUBMIT_GUESS",
      guess: "CRA1E",
    });
    expect(state.phase).toBe("playing");
    expect(state.guesses).toHaveLength(0);
    expect(state.error).toContain("Letters only");
  });

  it("4th wrong guess transitions to lost", () => {
    let state = basePlayingState;
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "TRACK" });
    expect(state.phase).toBe("playing");
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "STORM" });
    expect(state.phase).toBe("playing");
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "BRAVE" });
    expect(state.phase).toBe("playing");
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "FLAME" });
    expect(state.phase).toBe("lost");
    expect(state.guesses).toHaveLength(4);
  });

  it("correct guess on 4th attempt still wins", () => {
    let state = basePlayingState;
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "TRACK" });
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "STORM" });
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "BRAVE" });
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "CRANE" });
    expect(state.phase).toBe("won");
  });

  it("PLAY_AGAIN resets to playing with new word", () => {
    const lostState = { ...basePlayingState, phase: "lost" as const };
    const state = gameReducer(lostState, {
      type: "PLAY_AGAIN",
      word: "TIGER",
      theme: "Animals",
    });
    expect(state.phase).toBe("playing");
    expect(state.targetWord).toBe("TIGER");
    expect(state.guesses).toEqual([]);
  });

  it("guess count increments on each valid SUBMIT_GUESS", () => {
    let state = basePlayingState;
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "TRACK" });
    expect(state.guesses).toHaveLength(1);
    state = gameReducer(state, { type: "SUBMIT_GUESS", guess: "STORM" });
    expect(state.guesses).toHaveLength(2);
  });
});
