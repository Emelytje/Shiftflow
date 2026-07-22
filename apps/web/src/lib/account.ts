'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

function opts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export interface TwoFactorSetup {
  secret: string;
  otpauth: string;
  qrDataUrl: string;
}

export function setup2fa(): Promise<TwoFactorSetup> {
  return apiFetch<TwoFactorSetup>('/auth/2fa/setup', opts({ method: 'POST' }));
}

export function enable2fa(code: string) {
  return apiFetch<{ enabled: boolean }>('/auth/2fa/enable', opts({ method: 'POST', body: JSON.stringify({ code }) }));
}

export function disable2fa(code: string) {
  return apiFetch<{ enabled: boolean }>('/auth/2fa/disable', opts({ method: 'POST', body: JSON.stringify({ code }) }));
}

export function exportMyData(): Promise<unknown> {
  return apiFetch<unknown>('/gdpr/export', opts());
}

export function eraseMe(userId: string) {
  return apiFetch<{ erased: boolean }>(`/gdpr/erase/${userId}`, opts({ method: 'DELETE' }));
}

export interface Me {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  twoFactorEnabled?: boolean;
}

export function fetchMe(): Promise<Me> {
  return apiFetch<Me>('/auth/me', opts());
}
