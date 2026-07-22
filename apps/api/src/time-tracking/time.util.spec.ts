import { computeWorked } from './time.util';

describe('computeWorked', () => {
  it('rekent nacht-, weekend- en overuren voor een nachtshift in het weekend', () => {
    // Vrij 2 jan 2026 20:00 -> Zat 3 jan 2026 06:00 (10 uur), geen pauze.
    const clockIn = new Date(2026, 0, 2, 20, 0, 0);
    const clockOut = new Date(2026, 0, 3, 6, 0, 0);

    const r = computeWorked(clockIn, clockOut, 0);

    expect(r.workedMinutes).toBe(600); // 10u
    expect(r.nightMinutes).toBe(480); // 22:00-06:00 = 8u
    expect(r.weekendMinutes).toBe(360); // za 00:00-06:00 = 6u
    expect(r.overtimeMinutes).toBe(120); // boven 8u
  });

  it('trekt pauze af van de gewerkte tijd', () => {
    const clockIn = new Date(2026, 0, 5, 9, 0, 0); // ma 09:00
    const clockOut = new Date(2026, 0, 5, 17, 0, 0); // ma 17:00
    const r = computeWorked(clockIn, clockOut, 30);

    expect(r.workedMinutes).toBe(450); // 8u - 30min
    expect(r.overtimeMinutes).toBe(0);
    expect(r.weekendMinutes).toBe(0);
  });

  it('geeft nul terug bij een leeg interval', () => {
    const t = new Date(2026, 0, 5, 9, 0, 0);
    expect(computeWorked(t, t, 0)).toEqual({
      workedMinutes: 0,
      nightMinutes: 0,
      weekendMinutes: 0,
      overtimeMinutes: 0,
    });
  });
});
