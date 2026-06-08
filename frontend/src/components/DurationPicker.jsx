const PRESETS = [
  [null, 'Без'],
  [30, '30 мин'],
  [60, '1 ч'],
  [90, '1.5 ч'],
  [120, '2 ч'],
  [180, '3 ч'],
];

export default function DurationPicker({ value, onChange }) {
  const minutes = value === '' || value == null ? null : Number(value);

  const setCustom = (e) => {
    const raw = e.target.value;
    if (raw === '') return onChange('');
    const n = Math.max(0, Math.min(43200, parseInt(raw, 10) || 0));
    onChange(n === 0 ? '' : n);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(([val, label]) => {
          const active = val === null ? minutes == null : minutes === val;
          return (
            <button
              key={label} type="button" onClick={() => onChange(val ?? '')}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition border ${
                active
                  ? 'bg-accent text-white border-transparent shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span>или вручную:</span>
        <input
          type="number" min="0" max="43200" inputMode="numeric"
          value={minutes ?? ''} onChange={setCustom} placeholder="0"
          className="w-24 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/15 transition"
        />
        <span>мин</span>
      </div>
    </div>
  );
}
