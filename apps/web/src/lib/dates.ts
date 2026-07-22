/** Datumhulpjes voor de planner (week begint op maandag). */

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // maandag = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
export function dayLabel(date: Date): string {
  const idx = (date.getDay() + 6) % 7;
  return `${DAY_NAMES[idx]} ${date.getDate()}/${date.getMonth() + 1}`;
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Combineert een dag (Date) met een tijd "HH:MM" tot een ISO-string. */
export function combineDateTime(day: Date, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/** Verplaatst een shift-ISO naar een andere dag met behoud van tijdstip. */
export function moveToDay(iso: string, targetDay: Date): string {
  const src = new Date(iso);
  const d = new Date(targetDay);
  d.setHours(src.getHours(), src.getMinutes(), 0, 0);
  return d.toISOString();
}

export function durationHours(startIso: string, endIso: string, breakMinutes = 0): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, ms / 3_600_000 - breakMinutes / 60);
}
