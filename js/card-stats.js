export const CARD_STATS = [
  ["pace", "PAC"],
  ["shoot", "SHO"],
  ["pass", "PAS"],
  ["strength", "STR"],
  ["dribble", "DRI"],
];
export function extendedStats(card) {
  const clamp = (n) => Math.round(Math.max(1, Math.min(100, n)));
  return {
    strength:
      card.strength ??
      clamp(
        card.rating +
          (card.position === "DEF" ? 5 : card.position === "FWD" ? 2 : -5),
      ),
    dribble:
      card.dribble ??
      clamp(
        (card.pace + card.pass) / 2 +
          (card.position === "MID" ? 4 : card.position === "GK" ? -12 : 0),
      ),
  };
}
