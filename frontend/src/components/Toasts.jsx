import { motion, AnimatePresence } from 'framer-motion';

export default function Toasts({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={`rounded-xl px-4 py-3 shadow-lg border text-sm ${
              t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-white border-neutral-200 text-neutral-800'
            }`}
          >
            {t.title && <p className="font-semibold mb-0.5">{t.title}</p>}
            <p>{t.text}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
