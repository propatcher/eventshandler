import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api, getToken, setToken } from './lib/api';
import { Logo, Grid, Bell, User as UserIcon, Shield, Logout } from './lib/icons';
import Avatar from './components/Avatar';
import Toasts from './components/Toasts';
import ChatWidget from './components/ChatWidget';
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

  const addToast = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, type: 'default', ...t }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  }, []);

  const refreshUnread = useCallback(async () => {
    try { const { count } = await api.unreadCount(); setUnread(count); }
    catch { /* ignore */ }
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

  // Сессия истекла (401 на защищённом запросе) — мягко возвращаем на вход.
  useEffect(() => {
    const onExpired = () => { setUser(null); setView('dashboard'); setUnread(0); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // Автооткрытие чата поддержки после ~2 минут бездействия (один раз).
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

  const Badge = ({ item, size }) => (
    <span className="relative">
      <item.icon width={size} height={size} />
      {item.badge > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </span>
  );

  const NavButton = ({ item }) => {
    const active = view === item.key;
    return (
      <button onClick={() => go(item.key)}
        className={`relative flex items-center gap-3 rounded-lg transition px-3 py-2.5 text-sm w-full ${active ? 'bg-accent text-white shadow-lg shadow-indigo-500/30' : 'text-neutral-600 hover:bg-neutral-100'}`}>
        <Badge item={item} size={18} />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  const TabButton = ({ item }) => {
    const active = view === item.key;
    return (
      <button onClick={() => go(item.key)}
        className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${active ? 'text-indigo-600' : 'text-neutral-400'}`}>
        {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />}
        <Badge item={item} size={22} />
        {item.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-100 text-neutral-900 overflow-x-hidden">
      {/* декоративные акцентные пятна на фоне */}
      <div className="pointer-events-none fixed -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-indigo-300/20 blur-3xl blob" />
      <div className="pointer-events-none fixed top-1/3 -right-28 w-[30rem] h-[30rem] rounded-full bg-violet-300/20 blur-3xl blob" style={{ animationDelay: '-8s' }} />

      {/* SIDEBAR (desktop) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-white/75 backdrop-blur-xl border-r border-neutral-200/70 flex-col p-4 z-30">
        <button onClick={() => go('dashboard')} title="На главную"
          className="flex items-center gap-2.5 px-2 py-2 mb-4 rounded-lg hover:bg-neutral-100 transition w-full">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent text-white shadow-lg shadow-indigo-500/30"><Logo width={17} height={17} /></span>
          <span className="font-semibold tracking-tight text-gradient">Evently</span>
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
        </div>
      </aside>

      {/* TOPBAR (mobile) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => go('dashboard')} title="На главную" className="flex items-center gap-2">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent text-white shadow-md shadow-indigo-500/30"><Logo width={15} height={15} /></span>
            <span className="font-semibold tracking-tight text-gradient">Evently</span>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => go('profile')} className="grid place-items-center"><Avatar user={user} size={30} /></button>
            <button onClick={logout} title="Выйти" className="grid place-items-center w-9 h-9 rounded-md text-neutral-500 hover:bg-neutral-100"><Logout width={17} height={17} /></button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
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

      {/* BOTTOM TAB BAR (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-neutral-200 flex pb-[env(safe-area-inset-bottom)]">
        {nav.map((item) => <TabButton key={item.key} item={item} />)}
      </nav>

      <ChatWidget open={chatOpen} setOpen={setChatOpen} />
      <Toasts toasts={toasts} />
    </div>
  );
}
