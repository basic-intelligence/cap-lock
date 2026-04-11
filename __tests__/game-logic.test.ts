import { evaluateGuess } from "@/app/lib/game-logic";
import { gameReducer, type GameState } from "@/app/components/Game";

describe("evaluateGuess", () => {
  it("all correct for exact match", () => {
    const result = evaluateGuess("CRANE", "CRANE");
    expect(result).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  it("identifies present letters in wrong positions", () => {
    const result = evaluateGuess("CRANE", "REACT");
    // C in CRANE vs REACT: C is in REACT at index 3, not at 0 → present
    // R in CRANE vs REACT: R is in REACT at index 0, not at 1 → present
    // A in CRANE vs REACT: A is in REACT at index 2, not at 2? Actually: CRANE[2]=A, REACT[2]=A → correct!
    // Wait, let me recalculate:
    // CRANE: C(0) R(1) A(2) N(3) E(4)
    // REACT: R(0) E(1) A(2) C(3) T(4)
    // Pass 1 (exact): A at index 2 → correct
    // Pass 2: C(0) → C is in remaining [R,E,null,C,T] at index 3 → present
    //         R(1) → R is in remaining [R,E,null,null,T] at index 0 → present
    //         N(3) → N not in remaining → absent
    //         E(4) → E is in remaining [null,E,null,null,T] at index 1 → present
    expect(result).toEqual(["present", "present", "correct", "absent", "present"]);
  });

  it("handles duplicate letters: PAPER vs APPLE", () => {
    const result = evaluateGuess("PAPER", "APPLE");
    // PAPER: P(0) A(1) P(2) E(3) R(4)
    // APPLE: A(0) P(1) P(2) L(3) E(4)
    // Pass 1 exact: P(2)=P(2) → correct. Remaining: [A,P,null,L,E]
    // Pass 2: P(0) → P in remaining at index 1 → present. Remaining: [A,null,null,L,E]
    //         A(1) → A in remaining at index 0 → present. Remaining: [null,null,null,L,E]
    //         E(3) → E in remaining at index 4 → present. Remaining: [null,null,null,L,null]
    //         R(4) → R not in remaining → absent
    expect(result).toEqual(["present", "present", "correct", "present", "absent"]);
  });

  it("handles all identical correct letters", () => {
    const result = evaluateGuess("LLAMA", "LLAMA");
    expect(result).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  it("handles excess duplicates in guess", () => {
    const result = evaluateGuess("AABBB", "ABCDE");
    // AABBB: A(0) A(1) B(2) B(3) B(4)
    // ABCDE: A(0) B(1) C(2) D(3) E(4)
    // Pass 1 exact: A(0)=A(0) → correct. Remaining: [null,B,C,D,E]
    // Pass 2: A(1) → A not in remaining → absent
    //         B(2) → B in remaining at index 1 → present. Remaining: [null,null,C,D,E]
    //         B(3) → B not in remaining → absent
    //         B(4) → B not in remaining → absent
    expect(result).toEqual(["correct", "absent", "present", "absent", "absent"]);
  });
});

describe("gameReducer", () => {
  const basePlayingState: GameState = {
    phase: "playing",
    targetWord: "CRANE",
    theme: "Animals",
    guesses: [],
    startTime: Date.now() - 5000,
    solveTime: null,
    error: null,
  };

  it("START_ROUND transitions to playing", () => {
    const state = gameReducer(
      { ...basePlayingState, phase: "idle" },
      { type: "START_ROUND", word: "HAWK", theme: "Animals" }
    );
    expect(state.phase).toBe("playing");
    expect(state.targetWord).toBe("HAWK");
    expect(state.theme).toBe("Animals");
    expect(state.guesses).toEqual([]);
  });

  it("correct guess transitions to won and records solve time", () => {
    const state = gameReducer(basePlayingState, {
      type: "SUBMIT_GUESS",
      guess: "CRANE",
    });
    expect(state.phase).toBe("won");
    expect(state.solveTime).toBeGreaterThan(0);
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

  it("TIME_UP transitions to lost", () => {
    const state = gameReducer(basePlayingState, { type: "TIME_UP" });
    expect(state.phase).toBe("lost");
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
