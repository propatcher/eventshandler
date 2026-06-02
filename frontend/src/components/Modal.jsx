import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '../lib/icons';

export default function Modal({ open, onClose, title, children, width = 'max-w-md' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-white rounded-2xl w-full ${width} p-6 shadow-2xl max-h-[90vh] overflow-y-auto thin-scroll`}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
              <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition">
                <Close />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
