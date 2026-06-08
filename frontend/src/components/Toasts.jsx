import { motion, AnimatePresence } from 'framer-motion';
import { Check, Close, Bell } from '../lib/icons';

const STYLES = {
  error:   { wrap: 'border-red-200',     ico: 'bg-red-50 text-red-600',         Icon: Close },
  success: { wrap: 'border-neutral-300', ico: 'bg-neutral-100 text-neutral-700', Icon: Check },
  default: { wrap: 'border-neutral-200', ico: 'bg-neutral-100 text-neutral-900',   Icon: Bell },
};

export default function Toasts({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.default;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-soft-lg border bg-white/95 backdrop-blur-xl ${s.wrap}`}
            >
              <span className={`grid place-items-center w-7 h-7 rounded-full shrink-0 ${s.ico}`}>
                <s.Icon width={15} height={15} />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                {t.title && <p className="font-semibold text-neutral-900 mb-0.5">{t.title}</p>}
                <p className="text-neutral-600 leading-snug">{t.text}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
