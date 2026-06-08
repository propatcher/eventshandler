import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Sparkles, Users, Megaphone, Bell, Check, Close, Reply, Send, Clock } from '../lib/icons';

const ICONS = { welcome: Sparkles, invite: Users, broadcast: Megaphone, reply: Reply, reminder: Clock, system: Bell };
const TINTS = {
  welcome: 'bg-neutral-100 text-neutral-900',
  invite: 'bg-neutral-100 text-neutral-900',
  broadcast: 'bg-neutral-100 text-neutral-700',
  reply: 'bg-neutral-100 text-neutral-700',
  reminder: 'bg-neutral-100 text-neutral-700',
  system: 'bg-neutral-100 text-neutral-500',
};
const TYPE_LABEL = { welcome: 'Приветствие', invite: 'Приглашение', broadcast: 'Новость', reply: 'Ответ', reminder: 'Напоминание', system: 'Событие' };

function fmtTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return new Date(iso).toLocaleString('ru-RU');
}

const tap = { whileTap: { scale: 0.92 }, whileHover: { scale: 1.03 }, transition: { type: 'spring', stiffness: 400, damping: 17 } };

export default function NotificationsView({ addToast, onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.notifications()); }
    catch (e) { addToast({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const markReadLocal = (id) => setItems((p) => p.map((x) => (x.id === id ? { ...x, is_read: true } : x)));

  const openDetail = async (n) => {
    setSelected(n); setReplyText('');
    if (!n.is_read) {
      try { await api.readNotification(n.id); markReadLocal(n.id); onChanged?.(); } catch {}
    }
  };

  const respond = async (n, accept) => {
    try {
      await api.respond(n.event_id, accept);
      addToast({ type: accept ? 'success' : 'default', text: accept ? 'Приглашение принято' : 'Приглашение отклонено' });
      setSelected(null);
      await load(); onChanged?.();
    } catch (e) { addToast({ type: 'error', text: e.message }); }
  };

  const sendReply = async (n) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.replyNotification(n.id, replyText.trim());
      addToast({ type: 'success', text: `Ответ отправлен @${n.actor_username}` });
      setReplyText(''); setSelected(null);
      markReadLocal(n.id); onChanged?.();
    } catch (e) { addToast({ type: 'error', text: e.message }); }
    finally { setSending(false); }
  };

  const markAll = async () => {
    try { await api.readAll(); setItems((p) => p.map((x) => ({ ...x, is_read: true }))); onChanged?.(); }
    catch (e) { addToast({ type: 'error', text: e.message }); }
  };

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-neutral-500 text-sm mt-1">{unread > 0 ? `${unread} непрочитанных` : 'Всё прочитано'}</p>
        </div>
        {unread > 0 && (
          <motion.button {...tap} onClick={markAll} className="text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50">
            Прочитать все
          </motion.button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl border border-neutral-200 bg-white">
              <div className="skeleton w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="skeleton h-4 w-2/5 mb-2" />
                <div className="skeleton h-3.5 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-xl bg-white py-20 text-center">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 mx-auto mb-4"><Bell width={22} height={22} /></span>
          <p className="font-medium text-neutral-700">Уведомлений нет</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {items.map((n, i) => {
              const Ico = ICONS[n.type] || Bell;
              return (
                <motion.div
                  key={n.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
                  whileTap={{ scale: 0.99 }}
                  style={{ transformOrigin: 'center' }}
                  onClick={() => openDetail(n)}
                  className={`flex gap-3 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${n.is_read ? 'bg-white border-neutral-200' : 'bg-neutral-100/40 border-neutral-200'}`}
                >
                  <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${TINTS[n.type] || TINTS.system}`}><Ico width={17} height={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{n.title}</p>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">{fmtTime(n.created_at)}</span>
                    </div>
                    {n.body && <p className="text-sm text-neutral-600 mt-0.5 line-clamp-1">{n.body}</p>}
                    <p className="text-[11px] text-neutral-400 mt-1">{TYPE_LABEL[n.type] || 'Уведомление'} · нажмите, чтобы открыть</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-neutral-900 mt-1.5 shrink-0" />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.94, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DetailWidget
                n={selected}
                replyText={replyText} setReplyText={setReplyText} sending={sending}
                onClose={() => setSelected(null)}
                onRespond={respond} onReply={sendReply}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailWidget({ n, replyText, setReplyText, sending, onClose, onRespond, onReply }) {
  const Ico = ICONS[n.type] || Bell;
  const isInvite = n.type === 'invite' && n.event_id;
  const canReply = !!n.actor_username;
  return (
    <div>
      <div className="flex items-start gap-3 p-5 border-b border-neutral-100">
        <span className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${TINTS[n.type] || TINTS.system}`}><Ico width={20} height={20} /></span>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">{TYPE_LABEL[n.type] || 'Уведомление'}</span>
          <h3 className="text-base font-semibold text-neutral-900 leading-snug">{n.title}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {fmtTime(n.created_at)}{n.actor_username ? ` · от @${n.actor_username}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"><Close /></button>
      </div>

      <div className="p-5">
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap break-words">
          {n.body || 'Без дополнительного текста.'}
        </p>

        {isInvite && (
          <div className="flex gap-2 mt-5">
            <motion.button {...tap} onClick={() => onRespond(n, true)} className="btn-accent inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl"><Check width={14} height={14} /> Принять</motion.button>
            <motion.button {...tap} onClick={() => onRespond(n, false)} className="inline-flex items-center gap-1.5 border border-neutral-300 text-neutral-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50"><Close width={14} height={14} /> Отклонить</motion.button>
          </div>
        )}

        {canReply && (
          <div className="mt-5 pt-5 border-t border-neutral-100">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Ответить @{n.actor_username}</label>
            <div className="flex items-end gap-2">
              <textarea
                autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} rows="2"
                placeholder="Ваш ответ…"
                className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/15 transition resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onReply(n); }}
              />
              <motion.button {...tap} disabled={sending || !replyText.trim()} onClick={() => onReply(n)}
                className="btn-accent grid place-items-center w-10 h-10 rounded-lg disabled:opacity-40">
                <Send width={16} height={16} />
              </motion.button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">Ctrl/⌘ + Enter — отправить</p>
          </div>
        )}
      </div>
    </div>
  );
}
