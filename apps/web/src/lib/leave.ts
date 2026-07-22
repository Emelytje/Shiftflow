'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

export interface LeaveRequest {
  id: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  hours: number | null;
  reason: string | null;
  employee?: { id: string; firstName: string; lastName: string; color: string };
  decidedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface LeaveBalance {
  id: string;
  type: string;
  year: number;
  totalHours: number;
  usedHours: number;
}

export const LEAVE_TYPES: { value: string; label: string }[] = [
  { value: 'VACATION', label: 'Vakantie' },
  { value: 'ADV', label: 'ADV' },
  { value: 'RECUPERATION', label: 'Recuperatie' },
  { value: 'SICK', label: 'Ziekte' },
  { value: 'SHORT_LEAVE', label: 'Klein verlet' },
  { value: 'UNPAID', label: 'Onbetaald verlof' },
  { value: 'PARENTAL', label: 'Ouderschapsverlof' },
];

export function leaveTypeLabel(value: string): string {
  return LEAVE_TYPES.find((t) => t.value === value)?.label ?? value;
}

function opts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export function fetchLeave(): Promise<LeaveRequest[]> {
  return apiFetch<LeaveRequest[]>('/leave', opts());
}

export function fetchBalances(): Promise<LeaveBalance[]> {
  return apiFetch<LeaveBalance[]>('/leave/balances', opts());
}

export function createLeave(body: { type: string; startsAt: string; endsAt: string; reason?: string }) {
  return apiFetch<LeaveRequest>('/leave', opts({ method: 'POST', body: JSON.stringify(body) }));
}

export function decideLeave(id: string, status: 'APPROVED' | 'REJECTED') {
  return apiFetch<LeaveRequest>(`/leave/${id}/decide`, opts({ method: 'PATCH', body: JSON.stringify({ status }) }));
}

export function cancelLeave(id: string) {
  return apiFetch<LeaveRequest>(`/leave/${id}/cancel`, opts({ method: 'PATCH' }));
}
