"use client";

import SegmentDisplay from "./SegmentDisplay";
import { SEGMENT_COUNT } from "@/app/lib/segments";

const ALL_REVEALED = new Array(SEGMENT_COUNT).fill(true);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface AlphabetStripProps {
  /** Letters that are fully revealed on the display (turn these green) */
  fullyRevealedLetters: Set<string>;
}

export default function AlphabetStrip({ fullyRevealedLetters }: AlphabetStripProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 0 24px",
      }}
    >
      {ALPHABET.split("").map((ch) => (
        <SegmentDisplay
          key={ch}
          char={ch}
          revealedSegments={ALL_REVEALED}
          displayState={fullyRevealedLetters.has(ch) ? "green" : "amber"}
          size={14}
          showOutlines
        />
      ))}
    </div>
  );
}
