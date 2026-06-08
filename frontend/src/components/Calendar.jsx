import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from '../lib/icons';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const same = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function Calendar({ value, onChange }) {
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(selected || new Date());
  const [dir, setDir] = useState(0);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const move = (delta) => { setDir(delta); setCursor(new Date(year, month + delta, 1)); };

  return (
    <div className="border border-neutral-200 rounded-xl p-3 bg-white select-none">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => move(-1)} className="grid place-items-center w-8 h-8 rounded-md hover:bg-neutral-100 text-neutral-500"><ChevronLeft width={16} height={16} /></button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button type="button" onClick={() => move(1)} className="grid place-items-center w-8 h-8 rounded-md hover:bg-neutral-100 text-neutral-500"><ChevronRight width={16} height={16} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {WD.map((w) => <div key={w} className="text-center text-[11px] text-neutral-400 font-medium py-1">{w}</div>)}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: dir * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -16 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-7 gap-1"
        >
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const isSel = same(d, selected);
            const isToday = same(d, today);
            return (
              <button key={fmt(d)} type="button" onClick={() => onChange(fmt(d))}
                className={`h-9 rounded-lg text-sm transition ${
                  isSel ? 'bg-accent text-white font-semibold'
                  : isToday ? 'bg-neutral-100 text-neutral-900 font-semibold ring-1 ring-neutral-300'
                  : 'text-neutral-700 hover:bg-neutral-100'}`}>
                {d.getDate()}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
