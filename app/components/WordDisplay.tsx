"use client";

import SegmentDisplay, { type DisplayState } from "./SegmentDisplay";

interface WordDisplayProps {
  word: string;
  revealedSegments: boolean[][];
  lockedLetters: DisplayState[];
  isVictory?: boolean;
}

export default function WordDisplay({
  word,
  revealedSegments,
  lockedLetters,
  isVictory = false,
}: WordDisplayProps) {
  return (
    <div className={`display-panel ${isVictory ? "victory-pulse" : ""}`}>
      <div
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
          const displayState: DisplayState =
            state === "green" ? "green" : "amber";

          return (
            <div key={i} className="segment-char">
              <SegmentDisplay
                char={char}
                revealedSegments={revealedSegments[i] ?? []}
                displayState={displayState}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
