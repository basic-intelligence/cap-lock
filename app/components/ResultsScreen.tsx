"use client";

import type { GamePhase } from "./Game";
import type { PlayerStats } from "@/app/lib/stats";

interface ResultsScreenProps {
  phase: GamePhase;
  targetWord: string;
  solveTime: number | null;
  guessCount: number;
  onPlayAgain: () => void;
  stats: PlayerStats | null;
}

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: "48px" }}>
      <div style={{ fontSize: "1.4rem", color: "var(--text)", fontWeight: "bold" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
        {label}
      </div>
    </div>
  );
}

function GuessDistribution({
  distribution,
  currentGuesses,
  isWin,
}: {
  distribution: Record<number, number>;
  currentGuesses: number;
  isWin: boolean;
}) {
  const maxCount = Math.max(1, ...Object.values(distribution));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      {[1, 2, 3, 4].map((n) => {
        const count = distribution[n] ?? 0;
        const widthPct = Math.max(8, (count / maxCount) * 100);
        const isCurrentGuess = isWin && n === currentGuesses;

        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "12px",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {n}
            </div>
            <div
              style={{
                height: "20px",
                width: `${widthPct}%`,
                background: isCurrentGuess ? "var(--green)" : "var(--amber)",
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "0 6px",
                transition: "width 0.4s ease",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  color: "#000",
                }}
              >
                {count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ResultsScreen({
  phase,
  targetWord,
  solveTime,
  guessCount,
  onPlayAgain,
  stats,
}: ResultsScreenProps) {
  if (phase !== "won" && phase !== "lost") return null;

  const isWin = phase === "won";
  const winPct = stats && stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "320px",
          width: "90%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            color: isWin ? "var(--green)" : "var(--danger)",
            margin: 0,
          }}
        >
          {isWin ? "SOLVED!" : "NO MORE GUESSES"}
        </h2>

        <div
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            letterSpacing: "0.2em",
            color: "var(--amber)",
          }}
        >
          {targetWord}
        </div>

        {/* Stats row */}
        {stats && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "8px 0",
              borderTop: "1px solid var(--panel-border)",
              borderBottom: "1px solid var(--panel-border)",
            }}
          >
            <StatBox value={stats.gamesPlayed} label="Played" />
            <StatBox value={winPct} label="Win %" />
            <StatBox value={stats.currentStreak} label="Streak" />
            <StatBox value={stats.maxStreak} label="Max" />
          </div>
        )}

        {/* Guess distribution */}
        {stats && (
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Guess Distribution
            </div>
            <GuessDistribution
              distribution={stats.guessDistribution}
              currentGuesses={guessCount}
              isWin={isWin}
            />
          </div>
        )}

        <button
          onClick={onPlayAgain}
          style={{
            padding: "12px 24px",
            fontSize: "1rem",
            fontFamily: "inherit",
            fontWeight: "bold",
            background: isWin ? "var(--green)" : "var(--amber)",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            letterSpacing: "0.1em",
            transition: "opacity 0.2s",
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
