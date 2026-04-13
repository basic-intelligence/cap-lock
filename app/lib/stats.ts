const STORAGE_KEY = "cap-lock-stats";
const MAX_HISTORY = 200;

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

/** Factory — returns a fresh stats object every call to avoid shared-reference mutation. */
function emptyStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {},
    gameHistory: [],
  };
}

export function getStats(): PlayerStats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw);
    const defaults = emptyStats();
    return {
      ...defaults,
      ...parsed,
      guessDistribution: {
        ...parsed.guessDistribution,
      },
      gameHistory: [...(parsed.gameHistory ?? [])],
    };
  } catch {
    return emptyStats();
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
  stats.gameHistory = stats.gameHistory.slice(-MAX_HISTORY);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Storage full or unavailable — stats still returned for this session
    }
  }

  return stats;
}
