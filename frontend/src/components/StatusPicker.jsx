const OPTS = [
  ['Планируется', 'bg-amber-500'],
  ['Активно', 'bg-emerald-500'],
  ['Завершено', 'bg-neutral-400'],
];

export default function StatusPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 rounded-lg p-1">
      {OPTS.map(([label, dot]) => {
        const active = value === label;
        return (
          <button
            key={label} type="button" onClick={() => onChange(label)}
            className={`flex items-center justify-center gap-1.5 px-1.5 py-2 rounded-md text-[13px] font-medium transition ${
              active ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
