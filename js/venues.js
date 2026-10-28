export const STADIUMS = [
  {
    id: "grand",
    name: "Grand Arena",
    description:
      "Four steep stands, sweeping roof canopies and bright afternoon light.",
    rows: 11,
    banks: 4,
    seats: 0x284d77,
    sky: ["#638db7", "#d8e3da"],
    sun: 2.4,
    roof: true,
  },
  {
    id: "metro",
    name: "Metro After Dark",
    description: "A compact city ground under floodlights and a neon skyline.",
    rows: 7,
    banks: 4,
    seats: 0x753d84,
    sky: ["#10182f", "#3a345a"],
    sun: 1.5,
    roof: true,
  },
  {
    id: "coast",
    name: "Coastal Park",
    description: "Two open stands, palms, sea views and warm sunset light.",
    rows: 5,
    banks: 2,
    seats: 0xd28e53,
    sky: ["#ab829b", "#ffd7a0"],
    sun: 2.0,
    roof: false,
  },
  {
    id: "local",
    name: "Community Ground",
    description: "Low terraces, trees, a small clubhouse and an open sky.",
    rows: 3,
    banks: 2,
    seats: 0x387357,
    sky: ["#78a6be", "#e4ead9"],
    sun: 2.2,
    roof: false,
  },
];
export const PITCH_COLORS = [
  { id: "classic", name: "Classic grass", rgb: [66, 105, 39] },
  { id: "emerald", name: "Emerald", rgb: [31, 116, 75] },
  { id: "mint", name: "Mint turf", rgb: [73, 133, 103] },
  { id: "blue", name: "Ocean blue", rgb: [39, 91, 145] },
  { id: "purple", name: "Violet", rgb: [101, 65, 143] },
  { id: "clay", name: "Terracotta", rgb: [154, 81, 57] },
  { id: "ice", name: "Ivory turf", rgb: [192, 207, 202], lines: 0x263b4a },
];
export function venueSettings(value = {}) {
  return {
    stadium: STADIUMS.some((v) => v.id === value.stadium)
      ? value.stadium
      : "grand",
    pitchColor: PITCH_COLORS.some((v) => v.id === value.pitchColor)
      ? value.pitchColor
      : "classic",
  };
}
