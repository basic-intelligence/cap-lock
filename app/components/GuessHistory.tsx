"use client";

import type { GuessRecord } from "./Game";

interface GuessHistoryProps {
  guesses: GuessRecord[];
}

export default function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        overflowY: "auto",
        maxHeight: "30dvh",
        padding: "8px 0",
        width: "100%",
        maxWidth: "320px",
      }}
    >
      {guesses.map((guess, gi) => (
        <div
          key={gi}
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            letterSpacing: "0.25em",
            color: "var(--text-muted)",
            fontFamily: "inherit",
          }}
        >
          {guess.word}
        </div>
      ))}
    </div>
  );
}
