'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ReportRow {
  employeeId: string;
  employee: string;
  shifts: number;
  hours: number;
  cost: number;
}

export interface HoursCostReport {
  from: string;
  to: string;
  rows: ReportRow[];
  totals: { shifts: number; hours: number; cost: number };
}

export interface PayrollRow {
  employeeId: string;
  employee: string;
  workedHours: number;
  overtimeHours: number;
  nightHours: number;
  weekendHours: number;
  cost: number;
}

export function fetchHoursCost(from: string, to: string): Promise<HoursCostReport> {
  const qs = new URLSearchParams({ from, to }).toString();
  return apiFetch<HoursCostReport>(`/reports/hours-cost?${qs}`, {
    token: getToken() ?? undefined,
  });
}

export function fetchPayroll(from: string, to: string): Promise<{ rows: PayrollRow[] }> {
  const qs = new URLSearchParams({ from, to }).toString();
  return apiFetch<{ rows: PayrollRow[] }>(`/reports/payroll?${qs}`, {
    token: getToken() ?? undefined,
  });
}

export async function downloadPayroll(from: string, to: string): Promise<void> {
  const qs = new URLSearchParams({ from, to }).toString();
  const res = await fetch(`${API_URL}/api/reports/payroll/export?${qs}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  });
  if (!res.ok) throw new Error(`Loonexport mislukt (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shiftflow-loonexport.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** Download een export (csv/xlsx/pdf) met authenticatie via een blob. */
export async function downloadReport(
  format: 'csv' | 'xlsx' | 'pdf',
  from: string,
  to: string,
): Promise<void> {
  const qs = new URLSearchParams({ from, to, format }).toString();
  const res = await fetch(`${API_URL}/api/reports/hours-cost/export?${qs}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  });
  if (!res.ok) throw new Error(`Export mislukt (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shiftflow-uren-kosten.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
