'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

function opts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export interface Availability {
  id: string;
  weekday: number | null;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const WEEKDAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export const fetchAvailability = () => apiFetch<Availability[]>('/availability', opts());
export const createAvailability = (dto: {
  weekday: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}) => apiFetch<Availability>('/availability', opts({ method: 'POST', body: JSON.stringify(dto) }));
export const deleteAvailability = (id: string) =>
  apiFetch<{ success: boolean }>(`/availability/${id}`, opts({ method: 'DELETE' }));
