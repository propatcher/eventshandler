import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import {
  Plus, Trash, Calendar as CalendarIcon, Users, Check, Edit, Search,
  MapPin, LogoutDoor, Clock, CheckCircle, Chat,
} from '../lib/icons';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import Calendar from '../components/Calendar';
import TimePicker from '../components/TimePicker';
import StatusPicker from '../components/StatusPicker';
import DurationPicker from '../components/DurationPicker';
import { formatDuration } from '../lib/format';
import { inputCls } from '../lib/ui';
import EventChatModal from '../components/EventChatModal';

function eventStart(ev) {
  if (!ev?.date || !ev.time) return null;
  const [h, m] = ev.time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(ev.date + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d;
}

function eventEnd(ev) {
  const start = eventStart(ev);
  if (!start) return null;
  if (ev.duration_minutes) return new Date(start.getTime() + ev.duration_minutes * 60000);
  return start;
}

function isPast(ev) {
  const end = eventEnd(ev);
  const now = Date.now();
  if (end) return end.getTime() <= now;
  if (!ev?.date) return false;
  return new Date(ev.date + 'T23:59:59').getTime() < now;
}

function isOngoing(ev) {
  const start = eventStart(ev);
  const end = eventEnd(ev);
  if (!start || !end || end.getTime() === start.getTime()) return false;
  const now = Date.now();
  return start.getTime() <= now && now < end.getTime();
}
function fmtClock(d) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
function statusInfo(ev) {
  if (ev.status === 'Завершено') return { label: 'Завершено', dot: 'bg-neutral-400', chip: 'bg-neutral-100 text-neutral-500' };
  if (isPast(ev)) return { label: 'Прошло', dot: 'bg-neutral-400', chip: 'bg-neutral-100 text-neutral-500' };
  if (isOngoing(ev)) return { label: 'Идёт сейчас', dot: 'bg-neutral-600 animate-pulse', chip: 'bg-neutral-100 text-neutral-700' };
  if (ev.status === 'Активно') return { label: 'Активно', dot: 'bg-neutral-600', chip: 'bg-neutral-100 text-neutral-700' };
  return { label: 'Планируется', dot: 'bg-neutral-600', chip: 'bg-neutral-100 text-neutral-700' };
}
function StatusBadge({ ev }) {
  const s = statusInfo(ev);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

const EMPTY = { title: '', date: '', time: '', duration: '', description: '', status: 'Планируется', location: '' };

export default function DashboardView({ addToast, user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatEvent, setChatEvent] = useState(null);
  const [tick, setTick] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [manage, setManage] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pQuery, setPQuery] = useState('');
  const [results, setResults] = useState([]);

  const load = async () => {
    setLoading(true);
    try { setEvents(await api.events()); }
    catch (e) { addToast({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onNew = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
    window.addEventListener('eventlys:new-event', onNew);
    return () => window.removeEventListener('eventlys:new-event', onNew);
  }, []);

  const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
  const openEdit = (ev) => {
    setEditing(ev);
    setForm({ title: ev.title, date: ev.date, time: ev.time || '', duration: ev.duration_minutes || '', description: ev.description || '', status: ev.status, location: ev.location || '' });
    setFormOpen(true);
  };

  const payloadFromForm = () => ({
    title: form.title,
    date: form.date,
    time: form.time || null,
    duration_minutes: form.duration ? Number(form.duration) : null,
    status: form.status,
    location: form.location || null,
    description: form.description || null,
  });

  const saveEvent = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return addToast({ type: 'error', text: 'Укажите название и дату' });
    try {
      if (editing) {
        const updated = await api.updateEvent(editing.id, payloadFromForm());
        setEvents((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        addToast({ type: 'success', text: 'Мероприятие обновлено' });
      } else {
        const created = await api.createEvent(payloadFromForm());
        setEvents((p) => [created, ...p]);
        addToast({ type: 'success', text: 'Мероприятие создано' });
      }
      setFormOpen(false); setEditing(null); setForm(EMPTY);
    } catch (err) { addToast({ type: 'error', text: err.message }); }
  };

  const remove = async (id) => {
    try { await api.deleteEvent(id); setEvents((p) => p.filter((e) => e.id !== id)); addToast({ text: 'Мероприятие удалено' }); }
    catch (err) { addToast({ type: 'error', text: err.message }); }
  };

  const leave = async (id) => {
    try { await api.leaveEvent(id); setEvents((p) => p.filter((e) => e.id !== id)); addToast({ text: 'Вы покинули мероприятие' }); }
    catch (err) { addToast({ type: 'error', text: err.message }); }
  };

  const markPassed = async (ev) => {
    try {
      const u = await api.updateEvent(ev.id, { status: 'Завершено' });
      setEvents((p) => p.map((x) => (x.id === u.id ? u : x)));
      addToast({ type: 'success', text: 'Отмечено как прошедшее' });
    } catch (err) { addToast({ type: 'error', text: err.message }); }
  };

  const openManage = async (event) => {
    setManage(event); setPQuery(''); setResults([]); setParticipants([]);
    try { setParticipants(await api.participants(event.id)); } catch {}
  };
  const search = async (q) => {
    setPQuery(q);
    if (q.trim().length < 1) { setResults([]); return; }
    try { setResults(await api.searchUsers(q.trim())); } catch { setResults([]); }
  };
  const invite = async (identifier) => {
    try {
      await api.invite(manage.id, identifier);
      addToast({ type: 'success', text: `Приглашение отправлено ${identifier}` });
      setParticipants(await api.participants(manage.id));
      setResults([]); setPQuery('');
    } catch (err) { addToast({ type: 'error', text: err.message }); }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (filter === 'passed') { if (!(e.status === 'Завершено' || isPast(e))) return false; }
      else if (filter !== 'all' && e.status !== filter) return false;
      if (!q) return true;
      return [e.title, e.description, e.location, e.owner_username].some((v) => (v || '').toLowerCase().includes(q));
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, query, filter, tick]);

  const owned = events.filter((e) => e.is_owner).length;

  const stats = useMemo(() => {
    const passed = events.filter((e) => e.status === 'Завершено' || isPast(e)).length;
    const ongoing = events.filter((e) => e.status !== 'Завершено' && isOngoing(e)).length;
    return [
      ['Всего', events.length],
      ['Предстоящие', Math.max(events.length - passed - ongoing, 0)],
      ['Идут сейчас', ongoing],
      ['Прошедшие', passed],
    ];

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, tick]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-neutral-400 uppercase mb-1.5">
            <span className="w-1.5 h-1.5 bg-accent inline-block" /> Панель управления
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Мероприятия</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {events.length === 0 ? 'Пока ничего не создано' : `${owned} ваших · ${events.length - owned} совместных`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-accent inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-xl text-sm font-medium">
          <Plus /> Новое мероприятие
        </button>
      </div>

      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-white border border-neutral-200 border-t-2 border-t-neutral-900 px-4 py-3">
              <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">{label}</p>
              <p className="text-2xl font-bold tabular-nums mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><Search width={16} height={16} /></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по названию, описанию, месту…" className={`${inputCls} pl-9`} />
          </div>
          <div className="flex gap-1.5 bg-neutral-100 rounded-lg p-1 overflow-x-auto">
            {[['all', 'Все'], ['Активно', 'Активные'], ['Планируется', 'Планируются'], ['passed', 'Прошедшие']].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap ${filter === key ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200' : 'text-neutral-500 hover:text-neutral-800'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton h-5 w-24 rounded-full" />
                <div className="skeleton h-6 w-14 rounded-md" />
              </div>
              <div className="skeleton h-4 w-3/4 mb-2.5" />
              <div className="skeleton h-3.5 w-full mb-1.5" />
              <div className="skeleton h-3.5 w-2/3 mb-5" />
              <div className="skeleton h-3.5 w-1/2 mb-3" />
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div className="skeleton h-4 w-10" />
                <div className="skeleton h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="relative border border-dashed border-neutral-300 rounded-xl bg-white py-20 px-6 text-center overflow-hidden">
          <span aria-hidden="true" className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-neutral-200" />
          <span aria-hidden="true" className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-neutral-200" />
          <span aria-hidden="true" className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-neutral-200" />
          <span aria-hidden="true" className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-neutral-200" />
          <span className="grid place-items-center w-12 h-12 border-2 border-neutral-900 bg-white text-neutral-900 mx-auto mb-4 [box-shadow:4px_4px_0_#0a0a0a]"><CalendarIcon width={22} height={22} /></span>
          <p className="font-semibold text-neutral-800">Здесь пока пусто</p>
          <p className="text-neutral-400 text-sm mt-1">Создайте первое мероприятие или дождитесь приглашения.</p>
          <button onClick={openCreate} className="btn-accent inline-flex items-center gap-2 px-4 py-2.5 mt-5 rounded-xl text-sm font-medium">
            <Plus /> Создать мероприятие
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 text-sm">Ничего не найдено.</div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {visible.map((event) => {
              const past = event.status === 'Завершено' || isPast(event);
              const end = eventEnd(event);
              const sameDay = end && new Date(event.date + 'T00:00:00').toDateString() === end.toDateString();
              const endLabel = event.duration_minutes && end && sameDay ? fmtClock(end) : null;
              return (
                <motion.article
                  key={event.id} layout
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ x: -3, y: -3 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className={`group bg-white border rounded-2xl p-5 shadow-soft transition-[box-shadow,border-color] duration-200 flex flex-col ${past ? 'border-neutral-200 opacity-80 hover:border-neutral-400 hover:[box-shadow:6px_6px_0_#a3a3a3]' : 'border-neutral-200 hover:border-neutral-900 hover:[box-shadow:7px_7px_0_#0a0a0a]'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge ev={event} />
                    {event.is_owner ? (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        {event.status !== 'Завершено' && (
                          <button onClick={() => markPassed(event)} title="Отметить прошедшим" className="grid place-items-center w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"><CheckCircle width={15} height={15} /></button>
                        )}
                        <button onClick={() => openEdit(event)} title="Редактировать" className="grid place-items-center w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"><Edit width={15} height={15} /></button>
                        <button onClick={() => remove(event.id)} title="Удалить" className="grid place-items-center w-7 h-7 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50"><Trash width={15} height={15} /></button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full">участник</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[15px] leading-snug mb-1.5 break-words">{event.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">{event.description || 'Без описания'}</p>

                  <div className="mt-3 space-y-1.5 text-sm text-neutral-500">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CalendarIcon width={14} height={14} /> {event.date}
                      {event.time && (
                        <span className="inline-flex items-center gap-1 ml-2 text-neutral-400">
                          <Clock width={13} height={13} /> {event.time}{endLabel ? `–${endLabel}` : ''}
                        </span>
                      )}
                      {event.duration_minutes ? (
                        <span className="text-neutral-400">· {formatDuration(event.duration_minutes)}</span>
                      ) : null}
                    </div>
                    {event.location && <div className="flex items-center gap-1.5"><MapPin width={14} height={14} /> <span className="truncate">{event.location}</span></div>}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-neutral-500 text-sm"><Users width={14} height={14} /> {event.participants_count}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setChatEvent(event)} className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"><Chat width={15} height={15} /> Чат</button>
                      {event.is_owner ? (
                        <button onClick={() => openManage(event)} className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"><Users width={15} height={15} /> Пригласить</button>
                      ) : (
                        <button onClick={() => leave(event.id)} className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-red-600"><LogoutDoor width={15} height={15} /> Покинуть</button>
                      )}
                    </div>
                  </div>
                  {!event.is_owner && event.owner_username && (
                    <p className="mt-2 text-xs text-neutral-400 truncate">владелец: @{event.owner_username}</p>
                  )}
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Редактировать мероприятие' : 'Новое мероприятие'}>
        <form onSubmit={saveEvent} className="space-y-4">
          <label className="block"><span className="block text-sm font-medium text-neutral-700 mb-1.5">Название</span>
            <input className={inputCls} value={form.title} onChange={setF('title')} required placeholder="Например, отчётное собрание" /></label>

          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-1.5">Дата</span>
            <Calendar value={form.date} onChange={(d) => setForm((p) => ({ ...p, date: d }))} />
          </div>

          <div className="block"><span className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5"><Clock width={14} height={14} /> Время</span>
            <TimePicker value={form.time} onChange={(t) => setForm((p) => ({ ...p, time: t }))} /></div>
          <div className="block">
            <span className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5"><Clock width={14} height={14} /> Длительность</span>
            <DurationPicker value={form.duration} onChange={(d) => setForm((p) => ({ ...p, duration: d }))} />
            <p className="text-[11px] text-neutral-400 mt-1.5">Учитывается вместе со временем: по окончании мероприятие автоматически перейдёт в «Прошедшие».</p>
          </div>
          <div className="block"><span className="block text-sm font-medium text-neutral-700 mb-1.5">Статус</span>
            <StatusPicker value={form.status} onChange={(s) => setForm((p) => ({ ...p, status: s }))} /></div>

          <label className="block"><span className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5"><MapPin width={14} height={14} /> Место</span>
            <input className={inputCls} value={form.location} onChange={setF('location')} placeholder="Адрес, зал или ссылка (необязательно)" /></label>
          <label className="block"><span className="block text-sm font-medium text-neutral-700 mb-1.5">Описание</span>
            <textarea className={inputCls} rows="3" value={form.description} onChange={setF('description')} placeholder="Необязательно" /></label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50">Отмена</button>
            <button type="submit" className="btn-accent inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium">
              <Check width={15} height={15} /> {editing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!manage} onClose={() => setManage(null)} title={`Участники · ${manage?.title || ''}`}>
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-1.5">Пригласить по @username, имени или email</span>
            <input className={inputCls} value={pQuery} onChange={(e) => search(e.target.value)} placeholder="начните вводить…" autoFocus />
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
                  {results.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-3 py-2">
                      <Avatar user={u} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{u.full_name || `@${u.username}`}</p>
                        <p className="text-xs text-neutral-400 truncate">@{u.username}</p>
                      </div>
                      <button onClick={() => invite(`@${u.username}`)} className="btn-accent text-xs font-medium px-3 py-1.5 rounded-lg">Пригласить</button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-2">Уже приглашены ({participants.length})</p>
            {participants.length === 0 ? (
              <p className="text-sm text-neutral-400">Пока никого. Найдите коллегу выше.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto thin-scroll">
                {participants.map((p) => (
                  <div key={p.user.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
                    <Avatar user={p.user} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.user.full_name || `@${p.user.username}`}</p>
                      <p className="text-xs text-neutral-400 truncate">@{p.user.username}</p>
                    </div>
                    <ParticipantPill status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <EventChatModal event={chatEvent} currentUser={user} onClose={() => setChatEvent(null)} addToast={addToast} />
    </div>
  );
}

function ParticipantPill({ status }) {
  const map = {
    accepted: ['Принял', 'bg-neutral-100 text-neutral-700'],
    invited: ['Приглашён', 'bg-neutral-100 text-neutral-700'],
    declined: ['Отклонил', 'bg-neutral-100 text-neutral-500'],
  };
  const [label, cls] = map[status] || [status, 'bg-neutral-100 text-neutral-500'];
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${cls}`}>{status === 'accepted' && <Check width={11} height={11} />}{label}</span>;
}
