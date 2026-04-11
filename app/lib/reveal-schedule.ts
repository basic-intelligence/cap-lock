import { CHAR_MAP, SEGMENT_COUNT, SEGMENT_TIERS, isSegmentOn } from "./segments";

export type ScheduleEntry = [timeMs: number, charIndex: number, segmentIndex: number];

/**
 * Deterministic seeded random for consistent shuffle per word.
 * Simple mulberry32 PRNG seeded from string hash.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Accelerating curve: maps normalized time (0-1) to normalized progress (0-1).
 * Slow start, faster end. Exponent > 1 creates acceleration.
 */
function acceleratingCurve(t: number, exponent = 2.2): number {
  return Math.pow(t, exponent);
}

/**
 * Build a deterministic reveal schedule for a word.
 *
 * Algorithm:
 * 1. For each character, get active segments and classify by tier
 * 2. Collect all (charIndex, segmentIndex) pairs across the word
 * 3. Sort by tier (tier 1 first = diagonals/center, tier 3 last = outer edges)
 * 4. Shuffle within each tier using a deterministic seed derived from the word
 * 5. Distribute across the timeline using an accelerating curve
 *
 * @param word - The target word (uppercase)
 * @param durationMs - Round duration in milliseconds (default 60000)
 * @returns Sorted array of [timeMs, charIndex, segmentIndex] tuples
 */
export function buildRevealSchedule(
  word: string,
  durationMs: number = 60000
): ScheduleEntry[] {
  const rng = mulberry32(hashString(word));

  // Collect all active segments grouped by tier
  const tier1: [number, number][] = [];
  const tier2: [number, number][] = [];
  const tier3: [number, number][] = [];

  for (let ci = 0; ci < word.length; ci++) {
    const charCode = CHAR_MAP[word[ci].toUpperCase()];
    if (charCode === undefined) continue;

    for (let si = 0; si < SEGMENT_COUNT; si++) {
      if (!isSegmentOn(charCode, si)) continue;

      const tier = SEGMENT_TIERS[si];
      const entry: [number, number] = [ci, si];
      if (tier === 1) tier1.push(entry);
      else if (tier === 2) tier2.push(entry);
      else tier3.push(entry);
    }
  }

  // Shuffle within each tier, then concatenate
  const ordered = [
    ...shuffleWithSeed(tier1, rng),
    ...shuffleWithSeed(tier2, rng),
    ...shuffleWithSeed(tier3, rng),
  ];

  if (ordered.length === 0) return [];

  // Distribute across the timeline using the accelerating curve.
  // Map each segment's position in the sequence to a time using the inverse of the curve.
  const schedule: ScheduleEntry[] = ordered.map(([ci, si], index) => {
    // Normalized position in the sequence (0 to 1)
    const normalizedPos = index / ordered.length;
    // Start at 5% of duration, end at 95%. Brief pause before first reveal.
    const startFraction = 0.05;
    const endFraction = 0.95;
    const timeFraction = startFraction + acceleratingCurve(normalizedPos) * (endFraction - startFraction);
    const timeMs = Math.round(timeFraction * durationMs);

    return [timeMs, ci, si] as ScheduleEntry;
  });

  // Sort by time
  schedule.sort((a, b) => a[0] - b[0]);

  return schedule;
}

/**
 * Given elapsed time and a schedule, compute which segments should be revealed.
 * Returns a 2D boolean array [charIndex][segmentIndex].
 */
export function getRevealedSegments(
  schedule: ScheduleEntry[],
  elapsedMs: number,
  wordLength: number
): boolean[][] {
  const revealed: boolean[][] = Array.from({ length: wordLength }, () =>
    new Array(SEGMENT_COUNT).fill(false)
  );

  for (const [timeMs, ci, si] of schedule) {
    if (timeMs > elapsedMs) break; // Schedule is sorted, so we can stop early
    revealed[ci][si] = true;
  }

  return revealed;
}
