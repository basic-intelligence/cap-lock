import {
  CHAR_MAP,
  SEGMENT_COUNT,
  SEGMENT_POLYGONS,
  isSegmentOn,
  getActiveSegments,
} from "@/app/lib/segments";

describe("segments", () => {
  describe("CHAR_MAP", () => {
    it("has entries for all digits 0-9", () => {
      for (let i = 0; i <= 9; i++) {
        expect(CHAR_MAP[String(i)]).toBeDefined();
      }
    });

    it("has entries for all letters A-Z", () => {
      for (let c = 65; c <= 90; c++) {
        expect(CHAR_MAP[String.fromCharCode(c)]).toBeDefined();
      }
    });
  });

  describe("isSegmentOn", () => {
    it("returns true for active segments of letter A", () => {
      const code = CHAR_MAP["A"]; // 0x00F7 = A,B,C,E,F,G1,G2
      expect(isSegmentOn(code, 0)).toBe(true);  // A (top)
      expect(isSegmentOn(code, 1)).toBe(true);  // B (upper-right)
      expect(isSegmentOn(code, 2)).toBe(true);  // C (lower-right)
      expect(isSegmentOn(code, 4)).toBe(true);  // E (lower-left)
      expect(isSegmentOn(code, 5)).toBe(true);  // F (upper-left)
      expect(isSegmentOn(code, 6)).toBe(true);  // G1 (middle-left)
      expect(isSegmentOn(code, 7)).toBe(true);  // G2 (middle-right)
    });

    it("returns false for inactive segments of letter A", () => {
      const code = CHAR_MAP["A"];
      expect(isSegmentOn(code, 3)).toBe(false);  // D (bottom) is off
      expect(isSegmentOn(code, 9)).toBe(false);  // I (center vertical) is off
    });

    it("correctly maps letter I to center verticals", () => {
      const code = CHAR_MAP["I"]; // 0x1209 = A, D, I, L
      expect(isSegmentOn(code, 0)).toBe(true);  // A (top)
      expect(isSegmentOn(code, 3)).toBe(true);  // D (bottom)
      expect(isSegmentOn(code, 9)).toBe(true);  // I (upper center vertical)
      expect(isSegmentOn(code, 12)).toBe(true); // L (lower center vertical)
      // No outer verticals or diagonals
      expect(isSegmentOn(code, 1)).toBe(false); // B
      expect(isSegmentOn(code, 8)).toBe(false); // H (diagonal)
    });

    it("correctly maps digit 0 as slashed zero", () => {
      const code = CHAR_MAP["0"]; // 0x0C3F = A,B,C,D,E,F + J,K
      expect(isSegmentOn(code, 0)).toBe(true);  // A
      expect(isSegmentOn(code, 1)).toBe(true);  // B
      expect(isSegmentOn(code, 2)).toBe(true);  // C
      expect(isSegmentOn(code, 3)).toBe(true);  // D
      expect(isSegmentOn(code, 4)).toBe(true);  // E
      expect(isSegmentOn(code, 5)).toBe(true);  // F
      expect(isSegmentOn(code, 10)).toBe(true); // J (upper-right diagonal)
      expect(isSegmentOn(code, 11)).toBe(true); // K (lower-left diagonal)
    });
  });

  describe("getActiveSegments", () => {
    it("returns correct active segments for letter I", () => {
      const active = getActiveSegments("I");
      expect(active).toContain(0);  // A (top)
      expect(active).toContain(3);  // D (bottom)
      expect(active).toContain(9);  // I (upper center)
      expect(active).toContain(12); // L (lower center)
      expect(active).toHaveLength(4);
    });

    it("returns more segments for W than I", () => {
      const activeW = getActiveSegments("W");
      const activeI = getActiveSegments("I");
      expect(activeW.length).toBeGreaterThan(activeI.length);
    });

    it("returns empty array for unknown characters", () => {
      expect(getActiveSegments("!")).toEqual([]);
      expect(getActiveSegments("@")).toEqual([]);
    });

    it("is case-insensitive", () => {
      expect(getActiveSegments("a")).toEqual(getActiveSegments("A"));
    });

    it("partial reveal: 3 of 14 segments for letter A", () => {
      const active = getActiveSegments("A");
      // A has 7 active segments, so revealing 3 means 3 lit + 4 active-but-unlit + 7 inactive
      expect(active.length).toBe(7);
      const partialReveal = active.slice(0, 3);
      expect(partialReveal).toHaveLength(3);
    });
  });

  describe("SEGMENT_POLYGONS", () => {
    it("has exactly 14 polygon definitions", () => {
      expect(SEGMENT_POLYGONS).toHaveLength(SEGMENT_COUNT);
    });

    it("each polygon has at least 4 vertices", () => {
      SEGMENT_POLYGONS.forEach((points) => {
        expect(points.length).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
