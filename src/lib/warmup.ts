// src/lib/warmup.ts

/** Whole UTC days between a YYYY-MM-DD start date and `today`. 0 if no start. */
export function daysSince(startedOn: string | null, today: Date = new Date()): number {
  if (!startedOn) return 0;
  const start = new Date(`${startedOn}T00:00:00Z`).getTime();
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.floor((t - start) / 86_400_000));
}

/**
 * Emails allowed today.
 * Before warmup starts (startedOn null) -> curve[0].
 * During warmup -> curve[dayIndex].
 * Past the curve -> dailyMax.
 */
export function dailyCap(
  startedOn: string | null,
  dailyMax: number,
  curve: number[],
  today: Date = new Date()
): number {
  if (curve.length === 0) return dailyMax;
  if (!startedOn) return curve[0];
  const day = daysSince(startedOn, today);
  return day < curve.length ? curve[day] : dailyMax;
}
