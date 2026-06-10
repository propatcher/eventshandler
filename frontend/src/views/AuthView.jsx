import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, setToken } from '../lib/api';
import { Logo, Shield, Calendar, Users, Bell } from '../lib/icons';
import BackgroundDecor from '../components/BackgroundDecor';
import { inputCls } from '../lib/ui';

const hintCls = 'text-[11px] text-neutral-400 mt-1';

export default function AuthView({ onAuthed }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let token;
      if (isLogin) {
        ({ access_token: token } = await api.login({ login: loginId.trim(), password }));
      } else {
        const body = { email: email.trim(), password, full_name: fullName.trim() || null };
        if (username.trim()) body.username = username.trim();
        ({ access_token: token } = await api.register(body));
      }
      setToken(token);
      await onAuthed();
    } catch (err) {
      setError(err.message || 'Не удалось выполнить вход');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-neutral-50 geo-grid isolate">
      <BackgroundDecor />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="relative w-full max-w-md lg:max-w-4xl"
      >
        <div className="lg:grid lg:grid-cols-[1.05fr_1fr] pop-frame overflow-hidden bg-white">
          <div className="hidden lg:flex relative flex-col justify-between bg-neutral-950 text-white p-10 overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.16]"
              style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <span aria-hidden="true" className="absolute -right-12 -top-12 w-44 h-44 border border-white/15 rotate-12" />
            <span aria-hidden="true" className="absolute right-16 top-24 w-16 h-16 border border-white/10 -rotate-6" />
            <span aria-hidden="true" className="absolute -left-10 bottom-24 w-36 h-36 border border-white/10 rotate-6" />
            <span aria-hidden="true" className="absolute left-24 bottom-10 w-3 h-3 bg-white/20" />

            <div className="relative z-10 flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 bg-white text-neutral-900"><Logo width={20} height={20} /></span>
              <span className="font-bold tracking-tight text-lg">Eventlys</span>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                Мероприятия.<br />Люди. Одно<br />пространство.
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mt-4 max-w-xs">
                Создавайте события, приглашайте участников и обсуждайте детали в чате — без лишнего.
              </p>
              <div className="mt-8 space-y-3.5">
                {[[Calendar, 'Дата, время и длительность — прошедшее уходит в архив само'],
                  [Users, 'Приглашения с подтверждением участия'],
                  [Bell, 'Уведомления и чат внутри каждого события']].map(([Ico, text]) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="grid place-items-center w-8 h-8 border border-white/20 shrink-0"><Ico width={15} height={15} /></span>
                    <span className="text-sm text-neutral-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="relative z-10 text-[11px] tracking-[0.2em] text-neutral-500">EVENTLYS · 2026</p>
          </div>

          <div className="bg-white p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <motion.span
              initial={{ rotate: -8, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260 }}
              className="grid place-items-center w-14 h-14 rounded-2xl bg-accent text-white shadow-sm mb-4"
            >
              <Logo width={26} height={26} />
            </motion.span>
            <h1 className="text-2xl font-bold tracking-tight">
              {isLogin ? 'С возвращением' : 'Создание аккаунта'}
            </h1>
            <p className="text-neutral-500 text-sm mt-1.5">
              {isLogin ? 'Войдите по email или имени пользователя' : 'Зарегистрируйтесь в платформе мероприятий'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isLogin ? (
              <label className="block">
                <span className="block text-sm font-medium text-neutral-700 mb-1.5">Email или имя пользователя</span>
                <input type="text" required value={loginId} onChange={(e) => setLoginId(e.target.value)} className={inputCls} placeholder="you@example.com или @username" autoComplete="username" />
              </label>
            ) : (
              <>
                <label className="block">
                  <span className="block text-sm font-medium text-neutral-700 mb-1.5">ФИО или организация</span>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Иван Борисов" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-neutral-700 mb-1.5">Email</span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-neutral-700 mb-1.5">Имя пользователя</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">@</span>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputCls} pl-7`} placeholder="username (необязательно)" autoComplete="off" />
                  </div>
                  <p className={hintCls}>3–30 символов: латинские буквы, цифры и _. Оставьте пустым — создадим автоматически.</p>
                </label>
              </>
            )}

            <label className="block">
              <span className="block text-sm font-medium text-neutral-700 mb-1.5">Пароль</span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} />
              {!isLogin && <p className={hintCls}>Минимум 8 символов, хотя бы одна буква и одна цифра.</p>}
            </label>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="btn-accent w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition">
              {loading ? 'Подождите…' : isLogin ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-neutral-900 font-semibold underline underline-offset-4 hover:no-underline">
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-neutral-100 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Shield width={13} height={13} /> Защищённый вход · данные шифруются
          </div>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6 tracking-wide">EVENTLYS · ПЛАТФОРМА УПРАВЛЕНИЯ МЕРОПРИЯТИЯМИ</p>
      </motion.div>
    </div>
  );
}
