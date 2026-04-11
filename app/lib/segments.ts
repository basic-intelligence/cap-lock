/**
 * 14-Segment LED Display Data
 *
 * Segment layout (viewBox: 0 0 100 180):
 *
 *       ---A---
 *      |\  |  /|
 *      F H I J B
 *      |  \|/  |
 *       G1---G2
 *      |  /|\  |
 *      E K L M C
 *      |/  |  \|
 *       ---D---
 *
 * Bit ordering matches LED-Segment-ASCII (MIT, github.com/dmadison/LED-Segment-ASCII):
 *   Bit:  0   1   2   3   4   5   6    7   8   9  10  11  12  13  14  15
 *   Seg:  A   B   C   D   E   F   G1  G2   H   I   J   K   L   M   DP  DP2
 *
 * Physical segment positions:
 *   A  = top horizontal
 *   B  = upper-right vertical
 *   C  = lower-right vertical
 *   D  = bottom horizontal
 *   E  = lower-left vertical
 *   F  = upper-left vertical
 *   G1 = middle-left horizontal
 *   G2 = middle-right horizontal
 *   H  = upper-left diagonal (top-left → center)
 *   I  = upper center vertical
 *   J  = upper-right diagonal (top-right → center)
 *   K  = lower-left diagonal (center → bottom-left)
 *   L  = lower center vertical
 *   M  = lower-right diagonal (center → bottom-right)
 */

export const SEGMENT_NAMES = [
  "A", "B", "C", "D", "E", "F", "G1", "G2",
  "H", "I", "J", "K", "L", "M",
] as const;

export const SEGMENT_COUNT = 14;

/**
 * Hex bitmask character map for 14-segment displays.
 * Vendored from LED-Segment-ASCII (MIT, github.com/dmadison/LED-Segment-ASCII).
 */
export const CHAR_MAP: Record<string, number> = {
  "0": 0x0C3F, // A B C D E F + J K (slashed zero)
  "1": 0x0006, // B C
  "2": 0x00DB, // A B D E G1 G2
  "3": 0x008F, // A B C D G2
  "4": 0x00E6, // B C F G1 G2
  "5": 0x2069, // A D F G1 M
  "6": 0x00FD, // A C D E F G1 G2
  "7": 0x0007, // A B C
  "8": 0x00FF, // A B C D E F G1 G2
  "9": 0x00EF, // A B C D F G1 G2
  A: 0x00F7, // A B C E F G1 G2
  B: 0x128F, // A B C D G2 I L
  C: 0x0039, // A D E F
  D: 0x120F, // A B C D I L
  E: 0x0079, // A D E F G1
  F: 0x0071, // A E F G1
  G: 0x00BD, // A C D E F G2
  H: 0x00F6, // B C E F G1 G2
  I: 0x1209, // A D I L
  J: 0x001E, // B C D E
  K: 0x2470, // E F G1 J M
  L: 0x0038, // D E F
  M: 0x0536, // B C E F H J
  N: 0x2136, // B C E F H M
  O: 0x003F, // A B C D E F
  P: 0x00F3, // A B E F G1 G2
  Q: 0x203F, // A B C D E F M
  R: 0x20F3, // A B E F G1 G2 M
  S: 0x00ED, // A C D F G1 G2
  T: 0x1201, // A I L
  U: 0x003E, // B C D E F
  V: 0x0C30, // E F J K
  W: 0x2836, // B C E F K M
  X: 0x2D00, // H J K M
  Y: 0x1500, // H J L
  Z: 0x0C09, // A D J K
};

/** Check if segment index `seg` is active for a given character bitmask */
export function isSegmentOn(charCode: number, seg: number): boolean {
  return ((charCode >> seg) & 1) === 1;
}

/** Get the active segment indices for a character */
export function getActiveSegments(char: string): number[] {
  const code = CHAR_MAP[char.toUpperCase()];
  if (code === undefined) return [];
  const active: number[] = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    if (isSegmentOn(code, i)) active.push(i);
  }
  return active;
}

/**
 * Polygon coordinates for each of the 14 segments.
 * ViewBox: 0 0 100 180. Order matches bit positions above.
 */
export const SEGMENT_POLYGONS: string[][] = [
  // 0: A — top horizontal
  ["20,4", "80,4", "85,9", "78,16", "22,16", "15,9"],
  // 1: B — upper-right vertical
  ["83,12", "87,16", "87,80", "83,86", "77,80", "77,18"],
  // 2: C — lower-right vertical
  ["83,94", "87,100", "87,164", "83,168", "77,162", "77,100"],
  // 3: D — bottom horizontal
  ["20,176", "80,176", "85,171", "78,164", "22,164", "15,171"],
  // 4: E — lower-left vertical
  ["17,94", "23,100", "23,162", "17,168", "13,164", "13,100"],
  // 5: F — upper-left vertical
  ["17,12", "23,18", "23,80", "17,86", "13,80", "13,16"],
  // 6: G1 — middle-left horizontal
  ["18,87", "48,87", "52,90", "48,93", "18,93", "14,90"],
  // 7: G2 — middle-right horizontal
  ["52,87", "82,87", "86,90", "82,93", "52,93", "48,90"],
  // 8: H — upper-left diagonal (top-left → center)
  ["24,20", "30,20", "52,82", "48,86", "44,82", "22,24"],
  // 9: I — upper center vertical
  ["47,18", "53,18", "53,82", "50,86", "47,82"],
  // 10: J — upper-right diagonal (top-right → center)
  ["70,20", "76,20", "78,24", "56,82", "52,86", "48,82"],
  // 11: K — lower-left diagonal (center → bottom-left)
  ["48,94", "52,98", "30,160", "24,160", "22,156", "44,98"],
  // 12: L — lower center vertical
  ["47,98", "50,94", "53,98", "53,162", "47,162"],
  // 13: M — lower-right diagonal (center → bottom-right)
  ["52,94", "56,98", "78,156", "76,160", "70,160", "48,98"],
];

/**
 * Segment tier classification for reveal ordering.
 * Tier 1: Least informative (revealed first) — diagonals, center verticals
 * Tier 2: Middle — horizontal middles
 * Tier 3: Most character-defining (revealed last) — outer edges
 */
export const SEGMENT_TIERS: Record<number, 1 | 2 | 3> = {
  0: 3,  // A — top horizontal
  1: 3,  // B — upper-right vertical
  2: 3,  // C — lower-right vertical
  3: 3,  // D — bottom horizontal
  4: 3,  // E — lower-left vertical
  5: 3,  // F — upper-left vertical
  6: 2,  // G1 — middle-left horizontal
  7: 2,  // G2 — middle-right horizontal
  8: 1,  // H — upper-left diagonal
  9: 1,  // I — upper center vertical
  10: 1, // J — upper-right diagonal
  11: 1, // K — lower-left diagonal
  12: 1, // L — lower center vertical
  13: 1, // M — lower-right diagonal
};
