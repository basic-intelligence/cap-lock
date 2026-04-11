"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  buildRevealSchedule,
  getRevealedSegments,
  type ScheduleEntry,
} from "@/app/lib/reveal-schedule";
import { SEGMENT_COUNT } from "@/app/lib/segments";

interface UseRevealScheduleOptions {
  word: string;
  durationMs: number;
  running: boolean;
}

export function useRevealSchedule({
  word,
  durationMs,
  running,
}: UseRevealScheduleOptions) {
  const scheduleRef = useRef<ScheduleEntry[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const [revealed, setRevealed] = useState<boolean[][]>(() =>
    Array.from({ length: word.length }, () =>
      new Array(SEGMENT_COUNT).fill(false)
    )
  );

  // Build schedule when word changes
  useEffect(() => {
    scheduleRef.current = buildRevealSchedule(word, durationMs);
    setRevealed(
      Array.from({ length: word.length }, () =>
        new Array(SEGMENT_COUNT).fill(false)
      )
    );
  }, [word, durationMs]);

  // Animation loop
  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    pausedAtRef.current = null;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRevealed = getRevealedSegments(
        scheduleRef.current,
        elapsed,
        word.length
      );
      setRevealed(newRevealed);

      if (elapsed < durationMs) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    // Visibility change: pause/resume
    const handleVisibility = () => {
      if (document.hidden) {
        pausedAtRef.current = Date.now();
        cancelAnimationFrame(rafRef.current);
      } else if (pausedAtRef.current !== null) {
        const pauseDuration = Date.now() - pausedAtRef.current;
        startTimeRef.current += pauseDuration;
        pausedAtRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [running, word, durationMs]);

  // Fully reveal all segments (for end-of-round)
  const revealAll = useCallback(() => {
    setRevealed(
      getRevealedSegments(
        scheduleRef.current,
        durationMs,
        word.length
      )
    );
  }, [word, durationMs]);

  return { revealed, revealAll };
}
