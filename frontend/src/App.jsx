import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api, getToken, setToken } from './lib/api';
import { Logo, Grid, Bell, User as UserIcon, Shield, Logout, Search, Plus, Chat } from './lib/icons';
import Avatar from './components/Avatar';
import Toasts from './components/Toasts';
import ChatWidget from './components/ChatWidget';
import CommandPalette from './components/CommandPalette';
import BackgroundDecor from './components/BackgroundDecor';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import NotificationsView from './views/NotificationsView';
import ProfileView from './views/ProfileView';
import AdminView from './views/AdminView';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState('dashboard');
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const addToast = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, type: 'default', ...t }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  }, []);

  const refreshUnread = useCallback(async () => {
    try { const { count } = await api.unreadCount(); setUnread(count); }
    catch {}
  }, []);

  const loadUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    setView('dashboard');
    refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try { await loadUser(); } catch { setToken(null); }
      }
      setBooting(false);
    })();
  }, [loadUser]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(refreshUnread, 25000);
    return () => clearInterval(t);
  }, [user, refreshUnread]);

  useEffect(() => {
    const onExpired = () => { setUser(null); setView('dashboard'); setUnread(0); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  useEffect(() => {
    if (!user) return;
    let timer;
    let opened = false;
    const IDLE_MS = 120000;
    const arm = () => {
      clearTimeout(timer);
      if (opened) return;
      timer = setTimeout(() => { opened = true; setChatOpen(true); }, IDLE_MS);
    };
    const evs = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => { clearTimeout(timer); evs.forEach((e) => window.removeEventListener(e, arm)); };
  }, [user]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['k', 'K', 'л', 'Л'].includes(e.key)) {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Нижнее меню «прилипает» к нижней грани видимой области при зуме на телефоне
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const nav = document.getElementById('mobile-tabbar');
      if (!nav) return;
      const offset = window.innerHeight - (vv.height + vv.offsetTop);
      nav.style.transform = offset > 1 ? `translateY(${-offset}px)` : '';
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
    };
  }, []);

  const logout = () => { setToken(null); setUser(null); setView('dashboard'); setUnread(0); };

  if (booting) {
    return <div className="min-h-screen grid place-items-center bg-neutral-50 text-neutral-400 text-sm">Загрузка…</div>;
  }
  if (!user) return <AuthView onAuthed={loadUser} />;

  const nav = [
    { key: 'dashboard', label: 'Мероприятия', icon: Grid },
    { key: 'notifications', label: 'Уведомления', icon: Bell, badge: unread },
    { key: 'profile', label: 'Кабинет', icon: UserIcon },
    ...(user.role === 'admin' ? [{ key: 'admin', label: 'Админка', icon: Shield }] : []),
  ];

  const go = (key) => { setView(key); if (key === 'notifications') setTimeout(refreshUnread, 400); };

  const cmdActions = [
    ...nav.map((n) => ({ id: n.key, label: n.label, hint: 'Раздел', icon: n.icon, run: () => go(n.key) })),
    {
      id: 'new-event', label: 'Новое мероприятие', hint: 'Действие', icon: Plus,
      run: () => { go('dashboard'); setTimeout(() => window.dispatchEvent(new Event('eventlys:new-event')), 80); },
    },
    { id: 'assistant', label: 'Открыть ассистента', hint: 'Действие', icon: Chat, run: () => setChatOpen(true) },
    { id: 'logout', label: 'Выйти из аккаунта', hint: 'Аккаунт', icon: Logout, run: logout },
  ];

  const Badge = ({ item, size }) => (
    <span className="relative">
      <item.icon width={size} height={size} />
      {item.badge > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-neutral-900 text-white text-[10px] font-bold grid place-items-center ring-2 ring-white">
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </span>
  );

  const NavButton = ({ item }) => {
    const active = view === item.key;
    return (
      <button onClick={() => go(item.key)}
        className={`no-zoom flex items-center gap-3 transition-colors duration-150 px-3 py-2.5 text-sm w-full ${active ? 'bg-accent text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
        <Badge item={item} size={18} />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  const TabButton = ({ item }) => {
    const active = view === item.key;
    return (
      <button onClick={() => go(item.key)}
        className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition ${active ? 'text-neutral-900 font-semibold' : 'text-neutral-400 font-medium'}`}>
        {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />}
        <Badge item={item} size={22} />
        {item.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 geo-grid isolate text-neutral-900 overflow-x-hidden">
      <BackgroundDecor />

      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-white/75 backdrop-blur-xl border-r border-neutral-200/70 flex-col p-4 z-30">
        <button onClick={() => go('dashboard')} title="На главную"
          className="flex items-center gap-2.5 px-2 py-2 mb-4 rounded-lg hover:bg-neutral-100 transition w-full">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent text-white shadow-sm"><Logo width={17} height={17} /></span>
          <span className="font-semibold tracking-tight">Eventlys</span>
        </button>
        <button onClick={() => setCmdOpen(true)}
          className="no-zoom flex items-center gap-2 w-full px-3 py-2 mb-3 border border-neutral-200 bg-white/70 text-sm text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors">
          <Search width={14} height={14} />
          <span className="flex-1 text-left">Команды</span>
          <span className="flex gap-0.5"><kbd className="kbd">Ctrl</kbd><kbd className="kbd">K</kbd></span>
        </button>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((item) => <NavButton key={item.key} item={item} />)}
        </nav>
        <div className="border-t border-neutral-100 pt-3 mt-3">
          <button onClick={() => go('profile')} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 transition">
            <Avatar user={user} size={36} />
            <div className="min-w-0 text-left flex-1">
              <p className="text-sm font-medium truncate">{user.full_name || `@${user.username}`}</p>
              <p className="text-xs text-neutral-400 truncate">@{user.username}</p>
            </div>
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-neutral-500 hover:text-red-600 hover:bg-red-50 transition">
            <Logout width={16} height={16} /> Выйти
          </button>
          <p className="px-3 pt-3 text-[9px] font-medium tracking-[0.28em] text-neutral-300 uppercase select-none">Eventlys · 2026</p>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => go('dashboard')} title="На главную" className="flex items-center gap-2">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent text-white shadow-sm"><Logo width={15} height={15} /></span>
            <span className="font-semibold tracking-tight">Eventlys</span>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => go('profile')} className="grid place-items-center"><Avatar user={user} size={30} /></button>
            <button onClick={logout} title="Выйти" className="grid place-items-center w-9 h-9 rounded-md text-neutral-500 hover:bg-neutral-100"><Logout width={17} height={17} /></button>
          </div>
        </div>
      </header>

      <main className="md:ml-60 px-4 sm:px-8 pt-6 sm:pt-8 pb-28 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div key={view}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}>
            {view === 'dashboard' && <DashboardView addToast={addToast} user={user} />}
            {view === 'notifications' && <NotificationsView addToast={addToast} onChanged={refreshUnread} />}
            {view === 'profile' && <ProfileView user={user} onUpdated={setUser} addToast={addToast} />}
            {view === 'admin' && user.role === 'admin' && <AdminView addToast={addToast} />}
          </motion.div>
        </div>
      </main>

      <nav id="mobile-tabbar" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-neutral-200 flex pb-[env(safe-area-inset-bottom)]">
        {nav.map((item) => <TabButton key={item.key} item={item} />)}
      </nav>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} actions={cmdActions} />
      <ChatWidget open={chatOpen} setOpen={setChatOpen} />
      <Toasts toasts={toasts} />
    </div>
  );
}
