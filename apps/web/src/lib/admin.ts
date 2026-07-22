'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

function opts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  vatNumber: string | null;
  address: string | null;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  color: string;
  employmentType: string | null;
  contractHoursPerWeek: number | null;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  location?: { id: string; name: string } | null;
  _count?: { shifts: number };
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  _count?: { departments: number; shifts: number };
}

// Bedrijf / branding
export const fetchCompany = () => apiFetch<Company>('/companies/me', opts());
export const updateCompany = (dto: Partial<Company>) =>
  apiFetch<Company>('/companies/me', opts({ method: 'PATCH', body: JSON.stringify(dto) }));

// Medewerkers
export const fetchEmployees = () => apiFetch<Employee[]>('/users', opts());
export const createEmployee = (dto: {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  contractHoursPerWeek?: number;
  hourlyCost?: number;
}) => apiFetch<{ user: Employee; tempPassword: string }>('/users', opts({ method: 'POST', body: JSON.stringify(dto) }));
export const updateEmployee = (id: string, dto: Partial<Employee>) =>
  apiFetch<Employee>(`/users/${id}`, opts({ method: 'PATCH', body: JSON.stringify(dto) }));

// Afdelingen
export const fetchDepartments = () => apiFetch<Department[]>('/departments', opts());
export const createDepartment = (dto: { name: string; color?: string; locationId?: string }) =>
  apiFetch<Department>('/departments', opts({ method: 'POST', body: JSON.stringify(dto) }));
export const deleteDepartment = (id: string) =>
  apiFetch<{ success: boolean }>(`/departments/${id}`, opts({ method: 'DELETE' }));

// Vestigingen
export const fetchLocations = () => apiFetch<Location[]>('/locations', opts());
export const createLocation = (dto: { name: string; address?: string }) =>
  apiFetch<Location>('/locations', opts({ method: 'POST', body: JSON.stringify(dto) }));
export const deleteLocation = (id: string) =>
  apiFetch<{ success: boolean }>(`/locations/${id}`, opts({ method: 'DELETE' }));
