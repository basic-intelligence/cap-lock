"use client";

import SegmentDisplay from "./SegmentDisplay";
import { SEGMENT_COUNT } from "@/app/lib/segments";

const ALL_REVEALED = new Array(SEGMENT_COUNT).fill(true);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function AlphabetStrip() {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "8px 4px",
        opacity: 0.7,
      }}
    >
      {ALPHABET.split("").map((ch) => (
        <SegmentDisplay
          key={ch}
          char={ch}
          revealedSegments={ALL_REVEALED}
          displayState="amber"
          size={28}
        />
      ))}
    </div>
  );
}
