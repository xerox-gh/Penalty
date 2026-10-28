// Repairs only bounded numeric counters. Structural damage is never guessed away.
export const MAX_COUNTER = 100000000;
export function inspectSave(source, validate) {
  let d;
  const repairs = [];
  try {
    d =
      typeof source === "string"
        ? JSON.parse(source)
        : JSON.parse(JSON.stringify(source));
  } catch {
    return {
      data: null,
      repairs,
      error: "The save is not readable JSON. Restore a verified backup.",
    };
  }
  if (!d || d.version !== 1)
    return { data: null, repairs, error: "Unsupported save format." };
  function counter(obj, key, max = MAX_COUNTER, fallback = 0) {
    if (!obj || !(key in obj)) return;
    const old = obj[key],
      n =
        typeof old === "number" || typeof old === "string" ? Number(old) : NaN;
    const value = Number.isFinite(n)
      ? Math.min(max, Math.max(0, Math.floor(n)))
      : fallback;
    if (old !== value) {
      obj[key] = value;
      repairs.push(`${key}: repaired numeric value`);
    }
  }
  for (const key of ["coins", "packs", "xp", "revision", "serial"])
    counter(d, key);
  counter(d, "rng", 4294967295, 47812);
  for (const container of [d.stats, d.contracts?.base])
    if (container)
      for (const key of Object.keys(container)) counter(container, key);
  for (const key of ["matches", "wins", "xp", "training", "titles"])
    counter(d.playerCareer, key);
  try {
    return { data: validate(d), repairs, error: null };
  } catch (e) {
    return { data: null, repairs, error: e.message };
  }
}
