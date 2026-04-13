const STORAGE_KEY = "cap-locks-stats";

export interface GameRecord {
  word: string;
  theme: string;
  guesses: number;
  won: boolean;
  timestamp: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
  gameHistory: GameRecord[];
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
  gameHistory: [],
};

export function getStats(): PlayerStats {
  if (typeof window === "undefined") return { ...DEFAULT_STATS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing fields from older versions
    return {
      ...DEFAULT_STATS,
      ...parsed,
      guessDistribution: {
        ...DEFAULT_STATS.guessDistribution,
        ...parsed.guessDistribution,
      },
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function recordGame(result: GameRecord): PlayerStats {
  const stats = getStats();

  stats.gamesPlayed++;
  if (result.won) {
    stats.gamesWon++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.guessDistribution[result.guesses] =
      (stats.guessDistribution[result.guesses] ?? 0) + 1;
  } else {
    stats.currentStreak = 0;
  }

  stats.gameHistory.push(result);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Storage full or unavailable — stats still returned for this session
    }
  }

  return stats;
}
