"use client";

import type { GuessRecord } from "./Game";
import type { LetterFeedback } from "@/app/lib/game-logic";

interface GuessHistoryProps {
  guesses: GuessRecord[];
}

const FEEDBACK_COLORS: Record<LetterFeedback, string> = {
  correct: "var(--green)",
  present: "var(--yellow)",
  absent: "var(--gray)",
};

export default function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
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
            display: "flex",
            gap: "4px",
            justifyContent: "center",
          }}
        >
          {guess.word.split("").map((letter, li) => (
            <div
              key={li}
              style={{
                width: "32px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                fontSize: "0.9rem",
                fontWeight: "bold",
                fontFamily: "inherit",
                color: "#000",
                background: FEEDBACK_COLORS[guess.feedback[li]],
                transition: "background 0.3s ease",
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
