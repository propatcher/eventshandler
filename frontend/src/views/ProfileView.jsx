import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Shield, Mail, Check, Trash, Camera, Lock } from '../lib/icons';
import Avatar from '../components/Avatar';

const inputCls =
  'w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition';

// Уменьшаем и центрируем изображение в квадрат size×size → data-URL (JPEG).
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Section({ icon: Icon, title, desc, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-sm"
    >
      <div className="flex items-start gap-3 mb-5">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-neutral-100 text-neutral-600 shrink-0"><Icon width={17} height={17} /></span>
        <div>
          <h2 className="font-semibold text-neutral-900">{title}</h2>
          {desc && <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</span>
    {children}
  </label>
);

const SaveBtn = ({ icon: Icon = Check, disabled, loading, children }) => (
  <button type="submit" disabled={disabled}
    className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 transition">
    <Icon width={15} height={15} /> {loading ? 'Сохранение…' : children}
  </button>
);

export default function ProfileView({ user, onUpdated, addToast }) {
  const fileRef = useRef(null);

  const [fullName, setFullName] = useState(user.full_name || '');
  const [username, setUsername] = useState(user.username || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPwd, setEmailPwd] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const previewUser = { ...user, full_name: fullName, username, avatar: avatar || null };
  const profileDirty =
    fullName !== (user.full_name || '') ||
    username !== (user.username || '') ||
    avatar !== (user.avatar || '');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return addToast({ type: 'error', text: 'Выберите изображение' });
    if (file.size > 5 * 1024 * 1024) return addToast({ type: 'error', text: 'Файл больше 5 МБ' });
    try { setAvatar(await resizeImage(file)); }
    catch { addToast({ type: 'error', text: 'Не удалось обработать изображение' }); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const payload = {};
    if (fullName !== (user.full_name || '')) payload.full_name = fullName;
    if (username !== (user.username || '')) payload.username = username;
    if (avatar !== (user.avatar || '')) payload.avatar = avatar;
    if (Object.keys(payload).length === 0) return;
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile(payload);
      onUpdated(updated);
      addToast({ type: 'success', text: 'Профиль обновлён' });
    } catch (err) { addToast({ type: 'error', text: err.message }); }
    finally { setSavingProfile(false); }
  };

  const saveEmail = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    try {
      const updated = await api.changeEmail({ new_email: newEmail, current_password: emailPwd });
      onUpdated(updated);
      setNewEmail(''); setEmailPwd('');
      addToast({ type: 'success', text: 'Email изменён' });
    } catch (err) { addToast({ type: 'error', text: err.message }); }
    finally { setSavingEmail(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) return addToast({ type: 'error', text: 'Пароли не совпадают' });
    if (newPwd.length < 6) return addToast({ type: 'error', text: 'Минимум 6 символов' });
    setSavingPwd(true);
    try {
      await api.changePassword({ current_password: curPwd, new_password: newPwd });
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
      addToast({ type: 'success', text: 'Пароль изменён' });
    } catch (err) { addToast({ type: 'error', text: err.message }); }
    finally { setSavingPwd(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Личный кабинет</h1>
        <p className="text-neutral-500 text-sm mt-1">Управляйте профилем, аватаром и доступом к аккаунту</p>
      </div>

      <div className="space-y-5">
        {/* ===== HERO + ПРОФИЛЬ ===== */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <form onSubmit={saveProfile}>
            {/* баннер */}
            <div className="h-28 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 relative">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0, transparent 40%)' }} />
            </div>

            {/* аватар + идентификация (по центру) */}
            <div className="px-6 pb-6 -mt-14 flex flex-col items-center text-center">
              <div className="relative">
                <button type="button" onClick={() => fileRef.current?.click()} title="Сменить фото"
                  className="block rounded-full ring-4 ring-white shadow-md group relative overflow-hidden">
                  <Avatar user={previewUser} size={104} />
                  <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center text-white">
                    <Camera width={22} height={22} />
                  </span>
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} title="Сменить фото"
                  className="absolute bottom-1 right-1 grid place-items-center w-8 h-8 rounded-full bg-neutral-900 text-white ring-2 ring-white shadow">
                  <Camera width={14} height={14} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{fullName || `@${username}`}</h2>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Shield width={12} height={12} /> Админ
                  </span>
                )}
              </div>
              <p className="text-neutral-500 text-sm">@{username}</p>
              <p className="text-neutral-400 text-sm mt-0.5 inline-flex items-center gap-1.5"><Mail width={13} height={13} /> {user.email}</p>

              {avatar && (
                <button type="button" onClick={() => setAvatar('')} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline underline-offset-4">
                  <Trash width={12} height={12} /> Удалить фото
                </button>
              )}
            </div>

            {/* поля профиля */}
            <div className="border-t border-neutral-100 px-6 sm:px-7 py-6 space-y-4">
              <Field label="Отображаемое имя">
                <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ваше имя" />
              </Field>
              <Field label="@username">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">@</span>
                  <input className={`${inputCls} pl-7`} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                </div>
              </Field>
              <div className="flex justify-end pt-1">
                <SaveBtn disabled={!profileDirty || savingProfile} loading={savingProfile}>Сохранить профиль</SaveBtn>
              </div>
            </div>
          </form>
        </motion.section>

        {/* ===== EMAIL ===== */}
        <Section icon={Mail} title="Email" desc={`Текущий: ${user.email}`}>
          <form onSubmit={saveEmail} className="space-y-4">
            <Field label="Новый email">
              <input type="email" required className={inputCls} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" />
            </Field>
            <Field label="Текущий пароль">
              <input type="password" required className={inputCls} value={emailPwd} onChange={(e) => setEmailPwd(e.target.value)} placeholder="для подтверждения" />
            </Field>
            <div className="flex justify-end">
              <SaveBtn icon={Mail} disabled={savingEmail} loading={savingEmail}>Изменить email</SaveBtn>
            </div>
          </form>
        </Section>

        {/* ===== ПАРОЛЬ ===== */}
        <Section icon={Lock} title="Пароль" desc="Смена пароля. Потребуется текущий пароль.">
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Текущий пароль">
              <input type="password" required className={inputCls} value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Новый пароль">
                <input type="password" required className={inputCls} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="мин. 6 символов" />
              </Field>
              <Field label="Повторите">
                <input type="password" required className={inputCls} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
              </Field>
            </div>
            <div className="flex justify-end">
              <SaveBtn icon={Lock} disabled={savingPwd} loading={savingPwd}>Изменить пароль</SaveBtn>
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}
