import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Chat, Close, Send } from '../lib/icons';

export default function ChatWidget({ open, setOpen }) {
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Здравствуйте! Я ассистент EventlyAI. Чем помочь?' },
  ]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;
    const updated = [...messages, { id: Date.now(), sender: 'user', text }];
    setMessages(updated); setInput(''); setTyping(true);
    const history = updated.slice(-20).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
    try {
      const { reply } = await api.chat(history);
      setMessages((p) => [...p, { id: Date.now() + 1, sender: 'bot', text: reply }]);
    } catch (err) {
      setMessages((p) => [...p, { id: Date.now() + 1, sender: 'bot', text: err.message || 'Нет связи с сервером.', isError: true }]);
    } finally { setTyping(false); }
  };

  return (
    <div className="fixed right-4 bottom-20 md:bottom-5 md:right-5 z-40 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="bg-white w-[22rem] sm:w-96 max-w-[calc(100vw-2rem)] h-[30rem] max-h-[calc(100vh-6rem)] rounded-2xl border border-neutral-200 shadow-2xl mb-3 flex flex-col overflow-hidden"
          >
            <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="leading-tight"><p className="text-sm font-medium">Поддержка</p><p className="text-[11px] text-neutral-400">ИИ-ассистент онлайн</p></div>
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white transition"><Close /></button>
            </div>
            <div className="flex-1 px-4 py-4 overflow-y-auto bg-neutral-50 flex flex-col gap-2.5 thin-scroll">
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    m.sender === 'user' ? 'self-end bg-neutral-900 text-white rounded-br-sm'
                    : m.isError ? 'self-start bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                    : 'self-start bg-white text-neutral-800 border border-neutral-200 rounded-bl-sm'}`}>
                  {m.text}
                </motion.div>
              ))}
              {typing && (
                <div className="self-start bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  <span className="typing-dot w-1.5 h-1.5 bg-neutral-400 rounded-full inline-block" />
                  <span className="typing-dot w-1.5 h-1.5 bg-neutral-400 rounded-full inline-block" />
                  <span className="typing-dot w-1.5 h-1.5 bg-neutral-400 rounded-full inline-block" />
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Сообщение…"
                className="flex-1 bg-neutral-100 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-neutral-300 transition" />
              <button type="submit" disabled={typing || !input.trim()} className="grid place-items-center w-10 h-10 bg-neutral-900 text-white rounded-lg disabled:opacity-40 hover:bg-neutral-800 transition"><Send /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileTap={{ scale: 0.92 }} onClick={() => setOpen(!open)}
        className="grid place-items-center w-12 h-12 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition">
        {open ? <Close /> : <Chat width={22} height={22} />}
      </motion.button>
    </div>
  );
}
