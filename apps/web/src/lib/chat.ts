'use client';

import { apiFetch } from './api';
import { getToken } from './auth';

function opts(extra: RequestInit = {}) {
  return { token: getToken() ?? undefined, ...extra };
}

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
}

export interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: ChatUser[];
  lastMessage: { body: string; createdAt: string } | null;
}

export interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: ChatUser;
}

export const fetchConversations = () => apiFetch<Conversation[]>('/conversations', opts());
export const openDirect = (userId: string) =>
  apiFetch<{ id: string }>('/conversations/direct', opts({ method: 'POST', body: JSON.stringify({ userId }) }));
export const createGroup = (name: string, userIds: string[]) =>
  apiFetch<{ id: string }>('/conversations/group', opts({ method: 'POST', body: JSON.stringify({ name, userIds }) }));
export const fetchMessages = (id: string) =>
  apiFetch<Message[]>(`/conversations/${id}/messages`, opts());
export const sendMessage = (id: string, body: string) =>
  apiFetch<Message>(`/conversations/${id}/messages`, opts({ method: 'POST', body: JSON.stringify({ body }) }));
