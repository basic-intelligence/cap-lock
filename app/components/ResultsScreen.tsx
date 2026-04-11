"use client";

import type { GamePhase } from "./Game";

interface ResultsScreenProps {
  phase: GamePhase;
  targetWord: string;
  solveTime: number | null;
  guessCount: number;
  onPlayAgain: () => void;
}

export default function ResultsScreen({
  phase,
  targetWord,
  solveTime,
  guessCount,
  onPlayAgain,
}: ResultsScreenProps) {
  if (phase !== "won" && phase !== "lost") return null;

  const isWin = phase === "won";

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

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          {isWin && solveTime !== null && (
            <div>
              <div style={{ fontSize: "1.4rem", color: "var(--text)" }}>
                {(solveTime / 1000).toFixed(1)}s
              </div>
              <div>solve time</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: "1.4rem", color: "var(--text)" }}>
              {guessCount}
            </div>
            <div>{guessCount === 1 ? "guess" : "guesses"}</div>
          </div>
        </div>

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
