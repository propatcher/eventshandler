import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from '../lib/icons';

function PaletteCard({ onClose, actions }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    return actions.filter((a) => `${a.label} ${a.hint || ''}`.toLowerCase().includes(s));
  }, [q, actions]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const run = (a) => { onClose(); a.run(); };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[idx]) run(items[idx]); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-lg bg-white border-2 border-neutral-900 [box-shadow:8px_8px_0_#0a0a0a] overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-4 border-b border-neutral-200">
        <span className="text-neutral-400"><Search width={16} height={16} /></span>
        <input
          ref={inputRef} value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={onKey}
          placeholder="Раздел или команда…"
          className="flex-1 py-3.5 text-sm outline-none placeholder:text-neutral-400 bg-transparent"
        />
        <kbd className="kbd">Esc</kbd>
      </div>
      <div className="max-h-72 overflow-y-auto thin-scroll py-1.5">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-400 text-center">Ничего не найдено</p>
        ) : items.map((a, i) => (
          <button
            key={a.id} onMouseEnter={() => setIdx(i)} onClick={() => run(a)}
            className={`no-zoom w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition ${i === idx ? 'bg-neutral-900 text-white' : 'text-neutral-700'}`}
          >
            {a.icon && <a.icon width={15} height={15} />}
            <span className="flex-1 font-medium">{a.label}</span>
            {a.hint && <span className={`text-[11px] ${i === idx ? 'text-neutral-300' : 'text-neutral-400'}`}>{a.hint}</span>}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 py-2 border-t border-neutral-200 text-[11px] text-neutral-400">
        <span className="inline-flex items-center gap-1"><kbd className="kbd">↑↓</kbd> навигация</span>
        <span className="inline-flex items-center gap-1"><kbd className="kbd">Enter</kbd> выбрать</span>
      </div>
    </motion.div>
  );
}

export default function CommandPalette({ open, onClose, actions }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[16vh] px-4 bg-neutral-900/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <PaletteCard onClose={onClose} actions={actions} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
