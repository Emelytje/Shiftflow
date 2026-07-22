'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

export interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  method: string;
  status: string;
  workedMinutes: number | null;
  overtimeMinutes: number | null;
  nightMinutes: number | null;
  weekendMinutes: number | null;
  user?: { id: string; firstName: string; lastName: string; color: string };
  shift?: { id: string; title: string | null } | null;
}

function opts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export function fetchCurrent(): Promise<TimeEntry | null> {
  return apiFetch<TimeEntry | null>('/time-entries/current', opts());
}

export function fetchEntries(): Promise<TimeEntry[]> {
  return apiFetch<TimeEntry[]>('/time-entries', opts());
}

export function clockIn(method = 'WEB'): Promise<TimeEntry> {
  return apiFetch<TimeEntry>('/time-entries/clock-in', opts({ method: 'POST', body: JSON.stringify({ method }) }));
}

export function clockOut(breakMinutes = 0): Promise<TimeEntry> {
  return apiFetch<TimeEntry>('/time-entries/clock-out', opts({ method: 'POST', body: JSON.stringify({ breakMinutes }) }));
}

export function approveEntry(id: string): Promise<TimeEntry> {
  return apiFetch<TimeEntry>(`/time-entries/${id}/approve`, opts({ method: 'PATCH' }));
}

export function minutesToHM(mins: number | null): string {
  if (!mins) return '0u';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}u${String(m).padStart(2, '0')}` : `${h}u`;
}
