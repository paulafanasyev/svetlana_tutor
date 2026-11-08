import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT, useLocale } from '../../core/store.js';
import { sfx } from '../../audio/sfx.js';
import { useChat } from './useChat.js';
import { ROOM_TYPES } from './chat.js';
import { Modal } from '../../ui/kit.jsx';

function timeOf(at, locale) {
  try { return new Date(at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

const ROOM_TYPE_ICON = { school: '🏫', staff: '👥', class: '🎓', group: '💬', personal: '🔒' };

function CreateRoomModal({ open, onClose, t, onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('group');
  const [isPublic, setIsPublic] = useState(false);
  const [members, setMembers] = useState('');

  const submit = () => {
    const memberIds = members.split(',').map((s) => s.trim()).filter(Boolean);
    const res = onCreate({ name: name.trim(), type, isPublic, members: memberIds });
    if (res.ok) {
      setName(''); setType('group'); setIsPublic(false); setMembers('');
      onClose();
    }
    return res;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="h2 mb-4">➕ {t('chat.create')}</h2>
      <label htmlFor="chat-room-name" className="label mb-1 block">{t('chat.name')}</label>
      <input id="chat-room-name" className="input w-full mb-3" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
      <label className="label mb-1 block">{t('chat.type')}</label>
      <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label={t('chat.type')}>
        {ROOM_TYPES.map((rt) => (
          <button key={rt} type="button" onClick={() => setType(rt)}
            role="radio" aria-checked={type === rt}
            className={`btn !py-1.5 !px-3 text-xs ${type === rt ? 'btn-primary' : 'btn-ghost'}`}>
            {ROOM_TYPE_ICON[rt]} {t('chat.type.' + rt)}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        <span className="font-bold text-sm">{t('chat.public')}</span>
      </label>
      {!isPublic && (
        <>
          <label htmlFor="chat-room-members" className="label mb-1 block">{t('chat.members')}</label>
          <input id="chat-room-members" className="input w-full mb-4" placeholder="user-1, user-2" value={members} onChange={(e) => setMembers(e.target.value)} />
        </>
      )}
      <button type="button" className="btn-primary w-full" disabled={!name.trim()} onClick={submit}>{t('chat.create')}</button>
    </Modal>
  );
}

const MessageBubble = memo(function MessageBubble({ m, isMine, locale }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'bg-primary text-white' : 'bg-soft'}`}>
        {!isMine && <div className="text-[11px] font-bold mb-0.5 opacity-70">{m.userId}</div>}
        <div className="text-sm">{m.text}</div>
        <div className="text-[10px] mt-0.5 opacity-60">
          {m.failed && <button type="button" className="underline mr-1" onClick={() => m.onRetry?.()}>↻</button>}
          {timeOf(m.createdAt, locale)}
        </div>
      </div>
    </div>
  );
});

const MessageList = memo(function MessageList({ messages, userId, locale, onRetry }) {
  const listRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (shouldAutoScroll.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    shouldAutoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  if (messages.length === 0) {
    return <div className="flex-1 flex items-center justify-center font-bold text-ink/40 py-8" role="log" aria-live="polite" />;
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite" onScroll={handleScroll}>
      {messages.map((m) => (
        <MessageBubble key={m.id} m={{ ...m, onRetry: () => onRetry(m) }} isMine={m.userId === userId} locale={locale} />
      ))}
    </div>
  );
});

function MessageInput({ onSend, t }) {
  const [message, setMessage] = useState('');

  const send = useCallback(() => {
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage('');
  }, [message, onSend]);

  return (
    <div className="p-4 border-t border-black/10 flex gap-2">
      <input
        className="input flex-1"
        placeholder={t('chat.typeMessage')}
        aria-label={t('chat.typeMessage')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && send()}
      />
      <button
        type="button"
        className="btn-primary !py-2 !px-4"
        disabled={!message.trim()}
        onClick={send}
        aria-label={t('chat.send')}
      >
        ➤ <span className="sr-only">{t('chat.send')}</span>
      </button>
    </div>
  );
}

export default function ChatCabinet() {
  const t = useT();
  const locale = useLocale();
  const chat = useChat();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [msg, setMsg] = useState(null);
  const roomListRef = useRef(null);

  const flash = useCallback((res, okText) => {
    if (res.ok) { if (okText) { setMsg({ ok: true, text: okText }); setTimeout(() => setMsg(null), 2000); } return; }
    setMsg({ ok: false, text: res.error?.message || String(res.error) });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  const room = selectedRoom ? chat.getRoom(selectedRoom) : null;
  const stats = selectedRoom ? chat.getStats(selectedRoom) : null;

  const send = useCallback((text) => {
    if (!selectedRoom) return;
    const res = chat.send(selectedRoom, text);
    if (res.ok) {
      sfx.pop?.();
    }
    flash(res);
  }, [selectedRoom, chat, flash]);

  const retryMessage = useCallback((m) => {
    if (!selectedRoom || !m.originalText) return;
    const res = chat.send(selectedRoom, m.originalText);
    flash(res);
  }, [selectedRoom, chat, flash]);

  const handleRoomKeyDown = useCallback((e) => {
    const rooms = chat.rooms;
    if (!rooms.length) return;
    const idx = rooms.findIndex((r) => r.id === selectedRoom);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = idx < rooms.length - 1 ? idx + 1 : 0;
      setSelectedRoom(rooms[next].id);
      roomListRef.current?.children[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = idx > 0 ? idx - 1 : rooms.length - 1;
      setSelectedRoom(rooms[prev].id);
      roomListRef.current?.children[prev]?.focus();
    }
  }, [chat.rooms, selectedRoom]);

  const messagesWithRetry = useMemo(() => {
    if (!room) return [];
    return room.messages.map((m) => ({
      ...m,
      originalText: m.text,
      failed: m.failed || false,
    }));
  }, [room]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="h1">💬 {t('chat.title')}</h1>
        <button type="button" className="btn-primary !py-1.5 !px-3 text-sm ml-auto" onClick={() => setCreateOpen(true)}>➕ {t('chat.create')}</button>
      </div>

      {msg && <div className={`card p-3 mb-4 font-bold anim-pop ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.ok ? '✅' : '😿'} {msg.text}</div>}

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Room list */}
        <div className="space-y-2" role="listbox" aria-label={t('chat.title')} onKeyDown={handleRoomKeyDown}>
          <div ref={roomListRef} className="space-y-2">
            {chat.rooms.length === 0 && <div className="card p-6 text-center font-bold text-ink/40">{t('chat.noRooms')}</div>}
            {chat.rooms.map((r) => (
              <button key={r.id} type="button" role="option" aria-selected={selectedRoom === r.id}
                aria-current={selectedRoom === r.id ? 'true' : undefined}
                onClick={() => { sfx.click?.(); setSelectedRoom(r.id); }}
                className={`card p-3 w-full text-left ${selectedRoom === r.id ? 'ring-2 ring-primary' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{ROOM_TYPE_ICON[r.type] || '💬'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-black truncate">{r.name}</div>
                    <div className="text-[11px] font-bold text-ink/40">{r.members.length} {t('chat.members')}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div>
          {!selectedRoom && <div className="card p-8 text-center font-bold text-ink/40">{t('chat.selectRoom')}</div>}
          {room && (
            <div className="card flex flex-col min-h-[400px] max-h-[70vh] h-[600px]">
              <div className="p-4 border-b border-black/10">
                <div className="font-black text-lg">{ROOM_TYPE_ICON[room.type]} {room.name}</div>
                <div className="text-xs font-bold text-ink/40">{stats.memberCount} {t('chat.members')} · {stats.messageCount} {t('chat.messages')}</div>
              </div>
              <MessageList messages={messagesWithRetry} userId={chat.userId} locale={locale} onRetry={retryMessage} />
              <MessageInput onSend={send} t={t} />
            </div>
          )}
        </div>
      </div>

      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} t={t} onCreate={(raw) => { const res = chat.createRoom(raw); flash(res, t('chat.created')); setSelectedRoom(res.ok ? res.result.id : selectedRoom); return res; }} />
    </div>
  );
}
