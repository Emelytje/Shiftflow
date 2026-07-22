'use client';

/** Kleine client-side auth-helper (localStorage-gebaseerd). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sf_access');
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('sf_access', access);
  localStorage.setItem('sf_refresh', refresh);
}

export function clearTokens(): void {
  localStorage.removeItem('sf_access');
  localStorage.removeItem('sf_refresh');
}
