import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToasterContext = createContext(null);

export const ToasterProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback(({ message, type = 'info', duration = 4000, actionLabel, onAction }) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const toast = { id, message, type, actionLabel, onAction };
    setToasts((t) => [toast, ...t]);

    const timer = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);

    return { id, clear: () => { clearTimeout(timer); setToasts((t) => t.filter((x) => x.id !== id)); } };
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <ToasterContext.Provider value={{ show, remove }}>
      {children}

      {/* Toast UI */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-60 space-y-2 w-full max-w-xl px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`pointer-events-auto rounded-lg p-3 shadow-lg flex items-center justify-between ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}
            >
              <div className="flex-1 text-sm pr-3">{t.message}</div>
              {t.actionLabel && (
                <button
                  onClick={() => {
                    try { t.onAction && t.onAction(); } catch (e) { console.error(e); }
                    remove(t.id);
                  }}
                  className="ml-2 text-sm underline"
                >{t.actionLabel}</button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToasterContext.Provider>
  );
};

export const useToaster = () => {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error('useToaster must be used within ToasterProvider');
  return ctx;
};
