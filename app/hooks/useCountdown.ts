"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseCountdownOptions {
  durationMs: number;
  onExpire: () => void;
  running: boolean;
}

export function useCountdown({ durationMs, onExpire, running }: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(durationMs);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  // Keep callback ref fresh without re-triggering effect
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    pausedAtRef.current = null;
    expiredRef.current = false;
    setRemaining(durationMs);

    let prevDisplaySeconds = Math.ceil(durationMs / 1000);

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const timeLeft = Math.max(0, durationMs - elapsed);
      const displaySeconds = Math.ceil(timeLeft / 1000);

      // Only update state when the displayed second changes (avoid unnecessary re-renders)
      if (displaySeconds !== prevDisplaySeconds) {
        prevDisplaySeconds = displaySeconds;
        setRemaining(timeLeft);
      }

      if (timeLeft <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        setRemaining(0);
        onExpireRef.current();
        return;
      }

      if (timeLeft > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    // Pause/resume on visibility change
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
  }, [running, durationMs]);

  const reset = useCallback(() => {
    setRemaining(durationMs);
    expiredRef.current = false;
  }, [durationMs]);

  return { remaining, reset };
}
