/**
 * Berekent gewerkte, nacht-, weekend- en overuren voor een klok-interval.
 * - Nacht: tussen 22:00 en 06:00.
 * - Weekend: zaterdag en zondag.
 * - Overuren: gewerkte tijd boven 8 uur (480 min).
 * Rekent per minuut (robuust; shifts zijn kort). Bij extreem lange
 * intervallen (> 32u) vervallen de detailvelden naar 0.
 */
export interface WorkedBreakdown {
  workedMinutes: number;
  nightMinutes: number;
  weekendMinutes: number;
  overtimeMinutes: number;
}

const MINUTE = 60_000;

export function computeWorked(
  clockIn: Date,
  clockOut: Date,
  breakMinutes = 0,
): WorkedBreakdown {
  const grossMinutes = Math.max(0, Math.round((clockOut.getTime() - clockIn.getTime()) / MINUTE));
  const workedMinutes = Math.max(0, grossMinutes - breakMinutes);

  let nightMinutes = 0;
  let weekendMinutes = 0;

  if (grossMinutes > 0 && grossMinutes <= 32 * 60) {
    for (let t = clockIn.getTime(); t < clockOut.getTime(); t += MINUTE) {
      const d = new Date(t);
      const hour = d.getHours();
      const dow = d.getDay();
      if (hour >= 22 || hour < 6) nightMinutes++;
      if (dow === 0 || dow === 6) weekendMinutes++;
    }
    // Pauze evenredig niet afgetrokken van nacht/weekend (blijft bruto).
    nightMinutes = Math.min(nightMinutes, workedMinutes);
    weekendMinutes = Math.min(weekendMinutes, workedMinutes);
  }

  const overtimeMinutes = Math.max(0, workedMinutes - 480);

  return { workedMinutes, nightMinutes, weekendMinutes, overtimeMinutes };
}
