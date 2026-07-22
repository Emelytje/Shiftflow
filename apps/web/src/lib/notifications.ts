'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

function opts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export const fetchNotifications = () => apiFetch<Notification[]>('/notifications', opts());
export const fetchUnreadCount = () => apiFetch<{ count: number }>('/notifications/unread-count', opts());
export const markRead = (id: string) =>
  apiFetch<{ success: boolean }>(`/notifications/${id}/read`, opts({ method: 'PATCH' }));
export const markAllRead = () =>
  apiFetch<{ success: boolean }>('/notifications/read-all', opts({ method: 'PATCH' }));

export const fetchAnnouncements = () => apiFetch<Announcement[]>('/announcements', opts());
export const createAnnouncement = (title: string, body: string) =>
  apiFetch<Announcement>('/announcements', opts({ method: 'POST', body: JSON.stringify({ title, body }) }));
