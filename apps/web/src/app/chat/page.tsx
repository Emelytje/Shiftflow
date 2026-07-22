'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import { fetchMe, Me } from '@/lib/account';
import { fetchEmployees, Employee } from '@/lib/admin';
import {
  Conversation,
  Message,
  fetchConversations,
  openDirect,
  fetchMessages,
  sendMessage,
} from '@/lib/chat';

function convoTitle(c: Conversation, meId: string): string {
  if (c.name) return c.name;
  const others = c.participants.filter((p) => p.id !== meId);
  return others.map((p) => p.firstName).join(', ') || 'Gesprek';
}

function time(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [colleagues, setColleagues] = useState<Employee[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    try {
      setConversations(await fetchConversations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    (async () => {
      try {
        setMe(await fetchMe());
        setColleagues(await fetchEmployees().catch(() => []));
      } catch {
        /* ignore */
      }
    })();
    loadConvos();
  }, [loadConvos, router]);

  // Berichten pollen voor het actieve gesprek.
  useEffect(() => {
    if (!activeId) return;
    let active = true;
    const poll = () =>
      fetchMessages(activeId)
        .then((m) => active && setMessages(m))
        .catch(() => undefined);
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startChat(userId: string) {
    const { id } = await openDirect(userId);
    setActiveId(id);
    await loadConvos();
  }

  async function send() {
    if (!draft.trim() || !activeId) return;
    const body = draft;
    setDraft('');
    await sendMessage(activeId, body);
    setMessages(await fetchMessages(activeId));
    loadConvos();
  }

  const meId = me?.id ?? '';

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-0px)] flex-col p-6">
        <h1 className="text-2xl font-semibold">Chat</h1>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

        <div className="mt-4 grid flex-1 gap-4 overflow-hidden lg:grid-cols-3">
          {/* Zijlijst */}
          <div className="glass flex flex-col overflow-hidden p-4">
            <h2 className="text-sm font-semibold text-white/60">Gesprekken</h2>
            <div className="mt-2 space-y-1 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${activeId === c.id ? 'bg-sky-500/20 text-sky-200' : 'hover:bg-white/5'}`}
                >
                  <div className="font-medium text-white">{convoTitle(c, meId)}</div>
                  {c.lastMessage && <div className="truncate text-xs text-white/40">{c.lastMessage.body}</div>}
                </button>
              ))}
            </div>
            <h2 className="mt-4 text-sm font-semibold text-white/60">Nieuw gesprek</h2>
            <div className="mt-2 space-y-1 overflow-y-auto">
              {colleagues.filter((c) => c.id !== meId).map((c) => (
                <button key={c.id} onClick={() => startChat(c.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-white/5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.firstName} {c.lastName}
                </button>
              ))}
            </div>
          </div>

          {/* Berichten */}
          <div className="glass flex flex-col overflow-hidden p-4 lg:col-span-2">
            {!activeId ? (
              <div className="flex flex-1 items-center justify-center text-white/40">Kies of start een gesprek</div>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {messages.map((m) => {
                    const mine = m.sender.id === meId;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-sky-500 text-navy-900' : 'bg-white/10 text-white'}`}>
                          {!mine && <div className="text-xs font-medium opacity-70">{m.sender.firstName}</div>}
                          <div>{m.body}</div>
                          <div className={`mt-0.5 text-[10px] ${mine ? 'text-navy-900/60' : 'text-white/40'}`}>{time(m.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="input"
                    placeholder="Typ een bericht…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                  />
                  <button onClick={send} className="btn-primary px-5">Stuur</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
