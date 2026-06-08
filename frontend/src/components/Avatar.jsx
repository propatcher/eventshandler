const PALETTE = [
  ['#171717'], ['#262626'], ['#404040'], ['#525252'],
  ['#0a0a0a'], ['#373737'], ['#4b4b4b'], ['#2e2e2e'],
];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initialsOf(user) {
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
  const [c1] = PALETTE[hash(key) % PALETTE.length];
  return (
    <span
      className={`inline-grid place-items-center rounded-full text-white font-semibold select-none ${className}`}
      style={{
        width: size, height: size,
        fontSize: size * 0.4,
        background: c1,
      }}
      title={title}
    >
      {initialsOf(user)}
    </span>
  );
}
