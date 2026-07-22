'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Doc {
  id: string;
  type: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  expiresAt: string | null;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string } | null;
}

export const DOC_TYPES = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'CERTIFICATE', label: 'Certificaat' },
  { value: 'ATTESTATION', label: 'Attest' },
  { value: 'TRAINING', label: 'Opleiding' },
  { value: 'PAYSLIP', label: 'Loondocument' },
  { value: 'OTHER', label: 'Overig' },
];

export function docTypeLabel(v: string): string {
  return DOC_TYPES.find((t) => t.value === v)?.label ?? v;
}

export const fetchDocuments = () =>
  apiFetch<Doc[]>('/documents', { token: getToken() ?? undefined });
export const fetchExpiring = () =>
  apiFetch<Doc[]>('/documents/expiring', { token: getToken() ?? undefined });
export const deleteDocument = (id: string) =>
  apiFetch<{ success: boolean }>(`/documents/${id}`, { token: getToken() ?? undefined, method: 'DELETE' });

export async function uploadDocument(fields: {
  file: File;
  name: string;
  type: string;
  userId?: string;
  expiresAt?: string;
}): Promise<Doc> {
  const fd = new FormData();
  fd.append('file', fields.file);
  fd.append('name', fields.name);
  fd.append('type', fields.type);
  if (fields.userId) fd.append('userId', fields.userId);
  if (fields.expiresAt) fd.append('expiresAt', fields.expiresAt);
  const res = await fetch(`${API_URL}/api/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`Upload mislukt (${res.status})`);
  return res.json();
}

export async function downloadDocument(id: string, name: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/documents/${id}/download`, {
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  });
  if (!res.ok) throw new Error(`Download mislukt (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
