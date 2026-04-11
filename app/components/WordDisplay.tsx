"use client";

import SegmentDisplay, { type DisplayState } from "./SegmentDisplay";

interface WordDisplayProps {
  word: string;
  revealedSegments: boolean[][];
  lockedLetters: (DisplayState)[];
  className?: string;
}

export default function WordDisplay({
  word,
  revealedSegments,
  lockedLetters,
  className,
}: WordDisplayProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: "4px",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {word.split("").map((char, i) => {
        const state = lockedLetters[i] ?? "dim";
        // If the letter is green-locked, show all segments as green
        // If amber (drip-revealed), show based on reveal schedule
        // If dim, show outline only
        const displayState: DisplayState =
          state === "green" ? "green" : "amber";

        return (
          <SegmentDisplay
            key={i}
            char={char}
            revealedSegments={revealedSegments[i] ?? []}
            displayState={displayState}
          />
        );
      })}
    </div>
  );
}
