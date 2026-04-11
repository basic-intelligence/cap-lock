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
