import { CHAR_MAP, SEGMENT_COUNT, isSegmentOn } from "./segments";

export type LetterFeedback = "correct" | "present" | "absent";

/**
 * Evaluate a guess against the target word.
 * Two-pass algorithm (Wordle-standard duplicate handling):
 *   Pass 1: Mark exact matches as 'correct', remove from pool.
 *   Pass 2: For remaining letters (left to right), mark 'present' if in pool, else 'absent'.
 */
export function evaluateGuess(
  guess: string,
  target: string
): LetterFeedback[] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  const result: LetterFeedback[] = new Array(g.length).fill("absent");

  // Track remaining unmatched target letters
  const remaining: (string | null)[] = t.split("");

  // Pass 1: exact matches (greens)
  for (let i = 0; i < g.length; i++) {
    if (g[i] === remaining[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }

  // Pass 2: present but wrong position (yellows)
  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;

    const poolIndex = remaining.indexOf(g[i]);
    if (poolIndex !== -1) {
      result[i] = "present";
      remaining[poolIndex] = null;
    }
  }

  return result;
}

/**
 * For each position, compute which segments the guessed letter shares with the target letter.
 * Returns a 2D boolean array [charIndex][segmentIndex] of newly revealed segments.
 */
export function computeSegmentOverlap(
  guess: string,
  target: string
): boolean[][] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();

  return t.split("").map((targetChar, i) => {
    const guessChar = g[i];
    if (!guessChar) return new Array(SEGMENT_COUNT).fill(false);

    const targetCode = CHAR_MAP[targetChar] ?? 0;
    const guessCode = CHAR_MAP[guessChar] ?? 0;

    // Intersection: segments that are active in BOTH the guessed and target character
    const overlap = new Array(SEGMENT_COUNT).fill(false);
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      overlap[s] = isSegmentOn(targetCode, s) && isSegmentOn(guessCode, s);
    }
    return overlap;
  });
}
