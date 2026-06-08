import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Megaphone, Shield, Users, Send } from '../lib/icons';
import Avatar from '../components/Avatar';
import { inputCls } from '../lib/ui';

export default function AdminView({ addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try { setUsers(await api.adminUsers()); }
      catch (e) { addToast({ type: 'error', text: e.message }); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, []);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { sent } = await api.broadcast({ title, body });
      addToast({ type: 'success', title: 'Рассылка отправлена', text: `Доставлено пользователям: ${sent}` });
      setTitle(''); setBody('');
    } catch (err) { addToast({ type: 'error', text: err.message }); }
    finally { setSending(false); }
  };

  const stats = [
    ['Пользователей', users.length, Users],
    ['Администраторов', users.filter((u) => u.role === 'admin').length, Shield],
    ['Мероприятий', users.reduce((s, u) => s + u.events_count, 0), Megaphone],
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold tracking-tight">Администрирование</h1>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-full">
          <Shield width={12} height={12} /> admin
        </span>
      </div>
      <p className="text-neutral-500 text-sm mb-7">Управление пользователями и массовые рассылки.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(([label, value, Icon], i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3 shadow-soft">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent text-white shadow-sm"><Icon width={18} height={18} /></span>
            <div><p className="text-2xl font-bold leading-none">{value}</p><p className="text-xs text-neutral-500 mt-1">{label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={send}
          className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 h-fit shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-neutral-100 text-neutral-700"><Megaphone width={18} height={18} /></span>
            <h2 className="font-semibold">Массовая рассылка</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-4">Уведомление получат все пользователи системы.</p>
          <label className="block mb-3"><span className="block text-sm font-medium text-neutral-700 mb-1.5">Заголовок</span>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Например, Плановые работы" /></label>
          <label className="block mb-4"><span className="block text-sm font-medium text-neutral-700 mb-1.5">Текст</span>
            <textarea className={inputCls} rows="4" value={body} onChange={(e) => setBody(e.target.value)} required placeholder="Текст сообщения для всех пользователей" /></label>
          <button type="submit" disabled={sending} className="btn-accent w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition">
            <Send width={15} height={15} /> {sending ? 'Отправка…' : 'Разослать всем'}
          </button>
        </motion.form>

        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-soft">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
            <Users width={17} height={17} className="text-neutral-500" />
            <h2 className="font-semibold text-sm">Пользователи</h2>
          </div>
          {loading ? (
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="skeleton h-4 w-1/3 mb-2" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-[28rem] overflow-y-auto thin-scroll">
              {users.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 px-5 py-3">
                  <Avatar user={u} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.full_name || `@${u.username}`}</p>
                    <p className="text-xs text-neutral-400 truncate">@{u.username} · {u.email}</p>
                  </div>
                  <span className="text-xs text-neutral-400 hidden sm:block">{u.events_count} меропр.</span>
                  {u.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-full"><Shield width={11} height={11} /> admin</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
