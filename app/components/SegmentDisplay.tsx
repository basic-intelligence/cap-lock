"use client";

import { SEGMENT_POLYGONS, SEGMENT_COUNT, CHAR_MAP, isSegmentOn } from "@/app/lib/segments";

export type DisplayState = "dim" | "amber" | "green";

interface SegmentDisplayProps {
  char: string;
  revealedSegments: boolean[];
  displayState: DisplayState;
  size?: number;
  /** Raise dim segment opacity so outlines are clearly visible (for alphabet reference) */
  showOutlines?: boolean;
}

const COLORS = {
  amber: "#ff9500",
  green: "#00e676",
  dim: "#2a1a0a",
};

export default function SegmentDisplay({
  char,
  revealedSegments,
  displayState,
  size = 100,
  showOutlines = false,
}: SegmentDisplayProps) {
  const charCode = CHAR_MAP[char.toUpperCase()] ?? 0;
  const scale = size / 100;

  return (
    <svg
      viewBox="0 0 100 180"
      width={100 * scale}
      height={180 * scale}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={displayState === "green" ? char : undefined}
    >
      <defs>
        <filter id="amber-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="green-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={displayState === "green" ? "url(#green-glow)" : displayState === "amber" ? "url(#amber-glow)" : undefined}>
        {SEGMENT_POLYGONS.map((points, i) => {
          const isActive = isSegmentOn(charCode, i);
          const isRevealed = revealedSegments[i] ?? false;
          const isLit = displayState === "green"
            ? isActive
            : displayState === "amber"
              ? isActive && isRevealed
              : false;

          const fill = displayState === "green"
            ? (isActive ? COLORS.green : COLORS.dim)
            : (isLit ? COLORS.amber : COLORS.dim);

          const opacity = isLit ? 1 : showOutlines ? 0.18 : 0.08;

          return (
            <polygon
              key={i}
              points={points.join(" ")}
              fill={fill}
              opacity={opacity}
              style={{
                transition: "opacity 0.4s ease-out, fill 0.3s ease",
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
