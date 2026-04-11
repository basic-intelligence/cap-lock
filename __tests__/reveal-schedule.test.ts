import {
  buildRevealSchedule,
  getRevealedSegments,
} from "@/app/lib/reveal-schedule";
import { CHAR_MAP, isSegmentOn, SEGMENT_COUNT, SEGMENT_TIERS } from "@/app/lib/segments";

describe("reveal-schedule", () => {
  describe("buildRevealSchedule", () => {
    it("returns entries covering all active segments for CAT", () => {
      const schedule = buildRevealSchedule("CAT", 60000);

      // Count expected total active segments across all chars
      let expectedTotal = 0;
      for (const ch of "CAT") {
        const code = CHAR_MAP[ch];
        for (let s = 0; s < SEGMENT_COUNT; s++) {
          if (isSegmentOn(code, s)) expectedTotal++;
        }
      }

      expect(schedule).toHaveLength(expectedTotal);
    });

    it("schedule entries are sorted by time ascending", () => {
      const schedule = buildRevealSchedule("HELLO", 60000);
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i][0]).toBeGreaterThanOrEqual(schedule[i - 1][0]);
      }
    });

    it("each active segment appears exactly once", () => {
      const schedule = buildRevealSchedule("CAT", 60000);
      const seen = new Set<string>();

      for (const [, ci, si] of schedule) {
        const key = `${ci}:${si}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });

    it("I has fewer schedule entries than W", () => {
      const scheduleI = buildRevealSchedule("I", 60000);
      const scheduleW = buildRevealSchedule("W", 60000);
      expect(scheduleI.length).toBeLessThan(scheduleW.length);
    });

    it("no segment is scheduled before 0 or after duration", () => {
      const duration = 60000;
      const schedule = buildRevealSchedule("ORBIT", duration);

      for (const [timeMs] of schedule) {
        expect(timeMs).toBeGreaterThanOrEqual(0);
        expect(timeMs).toBeLessThanOrEqual(duration);
      }
    });

    it("tier 1 segments appear earlier than tier 3 for any character", () => {
      const schedule = buildRevealSchedule("A", 60000);

      const tier1Times: number[] = [];
      const tier3Times: number[] = [];

      for (const [timeMs, , si] of schedule) {
        const tier = SEGMENT_TIERS[si];
        if (tier === 1) tier1Times.push(timeMs);
        else if (tier === 3) tier3Times.push(timeMs);
      }

      if (tier1Times.length > 0 && tier3Times.length > 0) {
        const maxTier1 = Math.max(...tier1Times);
        const minTier3 = Math.min(...tier3Times);
        expect(maxTier1).toBeLessThanOrEqual(minTier3);
      }
    });

    it("is deterministic — same word produces identical schedule", () => {
      const s1 = buildRevealSchedule("ORBIT", 60000);
      const s2 = buildRevealSchedule("ORBIT", 60000);
      expect(s1).toEqual(s2);
    });
  });

  describe("getRevealedSegments", () => {
    it("returns all false at elapsed 0", () => {
      const schedule = buildRevealSchedule("HI", 60000);
      const revealed = getRevealedSegments(schedule, 0, 2);

      for (const charRevealed of revealed) {
        expect(charRevealed.every((v) => v === false)).toBe(true);
      }
    });

    it("returns all active segments revealed after full duration", () => {
      const schedule = buildRevealSchedule("HI", 60000);
      const revealed = getRevealedSegments(schedule, 60000, 2);

      // All scheduled segments should be revealed
      for (const [, ci, si] of schedule) {
        expect(revealed[ci][si]).toBe(true);
      }
    });

    it("reveals progressively more segments over time", () => {
      const schedule = buildRevealSchedule("COBRA", 60000);
      const count = (elapsed: number) => {
        const r = getRevealedSegments(schedule, elapsed, 5);
        return r.flat().filter(Boolean).length;
      };

      const at10s = count(10000);
      const at30s = count(30000);
      const at50s = count(50000);

      expect(at10s).toBeLessThanOrEqual(at30s);
      expect(at30s).toBeLessThanOrEqual(at50s);
    });
  });
});
