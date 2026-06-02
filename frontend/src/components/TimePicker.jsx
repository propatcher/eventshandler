import { useState } from 'react';
import { Clock } from '../lib/icons';

const pad = (n) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINS = Array.from({ length: 12 }, (_, i) => pad(i * 5));

export default function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [h = '', m = ''] = value ? value.split(':') : [];

  const pickH = (nh) => onChange(`${nh}:${m || '00'}`);
  const pickM = (nm) => { onChange(`${h || '00'}:${nm}`); setOpen(false); };

  const cell = (active) =>
    `w-full text-center py-1.5 text-sm rounded-md transition ${active ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-700 hover:bg-neutral-100'}`;

  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden">
      <button
        type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 h-[42px]"
      >
        <Clock width={15} height={15} className="text-neutral-400 shrink-0" />
        <span className={`text-sm ${value ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
          {value || 'Выберите время'}
        </span>
        {value && (
          <span
            role="button" tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
            className="text-neutral-300 hover:text-neutral-600 text-xs ml-1"
            title="Очистить"
          >✕</span>
        )}
        <span className={`ml-auto text-neutral-400 text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="grid grid-cols-2 border-t border-neutral-200">
          <div className="border-r border-neutral-100">
            <p className="text-[10px] uppercase tracking-wide text-neutral-400 text-center py-1 bg-neutral-50">Часы</p>
            <div className="max-h-36 overflow-y-auto thin-scroll p-1 space-y-0.5">
              {HOURS.map((x) => (
                <button key={x} type="button" onClick={() => pickH(x)} className={cell(x === h)}>{x}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-neutral-400 text-center py-1 bg-neutral-50">Минуты</p>
            <div className="max-h-36 overflow-y-auto thin-scroll p-1 space-y-0.5">
              {MINS.map((x) => (
                <button key={x} type="button" onClick={() => pickM(x)} className={cell(x === m)}>{x}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
