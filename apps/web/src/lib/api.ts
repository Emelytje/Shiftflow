/** Kleine API-client voor de ShiftFlow backend. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request mislukt (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return apiFetch<Tokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}) {
  return apiFetch<Tokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
