'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

export interface KioskEmployee {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
  clockedIn: boolean;
  since: string | null;
}

export const fetchKioskRoster = () =>
  apiFetch<KioskEmployee[]>('/time-entries/kiosk/roster', { token: getToken() ?? undefined });

export const kioskToggle = (userId: string) =>
  apiFetch<{ action: string; workedMinutes?: number }>(
    `/time-entries/kiosk/${userId}/toggle`,
    { token: getToken() ?? undefined, method: 'POST' },
  );
