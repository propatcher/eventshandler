import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Close, Send, Users } from '../lib/icons';
import Avatar from './Avatar';

const timeShort = (iso) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export default function EventChatModal({ event, currentUser, onClose, addToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const eventId = event?.id;

  const load = async (silent) => {
    if (!eventId) return;
    if (!silent) setLoading(true);
    try { setMessages(await api.eventMessages(eventId)); }
    catch (e) { if (!silent) addToast?.({ type: 'error', text: e.message }); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    if (!eventId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);
    const t = setInterval(() => load(true), 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const msg = await api.sendEventMessage(eventId, text);
      setMessages((p) => [...p, msg]);
      setInput('');
    } catch (err) { addToast?.({ type: 'error', text: err.message }); }
    finally { setSending(false); }
  };

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        >
          <motion.div
            className="bg-white pop-frame w-full max-w-md h-[34rem] max-h-[90vh] flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">Чат · {event.title}</h3>
                <p className="text-xs text-neutral-400 flex items-center gap-1"><Users width={12} height={12} /> участники мероприятия</p>
              </div>
              <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"><Close /></button>
            </div>

            <div className="flex-1 px-4 py-4 overflow-y-auto bg-neutral-50 flex flex-col gap-3 thin-scroll">
              {loading ? (
                <div className="text-center text-neutral-400 text-sm py-8">Загрузка…</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-neutral-400 text-sm py-8">Сообщений пока нет. Начните беседу.</div>
              ) : messages.map((m) => {
                const own = m.author.id === currentUser?.id;
                return (
                  <div key={m.id} className={`flex items-end gap-2 max-w-[85%] ${own ? 'self-end flex-row-reverse' : 'self-start'}`}>
                    {!own && <Avatar user={m.author} size={28} />}
                    <div>
                      {!own && <p className="text-[11px] text-neutral-400 mb-0.5 ml-1">{m.author.full_name || `@${m.author.username}`}</p>}
                      <div className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${own ? 'bg-accent text-white rounded-br-sm shadow-sm' : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm'}`}>{m.text}</div>
                      <p className={`text-[10px] text-neutral-400 mt-0.5 ${own ? 'text-right mr-1' : 'ml-1'}`}>{timeShort(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="p-3 border-t border-neutral-200 flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Сообщение участникам…"
                className="flex-1 bg-neutral-100 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-neutral-900/20 transition" />
              <button type="submit" disabled={sending || !input.trim()} className="btn-accent grid place-items-center w-10 h-10 rounded-lg disabled:opacity-40 transition"><Send /></button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
