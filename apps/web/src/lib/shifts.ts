'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

export interface Shift {
  id: string;
  title: string | null;
  startsAt: string;
  endsAt: string;
  breakMinutes: number;
  status: string;
  color: string | null;
  isPublished: boolean;
  assigneeId: string | null;
  departmentId: string | null;
  locationId: string | null;
  assignee?: { id: string; firstName: string; lastName: string; color: string } | null;
  department?: { id: string; name: string; color: string } | null;
  location?: { id: string; name: string } | null;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  color: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
}

export interface ShiftConflict {
  type: string;
  message: string;
  shiftId?: string;
}

export class ConflictError extends Error {
  conflicts: ShiftConflict[];
  constructor(conflicts: ShiftConflict[]) {
    super('Conflict gedetecteerd');
    this.conflicts = conflicts;
  }
}

function authOpts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export function fetchShifts(from: string, to: string): Promise<Shift[]> {
  const qs = new URLSearchParams({ from, to }).toString();
  return apiFetch<Shift[]>(`/shifts?${qs}`, authOpts());
}

export function fetchEmployees(): Promise<Employee[]> {
  return apiFetch<Employee[]>('/users', authOpts());
}

export function fetchDepartments(): Promise<{ departments: Department[] }> {
  return apiFetch<{ departments: Department[] }>('/companies/me', authOpts());
}

async function mutate<T>(path: string, method: string, body: unknown, force = false): Promise<T> {
  try {
    const suffix = force ? (path.includes('?') ? '&force=true' : '?force=true') : '';
    return await apiFetch<T>(`${path}${suffix}`, authOpts({ method, body: JSON.stringify(body) }));
  } catch (err) {
    // Backend geeft { message, conflicts } bij 400 conflict.
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Conflict')) {
      throw new ConflictError([{ type: 'OVERLAP', message: 'Deze medewerker heeft al een overlappende shift.' }]);
    }
    throw err;
  }
}

export function createShift(body: Partial<Shift>, force = false): Promise<Shift> {
  return mutate<Shift>('/shifts', 'POST', body, force);
}

export function updateShift(id: string, body: Partial<Shift>, force = false): Promise<Shift> {
  return mutate<Shift>(`/shifts/${id}`, 'PATCH', body, force);
}

export function deleteShift(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/shifts/${id}`, authOpts({ method: 'DELETE' }));
}

export function duplicateWeek(sourceWeekStart: string, targetWeekStart: string) {
  return apiFetch<{ duplicated: number }>(
    '/shifts/duplicate-week',
    authOpts({ method: 'POST', body: JSON.stringify({ sourceWeekStart, targetWeekStart }) }),
  );
}

export function publishWeek(from: string, to: string) {
  return apiFetch<{ published: number }>(
    '/shifts/publish',
    authOpts({ method: 'POST', body: JSON.stringify({ from, to }) }),
  );
}
