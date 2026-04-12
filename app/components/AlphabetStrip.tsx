"use client";

import SegmentDisplay from "./SegmentDisplay";
import { SEGMENT_COUNT, CHAR_MAP, isSegmentOn } from "@/app/lib/segments";

const ALL_REVEALED = new Array(SEGMENT_COUNT).fill(true);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface AlphabetStripProps {
  fullyRevealedLetters: Set<string>;
  /** The revealed segments per position — used to eliminate impossible letters */
  revealedSegments: boolean[][];
}

/**
 * Check if a candidate letter is still possible at a given position.
 * It's possible if every segment revealed at that position is also
 * an active segment of the candidate letter (revealed must be a subset).
 */
function isPossibleAt(candidateChar: string, positionRevealed: boolean[]): boolean {
  const code = CHAR_MAP[candidateChar];
  if (code === undefined) return false;
  for (let s = 0; s < SEGMENT_COUNT; s++) {
    if (positionRevealed[s] && !isSegmentOn(code, s)) {
      return false; // This position has a lit segment the candidate doesn't have
    }
  }
  return true;
}

export default function AlphabetStrip({ fullyRevealedLetters, revealedSegments }: AlphabetStripProps) {
  // A letter is eliminated if it can't fit ANY position in the word
  const hasReveals = revealedSegments.some((pos) => pos.some(Boolean));

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 0 24px",
      }}
    >
      {ALPHABET.split("").map((ch) => {
        let state: "green" | "amber" | "dim" = "amber";

        if (fullyRevealedLetters.has(ch)) {
          state = "green";
        } else if (hasReveals) {
          // Check if this letter is possible at any position
          const possibleAnywhere = revealedSegments.some((posRevealed) =>
            isPossibleAt(ch, posRevealed)
          );
          if (!possibleAnywhere) {
            state = "dim";
          }
        }

        return (
          <div
            key={ch}
            style={{
              opacity: state === "dim" ? 0.2 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            <SegmentDisplay
              char={ch}
              revealedSegments={ALL_REVEALED}
              displayState={state === "green" ? "green" : "amber"}
              size={14}
              showOutlines
            />
          </div>
        );
      })}
    </div>
  );
}
