// Детерминированный цвет аватара по строке (username/email).
const PALETTE = [
  ['#4f46e5', '#7c3aed'], ['#0ea5e9', '#2563eb'], ['#059669', '#0d9488'],
  ['#d97706', '#ea580c'], ['#db2777', '#e11d48'], ['#7c3aed', '#a21caf'],
  ['#0891b2', '#0e7490'], ['#65a30d', '#16a34a'],
];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initialsOf(user) {
  if (user?.full_name) {
    return user.full_name.split(' ').filter(Boolean).slice(0, 2)
      .map((w) => w[0].toUpperCase()).join('');
  }
  return (user?.username?.[0] || user?.email?.[0] || '?').toUpperCase();
}

export default function Avatar({ user, size = 36, className = '' }) {
  const title = user?.username ? `@${user.username}` : undefined;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={title || 'avatar'}
        title={title}
        className={`rounded-full object-cover select-none ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const key = user?.username || user?.email || '?';
  const [c1, c2] = PALETTE[hash(key) % PALETTE.length];
  return (
    <span
      className={`inline-grid place-items-center rounded-full text-white font-semibold select-none ${className}`}
      style={{
        width: size, height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
      title={title}
    >
      {initialsOf(user)}
    </span>
  );
}
